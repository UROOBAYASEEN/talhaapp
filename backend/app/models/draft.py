from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import Field


class Draft(Document):
    """Generic draft — video ad / special offer waghaira ke adhoore forms.
    `data` me poora form state JSON ki tarah mehfooz hota hai; `kind` batata hai
    kis screen ka draft hai taake "Continue" sahi editor kholе."""
    user_id:    str
    kind:       str                       # 'video_ad' | 'special_offer' | ...
    title:      Optional[str]  = None
    subtitle:   Optional[str]  = None
    media_url:  Optional[str]  = None
    data:       dict           = {}
    created_at: datetime       = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Settings:
        name = "drafts"
