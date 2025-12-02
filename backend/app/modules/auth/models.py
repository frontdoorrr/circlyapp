"""User model for authentication module."""

from sqlalchemy import Boolean, String, Text
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import UserRole
from app.core.models import BaseModel


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

    # Relationships (defined later to avoid circular imports)
    # owned_circles: list["Circle"]
    # memberships: list["CircleMember"]
    # created_polls: list["Poll"]
    # votes_received: list["Vote"]
    # notifications: list["Notification"]

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, username={self.username})>"
