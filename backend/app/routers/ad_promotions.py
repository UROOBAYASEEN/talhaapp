from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timedelta

from typing import Optional

from fastapi import Query

from app.models.user import User
from app.models.vehicle import VehicleListing, ListingStatus
from app.models.ad_promotion import AdPromotion, PromotionType
from app.models.transaction import Transaction, TransactionStatus
from app.routers.auth import get_current_user
from app.schemas.ad_promotion import (
    AdPromotionCreate,
    AdPromotionResponse,
    PaymentSuccessResponse,
)
from app.schemas.vehicle import VehicleListResponse

router = APIRouter(prefix="/ads", tags=["Ad Promotions"])


def _to_response(promo: AdPromotion) -> AdPromotionResponse:
    return AdPromotionResponse(
        id=str(promo.id),
        vehicle_id=promo.vehicle_id,
        seller_id=promo.seller_id,
        promotion_type=promo.promotion_type.value,
        amount=promo.amount,
        status=promo.status,
        duration_days=promo.duration_days,
        promoted_at=promo.promoted_at.isoformat(),
        expires_at=promo.expires_at.isoformat(),
        created_at=promo.created_at.isoformat(),
    )


@router.post("/promote", response_model=AdPromotionResponse, status_code=status.HTTP_201_CREATED)
async def initiate_promotion(
    payload: AdPromotionCreate,
    current_user: User = Depends(get_current_user),
):
    """Initiate ad promotion (create pending promotion record)"""
    vehicle = await VehicleListing.get(payload.vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    if vehicle.seller_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not your vehicle listing")

    promo = AdPromotion(
        vehicle_id=payload.vehicle_id,
        seller_id=str(current_user.id),
        promotion_type=PromotionType(payload.promotion_type),
        amount=payload.amount,
        duration_days=payload.duration_days,
        status="pending",
    )
    await promo.insert()
    return _to_response(promo)


@router.post("/{promotion_id}/payment-success", response_model=PaymentSuccessResponse)
async def payment_success(
    promotion_id: str,
    current_user: User = Depends(get_current_user),
):
    """Mark ad promotion as successful after payment"""
    promo = await AdPromotion.get(promotion_id)
    if not promo:
        raise HTTPException(status_code=404, detail="Promotion not found")

    if promo.seller_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not your promotion")

    # Update promotion status
    promo.status = "success"
    promo.promoted_at = datetime.utcnow()
    promo.expires_at = datetime.utcnow() + timedelta(days=promo.duration_days)
    await promo.save()

    # Update vehicle to mark as featured
    vehicle = await VehicleListing.get(promo.vehicle_id)
    if vehicle:
        vehicle.is_featured = True
        vehicle.updated_at = datetime.utcnow()
        await vehicle.save()

    # Create transaction record
    txn = Transaction(
        user_id=str(current_user.id),
        initials="AP",
        title="Ad Promotion",
        subtitle=f"{promo.promotion_type.value.capitalize()} promotion for {promo.duration_days} days",
        amount=promo.amount,
        status=TransactionStatus.success,
    )
    await txn.insert()

    return PaymentSuccessResponse(
        success=True,
        message="Ad promoted successfully",
        promotion_id=str(promo.id),
        vehicle_id=promo.vehicle_id,
        status="active",
    )


@router.get("/hot-selling", response_model=VehicleListResponse)
async def hot_selling_vehicles(
    category:  Optional[str] = Query(None),
    condition: Optional[str] = Query(None),
    limit:     int            = Query(10, ge=1, le=50),
):
    """Hot Selling — sirf wo vehicles jinki ads ke liye payment ho chuki ho (AdPromotion status=success & not expired). Sort by most recent payment."""
    now = datetime.utcnow()
    promos = await AdPromotion.find(
        {"status": "success", "expires_at": {"$gt": now}}
    ).sort("-promoted_at").to_list()

    # Unique vehicle_ids in payment-recency order
    seen: set[str] = set()
    ordered_ids: list[str] = []
    for p in promos:
        if p.vehicle_id not in seen:
            seen.add(p.vehicle_id)
            ordered_ids.append(p.vehicle_id)

    if not ordered_ids:
        return VehicleListResponse(items=[], total=0, page=1, limit=limit, has_next=False)

    # Fetch vehicles matching those ids
    from bson import ObjectId

    oid_list = []
    id_to_oid = {}
    for vid in ordered_ids:
        try:
            oid = ObjectId(vid)
            oid_list.append(oid)
            id_to_oid[vid] = oid
        except Exception:
            pass

    query: dict = {"_id": {"$in": oid_list}, "status": ListingStatus.active}
    if category:  query["category"]  = category
    if condition: query["condition"] = condition

    listings = await VehicleListing.find(query).to_list()

    # Map for ordering by payment recency
    order_index = {vid: i for i, vid in enumerate(ordered_ids)}
    listings.sort(key=lambda v: order_index.get(str(v.id), 9999))

    # Apply limit after filtering
    limited = listings[:limit]

    # Seller lookup
    seller_ids = list({v.seller_id for v in limited})
    sellers_map: dict = {}
    if seller_ids:
        oid_sellers = []
        for sid in seller_ids:
            try: oid_sellers.append(ObjectId(sid))
            except Exception: pass
        if oid_sellers:
            sellers_list = await User.find({"_id": {"$in": oid_sellers}}).to_list()
            sellers_map = {str(s.id): s for s in sellers_list}

    from app.routers.vehicles import _to_response as _vehicle_to_response

    items = [_vehicle_to_response(v, sellers_map.get(v.seller_id)) for v in limited]
    return VehicleListResponse(items=items, total=len(listings), page=1, limit=limit, has_next=False)


@router.get("/promotions/my", response_model=list[AdPromotionResponse])
async def my_promotions(
    current_user: User = Depends(get_current_user),
):
    """Get all promotions for current user"""
    promos = await AdPromotion.find(
        {"seller_id": str(current_user.id)}
    ).sort("-promoted_at").to_list()
    return [_to_response(p) for p in promos]


@router.get("/{vehicle_id}/promotions", response_model=list[AdPromotionResponse])
async def get_vehicle_promotions(
    vehicle_id: str,
    current_user: User = Depends(get_current_user),
):
    """Get all promotions for a specific vehicle"""
    vehicle = await VehicleListing.get(vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    if vehicle.seller_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not your vehicle")

    promos = await AdPromotion.find(
        {"vehicle_id": vehicle_id}
    ).sort("-promoted_at").to_list()
    return [_to_response(p) for p in promos]
