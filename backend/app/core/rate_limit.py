"""Rate limiting configuration and utilities.

Rate limits as defined in DSL.md:
- API general: 100 req/min per user
- Vote: 10 req/min per user
- Create poll: 5 req/hour per user
"""

from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request


def get_user_identifier(request: Request) -> str:
    """Get user identifier for rate limiting.

    Uses user ID from JWT token if authenticated, otherwise falls back to IP address.
    """
    # Try to get user from request state (set by auth dependency)
    if hasattr(request.state, "user") and request.state.user:
        return f"user:{request.state.user.id}"

    # Try to get from Authorization header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        # Use token hash as identifier (not the full token for security)
        token = auth_header[7:]
        return f"token:{hash(token)}"

    # Fall back to IP address for unauthenticated requests
    return get_remote_address(request)


# Create limiter instance
limiter = Limiter(key_func=get_user_identifier)

# Rate limit decorators for specific endpoints
# Usage: @limiter.limit("10/minute")
# DSL.md defines:
# - api_general: "100 req/min per user"
# - vote: "10 req/min per user"
# - create_poll: "5 req/hour per user"

RATE_LIMIT_GENERAL = "100/minute"
RATE_LIMIT_VOTE = "10/minute"
RATE_LIMIT_CREATE_POLL = "5/hour"
RATE_LIMIT_AUTH = "20/minute"  # For login/register endpoints
