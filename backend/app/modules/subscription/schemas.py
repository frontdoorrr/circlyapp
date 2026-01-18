"""Subscription module Pydantic schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class RevenueCatSubscriberInfo(BaseModel):
    """Subscriber information from RevenueCat webhook."""

    original_app_user_id: str | None = None
    aliases: list[str] = Field(default_factory=list)


class RevenueCatEvent(BaseModel):
    """RevenueCat webhook event payload.

    Reference: https://www.revenuecat.com/docs/integrations/webhooks
    """

    id: str = Field(..., description="Unique event ID for idempotency")
    type: str = Field(
        ...,
        description="Event type: INITIAL_PURCHASE, RENEWAL, EXPIRATION, CANCELLATION, etc.",
    )
    app_user_id: str = Field(..., description="App user ID (maps to our User.id)")
    product_id: str | None = Field(
        None, description="Product ID: orb_mode_monthly, orb_mode_annual"
    )
    entitlement_ids: list[str] | None = Field(
        None, description="Entitlement IDs: ['orb_mode']"
    )
    store: str | None = Field(None, description="Store: APP_STORE, PLAY_STORE")
    environment: str | None = Field(None, description="Environment: SANDBOX, PRODUCTION")
    presented_offering_id: str | None = None
    period_type: str | None = Field(None, description="Period type: NORMAL, TRIAL, INTRO")
    purchased_at_ms: int | None = Field(None, description="Purchase timestamp in ms")
    expiration_at_ms: int | None = Field(None, description="Expiration timestamp in ms")
    subscriber_attributes: dict | None = None
    transaction_id: str | None = None
    original_transaction_id: str | None = None
    is_family_share: bool | None = None
    country_code: str | None = None
    currency: str | None = None
    price: float | None = None
    price_in_purchased_currency: float | None = None
    tax_percentage: float | None = None
    commission_percentage: float | None = None


class RevenueCatWebhookPayload(BaseModel):
    """RevenueCat webhook payload structure."""

    api_version: str = Field(..., description="API version")
    event: RevenueCatEvent = Field(..., description="Event data")


class WebhookEventCreate(BaseModel):
    """Schema for creating a webhook event log."""

    event_id: str
    event_type: str
    app_user_id: str


class WebhookEventResponse(BaseModel):
    """Schema for webhook event response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    event_id: str
    event_type: str
    app_user_id: str
    processed_at: datetime


class WebhookResponse(BaseModel):
    """Response schema for webhook endpoint."""

    success: bool = True
    message: str = "Webhook processed successfully"
