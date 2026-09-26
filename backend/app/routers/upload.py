import os
import uuid
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from app.models.user import User
from app.routers.auth import get_current_user

router = APIRouter(prefix="/upload", tags=["Upload"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)



@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    ext = file.filename.split(".")[-1] if file.filename and "." in file.filename else "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"
    path = os.path.join(UPLOAD_DIR, filename)

    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    return {"url": f"/uploads/{filename}", "filename": filename}


@router.post("/video")
async def upload_video(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    allowed = ["video/", "application/octet-stream"]
    ct = file.content_type or ""
    if not any(ct.startswith(a) for a in allowed):
        raise HTTPException(status_code=400, detail="File must be a video")

    ext = file.filename.split(".")[-1] if file.filename and "." in file.filename else "mp4"
    filename = f"video_{uuid.uuid4().hex}.{ext}"
    path = os.path.join(UPLOAD_DIR, filename)

    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    return {"url": f"/uploads/{filename}", "filename": filename}


@router.post("/audio")
async def upload_audio(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    allowed = ["audio/", "video/mp4", "application/octet-stream"]
    if file.content_type and not any(file.content_type.startswith(a) for a in allowed):
        raise HTTPException(status_code=400, detail="File must be an audio file")

    ext = file.filename.split(".")[-1] if file.filename and "." in file.filename else "m4a"
    filename = f"audio_{uuid.uuid4().hex}.{ext}"
    path = os.path.join(UPLOAD_DIR, filename)

    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    return {"url": f"/uploads/{filename}", "filename": filename}
