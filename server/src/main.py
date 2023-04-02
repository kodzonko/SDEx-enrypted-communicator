import sys

sys.path.append("src")

from fastapi import FastAPI

from database.database import DatabaseManager
from socket_manager import SocketManager

db_manager = DatabaseManager()
socket_manager = SocketManager(db_manager)

app = FastAPI()
