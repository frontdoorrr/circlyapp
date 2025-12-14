"""Tests for Template Repository."""

import uuid

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import TemplateCategory
from app.modules.polls.models import PollTemplate
from app.modules.polls.repository import TemplateRepository


class TestTemplateRepository:
    """Tests for TemplateRepository."""

    @pytest.mark.asyncio
    async def test_find_all_templates(self, db_session: AsyncSession) -> None:
        """Test finding all active templates."""
        # Create test templates
        template1 = PollTemplate(
            category=TemplateCategory.APPEARANCE,
            question_text="Who has the best smile?",
            emoji="😊",
            is_active=True,
        )
        template2 = PollTemplate(
            category=TemplateCategory.PERSONALITY,
            question_text="Who is the kindest?",
            emoji="💖",
            is_active=True,
        )
        template3 = PollTemplate(
            category=TemplateCategory.TALENT,
            question_text="Who is the most talented?",
            emoji="⭐",
            is_active=False,  # Inactive
        )
        db_session.add_all([template1, template2, template3])
        await db_session.commit()

        repo = TemplateRepository(db_session)
        templates = await repo.find_all()

        # Should only return active templates
        assert len(templates) == 2
        assert all(t.is_active for t in templates)

    @pytest.mark.asyncio
    async def test_find_all_by_category(self, db_session: AsyncSession) -> None:
        """Test finding templates by category."""
        # Create templates in different categories
        template1 = PollTemplate(
            category=TemplateCategory.APPEARANCE,
            question_text="Who has the best style?",
            emoji="👗",
            is_active=True,
        )
        template2 = PollTemplate(
            category=TemplateCategory.APPEARANCE,
            question_text="Who has the coolest hair?",
            emoji="💇",
            is_active=True,
        )
        template3 = PollTemplate(
            category=TemplateCategory.PERSONALITY,
            question_text="Who is the funniest?",
            emoji="😂",
            is_active=True,
        )
        db_session.add_all([template1, template2, template3])
        await db_session.commit()

        repo = TemplateRepository(db_session)
        appearance_templates = await repo.find_all(category=TemplateCategory.APPEARANCE)

        assert len(appearance_templates) == 2
        assert all(t.category == TemplateCategory.APPEARANCE for t in appearance_templates)

    @pytest.mark.asyncio
    async def test_find_by_id(self, db_session: AsyncSession) -> None:
        """Test finding template by ID."""
        template = PollTemplate(
            category=TemplateCategory.SPECIAL,
            question_text="Who is the most likely to succeed?",
            emoji="🏆",
            is_active=True,
        )
        db_session.add(template)
        await db_session.commit()
        await db_session.refresh(template)

        repo = TemplateRepository(db_session)
        found = await repo.find_by_id(template.id)

        assert found is not None
        assert found.id == template.id
        assert found.question_text == "Who is the most likely to succeed?"

    @pytest.mark.asyncio
    async def test_find_by_id_not_found(self, db_session: AsyncSession) -> None:
        """Test finding non-existent template."""
        repo = TemplateRepository(db_session)
        found = await repo.find_by_id(uuid.uuid4())

        assert found is None

    @pytest.mark.asyncio
    async def test_increment_usage_count(self, db_session: AsyncSession) -> None:
        """Test incrementing template usage count."""
        template = PollTemplate(
            category=TemplateCategory.TALENT,
            question_text="Who is the best athlete?",
            emoji="🏃",
            is_active=True,
            usage_count=5,
        )
        db_session.add(template)
        await db_session.commit()
        await db_session.refresh(template)

        repo = TemplateRepository(db_session)
        await repo.increment_usage_count(template.id)

        # Refresh to get updated value
        await db_session.refresh(template)
        assert template.usage_count == 6

    @pytest.mark.asyncio
    async def test_increment_usage_count_not_found(self, db_session: AsyncSession) -> None:
        """Test incrementing usage count for non-existent template."""
        repo = TemplateRepository(db_session)
        result = await repo.increment_usage_count(uuid.uuid4())

        # Should return None or False
        assert result is None
