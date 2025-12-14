"""Business logic for polls module."""

import uuid
from datetime import UTC, datetime, timedelta
from decimal import Decimal

from app.core.enums import PollStatus, TemplateCategory
from app.core.exceptions import (
    BadRequestException,
    CircleNotFoundError,
    PollNotFoundError,
)
from app.core.security import generate_voter_hash
from app.modules.circles.repository import MembershipRepository
from app.modules.polls.repository import PollRepository, TemplateRepository, VoteRepository
from app.modules.polls.schemas import (
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
