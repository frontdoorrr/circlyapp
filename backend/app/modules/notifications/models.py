"""Notification model."""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import ENUM, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import NotificationType
from app.core.models import Base, UUIDMixin

if TYPE_CHECKING:
    from app.modules.auth.models import User


class BroadcastLog(UUIDMixin, Base):
    """Broadcast notification log model for admin tracking.

    Attributes:
        id: UUID primary key
        admin_id: Foreign key to users table (admin who sent)
        title: Broadcast title
        body: Broadcast body text
        target_count: Number of users targeted
        sent_count: Number of notifications actually sent
        created_at: Timestamp when broadcast was sent
    """

    __tablename__ = "broadcast_logs"

    admin_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    title: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    body: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    target_count: Mapped[int] = mapped_column(
        nullable=False,
        default=0,
    )
    sent_count: Mapped[int] = mapped_column(
        nullable=False,
        default=0,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    admin: Mapped["User | None"] = relationship(  # noqa: F821
        "User",
        foreign_keys=[admin_id],
    )

    def __repr__(self) -> str:
        return f"<BroadcastLog(id={self.id}, title={self.title}, sent_count={self.sent_count})>"


class Notification(UUIDMixin, Base):
    """Notification model.

    Attributes:
        id: UUID primary key
        user_id: Foreign key to users table
        type: Notification type (POLL_STARTED, POLL_REMINDER, etc.)
        title: Notification title
        body: Notification body text
        data: Additional JSON data (poll_id, circle_id, etc.)
        is_read: Whether the notification has been read
        sent_at: Timestamp when notification was sent
        created_at: Timestamp when created
    """

    __tablename__ = "notifications"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    type: Mapped[NotificationType] = mapped_column(
        ENUM(NotificationType, name="notification_type", create_type=True),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    body: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    data: Mapped[dict[str, Any] | None] = mapped_column(
        JSONB,
        nullable=True,
    )
    is_read: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )
    sent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship(  # noqa: F821
        "User",
        back_populates="notifications",
    )

    def __repr__(self) -> str:
        return f"<Notification(id={self.id}, type={self.type}, is_read={self.is_read})>"
