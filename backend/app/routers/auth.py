import json
import urllib.request
import urllib.error

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.config import settings
from app.models.user import User, UserRole
from app.schemas.auth import (
    ForgotPasswordRequest,
    GoogleAuthRequest,
    LoginRequest,
    MessageResponse,
    RefreshTokenRequest,
    RegisterRequest,
    ResetPasswordRequest,
    ResendOTPRequest,
    TokenResponse,
    UserResponse,
    VerifyOTPRequest,
)
from app.utils.otp import save_otp, send_otp_email, verify_otp
from app.utils.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])
bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> User:
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = await User.get(payload.get("sub"))
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest):
    if await User.find_one(User.phone == payload.phone):
        raise HTTPException(status_code=400, detail="Phone number already registered")
    if payload.email and await User.find_one(User.email == payload.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    if payload.cnic and await User.find_one(User.cnic == payload.cnic):
        raise HTTPException(status_code=400, detail="CNIC already registered")

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        cnic=payload.cnic,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        is_verified=False,
    )
    await user.insert()

    otp = await save_otp(payload.phone, "register")

    if not payload.email:
        raise HTTPException(
            status_code=400,
            detail="Email is required to receive the verification code."
        )

    email_sent = send_otp_email(payload.email, otp, "register")
    return MessageResponse(
        message=f"Account created. Verification code sent to {payload.email}",
        dev_otp=otp if not email_sent else None,
        sent_to=payload.email,
        phone=payload.phone,
    )


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp_endpoint(payload: VerifyOTPRequest):
    # For reset_password, keep OTP unconsumed — it will be consumed in /reset-password
    consume = payload.purpose != "reset_password"
    if not await verify_otp(payload.phone, payload.otp_code, payload.purpose, consume=consume):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    user = await User.find_one(User.phone == payload.phone)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.purpose == "register":
        user.is_verified = True
        await user.save()

    token_data = {"sub": str(user.id), "role": user.role.value}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


@router.post("/resend-otp", response_model=MessageResponse)
async def resend_otp(payload: ResendOTPRequest):
    user = await User.find_one(User.phone == payload.phone)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.email:
        raise HTTPException(status_code=400, detail="No email address on file for this account.")

    otp = await save_otp(payload.phone, payload.purpose)
    email_sent = send_otp_email(user.email, otp, payload.purpose)
    return MessageResponse(
        message=f"Verification code resent to {user.email}",
        dev_otp=otp if not email_sent else None,
        sent_to=user.email,
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest):
    admin_email = settings.ADMIN_EMAIL
    admin_password = settings.ADMIN_PASSWORD
    if admin_email and payload.email == admin_email and payload.password == admin_password:
        admin_user = await User.find_one(User.email == admin_email)
        if not admin_user:
            admin_user = User(
                full_name="Admin",
                email=admin_email,
                hashed_password=hash_password(admin_password),
                role=UserRole.admin,
                is_verified=True,
                is_active=True,
            )
            await admin_user.insert()
        token_data = {"sub": str(admin_user.id), "role": admin_user.role.value}
        return TokenResponse(
            access_token=create_access_token(token_data),
            refresh_token=create_refresh_token(token_data),
        )

    identifier = payload.email.strip()
    user = await User.find_one(
        {"$or": [{"email": identifier}, {"phone": identifier}]}
    )
    if not user or not verify_password(payload.password, user.hashed_password or ""):
        raise HTTPException(status_code=401, detail="Invalid email/phone or password")

    if not user.is_verified:
        if not user.phone or not user.email:
            raise HTTPException(status_code=403, detail="Account not verified. Contact support.")
        otp = await save_otp(user.phone, "register")
        email_sent = send_otp_email(user.email, otp, "register")
        raise HTTPException(
            status_code=403,
            detail={
                "code": "UNVERIFIED",
                "phone": user.phone,
                "sent_to": user.email,
                "dev_otp": otp if not email_sent else None,
            },
        )

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    token_data = {"sub": str(user.id), "role": user.role.value}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


@router.post("/google", response_model=TokenResponse)
async def google_auth(payload: GoogleAuthRequest):
    req = urllib.request.Request(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers={"Authorization": f"Bearer {payload.access_token}"},
    )
    try:
        with urllib.request.urlopen(req) as resp:
            google_user = json.loads(resp.read().decode())
    except urllib.error.HTTPError:
        raise HTTPException(status_code=400, detail="Invalid Google access token")

    google_id = google_user.get("id")
    email = google_user.get("email")
    name = google_user.get("name", "")

    if not google_id or not email:
        raise HTTPException(status_code=400, detail="Could not retrieve user info from Google")

    user = await User.find_one(User.google_id == google_id)
    if not user:
        user = await User.find_one(User.email == email)
        if user:
            user.google_id = google_id
            await user.save()

    if not user:
        user = User(
            full_name=name,
            email=email,
            google_id=google_id,
            role=payload.role,
            is_verified=True,
            is_active=True,
        )
        await user.insert()

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    token_data = {"sub": str(user.id), "role": user.role.value}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(payload: ForgotPasswordRequest):
    user = await User.find_one(
        {"$or": [{"phone": payload.phone_or_email}, {"email": payload.phone_or_email}]}
    )
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this phone/email")
    if not user.email:
        raise HTTPException(status_code=400, detail="No email address on file. Contact support.")
    if not user.phone:
        raise HTTPException(status_code=400, detail="Account setup incomplete. Contact support.")

    otp = await save_otp(user.phone, "reset_password")
    email_sent = send_otp_email(user.email, otp, "reset_password")
    return MessageResponse(
        message=f"Verification code sent to {user.email}",
        dev_otp=otp if not email_sent else None,
        phone=user.phone,
        sent_to=user.email,
    )


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(payload: ResetPasswordRequest):
    if payload.new_password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    if not await verify_otp(payload.phone, payload.otp_code, "reset_password"):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    user = await User.find_one(User.phone == payload.phone)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = hash_password(payload.new_password)
    await user.save()
    return MessageResponse(message="Password updated successfully")


@router.post("/refresh-token", response_model=TokenResponse)
async def refresh_token(payload: RefreshTokenRequest):
    data = decode_token(payload.refresh_token)
    if not data or data.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user = await User.get(data["sub"])
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")

    token_data = {"sub": str(user.id), "role": user.role.value}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user.id),
        full_name=current_user.full_name,
        email=current_user.email,
        phone=current_user.phone,
        cnic=current_user.cnic,
        role=current_user.role,
        is_verified=current_user.is_verified,
        is_active=current_user.is_active,
        avatar_url=getattr(current_user, 'avatar_url', None),
        cover_photo_url=getattr(current_user, 'cover_photo_url', None),
        city=getattr(current_user, 'city', None),
        bio=getattr(current_user, 'bio', None),
        dealership_name=getattr(current_user, 'dealership_name', None),
        docs_status=getattr(current_user, 'docs_status', None),
        docs_rejection_reason=getattr(current_user, 'docs_rejection_reason', None),
    )
