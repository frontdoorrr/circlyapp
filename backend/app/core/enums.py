"""Database enum types for the application."""

from enum import Enum


class UserRole(str, Enum):
    """User role enum."""

    USER = "USER"
    ADMIN = "ADMIN"


class MemberRole(str, Enum):
    """Circle member role enum."""

    OWNER = "OWNER"
    ADMIN = "ADMIN"
    MEMBER = "MEMBER"


class TemplateCategory(str, Enum):
    """Poll template category enum."""

    APPEARANCE = "APPEARANCE"
    PERSONALITY = "PERSONALITY"
    TALENT = "TALENT"
    SPECIAL = "SPECIAL"


class PollStatus(str, Enum):
    """Poll status enum."""

    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class NotificationType(str, Enum):
    """Notification type enum."""

    POLL_STARTED = "POLL_STARTED"
    POLL_REMINDER = "POLL_REMINDER"
    POLL_ENDED = "POLL_ENDED"
    VOTE_RECEIVED = "VOTE_RECEIVED"
    CIRCLE_INVITE = "CIRCLE_INVITE"


class ReportTargetType(str, Enum):
    """Report target type enum."""

    USER = "USER"
    CIRCLE = "CIRCLE"
    POLL = "POLL"


class ReportReason(str, Enum):
    """Report reason enum."""

    INAPPROPRIATE = "INAPPROPRIATE"
    SPAM = "SPAM"
    HARASSMENT = "HARASSMENT"
    OTHER = "OTHER"


class ReportStatus(str, Enum):
    """Report status enum."""

    PENDING = "PENDING"
    REVIEWED = "REVIEWED"
    RESOLVED = "RESOLVED"
    DISMISSED = "DISMISSED"
