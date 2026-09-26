from typing import Optional, List
from pydantic import BaseModel


class SellerProfileResponse(BaseModel):
    id: str
    full_name: str
    phone: Optional[str]
    role: str
    is_verified: bool
    follower_count: int = 0
    listing_count: int = 0
    is_following: bool = False
    member_since: str
    avatar_url: Optional[str] = None


class FollowResponse(BaseModel):
    message: str
    is_following: bool


class NotificationResponse(BaseModel):
    id: str
    type: str
    title: str
    body: str
    data: dict
    is_read: bool
    created_at: str


class NotificationListResponse(BaseModel):
    items: List[NotificationResponse]
    unread_count: int
