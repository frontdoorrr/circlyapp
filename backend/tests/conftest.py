"""Pytest configuration and fixtures."""

import uuid
from collections.abc import AsyncGenerator
from typing import Any

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import Settings
from app.core.database import Base
from app.main import create_app

# Import all models to register them with Base.metadata
from app.modules.auth.models import User  # noqa: F401
from app.modules.circles.models import Circle, CircleMember  # noqa: F401
from app.modules.notifications.models import Notification  # noqa: F401
from app.modules.polls.models import Poll, PollResult, PollTemplate, Vote, VoteSession  # noqa: F401
from app.modules.reports.models import Report  # noqa: F401
from app.modules.subscription.models import WebhookEvent  # noqa: F401

# Test database URL (use a separate test database)
TEST_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5433/circly_test"


@pytest.fixture
def test_settings() -> Settings:
    """Create test settings."""
    return Settings(
        app_env="development",
        debug=True,
        database_url=TEST_DATABASE_URL,
        secret_key="test-secret-key-for-testing-only",
    )


@pytest.fixture
async def test_engine(test_settings: Settings) -> AsyncGenerator[Any]:
    """Create test database engine."""
    engine = create_async_engine(
        test_settings.database_url,
        echo=False,
        pool_pre_ping=True,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest.fixture
async def db_session(test_engine: Any) -> AsyncGenerator[AsyncSession]:
    """Create a database session for each test."""
    async_session_maker = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )

    async with async_session_maker() as session:
        yield session
        await session.rollback()


@pytest.fixture
def app(test_engine: Any) -> FastAPI:
    """Create test FastAPI application with dependency overrides."""
    from app.deps import get_db

    test_app = create_app()

    # Override database dependency to use test database
    async def override_get_db() -> AsyncGenerator[AsyncSession]:
        async_session_maker_test = async_sessionmaker(
            test_engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False,
        )
        async with async_session_maker_test() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    test_app.dependency_overrides[get_db] = override_get_db

    return test_app


@pytest.fixture
async def client(app: FastAPI) -> AsyncGenerator[AsyncClient]:
    """Create async HTTP client for testing."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test/api/v1",
    ) as ac:
        yield ac


@pytest.fixture
def enable_orb_mode_for_user(app: FastAPI):
    """Factory fixture to enable Orb Mode for a user.

    Usage:
        await enable_orb_mode_for_user(user_id)

    This fixture provides a helper function that enables Orb Mode
    (is_orb_mode=True) for a given user by their UUID.
    """

    async def _enable(user_id: str | uuid.UUID) -> None:
        from app.deps import get_db

        if isinstance(user_id, str):
            user_id = uuid.UUID(user_id)

        async for session in app.dependency_overrides[get_db]():
            stmt = update(User).where(User.id == user_id).values(is_orb_mode=True)
            await session.execute(stmt)
            await session.commit()
            break

    return _enable
