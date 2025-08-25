from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=True)
    display_name = Column(String(100), nullable=True)
    profile_emoji = Column(String(10), default="😊")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 확장된 인증 필드
    email = Column(String(255), unique=True, index=True, nullable=True)
    password_hash = Column(String(255), nullable=True)
    email_verified = Column(Boolean, default=False)
    email_verified_at = Column(DateTime(timezone=True), nullable=True)
    account_type = Column(String(20), default="device")  # device, email, social
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime(timezone=True), nullable=True)
    
    # 권한 관리
    role = Column(String(20), default="USER", nullable=False)  # ADMIN, USER
    
    # 기존 관계 설정
    circles = relationship("CircleMember", back_populates="user")
    created_polls = relationship("Poll", back_populates="creator")
    votes = relationship("Vote", back_populates="user")
    
    # 새로운 관계 설정
    social_accounts = relationship("UserSocialAccount", back_populates="user", cascade="all, delete-orphan")
    two_factor_auth = relationship("UserTwoFactorAuth", back_populates="user", cascade="all, delete-orphan")
    devices = relationship("UserDevice", back_populates="user", cascade="all, delete-orphan")
    login_logs = relationship("UserLoginLog", back_populates="user", cascade="all, delete-orphan")
    email_verifications = relationship("EmailVerification", back_populates="user", cascade="all, delete-orphan")
    password_reset_tokens = relationship("PasswordResetToken", back_populates="user", cascade="all, delete-orphan")
    
    # 푸시 알림 관계 설정
    push_tokens = relationship("PushToken", back_populates="user", cascade="all, delete-orphan")
    notification_settings = relationship("NotificationSetting", back_populates="user", uselist=False, cascade="all, delete-orphan")
    notification_logs = relationship("NotificationLog", back_populates="user", cascade="all, delete-orphan")
    
    # 권한 관련 편의 메서드
    @property
    def is_admin(self) -> bool:
        """관리자 권한 확인"""
        return self.role == "ADMIN"
    
    @property
    def is_user(self) -> bool:
        """일반 사용자 권한 확인"""  
        return self.role == "USER"