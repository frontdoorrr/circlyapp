"""Tests for Report Router."""

import uuid

import pytest
from fastapi import status
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import ReportReason, ReportStatus, ReportTargetType
from app.modules.auth.repository import UserRepository
from app.modules.auth.schemas import UserCreate
from app.modules.reports.models import Report


class TestReportRouter:
    """Tests for Report API endpoints."""

    @pytest.mark.asyncio
    async def test_create_report(self, client: AsyncClient, db_session: AsyncSession) -> None:
        """Test POST /reports endpoint."""
        # Register and login
        await client.post(
            "/auth/register",
            json={
                "email": "reporter@example.com",
                "password": "password123",
                "username": "reporter",
            },
        )
        login_response = await client.post(
            "/auth/login",
            json={
                "email": "reporter@example.com",
                "password": "password123",
            },
        )
        token = login_response.json()["access_token"]

        # Create report
        target_id = str(uuid.uuid4())
        response = await client.post(
            "/reports",
            json={
                "target_type": "USER",
                "target_id": target_id,
                "reason": "HARASSMENT",
                "description": "Sending harassing messages",
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["target_type"] == "USER"
        assert data["target_id"] == target_id
        assert data["reason"] == "HARASSMENT"
        assert data["status"] == "PENDING"
        assert data["description"] == "Sending harassing messages"

    @pytest.mark.asyncio
    async def test_create_report_without_description(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        """Test POST /reports without optional description."""
        # Register and login
        await client.post(
            "/auth/register",
            json={
                "email": "reporter@example.com",
                "password": "password123",
                "username": "reporter",
            },
        )
        login_response = await client.post(
            "/auth/login",
            json={
                "email": "reporter@example.com",
                "password": "password123",
            },
        )
        token = login_response.json()["access_token"]

        # Create report without description
        response = await client.post(
            "/reports",
            json={
                "target_type": "POLL",
                "target_id": str(uuid.uuid4()),
                "reason": "SPAM",
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["description"] is None

    @pytest.mark.asyncio
    async def test_create_report_duplicate(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        """Test creating duplicate report returns 400."""
        # Register and login
        await client.post(
            "/auth/register",
            json={
                "email": "reporter@example.com",
                "password": "password123",
                "username": "reporter",
            },
        )
        login_response = await client.post(
            "/auth/login",
            json={
                "email": "reporter@example.com",
                "password": "password123",
            },
        )
        token = login_response.json()["access_token"]

        # Get user ID
        user_repo = UserRepository(db_session)
        user = await user_repo.find_by_email("reporter@example.com")

        # Create existing report in DB
        target_id = uuid.uuid4()
        existing_report = Report(
            reporter_id=user.id,
            target_type=ReportTargetType.USER,
            target_id=target_id,
            reason=ReportReason.HARASSMENT,
            status=ReportStatus.PENDING,
        )
        db_session.add(existing_report)
        await db_session.commit()

        # Try to create duplicate
        response = await client.post(
            "/reports",
            json={
                "target_type": "USER",
                "target_id": str(target_id),
                "reason": "SPAM",
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert data["error"]["code"] == "ALREADY_REPORTED"

    @pytest.mark.asyncio
    async def test_create_report_self_report(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        """Test self-report returns 400."""
        # Register and login
        await client.post(
            "/auth/register",
            json={
                "email": "reporter@example.com",
                "password": "password123",
                "username": "reporter",
            },
        )
        login_response = await client.post(
            "/auth/login",
            json={
                "email": "reporter@example.com",
                "password": "password123",
            },
        )
        token = login_response.json()["access_token"]

        # Get user ID
        user_repo = UserRepository(db_session)
        user = await user_repo.find_by_email("reporter@example.com")

        # Try to report self
        response = await client.post(
            "/reports",
            json={
                "target_type": "USER",
                "target_id": str(user.id),
                "reason": "HARASSMENT",
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert data["error"]["code"] == "SELF_REPORT"

    @pytest.mark.asyncio
    async def test_create_report_unauthorized(self, client: AsyncClient) -> None:
        """Test POST /reports without authentication."""
        response = await client.post(
            "/reports",
            json={
                "target_type": "USER",
                "target_id": str(uuid.uuid4()),
                "reason": "HARASSMENT",
            },
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @pytest.mark.asyncio
    async def test_create_report_invalid_target_type(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        """Test POST /reports with invalid target type."""
        # Register and login
        await client.post(
            "/auth/register",
            json={
                "email": "reporter@example.com",
                "password": "password123",
                "username": "reporter",
            },
        )
        login_response = await client.post(
            "/auth/login",
            json={
                "email": "reporter@example.com",
                "password": "password123",
            },
        )
        token = login_response.json()["access_token"]

        # Try to create report with invalid target type
        response = await client.post(
            "/reports",
            json={
                "target_type": "INVALID",
                "target_id": str(uuid.uuid4()),
                "reason": "HARASSMENT",
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @pytest.mark.asyncio
    async def test_create_report_invalid_reason(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        """Test POST /reports with invalid reason."""
        # Register and login
        await client.post(
            "/auth/register",
            json={
                "email": "reporter@example.com",
                "password": "password123",
                "username": "reporter",
            },
        )
        login_response = await client.post(
            "/auth/login",
            json={
                "email": "reporter@example.com",
                "password": "password123",
            },
        )
        token = login_response.json()["access_token"]

        # Try to create report with invalid reason
        response = await client.post(
            "/reports",
            json={
                "target_type": "USER",
                "target_id": str(uuid.uuid4()),
                "reason": "INVALID_REASON",
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
