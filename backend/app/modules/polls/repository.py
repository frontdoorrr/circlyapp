"""Repositories for polls module."""

import uuid
from datetime import UTC, datetime, timedelta
from typing import TypedDict

from sqlalchemy import and_, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.enums import PollStatus, TemplateCategory
from app.modules.auth.models import User
from app.modules.circles.models import Circle, CircleMember
from app.modules.polls.models import (
    Poll,
    PollTemplate,
    ReceivedHeartRead,
    Vote,
    VoteHint,
    VoteSession,
)


class VoteResultDict(TypedDict):
    """Type for vote result dictionary."""

    user_id: uuid.UUID
    vote_count: int


class ReceivedHeartDict(TypedDict):
    """Type for received heart inbox row."""

    poll_id: uuid.UUID
    circle_id: uuid.UUID
    circle_name: str
    question_text: str
    emoji: str | None
    received_count: int
    latest_received_at: datetime
    is_read: bool


class CandidateOptionDict(TypedDict):
    """Type for server-selected vote candidate."""

    user_id: uuid.UUID
    nickname: str | None
    profile_emoji: str
    received_count: int


class TemplateRepository:
    """Repository for PollTemplate model."""

    def __init__(self, session: AsyncSession) -> None:
        """Initialize repository with database session."""
        self.session = session

    async def find_all(
        self, category: TemplateCategory | None = None
    ) -> list[PollTemplate]:
        """Find all active templates, optionally filtered by category.

        Args:
            category: Optional category filter

        Returns:
            List of active poll templates
        """
        query = select(PollTemplate).where(PollTemplate.is_active == True)  # noqa: E712

        if category:
            query = query.where(PollTemplate.category == category)

        query = query.order_by(PollTemplate.usage_count.desc(), PollTemplate.created_at)

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def find_by_id(self, template_id: uuid.UUID) -> PollTemplate | None:
        """Find template by ID.

        Args:
            template_id: Template UUID

        Returns:
            PollTemplate if found, None otherwise
        """
        result = await self.session.execute(
            select(PollTemplate).where(PollTemplate.id == template_id)
        )
        return result.scalar_one_or_none()

    async def increment_usage_count(self, template_id: uuid.UUID) -> None:
        """Increment template usage count.

        Args:
            template_id: Template UUID
        """
        await self.session.execute(
            update(PollTemplate)
            .where(PollTemplate.id == template_id)
            .values(usage_count=PollTemplate.usage_count + 1)
        )
        await self.session.flush()

    async def count_by_category(self) -> dict[TemplateCategory, int]:
        """Count active templates by category.

        Returns:
            Dictionary mapping category to template count
        """
        query = (
            select(PollTemplate.category, func.count(PollTemplate.id))
            .where(PollTemplate.is_active == True)  # noqa: E712
            .group_by(PollTemplate.category)
        )
        result = await self.session.execute(query)
        return {row[0]: row[1] for row in result.all()}

    # ==================== Admin Methods ====================

    async def find_all_templates(
        self,
        category: TemplateCategory | None = None,
        is_active: bool | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[PollTemplate]:
        """Find all templates with optional filters (Admin only).

        Args:
            category: Optional category filter
            is_active: Optional active status filter
            limit: Maximum number of results
            offset: Number of results to skip

        Returns:
            List of poll templates
        """
        query = select(PollTemplate).order_by(PollTemplate.created_at.desc())

        if category:
            query = query.where(PollTemplate.category == category)

        if is_active is not None:
            query = query.where(PollTemplate.is_active == is_active)

        query = query.limit(limit).offset(offset)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def count_all_templates(
        self,
        category: TemplateCategory | None = None,
        is_active: bool | None = None,
    ) -> int:
        """Count all templates with optional filters (Admin only).

        Args:
            category: Optional category filter
            is_active: Optional active status filter

        Returns:
            Total count of matching templates
        """
        query = select(func.count(PollTemplate.id))

        if category:
            query = query.where(PollTemplate.category == category)

        if is_active is not None:
            query = query.where(PollTemplate.is_active == is_active)

        result = await self.session.execute(query)
        return result.scalar() or 0

    async def create_template(
        self,
        category: TemplateCategory,
        question_text: str,
        emoji: str | None = None,
    ) -> PollTemplate:
        """Create a new poll template (Admin only).

        Args:
            category: Template category
            question_text: Question text
            emoji: Optional emoji

        Returns:
            Created PollTemplate instance
        """
        template = PollTemplate(
            category=category,
            question_text=question_text,
            emoji=emoji,
            is_active=True,
        )
        self.session.add(template)
        await self.session.flush()
        await self.session.refresh(template)
        return template

    async def update_template(
        self,
        template_id: uuid.UUID,
        category: TemplateCategory | None = None,
        question_text: str | None = None,
        emoji: str | None = None,
        is_active: bool | None = None,
    ) -> PollTemplate | None:
        """Update a poll template (Admin only).

        Args:
            template_id: Template UUID
            category: Optional new category
            question_text: Optional new question text
            emoji: Optional new emoji
            is_active: Optional new active status

        Returns:
            Updated PollTemplate if found, None otherwise
        """
        template = await self.find_by_id(template_id)
        if template is None:
            return None

        if category is not None:
            template.category = category
        if question_text is not None:
            template.question_text = question_text
        if emoji is not None:
            template.emoji = emoji
        if is_active is not None:
            template.is_active = is_active

        await self.session.flush()
        await self.session.refresh(template)
        return template


class PollRepository:
    """Repository for Poll model."""

    def __init__(self, session: AsyncSession) -> None:
        """Initialize repository with database session."""
        self.session = session

    async def create(
        self,
        circle_id: uuid.UUID,
        template_id: uuid.UUID,
        creator_id: uuid.UUID,
        question_text: str,
        ends_at: datetime,
    ) -> Poll:
        """Create a new poll.

        Args:
            circle_id: Circle UUID
            template_id: Template UUID
            creator_id: Creator user UUID
            question_text: Poll question text
            ends_at: Poll end datetime

        Returns:
            Created Poll instance
        """
        poll = Poll(
            circle_id=circle_id,
            template_id=template_id,
            creator_id=creator_id,
            question_text=question_text,
            status=PollStatus.ACTIVE,
            ends_at=ends_at,
        )
        self.session.add(poll)
        await self.session.flush()
        await self.session.refresh(poll)
        return poll

    async def find_by_id(self, poll_id: uuid.UUID) -> Poll | None:
        """Find poll by ID.

        Args:
            poll_id: Poll UUID

        Returns:
            Poll if found, None otherwise
        """
        result = await self.session.execute(select(Poll).where(Poll.id == poll_id))
        return result.scalar_one_or_none()

    async def find_by_circle_id(
        self, circle_id: uuid.UUID, status: PollStatus | None = None
    ) -> list[Poll]:
        """Find polls by circle ID, optionally filtered by status.

        Args:
            circle_id: Circle UUID
            status: Optional status filter

        Returns:
            List of polls
        """
        query = select(Poll).where(Poll.circle_id == circle_id)

        if status:
            query = query.where(Poll.status == status)

        query = query.order_by(Poll.created_at.desc())

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def find_active_by_circle_id(self, circle_id: uuid.UUID) -> list[Poll]:
        """Find active polls by circle ID.

        Args:
            circle_id: Circle UUID

        Returns:
            List of active polls
        """
        return await self.find_by_circle_id(circle_id, status=PollStatus.ACTIVE)

    async def count_active_by_circle_id(self, circle_id: uuid.UUID) -> int:
        """Count active polls in a circle.

        Args:
            circle_id: Circle UUID

        Returns:
            Number of active polls
        """
        result = await self.session.execute(
            select(func.count(Poll.id)).where(
                Poll.circle_id == circle_id,
                Poll.status == PollStatus.ACTIVE,
            )
        )
        return result.scalar() or 0

    async def update_status(self, poll_id: uuid.UUID, status: PollStatus) -> None:
        """Update poll status.

        Args:
            poll_id: Poll UUID
            status: New status
        """
        await self.session.execute(
            update(Poll).where(Poll.id == poll_id).values(status=status)
        )
        await self.session.flush()

    async def increment_vote_count(self, poll_id: uuid.UUID) -> None:
        """Increment poll vote count.

        Args:
            poll_id: Poll UUID
        """
        await self.session.execute(
            update(Poll)
            .where(Poll.id == poll_id)
            .values(vote_count=Poll.vote_count + 1)
        )
        await self.session.flush()

    async def find_ending_soon(self, minutes: int) -> list[Poll]:
        """Find active polls ending within specified minutes.

        Args:
            minutes: Minutes threshold

        Returns:
            List of polls ending soon
        """
        threshold = datetime.now() + timedelta(minutes=minutes)
        query = (
            select(Poll)
            .where(Poll.status == PollStatus.ACTIVE)
            .where(Poll.ends_at <= threshold)
            .order_by(Poll.ends_at)
        )

        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def find_by_user_circles(
        self, circle_ids: list[uuid.UUID], status: PollStatus | None = None
    ) -> list[Poll]:
        """Find polls from user's circles.

        Args:
            circle_ids: List of circle UUIDs the user belongs to
            status: Optional status filter

        Returns:
            List of polls from user's circles (with circle and template eager loaded)
        """
        if not circle_ids:
            return []

        query = (
            select(Poll)
            .options(
                selectinload(Poll.circle),
                selectinload(Poll.template),
            )
            .where(Poll.circle_id.in_(circle_ids))
        )

        if status:
            query = query.where(Poll.status == status)

        query = query.order_by(Poll.created_at.desc())

        result = await self.session.execute(query)
        return list(result.scalars().all())

    # ==================== Admin Methods ====================

    async def find_all(
        self,
        status: PollStatus | None = None,
        circle_id: uuid.UUID | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Poll]:
        """Find all polls with optional filters (Admin only).

        Args:
            status: Optional status filter
            circle_id: Optional circle filter
            limit: Maximum number of results
            offset: Number of results to skip

        Returns:
            List of polls matching the criteria
        """
        query = select(Poll).order_by(Poll.created_at.desc())

        if status:
            query = query.where(Poll.status == status)

        if circle_id:
            query = query.where(Poll.circle_id == circle_id)

        query = query.limit(limit).offset(offset)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def count_all(
        self,
        status: PollStatus | None = None,
        circle_id: uuid.UUID | None = None,
    ) -> int:
        """Count all polls with optional filters (Admin only).

        Args:
            status: Optional status filter
            circle_id: Optional circle filter

        Returns:
            Total count of matching polls
        """
        query = select(func.count(Poll.id))

        if status:
            query = query.where(Poll.status == status)

        if circle_id:
            query = query.where(Poll.circle_id == circle_id)

        result = await self.session.execute(query)
        return result.scalar() or 0


class VoteRepository:
    """Repository for Vote model."""

    def __init__(self, session: AsyncSession) -> None:
        """Initialize repository with database session."""
        self.session = session

    async def create(
        self,
        poll_id: uuid.UUID,
        voter_id: uuid.UUID,
        voter_hash: str,
        voted_for_id: uuid.UUID,
    ) -> Vote:
        """Create a new vote.

        Args:
            poll_id: Poll UUID
            voter_id: Voter user UUID (for Orb Mode feature)
            voter_hash: SHA-256 hash of voter (for duplicate prevention)
            voted_for_id: User UUID being voted for

        Returns:
            Created Vote instance
        """
        vote = Vote(
            poll_id=poll_id,
            voter_id=voter_id,
            voter_hash=voter_hash,
            voted_for_id=voted_for_id,
        )
        self.session.add(vote)
        await self.session.flush()
        await self.session.refresh(vote)
        return vote

    async def exists_by_voter_hash(self, poll_id: uuid.UUID, voter_hash: str) -> bool:
        """Check if vote exists by voter hash.

        Args:
            poll_id: Poll UUID
            voter_hash: Voter hash to check

        Returns:
            True if vote exists, False otherwise
        """
        result = await self.session.execute(
            select(Vote).where(Vote.poll_id == poll_id, Vote.voter_hash == voter_hash)
        )
        return result.scalar_one_or_none() is not None

    async def count_by_poll_id(self, poll_id: uuid.UUID) -> int:
        """Count votes for a poll.

        Args:
            poll_id: Poll UUID

        Returns:
            Number of votes
        """
        result = await self.session.execute(
            select(func.count()).select_from(Vote).where(Vote.poll_id == poll_id)
        )
        return result.scalar() or 0

    async def find_voter_ids_by_poll_id(self, poll_id: uuid.UUID) -> set[uuid.UUID]:
        """Find user IDs that have already voted in a poll.

        Args:
            poll_id: Poll UUID

        Returns:
            Set of voter user UUIDs
        """
        result = await self.session.execute(
            select(Vote.voter_id).where(Vote.poll_id == poll_id)
        )
        return set(result.scalars().all())

    async def get_results_by_poll_id(self, poll_id: uuid.UUID) -> list[VoteResultDict]:
        """Get vote results for a poll.

        Args:
            poll_id: Poll UUID

        Returns:
            List of vote results with user_id and vote_count
        """
        result = await self.session.execute(
            select(Vote.voted_for_id, func.count(Vote.id).label("vote_count"))
            .where(Vote.poll_id == poll_id)
            .group_by(Vote.voted_for_id)
            .order_by(func.count(Vote.id).desc())
        )

        return [
            {"user_id": row.voted_for_id, "vote_count": row.vote_count}
            for row in result.all()
        ]

    async def find_candidate_options(
        self,
        circle_id: uuid.UUID,
        requester_id: uuid.UUID,
        creator_id: uuid.UUID,
    ) -> list[CandidateOptionDict]:
        """Find eligible vote candidates ordered by least received votes first.

        Args:
            circle_id: Circle UUID
            requester_id: Current voter UUID
            creator_id: Poll creator UUID

        Returns:
            Candidate rows with exposure/fairness count
        """
        received_counts = (
            select(
                Vote.voted_for_id.label("user_id"),
                func.count(Vote.id).label("received_count"),
            )
            .join(Poll, Vote.poll_id == Poll.id)
            .where(Poll.circle_id == circle_id)
            .group_by(Vote.voted_for_id)
            .subquery()
        )
        excluded_ids = {requester_id, creator_id}

        result = await self.session.execute(
            select(
                CircleMember.user_id,
                CircleMember.nickname,
                User.profile_emoji,
                func.coalesce(received_counts.c.received_count, 0).label("received_count"),
            )
            .join(User, CircleMember.user_id == User.id)
            .outerjoin(received_counts, CircleMember.user_id == received_counts.c.user_id)
            .where(
                CircleMember.circle_id == circle_id,
                CircleMember.user_id.notin_(excluded_ids),
                User.is_active == True,  # noqa: E712
            )
            .order_by(
                func.coalesce(received_counts.c.received_count, 0).asc(),
                CircleMember.joined_at.asc(),
            )
        )

        return [
            {
                "user_id": row.user_id,
                "nickname": row.nickname,
                "profile_emoji": row.profile_emoji,
                "received_count": int(row.received_count),
            }
            for row in result.all()
        ]

    async def find_voters_for_user(
        self, poll_id: uuid.UUID, voted_for_id: uuid.UUID
    ) -> list["Vote"]:
        """Orb Mode: 특정 poll에서 user에게 투표한 사람들 조회.

        Args:
            poll_id: Poll UUID
            voted_for_id: 투표 받은 사람 UUID

        Returns:
            List of Vote objects with voter relationship loaded
        """
        from app.modules.polls.models import Vote

        result = await self.session.execute(
            select(Vote)
            .options(selectinload(Vote.voter))
            .where(Vote.poll_id == poll_id, Vote.voted_for_id == voted_for_id)
            .order_by(Vote.created_at.desc())
        )
        return list(result.scalars().all())

    async def find_vote_hints_for_votes(
        self,
        vote_ids: list[uuid.UUID],
    ) -> list[VoteHint]:
        """Find persisted hints for a list of votes."""
        if not vote_ids:
            return []

        result = await self.session.execute(
            select(VoteHint).where(VoteHint.vote_id.in_(vote_ids))
        )
        return list(result.scalars().all())

    async def create_vote_hint(
        self,
        *,
        vote_id: uuid.UUID,
        user_id: uuid.UUID,
        tier: str,
        hint_text: str,
    ) -> VoteHint:
        """Persist a generated safe vote hint."""
        hint = VoteHint(
            vote_id=vote_id,
            user_id=user_id,
            tier=tier,
            hint_text=hint_text,
        )
        self.session.add(hint)
        await self.session.flush()
        await self.session.refresh(hint)
        return hint

    async def find_received_hearts_for_user(
        self,
        user_id: uuid.UUID,
        limit: int = 50,
        offset: int = 0,
    ) -> list[ReceivedHeartDict]:
        """Find polls where the user received votes, grouped for inbox display.

        Args:
            user_id: User UUID that received votes
            limit: Maximum number of rows
            offset: Number of rows to skip

        Returns:
            Received heart rows ordered by latest received vote
        """
        received_count = func.count(Vote.id).label("received_count")
        latest_received_at = func.max(Vote.created_at).label("latest_received_at")

        result = await self.session.execute(
            select(
                Poll.id.label("poll_id"),
                Poll.circle_id.label("circle_id"),
                Circle.name.label("circle_name"),
                Poll.question_text.label("question_text"),
                PollTemplate.emoji.label("emoji"),
                received_count,
                latest_received_at,
                ReceivedHeartRead.id.label("read_id"),
            )
            .join(Poll, Vote.poll_id == Poll.id)
            .join(Circle, Poll.circle_id == Circle.id)
            .outerjoin(PollTemplate, Poll.template_id == PollTemplate.id)
            .outerjoin(
                ReceivedHeartRead,
                and_(
                    ReceivedHeartRead.poll_id == Poll.id,
                    ReceivedHeartRead.user_id == user_id,
                ),
            )
            .where(Vote.voted_for_id == user_id)
            .group_by(
                Poll.id,
                Poll.circle_id,
                Circle.name,
                Poll.question_text,
                PollTemplate.emoji,
                ReceivedHeartRead.id,
            )
            .order_by(latest_received_at.desc())
            .limit(limit)
            .offset(offset)
        )

        return [
            {
                "poll_id": row.poll_id,
                "circle_id": row.circle_id,
                "circle_name": row.circle_name,
                "question_text": row.question_text,
                "emoji": row.emoji,
                "received_count": row.received_count,
                "latest_received_at": row.latest_received_at,
                "is_read": row.read_id is not None,
            }
            for row in result.all()
        ]

    async def has_received_heart(self, user_id: uuid.UUID, poll_id: uuid.UUID) -> bool:
        """Return whether user received at least one vote in a poll."""
        result = await self.session.execute(
            select(func.count(Vote.id)).where(
                Vote.poll_id == poll_id,
                Vote.voted_for_id == user_id,
            )
        )
        return (result.scalar() or 0) > 0

    async def mark_received_heart_as_read(
        self, user_id: uuid.UUID, poll_id: uuid.UUID
    ) -> bool:
        """Persist received heart read state if the user received a vote."""
        if not await self.has_received_heart(user_id, poll_id):
            return False

        result = await self.session.execute(
            select(ReceivedHeartRead).where(
                ReceivedHeartRead.user_id == user_id,
                ReceivedHeartRead.poll_id == poll_id,
            )
        )
        existing = result.scalar_one_or_none()
        if existing is None:
            self.session.add(ReceivedHeartRead(user_id=user_id, poll_id=poll_id))
            await self.session.flush()
        return True


class VoteSessionRepository:
    """Repository for server-side vote sessions."""

    def __init__(self, session: AsyncSession) -> None:
        """Initialize repository with database session."""
        self.session = session

    async def create(
        self,
        user_id: uuid.UUID,
        poll_ids: list[uuid.UUID],
        circle_id: uuid.UUID | None = None,
    ) -> VoteSession:
        """Create a vote session with a fixed poll queue."""
        vote_session = VoteSession(
            user_id=user_id,
            circle_id=circle_id,
            status="ACTIVE" if poll_ids else "COMPLETED",
            poll_ids=[str(poll_id) for poll_id in poll_ids],
            current_index=0,
            skipped_poll_ids=[],
            completed_at=None if poll_ids else datetime.now(UTC),
        )
        self.session.add(vote_session)
        await self.session.flush()
        await self.session.refresh(vote_session)
        return vote_session

    async def find_by_id_for_user(
        self, session_id: uuid.UUID, user_id: uuid.UUID
    ) -> VoteSession | None:
        """Find a vote session owned by a user."""
        result = await self.session.execute(
            select(VoteSession).where(
                VoteSession.id == session_id,
                VoteSession.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def save(self, vote_session: VoteSession) -> VoteSession:
        """Persist vote session cursor changes."""
        await self.session.flush()
        await self.session.refresh(vote_session)
        return vote_session
