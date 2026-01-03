"""Supabase client and JWT verification utilities."""

from functools import lru_cache
from typing import Any

import jwt
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


def verify_supabase_token(token: str) -> dict[str, Any] | None:
    """Verify Supabase JWT token and return payload.

    Uses HS256 algorithm with Supabase JWT secret.

    Args:
        token: JWT access token from Supabase

    Returns:
        Token payload if valid, None otherwise
    """
    settings = get_settings()

    if not settings.supabase_jwt_secret:
        print("[JWT] Warning: supabase_jwt_secret not configured")
        return None

    # Debug: decode without verification to see token contents
    try:
        unverified = jwt.decode(token, options={"verify_signature": False})
        expected_issuer = f"{settings.supabase_url}/auth/v1"
        print(f"[JWT] Token issuer: {unverified.get('iss')}")
        print(f"[JWT] Expected issuer: {expected_issuer}")
        print(f"[JWT] Token audience: {unverified.get('aud')}")
    except Exception as e:
        print(f"[JWT] Failed to decode token for debugging: {e}")

    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
            issuer=f"{settings.supabase_url}/auth/v1",
            leeway=60,  # Allow 60 seconds clock skew
        )
        print("[JWT] Token verified successfully")
        return payload
    except jwt.exceptions.ExpiredSignatureError:
        print("[JWT] Token expired")
        return None
    except jwt.exceptions.InvalidAudienceError as e:
        print(f"[JWT] Invalid audience: {e}")
        return None
    except jwt.exceptions.InvalidIssuerError as e:
        print(f"[JWT] Invalid issuer: {e}")
        return None
    except jwt.exceptions.InvalidSignatureError:
        print("[JWT] Invalid signature - check SUPABASE_JWT_SECRET")
        return None
    except jwt.exceptions.PyJWTError as e:
        print(f"[JWT] Verification failed: {e}")
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
