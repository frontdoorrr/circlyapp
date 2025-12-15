"""Pydantic schemas for notifications module."""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.core.enums import NotificationType


class NotificationResponse(BaseModel):
    """Schema for notification response."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    type: NotificationType
    title: str
    body: str
    data: dict[str, Any] | None = None
    is_read: bool
    sent_at: datetime | None = None
    created_at: datetime


class NotificationCreate(BaseModel):
    """Schema for creating a notification."""

    user_id: uuid.UUID
    type: NotificationType
    title: str = Field(..., max_length=100)
    body: str
    data: dict[str, Any] | None = None


class NotificationListResponse(BaseModel):
    """Schema for notification list response with pagination."""

    items: list[NotificationResponse]
    total: int
    has_more: bool


class UnreadCountResponse(BaseModel):
    """Schema for unread notification count response."""

    count: int


class PushPayload(BaseModel):
    """Schema for push notification payload (Expo Push)."""

    to: str  # Expo push token
    title: str
    body: str
    data: dict[str, Any] = Field(default_factory=dict)
    sound: str | None = "default"
    badge: int | None = None


class NotificationSettingsResponse(BaseModel):
    """Schema for notification settings response."""

    poll_started: bool = True
    poll_reminder: bool = True
    poll_ended: bool = True
    vote_received: bool = True
    circle_invite: bool = True


class NotificationSettingsUpdate(BaseModel):
    """Schema for updating notification settings."""

    poll_started: bool | None = None
    poll_reminder: bool | None = None
    poll_ended: bool | None = None
    vote_received: bool | None = None
    circle_invite: bool | None = None
