"""
Dealers Router — /api/v1/dealers
Full dealership profile with reviews and stats.
"""
from collections import Counter
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.models.user import User, UserRole
from app.models.vehicle import VehicleListing, Reservation, TestDrive
from app.models.follow import Follow
from app.models.review import DealerReview
from app.models.save import SavedVehicle
from app.models.ad_analytics import AdAnalytics
from app.routers.auth import get_current_user

router = APIRouter(prefix="/dealers", tags=["Dealers"])


# ── Schemas ─────────────────────────────────────────────────────────────────

class DealerProfileResponse(BaseModel):
    id: str
    full_name: str
    dealership_name: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    role: str
    is_verified: bool
    avatar_url: Optional[str]
    cover_photo_url: Optional[str]
    bio: Optional[str]
    city: Optional[str]
    location: Optional[str]
    working_hours: Optional[str]
    established_year: Optional[int]
    website: Optional[str]
    vehicle_count: int
    follower_count: int
    avg_rating: float
    review_count: int
    is_following: bool
    member_since: str


class DealerReviewCreate(BaseModel):
    rating: float
    comment: Optional[str] = None


class DealerReviewResponse(BaseModel):
    id: str
    dealer_id: str
    reviewer_id: str
    reviewer_name: str
    rating: float
    comment: Optional[str]
    created_at: str


class DealerUpdateRequest(BaseModel):
    dealership_name: Optional[str] = None
    cover_photo_url: Optional[str] = None
    bio: Optional[str] = None
    city: Optional[str] = None
    location: Optional[str] = None
    working_hours: Optional[str] = None
    established_year: Optional[int] = None
    website: Optional[str] = None


# ── Helpers ─────────────────────────────────────────────────────────────────

SELLER_ROLES = {
    UserRole.dealership_owner,
    UserRole.individual_seller,
}

async def _get_dealer_or_404(dealer_id: str) -> User:
    dealer = await User.get(dealer_id)
    if not dealer or dealer.role not in SELLER_ROLES:
        raise HTTPException(status_code=404, detail="Seller not found")
    return dealer


async def _compute_avg_rating(dealer_id: str) -> tuple[float, int]:
    reviews = await DealerReview.find({"dealer_id": dealer_id}).to_list()
    if not reviews:
        return 0.0, 0
    avg = sum(r.rating for r in reviews) / len(reviews)
    return round(avg, 1), len(reviews)


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/", response_model=list)
async def list_dealers(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
):
    query: dict = {"role": UserRole.dealership_owner.value, "is_active": True}
    if search:
        query["$or"] = [
            {"full_name": {"$regex": search, "$options": "i"}},
            {"dealership_name": {"$regex": search, "$options": "i"}},
        ]
    skip = (page - 1) * limit
    dealers = await User.find(query).skip(skip).limit(limit).to_list()
    result = []
    for d in dealers:
        d_id = str(d.id)
        avg, count = await _compute_avg_rating(d_id)
        vehicle_count = await VehicleListing.find({"seller_id": d_id, "status": "active"}).count()
        follower_count = await Follow.find({"following_id": d_id}).count()
        result.append({
            "id": d_id,
            "full_name": d.full_name,
            "dealership_name": d.dealership_name,
            "role": d.role.value,
            "is_verified": d.is_verified,
            "avatar_url": d.avatar_url,
            "cover_photo_url": d.cover_photo_url,
            "city": d.city,
            "vehicle_count": vehicle_count,
            "follower_count": follower_count,
            "avg_rating": avg,
            "review_count": count,
            "established_year": d.established_year,
        })
    return result


@router.get("/me", response_model=DealerProfileResponse)
async def get_my_dealer_profile(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.dealership_owner:
        raise HTTPException(status_code=403, detail="Only dealership owners can access this")
    d_id = str(current_user.id)
    avg, count = await _compute_avg_rating(d_id)
    vehicle_count = await VehicleListing.find({"seller_id": d_id, "status": "active"}).count()
    follower_count = await Follow.find({"following_id": d_id}).count()
    return DealerProfileResponse(
        id=d_id,
        full_name=current_user.full_name,
        dealership_name=current_user.dealership_name,
        phone=current_user.phone,
        email=current_user.email,
        role=current_user.role.value,
        is_verified=current_user.is_verified,
        avatar_url=current_user.avatar_url,
        cover_photo_url=current_user.cover_photo_url,
        bio=current_user.bio,
        city=current_user.city,
        location=current_user.location,
        working_hours=current_user.working_hours,
        established_year=current_user.established_year,
        website=current_user.website,
        vehicle_count=vehicle_count,
        follower_count=follower_count,
        avg_rating=avg,
        review_count=count,
        is_following=False,
        member_since=current_user.created_at.isoformat(),
    )


@router.put("/me", response_model=DealerProfileResponse)
async def update_dealer_profile(
    payload: DealerUpdateRequest,
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.dealership_owner:
        raise HTTPException(status_code=403, detail="Only dealership owners can update dealer profile")
    data = payload.model_dump(exclude_none=True)
    for key, val in data.items():
        setattr(current_user, key, val)
    current_user.updated_at = datetime.utcnow()
    await current_user.save()
    d_id = str(current_user.id)
    avg, count = await _compute_avg_rating(d_id)
    vehicle_count = await VehicleListing.find({"seller_id": d_id, "status": "active"}).count()
    follower_count = await Follow.find({"following_id": d_id}).count()
    return DealerProfileResponse(
        id=d_id,
        full_name=current_user.full_name,
        dealership_name=current_user.dealership_name,
        phone=current_user.phone,
        email=current_user.email,
        role=current_user.role.value,
        is_verified=current_user.is_verified,
        avatar_url=current_user.avatar_url,
        cover_photo_url=current_user.cover_photo_url,
        bio=current_user.bio,
        city=current_user.city,
        location=current_user.location,
        working_hours=current_user.working_hours,
        established_year=current_user.established_year,
        website=current_user.website,
        vehicle_count=vehicle_count,
        follower_count=follower_count,
        avg_rating=avg,
        review_count=count,
        is_following=False,
        member_since=current_user.created_at.isoformat(),
    )


@router.get("/{dealer_id}", response_model=DealerProfileResponse)
async def get_dealer_profile(
    dealer_id: str,
    current_user: User = Depends(get_current_user),
):
    dealer = await _get_dealer_or_404(dealer_id)
    my_id = str(current_user.id)
    avg, count = await _compute_avg_rating(dealer_id)
    vehicle_count = await VehicleListing.find({"seller_id": dealer_id, "status": "active"}).count()
    follower_count = await Follow.find({"following_id": dealer_id}).count()
    is_following = await Follow.find_one({"follower_id": my_id, "following_id": dealer_id}) is not None
    return DealerProfileResponse(
        id=dealer_id,
        full_name=dealer.full_name,
        dealership_name=dealer.dealership_name,
        phone=dealer.phone,
        email=dealer.email,
        role=dealer.role.value,
        is_verified=dealer.is_verified,
        avatar_url=dealer.avatar_url,
        cover_photo_url=dealer.cover_photo_url,
        bio=dealer.bio,
        city=dealer.city,
        location=dealer.location,
        working_hours=dealer.working_hours,
        established_year=dealer.established_year,
        website=dealer.website,
        vehicle_count=vehicle_count,
        follower_count=follower_count,
        avg_rating=avg,
        review_count=count,
        is_following=is_following,
        member_since=dealer.created_at.isoformat(),
    )


@router.post("/{dealer_id}/follow")
async def toggle_follow_dealer(
    dealer_id: str,
    current_user: User = Depends(get_current_user),
):
    my_id = str(current_user.id)
    if my_id == dealer_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    await _get_dealer_or_404(dealer_id)
    existing = await Follow.find_one({"follower_id": my_id, "following_id": dealer_id})
    if existing:
        await existing.delete()
        return {"message": "Unfollowed", "is_following": False}
    follow = Follow(follower_id=my_id, following_id=dealer_id)
    await follow.insert()
    return {"message": "Followed", "is_following": True}


@router.post("/{dealer_id}/reviews", response_model=DealerReviewResponse)
async def post_dealer_review(
    dealer_id: str,
    payload: DealerReviewCreate,
    current_user: User = Depends(get_current_user),
):
    if not 1 <= payload.rating <= 5:
        raise HTTPException(400, "Rating must be between 1 and 5")
    await _get_dealer_or_404(dealer_id)
    existing = await DealerReview.find_one({
        "dealer_id": dealer_id,
        "reviewer_id": str(current_user.id),
    })
    if existing:
        raise HTTPException(400, "You have already reviewed this dealership")
    review = DealerReview(
        dealer_id=dealer_id,
        reviewer_id=str(current_user.id),
        reviewer_name=current_user.full_name,
        rating=payload.rating,
        comment=payload.comment,
    )
    await review.insert()
    return DealerReviewResponse(
        id=str(review.id),
        dealer_id=dealer_id,
        reviewer_id=str(current_user.id),
        reviewer_name=current_user.full_name,
        rating=review.rating,
        comment=review.comment,
        created_at=review.created_at.isoformat(),
    )


@router.get("/{dealer_id}/reviews", response_model=List[DealerReviewResponse])
async def get_dealer_reviews(
    dealer_id: str,
    limit: int = Query(10, ge=1, le=50),
    page: int = Query(1, ge=1),
):
    skip = (page - 1) * limit
    reviews = await DealerReview.find({"dealer_id": dealer_id}).sort("-created_at").skip(skip).limit(limit).to_list()
    return [
        DealerReviewResponse(
            id=str(r.id),
            dealer_id=r.dealer_id,
            reviewer_id=r.reviewer_id,
            reviewer_name=r.reviewer_name,
            rating=r.rating,
            comment=r.comment,
            created_at=r.created_at.isoformat(),
        )
        for r in reviews
    ]


# ── Subscription endpoints ────────────────────────────────────────────────────

class SubscriptionResponse(BaseModel):
    plan:       str
    status:     str
    limit:      int
    used:       int
    remaining:  int
    expires_at: Optional[str] = None


@router.get("/{dealer_id}/subscription", response_model=SubscriptionResponse)
async def get_subscription(
    dealer_id:    str,
    current_user: User = Depends(get_current_user),
):
    from app.models.dealer_subscription import DealerSubscription, PLAN_LIMITS, DealerPlan
    from app.models.vehicle import VehicleListing

    sub   = await DealerSubscription.find_one({"dealer_id": dealer_id, "status": "active"})
    plan  = sub.plan  if sub else DealerPlan.basic
    limit = PLAN_LIMITS.get(plan, 5)
    used  = await VehicleListing.find({"seller_id": dealer_id, "status": {"$in": ["active", "pending"]}}).count()
    remaining = max(0, limit - used) if limit != -1 else -1

    return SubscriptionResponse(
        plan=plan.value,
        status=sub.status.value if sub else "active",
        limit=limit,
        used=used,
        remaining=remaining,
        expires_at=sub.expires_at.isoformat() if sub else None,
    )


@router.post("/{dealer_id}/subscription/upgrade")
async def upgrade_plan(
    dealer_id:    str,
    plan:         str,
    current_user: User = Depends(get_current_user),
):
    from app.models.dealer_subscription import DealerSubscription, DealerPlan, SubStatus
    from datetime import timedelta

    if str(current_user.id) != dealer_id:
        raise HTTPException(403, "Not your account")
    if plan not in [p.value for p in DealerPlan]:
        raise HTTPException(400, f"Invalid plan. Choose: basic, premium, enterprise")

    existing = await DealerSubscription.find_one({"dealer_id": dealer_id})
    if existing:
        existing.plan       = DealerPlan(plan)
        existing.status     = SubStatus.active
        existing.expires_at = datetime.utcnow() + timedelta(days=30)
        await existing.save()
    else:
        sub = DealerSubscription(dealer_id=dealer_id, plan=DealerPlan(plan))
        await sub.insert()

    return {"message": f"Plan upgraded to {plan}"}


# ── Dashboard ────────────────────────────────────────────────────────────────

@router.get("/{dealer_id}/dashboard")
async def get_dealer_dashboard(
    dealer_id:    str,
    current_user: User = Depends(get_current_user),
):
    all_listings   = await VehicleListing.find({"seller_id": dealer_id}).to_list()
    active_count   = sum(1 for v in all_listings if v.status.value == "active")
    sold_count     = sum(1 for v in all_listings if v.status.value == "sold")
    profile_views  = sum(v.views for v in all_listings)
    follower_count = await Follow.find({"following_id": dealer_id}).count()

    ad_records     = await AdAnalytics.find({"dealer_id": dealer_id}).to_list()
    total_calls    = sum(r.calls for r in ad_records)

    last7_str      = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%d")
    prior7_str     = (datetime.utcnow() - timedelta(days=14)).strftime("%Y-%m-%d")
    last7_impr     = sum(r.impressions for r in ad_records if r.date >= last7_str)
    prior7_impr    = sum(r.impressions for r in ad_records if prior7_str <= r.date < last7_str)
    weekly_growth  = round((last7_impr - prior7_impr) / prior7_impr * 100, 1) if prior7_impr > 0 else 0.0

    return {
        "total_vehicles":      active_count,
        "total_sold":          sold_count,
        "active_reservations": active_count,
        "customer_enquiries":  follower_count,
        "weekly_growth":       weekly_growth,
        "total_calls":         total_calls,
        "profile_views":       profile_views,
    }


# ── Activity ──────────────────────────────────────────────────────────────────

@router.get("/{dealer_id}/activity")
async def get_dealer_activity(
    dealer_id:    str,
    limit:        int  = 5,
    current_user: User = Depends(get_current_user),
):
    from app.models.follow import Notification
    notifs = await Notification.find({"user_id": dealer_id}).sort("-created_at").limit(limit).to_list()
    return {
        "items": [
            {"title": n.title, "subtitle": n.body, "type": n.type}
            for n in notifs
        ]
    }


# ── Profile Analytics ─────────────────────────────────────────────────────────

@router.get("/me/analytics")
async def get_dealer_analytics(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.dealership_owner:
        raise HTTPException(status_code=403, detail="Only dealership owners can access this")

    dealer_id = str(current_user.id)
    today = datetime.utcnow()

    # ── All listings for this dealer ──────────────────────────────────────
    all_listings = await VehicleListing.find({"seller_id": dealer_id}).to_list()
    vehicle_ids = [str(v.id) for v in all_listings]

    # ── All ad analytics records ──────────────────────────────────────────
    ad_records = await AdAnalytics.find({"dealer_id": dealer_id}).to_list()

    # ── Unit Selling — daily ad impressions for last 6 days ───────────────
    unit_selling = []
    for i in range(5, -1, -1):
        day = today - timedelta(days=i)
        day_str = day.strftime("%Y-%m-%d")
        day_val = sum(r.impressions for r in ad_records if r.date == day_str)
        unit_selling.append({"day": day.strftime("%a")[0], "value": day_val})

    # ── Followers ─────────────────────────────────────────────────────────
    all_follows = await Follow.find({"following_id": dealer_id}).to_list()
    total_followers = len(all_follows)

    # Weekly: last 7 days
    followers_trend = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day.replace(hour=23, minute=59, second=59, microsecond=999999)
        count = sum(1 for f in all_follows if day_start <= f.created_at <= day_end)
        followers_trend.append({"day": day.strftime("%a").upper()[:3], "value": count})

    # Monthly: last 4 weeks
    followers_trend_monthly = []
    for i in range(3, -1, -1):
        week_end   = today - timedelta(weeks=i)
        week_start = week_end - timedelta(weeks=1)
        count = sum(1 for f in all_follows if week_start <= f.created_at <= week_end)
        followers_trend_monthly.append({"day": f"W{4 - i}", "value": count})

    # Yearly: last 12 months
    followers_trend_yearly = []
    for i in range(11, -1, -1):
        m = today.month - i
        y = today.year
        while m <= 0:
            m += 12
            y -= 1
        m_start = datetime(y, m, 1)
        nm, ny = (m + 1, y) if m < 12 else (1, y + 1)
        m_end = datetime(ny, nm, 1)
        count = sum(1 for f in all_follows if m_start <= f.created_at < m_end)
        followers_trend_yearly.append({"day": m_start.strftime("%b"), "value": count})

    # ── Profile Views — sum of all vehicle views ──────────────────────────
    profile_views = sum(v.views for v in all_listings)

    # Delta: last 7 days ad impressions vs prior 7 days
    last7_str  = (today - timedelta(days=7)).strftime("%Y-%m-%d")
    prior7_str = (today - timedelta(days=14)).strftime("%Y-%m-%d")
    last7_impr  = sum(r.impressions for r in ad_records if r.date >= last7_str)
    prior7_impr = sum(r.impressions for r in ad_records if prior7_str <= r.date < last7_str)
    profile_views_delta = round(((last7_impr - prior7_impr) / prior7_impr * 100), 1) if prior7_impr > 0 else 0.0

    # ── Search Appearances — total impressions ────────────────────────────
    search_appearances = sum(r.impressions for r in ad_records)
    search_delta = round(((last7_impr - prior7_impr) / prior7_impr * 100), 1) if prior7_impr > 0 else 0.0

    # ── Engagement ────────────────────────────────────────────────────────
    total_likes  = sum(r.favorites for r in ad_records)
    total_shares = sum(r.shares    for r in ad_records)
    total_saves  = await SavedVehicle.find({"vehicle_id": {"$in": vehicle_ids}}).count() if vehicle_ids else 0

    max_eng   = max(total_likes, total_shares, total_saves, 1)
    likes_pct  = round(total_likes  / max_eng * 100)
    shares_pct = round(total_shares / max_eng * 100)
    saves_pct  = round(total_saves  / max_eng * 100)

    # ── Reservations — vehicle listing statuses ───────────────────────────
    res_confirmed = sum(1 for v in all_listings if v.status.value == "active")
    res_completed = sum(1 for v in all_listings if v.status.value == "sold")
    res_pending   = sum(1 for v in all_listings if v.status.value in ("pending", "draft"))
    res_total     = len(all_listings)

    # ── Top Locations — cities of users who saved dealer's vehicles ────────
    location_counter: Counter = Counter()
    if vehicle_ids:
        saved_records = await SavedVehicle.find({"vehicle_id": {"$in": vehicle_ids}}).to_list()
        for s in saved_records[:200]:
            try:
                u = await User.get(s.user_id)
                if u and u.city:
                    location_counter[u.city] += 1
            except Exception:
                pass

    # Fall back to dealer's own listing cities if no saver data
    if not location_counter:
        for v in all_listings:
            if v.city:
                location_counter[v.city] += 1

    loc_total = sum(location_counter.values()) or 1
    top_locations = [
        {"name": city, "pct": round(count / loc_total * 100)}
        for city, count in location_counter.most_common(5)
    ]

    return {
        "unit_selling":               unit_selling,
        "total_followers":            total_followers,
        "followers_trend":            followers_trend,
        "followers_trend_monthly":    followers_trend_monthly,
        "followers_trend_yearly":     followers_trend_yearly,
        "profile_views":              profile_views,
        "profile_views_delta":        profile_views_delta,
        "search_appearances":         search_appearances,
        "search_appearances_delta":   search_delta,
        "engagement_likes":           total_likes,
        "engagement_likes_pct":       likes_pct,
        "engagement_shares":          total_shares,
        "engagement_shares_pct":      shares_pct,
        "engagement_saves":           total_saves,
        "engagement_saves_pct":       saves_pct,
        "reservations_total":         res_total,
        "reservations_confirmed":     res_confirmed,
        "reservations_completed":     res_completed,
        "reservations_pending":       res_pending,
        "top_locations":              top_locations,
    }


# ── Leads (Reservations + Test Drives for dealer's vehicles) ──────────────────

@router.get("/{dealer_id}/leads")
async def get_dealer_leads(
    dealer_id:    str,
    limit:        int  = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
):
    """Aggregated leads: reservations + test drives for this dealer's vehicles."""
    # Get all vehicles belonging to this dealer
    vehicles = await VehicleListing.find({"seller_id": dealer_id}).to_list()
    vehicle_map = {str(v.id): v for v in vehicles}
    vehicle_ids = list(vehicle_map.keys())

    if not vehicle_ids:
        return {"items": [], "total": 0}

    leads = []

    # Reservations as leads
    reservations = await Reservation.find({"vehicle_id": {"$in": vehicle_ids}}).sort("-created_at").to_list()
    for res in reservations:
        vehicle = vehicle_map.get(res.vehicle_id)
        buyer = None
        try:
            buyer = await User.get(res.user_id)
        except Exception:
            pass

        leads.append({
            "id":              str(res.id),
            "type":            "reservation",
            "buyer_name":      res.full_name or (buyer.full_name if buyer else "Unknown"),
            "phone":           res.phone or (buyer.phone if buyer else ""),
            "location":        res.city or (buyer.city if buyer else ""),
            "cnic":            res.cnic or "",
            "status":          res.status,
            "vehicle_title":   vehicle.title if vehicle else "",
            "vehicle_image":   vehicle.images[0] if vehicle and vehicle.images else None,
            "vehicle_color":   vehicle.color if vehicle else "",
            "color_hex":       "#9ca3af",
            "reservation_id":  f"#RES-{str(res.id)[-6:].upper()}",
            "created_at":      res.created_at.isoformat(),
        })

    # Test drives as leads
    test_drives = await TestDrive.find({"vehicle_id": {"$in": vehicle_ids}}).sort("-created_at").to_list()
    for td in test_drives:
        vehicle = vehicle_map.get(td.vehicle_id)
        buyer = None
        try:
            buyer = await User.get(td.user_id)
        except Exception:
            pass

        leads.append({
            "id":              str(td.id),
            "type":            "test_drive",
            "buyer_name":      td.full_name or (buyer.full_name if buyer else "Unknown"),
            "phone":           td.phone or (buyer.phone if buyer else ""),
            "location":        buyer.city if buyer else "",
            "cnic":            "",
            "status":          td.status,
            "vehicle_title":   vehicle.title if vehicle else "",
            "vehicle_image":   vehicle.images[0] if vehicle and vehicle.images else None,
            "vehicle_color":   vehicle.color if vehicle else "",
            "color_hex":       "#9ca3af",
            "reservation_id":  f"#TD-{str(td.id)[-6:].upper()}",
            "created_at":      td.created_at.isoformat(),
        })

    # Sort by created_at descending
    leads.sort(key=lambda x: x["created_at"], reverse=True)
    leads = leads[:limit]

    return {"items": leads, "total": len(leads)}


# ── Reservations for dealer's vehicles ────────────────────────────────────────

@router.get("/{dealer_id}/reservations")
async def get_dealer_reservations(
    dealer_id:    str,
    limit:        int  = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
):
    """Get all reservations for this dealer's vehicle listings."""
    vehicles = await VehicleListing.find({"seller_id": dealer_id}).to_list()
    vehicle_map = {str(v.id): v for v in vehicles}
    vehicle_ids = list(vehicle_map.keys())

    if not vehicle_ids:
        return {"items": [], "total": 0}

    reservations = await Reservation.find({"vehicle_id": {"$in": vehicle_ids}}).sort("-created_at").limit(limit).to_list()

    items = []
    for res in reservations:
        vehicle = vehicle_map.get(res.vehicle_id)
        buyer = None
        try:
            buyer = await User.get(res.user_id)
        except Exception:
            pass

        items.append({
            "id":            str(res.id),
            "vehicle_id":    res.vehicle_id,
            "vehicle_title": vehicle.title if vehicle else "Vehicle",
            "vehicle_image": vehicle.images[0] if vehicle and vehicle.images else None,
            "buyer_name":    res.full_name or (buyer.full_name if buyer else "Customer"),
            "buyer_id":      res.user_id,
            "phone":         res.phone or (buyer.phone if buyer else ""),
            "cnic":          res.cnic or "",
            "city":          res.city or (buyer.city if buyer else ""),
            "variant":       res.variant_name or "",
            "notes":         res.notes or "",
            "status":        res.status,
            "date":          res.created_at.strftime("%Y-%m-%d"),
            "time_slot":     res.created_at.strftime("%I:%M %p"),
            "deposit":       0,
            "created_at":    res.created_at.isoformat(),
        })

    return {"items": items, "total": len(items)}


class ReservationStatusUpdate(BaseModel):
    status: str


@router.patch("/{dealer_id}/reservations/{reservation_id}")
async def update_reservation_status(
    dealer_id:      str,
    reservation_id: str,
    payload:        ReservationStatusUpdate,
    current_user:   User = Depends(get_current_user),
):
    """Confirm or cancel a reservation for this dealer's vehicle."""
    if str(current_user.id) != dealer_id:
        raise HTTPException(403, "Not authorized")

    res = await Reservation.get(reservation_id)
    if not res:
        raise HTTPException(404, "Reservation not found")

    # Verify the vehicle belongs to this dealer
    vehicle = await VehicleListing.get(res.vehicle_id)
    if not vehicle or vehicle.seller_id != dealer_id:
        raise HTTPException(403, "Not your reservation")

    new_status = payload.status
    if new_status not in ("confirmed", "cancelled", "pending"):
        raise HTTPException(400, "status must be: confirmed, cancelled, or pending")

    res.status = new_status
    await res.save()

    return {"id": str(res.id), "status": res.status, "message": f"Reservation {new_status}"}


# ── Customers who interacted with dealer ──────────────────────────────────────

@router.get("/{dealer_id}/customers")
async def get_dealer_customers(
    dealer_id:    str,
    limit:        int  = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
):
    """Unique customers who have made reservations or test drives for this dealer's vehicles."""
    vehicles = await VehicleListing.find({"seller_id": dealer_id}).to_list()
    vehicle_map = {str(v.id): v for v in vehicles}
    vehicle_ids = list(vehicle_map.keys())

    if not vehicle_ids:
        return {"items": [], "total": 0}

    # Collect unique user_ids and their last enquiry vehicle title
    customer_map: dict = {}

    reservations = await Reservation.find({"vehicle_id": {"$in": vehicle_ids}}).sort("-created_at").to_list()
    for res in reservations:
        uid = res.user_id
        if uid not in customer_map:
            vehicle = vehicle_map.get(res.vehicle_id)
            customer_map[uid] = {
                "user_id":      uid,
                "last_enquiry": vehicle.title if vehicle else "Vehicle",
                "last_time":    res.created_at,
                "type":         "reservation",
            }

    test_drives = await TestDrive.find({"vehicle_id": {"$in": vehicle_ids}}).sort("-created_at").to_list()
    for td in test_drives:
        uid = td.user_id
        if uid not in customer_map or td.created_at > customer_map[uid]["last_time"]:
            vehicle = vehicle_map.get(td.vehicle_id)
            customer_map[uid] = {
                "user_id":      uid,
                "last_enquiry": vehicle.title if vehicle else "Vehicle",
                "last_time":    td.created_at,
                "type":         "test_drive",
            }

    # Fetch user details
    items = []
    for uid, meta in list(customer_map.items())[:limit]:
        try:
            user = await User.get(uid)
            if user:
                items.append({
                    "id":           uid,
                    "full_name":    user.full_name,
                    "email":        user.email,
                    "phone":        user.phone or "",
                    "avatar_url":   user.avatar_url,
                    "city":         user.city or "",
                    "last_enquiry": meta["last_enquiry"],
                    "enquiry_type": meta["type"],
                    "last_time":    meta["last_time"].isoformat(),
                })
        except Exception:
            pass

    items.sort(key=lambda x: x["last_time"], reverse=True)

    return {"items": items, "total": len(items)}

