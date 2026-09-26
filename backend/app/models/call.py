import enum
from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import Field


class CallStatus(str, enum.Enum):
    pending  = "pending"
    accepted = "accepted"
    declined = "declined"
    ended    = "ended"
    missed   = "missed"


class Call(Document):
    caller_id:       str
    callee_id:       str
    conversation_id: Optional[str] = None
    caller_name:     Optional[str] = None
    status:          CallStatus = CallStatus.pending
    created_at:      datetime = Field(default_factory=datetime.utcnow)
    answered_at:     Optional[datetime] = None
    ended_at:        Optional[datetime] = None

    class Settings:
        name = "calls"
