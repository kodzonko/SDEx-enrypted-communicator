from pathlib import Path

from loguru import logger
from pydantic_mongo import AbstractRepository
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from pymongo.server_api import ServerApi

import settings
from database.models import User
from exceptions import GENERIC_DB_CONN_ERROR, DBConnectionError


class UserRepository(AbstractRepository[User]):
    class Meta:
        collection_name = "users"


class DatabaseManager:
    def __init__(
        self, cert_key_path: Path | str = settings.MONGO_AUTH_CERT_PATH
    ) -> None:
        if not isinstance(cert_key_path, str):
            cert_key_path = str(cert_key_path)
        try:
            self.client: MongoClient = MongoClient(
                settings.CONNECTION_STRING,
                tls=True,
                tlsCertificateKeyFile=cert_key_path,
                server_api=ServerApi("1"),
            )
            self.user_repository: UserRepository = UserRepository(database=self.client)
        except ConnectionFailure as e:
            raise DBConnectionError("Failed to connect to the database: %s" % e)

    def get_user_by_id(self, user_id: str) -> User | None:
        """Fetch user data from the database by id."""
        logger.info("Fetching user data from the database by id")
        try:
            output = self.user_repository.find_one_by_id(user_id)
            log_msg = "User data fetched successfully." if output else "User not found."
            logger.info(log_msg)
            return output
        except Exception:
            raise DBConnectionError(GENERIC_DB_CONN_ERROR)

    def get_user_by_public_key(self, public_key: str) -> User | None:
        """Get user data from the database by public key."""
        try:
            output = self.user_repository.find_one_by({"public_key": public_key})
            log_msg = "User data fetched successfully." if output else "User not found."
            logger.info(log_msg)
            return output
        except Exception:
            raise DBConnectionError(GENERIC_DB_CONN_ERROR)

    def check_public_key(self, public_key: str) -> bool:
        """Check if public key exists in the database."""
        try:
            output = (
                self.user_repository.find_one_by({"public_key": public_key}) is not None
            )
            log_msg = "Public key exists." if output else "Public key does not exist."
            logger.info(log_msg)
            return True if output else False
        except Exception:
            raise DBConnectionError(GENERIC_DB_CONN_ERROR)

    def update_user_public_key(self, host: str, public_key: str) -> bool:
        """Update user public key in the database."""
        try:
            user = self.user_repository.find_one_by({"host": host})
            if not user:
                return False
            else:
                user.public_key = public_key
                self.user_repository.save(user)
                return True
        except Exception:
            raise DBConnectionError(GENERIC_DB_CONN_ERROR)

    def add_user(self, host: str, public_key: str) -> bool:
        """Add new user to the database."""
        try:
            self.user_repository.save(User(host=host, public_key=public_key))
            return True
        except Exception:
            raise DBConnectionError(GENERIC_DB_CONN_ERROR)
