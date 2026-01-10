"""API routes for notifications."""

import uuid
from typing import Any

from fastapi import APIRouter, Query, status

from app.core.responses import success_response
from app.deps import AdminUserDep, CurrentUserDep, NotificationServiceDep
from app.modules.notifications.schemas import (
    BroadcastHistoryResponse,
    BroadcastLogResponse,
    BroadcastRequest,
    BroadcastResponse,
    NotificationResponse,
    NotificationSettingsResponse,
    NotificationSettingsUpdate,
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


@router.get(
    "/settings",
    response_model=NotificationSettingsResponse,
    summary="Get notification settings",
)
async def get_notification_settings(
    current_user: CurrentUserDep,
    service: NotificationServiceDep,
) -> NotificationSettingsResponse:
    """Get user's notification settings.

    Args:
        current_user: Currently authenticated user
        service: Notification service instance

    Returns:
        NotificationSettingsResponse with current settings
    """
    settings = await service.get_notification_settings(current_user.id)
    return NotificationSettingsResponse(**settings)


@router.put(
    "/settings",
    response_model=NotificationSettingsResponse,
    summary="Update notification settings",
)
async def update_notification_settings(
    settings_data: NotificationSettingsUpdate,
    current_user: CurrentUserDep,
    service: NotificationServiceDep,
) -> NotificationSettingsResponse:
    """Update user's notification settings.

    Args:
        settings_data: Partial update data for notification settings
        current_user: Currently authenticated user
        service: Notification service instance

    Returns:
        NotificationSettingsResponse with updated settings
    """
    settings = await service.update_notification_settings(
        user_id=current_user.id,
        poll_started=settings_data.poll_started,
        poll_reminder=settings_data.poll_reminder,
        poll_ended=settings_data.poll_ended,
        vote_received=settings_data.vote_received,
        circle_invite=settings_data.circle_invite,
    )
    return NotificationSettingsResponse(**settings)


# ==================== Admin Endpoints ====================


@router.post(
    "/admin/broadcast",
    response_model=BroadcastResponse,
    status_code=status.HTTP_201_CREATED,
    summary="[Admin] Broadcast notification to all users",
    tags=["Admin - Notifications"],
)
async def broadcast_notification(
    request: BroadcastRequest,
    admin_user: AdminUserDep,
    service: NotificationServiceDep,
) -> BroadcastResponse:
    """Broadcast a notification to all active users (Admin only).

    Args:
        request: Broadcast request containing title and body
        admin_user: Currently authenticated admin user
        service: Notification service instance

    Returns:
        BroadcastResponse with broadcast ID and counts
    """
    log_id, target_count, sent_count = await service.broadcast_notification(
        admin_id=admin_user.id,
        title=request.title,
        body=request.body,
    )

    return BroadcastResponse(
        id=log_id,
        target_count=target_count,
        sent_count=sent_count,
        message=f"알림이 {target_count}명에게 발송되었습니다 (푸시: {sent_count}건)",
    )


@router.get(
    "/admin/history",
    response_model=BroadcastHistoryResponse,
    summary="[Admin] Get broadcast history",
    tags=["Admin - Notifications"],
)
async def get_broadcast_history(
    admin_user: AdminUserDep,
    service: NotificationServiceDep,
    limit: int = Query(50, ge=1, le=100, description="Max results"),
    offset: int = Query(0, ge=0, description="Skip results"),
) -> BroadcastHistoryResponse:
    """Get broadcast notification history (Admin only).

    Args:
        admin_user: Currently authenticated admin user
        service: Notification service instance
        limit: Maximum number of results
        offset: Number of results to skip

    Returns:
        BroadcastHistoryResponse with list of broadcast logs
    """
    logs, total = await service.get_broadcast_history(limit, offset)

    items = [
        BroadcastLogResponse(
            id=log.id,
            admin_id=log.admin_id,
            title=log.title,
            body=log.body,
            target_count=log.target_count,
            sent_count=log.sent_count,
            created_at=log.created_at,
            admin_email=log.admin.email if log.admin else None,
        )
        for log in logs
    ]

    return BroadcastHistoryResponse(
        items=items,
        total=total,
        limit=limit,
        offset=offset,
    )
