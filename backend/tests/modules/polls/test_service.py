"""Tests for Poll Service."""

import uuid
from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, call, patch

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import MemberRole, PollStatus, TemplateCategory
from app.core.exceptions import AuthorizationError, BadRequestException
from app.core.security import generate_invite_code, generate_voter_hash
from app.modules.auth.repository import UserRepository
from app.modules.auth.schemas import UserCreate
from app.modules.circles.repository import CircleRepository, MembershipRepository
from app.modules.circles.schemas import CircleCreate
from app.modules.polls.models import Poll, PollTemplate
from app.modules.polls.repository import (
    PollRepository,
    TemplateRepository,
    VoteRepository,
    VoteSessionRepository,
)
from app.modules.polls.schemas import PollCreate, PollDuration
from app.modules.polls.service import PollService


class TestPollService:
    """Tests for PollService."""

    @pytest.mark.asyncio
    async def test_get_templates(self, db_session: AsyncSession) -> None:
        """Test getting all active templates."""
        # Setup: Create templates
        templates = [
            PollTemplate(
                category=TemplateCategory.PERSONALITY,
                question_text="Who is the funniest?",
                emoji="😂",
            ),
            PollTemplate(
                category=TemplateCategory.APPEARANCE,
                question_text="Who has the best style?",
                emoji="👗",
            ),
        ]
        db_session.add_all(templates)
        await db_session.commit()

        # Initialize service
        template_repo = TemplateRepository(db_session)
        service = PollService(
            template_repo=template_repo,
            poll_repo=None,  # type: ignore
            vote_repo=None,  # type: ignore
            membership_repo=None,  # type: ignore
        )

        # Test
        result = await service.get_templates()

        assert len(result) == 2
        assert result[0].category in [TemplateCategory.PERSONALITY, TemplateCategory.APPEARANCE]

    @pytest.mark.asyncio
    async def test_get_templates_by_category(self, db_session: AsyncSession) -> None:
        """Test getting templates filtered by category."""
        # Setup: Create templates of different categories
        templates = [
            PollTemplate(
                category=TemplateCategory.PERSONALITY,
                question_text="Who is the funniest?",
                emoji="😂",
            ),
            PollTemplate(
                category=TemplateCategory.APPEARANCE,
                question_text="Who has the best style?",
                emoji="👗",
            ),
        ]
        db_session.add_all(templates)
        await db_session.commit()

        # Initialize service
        template_repo = TemplateRepository(db_session)
        service = PollService(
            template_repo=template_repo,
            poll_repo=None,  # type: ignore
            vote_repo=None,  # type: ignore
            membership_repo=None,  # type: ignore
        )

        # Test
        result = await service.get_templates(category=TemplateCategory.PERSONALITY)

        assert len(result) == 1
        assert result[0].category == TemplateCategory.PERSONALITY
        assert result[0].question_text == "Who is the funniest?"

    @pytest.mark.asyncio
    async def test_create_poll(self, db_session: AsyncSession) -> None:
        """Test creating a poll."""
        # Setup: Create user, circle, and template
        user_repo = UserRepository(db_session)
        creator = await user_repo.create(
            UserCreate(email="creator@example.com", password="password123")
        )

        circle_repo = CircleRepository(db_session)
        circle = await circle_repo.create(
            CircleCreate(name="Test Circle"), creator.id, generate_invite_code()
        )

        # Add creator as member
        membership_repo = MembershipRepository(db_session)
        await membership_repo.create(circle.id, creator.id, MemberRole.OWNER)

        # Create template
        template = PollTemplate(
            category=TemplateCategory.PERSONALITY,
            question_text="Who is the funniest?",
            emoji="😂",
        )
        db_session.add(template)
        await db_session.commit()
        await db_session.refresh(template)

        # Initialize service
        template_repo = TemplateRepository(db_session)
        poll_repo = PollRepository(db_session)
        vote_repo = VoteRepository(db_session)
        service = PollService(
            template_repo=template_repo,
            poll_repo=poll_repo,
            vote_repo=vote_repo,
            membership_repo=membership_repo,
            user_repo=user_repo,
        )

        # Test
        poll_data = PollCreate(
            template_id=template.id,
            duration=PollDuration.THREE_HOURS,
        )
        with patch(
            "app.tasks.notification_tasks.schedule_poll_deadline_notifications"
        ) as schedule_notifications:
            result = await service.create_poll(
                circle_id=circle.id,
                creator_id=creator.id,
                poll_data=poll_data,
            )

        assert result is not None
        assert result.circle_id == circle.id
        assert result.creator_id == creator.id
        assert result.template_id == template.id
        assert result.question_text == "Who is the funniest?"
        assert result.status == PollStatus.ACTIVE
        assert result.vote_count == 0
        # Verify ends_at is approximately 3 hours from now
        expected_end = datetime.now(UTC) + timedelta(hours=3)
        assert abs((result.ends_at - expected_end).total_seconds()) < 60  # Within 1 minute
        schedule_notifications.assert_called_once_with(
            str(result.id),
            result.ends_at,
        )

    @pytest.mark.asyncio
    async def test_create_poll_template_not_found(self, db_session: AsyncSession) -> None:
        """Test creating a poll with non-existent template."""
        # Setup: Create user and circle
        user_repo = UserRepository(db_session)
        creator = await user_repo.create(
            UserCreate(email="creator@example.com", password="password123")
        )

        circle_repo = CircleRepository(db_session)
        circle = await circle_repo.create(
            CircleCreate(name="Test Circle"), creator.id, generate_invite_code()
        )

        membership_repo = MembershipRepository(db_session)
        await membership_repo.create(circle.id, creator.id, MemberRole.OWNER)

        # Initialize service
        template_repo = TemplateRepository(db_session)
        poll_repo = PollRepository(db_session)
        vote_repo = VoteRepository(db_session)
        service = PollService(
            template_repo=template_repo,
            poll_repo=poll_repo,
            vote_repo=vote_repo,
            membership_repo=membership_repo,
            user_repo=user_repo,
        )

        # Test with non-existent template
        poll_data = PollCreate(
            template_id=uuid.uuid4(),
            duration=PollDuration.ONE_HOUR,
        )

        with pytest.raises(BadRequestException, match="Template not found"):
            await service.create_poll(
                circle_id=circle.id,
                creator_id=creator.id,
                poll_data=poll_data,
            )

    @pytest.mark.asyncio
    async def test_create_poll_not_a_member(self, db_session: AsyncSession) -> None:
        """Test creating a poll when user is not a circle member."""
        # Setup: Create two users and circle
        user_repo = UserRepository(db_session)
        owner = await user_repo.create(
            UserCreate(email="owner@example.com", password="password123")
        )
        non_member = await user_repo.create(
            UserCreate(email="nonmember@example.com", password="password123")
        )

        circle_repo = CircleRepository(db_session)
        circle = await circle_repo.create(
            CircleCreate(name="Test Circle"), owner.id, generate_invite_code()
        )

        membership_repo = MembershipRepository(db_session)
        await membership_repo.create(circle.id, owner.id, MemberRole.OWNER)

        # Create template
        template = PollTemplate(
            category=TemplateCategory.PERSONALITY,
            question_text="Who is the funniest?",
            emoji="😂",
        )
        db_session.add(template)
        await db_session.commit()
        await db_session.refresh(template)

        # Initialize service
        template_repo = TemplateRepository(db_session)
        poll_repo = PollRepository(db_session)
        vote_repo = VoteRepository(db_session)
        service = PollService(
            template_repo=template_repo,
            poll_repo=poll_repo,
            vote_repo=vote_repo,
            membership_repo=membership_repo,
            user_repo=user_repo,
        )

        # Test with non-member trying to create poll
        poll_data = PollCreate(
            template_id=template.id,
            duration=PollDuration.ONE_HOUR,
        )

        with pytest.raises(BadRequestException, match="You are not a member of this circle"):
            await service.create_poll(
                circle_id=circle.id,
                creator_id=non_member.id,
                poll_data=poll_data,
            )

    @pytest.mark.asyncio
    async def test_vote_success(self, db_session: AsyncSession) -> None:
        """Test successful voting with anonymous hash."""
        # Setup: Create users, circle, poll
        user_repo = UserRepository(db_session)
        creator = await user_repo.create(
            UserCreate(email="creator@example.com", password="password123")
        )
        voter = await user_repo.create(
            UserCreate(email="voter@example.com", password="password123")
        )
        voted_for = await user_repo.create(
            UserCreate(email="votedfor@example.com", password="password123")
        )

        circle_repo = CircleRepository(db_session)
        circle = await circle_repo.create(
            CircleCreate(name="Test Circle"), creator.id, generate_invite_code()
        )

        membership_repo = MembershipRepository(db_session)
        await membership_repo.create(circle.id, creator.id, MemberRole.OWNER)
        await membership_repo.create(circle.id, voter.id, MemberRole.MEMBER)
        await membership_repo.create(circle.id, voted_for.id, MemberRole.MEMBER)

        # Create poll
        template = PollTemplate(
            category=TemplateCategory.PERSONALITY,
            question_text="Who is the funniest?",
            emoji="😂",
        )
        db_session.add(template)
        await db_session.commit()
        await db_session.refresh(template)

        poll_repo = PollRepository(db_session)
        poll = await poll_repo.create(
            circle_id=circle.id,
            template_id=template.id,
            creator_id=creator.id,
            question_text=template.question_text,
            ends_at=datetime.now(UTC) + timedelta(hours=1),
        )

        # Initialize service
        template_repo = TemplateRepository(db_session)
        vote_repo = VoteRepository(db_session)
        service = PollService(
            template_repo=template_repo,
            poll_repo=poll_repo,
            vote_repo=vote_repo,
            membership_repo=membership_repo,
            user_repo=user_repo,
        )

        # Test vote
        result = await service.vote(
            poll_id=poll.id,
            voter_id=voter.id,
            voted_for_id=voted_for.id,
        )

        assert result is not None
        assert result.success is True
        assert len(result.results) > 0

        # Verify vote was recorded anonymously
        vote_count = await vote_repo.count_by_poll_id(poll.id)
        assert vote_count == 1

        await db_session.refresh(voter)
        assert voter.coin_balance == 1
        assert voter.streak_days == 1
        assert voter.last_reward_at is not None

    @pytest.mark.asyncio
    async def test_vote_rejects_non_member(self) -> None:
        """A user outside the poll's Circle cannot cast a vote."""
        poll_id = uuid.uuid4()
        circle_id = uuid.uuid4()
        voter_id = uuid.uuid4()
        poll_repo = MagicMock()
        poll_repo.find_by_id = AsyncMock(
            return_value=SimpleNamespace(
                id=poll_id,
                circle_id=circle_id,
                status=PollStatus.ACTIVE,
            )
        )
        membership_repo = MagicMock()
        membership_repo.exists = AsyncMock(return_value=False)
        vote_repo = MagicMock()
        vote_repo.create = AsyncMock()

        service = PollService(
            template_repo=MagicMock(),
            poll_repo=poll_repo,
            vote_repo=vote_repo,
            membership_repo=membership_repo,
        )

        with pytest.raises(AuthorizationError, match="Circle member"):
            await service.vote(poll_id, voter_id, uuid.uuid4())

        membership_repo.exists.assert_awaited_once_with(circle_id, voter_id)
        vote_repo.create.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_vote_rejects_target_outside_circle(self) -> None:
        """A vote target must belong to the poll's Circle."""
        poll_id = uuid.uuid4()
        circle_id = uuid.uuid4()
        voter_id = uuid.uuid4()
        target_id = uuid.uuid4()
        poll_repo = MagicMock()
        poll_repo.find_by_id = AsyncMock(
            return_value=SimpleNamespace(
                id=poll_id,
                circle_id=circle_id,
                status=PollStatus.ACTIVE,
            )
        )
        membership_repo = MagicMock()
        membership_repo.exists = AsyncMock(side_effect=[True, False])
        vote_repo = MagicMock()
        vote_repo.create = AsyncMock()

        service = PollService(
            template_repo=MagicMock(),
            poll_repo=poll_repo,
            vote_repo=vote_repo,
            membership_repo=membership_repo,
        )

        with pytest.raises(BadRequestException) as exc_info:
            await service.vote(poll_id, voter_id, target_id)

        assert exc_info.value.code == "INVALID_VOTE_TARGET"
        assert membership_repo.exists.await_args_list == [
            call(circle_id, voter_id),
            call(circle_id, target_id),
        ]
        vote_repo.create.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_vote_success_keeps_same_day_streak_constant(
        self, db_session: AsyncSession
    ) -> None:
        """Multiple votes on the same day add coins but do not double-count streaks."""
        user_repo = UserRepository(db_session)
        creator = await user_repo.create(
            UserCreate(email="streak-creator@example.com", password="password123")
        )
        voter = await user_repo.create(
            UserCreate(email="streak-voter@example.com", password="password123")
        )
        voted_for = await user_repo.create(
            UserCreate(email="streak-target@example.com", password="password123")
        )

        circle_repo = CircleRepository(db_session)
        circle = await circle_repo.create(
            CircleCreate(name="Streak Circle"), creator.id, generate_invite_code()
        )
        membership_repo = MembershipRepository(db_session)
        await membership_repo.create(circle.id, creator.id, MemberRole.OWNER)
        await membership_repo.create(circle.id, voter.id, MemberRole.MEMBER)
        await membership_repo.create(circle.id, voted_for.id, MemberRole.MEMBER)

        template = PollTemplate(
            category=TemplateCategory.PERSONALITY,
            question_text="Who is the funniest?",
            emoji="😂",
        )
        db_session.add(template)
        await db_session.commit()
        await db_session.refresh(template)

        poll_repo = PollRepository(db_session)
        first_poll = await poll_repo.create(
            circle_id=circle.id,
            template_id=template.id,
            creator_id=creator.id,
            question_text=template.question_text,
            ends_at=datetime.now(UTC) + timedelta(hours=1),
        )
        second_poll = await poll_repo.create(
            circle_id=circle.id,
            template_id=template.id,
            creator_id=creator.id,
            question_text="Who is the kindest?",
            ends_at=datetime.now(UTC) + timedelta(hours=1),
        )

        service = PollService(
            template_repo=TemplateRepository(db_session),
            poll_repo=poll_repo,
            vote_repo=VoteRepository(db_session),
            membership_repo=membership_repo,
            user_repo=user_repo,
        )

        await service.vote(first_poll.id, voter.id, voted_for.id)
        await service.vote(second_poll.id, voter.id, voted_for.id)

        await db_session.refresh(voter)
        assert voter.coin_balance == 2
        assert voter.streak_days == 1

    @pytest.mark.asyncio
    async def test_vote_duplicate_prevention(self, db_session: AsyncSession) -> None:
        """Test duplicate vote prevention."""
        # Setup: Create users, circle, poll
        user_repo = UserRepository(db_session)
        creator = await user_repo.create(
            UserCreate(email="creator@example.com", password="password123")
        )
        voter = await user_repo.create(
            UserCreate(email="voter@example.com", password="password123")
        )
        voted_for = await user_repo.create(
            UserCreate(email="votedfor@example.com", password="password123")
        )

        circle_repo = CircleRepository(db_session)
        circle = await circle_repo.create(
            CircleCreate(name="Test Circle"), creator.id, generate_invite_code()
        )

        membership_repo = MembershipRepository(db_session)
        await membership_repo.create(circle.id, creator.id, MemberRole.OWNER)
        await membership_repo.create(circle.id, voter.id, MemberRole.MEMBER)
        await membership_repo.create(circle.id, voted_for.id, MemberRole.MEMBER)

        template = PollTemplate(
            category=TemplateCategory.PERSONALITY,
            question_text="Who is the funniest?",
            emoji="😂",
        )
        db_session.add(template)
        await db_session.commit()
        await db_session.refresh(template)

        poll_repo = PollRepository(db_session)
        poll = await poll_repo.create(
            circle_id=circle.id,
            template_id=template.id,
            creator_id=creator.id,
            question_text=template.question_text,
            ends_at=datetime.now(UTC) + timedelta(hours=1),
        )

        template_repo = TemplateRepository(db_session)
        vote_repo = VoteRepository(db_session)
        service = PollService(
            template_repo=template_repo,
            poll_repo=poll_repo,
            vote_repo=vote_repo,
            membership_repo=membership_repo,
            user_repo=user_repo,
        )

        # First vote succeeds
        await service.vote(
            poll_id=poll.id,
            voter_id=voter.id,
            voted_for_id=voted_for.id,
        )

        # Second vote should fail
        with pytest.raises(BadRequestException, match="already voted"):
            await service.vote(
                poll_id=poll.id,
                voter_id=voter.id,
                voted_for_id=voted_for.id,
            )

    @pytest.mark.asyncio
    async def test_vote_self_vote_prevention(self, db_session: AsyncSession) -> None:
        """Test self-vote prevention."""
        # Setup
        user_repo = UserRepository(db_session)
        creator = await user_repo.create(
            UserCreate(email="creator@example.com", password="password123")
        )
        voter = await user_repo.create(
            UserCreate(email="voter@example.com", password="password123")
        )

        circle_repo = CircleRepository(db_session)
        circle = await circle_repo.create(
            CircleCreate(name="Test Circle"), creator.id, generate_invite_code()
        )

        membership_repo = MembershipRepository(db_session)
        await membership_repo.create(circle.id, creator.id, MemberRole.OWNER)
        await membership_repo.create(circle.id, voter.id, MemberRole.MEMBER)

        template = PollTemplate(
            category=TemplateCategory.PERSONALITY,
            question_text="Who is the funniest?",
            emoji="😂",
        )
        db_session.add(template)
        await db_session.commit()
        await db_session.refresh(template)

        poll_repo = PollRepository(db_session)
        poll = await poll_repo.create(
            circle_id=circle.id,
            template_id=template.id,
            creator_id=creator.id,
            question_text=template.question_text,
            ends_at=datetime.now(UTC) + timedelta(hours=1),
        )

        template_repo = TemplateRepository(db_session)
        vote_repo = VoteRepository(db_session)
        service = PollService(
            template_repo=template_repo,
            poll_repo=poll_repo,
            vote_repo=vote_repo,
            membership_repo=membership_repo,
        )

        # Try to vote for self
        with pytest.raises(BadRequestException, match="cannot vote for yourself"):
            await service.vote(
                poll_id=poll.id,
                voter_id=voter.id,
                voted_for_id=voter.id,  # Same as voter_id
            )

    @pytest.mark.asyncio
    async def test_close_poll(self, db_session: AsyncSession) -> None:
        """Test closing a poll."""
        # Setup
        user_repo = UserRepository(db_session)
        creator = await user_repo.create(
            UserCreate(email="creator@example.com", password="password123")
        )

        circle_repo = CircleRepository(db_session)
        circle = await circle_repo.create(
            CircleCreate(name="Test Circle"), creator.id, generate_invite_code()
        )

        membership_repo = MembershipRepository(db_session)
        await membership_repo.create(circle.id, creator.id, MemberRole.OWNER)

        template = PollTemplate(
            category=TemplateCategory.PERSONALITY,
            question_text="Who is the funniest?",
            emoji="😂",
        )
        db_session.add(template)
        await db_session.commit()
        await db_session.refresh(template)

        poll_repo = PollRepository(db_session)
        poll = await poll_repo.create(
            circle_id=circle.id,
            template_id=template.id,
            creator_id=creator.id,
            question_text=template.question_text,
            ends_at=datetime.now(UTC) + timedelta(hours=1),
        )

        template_repo = TemplateRepository(db_session)
        vote_repo = VoteRepository(db_session)
        service = PollService(
            template_repo=template_repo,
            poll_repo=poll_repo,
            vote_repo=vote_repo,
            membership_repo=membership_repo,
        )

        # Test
        await service.close_poll(poll.id)

        # Verify poll is closed
        updated_poll = await poll_repo.find_by_id(poll.id)
        assert updated_poll is not None
        assert updated_poll.status == PollStatus.COMPLETED

    @pytest.mark.asyncio
    async def test_start_vote_session_builds_server_queue(
        self, db_session: AsyncSession
    ) -> None:
        """Vote session queue excludes voted/expired polls and caps at 12."""
        user_repo = UserRepository(db_session)
        creator = await user_repo.create(
            UserCreate(email="session-creator@example.com", password="password123")
        )
        voter = await user_repo.create(
            UserCreate(email="session-user@example.com", password="password123")
        )

        circle_repo = CircleRepository(db_session)
        circle = await circle_repo.create(
            CircleCreate(name="Session Circle"), creator.id, generate_invite_code()
        )
        membership_repo = MembershipRepository(db_session)
        await membership_repo.create(circle.id, creator.id, MemberRole.OWNER)
        await membership_repo.create(circle.id, voter.id)

        polls = [
            Poll(
                circle_id=circle.id,
                creator_id=creator.id,
                question_text=f"Question {index}?",
                ends_at=datetime.now(UTC) + timedelta(hours=1),
            )
            for index in range(14)
        ]
        expired_poll = Poll(
            circle_id=circle.id,
            creator_id=creator.id,
            question_text="Expired?",
            ends_at=datetime.now(UTC) - timedelta(minutes=1),
        )
        db_session.add_all([*polls, expired_poll])
        await db_session.flush()

        vote_repo = VoteRepository(db_session)
        await vote_repo.create(
            poll_id=polls[0].id,
            voter_id=voter.id,
            voter_hash=generate_voter_hash(voter.id, polls[0].id, salt=str(polls[0].id)),
            voted_for_id=creator.id,
        )
        await db_session.commit()

        service = PollService(
            template_repo=TemplateRepository(db_session),
            poll_repo=PollRepository(db_session),
            vote_repo=vote_repo,
            membership_repo=membership_repo,
            vote_session_repo=VoteSessionRepository(db_session),
            user_repo=user_repo,
        )

        session = await service.start_vote_session(voter.id, circle_id=circle.id)

        assert session.status == "ACTIVE"
        assert session.total_count == 12
        assert session.current_index == 0
        assert polls[0].id not in session.poll_ids
        assert expired_poll.id not in session.poll_ids
        assert session.current_poll_id == session.poll_ids[0]

    @pytest.mark.asyncio
    async def test_skip_vote_session_current_poll_advances(
        self, db_session: AsyncSession
    ) -> None:
        """Skipping records the current poll and advances the session cursor."""
        user_repo = UserRepository(db_session)
        creator = await user_repo.create(
            UserCreate(email="skip-creator@example.com", password="password123")
        )
        voter = await user_repo.create(
            UserCreate(email="skip-user@example.com", password="password123")
        )

        circle_repo = CircleRepository(db_session)
        circle = await circle_repo.create(
            CircleCreate(name="Skip Circle"), creator.id, generate_invite_code()
        )
        membership_repo = MembershipRepository(db_session)
        await membership_repo.create(circle.id, creator.id, MemberRole.OWNER)
        await membership_repo.create(circle.id, voter.id)

        first_poll = Poll(
            circle_id=circle.id,
            creator_id=creator.id,
            question_text="First?",
            ends_at=datetime.now(UTC) + timedelta(hours=1),
        )
        second_poll = Poll(
            circle_id=circle.id,
            creator_id=creator.id,
            question_text="Second?",
            ends_at=datetime.now(UTC) + timedelta(hours=1),
        )
        db_session.add_all([first_poll, second_poll])
        await db_session.commit()

        service = PollService(
            template_repo=TemplateRepository(db_session),
            poll_repo=PollRepository(db_session),
            vote_repo=VoteRepository(db_session),
            membership_repo=membership_repo,
            vote_session_repo=VoteSessionRepository(db_session),
            user_repo=user_repo,
        )

        session = await service.start_vote_session(voter.id, circle_id=circle.id)
        first_in_queue = session.current_poll_id
        skipped = await service.skip_vote_session_poll(session.id, voter.id)

        assert skipped.status == "ACTIVE"
        assert skipped.current_index == 1
        assert skipped.current_poll_id is not None
        assert skipped.current_poll_id != first_in_queue
        assert skipped.skipped_poll_ids == [first_in_queue]

        completed = await service.skip_vote_session_poll(session.id, voter.id)

        assert completed.status == "COMPLETED"
        assert completed.current_poll_id is None
        assert completed.skipped_poll_ids == session.poll_ids
        await db_session.refresh(voter)
        assert voter.next_session_at is not None
        assert voter.next_session_at > datetime.now(UTC)

    @pytest.mark.asyncio
    async def test_advance_vote_session_poll_keeps_skip_list_empty(
        self, db_session: AsyncSession
    ) -> None:
        """Advancing after a successful vote moves the cursor without a skip."""
        user_repo = UserRepository(db_session)
        creator = await user_repo.create(
            UserCreate(email="advance-creator@example.com", password="password123")
        )
        voter = await user_repo.create(
            UserCreate(email="advance-user@example.com", password="password123")
        )

        circle_repo = CircleRepository(db_session)
        circle = await circle_repo.create(
            CircleCreate(name="Advance Circle"), creator.id, generate_invite_code()
        )
        membership_repo = MembershipRepository(db_session)
        await membership_repo.create(circle.id, creator.id, MemberRole.OWNER)
        await membership_repo.create(circle.id, voter.id)

        first_poll = Poll(
            circle_id=circle.id,
            creator_id=creator.id,
            question_text="First?",
            ends_at=datetime.now(UTC) + timedelta(hours=1),
        )
        second_poll = Poll(
            circle_id=circle.id,
            creator_id=creator.id,
            question_text="Second?",
            ends_at=datetime.now(UTC) + timedelta(hours=1),
        )
        db_session.add_all([first_poll, second_poll])
        await db_session.commit()

        service = PollService(
            template_repo=TemplateRepository(db_session),
            poll_repo=PollRepository(db_session),
            vote_repo=VoteRepository(db_session),
            membership_repo=membership_repo,
            vote_session_repo=VoteSessionRepository(db_session),
            user_repo=user_repo,
        )

        session = await service.start_vote_session(voter.id, circle_id=circle.id)
        advanced = await service.advance_vote_session_poll(session.id, voter.id)

        assert advanced.status == "ACTIVE"
        assert advanced.current_index == 1
        assert advanced.current_poll_id != session.current_poll_id
        assert advanced.skipped_poll_ids == []

    @pytest.mark.asyncio
    async def test_completed_vote_session_sets_cooldown(
        self, db_session: AsyncSession
    ) -> None:
        """Completing the final poll starts the user's session cooldown."""
        user_repo = UserRepository(db_session)
        creator = await user_repo.create(
            UserCreate(email="cooldown-creator@example.com", password="password123")
        )
        voter = await user_repo.create(
            UserCreate(email="cooldown-user@example.com", password="password123")
        )

        circle_repo = CircleRepository(db_session)
        circle = await circle_repo.create(
            CircleCreate(name="Cooldown Circle"), creator.id, generate_invite_code()
        )
        membership_repo = MembershipRepository(db_session)
        await membership_repo.create(circle.id, creator.id, MemberRole.OWNER)
        await membership_repo.create(circle.id, voter.id)

        poll = Poll(
            circle_id=circle.id,
            creator_id=creator.id,
            question_text="Final?",
            ends_at=datetime.now(UTC) + timedelta(hours=1),
        )
        db_session.add(poll)
        await db_session.commit()

        service = PollService(
            template_repo=TemplateRepository(db_session),
            poll_repo=PollRepository(db_session),
            vote_repo=VoteRepository(db_session),
            membership_repo=membership_repo,
            vote_session_repo=VoteSessionRepository(db_session),
            user_repo=user_repo,
        )

        session = await service.start_vote_session(voter.id, circle_id=circle.id)
        completed = await service.advance_vote_session_poll(session.id, voter.id)

        assert completed.status == "COMPLETED"
        await db_session.refresh(voter)
        assert voter.next_session_at is not None
        remaining = voter.next_session_at - datetime.now(UTC)
        assert timedelta(minutes=59) < remaining <= timedelta(hours=1)

        availability = await service.get_vote_session_availability(voter.id)
        assert availability.can_start is False
        assert availability.next_session_at == voter.next_session_at
        assert availability.remaining_seconds > 0

        with pytest.raises(BadRequestException, match="Session cooldown active"):
            await service.start_vote_session(voter.id, circle_id=circle.id)

    @pytest.mark.asyncio
    async def test_vote_session_availability_unlocks_after_invite_join(
        self, db_session: AsyncSession
    ) -> None:
        """A new member joining one of the user's circles unlocks cooldown."""
        user_repo = UserRepository(db_session)
        owner = await user_repo.create(
            UserCreate(email="unlock-owner@example.com", password="password123")
        )
        new_member = await user_repo.create(
            UserCreate(email="unlock-new@example.com", password="password123")
        )

        circle_repo = CircleRepository(db_session)
        circle = await circle_repo.create(
            CircleCreate(name="Unlock Circle"), owner.id, generate_invite_code()
        )
        membership_repo = MembershipRepository(db_session)
        await membership_repo.create(circle.id, owner.id, MemberRole.OWNER)

        # Keep the cooldown start clearly before the DB-generated joined_at timestamp.
        cooldown_until = datetime.now(UTC) + timedelta(minutes=59)
        await user_repo.update_next_session_at(owner.id, cooldown_until)
        await db_session.commit()

        await membership_repo.create(circle.id, new_member.id)
        await db_session.commit()

        service = PollService(
            template_repo=TemplateRepository(db_session),
            poll_repo=PollRepository(db_session),
            vote_repo=VoteRepository(db_session),
            membership_repo=membership_repo,
            vote_session_repo=VoteSessionRepository(db_session),
            user_repo=user_repo,
        )

        availability = await service.get_vote_session_availability(owner.id)

        assert availability.can_start is True
        assert availability.unlocked_by_invite is True
        await db_session.refresh(owner)
        assert owner.next_session_at is None

    @pytest.mark.asyncio
    async def test_mark_received_heart_as_read_requires_received_vote(
        self, db_session: AsyncSession
    ) -> None:
        """Users can only mark hearts read when they received a vote in that poll."""
        user_repo = UserRepository(db_session)
        creator = await user_repo.create(
            UserCreate(email="read-creator@example.com", password="password123")
        )
        receiver = await user_repo.create(
            UserCreate(email="read-receiver@example.com", password="password123")
        )
        outsider = await user_repo.create(
            UserCreate(email="read-outsider@example.com", password="password123")
        )

        circle_repo = CircleRepository(db_session)
        circle = await circle_repo.create(
            CircleCreate(name="Read Circle"), creator.id, generate_invite_code()
        )
        membership_repo = MembershipRepository(db_session)
        await membership_repo.create(circle.id, creator.id, MemberRole.OWNER)
        await membership_repo.create(circle.id, receiver.id)

        poll = Poll(
            circle_id=circle.id,
            creator_id=creator.id,
            question_text="Who is kind?",
            ends_at=datetime.now(UTC) + timedelta(hours=1),
        )
        db_session.add(poll)
        await db_session.flush()

        vote_repo = VoteRepository(db_session)
        await vote_repo.create(
            poll_id=poll.id,
            voter_id=creator.id,
            voter_hash="service-heart-read-hash",
            voted_for_id=receiver.id,
        )
        await db_session.commit()

        service = PollService(
            template_repo=TemplateRepository(db_session),
            poll_repo=PollRepository(db_session),
            vote_repo=vote_repo,
            membership_repo=membership_repo,
        )

        response = await service.mark_received_heart_as_read(receiver.id, poll.id)
        hearts = await service.get_received_hearts(receiver.id)

        assert response.is_read is True
        assert hearts[0].is_read is True

        with pytest.raises(BadRequestException, match="Received heart not found"):
            await service.mark_received_heart_as_read(outsider.id, poll.id)


class TestCreateRound:
    """Tests for the safe five-question Circle round contract."""

    @staticmethod
    def build_service(
        *,
        role: MemberRole = MemberRole.OWNER,
        member_count: int = 5,
        active_polls: list[object] | None = None,
        templates: list[object] | None = None,
    ) -> tuple[PollService, SimpleNamespace]:
        circle_id = uuid.uuid4()
        creator_id = uuid.uuid4()
        now = datetime.now(UTC)
        categories = [
            TemplateCategory.PERSONALITY,
            TemplateCategory.PERSONALITY,
            TemplateCategory.PERSONALITY,
            TemplateCategory.APPEARANCE,
            TemplateCategory.TALENT,
            TemplateCategory.SPECIAL,
        ]
        round_templates = templates or [
            SimpleNamespace(
                id=uuid.uuid4(),
                category=category,
                question_text=f"Question {index}",
            )
            for index, category in enumerate(categories)
        ]

        circle_repo = SimpleNamespace(
            find_by_id=AsyncMock(
                return_value=SimpleNamespace(
                    id=circle_id,
                    is_active=True,
                    member_count=member_count,
                )
            )
        )
        membership_repo = SimpleNamespace(
            find_membership=AsyncMock(return_value=SimpleNamespace(role=role)),
        )
        template_repo = SimpleNamespace(
            find_round_candidates=AsyncMock(return_value=round_templates),
            increment_usage_count=AsyncMock(),
        )
        poll_repo = SimpleNamespace(
            acquire_circle_round_lock=AsyncMock(),
            find_active_by_circle_id=AsyncMock(return_value=active_polls or []),
            create=AsyncMock(),
        )

        def create_poll(**kwargs: object) -> SimpleNamespace:
            return SimpleNamespace(
                id=uuid.uuid4(),
                circle_id=kwargs["circle_id"],
                template_id=kwargs["template_id"],
                creator_id=kwargs["creator_id"],
                question_text=kwargs["question_text"],
                status=PollStatus.ACTIVE,
                ends_at=kwargs["ends_at"],
                vote_count=0,
                created_at=now,
                updated_at=now,
            )

        poll_repo.create.side_effect = create_poll
        service = PollService(
            template_repo=template_repo,
            poll_repo=poll_repo,
            vote_repo=SimpleNamespace(),
            membership_repo=membership_repo,
            circle_repo=circle_repo,
        )
        context = SimpleNamespace(
            circle_id=circle_id,
            creator_id=creator_id,
            poll_repo=poll_repo,
            template_repo=template_repo,
            templates=round_templates,
        )
        return service, context

    @pytest.mark.asyncio
    @pytest.mark.parametrize("role", [MemberRole.OWNER, MemberRole.ADMIN])
    async def test_manager_creates_five_diversified_polls_with_one_deadline(
        self,
        role: MemberRole,
    ) -> None:
        service, context = self.build_service(role=role)

        with patch(
            "app.tasks.notification_tasks.schedule_poll_deadline_notifications"
        ) as schedule_notifications:
            result = await service.create_round(
                context.circle_id,
                context.creator_id,
                PollDuration.SIX_HOURS,
            )

        assert result.created_count == 5
        assert len(result.polls) == 5
        assert {poll.ends_at for poll in result.polls} == {result.ends_at}
        selected_categories = [
            next(t.category for t in context.templates if t.id == poll.template_id)
            for poll in result.polls
        ]
        assert set(selected_categories) == set(TemplateCategory)
        assert max(selected_categories.count(category) for category in TemplateCategory) == 2
        context.poll_repo.acquire_circle_round_lock.assert_awaited_once_with(
            context.circle_id
        )
        assert context.poll_repo.create.await_count == 5
        assert context.template_repo.increment_usage_count.await_count == 5
        assert schedule_notifications.call_count == 5

    @pytest.mark.asyncio
    async def test_member_cannot_create_round(self) -> None:
        service, context = self.build_service(role=MemberRole.MEMBER)

        with pytest.raises(AuthorizationError) as exc_info:
            await service.create_round(context.circle_id, context.creator_id)

        assert exc_info.value.code == "FORBIDDEN"

    @pytest.mark.asyncio
    async def test_round_requires_five_members(self) -> None:
        service, context = self.build_service(member_count=4)

        with pytest.raises(BadRequestException) as exc_info:
            await service.create_round(context.circle_id, context.creator_id)

        assert exc_info.value.code == "NOT_ENOUGH_MEMBERS"
        assert exc_info.value.details == {"required": 5, "current": 4}

    @pytest.mark.asyncio
    async def test_active_round_blocks_duplicate_request(self) -> None:
        service, context = self.build_service(active_polls=[SimpleNamespace(id=uuid.uuid4())])

        with pytest.raises(BadRequestException) as exc_info:
            await service.create_round(context.circle_id, context.creator_id)

        assert exc_info.value.code == "ROUND_ALREADY_ACTIVE"
        context.poll_repo.create.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_round_requires_five_eligible_templates(self) -> None:
        templates = [
            SimpleNamespace(
                id=uuid.uuid4(),
                category=TemplateCategory.PERSONALITY,
                question_text=f"Question {index}",
            )
            for index in range(4)
        ]
        service, context = self.build_service(templates=templates)

        with pytest.raises(BadRequestException) as exc_info:
            await service.create_round(context.circle_id, context.creator_id)

        assert exc_info.value.code == "NOT_ENOUGH_TEMPLATES"
        context.poll_repo.create.assert_not_awaited()
