import enum
from datetime import datetime
from typing import List, Optional

from beanie import Document
from pydantic import Field


class UserRole(str, enum.Enum):
    admin = "admin"
    customer = "customer"
    bank_representative = "bank_representative"
    dealership_owner = "dealership_owner"
    individual_seller = "individual_seller"
    insurance_provider = "insurance_provider"
    tracker_provider = "tracker_provider"


class User(Document):
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    cnic: Optional[str] = None
    hashed_password: Optional[str] = None
    google_id: Optional[str] = None
    role: UserRole = UserRole.customer
    is_verified: bool = False
    is_active: bool = True
    # Profile fields
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    city: Optional[str] = None
    last_seen:  Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    # Business info (registration flow)
    business_category: Optional[str] = None
    business_address:  Optional[str] = None
    ntn_number:        Optional[str] = None
    # Document verification
    docs_status: Optional[str] = None          # pending | approved | rejected
    docs_rejection_reason: Optional[str] = None
    # Admin-set listing limits (None = plan default, -1 = unlimited)
    inventory_limit: Optional[int] = None       # free vehicle ads allowed
    tracker_limit: Optional[int] = None         # tracker devices allowed
    # Office / gallery photos
    office_photos: List[str] = []
    # Dealership-specific fields (only for dealership_owner role)
    dealership_name: Optional[str] = None
    cover_photo_url: Optional[str] = None
    location: Optional[str] = None
    working_hours: Optional[str] = None
    established_year: Optional[int] = None
    website: Optional[str] = None

    class Settings:
        name = "users"


class OTPRecord(Document):
    phone: str
    otp_code: str
    purpose: str
    is_used: bool = False
    expires_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "otp_records"
