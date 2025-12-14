"""Tests for Poll Service."""

import uuid
from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import MemberRole, PollStatus, TemplateCategory
from app.core.exceptions import BadRequestException, PollNotFoundError
from app.core.security import generate_invite_code
from app.modules.auth.repository import UserRepository
from app.modules.auth.schemas import UserCreate
from app.modules.circles.repository import CircleRepository, MembershipRepository
from app.modules.circles.schemas import CircleCreate
from app.modules.polls.models import PollTemplate
from app.modules.polls.repository import PollRepository, TemplateRepository, VoteRepository
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
        )

        # Test
        poll_data = PollCreate(
            template_id=template.id,
            duration=PollDuration.THREE_HOURS,
        )
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
