"""Service layer for stats module."""

from datetime import date, timedelta
from typing import Literal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import PollStatus, ReportStatus
from app.modules.auth.models import User
from app.modules.circles.models import Circle
from app.modules.polls.models import Poll, Vote
from app.modules.reports.models import Report
from app.modules.stats.schemas import (
    DailyCount,
    PollStatsResponse,
    ReportStatsResponse,
    ReportStatusCount,
    ReportTypeCount,
    StatsOverview,
    UserStatsResponse,
)


class StatsService:
    """Service for calculating statistics."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_overview(self) -> StatsOverview:
        """Get overview statistics."""
        today = date.today()

        # Total users
        total_users_result = await self.db.execute(
            select(func.count()).select_from(User)
        )
        total_users = total_users_result.scalar() or 0

        # Total circles
        total_circles_result = await self.db.execute(
            select(func.count()).select_from(Circle)
        )
        total_circles = total_circles_result.scalar() or 0

        # Total polls
        total_polls_result = await self.db.execute(
            select(func.count()).select_from(Poll)
        )
        total_polls = total_polls_result.scalar() or 0

        # Active polls
        active_polls_result = await self.db.execute(
            select(func.count()).select_from(Poll).where(Poll.status == PollStatus.ACTIVE)
        )
        active_polls = active_polls_result.scalar() or 0

        # Pending reports
        pending_reports_result = await self.db.execute(
            select(func.count()).select_from(Report).where(Report.status == ReportStatus.PENDING)
        )
        pending_reports = pending_reports_result.scalar() or 0

        # Today's new users
        today_new_users_result = await self.db.execute(
            select(func.count())
            .select_from(User)
            .where(func.date(User.created_at) == today)
        )
        today_new_users = today_new_users_result.scalar() or 0

        # Today's new polls
        today_new_polls_result = await self.db.execute(
            select(func.count())
            .select_from(Poll)
            .where(func.date(Poll.created_at) == today)
        )
        today_new_polls = today_new_polls_result.scalar() or 0

        return StatsOverview(
            total_users=total_users,
            total_circles=total_circles,
            total_polls=total_polls,
            active_polls=active_polls,
            pending_reports=pending_reports,
            today_new_users=today_new_users,
            today_new_polls=today_new_polls,
        )

    async def get_user_stats(
        self,
        period: Literal["daily", "weekly", "monthly"] = "daily",
        days: int = 30,
    ) -> UserStatsResponse:
        """Get user statistics over time."""
        end_date = date.today()
        start_date = end_date - timedelta(days=days)

        # New users per day
        new_users_result = await self.db.execute(
            select(
                func.date(User.created_at).label("date"),
                func.count().label("count"),
            )
            .where(func.date(User.created_at) >= start_date)
            .group_by(func.date(User.created_at))
            .order_by(func.date(User.created_at))
        )
        new_users_data = new_users_result.all()

        # Active users per day (users who voted)
        active_users_result = await self.db.execute(
            select(
                func.date(Vote.created_at).label("date"),
                func.count(func.distinct(Vote.voter_id)).label("count"),
            )
            .where(func.date(Vote.created_at) >= start_date)
            .group_by(func.date(Vote.created_at))
            .order_by(func.date(Vote.created_at))
        )
        active_users_data = active_users_result.all()

        return UserStatsResponse(
            new_users=[DailyCount(date=row.date, count=row.count) for row in new_users_data],
            active_users=[DailyCount(date=row.date, count=row.count) for row in active_users_data],
        )

    async def get_poll_stats(
        self,
        period: Literal["daily", "weekly", "monthly"] = "daily",
        days: int = 30,
    ) -> PollStatsResponse:
        """Get poll statistics over time."""
        end_date = date.today()
        start_date = end_date - timedelta(days=days)

        # Created polls per day
        created_result = await self.db.execute(
            select(
                func.date(Poll.created_at).label("date"),
                func.count().label("count"),
            )
            .where(func.date(Poll.created_at) >= start_date)
            .group_by(func.date(Poll.created_at))
            .order_by(func.date(Poll.created_at))
        )
        created_data = created_result.all()

        # Votes per day
        votes_result = await self.db.execute(
            select(
                func.date(Vote.created_at).label("date"),
                func.count().label("count"),
            )
            .where(func.date(Vote.created_at) >= start_date)
            .group_by(func.date(Vote.created_at))
            .order_by(func.date(Vote.created_at))
        )
        votes_data = votes_result.all()

        return PollStatsResponse(
            created=[DailyCount(date=row.date, count=row.count) for row in created_data],
            votes=[DailyCount(date=row.date, count=row.count) for row in votes_data],
        )

    async def get_report_stats(self) -> ReportStatsResponse:
        """Get report statistics."""
        # By status
        by_status_result = await self.db.execute(
            select(
                Report.status,
                func.count().label("count"),
            )
            .group_by(Report.status)
        )
        by_status_data = by_status_result.all()

        # By target type
        by_type_result = await self.db.execute(
            select(
                Report.target_type,
                func.count().label("count"),
            )
            .group_by(Report.target_type)
        )
        by_type_data = by_type_result.all()

        # Total
        total_result = await self.db.execute(
            select(func.count()).select_from(Report)
        )
        total = total_result.scalar() or 0

        return ReportStatsResponse(
            by_status=[
                ReportStatusCount(status=row.status.value, count=row.count)
                for row in by_status_data
            ],
            by_type=[
                ReportTypeCount(target_type=row.target_type.value, count=row.count)
                for row in by_type_data
            ],
            total=total,
        )
