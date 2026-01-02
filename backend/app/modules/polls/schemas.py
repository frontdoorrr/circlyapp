"""Pydantic schemas for polls module."""

import uuid
from datetime import datetime
from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, ConfigDict

from app.core.enums import PollStatus, TemplateCategory


class PollDuration(str, Enum):
    """Poll duration options."""

    ONE_HOUR = "1H"
    THREE_HOURS = "3H"
    SIX_HOURS = "6H"
    TWENTY_FOUR_HOURS = "24H"


class PollTemplateResponse(BaseModel):
    """Schema for poll template response."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    category: TemplateCategory
    question_text: str
    emoji: str | None
    usage_count: int


class PollCreate(BaseModel):
    """Schema for creating a new poll."""

    template_id: uuid.UUID
    duration: PollDuration


class PollResponse(BaseModel):
    """Schema for poll response."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    circle_id: uuid.UUID
    template_id: uuid.UUID | None
    creator_id: uuid.UUID
    question_text: str
    status: PollStatus
    ends_at: datetime
    vote_count: int
    created_at: datetime
    updated_at: datetime


class VoteOption(BaseModel):
    """Schema for vote option (circle member)."""

    user_id: uuid.UUID
    nickname: str | None
    profile_emoji: str


class PollResultItem(BaseModel):
    """Schema for poll result item."""

    user_id: uuid.UUID
    nickname: str | None
    profile_emoji: str
    vote_count: int
    vote_percentage: Decimal
    rank: int | None


class PollDetail(BaseModel):
    """Schema for detailed poll information."""

    poll: PollResponse
    template: PollTemplateResponse | None
    options: list[VoteOption]  # Circle members (excluding poll creator)
    has_voted: bool
    results: list[PollResultItem] | None = None  # Only after voting or poll ended
    time_remaining: int  # seconds


class PollListItem(BaseModel):
    """Schema for poll list item."""

    id: uuid.UUID
    question_text: str
    emoji: str | None
    status: PollStatus
    vote_count: int
    ends_at: datetime
    has_voted: bool


class VoteRequest(BaseModel):
    """Schema for voting request."""

    voted_for_id: uuid.UUID


class VoteResponse(BaseModel):
    """Schema for vote response."""

    success: bool
    results: list[PollResultItem]
    message: str


class CategoryInfo(BaseModel):
    """Schema for template category information."""

    category: TemplateCategory
    emoji: str
    title: str
    question_count: int


# Category metadata mapping
CATEGORY_METADATA: dict[TemplateCategory, dict[str, str]] = {
    TemplateCategory.PERSONALITY: {
        "emoji": "😊",
        "title": "성격 관련",
    },
    TemplateCategory.APPEARANCE: {
        "emoji": "✨",
        "title": "외모 관련",
    },
    TemplateCategory.SPECIAL: {
        "emoji": "🎉",
        "title": "특별한 날",
    },
    TemplateCategory.TALENT: {
        "emoji": "🏆",
        "title": "능력 관련",
    },
}
