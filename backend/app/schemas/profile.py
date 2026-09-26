from typing import Optional
from pydantic import BaseModel


class ProfileResponse(BaseModel):
    id: str
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: str
    is_verified: bool
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    city: Optional[str] = None
    listing_count: int = 0
    saved_count: int = 0
    follower_count: int = 0
    following_count: int = 0
    member_since: str

    class Config:
        from_attributes = True


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    city: Optional[str] = None


class ProfileStatsResponse(BaseModel):
    listing_count: int
    saved_count: int
    follower_count: int
    following_count: int
    total_views: int


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str
