from email import message
from pathlib import Path
from typing import Any

from fastapi import FastAPI
from fastapi_socketio import SocketManager
from loguru import logger

from sdex_server.connection.payload_sanitizers import (
    validate_chat_init_payload,
    validate_chat_payload,
    validate_check_key_payload,
    validate_check_online_payload,
    validate_connect_payload,
    validate_register_follow_up_payload,
    validate_register_init_payload,
)
from sdex_server.crypto.randomness import generate_salt
from sdex_server.database.database import DatabaseManager
from sdex_server.database.models import User
from sdex_server.logger import init_logging
from sdex_server.settings import HOST_ADDRESS, HOST_PORT, SQLITE_DB_PATH
from sdex_server.type_definitions import ResponseStatusType
from bidict import bidict

from sdex_server.type_definitions import PublicKeysSidsMappingType


# Keeps a mapping of public keys to socket ids in bidirectional dictionary, where:
#   keys are: public RSA keys
#   values are: socket ids

PUBLIC_KEYS_SIDS_MAPPING: PublicKeysSidsMappingType = bidict()
# Set of authenticated users' sids
AUTHENTICATED_USERS: set[str] = set()


db_manager = DatabaseManager(SQLITE_DB_PATH)

app = FastAPI(title="SDEx communicator server", debug=True)
init_logging()

socket_manager = SocketManager(app=app)


@socket_manager.on("connect")  # type: ignore
async def handle_connect(sid, environ, auth) -> None:
    logger.info(f"User connected sid={sid}.")
    if not validate_connect_payload(auth):
        logger.info("Bad payload. Dropping connection.")
        logger.debug(f"auth={auth}")
        await socket_manager.disconnect(sid)
    else:
        PUBLIC_KEYS_SIDS_MAPPING[auth["publicKey"]] = sid
        logger.info("User connected. User's public key and sid saved.")
        logger.debug(
            f"After adding the user PUBLIC_KEYS_SIDS_MAPPING={PUBLIC_KEYS_SIDS_MAPPING}"
        )


@socket_manager.on("disconnect")  # type: ignore
async def handle_disconnect(sid) -> None:
    logger.info(f"User disconnected sid={sid}.")
    PUBLIC_KEYS_SIDS_MAPPING.inverse.pop(sid, None)
    logger.debug(
        f"After removing the user PUBLIC_KEYS_SIDS_MAPPING={PUBLIC_KEYS_SIDS_MAPPING}"
    )
    try:
        AUTHENTICATED_USERS.remove(sid)
        logger.debug(
            f"After removing the user AUTHENTICATED_USERS={AUTHENTICATED_USERS}"
        )
    except KeyError:
        logger.info("User wasn't in AUTHENTICATED_USERS set.")
        logger.debug(f"AUTHENTICATED_USERS={AUTHENTICATED_USERS}")
    logger.info("Client's sid and public key removed from mapping.")


@socket_manager.on("registerInit")  # type: ignore
async def handle_register_init(sid, data: Any) -> None:
    """Request for providing salt for user's password"""
    logger.info(f'Received "registerInit" event from sid={sid}.')
    if not validate_register_init_payload(data):
        logger.info("Public key not provided. Authentication unsuccessful.")
        return
    user = db_manager.get_user_by_public_key(data)
    # if user is found we need to authenticate the user,
    # otherwise we need to register the user
    # process is the same:
    # - send salt to the client (either fetched from db or generated)
    # - listen event containing user's password hash
    # - if hash matches the one in db, authenticate the user
    # - if it's a new user, save the user in db  along with the new hashed pwd
    if user:
        logger.info("User found in database. Sending salt to verify.")
        await socket_manager.emit("registerInit", user.salt, to=sid)
    else:
        logger.info(
            "User not found in database. Sending salt to register his password."
        )
        await socket_manager.emit("registerInit", generate_salt(), to=sid)


@socket_manager.on("registerFollowUp")  # type: ignore
async def handle_register_follow_up(sid, data) -> ResponseStatusType:
    logger.info(f'Received "registerFollowUp" event from sid={sid}.')
    if not validate_register_follow_up_payload(data):
        logger.info(("Bad payload. Returning status: error. "))
        return "error"
    # Check by public key if a user already exists
    logger.info(
        "Verifying if user with that public key already exists in the database."
    )
    user = db_manager.get_user_by_public_key(data["publicKey"])
    if user:
        logger.info(
            (
                "User with that public key already exists. "
                "Verifying if password hashes match."
            )
        )
        AUTHENTICATED_USERS.add(sid)
        logger.info(
            "User registered successfully."
            if user.private_key_hash == data["privateKeyHash"]
            else "Authentication failed. Credentials don't match."
        )
        return "success" if user.private_key_hash == data["privateKeyHash"] else "error"
    else:
        logger.info("User with that public key doesn't exist. Registering...")
        user = User(
            public_key=data["publicKey"],
            private_key_hash=data["privateKeyHash"],
            salt=data["salt"],
        )
        insert_successful = db_manager.add_user(user)
        if insert_successful:
            logger.info(("User registered successfully."))
            AUTHENTICATED_USERS.add(sid)
            return "success"
        else:
            logger.error(("Failed to register user due to database write error."))
            return "error"


@socket_manager.on("chatInit")  # type: ignore
async def handle_chat_init(sender_sid, data) -> bool:
    """Forwards chatInit request between users."""
    logger.info(f'Received "chatInit" event from sid={sender_sid}.')
    logger.debug(f"Received data={data}.")
    if not validate_chat_init_payload(data):
        logger.info("Bad payload. Ignoring request.")
        return False
    if sender_sid not in AUTHENTICATED_USERS:
        logger.info("User not authenticated. Ignoring request.")
        return False
    receiver_sid = PUBLIC_KEYS_SIDS_MAPPING.get(data["publicKeyTo"], None)
    logger.debug(f"sender_sid={sender_sid}, receiver_sid={receiver_sid}")
    logger.info("Forwarding chatInit request to the receiver.")
    await socket_manager.emit("chatInit", data, to=receiver_sid)


@socket_manager.on("chat")  # type: ignore
async def handle_chat(sender_sid, data) -> ResponseStatusType:
    """Forwards messages between clients."""
    logger.info(f'Received "chat" event from sid={sender_sid}.')
    logger.debug(f"Received data={data}.")
    if not validate_chat_payload(data):
        logger.info("Bad payload. Returning status: error.")
        return "error"
    logger.debug(f"PUBLIC_KEYS_SIDS_MAPPING={PUBLIC_KEYS_SIDS_MAPPING}")
    logger.debug(f"AUTHENTICATED_USERS={AUTHENTICATED_USERS}")
    # Check if both parties are online
    sender_key = PUBLIC_KEYS_SIDS_MAPPING.inverse.get(sender_sid, None)
    receiver_sid = PUBLIC_KEYS_SIDS_MAPPING.get(data["publicKeyTo"], None)
    logger.debug(f"sender_key={sender_key}, receiver_sid={receiver_sid}")
    if not sender_key or not receiver_sid:
        logger.info(
            (
                "One of the users is not logged in to the server. "
                "Message may not reach the receiver."
            )
        )

    # Check if both parties are authenticated
    if sender_sid not in AUTHENTICATED_USERS:
        logger.info("One of the users is not authenticated. Ignoring the message.")
        logger.debug(f"sender_sid={sender_sid}, receiver_sid={receiver_sid}")
        return "error"

    # All conditions met, forwarding the message
    await socket_manager.emit(
        "chat",
        data,
        to=receiver_sid,
    )
    logger.info("Message forwarded successfully.")
    return "success"


@socket_manager.on("checkKey")  # type: ignore
async def handle_check_public_key_exists(sid, data) -> bool | None:
    """Check if the public_key exists on server."""
    logger.info('Received "checkKey" event.')
    logger.debug(f"data={data}.")
    if not validate_check_key_payload(data):
        logger.info("Bad payload. Ignoring request.")
    elif sid not in AUTHENTICATED_USERS:
        logger.info("User not authenticated. Ignoring request.")
    else:
        result = db_manager.check_public_key(data["publicKey"])
        logger.debug(
            f'User with public key={data["publicKey"]} exists? - result={result}'
        )
        return result


@socket_manager.on("checkOnline")  # type: ignore
async def handle_check_online_status(sid, data: str) -> bool:
    """Check if the user with given public key is currently connected."""
    logger.info('Received "checkOnline" event.')
    logger.debug(f"data={data}.")
    logger.debug(f"PUBLIC_KEYS_SIDS_MAPPING={PUBLIC_KEYS_SIDS_MAPPING}")
    logger.debug(f"AUTHENTICATED_USERS={AUTHENTICATED_USERS}")
    if not validate_check_online_payload(data):
        logger.info("Bad payload. Returning False.")
        return False
    elif sid not in AUTHENTICATED_USERS:
        logger.info("User not authenticated. Returning False.")
        return False
    else:
        result = data in AUTHENTICATED_USERS
        logger.debug(f"User is online: {result}")
        return result


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        f"{Path(__file__).stem}:app",
        host=HOST_ADDRESS,
        port=HOST_PORT,
        reload=True,
    )
