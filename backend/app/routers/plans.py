from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from app.models.subscription_plan import SubscriptionPlan
from app.models.user import User, UserRole
from app.routers.auth import get_current_user

router = APIRouter(prefix="/plans", tags=["Plans"])


class PlanCreate(BaseModel):
    name:          str
    tagline:       str             = ""
    description:   str             = ""
    monthly_price: float           = 0.0
    yearly_price:  Optional[float] = None
    features:      List[str]       = []
    role_for:      Optional[str]   = None
    is_popular:    bool            = False
    color:         str             = "#e2671b"


class PlanResponse(BaseModel):
    id:            str
    name:          str
    tagline:       str
    description:   str
    monthly_price: float
    yearly_price:  Optional[float]
    features:      List[str]
    role_for:      Optional[str]
    is_popular:    bool
    is_active:     bool
    color:         str


def _resp(p: SubscriptionPlan) -> PlanResponse:
    return PlanResponse(
        id=str(p.id),
        name=p.name,
        tagline=p.tagline,
        description=p.description,
        monthly_price=p.monthly_price,
        yearly_price=p.yearly_price,
        features=p.features,
        role_for=p.role_for,
        is_popular=p.is_popular,
        is_active=p.is_active,
        color=p.color,
    )


@router.get("/", response_model=List[PlanResponse])
async def get_plans(role: Optional[str] = Query(None)):
    query: dict = {"is_active": True}
    if role:
        query["$or"] = [{"role_for": role}, {"role_for": None}]
    plans = await SubscriptionPlan.find(query).sort("monthly_price").to_list()
    return [_resp(p) for p in plans]


@router.post("/", response_model=PlanResponse, status_code=201)
async def create_plan(
    payload: PlanCreate,
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.admin:
        raise HTTPException(403, "Admin only")
    plan = SubscriptionPlan(**payload.model_dump())
    await plan.insert()
    return _resp(plan)


@router.put("/{plan_id}", response_model=PlanResponse)
async def update_plan(
    plan_id: str,
    payload: PlanCreate,
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.admin:
        raise HTTPException(403, "Admin only")
    plan = await SubscriptionPlan.get(plan_id)
    if not plan:
        raise HTTPException(404, "Plan not found")
    for k, v in payload.model_dump().items():
        setattr(plan, k, v)
    await plan.save()
    return _resp(plan)


@router.get("/my/status")
async def my_subscription_status(
    current_user: User = Depends(get_current_user),
):
    from app.models.transaction import Transaction, TransactionStatus
    from datetime import datetime, timedelta
    txn = await Transaction.find(
        {"user_id": str(current_user.id), "subtitle": {"$regex": "Subscription"}, "status": TransactionStatus.success}
    ).sort("-created_at").first_or_none()
    if not txn:
        return {"active": False, "remaining_days": 0, "plan": None, "expires_at": None}
    expires = txn.created_at + timedelta(days=30)
    remaining = max(0, (expires - datetime.utcnow()).days)
    active = remaining > 0
    return {
        "active": active,
        "remaining_days": remaining,
        "plan": txn.subtitle,
        "expires_at": expires.isoformat(),
        "started_at": txn.created_at.isoformat(),
    }


@router.post("/{plan_id}/subscribe")
async def subscribe_plan(
    plan_id: str,
    current_user: User = Depends(get_current_user),
):
    from app.models.transaction import Transaction, TransactionStatus
    from datetime import datetime, timedelta
    # block if already active (30-day window)
    existing = await Transaction.find(
        {"user_id": str(current_user.id), "subtitle": {"$regex": "Subscription"}, "status": TransactionStatus.success}
    ).sort("-created_at").first_or_none()
    if existing:
        expires = existing.created_at + timedelta(days=30)
        if expires > datetime.utcnow():
            remaining = (expires - datetime.utcnow()).days
            raise HTTPException(400, f"Already active — {remaining} days remaining. Expires {expires.date()}")
    plan = await SubscriptionPlan.get(plan_id)
    if not plan:
        raise HTTPException(404, "Plan not found")
    amount = float(plan.monthly_price or 0)
    initials = "".join([p[0].upper() for p in (current_user.full_name or "U").split() if p])[:2] or "U"
    role_label = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    txn = Transaction(
        user_id=str(current_user.id),
        initials=initials,
        title=current_user.full_name or current_user.email,
        subtitle=f"Subscription • {plan.name} • {role_label}",
        amount=amount,
        status=TransactionStatus.success,
    )
    await txn.insert()
    return {"ok": True, "transaction_id": str(txn.id), "amount": amount}


@router.delete("/{plan_id}")
async def delete_plan(
    plan_id: str,
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.admin:
        raise HTTPException(403, "Admin only")
    plan = await SubscriptionPlan.get(plan_id)
    if not plan:
        raise HTTPException(404, "Plan not found")
    plan.is_active = False
    await plan.save()
    return {"ok": True}
