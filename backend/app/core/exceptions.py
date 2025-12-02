"""Custom exception classes for the application."""

from typing import Any


class CirclyError(Exception):
    """Base exception for all Circly errors."""

    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = 400,
        details: dict[str, Any] | None = None,
    ) -> None:
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class NotFoundError(CirclyError):
    """Resource not found error."""

    def __init__(
        self,
        resource: str,
        resource_id: str | None = None,
        message: str | None = None,
    ) -> None:
        msg = message or f"{resource}을(를) 찾을 수 없습니다"
        details = {"resource": resource}
        if resource_id:
            details["resource_id"] = resource_id
        super().__init__(
            code="NOT_FOUND",
            message=msg,
            status_code=404,
            details=details,
        )


class AlreadyExistsError(CirclyError):
    """Resource already exists error."""

    def __init__(
        self,
        resource: str,
        field: str | None = None,
        message: str | None = None,
    ) -> None:
        msg = message or f"이미 존재하는 {resource}입니다"
        details = {"resource": resource}
        if field:
            details["field"] = field
        super().__init__(
            code="ALREADY_EXISTS",
            message=msg,
            status_code=409,
            details=details,
        )


class AuthenticationError(CirclyError):
    """Authentication failed error."""

    def __init__(self, message: str = "인증에 실패했습니다") -> None:
        super().__init__(
            code="AUTH_REQUIRED",
            message=message,
            status_code=401,
        )


class AuthorizationError(CirclyError):
    """Authorization failed error."""

    def __init__(self, message: str = "접근 권한이 없습니다") -> None:
        super().__init__(
            code="FORBIDDEN",
            message=message,
            status_code=403,
        )


class ValidationError(CirclyError):
    """Input validation error."""

    def __init__(
        self,
        message: str = "입력값 검증에 실패했습니다",
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            code="VALIDATION_ERROR",
            message=message,
            status_code=422,
            details=details,
        )


# Domain-specific error codes
class CircleError(CirclyError):
    """Circle-related errors."""

    pass


class CircleNotFoundError(CircleError):
    """Circle not found."""

    def __init__(self, circle_id: str | None = None) -> None:
        super().__init__(
            code="CIRCLE_NOT_FOUND",
            message="Circle을 찾을 수 없습니다",
            status_code=404,
            details={"circle_id": circle_id} if circle_id else {},
        )


class InvalidInviteCodeError(CircleError):
    """Invalid invite code."""

    def __init__(self) -> None:
        super().__init__(
            code="INVALID_INVITE_CODE",
            message="유효하지 않은 초대 코드입니다",
            status_code=400,
        )


class CircleFullError(CircleError):
    """Circle is full."""

    def __init__(self, max_members: int) -> None:
        super().__init__(
            code="CIRCLE_FULL",
            message="Circle 멤버 수가 초과되었습니다",
            status_code=400,
            details={"max_members": max_members},
        )


class AlreadyMemberError(CircleError):
    """Already a member of the circle."""

    def __init__(self) -> None:
        super().__init__(
            code="ALREADY_MEMBER",
            message="이미 가입된 Circle입니다",
            status_code=409,
        )


class PollError(CirclyError):
    """Poll-related errors."""

    pass


class PollNotFoundError(PollError):
    """Poll not found."""

    def __init__(self, poll_id: str | None = None) -> None:
        super().__init__(
            code="POLL_NOT_FOUND",
            message="투표를 찾을 수 없습니다",
            status_code=404,
            details={"poll_id": poll_id} if poll_id else {},
        )


class PollEndedError(PollError):
    """Poll has already ended."""

    def __init__(self) -> None:
        super().__init__(
            code="POLL_ENDED",
            message="투표가 종료되었습니다",
            status_code=400,
        )


class AlreadyVotedError(PollError):
    """Already voted in this poll."""

    def __init__(self) -> None:
        super().__init__(
            code="ALREADY_VOTED",
            message="이미 투표에 참여하셨습니다",
            status_code=409,
        )


class SelfVoteError(PollError):
    """Cannot vote for yourself."""

    def __init__(self) -> None:
        super().__init__(
            code="SELF_VOTE_NOT_ALLOWED",
            message="자기 자신에게 투표할 수 없습니다",
            status_code=400,
        )


class MaxPollsExceededError(PollError):
    """Maximum active polls exceeded."""

    def __init__(self, max_polls: int = 3) -> None:
        super().__init__(
            code="MAX_POLLS_EXCEEDED",
            message="동시 진행 가능한 투표 수를 초과했습니다",
            status_code=400,
            details={"max_polls": max_polls},
        )
