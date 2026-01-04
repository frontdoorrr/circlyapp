"""Pydantic schemas for polls module."""

import uuid
from datetime import datetime
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
    # Optional fields populated by service layer
    has_voted: bool | None = None
    results: list["PollResultItem"] | None = None


class VoteOption(BaseModel):
    """투표 선택지 - Circle 멤버 정보.

    용도: 투표 화면에서 "누구에게 투표할지" 선택지로 표시
    사용처: PollDetail.options
    """

    user_id: uuid.UUID
    nickname: str | None
    profile_emoji: str


class VoterInfo(BaseModel):
    """God Mode 투표자 정보 - 나를 선택한 사람.

    용도: God Mode 구독자가 "누가 나를 선택했는지" 조회
    사용처: VoterRevealResponse.voters
    """

    user_id: uuid.UUID
    nickname: str | None
    profile_emoji: str
    voted_at: datetime


class VoterRevealResponse(BaseModel):
    """God Mode API 응답 - 나를 선택한 투표자 목록.

    용도: GET /polls/{id}/voters 엔드포인트 응답
    권한: God Mode 구독자 전용
    """

    poll_id: uuid.UUID
    question_text: str
    voters: list[VoterInfo]


class PollResultItem(BaseModel):
    """Schema for poll result item."""

    user_id: uuid.UUID
    nickname: str | None
    profile_emoji: str
    vote_count: int
    vote_percentage: float  # Decimal → float for JSON serialization
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


# ==================== Admin Schemas ====================


class PollListResponse(BaseModel):
    """Schema for paginated poll list response (Admin)."""

    items: list[PollResponse]
    total: int
    limit: int
    offset: int


class TemplateListResponse(BaseModel):
    """Schema for paginated template list response (Admin)."""

    items: list[PollTemplateResponse]
    total: int
    limit: int
    offset: int


class UpdatePollStatusRequest(BaseModel):
    """Schema for updating poll status (Admin)."""

    status: PollStatus


class TemplateCreate(BaseModel):
    """Schema for creating a new poll template (Admin)."""

    category: TemplateCategory
    question_text: str
    emoji: str | None = None


class TemplateUpdate(BaseModel):
    """Schema for updating a poll template (Admin)."""

    category: TemplateCategory | None = None
    question_text: str | None = None
    emoji: str | None = None
    is_active: bool | None = None
