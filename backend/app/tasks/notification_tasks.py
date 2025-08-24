from celery import Celery
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from sqlalchemy.ext.asyncio import AsyncSession
import asyncio

from app.services.notification_service import NotificationService
from app.database import get_db, AsyncSessionLocal
from app.config import settings

# Celery 앱 생성
celery_app = Celery(
    'circly_notifications',
    broker=settings.redis_url if hasattr(settings, 'redis_url') else "redis://localhost:6379/0",
    backend=settings.redis_url if hasattr(settings, 'redis_url') else "redis://localhost:6379/0",
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
        async def send_notification():
            async with AsyncSessionLocal() as db:
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
        async def send_notification():
            async with AsyncSessionLocal() as db:
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
        async def send_notification():
            async with AsyncSessionLocal() as db:
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
    
    # UTC로 변환하여 처리
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=ZoneInfo("UTC"))
    else:
        deadline = deadline.astimezone(ZoneInfo("UTC"))
    
    current_time = datetime.now(ZoneInfo("UTC"))
    
    # 1시간 전 알림 스케줄링
    one_hour_before = deadline - timedelta(hours=1)
    if one_hour_before > current_time:
        send_poll_deadline_notification_1h.apply_async(
            args=[poll_id],
            eta=one_hour_before
        )
        print(f"Scheduled 1h deadline notification for poll {poll_id} at {one_hour_before}")
    
    # 10분 전 알림 스케줄링
    ten_minutes_before = deadline - timedelta(minutes=10)
    if ten_minutes_before > current_time:
        send_poll_deadline_notification_10m.apply_async(
            args=[poll_id],
            eta=ten_minutes_before
        )
        print(f"Scheduled 10m deadline notification for poll {poll_id} at {ten_minutes_before}")
    
    # 결과 발표 알림 스케줄링
    send_poll_result_notification.apply_async(
        args=[poll_id],
        eta=deadline
    )
    print(f"Scheduled result notification for poll {poll_id} at {deadline}")

@celery_app.task
def send_poll_start_notification_task(poll_id: str):
    """투표 시작 알림 발송 (백그라운드 작업)"""
    try:
        async def send_notification():
            async with AsyncSessionLocal() as db:
                notification_service = NotificationService(db)
                success = await notification_service.send_poll_start_notification(poll_id)
                if not success:
                    print(f"Failed to send poll start notification for poll {poll_id}")
        
        asyncio.run(send_notification())
        
    except Exception as exc:
        print(f"Poll start notification failed for poll {poll_id}: {exc}")