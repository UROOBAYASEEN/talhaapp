from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query

from app.models.user import User
from app.models.chat import Conversation, Message, MessageType
from app.routers.auth import get_current_user
from app.utils.notify import push_notification
from app.schemas.chat import (
    SendMessageRequest,
    ConvMessageRequest,
    MessageResponse,
    ConversationResponse,
    ConversationListResponse,
    ParticipantInfo,
)

router = APIRouter(prefix="/chat", tags=["Chat"])


def _msg_to_response(m: Message) -> MessageResponse:
    return MessageResponse(
        id=str(m.id),
        conversation_id=m.conversation_id,
        sender_id=m.sender_id,
        content=m.content,
        message_type=m.message_type.value,
        vehicle_id=m.vehicle_id,
        offer_amount=m.offer_amount,
        is_read=m.is_read,
        created_at=m.created_at.isoformat(),
    )


async def _conv_to_response(c: Conversation, current_user_id: str) -> ConversationResponse:
    participant_info = []
    for pid in c.participants:
        if pid != current_user_id:
            u = await User.get(pid)
            if u:
                participant_info.append(ParticipantInfo(id=str(u.id), full_name=u.full_name, role=u.role.value, avatar_url=getattr(u, 'avatar_url', None)))
    unread = c.unread_counts.get(current_user_id, 0)
    return ConversationResponse(
        id=str(c.id),
        participants=c.participants,
        participant_info=participant_info,
        vehicle_id=c.vehicle_id,
        last_message=c.last_message,
        last_message_at=c.last_message_at.isoformat() if c.last_message_at else None,
        unread_count=unread,
        created_at=c.created_at.isoformat(),
    )


@router.post("/send", response_model=MessageResponse)
async def send_message(
    payload: SendMessageRequest,
    current_user: User = Depends(get_current_user),
):
    my_id = str(current_user.id)
    other_id = payload.to_user_id

    if my_id == other_id:
        raise HTTPException(status_code=400, detail="Cannot message yourself")

    to_user = await User.get(other_id)
    if not to_user:
        raise HTTPException(status_code=404, detail="User not found")

    participants = sorted([my_id, other_id])
    query = {
        "participants": {"$all": participants, "$size": 2}
    }
    if payload.vehicle_id:
        query["vehicle_id"] = payload.vehicle_id

    conv = await Conversation.find_one(query)
    if not conv:
        conv = Conversation(
            participants=participants,
            vehicle_id=payload.vehicle_id,
            unread_counts={my_id: 0, other_id: 0},
        )
        await conv.insert()

    msg = Message(
        conversation_id=str(conv.id),
        sender_id=my_id,
        content=payload.content,
        message_type=MessageType(payload.message_type),
        vehicle_id=payload.vehicle_id,
        offer_amount=payload.offer_amount,
    )
    await msg.insert()

    conv.last_message = payload.content
    conv.last_message_at = datetime.utcnow()
    conv.last_sender_id = my_id
    counts = dict(conv.unread_counts)
    counts[other_id] = counts.get(other_id, 0) + 1
    conv.unread_counts = counts
    conv.updated_at = datetime.utcnow()
    await conv.save()

    preview = payload.content if len(payload.content) <= 60 else payload.content[:57] + "..."
    await push_notification(
        user_id=other_id,
        type="message",
        title=current_user.full_name,
        body=preview,
        data={"conversation_id": str(conv.id), "sender_id": my_id, "sender_name": current_user.full_name},
    )

    return _msg_to_response(msg)


@router.get("/conversations", response_model=ConversationListResponse)
async def get_conversations(
    current_user: User = Depends(get_current_user),
):
    my_id = str(current_user.id)
    convs = await Conversation.find(
        {"participants": my_id}
    ).sort("-last_message_at").to_list()

    items = [await _conv_to_response(c, my_id) for c in convs]
    return ConversationListResponse(items=items, total=len(items))


@router.post("/conversations/{conv_id}/messages", response_model=MessageResponse)
async def send_to_conversation(
    conv_id: str,
    payload: ConvMessageRequest,
    current_user: User = Depends(get_current_user),
):
    my_id = str(current_user.id)
    conv  = await Conversation.get(conv_id)
    if not conv or my_id not in conv.participants:
        raise HTTPException(status_code=403, detail="Access denied")

    msg = Message(
        conversation_id=conv_id,
        sender_id=my_id,
        content=payload.content,
        message_type=MessageType(payload.message_type),
        vehicle_id=payload.vehicle_id,
    )
    await msg.insert()

    other_id = next((p for p in conv.participants if p != my_id), None)
    conv.last_message    = payload.content
    conv.last_message_at = datetime.utcnow()
    conv.last_sender_id  = my_id
    conv.updated_at      = datetime.utcnow()
    if other_id:
        counts = dict(conv.unread_counts)
        counts[other_id] = counts.get(other_id, 0) + 1
        conv.unread_counts = counts
    await conv.save()

    if other_id:
        preview = payload.content if len(payload.content) <= 60 else payload.content[:57] + "..."
        await push_notification(
            user_id=other_id,
            type="message",
            title=current_user.full_name,
            body=preview,
            data={"conversation_id": conv_id, "sender_id": my_id, "sender_name": current_user.full_name},
        )

    return _msg_to_response(msg)


@router.get("/conversations/{conv_id}/messages")
async def get_messages(
    conv_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    my_id = str(current_user.id)
    conv = await Conversation.get(conv_id)
    if not conv or my_id not in conv.participants:
        raise HTTPException(status_code=403, detail="Access denied")

    total = await Message.find({"conversation_id": conv_id}).count()
    skip = (page - 1) * limit
    messages = (
        await Message.find({"conversation_id": conv_id})
        .sort("-created_at")
        .skip(skip)
        .limit(limit)
        .to_list()
    )
    messages.reverse()

    await Message.find(
        {"conversation_id": conv_id, "sender_id": {"$ne": my_id}, "is_read": False}
    ).update({"$set": {"is_read": True}})

    counts = dict(conv.unread_counts)
    counts[my_id] = 0
    conv.unread_counts = counts
    await conv.save()

    return {
        "items": [_msg_to_response(m) for m in messages],
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.get("/conversations/{conv_id}", response_model=ConversationResponse)
async def get_conversation(
    conv_id: str,
    current_user: User = Depends(get_current_user),
):
    my_id = str(current_user.id)
    conv = await Conversation.get(conv_id)
    if not conv or my_id not in conv.participants:
        raise HTTPException(status_code=403, detail="Access denied")
    return await _conv_to_response(conv, my_id)
