"""Supabase client and JWT verification utilities."""

from functools import lru_cache
from typing import Any

import jwt
from jwt import PyJWKClient
from supabase import Client, create_client

from app.config import get_settings


@lru_cache
def get_supabase_client() -> Client:
    """Get cached Supabase client for user authentication.

    Uses anon key for user-facing auth operations (sign_up, sign_in).
    """
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_anon_key)


@lru_cache
def get_supabase_admin_client() -> Client:
    """Get cached Supabase admin client.

    Uses service role key for admin operations (bypasses RLS).
    """
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


@lru_cache
def get_jwks_client() -> PyJWKClient:
    """Get cached JWKS client for Supabase JWT verification."""
    settings = get_settings()
    jwks_url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
    return PyJWKClient(jwks_url)


def verify_supabase_token(token: str) -> dict[str, Any] | None:
    """Verify Supabase JWT token and return payload.

    Args:
        token: JWT access token from Supabase

    Returns:
        Token payload if valid, None otherwise
    """
    settings = get_settings()

    try:
        jwks_client = get_jwks_client()
        signing_key = jwks_client.get_signing_key_from_jwt(token)

        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience="authenticated",
            issuer=f"{settings.supabase_url}/auth/v1",
        )
        return payload
    except jwt.exceptions.PyJWTError:
        return None


def get_supabase_user_id_from_token(token: str) -> str | None:
    """Extract Supabase user ID from token.

    Args:
        token: JWT access token from Supabase

    Returns:
        Supabase user ID (sub claim) if valid, None otherwise
    """
    payload = verify_supabase_token(token)
    if payload is None:
        return None
    return payload.get("sub")
