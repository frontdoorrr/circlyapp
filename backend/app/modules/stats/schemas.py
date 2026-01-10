"""Schemas for stats module."""

from datetime import date

from pydantic import BaseModel, Field


class StatsOverview(BaseModel):
    """Overview statistics response."""

    total_users: int = Field(..., description="Total number of users")
    total_circles: int = Field(..., description="Total number of circles")
    total_polls: int = Field(..., description="Total number of polls")
    active_polls: int = Field(..., description="Number of active polls")
    pending_reports: int = Field(..., description="Number of pending reports")
    today_new_users: int = Field(..., description="New users registered today")
    today_new_polls: int = Field(..., description="Polls created today")


class DailyCount(BaseModel):
    """Daily count data point."""

    date: date
    count: int


class UserStatsResponse(BaseModel):
    """User statistics response."""

    new_users: list[DailyCount] = Field(..., description="Daily new user counts")
    active_users: list[DailyCount] = Field(..., description="Daily active user counts")


class PollStatsResponse(BaseModel):
    """Poll statistics response."""

    created: list[DailyCount] = Field(..., description="Daily created poll counts")
    votes: list[DailyCount] = Field(..., description="Daily vote counts")


class ReportStatusCount(BaseModel):
    """Report count by status."""

    status: str
    count: int


class ReportTypeCount(BaseModel):
    """Report count by target type."""

    target_type: str
    count: int


class ReportStatsResponse(BaseModel):
    """Report statistics response."""

    by_status: list[ReportStatusCount] = Field(..., description="Reports grouped by status")
    by_type: list[ReportTypeCount] = Field(..., description="Reports grouped by target type")
    total: int = Field(..., description="Total number of reports")
