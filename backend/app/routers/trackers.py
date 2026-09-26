"""
Tracker Providers Router — /api/v1/tracker-providers
"""
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.models.user import User, UserRole
from app.models.follow import Follow
from app.models.review import DealerReview
from app.models.ad_analytics import AdAnalytics
from app.routers.auth import get_current_user

router = APIRouter(prefix="/tracker-providers", tags=["Tracker Providers"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class TrackerProfileResponse(BaseModel):
    id: str
    full_name: str
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
    follower_count: int
    avg_rating: float
    review_count: int
    is_following: bool
    member_since: str
    office_photos: List[str] = []


class TrackerUpdateRequest(BaseModel):
    bio: Optional[str] = None
    city: Optional[str] = None
    avatar_url: Optional[str] = None
    cover_photo_url: Optional[str] = None
    location: Optional[str] = None
    working_hours: Optional[str] = None
    established_year: Optional[int] = None
    website: Optional[str] = None


class ReviewCreate(BaseModel):
    rating: float
    comment: Optional[str] = None


class ReviewResponse(BaseModel):
    id: str
    tracker_id: str
    reviewer_id: str
    reviewer_name: str
    rating: float
    comment: Optional[str]
    created_at: str


# ── Helpers ──────────────────────────────────────────────────────────────────

async def _get_tracker_or_404(tracker_id: str) -> User:
    user = await User.get(tracker_id)
    if not user or user.role != UserRole.tracker_provider:
        raise HTTPException(status_code=404, detail="Tracker provider not found")
    return user


async def _avg_rating(tracker_id: str) -> tuple[float, int]:
    reviews = await DealerReview.find({"dealer_id": tracker_id}).to_list()
    if not reviews:
        return 0.0, 0
    avg = sum(r.rating for r in reviews) / len(reviews)
    return round(avg, 1), len(reviews)


# ── List ─────────────────────────────────────────────────────────────────────

@router.get("/", response_model=list)
async def list_tracker_providers(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    city: Optional[str] = None,
):
    query: dict = {"role": UserRole.tracker_provider.value, "is_active": True}
    if search:
        query["$or"] = [
            {"full_name":    {"$regex": search, "$options": "i"}},
            {"dealership_name": {"$regex": search, "$options": "i"}},
        ]
    if city:
        query["city"] = {"$regex": city, "$options": "i"}

    skip = (page - 1) * limit
    providers = await User.find(query).skip(skip).limit(limit).to_list()
    result = []
    for p in providers:
        p_id = str(p.id)
        avg, count = await _avg_rating(p_id)
        follower_count = await Follow.find({"following_id": p_id}).count()
        result.append({
            "id":              p_id,
            "full_name":       p.full_name,
            "role":            p.role.value,
            "is_verified":     p.is_verified,
            "avatar_url":      p.avatar_url,
            "cover_photo_url": p.cover_photo_url,
            "city":            p.city,
            "bio":             p.bio,
            "follower_count":  follower_count,
            "avg_rating":      avg,
            "review_count":    count,
            "established_year": p.established_year,
        })
    return result


# ── Me ───────────────────────────────────────────────────────────────────────

@router.get("/me")
async def get_my_profile(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.tracker_provider:
        raise HTTPException(403, "Only tracker providers can access this")
    p_id = str(current_user.id)
    avg, count = await _avg_rating(p_id)
    followers = await Follow.find({"following_id": p_id}).count()
    return TrackerProfileResponse(
        id=p_id, full_name=current_user.full_name,
        phone=current_user.phone, email=current_user.email,
        role=current_user.role.value, is_verified=current_user.is_verified,
        avatar_url=current_user.avatar_url, cover_photo_url=current_user.cover_photo_url,
        bio=current_user.bio, city=current_user.city,
        location=current_user.location, working_hours=current_user.working_hours,
        established_year=current_user.established_year, website=current_user.website,
        follower_count=followers, avg_rating=avg, review_count=count,
        is_following=False, member_since=current_user.created_at.isoformat(),
        office_photos=current_user.office_photos or [],
    )


@router.put("/me")
async def update_my_profile(
    payload: TrackerUpdateRequest,
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.tracker_provider:
        raise HTTPException(403, "Only tracker providers can update this")
    data = payload.model_dump(exclude_none=True)
    for key, val in data.items():
        setattr(current_user, key, val)
    current_user.updated_at = datetime.utcnow()
    await current_user.save()
    return {"message": "Profile updated"}


# ── Get by ID ─────────────────────────────────────────────────────────────────

@router.get("/{tracker_id}")
async def get_tracker_profile(
    tracker_id: str,
    current_user: User = Depends(get_current_user),
):
    provider = await _get_tracker_or_404(tracker_id)
    my_id = str(current_user.id)
    avg, count = await _avg_rating(tracker_id)
    followers = await Follow.find({"following_id": tracker_id}).count()
    is_following = await Follow.find_one({"follower_id": my_id, "following_id": tracker_id}) is not None
    return TrackerProfileResponse(
        id=tracker_id, full_name=provider.full_name,
        phone=provider.phone, email=provider.email,
        role=provider.role.value, is_verified=provider.is_verified,
        avatar_url=provider.avatar_url, cover_photo_url=provider.cover_photo_url,
        bio=provider.bio, city=provider.city,
        location=provider.location, working_hours=provider.working_hours,
        established_year=provider.established_year, website=provider.website,
        follower_count=followers, avg_rating=avg, review_count=count,
        is_following=is_following, member_since=provider.created_at.isoformat(),
        office_photos=provider.office_photos or [],
    )


# ── Dashboard ─────────────────────────────────────────────────────────────────

@router.get("/{tracker_id}/dashboard")
async def get_dashboard(
    tracker_id: str,
    current_user: User = Depends(get_current_user),
):
    ad_records    = await AdAnalytics.find({"dealer_id": tracker_id}).to_list()
    profile_views = sum(r.impressions for r in ad_records)
    total_calls   = sum(r.calls       for r in ad_records)
    follower_count= await Follow.find({"following_id": tracker_id}).count()

    today      = datetime.utcnow()
    last7_str  = (today - timedelta(days=7)).strftime("%Y-%m-%d")
    prior7_str = (today - timedelta(days=14)).strftime("%Y-%m-%d")
    last7_imp  = sum(r.impressions for r in ad_records if r.date >= last7_str)
    prior7_imp = sum(r.impressions for r in ad_records if prior7_str <= r.date < last7_str)
    weekly_growth = round((last7_imp - prior7_imp) / prior7_imp * 100, 1) if prior7_imp > 0 else 0.0

    return {
        "total_devices":   profile_views,
        "active_devices":  follower_count,
        "alerts_count":    total_calls,
        "weekly_growth":   weekly_growth,
        "active_growth":   0.0,
        "alerts_change":   0.0,
        "profile_views":   profile_views,
    }


# ── Activity ──────────────────────────────────────────────────────────────────

@router.get("/{tracker_id}/activity")
async def get_activity(
    tracker_id: str,
    limit: int = 5,
    current_user: User = Depends(get_current_user),
):
    try:
        from app.models.follow import Notification
        notifs = await Notification.find({"user_id": tracker_id}).sort("-created_at").limit(limit).to_list()
        return {
            "items": [
                {"title": n.title, "subtitle": n.body, "type": n.type}
                for n in notifs
            ]
        }
    except Exception:
        return {"items": []}


# ── Clients / Leads ───────────────────────────────────────────────────────────

@router.get("/{tracker_id}/clients")
async def get_clients(
    tracker_id: str,
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    try:
        from app.models.chat import ChatRoom
        rooms = await ChatRoom.find({
            "$or": [
                {"participant_ids": tracker_id},
            ]
        }).sort("-updated_at").limit(limit).to_list()

        result = []
        for room in rooms:
            other_id = next((pid for pid in room.participant_ids if pid != tracker_id), None)
            if not other_id:
                continue
            other = await User.get(other_id)
            if not other:
                continue
            result.append({
                "id":           str(room.id),
                "client_name":  other.full_name,
                "avatar_url":   other.avatar_url,
                "last_message": room.last_message if hasattr(room, 'last_message') else "",
                "last_seen":    room.updated_at.strftime("%I:%M %p") if hasattr(room, 'updated_at') and room.updated_at else "",
                "is_online":    False,
                "type":         "Chat",
            })
        return result
    except Exception:
        return []


# ── Reviews ───────────────────────────────────────────────────────────────────

@router.post("/{tracker_id}/reviews")
async def post_review(
    tracker_id: str,
    payload: ReviewCreate,
    current_user: User = Depends(get_current_user),
):
    if not 1 <= payload.rating <= 5:
        raise HTTPException(400, "Rating must be 1–5")
    await _get_tracker_or_404(tracker_id)
    existing = await DealerReview.find_one({"dealer_id": tracker_id, "reviewer_id": str(current_user.id)})
    if existing:
        raise HTTPException(400, "Already reviewed")
    review = DealerReview(
        dealer_id=tracker_id,
        reviewer_id=str(current_user.id),
        reviewer_name=current_user.full_name,
        rating=payload.rating,
        comment=payload.comment,
    )
    await review.insert()
    return {"message": "Review submitted"}


@router.get("/{tracker_id}/reviews")
async def get_reviews(
    tracker_id: str,
    limit: int = Query(10, ge=1, le=50),
    page: int = Query(1, ge=1),
):
    skip = (page - 1) * limit
    reviews = await DealerReview.find({"dealer_id": tracker_id}).sort("-created_at").skip(skip).limit(limit).to_list()
    return [
        {
            "id":            str(r.id),
            "reviewer_name": r.reviewer_name,
            "rating":        r.rating,
            "comment":       r.comment,
            "created_at":    r.created_at.isoformat(),
        }
        for r in reviews
    ]


# ── Analytics ─────────────────────────────────────────────────────────────────

@router.get("/me/analytics")
async def get_analytics(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.tracker_provider:
        raise HTTPException(403, "Only tracker providers can access this")

    tracker_id = str(current_user.id)
    today = datetime.utcnow()

    ad_records   = await AdAnalytics.find({"dealer_id": tracker_id}).to_list()
    all_follows  = await Follow.find({"following_id": tracker_id}).to_list()

    unit_selling = []
    for i in range(5, -1, -1):
        day = today - timedelta(days=i)
        day_str = day.strftime("%Y-%m-%d")
        val = sum(r.impressions for r in ad_records if r.date == day_str)
        unit_selling.append({"day": day.strftime("%a")[0], "value": val})

    followers_trend = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        ds = day.replace(hour=0, minute=0, second=0, microsecond=0)
        de = day.replace(hour=23, minute=59, second=59, microsecond=999999)
        cnt = sum(1 for f in all_follows if ds <= f.created_at <= de)
        followers_trend.append({"day": day.strftime("%a").upper()[:3], "value": cnt})

    followers_trend_monthly = []
    for i in range(3, -1, -1):
        we = today - timedelta(weeks=i)
        ws = we - timedelta(weeks=1)
        cnt = sum(1 for f in all_follows if ws <= f.created_at <= we)
        followers_trend_monthly.append({"day": f"W{4-i}", "value": cnt})

    followers_trend_yearly = []
    for i in range(11, -1, -1):
        m = today.month - i
        y = today.year
        while m <= 0: m += 12; y -= 1
        ms = datetime(y, m, 1)
        nm, ny = (m+1, y) if m < 12 else (1, y+1)
        me = datetime(ny, nm, 1)
        cnt = sum(1 for f in all_follows if ms <= f.created_at < me)
        followers_trend_yearly.append({"day": ms.strftime("%b"), "value": cnt})

    profile_views = sum(r.impressions for r in ad_records)
    last7_str  = (today - timedelta(days=7)).strftime("%Y-%m-%d")
    prior7_str = (today - timedelta(days=14)).strftime("%Y-%m-%d")
    last7_imp  = sum(r.impressions for r in ad_records if r.date >= last7_str)
    prior7_imp = sum(r.impressions for r in ad_records if prior7_str <= r.date < last7_str)
    delta = round((last7_imp - prior7_imp) / prior7_imp * 100, 1) if prior7_imp > 0 else 0.0

    total_likes  = sum(r.favorites for r in ad_records)
    total_shares = sum(r.shares    for r in ad_records)
    max_eng = max(total_likes, total_shares, 1)

    return {
        "unit_selling":             unit_selling,
        "total_followers":          len(all_follows),
        "followers_trend":          followers_trend,
        "followers_trend_monthly":  followers_trend_monthly,
        "followers_trend_yearly":   followers_trend_yearly,
        "profile_views":            profile_views,
        "profile_views_delta":      delta,
        "search_appearances":       sum(r.impressions for r in ad_records),
        "search_appearances_delta": delta,
        "engagement_likes":         total_likes,
        "engagement_likes_pct":     round(total_likes  / max_eng * 100),
        "engagement_shares":        total_shares,
        "engagement_shares_pct":    round(total_shares / max_eng * 100),
        "engagement_saves":         0,
        "engagement_saves_pct":     0,
        "reservations_total":       0,
        "reservations_confirmed":   0,
        "reservations_completed":   0,
        "reservations_pending":     0,
        "top_locations":            [],
    }


# ── Follow ────────────────────────────────────────────────────────────────────

@router.post("/{tracker_id}/follow")
async def toggle_follow(
    tracker_id: str,
    current_user: User = Depends(get_current_user),
):
    my_id = str(current_user.id)
    if my_id == tracker_id:
        raise HTTPException(400, "Cannot follow yourself")
    await _get_tracker_or_404(tracker_id)
    existing = await Follow.find_one({"follower_id": my_id, "following_id": tracker_id})
    if existing:
        await existing.delete()
        return {"is_following": False}
    await Follow(follower_id=my_id, following_id=tracker_id).insert()
    return {"is_following": True}


# ── Subscription ──────────────────────────────────────────────────────────────

@router.get("/{tracker_id}/subscription")
async def get_subscription(
    tracker_id: str,
    current_user: User = Depends(get_current_user),
):
    return {"plan": "basic", "status": "active", "limit": 5, "used": 0, "remaining": 5}


# ── Office Photos ─────────────────────────────────────────────────────────────

class OfficePhotoRequest(BaseModel):
    url: str


@router.get("/me/office-photos")
async def get_office_photos(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.tracker_provider:
        raise HTTPException(403, "Only tracker providers can access this")
    return {"office_photos": current_user.office_photos or []}


@router.post("/me/office-photos", status_code=201)
async def add_office_photo(
    payload: OfficePhotoRequest,
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.tracker_provider:
        raise HTTPException(403, "Only tracker providers can access this")
    if not current_user.office_photos:
        current_user.office_photos = []
    if payload.url in current_user.office_photos:
        raise HTTPException(400, "Photo already exists")
    current_user.office_photos.append(payload.url)
    current_user.updated_at = datetime.utcnow()
    await current_user.save()
    return {"message": "Photo added", "office_photos": current_user.office_photos}


@router.delete("/me/office-photos")
async def delete_office_photo(
    payload: OfficePhotoRequest,
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.tracker_provider:
        raise HTTPException(403, "Only tracker providers can access this")
    if not current_user.office_photos or payload.url not in current_user.office_photos:
        raise HTTPException(404, "Photo not found")
    current_user.office_photos = [p for p in current_user.office_photos if p != payload.url]
    current_user.updated_at = datetime.utcnow()
    await current_user.save()
    return {"message": "Photo removed", "office_photos": current_user.office_photos}
