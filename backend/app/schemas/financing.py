from typing import List, Optional
from pydantic import BaseModel


class BankResponse(BaseModel):
    id:            str
    name:          str
    product_name:  str
    bank_type:     str
    markup_type:   str
    avg_markup:    str
    rating:        float
    reviews_count: int
    processing_fee:   float
    security_deposit: float
    avatar_url:    Optional[str] = None


class ApplicationCreate(BaseModel):
    vehicle_type:   str = "car"
    condition:      str = "new"
    brand:          str = ""
    car_model:      str = ""
    variant:        str = ""
    color:          str = ""
    year:           str = ""
    city:           str = ""
    dealership:     str = ""
    vehicle_price:  float = 0
    down_payment:   float = 0
    tenure_years:   int   = 5
    monthly_income: float = 0
    full_name:      str = ""
    cnic:           str = ""
    employment_type:str = ""
    bank_id:        Optional[str] = None
    bank_name:      str = ""
    bank_product:   str = ""
    rate_type:      str = "variable"
    vehicle_image:  Optional[str] = None


class ApplicationResponse(BaseModel):
    id:                  str
    user_id:             str
    reference_no:        str
    vehicle_type:        str
    condition:           str
    brand:               str
    car_model:           str
    variant:             str
    color:               str
    year:                str
    city:                str
    vehicle_price:       float
    down_payment:        float
    tenure_years:        int
    monthly_income:      float
    full_name:           str
    cnic:                str
    employment_type:     str
    bank_name:           str
    bank_product:        str
    rate_type:           str
    loan_amount:         float
    monthly_installment: float
    markup_rate:         float
    documents:           List[str]
    status:              str
    created_at:          str
    vehicle_image:       Optional[str] = None
    applicant_avatar:    Optional[str] = None
    applicant_phone:     Optional[str] = None
    applicant_email:     Optional[str] = None


class DocumentUpload(BaseModel):
    application_id: str
    doc_type:       str
    file_url:       str


class DocumentResponse(BaseModel):
    id:             str
    application_id: str
    doc_type:       str
    file_url:       str
    status:         str
    created_at:     str


class StatusUpdate(BaseModel):
    status: str
