import sqlite3
from pathlib import Path

from loguru import logger

from sdex_server.database.models import User
from sdex_server.exceptions import DBConnectionError


class DatabaseManager:
    def __init__(self, db_path: Path | str) -> None:
        try:
            self.client: sqlite3.Connection = sqlite3.connect(db_path)
        except Exception as e:
            raise DBConnectionError(e)

    def get_user_by_public_key(self, public_key: str) -> User | None:
        """Get user data from the database by public key."""
        try:
            cursor: sqlite3.Cursor = self.client.execute(
                """
                SELECT id, public_key, private_key_hash, salt
                FROM users
                WHERE public_key = :rsa_key;
                """,
                {"rsa_key": public_key},
            )
            output = cursor.fetchone()
            if not output:
                log_msg = "User not found."
                logger.info(log_msg)
                return None
            user = User(
                id=output[0],
                public_key=output[1],
                private_key_hash=output[2],
                salt=output[3],
            )
            log_msg = "User data fetched successfully."
            logger.info(log_msg)
            return user
        except Exception as e:
            raise DBConnectionError(e)

    def check_public_key(self, public_key: str) -> bool:
        """Check if public key exists in the database."""
        try:
            cursor: sqlite3.Cursor = self.client.execute(
                "SELECT * FROM users WHERE public_key = :key;",
                {"key": public_key},
            )
            output = cursor.fetchone()
            log_msg = "Public key exists." if output else "Public key does not exist."
            logger.info(log_msg)
            return True if output else False
        except Exception as e:
            raise DBConnectionError(e)

    def update_user(self, previous_rsa: str, user_new_data: User) -> bool:
        """Update user public key in the database."""
        try:
            find_user_cursor: sqlite3.Cursor = self.client.execute(
                """
                SELECT *
                FROM users
                WHERE public_key = :rsa;
                """,
                {"rsa": previous_rsa},
            )
            user = find_user_cursor.fetchone()
            if not user:
                return False
            else:
                self.client.execute(
                    """
                    UPDATE users
                    SET public_key = :public_rsa,
                        private_key_hash = :private_rsa_hash,
                        salt = :salt
                    WHERE public_key = :previous_rsa;
                    """,
                    {
                        "public_rsa": user_new_data.public_key,
                        "private_rsa_hash": user_new_data.private_key_hash,
                        "salt": user_new_data.salt,
                        "previous_rsa": previous_rsa,
                    },
                )
                self.client.commit()
                return self.client.total_changes > 0
        except Exception as e:
            raise DBConnectionError(e)

    def add_user(self, user: User) -> bool:
        """Add new user to the database."""
        try:
            self.client.execute(
                """
                INSERT INTO users (public_key, private_key_hash, salt)
                VALUES (:public_rsa, :private_rsa_hash, :salt);
                """,
                {
                    "public_rsa": user.public_key,
                    "private_rsa_hash": user.private_key_hash,
                    "salt": user.salt,
                },
            )
            self.client.commit()
            return self.client.total_changes > 0
        except Exception as e:
            raise DBConnectionError(e)

    def remove_user(self, public_key: str) -> bool:
        """Add new user to the database."""
        try:
            self.client.execute(
                """
                DELETE FROM users
                WHERE public_key = :rsa;
                """,
                {"rsa": public_key},
            )
            self.client.commit()
            return self.client.total_changes > 0
        except Exception as e:
            raise DBConnectionError(e)
