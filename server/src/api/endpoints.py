from loguru import logger

from api.payload_sanitizers import validate_user_register_payload
from database.models import User
from main import app, db_manager, socket_manager


@socket_manager.on("check_key")
async def check_user_public_key(sid, data):
    """Validate the public_key exists in server."""
    result = db_manager.check_public_key(data["public_key"])
    await socket_manager.emit("check_key", result)


@socket_manager.on("register")
async def handle_register(sid, data):
    # Check by public key if user already exists
    result = db_manager.check_public_key(data["public_key"])
    if result:
        await socket_manager.emit(
            "register",
            {"status": "error", "message": "User with that public key already exists"},
        )
        return
    # Validate
    if not validate_user_register_payload(data):
        await socket_manager.emit(
            "register",
            {"status": "error", "message": "Invalid payload"},
        )
        return
    # Registration
    registration_status = db_manager.add_user(**data)
    if registration_status is False:
        await socket_manager.emit(
            "register",
            {"status": "error", "message": "Failed to save user data"},
        )
        return
    await socket_manager.emit("register", "User registered")


@socket_manager.on("connect")
async def handle_connect(sid, data):
    # await socket_manager.save_session(sid, {"public_rsa": data["public_rsa"]})
    logger.info(f"User connected sid={sid}, data received={data}.")
    await socket_manager.emit("connection", "User connected")


@socket_manager.on("disconnect")
async def handle_disconnect(sid, data):
    logger.info(f"User disconnected sid={sid}, data received={data}.")
    await socket_manager.emit("disconnect", "User disconnected")


@socket_manager.on("message")
async def handle_message(sid, data):
    await socket_manager.emit("message")


@socket_manager.on("test")
async def handle_test(sid, data):
    logger.info(f"sid={sid}, data received={data}")
    print("test works")
    await socket_manager.emit("test", {"message": f"sid={sid}, data received={data}"})
