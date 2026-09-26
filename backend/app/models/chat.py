import enum
from datetime import datetime
from typing import Optional, List
from beanie import Document
from pydantic import Field


class MessageType(str, enum.Enum):
    text = "text"
    image = "image"
    voice = "voice"
    vehicle = "vehicle"
    offer = "offer"


class Message(Document):
    conversation_id: str
    sender_id: str
    content: str
    message_type: MessageType = MessageType.text
    vehicle_id: Optional[str] = None
    offer_amount: Optional[float] = None
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "messages"


class Conversation(Document):
    participants: List[str]
    vehicle_id: Optional[str] = None
    last_message: Optional[str] = None
    last_message_at: Optional[datetime] = None
    last_sender_id: Optional[str] = None
    unread_counts: dict = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Settings:
        name = "conversations"
