"""인증 서비스 기본 클래스"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.models.user import User
from app.models.auth_models import UserLoginLog
from app.utils.security import create_access_token, create_refresh_token


class BaseAuthService(ABC):
    """인증 서비스 기본 클래스"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    @abstractmethod
    async def authenticate(self, credentials: Dict[str, Any]) -> Optional[User]:
        """사용자 인증"""
        pass
    
    @abstractmethod
    async def create_user(self, user_data: Dict[str, Any]) -> User:
        """사용자 생성"""
        pass
    
    async def create_tokens(self, user: User) -> Dict[str, str]:
        """JWT 토큰 생성"""
        access_token = create_access_token({"user_id": user.id})
        refresh_token = create_refresh_token({"user_id": user.id})
        
        # 마지막 로그인 시간 업데이트
        await self.update_last_login(user.id)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": 3600  # 1시간
        }
    
    async def get_user_by_id(self, user_id: int) -> Optional[User]:
        """사용자 ID로 조회"""
        result = await self.db.execute(
            select(User).where(User.id == user_id, User.is_active == True)
        )
        return result.scalar_one_or_none()
    
    async def get_user_by_email(self, email: str) -> Optional[User]:
        """이메일로 사용자 조회"""
        result = await self.db.execute(
            select(User).where(User.email == email, User.is_active == True)
        )
        return result.scalar_one_or_none()
    
    async def get_user_by_device_id(self, device_id: str) -> Optional[User]:
        """디바이스 ID로 사용자 조회"""
        result = await self.db.execute(
            select(User).where(User.device_id == device_id, User.is_active == True)
        )
        return result.scalar_one_or_none()
    
    async def update_last_login(self, user_id: int):
        """마지막 로그인 시간 업데이트"""
        await self.db.execute(
            update(User)
            .where(User.id == user_id)
            .values(last_login_at=datetime.utcnow())
        )
        await self.db.commit()
    
    async def log_login_attempt(
        self, 
        user_id: Optional[int],
        email: Optional[str], 
        success: bool,
        login_method: str,
        ip_address: str = None,
        user_agent: str = None,
        failure_reason: str = None
    ):
        """로그인 시도 기록"""
        login_log = UserLoginLog(
            user_id=user_id,
            email=email,
            ip_address=ip_address,
            user_agent=user_agent,
            login_method=login_method,
            success=success,
            failure_reason=failure_reason
        )
        
        self.db.add(login_log)
        await self.db.commit()
    
    async def increment_login_attempts(self, user_id: int):
        """로그인 시도 횟수 증가"""
        await self.db.execute(
            update(User)
            .where(User.id == user_id)
            .values(login_attempts=User.login_attempts + 1)
        )
        
        # 5회 이상 실패시 30분 잠금
        user = await self.get_user_by_id(user_id)
        if user and user.login_attempts >= 4:  # 5회째가 되면
            lock_until = datetime.utcnow() + timedelta(minutes=30)
            await self.db.execute(
                update(User)
                .where(User.id == user_id)
                .values(locked_until=lock_until)
            )
        
        await self.db.commit()
    
    async def reset_login_attempts(self, user_id: int):
        """로그인 시도 횟수 리셋"""
        await self.db.execute(
            update(User)
            .where(User.id == user_id)
            .values(login_attempts=0, locked_until=None)
        )
        await self.db.commit()
    
    async def is_account_locked(self, user_id: int) -> bool:
        """계정 잠금 확인"""
        user = await self.get_user_by_id(user_id)
        if not user or not user.locked_until:
            return False
        
        # 잠금 시간이 지났으면 잠금 해제
        if user.locked_until <= datetime.utcnow():
            await self.reset_login_attempts(user_id)
            return False
        
        return True