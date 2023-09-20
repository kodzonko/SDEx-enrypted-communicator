import base64
from concurrent.futures import Future
from pathlib import Path
from typing import Any, Awaitable, Optional

import rsa
from bidict import bidict
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
)
from sdex_server.crypto.randomness import generate_challenge
from sdex_server.database.database import DatabaseManager
from sdex_server.database.models import User
from sdex_server.logger import init_logging
from sdex_server.settings import HOST_ADDRESS, HOST_PORT, SQLITE_DB_PATH
from sdex_server.type_definitions import PublicKeysSidsMappingType, ResponseStatusType

# Keeps a mapping of public keys to socket ids in bidirectional dictionary, where:
#   keys are: public RSA keys
#   values are: socket ids
PUBLIC_KEYS_SIDS_MAPPING: PublicKeysSidsMappingType = bidict()
# Set of authenticated users' sids
AUTHENTICATED_USERS: set[str] = set()
# Maps sids to challenges sent to users for authentication
SID_TO_CHALLENGE_MAPPING: dict[str, str] = {}


db_manager = DatabaseManager(SQLITE_DB_PATH)

app = FastAPI(title="SDEx communicator server", debug=True)
init_logging()

socket_manager = SocketManager(app=app)


@socket_manager.on("connect")  # type: ignore
async def handle_connect(sid, environ, auth) -> Awaitable[None] | None:
    logger.info(f"User connected sid={sid}.")
    if not validate_connect_payload(auth):
        logger.info("Bad payload. Dropping connection.")
        logger.debug(f"auth={auth}")
        await socket_manager.disconnect(sid)
    else:
        PUBLIC_KEYS_SIDS_MAPPING[auth["publicKey"]] = sid
        logger.info("User connected. User's public key and sid saved.")


@socket_manager.on("disconnect")  # type: ignore
async def handle_disconnect(sid) -> None:
    logger.info(f"User disconnected sid={sid}.")
    PUBLIC_KEYS_SIDS_MAPPING.inverse.pop(sid, None)
    SID_TO_CHALLENGE_MAPPING.pop(sid, None)
    try:
        AUTHENTICATED_USERS.remove(sid)
    except KeyError:
        logger.info("User wasn't in AUTHENTICATED_USERS.")
        logger.debug(f"AUTHENTICATED_USERS={AUTHENTICATED_USERS}")
    logger.info("Client's sid and public key removed from mapping.")


@socket_manager.on("registerInit")  # type: ignore
async def handle_register_init(sid: str) -> str:
    """Request for challenge to authenticate or register a user."""
    logger.info(f'Received "registerInit" event from sid={sid}.')
    if sid in AUTHENTICATED_USERS:
        logger.info("User already authenticated. Ignoring request.")
        return "already authenticated"
    if existing_challenge := SID_TO_CHALLENGE_MAPPING.get(sid, None):
        logger.info("Re-sending the same challenge.")
        return existing_challenge
    challenge = generate_challenge()
    SID_TO_CHALLENGE_MAPPING[sid] = challenge
    return challenge


@socket_manager.on("registerFollowUp")  # type: ignore
async def handle_register_follow_up(sid: str, data: Any) -> ResponseStatusType:
    logger.info(f'Received "registerFollowUp" event from sid={sid}.')
    logger.debug(f"Received data={data}")
    if not validate_register_follow_up_payload(data):
        logger.info(("Bad payload. Returning status: error."))
        return "error"
    # Verify challenge
    challenge = SID_TO_CHALLENGE_MAPPING.get(sid, None)
    if not challenge:
        logger.info("Challenge not found. Authentication unsuccessful.")
        return "error"
    logger.debug(f"challenge={challenge}")
    try:
        rsa.verify(
            message=challenge.encode(),
            signature=base64.b64decode(data["signature"]),
            pub_key=rsa.PublicKey.load_pkcs1(data["publicKey"]),
        )
        logger.info("Challenge verification successful.")
    except rsa.VerificationError as e:
        logger.info("Challenge verification failed. Authentication unsuccessful.")
        return "error"

    logger.info(
        "Verifying if user with that public key already exists in the database."
    )
    user = db_manager.get_user_by_login(data["login"])

    if user:
        logger.info(
            (
                (
                    "User with that login already exists. "
                    "Verifying if public key and login match."
                )
            )
        )
        if user.public_key != data["publicKey"] or user.login != data["login"]:
            logger.info("Public key doesn't match. Authentication unsuccessful.")
            return "error"
        else:
            AUTHENTICATED_USERS.add(sid)
            logger.info("Authentication of existing user successful.")
            return "success"
    else:
        logger.info("User with that public key doesn't exist. Registering...")
        user = User(
            login=data["login"],
            public_key=data["publicKey"],
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
async def handle_chat_init(sender_sid: str, data: Any) -> Optional[str]:
    """Exchanges chatInit messages between users.

    This event mediates exchange of session key parts between users.
    Each user delivers their part of the session key to the server
    and receives the second part of the session key from the other user.

    """
    logger.info(f'Received "chatInit" event from sid={sender_sid}.')
    logger.debug(f"Received data={data}.")
    if not validate_chat_init_payload(data):
        logger.info("Bad payload. Ignoring request.")
        return None
    if sender_sid not in AUTHENTICATED_USERS:
        logger.info("User not authenticated. Ignoring request.")
        return None
    receiver_sid = PUBLIC_KEYS_SIDS_MAPPING.get(data["publicKeyTo"], None)
    logger.debug(f"sender_sid={sender_sid}, receiver_sid={receiver_sid}")
    logger.info("Forwarding chatInit request to the receiver.")

    session_key_second_part_future: Future[Optional[str]] = Future()

    def callback(data: Any):
        logger.info("Received response from second client.")
        session_key_second_part_future.set_result(
            data if isinstance(data, str) else None
        )

    await socket_manager.emit("chatInit", data, to=receiver_sid, callback=callback)
    session_key_second_part = await session_key_second_part_future

    return session_key_second_part


@socket_manager.on("chat")  # type: ignore
async def handle_chat(sender_sid: str, data: Any) -> ResponseStatusType:
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
    logger.debug(f"Message forwarded to receiver: {data['publicKeyTo']}")
    return "success"


@socket_manager.on("checkKey")  # type: ignore
async def handle_check_public_key_exists(sid: str, data: Any) -> bool | None:
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
async def handle_check_online_status(sid: str, data: Any) -> bool:
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
        result = data["publicKey"] in PUBLIC_KEYS_SIDS_MAPPING.keys()
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