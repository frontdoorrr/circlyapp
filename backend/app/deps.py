"""Common dependencies for FastAPI endpoints."""

from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.core.database import async_session_maker
from app.core.exceptions import UnauthorizedException
from app.modules.auth.models import User
from app.modules.auth.repository import UserRepository
from app.modules.auth.service import AuthService

# Settings dependency
SettingsDep = Annotated[Settings, Depends(get_settings)]


async def get_db() -> AsyncGenerator[AsyncSession]:
    """Get database session dependency."""
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


# Database session dependency type
DBSessionDep = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user(
    authorization: str = Header(..., description="Bearer token"),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Get current authenticated user from JWT token.

    Args:
        authorization: Authorization header with Bearer token
        db: Database session

    Returns:
        Current authenticated user

    Raises:
        UnauthorizedException: If token is invalid or user not found
    """
    # Extract token from "Bearer <token>" format
    if not authorization.startswith("Bearer "):
        raise UnauthorizedException("Invalid authorization header format")

    token = authorization.replace("Bearer ", "")

    # Get user from token
    repo = UserRepository(db)
    service = AuthService(repo)
    user = await service.get_current_user(token)

    return user


# Current user dependency type
CurrentUserDep = Annotated[User, Depends(get_current_user)]
