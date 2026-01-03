"""API routes for authentication."""

import uuid

from fastapi import APIRouter, Query, status

from app.core.enums import UserRole
from app.deps import AdminUserDep, CurrentUserDep, DBSessionDep
from app.modules.auth.repository import UserRepository
from app.modules.auth.schemas import (
    AuthResponse,
    LoginRequest,
    UpdateUserRoleRequest,
    UpdateUserStatusRequest,
    UserCreate,
    UserListResponse,
    UserResponse,
    UserUpdate,
)
from app.modules.auth.service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
async def register(
    user_data: UserCreate,
    db: DBSessionDep,
) -> AuthResponse:
    """Register a new user account.

    Args:
        user_data: User registration data (email, password, optional username/display_name)
        db: Database session

    Returns:
        AuthResponse with user data and access token

    Raises:
        400: Email is already registered
    """
    repo = UserRepository(db)
    service = AuthService(repo)
    return await service.register(user_data)


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="Login user",
)
async def login(
    login_data: LoginRequest,
    db: DBSessionDep,
) -> AuthResponse:
    """Login with email and password.

    Args:
        login_data: Login credentials (email and password)
        db: Database session

    Returns:
        AuthResponse with user data and access token

    Raises:
        401: Invalid credentials or inactive account
    """
    repo = UserRepository(db)
    service = AuthService(repo)
    return await service.login(login_data)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
)
async def get_me(
    current_user: CurrentUserDep,
) -> UserResponse:
    """Get current authenticated user's profile.

    Args:
        current_user: Current authenticated user from JWT token

    Returns:
        UserResponse with user profile data

    Raises:
        401: Invalid or expired token
    """
    return UserResponse.model_validate(current_user)


@router.put(
    "/me",
    response_model=UserResponse,
    summary="Update current user profile",
)
async def update_me(
    update_data: UserUpdate,
    current_user: CurrentUserDep,
    db: DBSessionDep,
) -> UserResponse:
    """Update current authenticated user's profile.

    Args:
        update_data: Profile update data
        current_user: Current authenticated user from JWT token
        db: Database session

    Returns:
        UserResponse with updated user data

    Raises:
        401: Invalid or expired token
        400: User not found
    """
    repo = UserRepository(db)
    service = AuthService(repo)
    return await service.update_profile(current_user.id, update_data)


# ==================== Admin Endpoints ====================


@router.get(
    "/admin/users",
    response_model=UserListResponse,
    summary="[Admin] Get all users",
    tags=["Admin - Users"],
)
async def get_all_users(
    admin_user: AdminUserDep,
    db: DBSessionDep,
    search: str | None = Query(None, description="Search in email/username/display_name"),
    is_active: bool | None = Query(None, description="Filter by active status"),
    role: UserRole | None = Query(None, description="Filter by role"),
    limit: int = Query(50, ge=1, le=100, description="Max results"),
    offset: int = Query(0, ge=0, description="Skip results"),
) -> UserListResponse:
    """Get all users with optional filters (Admin only)."""
    repo = UserRepository(db)
    service = AuthService(repo)
    users, total = await service.get_all_users(search, is_active, role, limit, offset)
    return UserListResponse(items=users, total=total, limit=limit, offset=offset)


@router.get(
    "/admin/users/{user_id}",
    response_model=UserResponse,
    summary="[Admin] Get user by ID",
    tags=["Admin - Users"],
)
async def get_user_by_id(
    user_id: uuid.UUID,
    admin_user: AdminUserDep,
    db: DBSessionDep,
) -> UserResponse:
    """Get user by ID (Admin only)."""
    repo = UserRepository(db)
    service = AuthService(repo)
    return await service.get_user_by_id(user_id)


@router.put(
    "/admin/users/{user_id}/status",
    response_model=UserResponse,
    summary="[Admin] Update user status",
    tags=["Admin - Users"],
)
async def update_user_status(
    user_id: uuid.UUID,
    request: UpdateUserStatusRequest,
    admin_user: AdminUserDep,
    db: DBSessionDep,
) -> UserResponse:
    """Update user's active status (Admin only)."""
    repo = UserRepository(db)
    service = AuthService(repo)
    return await service.update_user_status(user_id, request.is_active)


@router.put(
    "/admin/users/{user_id}/role",
    response_model=UserResponse,
    summary="[Admin] Update user role",
    tags=["Admin - Users"],
)
async def update_user_role(
    user_id: uuid.UUID,
    request: UpdateUserRoleRequest,
    admin_user: AdminUserDep,
    db: DBSessionDep,
) -> UserResponse:
    """Update user's role (Admin only)."""
    repo = UserRepository(db)
    service = AuthService(repo)
    return await service.update_user_role(user_id, request.role)
