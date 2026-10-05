from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.models.brand import Brand
from app.models.user import User
from app.routers.admin import require_admin
from app.routers.auth import get_current_user

router = APIRouter(prefix="/brands", tags=["Brands"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class BrandCreate(BaseModel):
    name:     str
    logo_url: Optional[str] = None
    category: str            = "car"   # car | bike | both


class BrandUpdate(BaseModel):
    name:      Optional[str]  = None
    logo_url:  Optional[str]  = None
    category:  Optional[str]  = None
    is_active: Optional[bool] = None


class BrandResponse(BaseModel):
    id:         str
    name:       str
    logo_url:   Optional[str]
    category:   str
    is_active:  bool
    created_at: str


# ── Helper ───────────────────────────────────────────────────────────────────

def _to_resp(b: Brand) -> BrandResponse:
    return BrandResponse(
        id=str(b.id),
        name=b.name,
        logo_url=b.logo_url,
        category=b.category,
        is_active=b.is_active,
        created_at=b.created_at.isoformat() if b.created_at else "",
    )


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("", response_model=List[BrandResponse])
async def list_brands(
    category: Optional[str] = None,
    active_only: bool = True,
):
    """Public: list brands (active only by default). Used by apps + admin panel."""
    query: dict = {}
    if active_only:
        query["is_active"] = True
    if category and category != "all":
        query["category"] = {"$in": [category, "both"]}
    brands = await Brand.find(query).sort("+name").to_list()
    return [_to_resp(b) for b in brands]


@router.post("", response_model=BrandResponse, status_code=201)
async def create_brand(
    payload: BrandCreate,
    admin: User = Depends(require_admin),
):
    """Admin: add a new brand (name + logo). Saved in DB."""
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Brand name is required")
    if payload.category not in ("car", "bike", "both"):
        raise HTTPException(status_code=400, detail="category must be car, bike or both")

    existing = await Brand.find_one({"name": {"$regex": f"^{name}$", "$options": "i"}})
    if existing:
        raise HTTPException(status_code=409, detail="Brand already exists")

    brand = Brand(name=name, logo_url=payload.logo_url, category=payload.category)
    await brand.insert()
    return _to_resp(brand)


@router.patch("/{brand_id}", response_model=BrandResponse)
async def update_brand(
    brand_id: str,
    payload: BrandUpdate,
    admin: User = Depends(require_admin),
):
    """Admin: edit brand name / logo / category / active flag."""
    brand = await Brand.get(brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    if payload.name is not None:
        name = payload.name.strip()
        if not name:
            raise HTTPException(status_code=400, detail="Brand name is required")
        dup = await Brand.find_one({"name": {"$regex": f"^{name}$", "$options": "i"}})
        if dup and str(dup.id) != brand_id:
            raise HTTPException(status_code=409, detail="Brand already exists")
        brand.name = name
    if payload.logo_url is not None:
        brand.logo_url = payload.logo_url
    if payload.category is not None:
        if payload.category not in ("car", "bike", "both"):
            raise HTTPException(status_code=400, detail="category must be car, bike or both")
        brand.category = payload.category
    if payload.is_active is not None:
        brand.is_active = payload.is_active

    await brand.save()
    return _to_resp(brand)


@router.delete("/{brand_id}")
async def delete_brand(
    brand_id: str,
    admin: User = Depends(require_admin),
):
    """Admin: delete a brand."""
    brand = await Brand.get(brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    await brand.delete()
    return {"message": "Brand deleted"}
