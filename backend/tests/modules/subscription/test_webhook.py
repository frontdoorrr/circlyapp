"""Tests for RevenueCat Webhook handling."""

import uuid

import pytest
from fastapi import status
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import patch

from app.modules.auth.models import User
from app.modules.subscription.models import WebhookEvent
from app.modules.subscription.repository import WebhookEventRepository


class TestRevenueCatWebhook:
    """Tests for RevenueCat webhook endpoint."""

    async def _create_user(self, db_session: AsyncSession) -> str:
        """Helper to create a test user directly in DB and return user_id."""
        user = User(
            id=uuid.uuid4(),
            email=f"subscriber_{uuid.uuid4().hex[:8]}@example.com",
            username=f"subscriber_{uuid.uuid4().hex[:8]}",
            is_orb_mode=False,
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        return str(user.id)

    @pytest.mark.asyncio
    async def test_webhook_initial_purchase_activates_orb_mode(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        """Test INITIAL_PURCHASE event activates Orb Mode."""
        user_id = await self._create_user(db_session)

        # Verify user starts with is_orb_mode=False
        result = await db_session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one()
        assert user.is_orb_mode is False

        # Send webhook with development mode (no secret required)
        with patch("app.modules.subscription.router.get_settings") as mock_settings:
            mock_settings.return_value.revenuecat_webhook_secret = ""
            mock_settings.return_value.is_development = True

            response = await client.post(
                "/webhooks/revenuecat",
                json={
                    "api_version": "1.0",
                    "event": {
                        "id": "evt_initial_001",
                        "type": "INITIAL_PURCHASE",
                        "app_user_id": user_id,
                        "product_id": "orb_mode_monthly",
                        "entitlement_ids": ["orb_mode"],
                    },
                },
            )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True

        # Verify Orb Mode is now activated
        await db_session.refresh(user)
        assert user.is_orb_mode is True

        # Verify webhook event was logged
        webhook_repo = WebhookEventRepository(db_session)
        event = await webhook_repo.find_by_event_id("evt_initial_001")
        assert event is not None
        assert event.event_type == "INITIAL_PURCHASE"

    @pytest.mark.asyncio
    async def test_webhook_renewal_keeps_orb_mode_active(
        self, client: AsyncClient, db_session: AsyncSession, enable_orb_mode_for_user
    ) -> None:
        """Test RENEWAL event keeps Orb Mode active."""
        user_id = await self._create_user(db_session)

        # Enable Orb Mode first
        await enable_orb_mode_for_user(user_id)

        with patch("app.modules.subscription.router.get_settings") as mock_settings:
            mock_settings.return_value.revenuecat_webhook_secret = ""
            mock_settings.return_value.is_development = True

            response = await client.post(
                "/webhooks/revenuecat",
                json={
                    "api_version": "1.0",
                    "event": {
                        "id": f"evt_renewal_{uuid.uuid4().hex[:8]}",
                        "type": "RENEWAL",
                        "app_user_id": user_id,
                        "product_id": "orb_mode_monthly",
                    },
                },
            )

        assert response.status_code == status.HTTP_200_OK

        # Verify Orb Mode is still active
        result = await db_session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one()
        assert user.is_orb_mode is True

    @pytest.mark.asyncio
    async def test_webhook_expiration_deactivates_orb_mode(
        self, client: AsyncClient, db_session: AsyncSession, enable_orb_mode_for_user
    ) -> None:
        """Test EXPIRATION event deactivates Orb Mode."""
        user_id = await self._create_user(db_session)

        # Enable Orb Mode first
        await enable_orb_mode_for_user(user_id)

        # Verify Orb Mode is active
        result = await db_session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one()
        assert user.is_orb_mode is True

        with patch("app.modules.subscription.router.get_settings") as mock_settings:
            mock_settings.return_value.revenuecat_webhook_secret = ""
            mock_settings.return_value.is_development = True

            response = await client.post(
                "/webhooks/revenuecat",
                json={
                    "api_version": "1.0",
                    "event": {
                        "id": f"evt_expiration_{uuid.uuid4().hex[:8]}",
                        "type": "EXPIRATION",
                        "app_user_id": user_id,
                    },
                },
            )

        assert response.status_code == status.HTTP_200_OK

        # Verify Orb Mode is now deactivated
        await db_session.refresh(user)
        assert user.is_orb_mode is False

    @pytest.mark.asyncio
    async def test_webhook_billing_issue_deactivates_orb_mode(
        self, client: AsyncClient, db_session: AsyncSession, enable_orb_mode_for_user
    ) -> None:
        """Test BILLING_ISSUE event deactivates Orb Mode."""
        user_id = await self._create_user(db_session)

        # Enable Orb Mode first
        await enable_orb_mode_for_user(user_id)

        with patch("app.modules.subscription.router.get_settings") as mock_settings:
            mock_settings.return_value.revenuecat_webhook_secret = ""
            mock_settings.return_value.is_development = True

            response = await client.post(
                "/webhooks/revenuecat",
                json={
                    "api_version": "1.0",
                    "event": {
                        "id": f"evt_billing_{uuid.uuid4().hex[:8]}",
                        "type": "BILLING_ISSUE",
                        "app_user_id": user_id,
                    },
                },
            )

        assert response.status_code == status.HTTP_200_OK

        # Verify Orb Mode is deactivated
        result = await db_session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one()
        assert user.is_orb_mode is False

    @pytest.mark.asyncio
    async def test_webhook_idempotency_skips_duplicate(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        """Test duplicate events are skipped (idempotency)."""
        user_id = await self._create_user(db_session)
        event_id = f"evt_duplicate_{uuid.uuid4().hex[:8]}"

        payload = {
            "api_version": "1.0",
            "event": {
                "id": event_id,
                "type": "INITIAL_PURCHASE",
                "app_user_id": user_id,
            },
        }

        with patch("app.modules.subscription.router.get_settings") as mock_settings:
            mock_settings.return_value.revenuecat_webhook_secret = ""
            mock_settings.return_value.is_development = True

            # First request
            response1 = await client.post("/webhooks/revenuecat", json=payload)
            assert response1.status_code == status.HTTP_200_OK
            assert response1.json()["success"] is True
            assert "processed successfully" in response1.json()["message"]

            # Second request with same event_id
            response2 = await client.post("/webhooks/revenuecat", json=payload)
            assert response2.status_code == status.HTTP_200_OK
            assert response2.json()["success"] is True
            assert "Duplicate" in response2.json()["message"]

        # Verify only one event was logged
        result = await db_session.execute(
            select(WebhookEvent).where(WebhookEvent.event_id == event_id)
        )
        events = result.scalars().all()
        assert len(events) == 1

    @pytest.mark.asyncio
    async def test_webhook_cancellation_is_ignored(
        self, client: AsyncClient, db_session: AsyncSession, enable_orb_mode_for_user
    ) -> None:
        """Test CANCELLATION event is ignored (user still has access until expiration)."""
        user_id = await self._create_user(db_session)

        # Enable Orb Mode first
        await enable_orb_mode_for_user(user_id)

        with patch("app.modules.subscription.router.get_settings") as mock_settings:
            mock_settings.return_value.revenuecat_webhook_secret = ""
            mock_settings.return_value.is_development = True

            response = await client.post(
                "/webhooks/revenuecat",
                json={
                    "api_version": "1.0",
                    "event": {
                        "id": f"evt_cancel_{uuid.uuid4().hex[:8]}",
                        "type": "CANCELLATION",
                        "app_user_id": user_id,
                    },
                },
            )

        assert response.status_code == status.HTTP_200_OK

        # Verify Orb Mode is STILL active (cancellation doesn't revoke access)
        result = await db_session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one()
        assert user.is_orb_mode is True

    @pytest.mark.asyncio
    async def test_webhook_invalid_secret_returns_401(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        """Test invalid webhook secret returns 401 Unauthorized."""
        user_id = await self._create_user(db_session)

        with patch("app.modules.subscription.router.get_settings") as mock_settings:
            mock_settings.return_value.revenuecat_webhook_secret = "correct_secret"
            mock_settings.return_value.is_development = False

            response = await client.post(
                "/webhooks/revenuecat",
                headers={"Authorization": "Bearer wrong_secret"},
                json={
                    "api_version": "1.0",
                    "event": {
                        "id": f"evt_unauthorized_{uuid.uuid4().hex[:8]}",
                        "type": "INITIAL_PURCHASE",
                        "app_user_id": user_id,
                    },
                },
            )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.asyncio
    async def test_webhook_missing_authorization_returns_401(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        """Test missing Authorization header returns 401 in production mode."""
        user_id = await self._create_user(db_session)

        with patch("app.modules.subscription.router.get_settings") as mock_settings:
            mock_settings.return_value.revenuecat_webhook_secret = "secret_key"
            mock_settings.return_value.is_development = False

            response = await client.post(
                "/webhooks/revenuecat",
                json={
                    "api_version": "1.0",
                    "event": {
                        "id": f"evt_no_auth_{uuid.uuid4().hex[:8]}",
                        "type": "INITIAL_PURCHASE",
                        "app_user_id": user_id,
                    },
                },
            )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.asyncio
    async def test_webhook_valid_secret_succeeds(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        """Test valid webhook secret succeeds."""
        user_id = await self._create_user(db_session)

        with patch("app.modules.subscription.router.get_settings") as mock_settings:
            mock_settings.return_value.revenuecat_webhook_secret = "correct_secret"
            mock_settings.return_value.is_development = False

            response = await client.post(
                "/webhooks/revenuecat",
                headers={"Authorization": "Bearer correct_secret"},
                json={
                    "api_version": "1.0",
                    "event": {
                        "id": f"evt_valid_auth_{uuid.uuid4().hex[:8]}",
                        "type": "INITIAL_PURCHASE",
                        "app_user_id": user_id,
                    },
                },
            )

        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.asyncio
    async def test_webhook_unknown_user_logs_but_succeeds(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        """Test webhook with unknown user_id still returns 200 (to prevent retries)."""
        with patch("app.modules.subscription.router.get_settings") as mock_settings:
            mock_settings.return_value.revenuecat_webhook_secret = ""
            mock_settings.return_value.is_development = True

            response = await client.post(
                "/webhooks/revenuecat",
                json={
                    "api_version": "1.0",
                    "event": {
                        "id": f"evt_unknown_user_{uuid.uuid4().hex[:8]}",
                        "type": "INITIAL_PURCHASE",
                        "app_user_id": "00000000-0000-0000-0000-000000000000",
                    },
                },
            )

        # Should return 200 to prevent RevenueCat from retrying
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.asyncio
    async def test_webhook_uncancellation_reactivates_orb_mode(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        """Test UNCANCELLATION event reactivates Orb Mode."""
        user_id = await self._create_user(db_session)

        # User starts with is_orb_mode=False
        result = await db_session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one()
        assert user.is_orb_mode is False

        with patch("app.modules.subscription.router.get_settings") as mock_settings:
            mock_settings.return_value.revenuecat_webhook_secret = ""
            mock_settings.return_value.is_development = True

            response = await client.post(
                "/webhooks/revenuecat",
                json={
                    "api_version": "1.0",
                    "event": {
                        "id": f"evt_uncancel_{uuid.uuid4().hex[:8]}",
                        "type": "UNCANCELLATION",
                        "app_user_id": user_id,
                    },
                },
            )

        assert response.status_code == status.HTTP_200_OK

        # Verify Orb Mode is activated
        await db_session.refresh(user)
        assert user.is_orb_mode is True
