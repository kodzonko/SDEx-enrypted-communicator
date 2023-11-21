import pathlib

import pytest

from sdex_server.database.database import DatabaseManager
from sdex_server.database.models import User


@pytest.fixture
def db_manager() -> DatabaseManager:
    db_path = pathlib.Path(__file__).parent.parent.parent / "resources" / "test-db.db"
    db_manager = DatabaseManager(db_path)
    return db_manager


@pytest.fixture
def user() -> User:
    return User(id=123, public_key="rsa-test", login="test_login")


@pytest.fixture
def updating_user(db_manager: DatabaseManager) -> bool:
    previous_user = User(public_key="old-rsa", login="some_user")
    new_user = User(public_key="new-rsa", login="some_user")
    yield db_manager.update_user(new_user.login, new_user.public_key)  # type: ignore
    db_manager.update_user(previous_user.login, previous_user.public_key)


@pytest.fixture
def adding_user(db_manager: DatabaseManager) -> bool:
    user_to_add = User(public_key="added-user-key", login="added-user")
    yield db_manager.add_user(user_to_add)  # type: ignore
    db_manager.remove_user(user_to_add.login)


@pytest.fixture
def deleting_user(db_manager: DatabaseManager) -> bool:
    user_to_delete = User(public_key="test-key", login="test123")
    yield db_manager.remove_user(user_to_delete.login)  # type: ignore
    db_manager.add_user(user_to_delete)


def test_get_user_by_login_returns_user(
    db_manager: DatabaseManager, user: User
) -> None:
    assert db_manager.get_user_by_login(user.login) == user


def test_get_user_by_login_doesnt_find_user(db_manager: DatabaseManager) -> None:
    assert db_manager.get_user_by_login("some_false_login") is None


def test_check_public_key_public_returns_public_key_exists(
    db_manager: DatabaseManager,
) -> None:
    assert db_manager.check_public_key("rsa-test") is True


def test_check_public_key_public_returns_public_key_doesnt_exist(
    db_manager: DatabaseManager,
) -> None:
    assert db_manager.check_public_key("false-rsa") is False


def test_update_user_executes_successfully(updating_user: bool) -> None:
    assert updating_user is True


def test_update_user_public_key_doesnt_find_user(
    db_manager: DatabaseManager, user: User
) -> None:
    assert db_manager.update_user("doesnt-exist", "some-key") is False


def test_add_user_inserts_user_successfully(adding_user: bool) -> None:
    assert adding_user is True


def test_remove_user_deletes_user_successfully(deleting_user: bool) -> None:
    assert deleting_user is True
