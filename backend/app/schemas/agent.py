from pydantic import BaseModel, Field
from typing import List
from datetime import datetime

from app.schemas.common import PyObjectId, get_current_utc_time

class AgentBase(BaseModel):
    first_name: str
    last_name: str
    lore: str
    tags: List[str]

class AgentCreate(AgentBase):
    first_name: str
    last_name: str
    lore: str
    tags: List[str]

class AgentInDB(AgentBase):
    mongo_id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    id: str = Field(..., index=True)
    created_at: datetime = Field(default_factory=get_current_utc_time)
    updated_at: datetime = Field(default_factory=get_current_utc_time)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {PyObjectId: str}
