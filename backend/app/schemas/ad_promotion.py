from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AdPromotionCreate(BaseModel):
    vehicle_id: str
    promotion_type: str = "featured"
    amount: float
    duration_days: int = 7


class AdPromotionResponse(BaseModel):
    id: str
    vehicle_id: str
    seller_id: str
    promotion_type: str
    amount: float
    status: str
    duration_days: int
    promoted_at: str
    expires_at: str
    created_at: str


class PaymentSuccessResponse(BaseModel):
    success: bool
    message: str
    promotion_id: str
    vehicle_id: str
    status: str
