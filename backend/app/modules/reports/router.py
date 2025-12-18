"""API routes for reports."""

from fastapi import APIRouter, status

from app.deps import CurrentUserDep, ReportServiceDep
from app.modules.reports.schemas import ReportCreate, ReportResponse

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
