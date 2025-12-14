"""Repositories for polls module."""

import uuid
from datetime import datetime, timedelta

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import PollStatus, TemplateCategory
from app.modules.polls.models import Poll, PollTemplate


class TemplateRepository:
    """Repository for PollTemplate model."""

    def __init__(self, session: AsyncSession) -> None:
        """Initialize repository with database session."""
        self.session = session

    async def find_all(
        self, category: TemplateCategory | None = None
    ) -> list[PollTemplate]:
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
        await self.session.execute(
            update(Poll).where(Poll.id == poll_id).values(status=status)
        )
        await self.session.commit()

    async def increment_vote_count(self, poll_id: uuid.UUID) -> None:
        """Increment poll vote count.

        Args:
            poll_id: Poll UUID
        """
        await self.session.execute(
            update(Poll)
            .where(Poll.id == poll_id)
            .values(vote_count=Poll.vote_count + 1)
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
