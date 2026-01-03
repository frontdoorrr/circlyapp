"""Repository for user data access."""

import uuid

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import UserRole
from app.modules.auth.models import User
from app.modules.auth.schemas import UserCreate, UserUpdate


class UserRepository:
    """Repository for user CRUD operations."""

    def __init__(self, session: AsyncSession) -> None:
        """Initialize repository with database session."""
        self.session = session

    async def create(self, user_data: UserCreate) -> User:
        """Create a new user.

        Args:
            user_data: User creation data including email, etc.

        Returns:
            The created user instance.
        """
        user = User(
            email=user_data.email,
            username=user_data.username,
            display_name=user_data.display_name,
        )
        self.session.add(user)
        await self.session.flush()
        await self.session.refresh(user)
        return user

    async def find_by_supabase_id(self, supabase_user_id: str) -> User | None:
        """Find a user by Supabase user ID.

        Args:
            supabase_user_id: Supabase Auth user ID.

        Returns:
            User if found, None otherwise.
        """
        stmt = select(User).where(User.supabase_user_id == supabase_user_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create_from_supabase(
        self,
        supabase_user_id: str,
        email: str,
        username: str | None = None,
        display_name: str | None = None,
    ) -> User:
        """Create a local user profile from Supabase auth user.

        Args:
            supabase_user_id: Supabase Auth user ID.
            email: User's email address.
            username: Optional username.
            display_name: Optional display name.

        Returns:
            The created user instance.
        """
        user = User(
            supabase_user_id=supabase_user_id,
            email=email,
            username=username,
            display_name=display_name,
        )
        self.session.add(user)
        await self.session.flush()
        await self.session.refresh(user)
        return user

    async def find_by_email(self, email: str) -> User | None:
        """Find a user by email.

        Args:
            email: Email address to search for.

        Returns:
            User if found, None otherwise.
        """
        stmt = select(User).where(User.email == email)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def find_by_id(self, user_id: uuid.UUID) -> User | None:
        """Find a user by ID.

        Args:
            user_id: UUID of the user.

        Returns:
            User if found, None otherwise.
        """
        stmt = select(User).where(User.id == user_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def update(self, user_id: uuid.UUID, user_data: UserUpdate) -> User | None:
        """Update a user's profile.

        Args:
            user_id: UUID of the user to update.
            user_data: Update data with optional fields.

        Returns:
            Updated user if found, None otherwise.
        """
        user = await self.find_by_id(user_id)
        if user is None:
            return None

        update_dict = user_data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(user, field, value)

        await self.session.flush()
        await self.session.refresh(user)
        return user

    async def update_push_token(self, user_id: uuid.UUID, token: str) -> bool:
        """Update a user's push notification token.

        Args:
            user_id: UUID of the user.
            token: Push notification token.

        Returns:
            True if updated, False if user not found.
        """
        user = await self.find_by_id(user_id)
        if user is None:
            return False

        user.push_token = token
        await self.session.flush()
        return True

    async def deactivate(self, user_id: uuid.UUID) -> bool:
        """Deactivate a user account.

        Args:
            user_id: UUID of the user to deactivate.

        Returns:
            True if deactivated, False if user not found.
        """
        user = await self.find_by_id(user_id)
        if user is None:
            return False

        user.is_active = False
        await self.session.flush()
        return True

    # ==================== Admin Methods ====================

    async def find_all(
        self,
        search: str | None = None,
        is_active: bool | None = None,
        role: UserRole | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[User]:
        """Find all users with optional filters (Admin only).

        Args:
            search: Optional search term for email/username/display_name
            is_active: Optional filter by active status
            role: Optional filter by role
            limit: Maximum number of results
            offset: Number of results to skip

        Returns:
            List of users matching the criteria
        """
        stmt = select(User).order_by(User.created_at.desc())

        if search:
            search_term = f"%{search}%"
            stmt = stmt.where(
                or_(
                    User.email.ilike(search_term),
                    User.username.ilike(search_term),
                    User.display_name.ilike(search_term),
                )
            )

        if is_active is not None:
            stmt = stmt.where(User.is_active == is_active)

        if role is not None:
            stmt = stmt.where(User.role == role)

        stmt = stmt.limit(limit).offset(offset)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def count_all(
        self,
        search: str | None = None,
        is_active: bool | None = None,
        role: UserRole | None = None,
    ) -> int:
        """Count all users with optional filters (Admin only).

        Args:
            search: Optional search term for email/username/display_name
            is_active: Optional filter by active status
            role: Optional filter by role

        Returns:
            Total count of matching users
        """
        stmt = select(func.count(User.id))

        if search:
            search_term = f"%{search}%"
            stmt = stmt.where(
                or_(
                    User.email.ilike(search_term),
                    User.username.ilike(search_term),
                    User.display_name.ilike(search_term),
                )
            )

        if is_active is not None:
            stmt = stmt.where(User.is_active == is_active)

        if role is not None:
            stmt = stmt.where(User.role == role)

        result = await self.session.execute(stmt)
        return result.scalar() or 0

    async def update_status(self, user_id: uuid.UUID, is_active: bool) -> User | None:
        """Update user's active status (Admin only).

        Args:
            user_id: UUID of the user
            is_active: New active status

        Returns:
            Updated user if found, None otherwise
        """
        user = await self.find_by_id(user_id)
        if user is None:
            return None

        user.is_active = is_active
        await self.session.flush()
        await self.session.refresh(user)
        return user

    async def update_role(self, user_id: uuid.UUID, role: UserRole) -> User | None:
        """Update user's role (Admin only).

        Args:
            user_id: UUID of the user
            role: New role

        Returns:
            Updated user if found, None otherwise
        """
        user = await self.find_by_id(user_id)
        if user is None:
            return None

        user.role = role
        await self.session.flush()
        await self.session.refresh(user)
        return user
