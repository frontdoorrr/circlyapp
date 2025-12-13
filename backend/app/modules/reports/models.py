"""Report model."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import ENUM, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import ReportReason, ReportStatus, ReportTargetType
from app.core.models import Base, UUIDMixin


class Report(UUIDMixin, Base):
    """Report model.

    Attributes:
        id: UUID primary key
        reporter_id: Foreign key to users table (who reported)
        target_type: Type of reported entity (USER, CIRCLE, POLL)
        target_id: UUID of the reported entity
        reason: Report reason (INAPPROPRIATE, SPAM, HARASSMENT, OTHER)
        description: Additional description
        status: Report status (PENDING, REVIEWED, RESOLVED, DISMISSED)
        reviewed_by: Foreign key to users table (admin who reviewed)
        reviewed_at: Timestamp when reviewed
        created_at: Timestamp when created
    """

    __tablename__ = "reports"

    reporter_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    target_type: Mapped[ReportTargetType] = mapped_column(
        ENUM(ReportTargetType, name="report_target_type", create_type=False),
        nullable=False,
    )
    target_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )
    reason: Mapped[ReportReason] = mapped_column(
        ENUM(ReportReason, name="report_reason", create_type=False),
        nullable=False,
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    status: Mapped[ReportStatus] = mapped_column(
        ENUM(ReportStatus, name="report_status", create_type=False),
        nullable=False,
        default=ReportStatus.PENDING,
        server_default=ReportStatus.PENDING.value,
    )
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    reporter: Mapped["User"] = relationship(  # noqa: F821
        "User",
        foreign_keys=[reporter_id],
        back_populates="reports_submitted",
    )
    reviewer: Mapped["User | None"] = relationship(  # noqa: F821
        "User",
        foreign_keys=[reviewed_by],
        back_populates="reports_reviewed",
    )

    def __repr__(self) -> str:
        return f"<Report(id={self.id}, target_type={self.target_type}, status={self.status})>"
