"""API routes for circles."""

import uuid

from fastapi import APIRouter, status

from app.deps import CurrentUserDep, DBSessionDep
from app.modules.circles.repository import CircleRepository, MembershipRepository
from app.modules.circles.schemas import (
    CircleCreate,
    CircleDetail,
    CircleResponse,
    CircleUpdate,
    JoinByCodeRequest,
    MemberInfo,
    RegenerateInviteCodeResponse,
)
from app.modules.circles.service import CircleService

router = APIRouter(prefix="/circles", tags=["Circles"])


@router.post(
    "",
    response_model=CircleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new circle",
)
async def create_circle(
    circle_data: CircleCreate,
    current_user: CurrentUserDep,
    db: DBSessionDep,
) -> CircleResponse:
    """Create a new circle.

    The current user will be set as the owner and first member.
    """
    circle_repo = CircleRepository(db)
    membership_repo = MembershipRepository(db)
    service = CircleService(circle_repo, membership_repo)

    return await service.create_circle(circle_data, current_user.id)


@router.get(
    "",
    response_model=list[CircleResponse],
    summary="Get user's circles",
)
async def get_circles(
    current_user: CurrentUserDep,
    db: DBSessionDep,
) -> list[CircleResponse]:
    """Get all circles the current user is a member of."""
    circle_repo = CircleRepository(db)
    membership_repo = MembershipRepository(db)
    service = CircleService(circle_repo, membership_repo)

    return await service.get_user_circles(current_user.id)


@router.get(
    "/{circle_id}",
    response_model=CircleDetail,
    summary="Get circle details",
)
async def get_circle(
    circle_id: uuid.UUID,
    current_user: CurrentUserDep,
    db: DBSessionDep,
) -> CircleDetail:
    """Get detailed circle information including members."""
    circle_repo = CircleRepository(db)
    membership_repo = MembershipRepository(db)
    service = CircleService(circle_repo, membership_repo)

    return await service.get_circle_detail(circle_id, current_user.id)


@router.post(
    "/join/code",
    response_model=CircleResponse,
    summary="Join circle by invite code",
)
async def join_by_code(
    join_data: JoinByCodeRequest,
    current_user: CurrentUserDep,
    db: DBSessionDep,
) -> CircleResponse:
    """Join a circle using invite code."""
    circle_repo = CircleRepository(db)
    membership_repo = MembershipRepository(db)
    service = CircleService(circle_repo, membership_repo)

    return await service.join_by_code(
        join_data.invite_code,
        current_user.id,
        join_data.nickname,
    )


@router.post(
    "/{circle_id}/leave",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Leave a circle",
)
async def leave_circle(
    circle_id: uuid.UUID,
    current_user: CurrentUserDep,
    db: DBSessionDep,
) -> None:
    """Leave a circle.

    Circle owners cannot leave their circles.
    """
    circle_repo = CircleRepository(db)
    membership_repo = MembershipRepository(db)
    service = CircleService(circle_repo, membership_repo)

    await service.leave_circle(circle_id, current_user.id)


@router.get(
    "/{circle_id}/members",
    response_model=list[MemberInfo],
    summary="Get circle members",
)
async def get_members(
    circle_id: uuid.UUID,
    current_user: CurrentUserDep,
    db: DBSessionDep,
) -> list[MemberInfo]:
    """Get list of circle members.

    Returns member information including user details.
    """
    # Reuse get_circle_detail to check membership and get members
    circle_repo = CircleRepository(db)
    membership_repo = MembershipRepository(db)
    service = CircleService(circle_repo, membership_repo)

    circle_detail = await service.get_circle_detail(circle_id, current_user.id)
    return circle_detail.members


@router.post(
    "/{circle_id}/regenerate-code",
    response_model=RegenerateInviteCodeResponse,
    summary="Regenerate invite code",
)
async def regenerate_invite_code(
    circle_id: uuid.UUID,
    current_user: CurrentUserDep,
    db: DBSessionDep,
) -> RegenerateInviteCodeResponse:
    """Regenerate circle's invite code.

    Only the circle owner can regenerate the code.
    """
    circle_repo = CircleRepository(db)
    membership_repo = MembershipRepository(db)
    service = CircleService(circle_repo, membership_repo)

    return await service.regenerate_invite_code(circle_id, current_user.id)
