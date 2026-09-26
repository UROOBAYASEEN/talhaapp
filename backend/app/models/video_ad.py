import enum
from datetime import datetime, timedelta
from typing import Optional
from beanie import Document
from pydantic import Field


class VideoAdStatus(str, enum.Enum):
    pending   = "pending"
    active    = "active"
    expired   = "expired"
    cancelled = "cancelled"


class VideoAd(Document):
    dealer_id:        str
    title:            str
    media_url:        Optional[str]     = None
    display_location: str               = "Home Screen Top"
    partner:          str               = "Autowizor"
    user_type:        str               = "All Users"
    cities:           list[str]         = []
    boost_weeks:      int               = 6
    amount:           float             = 6650.0
    status:           VideoAdStatus     = VideoAdStatus.pending
    safepay_tracker:  Optional[str]     = None
    created_at:       datetime          = Field(default_factory=datetime.utcnow)
    expires_at:       datetime          = Field(default_factory=lambda: datetime.utcnow() + timedelta(weeks=6))

    class Settings:
        name = "video_ads"
