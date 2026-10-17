from typing import Optional, List
from pydantic import BaseModel
from app.models.vehicle import VehicleCategory, FuelType, Transmission, VehicleCondition, ListingStatus


class VehicleCreate(BaseModel):
    title:            str
    make:             str
    model:            str
    variant:          Optional[str]            = None
    variants:         List[dict]               = []
    chassis_no:       Optional[str]            = None
    year:             int
    price:            float
    negotiable:       bool                     = True
    category:         VehicleCategory          = VehicleCategory.car
    condition:        VehicleCondition         = VehicleCondition.used
    mileage:          Optional[int]            = None
    fuel_type:        FuelType                 = FuelType.petrol
    transmission:     Transmission             = Transmission.manual
    engine_cc:        Optional[int]            = None
    color:            Optional[str]            = None
    description:      Optional[str]            = None
    images:           List[str]                = []
    city:             Optional[str]            = None
    province:         Optional[str]            = None
    features:         List[str]                = []
    ad_duration:      Optional[str]            = None
    contact_phone:    Optional[str]            = None
    contact_whatsapp: Optional[str]            = None
    body_type:        Optional[str]            = None
    assembly:         Optional[str]            = "Local"
    registered_city:  Optional[str]            = None


class VehicleDraftCreate(BaseModel):
    # Draft adhoora ho sakta hai — is liye sab fields optional hain.
    title:            Optional[str]             = None
    make:             Optional[str]             = None
    model:            Optional[str]             = None
    variant:          Optional[str]             = None
    variants:         Optional[List[dict]]      = None
    chassis_no:       Optional[str]             = None
    year:             Optional[int]             = None
    price:            Optional[float]           = None
    negotiable:       Optional[bool]            = None
    category:         Optional[VehicleCategory] = None
    condition:        Optional[VehicleCondition]= None
    mileage:          Optional[int]             = None
    fuel_type:        Optional[FuelType]        = None
    transmission:     Optional[Transmission]    = None
    engine_cc:        Optional[int]             = None
    color:            Optional[str]             = None
    description:      Optional[str]             = None
    images:           Optional[List[str]]       = None
    city:             Optional[str]             = None
    province:         Optional[str]             = None
    features:         Optional[List[str]]       = None
    ad_duration:      Optional[str]             = None
    contact_phone:    Optional[str]             = None
    contact_whatsapp: Optional[str]             = None
    body_type:        Optional[str]             = None
    assembly:         Optional[str]             = None
    registered_city:  Optional[str]             = None


class VehicleUpdate(BaseModel):
    title:            Optional[str]            = None
    make:             Optional[str]            = None
    model:            Optional[str]            = None
    variant:          Optional[str]            = None
    year:             Optional[int]            = None
    price:            Optional[float]          = None
    negotiable:       Optional[bool]           = None
    category:         Optional[VehicleCategory]= None
    condition:        Optional[VehicleCondition]= None
    mileage:          Optional[int]            = None
    fuel_type:        Optional[FuelType]       = None
    transmission:     Optional[Transmission]   = None
    engine_cc:        Optional[int]            = None
    color:            Optional[str]            = None
    description:      Optional[str]            = None
    images:           Optional[List[str]]      = None
    city:             Optional[str]            = None
    province:         Optional[str]            = None
    features:         Optional[List[str]]      = None
    status:           Optional[ListingStatus]  = None
    is_featured:      Optional[bool]           = None
    ad_duration:      Optional[str]            = None
    contact_phone:    Optional[str]            = None
    contact_whatsapp: Optional[str]            = None
    body_type:        Optional[str]            = None
    assembly:         Optional[str]            = None
    registered_city:  Optional[str]            = None


class StatusUpdate(BaseModel):
    status: ListingStatus


class SellerInfo(BaseModel):
    id:         str
    full_name:  str
    phone:      Optional[str] = None
    email:      Optional[str] = None
    avatar_url: Optional[str] = None
    role:       str
    created_at: Optional[str] = None


class VehicleResponse(BaseModel):
    id:               str
    seller_id:        str
    seller:           Optional[SellerInfo]  = None
    title:            str
    make:             str
    model:            str
    variant:          Optional[str]
    variants:         List[dict]            = []
    chassis_no:       Optional[str]        = None
    year:             int
    price:            float
    negotiable:       bool
    category:         str
    condition:        str
    mileage:          Optional[int]
    fuel_type:        str
    transmission:     str
    engine_cc:        Optional[int]
    color:            Optional[str]
    description:      Optional[str]
    images:           List[str]
    city:             Optional[str]
    province:         Optional[str]
    features:         List[str]
    status:           str
    is_featured:      bool
    is_saved:         bool                  = False
    views:            int
    ad_duration:      Optional[str]         = None
    contact_phone:    Optional[str]         = None
    contact_whatsapp: Optional[str]         = None
    body_type:        Optional[str]         = None
    assembly:         Optional[str]         = None
    registered_city:  Optional[str]         = None
    average_rating:   float                 = 0.0
    review_count:     int                   = 0
    created_at:       str
    expires_at:       Optional[str]         = None

    class Config:
        from_attributes = True


class VehicleListResponse(BaseModel):
    items:    List[VehicleResponse]
    total:    int
    page:     int
    limit:    int
    has_next: bool


class MyAdsStats(BaseModel):
    total:   int
    active:  int
    pending: int
    sold:    int
    expired: int
    draft:   int
