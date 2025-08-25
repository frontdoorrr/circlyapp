"""확장된 인증 시스템 스키마"""

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import re


class EmailLoginRequest(BaseModel):
    """이메일 로그인 요청"""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    remember_me: bool = False


class RegisterRequest(BaseModel):
    """회원가입 요청"""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    display_name: Optional[str] = Field(None, max_length=100)
    profile_emoji: str = Field(default="😊", max_length=10)
    
    @validator('password')
    def validate_password_strength(cls, v):
        """비밀번호 강도 검증"""
        if len(v) < 8:
            raise ValueError('비밀번호는 8자 이상이어야 합니다')
        
        if not re.search(r"[a-z]", v):
            raise ValueError('비밀번호는 소문자를 포함해야 합니다')
        
        if not re.search(r"[A-Z]", v):
            raise ValueError('비밀번호는 대문자를 포함해야 합니다')
        
        if not re.search(r"\d", v):
            raise ValueError('비밀번호는 숫자를 포함해야 합니다')
        
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError('비밀번호는 특수문자를 포함해야 합니다')
        
        return v
    
    @validator('username')
    def validate_username(cls, v):
        """사용자명 검증"""
        if v and not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('사용자명은 영문, 숫자, 언더스코어만 사용 가능합니다')
        return v


class SocialLoginRequest(BaseModel):
    """소셜 로그인 요청"""
    provider: str = Field(..., pattern=r'^(kakao|google|apple|naver)$')
    access_token: str
    device_info: Optional[Dict[str, Any]] = None


class AccountMigrationRequest(BaseModel):
    """계정 마이그레이션 요청"""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    
    @validator('password')
    def validate_password_strength(cls, v):
        """비밀번호 강도 검증"""
        if len(v) < 8:
            raise ValueError('비밀번호는 8자 이상이어야 합니다')
        
        if not re.search(r"[a-z]", v):
            raise ValueError('비밀번호는 소문자를 포함해야 합니다')
        
        if not re.search(r"[A-Z]", v):
            raise ValueError('비밀번호는 대문자를 포함해야 합니다')
        
        if not re.search(r"\d", v):
            raise ValueError('비밀번호는 숫자를 포함해야 합니다')
        
        return v


class PasswordResetRequest(BaseModel):
    """비밀번호 재설정 요청"""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """비밀번호 재설정 확인"""
    token: str
    new_password: str = Field(..., min_length=8, max_length=128)
    
    @validator('new_password')
    def validate_password_strength(cls, v):
        """비밀번호 강도 검증"""
        if len(v) < 8:
            raise ValueError('비밀번호는 8자 이상이어야 합니다')
        
        if not re.search(r"[a-z]", v):
            raise ValueError('비밀번호는 소문자를 포함해야 합니다')
        
        if not re.search(r"[A-Z]", v):
            raise ValueError('비밀번호는 대문자를 포함해야 합니다')
        
        if not re.search(r"\d", v):
            raise ValueError('비밀번호는 숫자를 포함해야 합니다')
        
        return v


class ChangePasswordRequest(BaseModel):
    """비밀번호 변경 요청"""
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)
    
    @validator('new_password')
    def validate_password_strength(cls, v):
        """비밀번호 강도 검증"""
        if len(v) < 8:
            raise ValueError('비밀번호는 8자 이상이어야 합니다')
        
        if not re.search(r"[a-z]", v):
            raise ValueError('비밀번호는 소문자를 포함해야 합니다')
        
        if not re.search(r"[A-Z]", v):
            raise ValueError('비밀번호는 대문자를 포함해야 합니다')
        
        if not re.search(r"\d", v):
            raise ValueError('비밀번호는 숫자를 포함해야 합니다')
        
        return v


class EmailVerificationRequest(BaseModel):
    """이메일 인증 요청"""
    token: str


class AuthResponse(BaseModel):
    """인증 응답"""
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: int
    user: Dict[str, Any]


class ExtendedUserResponse(BaseModel):
    """확장된 사용자 정보 응답"""
    id: int
    username: Optional[str]
    display_name: Optional[str]
    profile_emoji: str
    email: Optional[str]
    email_verified: bool
    account_type: str
    role: str
    is_active: bool
    created_at: datetime
    last_login_at: Optional[datetime]
    
    # 연결된 소셜 계정 정보
    social_accounts: List[Dict[str, Any]] = []
    
    # 2FA 설정 정보
    two_factor_enabled: bool = False
    two_factor_methods: List[str] = []
    
    # 디바이스 정보
    device_count: int = 0
    
    class Config:
        from_attributes = True


class SocialAccountResponse(BaseModel):
    """소셜 계정 정보"""
    id: int
    provider: str
    email: Optional[str]
    name: Optional[str]
    profile_image_url: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class DeviceResponse(BaseModel):
    """디바이스 정보"""
    id: int
    device_id: str
    device_name: Optional[str]
    device_type: Optional[str]
    last_used_at: datetime
    is_active: bool
    
    class Config:
        from_attributes = True


class LoginLogResponse(BaseModel):
    """로그인 로그"""
    id: int
    ip_address: Optional[str]
    user_agent: Optional[str]
    login_method: Optional[str]
    success: bool
    failure_reason: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class Enable2FARequest(BaseModel):
    """2FA 활성화 요청"""
    method: str = Field(..., pattern=r'^(sms|email|totp)$')
    phone_number: Optional[str] = None
    
    @validator('phone_number')
    def validate_phone_number(cls, v, values):
        """SMS 인증 시 전화번호 필수"""
        if values.get('method') == 'sms' and not v:
            raise ValueError('SMS 인증에는 전화번호가 필요합니다')
        return v


class Verify2FARequest(BaseModel):
    """2FA 인증 요청"""
    code: str = Field(..., min_length=6, max_length=6)


class LinkSocialAccountRequest(BaseModel):
    """소셜 계정 연동 요청"""
    provider: str = Field(..., pattern=r'^(kakao|google|apple|naver)$')
    access_token: str


class UnlinkSocialAccountRequest(BaseModel):
    """소셜 계정 연동 해제 요청"""
    provider: str = Field(..., pattern=r'^(kakao|google|apple|naver)$')


class DeviceManagementRequest(BaseModel):
    """디바이스 관리 요청"""
    device_name: Optional[str] = Field(None, max_length=100)
    fcm_token: Optional[str] = None


class PasswordStrengthResponse(BaseModel):
    """비밀번호 강도 응답"""
    score: int = Field(..., ge=0, le=5)
    max_score: int = 5
    issues: List[str] = []
    is_valid: bool