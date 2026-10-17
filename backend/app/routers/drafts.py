from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.models.user import User
from app.models.draft import Draft
from app.routers.auth import get_current_user

router = APIRouter(prefix="/drafts", tags=["Drafts"])


class DraftCreate(BaseModel):
    kind:      str
    title:     Optional[str] = None
    subtitle:  Optional[str] = None
    media_url: Optional[str] = None
    data:      dict          = {}


class DraftUpdate(BaseModel):
    title:     Optional[str]  = None
    subtitle:  Optional[str]  = None
    media_url: Optional[str]  = None
    data:      Optional[dict] = None


def _to_response(d: Draft) -> dict:
    return {
        "id":         str(d.id),
        "kind":       d.kind,
        "title":      d.title,
        "subtitle":   d.subtitle,
        "media_url":  d.media_url,
        "data":       d.data,
        "created_at": d.created_at.isoformat(),
        "updated_at": d.updated_at.isoformat() if d.updated_at else None,
    }


@router.post("", status_code=201)
async def create_draft(payload: DraftCreate, current_user: User = Depends(get_current_user)):
    draft = Draft(
        user_id=str(current_user.id),
        kind=payload.kind,
        title=payload.title,
        subtitle=payload.subtitle,
        media_url=payload.media_url,
        data=payload.data or {},
    )
    await draft.insert()
    return _to_response(draft)


@router.get("/my")
async def my_drafts(
    kind: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
):
    query: dict = {"user_id": str(current_user.id)}
    if kind:
        query["kind"] = kind
    drafts = await Draft.find(query).sort("-created_at").to_list()
    return [_to_response(d) for d in drafts]


@router.get("/{draft_id}")
async def get_draft(draft_id: str, current_user: User = Depends(get_current_user)):
    d = await Draft.get(draft_id)
    if not d:
        raise HTTPException(status_code=404, detail="Draft not found")
    if d.user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not your draft")
    return _to_response(d)


@router.put("/{draft_id}")
async def update_draft(draft_id: str, payload: DraftUpdate, current_user: User = Depends(get_current_user)):
    d = await Draft.get(draft_id)
    if not d:
        raise HTTPException(status_code=404, detail="Draft not found")
    if d.user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not your draft")
    update_data = payload.model_dump(exclude_none=True)
    update_data["updated_at"] = datetime.utcnow()
    for k, v in update_data.items():
        setattr(d, k, v)
    await d.save()
    return _to_response(d)


@router.delete("/{draft_id}")
async def delete_draft(draft_id: str, current_user: User = Depends(get_current_user)):
    d = await Draft.get(draft_id)
    if not d:
        raise HTTPException(status_code=404, detail="Draft not found")
    if d.user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not your draft")
    await d.delete()
    return {"message": "Draft deleted"}
