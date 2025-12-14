"""Tests for Poll Repository."""

import uuid
from datetime import datetime, timedelta

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import PollStatus, TemplateCategory
from app.core.security import generate_invite_code
from app.modules.auth.repository import UserRepository
from app.modules.auth.schemas import UserCreate
from app.modules.circles.repository import CircleRepository
from app.modules.circles.schemas import CircleCreate
from app.modules.polls.models import Poll, PollTemplate
from app.modules.polls.repository import PollRepository


class TestPollRepository:
    """Tests for PollRepository."""

    @pytest.mark.asyncio
    async def test_create_poll(self, db_session: AsyncSession) -> None:
        """Test poll creation."""
        # Setup: Create user, circle, and template
        user_repo = UserRepository(db_session)
        user = await user_repo.create(
            UserCreate(email="creator@example.com", password="password123")
        )

        circle_repo = CircleRepository(db_session)
        circle = await circle_repo.create(
            CircleCreate(name="Test Circle"), user.id, generate_invite_code()
        )

        template = PollTemplate(
            category=TemplateCategory.APPEARANCE,
            question_text="Who has the best smile?",
            emoji="😊",
        )
        db_session.add(template)
        await db_session.commit()
        await db_session.refresh(template)

        # Create poll
        repo = PollRepository(db_session)
        ends_at = datetime.now() + timedelta(hours=3)
        poll = await repo.create(
            circle_id=circle.id,
            template_id=template.id,
            creator_id=user.id,
            question_text="Who has the best smile?",
            ends_at=ends_at,
        )

        assert poll is not None
        assert poll.circle_id == circle.id
        assert poll.template_id == template.id
        assert poll.creator_id == user.id
        assert poll.status == PollStatus.ACTIVE
        assert poll.vote_count == 0

    @pytest.mark.asyncio
    async def test_find_by_id(self, db_session: AsyncSession) -> None:
        """Test finding poll by ID."""
        # Setup
        user_repo = UserRepository(db_session)
        user = await user_repo.create(UserCreate(email="user@example.com", password="password123"))

        circle_repo = CircleRepository(db_session)
        circle = await circle_repo.create(CircleCreate(name="Circle"), user.id, generate_invite_code())

        # Create poll directly
        poll = Poll(
            circle_id=circle.id,
            creator_id=user.id,
            question_text="Test question?",
            status=PollStatus.ACTIVE,
            ends_at=datetime.now() + timedelta(hours=1),
        )
        db_session.add(poll)
        await db_session.commit()
        await db_session.refresh(poll)

        # Test
        repo = PollRepository(db_session)
        found = await repo.find_by_id(poll.id)

        assert found is not None
        assert found.id == poll.id
        assert found.question_text == "Test question?"

    @pytest.mark.asyncio
    async def test_find_by_id_not_found(self, db_session: AsyncSession) -> None:
        """Test finding non-existent poll."""
        repo = PollRepository(db_session)
        found = await repo.find_by_id(uuid.uuid4())

        assert found is None

    @pytest.mark.asyncio
    async def test_find_by_circle_id(self, db_session: AsyncSession) -> None:
        """Test finding polls by circle ID."""
        # Setup
        user_repo = UserRepository(db_session)
        user = await user_repo.create(UserCreate(email="user@example.com", password="password123"))

        circle_repo = CircleRepository(db_session)
        circle = await circle_repo.create(CircleCreate(name="Circle"), user.id, generate_invite_code())

        # Create multiple polls
        poll1 = Poll(
            circle_id=circle.id,
            creator_id=user.id,
            question_text="Question 1?",
            status=PollStatus.ACTIVE,
            ends_at=datetime.now() + timedelta(hours=1),
        )
        poll2 = Poll(
            circle_id=circle.id,
            creator_id=user.id,
            question_text="Question 2?",
            status=PollStatus.COMPLETED,
            ends_at=datetime.now() - timedelta(hours=1),
        )
        db_session.add_all([poll1, poll2])
        await db_session.commit()

        # Test: Find all polls
        repo = PollRepository(db_session)
        polls = await repo.find_by_circle_id(circle.id)

        assert len(polls) == 2

    @pytest.mark.asyncio
    async def test_find_by_circle_id_with_status(self, db_session: AsyncSession) -> None:
        """Test finding polls by circle ID with status filter."""
        # Setup
        user_repo = UserRepository(db_session)
        user = await user_repo.create(UserCreate(email="user@example.com", password="password123"))

        circle_repo = CircleRepository(db_session)
        circle = await circle_repo.create(CircleCreate(name="Circle"), user.id, generate_invite_code())

        # Create polls with different statuses
        poll1 = Poll(
            circle_id=circle.id,
            creator_id=user.id,
            question_text="Active poll?",
            status=PollStatus.ACTIVE,
            ends_at=datetime.now() + timedelta(hours=1),
        )
        poll2 = Poll(
            circle_id=circle.id,
            creator_id=user.id,
            question_text="Completed poll?",
            status=PollStatus.COMPLETED,
            ends_at=datetime.now() - timedelta(hours=1),
        )
        db_session.add_all([poll1, poll2])
        await db_session.commit()

        # Test: Find only active polls
        repo = PollRepository(db_session)
        active_polls = await repo.find_by_circle_id(circle.id, status=PollStatus.ACTIVE)

        assert len(active_polls) == 1
        assert active_polls[0].status == PollStatus.ACTIVE

    @pytest.mark.asyncio
    async def test_find_active_by_circle_id(self, db_session: AsyncSession) -> None:
        """Test finding active polls by circle ID."""
        # Setup
        user_repo = UserRepository(db_session)
        user = await user_repo.create(UserCreate(email="user@example.com", password="password123"))

        circle_repo = CircleRepository(db_session)
        circle = await circle_repo.create(CircleCreate(name="Circle"), user.id, generate_invite_code())

        # Create polls
        poll1 = Poll(
            circle_id=circle.id,
            creator_id=user.id,
            question_text="Active 1?",
            status=PollStatus.ACTIVE,
            ends_at=datetime.now() + timedelta(hours=1),
        )
        poll2 = Poll(
            circle_id=circle.id,
            creator_id=user.id,
            question_text="Completed?",
            status=PollStatus.COMPLETED,
            ends_at=datetime.now() - timedelta(hours=1),
        )
        db_session.add_all([poll1, poll2])
        await db_session.commit()

        # Test
        repo = PollRepository(db_session)
        active_polls = await repo.find_active_by_circle_id(circle.id)

        assert len(active_polls) == 1
        assert active_polls[0].status == PollStatus.ACTIVE

    @pytest.mark.asyncio
    async def test_update_status(self, db_session: AsyncSession) -> None:
        """Test updating poll status."""
        # Setup
        user_repo = UserRepository(db_session)
        user = await user_repo.create(UserCreate(email="user@example.com", password="password123"))

        circle_repo = CircleRepository(db_session)
        circle = await circle_repo.create(CircleCreate(name="Circle"), user.id, generate_invite_code())

        poll = Poll(
            circle_id=circle.id,
            creator_id=user.id,
            question_text="Question?",
            status=PollStatus.ACTIVE,
            ends_at=datetime.now() + timedelta(hours=1),
        )
        db_session.add(poll)
        await db_session.commit()
        await db_session.refresh(poll)

        # Test
        repo = PollRepository(db_session)
        await repo.update_status(poll.id, PollStatus.COMPLETED)

        await db_session.refresh(poll)
        assert poll.status == PollStatus.COMPLETED

    @pytest.mark.asyncio
    async def test_increment_vote_count(self, db_session: AsyncSession) -> None:
        """Test incrementing poll vote count."""
        # Setup
        user_repo = UserRepository(db_session)
        user = await user_repo.create(UserCreate(email="user@example.com", password="password123"))

        circle_repo = CircleRepository(db_session)
        circle = await circle_repo.create(CircleCreate(name="Circle"), user.id, generate_invite_code())

        poll = Poll(
            circle_id=circle.id,
            creator_id=user.id,
            question_text="Question?",
            status=PollStatus.ACTIVE,
            ends_at=datetime.now() + timedelta(hours=1),
            vote_count=5,
        )
        db_session.add(poll)
        await db_session.commit()
        await db_session.refresh(poll)

        # Test
        repo = PollRepository(db_session)
        await repo.increment_vote_count(poll.id)

        await db_session.refresh(poll)
        assert poll.vote_count == 6

    @pytest.mark.asyncio
    async def test_find_ending_soon(self, db_session: AsyncSession) -> None:
        """Test finding polls ending soon."""
        # Setup
        user_repo = UserRepository(db_session)
        user = await user_repo.create(UserCreate(email="user@example.com", password="password123"))

        circle_repo = CircleRepository(db_session)
        circle = await circle_repo.create(CircleCreate(name="Circle"), user.id, generate_invite_code())

        now = datetime.now()
        # Poll ending in 5 minutes
        poll1 = Poll(
            circle_id=circle.id,
            creator_id=user.id,
            question_text="Ending soon?",
            status=PollStatus.ACTIVE,
            ends_at=now + timedelta(minutes=5),
        )
        # Poll ending in 30 minutes
        poll2 = Poll(
            circle_id=circle.id,
            creator_id=user.id,
            question_text="Ending later?",
            status=PollStatus.ACTIVE,
            ends_at=now + timedelta(minutes=30),
        )
        # Poll already ended
        poll3 = Poll(
            circle_id=circle.id,
            creator_id=user.id,
            question_text="Already ended?",
            status=PollStatus.ACTIVE,
            ends_at=now - timedelta(minutes=5),
        )
        db_session.add_all([poll1, poll2, poll3])
        await db_session.commit()

        # Test: Find polls ending within 15 minutes
        repo = PollRepository(db_session)
        ending_soon = await repo.find_ending_soon(minutes=15)

        # Should find poll1 (5 min) and poll3 (already ended)
        assert len(ending_soon) >= 1
        assert any(p.question_text == "Ending soon?" for p in ending_soon)
