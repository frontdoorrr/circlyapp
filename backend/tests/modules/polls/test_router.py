"""Tests for Poll Router."""

import uuid
from datetime import UTC, datetime, timedelta

import pytest
from fastapi import status
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import MemberRole, TemplateCategory
from app.core.security import create_access_token, generate_invite_code
from app.modules.auth.repository import UserRepository
from app.modules.auth.schemas import UserCreate
from app.modules.circles.repository import CircleRepository, MembershipRepository
from app.modules.circles.schemas import CircleCreate
from app.modules.polls.models import Poll, PollTemplate
from app.modules.polls.repository import TemplateRepository


@pytest.fixture
async def templates_fixture(db_session: AsyncSession) -> list[PollTemplate]:
    """Create test templates."""
    templates = [
        PollTemplate(
            category=TemplateCategory.PERSONALITY,
            question_text="Who is the funniest?",
            emoji="😂",
        ),
        PollTemplate(
            category=TemplateCategory.APPEARANCE,
            question_text="Who has the best style?",
            emoji="👗",
        ),
    ]
    db_session.add_all(templates)
    await db_session.commit()
    for t in templates:
        await db_session.refresh(t)
    return templates


class TestPollRouter:
    """Tests for Poll API endpoints."""

    @pytest.mark.asyncio
    async def test_get_templates(
        self, client: AsyncClient, templates_fixture: list[PollTemplate]
    ) -> None:
        """Test GET /polls/templates endpoint."""
        response = await client.get("/polls/templates")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 2
        assert data[0]["category"] in ["PERSONALITY", "APPEARANCE"]

    @pytest.mark.asyncio
    async def test_get_templates_by_category(
        self, client: AsyncClient, templates_fixture: list[PollTemplate]
    ) -> None:
        """Test GET /polls/templates with category filter."""
        response = await client.get(
            "/polls/templates", params={"category": "PERSONALITY"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 1
        assert data[0]["category"] == "PERSONALITY"

    @pytest.mark.asyncio
    async def test_create_poll(
        self, client: AsyncClient, templates_fixture: list[PollTemplate]
    ) -> None:
        """Test POST /polls/circles/{circle_id}/polls endpoint."""
        # Register and login
        await client.post(
            "/auth/register",
            json={
                "email": "user@example.com",
                "password": "password123",
                "username": "testuser",
            },
        )
        login_response = await client.post(
            "/auth/login",
            json={
                "email": "user@example.com",
                "password": "password123",
            },
        )
        token = login_response.json()["access_token"]

        # Create circle
        circle_response = await client.post(
            "/circles",
            json={"name": "Test Circle"},
            headers={"Authorization": f"Bearer {token}"},
        )
        circle_id = circle_response.json()["id"]

        # Create poll
        response = await client.post(
            f"/polls/circles/{circle_id}/polls",
            json={
                "template_id": str(templates_fixture[0].id),
                "duration": "3H",
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["circle_id"] == circle_id
        assert data["question_text"] == "Who is the funniest?"
        assert data["status"] == "ACTIVE"

    @pytest.mark.asyncio
    async def test_vote(
        self, client: AsyncClient, templates_fixture: list[PollTemplate]
    ) -> None:
        """Test POST /polls/{poll_id}/vote endpoint."""
        # Register two users
        await client.post(
            "/auth/register",
            json={
                "email": "voter@example.com",
                "password": "password123",
                "username": "voter",
            },
        )
        await client.post(
            "/auth/register",
            json={
                "email": "target@example.com",
                "password": "password123",
                "username": "target",
            },
        )

        # Login as voter
        login_response = await client.post(
            "/auth/login",
            json={
                "email": "voter@example.com",
                "password": "password123",
            },
        )
        voter_token = login_response.json()["access_token"]

        # Get target user id
        login_response2 = await client.post(
            "/auth/login",
            json={
                "email": "target@example.com",
                "password": "password123",
            },
        )
        target_user_id = login_response2.json()["user"]["id"]

        # Create circle
        circle_response = await client.post(
            "/circles",
            json={"name": "Test Circle"},
            headers={"Authorization": f"Bearer {voter_token}"},
        )
        circle_id = circle_response.json()["id"]
        invite_code = circle_response.json()["invite_code"]

        # Target joins circle
        await client.post(
            "/circles/join/code",
            json={"invite_code": invite_code},
            headers={"Authorization": f"Bearer {login_response2.json()['access_token']}"},
        )

        # Create poll
        poll_response = await client.post(
            f"/polls/circles/{circle_id}/polls",
            json={
                "template_id": str(templates_fixture[0].id),
                "duration": "3H",
            },
            headers={"Authorization": f"Bearer {voter_token}"},
        )
        poll_id = poll_response.json()["id"]

        # Vote
        vote_response = await client.post(
            f"/polls/{poll_id}/vote",
            json={"voted_for_id": target_user_id},
            headers={"Authorization": f"Bearer {voter_token}"},
        )

        assert vote_response.status_code == status.HTTP_200_OK
        data = vote_response.json()
        assert data["success"] is True
        assert len(data["results"]) > 0
