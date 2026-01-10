"""API routes for stats module."""

from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.deps import AdminUserDep
from app.modules.stats.schemas import (
    PollStatsResponse,
    ReportStatsResponse,
    StatsOverview,
    UserStatsResponse,
)
from app.modules.stats.service import StatsService

router = APIRouter(prefix="/admin/stats", tags=["Admin - Stats"])


def get_stats_service(db: AsyncSession = Depends(get_db)) -> StatsService:
    """Get StatsService dependency."""
    return StatsService(db)


StatsServiceDep = Annotated[StatsService, Depends(get_stats_service)]


@router.get(
    "/overview",
    response_model=StatsOverview,
    summary="[Admin] Get overview statistics",
)
async def get_overview(
    admin_user: AdminUserDep,
    service: StatsServiceDep,
) -> StatsOverview:
    """Get overview statistics including totals and today's counts."""
    return await service.get_overview()


@router.get(
    "/users",
    response_model=UserStatsResponse,
    summary="[Admin] Get user statistics",
)
async def get_user_stats(
    admin_user: AdminUserDep,
    service: StatsServiceDep,
    period: Literal["daily", "weekly", "monthly"] = Query(
        "daily",
        description="Time period for grouping",
    ),
    days: int = Query(
        30,
        ge=1,
        le=365,
        description="Number of days to include",
    ),
) -> UserStatsResponse:
    """Get user statistics including new and active users over time."""
    return await service.get_user_stats(period=period, days=days)


@router.get(
    "/polls",
    response_model=PollStatsResponse,
    summary="[Admin] Get poll statistics",
)
async def get_poll_stats(
    admin_user: AdminUserDep,
    service: StatsServiceDep,
    period: Literal["daily", "weekly", "monthly"] = Query(
        "daily",
        description="Time period for grouping",
    ),
    days: int = Query(
        30,
        ge=1,
        le=365,
        description="Number of days to include",
    ),
) -> PollStatsResponse:
    """Get poll statistics including created polls and votes over time."""
    return await service.get_poll_stats(period=period, days=days)


@router.get(
    "/reports",
    response_model=ReportStatsResponse,
    summary="[Admin] Get report statistics",
)
async def get_report_stats(
    admin_user: AdminUserDep,
    service: StatsServiceDep,
) -> ReportStatsResponse:
    """Get report statistics grouped by status and target type."""
    return await service.get_report_stats()
