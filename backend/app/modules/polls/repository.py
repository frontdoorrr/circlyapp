"""Repositories for polls module."""

import uuid
from datetime import datetime, timedelta

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import PollStatus, TemplateCategory
from app.modules.polls.models import Poll, PollTemplate, Vote


class TemplateRepository:
    """Repository for PollTemplate model."""

    def __init__(self, session: AsyncSession) -> None:
        """Initialize repository with database session."""
        self.session = session

    async def find_all(self, category: TemplateCategory | None = None) -> list[PollTemplate]:
        """Find all active templates, optionally filtered by category.

        Args:
            category: Optional category filter

        Returns:
            List of active poll templates
        """
        query = select(PollTemplate).where(PollTemplate.is_active == True)  # noqa: E712

        if category:
            query = query.where(PollTemplate.category == category)

        query = query.order_by(PollTemplate.usage_count.desc(), PollTemplate.created_at)

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def find_by_id(self, template_id: uuid.UUID) -> PollTemplate | None:
        """Find template by ID.

        Args:
            template_id: Template UUID

        Returns:
            PollTemplate if found, None otherwise
        """
        result = await self.session.execute(
            select(PollTemplate).where(PollTemplate.id == template_id)
        )
        return result.scalar_one_or_none()

    async def increment_usage_count(self, template_id: uuid.UUID) -> None:
        """Increment template usage count.

        Args:
            template_id: Template UUID
        """
        await self.session.execute(
            update(PollTemplate)
            .where(PollTemplate.id == template_id)
            .values(usage_count=PollTemplate.usage_count + 1)
        )
        await self.session.commit()


class PollRepository:
    """Repository for Poll model."""

    def __init__(self, session: AsyncSession) -> None:
        """Initialize repository with database session."""
        self.session = session

    async def create(
        self,
        circle_id: uuid.UUID,
        template_id: uuid.UUID,
        creator_id: uuid.UUID,
        question_text: str,
        ends_at: datetime,
    ) -> Poll:
        """Create a new poll.

        Args:
            circle_id: Circle UUID
            template_id: Template UUID
            creator_id: Creator user UUID
            question_text: Poll question text
            ends_at: Poll end datetime

        Returns:
            Created Poll instance
        """
        poll = Poll(
            circle_id=circle_id,
            template_id=template_id,
            creator_id=creator_id,
            question_text=question_text,
            status=PollStatus.ACTIVE,
            ends_at=ends_at,
        )
        self.session.add(poll)
        await self.session.commit()
        await self.session.refresh(poll)
        return poll

    async def find_by_id(self, poll_id: uuid.UUID) -> Poll | None:
        """Find poll by ID.

        Args:
            poll_id: Poll UUID

        Returns:
            Poll if found, None otherwise
        """
        result = await self.session.execute(select(Poll).where(Poll.id == poll_id))
        return result.scalar_one_or_none()

    async def find_by_circle_id(
        self, circle_id: uuid.UUID, status: PollStatus | None = None
    ) -> list[Poll]:
        """Find polls by circle ID, optionally filtered by status.

        Args:
            circle_id: Circle UUID
            status: Optional status filter

        Returns:
            List of polls
        """
        query = select(Poll).where(Poll.circle_id == circle_id)

        if status:
            query = query.where(Poll.status == status)

        query = query.order_by(Poll.created_at.desc())

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def find_active_by_circle_id(self, circle_id: uuid.UUID) -> list[Poll]:
        """Find active polls by circle ID.

        Args:
            circle_id: Circle UUID

        Returns:
            List of active polls
        """
        return await self.find_by_circle_id(circle_id, status=PollStatus.ACTIVE)

    async def update_status(self, poll_id: uuid.UUID, status: PollStatus) -> None:
        """Update poll status.

        Args:
            poll_id: Poll UUID
            status: New status
        """
        await self.session.execute(update(Poll).where(Poll.id == poll_id).values(status=status))
        await self.session.commit()

    async def increment_vote_count(self, poll_id: uuid.UUID) -> None:
        """Increment poll vote count.

        Args:
            poll_id: Poll UUID
        """
        await self.session.execute(
            update(Poll).where(Poll.id == poll_id).values(vote_count=Poll.vote_count + 1)
        )
        await self.session.commit()

    async def find_ending_soon(self, minutes: int) -> list[Poll]:
        """Find active polls ending within specified minutes.

        Args:
            minutes: Minutes threshold

        Returns:
            List of polls ending soon
        """
        threshold = datetime.now() + timedelta(minutes=minutes)
        query = (
            select(Poll)
            .where(Poll.status == PollStatus.ACTIVE)
            .where(Poll.ends_at <= threshold)
            .order_by(Poll.ends_at)
        )

        result = await self.session.execute(query)
        return list(result.scalars().all())


class VoteRepository:
    """Repository for Vote model."""

    def __init__(self, session: AsyncSession) -> None:
        """Initialize repository with database session."""
        self.session = session

    async def create(self, poll_id: uuid.UUID, voter_hash: str, voted_for_id: uuid.UUID) -> Vote:
        """Create a new vote.

        Args:
            poll_id: Poll UUID
            voter_hash: SHA-256 hash of voter
            voted_for_id: User UUID being voted for

        Returns:
            Created Vote instance
        """
        vote = Vote(poll_id=poll_id, voter_hash=voter_hash, voted_for_id=voted_for_id)
        self.session.add(vote)
        await self.session.commit()
        await self.session.refresh(vote)
        return vote

    async def exists_by_voter_hash(self, poll_id: uuid.UUID, voter_hash: str) -> bool:
        """Check if vote exists by voter hash.

        Args:
            poll_id: Poll UUID
            voter_hash: Voter hash to check

        Returns:
            True if vote exists, False otherwise
        """
        result = await self.session.execute(
            select(Vote).where(Vote.poll_id == poll_id, Vote.voter_hash == voter_hash)
        )
        return result.scalar_one_or_none() is not None

    async def count_by_poll_id(self, poll_id: uuid.UUID) -> int:
        """Count votes for a poll.

        Args:
            poll_id: Poll UUID

        Returns:
            Number of votes
        """
        result = await self.session.execute(
            select(func.count()).select_from(Vote).where(Vote.poll_id == poll_id)
        )
        return result.scalar() or 0

    async def get_results_by_poll_id(self, poll_id: uuid.UUID) -> list[dict[str, int]]:
        """Get vote results for a poll.

        Args:
            poll_id: Poll UUID

        Returns:
            List of vote results with user_id and vote_count
        """
        result = await self.session.execute(
            select(Vote.voted_for_id, func.count(Vote.id).label("vote_count"))
            .where(Vote.poll_id == poll_id)
            .group_by(Vote.voted_for_id)
            .order_by(func.count(Vote.id).desc())
        )

        return [{"user_id": row.voted_for_id, "vote_count": row.vote_count} for row in result.all()]
