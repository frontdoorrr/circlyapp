"""Subscription module router for RevenueCat webhook handling."""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.deps import get_db
from app.modules.subscription.repository import WebhookEventRepository
from app.modules.subscription.schemas import RevenueCatWebhookPayload, WebhookResponse
from app.modules.subscription.service import SubscriptionService

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Webhooks"])


def get_subscription_service(
    db: AsyncSession = Depends(get_db),
) -> SubscriptionService:
    """Create SubscriptionService with dependencies."""
    return SubscriptionService(
        session=db,
        webhook_repo=WebhookEventRepository(db),
    )


SubscriptionServiceDep = Annotated[SubscriptionService, Depends(get_subscription_service)]


def verify_webhook_secret(authorization: str | None) -> bool:
    """Verify the webhook authorization header.

    RevenueCat sends the webhook secret in the Authorization header
    as "Bearer <secret>".

    Args:
        authorization: Authorization header value

    Returns:
        True if valid, False otherwise
    """
    settings = get_settings()

    if not settings.revenuecat_webhook_secret:
        # In development, allow if no secret is configured
        if settings.is_development:
            logger.warning("Webhook secret not configured, skipping verification in dev")
            return True
        return False

    if not authorization:
        return False

    # Parse "Bearer <token>" format
    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return False

    token = parts[1]
    return token == settings.revenuecat_webhook_secret


@router.post(
    "/webhooks/revenuecat",
    response_model=WebhookResponse,
    status_code=status.HTTP_200_OK,
    summary="Handle RevenueCat webhook",
    description="Receives and processes subscription events from RevenueCat.",
    responses={
        200: {"description": "Webhook processed successfully"},
        401: {"description": "Invalid webhook secret"},
        422: {"description": "Invalid payload"},
    },
)
async def handle_revenuecat_webhook(
    request: Request,
    payload: RevenueCatWebhookPayload,
    service: SubscriptionServiceDep,
) -> WebhookResponse:
    """Handle RevenueCat webhook events.

    This endpoint receives subscription events from RevenueCat and updates
    the user's Orb Mode status accordingly.

    Event types that activate Orb Mode:
    - INITIAL_PURCHASE: New subscription
    - RENEWAL: Subscription renewed
    - UNCANCELLATION: User resubscribed

    Event types that deactivate Orb Mode:
    - EXPIRATION: Subscription expired
    - BILLING_ISSUE: Payment failed

    Returns 200 OK to acknowledge receipt (required by RevenueCat).
    """
    # 1. Verify webhook secret
    authorization = request.headers.get("Authorization")
    if not verify_webhook_secret(authorization):
        logger.warning(
            "Invalid webhook secret received for event: %s",
            payload.event.id,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid webhook secret",
        )

    # 2. Process the event
    try:
        processed = await service.process_webhook(payload)

        if processed:
            return WebhookResponse(
                success=True,
                message=f"Event {payload.event.type} processed successfully",
            )
        else:
            return WebhookResponse(
                success=True,
                message="Duplicate event skipped",
            )

    except Exception as e:
        # Log error but return 200 to prevent RevenueCat from retrying
        # (we've already logged the event, so we don't want duplicates)
        logger.exception(
            "Error processing webhook event %s: %s",
            payload.event.id,
            str(e),
        )
        return WebhookResponse(
            success=False,
            message="Error processing event, but acknowledged",
        )
