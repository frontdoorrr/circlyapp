# 푸시 알림 시스템 - 기술 구현 명세서

## 1. 개요 및 아키텍처

### 1.1 기술 스택 분석
**현재 프로젝트 의존성 분석 결과**:
- ✅ `expo-notifications@0.31.4` - 이미 설치됨
- ✅ `@react-native-async-storage/async-storage@2.1.2` - devDependencies에 설치됨
- ✅ `expo-linking@7.1.7` - 이미 설치됨  
- ✅ `axios@1.11.0` - API 클라이언트로 사용 중
- ✅ `zustand@5.0.7` - 상태 관리

**추가 필요 의존성**:
```bash
# Frontend 추가 필요
npm install expo-device expo-constants

# Backend 추가 필요 (requirements.txt)
celery[redis]>=5.3.4
redis>=5.0.1  
httpx>=0.25.2
```

### 1.2 아키텍처 설계

```
┌─────────────────┐    ┌───────────────┐    ┌─────────────────┐
│   React Native  │    │   FastAPI     │    │   Celery +      │
│   + Expo        │◄──►│   Backend     │◄──►│   Redis         │
│                 │    │               │    │                 │
│ • expo-notifs   │    │ • httpx       │    │ • Scheduled     │
│ • Deep linking  │    │ • Push API    │    │   notifications │
│ • Settings UI   │    │ • DB models   │    │ • Retry logic   │
└─────────────────┘    └───────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌───────────────┐    ┌─────────────────┐
│ Expo Push       │    │ PostgreSQL    │    │ Expo Push       │
│ Notification    │    │ Database      │    │ Service API     │
│ Service         │    │               │    │                 │
└─────────────────┘    └───────────────┘    └─────────────────┘
```

---

## 2. 데이터베이스 스키마 구현

### 2.1 Migration 파일 구조

```bash
# 새로운 마이그레이션 파일 생성
cd backend
alembic revision --autogenerate -m "add_push_notification_models"
```

### 2.2 모델 정의 (SQLAlchemy)

**app/models/notification.py**
```python
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Time, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, time
import uuid

from app.database import Base

class PushToken(Base):
    __tablename__ = "push_tokens"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    expo_token = Column(String(255), unique=True, nullable=False, index=True)
    device_id = Column(String(255), nullable=True)
    platform = Column(String(10), nullable=True)  # ios, android
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="push_tokens")

class NotificationSetting(Base):
    __tablename__ = "notification_settings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    all_notifications = Column(Boolean, default=True, nullable=False)
    poll_start_notifications = Column(Boolean, default=True, nullable=False)
    poll_deadline_notifications = Column(Boolean, default=True, nullable=False)
    poll_result_notifications = Column(Boolean, default=True, nullable=False)
    quiet_hours_start = Column(Time, default=time(22, 0), nullable=False)  # 22:00
    quiet_hours_end = Column(Time, default=time(8, 0), nullable=False)     # 08:00
    max_daily_notifications = Column(Integer, default=10, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="notification_settings")

class NotificationLog(Base):
    __tablename__ = "notification_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    poll_id = Column(UUID(as_uuid=True), ForeignKey("polls.id"), nullable=True)
    notification_type = Column(String(50), nullable=False)  # poll_start, poll_deadline, poll_result
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    sent_at = Column(DateTime, nullable=True)
    status = Column(String(20), default="pending", nullable=False)  # pending, sent, failed, clicked
    expo_receipt_id = Column(String(255), nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="notification_logs")
    poll = relationship("Poll")
```

### 2.3 User 모델 확장

**app/models/user.py** 수정
```python
# User 모델에 관계 추가
class User(Base):
    # ... 기존 필드들 ...
    
    # Relationships (추가)
    push_tokens = relationship("PushToken", back_populates="user")
    notification_settings = relationship("NotificationSetting", back_populates="user", uselist=False)
    notification_logs = relationship("NotificationLog", back_populates="user")
```

---

## 3. Pydantic 스키마 정의

### 3.1 Request/Response 스키마

**app/schemas/notification.py**
```python
from pydantic import BaseModel, Field
from datetime import datetime, time
from typing import Optional, List
from enum import Enum

class PlatformEnum(str, Enum):
    ios = "ios"
    android = "android"

class NotificationTypeEnum(str, Enum):
    poll_start = "poll_start"
    poll_deadline = "poll_deadline"
    poll_result = "poll_result"

class NotificationStatusEnum(str, Enum):
    pending = "pending"
    sent = "sent"
    failed = "failed"
    clicked = "clicked"

# Push Token Schemas
class PushTokenCreate(BaseModel):
    expo_token: str = Field(..., min_length=1, max_length=255)
    device_id: Optional[str] = Field(None, max_length=255)
    platform: Optional[PlatformEnum] = None

class PushTokenResponse(BaseModel):
    id: str
    expo_token: str
    platform: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Notification Settings Schemas
class NotificationSettingsUpdate(BaseModel):
    all_notifications: Optional[bool] = None
    poll_start_notifications: Optional[bool] = None
    poll_deadline_notifications: Optional[bool] = None
    poll_result_notifications: Optional[bool] = None
    quiet_hours_start: Optional[time] = None
    quiet_hours_end: Optional[time] = None
    max_daily_notifications: Optional[int] = Field(None, ge=1, le=50)

class NotificationSettingsResponse(BaseModel):
    id: str
    all_notifications: bool
    poll_start_notifications: bool
    poll_deadline_notifications: bool
    poll_result_notifications: bool
    quiet_hours_start: time
    quiet_hours_end: time
    max_daily_notifications: int
    updated_at: datetime

    class Config:
        from_attributes = True

# Notification Log Schemas
class NotificationLogResponse(BaseModel):
    id: str
    notification_type: NotificationTypeEnum
    title: str
    body: str
    sent_at: Optional[datetime]
    status: NotificationStatusEnum
    created_at: datetime

    class Config:
        from_attributes = True
```

---

## 4. Backend 서비스 구현

### 4.1 Notification Service

**app/services/notification_service.py**
```python
import httpx
import asyncio
from datetime import datetime, time as datetime_time
from zoneinfo import ZoneInfo
from typing import List, Optional, Dict, Any
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import PushToken, NotificationSetting, NotificationLog
from app.models.poll import Poll
from app.models.circle import CircleMember
from app.models.vote import Vote
from app.config import settings

class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.expo_push_url = "https://exp.host/--/api/v2/push/send"
    
    async def send_poll_start_notification(self, poll_id: str) -> bool:
        """투표 시작 알림 발송"""
        try:
            # Poll 정보 조회
            poll = await self.db.get(Poll, poll_id)
            if not poll:
                return False
            
            # Circle 멤버들 조회 (생성자 제외)
            members_query = select(CircleMember).where(
                and_(
                    CircleMember.circle_id == poll.circle_id,
                    CircleMember.user_id != poll.creator_id,
                    CircleMember.is_active == True
                )
            )
            members_result = await self.db.execute(members_query)
            members = members_result.scalars().all()
            
            if not members:
                return True
            
            # 푸시 토큰 조회 및 알림 설정 확인
            user_ids = [member.user_id for member in members]
            valid_tokens = await self._get_valid_push_tokens(
                user_ids, 
                notification_type="poll_start"
            )
            
            if not valid_tokens:
                return True
            
            # 알림 내용 생성
            question_preview = poll.question_text[:30]
            if len(poll.question_text) > 30:
                question_preview += "..."
            
            title = "🗳️ 새로운 투표가 시작됐어요!"
            body = f'"{question_preview}"\n지금 바로 참여해보세요! 👆'
            
            data = {
                "type": "poll_start",
                "poll_id": str(poll.id),
                "circle_id": str(poll.circle_id),
                "action_url": f"circly://poll-participation/{poll.id}"
            }
            
            # 배치 발송
            receipt_ids = await self._send_push_notifications_batch(
                valid_tokens, title, body, data
            )
            
            # 로그 저장
            await self._save_notification_logs(
                user_ids, poll_id, "poll_start", title, body, receipt_ids
            )
            
            return True
            
        except Exception as e:
            print(f"Error sending poll start notification: {e}")
            return False
    
    async def send_poll_deadline_notification(
        self, 
        poll_id: str, 
        reminder_type: str = "1h"
    ) -> bool:
        """투표 마감 임박 알림 발송"""
        try:
            poll = await self.db.get(Poll, poll_id)
            if not poll:
                return False
            
            # 미참여자만 조회
            non_voters_query = select(CircleMember.user_id).where(
                and_(
                    CircleMember.circle_id == poll.circle_id,
                    CircleMember.is_active == True,
                    ~CircleMember.user_id.in_(
                        select(Vote.user_id).where(Vote.poll_id == poll_id)
                    )
                )
            )
            non_voters_result = await self.db.execute(non_voters_query)
            non_voter_ids = [row[0] for row in non_voters_result.fetchall()]
            
            if not non_voter_ids:
                return True
            
            valid_tokens = await self._get_valid_push_tokens(
                non_voter_ids,
                notification_type="poll_deadline"
            )
            
            if not valid_tokens:
                return True
            
            # 알림 내용 (reminder_type에 따라 다름)
            question_preview = poll.question_text[:20 if reminder_type == "10m" else 30]
            if len(poll.question_text) > (20 if reminder_type == "10m" else 30):
                question_preview += "..."
            
            if reminder_type == "1h":
                title = "⏰ 투표 마감 1시간 전!"
                body = f'"{question_preview}"\n친구들이 기다리고 있어요 🔥'
            else:  # 10m
                title = "🚨 마지막 기회!"
                body = f'"{question_preview}" 투표 마감 10분 전\n놓치면 후회할걸요? 😱'
            
            data = {
                "type": "poll_deadline",
                "poll_id": str(poll.id),
                "reminder_type": reminder_type,
                "action_url": f"circly://poll-participation/{poll.id}"
            }
            
            receipt_ids = await self._send_push_notifications_batch(
                valid_tokens, title, body, data
            )
            
            await self._save_notification_logs(
                non_voter_ids, poll_id, "poll_deadline", title, body, receipt_ids
            )
            
            return True
            
        except Exception as e:
            print(f"Error sending poll deadline notification: {e}")
            return False
    
    async def send_poll_result_notification(self, poll_id: str) -> bool:
        """투표 결과 발표 알림 발송"""
        try:
            poll = await self.db.get(Poll, poll_id)
            if not poll:
                return False
            
            # Circle 전체 멤버 조회
            members_query = select(CircleMember.user_id).where(
                and_(
                    CircleMember.circle_id == poll.circle_id,
                    CircleMember.is_active == True
                )
            )
            members_result = await self.db.execute(members_query)
            member_ids = [row[0] for row in members_result.fetchall()]
            
            if not member_ids:
                return True
            
            valid_tokens = await self._get_valid_push_tokens(
                member_ids,
                notification_type="poll_result"
            )
            
            if not valid_tokens:
                return True
            
            question_preview = poll.question_text[:30]
            if len(poll.question_text) > 30:
                question_preview += "..."
            
            title = "🎉 투표 결과가 나왔어요!"
            body = f'"{question_preview}"\n궁금하지 않아? 결과 확인하러 가기 ✨'
            
            data = {
                "type": "poll_result",
                "poll_id": str(poll.id),
                "action_url": f"circly://poll-results/{poll.id}"
            }
            
            receipt_ids = await self._send_push_notifications_batch(
                valid_tokens, title, body, data
            )
            
            await self._save_notification_logs(
                member_ids, poll_id, "poll_result", title, body, receipt_ids
            )
            
            return True
            
        except Exception as e:
            print(f"Error sending poll result notification: {e}")
            return False
    
    async def _get_valid_push_tokens(
        self, 
        user_ids: List[str], 
        notification_type: str
    ) -> List[Dict[str, Any]]:
        """유효한 푸시 토큰 및 설정 확인"""
        current_time = datetime.now(ZoneInfo("Asia/Seoul")).time()
        
        # 복잡한 쿼리로 한번에 필터링
        query = select(
            PushToken.expo_token,
            PushToken.user_id,
            NotificationSetting.quiet_hours_start,
            NotificationSetting.quiet_hours_end,
            NotificationSetting.all_notifications,
            NotificationSetting.poll_start_notifications,
            NotificationSetting.poll_deadline_notifications,
            NotificationSetting.poll_result_notifications
        ).select_from(
            PushToken.__table__.join(
                NotificationSetting.__table__,
                PushToken.user_id == NotificationSetting.user_id,
                isouter=True
            )
        ).where(
            and_(
                PushToken.user_id.in_(user_ids),
                PushToken.is_active == True
            )
        )
        
        result = await self.db.execute(query)
        tokens_data = result.fetchall()
        
        valid_tokens = []
        for row in tokens_data:
            # 기본 설정값 처리
            all_notifications = row.all_notifications if row.all_notifications is not None else True
            
            # 알림 설정 확인
            if not all_notifications:
                continue
                
            type_enabled = True
            if notification_type == "poll_start":
                type_enabled = row.poll_start_notifications if row.poll_start_notifications is not None else True
            elif notification_type == "poll_deadline":
                type_enabled = row.poll_deadline_notifications if row.poll_deadline_notifications is not None else True
            elif notification_type == "poll_result":
                type_enabled = row.poll_result_notifications if row.poll_result_notifications is not None else True
            
            if not type_enabled:
                continue
            
            # 조용한 시간 확인
            quiet_start = row.quiet_hours_start or datetime_time(22, 0)
            quiet_end = row.quiet_hours_end or datetime_time(8, 0)
            
            is_quiet_time = False
            if quiet_start < quiet_end:
                is_quiet_time = quiet_start <= current_time <= quiet_end
            else:  # 자정을 넘어가는 경우
                is_quiet_time = current_time >= quiet_start or current_time <= quiet_end
            
            if is_quiet_time:
                continue
                
            valid_tokens.append({
                "token": row.expo_token,
                "user_id": str(row.user_id)
            })
        
        return valid_tokens
    
    async def _send_push_notifications_batch(
        self,
        tokens_data: List[Dict[str, Any]],
        title: str,
        body: str,
        data: Dict[str, Any],
        batch_size: int = 100
    ) -> List[str]:
        """배치로 푸시 알림 발송"""
        receipt_ids = []
        
        # 토큰만 추출
        tokens = [item["token"] for item in tokens_data]
        
        # 배치 단위로 분할
        for i in range(0, len(tokens), batch_size):
            batch_tokens = tokens[i:i + batch_size]
            
            messages = []
            for token in batch_tokens:
                messages.append({
                    "to": token,
                    "title": title,
                    "body": body,
                    "data": data,
                    "sound": "default",
                    "priority": "high"
                })
            
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        self.expo_push_url,
                        json=messages,
                        headers={
                            "Accept": "application/json",
                            "Content-Type": "application/json",
                        },
                        timeout=30.0
                    )
                    
                    if response.status_code == 200:
                        response_data = response.json()
                        if "data" in response_data:
                            for item in response_data["data"]:
                                if "id" in item:
                                    receipt_ids.append(item["id"])
                    
                    # Rate limiting 준수
                    await asyncio.sleep(0.1)
                    
            except Exception as e:
                print(f"Error sending batch notifications: {e}")
                continue
        
        return receipt_ids
    
    async def _save_notification_logs(
        self,
        user_ids: List[str],
        poll_id: str,
        notification_type: str,
        title: str,
        body: str,
        receipt_ids: List[str]
    ):
        """알림 발송 로그 저장"""
        try:
            logs = []
            for user_id in user_ids:
                log = NotificationLog(
                    user_id=user_id,
                    poll_id=poll_id,
                    notification_type=notification_type,
                    title=title,
                    body=body,
                    sent_at=datetime.utcnow(),
                    status="sent"
                )
                logs.append(log)
            
            self.db.add_all(logs)
            await self.db.commit()
            
        except Exception as e:
            print(f"Error saving notification logs: {e}")
            await self.db.rollback()
```

---

## 5. Celery Tasks 구현

### 5.1 Task 정의

**app/tasks/notification_tasks.py**
```python
from celery import Celery
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.notification_service import NotificationService
from app.config import settings

celery_app = Celery(
    'circly_notifications',
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=['app.tasks.notification_tasks']
)

# Celery 설정
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Asia/Seoul',
    enable_utc=True,
    task_routes={
        'app.tasks.notification_tasks.send_poll_deadline_notification_1h': {'queue': 'notifications'},
        'app.tasks.notification_tasks.send_poll_deadline_notification_10m': {'queue': 'notifications'},
        'app.tasks.notification_tasks.send_poll_result_notification': {'queue': 'notifications'},
    }
)

@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def send_poll_deadline_notification_1h(self, poll_id: str):
    """투표 마감 1시간 전 알림"""
    try:
        import asyncio
        from app.database import engine
        
        async def send_notification():
            async with AsyncSession(engine) as db:
                notification_service = NotificationService(db)
                success = await notification_service.send_poll_deadline_notification(
                    poll_id, reminder_type="1h"
                )
                if not success:
                    raise Exception("Failed to send 1h deadline notification")
        
        asyncio.run(send_notification())
        
    except Exception as exc:
        print(f"1h deadline notification failed for poll {poll_id}: {exc}")
        raise self.retry(exc=exc)

@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def send_poll_deadline_notification_10m(self, poll_id: str):
    """투표 마감 10분 전 알림"""
    try:
        import asyncio
        from app.database import engine
        
        async def send_notification():
            async with AsyncSession(engine) as db:
                notification_service = NotificationService(db)
                success = await notification_service.send_poll_deadline_notification(
                    poll_id, reminder_type="10m"
                )
                if not success:
                    raise Exception("Failed to send 10m deadline notification")
        
        asyncio.run(send_notification())
        
    except Exception as exc:
        print(f"10m deadline notification failed for poll {poll_id}: {exc}")
        raise self.retry(exc=exc)

@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def send_poll_result_notification(self, poll_id: str):
    """투표 결과 발표 알림"""
    try:
        import asyncio
        from app.database import engine
        
        async def send_notification():
            async with AsyncSession(engine) as db:
                notification_service = NotificationService(db)
                success = await notification_service.send_poll_result_notification(poll_id)
                if not success:
                    raise Exception("Failed to send poll result notification")
        
        asyncio.run(send_notification())
        
    except Exception as exc:
        print(f"Result notification failed for poll {poll_id}: {exc}")
        raise self.retry(exc=exc)

def schedule_poll_notifications(poll_id: str, deadline: datetime):
    """투표 생성 시 마감 관련 알림들 스케줄링"""
    
    # 1시간 전 알림 스케줄링
    one_hour_before = deadline - timedelta(hours=1)
    if one_hour_before > datetime.now(ZoneInfo("UTC")):
        send_poll_deadline_notification_1h.apply_async(
            args=[poll_id],
            eta=one_hour_before
        )
    
    # 10분 전 알림 스케줄링
    ten_minutes_before = deadline - timedelta(minutes=10)
    if ten_minutes_before > datetime.now(ZoneInfo("UTC")):
        send_poll_deadline_notification_10m.apply_async(
            args=[poll_id],
            eta=ten_minutes_before
        )
    
    # 결과 발표 알림 스케줄링
    send_poll_result_notification.apply_async(
        args=[poll_id],
        eta=deadline
    )
```

---

## 6. API 엔드포인트 구현

### 6.1 API 라우터

**app/api/v1/notifications.py**
```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.notification import PushToken, NotificationSetting, NotificationLog
from app.schemas.notification import (
    PushTokenCreate, 
    PushTokenResponse,
    NotificationSettingsUpdate,
    NotificationSettingsResponse,
    NotificationLogResponse
)

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.post("/push-tokens", response_model=PushTokenResponse)
async def register_push_token(
    token_data: PushTokenCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """푸시 토큰 등록/갱신"""
    try:
        # 기존 토큰 확인
        existing_token_query = select(PushToken).where(
            PushToken.user_id == current_user.id
        )
        existing_result = await db.execute(existing_token_query)
        existing_token = existing_result.scalar_one_or_none()
        
        if existing_token:
            # 토큰 업데이트
            existing_token.expo_token = token_data.expo_token
            existing_token.device_id = token_data.device_id
            existing_token.platform = token_data.platform
            existing_token.is_active = True
            db.add(existing_token)
        else:
            # 새 토큰 생성
            new_token = PushToken(
                user_id=current_user.id,
                expo_token=token_data.expo_token,
                device_id=token_data.device_id,
                platform=token_data.platform
            )
            db.add(new_token)
            existing_token = new_token
        
        await db.commit()
        await db.refresh(existing_token)
        
        return existing_token
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to register push token: {str(e)}"
        )

@router.get("/settings", response_model=NotificationSettingsResponse)
async def get_notification_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """사용자 알림 설정 조회"""
    settings_query = select(NotificationSetting).where(
        NotificationSetting.user_id == current_user.id
    )
    result = await db.execute(settings_query)
    settings = result.scalar_one_or_none()
    
    if not settings:
        # 기본 설정 생성
        settings = NotificationSetting(user_id=current_user.id)
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    
    return settings

@router.put("/settings", response_model=NotificationSettingsResponse)
async def update_notification_settings(
    settings_update: NotificationSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """사용자 알림 설정 업데이트"""
    try:
        settings_query = select(NotificationSetting).where(
            NotificationSetting.user_id == current_user.id
        )
        result = await db.execute(settings_query)
        settings = result.scalar_one_or_none()
        
        if not settings:
            # 새로운 설정 생성
            settings = NotificationSetting(user_id=current_user.id)
            db.add(settings)
        
        # 필드별 업데이트
        update_data = settings_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(settings, field, value)
        
        await db.commit()
        await db.refresh(settings)
        
        return settings
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update notification settings: {str(e)}"
        )

@router.get("/logs", response_model=List[NotificationLogResponse])
async def get_notification_history(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """알림 발송 내역 조회 (최근 20개)"""
    logs_query = select(NotificationLog).where(
        NotificationLog.user_id == current_user.id
    ).order_by(
        NotificationLog.created_at.desc()
    ).limit(limit)
    
    result = await db.execute(logs_query)
    logs = result.scalars().all()
    
    return logs
```

---

## 7. Frontend 구현

### 7.1 NotificationService

**src/services/notifications/NotificationService.ts**
```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { apiClient } from '../api/client';

// 알림 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface NotificationSettings {
  id: string;
  all_notifications: boolean;
  poll_start_notifications: boolean;
  poll_deadline_notifications: boolean;
  poll_result_notifications: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  max_daily_notifications: number;
  updated_at: string;
}

class NotificationService {
  private pushToken: string | null = null;
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;

  async initialize(): Promise<void> {
    try {
      // 푸시 권한 요청 및 토큰 등록
      const token = await this.registerPushToken();
      if (token) {
        this.pushToken = token;
        await this.savePushTokenToServer(token);
      }

      // 알림 리스너 설정
      this.setupNotificationListeners();
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  }

  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.warn('Push notifications only work on physical devices');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Push notification permission not granted');
      return false;
    }

    return true;
  }

  async registerPushToken(): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        console.error('Expo project ID not found');
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      const token = tokenData.data;
      
      // 로컬 스토리지에 저장
      await AsyncStorage.setItem('expoPushToken', token);

      return token;
    } catch (error) {
      console.error('Failed to get push token:', error);
      return null;
    }
  }

  private async savePushTokenToServer(token: string): Promise<void> {
    try {
      const deviceId = await this.getDeviceId();
      const platform = Platform.OS;

      await apiClient.post('/notifications/push-tokens', {
        expo_token: token,
        device_id: deviceId,
        platform: platform,
      });

      console.log('Push token saved to server successfully');
    } catch (error) {
      console.error('Failed to save push token to server:', error);
    }
  }

  private async getDeviceId(): Promise<string> {
    try {
      let deviceId = await AsyncStorage.getItem('deviceId');
      
      if (!deviceId) {
        deviceId = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('deviceId', deviceId);
      }
      
      return deviceId;
    } catch (error) {
      console.error('Failed to get device ID:', error);
      return `${Platform.OS}-${Date.now()}`;
    }
  }

  private setupNotificationListeners(): void {
    // 앱이 포그라운드에 있을 때 받는 알림
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received in foreground:', notification);
        // 필요시 인앱 알림 표시
      }
    );

    // 알림을 터치했을 때
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification response:', response);
        this.handleNotificationResponse(response);
      }
    );
  }

  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const data = response.notification.request.content.data;
    
    if (data?.action_url) {
      // 딥링크 처리
      this.handleDeepLink(data.action_url);
    }

    // 알림 클릭 로그 (선택사항)
    this.logNotificationClick(data);
  }

  private handleDeepLink(actionUrl: string): void {
    // 실제 네비게이션은 App.tsx에서 처리
    console.log('Deep link:', actionUrl);
    
    // 글로벌 이벤트 발생 또는 네비게이션 서비스 호출
    // 예: NavigationService.navigate(route, params);
  }

  private async logNotificationClick(data: any): Promise<void> {
    try {
      // 서버에 클릭 로그 전송 (선택사항)
      if (data?.poll_id) {
        console.log('Notification clicked for poll:', data.poll_id);
      }
    } catch (error) {
      console.error('Failed to log notification click:', error);
    }
  }

  async getNotificationSettings(): Promise<NotificationSettings | null> {
    try {
      const response = await apiClient.get('/notifications/settings');
      return response.data;
    } catch (error) {
      console.error('Failed to get notification settings:', error);
      return null;
    }
  }

  async updateNotificationSettings(
    settings: Partial<NotificationSettings>
  ): Promise<NotificationSettings | null> {
    try {
      const response = await apiClient.put('/notifications/settings', settings);
      return response.data;
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      return null;
    }
  }

  cleanup(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }
}

export const notificationService = new NotificationService();
```

### 7.2 useNotifications Hook

**src/hooks/useNotifications.ts**
```typescript
import { useState, useEffect } from 'react';
import { notificationService, NotificationSettings } from '../services/notifications/NotificationService';

export const useNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    initializePushNotifications();

    return () => {
      notificationService.cleanup();
    };
  }, []);

  const initializePushNotifications = async () => {
    try {
      setIsLoading(true);
      await notificationService.initialize();
      
      // 설정 로드
      await loadNotificationSettings();
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadNotificationSettings = async () => {
    try {
      const settings = await notificationService.getNotificationSettings();
      setNotificationSettings(settings);
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  };

  const updateSettings = async (settings: Partial<NotificationSettings>) => {
    try {
      setIsLoading(true);
      const updatedSettings = await notificationService.updateNotificationSettings(settings);
      if (updatedSettings) {
        setNotificationSettings(updatedSettings);
      }
      return updatedSettings;
    } catch (error) {
      console.error('Failed to update settings:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    expoPushToken,
    notificationSettings,
    isLoading,
    initializePushNotifications,
    updateSettings,
    loadNotificationSettings,
  };
};
```

---

## 8. Poll Service 통합

### 8.1 Poll 생성 시 알림 트리거

**app/services/poll_service.py** 수정
```python
# 기존 poll_service.py의 create_poll_from_template 메서드에 추가

async def create_poll_from_template(
    self, 
    template_id: UUID, 
    circle_id: UUID,
    deadline: datetime,
    creator_id: UUID
) -> Poll:
    # ... 기존 Poll 생성 로직 ...
    
    await db.commit()
    await db.refresh(poll)
    
    # 🆕 알림 발송 및 스케줄링
    try:
        # 1. 즉시 투표 시작 알림 발송
        notification_service = NotificationService(db)
        await notification_service.send_poll_start_notification(str(poll.id))
        
        # 2. 마감 관련 알림들 스케줄링
        from app.tasks.notification_tasks import schedule_poll_notifications
        schedule_poll_notifications(str(poll.id), poll.deadline)
        
        print(f"Notifications scheduled for poll {poll.id}")
        
    except Exception as e:
        print(f"Failed to schedule notifications for poll {poll.id}: {e}")
        # 알림 실패해도 투표 생성은 성공으로 처리
    
    return poll
```

---

## 9. 구현 순서 및 테스트 계획

### 9.1 Phase 1 구현 순서 (7-10일)

```bash
# Day 1-2: Backend Infrastructure
1. 데이터베이스 모델 및 마이그레이션 생성
2. Pydantic 스키마 정의
3. 기본 API 엔드포인트 구현

# Day 3-4: Notification Service 구현
1. NotificationService 클래스 구현
2. Expo Push API 연동
3. 배치 발송 로직 구현

# Day 5-6: Celery Tasks 및 스케줄링
1. Background task 구현
2. Redis 연동
3. 투표 생성 시 알림 트리거 추가

# Day 7-8: Frontend 구현
1. NotificationService.ts 구현
2. useNotifications Hook 구현
3. 권한 요청 및 토큰 등록

# Day 9-10: 설정 UI 및 통합 테스트
1. NotificationSettingsScreen 구현
2. 딥링크 처리
3. 전체 플로우 테스트
```

### 9.2 테스트 시나리오

```typescript
// 테스트할 주요 시나리오
1. 투표 생성 → 즉시 알림 발송 확인
2. 마감 1시간/10분 전 알림 스케줄링 확인
3. 투표 마감 → 결과 알림 발송 확인
4. 알림 설정 변경 → 발송 필터링 확인
5. 조용한 시간 → 알림 발송 중단 확인
6. 딥링크 → 올바른 화면 이동 확인
```

---

## 10. 성능 최적화 및 모니터링

### 10.1 배치 발송 최적화
- Circle 크기에 따른 배치 사이즈 조정
- Rate limiting 준수 (Expo: 600 notifications/second)
- 실패한 토큰 자동 제거

### 10.2 모니터링 쿼리
```sql
-- 일별 알림 발송 현황
SELECT 
  DATE(sent_at) as date,
  notification_type,
  COUNT(*) as sent_count,
  COUNT(CASE WHEN status = 'clicked' THEN 1 END) as clicked_count,
  ROUND(
    COUNT(CASE WHEN status = 'clicked' THEN 1 END) * 100.0 / COUNT(*), 
    2
  ) as open_rate
FROM notification_logs 
WHERE sent_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(sent_at), notification_type
ORDER BY date DESC, notification_type;
```

이 구현 명세서를 바탕으로 Phase 1 푸시 알림 시스템을 체계적으로 구현할 수 있습니다.