"""Repository for reports module."""

import uuid
from datetime import UTC, datetime

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import ReportStatus, ReportTargetType
from app.modules.reports.models import Report
from app.modules.reports.schemas import ReportCreate


class ReportRepository:
    """Repository for Report model."""

    def __init__(self, session: AsyncSession) -> None:
        """Initialize repository with database session."""
        self.session = session

    async def create(
        self,
        reporter_id: uuid.UUID,
        data: ReportCreate,
    ) -> Report:
        """Create a new report.

        Args:
            reporter_id: ID of the user creating the report
            data: Report creation data

        Returns:
            Created Report instance
        """
        report = Report(
            reporter_id=reporter_id,
            target_type=data.target_type,
            target_id=data.target_id,
            reason=data.reason,
            description=data.description,
            status=ReportStatus.PENDING,
        )
        self.session.add(report)
        await self.session.flush()
        await self.session.refresh(report)
        return report

    async def find_by_id(self, report_id: uuid.UUID) -> Report | None:
        """Find a report by ID.

        Args:
            report_id: Report UUID

        Returns:
            Report instance or None if not found
        """
        query = select(Report).where(Report.id == report_id)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def find_by_status(
        self,
        status: ReportStatus,
        limit: int | None = None,
        offset: int | None = None,
    ) -> list[Report]:
        """Find reports by status with pagination.

        Args:
            status: Report status to filter by
            limit: Maximum number of results (optional)
            offset: Number of results to skip (optional)

        Returns:
            List of reports ordered by created_at desc
        """
        query = select(Report).where(Report.status == status).order_by(Report.created_at.desc())

        if limit is not None:
            query = query.limit(limit)
        if offset is not None:
            query = query.offset(offset)

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def find_by_target_id(
        self,
        target_type: ReportTargetType,
        target_id: uuid.UUID,
    ) -> list[Report]:
        """Find reports by target ID and type.

        Args:
            target_type: Type of the reported entity
            target_id: ID of the reported entity

        Returns:
            List of reports for the target
        """
        query = (
            select(Report)
            .where(
                Report.target_type == target_type,
                Report.target_id == target_id,
            )
            .order_by(Report.created_at.desc())
        )

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def update_status(
        self,
        report_id: uuid.UUID,
        status: ReportStatus,
        reviewer_id: uuid.UUID,
    ) -> bool:
        """Update report status and set reviewer information.

        Args:
            report_id: Report UUID
            status: New status
            reviewer_id: ID of the admin reviewing the report

        Returns:
            True if update was successful, False if report not found
        """
        result = await self.session.execute(
            update(Report)
            .where(Report.id == report_id)
            .values(
                status=status,
                reviewed_by=reviewer_id,
                reviewed_at=datetime.now(UTC),
            )
        )
        await self.session.flush()
        rowcount = getattr(result, "rowcount", 0) or 0
        return rowcount > 0

    async def count_by_target(
        self,
        target_type: ReportTargetType,
        target_id: uuid.UUID,
    ) -> int:
        """Count reports for a specific target.

        Args:
            target_type: Type of the reported entity
            target_id: ID of the reported entity

        Returns:
            Number of reports for the target
        """
        query = select(func.count()).where(
            Report.target_type == target_type,
            Report.target_id == target_id,
        )

        result = await self.session.execute(query)
        count = result.scalar()
        return count or 0

    async def exists_by_reporter_and_target(
        self,
        reporter_id: uuid.UUID,
        target_type: ReportTargetType,
        target_id: uuid.UUID,
    ) -> bool:
        """Check if a reporter has already reported a target.

        Args:
            reporter_id: ID of the reporter
            target_type: Type of the reported entity
            target_id: ID of the reported entity

        Returns:
            True if report exists, False otherwise
        """
        query = select(func.count()).where(
            Report.reporter_id == reporter_id,
            Report.target_type == target_type,
            Report.target_id == target_id,
        )

        result = await self.session.execute(query)
        count = result.scalar()
        return (count or 0) > 0

    # ==================== Admin Methods ====================

    async def find_all(
        self,
        status: ReportStatus | None = None,
        target_type: ReportTargetType | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Report]:
        """Find all reports with optional filters (Admin only).

        Args:
            status: Optional filter by status
            target_type: Optional filter by target type
            limit: Maximum number of results
            offset: Number of results to skip

        Returns:
            List of reports matching the criteria
        """
        query = select(Report).order_by(Report.created_at.desc())

        if status is not None:
            query = query.where(Report.status == status)

        if target_type is not None:
            query = query.where(Report.target_type == target_type)

        query = query.limit(limit).offset(offset)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def count_all(
        self,
        status: ReportStatus | None = None,
        target_type: ReportTargetType | None = None,
    ) -> int:
        """Count all reports with optional filters (Admin only).

        Args:
            status: Optional filter by status
            target_type: Optional filter by target type

        Returns:
            Total count of matching reports
        """
        query = select(func.count(Report.id))

        if status is not None:
            query = query.where(Report.status == status)

        if target_type is not None:
            query = query.where(Report.target_type == target_type)

        result = await self.session.execute(query)
        return result.scalar() or 0
