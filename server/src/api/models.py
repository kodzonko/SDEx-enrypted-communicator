from datetime import datetime

from pydantic import BaseModel


class MessageIn(BaseModel):
    """Payload schema."""

    source_public_key: str
    target_public_key: str
    message: list[int]
    sent_date: datetime


class MessageOut(BaseModel):
    """Response schema."""

    source_public_key: str
    target_public_key: str
    message: list[int]
    sent_date: datetime
