"""
Tracker Devices Router — /api/v1/tracker-devices
CRUD for individual tracker products listed by tracker providers.
"""
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.models.tracker_device import TrackerDevice
from app.models.user import User, UserRole
from app.models.follow import Notification
from app.routers.auth import get_current_user

router = APIRouter(prefix="/tracker-devices", tags=["Tracker Devices"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class TrackerDeviceCreate(BaseModel):
    name: str
    serial_no: str = ""
    features: List[str] = []
    price: float = 0.0
    installation_fee: float = 0.0
    monthly_fee: float = 0.0
    installation_available: bool = True
    available_cities: List[str] = []
    coverage: str = "Pakistan"
    description: str = ""
    images: List[str] = []
    is_published: bool = False


class TrackerDeviceUpdate(BaseModel):
    name: Optional[str] = None
    serial_no: Optional[str] = None
    features: Optional[List[str]] = None
    price: Optional[float] = None
    installation_fee: Optional[float] = None
    monthly_fee: Optional[float] = None
    installation_available: Optional[bool] = None
    available_cities: Optional[List[str]] = None
    coverage: Optional[str] = None
    description: Optional[str] = None
    images: Optional[List[str]] = None


class RejectPayload(BaseModel):
    reason: Optional[str] = None


def _serialize(device: TrackerDevice, provider_name: str = "", provider_avatar_url: Optional[str] = None) -> dict:
    return {
        "id":                     str(device.id),
        "provider_id":            device.provider_id,
        "provider_name":          provider_name,
        "provider_avatar_url":    provider_avatar_url,
        "name":                   device.name,
        "serial_no":              device.serial_no,
        "features":               device.features,
        "price":                  device.price,
        "installation_fee":       device.installation_fee,
        "monthly_fee":            device.monthly_fee,
        "installation_available": device.installation_available,
        "available_cities":       device.available_cities,
        "coverage":               device.coverage,
        "description":            device.description,
        "images":                 device.images,
        "is_published":           device.is_published,
        "status":                 device.status,
        "created_at":             device.created_at.isoformat(),
        "updated_at":             device.updated_at.isoformat() if device.updated_at else None,
    }


async def _get_device_or_404(device_id: str) -> TrackerDevice:
    device = await TrackerDevice.get(device_id)
    if not device:
        raise HTTPException(404, "Tracker device not found")
    return device


def _require_tracker_provider(user: User):
    if user.role != UserRole.tracker_provider:
        raise HTTPException(403, "Only tracker providers can perform this action")


def _require_admin(user: User):
    if user.role != UserRole.admin:
        raise HTTPException(403, "Admin access required")


def _require_owner(device: TrackerDevice, user: User):
    if device.provider_id != str(user.id):
        raise HTTPException(403, "You do not own this tracker device")


async def _notify_admins(title: str, body: str, data: dict):
    admins = await User.find({"role": UserRole.admin.value}).to_list()
    for admin in admins:
        await Notification(
            user_id=str(admin.id),
            type="tracker_request",
            title=title,
            body=body,
            data=data,
        ).insert()


# ── Create ────────────────────────────────────────────────────────────────────

@router.post("/", status_code=201)
async def create_tracker_device(
    payload: TrackerDeviceCreate,
    current_user: User = Depends(get_current_user),
):
    _require_tracker_provider(current_user)
    device = TrackerDevice(
        provider_id=str(current_user.id),
        **payload.model_dump(),
        status="under_review" if payload.is_published else "draft",
    )
    await device.insert()

    if payload.is_published:
        await _notify_admins(
            title="New Tracker Request",
            body=f"{current_user.full_name} has submitted '{payload.name}' for review.",
            data={"device_id": str(device.id), "provider_id": str(current_user.id)},
        )

    return _serialize(device, current_user.full_name)


# ── List published (public) ───────────────────────────────────────────────────

@router.get("/")
async def list_tracker_devices(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    city: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
):
    query: dict = {"status": "published"}

    if search:
        query["$or"] = [
            {"name":        {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
        ]
    if city:
        query["available_cities"] = {"$in": [city, "All Cities"]}
    if min_price is not None:
        query.setdefault("price", {})["$gte"] = min_price
    if max_price is not None:
        query.setdefault("price", {})["$lte"] = max_price

    skip = (page - 1) * limit
    devices = await TrackerDevice.find(query).sort("-created_at").skip(skip).limit(limit).to_list()
    result = []
    for d in devices:
        provider = await User.get(d.provider_id) if d.provider_id else None
        result.append(_serialize(d, provider.full_name if provider else "", provider.avatar_url if provider else None))
    return result


# ── Admin: all listings ───────────────────────────────────────────────────────

@router.get("/admin/all")
async def admin_list_tracker_devices(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
):
    _require_admin(current_user)
    query: dict = {}
    if status:
        query["status"] = status
    if search:
        query["$or"] = [
            {"name":        {"$regex": search, "$options": "i"}},
            {"serial_no":   {"$regex": search, "$options": "i"}},
        ]

    skip = (page - 1) * limit
    devices = await TrackerDevice.find(query).sort("-created_at").skip(skip).limit(limit).to_list()

    result = []
    for d in devices:
        provider = await User.get(d.provider_id)
        provider_name = provider.full_name if provider else "Unknown"
        provider_avatar = provider.avatar_url if provider else None
        result.append(_serialize(d, provider_name, provider_avatar))
    return result


# ── Admin: approve ────────────────────────────────────────────────────────────

@router.post("/{device_id}/approve")
async def approve_tracker_device(
    device_id: str,
    current_user: User = Depends(get_current_user),
):
    _require_admin(current_user)
    device = await _get_device_or_404(device_id)

    device.status = "published"
    device.is_published = True
    device.updated_at = datetime.utcnow()
    await device.save()

    await Notification(
        user_id=device.provider_id,
        type="tracker_approved",
        title="Tracker Approved",
        body=f"Your tracker '{device.name}' has been approved and is now live.",
        data={"device_id": device_id},
    ).insert()

    return {"message": "Tracker approved", "status": device.status}


# ── Admin: reject ─────────────────────────────────────────────────────────────

@router.post("/{device_id}/reject")
async def reject_tracker_device(
    device_id: str,
    payload: RejectPayload = RejectPayload(),
    current_user: User = Depends(get_current_user),
):
    _require_admin(current_user)
    device = await _get_device_or_404(device_id)

    device.status = "rejected"
    device.is_published = False
    device.updated_at = datetime.utcnow()
    await device.save()

    reason_text = f" Reason: {payload.reason}" if payload.reason else ""
    await Notification(
        user_id=device.provider_id,
        type="tracker_rejected",
        title="Tracker Rejected",
        body=f"Your tracker '{device.name}' was not approved.{reason_text}",
        data={"device_id": device_id, "reason": payload.reason or ""},
    ).insert()

    return {"message": "Tracker rejected", "status": device.status}


# ── My listings (owner) ───────────────────────────────────────────────────────

@router.get("/mine")
async def my_tracker_devices(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
):
    _require_tracker_provider(current_user)
    query: dict = {"provider_id": str(current_user.id)}
    if status:
        query["status"] = status
    skip = (page - 1) * limit
    devices = await TrackerDevice.find(query).sort("-created_at").skip(skip).limit(limit).to_list()
    return [_serialize(d, current_user.full_name) for d in devices]


# ── Get single ────────────────────────────────────────────────────────────────

@router.get("/{device_id}")
async def get_tracker_device(device_id: str):
    device = await _get_device_or_404(device_id)
    provider = await User.get(device.provider_id)
    provider_name = provider.full_name if provider else ""
    provider_avatar = provider.avatar_url if provider else None
    return _serialize(device, provider_name, provider_avatar)


# ── Update ────────────────────────────────────────────────────────────────────

@router.put("/{device_id}")
async def update_tracker_device(
    device_id: str,
    payload: TrackerDeviceUpdate,
    current_user: User = Depends(get_current_user),
):
    _require_tracker_provider(current_user)
    device = await _get_device_or_404(device_id)
    _require_owner(device, current_user)

    for key, val in payload.model_dump(exclude_none=True).items():
        setattr(device, key, val)
    device.updated_at = datetime.utcnow()
    await device.save()
    return _serialize(device, current_user.full_name)


# ── Delete ────────────────────────────────────────────────────────────────────

@router.delete("/{device_id}", status_code=204)
async def delete_tracker_device(
    device_id: str,
    current_user: User = Depends(get_current_user),
):
    _require_tracker_provider(current_user)
    device = await _get_device_or_404(device_id)
    _require_owner(device, current_user)
    await device.delete()


# ── Publish ───────────────────────────────────────────────────────────────────

@router.post("/{device_id}/publish")
async def publish_tracker_device(
    device_id: str,
    current_user: User = Depends(get_current_user),
):
    _require_tracker_provider(current_user)
    device = await _get_device_or_404(device_id)
    _require_owner(device, current_user)

    device.is_published = True
    device.status = "under_review"
    device.updated_at = datetime.utcnow()
    await device.save()

    await _notify_admins(
        title="New Tracker Request",
        body=f"{current_user.full_name} submitted '{device.name}' for review.",
        data={"device_id": device_id, "provider_id": str(current_user.id)},
    )

    return {"message": "Tracker submitted for review", "status": device.status}


# ── Move to draft ─────────────────────────────────────────────────────────────

@router.post("/{device_id}/draft")
async def draft_tracker_device(
    device_id: str,
    current_user: User = Depends(get_current_user),
):
    _require_tracker_provider(current_user)
    device = await _get_device_or_404(device_id)
    _require_owner(device, current_user)

    device.is_published = False
    device.status = "draft"
    device.updated_at = datetime.utcnow()
    await device.save()
    return {"message": "Tracker device moved to draft", "status": device.status}
