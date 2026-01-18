"""Subscription module repository."""

from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.subscription.models import WebhookEvent
from app.modules.subscription.schemas import WebhookEventCreate


class WebhookEventRepository:
    """Repository for WebhookEvent database operations."""

    def __init__(self, session: AsyncSession) -> None:
        """Initialize repository with database session.

        Args:
            session: Async database session
        """
        self.session = session

    async def exists_by_event_id(self, event_id: str) -> bool:
        """Check if an event with the given ID has already been processed.

        Args:
            event_id: RevenueCat event ID

        Returns:
            True if event exists, False otherwise
        """
        result = await self.session.execute(
            select(WebhookEvent.id).where(WebhookEvent.event_id == event_id).limit(1)
        )
        return result.scalar_one_or_none() is not None

    async def create(self, event_data: WebhookEventCreate) -> WebhookEvent:
        """Create a new webhook event log.

        Args:
            event_data: Webhook event data

        Returns:
            Created WebhookEvent instance
        """
        webhook_event = WebhookEvent(
            event_id=event_data.event_id,
            event_type=event_data.event_type,
            app_user_id=event_data.app_user_id,
            processed_at=datetime.now(UTC),
        )
        self.session.add(webhook_event)
        await self.session.flush()
        await self.session.refresh(webhook_event)
        return webhook_event

    async def find_by_event_id(self, event_id: str) -> WebhookEvent | None:
        """Find a webhook event by its event ID.

        Args:
            event_id: RevenueCat event ID

        Returns:
            WebhookEvent if found, None otherwise
        """
        result = await self.session.execute(
            select(WebhookEvent).where(WebhookEvent.event_id == event_id)
        )
        return result.scalar_one_or_none()
