from datetime import datetime, timedelta
import hashlib
import hmac as hmac_lib
from urllib.parse import urlencode
from typing import List, Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

from app.config import settings
from app.models.video_ad import VideoAd, VideoAdStatus
from app.models.transaction import Transaction, TransactionStatus
from app.models.user import User, UserRole
from app.routers.auth import get_current_user

router = APIRouter(prefix="/video-ads", tags=["Video Ads"])

_SANDBOX       = settings.SAFEPAY_SANDBOX
_API_KEY       = settings.SAFEPAY_API_KEY
_PUBLIC_KEY    = settings.SAFEPAY_PUBLIC_KEY
_API_BASE      = "https://sandbox.api.getsafepay.com" if _SANDBOX else "https://api.getsafepay.com"
_CHECKOUT_BASE = "https://sandbox.api.getsafepay.com/checkout" if _SANDBOX else "https://getsafepay.com/checkout"
_ENV_PARAM     = "sandbox" if _SANDBOX else "production"
_BACKEND_URL   = settings.BACKEND_BASE_URL

PRICING = {6: 6650.0, 4: 5500.0, 2: 4450.0}

_SUCCESS_HTML = """<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Payment Successful</title>
  <style>
    body {{ font-family: sans-serif; background: #010a1f; color: #f9fafc;
           display: flex; flex-direction: column; align-items: center;
           justify-content: center; height: 100vh; margin: 0; text-align: center; padding: 20px; }}
    h1 {{ color: #22c55e; font-size: 2rem; margin-bottom: 12px; }}
    p  {{ color: #baacb6; font-size: 1rem; }}
    .btn {{ margin-top: 24px; background: #e2671b; color: #fff; border: none;
            padding: 14px 32px; border-radius: 30px; font-size: 1rem;
            cursor: pointer; text-decoration: none; display: inline-block; }}
  </style>
  <script>
    setTimeout(function() {{ window.location.href = 'caragain://vehicle/payment-success'; }}, 1500);
  </script>
</head>
<body>
  <h1>&#10003; Payment Successful!</h1>
  <p>Your Video Ad has been activated.<br>Returning to app...</p>
  <a class="btn" href="caragain://vehicle/payment-success">Return to App</a>
</body>
</html>"""


# ── Schemas ──────────────────────────────────────────────────────────────────

class VideoAdCreate(BaseModel):
    title:            str
    media_url:        Optional[str] = None
    display_location: str           = "Home Screen Top"
    partner:          str           = "Autowizor"
    user_type:        str           = "All Users"
    cities:           List[str]     = []
    boost_weeks:      int           = 6


class VideoAdResponse(BaseModel):
    id:               str
    dealer_id:        str
    title:            str
    media_url:        Optional[str]
    display_location: str
    partner:          str
    user_type:        str
    cities:           List[str]
    boost_weeks:      int
    amount:           float
    status:           str
    created_at:       str
    expires_at:       str


class CheckoutResponse(BaseModel):
    checkout_url: str
    video_ad_id:  str
    amount:       float


class StatusResponse(BaseModel):
    success: bool
    status:  str
    message: str


# ── Helpers ──────────────────────────────────────────────────────────────────

def _to_response(ad: VideoAd) -> VideoAdResponse:
    return VideoAdResponse(
        id=str(ad.id),
        dealer_id=ad.dealer_id,
        title=ad.title,
        media_url=ad.media_url,
        display_location=ad.display_location,
        partner=ad.partner,
        user_type=ad.user_type,
        cities=ad.cities,
        boost_weeks=ad.boost_weeks,
        amount=ad.amount,
        status=ad.status.value,
        created_at=ad.created_at.isoformat(),
        expires_at=ad.expires_at.isoformat(),
    )


async def _mark_active(ad: VideoAd) -> None:
    ad.status     = VideoAdStatus.active
    ad.expires_at = datetime.utcnow() + timedelta(weeks=ad.boost_weeks)
    await ad.save()
    await Transaction(
        user_id=ad.dealer_id,
        initials="VA",
        title="Video Ad – SafePay",
        subtitle=f"Advertisement • {ad.title} • {ad.boost_weeks} weeks",
        amount=ad.amount,
        status=TransactionStatus.success,
    ).insert()


# ── Endpoints ─────────────────────────────────────────────────────────────────

class VideoAdSimpleCreate(BaseModel):
    title:            str
    media_url:        Optional[str] = None
    display_location: str           = "Home Screen Top"
    partner:          str           = "Autowizor"
    user_type:        str           = "All Users"
    cities:           List[str]     = []


@router.post("/create", response_model=VideoAdResponse, status_code=201)
async def create_video_ad(
    payload:      VideoAdSimpleCreate,
    current_user: User = Depends(get_current_user),
):
    """Create a video ad without payment (active for 30 days by default)."""
    # Paid-first policy — everyone except admin stays pending (under review) until payment + admin approval
    pending_first = current_user.role != UserRole.admin
    ad = VideoAd(
        dealer_id=str(current_user.id),
        title=payload.title,
        media_url=payload.media_url,
        display_location=payload.display_location,
        partner=payload.partner,
        user_type=payload.user_type,
        cities=payload.cities,
        boost_weeks=4,
        amount=0.0,
        status=VideoAdStatus.pending if pending_first else VideoAdStatus.active,
        expires_at=datetime.utcnow() + timedelta(days=30),
    )
    await ad.insert()
    return _to_response(ad)


@router.post("/{video_ad_id}/promote", response_model=CheckoutResponse)
async def promote_existing_video_ad(
    video_ad_id:  str,
    payload:      VideoAdCreate,
    current_user: User = Depends(get_current_user),
):
    """Initiate payment to promote an already-created video ad."""
    ad = await VideoAd.get(video_ad_id)
    if not ad:
        raise HTTPException(status_code=404, detail="Video ad not found")
    if ad.dealer_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not your video ad")

    amount = PRICING.get(payload.boost_weeks, 6650.0)
    ad.boost_weeks = payload.boost_weeks
    ad.amount      = amount
    ad.status      = VideoAdStatus.pending
    await ad.save()

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{_API_BASE}/order/v1/init",
                headers={
                    "X-SFPY-MERCHANT-SECRET": _API_KEY,
                    "Content-Type": "application/json",
                },
                json={
                    "client":      _PUBLIC_KEY,
                    "amount":      float(amount),
                    "currency":    "PKR",
                    "environment": _ENV_PARAM,
                },
            )
            data = resp.json()
            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail=f"SafePay error: {data}")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"SafePay error: {exc}")

    tracker_token      = data["data"]["token"]
    ad.safepay_tracker = tracker_token
    await ad.save()

    redirect_url = f"{_BACKEND_URL}/api/v1/video-ads/redirect/{video_ad_id}"
    cancel_url   = f"{_BACKEND_URL}/api/v1/video-ads/cancel"
    params       = urlencode({
        "beacon":       tracker_token,
        "env":          _ENV_PARAM,
        "source":       "mobile",
        "redirect_url": redirect_url,
        "cancel_url":   cancel_url,
    })
    checkout_url = f"{_CHECKOUT_BASE}/pay?{params}"

    return CheckoutResponse(checkout_url=checkout_url, video_ad_id=video_ad_id, amount=amount)


@router.post("/checkout", response_model=CheckoutResponse)
async def create_video_ad_checkout(
    payload:      VideoAdCreate,
    current_user: User = Depends(get_current_user),
):
    amount = PRICING.get(payload.boost_weeks, 6650.0)

    ad = VideoAd(
        dealer_id=str(current_user.id),
        title=payload.title,
        media_url=payload.media_url,
        display_location=payload.display_location,
        partner=payload.partner,
        user_type=payload.user_type,
        cities=payload.cities,
        boost_weeks=payload.boost_weeks,
        amount=amount,
        status=VideoAdStatus.pending,
    )
    await ad.insert()
    ad_id = str(ad.id)

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{_API_BASE}/order/v1/init",
                headers={
                    "X-SFPY-MERCHANT-SECRET": _API_KEY,
                    "Content-Type": "application/json",
                },
                json={
                    "client":      _PUBLIC_KEY,
                    "amount":      float(amount),
                    "currency":    "PKR",
                    "environment": _ENV_PARAM,
                },
            )
            data = resp.json()
            if resp.status_code != 200:
                await ad.delete()
                raise HTTPException(status_code=502, detail=f"SafePay error: {data}")
    except HTTPException:
        raise
    except Exception as exc:
        await ad.delete()
        raise HTTPException(status_code=502, detail=f"SafePay error: {exc}")

    tracker_token         = data["data"]["token"]
    ad.safepay_tracker    = tracker_token
    await ad.save()

    redirect_url = f"{_BACKEND_URL}/api/v1/video-ads/redirect/{ad_id}"
    cancel_url   = f"{_BACKEND_URL}/api/v1/video-ads/cancel"
    params       = urlencode({
        "beacon":       tracker_token,
        "env":          _ENV_PARAM,
        "source":       "mobile",
        "redirect_url": redirect_url,
        "cancel_url":   cancel_url,
    })
    checkout_url = f"{_CHECKOUT_BASE}/pay?{params}"

    return CheckoutResponse(checkout_url=checkout_url, video_ad_id=ad_id, amount=amount)


@router.get("/redirect/{video_ad_id}", response_class=HTMLResponse)
async def video_ad_redirect(video_ad_id: str, tracker: str = "", sig: str = ""):
    ad = await VideoAd.get(video_ad_id)
    if not ad:
        return HTMLResponse(_SUCCESS_HTML)
    if ad.status == VideoAdStatus.active:
        return HTMLResponse(_SUCCESS_HTML)
    await _mark_active(ad)
    return HTMLResponse(_SUCCESS_HTML)


@router.get("/cancel", response_class=HTMLResponse)
async def video_ad_cancel():
    return HTMLResponse("""<!DOCTYPE html><html><body style="background:#010a1f;color:#f9fafc;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;text-align:center">
    <div><h1 style="color:#e2671b">Payment Cancelled</h1><p>Close this page and return to the app.</p>
    <a href="caragain://" style="background:#e2671b;color:#fff;padding:12px 28px;border-radius:25px;text-decoration:none;margin-top:20px;display:inline-block">Return to App</a></div>
    </body></html>""")


@router.get("/status/{video_ad_id}", response_model=StatusResponse)
async def video_ad_status(
    video_ad_id:  str,
    current_user: User = Depends(get_current_user),
):
    ad = await VideoAd.get(video_ad_id)
    if not ad:
        raise HTTPException(status_code=404, detail="Video ad not found")
    if ad.dealer_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not your video ad")
    if ad.status == VideoAdStatus.active:
        return StatusResponse(success=True, status="active", message="Payment confirmed")
    return StatusResponse(success=False, status=ad.status.value, message="Awaiting payment")


@router.get("/my", response_model=List[VideoAdResponse])
async def my_video_ads(current_user: User = Depends(get_current_user)):
    ads = await VideoAd.find({"dealer_id": str(current_user.id)}).sort("-created_at").to_list()
    return [_to_response(a) for a in ads]


@router.delete("/{video_ad_id}")
async def delete_video_ad(
    video_ad_id:  str,
    current_user: User = Depends(get_current_user),
):
    ad = await VideoAd.get(video_ad_id)
    if not ad:
        raise HTTPException(status_code=404, detail="Not found")
    if ad.dealer_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not your video ad")
    await ad.delete()
    return {"message": "Deleted"}
