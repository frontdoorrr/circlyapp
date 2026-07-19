"""Tests for the current Supabase-backed AuthService."""

import uuid
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from supabase_auth.errors import AuthApiError

from app.core.exceptions import BadRequestException, UnauthorizedException
from app.modules.auth.repository import UserRepository
from app.modules.auth.schemas import DevLoginRequest, LoginRequest, UserCreate, UserUpdate
from app.modules.auth.service import AuthService


def supabase_auth_response(
    user_id: str,
    *,
    access_token: str = "supabase-access-token",
    with_session: bool = True,
) -> SimpleNamespace:
    """Build the subset of the Supabase auth response used by AuthService."""
    session = SimpleNamespace(access_token=access_token) if with_session else None
    return SimpleNamespace(user=SimpleNamespace(id=user_id), session=session)


class TestAuthServiceRegister:
    """Tests for Supabase registration and local profile creation."""

    @pytest.mark.asyncio
    async def test_register_success(self, db_session: AsyncSession) -> None:
        repo = UserRepository(db_session)
        service = AuthService(repo)
        supabase_user_id = str(uuid.uuid4())
        supabase = MagicMock()
        supabase.auth.sign_up.return_value = supabase_auth_response(supabase_user_id)

        with patch("app.modules.auth.service.get_supabase_client", return_value=supabase):
            response = await service.register(
                UserCreate(
                    email="newuser@example.com",
                    password="securepassword123",
                    username="newuser",
                    display_name="New User",
                )
            )

        assert response.user.email == "newuser@example.com"
        assert response.user.supabase_user_id == supabase_user_id
        assert response.user.username == "newuser"
        assert response.access_token == "supabase-access-token"
        supabase.auth.sign_up.assert_called_once()

    @pytest.mark.asyncio
    async def test_register_duplicate_supabase_user(self, db_session: AsyncSession) -> None:
        repo = UserRepository(db_session)
        service = AuthService(repo)
        supabase_user_id = str(uuid.uuid4())
        await repo.create_from_supabase(supabase_user_id, "duplicate@example.com")
        supabase = MagicMock()
        supabase.auth.sign_up.return_value = supabase_auth_response(supabase_user_id)

        with (
            patch("app.modules.auth.service.get_supabase_client", return_value=supabase),
            pytest.raises(BadRequestException, match="already registered"),
        ):
            await service.register(
                UserCreate(email="duplicate@example.com", password="password123")
            )

    @pytest.mark.asyncio
    async def test_register_without_supabase_session(self, db_session: AsyncSession) -> None:
        repo = UserRepository(db_session)
        service = AuthService(repo)
        supabase = MagicMock()
        supabase.auth.sign_up.return_value = supabase_auth_response(
            str(uuid.uuid4()), with_session=False
        )

        with patch("app.modules.auth.service.get_supabase_client", return_value=supabase):
            response = await service.register(
                UserCreate(email="confirm@example.com", password="password123")
            )

        assert response.access_token == ""
        assert response.user.email == "confirm@example.com"


class TestAuthServiceLogin:
    """Tests for Supabase login and local profile lookup."""

    @pytest.mark.asyncio
    async def test_login_creates_missing_local_profile(self, db_session: AsyncSession) -> None:
        repo = UserRepository(db_session)
        service = AuthService(repo)
        supabase_user_id = str(uuid.uuid4())
        supabase = MagicMock()
        supabase.auth.sign_in_with_password.return_value = supabase_auth_response(supabase_user_id)

        with patch("app.modules.auth.service.get_supabase_client", return_value=supabase):
            response = await service.login(
                LoginRequest(email="loginuser@example.com", password="password123")
            )

        assert response.user.email == "loginuser@example.com"
        assert response.user.supabase_user_id == supabase_user_id
        assert response.access_token == "supabase-access-token"

    @pytest.mark.asyncio
    async def test_login_reuses_local_profile(self, db_session: AsyncSession) -> None:
        repo = UserRepository(db_session)
        service = AuthService(repo)
        supabase_user_id = str(uuid.uuid4())
        existing = await repo.create_from_supabase(
            supabase_user_id,
            "existing@example.com",
            username="existing",
        )
        supabase = MagicMock()
        supabase.auth.sign_in_with_password.return_value = supabase_auth_response(supabase_user_id)

        with patch("app.modules.auth.service.get_supabase_client", return_value=supabase):
            response = await service.login(
                LoginRequest(email="existing@example.com", password="password123")
            )

        assert response.user.id == existing.id
        assert response.user.username == "existing"

    @pytest.mark.asyncio
    async def test_login_invalid_credentials(self, db_session: AsyncSession) -> None:
        service = AuthService(UserRepository(db_session))
        supabase = MagicMock()
        supabase.auth.sign_in_with_password.side_effect = AuthApiError(
            "Invalid credentials", 400, None
        )

        with (
            patch("app.modules.auth.service.get_supabase_client", return_value=supabase),
            pytest.raises(UnauthorizedException, match="Invalid credentials"),
        ):
            await service.login(LoginRequest(email="missing@example.com", password="password123"))

    @pytest.mark.asyncio
    async def test_login_inactive_user(self, db_session: AsyncSession) -> None:
        repo = UserRepository(db_session)
        service = AuthService(repo)
        supabase_user_id = str(uuid.uuid4())
        user = await repo.create_from_supabase(supabase_user_id, "inactive@example.com")
        await repo.deactivate(user.id)
        supabase = MagicMock()
        supabase.auth.sign_in_with_password.return_value = supabase_auth_response(supabase_user_id)

        with (
            patch("app.modules.auth.service.get_supabase_client", return_value=supabase),
            pytest.raises(UnauthorizedException, match="inactive"),
        ):
            await service.login(LoginRequest(email="inactive@example.com", password="password123"))


class TestAuthServiceDevLogin:
    """Tests for local development authentication."""

    @pytest.mark.asyncio
    async def test_dev_login_creates_and_reuses_user(self, db_session: AsyncSession) -> None:
        repo = UserRepository(db_session)
        service = AuthService(repo)
        request = DevLoginRequest(email="dev@example.com", username="developer")

        first = await service.dev_login(request)
        second = await service.dev_login(request)

        assert first.user.id == second.user.id
        assert first.access_token == f"dev:{first.user.id}"
        assert first.user.supabase_user_id == "dev:dev@example.com"

    @pytest.mark.asyncio
    async def test_dev_login_rejects_inactive_user(self, db_session: AsyncSession) -> None:
        repo = UserRepository(db_session)
        service = AuthService(repo)
        user = await repo.create_from_supabase("dev:inactive@example.com", "inactive@example.com")
        await repo.deactivate(user.id)

        with pytest.raises(UnauthorizedException, match="inactive"):
            await service.dev_login(DevLoginRequest(email="inactive@example.com"))


class TestAuthServiceUpdateProfile:
    """Tests for local profile updates."""

    @pytest.mark.asyncio
    async def test_update_profile_success(self, db_session: AsyncSession) -> None:
        repo = UserRepository(db_session)
        service = AuthService(repo)
        user = await repo.create_from_supabase(
            str(uuid.uuid4()),
            "updateme@example.com",
            username="oldname",
        )

        updated = await service.update_profile(
            user.id,
            UserUpdate(
                username="newname",
                display_name="New Display Name",
                gender="MALE",
                age_group="MID_TEEN",
                profile_emoji="🎉",
            ),
        )

        assert updated.username == "newname"
        assert updated.display_name == "New Display Name"
        assert updated.gender == "MALE"
        assert updated.age_group == "MID_TEEN"
        assert updated.profile_emoji == "🎉"

    @pytest.mark.asyncio
    async def test_update_profile_partial(self, db_session: AsyncSession) -> None:
        repo = UserRepository(db_session)
        service = AuthService(repo)
        user = await repo.create_from_supabase(
            str(uuid.uuid4()),
            "partial@example.com",
            username="originalname",
            display_name="Original Display",
        )

        updated = await service.update_profile(
            user.id, UserUpdate(display_name="Only Display Changed")
        )

        assert updated.username == "originalname"
        assert updated.display_name == "Only Display Changed"

    @pytest.mark.asyncio
    async def test_update_profile_nonexistent_user(self, db_session: AsyncSession) -> None:
        service = AuthService(UserRepository(db_session))

        with pytest.raises(BadRequestException, match="not found"):
            await service.update_profile(uuid.uuid4(), UserUpdate(username="newname"))
