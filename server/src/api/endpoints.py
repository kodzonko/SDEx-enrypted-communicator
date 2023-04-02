from fastapi import WebSocket, WebSocketDisconnect

from main import app, db_manager, socket_manager


@app.get("/users/{public_key}")
async def check_user_public_key(public_key: str) -> bool:
    """Validate the public_key is still valid."""
    return db_manager.check_public_key(public_key)


# @app.post("/messages")
# async def send_message(message: MessageIn) -> bool:
#     """Ingest message to deliver to the recipient."""
#     user = db_manager.get_user_by_public_key(message.recipient_public_key)
#     if not user:
#         return False
#     else:
#         return True


@app.websocket("/api/chat")
async def send_message(websocket: WebSocket):
    sender = websocket.cookies.get("X-Authorization")
    if sender:
        await socket_manager.connect(websocket, sender)
        response = {"sender": sender, "message": "got connected"}
        await socket_manager.forward_message(response)
        try:
            while True:
                data = await websocket.receive_json()
                await socket_manager.forward_message(data)
        except WebSocketDisconnect:
            socket_manager.disconnect(websocket, sender)
            response["message"] = "left"
            await socket_manager.forward_message(response)
