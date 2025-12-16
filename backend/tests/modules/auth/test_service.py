"""Tests for AuthService."""

import uuid
from datetime import timedelta

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BadRequestException, UnauthorizedException
from app.core.security import create_access_token
from app.modules.auth.repository import UserRepository
from app.modules.auth.schemas import LoginRequest, UserCreate, UserUpdate
from app.modules.auth.service import AuthService


class TestAuthServiceRegister:
    """Tests for AuthService.register method."""

    @pytest.mark.asyncio
    async def test_register_success(self, db_session: AsyncSession) -> None:
        """Test successful user registration."""
        repo = UserRepository(db_session)
        service = AuthService(repo)

        user_data = UserCreate(
            email="newuser@example.com",
            password="securepassword123",
            username="newuser",
            display_name="New User",
        )

        auth_response = await service.register(user_data)

        assert auth_response is not None
        assert auth_response.user.email == "newuser@example.com"
        assert auth_response.user.username == "newuser"
        assert auth_response.user.display_name == "New User"
        assert auth_response.access_token is not None
        assert auth_response.token_type == "bearer"

        # Verify password was hashed (not stored as plain text)
        user = await repo.find_by_email("newuser@example.com")
        assert user is not None
        assert user.hashed_password != "securepassword123"

    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, db_session: AsyncSession) -> None:
        """Test registration with duplicate email."""
        repo = UserRepository(db_session)
        service = AuthService(repo)

        user_data = UserCreate(
            email="duplicate@example.com",
            password="password123",
        )

        # Register first user
        await service.register(user_data)

        # Try to register with same email
        with pytest.raises(BadRequestException) as exc_info:
            await service.register(user_data)

        assert "already registered" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_register_without_optional_fields(self, db_session: AsyncSession) -> None:
        """Test registration without optional fields."""
        repo = UserRepository(db_session)
        service = AuthService(repo)

        user_data = UserCreate(
            email="minimal@example.com",
            password="password123",
        )

        auth_response = await service.register(user_data)

        assert auth_response.user.email == "minimal@example.com"
        assert auth_response.user.username is None
        assert auth_response.user.display_name is None


class TestAuthServiceLogin:
    """Tests for AuthService.login method."""

    @pytest.mark.asyncio
    async def test_login_success(self, db_session: AsyncSession) -> None:
        """Test successful login."""
        repo = UserRepository(db_session)
        service = AuthService(repo)

        # Register a user first
        user_data = UserCreate(
            email="loginuser@example.com",
            password="mypassword123",
            username="loginuser",
        )
        await service.register(user_data)

        # Login with correct credentials
        login_request = LoginRequest(
            email="loginuser@example.com",
            password="mypassword123",
        )
        auth_response = await service.login(login_request)

        assert auth_response is not None
        assert auth_response.user.email == "loginuser@example.com"
        assert auth_response.user.username == "loginuser"
        assert auth_response.access_token is not None
        assert auth_response.token_type == "bearer"

    @pytest.mark.asyncio
    async def test_login_invalid_email(self, db_session: AsyncSession) -> None:
        """Test login with non-existent email."""
        repo = UserRepository(db_session)
        service = AuthService(repo)

        login_request = LoginRequest(
            email="nonexistent@example.com",
            password="password123",
        )

        with pytest.raises(UnauthorizedException) as exc_info:
            await service.login(login_request)

        assert "invalid credentials" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_login_invalid_password(self, db_session: AsyncSession) -> None:
        """Test login with incorrect password."""
        repo = UserRepository(db_session)
        service = AuthService(repo)

        # Register a user
        user_data = UserCreate(
            email="wrongpass@example.com",
            password="correctpassword",
        )
        await service.register(user_data)

        # Try to login with wrong password
        login_request = LoginRequest(
            email="wrongpass@example.com",
            password="wrongpassword",
        )

        with pytest.raises(UnauthorizedException) as exc_info:
            await service.login(login_request)

        assert "invalid credentials" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_login_inactive_user(self, db_session: AsyncSession) -> None:
        """Test login with deactivated user account."""
        repo = UserRepository(db_session)
        service = AuthService(repo)

        # Register and deactivate a user
        user_data = UserCreate(
            email="inactive@example.com",
            password="password123",
        )
        auth_response = await service.register(user_data)
        await repo.deactivate(auth_response.user.id)

        # Try to login
        login_request = LoginRequest(
            email="inactive@example.com",
            password="password123",
        )

        with pytest.raises(UnauthorizedException) as exc_info:
            await service.login(login_request)

        assert "inactive" in str(exc_info.value).lower()


class TestAuthServiceGetCurrentUser:
    """Tests for AuthService.get_current_user method."""

    @pytest.mark.asyncio
    async def test_get_current_user_success(self, db_session: AsyncSession) -> None:
        """Test getting current user with valid token."""
        repo = UserRepository(db_session)
        service = AuthService(repo)

        # Register a user
        user_data = UserCreate(
            email="tokenuser@example.com",
            password="password123",
            username="tokenuser",
        )
        auth_response = await service.register(user_data)

        # Get current user using the token
        user = await service.get_current_user(auth_response.access_token)

        assert user is not None
        assert user.id == auth_response.user.id
        assert user.email == "tokenuser@example.com"
        assert user.username == "tokenuser"

    @pytest.mark.asyncio
    async def test_get_current_user_invalid_token(self, db_session: AsyncSession) -> None:
        """Test getting current user with invalid token."""
        repo = UserRepository(db_session)
        service = AuthService(repo)

        with pytest.raises(UnauthorizedException) as exc_info:
            await service.get_current_user("invalid.token.here")

        assert "invalid token" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_get_current_user_expired_token(self, db_session: AsyncSession) -> None:
        """Test getting current user with expired token."""
        repo = UserRepository(db_session)
        service = AuthService(repo)

        # Register a user
        user_data = UserCreate(
            email="expired@example.com",
            password="password123",
        )
        auth_response = await service.register(user_data)

        # Create an expired token (expires in -1 second)
        expired_token = create_access_token(
            subject=auth_response.user.id,
            expires_delta=timedelta(seconds=-1),
        )

        with pytest.raises(UnauthorizedException) as exc_info:
            await service.get_current_user(expired_token)

        assert "invalid token" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_get_current_user_deleted_user(self, db_session: AsyncSession) -> None:
        """Test getting current user when user is deleted from database."""
        repo = UserRepository(db_session)
        service = AuthService(repo)

        # Register a user
        user_data = UserCreate(
            email="deleted@example.com",
            password="password123",
        )
        auth_response = await service.register(user_data)

        # Deactivate the user
        await repo.deactivate(auth_response.user.id)

        with pytest.raises(UnauthorizedException) as exc_info:
            await service.get_current_user(auth_response.access_token)

        assert "user not found" in str(exc_info.value).lower()


class TestAuthServiceUpdateProfile:
    """Tests for AuthService.update_profile method."""

    @pytest.mark.asyncio
    async def test_update_profile_success(self, db_session: AsyncSession) -> None:
        """Test successful profile update."""
        repo = UserRepository(db_session)
        service = AuthService(repo)

        # Register a user
        user_data = UserCreate(
            email="updateme@example.com",
            password="password123",
            username="oldname",
        )
        auth_response = await service.register(user_data)

        # Update profile
        update_data = UserUpdate(
            username="newname",
            display_name="New Display Name",
            profile_emoji="🎉",
        )
        updated_user = await service.update_profile(auth_response.user.id, update_data)

        assert updated_user is not None
        assert updated_user.username == "newname"
        assert updated_user.display_name == "New Display Name"
        assert updated_user.profile_emoji == "🎉"

    @pytest.mark.asyncio
    async def test_update_profile_partial(self, db_session: AsyncSession) -> None:
        """Test partial profile update."""
        repo = UserRepository(db_session)
        service = AuthService(repo)

        # Register a user
        user_data = UserCreate(
            email="partial@example.com",
            password="password123",
            username="originalname",
            display_name="Original Display",
        )
        auth_response = await service.register(user_data)

        # Update only display name
        update_data = UserUpdate(display_name="Only Display Changed")
        updated_user = await service.update_profile(auth_response.user.id, update_data)

        assert updated_user is not None
        assert updated_user.username == "originalname"  # unchanged
        assert updated_user.display_name == "Only Display Changed"

    @pytest.mark.asyncio
    async def test_update_profile_nonexistent_user(self, db_session: AsyncSession) -> None:
        """Test updating profile of non-existent user."""
        repo = UserRepository(db_session)
        service = AuthService(repo)

        update_data = UserUpdate(username="newname")

        with pytest.raises(BadRequestException) as exc_info:
            await service.update_profile(uuid.uuid4(), update_data)

        assert "not found" in str(exc_info.value).lower()
