"""
Profile Router — /api/v1/profile
"""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException

from app.models.user import User
from app.models.vehicle import VehicleListing
from app.models.save import SavedVehicle
from app.models.follow import Follow
from app.routers.auth import get_current_user
from app.schemas.profile import (
    ProfileResponse,
    ProfileUpdate,
    ProfileStatsResponse,
    ChangePasswordRequest,
)
from app.utils.security import hash_password, verify_password

router = APIRouter(prefix="/profile", tags=["Profile"])


async def _build_profile(user: User) -> ProfileResponse:
    listing_count  = await VehicleListing.find({"seller_id": str(user.id), "status": "active"}).count()
    saved_count    = await SavedVehicle.find({"user_id": str(user.id)}).count()
    follower_count = await Follow.find({"following_id": str(user.id)}).count()
    following_count= await Follow.find({"follower_id": str(user.id)}).count()
    return ProfileResponse(
        id=str(user.id),
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        role=user.role.value,
        is_verified=user.is_verified,
        avatar_url=getattr(user, "avatar_url", None),
        bio=getattr(user, "bio", None),
        city=getattr(user, "city", None),
        listing_count=listing_count,
        saved_count=saved_count,
        follower_count=follower_count,
        following_count=following_count,
        member_since=user.created_at.isoformat(),
    )


@router.get("/me", response_model=ProfileResponse)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    return await _build_profile(current_user)


@router.put("/me", response_model=ProfileResponse)
async def update_profile(
    payload: ProfileUpdate,
    current_user: User = Depends(get_current_user),
):
    data = payload.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(status_code=400, detail="No data to update")
    for key, val in data.items():
        setattr(current_user, key, val)
    current_user.updated_at = datetime.utcnow()
    await current_user.save()
    return await _build_profile(current_user)


@router.get("/stats", response_model=ProfileStatsResponse)
async def get_stats(current_user: User = Depends(get_current_user)):
    listing_count  = await VehicleListing.find({"seller_id": str(current_user.id), "status": "active"}).count()
    saved_count    = await SavedVehicle.find({"user_id": str(current_user.id)}).count()
    follower_count = await Follow.find({"following_id": str(current_user.id)}).count()
    following_count= await Follow.find({"follower_id": str(current_user.id)}).count()
    listings       = await VehicleListing.find({"seller_id": str(current_user.id)}).to_list()
    total_views    = sum(v.views for v in listings)
    return ProfileStatsResponse(
        listing_count=listing_count,
        saved_count=saved_count,
        follower_count=follower_count,
        following_count=following_count,
        total_views=total_views,
    )


@router.post("/change-password")
async def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
):
    if not current_user.hashed_password:
        raise HTTPException(status_code=400, detail="No password set (social login account)")
    if not verify_password(payload.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(payload.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    current_user.hashed_password = hash_password(payload.new_password)
    current_user.updated_at = datetime.utcnow()
    await current_user.save()
    return {"message": "Password changed successfully"}


@router.delete("/me")
async def delete_account(current_user: User = Depends(get_current_user)):
    current_user.is_active = False
    current_user.updated_at = datetime.utcnow()
    await current_user.save()
    return {"message": "Account deactivated successfully"}
