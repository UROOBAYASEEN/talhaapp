from datetime import datetime, timedelta
import hashlib
import hmac as hmac_lib
from typing import Optional
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

from app.config import settings
from app.models.ad_promotion import AdPromotion, PromotionType
from app.models.transaction import Transaction, TransactionStatus
from app.models.vehicle import VehicleListing
from app.models.user import User
from app.routers.auth import get_current_user

router = APIRouter(prefix="/payments", tags=["Payments"])

_SANDBOX       = settings.SAFEPAY_SANDBOX
_API_KEY       = settings.SAFEPAY_API_KEY
_PUBLIC_KEY    = settings.SAFEPAY_PUBLIC_KEY
_API_BASE      = "https://sandbox.api.getsafepay.com" if _SANDBOX else "https://api.getsafepay.com"
_CHECKOUT_BASE = "https://sandbox.api.getsafepay.com/checkout" if _SANDBOX else "https://getsafepay.com/checkout"
_ENV_PARAM     = "sandbox" if _SANDBOX else "production"
_BACKEND_URL      = settings.BACKEND_BASE_URL
_WEBHOOK_SECRET   = settings.SAFEPAY_WEBHOOK_SECRET

AD_POSTING_FEE = 1_650
FEATURED_FEE   = 5_000

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
    p  {{ color: #baacb6; font-size: 1rem; line-height: 1.5; }}
    .btn {{ margin-top: 24px; background: #e2671b; color: #fff; border: none;
            padding: 14px 32px; border-radius: 30px; font-size: 1rem;
            cursor: pointer; text-decoration: none; display: inline-block; }}
  </style>
  <script>
    function closeAndReturn() {{
      try {{ window.close(); }} catch(e) {{}}
      // Deep link attempt for standalone browsers (fails silently in WebBrowser)
      try {{ window.location.href = 'caragain://payment-success'; }} catch(e) {{}}
    }}
  </script>
</head>
<body>
  <h1>&#10003; Payment Successful!</h1>
  <p>Your payment has been processed.<br>Please close this window and return to the app.<br>App will verify and show success automatically.</p>
  <button class="btn" onclick="closeAndReturn()">Close Window</button>
</body>
</html>"""

_CANCEL_HTML = """<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Payment Cancelled</title>
  <style>
    body {{ font-family: sans-serif; background: #010a1f; color: #f9fafc;
           display: flex; flex-direction: column; align-items: center;
           justify-content: center; height: 100vh; margin: 0; text-align: center; padding: 20px; }}
    h1 {{ color: #e2671b; font-size: 2rem; margin-bottom: 12px; }}
    p  {{ color: #baacb6; font-size: 1rem; }}
  </style>
</head>
<body>
  <h1>&#10007; Payment Cancelled</h1>
  <p>You cancelled the payment.<br>Close this page and return to the app.</p>
</body>
</html>"""


# ── Schemas ───────────────────────────────────────────────────────────────────

class CheckoutRequest(BaseModel):
    vehicle_id:     str
    promotion_type: str = "featured"
    duration_days:  int = 7


class ReservationPaymentRequest(BaseModel):
    vehicle_id:      str
    reservation_id:  Optional[str] = None
    amount:          float = 50000


class CheckoutResponse(BaseModel):
    checkout_url:  str
    tracker_token: str
    promotion_id:  str
    amount:        float


class ConfirmResponse(BaseModel):
    success: bool
    status:  str
    message: str


class GenericCheckoutRequest(BaseModel):
    amount: float
    title:  str = "Payment"


class GenericCheckoutResponse(BaseModel):
    checkout_url: str
    payment_id:   str
    amount:       float


# ── Helpers ───────────────────────────────────────────────────────────────────

def _calc_amount(promotion_type: str) -> float:
    if promotion_type == "featured":
        return float(AD_POSTING_FEE + FEATURED_FEE)
    return float(AD_POSTING_FEE)


def _verify_sig(tracker_token: str, sig: str) -> bool:
    expected = hmac_lib.new(
        _API_KEY.encode(),
        tracker_token.encode(),
        hashlib.sha256,
    ).hexdigest()
    return hmac_lib.compare_digest(expected, sig)


async def _mark_success(promo: AdPromotion) -> None:
    promo.status      = "success"
    promo.promoted_at = datetime.utcnow()
    promo.expires_at  = datetime.utcnow() + timedelta(days=promo.duration_days)
    await promo.save()

    vehicle = await VehicleListing.get(promo.vehicle_id)
    if vehicle:
        vehicle.is_featured = True
        vehicle.updated_at  = datetime.utcnow()
        await vehicle.save()

    await Transaction(
        user_id=str(promo.seller_id),
        initials="SP",
        title="Ad Promotion – SafePay",
        subtitle=f"{promo.promotion_type.value.capitalize()} • {promo.duration_days} days",
        amount=promo.amount,
        status=TransactionStatus.success,
    ).insert()


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/safepay/checkout", response_model=CheckoutResponse)
async def create_safepay_checkout(
    payload: CheckoutRequest,
    current_user: User = Depends(get_current_user),
):
    vehicle = await VehicleListing.get(payload.vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    v_seller  = str(vehicle.seller_id).strip().lower()
    u_id      = str(current_user.id).strip().lower()
    print(f"==== seller_id={repr(v_seller)} user_id={repr(u_id)} match={v_seller==u_id} ====")
    if v_seller != u_id:
        raise HTTPException(status_code=403, detail="Not your vehicle")

    amount = _calc_amount(payload.promotion_type)

    promo = AdPromotion(
        vehicle_id=payload.vehicle_id,
        seller_id=str(current_user.id),
        promotion_type=PromotionType(payload.promotion_type),
        amount=amount,
        duration_days=payload.duration_days,
        status="pending",
    )
    await promo.insert()

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
            print(f"==== SAFEPAY INIT {resp.status_code} ====")
            print(data)
            if resp.status_code != 200:
                await promo.delete()
                raise HTTPException(status_code=502, detail=f"SafePay error: {data}")
    except HTTPException:
        raise
    except Exception as exc:
        await promo.delete()
        raise HTTPException(status_code=502, detail=f"SafePay connection error: {exc}")

    tracker_token = data["data"]["token"]
    promo.safepay_tracker = tracker_token
    await promo.save()

    promo_id     = str(promo.id)
    redirect_url = f"{_BACKEND_URL}/api/v1/payments/safepay/redirect/{promo_id}"
    cancel_url   = f"{_BACKEND_URL}/api/v1/payments/safepay/cancel"
    params       = urlencode({
        "beacon":       tracker_token,
        "env":          _ENV_PARAM,
        "source":       "mobile",
        "redirect_url": redirect_url,
        "cancel_url":   cancel_url,
    })
    checkout_url = f"{_CHECKOUT_BASE}/pay?{params}"

    return CheckoutResponse(
        checkout_url=checkout_url,
        tracker_token=tracker_token,
        promotion_id=promo_id,
        amount=amount,
    )


@router.get("/safepay/redirect/{promotion_id}", response_class=HTMLResponse)
async def safepay_redirect(
    promotion_id: str,
    tracker:      str = Query(default=""),
    sig:          str = Query(default=""),
):
    """SafePay redirects here after payment. Verifies signature and marks promo as success."""
    print(f"==== SAFEPAY REDIRECT promo={promotion_id} tracker={tracker} sig={sig} ====")

    promo = await AdPromotion.get(promotion_id)
    if not promo:
        return HTMLResponse(_SUCCESS_HTML)

    if promo.status == "success":
        return HTMLResponse(_SUCCESS_HTML)

    # In sandbox: mark success on redirect regardless of signature
    # In production: require valid signature
    if _SANDBOX:
        await _mark_success(promo)
        print(f"==== SANDBOX: PAYMENT CONFIRMED for promo {promotion_id} ====")
    elif tracker and sig and _verify_sig(tracker, sig):
        await _mark_success(promo)
        print(f"==== PAYMENT CONFIRMED for promo {promotion_id} ====")
    else:
        # Fallback: verify directly with SafePay API
        if promo.safepay_tracker:
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.get(
                        f"{_API_BASE}/order/v1/state/{promo.safepay_tracker}",
                        headers={"X-SFPY-MERCHANT-SECRET": _API_KEY},
                    )
                    if resp.status_code == 200:
                        state = resp.json().get("data", {}).get("state", "")
                        if state in {"PAID", "COMPLETED", "SUCCESS", "CONFIRMED"}:
                            await _mark_success(promo)
                            print(f"==== REDIRECT FALLBACK CONFIRMED: {state} ====")
            except Exception as e:
                print(f"==== REDIRECT FALLBACK ERROR: {e} ====")
        print(f"==== SIG MISMATCH or missing — tracker={tracker} sig={sig} ====")

    return HTMLResponse(_SUCCESS_HTML)


@router.post("/safepay/webhook")
async def safepay_webhook(request: Request):
    """SafePay calls this endpoint after payment is completed."""
    import json as _json

    raw_body = await request.body()
    sfpy_sig = request.headers.get("x-sfpy-signature", "")

    try:
        body = _json.loads(raw_body)
    except Exception:
        body = {}

    print(f"==== SAFEPAY WEBHOOK ====")
    print(body)
    print(f"x-sfpy-signature: {sfpy_sig}")
    print("=========================")

    # Verify webhook signature using SHA-512
    if _WEBHOOK_SECRET and sfpy_sig:
        data_bytes = _json.dumps(body.get("data", {}), separators=(",", ":")).encode()
        expected   = hmac_lib.new(
            _WEBHOOK_SECRET.encode(),
            data_bytes,
            hashlib.sha512,
        ).hexdigest()
        if not hmac_lib.compare_digest(expected, sfpy_sig):
            print(f"==== WEBHOOK SIG MISMATCH ====")
            raise HTTPException(status_code=400, detail="Invalid webhook signature")

    data    = body.get("data", {})
    tracker = data.get("tracker") or data.get("token", "")
    state   = data.get("state", "")

    if not tracker or state != "PAID":
        print(f"==== WEBHOOK: ignored state={state} ====")
        return {"status": "ignored"}

    promo = await AdPromotion.find_one(AdPromotion.safepay_tracker == tracker)
    if not promo:
        print(f"==== WEBHOOK: no promo found for tracker {tracker} ====")
        return {"status": "not_found"}

    if promo.status != "success":
        await _mark_success(promo)
        print(f"==== WEBHOOK: payment confirmed for promo {promo.id} ====")

    return {"status": "ok"}


@router.get("/safepay/cancel", response_class=HTMLResponse)
async def safepay_cancel():
    return HTMLResponse(_CANCEL_HTML)


# ── Reservation Payment ────────────────────────────────────────────────────────

@router.post("/safepay/reservation-checkout")
async def create_reservation_checkout(
    payload: ReservationPaymentRequest,
    current_user: User = Depends(get_current_user),
):
    vehicle = await VehicleListing.get(payload.vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    amount = payload.amount

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
        raise HTTPException(status_code=502, detail=f"SafePay connection error: {exc}")

    tracker_token = data["data"]["token"]
    redirect_url  = f"{_BACKEND_URL}/api/v1/payments/safepay/reservation-success"
    cancel_url    = f"{_BACKEND_URL}/api/v1/payments/safepay/cancel"
    params        = urlencode({
        "beacon":       tracker_token,
        "env":          _ENV_PARAM,
        "source":       "mobile",
        "redirect_url": redirect_url,
        "cancel_url":   cancel_url,
    })
    checkout_url = f"{_CHECKOUT_BASE}/pay?{params}"

    await Transaction(
        user_id=str(current_user.id),
        initials="RV",
        title="Reservation Deposit",
        subtitle=f"Vehicle: {vehicle.title}",
        amount=amount,
        status=TransactionStatus.pending,
    ).insert()

    return {"checkout_url": checkout_url, "tracker_token": tracker_token, "amount": amount}


@router.get("/safepay/reservation-success", response_class=HTMLResponse)
async def reservation_success(tracker: str = Query(default=""), sig: str = Query(default="")):
    # Mark latest tracker transaction as success on redirect (browser completed payment)
    if tracker:
        try:
            txn = await Transaction.find_one(Transaction.safepay_tracker == tracker)
            if txn and txn.status == TransactionStatus.pending:
                # In sandbox auto-confirm, in prod verify sig or mark pending->success
                if _SANDBOX or (tracker and sig and _verify_sig(tracker, sig)):
                    txn.status = TransactionStatus.success
                    await txn.save()
                    print(f"==== RESERVATION SUCCESS: marked txn {txn.id} as success for tracker {tracker} ====")
                else:
                    # Fallback: verify via SafePay before marking
                    try:
                        async with httpx.AsyncClient(timeout=10.0) as client:
                            resp = await client.get(
                                f"{_API_BASE}/order/v1/state/{tracker}",
                                headers={"X-SFPY-MERCHANT-SECRET": _API_KEY},
                            )
                            if resp.status_code == 200:
                                state = resp.json().get("data", {}).get("state", "")
                                if state in {"PAID", "COMPLETED", "SUCCESS", "CONFIRMED"}:
                                    txn.status = TransactionStatus.success
                                    await txn.save()
                    except Exception:
                        pass
        except Exception as e:
            print(f"==== RESERVATION SUCCESS ERROR: {e} ====")
    return HTMLResponse(_SUCCESS_HTML)


class TrackerCheckoutRequest(BaseModel):
    amount:      float
    device_id:   Optional[str] = None
    provider_id: Optional[str] = None
    description: Optional[str] = "Tracker Installation"


@router.post("/safepay/tracker-checkout")
async def create_tracker_checkout(
    payload: TrackerCheckoutRequest,
    current_user: User = Depends(get_current_user),
):
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
                    "amount":      float(payload.amount),
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
        raise HTTPException(status_code=502, detail=f"SafePay connection error: {exc}")

    tracker_token = data["data"]["token"]
    redirect_url  = f"{_BACKEND_URL}/api/v1/payments/safepay/reservation-success"
    cancel_url    = f"{_BACKEND_URL}/api/v1/payments/safepay/cancel"
    params        = urlencode({
        "beacon":       tracker_token,
        "env":          _ENV_PARAM,
        "source":       "mobile",
        "redirect_url": redirect_url,
        "cancel_url":   cancel_url,
    })
    checkout_url = f"{_CHECKOUT_BASE}/pay?{params}"

    await Transaction(
        user_id=str(current_user.id),
        initials="TRK",
        title="Tracker Installation",
        subtitle=payload.description or "Tracker booking payment",
        amount=payload.amount,
        status=TransactionStatus.pending,
        safepay_tracker=tracker_token,
    ).insert()

    return {"checkout_url": checkout_url, "tracker_token": tracker_token, "amount": payload.amount}


@router.get("/safepay/status/{promotion_id}", response_model=ConfirmResponse)
async def safepay_status(
    promotion_id: str,
    current_user: User = Depends(get_current_user),
):
    """Frontend polls this to check if payment was confirmed."""
    promo = await AdPromotion.get(promotion_id)
    if not promo:
        raise HTTPException(status_code=404, detail="Promotion not found")
    if promo.seller_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not your promotion")

    if promo.status == "success":
        return ConfirmResponse(success=True, status="active", message="Payment confirmed")
    if promo.status == "failed":
        return ConfirmResponse(success=False, status="failed", message="Payment failed")

    # Sandbox: skip SafePay API call entirely — mark success directly
    if _SANDBOX:
        await _mark_success(promo)
        print(f"==== SANDBOX: auto-confirm promo {promotion_id} ====")
        return ConfirmResponse(success=True, status="active", message="Sandbox payment confirmed")

    PAID_STATES = {"PAID", "COMPLETED", "SUCCESS", "CONFIRMED", "paid", "completed", "success", "confirmed"}

    # Production: query SafePay directly
    if promo.safepay_tracker:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"{_API_BASE}/order/v1/state/{promo.safepay_tracker}",
                    headers={"X-SFPY-MERCHANT-SECRET": _API_KEY},
                )
                if resp.status_code == 200:
                    data  = resp.json()
                    state = data.get("data", {}).get("state", "") or data.get("state", "")
                    print(f"==== SAFEPAY STATE CHECK: {state} for promo {promotion_id} ====")
                    if state in PAID_STATES:
                        await _mark_success(promo)
                        return ConfirmResponse(success=True, status="active", message="Payment confirmed")
        except Exception as e:
            print(f"==== SAFEPAY STATE CHECK ERROR: {e} ====")

    return ConfirmResponse(success=False, status="pending", message="Awaiting payment")


@router.post("/safepay/force-confirm/{promotion_id}")
async def force_confirm_payment(
    promotion_id: str,
    current_user: User = Depends(get_current_user),
):
    """Manual confirm — marks promo as paid if SafePay API confirms state is PAID."""
    promo = await AdPromotion.get(promotion_id)
    if not promo:
        raise HTTPException(status_code=404, detail="Promotion not found")
    if promo.seller_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not your promotion")
    if promo.status == "success":
        return {"success": True, "message": "Already confirmed"}

    PAID_STATES = {"PAID", "COMPLETED", "SUCCESS", "CONFIRMED", "paid", "completed", "success"}

    if _SANDBOX:
        await _mark_success(promo)
        return {"success": True, "message": "Sandbox: confirmed"}

    if promo.safepay_tracker:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"{_API_BASE}/order/v1/state/{promo.safepay_tracker}",
                    headers={"X-SFPY-MERCHANT-SECRET": _API_KEY},
                )
                if resp.status_code == 200:
                    state = resp.json().get("data", {}).get("state", "")
                    if state in PAID_STATES:
                        await _mark_success(promo)
                        return {"success": True, "message": f"Confirmed: {state}"}
                    return {"success": False, "message": f"Not paid yet. State: {state}"}
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"SafePay error: {e}")

    raise HTTPException(status_code=400, detail="No tracker found for this promotion")


@router.get("/safepay/verify-tracker/{tracker_token}")
async def verify_tracker_payment(
    tracker_token: str,
    current_user: User = Depends(get_current_user),
):
    """Verify tracker payment status — check SafePay, fallback to local Transaction."""
    PAID_STATES = {"PAID", "COMPLETED", "SUCCESS", "CONFIRMED", "paid", "completed", "success"}
    # 1. Try SafePay direct
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{_API_BASE}/order/v1/state/{tracker_token}",
                headers={"X-SFPY-MERCHANT-SECRET": _API_KEY},
            )
            if resp.status_code == 200:
                data  = resp.json()
                print(f"==== SAFEPAY VERIFY: {data} ====")
                state = data.get("data", {}).get("state", "") or data.get("state", "")
                paid  = state in PAID_STATES
                if paid:
                    # also mark local txn as success
                    try:
                        txn = await Transaction.find_one(Transaction.safepay_tracker == tracker_token)
                        if txn and txn.status == TransactionStatus.pending:
                            txn.status = TransactionStatus.success
                            await txn.save()
                    except Exception:
                        pass
                    return {"paid": True, "state": state, "raw": data}
                # if SafePay says not paid yet, fall through to local check
            else:
                print(f"==== SAFEPAY VERIFY API_ERROR {resp.status_code} ====")
    except Exception as e:
        print(f"==== SAFEPAY VERIFY ERROR: {e} ===")
    # 2. Fallback: local Transaction marked by redirect
    try:
        txn = await Transaction.find_one(Transaction.safepay_tracker == tracker_token)
        if txn and txn.status == TransactionStatus.success:
            print(f"==== SAFEPAY VERIFY LOCAL: txn {txn.id} success ====")
            return {"paid": True, "state": "PAID", "source": "local"}
        if txn:
            return {"paid": False, "state": txn.status.value.upper(), "source": "local"}
    except Exception as e:
        print(f"==== VERIFY LOCAL ERROR: {e} ===")
    return {"paid": False, "state": "PENDING"}


# ── Generic card checkout (credit/debit via SafePay) ────────────────────────

@router.post("/safepay/generic-checkout", response_model=GenericCheckoutResponse)
async def create_generic_checkout(
    payload: GenericCheckoutRequest,
    current_user: User = Depends(get_current_user),
):
    """One-off card payment for any title/amount (registration fee, extra ad…)."""
    if not payload.amount or payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")
    name = (current_user.full_name or "U").strip() or "U"
    initials = "".join([p[0].upper() for p in name.split() if p])[:2] or "U"
    txn = Transaction(
        user_id=str(current_user.id),
        initials=initials,
        title=payload.title,
        subtitle="SafePay card payment",
        amount=float(payload.amount),
        status=TransactionStatus.pending,
    )
    await txn.insert()

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{_API_BASE}/order/v1/init",
                headers={"X-SFPY-MERCHANT-SECRET": _API_KEY, "Content-Type": "application/json"},
                json={"client": _PUBLIC_KEY, "amount": float(payload.amount), "currency": "PKR", "environment": _ENV_PARAM},
            )
            data = resp.json()
            if resp.status_code != 200:
                await txn.delete()
                raise HTTPException(status_code=502, detail=f"SafePay error: {data}")
    except HTTPException:
        raise
    except Exception as exc:
        await txn.delete()
        raise HTTPException(status_code=502, detail=f"SafePay connection error: {exc}")

    tracker = data["data"]["token"]
    txn.safepay_tracker = tracker
    await txn.save()

    payment_id  = str(txn.id)
    redirect_url = f"{_BACKEND_URL}/api/v1/payments/safepay/generic-redirect/{payment_id}"
    cancel_url   = f"{_BACKEND_URL}/api/v1/payments/safepay/cancel"
    params       = urlencode({"beacon": tracker, "env": _ENV_PARAM, "source": "mobile",
                               "redirect_url": redirect_url, "cancel_url": cancel_url})
    return GenericCheckoutResponse(
        checkout_url=f"{_CHECKOUT_BASE}/pay?{params}",
        payment_id=payment_id,
        amount=float(payload.amount),
    )


@router.get("/safepay/generic-redirect/{payment_id}", response_class=HTMLResponse)
async def safepay_generic_redirect(payment_id: str):
    txn = await Transaction.get(payment_id)
    if txn and txn.status != TransactionStatus.success:
        txn.status = TransactionStatus.success
        await txn.save()
    return HTMLResponse(_SUCCESS_HTML)


@router.get("/safepay/generic-status/{payment_id}", response_model=ConfirmResponse)
async def safepay_generic_status(
    payment_id: str,
    current_user: User = Depends(get_current_user),
):
    """Frontend polls this after the SafePay checkout page."""
    txn = await Transaction.get(payment_id)
    if not txn:
        raise HTTPException(status_code=404, detail="Payment not found")
    if txn.user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not your payment")
    if txn.status == TransactionStatus.success:
        return ConfirmResponse(success=True, status="active", message="Payment confirmed")

    if _SANDBOX:
        txn.status = TransactionStatus.success
        await txn.save()
        return ConfirmResponse(success=True, status="active", message="Sandbox payment confirmed")

    PAID_STATES = {"PAID", "COMPLETED", "SUCCESS", "CONFIRMED", "paid", "completed", "success", "confirmed"}
    if txn.safepay_tracker:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"{_API_BASE}/order/v1/state/{txn.safepay_tracker}",
                    headers={"X-SFPY-MERCHANT-SECRET": _API_KEY},
                )
                if resp.status_code == 200:
                    data  = resp.json()
                    state = data.get("data", {}).get("state", "") or data.get("state", "")
                    if state in PAID_STATES:
                        txn.status = TransactionStatus.success
                        await txn.save()
                        return ConfirmResponse(success=True, status="active", message="Payment confirmed")
        except Exception as e:
            print(f"==== SAFEPAY GENERIC STATE ERROR: {e} ====")
    return ConfirmResponse(success=False, status="pending", message="Awaiting payment")
