"""Core module containing shared utilities and configurations."""

from app.core.database import get_db
from app.core.exceptions import (
    AlreadyExistsError,
    AuthenticationError,
    AuthorizationError,
    CirclyError,
    NotFoundError,
    ValidationError,
)
from app.core.responses import ErrorResponse, SuccessResponse

__all__ = [
    "get_db",
    "CirclyError",
    "NotFoundError",
    "AlreadyExistsError",
    "AuthenticationError",
    "AuthorizationError",
    "ValidationError",
    "SuccessResponse",
    "ErrorResponse",
]
