from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.models.user import User
from app.models.call import Call, CallStatus
from app.routers.auth import get_current_user
from app.utils.notify import push_notification

router = APIRouter(prefix="/calls", tags=["Calls"])

CALL_EXPIRY = timedelta(seconds=45)


class InitiateCallRequest(BaseModel):
    callee_id:       str
    conversation_id: Optional[str] = None


@router.post("/initiate")
async def initiate_call(
    payload: InitiateCallRequest,
    current_user: User = Depends(get_current_user),
):
    caller_id = str(current_user.id)
    callee = await User.get(payload.callee_id)
    if not callee:
        raise HTTPException(status_code=404, detail="User not found")

    # Cancel any existing pending calls from this caller
    existing = await Call.find({"caller_id": caller_id, "status": CallStatus.pending}).to_list()
    for c in existing:
        c.status   = CallStatus.ended
        c.ended_at = datetime.utcnow()
        await c.save()

    call = Call(
        caller_id=caller_id,
        callee_id=payload.callee_id,
        conversation_id=payload.conversation_id,
        caller_name=current_user.full_name,
    )
    await call.insert()

    await push_notification(
        user_id=payload.callee_id,
        type="call",
        title="Incoming Call",
        body=f"{current_user.full_name} is calling you",
        data={"call_id": str(call.id), "caller_id": caller_id, "caller_name": current_user.full_name,
              "conversation_id": payload.conversation_id or ""},
    )

    return {"call_id": str(call.id), "status": call.status}


@router.get("/incoming")
async def get_incoming_call(current_user: User = Depends(get_current_user)):
    my_id  = str(current_user.id)
    cutoff = datetime.utcnow() - CALL_EXPIRY
    call = await Call.find_one({
        "callee_id": my_id,
        "status": CallStatus.pending,
        "created_at": {"$gte": cutoff},
    })
    if not call:
        return {"call": None}
    caller = await User.get(call.caller_id)
    return {
        "call": {
            "id":          str(call.id),
            "caller_id":   call.caller_id,
            "caller_name": caller.full_name if caller else "Unknown",
            "status":      call.status,
        }
    }


@router.get("/{call_id}/status")
async def get_call_status(call_id: str, current_user: User = Depends(get_current_user)):
    call = await Call.get(call_id)
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    my_id = str(current_user.id)
    if my_id not in [call.caller_id, call.callee_id]:
        raise HTTPException(status_code=403, detail="Not authorized")
    return {"status": call.status}


@router.put("/{call_id}/accept")
async def accept_call(call_id: str, current_user: User = Depends(get_current_user)):
    call = await Call.get(call_id)
    if not call or str(current_user.id) != call.callee_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    call.status      = CallStatus.accepted
    call.answered_at = datetime.utcnow()
    await call.save()
    return {"status": call.status}


@router.put("/{call_id}/decline")
async def decline_call(call_id: str, current_user: User = Depends(get_current_user)):
    call = await Call.get(call_id)
    if not call or str(current_user.id) != call.callee_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    call.status   = CallStatus.declined
    call.ended_at = datetime.utcnow()
    await call.save()
    return {"status": call.status}


@router.put("/{call_id}/end")
async def end_call(call_id: str, current_user: User = Depends(get_current_user)):
    call = await Call.get(call_id)
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    if str(current_user.id) not in [call.caller_id, call.callee_id]:
        raise HTTPException(status_code=403, detail="Not authorized")
    call.status   = CallStatus.ended
    call.ended_at = datetime.utcnow()
    await call.save()
    return {"status": call.status}
