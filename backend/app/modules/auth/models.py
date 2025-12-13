"""User model for authentication module."""

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, String, Text
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import UserRole
from app.core.models import BaseModel

if TYPE_CHECKING:
    from app.modules.circles.models import Circle, CircleMember
    from app.modules.notifications.models import Notification
    from app.modules.polls.models import Poll, PollResult, Vote
    from app.modules.reports.models import Report


class User(BaseModel):
    """User model.

    Attributes:
        id: UUID primary key (from BaseModel)
        email: Unique email address
        hashed_password: Bcrypt hashed password
        username: Unique username (max 50 chars)
        display_name: Display name (max 100 chars)
        profile_emoji: Profile emoji (default: smile)
        role: User role (USER or ADMIN)
        is_active: Whether the user is active
        push_token: Expo push notification token
        created_at: Timestamp when created (from BaseModel)
        updated_at: Timestamp when last updated (from BaseModel)
    """

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )
    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    username: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )
    display_name: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )
    profile_emoji: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        default="😊",
        server_default="😊",
    )
    role: Mapped[UserRole] = mapped_column(
        ENUM(UserRole, name="user_role", create_type=False),
        nullable=False,
        default=UserRole.USER,
        server_default=UserRole.USER.value,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )
    push_token: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # Relationships
    owned_circles: Mapped[list["Circle"]] = relationship(
        "Circle",
        back_populates="owner",
        foreign_keys="Circle.owner_id",
    )
    memberships: Mapped[list["CircleMember"]] = relationship(
        "CircleMember",
        back_populates="user",
    )
    created_polls: Mapped[list["Poll"]] = relationship(
        "Poll",
        back_populates="creator",
    )
    votes_received: Mapped[list["Vote"]] = relationship(
        "Vote",
        back_populates="voted_for",
    )
    poll_results: Mapped[list["PollResult"]] = relationship(
        "PollResult",
        back_populates="user",
    )
    notifications: Mapped[list["Notification"]] = relationship(
        "Notification",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    reports_submitted: Mapped[list["Report"]] = relationship(
        "Report",
        foreign_keys="Report.reporter_id",
        back_populates="reporter",
    )
    reports_reviewed: Mapped[list["Report"]] = relationship(
        "Report",
        foreign_keys="Report.reviewed_by",
        back_populates="reviewer",
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, username={self.username})>"
