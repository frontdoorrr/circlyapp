"""Tests for Orb Mode (Voter Reveal) feature."""

import uuid
from datetime import UTC, datetime, timedelta

import pytest
from fastapi import status
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import MemberRole, TemplateCategory
from app.modules.auth.models import User
from app.modules.circles.models import Circle, CircleMember
from app.modules.polls.models import Poll, PollTemplate, Vote


@pytest.fixture
async def templates_fixture(db_session: AsyncSession) -> list[PollTemplate]:
    """Create test templates."""
    templates = [
        PollTemplate(
            category=TemplateCategory.PERSONALITY,
            question_text="Who is the most creative?",
            emoji="🎨",
        ),
    ]
    db_session.add_all(templates)
    await db_session.commit()
    for t in templates:
        await db_session.refresh(t)
    return templates


@pytest.fixture
def set_current_user(app):
    """Fixture to set current user for authentication override."""
    from app.deps import get_current_user

    def _set(user: User):
        """Set the current user for subsequent API calls."""
        async def override_get_current_user():
            return user
        app.dependency_overrides[get_current_user] = override_get_current_user

    yield _set

    # Cleanup
    if get_current_user in app.dependency_overrides:
        del app.dependency_overrides[get_current_user]


async def create_user(
    db_session: AsyncSession,
    email: str,
    username: str,
    is_orb_mode: bool = False,
) -> User:
    """Create a test user."""
    user = User(
        email=email,
        username=username,
        display_name=username,
        supabase_user_id=f"test-{uuid.uuid4()}",
        is_orb_mode=is_orb_mode,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


async def create_circle_with_members(
    db_session: AsyncSession,
    owner: User,
    members: list[User],
) -> Circle:
    """Create a circle and add members."""
    circle = Circle(
        name="Test Circle",
        invite_code=uuid.uuid4().hex[:6].upper(),
        owner_id=owner.id,
    )
    db_session.add(circle)
    await db_session.commit()
    await db_session.refresh(circle)

    # Add owner as ADMIN
    owner_membership = CircleMember(
        circle_id=circle.id,
        user_id=owner.id,
        role=MemberRole.ADMIN,
    )
    db_session.add(owner_membership)

    # Add members
    for member in members:
        membership = CircleMember(
            circle_id=circle.id,
            user_id=member.id,
            role=MemberRole.MEMBER,
        )
        db_session.add(membership)

    await db_session.commit()
    return circle


async def create_poll(
    db_session: AsyncSession,
    circle: Circle,
    template: PollTemplate,
    creator: User,
) -> Poll:
    """Create a poll."""
    poll = Poll(
        circle_id=circle.id,
        creator_id=creator.id,
        template_id=template.id,
        question_text=template.question_text,
        ends_at=datetime.now(UTC) + timedelta(hours=3),
    )
    db_session.add(poll)
    await db_session.commit()
    await db_session.refresh(poll)
    return poll


async def cast_vote(
    db_session: AsyncSession,
    poll: Poll,
    voter: User,
    voted_for: User,
) -> Vote:
    """Cast a vote."""
    from app.core.security import generate_voter_hash

    vote = Vote(
        poll_id=poll.id,
        voter_id=voter.id,
        voted_for_id=voted_for.id,
        voter_hash=generate_voter_hash(voter.id, poll.id),
    )
    db_session.add(vote)
    await db_session.commit()
    await db_session.refresh(vote)
    return vote


class TestOrbModeVotersEndpoint:
    """Tests for GET /polls/{poll_id}/voters (Orb Mode)."""

    @pytest.mark.asyncio
    async def test_get_voters_orb_mode_enabled(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        set_current_user,
        templates_fixture: list[PollTemplate],
    ) -> None:
        """Test: Orb Mode subscriber can access voter reveal."""
        # Create users
        owner = await create_user(db_session, "owner@test.com", "owner")
        voter = await create_user(db_session, "voter@test.com", "voter")
        target = await create_user(
            db_session, "target@test.com", "target", is_orb_mode=True
        )

        # Create circle with all members
        circle = await create_circle_with_members(db_session, owner, [voter, target])

        # Create poll
        poll = await create_poll(db_session, circle, templates_fixture[0], owner)

        # Voter votes for target
        await cast_vote(db_session, poll, voter, target)

        # Set current user to target (Orb Mode enabled)
        set_current_user(target)

        # Target accesses voter reveal
        response = await client.get(f"/polls/{poll.id}/voters")

        # Assertions
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["poll_id"] == str(poll.id)
        assert "voters" in data
        assert len(data["voters"]) == 1
        assert data["voters"][0]["user_id"] == str(voter.id)

    @pytest.mark.asyncio
    async def test_get_voters_orb_mode_disabled(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        set_current_user,
        templates_fixture: list[PollTemplate],
    ) -> None:
        """Test: Non-Orb Mode user gets 400 error."""
        # Create users (owner without Orb Mode)
        owner = await create_user(db_session, "owner2@test.com", "owner2")
        voter = await create_user(db_session, "voter2@test.com", "voter2")

        # Create circle
        circle = await create_circle_with_members(db_session, owner, [voter])

        # Create poll
        poll = await create_poll(db_session, circle, templates_fixture[0], owner)

        # Set current user to owner (no Orb Mode)
        set_current_user(owner)

        # Non-Orb Mode user tries to access voter reveal
        response = await client.get(f"/polls/{poll.id}/voters")

        # Should fail - no Orb Mode (403 Forbidden)
        assert response.status_code == status.HTTP_403_FORBIDDEN
        data = response.json()
        assert "error" in data
        assert "Orb Mode" in data["error"]["message"]

    @pytest.mark.asyncio
    async def test_get_voters_poll_not_found(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        set_current_user,
    ) -> None:
        """Test: 400 error for non-existent poll (non-Orb Mode user)."""
        # Create user without Orb Mode
        owner = await create_user(db_session, "owner3@test.com", "owner3")

        # Set current user
        set_current_user(owner)

        # Try to access non-existent poll
        fake_poll_id = str(uuid.uuid4())
        response = await client.get(f"/polls/{fake_poll_id}/voters")

        # Should fail with 403 (AuthorizationError for non-Orb Mode - checked before poll lookup)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.asyncio
    async def test_get_voters_poll_not_found_with_orb_mode(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        set_current_user,
    ) -> None:
        """Test: 400 error for non-existent poll (Orb Mode user)."""
        # Create user with Orb Mode
        owner = await create_user(
            db_session, "owner4@test.com", "owner4", is_orb_mode=True
        )

        # Set current user
        set_current_user(owner)

        # Try to access non-existent poll
        fake_poll_id = str(uuid.uuid4())
        response = await client.get(f"/polls/{fake_poll_id}/voters")

        # Should fail with 404 (Poll not found)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.asyncio
    async def test_get_voters_not_circle_member(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        set_current_user,
        templates_fixture: list[PollTemplate],
    ) -> None:
        """Test: Non-member cannot access voter reveal even with Orb Mode."""
        # Create users
        owner = await create_user(db_session, "owner5@test.com", "owner5")
        voter = await create_user(db_session, "voter5@test.com", "voter5")
        outsider = await create_user(
            db_session, "outsider@test.com", "outsider", is_orb_mode=True
        )

        # Create circle with owner and voter only (outsider is NOT a member)
        circle = await create_circle_with_members(db_session, owner, [voter])

        # Create poll
        poll = await create_poll(db_session, circle, templates_fixture[0], owner)

        # Set current user to outsider (Orb Mode enabled but NOT circle member)
        set_current_user(outsider)

        # Outsider tries to access
        response = await client.get(f"/polls/{poll.id}/voters")

        # Should fail - not a member of the circle
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert "error" in data
        assert "member" in data["error"]["message"].lower()

    @pytest.mark.asyncio
    async def test_get_voters_unauthenticated(
        self,
        client: AsyncClient,
    ) -> None:
        """Test: Unauthenticated request gets 401."""
        fake_poll_id = str(uuid.uuid4())
        response = await client.get(f"/polls/{fake_poll_id}/voters")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.asyncio
    async def test_get_voters_empty_list(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        set_current_user,
        templates_fixture: list[PollTemplate],
    ) -> None:
        """Test: Returns empty list when no one voted for the user."""
        # Create users
        owner = await create_user(db_session, "owner6@test.com", "owner6")
        voter = await create_user(
            db_session, "voter6@test.com", "voter6", is_orb_mode=True
        )

        # Create circle
        circle = await create_circle_with_members(db_session, owner, [voter])

        # Create poll
        poll = await create_poll(db_session, circle, templates_fixture[0], owner)

        # No one voted for voter6

        # Set current user to voter (Orb Mode enabled)
        set_current_user(voter)

        # Voter checks who voted for them - should be empty
        response = await client.get(f"/polls/{poll.id}/voters")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["voters"] == []

    @pytest.mark.asyncio
    async def test_get_voters_multiple_voters(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        set_current_user,
        templates_fixture: list[PollTemplate],
    ) -> None:
        """Test: Returns all voters who selected the user."""
        # Create users
        owner = await create_user(db_session, "owner7@test.com", "owner7")
        voter1 = await create_user(db_session, "voter7a@test.com", "voter7a")
        voter2 = await create_user(db_session, "voter7b@test.com", "voter7b")
        target = await create_user(
            db_session, "target7@test.com", "target7", is_orb_mode=True
        )

        # Create circle with all members
        circle = await create_circle_with_members(
            db_session, owner, [voter1, voter2, target]
        )

        # Create poll
        poll = await create_poll(db_session, circle, templates_fixture[0], owner)

        # Both voters vote for target
        await cast_vote(db_session, poll, voter1, target)
        await cast_vote(db_session, poll, voter2, target)

        # Set current user to target (Orb Mode enabled)
        set_current_user(target)

        # Target checks who voted for them
        response = await client.get(f"/polls/{poll.id}/voters")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data["voters"]) == 2
        voter_ids = [v["user_id"] for v in data["voters"]]
        assert str(voter1.id) in voter_ids
        assert str(voter2.id) in voter_ids
