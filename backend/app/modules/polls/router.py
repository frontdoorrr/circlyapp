"""API routes for polls."""

import uuid

from fastapi import APIRouter, Query, status

from app.core.enums import PollStatus, TemplateCategory
from app.deps import CurrentUserDep, PollServiceDep
from app.modules.polls.schemas import (
    CategoryInfo,
    PollCreate,
    PollResponse,
    PollTemplateResponse,
    VoteRequest,
    VoteResponse,
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
    "/circles/{circle_id}/polls",
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
