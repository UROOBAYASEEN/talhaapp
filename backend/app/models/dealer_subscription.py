import enum
from datetime import datetime, timedelta
from typing import Optional
from beanie import Document
from pydantic import Field


class DealerPlan(str, enum.Enum):
    basic      = "basic"
    premium    = "premium"
    enterprise = "enterprise"


class SubStatus(str, enum.Enum):
    active    = "active"
    expired   = "expired"
    cancelled = "cancelled"


# Max active vehicle listings per plan
PLAN_LIMITS: dict[str, int] = {
    DealerPlan.basic:      5,
    DealerPlan.premium:    -1,   # -1 = unlimited
    DealerPlan.enterprise: -1,
}

EXTRA_AD_FEE = 500.0   # PKR per extra ad beyond basic limit


class DealerSubscription(Document):
    dealer_id:  str
    plan:       DealerPlan  = DealerPlan.basic
    status:     SubStatus   = SubStatus.active
    amount:     float       = 0.0
    created_at: datetime    = Field(default_factory=datetime.utcnow)
    expires_at: datetime    = Field(default_factory=lambda: datetime.utcnow() + timedelta(days=30))

    class Settings:
        name = "dealer_subscriptions"
