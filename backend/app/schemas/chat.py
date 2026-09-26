from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime


class SendMessageRequest(BaseModel):
    to_user_id: str
    content: str
    message_type: str = "text"
    vehicle_id: Optional[str] = None
    offer_amount: Optional[float] = None


class ConvMessageRequest(BaseModel):
    content: str
    message_type: str = "text"
    vehicle_id: Optional[str] = None


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    content: str
    message_type: str
    vehicle_id: Optional[str]
    offer_amount: Optional[float]
    is_read: bool
    created_at: str


class ParticipantInfo(BaseModel):
    id: str
    full_name: str
    role: str
    avatar_url: Optional[str] = None


class ConversationResponse(BaseModel):
    id: str
    participants: List[str]
    participant_info: List[ParticipantInfo] = []
    vehicle_id: Optional[str]
    last_message: Optional[str]
    last_message_at: Optional[str]
    unread_count: int = 0
    created_at: str


class ConversationListResponse(BaseModel):
    items: List[ConversationResponse]
    total: int
