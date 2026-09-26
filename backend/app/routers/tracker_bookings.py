"""
Tracker Bookings Router — /api/v1/tracker-bookings
Customer saves booking after payment; tracker provider sees claims.
"""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.models.tracker_booking import TrackerBooking
from app.models.user import User, UserRole
from app.routers.auth import get_current_user
from app.utils.notify import push_notification

router = APIRouter(prefix="/tracker-bookings", tags=["Tracker Bookings"])


class BookingCreate(BaseModel):
    provider_id:    str
    device_id:      Optional[str] = None
    device_name:    str = ""
    vehicle:        str = ""
    city:           str = ""
    center:         str = ""
    address:        str = ""
    date:           str = ""
    time:           str = ""
    amount:         float = 0.0


class StatusUpdate(BaseModel):
    status: str


async def _serialize(b: TrackerBooking) -> dict:
    avatar = None
    try:
        u = None
        try:
            u = await User.get(b.customer_id)
        except Exception:
            pass
        if not u:
            # fallback for string ObjectId
            from beanie import PydanticObjectId
            try:
                u = await User.get(PydanticObjectId(b.customer_id))
            except Exception:
                u = await User.find_one({"_id": PydanticObjectId(b.customer_id)})
        if u:
            avatar = u.avatar_url
    except Exception as e:
        print(f"==== AVATAR LOOKUP ERROR {b.customer_id}: {e} ====")
        pass
    return {
        "id":                  str(b.id),
        "provider_id":         b.provider_id,
        "customer_id":         b.customer_id,
        "customer_name":       b.customer_name,
        "customer_phone":      b.customer_phone,
        "customer_avatar_url": avatar,
        "device_id":           b.device_id,
        "device_name":         b.device_name,
        "vehicle":             b.vehicle,
        "city":                b.city,
        "center":              b.center,
        "address":             b.address,
        "date":                b.date,
        "time":                b.time,
        "amount":              b.amount,
        "status":              b.status,
        "created_at":          b.created_at.isoformat(),
    }


# ── Customer creates booking after payment ───────────────────────────────────

@router.post("/", status_code=201)
async def create_booking(
    payload: BookingCreate,
    current_user: User = Depends(get_current_user),
):
    booking = TrackerBooking(
        provider_id=payload.provider_id,
        customer_id=str(current_user.id),
        customer_name=current_user.full_name,
        customer_phone=current_user.phone or "",
        **payload.model_dump(exclude={"provider_id"}),
    )
    await booking.insert()
    return await _serialize(booking)


# ── Provider sees their claims ────────────────────────────────────────────────

@router.get("/mine")
async def my_bookings(
    page:   int = Query(1, ge=1),
    limit:  int = Query(50, ge=1, le=100),
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.tracker_provider:
        raise HTTPException(403, "Only tracker providers can access this")
    query: dict = {"provider_id": str(current_user.id)}
    if status:
        query["status"] = status
    skip = (page - 1) * limit
    bookings = await TrackerBooking.find(query).sort("-created_at").skip(skip).limit(limit).to_list()
    return [await _serialize(b) for b in bookings]


# ── Customer sees their bookings ──────────────────────────────────────────────

@router.get("/my-orders")
async def my_orders(
    current_user: User = Depends(get_current_user),
):
    bookings = await TrackerBooking.find({"customer_id": str(current_user.id)}).sort("-created_at").to_list()
    return [await _serialize(b) for b in bookings]


# ── Get single booking ───────────────────────────────────────────────────────

@router.get("/{booking_id}")
async def get_booking(
    booking_id: str,
    current_user: User = Depends(get_current_user),
):
    booking = await TrackerBooking.get(booking_id)
    if not booking:
        raise HTTPException(404, "Booking not found")
    if booking.provider_id != str(current_user.id) and booking.customer_id != str(current_user.id):
        raise HTTPException(403, "Access denied")
    return await _serialize(booking)


# ── Provider updates status ───────────────────────────────────────────────────

@router.put("/{booking_id}/status")
async def update_status(
    booking_id: str,
    payload: StatusUpdate,
    current_user: User = Depends(get_current_user),
):
    booking = await TrackerBooking.get(booking_id)
    if not booking:
        raise HTTPException(404, "Booking not found")
    if booking.provider_id != str(current_user.id):
        raise HTTPException(403, "Not your booking")
    valid = {"new", "confirmed", "installation", "completed", "cancelled"}
    if payload.status not in valid:
        raise HTTPException(400, f"Status must be one of: {valid}")
    booking.status = payload.status
    booking.updated_at = datetime.utcnow()
    await booking.save()
    # Notify customer
    try:
        titles = {
            "confirmed": "Order Confirmed ✓",
            "installation": "Installation Started",
            "completed": "Installation Completed ✓",
            "cancelled": "Order Cancelled",
            "new": "Booking Updated",
        }
        title = titles.get(payload.status, "Booking Updated")
        body_map = {
            "confirmed": f"Your {booking.device_name} order has been confirmed by provider.",
            "installation": f"Installation for {booking.device_name} is now in progress.",
            "completed": f"Installation for {booking.device_name} completed successfully.",
            "cancelled": f"Your {booking.device_name} order was cancelled by provider.",
        }
        body = body_map.get(payload.status, f"Your booking status is now {payload.status}.")
        await push_notification(
            user_id=booking.customer_id,
            type="tracker",
            title=title,
            body=body,
            data={"booking_id": str(booking.id), "status": payload.status, "device_name": booking.device_name, "provider_id": booking.provider_id},
        )
    except Exception as e:
        print(f"==== TRACKER NOTIFY ERROR: {e} ====")
    return await _serialize(booking)
