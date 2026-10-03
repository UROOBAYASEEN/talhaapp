from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional

from app.models.user import User, UserRole
from app.models.vehicle import VehicleListing
from app.models.follow import Follow, Notification
from app.models.review import DealerReview
from app.routers.auth import get_current_user
from app.schemas.seller import SellerProfileResponse, FollowResponse, NotificationListResponse, NotificationResponse
from pydantic import BaseModel

router = APIRouter(prefix="/sellers", tags=["Sellers"])


@router.get("/", response_model=list)
async def list_sellers(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    role: Optional[str] = None,
    search: Optional[str] = None,
    current_user: Optional[User] = None,
):
    query: dict = {"is_active": True, "is_verified": True}
    if role:
        query["role"] = role
    else:
        query["role"] = {"$in": [
            UserRole.dealership_owner.value,
            UserRole.individual_seller.value,
            UserRole.insurance_provider.value,
            UserRole.bank_representative.value,
            UserRole.tracker_provider.value,
        ]}
    if search:
        query["full_name"] = {"$regex": search, "$options": "i"}

    total = await User.find(query).count()
    skip = (page - 1) * limit
    sellers = await User.find(query).skip(skip).limit(limit).to_list()

    result = []
    for s in sellers:
        s_id = str(s.id)
        follower_count = await Follow.find({"following_id": s_id}).count()
        listing_count = await VehicleListing.find({"seller_id": s_id, "status": "active"}).count()
        result.append({
            "id": s_id,
            "full_name": s.full_name,
            "phone": s.phone,
            "role": s.role.value,
            "is_verified": s.is_verified,
            "avatar_url": s.avatar_url,
            "follower_count": follower_count,
            "listing_count": listing_count,
            "member_since": s.created_at.isoformat(),
        })

    return result


@router.get("/{seller_id}/activity")
async def get_seller_activity(
    seller_id: str,
    limit: int = Query(3, ge=1, le=20),
    current_user: User = Depends(get_current_user),
):
    """Recent activity for a seller home page: new listings, sales, reviews."""
    events: list[dict] = []

    listings = await VehicleListing.find({"seller_id": seller_id}).sort("-created_at").limit(10).to_list()
    for v in listings:
        ts = v.created_at.isoformat() if getattr(v, "created_at", None) else None
        if (v.status or "").lower() == "sold":
            events.append({"kind": "sale", "title": "Vehicle Sold", "message": v.title or "Vehicle", "at": ts})
        else:
            events.append({"kind": "listing", "title": "New Listing Added", "message": v.title or "Vehicle", "at": ts})

    reviews = await DealerReview.find({"dealer_id": seller_id}).sort("-created_at").limit(10).to_list()
    for r in reviews:
        ts = r.created_at.isoformat() if getattr(r, "created_at", None) else None
        events.append({"kind": "review", "title": "New Review Received", "message": r.comment or f"{r.rating} stars", "at": ts})

    events.sort(key=lambda e: e["at"] or "", reverse=True)
    return {"items": events[:limit], "total": len(events)}


@router.get("/{seller_id}")
async def get_seller_profile(
    seller_id: str,
    current_user: User = Depends(get_current_user),
):
    seller = await User.get(seller_id)
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")

    my_id = str(current_user.id)
    follower_count  = await Follow.find({"following_id": seller_id}).count()
    listing_count   = await VehicleListing.find({"seller_id": seller_id, "status": "active"}).count()
    sold_count      = await VehicleListing.find({"seller_id": seller_id, "status": "sold"}).count()
    is_following    = await Follow.find_one({"follower_id": my_id, "following_id": seller_id}) is not None

    reviews_docs    = await DealerReview.find({"dealer_id": seller_id}).sort("-created_at").to_list()
    review_count    = len(reviews_docs)
    avg_rating      = round(sum(r.rating for r in reviews_docs) / review_count, 1) if review_count else 0.0
    rating_breakdown = {str(i): sum(1 for r in reviews_docs if round(r.rating) == i) for i in range(1, 6)}

    reviews_list = [
        {
            "id":            str(r.id),
            "name":          r.reviewer_name,
            "rating":        r.rating,
            "comment":       r.comment or "",
            "date":          r.created_at.strftime("%d %b %Y") if r.created_at else "",
            "color":         "#e2671b",
        }
        for r in reviews_docs[:10]
    ]

    return {
        "id":               seller_id,
        "full_name":        seller.full_name,
        "phone":            seller.phone,
        "email":            seller.email,
        "role":             seller.role.value,
        "is_verified":      seller.is_verified,
        "follower_count":   follower_count,
        "listing_count":    listing_count,
        "is_following":     is_following,
        "member_since":     seller.created_at.isoformat(),
        "avatar_url":       seller.avatar_url,
        "cover_url":        seller.cover_photo_url,
        "bio":              seller.bio,
        "city":             seller.city,
        "working_hours":    seller.working_hours,
        "established_year": seller.established_year or (seller.created_at.year if seller.created_at else None),
        "vehicle_count":    listing_count,
        "customers":        sold_count,
        "avg_rating":       avg_rating,
        "review_count":     review_count,
        "rating_breakdown": rating_breakdown,
        "reviews":          reviews_list,
    }


class AddReviewRequest(BaseModel):
    rating: float
    comment: Optional[str] = None


@router.post("/{seller_id}/reviews")
async def add_review(
    seller_id: str,
    body: AddReviewRequest,
    current_user: User = Depends(get_current_user),
):
    seller = await User.get(seller_id)
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")
    if str(current_user.id) == seller_id:
        raise HTTPException(status_code=400, detail="Cannot review yourself")

    review = DealerReview(
        dealer_id=seller_id,
        reviewer_id=str(current_user.id),
        reviewer_name=current_user.full_name,
        rating=max(1.0, min(5.0, body.rating)),
        comment=body.comment,
    )
    await review.insert()
    return {"ok": True, "id": str(review.id)}


@router.get("/{seller_id}/reviews")
async def get_seller_reviews(
    seller_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
):
    skip = (page - 1) * limit
    total   = await DealerReview.find({"dealer_id": seller_id}).count()
    reviews = await DealerReview.find({"dealer_id": seller_id}).sort("-created_at").skip(skip).limit(limit).to_list()
    return {
        "total": total,
        "items": [
            {
                "id":      str(r.id),
                "name":    r.reviewer_name,
                "rating":  r.rating,
                "comment": r.comment or "",
                "date":    r.created_at.strftime("%d %b %Y") if r.created_at else "",
                "color":   "#e2671b",
            }
            for r in reviews
        ],
    }


@router.post("/{seller_id}/follow", response_model=FollowResponse)
async def toggle_follow(
    seller_id: str,
    current_user: User = Depends(get_current_user),
):
    my_id = str(current_user.id)
    if my_id == seller_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")

    seller = await User.get(seller_id)
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")

    existing = await Follow.find_one({"follower_id": my_id, "following_id": seller_id})
    if existing:
        await existing.delete()
        return FollowResponse(message="Unfollowed successfully", is_following=False)

    follow = Follow(follower_id=my_id, following_id=seller_id)
    await follow.insert()

    notif = Notification(
        user_id=seller_id,
        type="new_follower",
        title="New Follower",
        body=f"{current_user.full_name} started following you",
        data={"follower_id": my_id},
    )
    await notif.insert()

    return FollowResponse(message="Followed successfully", is_following=True)


@router.get("/me/following", response_model=list)
async def my_following(
    current_user: User = Depends(get_current_user),
):
    my_id = str(current_user.id)
    follows = await Follow.find({"follower_id": my_id}).to_list()
    result = []
    for f in follows:
        seller = await User.get(f.following_id)
        if seller:
            count = await VehicleListing.find({"seller_id": f.following_id, "status": "active"}).count()
            result.append({
                "id": str(seller.id),
                "full_name": seller.full_name,
                "role": seller.role.value,
                "listing_count": count,
                "followed_at": f.created_at.isoformat(),
            })
    return result


@router.get("/me/followers", response_model=list)
async def my_followers(
    current_user: User = Depends(get_current_user),
):
    my_id = str(current_user.id)
    follows = await Follow.find({"following_id": my_id}).to_list()
    result = []
    for f in follows:
        user = await User.get(f.follower_id)
        if user:
            result.append({
                "id": str(user.id),
                "full_name": user.full_name,
                "role": user.role.value,
                "followed_at": f.created_at.isoformat(),
            })
    return result


# ── Seller Analytics — real data (no dummy) ────────────────────────────────
@router.get("/me/analytics")
async def get_seller_analytics(current_user: User = Depends(get_current_user)):
    from datetime import datetime, timedelta
    from collections import Counter
    from app.models.vehicle import VehicleListing
    from app.models.follow import Follow
    from app.models.save import SavedVehicle
    from app.models.ad_analytics import AdAnalytics

    seller_id = str(current_user.id)
    now = datetime.utcnow()

    all_listings = await VehicleListing.find({"seller_id": seller_id}).to_list()
    vehicle_ids = [str(v.id) for v in all_listings]
    ad_records = await AdAnalytics.find({"dealer_id": seller_id}).to_list()

    # Unit selling — last 6 days
    unit_selling = []
    for i in range(5, -1, -1):
        day = now - timedelta(days=i)
        day_str = day.strftime("%Y-%m-%d")
        day_val = sum(r.impressions for r in ad_records if r.date == day_str)
        unit_selling.append({"day": day.strftime("%a")[0], "value": day_val})

    # Followers
    all_follows = await Follow.find({"following_id": seller_id}).to_list()
    total_followers = len(all_follows)
    followers_trend = []
    for i in range(6, -1, -1):
        day = now - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day.replace(hour=23, minute=59, second=59, microsecond=999999)
        cnt = sum(1 for f in all_follows if day_start <= f.created_at <= day_end)
        followers_trend.append({"day": day.strftime("%a").upper()[:3], "value": cnt})
    followers_trend_monthly = []
    for i in range(3, -1, -1):
        week_end = now - timedelta(weeks=i)
        week_start = week_end - timedelta(weeks=1)
        cnt = sum(1 for f in all_follows if week_start <= f.created_at <= week_end)
        followers_trend_monthly.append({"day": f"W{4-i}", "value": cnt})
    followers_trend_yearly = []
    for i in range(11, -1, -1):
        m = now.month - i
        y = now.year
        while m <= 0: m += 12; y -= 1
        m_start = datetime(y, m, 1)
        nm, ny = (m + 1, y) if m < 12 else (1, y + 1)
        m_end = datetime(ny, nm, 1)
        cnt = sum(1 for f in all_follows if m_start <= f.created_at < m_end)
        followers_trend_yearly.append({"day": m_start.strftime("%b"), "value": cnt})

    profile_views = sum(v.views for v in all_listings)
    last7_str = (now - timedelta(days=7)).strftime("%Y-%m-%d")
    prior7_str = (now - timedelta(days=14)).strftime("%Y-%m-%d")
    last7_impr = sum(r.impressions for r in ad_records if r.date >= last7_str)
    prior7_impr = sum(r.impressions for r in ad_records if prior7_str <= r.date < last7_str)
    profile_views_delta = round(((last7_impr - prior7_impr) / prior7_impr * 100), 1) if prior7_impr > 0 else 0.0
    search_appearances = sum(r.impressions for r in ad_records)
    search_delta = round(((last7_impr - prior7_impr) / prior7_impr * 100), 1) if prior7_impr > 0 else 0.0
    total_likes = sum(r.favorites for r in ad_records)
    total_shares = sum(r.shares for r in ad_records)
    total_saves = await SavedVehicle.find({"vehicle_id": {"$in": vehicle_ids}}).count() if vehicle_ids else 0
    max_eng = max(total_likes, total_shares, total_saves, 1)
    likes_pct = round(total_likes / max_eng * 100)
    shares_pct = round(total_shares / max_eng * 100)
    saves_pct = round(total_saves / max_eng * 100)
    res_confirmed = sum(1 for v in all_listings if v.status.value == "active")
    res_completed = sum(1 for v in all_listings if v.status.value == "sold")
    res_pending = sum(1 for v in all_listings if v.status.value in ("pending", "draft"))
    res_total = len(all_listings)
    location_counter: Counter = Counter()
    if vehicle_ids:
        saved_records = await SavedVehicle.find({"vehicle_id": {"$in": vehicle_ids}}).to_list()
        for s in saved_records[:200]:
            try:
                u = await User.get(s.user_id)
                if u and u.city: location_counter[u.city] += 1
            except: pass
    if not location_counter:
        for v in all_listings:
            if v.city: location_counter[v.city] += 1
    loc_total = sum(location_counter.values()) or 1
    top_locations = [{"name": city, "pct": round(count / loc_total * 100)} for city, count in location_counter.most_common(5)]

    return {
        "unit_selling": unit_selling,
        "total_followers": total_followers,
        "followers_trend": followers_trend,
        "followers_trend_monthly": followers_trend_monthly,
        "followers_trend_yearly": followers_trend_yearly,
        "profile_views": profile_views,
        "profile_views_delta": profile_views_delta,
        "search_appearances": search_appearances,
        "search_appearances_delta": search_delta,
        "engagement_likes": total_likes,
        "engagement_likes_pct": likes_pct,
        "engagement_shares": total_shares,
        "engagement_shares_pct": shares_pct,
        "engagement_saves": total_saves,
        "engagement_saves_pct": saves_pct,
        "reservations_total": res_total,
        "reservations_confirmed": res_confirmed,
        "reservations_completed": res_completed,
        "reservations_pending": res_pending,
        "top_locations": top_locations,
    }
