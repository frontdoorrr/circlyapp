"""Common dependencies for FastAPI endpoints."""

from typing import Annotated

from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.core.database import get_db
from app.core.exceptions import UnauthorizedException
from app.modules.auth.models import User
from app.modules.auth.repository import UserRepository
from app.modules.auth.service import AuthService
from app.modules.circles.repository import CircleRepository, MembershipRepository
from app.modules.circles.service import CircleService
from app.modules.notifications.repository import NotificationRepository
from app.modules.notifications.service import NotificationService
from app.modules.polls.repository import PollRepository, TemplateRepository, VoteRepository
from app.modules.polls.service import PollService
from app.modules.reports.repository import ReportRepository
from app.modules.reports.service import ReportService

# Settings dependency
SettingsDep = Annotated[Settings, Depends(get_settings)]

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


# Service factory functions
def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    """Get AuthService dependency."""
    return AuthService(UserRepository(db))


def get_circle_service(db: AsyncSession = Depends(get_db)) -> CircleService:
    """Get CircleService dependency."""
    return CircleService(CircleRepository(db), MembershipRepository(db))


def get_poll_service(db: AsyncSession = Depends(get_db)) -> PollService:
    """Get PollService dependency."""
    return PollService(
        TemplateRepository(db),
        PollRepository(db),
        VoteRepository(db),
        MembershipRepository(db),
    )


def get_notification_service(db: AsyncSession = Depends(get_db)) -> NotificationService:
    """Get NotificationService dependency."""
    return NotificationService(NotificationRepository(db), UserRepository(db))


def get_report_service(db: AsyncSession = Depends(get_db)) -> ReportService:
    """Get ReportService dependency."""
    return ReportService(ReportRepository(db))


# Service dependency types
AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]
CircleServiceDep = Annotated[CircleService, Depends(get_circle_service)]
PollServiceDep = Annotated[PollService, Depends(get_poll_service)]
NotificationServiceDep = Annotated[NotificationService, Depends(get_notification_service)]
ReportServiceDep = Annotated[ReportService, Depends(get_report_service)]
