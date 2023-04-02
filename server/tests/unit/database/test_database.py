import pytest
from mockito import mock, when
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure

import database.database as tested_module
from database.database import DatabaseManager
from database.models import User
from exceptions import GENERIC_DB_CONN_ERROR, DBConnectionError


@pytest.fixture
def db_manager() -> DatabaseManager:
    when(tested_module).MongoClient(...).thenReturn(mock(MongoClient))
    db_manager = DatabaseManager("cert_key_path.pem")
    return db_manager


@pytest.fixture
def user() -> User:
    return User(id="0123456789ab0123456789ab", public_key="public_key", host="host")


def test_get_user_by_id_returns_user(db_manager: DatabaseManager, user: User) -> None:
    when(db_manager.user_repository).find_one_by_id(
        "0123456789ab0123456789ab"
    ).thenReturn(user)
    assert db_manager.get_user_by_id("0123456789ab0123456789ab") == user


def test_get_user_by_id_doesnt_find_user(db_manager: DatabaseManager) -> None:
    when(db_manager.user_repository).find_one_by_id(
        "0123456789ab0123456789ab"
    ).thenReturn(None)
    assert db_manager.get_user_by_id("0123456789ab0123456789ab") is None


def test_get_user_by_raises_connection_error(
    db_manager: DatabaseManager,
) -> None:
    when(db_manager.user_repository).find_one_by_id(
        "0123456789ab0123456789ab"
    ).thenRaise(ConnectionFailure)
    with pytest.raises(DBConnectionError, match=GENERIC_DB_CONN_ERROR):
        db_manager.get_user_by_id("0123456789ab0123456789ab")


def test_get_user_by_public_key_returns_user(
    db_manager: DatabaseManager, user: User
) -> None:
    when(db_manager.user_repository).find_one_by(
        {"public_key": "public_key"}
    ).thenReturn(user)
    assert db_manager.get_user_by_public_key("public_key") == user


def test_get_user_by_public_key_doesnt_find_user(db_manager: DatabaseManager) -> None:
    when(db_manager.user_repository).find_one_by(
        {"public_key": "public_key"}
    ).thenReturn(None)
    assert db_manager.get_user_by_public_key("public_key") is None


def test_get_user_by_public_key_raises_connection_error(
    db_manager: DatabaseManager,
) -> None:
    when(db_manager.user_repository).find_one_by(
        {"public_key": "public_key"}
    ).thenRaise(ConnectionFailure)
    with pytest.raises(DBConnectionError, match=GENERIC_DB_CONN_ERROR):
        db_manager.get_user_by_public_key("public_key")


def test_check_public_key_public_returns_public_key_exists(
    db_manager: DatabaseManager, user: User
) -> None:
    when(db_manager.user_repository).find_one_by(
        {"public_key": "public_key"}
    ).thenReturn(user)
    assert db_manager.check_public_key("public_key") is True


def test_check_public_key_public_returns_public_key_doesnt_exist(
    db_manager: DatabaseManager,
) -> None:
    when(db_manager.user_repository).find_one_by(
        {"public_key": "public_key"}
    ).thenReturn(None)
    assert db_manager.check_public_key("public_key") is False


def test_check_public_key_public_raises_connection_error(
    db_manager: DatabaseManager,
) -> None:
    when(db_manager.user_repository).find_one_by({"host": "host"}).thenRaise(
        ConnectionFailure
    )
    with pytest.raises(DBConnectionError, match=GENERIC_DB_CONN_ERROR):
        db_manager.check_public_key("public_key")


def test_update_user_public_key_updates_key_successfully(
    db_manager: DatabaseManager, user: User
) -> None:
    when(db_manager.user_repository).find_one_by({"host": "host"}).thenReturn(user)
    when(db_manager.user_repository).save(user)
    assert db_manager.update_user_public_key("host", "public_key") is True


def test_update_user_public_key_doesnt_find_user(db_manager: DatabaseManager) -> None:
    when(db_manager.user_repository).find_one_by({"host": "host"}).thenReturn(None)
    assert db_manager.update_user_public_key("host", "public_key") is False


def test_update_user_public_key_raises_connection_error(
    db_manager: DatabaseManager,
) -> None:
    when(db_manager.user_repository).find_one_by({"host": "host"}).thenRaise(
        ConnectionFailure
    )
    with pytest.raises(DBConnectionError, match=GENERIC_DB_CONN_ERROR):
        db_manager.update_user_public_key("host", "public_key")
