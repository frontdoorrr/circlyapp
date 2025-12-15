"""Tests for Notification Service."""

import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import MemberRole, NotificationType, PollStatus, TemplateCategory
from app.core.security import generate_invite_code
from app.modules.auth.repository import UserRepository
from app.modules.auth.schemas import UserCreate
from app.modules.circles.models import Circle
from app.modules.circles.repository import CircleRepository, MembershipRepository
from app.modules.circles.schemas import CircleCreate
from app.modules.notifications.models import Notification
from app.modules.notifications.repository import NotificationRepository
from app.modules.notifications.service import NotificationService
from app.modules.polls.models import Poll, PollTemplate
from app.modules.polls.repository import PollRepository


class TestNotificationService:
    """Tests for NotificationService."""

    @pytest.mark.asyncio
    async def test_get_notifications(self, db_session: AsyncSession) -> None:
        """Test getting user notifications."""
        # Setup: Create user and notifications
        user_repo = UserRepository(db_session)
        user = await user_repo.create(
            UserCreate(email="user@example.com", password="password123")
        )

        # Create notifications
        notification1 = Notification(
            user_id=user.id,
            type=NotificationType.POLL_STARTED,
            title="Poll 1",
            body="Poll 1 started",
            is_read=False,
        )
        notification2 = Notification(
            user_id=user.id,
            type=NotificationType.VOTE_RECEIVED,
            title="Vote Received",
            body="You received a vote",
            is_read=True,
        )
        db_session.add_all([notification1, notification2])
        await db_session.commit()

        # Initialize service
        notification_repo = NotificationRepository(db_session)
        service = NotificationService(notification_repo)

        # Test
        notifications = await service.get_notifications(user.id)

        assert len(notifications) == 2
        assert all(n.user_id == user.id for n in notifications)

    @pytest.mark.asyncio
    async def test_get_notifications_with_pagination(self, db_session: AsyncSession) -> None:
        """Test getting notifications with pagination."""
        # Setup
        user_repo = UserRepository(db_session)
        user = await user_repo.create(
            UserCreate(email="user@example.com", password="password123")
        )

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

        # Initialize service
        notification_repo = NotificationRepository(db_session)
        service = NotificationService(notification_repo)

        # Test
        notifications = await service.get_notifications(user.id, limit=2, offset=1)

        assert len(notifications) == 2

    @pytest.mark.asyncio
    async def test_get_unread_count(self, db_session: AsyncSession) -> None:
        """Test getting unread notification count."""
        # Setup
        user_repo = UserRepository(db_session)
        user = await user_repo.create(
            UserCreate(email="user@example.com", password="password123")
        )

        # Create unread and read notifications
        unread1 = Notification(
            user_id=user.id,
            type=NotificationType.POLL_STARTED,
            title="Unread 1",
            body="Body 1",
            is_read=False,
        )
        unread2 = Notification(
            user_id=user.id,
            type=NotificationType.POLL_STARTED,
            title="Unread 2",
            body="Body 2",
            is_read=False,
        )
        read = Notification(
            user_id=user.id,
            type=NotificationType.VOTE_RECEIVED,
            title="Read",
            body="Read body",
            is_read=True,
        )
        db_session.add_all([unread1, unread2, read])
        await db_session.commit()

        # Initialize service
        notification_repo = NotificationRepository(db_session)
        service = NotificationService(notification_repo)

        # Test
        count = await service.get_unread_count(user.id)

        assert count == 2

    @pytest.mark.asyncio
    async def test_mark_as_read(self, db_session: AsyncSession) -> None:
        """Test marking notification as read."""
        # Setup
        user_repo = UserRepository(db_session)
        user = await user_repo.create(
            UserCreate(email="user@example.com", password="password123")
        )

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

        # Initialize service
        notification_repo = NotificationRepository(db_session)
        service = NotificationService(notification_repo)

        # Test
        await service.mark_as_read(notification.id, user.id)

        await db_session.refresh(notification)
        assert notification.is_read is True

    @pytest.mark.asyncio
    async def test_mark_all_as_read(self, db_session: AsyncSession) -> None:
        """Test marking all notifications as read."""
        # Setup
        user_repo = UserRepository(db_session)
        user = await user_repo.create(
            UserCreate(email="user@example.com", password="password123")
        )

        # Create unread notifications
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

        # Initialize service
        notification_repo = NotificationRepository(db_session)
        service = NotificationService(notification_repo)

        # Test
        await service.mark_all_as_read(user.id)

        # Verify
        notifications = await notification_repo.find_by_user_id(user.id)
        assert all(n.is_read is True for n in notifications)

    @pytest.mark.asyncio
    async def test_send_poll_started(self, db_session: AsyncSession) -> None:
        """Test sending poll started notifications to circle members."""
        # Setup: Create circle with members
        user_repo = UserRepository(db_session)
        creator = await user_repo.create(
            UserCreate(email="creator@example.com", password="password123")
        )
        member1 = await user_repo.create(
            UserCreate(email="member1@example.com", password="password123")
        )
        member2 = await user_repo.create(
            UserCreate(email="member2@example.com", password="password123")
        )

        circle_repo = CircleRepository(db_session)
        circle = await circle_repo.create(
            CircleCreate(name="Test Circle"), creator.id, generate_invite_code()
        )

        membership_repo = MembershipRepository(db_session)
        await membership_repo.create(
            circle_id=circle.id,
            user_id=member1.id,
            role=MemberRole.MEMBER,
            nickname="Member 1",
        )
        await membership_repo.create(
            circle_id=circle.id,
            user_id=member2.id,
            role=MemberRole.MEMBER,
            nickname="Member 2",
        )

        # Create poll
        poll = Poll(
            circle_id=circle.id,
            creator_id=creator.id,
            question_text="Who is the funniest?",
            status=PollStatus.ACTIVE,
            ends_at=datetime.now(UTC) + timedelta(hours=3),
        )
        db_session.add(poll)
        await db_session.commit()
        await db_session.refresh(poll)

        # Initialize service
        notification_repo = NotificationRepository(db_session)
        service = NotificationService(notification_repo)

        # Test: Send notifications to all members except creator
        circle_member_ids = [member1.id, member2.id]
        await service.send_poll_started(poll, circle_member_ids)

        # Verify notifications created for both members
        member1_notifications = await notification_repo.find_by_user_id(member1.id)
        member2_notifications = await notification_repo.find_by_user_id(member2.id)
        creator_notifications = await notification_repo.find_by_user_id(creator.id)

        assert len(member1_notifications) == 1
        assert len(member2_notifications) == 1
        assert len(creator_notifications) == 0  # Creator should not receive notification

        # Verify notification content
        assert member1_notifications[0].type == NotificationType.POLL_STARTED
        assert member1_notifications[0].data["poll_id"] == str(poll.id)
        assert member1_notifications[0].data["circle_id"] == str(circle.id)

    @pytest.mark.asyncio
    async def test_send_vote_received(self, db_session: AsyncSession) -> None:
        """Test sending vote received notification."""
        # Setup: Create user, circle, and poll
        user_repo = UserRepository(db_session)
        creator = await user_repo.create(
            UserCreate(email="creator@example.com", password="password123")
        )
        voted_for = await user_repo.create(
            UserCreate(email="voted@example.com", password="password123")
        )

        circle_repo = CircleRepository(db_session)
        circle = await circle_repo.create(
            CircleCreate(name="Test Circle"), creator.id, generate_invite_code()
        )

        poll = Poll(
            circle_id=circle.id,
            creator_id=creator.id,
            question_text="Who is the best?",
            status=PollStatus.ACTIVE,
            ends_at=datetime.now(UTC) + timedelta(hours=3),
        )
        db_session.add(poll)
        await db_session.commit()
        await db_session.refresh(poll)

        # Initialize service
        notification_repo = NotificationRepository(db_session)
        service = NotificationService(notification_repo)

        # Test: Send vote received notification
        await service.send_vote_received(voted_for.id, poll)

        # Verify notification created
        notifications = await notification_repo.find_by_user_id(voted_for.id)

        assert len(notifications) == 1
        assert notifications[0].type == NotificationType.VOTE_RECEIVED
        assert notifications[0].data["poll_id"] == str(poll.id)
        assert notifications[0].data["circle_id"] == str(circle.id)
        assert notifications[0].is_read is False

    @pytest.mark.asyncio
    async def test_send_poll_ended(self, db_session: AsyncSession) -> None:
        """Test sending poll ended notifications."""
        # Setup: Create circle with members
        user_repo = UserRepository(db_session)
        creator = await user_repo.create(
            UserCreate(email="creator@example.com", password="password123")
        )
        member = await user_repo.create(
            UserCreate(email="member@example.com", password="password123")
        )

        circle_repo = CircleRepository(db_session)
        circle = await circle_repo.create(
            CircleCreate(name="Test Circle"), creator.id, generate_invite_code()
        )

        poll = Poll(
            circle_id=circle.id,
            creator_id=creator.id,
            question_text="Who is the funniest?",
            status=PollStatus.COMPLETED,
            ends_at=datetime.now(UTC) - timedelta(hours=1),
        )
        db_session.add(poll)
        await db_session.commit()
        await db_session.refresh(poll)

        # Initialize service
        notification_repo = NotificationRepository(db_session)
        service = NotificationService(notification_repo)

        # Test
        circle_member_ids = [creator.id, member.id]
        await service.send_poll_ended(poll, circle_member_ids)

        # Verify
        creator_notifications = await notification_repo.find_by_user_id(creator.id)
        member_notifications = await notification_repo.find_by_user_id(member.id)

        assert len(creator_notifications) == 1
        assert len(member_notifications) == 1
        assert creator_notifications[0].type == NotificationType.POLL_ENDED

    @pytest.mark.asyncio
    async def test_send_circle_invite(self, db_session: AsyncSession) -> None:
        """Test sending circle invite notification."""
        # Setup
        user_repo = UserRepository(db_session)
        owner = await user_repo.create(
            UserCreate(email="owner@example.com", password="password123")
        )
        invited_user = await user_repo.create(
            UserCreate(email="invited@example.com", password="password123")
        )

        circle_repo = CircleRepository(db_session)
        circle = await circle_repo.create(
            CircleCreate(name="Test Circle"), owner.id, generate_invite_code()
        )

        # Initialize service
        notification_repo = NotificationRepository(db_session)
        service = NotificationService(notification_repo)

        # Test
        await service.send_circle_invite(invited_user.id, circle)

        # Verify
        notifications = await notification_repo.find_by_user_id(invited_user.id)

        assert len(notifications) == 1
        assert notifications[0].type == NotificationType.CIRCLE_INVITE
        assert notifications[0].data["circle_id"] == str(circle.id)
        assert circle.name in notifications[0].body
