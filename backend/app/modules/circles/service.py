"""Business logic for circles module."""

import uuid
from datetime import UTC, datetime, timedelta

from app.core.enums import MemberRole
from app.core.exceptions import (
    AlreadyMemberError,
    BadRequestException,
    CircleFullError,
    CircleNotFoundError,
    InvalidInviteCodeError,
)
from app.core.security import generate_invite_code
from app.modules.circles.models import Circle
from app.modules.circles.repository import CircleRepository, MembershipRepository
from app.modules.circles.schemas import (
    CircleCreate,
    CircleDetail,
    CircleResponse,
    MemberInfo,
    RegenerateInviteCodeResponse,
    ResolveInviteLinkResponse,
    ValidateInviteCodeResponse,
)
from app.modules.polls.repository import PollRepository


class CircleService:
    """Service for circle operations."""

    INVITE_CODE_TTL = timedelta(hours=24)

    def __init__(
        self,
        circle_repo: CircleRepository,
        membership_repo: MembershipRepository,
    ) -> None:
        """Initialize service with repositories."""
        self.circle_repo = circle_repo
        self.membership_repo = membership_repo
        self._poll_repo: PollRepository | None = None

    @property
    def poll_repo(self) -> PollRepository:
        """Get poll repository (lazy initialization)."""
        if self._poll_repo is None:
            self._poll_repo = PollRepository(self.circle_repo.session)
        return self._poll_repo

    async def _to_circle_response(self, circle: Circle) -> CircleResponse:
        """Convert Circle model to CircleResponse with active polls count."""
        active_polls_count = await self.poll_repo.count_active_by_circle_id(circle.id)
        response = CircleResponse.model_validate(circle)
        response.active_polls_count = active_polls_count
        return response

    async def create_circle(
        self,
        circle_data: CircleCreate,
        owner_id: uuid.UUID,
    ) -> CircleResponse:
        """Create a new circle and add owner as first member.

        Args:
            circle_data: Circle creation data
            owner_id: UUID of the owner

        Returns:
            CircleResponse with created circle data
        """
        invite_code = generate_invite_code()
        circle = await self.circle_repo.create(circle_data, owner_id, invite_code)
        await self.membership_repo.create(circle.id, owner_id, MemberRole.OWNER)
        return await self._to_circle_response(circle)

    async def join_by_code(
        self,
        invite_code: str,
        user_id: uuid.UUID,
        nickname: str | None = None,
    ) -> CircleResponse:
        """Join a circle using invite code.

        Args:
            invite_code: 6-character invite code
            user_id: UUID of the user joining
            nickname: Optional nickname in the circle

        Returns:
            CircleResponse with joined circle data

        Raises:
            InvalidInviteCodeError: If invite code is invalid
            CircleFullError: If circle is at max capacity
            AlreadyMemberError: If user is already a member
        """
        # Find circle by invite code
        circle = await self.circle_repo.find_by_invite_code(invite_code)
        if circle is None or not circle.is_active or self._is_invite_code_expired(circle):
            raise InvalidInviteCodeError()

        return await self._join_circle(circle, user_id, nickname)

    async def join_by_link(
        self,
        invite_link_id: uuid.UUID,
        user_id: uuid.UUID,
        nickname: str | None = None,
    ) -> CircleResponse:
        """Join a Circle through its permanent link identifier."""
        circle = await self.circle_repo.find_by_invite_link_id(invite_link_id)
        if circle is None or not circle.is_active:
            raise InvalidInviteCodeError()

        return await self._join_circle(circle, user_id, nickname)

    async def _join_circle(
        self,
        circle: Circle,
        user_id: uuid.UUID,
        nickname: str | None,
    ) -> CircleResponse:
        """Apply the shared membership checks and join mutation."""

        # Check if already a member
        is_member = await self.membership_repo.exists(circle.id, user_id)
        if is_member:
            raise AlreadyMemberError()

        # Check if circle is full
        if circle.member_count >= circle.max_members:
            raise CircleFullError(circle.max_members)

        # Add member
        await self.membership_repo.create(circle.id, user_id, MemberRole.MEMBER, nickname)

        # Increment member count
        await self.circle_repo.increment_member_count(circle.id)

        # Refresh circle data
        updated_circle = await self.circle_repo.find_by_id(circle.id)
        if updated_circle is None:
            raise CircleNotFoundError(str(circle.id))
        return await self._to_circle_response(updated_circle)

    @staticmethod
    def _is_invite_code_expired(circle: Circle) -> bool:
        """Return whether a Circle's fallback invite code has expired."""
        expires_at = circle.invite_code_expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=UTC)
        return expires_at <= datetime.now(UTC)

    async def get_user_circles(self, user_id: uuid.UUID) -> list[CircleResponse]:
        """Get all circles a user is a member of.

        Args:
            user_id: UUID of the user

        Returns:
            List of CircleResponse
        """
        circles = await self.circle_repo.find_by_user_id(user_id)
        return [await self._to_circle_response(circle) for circle in circles]

    async def get_circle_detail(
        self,
        circle_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> CircleDetail:
        """Get detailed circle information with members.

        Args:
            circle_id: UUID of the circle
            user_id: UUID of the requesting user

        Returns:
            CircleDetail with members list

        Raises:
            CircleNotFoundError: If circle not found
            BadRequestException: If user is not a member
        """
        # Check if user is a member
        is_member = await self.membership_repo.exists(circle_id, user_id)
        if not is_member:
            raise BadRequestException("You are not a member of this circle")

        # Get circle with members
        circle = await self.circle_repo.find_with_members(circle_id)
        if circle is None:
            raise CircleNotFoundError(str(circle_id))

        # Build response with member info
        circle_response = await self._to_circle_response(circle)
        circle_dict = circle_response.model_dump()

        # Add members with user info
        members_info = []
        for membership in circle.members:
            member_info = MemberInfo.model_validate(membership)
            # Add user info from relationship
            if membership.user:
                member_info.username = membership.user.username
                member_info.display_name = membership.user.display_name
                member_info.profile_emoji = membership.user.profile_emoji
            members_info.append(member_info)

        circle_dict["members"] = members_info
        return CircleDetail(**circle_dict)

    async def leave_circle(
        self,
        circle_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> None:
        """Leave a circle.

        Args:
            circle_id: UUID of the circle
            user_id: UUID of the user leaving

        Raises:
            CircleNotFoundError: If circle not found
            BadRequestException: If user is not a member or is the owner
        """
        # Check if circle exists
        circle = await self.circle_repo.find_by_id(circle_id)
        if circle is None:
            raise CircleNotFoundError(str(circle_id))

        # Check if user is owner (owners cannot leave)
        if circle.owner_id == user_id:
            raise BadRequestException("Circle owner cannot leave the circle")

        # Check if user is a member
        membership = await self.membership_repo.find_membership(circle_id, user_id)
        if membership is None:
            raise BadRequestException("You are not a member of this circle")

        # Remove membership
        await self.membership_repo.delete(circle_id, user_id)

        # Decrement member count
        await self.circle_repo.decrement_member_count(circle_id)

    async def regenerate_invite_code(
        self,
        circle_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> RegenerateInviteCodeResponse:
        """Regenerate circle's invite code (owner only).

        Args:
            circle_id: UUID of the circle
            user_id: UUID of the requesting user

        Returns:
            RegenerateInviteCodeResponse with new invite code

        Raises:
            CircleNotFoundError: If circle not found
            BadRequestException: If user is not the owner
        """
        # Check if circle exists
        circle = await self.circle_repo.find_by_id(circle_id)
        if circle is None:
            raise CircleNotFoundError(str(circle_id))

        # Check if user is owner
        if circle.owner_id != user_id:
            raise BadRequestException("Only the circle owner can regenerate invite code")

        # Generate new invite code
        new_code = generate_invite_code()
        expires_at = datetime.now(UTC) + self.INVITE_CODE_TTL

        # Update circle
        updated_circle = await self.circle_repo.update_invite_code(
            circle_id,
            new_code,
            expires_at,
        )
        if updated_circle is None:
            raise CircleNotFoundError(str(circle_id))

        return RegenerateInviteCodeResponse(
            invite_code=new_code,
            invite_code_expires_at=expires_at,
            invite_link_id=updated_circle.invite_link_id,
        )

    async def validate_invite_code(
        self,
        invite_code: str,
    ) -> ValidateInviteCodeResponse:
        """Validate an invite code and return circle info if valid.

        Args:
            invite_code: 6-character invite code

        Returns:
            ValidateInviteCodeResponse with validation result and circle info
        """
        # Find circle by invite code
        circle = await self.circle_repo.find_by_invite_code(invite_code)

        if circle is None or not circle.is_active or self._is_invite_code_expired(circle):
            return ValidateInviteCodeResponse(
                valid=False,
                message="Invalid or expired invite code",
            )

        # Check if circle is full
        if circle.member_count >= circle.max_members:
            return ValidateInviteCodeResponse(
                valid=False,
                circle_name=circle.name,
                circle_id=circle.id,
                member_count=circle.member_count,
                max_members=circle.max_members,
                message="This circle is full",
            )

        return ValidateInviteCodeResponse(
            valid=True,
            circle_name=circle.name,
            circle_id=circle.id,
            member_count=circle.member_count,
            max_members=circle.max_members,
        )

    async def resolve_invite_link(
        self,
        invite_link_id: uuid.UUID,
    ) -> ResolveInviteLinkResponse:
        """Resolve a permanent invite link without depending on fallback code expiry."""
        circle = await self.circle_repo.find_by_invite_link_id(invite_link_id)

        if circle is None or not circle.is_active:
            return ResolveInviteLinkResponse(
                valid=False,
                message="Invalid or expired invite link",
            )

        if circle.member_count >= circle.max_members:
            return ResolveInviteLinkResponse(
                valid=False,
                circle_name=circle.name,
                circle_id=circle.id,
                member_count=circle.member_count,
                max_members=circle.max_members,
                message="This circle is full",
            )

        return ResolveInviteLinkResponse(
            valid=True,
            circle_name=circle.name,
            circle_id=circle.id,
            member_count=circle.member_count,
            max_members=circle.max_members,
        )

    # ==================== Admin Methods ====================

    async def get_all_circles(
        self,
        search: str | None = None,
        is_active: bool | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[CircleResponse], int]:
        """Get all circles with optional filters (Admin only).

        Args:
            search: Optional search term for name/description
            is_active: Optional filter by active status
            limit: Maximum number of results
            offset: Number of results to skip

        Returns:
            Tuple of (list of CircleResponse, total count)
        """
        circles = await self.circle_repo.find_all(search, is_active, limit, offset)
        total = await self.circle_repo.count_all(search, is_active)
        return [await self._to_circle_response(c) for c in circles], total

    async def get_circle_detail_admin(
        self,
        circle_id: uuid.UUID,
    ) -> CircleDetail:
        """Get detailed circle information with members (Admin only).

        Args:
            circle_id: UUID of the circle

        Returns:
            CircleDetail with members list

        Raises:
            CircleNotFoundError: If circle not found
        """
        # Get circle with members (no membership check for admin)
        circle = await self.circle_repo.find_with_members(circle_id)
        if circle is None:
            raise CircleNotFoundError(str(circle_id))

        # Build response with member info
        circle_response = await self._to_circle_response(circle)
        circle_dict = circle_response.model_dump()

        # Add members with user info
        members_info = []
        for membership in circle.members:
            member_info = MemberInfo.model_validate(membership)
            if membership.user:
                member_info.username = membership.user.username
                member_info.display_name = membership.user.display_name
                member_info.profile_emoji = membership.user.profile_emoji
            members_info.append(member_info)

        circle_dict["members"] = members_info
        return CircleDetail(**circle_dict)

    async def update_circle_status(
        self,
        circle_id: uuid.UUID,
        is_active: bool,
    ) -> CircleResponse:
        """Update circle's active status (Admin only).

        Args:
            circle_id: UUID of the circle
            is_active: New active status

        Returns:
            Updated CircleResponse

        Raises:
            CircleNotFoundError: If circle not found
        """
        circle = await self.circle_repo.update_status(circle_id, is_active)
        if circle is None:
            raise CircleNotFoundError(str(circle_id))
        return await self._to_circle_response(circle)

    async def remove_member_admin(
        self,
        circle_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> None:
        """Remove a member from circle (Admin only).

        Args:
            circle_id: UUID of the circle
            user_id: UUID of the user to remove

        Raises:
            CircleNotFoundError: If circle not found
            BadRequestException: If user is the owner or not a member
        """
        circle = await self.circle_repo.find_by_id(circle_id)
        if circle is None:
            raise CircleNotFoundError(str(circle_id))

        # Cannot remove owner
        if circle.owner_id == user_id:
            raise BadRequestException("Circle owner cannot be removed")

        # Check if user is a member
        membership = await self.membership_repo.find_membership(circle_id, user_id)
        if membership is None:
            raise BadRequestException("User is not a member of this circle")

        # Remove membership
        await self.membership_repo.delete(circle_id, user_id)
        await self.circle_repo.decrement_member_count(circle_id)
