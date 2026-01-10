"""Business logic for notifications module."""

import logging
import uuid
from typing import Any

from app.core.enums import NotificationType
from app.core.exceptions import AuthorizationError, NotFoundException
from app.modules.auth.repository import UserRepository
from app.modules.circles.models import Circle
from app.modules.notifications.repository import NotificationRepository
from app.modules.notifications.schemas import NotificationCreate, NotificationResponse
from app.modules.polls.models import Poll
from app.services.expo_push import ExpoPushClient, ExpoPushError, get_expo_push_client

logger = logging.getLogger(__name__)


def _truncate_text(text: str, max_length: int = 30) -> str:
    """Truncate text to max_length with ellipsis if needed."""
    if len(text) <= max_length:
        return text
    return text[: max_length - 3] + "..."


class NotificationService:
    """Service for notification operations."""

    def __init__(
        self,
        notification_repo: NotificationRepository,
        user_repo: UserRepository,
        expo_push_client: ExpoPushClient | None = None,
    ) -> None:
        """Initialize service with repositories."""
        self.notification_repo = notification_repo
        self.user_repo = user_repo
        self.expo_push_client = expo_push_client or get_expo_push_client()

    async def _send_push_to_users(
        self,
        user_ids: list[uuid.UUID],
        title: str,
        body: str,
        data: dict[str, Any],
    ) -> None:
        """Send push notifications to users who have registered tokens.

        Args:
            user_ids: List of user UUIDs to notify
            title: Notification title
            body: Notification body
            data: Custom data payload for deep linking
        """
        if not user_ids:
            return

        # Get users with push tokens
        users = await self.user_repo.find_by_ids(user_ids)
        messages = []

        for user in users:
            if user.push_token and user.push_token.strip():
                messages.append({
                    "token": user.push_token,
                    "title": title,
                    "body": body,
                    "data": data,
                })

        if not messages:
            logger.debug("No users with push tokens to notify")
            return

        try:
            results = await self.expo_push_client.send_batch_push_notifications(messages)
            success_count = sum(1 for r in results if r.get("status") == "ok")
            logger.info(
                "Push notifications sent: %d/%d succeeded",
                success_count,
                len(messages),
            )
        except ExpoPushError as e:
            logger.error("Failed to send push notifications: %s", e)

    async def get_notifications(
        self,
        user_id: uuid.UUID,
        limit: int | None = None,
        offset: int | None = None,
    ) -> list[NotificationResponse]:
        """Get notifications for a user with pagination.

        Args:
            user_id: User UUID
            limit: Maximum number of results (optional)
            offset: Number of results to skip (optional)

        Returns:
            List of NotificationResponse
        """
        notifications = await self.notification_repo.find_by_user_id(user_id, limit, offset)
        return [NotificationResponse.model_validate(n) for n in notifications]

    async def get_unread_count(self, user_id: uuid.UUID) -> int:
        """Get count of unread notifications for a user.

        Args:
            user_id: User UUID

        Returns:
            Number of unread notifications
        """
        return await self.notification_repo.count_unread(user_id)

    async def mark_as_read(self, notification_id: uuid.UUID, user_id: uuid.UUID) -> None:
        """Mark a notification as read.

        Args:
            notification_id: Notification UUID
            user_id: User UUID (for authorization)

        Raises:
            NotFoundException: If notification not found
            AuthorizationError: If notification doesn't belong to user
        """
        notification = await self.notification_repo.find_by_id(notification_id)
        if notification is None:
            raise NotFoundException(message="알림을 찾을 수 없습니다", code="NOTIFICATION_NOT_FOUND")

        if notification.user_id != user_id:
            raise AuthorizationError(message="해당 알림에 대한 접근 권한이 없습니다")

        await self.notification_repo.mark_as_read(notification_id)

    async def mark_all_as_read(self, user_id: uuid.UUID) -> None:
        """Mark all notifications as read for a user.

        Args:
            user_id: User UUID
        """
        await self.notification_repo.mark_all_as_read(user_id)

    async def send_poll_started(self, poll: Poll, circle_member_ids: list[uuid.UUID]) -> None:
        """Send poll started notifications to circle members.

        Args:
            poll: Poll instance that was started
            circle_member_ids: List of circle member UUIDs (excluding poll creator)
        """
        # Filter out the poll creator from recipients
        recipient_ids = [uid for uid in circle_member_ids if uid != poll.creator_id]

        if not recipient_ids:
            return

        # Create notifications for all members
        question_preview = _truncate_text(poll.question_text, 30)
        title = "🗳️ 새로운 투표가 시작됐어요!"
        body = f'"{question_preview}" 지금 바로 참여해보세요! 👆'
        data = {
            "type": "poll_start",
            "poll_id": str(poll.id),
            "circle_id": str(poll.circle_id),
            "action_url": f"circly://poll-participation/{poll.id}",
        }

        notifications = [
            NotificationCreate(
                user_id=member_id,
                type=NotificationType.POLL_STARTED,
                title=title,
                body=body,
                data=data,
            )
            for member_id in recipient_ids
        ]

        await self.notification_repo.create_bulk(notifications)

        # Send push notifications
        await self._send_push_to_users(recipient_ids, title, body, data)

    async def send_vote_received(self, voted_for_id: uuid.UUID, poll: Poll) -> None:
        """Send vote received notification (anonymous).

        Args:
            voted_for_id: UUID of user who received the vote
            poll: Poll instance
        """
        question_preview = _truncate_text(poll.question_text, 30)
        title = "🎊 누군가 당신을 선택했어요!"
        body = f'"{question_preview}" 투표에서 선택받았어요'
        data = {
            "type": "vote_received",
            "poll_id": str(poll.id),
            "circle_id": str(poll.circle_id),
            "action_url": f"circly://results/{poll.id}",
        }

        notification = NotificationCreate(
            user_id=voted_for_id,
            type=NotificationType.VOTE_RECEIVED,
            title=title,
            body=body,
            data=data,
        )

        await self.notification_repo.create(notification)

        # Send push notification
        await self._send_push_to_users([voted_for_id], title, body, data)

    async def send_poll_ended(self, poll: Poll, circle_member_ids: list[uuid.UUID]) -> None:
        """Send poll ended notifications to circle members.

        Args:
            poll: Poll instance that ended
            circle_member_ids: List of circle member UUIDs
        """
        if not circle_member_ids:
            return

        question_preview = _truncate_text(poll.question_text, 30)
        title = "🎉 투표 결과가 나왔어요!"
        body = f'"{question_preview}" 결과 확인하러 가기 ✨'
        data = {
            "type": "poll_result",
            "poll_id": str(poll.id),
            "circle_id": str(poll.circle_id),
            "action_url": f"circly://results/{poll.id}",
        }

        notifications = [
            NotificationCreate(
                user_id=member_id,
                type=NotificationType.POLL_ENDED,
                title=title,
                body=body,
                data=data,
            )
            for member_id in circle_member_ids
        ]

        await self.notification_repo.create_bulk(notifications)

        # Send push notifications
        await self._send_push_to_users(circle_member_ids, title, body, data)

    async def send_poll_reminder(
        self,
        poll: Poll,
        non_voter_ids: list[uuid.UUID],
        minutes_left: int = 60,
    ) -> None:
        """Send poll reminder notifications to non-voters.

        Args:
            poll: Poll instance
            non_voter_ids: List of member UUIDs who haven't voted yet
            minutes_left: Minutes until poll ends (for message customization)
        """
        if not non_voter_ids:
            return

        # Customize message based on urgency
        if minutes_left <= 10:
            title = "🚨 마지막 기회!"
            question_preview = _truncate_text(poll.question_text, 20)
            body = f'"{question_preview}" 투표 마감 {minutes_left}분 전 😱'
        else:
            title = "⏰ 투표 마감이 다가와요!"
            question_preview = _truncate_text(poll.question_text, 30)
            body = f'"{question_preview}" 친구들이 기다리고 있어요 🔥'

        data = {
            "type": "poll_deadline",
            "poll_id": str(poll.id),
            "circle_id": str(poll.circle_id),
            "action_url": f"circly://poll-participation/{poll.id}",
        }

        notifications = [
            NotificationCreate(
                user_id=member_id,
                type=NotificationType.POLL_REMINDER,
                title=title,
                body=body,
                data=data,
            )
            for member_id in non_voter_ids
        ]

        await self.notification_repo.create_bulk(notifications)

        # Send push notifications
        await self._send_push_to_users(non_voter_ids, title, body, data)

    async def send_circle_invite(self, user_id: uuid.UUID, circle: Circle) -> None:
        """Send circle invite notification.

        Args:
            user_id: UUID of user being invited
            circle: Circle instance
        """
        title = "🎈 서클 초대가 왔어요!"
        body = f'"{circle.name}" 서클에 초대받았어요'
        data = {
            "type": "circle_invite",
            "circle_id": str(circle.id),
            "circle_name": circle.name,
            "action_url": f"circly://circle/{circle.id}",
        }

        notification = NotificationCreate(
            user_id=user_id,
            type=NotificationType.CIRCLE_INVITE,
            title=title,
            body=body,
            data=data,
        )

        await self.notification_repo.create(notification)

        # Send push notification
        await self._send_push_to_users([user_id], title, body, data)

    async def register_push_token(self, user_id: uuid.UUID, token: str) -> None:
        """Register or update user's push notification token.

        Args:
            user_id: User UUID
            token: Expo push notification token

        Raises:
            NotFoundException: If user not found
        """
        success = await self.user_repo.update_push_token(user_id, token)
        if not success:
            raise NotFoundException(message="사용자를 찾을 수 없습니다", code="USER_NOT_FOUND")

    async def unregister_push_token(self, user_id: uuid.UUID) -> None:
        """Unregister user's push notification token (set to empty string).

        Args:
            user_id: User UUID

        Raises:
            NotFoundException: If user not found
        """
        success = await self.user_repo.update_push_token(user_id, "")
        if not success:
            raise NotFoundException(message="사용자를 찾을 수 없습니다", code="USER_NOT_FOUND")

    async def get_notification_settings(
        self, user_id: uuid.UUID
    ) -> dict[str, bool]:
        """Get user's notification settings.

        Args:
            user_id: User UUID

        Returns:
            Dictionary of notification settings

        Raises:
            NotFoundException: If user not found
        """
        user = await self.user_repo.find_by_id(user_id)
        if user is None:
            raise NotFoundException(message="사용자를 찾을 수 없습니다", code="USER_NOT_FOUND")

        return {
            "poll_started": user.notify_poll_started,
            "poll_reminder": user.notify_poll_reminder,
            "poll_ended": user.notify_poll_ended,
            "vote_received": user.notify_vote_received,
            "circle_invite": user.notify_circle_invite,
        }

    async def update_notification_settings(
        self,
        user_id: uuid.UUID,
        poll_started: bool | None = None,
        poll_reminder: bool | None = None,
        poll_ended: bool | None = None,
        vote_received: bool | None = None,
        circle_invite: bool | None = None,
    ) -> dict[str, bool]:
        """Update user's notification settings.

        Args:
            user_id: User UUID
            poll_started: Enable poll started notifications
            poll_reminder: Enable poll reminder notifications
            poll_ended: Enable poll ended notifications
            vote_received: Enable vote received notifications
            circle_invite: Enable circle invite notifications

        Returns:
            Updated notification settings

        Raises:
            NotFoundException: If user not found
        """
        user = await self.user_repo.update_notification_settings(
            user_id=user_id,
            poll_started=poll_started,
            poll_reminder=poll_reminder,
            poll_ended=poll_ended,
            vote_received=vote_received,
            circle_invite=circle_invite,
        )
        if user is None:
            raise NotFoundException(message="사용자를 찾을 수 없습니다", code="USER_NOT_FOUND")

        return {
            "poll_started": user.notify_poll_started,
            "poll_reminder": user.notify_poll_reminder,
            "poll_ended": user.notify_poll_ended,
            "vote_received": user.notify_vote_received,
            "circle_invite": user.notify_circle_invite,
        }

    # ==================== Admin Methods ====================

    async def broadcast_notification(
        self,
        admin_id: uuid.UUID,
        title: str,
        body: str,
    ) -> tuple[uuid.UUID, int, int]:
        """Broadcast notification to all active users.

        Args:
            admin_id: Admin user UUID who is sending
            title: Notification title
            body: Notification body

        Returns:
            Tuple of (broadcast_log_id, target_count, sent_count)
        """
        # Get all active users
        all_users = await self.user_repo.find_all_active()
        target_count = len(all_users)

        if target_count == 0:
            # Create log even if no users
            log_id = await self.notification_repo.create_broadcast_log(
                admin_id=admin_id,
                title=title,
                body=body,
                target_count=0,
                sent_count=0,
            )
            return log_id, 0, 0

        # Create notifications for all users
        user_ids = [user.id for user in all_users]
        data = {
            "type": "broadcast",
            "action_url": "circly://notifications",
        }

        notifications = [
            NotificationCreate(
                user_id=user_id,
                type=NotificationType.POLL_STARTED,  # Reuse type for broadcast
                title=title,
                body=body,
                data=data,
            )
            for user_id in user_ids
        ]

        await self.notification_repo.create_bulk(notifications)

        # Send push notifications
        sent_count = 0
        messages = []
        for user in all_users:
            if user.push_token and user.push_token.strip():
                messages.append({
                    "token": user.push_token,
                    "title": title,
                    "body": body,
                    "data": data,
                })

        if messages:
            try:
                results = await self.expo_push_client.send_batch_push_notifications(messages)
                sent_count = sum(1 for r in results if r.get("status") == "ok")
            except ExpoPushError as e:
                logger.error("Failed to send broadcast push notifications: %s", e)

        # Create broadcast log
        log_id = await self.notification_repo.create_broadcast_log(
            admin_id=admin_id,
            title=title,
            body=body,
            target_count=target_count,
            sent_count=sent_count,
        )

        logger.info(
            "Broadcast sent by admin %s: %d/%d users notified",
            admin_id,
            sent_count,
            target_count,
        )

        return log_id, target_count, sent_count

    async def get_broadcast_history(
        self,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[Any], int]:
        """Get broadcast notification history.

        Args:
            limit: Maximum number of results
            offset: Number of results to skip

        Returns:
            Tuple of (broadcast_logs, total_count)
        """
        return await self.notification_repo.get_broadcast_history(limit, offset)
