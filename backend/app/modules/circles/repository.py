"""Repository for circles and circle members data access."""

import uuid

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.enums import MemberRole
from app.modules.circles.models import Circle, CircleMember
from app.modules.circles.schemas import CircleCreate, CircleUpdate


class CircleRepository:
    """Repository for Circle CRUD operations."""

    def __init__(self, session: AsyncSession) -> None:
        """Initialize repository with database session."""
        self.session = session

    async def create(
        self, circle_data: CircleCreate, owner_id: uuid.UUID, invite_code: str
    ) -> Circle:
        """Create a new circle.

        Args:
            circle_data: Circle creation data
            owner_id: UUID of the circle owner
            invite_code: Generated invite code

        Returns:
            The created circle instance
        """
        circle = Circle(
            name=circle_data.name,
            description=circle_data.description,
            owner_id=owner_id,
            max_members=circle_data.max_members,
            invite_code=invite_code,
            member_count=1,  # Owner is the first member
        )
        self.session.add(circle)
        await self.session.flush()
        await self.session.refresh(circle)
        return circle

    async def find_by_id(self, circle_id: uuid.UUID) -> Circle | None:
        """Find a circle by ID.

        Args:
            circle_id: UUID of the circle

        Returns:
            Circle if found, None otherwise
        """
        stmt = select(Circle).where(Circle.id == circle_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def find_by_invite_code(self, invite_code: str) -> Circle | None:
        """Find a circle by invite code.

        Args:
            invite_code: 6-character invite code

        Returns:
            Circle if found, None otherwise
        """
        stmt = select(Circle).where(Circle.invite_code == invite_code)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def find_by_user_id(self, user_id: uuid.UUID) -> list[Circle]:
        """Find all circles a user is a member of.

        Args:
            user_id: UUID of the user

        Returns:
            List of circles the user is a member of
        """
        stmt = (
            select(Circle)
            .join(CircleMember, CircleMember.circle_id == Circle.id)
            .where(CircleMember.user_id == user_id)
            .order_by(Circle.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def find_with_members(self, circle_id: uuid.UUID) -> Circle | None:
        """Find a circle with its members loaded.

        Args:
            circle_id: UUID of the circle

        Returns:
            Circle with members if found, None otherwise
        """
        stmt = (
            select(Circle)
            .options(selectinload(Circle.members).selectinload(CircleMember.user))
            .where(Circle.id == circle_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def update(self, circle_id: uuid.UUID, circle_data: CircleUpdate) -> Circle | None:
        """Update a circle.

        Args:
            circle_id: UUID of the circle to update
            circle_data: Update data

        Returns:
            Updated circle if found, None otherwise
        """
        circle = await self.find_by_id(circle_id)
        if circle is None:
            return None

        update_dict = circle_data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(circle, field, value)

        await self.session.flush()
        await self.session.refresh(circle)
        return circle

    async def update_invite_code(self, circle_id: uuid.UUID, new_code: str) -> Circle | None:
        """Update circle's invite code.

        Args:
            circle_id: UUID of the circle
            new_code: New invite code

        Returns:
            Updated circle if found, None otherwise
        """
        circle = await self.find_by_id(circle_id)
        if circle is None:
            return None

        circle.invite_code = new_code
        await self.session.flush()
        await self.session.refresh(circle)
        return circle

    async def increment_member_count(self, circle_id: uuid.UUID) -> bool:
        """Increment circle's member count.

        Args:
            circle_id: UUID of the circle

        Returns:
            True if successful, False otherwise
        """
        circle = await self.find_by_id(circle_id)
        if circle is None:
            return False

        circle.member_count += 1
        await self.session.flush()
        return True

    async def decrement_member_count(self, circle_id: uuid.UUID) -> bool:
        """Decrement circle's member count.

        Args:
            circle_id: UUID of the circle

        Returns:
            True if successful, False otherwise
        """
        circle = await self.find_by_id(circle_id)
        if circle is None:
            return False

        if circle.member_count > 0:
            circle.member_count -= 1
            await self.session.flush()
        return True

    # ==================== Admin Methods ====================

    async def find_all(
        self,
        search: str | None = None,
        is_active: bool | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Circle]:
        """Find all circles with optional filters (Admin only).

        Args:
            search: Optional search term for name/description
            is_active: Optional filter by active status
            limit: Maximum number of results
            offset: Number of results to skip

        Returns:
            List of circles matching the criteria
        """
        stmt = select(Circle).order_by(Circle.created_at.desc())

        if search:
            search_term = f"%{search}%"
            stmt = stmt.where(
                or_(
                    Circle.name.ilike(search_term),
                    Circle.description.ilike(search_term),
                )
            )

        if is_active is not None:
            stmt = stmt.where(Circle.is_active == is_active)

        stmt = stmt.limit(limit).offset(offset)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def count_all(
        self,
        search: str | None = None,
        is_active: bool | None = None,
    ) -> int:
        """Count all circles with optional filters (Admin only).

        Args:
            search: Optional search term for name/description
            is_active: Optional filter by active status

        Returns:
            Total count of matching circles
        """
        stmt = select(func.count(Circle.id))

        if search:
            search_term = f"%{search}%"
            stmt = stmt.where(
                or_(
                    Circle.name.ilike(search_term),
                    Circle.description.ilike(search_term),
                )
            )

        if is_active is not None:
            stmt = stmt.where(Circle.is_active == is_active)

        result = await self.session.execute(stmt)
        return result.scalar() or 0

    async def update_status(self, circle_id: uuid.UUID, is_active: bool) -> Circle | None:
        """Update circle's active status (Admin only).

        Args:
            circle_id: UUID of the circle
            is_active: New active status

        Returns:
            Updated circle if found, None otherwise
        """
        circle = await self.find_by_id(circle_id)
        if circle is None:
            return None

        circle.is_active = is_active
        await self.session.flush()
        await self.session.refresh(circle)
        return circle


class MembershipRepository:
    """Repository for CircleMember CRUD operations."""

    def __init__(self, session: AsyncSession) -> None:
        """Initialize repository with database session."""
        self.session = session

    async def create(
        self,
        circle_id: uuid.UUID,
        user_id: uuid.UUID,
        role: MemberRole = MemberRole.MEMBER,
        nickname: str | None = None,
    ) -> CircleMember:
        """Create a new circle membership.

        Args:
            circle_id: UUID of the circle
            user_id: UUID of the user
            role: Member role (default: MEMBER)
            nickname: Optional nickname in the circle

        Returns:
            The created membership instance
        """
        membership = CircleMember(
            circle_id=circle_id,
            user_id=user_id,
            role=role,
            nickname=nickname,
        )
        self.session.add(membership)
        await self.session.flush()
        await self.session.refresh(membership)
        return membership

    async def find_by_circle_id(self, circle_id: uuid.UUID) -> list[CircleMember]:
        """Find all members of a circle.

        Args:
            circle_id: UUID of the circle

        Returns:
            List of circle members
        """
        stmt = (
            select(CircleMember)
            .options(selectinload(CircleMember.user))
            .where(CircleMember.circle_id == circle_id)
            .order_by(CircleMember.joined_at)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def find_by_user_id(self, user_id: uuid.UUID) -> list[CircleMember]:
        """Find all circle memberships for a user.

        Args:
            user_id: UUID of the user

        Returns:
            List of user's circle memberships
        """
        stmt = (
            select(CircleMember)
            .where(CircleMember.user_id == user_id)
            .order_by(CircleMember.joined_at.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def find_membership(
        self, circle_id: uuid.UUID, user_id: uuid.UUID
    ) -> CircleMember | None:
        """Find a specific membership.

        Args:
            circle_id: UUID of the circle
            user_id: UUID of the user

        Returns:
            CircleMember if found, None otherwise
        """
        stmt = select(CircleMember).where(
            CircleMember.circle_id == circle_id,
            CircleMember.user_id == user_id,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def exists(self, circle_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        """Check if a membership exists.

        Args:
            circle_id: UUID of the circle
            user_id: UUID of the user

        Returns:
            True if membership exists, False otherwise
        """
        membership = await self.find_membership(circle_id, user_id)
        return membership is not None

    async def delete(self, circle_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        """Delete a circle membership.

        Args:
            circle_id: UUID of the circle
            user_id: UUID of the user

        Returns:
            True if deleted, False if not found
        """
        membership = await self.find_membership(circle_id, user_id)
        if membership is None:
            return False

        await self.session.delete(membership)
        await self.session.flush()
        return True
