from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from typing import Optional, List
from app.models.transaction import Transaction, TransactionStatus
from app.routers.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/transactions", tags=["Transactions"])


class TransactionResponse(BaseModel):
    id:         str
    initials:   str
    title:      str
    subtitle:   str
    amount:     float
    status:     str
    time:       str


def _to_response(t: Transaction) -> TransactionResponse:
    from datetime import datetime, timezone
    now  = datetime.now(timezone.utc)
    diff = now - t.created_at.replace(tzinfo=timezone.utc)
    days = diff.days
    if days == 0:
        time_str = f"{diff.seconds // 3600}h ago" if diff.seconds >= 3600 else f"{diff.seconds // 60}m ago"
    else:
        time_str = f"{days}d ago"

    return TransactionResponse(
        id=str(t.id),
        initials=t.initials,
        title=t.title,
        subtitle=t.subtitle,
        amount=t.amount,
        status=t.status.value,
        time=time_str,
    )


@router.get("/", response_model=List[TransactionResponse])
async def get_transactions(
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
):
    query: dict = {"user_id": str(current_user.id)}
    if status:
        query["status"] = status
    txns = await Transaction.find(query).sort("-created_at").to_list()
    return [_to_response(t) for t in txns]
