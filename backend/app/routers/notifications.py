from fastapi import APIRouter, Depends, Query
from app.models.user import User
from app.models.follow import Notification
from app.routers.auth import get_current_user
from app.schemas.seller import NotificationListResponse, NotificationResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/", response_model=NotificationListResponse)
async def get_notifications(
    page: int = Query(1, ge=1),
    limit: int = Query(30, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    my_id = str(current_user.id)
    total = await Notification.find({"user_id": my_id}).count()
    unread_count = await Notification.find({"user_id": my_id, "is_read": False}).count()
    skip = (page - 1) * limit
    notifs = await Notification.find({"user_id": my_id}).sort("-created_at").skip(skip).limit(limit).to_list()
    items = [
        NotificationResponse(
            id=str(n.id),
            type=n.type,
            title=n.title,
            body=n.body,
            data=n.data,
            is_read=n.is_read,
            created_at=n.created_at.isoformat(),
        )
        for n in notifs
    ]
    return NotificationListResponse(items=items, unread_count=unread_count)


@router.post("/mark-read")
async def mark_all_read(current_user: User = Depends(get_current_user)):
    my_id = str(current_user.id)
    await Notification.find({"user_id": my_id, "is_read": False}).update({"$set": {"is_read": True}})
    return {"message": "All notifications marked as read"}


@router.post("/{notif_id}/read")
async def mark_one_read(notif_id: str, current_user: User = Depends(get_current_user)):
    n = await Notification.get(notif_id)
    if n and n.user_id == str(current_user.id):
        n.is_read = True
        await n.save()
    return {"message": "Marked as read"}
