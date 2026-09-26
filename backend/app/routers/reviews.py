from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.models.user import User
from app.models.vehicle import VehicleListing
from app.models.review import VehicleReview, AdReport
from app.routers.auth import get_current_user

router = APIRouter(prefix="/vehicles", tags=["Reviews"])


class ReviewCreate(BaseModel):
    rating:  float
    comment: Optional[str] = None


class ReviewResponse(BaseModel):
    id:            str
    vehicle_id:    str
    reviewer_id:   str
    reviewer_name: str
    rating:        float
    comment:       Optional[str]
    created_at:    str


class ReportCreate(BaseModel):
    reason:      str
    description: Optional[str] = None


# ── Post a review ──────────────────────────────────────────────────────────

@router.post("/{vehicle_id}/reviews", response_model=ReviewResponse)
async def post_review(
    vehicle_id: str,
    payload:    ReviewCreate,
    current_user: User = Depends(get_current_user),
):
    if not 1 <= payload.rating <= 5:
        raise HTTPException(400, "Rating must be between 1 and 5")

    v = await VehicleListing.get(vehicle_id)
    if not v:
        raise HTTPException(404, "Vehicle not found")

    # Check duplicate
    existing = await VehicleReview.find_one({
        "vehicle_id": vehicle_id,
        "reviewer_id": str(current_user.id),
    })
    if existing:
        raise HTTPException(400, "You have already reviewed this listing")

    review = VehicleReview(
        vehicle_id=vehicle_id,
        reviewer_id=str(current_user.id),
        reviewer_name=current_user.full_name,
        rating=payload.rating,
        comment=payload.comment,
    )
    await review.insert()

    # Update vehicle average rating
    all_reviews = await VehicleReview.find({"vehicle_id": vehicle_id}).to_list()
    avg = sum(r.rating for r in all_reviews) / len(all_reviews)
    v.average_rating = round(avg, 1)
    v.review_count   = len(all_reviews)
    await v.save()

    return ReviewResponse(
        id=str(review.id),
        vehicle_id=vehicle_id,
        reviewer_id=str(current_user.id),
        reviewer_name=current_user.full_name,
        rating=review.rating,
        comment=review.comment,
        created_at=review.created_at.isoformat(),
    )


# ── Get reviews ────────────────────────────────────────────────────────────

@router.get("/{vehicle_id}/reviews", response_model=List[ReviewResponse])
async def get_reviews(vehicle_id: str):
    reviews = await VehicleReview.find({"vehicle_id": vehicle_id}).sort("-created_at").to_list()
    return [
        ReviewResponse(
            id=str(r.id),
            vehicle_id=r.vehicle_id,
            reviewer_id=r.reviewer_id,
            reviewer_name=r.reviewer_name,
            rating=r.rating,
            comment=r.comment,
            created_at=r.created_at.isoformat(),
        )
        for r in reviews
    ]


# ── Report ad ──────────────────────────────────────────────────────────────

@router.post("/{vehicle_id}/report")
async def report_ad(
    vehicle_id: str,
    payload:    ReportCreate,
    current_user: User = Depends(get_current_user),
):
    v = await VehicleListing.get(vehicle_id)
    if not v:
        raise HTTPException(404, "Vehicle not found")

    report = AdReport(
        vehicle_id=vehicle_id,
        reporter_id=str(current_user.id),
        reason=payload.reason,
        description=payload.description,
    )
    await report.insert()
    return {"message": "Report submitted successfully"}
