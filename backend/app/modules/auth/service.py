"""Business logic for authentication."""

import uuid

from app.core.exceptions import BadRequestException, UnauthorizedException
from app.core.security import create_access_token, hash_password, verify_password, verify_token
from app.modules.auth.models import User
from app.modules.auth.repository import UserRepository
from app.modules.auth.schemas import AuthResponse, LoginRequest, UserCreate, UserResponse, UserUpdate


class AuthService:
    """Service for authentication operations."""

    def __init__(self, repository: UserRepository) -> None:
        """Initialize service with repository."""
        self.repository = repository

    async def register(self, user_data: UserCreate) -> AuthResponse:
        """Register a new user.

        Args:
            user_data: User registration data.

        Returns:
            AuthResponse with user data and access token.

        Raises:
            BadRequestException: If email is already registered.
        """
        # Check if user already exists
        existing_user = await self.repository.find_by_email(user_data.email)
        if existing_user is not None:
            raise BadRequestException("Email is already registered")

        # Hash the password before creating user
        hashed_password = hash_password(user_data.password)

        # Create user with hashed password
        # Repository expects password field to contain the hashed password
        user_create_data = UserCreate(
            email=user_data.email,
            password=hashed_password,
            username=user_data.username,
            display_name=user_data.display_name,
        )
        user = await self.repository.create(user_create_data)

        # Create access token
        access_token = create_access_token(subject=user.id)

        # Return auth response
        return AuthResponse(
            user=UserResponse.model_validate(user),
            access_token=access_token,
            token_type="bearer",
        )

    async def login(self, login_data: LoginRequest) -> AuthResponse:
        """Login a user.

        Args:
            login_data: Login credentials (email and password).

        Returns:
            AuthResponse with user data and access token.

        Raises:
            UnauthorizedException: If credentials are invalid or user is inactive.
        """
        # Find user by email
        user = await self.repository.find_by_email(login_data.email)
        if user is None:
            raise UnauthorizedException("Invalid credentials")

        # Verify password
        if not verify_password(login_data.password, user.hashed_password):
            raise UnauthorizedException("Invalid credentials")

        # Check if user is active
        if not user.is_active:
            raise UnauthorizedException("User account is inactive")

        # Create access token
        access_token = create_access_token(subject=user.id)

        # Return auth response
        return AuthResponse(
            user=UserResponse.model_validate(user),
            access_token=access_token,
            token_type="bearer",
        )

    async def get_current_user(self, token: str) -> User:
        """Get current user from access token.

        Args:
            token: JWT access token.

        Returns:
            Current user.

        Raises:
            UnauthorizedException: If token is invalid or user not found.
        """
        # Verify and decode token
        payload = verify_token(token)
        if payload is None:
            raise UnauthorizedException("Invalid token")

        # Extract user_id from token
        user_id_str = payload.get("sub")
        if user_id_str is None:
            raise UnauthorizedException("Invalid token")

        try:
            user_id = uuid.UUID(user_id_str)
        except ValueError:
            raise UnauthorizedException("Invalid token")

        # Find user by id
        user = await self.repository.find_by_id(user_id)
        if user is None or not user.is_active:
            raise UnauthorizedException("User not found or inactive")

        return user

    async def update_profile(self, user_id: uuid.UUID, update_data: UserUpdate) -> UserResponse:
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
