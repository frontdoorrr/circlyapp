"""Tests for Report Repository."""

import uuid

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import ReportReason, ReportStatus, ReportTargetType
from app.modules.auth.repository import UserRepository
from app.modules.auth.schemas import UserCreate
from app.modules.reports.models import Report
from app.modules.reports.repository import ReportRepository
from app.modules.reports.schemas import ReportCreate


class TestReportRepository:
    """Tests for ReportRepository."""

    @pytest.mark.asyncio
    async def test_create_report(self, db_session: AsyncSession) -> None:
        """Test report creation."""
        # Setup: Create reporter user
        user_repo = UserRepository(db_session)
        reporter = await user_repo.create(
            UserCreate(email="reporter@example.com", password="password123")
        )

        # Create report
        repo = ReportRepository(db_session)
        report_data = ReportCreate(
            target_type=ReportTargetType.USER,
            target_id=uuid.uuid4(),
            reason=ReportReason.HARASSMENT,
            description="This user sent harassing messages",
        )
        report = await repo.create(reporter_id=reporter.id, data=report_data)

        assert report is not None
        assert report.reporter_id == reporter.id
        assert report.target_type == ReportTargetType.USER
        assert report.reason == ReportReason.HARASSMENT
        assert report.description == "This user sent harassing messages"
        assert report.status == ReportStatus.PENDING

    @pytest.mark.asyncio
    async def test_create_report_without_description(self, db_session: AsyncSession) -> None:
        """Test report creation without optional description."""
        # Setup
        user_repo = UserRepository(db_session)
        reporter = await user_repo.create(
            UserCreate(email="reporter@example.com", password="password123")
        )

        # Create report without description
        repo = ReportRepository(db_session)
        report_data = ReportCreate(
            target_type=ReportTargetType.POLL,
            target_id=uuid.uuid4(),
            reason=ReportReason.SPAM,
        )
        report = await repo.create(reporter_id=reporter.id, data=report_data)

        assert report is not None
        assert report.description is None
        assert report.reason == ReportReason.SPAM

    @pytest.mark.asyncio
    async def test_find_by_id(self, db_session: AsyncSession) -> None:
        """Test finding report by ID."""
        # Setup
        user_repo = UserRepository(db_session)
        reporter = await user_repo.create(
            UserCreate(email="reporter@example.com", password="password123")
        )

        # Create report
        report = Report(
            reporter_id=reporter.id,
            target_type=ReportTargetType.CIRCLE,
            target_id=uuid.uuid4(),
            reason=ReportReason.INAPPROPRIATE,
            status=ReportStatus.PENDING,
        )
        db_session.add(report)
        await db_session.commit()
        await db_session.refresh(report)

        # Test: Find by ID
        repo = ReportRepository(db_session)
        found_report = await repo.find_by_id(report.id)

        assert found_report is not None
        assert found_report.id == report.id
        assert found_report.target_type == ReportTargetType.CIRCLE

    @pytest.mark.asyncio
    async def test_find_by_id_not_found(self, db_session: AsyncSession) -> None:
        """Test finding non-existent report by ID."""
        repo = ReportRepository(db_session)
        found_report = await repo.find_by_id(uuid.uuid4())

        assert found_report is None

    @pytest.mark.asyncio
    async def test_find_by_status(self, db_session: AsyncSession) -> None:
        """Test finding reports by status."""
        # Setup
        user_repo = UserRepository(db_session)
        reporter = await user_repo.create(
            UserCreate(email="reporter@example.com", password="password123")
        )

        # Create reports with different statuses
        pending_report = Report(
            reporter_id=reporter.id,
            target_type=ReportTargetType.USER,
            target_id=uuid.uuid4(),
            reason=ReportReason.HARASSMENT,
            status=ReportStatus.PENDING,
        )
        resolved_report = Report(
            reporter_id=reporter.id,
            target_type=ReportTargetType.POLL,
            target_id=uuid.uuid4(),
            reason=ReportReason.SPAM,
            status=ReportStatus.RESOLVED,
        )
        dismissed_report = Report(
            reporter_id=reporter.id,
            target_type=ReportTargetType.CIRCLE,
            target_id=uuid.uuid4(),
            reason=ReportReason.OTHER,
            status=ReportStatus.DISMISSED,
        )
        db_session.add_all([pending_report, resolved_report, dismissed_report])
        await db_session.commit()

        # Test: Find pending reports
        repo = ReportRepository(db_session)
        pending_reports = await repo.find_by_status(ReportStatus.PENDING)

        assert len(pending_reports) == 1
        assert pending_reports[0].status == ReportStatus.PENDING

    @pytest.mark.asyncio
    async def test_find_by_status_with_limit(self, db_session: AsyncSession) -> None:
        """Test finding reports with limit."""
        # Setup
        user_repo = UserRepository(db_session)
        reporter = await user_repo.create(
            UserCreate(email="reporter@example.com", password="password123")
        )

        # Create multiple pending reports
        for i in range(5):
            report = Report(
                reporter_id=reporter.id,
                target_type=ReportTargetType.USER,
                target_id=uuid.uuid4(),
                reason=ReportReason.HARASSMENT,
                status=ReportStatus.PENDING,
            )
            db_session.add(report)
        await db_session.commit()

        # Test: Get only 3 reports
        repo = ReportRepository(db_session)
        reports = await repo.find_by_status(ReportStatus.PENDING, limit=3)

        assert len(reports) == 3

    @pytest.mark.asyncio
    async def test_find_by_target_id(self, db_session: AsyncSession) -> None:
        """Test finding reports by target ID."""
        # Setup
        user_repo = UserRepository(db_session)
        reporter = await user_repo.create(
            UserCreate(email="reporter@example.com", password="password123")
        )

        target_id = uuid.uuid4()

        # Create multiple reports for the same target
        report1 = Report(
            reporter_id=reporter.id,
            target_type=ReportTargetType.USER,
            target_id=target_id,
            reason=ReportReason.HARASSMENT,
            status=ReportStatus.PENDING,
        )
        report2 = Report(
            reporter_id=reporter.id,
            target_type=ReportTargetType.USER,
            target_id=target_id,
            reason=ReportReason.SPAM,
            status=ReportStatus.PENDING,
        )
        # Report for different target
        other_report = Report(
            reporter_id=reporter.id,
            target_type=ReportTargetType.USER,
            target_id=uuid.uuid4(),
            reason=ReportReason.OTHER,
            status=ReportStatus.PENDING,
        )
        db_session.add_all([report1, report2, other_report])
        await db_session.commit()

        # Test: Find reports for specific target
        repo = ReportRepository(db_session)
        reports = await repo.find_by_target_id(ReportTargetType.USER, target_id)

        assert len(reports) == 2
        assert all(r.target_id == target_id for r in reports)

    @pytest.mark.asyncio
    async def test_update_status(self, db_session: AsyncSession) -> None:
        """Test updating report status."""
        # Setup
        user_repo = UserRepository(db_session)
        reporter = await user_repo.create(
            UserCreate(email="reporter@example.com", password="password123")
        )
        reviewer = await user_repo.create(
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

        # Test: Update status
        repo = ReportRepository(db_session)
        updated = await repo.update_status(
            report_id=report.id,
            status=ReportStatus.RESOLVED,
            reviewer_id=reviewer.id,
        )

        assert updated is True

        await db_session.refresh(report)
        assert report.status == ReportStatus.RESOLVED
        assert report.reviewed_by == reviewer.id
        assert report.reviewed_at is not None

    @pytest.mark.asyncio
    async def test_update_status_not_found(self, db_session: AsyncSession) -> None:
        """Test updating status for non-existent report."""
        repo = ReportRepository(db_session)
        updated = await repo.update_status(
            report_id=uuid.uuid4(),
            status=ReportStatus.RESOLVED,
            reviewer_id=uuid.uuid4(),
        )

        assert updated is False

    @pytest.mark.asyncio
    async def test_count_by_target(self, db_session: AsyncSession) -> None:
        """Test counting reports for a target."""
        # Setup
        user_repo = UserRepository(db_session)
        reporter = await user_repo.create(
            UserCreate(email="reporter@example.com", password="password123")
        )

        target_id = uuid.uuid4()

        # Create multiple reports for the same target
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

        # Test: Count reports
        repo = ReportRepository(db_session)
        count = await repo.count_by_target(ReportTargetType.USER, target_id)

        assert count == 3

    @pytest.mark.asyncio
    async def test_exists_by_reporter_and_target(self, db_session: AsyncSession) -> None:
        """Test checking if reporter already reported target."""
        # Setup
        user_repo = UserRepository(db_session)
        reporter = await user_repo.create(
            UserCreate(email="reporter@example.com", password="password123")
        )

        target_id = uuid.uuid4()

        # Create report
        report = Report(
            reporter_id=reporter.id,
            target_type=ReportTargetType.USER,
            target_id=target_id,
            reason=ReportReason.HARASSMENT,
            status=ReportStatus.PENDING,
        )
        db_session.add(report)
        await db_session.commit()

        # Test: Check if exists
        repo = ReportRepository(db_session)
        exists = await repo.exists_by_reporter_and_target(
            reporter_id=reporter.id,
            target_type=ReportTargetType.USER,
            target_id=target_id,
        )

        assert exists is True

        # Test: Check for different target
        exists_other = await repo.exists_by_reporter_and_target(
            reporter_id=reporter.id,
            target_type=ReportTargetType.USER,
            target_id=uuid.uuid4(),
        )

        assert exists_other is False
