"""API routes for polls."""

import uuid

from fastapi import APIRouter, Query, status

from app.core.enums import TemplateCategory
from app.deps import CurrentUserDep, DBSessionDep
from app.modules.circles.repository import MembershipRepository
from app.modules.polls.repository import PollRepository, TemplateRepository, VoteRepository
from app.modules.polls.schemas import (
    PollCreate,
    PollResponse,
    PollTemplateResponse,
    VoteRequest,
    VoteResponse,
)
from app.modules.polls.service import PollService

router = APIRouter(prefix="/polls", tags=["Polls"])


@router.get(
    "/templates",
    response_model=list[PollTemplateResponse],
    summary="Get poll templates",
)
async def get_templates(
    db: DBSessionDep,
    category: TemplateCategory | None = Query(None, description="Filter by category"),
) -> list[PollTemplateResponse]:
    """Get all active poll templates, optionally filtered by category."""
    template_repo = TemplateRepository(db)
    poll_repo = PollRepository(db)
    vote_repo = VoteRepository(db)
    membership_repo = MembershipRepository(db)
    service = PollService(template_repo, poll_repo, vote_repo, membership_repo)

    return await service.get_templates(category)


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
    db: DBSessionDep,
) -> PollResponse:
    """Create a new poll in a circle."""
    template_repo = TemplateRepository(db)
    poll_repo = PollRepository(db)
    vote_repo = VoteRepository(db)
    membership_repo = MembershipRepository(db)
    service = PollService(template_repo, poll_repo, vote_repo, membership_repo)

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
    db: DBSessionDep,
) -> VoteResponse:
    """Cast a vote in a poll."""
    template_repo = TemplateRepository(db)
    poll_repo = PollRepository(db)
    vote_repo = VoteRepository(db)
    membership_repo = MembershipRepository(db)
    service = PollService(template_repo, poll_repo, vote_repo, membership_repo)

    return await service.vote(poll_id, current_user.id, vote_data.voted_for_id)
