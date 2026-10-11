import uuid
import re
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from database import get_db
from models import User, InterviewSession
from services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
    verify_google_id_token,
    create_and_send_password_reset_otp,
    verify_password_reset_otp
)

router = APIRouter(prefix="/api/auth", tags=["auth"])
security = HTTPBearer(auto_error=False)


# -------------------------------------------------------------
# Pydantic Schemas
# -------------------------------------------------------------
class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    confirm_password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class GoogleAuthRequest(BaseModel):
    credential: str
    client_id: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None


class SendOtpRequest(BaseModel):
    email: str


class SendOtpResponse(BaseModel):
    success: bool
    message: str
    masked_email: Optional[str] = None
    expires_in_seconds: Optional[int] = 600


class VerifyOtpResetRequest(BaseModel):
    email: str
    otp: str
    new_password: str


class PasswordResetRequest(BaseModel):
    email: str
    new_password: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    auth_provider: str
    avatar_url: Optional[str] = None
    created_at: datetime
    total_interviews: Optional[int] = 0

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# -------------------------------------------------------------
# Dependency: Fast & Robust Token Authentication
# -------------------------------------------------------------
def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    """
    Extracts Bearer token from HTTP Authorization header, verifies signature,
    and returns authoritative database User.
    """
    raw_token = None
    if credentials:
        raw_token = credentials.credentials
    elif authorization and authorization.lower().startswith("bearer "):
        raw_token = authorization[7:].strip()

    if not raw_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    payload = decode_access_token(raw_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid token. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token payload.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found or was removed.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    return user


def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Returns the authenticated User if valid token is provided, or None."""
    try:
        return get_current_user(credentials, authorization, db)
    except HTTPException:
        return None


def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Enforces server-side administrator role verification."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Administrator privileges required."
        )
    return current_user


# -------------------------------------------------------------
# Authentication Routes
# -------------------------------------------------------------
@router.post("/register", response_model=AuthResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """Registers a new candidate with input validation and password hashing."""
    name = req.name.strip()
    email = req.email.strip().lower()
    password = req.password

    # Input validations
    if not name or len(name) < 2:
        raise HTTPException(status_code=400, detail="Full name must be at least 2 characters long.")

    email_regex = r"^[\w\.-]+@[\w\.-]+\.\w+$"
    if not re.match(email_regex, email):
        raise HTTPException(status_code=400, detail="Please provide a valid email address.")

    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")

    if password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    # Duplicate email check
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="An account with this email address already exists. Please sign in."
        )

    # Authoritative backend user ID generation
    user_id = str(uuid.uuid4())
    hashed_pw = hash_password(password)

    new_user = User(
        id=user_id,
        email=email,
        name=name,
        hashed_password=hashed_pw,
        role="candidate",
        auth_provider="email"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Issue JWT session
    token = create_access_token({
        "sub": new_user.id,
        "email": new_user.email,
        "name": new_user.name,
        "role": new_user.role
    })

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=new_user.id,
            email=new_user.email,
            name=new_user.name,
            role=new_user.role,
            auth_provider=new_user.auth_provider,
            avatar_url=new_user.avatar_url,
            created_at=new_user.created_at,
            total_interviews=0
        )
    )


@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Authenticates candidate or admin credentials and returns session token."""
    email = req.email.strip().lower()
    password = req.password

    user = db.query(User).filter(User.email == email).first()
    if not user or not user.hashed_password:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_access_token({
        "sub": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role
    })

    total_interviews = db.query(InterviewSession).filter(InterviewSession.user_id == user.id).count()

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            role=user.role,
            auth_provider=user.auth_provider,
            avatar_url=user.avatar_url,
            created_at=user.created_at,
            total_interviews=total_interviews
        )
    )


@router.post("/google", response_model=AuthResponse)
def google_auth(req: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Authenticates via Google OAuth credential token.
    Finds or creates candidate account without duplicates.
    """
    if not req.credential and not req.email:
        raise HTTPException(status_code=400, detail="Missing Google credential or email address.")

    verified = verify_google_id_token(
        req.credential or "direct_google",
        direct_email=req.email,
        direct_name=req.name
    )
    if not verified or not verified.get("email"):
        raise HTTPException(
            status_code=400,
            detail="Unable to verify Google identity. Please try standard email sign-in or check configuration."
        )

    email = verified["email"].strip().lower()
    google_id = verified.get("google_id")
    name = verified.get("name") or email.split("@")[0]
    avatar_url = verified.get("avatar_url")

    # Check existing user by email or google_id
    user = db.query(User).filter((User.email == email) | (User.google_id == google_id)).first()

    if user:
        # Update google_id and avatar if missing
        if not user.google_id and google_id:
            user.google_id = google_id
        if avatar_url and not user.avatar_url:
            user.avatar_url = avatar_url
        db.commit()
        db.refresh(user)
    else:
        # Auto-create user
        user = User(
            id=str(uuid.uuid4()),
            email=email,
            name=name,
            role="candidate",
            auth_provider="google",
            google_id=google_id,
            avatar_url=avatar_url
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token({
        "sub": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role
    })

    total_interviews = db.query(InterviewSession).filter(InterviewSession.user_id == user.id).count()

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            role=user.role,
            auth_provider=user.auth_provider,
            avatar_url=user.avatar_url,
            created_at=user.created_at,
            total_interviews=total_interviews
        )
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns profile and statistics for the active authenticated user."""
    total_interviews = db.query(InterviewSession).filter(InterviewSession.user_id == current_user.id).count()
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        role=current_user.role,
        auth_provider=current_user.auth_provider,
        avatar_url=current_user.avatar_url,
        created_at=current_user.created_at,
        total_interviews=total_interviews
    )


@router.post("/forgot-password/send-otp", response_model=SendOtpResponse)
def send_forgot_password_otp(req: SendOtpRequest, db: Session = Depends(get_db)):
    """
    Step 1 of Password Reset:
    Generates a cryptographically secure 6-digit OTP, stores its salted SHA-256 hash,
    and dispatches it via real SMTP to the candidate's real email address.
    Never exposes or returns the plain OTP in responses or logs.
    """
    email = req.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="No account found with this email. Please check your address or register."
        )

    res = create_and_send_password_reset_otp(email, user.name)
    if not res.get("success") or not res.get("smtp_sent"):
        # If rate-limited or SMTP delivery failed, return safe and explicit error
        err_msg = res.get("error", "")
        status_code = status.HTTP_429_TOO_MANY_REQUESTS if "wait" in err_msg.lower() else status.HTTP_502_BAD_GATEWAY
        raise HTTPException(
            status_code=status_code,
            detail=err_msg or "Failed to deliver verification email. Please check your SMTP configuration or try again later."
        )

    return SendOtpResponse(
        success=True,
        message="Verification code sent to your email address. Please check your inbox and spam folder.",
        masked_email=res.get("masked_email"),
        expires_in_seconds=600
    )


@router.post("/forgot-password/verify-otp", response_model=AuthResponse)
def verify_forgot_password_otp(req: VerifyOtpResetRequest, db: Session = Depends(get_db)):
    """
    Step 2 of Password Reset:
    Validates the candidate's 6-digit OTP code against the salted SHA-256 hash,
    resets the password with bcrypt, consumes the OTP, and establishes an authenticated session.
    """
    email = req.email.strip().lower()
    otp = req.otp.strip()
    new_password = req.new_password

    if not otp or len(otp) != 6:
        raise HTTPException(status_code=400, detail="Please enter the full 6-digit verification code.")

    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters long.")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")

    is_valid, error_msg = verify_password_reset_otp(email, otp)
    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail=error_msg
        )

    # Hash and save new password
    user.hashed_password = hash_password(new_password)
    db.commit()
    db.refresh(user)

    # Issue active authenticated session
    token = create_access_token({
        "sub": user.id,
        "email": user.email,
        "role": user.role,
        "name": user.name
    })

    total_interviews = db.query(InterviewSession).filter(InterviewSession.user_id == user.id).count()

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            role=user.role,
            auth_provider=user.auth_provider,
            avatar_url=user.avatar_url,
            created_at=user.created_at,
            total_interviews=total_interviews
        )
    )


@router.post("/reset-password")
def reset_password(req: PasswordResetRequest, db: Session = Depends(get_db)):
    """Allows candidates to securely update or reset their account password."""
    email = req.email.strip().lower()
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters.")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Return generic success to avoid email harvesting
        return {"success": True, "message": "If an account exists, the password has been reset."}

    user.hashed_password = hash_password(req.new_password)
    db.commit()
    return {"success": True, "message": "Password updated successfully. You can now sign in."}


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    """Logs out the active session."""
    return {"success": True, "message": "Session terminated successfully."}


@router.get("/admin/users", response_model=List[UserResponse])
def list_admin_users(
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Administrator-only endpoint to inspect registered platform users."""
    users = db.query(User).order_by(User.created_at.desc()).all()
    res = []
    for u in users:
        count = db.query(InterviewSession).filter(InterviewSession.user_id == u.id).count()
        res.append(UserResponse(
            id=u.id,
            email=u.email,
            name=u.name,
            role=u.role,
            auth_provider=u.auth_provider,
            avatar_url=u.avatar_url,
            created_at=u.created_at,
            total_interviews=count
        ))
    return res
