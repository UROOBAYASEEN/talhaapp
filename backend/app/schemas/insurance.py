from typing import List, Optional
from pydantic import BaseModel


# ── Plan ───────────────────────────────────────────────────────────────────
class PlanResponse(BaseModel):
    id:               str
    company_name:     str
    rating:           float
    claim_percentage: int
    annual_rate:      float
    annual_premium:   float
    badge:            Optional[str] = None
    features:         List[str] = []

    class Config:
        from_attributes = True


# ── Claim (vehicle info) ───────────────────────────────────────────────────
class ClaimCreate(BaseModel):
    brand:               str
    model:               str
    year:                int
    estimated_value:     float
    registered:          bool = True
    registration_city:   str
    registration_number: str
    photos:              List[str] = []


class ClaimResponse(BaseModel):
    id:                  str
    user_id:             str
    brand:               str
    model:               str
    year:                int
    estimated_value:     float
    registered:          bool
    registration_city:   str
    registration_number: str
    photos:              List[str]
    status:              str
    created_at:          str

    class Config:
        from_attributes = True


# ── Application (applicant info) ───────────────────────────────────────────
class ApplicationCreate(BaseModel):
    claim_id:       str
    plan_id:        str
    full_name:      str
    cnic:           str
    phone:          str
    email:          str
    preferred_date: Optional[str] = None
    preferred_time: Optional[str] = None
    address:        str
    has_tracker:    Optional[bool] = False
    selected_addons: Optional[List[str]] = None


class ApplicationResponse(BaseModel):
    id:             str
    claim_id:       str
    plan_id:        str
    user_id:        str
    full_name:      str
    cnic:           str
    phone:          str
    email:          str
    preferred_date: Optional[str]
    preferred_time: Optional[str]
    address:        str
    has_tracker:    bool = False
    selected_addons: List[str] = []
    status:         str
    created_at:     str

    class Config:
        from_attributes = True


# ── Document ───────────────────────────────────────────────────────────────
class DocumentUpload(BaseModel):
    claim_id:    str
    doc_type:    str
    file_url:    str
    is_optional: bool = False


class DocumentResponse(BaseModel):
    id:          str
    claim_id:    str
    doc_type:    str
    file_url:    str
    is_optional: bool
    status:      str
    created_at:  str

    class Config:
        from_attributes = True


# ── Payment ────────────────────────────────────────────────────────────────
class PaymentCreate(BaseModel):
    application_id: str
    plan_id:        str
    amount:         float
    method:         str   # card / jazzcash / easypaisa


class PaymentResponse(BaseModel):
    id:             str
    application_id: str
    plan_id:        str
    user_id:        str
    amount:         float
    method:         str
    status:         str
    transaction_id: Optional[str]
    policy_number:  Optional[str]
    created_at:     str

    class Config:
        from_attributes = True
