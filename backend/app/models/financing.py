from datetime import datetime
from typing import List, Optional
from beanie import Document
from pydantic import Field
import enum


class FinancingStatus(str, enum.Enum):
    draft      = "draft"
    submitted  = "submitted"
    reviewing  = "reviewing"
    approved   = "approved"
    rejected   = "rejected"


class EmploymentType(str, enum.Enum):
    salaried    = "Salaried"
    business    = "Business"
    agriculture = "Agriculture"
    rental      = "Rental"
    other       = "Other"


# ── Bank (linked to bank_representative user) ────────────────────────────────
class FinancingBank(Document):
    user_id:       Optional[str] = None   # linked bank_representative user
    name:          str
    product_name:  str
    bank_type:     str = "Conventional"
    markup_type:   str = "Reducing balance"
    avg_markup:    str = "16.00%"
    rating:        float = 4.5
    reviews_count: int   = 0
    processing_fee:      float = 12_000
    security_deposit:    float = 15_000
    avatar_url:    Optional[str] = None
    is_active:     bool  = True
    created_at:    datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "financing_banks"


# ── Financing Application ─────────────────────────────────────────────────────
class FinancingApplication(Document):
    user_id:         str
    reference_no:    str = ""

    # Step 1 — Vehicle & Loan
    vehicle_type:    str = "car"          # car | bike
    condition:       str = "new"          # new | used
    brand:           str = ""
    car_model:       str = ""
    variant:         str = ""
    color:           str = ""
    year:            str = ""
    city:            str = ""
    dealership:      str = ""
    vehicle_price:   float = 0
    down_payment:    float = 0
    tenure_years:    int   = 5
    monthly_income:  float = 0

    # Step 2 — Applicant
    full_name:       str = ""
    cnic:            str = ""

    # Step 3 — Employment
    employment_type: str = ""

    # Bank selection
    bank_id:         Optional[str] = None
    bank_name:       str = ""
    bank_product:    str = ""
    rate_type:       str = "variable"     # variable | fixed

    # Vehicle image (selected from picker)
    vehicle_image:   Optional[str] = None

    # Calculated
    loan_amount:         float = 0
    monthly_installment: float = 0
    markup_rate:         float = 13.9

    # Documents
    documents: List[str] = []            # file URLs

    status:     FinancingStatus = FinancingStatus.draft
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Settings:
        name = "financing_applications"


# ── Financing Document ────────────────────────────────────────────────────────
class FinancingDocument(Document):
    application_id: str
    user_id:        str
    doc_type:       str       # "CNIC" | "SalarySlip" | "BankStatement" | "UtilityBill"
    file_url:       str
    status:         str = "pending"   # pending | verified | rejected
    created_at:     datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "financing_documents"
