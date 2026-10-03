from collections import defaultdict
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from pydantic import BaseModel
from app.models.user import User, UserRole
from app.models.banner_ad import BannerAd, AdStatus
from app.models.video_ad import VideoAd, VideoAdStatus
from app.models.transaction import Transaction, TransactionStatus
from app.models.vehicle import VehicleListing, VehicleCategory, VehicleCondition
from app.models.ad_promotion import AdPromotion
from app.models.dealer_subscription import DealerSubscription, SubStatus
from app.routers.auth import get_current_user
from app.utils.security import hash_password
from app.models.follow import Notification
from app.models.review import DealerReview

router = APIRouter(prefix="/admin", tags=["Admin"])

PARTNER_ROLES = {
    UserRole.dealership_owner,
    UserRole.bank_representative,
    UserRole.insurance_provider,
    UserRole.tracker_provider,
    UserRole.individual_seller,
}

ROLE_LABEL = {
    UserRole.dealership_owner:  "Dealer",
    UserRole.bank_representative: "Bank",
    UserRole.insurance_provider: "Insurance",
    UserRole.tracker_provider:  "Tracker",
    UserRole.individual_seller: "Seller",
}


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


PARTNER_TYPE_ROLE = {
    "dealer":    UserRole.dealership_owner,
    "bank":      UserRole.bank_representative,
    "insurance": UserRole.insurance_provider,
    "tracker":   UserRole.tracker_provider,
    "seller":    UserRole.individual_seller,
}


class CreatePartnerRequest(BaseModel):
    partner_type:   str
    full_name:      str
    email:          Optional[str] = None
    phone:          Optional[str] = None
    password:       str
    city:           Optional[str] = None
    location:       Optional[str] = None
    dealership_name: Optional[str] = None
    website:        Optional[str] = None
    working_hours:  Optional[str] = None


@router.post("/partners", status_code=201)
async def create_partner(
    payload: CreatePartnerRequest,
    admin: User = Depends(require_admin),
):
    role = PARTNER_TYPE_ROLE.get(payload.partner_type.lower())
    if not role:
        raise HTTPException(status_code=400, detail=f"Invalid partner_type: {payload.partner_type}")

    if payload.email:
        existing = await User.find_one(User.email == payload.email)
        if existing:
            raise HTTPException(status_code=409, detail="Email already registered")

    if payload.phone:
        existing = await User.find_one(User.phone == payload.phone)
        if existing:
            raise HTTPException(status_code=409, detail="Phone already registered")

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        hashed_password=hash_password(payload.password),
        role=role,
        is_verified=True,
        is_active=True,
        docs_status="approved",
        city=payload.city,
        location=payload.location,
        dealership_name=payload.dealership_name or payload.full_name,
        website=payload.website,
        working_hours=payload.working_hours,
    )
    await user.insert()

    return {
        "id":   str(user.id),
        "name": user.full_name,
        "role": role.value,
    }


@router.get("/partners/counts")
async def get_partner_counts(admin: User = Depends(require_admin)):
    counts: dict[str, int] = {"All": 0, "Dealers": 0, "Banks": 0, "Insurance": 0, "Tracker": 0, "Seller": 0}
    all_partners = await User.find({"role": {"$in": [r.value for r in PARTNER_ROLES]}}).to_list()
    counts["All"] = len(all_partners)
    for p in all_partners:
        label = ROLE_LABEL.get(p.role, "")
        if label == "Dealer":   counts["Dealers"]   += 1
        elif label == "Bank":   counts["Banks"]     += 1
        elif label == "Insurance": counts["Insurance"] += 1
        elif label == "Tracker": counts["Tracker"]  += 1
        elif label == "Seller": counts["Seller"]    += 1
    return counts


AUDIENCE_ROLE_MAP = {
    "all":       None,
    "dealers":   UserRole.dealership_owner,
    "banks":     UserRole.bank_representative,
    "insurance": UserRole.insurance_provider,
    "tracker":   UserRole.tracker_provider,
    "customers": UserRole.customer,
}


class SendNotificationRequest(BaseModel):
    title:     str
    message:   str
    audiences: List[str] = ["all"]
    image_url: Optional[str] = None


@router.post("/send-notification")
async def send_notification(
    payload: SendNotificationRequest,
    admin: User = Depends(require_admin),
):
    user_ids: set = set()

    for aud in payload.audiences:
        aud = aud.lower()
        if aud == "all":
            all_users = await User.find({"is_active": True}).to_list()
            for u in all_users:
                user_ids.add(str(u.id))
            break
        role = AUDIENCE_ROLE_MAP.get(aud)
        if role:
            role_users = await User.find({"role": role.value, "is_active": True}).to_list()
            for u in role_users:
                user_ids.add(str(u.id))

    notifs = [
        Notification(
            user_id=uid,
            type="admin_broadcast",
            title=payload.title,
            body=payload.message,
            data={"image_url": payload.image_url or ""},
        )
        for uid in user_ids
    ]

    if notifs:
        await Notification.insert_many(notifs)

    return {"sent": len(notifs), "message": f"Notification sent to {len(notifs)} users"}


@router.patch("/partners/{user_id}/reset-password")
async def reset_partner_password(
    user_id: str,
    new_password: str = Query(..., min_length=6),
    admin: User = Depends(require_admin),
):
    user = await User.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.hashed_password = hash_password(new_password)
    await user.save()
    return {"ok": True, "message": "Password updated"}


@router.get("/check-user")
async def check_user(
    identifier: str = Query(...),
    admin: User = Depends(require_admin),
):
    user = await User.find_one(
        {"$or": [{"email": identifier}, {"phone": identifier}]}
    )
    if not user:
        return {"found": False, "message": "No user found with this email/phone"}
    return {
        "found":        True,
        "id":           str(user.id),
        "name":         user.full_name,
        "email":        user.email,
        "phone":        user.phone,
        "role":         user.role.value,
        "is_verified":  user.is_verified,
        "is_active":    user.is_active,
        "has_password": bool(user.hashed_password),
    }


@router.get("/partners")
async def get_partners(
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    admin: User = Depends(require_admin),
):
    query = User.find({"role": {"$in": [r.value for r in PARTNER_ROLES]}})
    partners = await query.to_list()

    result = []
    for p in partners:
        if search:
            s = search.lower()
            name_match = s in (p.full_name or "").lower()
            loc_match  = s in (p.city or "").lower() or s in (p.location or "").lower()
            if not (name_match or loc_match):
                continue
        label = ROLE_LABEL.get(p.role, "Partner")
        if role and label.lower() != role.lower():
            continue
        result.append({
            "id":       str(p.id),
            "name":     p.full_name,
            "location": p.location or p.city or "—",
            "type":     label,
            "status":   "Active" if p.is_active and p.is_verified else "Under Review",
            "avatar_url": p.avatar_url,
        })

    return result


@router.get("/partners/{user_id}")
async def get_partner(
    user_id: str,
    admin: User = Depends(require_admin),
):
    user = await User.get(user_id)
    if not user or user.role not in PARTNER_ROLES:
        raise HTTPException(status_code=404, detail="Partner not found")

    uid = str(user.id)

    # Active ads count
    active_ads = await VehicleListing.find({"seller_id": uid, "status": "active"}).count()

    # Sold (buyers served)
    buyers = await VehicleListing.find({"seller_id": uid, "status": "sold"}).count()

    # Rating from dealer reviews
    reviews = await DealerReview.find({"dealer_id": uid}).sort("-created_at").to_list()
    review_count = len(reviews)
    avg_rating   = round(sum(r.rating for r in reviews) / review_count, 1) if review_count else 0.0

    reviews_list = [
        {
            "id":            str(r.id),
            "reviewer_name": r.reviewer_name,
            "rating":        r.rating,
            "comment":       r.comment,
            "created_at":    r.created_at.isoformat() if r.created_at else None,
        }
        for r in reviews[:10]
    ]

    return {
        "id":              uid,
        "name":            user.full_name,
        "email":           user.email,
        "phone":           user.phone,
        "location":        user.location or user.city or "—",
        "city":            user.city,
        "type":            ROLE_LABEL.get(user.role, "Partner"),
        "status":          "Active" if user.is_active and user.is_verified else "Under Review",
        "avatar_url":      user.avatar_url,
        "cover_photo_url": user.cover_photo_url,
        "bio":             user.bio,
        "dealership_name": user.dealership_name,
        "working_hours":   user.working_hours,
        "established_year": user.established_year,
        "website":         user.website,
        "is_active":       user.is_active,
        "is_verified":     user.is_verified,
        "created_at":      user.created_at.isoformat() if user.created_at else None,
        "active_ads":      active_ads,
        "buyers":          buyers,
        "avg_rating":      avg_rating,
        "review_count":    review_count,
        "reviews":         reviews_list,
    }


@router.get("/listings")
async def get_admin_listings(
    list_type: str = Query("vehicles", regex="^(vehicles|banners|video_ads)$"),
    status:    Optional[str] = Query(None),
    search:    Optional[str] = Query(None),
    admin: User = Depends(require_admin),
):
    if list_type == "vehicles":
        STATUS_MAP = {
            "Pending":  "pending",
            "Approved": "active",
            "Rejected": "expired",
            "Promoted": "active",
        }
        query: dict = {}
        if status and status in STATUS_MAP:
            query["status"] = STATUS_MAP[status]
        vehicles = await VehicleListing.find(query).sort("-created_at").to_list()
        results = []
        for v in vehicles:
            title_lower = (v.title or "").lower()
            city_lower  = (v.city or "").lower()
            if search and search.lower() not in title_lower and search.lower() not in city_lower:
                continue
            seller = None
            seller_name = "—"
            seller_role = "Dealer"
            seller_phone = None
            seller_email = None
            seller_avatar = None
            try:
                seller = await User.get(v.seller_id) if v.seller_id else None
                if seller:
                    seller_name = seller.full_name or seller.dealership_name or "—"
                    seller_role = ROLE_LABEL.get(seller.role, "Dealer")
                    seller_phone = seller.phone
                    seller_email = seller.email
                    seller_avatar = seller.avatar_url
            except Exception:
                pass
            results.append({
                "id":                 str(v.id),
                "title":              v.title,
                "sub":                f"{v.city or '—'} • {v.condition.value.title()}",
                "price":              f"PKR {int(v.price):,}",
                "status":             v.status.value,
                "image":              v.images[0] if v.images else None,
                "date":               v.created_at.strftime("%d %b %Y"),
                "type":               "Vehicles",
                "seller_id":          v.seller_id,
                "seller_name":        seller_name,
                "seller_role":        seller_role,
                "seller_phone":       seller_phone,
                "seller_email":       seller_email,
                "seller_avatar_url":  seller_avatar,
            })
        return results

    elif list_type == "banners":
        STATUS_MAP = {
            "Pending":  "pending",
            "Approved": "active",
            "Rejected": "expired",
            "Promoted": "active",
        }
        query = {}
        if status and status in STATUS_MAP:
            query["status"] = STATUS_MAP[status]
        banners = await BannerAd.find(query).sort("-created_at").to_list()
        results = []
        for b in banners:
            if search and search.lower() not in (b.title or "").lower():
                continue
            results.append({
                "id":       str(b.id),
                "title":    b.title,
                "sub":      b.display_location,
                "price":    f"PKR {int(b.amount):,}",
                "status":   b.status.value,
                "image":    b.banner_image_url,
                "date":     b.created_at.strftime("%d %b %Y"),
                "type":     "Banners",
                "campaign": f"{b.created_at.strftime('%d %b')} – {b.expires_at.strftime('%d %b')}",
            })
        return results

    else:  # video_ads
        STATUS_MAP = {
            "Pending":  "pending",
            "Approved": "active",
            "Rejected": "expired",
            "Promoted": "active",
        }
        query = {}
        if status and status in STATUS_MAP:
            query["status"] = STATUS_MAP[status]
        videos = await VideoAd.find(query).sort("-created_at").to_list()
        results = []
        for v in videos:
            if search and search.lower() not in (v.title or "").lower():
                continue
            results.append({
                "id":     str(v.id),
                "title":  v.title,
                "sub":    v.display_location,
                "price":  f"PKR {int(v.amount):,}",
                "status": v.status.value,
                "image":  v.media_url,
                "date":   v.created_at.strftime("%d %b %Y"),
                "type":   "Videos",
            })
        return results


@router.post("/banner-ads/{ad_id}/approve")
async def approve_banner_ad(ad_id: str, admin: User = Depends(require_admin)):
    ad = await BannerAd.get(ad_id)
    if not ad:
        raise HTTPException(404, "Banner ad not found")
    ad.status = AdStatus.active
    ad.expires_at = datetime.utcnow() + timedelta(weeks=ad.boost_weeks or 6)
    await ad.save()
    return {"message": "Banner ad approved"}


@router.post("/banner-ads/{ad_id}/reject")
async def reject_banner_ad(ad_id: str, admin: User = Depends(require_admin)):
    ad = await BannerAd.get(ad_id)
    if not ad:
        raise HTTPException(404, "Banner ad not found")
    ad.status = AdStatus.cancelled
    await ad.save()
    return {"message": "Banner ad rejected"}


@router.post("/video-ads/{ad_id}/approve")
async def approve_video_ad(ad_id: str, admin: User = Depends(require_admin)):
    ad = await VideoAd.get(ad_id)
    if not ad:
        raise HTTPException(404, "Video ad not found")
    ad.status = VideoAdStatus.active
    await ad.save()
    return {"message": "Video ad approved"}


@router.post("/video-ads/{ad_id}/reject")
async def reject_video_ad(ad_id: str, admin: User = Depends(require_admin)):
    ad = await VideoAd.get(ad_id)
    if not ad:
        raise HTTPException(404, "Video ad not found")
    ad.status = VideoAdStatus.cancelled
    await ad.save()
    return {"message": "Video ad rejected"}


@router.get("/ad-payments")
async def get_ad_payments(
    ad_type: Optional[str] = Query(None),
    admin: User = Depends(require_admin),
):
    # initials mapping
    TYPE_INITIALS = {
        "Banner Ads":  ["BA"],
        "Video Ads":   ["VA"],
        "Boosted Ads": ["AP", "FE"],
    }
    all_initials = ["BA", "VA", "AP", "FE"]

    if ad_type and ad_type in TYPE_INITIALS:
        query_initials = TYPE_INITIALS[ad_type]
    else:
        query_initials = all_initials

    # Record-endpoint entries (user initials) bhi lao: subtitle keywords se match
    txns = await Transaction.find(
        {"status": TransactionStatus.success, "$or": [
            {"initials": {"$in": query_initials}},
            {"subtitle": {"$regex": "Advertisement|Featured|promotion|Banner|Video Ad", "$options": "i"}},
        ]}
    ).sort("-created_at").to_list()

    def bucket(t) -> str:
        sub = f"{t.subtitle or ''} {t.title or ''}"
        if t.initials == "BA" or "Banner" in sub:
            return "Banner Ads"
        if t.initials == "VA" or "Video" in sub:
            return "Video Ads"
        return "Boosted Ads"

    if ad_type and ad_type in TYPE_INITIALS:
        txns = [t for t in txns if bucket(t) == ad_type]

    # totals per type
    totals: dict = defaultdict(float)
    for t in txns:
        totals[bucket(t)] += t.amount

    total_rev = sum(totals.values())

    def fmt(n: float) -> str:
        if n >= 1_000_000: return f"PKR {n/1_000_000:.1f}M"
        if n >= 1_000:     return f"PKR {n/1_000:.0f}K"
        return f"PKR {int(n)}"

    stats = [
        {"label": "Banner Ads",  "value": fmt(totals["Banner Ads"])},
        {"label": "Video Ads",   "value": fmt(totals["Video Ads"])},
        {"label": "Boosted Ads", "value": fmt(totals["Boosted Ads"])},
        {"label": "Total",       "value": fmt(total_rev)},
    ]

    payments = []
    for t in txns[:50]:
        ad_label = {"Banner Ads": "Banner Ad", "Video Ads": "Video Ad"}.get(bucket(t), "Boosted Ad")

        payments.append({
            "id":       str(t.id),
            "title":    t.title,
            "subtitle": t.subtitle or ad_label,
            "amount":   f"PKR {int(t.amount):,}",
            "status":   t.status.value,
            "type":     ad_label,
            "date":     t.created_at.strftime("%d %b %Y"),
        })

    return {
        "total_revenue": fmt(total_rev),
        "stats":         stats,
        "payments":      payments,
    }


@router.get("/analytics")
async def get_analytics(
    period: str = Query("30d", regex="^(today|7d|30d|1y)$"),
    admin: User = Depends(require_admin),
):
    now   = datetime.utcnow()
    month_starts = [
        (now.replace(day=1) - timedelta(days=30 * i)).replace(day=1)
        for i in range(5, -1, -1)
    ]

    # ── Stats ─────────────────────────────────────────────────────────────────
    if period == "today":
        since = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "7d":
        since = now - timedelta(days=7)
    elif period == "1y":
        since = now.replace(month=1, day=1, hour=0, minute=0, second=0)
    else:
        since = now - timedelta(days=30)

    prev_since = since - (now - since)

    users_now  = await User.find({"role": "customer", "created_at": {"$gte": since}}).count()
    users_prev = await User.find({"role": "customer", "created_at": {"$gte": prev_since, "$lt": since}}).count()
    total_users = await User.find({"role": "customer"}).count()

    partner_roles = [r.value for r in PARTNER_ROLES]
    partners_now  = await User.find({"role": {"$in": partner_roles}, "created_at": {"$gte": since}}).count()
    partners_prev = await User.find({"role": {"$in": partner_roles}, "created_at": {"$gte": prev_since, "$lt": since}}).count()
    total_partners = await User.find({"role": {"$in": partner_roles}}).count()

    listings_now  = await VehicleListing.find({"created_at": {"$gte": since}}).count()
    listings_prev = await VehicleListing.find({"created_at": {"$gte": prev_since, "$lt": since}}).count()
    total_listings = await VehicleListing.find({}).count()

    txns_now  = await Transaction.find({"created_at": {"$gte": since},      "status": TransactionStatus.success}).to_list()
    txns_prev = await Transaction.find({"created_at": {"$gte": prev_since, "$lt": since}, "status": TransactionStatus.success}).to_list()
    rev_now   = sum(t.amount for t in txns_now)
    rev_prev  = sum(t.amount for t in txns_prev)

    def pct(now, prev):
        if prev == 0: return 0.0
        return round(((now - prev) / prev) * 100, 1)

    def fmt_k(n: float) -> str:
        if n >= 1_000_000: return f"PKR {n/1_000_000:.1f}M"
        if n >= 1_000:     return f"{n/1_000:.1f}K"
        return str(int(n))

    stats = [
        {"label": "Users",    "value": fmt_k(total_users),   "delta": f"{'+' if pct(users_now,users_prev)>=0 else ''}{pct(users_now,users_prev)}%"},
        {"label": "Partners", "value": str(total_partners),   "delta": f"{'+' if pct(partners_now,partners_prev)>=0 else ''}{pct(partners_now,partners_prev)}%"},
        {"label": "Listings", "value": fmt_k(total_listings), "delta": f"{'+' if pct(listings_now,listings_prev)>=0 else ''}{pct(listings_now,listings_prev)}%"},
        {"label": "Revenue",  "value": fmt_k(rev_now),        "delta": f"{'+' if pct(rev_now,rev_prev)>=0 else ''}{pct(rev_now,rev_prev)}%"},
    ]

    # ── Revenue chart (last 6 months) ─────────────────────────────────────────
    all_txns = await Transaction.find({"created_at": {"$gte": month_starts[0]}, "status": TransactionStatus.success}).to_list()
    monthly_rev: dict = defaultdict(float)
    for t in all_txns:
        monthly_rev[t.created_at.strftime("%b")] += t.amount
    rev_points  = [round(monthly_rev.get(ms.strftime("%b"), 0), 2) for ms in month_starts]
    rev_labels  = [ms.strftime("%b") for ms in month_starts]
    rev_total   = sum(rev_points)

    # ── Revenue breakdown ─────────────────────────────────────────────────────
    sub_rev  = sum(t.amount for t in all_txns if t.initials in ("DS", "SUB"))
    ads_rev  = sum(t.amount for t in all_txns if t.initials in ("BA", "VA"))
    boost_rev= sum(t.amount for t in all_txns if t.initials in ("AP", "FE"))
    pend_txns= await Transaction.find({"status": TransactionStatus.pending}).to_list()
    pend_rev = sum(t.amount for t in pend_txns)
    breakdown_total = sub_rev + ads_rev + boost_rev or 1

    revenue_breakdown = [
        {"label": "Subscriptions",      "value": fmt_k(sub_rev),   "pct": f"{int(sub_rev/breakdown_total*100)}%",   "color": ORANGE},
        {"label": "Ads Payments",       "value": fmt_k(ads_rev),   "pct": f"{int(ads_rev/breakdown_total*100)}%",   "color": "#2dd4bf"},
        {"label": "Boosted Listings",   "value": fmt_k(boost_rev), "pct": f"{int(boost_rev/breakdown_total*100)}%", "color": "#3b82f6"},
        {"label": "Pending Payments",   "value": fmt_k(pend_rev),  "pct": "0%",                                     "color": "#eab308"},
    ]

    # ── Partners contributions ────────────────────────────────────────────────
    d_count  = await User.find({"role": UserRole.dealership_owner}).count()
    b_count  = await User.find({"role": UserRole.bank_representative}).count()
    i_count  = await User.find({"role": UserRole.insurance_provider}).count()
    t_count  = await User.find({"role": UserRole.tracker_provider}).count()
    s_count  = await User.find({"role": UserRole.individual_seller}).count()
    max_p    = max(d_count, b_count, i_count, t_count, s_count, 1)
    partners_contrib = [
        {"label": "Dealers",     "value": d_count, "max": max_p},
        {"label": "Banks",       "value": b_count, "max": max_p},
        {"label": "Insurance",   "value": i_count, "max": max_p},
        {"label": "Tracker",     "value": t_count, "max": max_p},
        {"label": "Seller",      "value": s_count, "max": max_p},
    ]

    # ── Advertising ───────────────────────────────────────────────────────────
    ban_count   = await BannerAd.find({"status": AdStatus.active}).count()
    vid_count   = await VideoAd.find({"status": VideoAdStatus.active}).count()
    boost_count = await AdPromotion.find({"status": "success"}).count()
    ad_max      = max(ban_count, vid_count, boost_count, 1)
    advertising = [
        {"label": "Banner Ads",       "value": ban_count,   "max": ad_max, "color": "#3b82f6"},
        {"label": "Video Ads",        "value": vid_count,   "max": ad_max, "color": "#2dd4bf"},
        {"label": "Boosted Listings", "value": boost_count, "max": ad_max, "color": ORANGE},
    ]

    # ── Subscription trend (last 6 months) ───────────────────────────────────
    subs = await DealerSubscription.find({"created_at": {"$gte": month_starts[0]}}).to_list()
    sub_monthly: dict = defaultdict(int)
    for s in subs:
        sub_monthly[s.created_at.strftime("%b")] += 1
    sub_points = [sub_monthly.get(ms.strftime("%b"), 0) for ms in month_starts]
    sub_labels = rev_labels

    # ── Listings performance ──────────────────────────────────────────────────
    cars  = await VehicleListing.find({"category": VehicleCategory.car}).count()
    bikes = await VehicleListing.find({"category": VehicleCategory.bike}).count()
    new_v = await VehicleListing.find({"condition": VehicleCondition.new}).count()
    used_v= await VehicleListing.find({"condition": VehicleCondition.used}).count()
    listing_perf = [
        {"name": "Cars",  "a": cars,  "b": used_v},
        {"name": "Bikes", "a": bikes, "b": 0},
        {"name": "New",   "a": new_v, "b": 0},
        {"name": "Used",  "a": used_v,"b": 0},
    ]

    return {
        "stats":             stats,
        "revenue_total":     rev_total,
        "revenue_points":    rev_points,
        "revenue_labels":    rev_labels,
        "revenue_breakdown": revenue_breakdown,
        "partners_contrib":  partners_contrib,
        "advertising":       advertising,
        "sub_points":        sub_points,
        "sub_labels":        sub_labels,
        "listing_perf":      listing_perf,
    }

ORANGE = "#E2671B"


@router.get("/revenue")
async def get_revenue(
    period: str = Query("30d", regex="^(today|7d|30d|1y)$"),
    admin: User = Depends(require_admin),
):
    now = datetime.utcnow()

    if period == "today":
        start     = now.replace(hour=0, minute=0, second=0, microsecond=0)
        prev_start= start - timedelta(days=1)
        bucket_fmt = "%H"
        buckets    = [f"{h:02d}:00" for h in range(24)]
        def bucket_key(dt): return f"{dt.hour:02d}:00"
    elif period == "7d":
        start      = now - timedelta(days=6)
        prev_start = start - timedelta(days=7)
        buckets    = [(start + timedelta(days=i)).strftime("%a") for i in range(7)]
        def bucket_key(dt): return dt.strftime("%a")
    elif period == "30d":
        start      = now - timedelta(days=29)
        prev_start = start - timedelta(days=30)
        buckets    = [(start + timedelta(days=i)).strftime("%d %b") for i in range(30)]
        def bucket_key(dt): return dt.strftime("%d %b")
    else:  # 1y
        start      = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        prev_start = start.replace(year=start.year - 1)
        months     = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
        buckets    = months
        def bucket_key(dt): return dt.strftime("%b")

    txns      = await Transaction.find({"created_at": {"$gte": start}, "status": TransactionStatus.success}).to_list()
    prev_txns = await Transaction.find({"created_at": {"$gte": prev_start, "$lt": start}, "status": TransactionStatus.success}).to_list()

    totals: dict = defaultdict(float)
    for t in txns:
        totals[bucket_key(t.created_at)] += t.amount

    points = [round(totals.get(b, 0.0), 2) for b in buckets]
    total  = sum(points)

    prev_total = sum(t.amount for t in prev_txns)
    if prev_total > 0:
        change_pct = round(((total - prev_total) / prev_total) * 100, 1)
    else:
        change_pct = 0.0

    return {
        "total":      total,
        "change_pct": change_pct,
        "points":     points,
        "labels":     buckets,
    }


@router.get("/payments")
async def get_payments(
    admin: User = Depends(require_admin),
):
    from app.models.transaction import Transaction
    txns = await Transaction.find({"status": "Success"}).sort("-created_at").to_list()
    result = []
    # Batch user lookup for profile pic + account info
    from bson import ObjectId
    uid_oids = []
    for t in txns:
        try:
            if t.user_id:
                uid_oids.append(ObjectId(t.user_id))
        except Exception:
            pass
    users_map: dict = {}
    if uid_oids:
        ulist = await User.find({"_id": {"$in": uid_oids}}).to_list()
        users_map = {str(u.id): u for u in ulist}
    for t in txns:
        sub = (t.subtitle or "")
        u = users_map.get(t.user_id or "")
        if "Banner" in sub:
            typ = "Advertisement"
        elif "Video" in sub:
            typ = "Advertisement"
        elif "Featured" in sub or "promotion" in sub.lower():
            typ = "Promote Vehicle"
        elif "Advertisement" in sub:
            typ = "Advertisement"
        elif "Subscription" in sub:
            typ = "Subscription"
        elif "Insurance" in sub:
            typ = "Insurance"
        elif "Extra" in sub:
            typ = "Ads"
        elif "Reserve" in sub:
            typ = "Reserver"
        elif "Tracker" in sub:
            typ = "Tracker"
        else:
            typ = "Subscription"
        role_val = ""
        try:
            role_val = u.role.value if u and hasattr(u.role, "value") else (str(u.role) if u else "")
        except Exception:
            role_val = ""
        result.append({
            "id": str(t.id),
            "name": t.title,
            "tag": sub,
            "type": typ,
            "amount": f"{t.amount:,.0f}",
            "txn": f"TXN-{str(t.id)[-8:].upper()}",
            "time": t.created_at.strftime("%I:%M %p"),
            "month": t.created_at.strftime("%Y-%m"),
            "month_label": t.created_at.strftime("%b %Y"),
            "date": t.created_at.strftime("%d %b %Y"),
            "status": "Completed",
            "initials": t.initials,
            "avatar_url": getattr(u, "avatar_url", None) if u else None,
            "role": role_val,
            "email": getattr(u, "email", None) if u else None,
            "phone": getattr(u, "phone", None) if u else None,
        })
    return {"items": result, "count": len(result)}


@router.get("/payments/overview")
async def get_payments_overview(
    admin: User = Depends(require_admin),
):
    from app.models.dealer_subscription import DealerSubscription, SubStatus
    total_dealers = await User.find({"role": "dealership_owner"}).count()
    total_individual = await User.find({"role": "individual_seller"}).count()
    total = total_dealers + total_individual
    active = await DealerSubscription.find({"status": SubStatus.active}).count()
    expired = await DealerSubscription.find({"status": {"$in": [SubStatus.expired, SubStatus.cancelled]}}).count()
    if active == 0:
        from app.models.transaction import Transaction
        active = await Transaction.find({"subtitle": {"$regex": "Subscription"}, "status": "Success"}).count()
    return {"total_dealers": total, "active_subscriptions": active, "expired_cancelled": expired}


@router.get("/home-stats")
async def get_home_stats(
    admin: User = Depends(require_admin),
):
    from app.models.vehicle import VehicleListing
    from app.models.transaction import Transaction, TransactionStatus
    from datetime import datetime, timedelta
    total_users = await User.find({}).count()
    dealers = await User.find({"role": "dealership_owner"}).count()
    individual = await User.find({"role": "individual_seller"}).count()
    insurance = await User.find({"role": "insurance_provider"}).count()
    banks = await User.find({"role": "bank_representative"}).count()
    trackers = await User.find({"role": "tracker_provider"}).count()
    active_listings = await VehicleListing.find({"status": "active"}).count()
    now = datetime.utcnow()
    start_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    reservations_today = await Transaction.find({"subtitle": {"$regex": "Reserver"}, "status": TransactionStatus.success, "created_at": {"$gte": start_today}}).count()
    start_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    month_txns = await Transaction.find({"status": TransactionStatus.success, "created_at": {"$gte": start_month}}).to_list()
    monthly_revenue = sum(t.amount for t in month_txns)
    return {
        "total_users": total_users,
        "dealers": dealers + individual,
        "insurance": insurance,
        "banks": banks,
        "trackers": trackers,
        "active_listings": active_listings,
        "reservations_today": reservations_today,
        "monthly_revenue": monthly_revenue,
    }


class AdPaymentCreate(BaseModel):
    amount: float = 0.0
    boost_weeks: int = 6
    title: str = "Advertisement"
    vehicle_id: Optional[str] = None


@router.post("/payments/advertisement")
async def record_advertisement_payment(
    payload: AdPaymentCreate,
    current_user: User = Depends(get_current_user),
):
    from app.models.transaction import Transaction, TransactionStatus
    initials = "".join([p[0].upper() for p in (current_user.full_name or "U").split() if p])[:2] or "U"
    role_label = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    txn = Transaction(
        user_id=str(current_user.id),
        initials=initials,
        title=current_user.full_name or current_user.email,
        subtitle=f"Advertisement • {payload.title} • {role_label} • {payload.boost_weeks}w",
        amount=float(payload.amount or 0),
        status=TransactionStatus.success,
    )
    await txn.insert()
    return {"ok": True, "transaction_id": str(txn.id)}


@router.post("/payments/tracker")
async def record_tracker_payment(
    payload: AdPaymentCreate,
    current_user: User = Depends(get_current_user),
):
    from app.models.transaction import Transaction, TransactionStatus
    initials = "".join([p[0].upper() for p in (current_user.full_name or "U").split() if p])[:2] or "U"
    role_label = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    txn = Transaction(
        user_id=str(current_user.id),
        initials=initials,
        title=current_user.full_name or current_user.email,
        subtitle=f"Tracker • {payload.title} • {role_label}",
        amount=float(payload.amount or 0),
        status=TransactionStatus.success,
    )
    await txn.insert()
    return {"ok": True, "transaction_id": str(txn.id)}


@router.post("/payments/reserver")
async def record_reserver_payment(
    payload: AdPaymentCreate,
    current_user: User = Depends(get_current_user),
):
    from app.models.transaction import Transaction, TransactionStatus
    initials = "".join([p[0].upper() for p in (current_user.full_name or "U").split() if p])[:2] or "U"
    role_label = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    # Dealer-wise grouping: "Reserver • DealerName • VehicleTitle • role"
    dealer_name = ""
    vehicle_title = payload.title or ""
    if payload.vehicle_id:
        try:
            from app.models.vehicle import VehicleListing
            v = await VehicleListing.get(payload.vehicle_id)
            if v:
                vehicle_title = v.title or vehicle_title
                try:
                    seller = await User.get(v.seller_id)
                    if seller:
                        dealer_name = seller.full_name or ""
                except Exception:
                    pass
        except Exception:
            pass
    if dealer_name:
        subtitle = f"Reserver • {dealer_name} • {vehicle_title} • {role_label}"
    else:
        subtitle = f"Reserver • {vehicle_title} • {role_label}"
    txn = Transaction(
        user_id=str(current_user.id),
        initials=initials,
        title=current_user.full_name or current_user.email,
        subtitle=subtitle,
        amount=float(payload.amount or 0),
        status=TransactionStatus.success,
    )
    await txn.insert()
    return {"ok": True, "transaction_id": str(txn.id)}


@router.post("/payments/insurance")
async def record_insurance_payment(
    payload: AdPaymentCreate,
    current_user: User = Depends(get_current_user),
):
    from app.models.transaction import Transaction, TransactionStatus
    initials = "".join([p[0].upper() for p in (current_user.full_name or "U").split() if p])[:2] or "U"
    role_label = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    txn = Transaction(
        user_id=str(current_user.id),
        initials=initials,
        title=current_user.full_name or current_user.email,
        subtitle=f"Insurance • {payload.title} • {role_label}",
        amount=float(payload.amount or 0),
        status=TransactionStatus.success,
    )
    await txn.insert()
    return {"ok": True, "transaction_id": str(txn.id)}


@router.post("/payments/extra")
async def record_extra_payment(    payload: AdPaymentCreate,
    current_user: User = Depends(get_current_user),
):
    from app.models.transaction import Transaction, TransactionStatus
    initials = "".join([p[0].upper() for p in (current_user.full_name or "U").split() if p])[:2] or "U"
    role_label = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    txn = Transaction(
        user_id=str(current_user.id),
        initials=initials,
        title=current_user.full_name or current_user.email,
        subtitle=f"Extra • {payload.title} • {role_label} • {payload.boost_weeks}w",
        amount=float(payload.amount or 0),
        status=TransactionStatus.success,
    )
    await txn.insert()
    return {"ok": True, "transaction_id": str(txn.id)}


class AdminBannerCreate(BaseModel):
    title:            str
    description:      Optional[str]  = None
    campaign_name:    Optional[str]  = None
    banner_image_url: Optional[str]  = None
    display_location: str            = "Home Screen Top"
    partner:          str            = "Autowizor"
    user_type:        str            = "All Users"
    cities:           List[str]      = []
    boost_weeks:      int            = 6
    start_date:       Optional[str]  = None
    end_date:         Optional[str]  = None


@router.post("/banners")
async def admin_create_banner(
    payload: AdminBannerCreate,
    admin: User = Depends(require_admin),
):
    start = datetime.fromisoformat(payload.start_date) if payload.start_date else datetime.utcnow()
    end   = datetime.fromisoformat(payload.end_date)   if payload.end_date   else datetime.utcnow() + timedelta(weeks=payload.boost_weeks)

    ad = BannerAd(
        dealer_id=str(admin.id),
        title=payload.title,
        description=payload.description,
        campaign_name=payload.campaign_name,
        banner_image_url=payload.banner_image_url,
        display_location=payload.display_location,
        partner=payload.partner,
        user_type=payload.user_type,
        cities=payload.cities,
        boost_weeks=payload.boost_weeks,
        amount=0.0,
        status=AdStatus.active,
        start_date=start,
        end_date=end,
        expires_at=end,
    )
    await ad.insert()
    return {"id": str(ad.id), "status": "active"}


@router.patch("/partners/{user_id}/status")
async def update_partner_status(
    user_id: str,
    is_active: bool,
    admin: User = Depends(require_admin),
):
    user = await User.get(user_id)
    if not user or user.role not in PARTNER_ROLES:
        raise HTTPException(status_code=404, detail="Partner not found")
    user.is_active = is_active
    await user.save()
    return {"ok": True}


# ── Vehicle Approve / Reject ──────────────────────────────────────────────────

@router.post("/vehicles/{vehicle_id}/approve")
async def approve_vehicle(vehicle_id: str, admin: User = Depends(require_admin)):
    v = await VehicleListing.get(vehicle_id)
    if not v:
        raise HTTPException(404, "Vehicle not found")
    from app.models.vehicle import ListingStatus
    v.status = ListingStatus.active
    v.updated_at = datetime.utcnow()
    await v.save()
    return {"message": "Vehicle approved"}


@router.post("/vehicles/{vehicle_id}/reject")
async def reject_vehicle(vehicle_id: str, admin: User = Depends(require_admin)):
    v = await VehicleListing.get(vehicle_id)
    if not v:
        raise HTTPException(404, "Vehicle not found")
    from app.models.vehicle import ListingStatus
    v.status = ListingStatus.expired
    v.updated_at = datetime.utcnow()
    await v.save()
    return {"message": "Vehicle rejected"}


# ── Document Verification ─────────────────────────────────────────────────────

class ReviewDocsRequest(BaseModel):
    action: str                  # "approve" or "reject"
    reason: Optional[str] = None


@router.get("/users/pending-verification")
async def get_pending_verification_users(
    admin: User = Depends(require_admin),
):
    users = await User.find(User.docs_status == "pending").to_list()
    return [
        {
            "id": str(u.id),
            "full_name": u.full_name,
            "email": u.email,
            "phone": u.phone,
            "role": u.role.value,
            "docs_status": u.docs_status,
            "avatar_url": u.avatar_url,
            "cover_photo_url": u.cover_photo_url,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]


@router.get("/users/verification-counts")
async def get_verification_counts(
    admin: User = Depends(require_admin),
):
    pending = await User.find(User.docs_status == "pending").count()
    approved = await User.find(User.docs_status == "approved").count()
    rejected = await User.find(User.docs_status == "rejected").count()
    return {"pending": pending, "approved": approved, "rejected": rejected}


@router.post("/users/{user_id}/review-documents")
async def review_user_documents(
    user_id: str,
    payload: ReviewDocsRequest,
    admin: User = Depends(require_admin),
):
    if payload.action not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="Action must be 'approve' or 'reject'")

    user = await User.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.docs_status = "approved" if payload.action == "approve" else "rejected"
    if payload.reason:
        user.docs_rejection_reason = payload.reason
    await user.save()

    if payload.action == "approve":
        title = "Account Approved!"
        body = "Congratulations! Your account has been verified. You can now access all features."
    else:
        reason_text = payload.reason or "Please contact support for details."
        title = "Verification Failed"
        body = f"Your account verification was not approved. Reason: {reason_text}"

    await Notification(
        user_id=str(user.id),
        type="doc_review",
        title=title,
        body=body,
        data={"action": payload.action, "reason": payload.reason or ""},
        created_at=datetime.utcnow(),
    ).insert()

    return {"message": f"User documents {payload.action}d", "docs_status": user.docs_status}


# ── Inventory / tracker limits (Inventory Permission page) ──────────────────

DEFAULT_FREE_LIMIT = 5


class InventoryLimitUpdate(BaseModel):
    inventory_limit: Optional[int] = None
    tracker_limit: Optional[int] = None


@router.get("/inventory-limits")
async def get_inventory_limits(
    admin: User = Depends(require_admin),
):
    from app.models.tracker_device import TrackerDevice
    from app.models.dealer_subscription import PLAN_LIMITS, DealerPlan
    partners = await User.find({"role": {"$in": [r.value for r in PARTNER_ROLES]}}).to_list()
    result = []
    for p in partners:
        uid = str(p.id)
        sub = await DealerSubscription.find_one({"dealer_id": uid, "status": "active"})
        plan = sub.plan.value if sub else DealerPlan.basic.value
        plan_limit = PLAN_LIMITS.get(sub.plan if sub else DealerPlan.basic, DEFAULT_FREE_LIMIT)
        inv_limit = p.inventory_limit if p.inventory_limit is not None else plan_limit
        trk_limit = p.tracker_limit if p.tracker_limit is not None else DEFAULT_FREE_LIMIT
        inv_used = await VehicleListing.find({"seller_id": uid, "status": {"$in": ["active", "pending"]}}).count()
        trk_used = await TrackerDevice.find({"provider_id": uid, "status": {"$in": ["under_review", "published"]}}).count()
        result.append({
            "id": uid,
            "name": p.full_name,
            "type": ROLE_LABEL.get(p.role, "Partner"),
            "role": p.role.value,
            "avatar_url": p.avatar_url,
            "plan": plan,
            "inventory_limit": inv_limit,
            "inventory_used": inv_used,
            "inventory_custom": p.inventory_limit is not None,
            "tracker_limit": trk_limit,
            "trackers_used": trk_used,
            "tracker_custom": p.tracker_limit is not None,
        })
    return result


@router.put("/inventory-limits/{user_id}")
async def set_inventory_limit(
    user_id: str,
    payload: InventoryLimitUpdate,
    admin: User = Depends(require_admin),
):
    user = await User.get(user_id)
    if not user or user.role not in PARTNER_ROLES:
        raise HTTPException(status_code=404, detail="Partner not found")
    if payload.inventory_limit is not None:
        if payload.inventory_limit < -1:
            raise HTTPException(status_code=400, detail="inventory_limit must be -1 (unlimited) or >= 0")
        user.inventory_limit = payload.inventory_limit
    if payload.tracker_limit is not None:
        if payload.tracker_limit < -1:
            raise HTTPException(status_code=400, detail="tracker_limit must be -1 (unlimited) or >= 0")
        user.tracker_limit = payload.tracker_limit
    await user.save()
    return {"message": "Limits updated", "id": str(user.id), "inventory_limit": user.inventory_limit, "tracker_limit": user.tracker_limit}


@router.get("/users/{user_id}/documents")
async def get_user_documents(
    user_id: str,
    admin: User = Depends(require_admin),
):
    from app.models.document import UserDocument
    user = await User.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    docs = await UserDocument.find({"user_id": user_id}).to_list()
    return [
        {
            "id": str(d.id),
            "type": d.type,
            "desc": d.desc,
            "file_url": d.file_url,
            "status": d.status.value,
            "uploaded_at": d.uploaded_at.strftime("%d %b %Y") if d.uploaded_at else None,
        }
        for d in docs
    ]

    return {"message": f"User documents {payload.action}d", "docs_status": user.docs_status}
