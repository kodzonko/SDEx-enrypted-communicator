from typing import Optional

from pydantic import BaseModel


class User(BaseModel):
    login: str
    public_key: str
    id: Optional[int] = None
