from datetime import datetime

from pydantic import BaseModel


class MessageIn(BaseModel):
    """Payload schema for incoming message."""

    source_public_key: str
    target_public_key: str
    message: list[int]
    sent_date: datetime


class MessageOut(BaseModel):
    """Response schema for outgoing message."""

    source_public_key: str
    target_public_key: str
    message: list[int]
    sent_date: datetime


class RegisterUserFollowUpIn(BaseModel):
    """Request schema for user registration follow-up."""

    public_key: str
    private_key_hash: str
    salt: str
