import sys

sys.path.append("src")

from fastapi import FastAPI  # noqa: E402

from database.database import DatabaseManager  # noqa: E402
from socket_manager import SocketManager  # noqa: E402

db_manager = DatabaseManager()
socket_manager = SocketManager(db_manager)

app = FastAPI()
