from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse
from app.schemas.auth import (
    EmailLoginRequest, RegisterRequest, AccountMigrationRequest,
    PasswordResetRequest, PasswordResetConfirm, ChangePasswordRequest,
    EmailVerificationRequest, AuthResponse, ExtendedUserResponse,
    PasswordStrengthResponse
)
from app.utils.security import (
    create_access_token, verify_refresh_token, 
    validate_password_strength, sanitize_user_agent, extract_device_info
)
from app.dependencies import get_current_active_user
from app.services.auth import (
    DeviceAuthService, EmailAuthService, AccountMigrationService
)

router = APIRouter()

# 기존 디바이스 로그인 유지
class LoginRequest(BaseModel):
    device_id: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

@router.post("/auth/login", response_model=LoginResponse)
async def login_device(
    login_data: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """디바이스 기반 로그인 (기존 방식 유지)"""
    device_auth = DeviceAuthService(db)
    
    # 클라이언트 정보 수집
    ip_address = request.client.host
    user_agent = sanitize_user_agent(request.headers.get("user-agent", ""))
    
    try:
        user = await device_auth.authenticate({"device_id": login_data.device_id})
        if not user:
            await device_auth.log_login_attempt(
                user_id=None,
                email=None,
                success=False,
                login_method="device",
                ip_address=ip_address,
                user_agent=user_agent,
                failure_reason="Invalid device ID"
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid device ID"
            )
        
        # 토큰 생성
        tokens = await device_auth.create_tokens(user)
        
        # 성공 로그
        await device_auth.log_login_attempt(
            user_id=user.id,
            email=user.email,
            success=True,
            login_method="device",
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        return {
            "access_token": tokens["access_token"],
            "token_type": "bearer",
            "user": UserResponse.from_orm(user)
        }
        
    except Exception as e:
        await device_auth.log_login_attempt(
            user_id=None,
            email=None,
            success=False,
            login_method="device",
            ip_address=ip_address,
            user_agent=user_agent,
            failure_reason=str(e)
        )
        raise

@router.post("/auth/email-login", response_model=AuthResponse)
async def login_email(
    login_data: EmailLoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """이메일/비밀번호 로그인"""
    email_auth = EmailAuthService(db)
    
    # 클라이언트 정보 수집
    ip_address = request.client.host
    user_agent = sanitize_user_agent(request.headers.get("user-agent", ""))
    
    try:
        user = await email_auth.authenticate({
            "email": login_data.email,
            "password": login_data.password
        })
        
        if not user:
            await email_auth.log_login_attempt(
                user_id=None,
                email=login_data.email,
                success=False,
                login_method="email",
                ip_address=ip_address,
                user_agent=user_agent,
                failure_reason="Invalid credentials"
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="이메일 또는 비밀번호가 올바르지 않습니다."
            )
        
        # 토큰 생성
        tokens = await email_auth.create_tokens(user)
        
        # 성공 로그
        await email_auth.log_login_attempt(
            user_id=user.id,
            email=user.email,
            success=True,
            login_method="email",
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        # ExtendedUserResponse 수동으로 생성
        extended_user = {
            "id": user.id,
            "username": user.username,
            "display_name": user.display_name,
            "profile_emoji": user.profile_emoji,
            "email": user.email,
            "email_verified": user.email_verified or False,
            "account_type": user.account_type or "device",
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None,
            "social_accounts": [],
            "two_factor_enabled": False
        }
        
        return AuthResponse(
            access_token=tokens["access_token"],
            refresh_token=tokens["refresh_token"],
            token_type=tokens["token_type"],
            expires_in=tokens["expires_in"],
            user=extended_user
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await email_auth.log_login_attempt(
            user_id=None,
            email=login_data.email,
            success=False,
            login_method="email",
            ip_address=ip_address,
            user_agent=user_agent,
            failure_reason=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="로그인 처리 중 오류가 발생했습니다."
        )

@router.post("/auth/register", response_model=AuthResponse)
async def register_email(
    register_data: RegisterRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """이메일 회원가입"""
    email_auth = EmailAuthService(db)
    
    try:
        user = await email_auth.create_user({
            "email": register_data.email,
            "password": register_data.password,
            "username": register_data.username,
            "display_name": register_data.display_name,
            "profile_emoji": register_data.profile_emoji
        })
        
        # 토큰 생성
        tokens = await email_auth.create_tokens(user)
        
        # ExtendedUserResponse 수동으로 생성 (relationship 로딩 문제 해결)
        extended_user = {
            "id": user.id,
            "username": user.username,
            "display_name": user.display_name,
            "profile_emoji": user.profile_emoji,
            "email": user.email,
            "email_verified": user.email_verified or False,
            "account_type": user.account_type or "device",
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None,
            "social_accounts": [],  # 추후 소셜 계정 구현 시 로드
            "two_factor_enabled": False  # 추후 2FA 구현 시 로드
        }
        
        return AuthResponse(
            access_token=tokens["access_token"],
            refresh_token=tokens["refresh_token"],
            token_type=tokens["token_type"],
            expires_in=tokens["expires_in"],
            user=extended_user
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="회원가입 처리 중 오류가 발생했습니다."
        )

@router.post("/auth/migrate-account", response_model=AuthResponse)
async def migrate_account(
    migration_data: AccountMigrationRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """계정 마이그레이션 (디바이스 → 이메일)"""
    migration_service = AccountMigrationService(db)
    
    try:
        user = await migration_service.migrate_device_to_email(
            current_user,
            migration_data.email,
            migration_data.password
        )
        
        # 새 토큰 생성
        tokens = await migration_service.create_tokens(user)
        
        # ExtendedUserResponse 수동으로 생성
        extended_user = {
            "id": user.id,
            "username": user.username,
            "display_name": user.display_name,
            "profile_emoji": user.profile_emoji,
            "email": user.email,
            "email_verified": user.email_verified or False,
            "account_type": user.account_type or "device",
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None,
            "social_accounts": [],
            "two_factor_enabled": False
        }
        
        return AuthResponse(
            access_token=tokens["access_token"],
            refresh_token=tokens["refresh_token"],
            token_type=tokens["token_type"],
            expires_in=tokens["expires_in"],
            user=extended_user
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="계정 마이그레이션 중 오류가 발생했습니다."
        )

@router.post("/auth/verify-email")
async def verify_email(
    verification_data: EmailVerificationRequest,
    db: AsyncSession = Depends(get_db)
):
    """이메일 인증"""
    email_auth = EmailAuthService(db)
    
    success = await email_auth.verify_email(verification_data.token)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="유효하지 않거나 만료된 인증 토큰입니다."
        )
    
    return {"message": "이메일 인증이 완료되었습니다."}

@router.post("/auth/request-password-reset")
async def request_password_reset(
    reset_data: PasswordResetRequest,
    db: AsyncSession = Depends(get_db)
):
    """비밀번호 재설정 요청"""
    email_auth = EmailAuthService(db)
    
    await email_auth.request_password_reset(reset_data.email)
    
    return {
        "message": "비밀번호 재설정 이메일을 발송했습니다. 이메일을 확인해주세요."
    }

@router.post("/auth/reset-password")
async def reset_password(
    reset_data: PasswordResetConfirm,
    db: AsyncSession = Depends(get_db)
):
    """비밀번호 재설정 확인"""
    email_auth = EmailAuthService(db)
    
    success = await email_auth.reset_password(
        reset_data.token,
        reset_data.new_password
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="유효하지 않거나 만료된 재설정 토큰입니다."
        )
    
    return {"message": "비밀번호가 성공적으로 재설정되었습니다."}

@router.post("/auth/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """비밀번호 변경"""
    email_auth = EmailAuthService(db)
    
    await email_auth.change_password(
        current_user,
        password_data.current_password,
        password_data.new_password
    )
    
    return {"message": "비밀번호가 성공적으로 변경되었습니다."}

@router.post("/auth/check-password-strength", response_model=PasswordStrengthResponse)
async def check_password_strength(
    request: dict
):
    """비밀번호 강도 확인"""
    password = request.get("password", "")
    strength = validate_password_strength(password)
    
    return PasswordStrengthResponse(
        score=strength["score"],
        max_score=strength["max_score"],
        issues=strength["issues"],
        is_valid=strength["is_valid"]
    )

@router.post("/auth/refresh-token", response_model=AuthResponse)
async def refresh_token(
    refresh_token: str,
    db: AsyncSession = Depends(get_db)
):
    """토큰 갱신"""
    payload = verify_refresh_token(refresh_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 리프레시 토큰입니다."
        )
    
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="토큰에서 사용자 정보를 찾을 수 없습니다."
        )
    
    # 사용자 확인
    result = await db.execute(
        select(User).where(User.id == user_id, User.is_active == True)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="사용자를 찾을 수 없습니다."
        )
    
    # 새 토큰 생성
    device_auth = DeviceAuthService(db)
    tokens = await device_auth.create_tokens(user)
    
    return AuthResponse(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        token_type=tokens["token_type"],
        expires_in=tokens["expires_in"],
        user=ExtendedUserResponse.from_orm(user).__dict__
    )

@router.post("/auth/logout")
async def logout():
    """로그아웃 (클라이언트에서 토큰 삭제)"""
    return {"message": "Successfully logged out"}

@router.get("/auth/me")
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    """현재 사용자 정보 조회 (확장된 정보)"""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "display_name": current_user.display_name,
        "profile_emoji": current_user.profile_emoji,
        "email": current_user.email,
        "email_verified": current_user.email_verified or False,
        "account_type": current_user.account_type or "device",
        "role": current_user.role or "USER",
        "is_active": current_user.is_active,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        "last_login_at": current_user.last_login_at.isoformat() if current_user.last_login_at else None,
        "social_accounts": [],
        "two_factor_enabled": False
    }