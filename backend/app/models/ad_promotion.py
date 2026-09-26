import enum
from datetime import datetime, timedelta
from typing import Optional
from beanie import Document
from pydantic import Field


class PromotionType(str, enum.Enum):
    featured = "featured"
    ad_posting = "ad_posting"
    bumped = "bumped"


class AdPromotion(Document):
    vehicle_id: str
    seller_id: str
    promotion_type: PromotionType = PromotionType.featured
    amount: float
    status: str = "success"
    duration_days: int = 7
    safepay_tracker: Optional[str] = None
    promoted_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime = Field(default_factory=lambda: datetime.utcnow() + timedelta(days=7))
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "ad_promotions"
