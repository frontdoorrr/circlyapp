"""Business logic for reports module."""

import uuid

from app.core.enums import ReportStatus, ReportTargetType
from app.core.exceptions import BadRequestException, NotFoundException
from app.modules.reports.repository import ReportRepository
from app.modules.reports.schemas import ReportCreate, ReportResponse


class ReportService:
    """Service for report operations."""

    # Number of reports before auto-block consideration
    AUTO_BLOCK_THRESHOLD = 5

    def __init__(self, report_repo: ReportRepository) -> None:
        """Initialize service with repository."""
        self.report_repo = report_repo

    async def create_report(
        self,
        reporter_id: uuid.UUID,
        data: ReportCreate,
    ) -> ReportResponse:
        """Create a new report.

        Args:
            reporter_id: ID of the user creating the report
            data: Report creation data

        Returns:
            Created ReportResponse

        Raises:
            BadRequestException: If user already reported this target or
                attempting to self-report
        """
        # Check for self-report (only for USER target type)
        if data.target_type == ReportTargetType.USER and data.target_id == reporter_id:
            raise BadRequestException(
                code="SELF_REPORT",
                message="You cannot report yourself",
            )

        # Check for duplicate report
        already_reported = await self.report_repo.exists_by_reporter_and_target(
            reporter_id=reporter_id,
            target_type=data.target_type,
            target_id=data.target_id,
        )

        if already_reported:
            raise BadRequestException(
                code="ALREADY_REPORTED",
                message="You have already reported this target",
            )

        # Create the report
        report = await self.report_repo.create(reporter_id=reporter_id, data=data)

        return ReportResponse.model_validate(report)

    async def get_report_by_id(self, report_id: uuid.UUID) -> ReportResponse:
        """Get a report by ID.

        Args:
            report_id: Report UUID

        Returns:
            ReportResponse

        Raises:
            NotFoundException: If report not found
        """
        report = await self.report_repo.find_by_id(report_id)

        if report is None:
            raise NotFoundException(
                code="REPORT_NOT_FOUND",
                message="Report not found",
            )

        return ReportResponse.model_validate(report)

    async def get_pending_reports(
        self,
        limit: int | None = None,
        offset: int | None = None,
    ) -> list[ReportResponse]:
        """Get pending reports (admin functionality).

        Args:
            limit: Maximum number of results (optional)
            offset: Number of results to skip (optional)

        Returns:
            List of pending ReportResponse
        """
        reports = await self.report_repo.find_by_status(ReportStatus.PENDING, limit, offset)

        return [ReportResponse.model_validate(r) for r in reports]

    async def review_report(
        self,
        report_id: uuid.UUID,
        reviewer_id: uuid.UUID,
        status: ReportStatus,
    ) -> None:
        """Review a report (admin functionality).

        Args:
            report_id: Report UUID
            reviewer_id: ID of the admin reviewing
            status: New status for the report

        Raises:
            NotFoundException: If report not found
        """
        updated = await self.report_repo.update_status(
            report_id=report_id,
            status=status,
            reviewer_id=reviewer_id,
        )

        if not updated:
            raise NotFoundException(
                code="REPORT_NOT_FOUND",
                message="Report not found",
            )

    async def get_report_count_for_target(
        self,
        target_type: ReportTargetType,
        target_id: uuid.UUID,
    ) -> int:
        """Get the number of reports for a specific target.

        Args:
            target_type: Type of the reported entity
            target_id: ID of the reported entity

        Returns:
            Number of reports for the target
        """
        return await self.report_repo.count_by_target(target_type, target_id)

    def should_auto_block(self, report_count: int) -> bool:
        """Check if the report count exceeds auto-block threshold.

        Args:
            report_count: Current number of reports for a target

        Returns:
            True if auto-block threshold is exceeded
        """
        return report_count >= self.AUTO_BLOCK_THRESHOLD

    async def check_for_abuse_patterns(
        self,
        target_type: ReportTargetType,
        target_id: uuid.UUID,
    ) -> bool:
        """Check if target has abuse patterns (multiple reports).

        Args:
            target_type: Type of the reported entity
            target_id: ID of the reported entity

        Returns:
            True if abuse patterns detected
        """
        count = await self.get_report_count_for_target(target_type, target_id)
        return self.should_auto_block(count)

    # ==================== Admin Methods ====================

    async def get_all_reports(
        self,
        status: ReportStatus | None = None,
        target_type: ReportTargetType | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[ReportResponse], int]:
        """Get all reports with optional filters (Admin only).

        Args:
            status: Optional filter by status
            target_type: Optional filter by target type
            limit: Maximum number of results
            offset: Number of results to skip

        Returns:
            Tuple of (list of ReportResponse, total count)
        """
        reports = await self.report_repo.find_all(status, target_type, limit, offset)
        total = await self.report_repo.count_all(status, target_type)
        return [ReportResponse.model_validate(r) for r in reports], total
