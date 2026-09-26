from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.models.document import UserDocument, DocumentStatus
from app.routers.auth import get_current_user
from app.models.user import User, UserRole

router = APIRouter(prefix="/documents", tags=["Documents"])


class DocumentCreate(BaseModel):
    type:     str
    desc:     str
    file_url: Optional[str] = None


class DocumentResponse(BaseModel):
    id:          str
    type:        str
    desc:        str
    file_url:    Optional[str]
    status:      str
    uploaded_at: str


def _to_response(d: UserDocument) -> DocumentResponse:
    return DocumentResponse(
        id=str(d.id),
        type=d.type,
        desc=d.desc,
        file_url=d.file_url,
        status=d.status.value,
        uploaded_at=d.uploaded_at.strftime("%d %b %Y"),
    )


@router.get("/user/{user_id}", response_model=List[DocumentResponse])
async def get_user_documents(user_id: str, current_user: User = Depends(get_current_user)):
    # Provider/admin can view customer's real uploaded docs; customer can only view own
    if str(current_user.id) != user_id and current_user.role not in (UserRole.insurance_provider, UserRole.admin, UserRole.dealership_owner, UserRole.bank_representative):
        raise HTTPException(status_code=403, detail="Not authorized to view this user's documents")
    docs = await UserDocument.find({"user_id": user_id}).to_list()
    return [_to_response(d) for d in docs]


@router.get("/", response_model=List[DocumentResponse])
async def get_documents(current_user: User = Depends(get_current_user)):
    docs = await UserDocument.find({"user_id": str(current_user.id)}).to_list()
    return [_to_response(d) for d in docs]


@router.post("/", response_model=DocumentResponse, status_code=201)
async def upload_document(
    payload: DocumentCreate,
    current_user: User = Depends(get_current_user),
):
    doc = UserDocument(
        user_id=str(current_user.id),
        type=payload.type,
        desc=payload.desc,
        file_url=payload.file_url,
    )
    await doc.insert()
    return _to_response(doc)


@router.delete("/{doc_id}")
async def delete_document(
    doc_id: str,
    current_user: User = Depends(get_current_user),
):
    doc = await UserDocument.get(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not your document")
    await doc.delete()
    return {"message": "Document deleted"}
