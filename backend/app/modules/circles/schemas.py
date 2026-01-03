"""Pydantic schemas for circles module."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.core.enums import MemberRole


class CircleCreate(BaseModel):
    """Schema for creating a new circle."""

    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = Field(None, max_length=1000)
    max_members: int = Field(50, ge=2, le=100)


class CircleUpdate(BaseModel):
    """Schema for updating circle."""

    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = Field(None, max_length=1000)
    max_members: int | None = Field(None, ge=2, le=100)


class CircleResponse(BaseModel):
    """Schema for circle response."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str | None
    invite_code: str
    invite_link_id: uuid.UUID | None
    owner_id: uuid.UUID
    max_members: int
    member_count: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class MemberInfo(BaseModel):
    """Schema for circle member information."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    role: MemberRole
    nickname: str | None
    joined_at: datetime
    # User basic info (from relationship)
    username: str | None = None
    display_name: str | None = None
    profile_emoji: str = "👤"


class CircleDetail(BaseModel):
    """Schema for detailed circle information including members."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str | None
    invite_code: str
    invite_link_id: uuid.UUID | None
    owner_id: uuid.UUID
    max_members: int
    member_count: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    # Members list
    members: list[MemberInfo] = []


class JoinByCodeRequest(BaseModel):
    """Schema for joining circle by invite code."""

    invite_code: str = Field(..., min_length=6, max_length=6, pattern="^[A-Z0-9]+$")
    nickname: str | None = Field(None, min_length=1, max_length=50)


class JoinByLinkRequest(BaseModel):
    """Schema for joining circle by invite link."""

    invite_link_id: uuid.UUID
    nickname: str | None = Field(None, min_length=1, max_length=50)


class RegenerateInviteCodeResponse(BaseModel):
    """Schema for regenerate invite code response."""

    invite_code: str
    message: str = "Invite code regenerated successfully"


class ValidateInviteCodeResponse(BaseModel):
    """Schema for validate invite code response."""

    valid: bool
    circle_name: str | None = None
    circle_id: uuid.UUID | None = None
    member_count: int | None = None
    max_members: int | None = None
    message: str | None = None


# ==================== Admin Schemas ====================


class CircleListResponse(BaseModel):
    """Schema for paginated circle list response (Admin)."""

    items: list[CircleResponse]
    total: int
    limit: int
    offset: int


class UpdateCircleStatusRequest(BaseModel):
    """Schema for updating circle status (Admin)."""

    is_active: bool
