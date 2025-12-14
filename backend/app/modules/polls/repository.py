"""Repositories for polls module."""

import uuid

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import TemplateCategory
from app.modules.polls.models import PollTemplate


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
