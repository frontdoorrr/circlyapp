"""Repository for user data access."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

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
