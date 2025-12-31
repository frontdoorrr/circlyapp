"""Business logic for authentication via Supabase."""

import uuid

from supabase_auth.errors import AuthApiError

from app.core.exceptions import BadRequestException, UnauthorizedException
from app.core.supabase import get_supabase_client
from app.modules.auth.repository import UserRepository
from app.modules.auth.schemas import (
    AuthResponse,
    LoginRequest,
    UserCreate,
    UserResponse,
    UserUpdate,
)


class AuthService:
    """Service for authentication operations via Supabase."""

    def __init__(self, repository: UserRepository) -> None:
        """Initialize service with repository."""
        self.repository = repository

    async def register(self, user_data: UserCreate) -> AuthResponse:
        """Register a new user via Supabase.

        Args:
            user_data: User registration data.

        Returns:
            AuthResponse with user data and access token.

        Raises:
            BadRequestException: If email is already registered.
        """
        supabase = get_supabase_client()

        try:
            # Create user in Supabase Auth
            auth_response = supabase.auth.sign_up(
                {
                    "email": user_data.email,
                    "password": user_data.password,
                }
            )
        except Exception as e:
            raise BadRequestException(str(e)) from e

        if auth_response.user is None:
            raise BadRequestException("Registration failed")

        # Check if local user already exists (handles duplicate requests)
        existing_user = await self.repository.find_by_supabase_id(
            auth_response.user.id
        )
        if existing_user is not None:
            raise BadRequestException("User already registered")

        # Also check by email for race condition
        existing_by_email = await self.repository.find_by_email(user_data.email)
        if existing_by_email is not None:
            raise BadRequestException("Email already registered")

        # Create local user profile with all provided data
        user = await self.repository.create_from_supabase(
            supabase_user_id=auth_response.user.id,
            email=user_data.email,
            username=user_data.username,
            display_name=user_data.display_name,
        )

        # Return auth response with Supabase token
        access_token = auth_response.session.access_token if auth_response.session else ""

        return AuthResponse(
            user=UserResponse.model_validate(user),
            access_token=access_token,
            token_type="bearer",
        )

    async def login(self, login_data: LoginRequest) -> AuthResponse:
        """Login a user via Supabase.

        Args:
            login_data: Login credentials (email and password).

        Returns:
            AuthResponse with user data and access token.

        Raises:
            UnauthorizedException: If credentials are invalid.
        """
        supabase = get_supabase_client()

        try:
            # Authenticate with Supabase
            auth_response = supabase.auth.sign_in_with_password(
                {
                    "email": login_data.email,
                    "password": login_data.password,
                }
            )
        except AuthApiError as e:
            raise UnauthorizedException("Invalid credentials") from e

        if auth_response.user is None or auth_response.session is None:
            raise UnauthorizedException("Invalid credentials")

        # Find or create local user profile
        user = await self.repository.find_by_supabase_id(auth_response.user.id)

        if user is None:
            # Auto-create local profile
            user = await self.repository.create_from_supabase(
                supabase_user_id=auth_response.user.id,
                email=login_data.email,
            )

        if not user.is_active:
            raise UnauthorizedException("User account is inactive")

        return AuthResponse(
            user=UserResponse.model_validate(user),
            access_token=auth_response.session.access_token,
            token_type="bearer",
        )

    async def update_profile(
        self, user_id: uuid.UUID, update_data: UserUpdate
    ) -> UserResponse:
        """Update user profile.

        Args:
            user_id: ID of user to update.
            update_data: Profile update data.

        Returns:
            Updated user response.

        Raises:
            BadRequestException: If user not found.
        """
        # Update user
        updated_user = await self.repository.update(user_id, update_data)
        if updated_user is None:
            raise BadRequestException("User not found")

        return UserResponse.model_validate(updated_user)
