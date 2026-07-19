"""Tests for Template Repository."""

import uuid
from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import PollStatus, TemplateCategory
from app.core.security import generate_invite_code
from app.modules.auth.repository import UserRepository
from app.modules.auth.schemas import UserCreate
from app.modules.circles.repository import CircleRepository
from app.modules.circles.schemas import CircleCreate
from app.modules.polls.models import Poll, PollTemplate
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
    async def test_round_candidates_prioritize_not_recent_and_exclude_inactive(
        self,
        db_session: AsyncSession,
    ) -> None:
        """Fresh active questions come before recently used or inactive ones."""
        owner = await UserRepository(db_session).create(
            UserCreate(email="template-round-owner@example.com", password="password123")
        )
        circle = await CircleRepository(db_session).create(
            CircleCreate(name="Template Round"),
            owner.id,
            generate_invite_code(),
        )
        recent = PollTemplate(
            category=TemplateCategory.PERSONALITY,
            question_text="Recently used?",
            is_active=True,
            usage_count=0,
        )
        fresh = PollTemplate(
            category=TemplateCategory.TALENT,
            question_text="Fresh but globally used?",
            is_active=True,
            usage_count=99,
        )
        inactive = PollTemplate(
            category=TemplateCategory.SPECIAL,
            question_text="Disabled?",
            is_active=False,
        )
        db_session.add_all([recent, fresh, inactive])
        await db_session.flush()
        db_session.add(
            Poll(
                circle_id=circle.id,
                template_id=recent.id,
                creator_id=owner.id,
                question_text=recent.question_text,
                status=PollStatus.COMPLETED,
                ends_at=datetime.now(UTC) - timedelta(hours=1),
            )
        )
        await db_session.commit()

        candidates = await TemplateRepository(db_session).find_round_candidates(circle.id)

        assert [template.id for template in candidates] == [fresh.id, recent.id]

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
