from datetime import datetime, timedelta
from typing import List, Optional
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

from app.config import settings
from app.models.banner_ad import BannerAd, AdStatus
from app.models.transaction import Transaction, TransactionStatus
from app.models.user import User
from app.routers.auth import get_current_user

router = APIRouter(prefix="/banner-ads", tags=["Banner Ads"])

_SANDBOX       = settings.SAFEPAY_SANDBOX
_API_KEY       = settings.SAFEPAY_API_KEY
_PUBLIC_KEY    = settings.SAFEPAY_PUBLIC_KEY
_API_BASE      = "https://sandbox.api.getsafepay.com" if _SANDBOX else "https://api.getsafepay.com"
_CHECKOUT_BASE = "https://sandbox.api.getsafepay.com/checkout" if _SANDBOX else "https://getsafepay.com/checkout"
_ENV_PARAM     = "sandbox" if _SANDBOX else "production"
_BACKEND_URL   = settings.BACKEND_BASE_URL

PRICING: dict[int, float] = {6: 6650.0, 4: 5500.0, 2: 4450.0}

_SUCCESS_HTML = """<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Payment Successful</title>
  <style>
    body{{font-family:sans-serif;background:#010a1f;color:#f9fafc;display:flex;flex-direction:column;
          align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;padding:20px}}
    h1{{color:#22c55e;font-size:2rem;margin-bottom:12px}}
    p{{color:#baacb6;font-size:1rem}}
    .btn{{margin-top:24px;background:#e2671b;color:#fff;border:none;padding:14px 32px;
          border-radius:30px;font-size:1rem;cursor:pointer;text-decoration:none;display:inline-block}}
  </style>
  <script>setTimeout(function(){{window.location.href='caragain://vehicle/payment-success';}},1500);</script>
</head>
<body>
  <h1>&#10003; Payment Successful!</h1>
  <p>Your Banner Ad is now live.<br>Returning to app...</p>
  <a class="btn" href="caragain://vehicle/payment-success">Return to App</a>
</body>
</html>"""

_CANCEL_HTML = """<!DOCTYPE html>
<html>
<head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cancelled</title>
<style>body{{font-family:sans-serif;background:#010a1f;color:#f9fafc;display:flex;align-items:center;
justify-content:center;height:100vh;margin:0;text-align:center}}
h1{{color:#e2671b}}
.btn{{margin-top:20px;background:#e2671b;color:#fff;padding:12px 28px;border-radius:25px;
      text-decoration:none;display:inline-block}}</style></head>
<body><div><h1>Payment Cancelled</h1><p>Return to the app to try again.</p>
<a href="caragain://" class="btn">Return to App</a></div></body></html>"""


# ── Schemas ──────────────────────────────────────────────────────────────────

class BannerAdCreate(BaseModel):
    title:            str
    description:      Optional[str]  = None
    campaign_name:    Optional[str]  = None
    banner_image_url: Optional[str]  = None
    display_location: str            = "Home Screen Top"
    partner:          str            = "Autowizor"
    show_on_pages:    List[str]      = []
    user_type:        str            = "All Users"
    cities:           List[str]      = []
    boost_weeks:      int            = 6
    start_date:       Optional[str]  = None
    end_date:         Optional[str]  = None


class BannerAdResponse(BaseModel):
    id:               str
    dealer_id:        str
    title:            str
    description:      Optional[str]
    campaign_name:    Optional[str]
    banner_image_url: Optional[str]
    display_location: str
    partner:          str
    show_on_pages:    List[str]
    user_type:        str
    cities:           List[str]
    boost_weeks:      int
    amount:           float
    status:           str
    created_at:       str
    expires_at:       str


class CheckoutResponse(BaseModel):
    checkout_url:  str
    banner_ad_id:  str
    amount:        float


class StatusResponse(BaseModel):
    success: bool
    status:  str
    message: str


# ── Helper ────────────────────────────────────────────────────────────────────

def _to_resp(ad: BannerAd) -> BannerAdResponse:
    return BannerAdResponse(
        id=str(ad.id),
        dealer_id=ad.dealer_id,
        title=ad.title,
        description=ad.description,
        campaign_name=ad.campaign_name,
        banner_image_url=ad.banner_image_url,
        display_location=ad.display_location,
        partner=ad.partner,
        show_on_pages=ad.show_on_pages,
        user_type=ad.user_type,
        cities=ad.cities,
        boost_weeks=ad.boost_weeks,
        amount=ad.amount,
        status=ad.status.value,
        created_at=ad.created_at.isoformat(),
        expires_at=ad.expires_at.isoformat(),
    )


async def _activate(ad: BannerAd) -> None:
    ad.status     = AdStatus.active
    ad.expires_at = datetime.utcnow() + timedelta(weeks=ad.boost_weeks)
    await ad.save()
    await Transaction(
        user_id=ad.dealer_id,
        initials="BA",
        title="Banner Ad – SafePay",
        subtitle=f"Advertisement • {ad.title} • {ad.boost_weeks} weeks",
        amount=ad.amount,
        status=TransactionStatus.success,
    ).insert()


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[BannerAdResponse])
async def list_public_banner_ads(limit: int = Query(20, ge=1, le=50)):
    """Public — active, non-expired banner ads for the home screen."""
    now = datetime.utcnow()
    ads = await BannerAd.find({"status": AdStatus.active}).sort("-created_at").limit(limit).to_list()
    return [_to_resp(a) for a in ads if not (a.expires_at and a.expires_at < now)]


@router.post("/create", response_model=BannerAdResponse, status_code=201)
async def create_banner_ad(
    payload:      BannerAdCreate,
    current_user: User = Depends(get_current_user),
):
    """Create a banner ad without payment (active for 30 days)."""
    ad = BannerAd(
        dealer_id=str(current_user.id),
        title=payload.title,
        description=payload.description,
        campaign_name=payload.campaign_name,
        banner_image_url=payload.banner_image_url,
        display_location=payload.display_location,
        partner=payload.partner,
        show_on_pages=payload.show_on_pages,
        user_type=payload.user_type,
        cities=payload.cities,
        boost_weeks=payload.boost_weeks,
        amount=0.0,
        status=AdStatus.active,
        expires_at=datetime.utcnow() + timedelta(days=30),
    )
    await ad.insert()
    return _to_resp(ad)


@router.post("/checkout", response_model=CheckoutResponse, status_code=201)
async def create_checkout(
    payload:      BannerAdCreate,
    current_user: User = Depends(get_current_user),
):
    amount = PRICING.get(payload.boost_weeks, 6650.0)
    ad = BannerAd(
        dealer_id=str(current_user.id),
        title=payload.title,
        description=payload.description,
        campaign_name=payload.campaign_name,
        banner_image_url=payload.banner_image_url,
        display_location=payload.display_location,
        partner=payload.partner,
        show_on_pages=payload.show_on_pages,
        user_type=payload.user_type,
        cities=payload.cities,
        boost_weeks=payload.boost_weeks,
        amount=amount,
        status=AdStatus.pending,
    )
    await ad.insert()
    ad_id = str(ad.id)

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{_API_BASE}/order/v1/init",
                headers={"X-SFPY-MERCHANT-SECRET": _API_KEY, "Content-Type": "application/json"},
                json={"client": _PUBLIC_KEY, "amount": float(amount), "currency": "PKR", "environment": _ENV_PARAM},
            )
            data = resp.json()
            if resp.status_code != 200:
                await ad.delete()
                raise HTTPException(502, f"SafePay error: {data}")
    except HTTPException:
        raise
    except Exception as exc:
        await ad.delete()
        raise HTTPException(502, f"SafePay connection error: {exc}")

    tracker            = data["data"]["token"]
    ad.safepay_tracker = tracker
    await ad.save()

    redirect_url = f"{_BACKEND_URL}/api/v1/banner-ads/redirect/{ad_id}"
    cancel_url   = f"{_BACKEND_URL}/api/v1/banner-ads/cancel"
    params       = urlencode({"beacon": tracker, "env": _ENV_PARAM, "source": "mobile",
                               "redirect_url": redirect_url, "cancel_url": cancel_url})
    checkout_url = f"{_CHECKOUT_BASE}/pay?{params}"

    return CheckoutResponse(checkout_url=checkout_url, banner_ad_id=ad_id, amount=amount)


@router.get("/redirect/{banner_ad_id}", response_class=HTMLResponse)
async def safepay_redirect(banner_ad_id: str, tracker: str = "", sig: str = ""):
    ad = await BannerAd.get(banner_ad_id)
    if not ad or ad.status == AdStatus.active:
        return HTMLResponse(_SUCCESS_HTML)
    await _activate(ad)
    return HTMLResponse(_SUCCESS_HTML)


@router.get("/cancel", response_class=HTMLResponse)
async def safepay_cancel():
    return HTMLResponse(_CANCEL_HTML)


@router.get("/status/{banner_ad_id}", response_model=StatusResponse)
async def payment_status(
    banner_ad_id: str,
    current_user: User = Depends(get_current_user),
):
    ad = await BannerAd.get(banner_ad_id)
    if not ad:
        raise HTTPException(404, "Banner ad not found")
    if ad.dealer_id != str(current_user.id):
        raise HTTPException(403, "Not your ad")
    if ad.status == AdStatus.active:
        return StatusResponse(success=True, status="active", message="Payment confirmed")
    # Sandbox: auto-confirm
    if _SANDBOX:
        ad.status = AdStatus.active
        from datetime import datetime, timedelta
        ad.expires_at = datetime.utcnow() + timedelta(weeks=ad.boost_weeks or 6)
        await ad.save()
        return StatusResponse(success=True, status="active", message="Sandbox payment confirmed")
    return StatusResponse(success=False, status=ad.status.value, message="Awaiting payment")


@router.get("/my", response_model=List[BannerAdResponse])
async def my_banner_ads(
    status: Optional[str] = None,
    current_user: User    = Depends(get_current_user),
):
    query: dict = {"dealer_id": str(current_user.id)}
    if status:
        query["status"] = status
    ads = await BannerAd.find(query).sort("-created_at").to_list()
    # Auto-expire
    now = datetime.utcnow()
    for ad in ads:
        if ad.status == AdStatus.active and ad.expires_at < now:
            ad.status = AdStatus.expired
            await ad.save()
    return [_to_resp(a) for a in ads]


@router.get("/{banner_ad_id}", response_model=BannerAdResponse)
async def get_banner_ad(
    banner_ad_id: str,
    current_user: User = Depends(get_current_user),
):
    ad = await BannerAd.get(banner_ad_id)
    if not ad:
        raise HTTPException(404, "Not found")
    if ad.dealer_id != str(current_user.id):
        raise HTTPException(403, "Not your ad")
    return _to_resp(ad)


@router.patch("/{banner_ad_id}/pause")
async def pause_banner_ad(
    banner_ad_id: str,
    current_user: User = Depends(get_current_user),
):
    ad = await BannerAd.get(banner_ad_id)
    if not ad:
        raise HTTPException(404, "Not found")
    if ad.dealer_id != str(current_user.id):
        raise HTTPException(403, "Not your ad")
    if ad.status != AdStatus.active:
        raise HTTPException(400, "Only active ads can be paused")
    ad.status = AdStatus.paused
    await ad.save()
    return {"message": "Ad paused"}


@router.patch("/{banner_ad_id}/resume")
async def resume_banner_ad(
    banner_ad_id: str,
    current_user: User = Depends(get_current_user),
):
    ad = await BannerAd.get(banner_ad_id)
    if not ad:
        raise HTTPException(404, "Not found")
    if ad.dealer_id != str(current_user.id):
        raise HTTPException(403, "Not your ad")
    if ad.status != AdStatus.paused:
        raise HTTPException(400, "Only paused ads can be resumed")
    ad.status = AdStatus.active
    await ad.save()
    return {"message": "Ad resumed"}


@router.delete("/{banner_ad_id}")
async def delete_banner_ad(
    banner_ad_id: str,
    current_user: User = Depends(get_current_user),
):
    ad = await BannerAd.get(banner_ad_id)
    if not ad:
        raise HTTPException(404, "Not found")
    if ad.dealer_id != str(current_user.id):
        raise HTTPException(403, "Not your ad")
    await ad.delete()
    return {"message": "Deleted"}
