"""Business logic for circles module."""

import uuid

from app.core.enums import MemberRole
from app.core.exceptions import (
    AlreadyMemberError,
    BadRequestException,
    CircleFullError,
    CircleNotFoundError,
    InvalidInviteCodeError,
)
from app.core.security import generate_invite_code
from app.modules.circles.repository import CircleRepository, MembershipRepository
from app.modules.circles.schemas import (
    CircleCreate,
    CircleDetail,
    CircleResponse,
    MemberInfo,
    RegenerateInviteCodeResponse,
)


class CircleService:
    """Service for circle operations."""

    def __init__(
        self,
        circle_repo: CircleRepository,
        membership_repo: MembershipRepository,
    ) -> None:
        """Initialize service with repositories."""
        self.circle_repo = circle_repo
        self.membership_repo = membership_repo

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
        # Generate unique invite code
        invite_code = generate_invite_code()

        # Create circle
        circle = await self.circle_repo.create(circle_data, owner_id, invite_code)

        # Add owner as first member with OWNER role
        await self.membership_repo.create(circle.id, owner_id, MemberRole.OWNER)

        return CircleResponse.model_validate(circle)

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
        if circle is None or not circle.is_active:
            raise InvalidInviteCodeError()

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
        return CircleResponse.model_validate(updated_circle)

    async def get_user_circles(self, user_id: uuid.UUID) -> list[CircleResponse]:
        """Get all circles a user is a member of.

        Args:
            user_id: UUID of the user

        Returns:
            List of CircleResponse
        """
        circles = await self.circle_repo.find_by_user_id(user_id)
        return [CircleResponse.model_validate(circle) for circle in circles]

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
        circle_dict = CircleResponse.model_validate(circle).model_dump()

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

        # Update circle
        await self.circle_repo.update_invite_code(circle_id, new_code)

        return RegenerateInviteCodeResponse(invite_code=new_code)
