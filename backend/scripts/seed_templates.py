#!/usr/bin/env python3
"""Seed script for poll templates.

Run with: uv run python scripts/seed_templates.py
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import get_settings
from app.core.enums import TemplateCategory

# Import all models to ensure SQLAlchemy relationships are resolved
from app.modules.auth.models import User  # noqa: F401
from app.modules.circles.models import Circle, CircleMember  # noqa: F401
from app.modules.notifications.models import Notification  # noqa: F401
from app.modules.polls.models import Poll, PollResult, PollTemplate, Vote  # noqa: F401
from app.modules.reports.models import Report  # noqa: F401

# Poll templates data as defined in DSL.md
POLL_TEMPLATES = [
    # APPEARANCE category
    {
        "category": TemplateCategory.APPEARANCE,
        "question_text": "우리 중 누가 가장 스타일이 좋을까?",
        "emoji": "✨",
    },
    {
        "category": TemplateCategory.APPEARANCE,
        "question_text": "가장 미소가 예쁜 사람은?",
        "emoji": "😊",
    },
    {
        "category": TemplateCategory.APPEARANCE,
        "question_text": "눈이 가장 예쁜 사람은?",
        "emoji": "👀",
    },
    {
        "category": TemplateCategory.APPEARANCE,
        "question_text": "패션 센스가 가장 좋은 사람은?",
        "emoji": "👗",
    },
    {
        "category": TemplateCategory.APPEARANCE,
        "question_text": "가장 분위기 있는 사람은?",
        "emoji": "🌟",
    },
    # PERSONALITY category
    {
        "category": TemplateCategory.PERSONALITY,
        "question_text": "우리 중 가장 유머러스한 사람은?",
        "emoji": "😄",
    },
    {
        "category": TemplateCategory.PERSONALITY,
        "question_text": "가장 친절한 사람은 누구?",
        "emoji": "💖",
    },
    {
        "category": TemplateCategory.PERSONALITY,
        "question_text": "가장 믿음직한 사람은?",
        "emoji": "🤝",
    },
    {
        "category": TemplateCategory.PERSONALITY,
        "question_text": "가장 긍정적인 사람은?",
        "emoji": "☀️",
    },
    {
        "category": TemplateCategory.PERSONALITY,
        "question_text": "리더십이 가장 좋은 사람은?",
        "emoji": "👑",
    },
    {
        "category": TemplateCategory.PERSONALITY,
        "question_text": "가장 배려심 깊은 사람은?",
        "emoji": "🫂",
    },
    {
        "category": TemplateCategory.PERSONALITY,
        "question_text": "가장 솔직한 사람은?",
        "emoji": "💬",
    },
    # TALENT category
    {
        "category": TemplateCategory.TALENT,
        "question_text": "노래를 가장 잘 부르는 사람은?",
        "emoji": "🎤",
    },
    {
        "category": TemplateCategory.TALENT,
        "question_text": "춤을 가장 잘 추는 사람은?",
        "emoji": "💃",
    },
    {
        "category": TemplateCategory.TALENT,
        "question_text": "그림을 가장 잘 그리는 사람은?",
        "emoji": "🎨",
    },
    {
        "category": TemplateCategory.TALENT,
        "question_text": "운동을 가장 잘하는 사람은?",
        "emoji": "🏃",
    },
    {
        "category": TemplateCategory.TALENT,
        "question_text": "공부를 가장 잘하는 사람은?",
        "emoji": "📚",
    },
    {
        "category": TemplateCategory.TALENT,
        "question_text": "게임을 가장 잘하는 사람은?",
        "emoji": "🎮",
    },
    # SPECIAL category
    {
        "category": TemplateCategory.SPECIAL,
        "question_text": "10년 후 가장 성공할 것 같은 사람은?",
        "emoji": "🚀",
    },
    {
        "category": TemplateCategory.SPECIAL,
        "question_text": "연예인이 될 것 같은 사람은?",
        "emoji": "⭐",
    },
    {
        "category": TemplateCategory.SPECIAL,
        "question_text": "가장 결혼 빨리할 것 같은 사람은?",
        "emoji": "💍",
    },
    {
        "category": TemplateCategory.SPECIAL,
        "question_text": "무인도에서 같이 살아남고 싶은 사람은?",
        "emoji": "🏝️",
    },
    {
        "category": TemplateCategory.SPECIAL,
        "question_text": "비밀을 가장 잘 지키는 사람은?",
        "emoji": "🤫",
    },
]


async def seed_templates(session: AsyncSession) -> None:
    """Seed poll templates into the database."""
    # Check existing templates
    existing_query = select(PollTemplate.question_text)
    result = await session.execute(existing_query)
    existing_questions = set(result.scalars().all())

    # Insert new templates
    new_templates = []
    for template_data in POLL_TEMPLATES:
        if template_data["question_text"] not in existing_questions:
            template = PollTemplate(
                category=template_data["category"],
                question_text=template_data["question_text"],
                emoji=template_data.get("emoji"),
                is_active=True,
                usage_count=0,
            )
            new_templates.append(template)

    if new_templates:
        session.add_all(new_templates)
        await session.commit()
        print(f"✅ Inserted {len(new_templates)} new poll templates")
    else:
        print("ℹ️ No new templates to insert (all templates already exist)")

    # Print summary
    count_query = select(PollTemplate)
    result = await session.execute(count_query)
    total_count = len(result.scalars().all())
    print(f"📊 Total templates in database: {total_count}")


async def main() -> None:
    """Main entry point for the seed script."""
    settings = get_settings()

    print("🌱 Starting poll templates seed script...")
    print(f"📌 Database: {settings.database_url.split('@')[-1]}")  # Hide credentials

    engine = create_async_engine(settings.database_url, echo=False)
    async_session_maker = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with async_session_maker() as session:
        await seed_templates(session)

    await engine.dispose()
    print("✅ Seed script completed!")


if __name__ == "__main__":
    asyncio.run(main())
