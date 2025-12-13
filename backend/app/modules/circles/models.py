"""Circle and CircleMember models."""

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import ENUM, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import MemberRole
from app.core.models import BaseModel


class Circle(BaseModel):
    """Circle (group) model.

    Attributes:
        id: UUID primary key
        name: Circle name (max 100 chars)
        description: Circle description
        invite_code: 6-character unique invite code
        invite_link_id: UUID for invite link
        owner_id: Foreign key to users table
        max_members: Maximum number of members (default 50)
        member_count: Current number of members
        is_active: Whether the circle is active
        created_at: Timestamp when created
        updated_at: Timestamp when last updated
    """

    __tablename__ = "circles"

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    invite_code: Mapped[str] = mapped_column(
        String(6),
        unique=True,
        nullable=False,
        index=True,
    )
    invite_link_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        unique=True,
        nullable=True,
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    max_members: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=50,
        server_default="50",
    )
    member_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )

    # Relationships
    owner: Mapped["User"] = relationship(  # noqa: F821
        "User",
        back_populates="owned_circles",
        foreign_keys=[owner_id],
    )
    members: Mapped[list["CircleMember"]] = relationship(
        "CircleMember",
        back_populates="circle",
        cascade="all, delete-orphan",
    )
    polls: Mapped[list["Poll"]] = relationship(  # noqa: F821
        "Poll",
        back_populates="circle",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Circle(id={self.id}, name={self.name}, invite_code={self.invite_code})>"


class CircleMember(BaseModel):
    """Circle membership model.

    Attributes:
        id: UUID primary key
        circle_id: Foreign key to circles table
        user_id: Foreign key to users table
        role: Member role (OWNER, ADMIN, MEMBER)
        nickname: Member's nickname in this circle
        joined_at: Timestamp when joined
    """

    __tablename__ = "circle_members"
    __table_args__ = (
        UniqueConstraint("circle_id", "user_id", name="uq_circle_member"),
    )

    # Override created_at/updated_at - we only need joined_at
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    circle_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("circles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role: Mapped[MemberRole] = mapped_column(
        ENUM(MemberRole, name="member_role", create_type=True),
        nullable=False,
        default=MemberRole.MEMBER,
        server_default=MemberRole.MEMBER.value,
    )
    nickname: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    circle: Mapped["Circle"] = relationship(
        "Circle",
        back_populates="members",
    )
    user: Mapped["User"] = relationship(  # noqa: F821
        "User",
        back_populates="memberships",
    )

    def __repr__(self) -> str:
        return f"<CircleMember(circle_id={self.circle_id}, user_id={self.user_id}, role={self.role})>"
