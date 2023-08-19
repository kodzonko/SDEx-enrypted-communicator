from typing import Optional

from pydantic import BaseModel


class User(BaseModel):
    id: Optional[int]
    public_rsa: str
    private_rsa_hash: str
    salt: str
