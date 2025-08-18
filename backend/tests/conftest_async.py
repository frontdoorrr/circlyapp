import pytest
import asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text
import os
from typing import AsyncGenerator

from app.main import app
from app.database import get_db, Base
from app.models.user import User
from app.utils.security import create_access_token

# Test database URL - SQLite for async testing
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"

# Create async test engine
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    future=True
)

TestAsyncSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False
)


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for the entire test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Async test database session"""
    # Create tables
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Create session
    async with TestAsyncSessionLocal() as session:
        yield session
    
    # Clean up
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Test client with database dependency override"""
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(app=app, base_url="http://testserver") as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


async def create_test_user(db_session: AsyncSession, device_id: str = "test_device_123") -> User:
    """Helper function to create test user"""
    user = User(device_id=device_id)
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


async def get_auth_headers(device_id: str = "test_device_123") -> dict:
    """Helper function to get authorization headers"""
    token = create_access_token(data={"device_id": device_id})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create test user fixture"""
    return await create_test_user(db_session)


@pytest.fixture
async def auth_headers(test_user: User) -> dict:
    """Authorization headers fixture"""
    return await get_auth_headers(test_user.device_id)