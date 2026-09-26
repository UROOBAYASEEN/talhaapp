"""
Insurance Router — /api/v1/insurance
Full claim flow: vehicle info → plan selection → applicant info → documents → payment
"""
import uuid
from collections import defaultdict
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query

from app.models.user import User, UserRole
from app.models.follow import Follow
from app.models.review import DealerReview
from app.models.insurance import (
    InsurancePlan, InsuranceClaim, InsuranceApplication,
    InsuranceDocument, InsurancePayment,
    ClaimStatus, PaymentStatus, PaymentMethod,
)
from app.routers.auth import get_current_user
from app.schemas.insurance import (
    PlanResponse, ClaimCreate, ClaimResponse,
    ApplicationCreate, ApplicationResponse,
    DocumentUpload, DocumentResponse,
    PaymentCreate, PaymentResponse,
)

router = APIRouter(prefix="/insurance", tags=["Insurance"])


# ── Provider Profile Schemas ───────────────────────────────────────────────
from pydantic import BaseModel

class InsuranceProviderUpdateRequest(BaseModel):
    bio: Optional[str] = None
    city: Optional[str] = None
    avatar_url: Optional[str] = None
    cover_photo_url: Optional[str] = None
    location: Optional[str] = None
    working_hours: Optional[str] = None
    established_year: Optional[int] = None
    phone: Optional[str] = None


# ── Provider /me endpoints ─────────────────────────────────────────────────

@router.get("/me")
async def get_my_insurance_profile(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.insurance_provider:
        raise HTTPException(403, "Only insurance providers can access this")
    p_id = str(current_user.id)
    avg_rating = 0.0
    review_count = 0
    reviews = await DealerReview.find({"dealer_id": p_id}).to_list()
    if reviews:
        review_count = len(reviews)
        avg_rating = round(sum(r.rating for r in reviews) / review_count, 1)
    followers = await Follow.find({"following_id": p_id}).count()
    return {
        "id": p_id,
        "full_name": current_user.full_name,
        "phone": current_user.phone,
        "email": current_user.email,
        "role": current_user.role.value,
        "is_verified": current_user.is_verified,
        "avatar_url": current_user.avatar_url,
        "cover_photo_url": current_user.cover_photo_url,
        "bio": current_user.bio,
        "city": current_user.city,
        "location": getattr(current_user, "location", None),
        "working_hours": getattr(current_user, "working_hours", None),
        "established_year": getattr(current_user, "established_year", None),
        "follower_count": followers,
        "avg_rating": avg_rating,
        "review_count": review_count,
        "member_since": current_user.created_at.isoformat(),
    }


@router.put("/me")
async def update_my_insurance_profile(
    payload: InsuranceProviderUpdateRequest,
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.insurance_provider:
        raise HTTPException(403, "Only insurance providers can update this")
    data = payload.model_dump(exclude_none=True)
    for key, val in data.items():
        setattr(current_user, key, val)
    current_user.updated_at = datetime.utcnow()
    await current_user.save()
    return {"message": "Profile updated"}


@router.get("/{provider_id}/analytics")
async def get_provider_analytics(
    provider_id: str,
    mode: str = Query("weekly"),
    current_user: User = Depends(get_current_user),
):
    now   = datetime.utcnow()
    days  = 30 if mode == "monthly" else 7

    # Followers count + daily trend
    followers_total = await Follow.find({"following_id": provider_id}).count()
    day_labels  = [(now - timedelta(days=i)).strftime("%a") for i in range(days - 1, -1, -1)]
    follows_all = await Follow.find({"following_id": provider_id}).to_list()
    daily_follows: dict = defaultdict(int)
    for f in follows_all:
        key = f.created_at.strftime("%a")
        daily_follows[key] += 1
    follow_points = [daily_follows.get(d, 0) for d in day_labels]
    max_f = max(follow_points) or 1
    normalized = [round(v / max_f, 3) for v in follow_points]

    # Applications stats
    apps = await InsuranceApplication.find({}).to_list()
    approved  = len([a for a in apps if a.status.value == "approved"])
    pending   = len([a for a in apps if a.status.value == "submitted"])
    reviewing = len([a for a in apps if a.status.value == "reviewing"])

    # Top cities from claims
    claims = await InsuranceClaim.find({}).to_list()
    city_counts: dict = defaultdict(int)
    for c in claims:
        if c.registration_city:
            city_counts[c.registration_city] += 1
    total_cities = sum(city_counts.values()) or 1
    top_cities = sorted(city_counts.items(), key=lambda x: -x[1])[:3]
    city_labels = [f"{city} ({int(cnt/total_cities*100)}%)" for city, cnt in top_cities]

    # Profile views proxy — use total applications as views
    total_apps = len(apps)

    return {
        "followers_total": followers_total,
        "follow_points":   normalized,
        "day_labels":      day_labels,
        "profile_views":   total_apps * 3,     # proxy
        "search_appearances": total_apps,
        "approved":  approved,
        "pending":   pending,
        "reviewing": reviewing,
        "top_cities": city_labels if city_labels else ["No data yet"],
    }


@router.get("/{provider_id}/dashboard")
async def get_provider_dashboard(
    provider_id: str,
    mode: str = Query("weekly"),
    current_user: User = Depends(get_current_user),
):
    now  = datetime.utcnow()
    days = 30 if mode == "monthly" else 7 if mode == "weekly" else 1

    since = now - timedelta(days=days)
    prev  = since - timedelta(days=days)

    all_apps  = await InsuranceApplication.find({}).to_list()
    all_claims= await InsuranceClaim.find({}).to_list()

    # filter by period
    curr_apps  = [a for a in all_apps  if a.created_at >= since]
    prev_apps  = [a for a in all_apps  if prev <= a.created_at < since]

    total_policies  = len(all_apps)
    active_policies = len([a for a in all_apps if a.status.value in ("approved", "submitted")])
    pending_policies= len([a for a in all_apps if a.status.value == "submitted"])

    curr_count = len(curr_apps)
    prev_count = len(prev_apps)
    weekly_growth = round(((curr_count - prev_count) / max(prev_count, 1)) * 100, 1)

    active_prev = len([a for a in prev_apps if a.status.value in ("approved", "submitted")])
    active_curr = len([a for a in curr_apps if a.status.value in ("approved", "submitted")])
    active_growth = round(((active_curr - active_prev) / max(active_prev, 1)) * 100, 1)

    pend_prev = len([a for a in prev_apps if a.status.value == "submitted"])
    pend_curr = len([a for a in curr_apps if a.status.value == "submitted"])
    pending_change = round(((pend_curr - pend_prev) / max(pend_prev, 1)) * 100, 1)

    # chart data — per day for last 7 days
    day_counts: dict = defaultdict(int)
    for a in all_apps:
        key = a.created_at.strftime("%d %b")
        day_counts[key] += 1

    chart_days = [(now - timedelta(days=i)).strftime("%d %b") for i in range(6, -1, -1)]
    chart_data = [
        {"label": d if i in (0, 3, 6) else "", "count": day_counts.get(d, 0)}
        for i, d in enumerate(chart_days)
    ]

    return {
        "total_policies":   total_policies,
        "active_policies":  active_policies,
        "pending_policies": pending_policies,
        "weekly_growth":    weekly_growth,
        "active_growth":    active_growth,
        "pending_change":   pending_change,
        "chart_data":       chart_data,
    }


@router.get("/{provider_id}/activity")
async def get_provider_activity(
    provider_id: str,
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
):
    apps = await InsuranceApplication.find({}).sort("-created_at").limit(limit).to_list()
    return {
        "items": [
            {
                "title":    f"New application — {a.full_name}",
                "subtitle": f"{a.status.value.capitalize()} • {a.created_at.strftime('%d %b %Y')}",
                "status":   a.status.value,
            }
            for a in apps
        ]
    }


@router.get("/{provider_id}/requests")
async def get_provider_requests(
    provider_id: str,
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
):
    query: dict = {}
    if status and status.lower() != "all":
        status_map = {
            "pending":     "submitted",
            "in progress": "reviewing",
            "approved":    "approved",
            "rejected":    "rejected",
        }
        mapped = status_map.get(status.lower())
        if mapped:
            query["status"] = mapped

    apps = await InsuranceApplication.find(query).sort("-created_at").to_list()
    results = []
    for a in apps:
        if search and search.lower() not in a.full_name.lower():
            continue
        claim = await InsuranceClaim.get(a.claim_id) if a.claim_id else None
        results.append({
            "id":       str(a.id),
            "name":     a.full_name,
            "phone":    a.phone,
            "vehicle":  f"{claim.brand} {claim.model} {claim.year}" if claim else "—",
            "status":   a.status.value,
            "date":     a.created_at.strftime("%b %d, %Y"),
            "created_at": a.created_at.isoformat(),
        })
    return results


class InsuranceReviewCreate(BaseModel):
    rating:  float
    comment: Optional[str] = None


@router.post("/{provider_id}/reviews")
async def post_insurance_review(
    provider_id: str,
    payload:     InsuranceReviewCreate,
    current_user: User = Depends(get_current_user),
):
    if not 1 <= payload.rating <= 5:
        raise HTTPException(400, "Rating must be between 1 and 5")

    existing = await DealerReview.find_one({
        "dealer_id":   provider_id,
        "reviewer_id": str(current_user.id),
    })
    if existing:
        raise HTTPException(400, "You have already reviewed this provider")

    review = DealerReview(
        dealer_id     = provider_id,
        reviewer_id   = str(current_user.id),
        reviewer_name = current_user.full_name,
        rating        = payload.rating,
        comment       = payload.comment,
    )
    await review.insert()
    return {
        "id":            str(review.id),
        "reviewer_name": review.reviewer_name,
        "rating":        review.rating,
        "comment":       review.comment,
        "created_at":    review.created_at.isoformat(),
    }


@router.get("/{provider_id}/reviews")
async def get_insurance_provider_reviews(
    provider_id: str,
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
):
    reviews = await DealerReview.find({"dealer_id": provider_id}).sort("-created_at").skip(skip).limit(limit).to_list()
    return [
        {
            "id": str(r.id),
            "reviewer_name": r.reviewer_name,
            "rating": r.rating,
            "comment": r.comment,
            "created_at": r.created_at.isoformat(),
        }
        for r in reviews
    ]


# ── Helper ─────────────────────────────────────────────────────────────────
def _plan_resp(p: InsurancePlan) -> PlanResponse:
    return PlanResponse(
        id=str(p.id), company_name=p.company_name,
        rating=p.rating, claim_percentage=p.claim_percentage,
        annual_rate=p.annual_rate, annual_premium=p.annual_premium,
        badge=p.badge, features=p.features,
    )


# ══════════════════════════════════════════════════════════════════════════
#  PLANS
# ══════════════════════════════════════════════════════════════════════════

@router.get("/plans", response_model=List[PlanResponse])
async def list_plans(
    sort_by: Optional[str] = Query(None, description="lowest_premium | best_coverage | highest_rating"),
):
    """Return all active insurance plans, optionally sorted."""
    plans = await InsurancePlan.find({"is_active": True}).to_list()

    # Seed default plans if none exist
    if not plans:
        defaults = [
            InsurancePlan(company_name="EFU Insurance",     rating=4.9, claim_percentage=96, annual_rate=1.25, annual_premium=83344, badge="Best Coverage",   features=["Comprehensive", "Third Party", "Natural Calamity", "Fire & Theft", "Personal Accident"]),
            InsurancePlan(company_name="ADAMJEE Insurance", rating=4.8, claim_percentage=94, annual_rate=1.20, annual_premium=79200, badge="Lowest Premium",  features=["Comprehensive", "Third Party", "Fire & Theft"]),
            InsurancePlan(company_name="Shaheen Insurance", rating=4.7, claim_percentage=92, annual_rate=1.30, annual_premium=85800, badge="Highest Rating",  features=["Comprehensive", "Third Party", "Tracker", "Natural Calamity"]),
            InsurancePlan(company_name="Jubilee Insurance", rating=4.6, claim_percentage=90, annual_rate=1.35, annual_premium=89100, features=["Comprehensive", "Third Party"]),
        ]
        for p in defaults:
            await p.insert()
        plans = defaults

    if sort_by == "lowest_premium":
        plans.sort(key=lambda p: p.annual_premium)
    elif sort_by == "highest_rating":
        plans.sort(key=lambda p: p.rating, reverse=True)
    elif sort_by == "best_coverage":
        plans.sort(key=lambda p: len(p.features), reverse=True)

    return [_plan_resp(p) for p in plans]


@router.get("/plans/{plan_id}", response_model=PlanResponse)
async def get_plan(plan_id: str):
    plan = await InsurancePlan.get(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return _plan_resp(plan)


# ══════════════════════════════════════════════════════════════════════════
#  CLAIMS  (vehicle info step)
# ══════════════════════════════════════════════════════════════════════════

@router.post("/claims", response_model=ClaimResponse, status_code=201)
async def create_claim(
    payload: ClaimCreate,
    current_user: User = Depends(get_current_user),
):
    """Step 1 — save vehicle info and create a draft claim."""
    claim = InsuranceClaim(
        user_id=str(current_user.id),
        **payload.model_dump(),
    )
    await claim.insert()
    return ClaimResponse(
        id=str(claim.id), user_id=claim.user_id,
        brand=claim.brand, model=claim.model, year=claim.year,
        estimated_value=claim.estimated_value, registered=claim.registered,
        registration_city=claim.registration_city,
        registration_number=claim.registration_number,
        photos=claim.photos, status=claim.status.value,
        created_at=claim.created_at.isoformat(),
    )


@router.get("/provider/claims")
async def provider_claims(
    current_user: User = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=100),
    skip: int  = Query(0,  ge=0),
):
    """All applications visible to an insurance provider."""
    if current_user.role != UserRole.insurance_provider:
        raise HTTPException(403, "Only insurance providers can access this")
    apps = await InsuranceApplication.find().sort("-created_at").skip(skip).limit(limit).to_list()
    result = []
    linked_claim_ids = set()
    for app in apps:
        if app.claim_id:
            linked_claim_ids.add(str(app.claim_id))
        claim = await InsuranceClaim.get(app.claim_id) if app.claim_id else None
        customer_avatar = None
        try:
            u = await User.get(app.user_id) if app.user_id else None
            if u: customer_avatar = u.avatar_url
        except Exception:
            pass
        result.append({
            "id":              str(app.id),
            "claim_id":        app.claim_id,
            "user_id":         app.user_id,
            "customer":        app.full_name,
            "phone":           app.phone,
            "email":           app.email,
            "vehicle":         f"{claim.brand} {claim.model} {claim.year}" if claim else "—",
            "estimated_value": claim.estimated_value if claim else 0,
            "photos":          claim.photos if claim else [],
            "customer_avatar": customer_avatar,
            "has_tracker":     getattr(app, 'has_tracker', False),
            "selected_addons": getattr(app, 'selected_addons', []),
            "status":          app.status.value,
            "created_at":      app.created_at.isoformat(),
            "preferred_date":  app.preferred_date,
        })
    # Standalone customer claim requests (profile → Claim) with no application yet
    try:
        all_claims = await InsuranceClaim.find().sort("-created_at").limit(limit).to_list()
        for claim in all_claims:
            if str(claim.id) in linked_claim_ids:
                continue
            customer_avatar = None
            customer_name = "—"
            customer_phone = ""
            customer_email = ""
            try:
                u = await User.get(claim.user_id) if claim.user_id else None
                if u:
                    customer_avatar = u.avatar_url
                    customer_name = u.full_name or "—"
                    customer_phone = u.phone or ""
                    customer_email = u.email or ""
            except Exception:
                pass
            result.append({
                "id":              str(claim.id),
                "claim_id":        str(claim.id),
                "user_id":         claim.user_id,
                "customer":        customer_name,
                "phone":           customer_phone,
                "email":           customer_email,
                "vehicle":         f"{claim.brand} {claim.model} {claim.year}",
                "estimated_value": claim.estimated_value,
                "photos":          claim.photos or [],
                "customer_avatar": customer_avatar,
                "has_tracker":     False,
                "selected_addons": [],
                "status":          claim.status.value,
                "created_at":      claim.created_at.isoformat(),
                "preferred_date":  None,
            })
        result.sort(key=lambda x: x["created_at"], reverse=True)
    except Exception:
        pass
    return result


@router.patch("/provider/claims/{app_id}")
async def update_claim_status(
    app_id: str,
    payload: dict,
    current_user: User = Depends(get_current_user),
):
    """Insurance provider updates claim status."""
    if current_user.role != UserRole.insurance_provider:
        raise HTTPException(403, "Only insurance providers can update claims")
    app = await InsuranceApplication.get(app_id)
    if not app:
        # Standalone customer claim request (no application yet)
        claim = await InsuranceClaim.get(app_id)
        if not claim:
            raise HTTPException(404, "Application not found")
        new_status = payload.get("status")
        if new_status and new_status in [s.value for s in ClaimStatus]:
            claim.status = ClaimStatus(new_status)
            claim.updated_at = datetime.utcnow()
            await claim.save()
        return {"message": "Status updated"}
    new_status = payload.get("status")
    if new_status and new_status in [s.value for s in ClaimStatus]:
        app.status = ClaimStatus(new_status)
        app.updated_at = datetime.utcnow()
        await app.save()
    return {"message": "Status updated"}


@router.get("/provider/applications")
async def provider_applications(
    current_user: User = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=100),
    skip:  int = Query(0,  ge=0),
):
    """All policy applications visible to an insurance provider."""
    if current_user.role != UserRole.insurance_provider:
        raise HTTPException(403, "Only insurance providers can access this")
    apps = await InsuranceApplication.find().sort("-created_at").skip(skip).limit(limit).to_list()
    result = []
    for idx, app in enumerate(apps):
        claim = await InsuranceClaim.get(app.claim_id) if app.claim_id else None
        plan  = await InsurancePlan.get(app.plan_id)  if app.plan_id  else None
        # Fetch customer avatar from profile
        customer_avatar = None
        try:
            u = await User.get(app.user_id) if app.user_id else None
            if u:
                customer_avatar = u.avatar_url
        except Exception:
            pass
        result.append({
            "id":           str(app.id),
            "user_id":      app.user_id,
            "policy_id":    f"IC-{app.created_at.strftime('%y%m%d')}-{str(idx+1).zfill(4)}",
            "name":         app.full_name,
            "customer":     app.full_name,
            "phone":        app.phone,
            "email":        app.email,
            "vehicle":      f"{claim.brand} {claim.model} {claim.year}" if claim else "—",
            "estimated_value": claim.estimated_value if claim else 0,
            "premium":      plan.annual_premium if plan else 0,
            "plan_name":    plan.company_name   if plan else "—",
            "status":       app.status.value,
            "created_at":   app.created_at.isoformat(),
            "preferred_date": app.preferred_date,
            "customer_avatar": customer_avatar,
            "avatar_url": customer_avatar,
            "has_tracker":  getattr(app, 'has_tracker', False),
            "selected_addons": getattr(app, 'selected_addons', []),
        })
    return result


@router.get("/my-claims", response_model=List[ClaimResponse])
async def my_claims(current_user: User = Depends(get_current_user)):
    """All claims belonging to the current user."""
    claims = await InsuranceClaim.find({"user_id": str(current_user.id)}).sort("-created_at").to_list()
    return [
        ClaimResponse(
            id=str(c.id), user_id=c.user_id,
            brand=c.brand, model=c.model, year=c.year,
            estimated_value=c.estimated_value, registered=c.registered,
            registration_city=c.registration_city,
            registration_number=c.registration_number,
            photos=c.photos, status=c.status.value,
            created_at=c.created_at.isoformat(),
        )
        for c in claims
    ]


@router.get("/claims/{claim_id}", response_model=ClaimResponse)
async def get_claim(claim_id: str, current_user: User = Depends(get_current_user)):
    claim = await InsuranceClaim.get(claim_id)
    if not claim or claim.user_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Claim not found")
    return ClaimResponse(
        id=str(claim.id), user_id=claim.user_id,
        brand=claim.brand, model=claim.model, year=claim.year,
        estimated_value=claim.estimated_value, registered=claim.registered,
        registration_city=claim.registration_city,
        registration_number=claim.registration_number,
        photos=claim.photos, status=claim.status.value,
        created_at=claim.created_at.isoformat(),
    )


# ══════════════════════════════════════════════════════════════════════════
#  APPLICATIONS  (applicant info + plan selection)
# ══════════════════════════════════════════════════════════════════════════

@router.post("/submit-application", status_code=201)
async def submit_application_simple(
    payload: dict,
    current_user: User = Depends(get_current_user),
):
    """Customer submits insurance application directly (without prior claim step)."""
    # Create minimal claim
    claim = InsuranceClaim(
        user_id=str(current_user.id),
        brand=payload.get("brand", "—"),
        model=payload.get("model", "—"),
        year=int(payload.get("year", 2024)),
        estimated_value=float(payload.get("estimated_value", 0)),
        registered=True,
        registration_city=payload.get("city", "—"),
        registration_number=payload.get("reg_number", "—"),
        status=ClaimStatus.submitted,
    )
    await claim.insert()

    # Tracker add-on detection
    addons = payload.get("selected_addons") or payload.get("addons") or []
    if isinstance(addons, str):
        try:
            import json as _json
            addons = _json.loads(addons)
        except:
            addons = [addons]
    has_tracker = bool(payload.get("has_tracker")) or any("tracker" in str(a).lower() for a in addons)

    # Create application
    app = InsuranceApplication(
        claim_id=str(claim.id),
        plan_id=payload.get("plan_id", ""),
        user_id=str(current_user.id),
        full_name=payload.get("full_name", current_user.full_name),
        cnic=payload.get("cnic", ""),
        phone=payload.get("phone", current_user.phone or ""),
        email=payload.get("email", current_user.email or ""),
        preferred_date=payload.get("preferred_date"),
        preferred_time=payload.get("preferred_time"),
        address=payload.get("address", ""),
        has_tracker=has_tracker,
        selected_addons=addons if isinstance(addons, list) else [],
        status=ClaimStatus.submitted,
    )
    await app.insert()
    return {"application_id": str(app.id), "claim_id": str(claim.id)}


@router.post("/applications", response_model=ApplicationResponse, status_code=201)
async def create_application(
    payload: ApplicationCreate,
    current_user: User = Depends(get_current_user),
):
    """Step 2 — save applicant info and selected plan."""
    # Verify claim belongs to user
    claim = await InsuranceClaim.get(payload.claim_id)
    if not claim or claim.user_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Claim not found")

    # Verify plan exists
    plan = await InsurancePlan.get(payload.plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    has_tracker = bool(payload.has_tracker) if payload.has_tracker is not None else False
    addons = payload.selected_addons or []
    if not has_tracker and addons:
        has_tracker = any("tracker" in str(a).lower() for a in addons)

    app = InsuranceApplication(
        claim_id=payload.claim_id,
        plan_id=payload.plan_id,
        user_id=str(current_user.id),
        full_name=payload.full_name,
        cnic=payload.cnic,
        phone=payload.phone,
        email=payload.email,
        preferred_date=payload.preferred_date,
        preferred_time=payload.preferred_time,
        address=payload.address,
        has_tracker=has_tracker,
        selected_addons=addons,
    )
    await app.insert()

    # Update claim status
    claim.status = ClaimStatus.submitted
    claim.updated_at = datetime.utcnow()
    await claim.save()

    return ApplicationResponse(
        id=str(app.id), claim_id=app.claim_id, plan_id=app.plan_id,
        user_id=app.user_id, full_name=app.full_name, cnic=app.cnic,
        phone=app.phone, email=app.email,
        preferred_date=app.preferred_date, preferred_time=app.preferred_time,
        address=app.address, has_tracker=app.has_tracker, selected_addons=app.selected_addons, status=app.status.value,
        created_at=app.created_at.isoformat(),
    )


@router.get("/applications/{application_id}", response_model=ApplicationResponse)
async def get_application(application_id: str, current_user: User = Depends(get_current_user)):
    app = await InsuranceApplication.get(application_id)
    if not app or app.user_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Application not found")
    return ApplicationResponse(
        id=str(app.id), claim_id=app.claim_id, plan_id=app.plan_id,
        user_id=app.user_id, full_name=app.full_name, cnic=app.cnic,
        phone=app.phone, email=app.email,
        preferred_date=app.preferred_date, preferred_time=app.preferred_time,
        address=app.address, has_tracker=getattr(app, 'has_tracker', False), selected_addons=getattr(app, 'selected_addons', []), status=app.status.value,
        created_at=app.created_at.isoformat(),
    )


# ══════════════════════════════════════════════════════════════════════════
#  DOCUMENTS
# ══════════════════════════════════════════════════════════════════════════

@router.post("/documents", response_model=DocumentResponse, status_code=201)
async def upload_document(
    payload: DocumentUpload,
    current_user: User = Depends(get_current_user),
):
    """Step 3 — save a document reference for a claim."""
    claim = await InsuranceClaim.get(payload.claim_id)
    if not claim or claim.user_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Claim not found")

    doc = InsuranceDocument(
        claim_id=payload.claim_id,
        user_id=str(current_user.id),
        doc_type=payload.doc_type,
        file_url=payload.file_url,
        is_optional=payload.is_optional,
    )
    await doc.insert()

    return DocumentResponse(
        id=str(doc.id), claim_id=doc.claim_id,
        doc_type=doc.doc_type, file_url=doc.file_url,
        is_optional=doc.is_optional, status=doc.status,
        created_at=doc.created_at.isoformat(),
    )


@router.get("/documents/{claim_id}", response_model=List[DocumentResponse])
async def get_documents(claim_id: str, current_user: User = Depends(get_current_user)):
    query = {"claim_id": claim_id}
    # provider can view any customer's docs, customer only own
    if current_user.role != UserRole.insurance_provider:
        query["user_id"] = str(current_user.id)
    docs = await InsuranceDocument.find(query).to_list()
    return [
        DocumentResponse(
            id=str(d.id), claim_id=d.claim_id,
            doc_type=d.doc_type, file_url=d.file_url,
            is_optional=d.is_optional, status=d.status,
            created_at=d.created_at.isoformat(),
        )
        for d in docs
    ]


# ══════════════════════════════════════════════════════════════════════════
#  PAYMENTS
# ══════════════════════════════════════════════════════════════════════════

@router.post("/payments", response_model=PaymentResponse, status_code=201)
async def process_payment(
    payload: PaymentCreate,
    current_user: User = Depends(get_current_user),
):
    """Step 4 — process insurance payment and issue policy number."""
    # Verify application belongs to user
    app = await InsuranceApplication.get(payload.application_id)
    if not app or app.user_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Application not found")

    # Validate payment method
    try:
        method = PaymentMethod(payload.method)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payment method")

    # Generate policy number
    policy_number = f"POL-{datetime.utcnow().strftime('%y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    transaction_id = f"TXN-{uuid.uuid4().hex[:10].upper()}"

    payment = InsurancePayment(
        application_id=payload.application_id,
        user_id=str(current_user.id),
        plan_id=payload.plan_id,
        amount=payload.amount,
        method=method,
        status=PaymentStatus.completed,
        transaction_id=transaction_id,
        policy_number=policy_number,
    )
    await payment.insert()

    # Update application status to approved
    app.status = ClaimStatus.approved
    app.updated_at = datetime.utcnow()
    await app.save()

    return PaymentResponse(
        id=str(payment.id),
        application_id=payment.application_id,
        plan_id=payment.plan_id,
        user_id=payment.user_id,
        amount=payment.amount,
        method=payment.method.value,
        status=payment.status.value,
        transaction_id=payment.transaction_id,
        policy_number=payment.policy_number,
        created_at=payment.created_at.isoformat(),
    )


@router.get("/payments/{payment_id}", response_model=PaymentResponse)
async def get_payment(payment_id: str, current_user: User = Depends(get_current_user)):
    payment = await InsurancePayment.get(payment_id)
    if not payment or payment.user_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Payment not found")
    return PaymentResponse(
        id=str(payment.id),
        application_id=payment.application_id,
        plan_id=payment.plan_id,
        user_id=payment.user_id,
        amount=payment.amount,
        method=payment.method.value,
        status=payment.status.value,
        transaction_id=payment.transaction_id,
        policy_number=payment.policy_number,
        created_at=payment.created_at.isoformat(),
    )


@router.get("/my-applications", response_model=List[ApplicationResponse])
async def my_applications(current_user: User = Depends(get_current_user)):
    apps = await InsuranceApplication.find(
        {"user_id": str(current_user.id)}
    ).sort("-created_at").to_list()
    return [
        ApplicationResponse(
            id=str(a.id), claim_id=a.claim_id, plan_id=a.plan_id,
            user_id=a.user_id, full_name=a.full_name, cnic=a.cnic,
            phone=a.phone, email=a.email,
            preferred_date=a.preferred_date, preferred_time=a.preferred_time,
            address=a.address, has_tracker=getattr(a, 'has_tracker', False), selected_addons=getattr(a, 'selected_addons', []), status=a.status.value,
            created_at=a.created_at.isoformat(),
        )
        for a in apps
    ]
