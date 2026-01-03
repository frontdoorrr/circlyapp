"""Pydantic schemas for reports module."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.core.enums import ReportReason, ReportStatus, ReportTargetType


class ReportCreate(BaseModel):
    """Schema for creating a report."""

    target_type: ReportTargetType
    target_id: uuid.UUID
    reason: ReportReason
    description: str | None = Field(None, max_length=1000)


class ReportResponse(BaseModel):
    """Schema for report response."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    reporter_id: uuid.UUID
    target_type: ReportTargetType
    target_id: uuid.UUID
    reason: ReportReason
    description: str | None = None
    status: ReportStatus
    reviewed_by: uuid.UUID | None = None
    reviewed_at: datetime | None = None
    created_at: datetime


class ReportListResponse(BaseModel):
    """Schema for report list response with pagination."""

    items: list[ReportResponse]
    total: int
    has_more: bool


class ReportReview(BaseModel):
    """Schema for reviewing a report (admin only)."""

    status: ReportStatus = Field(..., description="New status after review")
    notes: str | None = Field(None, max_length=500, description="Admin notes")


# ==================== Admin Schemas ====================


class ReportListAdminResponse(BaseModel):
    """Schema for paginated report list response (Admin)."""

    items: list[ReportResponse]
    total: int
    limit: int
    offset: int
