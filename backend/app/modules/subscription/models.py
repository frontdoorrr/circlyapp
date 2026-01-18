"""Subscription module models."""

from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.models import Base, UUIDMixin


class WebhookEvent(UUIDMixin, Base):
    """Webhook event log for idempotency.

    Stores processed RevenueCat webhook events to prevent duplicate processing.

    Attributes:
        id: UUID primary key
        event_id: RevenueCat event ID (unique identifier for idempotency)
        event_type: Event type (INITIAL_PURCHASE, RENEWAL, EXPIRATION, etc.)
        app_user_id: RevenueCat app_user_id (maps to User.id)
        processed_at: Timestamp when the event was processed
    """

    __tablename__ = "webhook_events"

    event_id: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
        comment="RevenueCat event ID for idempotency",
    )
    event_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="Event type: INITIAL_PURCHASE, RENEWAL, EXPIRATION, etc.",
    )
    app_user_id: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
        comment="RevenueCat app_user_id (maps to User.id)",
    )
    processed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        comment="Timestamp when the event was processed",
    )

    def __repr__(self) -> str:
        return f"<WebhookEvent(id={self.id}, event_id={self.event_id}, type={self.event_type})>"
