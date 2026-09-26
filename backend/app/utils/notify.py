from app.models.follow import Notification


async def push_notification(user_id: str, type: str, title: str, body: str, data: dict = {}):
    notif = Notification(user_id=user_id, type=type, title=title, body=body, data=data)
    await notif.insert()
