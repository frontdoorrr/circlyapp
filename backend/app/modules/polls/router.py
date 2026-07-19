"""API routes for polls."""

import uuid

from fastapi import APIRouter, Query, status

from app.core.enums import PollStatus, TemplateCategory
from app.deps import AdminUserDep, CurrentUserDep, PollServiceDep
from app.modules.polls.schemas import (
    AdminPollCreate,
    BroadcastPollResponse,
    CategoryInfo,
    PollCandidatesResponse,
    PollCreate,
    PollListResponse,
    PollResponse,
    PollTemplateResponse,
    ReceivedHeartItem,
    ReceivedHeartReadResponse,
    RoundCreate,
    RoundCreateResponse,
    TemplateCreate,
    TemplateListResponse,
    TemplateUpdate,
    UpdatePollStatusRequest,
    VoteHintResponse,
    VoteRequest,
    VoteResponse,
    VoteSessionAvailabilityResponse,
    VoteSessionCreate,
    VoteSessionResponse,
)

router = APIRouter(prefix="/polls", tags=["Polls"])


@router.get(
    "/me",
    response_model=list[PollResponse],
    summary="Get my polls",
)
async def get_my_polls(
    current_user: CurrentUserDep,
    service: PollServiceDep,
    status: PollStatus | None = Query(None, description="Filter by status (ACTIVE or COMPLETED)"),
) -> list[PollResponse]:
    """Get all polls from circles the current user belongs to."""
    return await service.get_my_polls(current_user.id, status)


@router.get(
    "/me/received",
    response_model=list[ReceivedHeartItem],
    summary="Get hearts received by me",
)
async def get_received_hearts(
    current_user: CurrentUserDep,
    service: PollServiceDep,
    limit: int = Query(50, ge=1, le=100, description="Max results"),
    offset: int = Query(0, ge=0, description="Skip results"),
) -> list[ReceivedHeartItem]:
    """Get polls where the current user received votes."""
    return await service.get_received_hearts(current_user.id, limit=limit, offset=offset)


@router.post(
    "/me/received/{poll_id}/read",
    response_model=ReceivedHeartReadResponse,
    summary="Mark a received heart as read",
)
async def mark_received_heart_as_read(
    poll_id: uuid.UUID,
    current_user: CurrentUserDep,
    service: PollServiceDep,
) -> ReceivedHeartReadResponse:
    """Mark a received heart inbox row as read."""
    return await service.mark_received_heart_as_read(current_user.id, poll_id)


@router.get(
    "/templates",
    response_model=list[PollTemplateResponse],
    summary="Get poll templates",
)
async def get_templates(
    service: PollServiceDep,
    category: TemplateCategory | None = Query(None, description="Filter by category"),
) -> list[PollTemplateResponse]:
    """Get all active poll templates, optionally filtered by category."""
    return await service.get_templates(category)


@router.get(
    "/templates/categories",
    response_model=list[CategoryInfo],
    summary="Get template categories",
)
async def get_categories(
    service: PollServiceDep,
) -> list[CategoryInfo]:
    """Get all template categories with question counts."""
    return await service.get_categories()


@router.post(
    "/circles/{circle_id}",
    response_model=PollResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new poll",
)
async def create_poll(
    circle_id: uuid.UUID,
    poll_data: PollCreate,
    current_user: CurrentUserDep,
    service: PollServiceDep,
) -> PollResponse:
    """Create a new poll in a circle."""
    return await service.create_poll(circle_id, current_user.id, poll_data)


@router.post(
    "/circles/{circle_id}/rounds",
    response_model=RoundCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Open a safe five-question Circle round",
)
async def create_round(
    circle_id: uuid.UUID,
    round_data: RoundCreate,
    current_user: CurrentUserDep,
    service: PollServiceDep,
) -> RoundCreateResponse:
    """Open a server-selected round for a Circle as OWNER or ADMIN."""
    return await service.create_round(
        circle_id,
        current_user.id,
        round_data.duration,
    )


@router.post(
    "/sessions",
    response_model=VoteSessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Start a server-side vote session",
)
async def start_vote_session(
    session_data: VoteSessionCreate,
    current_user: CurrentUserDep,
    service: PollServiceDep,
) -> VoteSessionResponse:
    """Create a server-side vote session queue."""
    return await service.start_vote_session(
        current_user.id,
        circle_id=session_data.circle_id,
    )


@router.get(
    "/sessions/availability",
    response_model=VoteSessionAvailabilityResponse,
    summary="Get vote session availability",
)
async def get_vote_session_availability(
    current_user: CurrentUserDep,
    service: PollServiceDep,
) -> VoteSessionAvailabilityResponse:
    """Return whether the current user can start a vote session now."""
    return await service.get_vote_session_availability(current_user.id)


@router.post(
    "/sessions/{session_id}/skip",
    response_model=VoteSessionResponse,
    summary="Skip the current poll in a vote session",
)
async def skip_vote_session_poll(
    session_id: uuid.UUID,
    current_user: CurrentUserDep,
    service: PollServiceDep,
) -> VoteSessionResponse:
    """Skip the current poll and advance the server-side session cursor."""
    return await service.skip_vote_session_poll(session_id, current_user.id)


@router.post(
    "/sessions/{session_id}/advance",
    response_model=VoteSessionResponse,
    summary="Advance the current poll in a vote session",
)
async def advance_vote_session_poll(
    session_id: uuid.UUID,
    current_user: CurrentUserDep,
    service: PollServiceDep,
) -> VoteSessionResponse:
    """Advance the current poll after a successful vote."""
    return await service.advance_vote_session_poll(session_id, current_user.id)


@router.get(
    "/{poll_id}",
    response_model=PollResponse,
    summary="Get poll by ID",
)
async def get_poll(
    poll_id: uuid.UUID,
    current_user: CurrentUserDep,
    service: PollServiceDep,
) -> PollResponse:
    """Get a poll by ID. User must be a member of the poll's circle."""
    return await service.get_poll(poll_id, current_user.id)


@router.post(
    "/{poll_id}/vote",
    response_model=VoteResponse,
    summary="Vote in a poll",
)
async def vote(
    poll_id: uuid.UUID,
    vote_data: VoteRequest,
    current_user: CurrentUserDep,
    service: PollServiceDep,
) -> VoteResponse:
    """Cast a vote in a poll."""
    return await service.vote(poll_id, current_user.id, vote_data.voted_for_id)


@router.get(
    "/{poll_id}/candidates",
    response_model=PollCandidatesResponse,
    summary="Get server-selected vote candidates",
)
async def get_poll_candidates(
    poll_id: uuid.UUID,
    current_user: CurrentUserDep,
    service: PollServiceDep,
    shuffle: bool = Query(False, description="Shuffle candidates server-side"),
) -> PollCandidatesResponse:
    """Get fair candidate options for a poll."""
    return await service.get_poll_candidates(poll_id, current_user.id, shuffle=shuffle)


@router.get(
    "/{poll_id}/hints",
    response_model=VoteHintResponse,
    summary="[Orb Mode] Get safe hints for votes that selected me",
    tags=["Orb Mode"],
)
async def get_my_vote_hints(
    poll_id: uuid.UUID,
    current_user: CurrentUserDep,
    service: PollServiceDep,
) -> VoteHintResponse:
    """Return tiered safe hints for votes received by the current user."""
    return await service.get_vote_hints_for_user(
        poll_id,
        current_user.id,
        is_orb_mode=current_user.is_orb_mode,
    )


# ==================== Admin Endpoints ====================


@router.get(
    "/admin/all",
    response_model=PollListResponse,
    summary="[Admin] Get all polls",
    tags=["Admin - Polls"],
)
async def get_all_polls(
    admin_user: AdminUserDep,
    service: PollServiceDep,
    status: PollStatus | None = Query(None, description="Filter by status"),
    circle_id: uuid.UUID | None = Query(None, description="Filter by circle"),
    limit: int = Query(50, ge=1, le=100, description="Max results"),
    offset: int = Query(0, ge=0, description="Skip results"),
) -> PollListResponse:
    """Get all polls with optional filters (Admin only)."""
    polls, total = await service.get_all_polls(status, circle_id, limit, offset)
    return PollListResponse(items=polls, total=total, limit=limit, offset=offset)


@router.put(
    "/admin/{poll_id}/status",
    response_model=PollResponse,
    summary="[Admin] Update poll status",
    tags=["Admin - Polls"],
)
async def update_poll_status(
    poll_id: uuid.UUID,
    request: UpdatePollStatusRequest,
    admin_user: AdminUserDep,
    service: PollServiceDep,
) -> PollResponse:
    """Update poll status (Admin only). Can force complete or cancel polls."""
    return await service.update_poll_status(poll_id, request.status)


@router.get(
    "/admin/templates",
    response_model=TemplateListResponse,
    summary="[Admin] Get all templates",
    tags=["Admin - Templates"],
)
async def get_all_templates(
    admin_user: AdminUserDep,
    service: PollServiceDep,
    category: TemplateCategory | None = Query(None, description="Filter by category"),
    is_active: bool | None = Query(None, description="Filter by active status"),
    limit: int = Query(50, ge=1, le=100, description="Max results"),
    offset: int = Query(0, ge=0, description="Skip results"),
) -> TemplateListResponse:
    """Get all templates including inactive ones (Admin only)."""
    templates, total = await service.get_all_templates(category, is_active, limit, offset)
    return TemplateListResponse(items=templates, total=total, limit=limit, offset=offset)


@router.post(
    "/admin/templates",
    response_model=PollTemplateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="[Admin] Create template",
    tags=["Admin - Templates"],
)
async def create_template(
    request: TemplateCreate,
    admin_user: AdminUserDep,
    service: PollServiceDep,
) -> PollTemplateResponse:
    """Create a new poll template (Admin only)."""
    return await service.create_template(request.category, request.question_text, request.emoji)


@router.put(
    "/admin/templates/{template_id}",
    response_model=PollTemplateResponse,
    summary="[Admin] Update template",
    tags=["Admin - Templates"],
)
async def update_template(
    template_id: uuid.UUID,
    request: TemplateUpdate,
    admin_user: AdminUserDep,
    service: PollServiceDep,
) -> PollTemplateResponse:
    """Update a poll template (Admin only)."""
    return await service.update_template(
        template_id,
        request.category,
        request.question_text,
        request.emoji,
        request.is_active,
    )


@router.post(
    "/admin/broadcast",
    response_model=BroadcastPollResponse,
    status_code=status.HTTP_201_CREATED,
    summary="[Admin] Broadcast poll to circles",
    tags=["Admin - Polls"],
)
async def broadcast_poll(
    request: AdminPollCreate,
    admin_user: AdminUserDep,
    service: PollServiceDep,
) -> BroadcastPollResponse:
    """Broadcast a poll to multiple circles (Admin only).

    Can apply to all active circles or selected circles.
    Supports both template-based and custom questions.
    """
    return await service.broadcast_poll(admin_user.id, request)
