"""API routes for notifications."""

import uuid
from typing import Any

from fastapi import APIRouter, Query, status

from app.core.responses import success_response
from app.deps import CurrentUserDep, NotificationServiceDep
from app.modules.notifications.schemas import (
    NotificationResponse,
    PushTokenRequest,
    UnreadCountResponse,
)

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get(
    "",
    response_model=list[NotificationResponse],
    summary="Get user notifications",
)
async def get_notifications(
    current_user: CurrentUserDep,
    service: NotificationServiceDep,
    limit: int | None = Query(None, ge=1, le=100, description="Limit results"),
    offset: int | None = Query(None, ge=0, description="Offset for pagination"),
) -> list[NotificationResponse]:
    """Get notifications for the current user with optional pagination."""
    return await service.get_notifications(current_user.id, limit, offset)


@router.get(
    "/unread-count",
    response_model=UnreadCountResponse,
    summary="Get unread notification count",
)
async def get_unread_count(
    current_user: CurrentUserDep,
    service: NotificationServiceDep,
) -> UnreadCountResponse:
    """Get count of unread notifications for the current user."""
    count = await service.get_unread_count(current_user.id)
    return UnreadCountResponse(count=count)


@router.put(
    "/{notification_id}/read",
    status_code=status.HTTP_200_OK,
    summary="Mark notification as read",
)
async def mark_as_read(
    notification_id: uuid.UUID,
    current_user: CurrentUserDep,
    service: NotificationServiceDep,
) -> dict[str, Any]:
    """Mark a notification as read."""
    await service.mark_as_read(notification_id, current_user.id)
    return success_response(data={}, message="Notification marked as read")


@router.put(
    "/read-all",
    status_code=status.HTTP_200_OK,
    summary="Mark all notifications as read",
)
async def mark_all_as_read(
    current_user: CurrentUserDep,
    service: NotificationServiceDep,
) -> dict[str, Any]:
    """Mark all notifications as read for the current user."""
    await service.mark_all_as_read(current_user.id)
    return success_response(data={}, message="All notifications marked as read")


@router.post(
    "/register-token",
    status_code=status.HTTP_200_OK,
    summary="Register push notification token",
)
async def register_push_token(
    token_data: PushTokenRequest,
    current_user: CurrentUserDep,
    service: NotificationServiceDep,
) -> dict[str, Any]:
    """Register or update user's Expo push notification token.

    Args:
        token_data: Push token request containing expo_push_token
        current_user: Currently authenticated user
        service: Notification service instance

    Returns:
        Success response
    """
    await service.register_push_token(current_user.id, token_data.expo_push_token)
    return success_response(data={}, message="Push token registered successfully")


@router.delete(
    "/unregister-token",
    status_code=status.HTTP_200_OK,
    summary="Unregister push notification token",
)
async def unregister_push_token(
    current_user: CurrentUserDep,
    service: NotificationServiceDep,
) -> dict[str, Any]:
    """Unregister user's push notification token (logout).

    Args:
        current_user: Currently authenticated user
        service: Notification service instance

    Returns:
        Success response
    """
    await service.unregister_push_token(current_user.id)
    return success_response(data={}, message="Push token unregistered successfully")
