"""Security utilities for JWT and password hashing."""

import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

import bcrypt
from jose import JWTError, jwt

from app.config import get_settings


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    password_bytes = plain_password.encode("utf-8")
    hashed_bytes = hashed_password.encode("utf-8")
    return bcrypt.checkpw(password_bytes, hashed_bytes)


def create_access_token(
    subject: UUID | str,
    expires_delta: timedelta | None = None,
    extra_data: dict[str, Any] | None = None,
) -> str:
    """Create a JWT access token."""
    settings = get_settings()

    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(minutes=settings.jwt_access_token_expire_minutes)

    to_encode: dict[str, Any] = {
        "sub": str(subject),
        "exp": expire,
        "iat": datetime.now(UTC),
    }

    if extra_data:
        to_encode.update(extra_data)

    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.jwt_algorithm)


def verify_token(token: str) -> dict[str, Any] | None:
    """Verify and decode a JWT token."""
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
        return payload
    except JWTError:
        return None


def generate_voter_hash(voter_id: UUID, poll_id: UUID, salt: str | None = None) -> str:
    """
    Generate anonymous voter hash for vote anonymity.

    Uses SHA-256(voter_id + poll_id + salt) to create a one-way hash
    that prevents voter identity tracking while detecting duplicate votes.
    """
    if salt is None:
        salt = secrets.token_hex(16)

    data = f"{voter_id}{poll_id}{salt}"
    return hashlib.sha256(data.encode()).hexdigest()


def generate_invite_code(length: int = 6) -> str:
    """Generate a random alphanumeric invite code."""
    # Use uppercase letters and digits, excluding confusing characters (0, O, I, 1, L)
    alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
    return "".join(secrets.choice(alphabet) for _ in range(length))
