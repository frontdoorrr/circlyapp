"""SQLAlchemy base model and mixins."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, declared_attr, mapped_column

from app.core.database import Base


class TimestampMixin:
    """Mixin that adds created_at and updated_at columns."""

    @declared_attr
    def created_at(cls) -> Mapped[datetime]:
        return mapped_column(
            DateTime(timezone=True),
            server_default=func.now(),
            nullable=False,
        )

    @declared_attr
    def updated_at(cls) -> Mapped[datetime]:
        return mapped_column(
            DateTime(timezone=True),
            server_default=func.now(),
            onupdate=func.now(),
            nullable=False,
        )


class UUIDMixin:
    """Mixin that adds UUID primary key."""

    @declared_attr
    def id(cls) -> Mapped[uuid.UUID]:
        return mapped_column(
            UUID(as_uuid=True),
            primary_key=True,
            default=uuid.uuid4,
            nullable=False,
        )


class BaseModel(UUIDMixin, TimestampMixin, Base):
    """Base model with UUID primary key and timestamps.

    Use this as the base class for models that need both
    UUID primary key and created_at/updated_at timestamps.
    """

    __abstract__ = True


class BaseModelNoTimestamp(UUIDMixin, Base):
    """Base model with UUID primary key only.

    Use this for models that don't need updated_at
    (e.g., votes, poll_results).
    """

    __abstract__ = True


# Re-export Base for convenience
__all__ = [
    "Base",
    "BaseModel",
    "BaseModelNoTimestamp",
    "TimestampMixin",
    "UUIDMixin",
]
