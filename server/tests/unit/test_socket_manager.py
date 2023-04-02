import asyncio
from datetime import datetime
from typing import Any, Callable

import pytest
from fastapi import WebSocket
from freezegun import freeze_time
from mockito import mock, when

from api.models import MessageIn, MessageOut
from database.database import DatabaseManager
from database.models import User
from socket_manager import SocketManager


@pytest.fixture
def source_user() -> User:
    return User(public_key="public_key1", host="source_host")


@pytest.fixture
def target_user() -> User:
    return User(public_key="public_key2", host="target_host")


@pytest.fixture
def websocket_connection() -> WebSocket:
    return mock(WebSocket)


@pytest.fixture
def db_manager() -> DatabaseManager:
    return mock(DatabaseManager)


@pytest.fixture
def socket_manager(
    db_manager: DatabaseManager, websocket_connection: WebSocket
) -> SocketManager:
    return SocketManager(db_manager)


@pytest.fixture
def message() -> MessageIn:
    return MessageIn(
        source_public_key="public_key",
        target_public_key="target_public_key",
        message=[1, 2, 3],
        sent_date=datetime.now(),
    )


@pytest.mark.asyncio
async def test_socket_manager_accepts_connection_from_user(
    source_user: User,
    websocket_connection: WebSocket,
    socket_manager: SocketManager,
    awaited_return: Callable[[Any], asyncio.Future],
) -> None:
    expected = [{"websocket": websocket_connection, "user": source_user}]
    when(websocket_connection).accept().thenReturn(awaited_return(None))
    await socket_manager.connect(websocket_connection, source_user)
    assert socket_manager.active_connections == expected


def test_socket_manager_disconnect_removes_connection_from_active_connections(
    source_user, websocket_connection: WebSocket, socket_manager: SocketManager
) -> None:
    expected = []
    socket_manager.active_connections = [
        {"websocket": websocket_connection, "user": source_user}
    ]
    socket_manager.disconnect(websocket_connection, source_user)
    assert socket_manager.active_connections == expected


@pytest.mark.asyncio
@freeze_time("2021-03-01T12:00:00")
async def test_socket_manager_forwards_message_to_target_user(
    source_user,
    websocket_connection: WebSocket,
    socket_manager: SocketManager,
    message: MessageIn,
    db_manager: DatabaseManager,
    awaited_return: Callable[[Any], asyncio.Future],
) -> None:
    socket_manager.active_connections = [
        {"websocket": websocket_connection, "user": source_user},
        {"websocket": websocket_connection, "user": target_user},
    ]
    when(db_manager).get_user_by_public_key(message.target_public_key).thenReturn(
        source_user
    )

    expected = MessageOut(
        source_public_key=message.source_public_key,
        target_public_key=message.target_public_key,
        message=message.message,
        sent_date=datetime.now(),
    )
    when(websocket_connection).send_json(expected.json()).thenReturn(
        awaited_return(None)
    )

    await socket_manager.forward_message(websocket_connection, message)


@pytest.mark.asyncio
async def test_socket_manager_closes_connection_on_forward_message_if_target_user_not_found(
    source_user: User,
    websocket_connection: WebSocket,
    socket_manager: SocketManager,
    message: MessageIn,
    db_manager: DatabaseManager,
    awaited_return: Callable[[Any], asyncio.Future],
) -> None:
    socket_manager.active_connections = [
        {"websocket": websocket_connection, "user": source_user},
    ]
    when(db_manager).get_user_by_public_key(message.target_public_key).thenReturn(None)
    when(websocket_connection).close().thenReturn(awaited_return(None))

    await socket_manager.forward_message(websocket_connection, message)


@pytest.mark.asyncio
async def test_socket_manager_doesnt_add_already_connected_user(
    socket_manager: SocketManager,
    source_user: User,
    websocket_connection: WebSocket,
    awaited_return: Callable[[Any], asyncio.Future],
) -> None:
    active_connections = [{"websocket": websocket_connection, "user": source_user}]
    socket_manager.active_connections = active_connections
    when(websocket_connection).accept().thenReturn(awaited_return(None))

    await socket_manager.connect(websocket_connection, source_user)

    # No connection was added
    assert socket_manager.active_connections == active_connections


@pytest.mark.asyncio
async def test_socket_manager_closes_source_connection_if_target_connection_not_found(
    source_user: User,
    target_user: User,
    websocket_connection: WebSocket,
    socket_manager: SocketManager,
    message: MessageIn,
    db_manager: DatabaseManager,
    awaited_return: Callable[[Any], asyncio.Future],
) -> None:
    socket_manager.active_connections = [
        {"websocket": websocket_connection, "user": source_user},
    ]
    when(db_manager).get_user_by_public_key(message.target_public_key).thenReturn(
        target_user
    )
    when(websocket_connection).close().thenReturn(awaited_return(None))

    await socket_manager.forward_message(websocket_connection, message)
