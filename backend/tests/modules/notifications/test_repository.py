"""Tests for Notification Repository."""

import uuid

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import NotificationType
from app.modules.auth.repository import UserRepository
from app.modules.auth.schemas import UserCreate
from app.modules.notifications.models import Notification
from app.modules.notifications.repository import NotificationRepository
from app.modules.notifications.schemas import NotificationCreate


class TestNotificationRepository:
    """Tests for NotificationRepository."""

    @pytest.mark.asyncio
    async def test_create_notification(self, db_session: AsyncSession) -> None:
        """Test notification creation."""
        # Setup: Create user
        user_repo = UserRepository(db_session)
        user = await user_repo.create(UserCreate(email="user@example.com", password="password123"))

        # Create notification
        repo = NotificationRepository(db_session)
        notification_data = NotificationCreate(
            user_id=user.id,
            type=NotificationType.POLL_STARTED,
            title="New Poll Started",
            body="A new poll has been started in your circle",
            data={"poll_id": str(uuid.uuid4()), "circle_id": str(uuid.uuid4())},
        )
        notification = await repo.create(notification_data)

        assert notification is not None
        assert notification.user_id == user.id
        assert notification.type == NotificationType.POLL_STARTED
        assert notification.title == "New Poll Started"
        assert notification.is_read is False
        assert notification.data is not None
        assert "poll_id" in notification.data

    @pytest.mark.asyncio
    async def test_find_by_user_id(self, db_session: AsyncSession) -> None:
        """Test finding notifications by user ID."""
        # Setup: Create user
        user_repo = UserRepository(db_session)
        user = await user_repo.create(UserCreate(email="user@example.com", password="password123"))

        # Create multiple notifications for user
        notification1 = Notification(
            user_id=user.id,
            type=NotificationType.POLL_STARTED,
            title="Poll 1",
            body="First poll notification",
            is_read=False,
        )
        notification2 = Notification(
            user_id=user.id,
            type=NotificationType.VOTE_RECEIVED,
            title="Vote Received",
            body="You received a vote",
            is_read=True,
        )
        notification3 = Notification(
            user_id=user.id,
            type=NotificationType.POLL_ENDED,
            title="Poll Ended",
            body="A poll has ended",
            is_read=False,
        )
        db_session.add_all([notification1, notification2, notification3])
        await db_session.commit()

        # Test: Find all notifications for user
        repo = NotificationRepository(db_session)
        notifications = await repo.find_by_user_id(user.id)

        assert len(notifications) == 3
        assert all(n.user_id == user.id for n in notifications)

    @pytest.mark.asyncio
    async def test_find_by_user_id_with_limit(self, db_session: AsyncSession) -> None:
        """Test finding notifications with limit."""
        # Setup
        user_repo = UserRepository(db_session)
        user = await user_repo.create(UserCreate(email="user@example.com", password="password123"))

        # Create 5 notifications
        for i in range(5):
            notification = Notification(
                user_id=user.id,
                type=NotificationType.POLL_STARTED,
                title=f"Notification {i}",
                body=f"Body {i}",
                is_read=False,
            )
            db_session.add(notification)
        await db_session.commit()

        # Test: Get only 3 notifications
        repo = NotificationRepository(db_session)
        notifications = await repo.find_by_user_id(user.id, limit=3)

        assert len(notifications) == 3

    @pytest.mark.asyncio
    async def test_find_by_user_id_with_offset(self, db_session: AsyncSession) -> None:
        """Test finding notifications with offset."""
        # Setup
        user_repo = UserRepository(db_session)
        user = await user_repo.create(UserCreate(email="user@example.com", password="password123"))

        # Create 5 notifications
        for i in range(5):
            notification = Notification(
                user_id=user.id,
                type=NotificationType.POLL_STARTED,
                title=f"Notification {i}",
                body=f"Body {i}",
                is_read=False,
            )
            db_session.add(notification)
        await db_session.commit()

        # Test: Skip first 2, get next 2
        repo = NotificationRepository(db_session)
        notifications = await repo.find_by_user_id(user.id, limit=2, offset=2)

        assert len(notifications) == 2

    @pytest.mark.asyncio
    async def test_find_unread_by_user_id(self, db_session: AsyncSession) -> None:
        """Test finding unread notifications."""
        # Setup
        user_repo = UserRepository(db_session)
        user = await user_repo.create(UserCreate(email="user@example.com", password="password123"))

        # Create read and unread notifications
        unread_notification = Notification(
            user_id=user.id,
            type=NotificationType.POLL_STARTED,
            title="Unread",
            body="Unread notification",
            is_read=False,
        )
        read_notification = Notification(
            user_id=user.id,
            type=NotificationType.VOTE_RECEIVED,
            title="Read",
            body="Read notification",
            is_read=True,
        )
        db_session.add_all([unread_notification, read_notification])
        await db_session.commit()

        # Test: Get only unread notifications
        repo = NotificationRepository(db_session)
        unread_notifications = await repo.find_unread_by_user_id(user.id)

        assert len(unread_notifications) == 1
        assert unread_notifications[0].is_read is False
        assert unread_notifications[0].title == "Unread"

    @pytest.mark.asyncio
    async def test_mark_as_read(self, db_session: AsyncSession) -> None:
        """Test marking notification as read."""
        # Setup
        user_repo = UserRepository(db_session)
        user = await user_repo.create(UserCreate(email="user@example.com", password="password123"))

        notification = Notification(
            user_id=user.id,
            type=NotificationType.POLL_STARTED,
            title="Test",
            body="Test body",
            is_read=False,
        )
        db_session.add(notification)
        await db_session.commit()
        await db_session.refresh(notification)

        # Test: Mark as read
        repo = NotificationRepository(db_session)
        await repo.mark_as_read(notification.id)

        await db_session.refresh(notification)
        assert notification.is_read is True

    @pytest.mark.asyncio
    async def test_mark_all_as_read(self, db_session: AsyncSession) -> None:
        """Test marking all notifications as read for a user."""
        # Setup
        user_repo = UserRepository(db_session)
        user = await user_repo.create(UserCreate(email="user@example.com", password="password123"))

        # Create multiple unread notifications
        for i in range(3):
            notification = Notification(
                user_id=user.id,
                type=NotificationType.POLL_STARTED,
                title=f"Notification {i}",
                body=f"Body {i}",
                is_read=False,
            )
            db_session.add(notification)
        await db_session.commit()

        # Test: Mark all as read
        repo = NotificationRepository(db_session)
        await repo.mark_all_as_read(user.id)

        # Verify all notifications are read
        notifications = await repo.find_by_user_id(user.id)
        assert all(n.is_read is True for n in notifications)

    @pytest.mark.asyncio
    async def test_count_unread(self, db_session: AsyncSession) -> None:
        """Test counting unread notifications."""
        # Setup
        user_repo = UserRepository(db_session)
        user = await user_repo.create(UserCreate(email="user@example.com", password="password123"))

        # Create 2 unread and 1 read notification
        for i in range(2):
            notification = Notification(
                user_id=user.id,
                type=NotificationType.POLL_STARTED,
                title=f"Unread {i}",
                body=f"Body {i}",
                is_read=False,
            )
            db_session.add(notification)

        read_notification = Notification(
            user_id=user.id,
            type=NotificationType.VOTE_RECEIVED,
            title="Read",
            body="Read body",
            is_read=True,
        )
        db_session.add(read_notification)
        await db_session.commit()

        # Test: Count unread
        repo = NotificationRepository(db_session)
        count = await repo.count_unread(user.id)

        assert count == 2

    @pytest.mark.asyncio
    async def test_create_bulk(self, db_session: AsyncSession) -> None:
        """Test bulk notification creation."""
        # Setup: Create multiple users
        user_repo = UserRepository(db_session)
        user1 = await user_repo.create(
            UserCreate(email="user1@example.com", password="password123")
        )
        user2 = await user_repo.create(
            UserCreate(email="user2@example.com", password="password123")
        )

        # Create bulk notifications
        repo = NotificationRepository(db_session)
        poll_id = str(uuid.uuid4())
        notifications_data = [
            NotificationCreate(
                user_id=user1.id,
                type=NotificationType.POLL_STARTED,
                title="New Poll",
                body="A new poll has started",
                data={"poll_id": poll_id},
            ),
            NotificationCreate(
                user_id=user2.id,
                type=NotificationType.POLL_STARTED,
                title="New Poll",
                body="A new poll has started",
                data={"poll_id": poll_id},
            ),
        ]

        count = await repo.create_bulk(notifications_data)

        assert count == 2

        # Verify notifications were created
        user1_notifications = await repo.find_by_user_id(user1.id)
        user2_notifications = await repo.find_by_user_id(user2.id)

        assert len(user1_notifications) == 1
        assert len(user2_notifications) == 1
