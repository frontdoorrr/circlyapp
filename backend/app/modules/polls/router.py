"""API routes for polls."""

import uuid

from fastapi import APIRouter, Query, status

from app.core.enums import PollStatus, TemplateCategory
from app.deps import AdminUserDep, CurrentUserDep, PollServiceDep
from app.modules.polls.schemas import (
    CategoryInfo,
    PollCreate,
    PollListResponse,
    PollResponse,
    PollTemplateResponse,
    TemplateCreate,
    TemplateListResponse,
    TemplateUpdate,
    UpdatePollStatusRequest,
    VoteRequest,
    VoteResponse,
    VoterRevealResponse,
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
    "/{poll_id}/voters",
    response_model=VoterRevealResponse,
    summary="[God Mode] Get voters who selected me",
    tags=["God Mode"],
)
async def get_my_voters(
    poll_id: uuid.UUID,
    current_user: CurrentUserDep,
    service: PollServiceDep,
) -> VoterRevealResponse:
    """God Mode 전용: 특정 투표에서 나를 선택한 사람들 조회.

    권한: God Mode 구독자 전용 (TODO: RevenueCat 연동)
    """
    return await service.get_voters_for_user(poll_id, current_user.id)


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
