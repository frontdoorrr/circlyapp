"""Repository for notifications module."""

import uuid

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.notifications.models import Notification
from app.modules.notifications.schemas import NotificationCreate


class NotificationRepository:
    """Repository for Notification model."""

    def __init__(self, session: AsyncSession) -> None:
        """Initialize repository with database session."""
        self.session = session

    async def create(self, notification_data: NotificationCreate) -> Notification:
        """Create a new notification.

        Args:
            notification_data: Notification creation data

        Returns:
            Created Notification instance
        """
        notification = Notification(
            user_id=notification_data.user_id,
            type=notification_data.type,
            title=notification_data.title,
            body=notification_data.body,
            data=notification_data.data,
        )
        self.session.add(notification)
        await self.session.commit()
        await self.session.refresh(notification)
        return notification

    async def create_bulk(self, notifications_data: list[NotificationCreate]) -> int:
        """Create multiple notifications in bulk.

        Args:
            notifications_data: List of notification creation data

        Returns:
            Number of notifications created
        """
        notifications = [
            Notification(
                user_id=n.user_id,
                type=n.type,
                title=n.title,
                body=n.body,
                data=n.data,
            )
            for n in notifications_data
        ]
        self.session.add_all(notifications)
        await self.session.commit()
        return len(notifications)

    async def find_by_user_id(
        self,
        user_id: uuid.UUID,
        limit: int | None = None,
        offset: int | None = None,
    ) -> list[Notification]:
        """Find notifications by user ID with pagination.

        Args:
            user_id: User UUID
            limit: Maximum number of results (optional)
            offset: Number of results to skip (optional)

        Returns:
            List of notifications ordered by created_at desc
        """
        query = (
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
        )

        if limit is not None:
            query = query.limit(limit)
        if offset is not None:
            query = query.offset(offset)

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def find_unread_by_user_id(self, user_id: uuid.UUID) -> list[Notification]:
        """Find unread notifications for a user.

        Args:
            user_id: User UUID

        Returns:
            List of unread notifications ordered by created_at desc
        """
        query = (
            select(Notification)
            .where(
                Notification.user_id == user_id,
                Notification.is_read == False,  # noqa: E712
            )
            .order_by(Notification.created_at.desc())
        )

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def mark_as_read(self, notification_id: uuid.UUID) -> None:
        """Mark a notification as read.

        Args:
            notification_id: Notification UUID
        """
        await self.session.execute(
            update(Notification).where(Notification.id == notification_id).values(is_read=True)
        )
        await self.session.commit()

    async def mark_all_as_read(self, user_id: uuid.UUID) -> None:
        """Mark all notifications as read for a user.

        Args:
            user_id: User UUID
        """
        await self.session.execute(
            update(Notification)
            .where(
                Notification.user_id == user_id,
                Notification.is_read == False,  # noqa: E712
            )
            .values(is_read=True)
        )
        await self.session.commit()

    async def count_unread(self, user_id: uuid.UUID) -> int:
        """Count unread notifications for a user.

        Args:
            user_id: User UUID

        Returns:
            Number of unread notifications
        """
        query = select(func.count()).where(
            Notification.user_id == user_id,
            Notification.is_read == False,  # noqa: E712
        )

        result = await self.session.execute(query)
        count = result.scalar()
        return count or 0
