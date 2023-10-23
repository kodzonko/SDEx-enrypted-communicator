from pydantic import BaseModel


class User(BaseModel):
    login: str
    public_key: str
    id: int | None = None
