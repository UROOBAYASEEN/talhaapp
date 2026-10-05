from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import Field


class Brand(Document):
    name:       str
    logo_url:   Optional[str] = None
    category:   str           = "car"   # car | bike | both
    is_active:  bool          = True
    created_at: datetime      = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "brands"
