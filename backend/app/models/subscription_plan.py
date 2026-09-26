from datetime import datetime
from typing import Optional, List
from beanie import Document
from pydantic import Field


class SubscriptionPlan(Document):
    name:          str
    tagline:       str             = ""
    description:   str             = ""
    monthly_price: float           = 0.0
    yearly_price:  Optional[float] = None
    features:      List[str]       = []
    role_for:      Optional[str]   = None   # "dealer","bank","insurance","tracker","seller",None=all
    is_popular:    bool            = False
    is_active:     bool            = True
    color:         str             = "#e2671b"
    created_at:    datetime        = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "subscription_plans"
