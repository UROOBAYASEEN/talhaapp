from datetime import datetime
from typing import List, Optional

from beanie import Document
from pydantic import Field


class TrackerDevice(Document):
    provider_id: str
    name: str
    serial_no: str = ""
    features: List[str] = []
    price: float = 0.0
    installation_fee: float = 0.0
    monthly_fee: float = 0.0
    installation_available: bool = True
    available_cities: List[str] = []
    coverage: str = "Pakistan"
    description: str = ""
    images: List[str] = []
    is_published: bool = False
    status: str = "draft"          # draft | under_review | published
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Settings:
        name = "tracker_devices"
