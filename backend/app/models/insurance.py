from datetime import datetime
from typing import List, Optional
from beanie import Document
from pydantic import Field
import enum


class ClaimStatus(str, enum.Enum):
    draft     = "draft"
    submitted = "submitted"
    reviewing = "reviewing"
    approved  = "approved"
    rejected  = "rejected"


class PaymentStatus(str, enum.Enum):
    pending   = "pending"
    completed = "completed"
    failed    = "failed"
    refunded  = "refunded"


class PaymentMethod(str, enum.Enum):
    card      = "card"
    jazzcash  = "jazzcash"
    easypaisa = "easypaisa"


# ── Insurance Plan (seeded / admin-managed) ────────────────────────────────
class InsurancePlan(Document):
    company_name:     str
    rating:           float = 4.5
    claim_percentage: int   = 96          # e.g. 96 means "Claim 96%"
    annual_rate:      float = 1.25        # percentage of vehicle value
    annual_premium:   float = 83344       # PKR
    badge:            Optional[str] = None   # "Best Coverage", "Lowest Premium"
    features:         List[str] = []
    is_active:        bool  = True
    created_at:       datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "insurance_plans"


# ── Insurance Claim (vehicle info step) ───────────────────────────────────
class InsuranceClaim(Document):
    user_id:             str
    brand:               str
    model:               str
    year:                int
    estimated_value:     float
    registered:          bool = True
    registration_city:   str
    registration_number: str
    photos:              List[str] = []       # file URLs / base64 keys
    status:              ClaimStatus = ClaimStatus.draft
    created_at:          datetime = Field(default_factory=datetime.utcnow)
    updated_at:          Optional[datetime] = None

    class Settings:
        name = "insurance_claims"


# ── Insurance Application (applicant info + plan selection) ───────────────
class InsuranceApplication(Document):
    claim_id:       str
    plan_id:        str
    user_id:        str
    full_name:      str
    cnic:           str
    phone:          str
    email:          str
    preferred_date: Optional[str] = None
    preferred_time: Optional[str] = None
    address:        str
    has_tracker:    bool = False
    selected_addons: List[str] = Field(default_factory=list)
    status:         ClaimStatus = ClaimStatus.submitted
    created_at:     datetime = Field(default_factory=datetime.utcnow)
    updated_at:     Optional[datetime] = None

    class Settings:
        name = "insurance_applications"


# ── Insurance Document Upload ──────────────────────────────────────────────
class InsuranceDocument(Document):
    claim_id:   str
    user_id:    str
    doc_type:   str              # "CNIC", "RegBook", "Invoice", "Insurance"
    file_url:   str
    is_optional: bool = False
    status:     str  = "pending"    # pending / verified / rejected
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "insurance_documents"


# ── Insurance Payment ─────────────────────────────────────────────────────
class InsurancePayment(Document):
    application_id: str
    user_id:        str
    plan_id:        str
    amount:         float
    method:         PaymentMethod
    status:         PaymentStatus = PaymentStatus.pending
    transaction_id: Optional[str] = None
    policy_number:  Optional[str] = None
    created_at:     datetime = Field(default_factory=datetime.utcnow)
    updated_at:     Optional[datetime] = None

    class Settings:
        name = "insurance_payments"
