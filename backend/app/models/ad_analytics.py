from datetime import datetime, date
from typing import Optional
from beanie import Document
from pydantic import Field


class AdAnalytics(Document):
    ad_id:       str
    ad_type:     str               # "banner" | "video"
    dealer_id:   str
    date:        str               = Field(default_factory=lambda: datetime.utcnow().strftime("%Y-%m-%d"))
    impressions: int               = 0
    clicks:      int               = 0
    calls:       int               = 0
    favorites:   int               = 0
    enquiries:   int               = 0
    shares:      int               = 0
    created_at:  datetime          = Field(default_factory=datetime.utcnow)
    updated_at:  datetime          = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "ad_analytics"
