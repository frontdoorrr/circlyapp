"""Subscription module service."""

import logging
import uuid

from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.models import User
from app.modules.subscription.repository import WebhookEventRepository
from app.modules.subscription.schemas import (
    RevenueCatWebhookPayload,
    WebhookEventCreate,
)

logger = logging.getLogger(__name__)

ORB_MODE_ENTITLEMENT = "orb_mode"

# Event types that activate Orb Mode
ACTIVATION_EVENTS = {
    "INITIAL_PURCHASE",
    "RENEWAL",
    "UNCANCELLATION",
    "NON_RENEWING_PURCHASE",
    "SUBSCRIPTION_EXTENDED",
}

# Event types that deactivate Orb Mode
DEACTIVATION_EVENTS = {
    "EXPIRATION",
    "BILLING_ISSUE",
}

# Event types to ignore (informational only)
IGNORED_EVENTS = {
    "CANCELLATION",  # User cancelled but still has access until expiration
    "PRODUCT_CHANGE",
    "TRANSFER",
    "SUBSCRIBER_ALIAS",
}


class SubscriptionService:
    """Service for handling RevenueCat subscription webhooks."""

    def __init__(
        self,
        session: AsyncSession,
        webhook_repo: WebhookEventRepository,
    ) -> None:
        """Initialize service with dependencies.

        Args:
            session: Database session for direct user updates
            webhook_repo: Repository for webhook event logs
        """
        self.session = session
        self.webhook_repo = webhook_repo

    async def process_webhook(self, payload: RevenueCatWebhookPayload) -> bool:
        """Process a RevenueCat webhook event.

        Args:
            payload: Webhook payload from RevenueCat

        Returns:
            True if event was processed, False if it was a duplicate or ignored
        """
        event = payload.event
        event_id = event.id
        event_type = event.type
        app_user_id = event.app_user_id
        entitlement_ids = event.entitlement_ids or []

        logger.info(
            "Processing webhook event: id=%s, type=%s, user=%s",
            event_id,
            event_type,
            app_user_id,
        )

        # 1. Idempotency check - skip if already processed
        if await self.webhook_repo.exists_by_event_id(event_id):
            logger.info("Duplicate event skipped: %s", event_id)
            return False

        # 2. Only Orb Mode entitlement events may change Orb Mode access.
        if ORB_MODE_ENTITLEMENT not in entitlement_ids:
            logger.info(
                "Ignoring non-Orb entitlement event: id=%s, entitlements=%s",
                event_id,
                entitlement_ids,
            )

        elif event_type in ACTIVATION_EVENTS:
            await self._update_orb_mode(app_user_id, enabled=True)
            logger.info("Orb Mode activated for user: %s", app_user_id)

        elif event_type in DEACTIVATION_EVENTS:
            await self._update_orb_mode(app_user_id, enabled=False)
            logger.info("Orb Mode deactivated for user: %s", app_user_id)

        elif event_type in IGNORED_EVENTS:
            logger.info("Ignored event type: %s", event_type)

        else:
            logger.warning("Unknown event type: %s", event_type)

        # 3. Log the webhook event for idempotency
        await self.webhook_repo.create(
            WebhookEventCreate(
                event_id=event_id,
                event_type=event_type,
                app_user_id=app_user_id,
            )
        )

        return True

    async def _update_orb_mode(self, app_user_id: str, *, enabled: bool) -> None:
        """Update user's Orb Mode status.

        Args:
            app_user_id: User's ID (as string, from RevenueCat)
            enabled: Whether to enable or disable Orb Mode
        """
        try:
            user_uuid = uuid.UUID(app_user_id)
        except ValueError:
            logger.error("Invalid user ID format: %s", app_user_id)
            return

        # Direct update using SQLAlchemy
        stmt = update(User).where(User.id == user_uuid).values(is_orb_mode=enabled)
        result = await self.session.execute(stmt)

        if result.rowcount == 0:
            logger.warning("User not found for Orb Mode update: %s", app_user_id)
        else:
            logger.info(
                "User %s Orb Mode updated to: %s",
                app_user_id,
                enabled,
            )
