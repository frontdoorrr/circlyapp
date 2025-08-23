"""확장된 인증 시스템 모델"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import ARRAY, INET
from app.database import Base


class UserSocialAccount(Base):
    """소셜 계정 연동 정보"""
    __tablename__ = "user_social_accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    provider = Column(String(20), nullable=False)  # kakao, google, apple, naver
    provider_id = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    name = Column(String(100), nullable=True)
    profile_image_url = Column(Text, nullable=True)
    access_token = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # 관계 설정
    user = relationship("User", back_populates="social_accounts")
    
    __table_args__ = (
        {"extend_existing": True}
    )


class UserTwoFactorAuth(Base):
    """2단계 인증 정보"""
    __tablename__ = "user_two_factor_auth"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    method = Column(String(20), nullable=False)  # sms, email, totp
    secret = Column(String(255), nullable=True)  # TOTP secret
    phone_number = Column(String(20), nullable=True)  # SMS 인증용
    backup_codes = Column(ARRAY(Text), nullable=True)  # 백업 코드 배열
    enabled = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # 관계 설정
    user = relationship("User", back_populates="two_factor_auth")
    
    __table_args__ = (
        {"extend_existing": True}
    )


class UserDevice(Base):
    """사용자 디바이스 관리"""
    __tablename__ = "user_devices"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    device_id = Column(String(255), nullable=False)
    device_name = Column(String(100), nullable=True)
    device_type = Column(String(20), nullable=True)  # ios, android, web
    fcm_token = Column(String(255), nullable=True)  # 푸시 알림용
    last_used_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)
    
    # 관계 설정
    user = relationship("User", back_populates="devices")
    
    __table_args__ = (
        {"extend_existing": True}
    )


class UserLoginLog(Base):
    """로그인 기록"""
    __tablename__ = "user_login_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    email = Column(String(255), nullable=True)
    ip_address = Column(INET, nullable=True)
    user_agent = Column(Text, nullable=True)
    login_method = Column(String(20), nullable=True)  # device, email, social
    success = Column(Boolean, nullable=False)
    failure_reason = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 관계 설정
    user = relationship("User", back_populates="login_logs")
    
    __table_args__ = (
        {"extend_existing": True}
    )


class EmailVerification(Base):
    """이메일 인증"""
    __tablename__ = "email_verifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    email = Column(String(255), nullable=False)
    token = Column(String(255), nullable=False, unique=True)
    verified = Column(Boolean, default=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 관계 설정
    user = relationship("User", back_populates="email_verifications")
    
    __table_args__ = (
        {"extend_existing": True}
    )


class PasswordResetToken(Base):
    """비밀번호 재설정 토큰"""
    __tablename__ = "password_reset_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String(255), nullable=False, unique=True)
    used = Column(Boolean, default=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 관계 설정
    user = relationship("User", back_populates="password_reset_tokens")
    
    __table_args__ = (
        {"extend_existing": True}
    )