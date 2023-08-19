import pathlib

import pytest

from database.database import DatabaseManager
from database.models import User


@pytest.fixture
def db_manager() -> DatabaseManager:
    db_path = pathlib.Path(__file__).parent.parent.parent / "resources" / "test-db.db"
    db_manager = DatabaseManager(db_path)
    return db_manager


@pytest.fixture
def user() -> User:
    return User(
        id=123, public_rsa="rsa-test", private_rsa_hash="test-hash", salt="salt"
    )


@pytest.fixture
def updating_user(db_manager: DatabaseManager) -> bool:
    previous_user = User(
        public_rsa="old-rsa", private_rsa_hash="old-test-hash", salt="old-salt"
    )
    new_user = User(
        public_rsa="new-rsa", private_rsa_hash="new-test-hash", salt="new-salt"
    )
    yield db_manager.update_user(previous_user.public_rsa, new_user)  # type: ignore
    db_manager.update_user(new_user.public_rsa, previous_user)


@pytest.fixture
def adding_user(db_manager: DatabaseManager) -> bool:
    user_to_add = User(
        id=987,
        public_rsa="added-user-rsa",
        private_rsa_hash="added-user-rsa-hash",
        salt="added-salt55",
    )
    yield db_manager.add_user(user_to_add)  # type: ignore
    db_manager.remove_user(user_to_add.public_rsa)


@pytest.fixture
def deleting_user(db_manager: DatabaseManager) -> bool:
    user_to_delete = User(
        id=1111, public_rsa="test", private_rsa_hash="test-priv-hash", salt="salt123"
    )
    yield db_manager.remove_user(user_to_delete.public_rsa)  # type: ignore
    db_manager.add_user(user_to_delete)


def test_get_user_by_public_key_returns_user(
    db_manager: DatabaseManager, user: User
) -> None:
    assert db_manager.get_user_by_public_key("rsa-test") == user


def test_get_user_by_public_key_doesnt_find_user(db_manager: DatabaseManager) -> None:
    assert db_manager.get_user_by_public_key("public_key") is None


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
    assert db_manager.update_user("doesnt-exist", user) is False


def test_add_user_inserts_user_successfully(adding_user: bool) -> None:
    assert adding_user is True


def test_remove_user_deletes_user_successfully(deleting_user: bool) -> None:
    assert deleting_user is True
