"""API routes for reports."""

import uuid

from fastapi import APIRouter, Query, status

from app.core.enums import ReportStatus, ReportTargetType
from app.deps import AdminUserDep, CurrentUserDep, ReportServiceDep
from app.modules.reports.schemas import (
    ReportCreate,
    ReportListAdminResponse,
    ReportResponse,
    ReportReview,
)

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.post(
    "",
    response_model=ReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a report",
)
async def create_report(
    report_data: ReportCreate,
    current_user: CurrentUserDep,
    service: ReportServiceDep,
) -> ReportResponse:
    """Create a new report for inappropriate content or behavior.

    Users can report:
    - Other users (USER)
    - Circles (CIRCLE)
    - Polls (POLL)

    Report reasons:
    - INAPPROPRIATE: Content violates community guidelines
    - SPAM: Unsolicited or repetitive content
    - HARASSMENT: Bullying or harassing behavior
    - OTHER: Other issues not covered above
    """
    return await service.create_report(
        reporter_id=current_user.id,
        data=report_data,
    )


# ==================== Admin Endpoints ====================


@router.get(
    "/admin/all",
    response_model=ReportListAdminResponse,
    summary="[Admin] Get all reports",
    tags=["Admin - Reports"],
)
async def get_all_reports(
    admin_user: AdminUserDep,
    service: ReportServiceDep,
    status: ReportStatus | None = Query(None, description="Filter by status"),
    target_type: ReportTargetType | None = Query(None, description="Filter by target type"),
    limit: int = Query(50, ge=1, le=100, description="Max results"),
    offset: int = Query(0, ge=0, description="Skip results"),
) -> ReportListAdminResponse:
    """Get all reports with optional filters (Admin only)."""
    reports, total = await service.get_all_reports(status, target_type, limit, offset)
    return ReportListAdminResponse(items=reports, total=total, limit=limit, offset=offset)


@router.get(
    "/admin/{report_id}",
    response_model=ReportResponse,
    summary="[Admin] Get report by ID",
    tags=["Admin - Reports"],
)
async def get_report_by_id(
    report_id: uuid.UUID,
    admin_user: AdminUserDep,
    service: ReportServiceDep,
) -> ReportResponse:
    """Get report by ID (Admin only)."""
    return await service.get_report_by_id(report_id)


@router.put(
    "/admin/{report_id}/review",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="[Admin] Review report",
    tags=["Admin - Reports"],
)
async def review_report(
    report_id: uuid.UUID,
    request: ReportReview,
    admin_user: AdminUserDep,
    service: ReportServiceDep,
) -> None:
    """Review and update report status (Admin only)."""
    await service.review_report(report_id, admin_user.id, request.status)
