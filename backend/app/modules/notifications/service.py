"""Business logic for notifications module."""

import uuid

from app.core.enums import NotificationType
from app.core.exceptions import AuthorizationError, NotFoundException
from app.modules.auth.repository import UserRepository
from app.modules.circles.models import Circle
from app.modules.notifications.repository import NotificationRepository
from app.modules.notifications.schemas import NotificationCreate, NotificationResponse
from app.modules.polls.models import Poll


class NotificationService:
    """Service for notification operations."""

    def __init__(
        self,
        notification_repo: NotificationRepository,
        user_repo: UserRepository,
    ) -> None:
        """Initialize service with repositories."""
        self.notification_repo = notification_repo
        self.user_repo = user_repo

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
        notifications = [
            NotificationCreate(
                user_id=member_id,
                type=NotificationType.POLL_STARTED,
                title="New Poll Started! 🎉",
                body=f"A new poll has started: {poll.question_text}",
                data={
                    "poll_id": str(poll.id),
                    "circle_id": str(poll.circle_id),
                },
            )
            for member_id in recipient_ids
        ]

        await self.notification_repo.create_bulk(notifications)

    async def send_vote_received(self, voted_for_id: uuid.UUID, poll: Poll) -> None:
        """Send vote received notification (anonymous).

        Args:
            voted_for_id: UUID of user who received the vote
            poll: Poll instance
        """
        notification = NotificationCreate(
            user_id=voted_for_id,
            type=NotificationType.VOTE_RECEIVED,
            title="You received a vote! 🎊",
            body=f"Someone voted for you in: {poll.question_text}",
            data={
                "poll_id": str(poll.id),
                "circle_id": str(poll.circle_id),
            },
        )

        await self.notification_repo.create(notification)

    async def send_poll_ended(self, poll: Poll, circle_member_ids: list[uuid.UUID]) -> None:
        """Send poll ended notifications to circle members.

        Args:
            poll: Poll instance that ended
            circle_member_ids: List of circle member UUIDs
        """
        if not circle_member_ids:
            return

        notifications = [
            NotificationCreate(
                user_id=member_id,
                type=NotificationType.POLL_ENDED,
                title="Poll Results Are In! 📊",
                body=f"The poll has ended: {poll.question_text}",
                data={
                    "poll_id": str(poll.id),
                    "circle_id": str(poll.circle_id),
                },
            )
            for member_id in circle_member_ids
        ]

        await self.notification_repo.create_bulk(notifications)

    async def send_poll_reminder(self, poll: Poll, non_voter_ids: list[uuid.UUID]) -> None:
        """Send poll reminder notifications to non-voters.

        Args:
            poll: Poll instance
            non_voter_ids: List of member UUIDs who haven't voted yet
        """
        if not non_voter_ids:
            return

        notifications = [
            NotificationCreate(
                user_id=member_id,
                type=NotificationType.POLL_REMINDER,
                title="Poll Ending Soon! ⏰",
                body=f"Don't forget to vote: {poll.question_text}",
                data={
                    "poll_id": str(poll.id),
                    "circle_id": str(poll.circle_id),
                },
            )
            for member_id in non_voter_ids
        ]

        await self.notification_repo.create_bulk(notifications)

    async def send_circle_invite(self, user_id: uuid.UUID, circle: Circle) -> None:
        """Send circle invite notification.

        Args:
            user_id: UUID of user being invited
            circle: Circle instance
        """
        notification = NotificationCreate(
            user_id=user_id,
            type=NotificationType.CIRCLE_INVITE,
            title="Circle Invitation! 🎈",
            body=f"You've been invited to join {circle.name}",
            data={
                "circle_id": str(circle.id),
                "circle_name": circle.name,
            },
        )

        await self.notification_repo.create(notification)

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
