from pathlib import Path

from fastapi import FastAPI
from fastapi_socketio import SocketManager

from database.database import DatabaseManager
from settings import HOST_ADDRESS, HOST_PORT, SQLITE_DB_PATH

db_manager = DatabaseManager(SQLITE_DB_PATH)


app = FastAPI(title="SDEx communicator server")
socket_manager = SocketManager(app=app)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        f"{Path(__file__).stem}:app",
        host=HOST_ADDRESS,
        port=HOST_PORT,
        reload=True,
    )
