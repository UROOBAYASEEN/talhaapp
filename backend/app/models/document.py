import enum
from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import Field


class DocumentStatus(str, enum.Enum):
    pending  = "pending"
    verified = "verified"
    rejected = "rejected"


class UserDocument(Document):
    user_id:     str
    type:        str
    desc:        str
    file_url:    Optional[str] = None
    status:      DocumentStatus = DocumentStatus.pending
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "user_documents"
