from typing import Optional
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole


class RegisterRequest(BaseModel):
    full_name: str
    email: Optional[EmailStr] = None
    phone: str
    cnic: Optional[str] = None
    password: str
    role: UserRole = UserRole.customer


class LoginRequest(BaseModel):
    email: str        # accepts email OR phone number
    password: str


class VerifyOTPRequest(BaseModel):
    phone: str
    otp_code: str
    purpose: str = "register"


class ResendOTPRequest(BaseModel):
    phone: str
    purpose: str = "register"


class ForgotPasswordRequest(BaseModel):
    phone_or_email: str


class ResetPasswordRequest(BaseModel):
    phone: str
    otp_code: str
    new_password: str
    confirm_password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: str
    full_name: str
    email: Optional[str]
    phone: Optional[str]
    cnic: Optional[str]
    role: UserRole
    is_verified: bool
    is_active: bool
    avatar_url:       Optional[str] = None
    cover_photo_url:  Optional[str] = None
    city:             Optional[str] = None
    bio:              Optional[str] = None
    dealership_name:  Optional[str] = None
    docs_status:      Optional[str] = None
    docs_rejection_reason: Optional[str] = None

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    message: str
    success: bool = True
    dev_otp: Optional[str] = None
    phone: Optional[str] = None
    sent_to: Optional[str] = None


class GoogleAuthRequest(BaseModel):
    access_token: str
    role: UserRole = UserRole.customer


class GoogleCodeRequest(BaseModel):
    code: str
    redirect_uri: str
    role: UserRole = UserRole.customer
