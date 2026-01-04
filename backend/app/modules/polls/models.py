"""Poll, PollTemplate, Vote, and PollResult models."""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import ENUM, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import PollStatus, TemplateCategory
from app.core.models import Base, BaseModel, UUIDMixin

if TYPE_CHECKING:
    from app.modules.auth.models import User
    from app.modules.circles.models import Circle


class PollTemplate(UUIDMixin, Base):
    """Poll template model.

    Attributes:
        id: UUID primary key
        category: Template category (APPEARANCE, PERSONALITY, TALENT, SPECIAL)
        question_text: Template question text
        emoji: Emoji for the template
        is_active: Whether the template is active
        usage_count: Number of times this template has been used
        created_at: Timestamp when created
    """

    __tablename__ = "poll_templates"

    category: Mapped[TemplateCategory] = mapped_column(
        ENUM(TemplateCategory, name="template_category", create_type=True),
        nullable=False,
    )
    question_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    emoji: Mapped[str | None] = mapped_column(
        String(10),
        nullable=True,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )
    usage_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    polls: Mapped[list["Poll"]] = relationship(
        "Poll",
        back_populates="template",
    )

    def __repr__(self) -> str:
        return f"<PollTemplate(id={self.id}, category={self.category})>"


class Poll(BaseModel):
    """Poll model.

    Attributes:
        id: UUID primary key
        circle_id: Foreign key to circles table
        template_id: Foreign key to poll_templates table
        creator_id: Foreign key to users table
        question_text: Poll question text
        status: Poll status (ACTIVE, COMPLETED, CANCELLED)
        ends_at: Timestamp when poll ends
        vote_count: Number of votes
        created_at: Timestamp when created
        updated_at: Timestamp when last updated
    """

    __tablename__ = "polls"

    circle_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("circles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    template_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("poll_templates.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    creator_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    question_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    status: Mapped[PollStatus] = mapped_column(
        ENUM(PollStatus, name="poll_status", create_type=True),
        nullable=False,
        default=PollStatus.ACTIVE,
        server_default=PollStatus.ACTIVE.value,
    )
    ends_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    vote_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    # Relationships
    circle: Mapped["Circle"] = relationship(  # noqa: F821
        "Circle",
        back_populates="polls",
    )
    template: Mapped["PollTemplate | None"] = relationship(
        "PollTemplate",
        back_populates="polls",
    )
    creator: Mapped["User"] = relationship(  # noqa: F821
        "User",
        back_populates="created_polls",
    )
    votes: Mapped[list["Vote"]] = relationship(
        "Vote",
        back_populates="poll",
        cascade="all, delete-orphan",
    )
    results: Mapped[list["PollResult"]] = relationship(
        "PollResult",
        back_populates="poll",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Poll(id={self.id}, status={self.status})>"


class Vote(UUIDMixin, Base):
    """Vote model (with voter_id for Orb Mode feature).

    Attributes:
        id: UUID primary key
        poll_id: Foreign key to polls table
        voter_id: Foreign key to users table (who cast the vote, for Orb Mode)
        voter_hash: SHA-256 hash of voter_id + poll_id + salt (for duplicate prevention)
        voted_for_id: Foreign key to users table (who received the vote)
        created_at: Timestamp when voted
    """

    __tablename__ = "votes"
    __table_args__ = (UniqueConstraint("poll_id", "voter_hash", name="uq_poll_voter"),)

    poll_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("polls.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    voter_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    voter_hash: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
    )
    voted_for_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    poll: Mapped["Poll"] = relationship(
        "Poll",
        back_populates="votes",
    )
    voter: Mapped["User"] = relationship(  # noqa: F821
        "User",
        foreign_keys=[voter_id],
        back_populates="votes_cast",
    )
    voted_for: Mapped["User"] = relationship(  # noqa: F821
        "User",
        foreign_keys=[voted_for_id],
        back_populates="votes_received",
    )

    def __repr__(self) -> str:
        return f"<Vote(poll_id={self.poll_id}, voter_hash={self.voter_hash[:8]}...)>"


class PollResult(UUIDMixin, Base):
    """Poll result model (aggregated).

    Attributes:
        id: UUID primary key
        poll_id: Foreign key to polls table
        user_id: Foreign key to users table
        vote_count: Number of votes received
        vote_percentage: Percentage of total votes
        rank: Rank in the poll results
    """

    __tablename__ = "poll_results"
    __table_args__ = (UniqueConstraint("poll_id", "user_id", name="uq_poll_result"),)

    poll_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("polls.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    vote_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )
    vote_percentage: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
        default=Decimal("0.00"),
        server_default="0.00",
    )
    rank: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    # Relationships
    poll: Mapped["Poll"] = relationship(
        "Poll",
        back_populates="results",
    )
    user: Mapped["User"] = relationship(  # noqa: F821
        "User",
        back_populates="poll_results",
    )

    def __repr__(self) -> str:
        return f"<PollResult(poll_id={self.poll_id}, user_id={self.user_id}, rank={self.rank})>"
