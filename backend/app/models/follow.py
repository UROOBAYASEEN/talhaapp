from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import Field


class Follow(Document):
    follower_id: str
    following_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "follows"


class Notification(Document):
    user_id: str
    type: str
    title: str
    body: str
    data: dict = {}
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "notifications"
