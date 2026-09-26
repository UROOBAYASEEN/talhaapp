from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import Field


class VehicleReview(Document):
    vehicle_id: str
    reviewer_id: str
    reviewer_name: str
    rating: float          # 1-5
    comment: Optional[str] = None
    created_at: datetime   = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "vehicle_reviews"


class DealerReview(Document):
    dealer_id: str
    reviewer_id: str
    reviewer_name: str
    rating: float          # 1-5
    comment: Optional[str] = None
    created_at: datetime   = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "dealer_reviews"


class AdReport(Document):
    vehicle_id:  str
    reporter_id: str
    reason:      str
    description: Optional[str] = None
    created_at:  datetime      = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "ad_reports"
