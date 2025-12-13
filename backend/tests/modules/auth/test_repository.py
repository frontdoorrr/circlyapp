"""Tests for UserRepository."""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.repository import UserRepository
from app.modules.auth.schemas import UserCreate, UserUpdate


class TestUserRepositoryCreate:
    """Tests for UserRepository.create method."""

    @pytest.mark.asyncio
    async def test_create_user_success(self, db_session: AsyncSession) -> None:
        """Test successful user creation."""
        repo = UserRepository(db_session)
        user_data = UserCreate(
            email="test@example.com",
            password="hashedpassword123",
            username="testuser",
            display_name="Test User",
        )

        user = await repo.create(user_data)

        assert user is not None
        assert user.id is not None
        assert user.email == "test@example.com"
        assert user.username == "testuser"
        assert user.display_name == "Test User"
        assert user.hashed_password == "hashedpassword123"
        assert user.is_active is True

    @pytest.mark.asyncio
    async def test_create_user_without_optional_fields(
        self, db_session: AsyncSession
    ) -> None:
        """Test user creation without optional fields."""
        repo = UserRepository(db_session)
        user_data = UserCreate(
            email="minimal@example.com",
            password="hashedpassword123",
        )

        user = await repo.create(user_data)

        assert user is not None
        assert user.email == "minimal@example.com"
        assert user.username is None
        assert user.display_name is None


class TestUserRepositoryFindByEmail:
    """Tests for UserRepository.find_by_email method."""

    @pytest.mark.asyncio
    async def test_find_by_email_exists(self, db_session: AsyncSession) -> None:
        """Test finding user by email when user exists."""
        repo = UserRepository(db_session)
        user_data = UserCreate(
            email="findme@example.com",
            password="hashedpassword123",
            username="findmeuser",
        )
        await repo.create(user_data)

        found_user = await repo.find_by_email("findme@example.com")

        assert found_user is not None
        assert found_user.email == "findme@example.com"
        assert found_user.username == "findmeuser"

    @pytest.mark.asyncio
    async def test_find_by_email_not_exists(self, db_session: AsyncSession) -> None:
        """Test finding user by email when user doesn't exist."""
        repo = UserRepository(db_session)

        found_user = await repo.find_by_email("nonexistent@example.com")

        assert found_user is None


class TestUserRepositoryFindById:
    """Tests for UserRepository.find_by_id method."""

    @pytest.mark.asyncio
    async def test_find_by_id_exists(self, db_session: AsyncSession) -> None:
        """Test finding user by id when user exists."""
        repo = UserRepository(db_session)
        user_data = UserCreate(
            email="findbyid@example.com",
            password="hashedpassword123",
        )
        created_user = await repo.create(user_data)

        found_user = await repo.find_by_id(created_user.id)

        assert found_user is not None
        assert found_user.id == created_user.id
        assert found_user.email == "findbyid@example.com"

    @pytest.mark.asyncio
    async def test_find_by_id_not_exists(self, db_session: AsyncSession) -> None:
        """Test finding user by id when user doesn't exist."""
        import uuid

        repo = UserRepository(db_session)

        found_user = await repo.find_by_id(uuid.uuid4())

        assert found_user is None


class TestUserRepositoryUpdate:
    """Tests for UserRepository.update method."""

    @pytest.mark.asyncio
    async def test_update_user_success(self, db_session: AsyncSession) -> None:
        """Test successful user update."""
        repo = UserRepository(db_session)
        user_data = UserCreate(
            email="update@example.com",
            password="hashedpassword123",
            username="oldusername",
        )
        created_user = await repo.create(user_data)

        update_data = UserUpdate(
            username="newusername",
            display_name="New Display Name",
            profile_emoji="🎉",
        )
        updated_user = await repo.update(created_user.id, update_data)

        assert updated_user is not None
        assert updated_user.username == "newusername"
        assert updated_user.display_name == "New Display Name"
        assert updated_user.profile_emoji == "🎉"

    @pytest.mark.asyncio
    async def test_update_user_partial(self, db_session: AsyncSession) -> None:
        """Test partial user update."""
        repo = UserRepository(db_session)
        user_data = UserCreate(
            email="partial@example.com",
            password="hashedpassword123",
            username="originalname",
            display_name="Original Display",
        )
        created_user = await repo.create(user_data)

        update_data = UserUpdate(display_name="Only Display Changed")
        updated_user = await repo.update(created_user.id, update_data)

        assert updated_user is not None
        assert updated_user.username == "originalname"  # unchanged
        assert updated_user.display_name == "Only Display Changed"

    @pytest.mark.asyncio
    async def test_update_nonexistent_user(self, db_session: AsyncSession) -> None:
        """Test updating a non-existent user."""
        import uuid

        repo = UserRepository(db_session)
        update_data = UserUpdate(username="newname")

        updated_user = await repo.update(uuid.uuid4(), update_data)

        assert updated_user is None
