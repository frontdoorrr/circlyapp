# 푸시 알림 백엔드 구현 TODO

## 🎯 개요
프론트엔드 푸시 알림 시스템은 완료되었으나, **백엔드 구현이 필요**합니다.

## ✅ 프론트엔드 완료 사항
- Expo Push Notification 토큰 등록 시스템
- 알림 권한 요청 및 토큰 획득
- 알림 수신 및 응답 리스너
- 백엔드 API 연동 준비 (`/notifications/register-token`, `/notifications/unregister-token`)

## ❌ 백엔드 미구현 사항

### 1. API 엔드포인트 구현
**위치**: `backend/app/modules/notification/router.py`

```python
@router.post("/register-token")
async def register_push_token(
    token_data: PushTokenCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """사용자의 Expo Push Token 등록"""
    # 1. 기존 토큰 조회
    # 2. 없으면 생성, 있으면 업데이트
    # 3. user_id와 expo_push_token 저장
    pass

@router.delete("/unregister-token")
async def unregister_push_token(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """사용자의 Expo Push Token 삭제 (로그아웃 시)"""
    pass
```

### 2. 데이터베이스 모델
**위치**: `backend/app/modules/notification/models.py`

```python
class PushToken(Base):
    __tablename__ = "push_tokens"

    id = Column(UUID, primary_key=True, default=uuid4)
    user_id = Column(UUID, ForeignKey("users.id"), nullable=False)
    expo_push_token = Column(String, nullable=False, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="push_tokens")
```

### 3. Alembic Migration
**명령어**:
```bash
cd backend
uv run alembic revision --autogenerate -m "Add push_tokens table"
uv run alembic upgrade head
```

### 4. Celery 스케줄러 설정
**위치**: `backend/app/tasks/notification_tasks.py`

```python
from celery import shared_task
from httpx import AsyncClient

@shared_task
def send_poll_start_notification(poll_id: str):
    """투표 시작 알림 전송"""
    # 1. Poll 정보 조회
    # 2. Circle 멤버들의 PushToken 조회 (생성자 제외)
    # 3. Expo Push Service API 호출
    pass

@shared_task
def send_poll_deadline_warning(poll_id: str, hours_before: int):
    """투표 마감 임박 알림 (1시간 전, 10분 전)"""
    # 1. Poll 정보 조회
    # 2. 미참여자 PushToken 조회
    # 3. Expo Push Service API 호출
    pass

@shared_task
def send_poll_result_notification(poll_id: str):
    """투표 결과 발표 알림"""
    # 1. Poll 결과 조회
    # 2. Circle 멤버들의 PushToken 조회
    # 3. Expo Push Service API 호출
    pass
```

### 5. Expo Push Service 연동
**위치**: `backend/app/services/expo_push.py`

```python
import httpx

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

async def send_push_notification(
    expo_tokens: list[str],
    title: str,
    body: str,
    data: dict = None
):
    """Expo Push Service로 알림 전송"""
    messages = [
        {
            "to": token,
            "title": title,
            "body": body,
            "data": data or {},
            "sound": "default",
            "priority": "high",
        }
        for token in expo_tokens
    ]

    async with httpx.AsyncClient() as client:
        response = await client.post(EXPO_PUSH_URL, json=messages)
        return response.json()
```

### 6. Poll 생성 시 알림 스케줄링
**위치**: `backend/app/modules/poll/service.py`

```python
from app.tasks.notification_tasks import (
    send_poll_start_notification,
    send_poll_deadline_warning,
    send_poll_result_notification,
)

async def create_poll(circle_id: str, poll_data: PollCreate, user_id: str):
    # ... Poll 생성 로직 ...

    # 알림 스케줄링
    # 1. 투표 시작 알림 (즉시)
    send_poll_start_notification.delay(poll.id)

    # 2. 마감 1시간 전 알림
    one_hour_before = poll.ends_at - timedelta(hours=1)
    send_poll_deadline_warning.apply_async(
        args=[poll.id, 1],
        eta=one_hour_before
    )

    # 3. 마감 10분 전 알림
    ten_min_before = poll.ends_at - timedelta(minutes=10)
    send_poll_deadline_warning.apply_async(
        args=[poll.id, 0.17],
        eta=ten_min_before
    )

    # 4. 결과 발표 알림 (마감 시)
    send_poll_result_notification.apply_async(
        args=[poll.id],
        eta=poll.ends_at
    )

    return poll
```

### 7. Celery & Redis 설정
**위치**: `backend/app/core/celery_app.py`

```python
from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "circly",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.notification_tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
)
```

**Docker Compose**:
```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  celery:
    build: ./backend
    command: celery -A app.core.celery_app worker --loglevel=info
    depends_on:
      - redis
      - postgres
```

### 8. 의존성 추가
**위치**: `backend/requirements.txt`

```
celery[redis]>=5.3.4
redis>=5.0.1
httpx>=0.25.2
```

## 📋 구현 순서
1. ✅ PushToken 모델 및 Migration
2. ✅ API 엔드포인트 구현 (`register-token`, `unregister-token`)
3. ✅ Expo Push Service 연동 함수
4. ✅ Celery 설정 및 Task 정의
5. ✅ Poll 생성 시 알림 스케줄링 통합
6. ✅ 테스트 및 검증

## 🔗 참고 문서
- `trd/03-push-notification-implementation.md` - 상세 기술 명세
- `prd/features/03-push-notification.md` - 기능 기획서
- Expo Push Notifications: https://docs.expo.dev/push-notifications/overview/
