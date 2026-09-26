"""
Financing Router — /api/v1/financing
Flow: vehicle info → loan details → applicant → documents → submit → bank reviews
"""
import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.models.user import User, UserRole
from app.models.financing import (
    FinancingBank, FinancingApplication, FinancingDocument,
    FinancingStatus,
)
from app.models.vehicle import VehicleListing
from app.routers.auth import get_current_user
from app.schemas.financing import (
    BankResponse, ApplicationCreate, ApplicationResponse,
    DocumentUpload, DocumentResponse, StatusUpdate,
)
from app.utils.notify import push_notification

router = APIRouter(prefix="/financing", tags=["Financing"])


# ── Helpers ───────────────────────────────────────────────────────────────────
def _gen_ref() -> str:
    return f"AWZ-{datetime.utcnow().strftime('%Y')}-{uuid.uuid4().hex[:5].upper()}"


def _calc_installment(vehicle_price: float, down_pct: float, tenure_years: int, markup: float) -> dict:
    loan = vehicle_price - (vehicle_price * down_pct / 100)
    rate = markup / 100 / 12
    n    = tenure_years * 12
    if loan <= 0 or n <= 0:
        return {"loan_amount": 0, "monthly_installment": 0}
    installment = (loan * rate * (1 + rate) ** n) / ((1 + rate) ** n - 1)
    return {"loan_amount": round(loan, 2), "monthly_installment": round(installment, 2)}


def _bank_resp(b: FinancingBank, avatar_url: Optional[str] = None) -> BankResponse:
    return BankResponse(
        id=str(b.id), name=b.name, product_name=b.product_name,
        bank_type=b.bank_type, markup_type=b.markup_type,
        avg_markup=b.avg_markup, rating=b.rating,
        reviews_count=b.reviews_count,
        processing_fee=b.processing_fee,
        security_deposit=b.security_deposit,
        avatar_url=avatar_url or b.avatar_url if hasattr(b, 'avatar_url') else avatar_url,
    )


async def _resolve_vehicle_image(a: FinancingApplication) -> Optional[str]:
    # 1. Stored image
    img = getattr(a, 'vehicle_image', None)
    if img:
        return img
    # 2. Fallback: try to find matching vehicle listing by brand/model
    try:
        if a.brand and a.car_model:
            # exact
            v = await VehicleListing.find_one({"make": a.brand, "model": a.car_model})
            if v and v.images:
                return v.images[0]
            # case-insensitive
            v = await VehicleListing.find_one({"make": {"$regex": f"^{a.brand}$", "$options": "i"}, "model": {"$regex": f"^{a.car_model}$", "$options": "i"}})
            if v and v.images:
                return v.images[0]
        if a.brand:
            v = await VehicleListing.find_one({"make": {"$regex": f"^{a.brand}$", "$options": "i"}})
            if v and v.images:
                return v.images[0]
    except Exception:
        pass
    return None

async def _app_resp(a: FinancingApplication) -> ApplicationResponse:
    applicant_avatar = None
    applicant_phone = None
    applicant_email = None
    try:
        u = await User.get(a.user_id)
        if u:
            applicant_avatar = u.avatar_url
            applicant_phone = u.phone
            applicant_email = u.email
    except Exception:
        pass
    vehicle_img = await _resolve_vehicle_image(a)
    return ApplicationResponse(
        id=str(a.id), user_id=a.user_id, reference_no=a.reference_no,
        vehicle_type=a.vehicle_type, condition=a.condition,
        brand=a.brand, car_model=a.car_model, variant=a.variant,
        color=a.color, year=a.year, city=a.city,
        vehicle_price=a.vehicle_price, down_payment=a.down_payment,
        tenure_years=a.tenure_years, monthly_income=a.monthly_income,
        full_name=a.full_name, cnic=a.cnic,
        employment_type=a.employment_type,
        bank_name=a.bank_name, bank_product=a.bank_product,
        rate_type=a.rate_type, loan_amount=a.loan_amount,
        monthly_installment=a.monthly_installment,
        markup_rate=a.markup_rate, documents=a.documents,
        status=a.status.value, created_at=a.created_at.isoformat(),
        vehicle_image=vehicle_img,
        applicant_avatar=applicant_avatar,
        applicant_phone=applicant_phone,
        applicant_email=applicant_email,
    )


# ══════════════════════════════════════════════════════════════════════════════
#  BANKS
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/banks", response_model=List[BankResponse])
async def list_banks(
    sort_by: Optional[str] = Query(None, description="lowest_rate | highest_rating | lowest_fee"),
):
    """Return real bank_representative users as banks."""
    # Get all active bank_representative users
    bank_reps = await User.find({
        "role": UserRole.bank_representative,
        "is_active": True,
    }).to_list()

    bank_items: list[tuple[FinancingBank, str | None]] = []
    for rep in bank_reps:
        rep_id     = str(rep.id)
        avatar_url = rep.avatar_url or None
        profile    = await FinancingBank.find_one({"user_id": rep_id, "is_active": True})
        if profile:
            bank_items.append((profile, avatar_url))
        else:
            new_bank = FinancingBank(
                user_id      = rep_id,
                name         = rep.full_name or "Bank",
                product_name = f"{rep.full_name} Auto Finance",
                bank_type    = "Conventional",
                markup_type  = "Reducing balance",
                avg_markup   = "16.00%",
                processing_fee   = 10_000,
                security_deposit = 12_000,
            )
            await new_bank.insert()
            bank_items.append((new_bank, avatar_url))

    if sort_by == "lowest_rate":
        bank_items.sort(key=lambda x: float(x[0].avg_markup.replace("%", "")))
    elif sort_by == "highest_rating":
        bank_items.sort(key=lambda x: x[0].rating, reverse=True)
    elif sort_by == "lowest_fee":
        bank_items.sort(key=lambda x: x[0].processing_fee)

    return [_bank_resp(b, av) for b, av in bank_items]


@router.get("/banks/{bank_id}")
async def get_bank(bank_id: str):
    bank = await FinancingBank.get(bank_id)
    if not bank:
        raise HTTPException(404, "Bank not found")
    avatar_url = None
    phone = None
    email = None
    city  = None
    if bank.user_id:
        user = await User.get(bank.user_id)
        if user:
            avatar_url = user.avatar_url
            phone      = user.phone
            email      = user.email
            city       = user.city
    resp = _bank_resp(bank, avatar_url)
    return {
        **resp.model_dump(),
        "phone": phone,
        "email": email,
        "city":  city,
    }


# ── Bank Profile — bank_rep manages their own financing profile ───────────────

class BankProfileUpdate(BaseModel):
    product_name:     Optional[str]   = None
    bank_type:        Optional[str]   = None
    markup_type:      Optional[str]   = None
    avg_markup:       Optional[str]   = None
    processing_fee:   Optional[float] = None
    security_deposit: Optional[float] = None


@router.get("/my-bank-profile", response_model=BankResponse)
async def get_my_bank_profile(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.bank_representative:
        raise HTTPException(403, "Only bank representatives can access this")
    bank = await FinancingBank.find_one({"user_id": str(current_user.id)})
    if not bank:
        raise HTTPException(404, "Bank profile not set up yet")
    return _bank_resp(bank)


@router.put("/my-bank-profile", response_model=BankResponse)
async def update_my_bank_profile(
    payload: BankProfileUpdate,
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.bank_representative:
        raise HTTPException(403, "Only bank representatives can access this")

    bank = await FinancingBank.find_one({"user_id": str(current_user.id)})
    if not bank:
        bank = FinancingBank(
            user_id      = str(current_user.id),
            name         = current_user.full_name or "Bank",
            product_name = f"{current_user.full_name} Auto Finance",
        )
        await bank.insert()

    if payload.product_name     is not None: bank.product_name     = payload.product_name
    if payload.bank_type        is not None: bank.bank_type        = payload.bank_type
    if payload.markup_type      is not None: bank.markup_type      = payload.markup_type
    if payload.avg_markup       is not None: bank.avg_markup       = payload.avg_markup
    if payload.processing_fee   is not None: bank.processing_fee   = payload.processing_fee
    if payload.security_deposit is not None: bank.security_deposit = payload.security_deposit
    await bank.save()
    return _bank_resp(bank)


# ══════════════════════════════════════════════════════════════════════════════
#  APPLICATIONS
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/applications", response_model=ApplicationResponse, status_code=201)
async def create_application(
    payload: ApplicationCreate,
    current_user: User = Depends(get_current_user),
):
    """Customer submits complete financing application."""
    # Fetch bank markup rate
    markup = 13.9
    bank_name    = payload.bank_name
    bank_product = payload.bank_product
    if payload.bank_id:
        bank = await FinancingBank.get(payload.bank_id)
        if bank:
            markup       = float(bank.avg_markup.replace("%", ""))
            bank_name    = bank.name
            bank_product = bank.product_name

    # Down payment percentage — assume payload.down_payment is PKR amount
    down_pct = (payload.down_payment / payload.vehicle_price * 100) if payload.vehicle_price else 20
    calc = _calc_installment(payload.vehicle_price, down_pct, payload.tenure_years, markup)

    app = FinancingApplication(
        user_id=str(current_user.id),
        reference_no=_gen_ref(),
        **payload.model_dump(exclude={"bank_name", "bank_product"}),
        bank_name=bank_name,
        bank_product=bank_product,
        loan_amount=calc["loan_amount"],
        monthly_installment=calc["monthly_installment"],
        markup_rate=markup,
        status=FinancingStatus.submitted,
    )
    await app.insert()
    return await _app_resp(app)


@router.get("/applications/my", response_model=List[ApplicationResponse])
async def my_applications(current_user: User = Depends(get_current_user)):
    """All financing applications of the logged-in customer."""
    apps = await FinancingApplication.find(
        {"user_id": str(current_user.id)}
    ).sort("-created_at").to_list()
    result = []
    for a in apps:
        result.append(await _app_resp(a))
    return result


@router.get("/applications/{app_id}", response_model=ApplicationResponse)
async def get_application(app_id: str, current_user: User = Depends(get_current_user)):
    app = await FinancingApplication.get(app_id)
    if not app:
        raise HTTPException(404, "Application not found")
    if app.user_id != str(current_user.id) and current_user.role != UserRole.bank_representative:
        raise HTTPException(403, "Access denied")
    return await _app_resp(app)


# ══════════════════════════════════════════════════════════════════════════════
#  DOCUMENTS
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/documents", response_model=DocumentResponse, status_code=201)
async def upload_document(
    payload: DocumentUpload,
    current_user: User = Depends(get_current_user),
):
    app = await FinancingApplication.get(payload.application_id)
    if not app or app.user_id != str(current_user.id):
        raise HTTPException(404, "Application not found")

    doc = FinancingDocument(
        application_id=payload.application_id,
        user_id=str(current_user.id),
        doc_type=payload.doc_type,
        file_url=payload.file_url,
    )
    await doc.insert()

    # Track URL in application
    app.documents.append(payload.file_url)
    app.updated_at = datetime.utcnow()
    await app.save()

    return DocumentResponse(
        id=str(doc.id), application_id=doc.application_id,
        doc_type=doc.doc_type, file_url=doc.file_url,
        status=doc.status, created_at=doc.created_at.isoformat(),
    )


@router.get("/documents/{app_id}", response_model=List[DocumentResponse])
async def get_documents(app_id: str, current_user: User = Depends(get_current_user)):
    # Bank rep can view any app's docs; customer only own
    app = await FinancingApplication.get(app_id)
    if not app:
        raise HTTPException(404, "Application not found")
    if current_user.role == UserRole.bank_representative:
        # allow bank rep to see all docs for that application
        query = {"application_id": app_id}
    else:
        if app.user_id != str(current_user.id):
            raise HTTPException(403, "Access denied")
        query = {"application_id": app_id, "user_id": str(current_user.id)}
    docs = await FinancingDocument.find(query).to_list()
    return [
        DocumentResponse(
            id=str(d.id), application_id=d.application_id,
            doc_type=d.doc_type, file_url=d.file_url,
            status=d.status, created_at=d.created_at.isoformat(),
        )
        for d in docs
    ]


# ══════════════════════════════════════════════════════════════════════════════
#  BANK DASHBOARD CHART DATA
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/bank/chart-data")
async def bank_chart_data(
    period: str = Query("weekly", description="weekly | monthly"),
    metric: str = Query("applications", description="applications | approved | rejected"),
    current_user: User = Depends(get_current_user),
):
    """Returns daily counts for the chart — last 7 or 30 days."""
    if current_user.role != UserRole.bank_representative:
        raise HTTPException(403, "Only bank representatives can access this")

    from datetime import date, timedelta

    days  = 1 if period == "daily" else 7 if period == "weekly" else 30
    today = date.today()
    dates = [today - timedelta(days=i) for i in range(days - 1, -1, -1)]

    all_apps = await FinancingApplication.find().to_list()

    points = []
    for d in dates:
        day_start = datetime.combine(d, datetime.min.time())
        day_end   = datetime.combine(d, datetime.max.time())
        day_apps  = [a for a in all_apps if day_start <= a.created_at <= day_end]

        if metric == "approved":
            count = len([a for a in day_apps if a.status == FinancingStatus.approved])
        elif metric == "rejected":
            count = len([a for a in day_apps if a.status == FinancingStatus.rejected])
        else:
            count = len(day_apps)

        points.append({ "date": d.strftime("%b %d"), "value": count })

    return { "period": period, "metric": metric, "points": points }


# ══════════════════════════════════════════════════════════════════════════════
#  BANK DASHBOARD STATS
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/bank/stats")
async def bank_stats(current_user: User = Depends(get_current_user)):
    """Dashboard overview stats for bank representative."""
    if current_user.role != UserRole.bank_representative:
        raise HTTPException(403, "Only bank representatives can access this")

    from datetime import date, timedelta
    today_start = datetime.combine(date.today(), datetime.min.time())

    all_apps      = await FinancingApplication.find().to_list()
    today_apps    = [a for a in all_apps if a.created_at >= today_start]

    total         = len(all_apps)
    submitted     = len([a for a in all_apps if a.status == FinancingStatus.submitted])
    reviewing     = len([a for a in all_apps if a.status == FinancingStatus.reviewing])
    approved      = len([a for a in all_apps if a.status == FinancingStatus.approved])
    rejected      = len([a for a in all_apps if a.status == FinancingStatus.rejected])
    new_today     = len(today_apps)

    return {
        "total":       total,
        "submitted":   submitted,
        "reviewing":   reviewing,
        "approved":    approved,
        "rejected":    rejected,
        "new_today":   new_today,
    }


# ══════════════════════════════════════════════════════════════════════════════
#  BANK REPRESENTATIVE — manage applications
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/bank/applications")
async def bank_applications(
    current_user: User = Depends(get_current_user),
    status: Optional[str] = Query(None),
    limit:  int = Query(50, ge=1, le=100),
    skip:   int = Query(0,  ge=0),
):
    """Bank rep sees all submitted applications."""
    if current_user.role != UserRole.bank_representative:
        raise HTTPException(403, "Only bank representatives can access this")

    query: dict = {}
    if status:
        query["status"] = status

    apps = await FinancingApplication.find(query).sort("-created_at").skip(skip).limit(limit).to_list()
    result = []
    for a in apps:
        applicant_avatar = None
        applicant_phone = None
        applicant_email = None
        try:
            u = await User.get(a.user_id)
            if u:
                applicant_avatar = u.avatar_url
                applicant_phone = u.phone
                applicant_email = u.email
        except Exception:
            pass
        # resolve vehicle image - stored or fallback via VehicleListing
        vehicle_img = await _resolve_vehicle_image(a)
        result.append({
            "id":                  str(a.id),
            "reference_no":        a.reference_no,
            "customer":            a.full_name,
            "full_name":           a.full_name,
            "cnic":                a.cnic,
            "brand":               a.brand,
            "car_model":           a.car_model,
            "variant":             a.variant,
            "color":               a.color,
            "year":                a.year,
            "vehicle_type":        a.vehicle_type,
            "condition":           a.condition,
            "vehicle":             f"{a.brand} {a.car_model} {a.variant} {a.year}".strip() or f"{a.brand} {a.car_model}".strip(),
            "vehicle_price":       a.vehicle_price,
            "down_payment":        a.down_payment,
            "loan_amount":         a.loan_amount,
            "monthly_installment": a.monthly_installment,
            "tenure_years":        a.tenure_years,
            "employment_type":     a.employment_type,
            "monthly_income":      a.monthly_income,
            "city":                a.city,
            "bank_name":           a.bank_name,
            "bank_product":        a.bank_product,
            "rate_type":           a.rate_type,
            "markup_rate":         a.markup_rate,
            "status":              a.status.value,
            "documents":           a.documents,
            "documents_count":     len(a.documents),
            "created_at":          a.created_at.isoformat(),
            "user_id":             a.user_id,
            "vehicle_image":       vehicle_img,
            "applicant_avatar":    applicant_avatar,
            "applicant_phone":     applicant_phone,
            "applicant_email":     applicant_email,
        })
    return result


@router.patch("/bank/applications/{app_id}")
async def update_application_status(
    app_id:  str,
    payload: StatusUpdate,
    current_user: User = Depends(get_current_user),
):
    """Bank rep approves or rejects an application."""
    if current_user.role != UserRole.bank_representative:
        raise HTTPException(403, "Only bank representatives can update status")

    app = await FinancingApplication.get(app_id)
    if not app:
        raise HTTPException(404, "Application not found")

    valid = [s.value for s in FinancingStatus]
    if payload.status not in valid:
        raise HTTPException(400, f"Invalid status. Valid: {valid}")

    app.status     = FinancingStatus(payload.status)
    app.updated_at = datetime.utcnow()
    await app.save()

    # ── Push notification to customer ──
    try:
        status_val = payload.status
        vehicle_lbl = f"{app.brand} {app.car_model} {app.variant}".strip() or app.brand or "Vehicle"
        ref = app.reference_no or str(app.id)[:8]
        if status_val == "approved":
            title = "Financing Approved 🎉"
            body  = f"Your application {ref} for {vehicle_lbl} has been approved by {current_user.full_name or 'Bank'}."
        elif status_val == "rejected":
            title = "Financing Rejected"
            body  = f"Your application {ref} for {vehicle_lbl} was rejected. Please contact bank for details."
        elif status_val == "reviewing":
            title = "Application Under Review"
            body  = f"Your application {ref} for {vehicle_lbl} is now under review."
        else:
            title = f"Application {status_val}"
            body  = f"Your financing application {ref} status changed to {status_val}."
        await push_notification(
            user_id=app.user_id,
            type="financing",
            title=title,
            body=body,
            data={
                "application_id": str(app.id),
                "reference_no": ref,
                "status": status_val,
                "vehicle": vehicle_lbl,
                "bank_name": app.bank_name or current_user.full_name or "",
            },
        )
    except Exception as e:
        # don't fail status update if notif fails
        print(f"notify failed: {e}")

    return {"message": "Status updated", "status": app.status.value}
