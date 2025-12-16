"""Tests for Notification Router."""

import pytest
from fastapi import status
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import NotificationType
from app.modules.auth.repository import UserRepository
from app.modules.auth.schemas import UserCreate
from app.modules.notifications.models import Notification


class TestNotificationRouter:
    """Tests for Notification API endpoints."""

    @pytest.mark.asyncio
    async def test_get_notifications(self, client: AsyncClient, db_session: AsyncSession) -> None:
        """Test GET /notifications endpoint."""
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

        # Get user from DB
        user_repo = UserRepository(db_session)
        user = await user_repo.find_by_email("user@example.com")

        # Create notifications for user
        notification1 = Notification(
            user_id=user.id,
            type=NotificationType.POLL_STARTED,
            title="Test Notification 1",
            body="Body 1",
            is_read=False,
        )
        notification2 = Notification(
            user_id=user.id,
            type=NotificationType.VOTE_RECEIVED,
            title="Test Notification 2",
            body="Body 2",
            is_read=True,
        )
        db_session.add_all([notification1, notification2])
        await db_session.commit()

        # Get notifications
        response = await client.get(
            "/notifications",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 2
        assert data[0]["title"] in ["Test Notification 1", "Test Notification 2"]

    @pytest.mark.asyncio
    async def test_get_notifications_with_pagination(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        """Test GET /notifications with pagination."""
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

        # Get user from DB
        user_repo = UserRepository(db_session)
        user = await user_repo.find_by_email("user@example.com")

        # Create 5 notifications
        for i in range(5):
            notification = Notification(
                user_id=user.id,
                type=NotificationType.POLL_STARTED,
                title=f"Notification {i}",
                body=f"Body {i}",
                is_read=False,
            )
            db_session.add(notification)
        await db_session.commit()

        # Get notifications with limit
        response = await client.get(
            "/notifications?limit=2",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 2

    @pytest.mark.asyncio
    async def test_get_notifications_unauthorized(self, client: AsyncClient) -> None:
        """Test GET /notifications without authentication."""
        response = await client.get("/notifications")

        # FastAPI returns 422 for missing required dependencies
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @pytest.mark.asyncio
    async def test_get_unread_count(self, client: AsyncClient, db_session: AsyncSession) -> None:
        """Test GET /notifications/unread-count endpoint."""
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

        # Get user from DB
        user_repo = UserRepository(db_session)
        user = await user_repo.find_by_email("user@example.com")

        # Create unread and read notifications
        unread1 = Notification(
            user_id=user.id,
            type=NotificationType.POLL_STARTED,
            title="Unread 1",
            body="Body 1",
            is_read=False,
        )
        unread2 = Notification(
            user_id=user.id,
            type=NotificationType.POLL_STARTED,
            title="Unread 2",
            body="Body 2",
            is_read=False,
        )
        read = Notification(
            user_id=user.id,
            type=NotificationType.VOTE_RECEIVED,
            title="Read",
            body="Read body",
            is_read=True,
        )
        db_session.add_all([unread1, unread2, read])
        await db_session.commit()

        # Get unread count
        response = await client.get(
            "/notifications/unread-count",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["count"] == 2

    @pytest.mark.asyncio
    async def test_mark_as_read(self, client: AsyncClient, db_session: AsyncSession) -> None:
        """Test PUT /notifications/{id}/read endpoint."""
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

        # Get user from DB
        user_repo = UserRepository(db_session)
        user = await user_repo.find_by_email("user@example.com")

        # Create notification
        notification = Notification(
            user_id=user.id,
            type=NotificationType.POLL_STARTED,
            title="Test",
            body="Test body",
            is_read=False,
        )
        db_session.add(notification)
        await db_session.commit()
        await db_session.refresh(notification)

        # Mark as read
        response = await client.put(
            f"/notifications/{notification.id}/read",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["message"] == "Notification marked as read"

        # Verify notification is read
        await db_session.refresh(notification)
        assert notification.is_read is True

    @pytest.mark.asyncio
    async def test_mark_all_as_read(self, client: AsyncClient, db_session: AsyncSession) -> None:
        """Test PUT /notifications/read-all endpoint."""
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

        # Get user from DB
        user_repo = UserRepository(db_session)
        user = await user_repo.find_by_email("user@example.com")

        # Create unread notifications
        for i in range(3):
            notification = Notification(
                user_id=user.id,
                type=NotificationType.POLL_STARTED,
                title=f"Notification {i}",
                body=f"Body {i}",
                is_read=False,
            )
            db_session.add(notification)
        await db_session.commit()

        # Mark all as read
        response = await client.put(
            "/notifications/read-all",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["message"] == "All notifications marked as read"

        # Verify unread count is 0
        count_response = await client.get(
            "/notifications/unread-count",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert count_response.json()["count"] == 0

    @pytest.mark.asyncio
    async def test_mark_as_read_not_found(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        """Test marking non-existent notification as read."""
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

        # Try to mark non-existent notification as read
        import uuid

        fake_id = uuid.uuid4()
        response = await client.put(
            f"/notifications/{fake_id}/read",
            headers={"Authorization": f"Bearer {token}"},
        )

        # Should succeed (idempotent operation)
        assert response.status_code == status.HTTP_200_OK
