from pathlib import Path

from fastapi import FastAPI
from fastapi_socketio import SocketManager
from loguru import logger

from sdex_server.crypto.randomness import generate_salt
from sdex_server.database.database import DatabaseManager
from sdex_server.database.models import User
from sdex_server.logger import init_logging
from sdex_server.messages import MISSING_PUBLIC_KEY_DROP_CONNECTION_MESSAGE
from sdex_server.settings import HOST_ADDRESS, HOST_PORT, SQLITE_DB_PATH
from sdex_server.state import PUBLIC_KEYS_SIDS_MAPPING

db_manager = DatabaseManager(SQLITE_DB_PATH)

app = FastAPI(title="SDEx communicator server", debug=True)
init_logging()

socket_manager = SocketManager(app=app)


@socket_manager.on("connect")  # type: ignore
def lol(sid, environ, auth) -> None:
    logger.info(f"connect sid={sid}.")


# async def handle_connect(sid, environ, auth) -> None:
#     logger.info(f"User connected sid={sid}.")
#     if not isinstance(auth, dict):
#         logger.info(MISSING_PUBLIC_KEY_DROP_CONNECTION_MESSAGE)
#         await socket_manager.disconnect(sid)
#         return
#     public_key = auth.get("publicKey", None)
#     if not public_key:
#         logger.info(MISSING_PUBLIC_KEY_DROP_CONNECTION_MESSAGE)
#         await socket_manager.disconnect(sid)
#     PUBLIC_KEYS_SIDS_MAPPING[public_key] = sid
#     logger.info("User's public key and sid saved.")


@socket_manager.on("authenticateInit")  # type: ignore
async def handle_authenticate(sid, data):
    """Request for providing salt for user's password"""
    logger.info(f'Received "authenticateInit" event from sid={sid}.')
    try:
        logger.info(data)
        logger.info(type(data))
        public_key: str = data["publicKey"]
    except (AttributeError, KeyError, IndexError, TypeError):
        logger.info("Public key not provided. Authentication unsuccessful.")
        return
    user = db_manager.get_user_by_public_key(public_key)
    if not user:
        logger.info("User not found in database. Authentication unsuccessful.")
        await socket_manager.emit("authenticate", {"status": "error"}, to=sid)
        return
    await socket_manager.emit(
        "authenticate", {"status": "success", "salt": user.salt}, to=sid
    )


@socket_manager.on("disconnect")  # type: ignore
async def handle_disconnect(sid) -> None:
    logger.info(f"User disconnected sid={sid}.")
    PUBLIC_KEYS_SIDS_MAPPING.inverse.pop(sid, None)
    logger.info("Client's sid and public key removed from mapping.")


@socket_manager.on("checkKey")  # type: ignore
async def handle_check_public_key_exists(sid, data) -> bool:
    """Validate the public_key exists on server."""
    logger.info(f'Received "checkKey" event from sid={sid}.')
    logger.debug(f"data={data}.")
    result = db_manager.check_public_key(data)
    return result


@socket_manager.on("registerInit")  # type: ignore
async def handle_register(sid, data) -> None:
    logger.info(f'Received "registerInit" event. sid={sid}."')
    # Generate and send salt for client's private key hash (a.k.a. password)
    await socket_manager.emit("registerInit", generate_salt(), to=sid)


@socket_manager.on("registerFollowUp")  # type: ignore
async def handle_register_follow_up(sid, data) -> None:
    logger.info(f'Received "registerFollowUp" event from sid={sid}.')
    if not isinstance(data, dict) or not data.get("publicKey", None):
        logger.info(
            (
                "Received invalid data. "
                'Emitting "registerFollowUp" event to client with status.'
            )
        )
        await socket_manager.emit("registerFollowUp", "error", to=sid)
        return
    # Check by public key if a user already exists
    logger.info(
        "Verifying if user with that public key already exists in the database."
    )
    result = db_manager.check_public_key(data.get("publicKey", ""))
    if result:
        logger.error("User with that public key already exists. Failed to register.")
        return
    logger.info("Registering user.")
    user = User(
        public_key=data["publicKey"],
        private_key_hash=data["privateKeyHash"],
        salt=data["salt"],
    )
    result = db_manager.add_user(user)
    if result:
        logger.info(
            (
                "User registered successfully. "
                'Emitting "registerFollowUp" event to client with status.'
            )
        )
    else:
        logger.error(
            (
                "Failed to register user. "
                'Emitting "registerFollowUp" event to client with status.'
            )
        )
    await socket_manager.emit(
        "registerFollowUp", "success" if result else "error", to=sid
    )


@socket_manager.on("chat")  # type: ignore
async def handle_chat(sid, data) -> None:
    """Forwards messages between clients."""
    logger.info(f'Received "chat" event from sid={sid}.')
    logger.debug(f"Received data={data}.")
    target_public_key = data["targetPublicKey"]
    sender_public_key = PUBLIC_KEYS_SIDS_MAPPING.inverse.get(sid, default=None)
    if not sender_public_key:
        logger.error("Sender public key not found in mapping.")
        return
    target_sid = PUBLIC_KEYS_SIDS_MAPPING.get(target_public_key, None)
    if not target_sid:
        logger.info(
            "Target public key not found in mapping. Failed to deliver a message."
        )
        await socket_manager.emit(
            "chat",
            {"status": "error"},
            to=sid,
        )
        return
    message = data["message"]
    await socket_manager.emit(
        "chat",
        {"status": "success", "message": message, "from": sender_public_key},
        to=target_sid,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        f"{Path(__file__).stem}:app",
        host=HOST_ADDRESS,
        port=HOST_PORT,
        reload=True,
    )
