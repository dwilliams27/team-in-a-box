from pydantic import BaseModel, Field
from typing import List, Protocol
from datetime import datetime

from app.schemas.common import PyObjectId, get_current_utc_time

class SlackMessage(Protocol):
    user: str
    text: str
    client_msg_id: str
    channel: str
    event_ts: str
    event_context: str

class EventStreamBase(BaseModel):
    slack: SlackMessage

class EventStreamCreate(EventStreamBase):
    slack: SlackMessage

class EventStreamInDB(EventStreamBase):
    mongo_id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    id: str = Field(..., index=True)
    created_at: datetime = Field(default_factory=get_current_utc_time)
    updated_at: datetime = Field(default_factory=get_current_utc_time)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {PyObjectId: str}
