from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.models.ad_analytics import AdAnalytics
from app.models.banner_ad import BannerAd, AdStatus as BannerStatus
from app.models.video_ad import VideoAd, VideoAdStatus
from app.models.user import User
from app.routers.auth import get_current_user

router = APIRouter(prefix="/ads/analytics", tags=["Ad Analytics"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class TrackEventRequest(BaseModel):
    ad_id:    str
    ad_type:  str            # "banner" | "video"
    event:    str            # "impression" | "click" | "call" | "favorite" | "enquiry" | "share"


class DailyTrend(BaseModel):
    day:   str
    value: int


class AdAnalyticsSummary(BaseModel):
    ad_id:       str
    ad_type:     str
    title:       str
    status:      str
    impressions: int
    clicks:      int
    calls:       int
    favorites:   int
    enquiries:   int
    shares:      int
    amount:      float
    expires_at:  str


class OverviewResponse(BaseModel):
    total_impressions: int
    total_clicks:      int
    total_calls:       int
    total_favorites:   int
    total_enquiries:   int
    total_shares:      int
    total_spend:       float
    avg_ctr:           float
    trend_7days:       List[DailyTrend]
    top_campaigns:     List[AdAnalyticsSummary]


# ── Helper ────────────────────────────────────────────────────────────────────

async def _get_or_create_analytics(ad_id: str, ad_type: str, dealer_id: str) -> AdAnalytics:
    today = datetime.utcnow().strftime("%Y-%m-%d")
    rec   = await AdAnalytics.find_one({"ad_id": ad_id, "date": today})
    if not rec:
        rec = AdAnalytics(ad_id=ad_id, ad_type=ad_type, dealer_id=dealer_id, date=today)
        await rec.insert()
    return rec


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/track")
async def track_event(
    payload:      TrackEventRequest,
    current_user: User = Depends(get_current_user),
):
    """Track an impression, click, call, favorite, enquiry, or share for an ad."""
    valid_events = {"impression", "click", "call", "favorite", "enquiry", "share"}
    if payload.event not in valid_events:
        raise HTTPException(400, f"Invalid event. Must be one of: {valid_events}")

    rec = await _get_or_create_analytics(payload.ad_id, payload.ad_type, str(current_user.id))

    field_map = {
        "impression": "impressions",
        "click":      "clicks",
        "call":       "calls",
        "favorite":   "favorites",
        "enquiry":    "enquiries",
        "share":      "shares",
    }
    field = field_map[payload.event]
    setattr(rec, field, getattr(rec, field) + 1)
    rec.updated_at = datetime.utcnow()
    await rec.save()
    return {"message": "Tracked", "event": payload.event}


@router.get("/overview", response_model=OverviewResponse)
async def get_overview(current_user: User = Depends(get_current_user)):
    dealer_id = str(current_user.id)

    # All analytics records for this dealer
    all_records = await AdAnalytics.find({"dealer_id": dealer_id}).to_list()

    total_impressions = sum(r.impressions for r in all_records)
    total_clicks      = sum(r.clicks      for r in all_records)
    total_calls       = sum(r.calls       for r in all_records)
    total_favorites   = sum(r.favorites   for r in all_records)
    total_enquiries   = sum(r.enquiries   for r in all_records)
    total_shares      = sum(r.shares      for r in all_records)

    # Total spend from active ads
    banners      = await BannerAd.find({"dealer_id": dealer_id, "status": {"$in": ["active", "expired"]}}).to_list()
    video_ads    = await VideoAd.find({"dealer_id": dealer_id, "status": {"$in": ["active", "expired"]}}).to_list()
    total_spend  = sum(a.amount for a in banners) + sum(a.amount for a in video_ads)

    # Avg CTR
    avg_ctr = round((total_clicks / total_impressions * 100), 2) if total_impressions > 0 else 0.0

    # 7-day trend
    trend_7days: list[DailyTrend] = []
    for i in range(6, -1, -1):
        day     = (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d")
        day_recs = [r for r in all_records if r.date == day]
        val      = sum(r.impressions for r in day_recs)
        label    = (datetime.utcnow() - timedelta(days=i)).strftime("%a")
        trend_7days.append(DailyTrend(day=label, value=val))

    # Top campaigns — per ad aggregate
    ad_map: dict[str, dict] = {}
    for r in all_records:
        if r.ad_id not in ad_map:
            ad_map[r.ad_id] = {
                "ad_id": r.ad_id, "ad_type": r.ad_type,
                "impressions": 0, "clicks": 0, "calls": 0,
                "favorites": 0, "enquiries": 0, "shares": 0,
            }
        for f in ("impressions","clicks","calls","favorites","enquiries","shares"):
            ad_map[r.ad_id][f] += getattr(r, f)

    top_campaigns: list[AdAnalyticsSummary] = []
    for ad_id, stats in sorted(ad_map.items(), key=lambda x: x[1]["impressions"], reverse=True)[:5]:
        title, status, amount, expires_at = "Unknown Ad", "unknown", 0.0, ""
        if stats["ad_type"] == "banner":
            ad = await BannerAd.get(ad_id)
            if ad:
                title, status, amount = ad.title, ad.status.value, ad.amount
                expires_at = ad.expires_at.isoformat()
        else:
            ad = await VideoAd.get(ad_id)
            if ad:
                title, status, amount = ad.title, ad.status.value, ad.amount
                expires_at = ad.expires_at.isoformat()
        top_campaigns.append(AdAnalyticsSummary(
            ad_id=ad_id, ad_type=stats["ad_type"], title=title,
            status=status, amount=amount, expires_at=expires_at,
            impressions=stats["impressions"], clicks=stats["clicks"],
            calls=stats["calls"],        favorites=stats["favorites"],
            enquiries=stats["enquiries"], shares=stats["shares"],
        ))

    return OverviewResponse(
        total_impressions=total_impressions,
        total_clicks=total_clicks,
        total_calls=total_calls,
        total_favorites=total_favorites,
        total_enquiries=total_enquiries,
        total_shares=total_shares,
        total_spend=total_spend,
        avg_ctr=avg_ctr,
        trend_7days=trend_7days,
        top_campaigns=top_campaigns,
    )


@router.get("/ad/{ad_id}", response_model=AdAnalyticsSummary)
async def get_ad_analytics(
    ad_id:        str,
    ad_type:      str  = "banner",
    current_user: User = Depends(get_current_user),
):
    """Get aggregated analytics for a specific ad."""
    records = await AdAnalytics.find({"ad_id": ad_id, "dealer_id": str(current_user.id)}).to_list()

    title, status, amount, expires_at = "Ad", "unknown", 0.0, ""
    if ad_type == "banner":
        ad = await BannerAd.get(ad_id)
        if ad:
            title, status, amount, expires_at = ad.title, ad.status.value, ad.amount, ad.expires_at.isoformat()
    else:
        ad = await VideoAd.get(ad_id)
        if ad:
            title, status, amount, expires_at = ad.title, ad.status.value, ad.amount, ad.expires_at.isoformat()

    return AdAnalyticsSummary(
        ad_id=ad_id, ad_type=ad_type, title=title, status=status,
        amount=amount, expires_at=expires_at,
        impressions=sum(r.impressions for r in records),
        clicks=sum(r.clicks      for r in records),
        calls=sum(r.calls        for r in records),
        favorites=sum(r.favorites  for r in records),
        enquiries=sum(r.enquiries  for r in records),
        shares=sum(r.shares       for r in records),
    )
