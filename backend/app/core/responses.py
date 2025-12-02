"""Standard API response formats."""

from typing import Any, Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class ErrorDetail(BaseModel):
    """Error detail schema."""

    code: str
    message: str
    details: dict[str, Any] | None = None


class SuccessResponse(BaseModel, Generic[T]):
    """Standard success response schema."""

    success: bool = True
    data: T
    message: str | None = None


class ErrorResponse(BaseModel):
    """Standard error response schema."""

    success: bool = False
    error: ErrorDetail


class ListData(BaseModel, Generic[T]):
    """List response data schema with pagination info."""

    items: list[T]
    total: int
    has_more: bool = False


class ListResponse(BaseModel, Generic[T]):
    """Standard list response schema."""

    success: bool = True
    data: ListData[T]


def success_response(
    data: Any,
    message: str | None = None,
) -> dict[str, Any]:
    """Create a success response dict."""
    response: dict[str, Any] = {
        "success": True,
        "data": data,
    }
    if message:
        response["message"] = message
    return response


def error_response(
    code: str,
    message: str,
    details: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Create an error response dict."""
    error: dict[str, Any] = {
        "code": code,
        "message": message,
    }
    if details:
        error["details"] = details
    return {
        "success": False,
        "error": error,
    }


def list_response(
    items: list[Any],
    total: int,
    has_more: bool = False,
) -> dict[str, Any]:
    """Create a list response dict."""
    return {
        "success": True,
        "data": {
            "items": items,
            "total": total,
            "has_more": has_more,
        },
    }
