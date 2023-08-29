from typing import Optional

from pydantic import BaseModel


class User(BaseModel):
    public_key: str
    private_key_hash: str
    salt: str
    id: Optional[int] = None
