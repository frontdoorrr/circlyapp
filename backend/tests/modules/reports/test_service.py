"""Tests for Report Service."""

import uuid

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import ReportReason, ReportStatus, ReportTargetType
from app.core.exceptions import BadRequestException, NotFoundException
from app.modules.auth.repository import UserRepository
from app.modules.auth.schemas import UserCreate
from app.modules.reports.models import Report
from app.modules.reports.repository import ReportRepository
from app.modules.reports.schemas import ReportCreate
from app.modules.reports.service import ReportService


class TestReportService:
    """Tests for ReportService."""

    @pytest.mark.asyncio
    async def test_create_report(self, db_session: AsyncSession) -> None:
        """Test creating a new report."""
        # Setup: Create reporter
        user_repo = UserRepository(db_session)
        reporter = await user_repo.create(
            UserCreate(email="reporter@example.com", password="password123")
        )

        # Initialize service
        report_repo = ReportRepository(db_session)
        service = ReportService(report_repo)

        # Test: Create report
        target_id = uuid.uuid4()
        report_data = ReportCreate(
            target_type=ReportTargetType.USER,
            target_id=target_id,
            reason=ReportReason.HARASSMENT,
            description="Harassing messages",
        )
        report = await service.create_report(reporter.id, report_data)

        assert report is not None
        assert report.reporter_id == reporter.id
        assert report.target_type == ReportTargetType.USER
        assert report.target_id == target_id
        assert report.reason == ReportReason.HARASSMENT
        assert report.status == ReportStatus.PENDING

    @pytest.mark.asyncio
    async def test_create_report_duplicate(self, db_session: AsyncSession) -> None:
        """Test creating duplicate report for same target raises error."""
        # Setup
        user_repo = UserRepository(db_session)
        reporter = await user_repo.create(
            UserCreate(email="reporter@example.com", password="password123")
        )

        target_id = uuid.uuid4()

        # Create first report
        existing_report = Report(
            reporter_id=reporter.id,
            target_type=ReportTargetType.USER,
            target_id=target_id,
            reason=ReportReason.HARASSMENT,
            status=ReportStatus.PENDING,
        )
        db_session.add(existing_report)
        await db_session.commit()

        # Initialize service
        report_repo = ReportRepository(db_session)
        service = ReportService(report_repo)

        # Test: Try to create duplicate report
        report_data = ReportCreate(
            target_type=ReportTargetType.USER,
            target_id=target_id,
            reason=ReportReason.SPAM,
        )

        with pytest.raises(BadRequestException) as exc_info:
            await service.create_report(reporter.id, report_data)

        assert "ALREADY_REPORTED" in str(exc_info.value.code)

    @pytest.mark.asyncio
    async def test_create_report_self_report(self, db_session: AsyncSession) -> None:
        """Test creating self-report raises error."""
        # Setup
        user_repo = UserRepository(db_session)
        reporter = await user_repo.create(
            UserCreate(email="reporter@example.com", password="password123")
        )

        # Initialize service
        report_repo = ReportRepository(db_session)
        service = ReportService(report_repo)

        # Test: Try to report self
        report_data = ReportCreate(
            target_type=ReportTargetType.USER,
            target_id=reporter.id,
            reason=ReportReason.HARASSMENT,
        )

        with pytest.raises(BadRequestException) as exc_info:
            await service.create_report(reporter.id, report_data)

        assert "SELF_REPORT" in str(exc_info.value.code)

    @pytest.mark.asyncio
    async def test_get_report_by_id(self, db_session: AsyncSession) -> None:
        """Test getting report by ID."""
        # Setup
        user_repo = UserRepository(db_session)
        reporter = await user_repo.create(
            UserCreate(email="reporter@example.com", password="password123")
        )

        report = Report(
            reporter_id=reporter.id,
            target_type=ReportTargetType.POLL,
            target_id=uuid.uuid4(),
            reason=ReportReason.SPAM,
            status=ReportStatus.PENDING,
        )
        db_session.add(report)
        await db_session.commit()
        await db_session.refresh(report)

        # Initialize service
        report_repo = ReportRepository(db_session)
        service = ReportService(report_repo)

        # Test
        found_report = await service.get_report_by_id(report.id)

        assert found_report is not None
        assert found_report.id == report.id

    @pytest.mark.asyncio
    async def test_get_report_by_id_not_found(self, db_session: AsyncSession) -> None:
        """Test getting non-existent report raises error."""
        # Initialize service
        report_repo = ReportRepository(db_session)
        service = ReportService(report_repo)

        # Test
        with pytest.raises(NotFoundException) as exc_info:
            await service.get_report_by_id(uuid.uuid4())

        assert "REPORT_NOT_FOUND" in str(exc_info.value.code)

    @pytest.mark.asyncio
    async def test_get_pending_reports(self, db_session: AsyncSession) -> None:
        """Test getting pending reports (admin functionality)."""
        # Setup
        user_repo = UserRepository(db_session)
        reporter = await user_repo.create(
            UserCreate(email="reporter@example.com", password="password123")
        )

        # Create reports with different statuses
        pending1 = Report(
            reporter_id=reporter.id,
            target_type=ReportTargetType.USER,
            target_id=uuid.uuid4(),
            reason=ReportReason.HARASSMENT,
            status=ReportStatus.PENDING,
        )
        pending2 = Report(
            reporter_id=reporter.id,
            target_type=ReportTargetType.POLL,
            target_id=uuid.uuid4(),
            reason=ReportReason.SPAM,
            status=ReportStatus.PENDING,
        )
        resolved = Report(
            reporter_id=reporter.id,
            target_type=ReportTargetType.CIRCLE,
            target_id=uuid.uuid4(),
            reason=ReportReason.OTHER,
            status=ReportStatus.RESOLVED,
        )
        db_session.add_all([pending1, pending2, resolved])
        await db_session.commit()

        # Initialize service
        report_repo = ReportRepository(db_session)
        service = ReportService(report_repo)

        # Test
        pending_reports = await service.get_pending_reports()

        assert len(pending_reports) == 2
        assert all(r.status == ReportStatus.PENDING for r in pending_reports)

    @pytest.mark.asyncio
    async def test_review_report(self, db_session: AsyncSession) -> None:
        """Test reviewing a report (admin functionality)."""
        # Setup
        user_repo = UserRepository(db_session)
        reporter = await user_repo.create(
            UserCreate(email="reporter@example.com", password="password123")
        )
        admin = await user_repo.create(
            UserCreate(email="admin@example.com", password="password123")
        )

        report = Report(
            reporter_id=reporter.id,
            target_type=ReportTargetType.USER,
            target_id=uuid.uuid4(),
            reason=ReportReason.HARASSMENT,
            status=ReportStatus.PENDING,
        )
        db_session.add(report)
        await db_session.commit()
        await db_session.refresh(report)

        # Initialize service
        report_repo = ReportRepository(db_session)
        service = ReportService(report_repo)

        # Test: Review report
        await service.review_report(report.id, admin.id, ReportStatus.RESOLVED)

        await db_session.refresh(report)
        assert report.status == ReportStatus.RESOLVED
        assert report.reviewed_by == admin.id
        assert report.reviewed_at is not None

    @pytest.mark.asyncio
    async def test_review_report_not_found(self, db_session: AsyncSession) -> None:
        """Test reviewing non-existent report raises error."""
        # Initialize service
        report_repo = ReportRepository(db_session)
        service = ReportService(report_repo)

        # Test
        with pytest.raises(NotFoundException):
            await service.review_report(uuid.uuid4(), uuid.uuid4(), ReportStatus.RESOLVED)

    @pytest.mark.asyncio
    async def test_get_report_count_for_target(self, db_session: AsyncSession) -> None:
        """Test getting report count for a target."""
        # Setup
        user_repo = UserRepository(db_session)
        reporter = await user_repo.create(
            UserCreate(email="reporter@example.com", password="password123")
        )

        target_id = uuid.uuid4()

        # Create multiple reports for same target
        for i in range(3):
            report = Report(
                reporter_id=reporter.id,
                target_type=ReportTargetType.USER,
                target_id=target_id,
                reason=ReportReason.HARASSMENT,
                status=ReportStatus.PENDING,
            )
            db_session.add(report)
        await db_session.commit()

        # Initialize service
        report_repo = ReportRepository(db_session)
        service = ReportService(report_repo)

        # Test
        count = await service.get_report_count_for_target(ReportTargetType.USER, target_id)

        assert count == 3

    @pytest.mark.asyncio
    async def test_should_auto_block(self, db_session: AsyncSession) -> None:
        """Test auto-block threshold check."""
        # Initialize service
        report_repo = ReportRepository(db_session)
        service = ReportService(report_repo)

        # Test: Below threshold
        assert service.should_auto_block(2) is False
        assert service.should_auto_block(4) is False

        # Test: At or above threshold (default 5)
        assert service.should_auto_block(5) is True
        assert service.should_auto_block(10) is True
