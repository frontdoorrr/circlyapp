"""Security utilities for vote anonymity and invite codes.

Note: JWT authentication is now handled by Supabase Auth.
See app/core/supabase.py for token verification.
"""

import hashlib
import secrets
from uuid import UUID


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
