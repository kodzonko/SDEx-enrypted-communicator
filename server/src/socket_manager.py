from datetime import datetime
from typing import TypedDict

from fastapi import WebSocket
from loguru import logger

from api.models import MessageIn, MessageOut
from database.database import DatabaseManager
from database.models import User


class _SingleUserConnection(TypedDict):
    websocket: WebSocket
    user: User


class SocketManager:
    def __init__(self, db_manager: DatabaseManager) -> None:
        self.__db_manager = db_manager
        self.active_connections: list[_SingleUserConnection] = []

    async def connect(self, websocket: WebSocket, user: User) -> None:
        """Establish connection with a user.

        If user already in active connections list, only send accept signal.
        """
        if self._get_target_connection(websocket=websocket, user=user):
            logger.debug("User already connected: %s" % user.public_key)
            await websocket.accept()
        else:
            await websocket.accept()
            self.active_connections.append({"websocket": websocket, "user": user})
            logger.info("User connected: %s" % user.public_key)

    def disconnect(self, websocket: WebSocket, user: User) -> None:
        """Remove user's connection from the active connections list."""
        logger.info("Disconnecting user: %s" % user.public_key)
        self.active_connections.remove({"websocket": websocket, "user": user})

    async def forward_message(self, websocket: WebSocket, data: MessageIn) -> None:
        """Forward received message to the target user.

        Args:
            websocket: The websocket connection of the sender.
            data: The message payload.
        """
        target = self.__db_manager.get_user_by_public_key(data.target_public_key)
        if not target:
            logger.info(
                "Target user not found in database: %s. Closing connection."
                % data.target_public_key
            )
            await websocket.close()
            return None
        connection = self._get_target_connection(websocket=websocket, user=target)
        logger.info("Forwarding message to target user: %s" % data.target_public_key)
        if not connection:
            logger.info(
                "Target user not found in active connections: %s"
                % data.target_public_key
            )
            await websocket.close()
        else:
            message = MessageOut(
                source_public_key=data.source_public_key,
                target_public_key=data.target_public_key,
                message=data.message,
                sent_date=datetime.now(),
            )

            await websocket.send_json(message.json())
            logger.info("Message forwarded to target user: %s" % target.public_key)

    def _get_target_connection(
        self, websocket: WebSocket, user: User
    ) -> _SingleUserConnection | None:
        """Find the target user's connection in the active connections list."""
        for connection in self.active_connections:
            if connection == {"websocket": websocket, "user": user}:
                return connection
        logger.info("Target user not found in active connections: %s" % user.public_key)
