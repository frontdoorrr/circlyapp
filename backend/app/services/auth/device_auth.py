"""디바이스 기반 인증 서비스 (기존 방식)"""

from typing import Dict, Any, Optional
import uuid
import time

from app.models.user import User
from .base_auth import BaseAuthService


class DeviceAuthService(BaseAuthService):
    """디바이스 기반 인증 서비스"""
    
    async def authenticate(self, credentials: Dict[str, Any]) -> Optional[User]:
        """디바이스 ID 인증"""
        device_id = credentials.get("device_id")
        
        if not device_id:
            return None
        
        # 기존 사용자 확인
        user = await self.get_user_by_device_id(device_id)
        
        # 사용자가 없으면 새로 생성
        if not user:
            user = await self.create_user({"device_id": device_id})
        
        return user
    
    async def create_user(self, user_data: Dict[str, Any]) -> User:
        """디바이스 기반 사용자 생성"""
        device_id = user_data["device_id"]
        
        # 디바이스 ID 중복 확인
        existing_user = await self.get_user_by_device_id(device_id)
        if existing_user:
            return existing_user
        
        # 새 사용자 생성
        user = User(
            device_id=device_id,
            account_type="device",
            profile_emoji="😊"
        )
        
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        
        return user
    
    def generate_device_id(self, custom_prefix: str = None) -> str:
        """디바이스 ID 생성"""
        timestamp = str(int(time.time()))
        random_part = uuid.uuid4().hex[:8]
        
        if custom_prefix:
            return f"{custom_prefix}_{timestamp}_{random_part}"
        
        return f"device_{timestamp}_{random_part}"