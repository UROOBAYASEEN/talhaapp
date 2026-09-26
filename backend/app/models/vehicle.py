import enum
from datetime import datetime
from typing import Optional, List
from beanie import Document
from pydantic import Field


class VehicleCategory(str, enum.Enum):
    car = "car"
    bike = "bike"
    truck = "truck"
    van = "van"
    bus = "bus"


class FuelType(str, enum.Enum):
    petrol = "petrol"
    diesel = "diesel"
    electric = "electric"
    hybrid = "hybrid"
    cng = "cng"


class Transmission(str, enum.Enum):
    automatic = "automatic"
    manual = "manual"


class VehicleCondition(str, enum.Enum):
    new = "new"
    used = "used"


class ListingStatus(str, enum.Enum):
    active  = "active"
    sold    = "sold"
    draft   = "draft"
    pending = "pending"
    expired = "expired"


class VehicleVariant(Document):
    pass


class VehicleListing(Document):
    seller_id:        str
    title:            str
    make:             str
    model:            str
    variant:          Optional[str]  = None
    variants:         List[dict]     = []
    year:             int
    price:            float
    negotiable:       bool           = True
    category:         VehicleCategory   = VehicleCategory.car
    condition:        VehicleCondition  = VehicleCondition.used
    mileage:          Optional[int]  = None
    fuel_type:        FuelType       = FuelType.petrol
    transmission:     Transmission   = Transmission.manual
    engine_cc:        Optional[int]  = None
    color:            Optional[str]  = None
    description:      Optional[str]  = None
    images:           List[str]      = []
    city:             Optional[str]  = None
    province:         Optional[str]  = None
    features:         List[str]      = []
    status:           ListingStatus  = ListingStatus.active
    is_featured:      bool           = False
    views:            int            = 0
    ad_duration:      Optional[str]  = None
    contact_phone:    Optional[str]  = None
    contact_whatsapp: Optional[str]  = None
    body_type:        Optional[str]  = None
    assembly:         Optional[str]  = "Local"
    registered_city:  Optional[str]  = None
    chassis_no:       Optional[str]  = None
    average_rating:   float          = 0.0
    review_count:     int            = 0
    created_at:       datetime       = Field(default_factory=datetime.utcnow)
    updated_at:       Optional[datetime] = None
    expires_at:       Optional[datetime] = None

    class Settings:
        name = "vehicle_listings"


class Reservation(Document):
    vehicle_id:    str
    user_id:       str
    variant_name:  Optional[str] = None
    full_name:     Optional[str] = None
    phone:         Optional[str] = None
    city:          Optional[str] = None
    cnic:          Optional[str] = None
    notes:         Optional[str] = None
    status:        str           = "pending"
    created_at:    datetime      = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "reservations"


class TestDrive(Document):
    vehicle_id:     str
    user_id:        str
    preferred_date: Optional[str] = None
    preferred_time: Optional[str] = None
    full_name:      Optional[str] = None
    phone:          Optional[str] = None
    status:         str           = "pending"
    created_at:     datetime      = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "test_drives"
