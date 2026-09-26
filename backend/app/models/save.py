from datetime import datetime
from beanie import Document
from pydantic import Field


class SavedVehicle(Document):
    user_id: str
    vehicle_id: str
    saved_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "saved_vehicles"
