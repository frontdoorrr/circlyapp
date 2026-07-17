"""Pydantic schemas for polls module."""

import uuid
from datetime import datetime
from enum import Enum
from typing import Literal

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
    # Extended fields for Home Tab (populated by service layer)
    question: str | None = None  # Alias for question_text (for frontend compatibility)
    emoji: str | None = None  # From template
    circle_name: str | None = None  # Circle name
    total_members: int | None = None  # Circle member count
    # Winner info for completed polls
    winner_name: str | None = None
    winner_vote_count: int | None = None


class VoteOption(BaseModel):
    """투표 선택지 - Circle 멤버 정보.

    용도: 투표 화면에서 "누구에게 투표할지" 선택지로 표시
    사용처: PollDetail.options
    """

    user_id: uuid.UUID
    nickname: str | None
    profile_emoji: str


class CandidateOption(VoteOption):
    """서버가 선정한 투표 후보."""

    received_count: int


class PollCandidatesResponse(BaseModel):
    """투표 후보 API 응답."""

    poll_id: uuid.UUID
    status: Literal["READY", "NOT_ENOUGH_CANDIDATES"]
    required_count: int
    candidates: list[CandidateOption]


class VoteSessionCreate(BaseModel):
    """투표 세션 시작 요청."""

    circle_id: uuid.UUID | None = None


class VoteSessionAvailabilityResponse(BaseModel):
    """현재 사용자의 투표 세션 시작 가능 상태."""

    can_start: bool
    next_session_at: datetime | None = None
    remaining_seconds: int = 0
    unlocked_by_invite: bool = False


class VoteSessionResponse(BaseModel):
    """서버 투표 세션 상태 응답."""

    id: uuid.UUID
    user_id: uuid.UUID
    circle_id: uuid.UUID | None
    status: Literal["ACTIVE", "COMPLETED"]
    poll_ids: list[uuid.UUID]
    skipped_poll_ids: list[uuid.UUID]
    current_index: int
    total_count: int
    current_poll_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None


VoteHintTier = Literal["CIRCLE", "TIME", "INITIAL", "FULL"]


class VoteHintItem(BaseModel):
    """단계형 안전 힌트 항목."""

    vote_id: uuid.UUID
    tier: VoteHintTier
    text: str
    unlocked: bool


class VoteHintResponse(BaseModel):
    """나를 선택한 투표에 대한 안전 힌트 응답."""

    poll_id: uuid.UUID
    question_text: str
    hints: list[VoteHintItem]


class ReceivedHeartHint(BaseModel):
    """무료 상태에서 보여주는 받은 하트 힌트."""

    circle_name: str
    time_label: str


class ReceivedHeartItem(BaseModel):
    """받은 하트 인박스 항목."""

    poll_id: uuid.UUID
    circle_id: uuid.UUID
    circle_name: str
    question_text: str
    emoji: str | None
    received_count: int
    latest_received_at: datetime
    is_read: bool = False
    free_hint: ReceivedHeartHint


class ReceivedHeartReadResponse(BaseModel):
    """받은 하트 읽음 처리 응답."""

    poll_id: uuid.UUID
    is_read: bool


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


class AdminPollCreate(BaseModel):
    """Schema for admin poll creation (broadcast to circles)."""

    template_id: uuid.UUID | None = None  # 템플릿 사용 시
    custom_question: str | None = None  # 직접 입력 시
    duration: PollDuration
    circle_ids: list[uuid.UUID] | None = None  # 선택한 Circle만
    apply_to_all: bool = False  # True면 모든 Circle


class BroadcastPollResponse(BaseModel):
    """Schema for broadcast poll response."""

    created_count: int
    failed_count: int
    polls: list[PollResponse]
