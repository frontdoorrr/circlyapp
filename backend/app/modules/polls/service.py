"""Business logic for polls module."""

import uuid
from datetime import UTC, datetime, timedelta
from decimal import Decimal

from app.core.enums import PollStatus, TemplateCategory
from app.core.exceptions import (
    BadRequestException,
    PollNotFoundError,
)
from app.core.security import generate_voter_hash
from app.modules.circles.repository import MembershipRepository
from app.modules.polls.repository import PollRepository, TemplateRepository, VoteRepository
from app.modules.polls.schemas import (
    CATEGORY_METADATA,
    CategoryInfo,
    PollCreate,
    PollDuration,
    PollResponse,
    PollResultItem,
    PollTemplateResponse,
    VoteResponse,
)


class PollService:
    """Service for poll operations."""

    def __init__(
        self,
        template_repo: TemplateRepository,
        poll_repo: PollRepository,
        vote_repo: VoteRepository,
        membership_repo: MembershipRepository,
    ) -> None:
        """Initialize service with repositories."""
        self.template_repo = template_repo
        self.poll_repo = poll_repo
        self.vote_repo = vote_repo
        self.membership_repo = membership_repo

    async def get_templates(
        self, category: TemplateCategory | None = None
    ) -> list[PollTemplateResponse]:
        """Get all active poll templates, optionally filtered by category.

        Args:
            category: Optional category filter

        Returns:
            List of PollTemplateResponse
        """
        templates = await self.template_repo.find_all(category)
        return [PollTemplateResponse.model_validate(t) for t in templates]

    async def create_poll(
        self,
        circle_id: uuid.UUID,
        creator_id: uuid.UUID,
        poll_data: PollCreate,
    ) -> PollResponse:
        """Create a new poll in a circle.

        Args:
            circle_id: UUID of the circle
            creator_id: UUID of the poll creator
            poll_data: Poll creation data

        Returns:
            PollResponse with created poll data

        Raises:
            BadRequestException: If template not found or user not a member
        """
        # Verify user is a member of the circle
        is_member = await self.membership_repo.exists(circle_id, creator_id)
        if not is_member:
            raise BadRequestException("You are not a member of this circle")

        # Verify template exists
        template = await self.template_repo.find_by_id(poll_data.template_id)
        if template is None:
            raise BadRequestException("Template not found")

        # Calculate end time based on duration
        ends_at = self._calculate_end_time(poll_data.duration)

        # Create poll
        poll = await self.poll_repo.create(
            circle_id=circle_id,
            template_id=poll_data.template_id,
            creator_id=creator_id,
            question_text=template.question_text,
            ends_at=ends_at,
        )

        # Increment template usage count
        await self.template_repo.increment_usage_count(poll_data.template_id)

        return PollResponse.model_validate(poll)

    def _calculate_end_time(self, duration: PollDuration) -> datetime:
        """Calculate poll end time based on duration.

        Args:
            duration: Poll duration enum

        Returns:
            Datetime when poll should end
        """
        duration_map = {
            PollDuration.ONE_HOUR: timedelta(hours=1),
            PollDuration.THREE_HOURS: timedelta(hours=3),
            PollDuration.SIX_HOURS: timedelta(hours=6),
            PollDuration.TWENTY_FOUR_HOURS: timedelta(hours=24),
        }
        return datetime.now(UTC) + duration_map[duration]

    async def vote(
        self,
        poll_id: uuid.UUID,
        voter_id: uuid.UUID,
        voted_for_id: uuid.UUID,
    ) -> VoteResponse:
        """Cast a vote in a poll.

        Args:
            poll_id: UUID of the poll
            voter_id: UUID of the voter
            voted_for_id: UUID of the user being voted for

        Returns:
            VoteResponse with results

        Raises:
            PollNotFoundError: If poll not found
            BadRequestException: If poll ended, self-vote, or already voted
        """
        # Verify poll exists and is active
        poll = await self.poll_repo.find_by_id(poll_id)
        if poll is None:
            raise PollNotFoundError(str(poll_id))

        if poll.status != PollStatus.ACTIVE:
            raise BadRequestException("Poll has ended")

        # Prevent self-voting
        if voter_id == voted_for_id:
            raise BadRequestException("You cannot vote for yourself")

        # Generate anonymous voter hash (using poll_id as salt for consistency)
        voter_hash = generate_voter_hash(voter_id, poll_id, salt=str(poll_id))

        # Check for duplicate vote
        has_voted = await self.vote_repo.exists_by_voter_hash(poll_id, voter_hash)
        if has_voted:
            raise BadRequestException("You have already voted in this poll")

        # Create vote
        await self.vote_repo.create(
            poll_id=poll_id,
            voter_hash=voter_hash,
            voted_for_id=voted_for_id,
        )

        # Increment poll vote count
        await self.poll_repo.increment_vote_count(poll_id)

        # Get results
        results = await self.get_results(poll_id)

        return VoteResponse(
            success=True,
            results=results,
            message="Vote recorded successfully",
        )

    async def get_results(self, poll_id: uuid.UUID) -> list[PollResultItem]:
        """Get poll results.

        Args:
            poll_id: UUID of the poll

        Returns:
            List of PollResultItem with vote counts and percentages

        Raises:
            PollNotFoundError: If poll not found
        """
        # Verify poll exists
        poll = await self.poll_repo.find_by_id(poll_id)
        if poll is None:
            raise PollNotFoundError(str(poll_id))

        # Get vote results from repository
        vote_results = await self.vote_repo.get_results_by_poll_id(poll_id)

        # Calculate total votes
        total_votes = sum(result["vote_count"] for result in vote_results)

        # Build result items with percentages and ranks
        result_items: list[PollResultItem] = []
        for idx, result in enumerate(vote_results):
            percentage = (
                Decimal(result["vote_count"]) / Decimal(total_votes) * Decimal(100)
                if total_votes > 0
                else Decimal(0)
            )

            result_items.append(
                PollResultItem(
                    user_id=result["user_id"],
                    nickname=None,  # Will be populated by router/service if needed
                    profile_emoji="",  # Will be populated by router/service if needed
                    vote_count=result["vote_count"],
                    vote_percentage=percentage.quantize(Decimal("0.01")),
                    rank=idx + 1,
                )
            )

        return result_items

    async def close_poll(self, poll_id: uuid.UUID) -> None:
        """Close a poll and update its status to COMPLETED.

        Args:
            poll_id: UUID of the poll to close

        Raises:
            PollNotFoundError: If poll not found
        """
        # Verify poll exists
        poll = await self.poll_repo.find_by_id(poll_id)
        if poll is None:
            raise PollNotFoundError(str(poll_id))

        # Update poll status to COMPLETED
        await self.poll_repo.update_status(poll_id, PollStatus.COMPLETED)

    async def get_categories(self) -> list[CategoryInfo]:
        """Get all template categories with question counts.

        Returns:
            List of CategoryInfo with category metadata and question counts
        """
        # Get template counts by category
        category_counts = await self.template_repo.count_by_category()

        # Build category info list
        categories = []
        for category in TemplateCategory:
            metadata = CATEGORY_METADATA.get(
                category, {"emoji": "📝", "title": str(category.value)}
            )
            count = category_counts.get(category, 0)

            categories.append(
                CategoryInfo(
                    category=category,
                    emoji=metadata["emoji"],
                    title=metadata["title"],
                    question_count=count,
                )
            )

        return categories

    async def get_my_polls(
        self, user_id: uuid.UUID, status: PollStatus | None = None
    ) -> list[PollResponse]:
        """Get all polls from circles the user belongs to.

        Args:
            user_id: UUID of the user
            status: Optional status filter (ACTIVE or COMPLETED)

        Returns:
            List of PollResponse from user's circles
        """
        # Get all circle IDs the user belongs to
        memberships = await self.membership_repo.find_by_user_id(user_id)
        circle_ids = [m.circle_id for m in memberships]

        if not circle_ids:
            return []

        # Get polls from user's circles
        polls = await self.poll_repo.find_by_user_circles(circle_ids, status)

        return [PollResponse.model_validate(p) for p in polls]

    # ==================== Admin Methods ====================

    async def get_all_polls(
        self,
        status: PollStatus | None = None,
        circle_id: uuid.UUID | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[PollResponse], int]:
        """Get all polls with optional filters (Admin only).

        Args:
            status: Optional status filter
            circle_id: Optional circle filter
            limit: Maximum number of results
            offset: Number of results to skip

        Returns:
            Tuple of (list of PollResponse, total count)
        """
        polls = await self.poll_repo.find_all(status, circle_id, limit, offset)
        total = await self.poll_repo.count_all(status, circle_id)
        return [PollResponse.model_validate(p) for p in polls], total

    async def update_poll_status(
        self,
        poll_id: uuid.UUID,
        status: PollStatus,
    ) -> PollResponse:
        """Update poll status (Admin only).

        Args:
            poll_id: UUID of the poll
            status: New status

        Returns:
            Updated PollResponse

        Raises:
            PollNotFoundError: If poll not found
        """
        poll = await self.poll_repo.find_by_id(poll_id)
        if poll is None:
            raise PollNotFoundError(str(poll_id))

        await self.poll_repo.update_status(poll_id, status)

        # Refresh poll data
        updated_poll = await self.poll_repo.find_by_id(poll_id)
        return PollResponse.model_validate(updated_poll)

    async def get_all_templates(
        self,
        category: TemplateCategory | None = None,
        is_active: bool | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[PollTemplateResponse], int]:
        """Get all templates with optional filters (Admin only).

        Args:
            category: Optional category filter
            is_active: Optional active status filter
            limit: Maximum number of results
            offset: Number of results to skip

        Returns:
            Tuple of (list of PollTemplateResponse, total count)
        """
        templates = await self.template_repo.find_all_templates(category, is_active, limit, offset)
        total = await self.template_repo.count_all_templates(category, is_active)
        return [PollTemplateResponse.model_validate(t) for t in templates], total

    async def create_template(
        self,
        category: TemplateCategory,
        question_text: str,
        emoji: str | None = None,
    ) -> PollTemplateResponse:
        """Create a new poll template (Admin only).

        Args:
            category: Template category
            question_text: Question text
            emoji: Optional emoji

        Returns:
            Created PollTemplateResponse
        """
        template = await self.template_repo.create_template(category, question_text, emoji)
        return PollTemplateResponse.model_validate(template)

    async def update_template(
        self,
        template_id: uuid.UUID,
        category: TemplateCategory | None = None,
        question_text: str | None = None,
        emoji: str | None = None,
        is_active: bool | None = None,
    ) -> PollTemplateResponse:
        """Update a poll template (Admin only).

        Args:
            template_id: Template UUID
            category: Optional new category
            question_text: Optional new question text
            emoji: Optional new emoji
            is_active: Optional new active status

        Returns:
            Updated PollTemplateResponse

        Raises:
            BadRequestException: If template not found
        """
        template = await self.template_repo.update_template(
            template_id, category, question_text, emoji, is_active
        )
        if template is None:
            raise BadRequestException("Template not found")
        return PollTemplateResponse.model_validate(template)
