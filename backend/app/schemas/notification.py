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