import re
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, Request

from app.models.user import User
from app.models.vehicle import VehicleListing, ListingStatus, Reservation, TestDrive
from app.models.save import SavedVehicle
from app.routers.auth import get_current_user
from app.schemas.vehicle import (
    VehicleCreate,
    VehicleListResponse,
    VehicleResponse,
    VehicleUpdate,
    StatusUpdate,
    SellerInfo,
    MyAdsStats,
)

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])

AD_DURATION_DAYS = {"1 week": 7, "2 weeks": 14, "4 weeks": 28, "6 weeks": 42}


def _to_response(v: VehicleListing, seller: Optional[User] = None) -> VehicleResponse:
    seller_info = None
    if seller:
        seller_info = SellerInfo(
            id=str(seller.id),
            full_name=seller.full_name,
            phone=seller.phone,
            email=seller.email,
            avatar_url=seller.avatar_url,
            role=seller.role.value,
            created_at=seller.created_at.isoformat() if seller.created_at else None,
        )
    return VehicleResponse(
        id=str(v.id),
        seller_id=v.seller_id,
        seller=seller_info,
        title=v.title,
        make=v.make,
        model=v.model,
        variant=v.variant,
        variants=v.variants or [],
        chassis_no=getattr(v, 'chassis_no', None),
        year=v.year,
        price=v.price,
        negotiable=v.negotiable,
        category=v.category.value,
        condition=v.condition.value,
        mileage=v.mileage,
        fuel_type=v.fuel_type.value,
        transmission=v.transmission.value,
        engine_cc=v.engine_cc,
        color=v.color,
        description=v.description,
        images=v.images,
        city=v.city,
        province=v.province,
        features=v.features,
        status=v.status.value,
        is_featured=v.is_featured,
        views=v.views,
        ad_duration=v.ad_duration,
        contact_phone=v.contact_phone,
        contact_whatsapp=v.contact_whatsapp,
        body_type=v.body_type,
        assembly=v.assembly,
        registered_city=v.registered_city,
        average_rating=v.average_rating,
        review_count=v.review_count,
        created_at=v.created_at.isoformat(),
        expires_at=v.expires_at.isoformat() if v.expires_at else None,
    )


# ── Create listing ─────────────────────────────────────────────────────────

@router.post("/", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
async def create_listing(
    payload: VehicleCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
):
    from fastapi import Request as FastAPIRequest
    from app.models.dealer_subscription import DealerSubscription, PLAN_LIMITS, DealerPlan

    # ── Check plan ad limit for dealership & non-dealership (individual) ──
    if current_user.role.value in ("dealership_owner", "individual_seller"):
        sub = await DealerSubscription.find_one({"dealer_id": str(current_user.id), "status": "active"})
        plan     = sub.plan if sub else DealerPlan.basic
        limit    = PLAN_LIMITS.get(plan, 5)
        # Admin-set per-user limit overrides the plan (None = plan default)
        if current_user.inventory_limit is not None:
            limit = current_user.inventory_limit

        if limit != -1:   # -1 = unlimited
            active_count = await VehicleListing.find(
                {"seller_id": str(current_user.id), "status": {"$in": ["active", "pending"]}}
            ).count()
            if active_count >= limit:
                extra_paid = False
                try:
                    # FastAPI Request injected as second arg (could be Request instance)
                    if hasattr(request, 'headers'):
                        extra_paid = request.headers.get('x-extra-paid') == 'true' or request.headers.get('X-Extra-Paid') == 'true'
                except Exception:
                    pass
                if not extra_paid:
                    raise HTTPException(
                        status_code=402,
                        detail={
                            "code":        "AD_LIMIT_REACHED",
                            "plan":        plan.value,
                            "limit":       limit,
                            "used":        active_count,
                            "extra_fee":   500,
                            "message":     f"You have reached your {limit}-ad limit on the {plan.value} plan.",
                        }
                    )

    data = payload.model_dump()
    expires_at = None
    if payload.ad_duration and payload.ad_duration in AD_DURATION_DAYS:
        expires_at = datetime.utcnow() + timedelta(days=AD_DURATION_DAYS[payload.ad_duration])

    # Sell flow: admin approval required — create as pending so it appears in admin Ads list
    if "status" not in data or data.get("status") in (None, "", "active"):
        data["status"] = ListingStatus.pending
    listing = VehicleListing(
        seller_id=str(current_user.id),
        expires_at=expires_at,
        **data,
    )
    await listing.insert()
    return _to_response(listing, current_user)


# ── List all active vehicles (public) ─────────────────────────────────────

@router.get("/", response_model=VehicleListResponse)
async def list_vehicles(
    page:         int            = Query(1, ge=1),
    limit:        int            = Query(20, ge=1, le=100),
    category:     Optional[str] = None,
    condition:    Optional[str] = None,
    min_price:    Optional[float] = None,
    max_price:    Optional[float] = None,
    city:         Optional[str] = None,
    make:         Optional[str] = None,
    model:        Optional[str] = None,
    year:         Optional[int] = None,
    variant:      Optional[str] = None,
    color:        Optional[str] = None,
    transmission: Optional[str] = None,
    fuel_type:    Optional[str] = None,
    body_type:    Optional[str] = None,
    seller_type:  Optional[str] = None,
    seller_id:    Optional[str] = None,
    search:       Optional[str] = None,
    featured:     Optional[bool] = None,
):
    query: dict = {"status": ListingStatus.active}
    if category:     query["category"]     = category
    if condition:    query["condition"]    = condition
    if city:         query["city"]         = {"$regex": city, "$options": "i"}
    if make:         query["make"]         = {"$regex": make, "$options": "i"}
    if model:        query["model"]        = {"$regex": model, "$options": "i"}
    if year:         query["year"]         = year
    if variant:      query["variant"]      = {"$regex": variant, "$options": "i"}
    if color:        query["color"]        = {"$regex": color, "$options": "i"}
    if transmission: query["transmission"] = {"$regex": transmission, "$options": "i"}
    if fuel_type:    query["fuel_type"]    = {"$regex": f"^{re.escape(fuel_type)}$", "$options": "i"}
    if body_type:    query["body_type"]    = {"$regex": body_type, "$options": "i"}
    if seller_id:    query["seller_id"]   = seller_id
    if featured is not None: query["is_featured"] = featured

    if min_price is not None or max_price is not None:
        price_q: dict = {}
        if min_price is not None: price_q["$gte"] = min_price
        if max_price is not None: price_q["$lte"] = max_price
        query["price"] = price_q

    if seller_type and seller_type.lower() not in ("all", "all (dealership + individual)"):
        if "individual" in seller_type.lower():
            seller_roles = ["individual_seller"]
        else:
            seller_roles = ["dealership_owner"]
        sellers = await User.find({"role": {"$in": seller_roles}}).to_list()
        seller_ids = [str(s.id) for s in sellers]
        query["seller_id"] = {"$in": seller_ids}

    if search:
        words = [w.strip() for w in search.split() if w.strip()]
        if len(words) == 1:
            query["$or"] = [
                {"title": {"$regex": words[0], "$options": "i"}},
                {"make":  {"$regex": words[0], "$options": "i"}},
                {"model": {"$regex": words[0], "$options": "i"}},
            ]
        else:
            # Every word must appear in at least one of: title, make, model
            word_conditions = [
                {"$or": [
                    {"title": {"$regex": w, "$options": "i"}},
                    {"make":  {"$regex": w, "$options": "i"}},
                    {"model": {"$regex": w, "$options": "i"}},
                ]}
                for w in words
            ]
            query["$and"] = word_conditions

    total = await VehicleListing.find(query).count()
    skip = (page - 1) * limit
    listings = await VehicleListing.find(query).sort("-created_at").skip(skip).limit(limit).to_list()

    # Efficient seller lookup
    seller_ids = list({v.seller_id for v in listings})
    sellers_map: dict = {}
    if seller_ids:
        from bson import ObjectId
        oid_list = []
        for sid in seller_ids:
            try: oid_list.append(ObjectId(sid))
            except Exception: pass
        if oid_list:
            sellers_list = await User.find({"_id": {"$in": oid_list}}).to_list()
            sellers_map = {str(s.id): s for s in sellers_list}

    items = [_to_response(v, sellers_map.get(v.seller_id)) for v in listings]
    return VehicleListResponse(items=items, total=total, page=page, limit=limit, has_next=(skip + limit) < total)


# ── Brands ────────────────────────────────────────────────────────────────

@router.get("/brands")
async def get_brands(condition: Optional[str] = None):
    query: dict = {"status": ListingStatus.active}
    if condition:
        query["condition"] = condition
    listings = await VehicleListing.find(query).to_list()
    counts: dict = {}
    for v in listings:
        if v.make:
            make = v.make.strip().title()
            counts[make] = counts.get(make, 0) + 1
    brands = [
        {"name": name, "count": count}
        for name, count in sorted(counts.items(), key=lambda x: -x[1])
    ]
    return brands


# ── My listings (with optional status filter) ─────────────────────────────

@router.get("/my", response_model=VehicleListResponse)
async def my_listings(
    page:   int            = Query(1, ge=1),
    limit:  int            = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    current_user: User     = Depends(get_current_user),
):
    query: dict = {"seller_id": str(current_user.id)}
    if status and status in [s.value for s in ListingStatus]:
        query["status"] = status

    total    = await VehicleListing.find(query).count()
    skip     = (page - 1) * limit
    listings = await VehicleListing.find(query).sort("-created_at").skip(skip).limit(limit).to_list()
    items    = [_to_response(v, current_user) for v in listings]
    return VehicleListResponse(items=items, total=total, page=page, limit=limit, has_next=(skip + limit) < total)


# ── My ads stats (count by status) ────────────────────────────────────────

@router.get("/my/stats", response_model=MyAdsStats)
async def my_ads_stats(current_user: User = Depends(get_current_user)):
    base = {"seller_id": str(current_user.id)}
    total   = await VehicleListing.find(base).count()
    active  = await VehicleListing.find({**base, "status": "active"}).count()
    pending = await VehicleListing.find({**base, "status": "pending"}).count()
    sold    = await VehicleListing.find({**base, "status": "sold"}).count()
    expired = await VehicleListing.find({**base, "status": "expired"}).count()
    draft   = await VehicleListing.find({**base, "status": "draft"}).count()
    return MyAdsStats(total=total, active=active, pending=pending, sold=sold, expired=expired, draft=draft)


# ── Saved listings ─────────────────────────────────────────────────────────

@router.get("/saved/list", response_model=VehicleListResponse)
async def get_saved_vehicles(
    page:  int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    saves       = await SavedVehicle.find({"user_id": str(current_user.id)}).to_list()
    vehicle_ids = [s.vehicle_id for s in saves]
    total       = len(vehicle_ids)
    skip        = (page - 1) * limit
    paged_ids   = vehicle_ids[skip: skip + limit]

    items = []
    for vid in paged_ids:
        try:
            v = await VehicleListing.get(vid)
            if v:
                seller = await User.get(v.seller_id)
                r = _to_response(v, seller)
                r.is_saved = True
                items.append(r)
        except Exception:
            pass

    return VehicleListResponse(items=items, total=total, page=page, limit=limit, has_next=(skip + limit) < total)


# ── Single vehicle ─────────────────────────────────────────────────────────

@router.get("/{vehicle_id}", response_model=VehicleResponse)
async def get_vehicle(vehicle_id: str):
    v = await VehicleListing.get(vehicle_id)
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    v.views += 1
    await v.save()
    seller = await User.get(v.seller_id)
    return _to_response(v, seller)


# ── Update listing ─────────────────────────────────────────────────────────

@router.put("/{vehicle_id}", response_model=VehicleResponse)
async def update_listing(
    vehicle_id: str,
    payload:    VehicleUpdate,
    current_user: User = Depends(get_current_user),
):
    v = await VehicleListing.get(vehicle_id)
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    if v.seller_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not your listing")

    update_data = payload.model_dump(exclude_none=True)
    update_data["updated_at"] = datetime.utcnow()
    for key, val in update_data.items():
        setattr(v, key, val)
    await v.save()
    return _to_response(v, current_user)


# ── Quick status change (mark sold / activate / expire) ───────────────────

@router.patch("/{vehicle_id}/status", response_model=VehicleResponse)
async def update_status(
    vehicle_id: str,
    payload:    StatusUpdate,
    current_user: User = Depends(get_current_user),
):
    v = await VehicleListing.get(vehicle_id)
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    if v.seller_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not your listing")
    v.status     = payload.status
    v.updated_at = datetime.utcnow()
    await v.save()
    return _to_response(v, current_user)


# ── Delete listing ─────────────────────────────────────────────────────────

@router.delete("/{vehicle_id}")
async def delete_listing(
    vehicle_id: str,
    current_user: User = Depends(get_current_user),
):
    v = await VehicleListing.get(vehicle_id)
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    if v.seller_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not your listing")
    await v.delete()
    return {"message": "Listing deleted"}


# ── Save / Unsave ──────────────────────────────────────────────────────────

@router.post("/{vehicle_id}/save")
async def save_vehicle(
    vehicle_id: str,
    current_user: User = Depends(get_current_user),
):
    existing = await SavedVehicle.find_one(
        {"user_id": str(current_user.id), "vehicle_id": vehicle_id}
    )
    if existing:
        await existing.delete()
        return {"saved": False}
    await SavedVehicle(user_id=str(current_user.id), vehicle_id=vehicle_id).insert()
    return {"saved": True}


# ── Reserve Vehicle ────────────────────────────────────────────────────────────

@router.post("/{vehicle_id}/reserve")
async def reserve_vehicle(
    vehicle_id: str,
    payload: dict = {},
    current_user: User = Depends(get_current_user),
):
    v = await VehicleListing.get(vehicle_id)
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    existing = await Reservation.find_one(
        {"vehicle_id": vehicle_id, "user_id": str(current_user.id), "status": "pending"}
    )
    if existing:
        return {"message": "Already reserved", "reservation_id": str(existing.id), "status": existing.status}
    reservation = Reservation(
        vehicle_id=vehicle_id,
        user_id=str(current_user.id),
        variant_name=payload.get("variant_name"),
        full_name=payload.get("full_name"),
        phone=payload.get("phone"),
        city=payload.get("city"),
        cnic=payload.get("cnic"),
        notes=payload.get("notes"),
    )
    await reservation.insert()
    return {"message": "Vehicle reserved successfully", "reservation_id": str(reservation.id), "status": reservation.status}


# ── Test Drive Booking ─────────────────────────────────────────────────────────

@router.post("/{vehicle_id}/test-drive")
async def book_test_drive(
    vehicle_id: str,
    payload: dict = {},
    current_user: User = Depends(get_current_user),
):
    v = await VehicleListing.get(vehicle_id)
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    existing = await TestDrive.find_one(
        {"vehicle_id": vehicle_id, "user_id": str(current_user.id), "status": "pending"}
    )
    if existing:
        return {"message": "Test drive already booked", "test_drive_id": str(existing.id), "status": existing.status}
    td = TestDrive(
        vehicle_id=vehicle_id,
        user_id=str(current_user.id),
        preferred_date=payload.get("preferred_date"),
        preferred_time=payload.get("preferred_time"),
        full_name=payload.get("full_name"),
        phone=payload.get("phone"),
    )
    await td.insert()
    return {"message": "Test drive booked successfully", "test_drive_id": str(td.id), "status": td.status}


# ── Withholding Tax ────────────────────────────────────────────────────────────

@router.get("/{vehicle_id}/tax")
async def get_vehicle_tax(vehicle_id: str):
    v = await VehicleListing.get(vehicle_id)
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    price = v.price
    if price <= 1_000_000:
        filer_rate, non_filer_rate = 0.01, 0.02
    elif price <= 2_000_000:
        filer_rate, non_filer_rate = 0.015, 0.03
    elif price <= 5_000_000:
        filer_rate, non_filer_rate = 0.02, 0.04
    else:
        filer_rate, non_filer_rate = 0.025, 0.05
    return {
        "vehicle_price": price,
        "filer_tax": round(price * filer_rate),
        "non_filer_tax": round(price * non_filer_rate),
        "filer_rate": filer_rate,
        "non_filer_rate": non_filer_rate,
    }
