from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import Field


class TrackerBooking(Document):
    provider_id:    str
    customer_id:    str
    customer_name:  str
    customer_phone: str
    device_id:      Optional[str] = None
    device_name:    str = ""
    vehicle:        str = ""
    city:           str = ""
    center:         str = ""
    address:        str = ""
    date:           str = ""
    time:           str = ""
    amount:         float = 0.0
    status:         str = "new"   # new | confirmed | installation | completed | cancelled
    created_at:     datetime = Field(default_factory=datetime.utcnow)
    updated_at:     Optional[datetime] = None

    class Settings:
        name = "tracker_bookings"
