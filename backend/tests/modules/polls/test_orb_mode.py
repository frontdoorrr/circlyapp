"""Tests for Orb Mode safe hints."""

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


class TestOrbModeHintsEndpoint:
    """Tests for GET /polls/{poll_id}/hints (Orb Mode)."""

    @pytest.mark.asyncio
    async def test_get_vote_hints_free_user_locks_identity_tiers(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        set_current_user,
        templates_fixture: list[PollTemplate],
    ) -> None:
        """Free users only receive Circle/time hints for received votes."""
        owner = await create_user(db_session, "hint-owner@test.com", "owner")
        voter = await create_user(db_session, "hint-voter@test.com", "minji")
        target = await create_user(db_session, "hint-target@test.com", "target")
        circle = await create_circle_with_members(db_session, owner, [voter, target])
        poll = await create_poll(db_session, circle, templates_fixture[0], owner)
        vote = await cast_vote(db_session, poll, voter, target)

        set_current_user(target)
        response = await client.get(f"/polls/{poll.id}/hints")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["poll_id"] == str(poll.id)
        hints = data["hints"]
        assert {hint["tier"] for hint in hints} == {"CIRCLE", "TIME", "INITIAL", "FULL"}
        unlocked = {hint["tier"] for hint in hints if hint["unlocked"]}
        assert unlocked == {"CIRCLE", "TIME"}
        assert all(hint["vote_id"] == str(vote.id) for hint in hints)
        assert all("minji" not in hint["text"] for hint in hints if not hint["unlocked"])

    @pytest.mark.asyncio
    async def test_get_vote_hints_orb_mode_unlocks_safe_identity_tiers(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        set_current_user,
        templates_fixture: list[PollTemplate],
    ) -> None:
        """Orb Mode users receive initial and app display-name hints."""
        owner = await create_user(db_session, "orb-hint-owner@test.com", "owner")
        voter = await create_user(db_session, "orb-hint-voter@test.com", "seoyeon")
        target = await create_user(
            db_session,
            "orb-hint-target@test.com",
            "target",
            is_orb_mode=True,
        )
        circle = await create_circle_with_members(db_session, owner, [voter, target])
        poll = await create_poll(db_session, circle, templates_fixture[0], owner)
        await cast_vote(db_session, poll, voter, target)

        set_current_user(target)
        response = await client.get(f"/polls/{poll.id}/hints")

        assert response.status_code == status.HTTP_200_OK
        hints = response.json()["hints"]
        unlocked = {hint["tier"] for hint in hints if hint["unlocked"]}
        assert unlocked == {"CIRCLE", "TIME", "INITIAL", "FULL"}
        full_hint = next(hint for hint in hints if hint["tier"] == "FULL")
        assert "seoyeon" in full_hint["text"]

    @pytest.mark.asyncio
    async def test_legacy_voters_endpoint_removed(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        set_current_user,
        templates_fixture: list[PollTemplate],
    ) -> None:
        """Legacy voter reveal endpoint is not part of the safe hints policy."""
        owner = await create_user(
            db_session,
            "legacy-voters-owner@test.com",
            "owner",
            is_orb_mode=True,
        )
        circle = await create_circle_with_members(db_session, owner, [])
        poll = await create_poll(db_session, circle, templates_fixture[0], owner)

        set_current_user(owner)
        response = await client.get(f"/polls/{poll.id}/voters")

        assert response.status_code == status.HTTP_404_NOT_FOUND
