"""API routes for circles."""

import uuid

from fastapi import APIRouter, Query, status

from app.deps import AdminUserDep, CircleServiceDep, CurrentUserDep
from app.modules.circles.schemas import (
    CircleCreate,
    CircleDetail,
    CircleListResponse,
    CircleResponse,
    JoinByCodeRequest,
    MemberInfo,
    RegenerateInviteCodeResponse,
    UpdateCircleStatusRequest,
    ValidateInviteCodeResponse,
)

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
    service: CircleServiceDep,
) -> CircleResponse:
    """Create a new circle.

    The current user will be set as the owner and first member.
    """
    return await service.create_circle(circle_data, current_user.id)


@router.get(
    "",
    response_model=list[CircleResponse],
    summary="Get user's circles",
)
async def get_circles(
    current_user: CurrentUserDep,
    service: CircleServiceDep,
) -> list[CircleResponse]:
    """Get all circles the current user is a member of."""
    return await service.get_user_circles(current_user.id)


@router.get(
    "/{circle_id}",
    response_model=CircleDetail,
    summary="Get circle details",
)
async def get_circle(
    circle_id: uuid.UUID,
    current_user: CurrentUserDep,
    service: CircleServiceDep,
) -> CircleDetail:
    """Get detailed circle information including members."""
    return await service.get_circle_detail(circle_id, current_user.id)


@router.get(
    "/validate-code/{invite_code}",
    response_model=ValidateInviteCodeResponse,
    summary="Validate invite code",
)
async def validate_invite_code(
    invite_code: str,
    service: CircleServiceDep,
) -> ValidateInviteCodeResponse:
    """Validate an invite code and return circle info if valid.

    This endpoint does not require authentication, allowing users to check
    invite codes before signing in.
    """
    return await service.validate_invite_code(invite_code.upper())


@router.post(
    "/join/code",
    response_model=CircleResponse,
    summary="Join circle by invite code",
)
async def join_by_code(
    join_data: JoinByCodeRequest,
    current_user: CurrentUserDep,
    service: CircleServiceDep,
) -> CircleResponse:
    """Join a circle using invite code."""
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
    service: CircleServiceDep,
) -> None:
    """Leave a circle.

    Circle owners cannot leave their circles.
    """
    await service.leave_circle(circle_id, current_user.id)


@router.get(
    "/{circle_id}/members",
    response_model=list[MemberInfo],
    summary="Get circle members",
)
async def get_members(
    circle_id: uuid.UUID,
    current_user: CurrentUserDep,
    service: CircleServiceDep,
) -> list[MemberInfo]:
    """Get list of circle members.

    Returns member information including user details.
    """
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
    service: CircleServiceDep,
) -> RegenerateInviteCodeResponse:
    """Regenerate circle's invite code.

    Only the circle owner can regenerate the code.
    """
    return await service.regenerate_invite_code(circle_id, current_user.id)


# ==================== Admin Endpoints ====================


@router.get(
    "/admin/all",
    response_model=CircleListResponse,
    summary="[Admin] Get all circles",
    tags=["Admin - Circles"],
)
async def get_all_circles(
    admin_user: AdminUserDep,
    service: CircleServiceDep,
    search: str | None = Query(None, description="Search in name/description"),
    is_active: bool | None = Query(None, description="Filter by active status"),
    limit: int = Query(50, ge=1, le=100, description="Max results"),
    offset: int = Query(0, ge=0, description="Skip results"),
) -> CircleListResponse:
    """Get all circles with optional filters (Admin only)."""
    circles, total = await service.get_all_circles(search, is_active, limit, offset)
    return CircleListResponse(items=circles, total=total, limit=limit, offset=offset)


@router.get(
    "/admin/{circle_id}",
    response_model=CircleDetail,
    summary="[Admin] Get circle details",
    tags=["Admin - Circles"],
)
async def get_circle_admin(
    circle_id: uuid.UUID,
    admin_user: AdminUserDep,
    service: CircleServiceDep,
) -> CircleDetail:
    """Get detailed circle information including members (Admin only)."""
    return await service.get_circle_detail_admin(circle_id)


@router.put(
    "/admin/{circle_id}/status",
    response_model=CircleResponse,
    summary="[Admin] Update circle status",
    tags=["Admin - Circles"],
)
async def update_circle_status(
    circle_id: uuid.UUID,
    request: UpdateCircleStatusRequest,
    admin_user: AdminUserDep,
    service: CircleServiceDep,
) -> CircleResponse:
    """Update circle's active status (Admin only)."""
    return await service.update_circle_status(circle_id, request.is_active)


@router.delete(
    "/admin/{circle_id}/members/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="[Admin] Remove member from circle",
    tags=["Admin - Circles"],
)
async def remove_member_admin(
    circle_id: uuid.UUID,
    user_id: uuid.UUID,
    admin_user: AdminUserDep,
    service: CircleServiceDep,
) -> None:
    """Remove a member from circle (Admin only)."""
    await service.remove_member_admin(circle_id, user_id)
