"""계정 마이그레이션 서비스"""

from typing import Dict, Any, Optional
from fastapi import HTTPException
from sqlalchemy import select

from app.models.user import User
from app.models.auth_models import UserLoginLog
from app.utils.security import get_password_hash
from .base_auth import BaseAuthService
from .email_auth import EmailAuthService


class AccountMigrationService(BaseAuthService):
    """계정 마이그레이션 서비스"""
    
    def __init__(self, db):
        super().__init__(db)
        self.email_auth = EmailAuthService(db)
    
    async def migrate_device_to_email(
        self, 
        user: User,
        email: str, 
        password: str
    ) -> User:
        """디바이스 계정을 이메일 계정으로 마이그레이션"""
        
        if user.account_type != "device":
            raise HTTPException(
                status_code=400,
                detail="디바이스 계정만 마이그레이션할 수 있습니다."
            )
        
        # 이메일 중복 확인
        existing_email_user = await self.get_user_by_email(email)
        if existing_email_user:
            raise HTTPException(
                status_code=400,
                detail="이미 등록된 이메일 주소입니다."
            )
        
        # 계정 업데이트
        user.email = email
        user.password_hash = get_password_hash(password)
        user.account_type = "email"
        user.email_verified = False
        
        await self.db.commit()
        
        # 이메일 인증 발송
        await self.email_auth.send_verification_email(user)
        
        # 마이그레이션 완료 로그
        await self.log_migration(user.id, "device_to_email")
        
        return user
    
    async def merge_accounts(
        self,
        primary_user: User,
        secondary_user: User
    ) -> User:
        """두 계정 병합 (소셜 로그인 시 중복 계정 처리)"""
        
        if primary_user.id == secondary_user.id:
            raise HTTPException(
                status_code=400,
                detail="같은 계정입니다."
            )
        
        # 보조 계정의 데이터를 주 계정으로 이전
        # Circle 멤버십 이전
        from app.models.circle import CircleMember
        result = await self.db.execute(
            select(CircleMember).where(CircleMember.user_id == secondary_user.id)
        )
        circle_memberships = result.scalars().all()
        
        for membership in circle_memberships:
            # 중복 멤버십 확인
            existing = await self.db.execute(
                select(CircleMember).where(
                    CircleMember.user_id == primary_user.id,
                    CircleMember.circle_id == membership.circle_id
                )
            )
            
            if not existing.scalar_one_or_none():
                membership.user_id = primary_user.id
        
        # 투표 기록 이전
        from app.models.poll import Vote
        result = await self.db.execute(
            select(Vote).where(Vote.user_id == secondary_user.id)
        )
        votes = result.scalars().all()
        
        for vote in votes:
            vote.user_id = primary_user.id
        
        # 보조 계정 비활성화
        secondary_user.is_active = False
        
        await self.db.commit()
        
        # 병합 완료 로그
        await self.log_migration(
            primary_user.id, 
            "account_merge", 
            f"Merged account {secondary_user.id}"
        )
        
        return primary_user
    
    async def upgrade_account_privileges(
        self,
        user: User,
        upgrade_type: str
    ) -> User:
        """계정 권한 업그레이드 (마이그레이션 인센티브)"""
        
        # 마이그레이션 배지/혜택 부여
        if upgrade_type == "migration_bonus":
            # TODO: 배지 시스템 구현 후 추가
            pass
        
        # 추가 Circle 생성 권한 등
        # TODO: 권한 시스템 구현 후 추가
        
        await self.db.commit()
        return user
    
    async def log_migration(
        self,
        user_id: int,
        migration_type: str,
        details: str = None
    ):
        """마이그레이션 로그 기록"""
        await self.log_login_attempt(
            user_id=user_id,
            email=None,
            success=True,
            login_method=f"migration_{migration_type}",
            failure_reason=details
        )
    
    async def get_migration_eligibility(self, user: User) -> Dict[str, Any]:
        """마이그레이션 자격 확인"""
        
        eligibility = {
            "can_migrate_to_email": False,
            "can_link_social": True,
            "migration_benefits": [],
            "requirements": []
        }
        
        if user.account_type == "device":
            eligibility["can_migrate_to_email"] = True
            eligibility["migration_benefits"] = [
                "디바이스 변경 시 계정 유지",
                "비밀번호 기반 보안",
                "마이그레이션 특별 배지",
                "추가 기능 접근 권한"
            ]
            eligibility["requirements"] = [
                "이메일 주소 등록",
                "안전한 비밀번호 설정",
                "이메일 인증 완료"
            ]
        
        elif user.account_type == "email":
            eligibility["migration_benefits"] = [
                "소셜 로그인 연동",
                "간편 로그인",
                "친구 찾기 기능"
            ]
        
        return eligibility
    
    async def authenticate(self, credentials: Dict[str, Any]) -> Optional[User]:
        """마이그레이션 서비스는 직접 인증 안함"""
        raise NotImplementedError("Migration service does not handle authentication")
    
    async def create_user(self, user_data: Dict[str, Any]) -> User:
        """마이그레이션 서비스는 직접 사용자 생성 안함"""
        raise NotImplementedError("Migration service does not create users")