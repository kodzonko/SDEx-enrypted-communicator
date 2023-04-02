from typing import Optional

from bson import ObjectId
from pydantic import BaseModel, Field
from pydantic_mongo import ObjectIdField


class User(BaseModel):
    id: Optional[ObjectIdField] = Field(default=None, alias="_id")
    public_key: str
    host: str

    class Config:
        json_encoders = {ObjectId: str}
