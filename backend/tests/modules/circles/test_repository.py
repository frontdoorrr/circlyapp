"""Tests for Circle and Membership repositories."""

import uuid

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import MemberRole
from app.core.security import generate_invite_code
from app.modules.auth.models import User
from app.modules.auth.repository import UserRepository
from app.modules.auth.schemas import UserCreate
from app.modules.circles.repository import CircleRepository, MembershipRepository
from app.modules.circles.schemas import CircleCreate


class TestCircleRepository:
    """Tests for CircleRepository."""

    @pytest.mark.asyncio
    async def test_create_circle(self, db_session: AsyncSession) -> None:
        """Test circle creation."""
        # Create a user first
        user_repo = UserRepository(db_session)
        user_data = UserCreate(email="owner@example.com", password="hashed123")
        user = await user_repo.create(user_data)

        # Create circle
        circle_repo = CircleRepository(db_session)
        circle_data = CircleCreate(name="Test Circle", description="A test circle")
        invite_code = generate_invite_code()
        circle = await circle_repo.create(circle_data, user.id, invite_code)

        assert circle is not None
        assert circle.name == "Test Circle"
        assert circle.invite_code == invite_code
        assert circle.owner_id == user.id
        assert circle.member_count == 1

    @pytest.mark.asyncio
    async def test_find_by_invite_code(self, db_session: AsyncSession) -> None:
        """Test finding circle by invite code."""
        user_repo = UserRepository(db_session)
        user = await user_repo.create(UserCreate(email="user@example.com", password="password123"))

        circle_repo = CircleRepository(db_session)
        invite_code = generate_invite_code()
        circle_data = CircleCreate(name="Find Me")
        await circle_repo.create(circle_data, user.id, invite_code)

        found = await circle_repo.find_by_invite_code(invite_code)
        assert found is not None
        assert found.name == "Find Me"

    @pytest.mark.asyncio
    async def test_find_by_user_id(self, db_session: AsyncSession) -> None:
        """Test finding circles by user ID."""
        user_repo = UserRepository(db_session)
        user = await user_repo.create(
            UserCreate(email="member@example.com", password="password123")
        )

        circle_repo = CircleRepository(db_session)
        membership_repo = MembershipRepository(db_session)

        # Create circle
        circle_data = CircleCreate(name="User's Circle")
        circle = await circle_repo.create(circle_data, user.id, generate_invite_code())

        # Add user as member
        await membership_repo.create(circle.id, user.id, MemberRole.OWNER)

        # Find circles
        circles = await circle_repo.find_by_user_id(user.id)
        assert len(circles) == 1
        assert circles[0].name == "User's Circle"


class TestMembershipRepository:
    """Tests for MembershipRepository."""

    @pytest.mark.asyncio
    async def test_create_membership(self, db_session: AsyncSession) -> None:
        """Test membership creation."""
        user_repo = UserRepository(db_session)
        user = await user_repo.create(
            UserCreate(email="newmember@example.com", password="password123")
        )

        circle_repo = CircleRepository(db_session)
        circle_data = CircleCreate(name="Circle")
        circle = await circle_repo.create(circle_data, user.id, generate_invite_code())

        membership_repo = MembershipRepository(db_session)
        membership = await membership_repo.create(circle.id, user.id, MemberRole.MEMBER)

        assert membership is not None
        assert membership.circle_id == circle.id
        assert membership.user_id == user.id
        assert membership.role == MemberRole.MEMBER

    @pytest.mark.asyncio
    async def test_membership_exists(self, db_session: AsyncSession) -> None:
        """Test checking if membership exists."""
        user_repo = UserRepository(db_session)
        user = await user_repo.create(
            UserCreate(email="checker@example.com", password="password123")
        )

        circle_repo = CircleRepository(db_session)
        circle = await circle_repo.create(
            CircleCreate(name="Exist Circle"), user.id, generate_invite_code()
        )

        membership_repo = MembershipRepository(db_session)

        # Check before creating
        exists_before = await membership_repo.exists(circle.id, user.id)
        assert exists_before is False

        # Create membership
        await membership_repo.create(circle.id, user.id)

        # Check after creating
        exists_after = await membership_repo.exists(circle.id, user.id)
        assert exists_after is True
