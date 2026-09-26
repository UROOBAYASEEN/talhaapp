from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.models.user import User
from app.models.document import UserDocument
from app.routers.auth import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])

ONLINE_THRESHOLD = timedelta(minutes=2)


@router.put("/heartbeat")
async def heartbeat(current_user: User = Depends(get_current_user)):
    current_user.last_seen = datetime.utcnow()
    await current_user.save()
    return {"ok": True}


@router.get("/{user_id}/documents")
async def get_user_documents(
    user_id: str,
    current_user: User = Depends(get_current_user),
):
    """Get documents of a specific user — accessible by dealers/admins to view customer docs."""
    docs = await UserDocument.find({"user_id": user_id}).to_list()
    return [
        {
            "id":          str(d.id),
            "type":        d.type,
            "desc":        d.desc,
            "file_url":    d.file_url,
            "status":      d.status.value,
            "uploaded_at": d.uploaded_at.strftime("%d %b %Y") if d.uploaded_at else None,
        }
        for d in docs
    ]


@router.get("/{user_id}/status")
async def get_user_status(user_id: str, current_user: User = Depends(get_current_user)):
    user = await User.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    is_online = (
        user.last_seen is not None
        and (datetime.utcnow() - user.last_seen) < ONLINE_THRESHOLD
    )
    return {
        "user_id": user_id,
        "is_online": is_online,
        "last_seen": user.last_seen.isoformat() if user.last_seen else None,
    }


class BusinessInfoRequest(BaseModel):
    business_category: str
    city:              str
    store_name:        str
    business_address:  str
    ntn:               Optional[str] = None


class StoreDesignRequest(BaseModel):
    logo_url:   Optional[str] = None
    banner_url: Optional[str] = None
    about:      Optional[str] = None


@router.post("/me/business-info")
async def save_business_info(
    payload: BusinessInfoRequest,
    current_user: User = Depends(get_current_user),
):
    current_user.city              = payload.city
    current_user.dealership_name   = payload.store_name
    current_user.business_category = payload.business_category
    current_user.business_address  = payload.business_address
    current_user.ntn_number        = payload.ntn
    current_user.updated_at        = datetime.utcnow()
    await current_user.save()
    return {"message": "Business info saved", "city": current_user.city, "store_name": current_user.dealership_name}


@router.post("/me/store-design")
async def save_store_design(
    payload: StoreDesignRequest,
    current_user: User = Depends(get_current_user),
):
    if payload.logo_url:
        current_user.avatar_url = payload.logo_url
    if payload.banner_url:
        current_user.cover_photo_url = payload.banner_url
    if payload.about:
        current_user.bio = payload.about
    current_user.updated_at = datetime.utcnow()
    await current_user.save()
    return {"message": "Store design saved"}


class SubmitDocumentsRequest(BaseModel):
    cnic_front: Optional[str] = None
    cnic_back: Optional[str] = None
    business_registration: Optional[str] = None
    store_photo: Optional[str] = None
    avatar: Optional[str] = None
    cover_photo: Optional[str] = None
    license: Optional[str] = None


@router.post("/me/documents")
async def submit_documents(
    payload: SubmitDocumentsRequest,
    current_user: User = Depends(get_current_user),
):
    doc_map = {
        "cnic_front":             (payload.cnic_front,             "CNIC Front"),
        "cnic_back":              (payload.cnic_back,              "CNIC Back"),
        "business_registration":  (payload.business_registration,  "Business Registration"),
        "store_photo":            (payload.store_photo,            "Store Photo"),
        "license":                (payload.license,                "License"),
    }

    uid = str(current_user.id)
    for dtype, (url, desc) in doc_map.items():
        if url:
            await UserDocument.find({"user_id": uid, "type": dtype}).delete()
            await UserDocument(
                user_id=uid,
                type=dtype,
                desc=desc,
                file_url=url,
                uploaded_at=datetime.utcnow(),
            ).insert()

    if payload.avatar:
        current_user.avatar_url = payload.avatar
    if payload.cover_photo:
        current_user.cover_photo_url = payload.cover_photo

    current_user.docs_status = "pending"
    await current_user.save()

    return {"message": "Documents submitted successfully", "docs_status": "pending"}
