import enum
from datetime import datetime, timedelta
from typing import Optional, List
from beanie import Document
from pydantic import Field


class AdStatus(str, enum.Enum):
    pending   = "pending"
    active    = "active"
    expired   = "expired"
    cancelled = "cancelled"
    paused    = "paused"


class BannerAd(Document):
    dealer_id:        str
    title:            str
    description:      Optional[str]     = None
    campaign_name:    Optional[str]     = None
    banner_image_url: Optional[str]     = None
    display_location: str               = "Home Screen Top"
    partner:          str               = "Autowizor"
    show_on_pages:    List[str]         = []
    user_type:        str               = "All Users"
    cities:           List[str]         = []
    boost_weeks:      int               = 6
    amount:           float             = 6650.0
    status:           AdStatus          = AdStatus.pending
    safepay_tracker:  Optional[str]     = None
    start_date:       Optional[datetime] = None
    end_date:         Optional[datetime] = None
    created_at:       datetime          = Field(default_factory=datetime.utcnow)
    expires_at:       datetime          = Field(default_factory=lambda: datetime.utcnow() + timedelta(weeks=6))

    class Settings:
        name = "banner_ads"
