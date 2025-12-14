"""API routes for authentication."""

from fastapi import APIRouter, status

from app.deps import CurrentUserDep, DBSessionDep
from app.modules.auth.repository import UserRepository
from app.modules.auth.schemas import AuthResponse, LoginRequest, UserCreate, UserResponse, UserUpdate
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
