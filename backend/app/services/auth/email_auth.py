"""이메일/비밀번호 인증 서비스"""

from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy import select
from fastapi import HTTPException

from app.models.user import User
from app.models.auth_models import EmailVerification, PasswordResetToken
from app.utils.security import (
    verify_password, 
    get_password_hash, 
    generate_verification_token,
    generate_reset_token
)
from .base_auth import BaseAuthService


class EmailAuthService(BaseAuthService):
    """이메일/비밀번호 인증 서비스"""
    
    async def authenticate(self, credentials: Dict[str, Any]) -> Optional[User]:
        """이메일/비밀번호 인증"""
        email = credentials.get("email")
        password = credentials.get("password")
        
        if not email or not password:
            return None
        
        # 이메일로 사용자 찾기
        user = await self.get_user_by_email(email)
        if not user or not user.password_hash:
            return None
        
        # 계정 잠금 확인
        if await self.is_account_locked(user.id):
            raise HTTPException(
                status_code=423,
                detail="계정이 일시적으로 잠겨있습니다. 나중에 다시 시도해주세요."
            )
        
        # 비밀번호 확인
        if not verify_password(password, user.password_hash):
            await self.increment_login_attempts(user.id)
            return None
        
        # 로그인 성공 시 시도 횟수 리셋
        await self.reset_login_attempts(user.id)
        
        return user
    
    async def create_user(self, user_data: Dict[str, Any]) -> User:
        """이메일 계정 생성"""
        # 이메일 중복 확인
        existing_user = await self.get_user_by_email(user_data["email"])
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="이미 등록된 이메일 주소입니다."
            )
        
        # 사용자명 중복 확인
        if user_data.get("username"):
            result = await self.db.execute(
                select(User).where(User.username == user_data["username"])
            )
            if result.scalar_one_or_none():
                raise HTTPException(
                    status_code=400,
                    detail="이미 사용 중인 사용자명입니다."
                )
        
        # 비밀번호 해싱
        password_hash = get_password_hash(user_data["password"])
        
        # 고유한 디바이스 ID 생성 (이메일 기반)
        import uuid
        device_id = f"email_{uuid.uuid4().hex[:16]}"
        
        user = User(
            device_id=device_id,
            email=user_data["email"],
            password_hash=password_hash,
            username=user_data.get("username"),
            display_name=user_data.get("display_name"),
            profile_emoji=user_data.get("profile_emoji", "😊"),
            account_type="email",
            email_verified=False
        )
        
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        
        # 이메일 인증 토큰 생성 및 발송
        await self.send_verification_email(user)
        
        return user
    
    async def send_verification_email(self, user: User) -> str:
        """이메일 인증 발송"""
        token = generate_verification_token()
        expires_at = datetime.utcnow() + timedelta(hours=24)  # 24시간 유효
        
        # 기존 인증 토큰 삭제
        await self.db.execute(
            select(EmailVerification).where(EmailVerification.user_id == user.id)
        )
        
        # 새 인증 토큰 저장
        verification = EmailVerification(
            user_id=user.id,
            email=user.email,
            token=token,
            expires_at=expires_at
        )
        
        self.db.add(verification)
        await self.db.commit()
        
        # TODO: 실제 이메일 발송 로직 구현
        # email_service = EmailService()
        # await email_service.send_verification_email(
        #     user.email, 
        #     user.display_name or user.username or "사용자", 
        #     token
        # )
        
        return token
    
    async def verify_email(self, token: str) -> bool:
        """이메일 인증 처리"""
        result = await self.db.execute(
            select(EmailVerification).where(
                EmailVerification.token == token,
                EmailVerification.verified == False,
                EmailVerification.expires_at > datetime.utcnow()
            )
        )
        verification = result.scalar_one_or_none()
        
        if not verification:
            return False
        
        # 인증 완료 처리
        verification.verified = True
        
        # 사용자 이메일 인증 상태 업데이트
        user = await self.get_user_by_id(verification.user_id)
        if user:
            user.email_verified = True
            user.email_verified_at = datetime.utcnow()
        
        await self.db.commit()
        return True
    
    async def request_password_reset(self, email: str) -> str:
        """비밀번호 재설정 요청"""
        user = await self.get_user_by_email(email)
        if not user:
            # 보안상 사용자 존재 여부를 알리지 않음
            return "reset_requested"
        
        token = generate_reset_token()
        expires_at = datetime.utcnow() + timedelta(hours=1)  # 1시간 유효
        
        # 기존 재설정 토큰 삭제
        await self.db.execute(
            select(PasswordResetToken).where(PasswordResetToken.user_id == user.id)
        )
        
        # 새 재설정 토큰 저장
        reset_token = PasswordResetToken(
            user_id=user.id,
            token=token,
            expires_at=expires_at
        )
        
        self.db.add(reset_token)
        await self.db.commit()
        
        # TODO: 실제 이메일 발송 로직 구현
        # email_service = EmailService()
        # await email_service.send_password_reset_email(
        #     user.email,
        #     user.display_name or user.username or "사용자",
        #     token
        # )
        
        return token
    
    async def reset_password(self, token: str, new_password: str) -> bool:
        """비밀번호 재설정 처리"""
        result = await self.db.execute(
            select(PasswordResetToken).where(
                PasswordResetToken.token == token,
                PasswordResetToken.used == False,
                PasswordResetToken.expires_at > datetime.utcnow()
            )
        )
        reset_token = result.scalar_one_or_none()
        
        if not reset_token:
            return False
        
        # 비밀번호 업데이트
        user = await self.get_user_by_id(reset_token.user_id)
        if user:
            user.password_hash = get_password_hash(new_password)
            reset_token.used = True
            
            # 로그인 시도 횟수 리셋
            await self.reset_login_attempts(user.id)
            
            await self.db.commit()
            return True
        
        return False
    
    async def change_password(
        self, 
        user: User, 
        current_password: str, 
        new_password: str
    ) -> bool:
        """비밀번호 변경"""
        if not user.password_hash:
            raise HTTPException(
                status_code=400,
                detail="비밀번호가 설정되지 않은 계정입니다."
            )
        
        # 현재 비밀번호 확인
        if not verify_password(current_password, user.password_hash):
            raise HTTPException(
                status_code=400,
                detail="현재 비밀번호가 올바르지 않습니다."
            )
        
        # 새 비밀번호로 업데이트
        user.password_hash = get_password_hash(new_password)
        await self.db.commit()
        
        return True