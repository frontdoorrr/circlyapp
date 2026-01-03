"""Common dependencies for FastAPI endpoints."""

from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.core.database import get_db
from app.core.enums import UserRole
from app.core.exceptions import AuthorizationError, UnauthorizedException
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

# HTTP Bearer scheme for Swagger UI integration
bearer_scheme = HTTPBearer(
    scheme_name="Bearer Token",
    description="Supabase JWT access token. Get it from POST /auth/login",
)

# Settings dependency
SettingsDep = Annotated[Settings, Depends(get_settings)]

# Database session dependency type
DBSessionDep = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Get current authenticated user from Supabase JWT token.

    Args:
        credentials: HTTP Bearer credentials from Authorization header
        db: Database session

    Returns:
        Current authenticated user

    Raises:
        UnauthorizedException: If token is invalid or user not found
    """
    from app.core.supabase import verify_supabase_token

    token = credentials.credentials

    # Verify Supabase token
    payload = verify_supabase_token(token)
    if payload is None:
        raise UnauthorizedException("Invalid token")

    # Extract Supabase user ID
    supabase_user_id = payload.get("sub")
    if not supabase_user_id:
        raise UnauthorizedException("Invalid token: missing user ID")

    # Find user by Supabase ID
    repo = UserRepository(db)
    user = await repo.find_by_supabase_id(supabase_user_id)

    # Auto-create local profile if not exists
    if user is None:
        email = payload.get("email", "")
        user = await repo.create_from_supabase(
            supabase_user_id=supabase_user_id,
            email=email,
        )
        await db.commit()

    if not user.is_active:
        raise UnauthorizedException("User account is inactive")

    return user


# Current user dependency type
CurrentUserDep = Annotated[User, Depends(get_current_user)]


async def require_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """Require admin role for the current user.

    Args:
        current_user: Current authenticated user

    Returns:
        Current user if admin

    Raises:
        AuthorizationError: If user is not an admin
    """
    if current_user.role != UserRole.ADMIN:
        raise AuthorizationError("관리자 권한이 필요합니다")
    return current_user


# Admin user dependency type
AdminUserDep = Annotated[User, Depends(require_admin)]


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
