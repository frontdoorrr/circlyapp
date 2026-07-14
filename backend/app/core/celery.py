"""Celery application configuration."""

from celery import Celery

from app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "circly",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.tasks.notification_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Seoul",
    enable_utc=True,
    task_routes={
        "app.tasks.notification_tasks.send_poll_deadline_notification_1h": {
            "queue": "notifications"
        },
        "app.tasks.notification_tasks.send_poll_deadline_notification_10m": {
            "queue": "notifications"
        },
        "app.tasks.notification_tasks.send_poll_result_notification": {
            "queue": "notifications"
        },
    },
)
