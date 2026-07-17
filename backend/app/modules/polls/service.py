"""Business logic for polls module."""

from __future__ import annotations

import logging
import random
import uuid
from datetime import UTC, datetime, timedelta
from typing import TYPE_CHECKING

from app.core.enums import PollStatus, TemplateCategory
from app.core.exceptions import (
    BadRequestException,
    PollNotFoundError,
)
from app.core.security import generate_voter_hash
from app.modules.auth.repository import UserRepository
from app.modules.circles.repository import CircleRepository, MembershipRepository
from app.modules.polls.repository import (
    PollRepository,
    TemplateRepository,
    VoteRepository,
    VoteSessionRepository,
)
from app.modules.polls.schemas import (
    CATEGORY_METADATA,
    AdminPollCreate,
    BroadcastPollResponse,
    CandidateOption,
    CategoryInfo,
    PollCandidatesResponse,
    PollCreate,
    PollDuration,
    PollResponse,
    PollResultItem,
    PollTemplateResponse,
    ReceivedHeartHint,
    ReceivedHeartItem,
    ReceivedHeartReadResponse,
    VoteHintItem,
    VoteHintResponse,
    VoteResponse,
    VoteSessionAvailabilityResponse,
    VoteSessionResponse,
)

if TYPE_CHECKING:
    from app.modules.notifications.service import NotificationService
    from app.modules.polls.models import Poll, Vote, VoteSession

logger = logging.getLogger(__name__)


class PollService:
    """Service for poll operations."""

    CANDIDATE_COUNT = 4
    SESSION_LIMIT = 12
    SESSION_COOLDOWN = timedelta(hours=1)
    FREE_HINT_TIERS = {"CIRCLE", "TIME"}
    ORB_HINT_TIERS = {"CIRCLE", "TIME", "INITIAL", "FULL"}

    def __init__(
        self,
        template_repo: TemplateRepository,
        poll_repo: PollRepository,
        vote_repo: VoteRepository,
        membership_repo: MembershipRepository,
        circle_repo: CircleRepository | None = None,
        notification_service: NotificationService | None = None,
        vote_session_repo: VoteSessionRepository | None = None,
        user_repo: UserRepository | None = None,
    ) -> None:
        """Initialize service with repositories."""
        self.template_repo = template_repo
        self.poll_repo = poll_repo
        self.vote_repo = vote_repo
        self.membership_repo = membership_repo
        self.circle_repo = circle_repo
        self.notification_service = notification_service
        self.vote_session_repo = vote_session_repo
        self.user_repo = user_repo

    @staticmethod
    def _poll_to_response(
        poll: Poll,  # type: ignore
        has_voted: bool | None = None,
        results: list[PollResultItem] | None = None,
        *,
        circle_name: str | None = None,
        emoji: str | None = None,
        total_members: int | None = None,
        winner_name: str | None = None,
        winner_vote_count: int | None = None,
    ) -> PollResponse:
        """Convert Poll ORM object to PollResponse safely (without triggering lazy loads)."""
        return PollResponse(
            id=poll.id,
            circle_id=poll.circle_id,
            template_id=poll.template_id,
            creator_id=poll.creator_id,
            question_text=poll.question_text,
            status=poll.status,
            ends_at=poll.ends_at,
            vote_count=poll.vote_count,
            created_at=poll.created_at,
            updated_at=poll.updated_at,
            has_voted=has_voted,
            results=results,
            # Extended fields for Home Tab
            question=poll.question_text,  # Alias for frontend compatibility
            emoji=emoji,
            circle_name=circle_name,
            total_members=total_members,
            winner_name=winner_name,
            winner_vote_count=winner_vote_count,
        )

    @staticmethod
    def _vote_session_to_response(vote_session: VoteSession) -> VoteSessionResponse:
        """Convert VoteSession ORM object to API response."""
        poll_ids = [uuid.UUID(poll_id) for poll_id in vote_session.poll_ids]
        skipped_poll_ids = [
            uuid.UUID(poll_id) for poll_id in vote_session.skipped_poll_ids
        ]
        current_poll_id = (
            poll_ids[vote_session.current_index]
            if vote_session.status == "ACTIVE"
            and vote_session.current_index < len(poll_ids)
            else None
        )
        return VoteSessionResponse(
            id=vote_session.id,
            user_id=vote_session.user_id,
            circle_id=vote_session.circle_id,
            status=vote_session.status,
            poll_ids=poll_ids,
            skipped_poll_ids=skipped_poll_ids,
            current_index=vote_session.current_index,
            total_count=len(poll_ids),
            current_poll_id=current_poll_id,
            created_at=vote_session.created_at,
            updated_at=vote_session.updated_at,
            completed_at=vote_session.completed_at,
        )

    def _require_vote_session_repo(self) -> VoteSessionRepository:
        """Return vote session repository or fail fast when not wired."""
        if self.vote_session_repo is None:
            raise RuntimeError("VoteSessionRepository is not configured")
        return self.vote_session_repo

    def _require_user_repo(self) -> UserRepository:
        """Return user repository or fail fast when not wired."""
        if self.user_repo is None:
            raise RuntimeError("UserRepository is not configured")
        return self.user_repo

    async def _apply_vote_reward(self, voter_id: uuid.UUID) -> None:
        """Grant the per-vote coin and update the daily streak."""
        user_repo = self._require_user_repo()
        updated_user = await user_repo.apply_vote_reward(voter_id)
        if updated_user is None:
            raise BadRequestException("User not found")

    @staticmethod
    def _build_round_robin_queue(polls: list[Poll], limit: int) -> list[Poll]:
        """Build a cross-circle round-robin queue preserving repository order."""
        grouped: dict[uuid.UUID, list[Poll]] = {}
        for poll in polls:
            grouped.setdefault(poll.circle_id, []).append(poll)

        queue: list[Poll] = []
        groups = list(grouped.values())
        while len(queue) < limit and any(groups):
            for group in groups:
                if len(queue) >= limit:
                    break
                if group:
                    queue.append(group.pop(0))
        return queue

    async def get_vote_session_availability(
        self,
        user_id: uuid.UUID,
    ) -> VoteSessionAvailabilityResponse:
        """Return whether the user can start a vote session now."""
        user_repo = self._require_user_repo()
        user = await user_repo.find_by_id(user_id)
        if user is None:
            raise BadRequestException("User not found")

        next_session_at = user.next_session_at
        if next_session_at is None:
            return VoteSessionAvailabilityResponse(can_start=True)

        now = datetime.now(UTC)
        if next_session_at <= now:
            await user_repo.update_next_session_at(user_id, None)
            return VoteSessionAvailabilityResponse(can_start=True)

        cooldown_started_at = next_session_at - self.SESSION_COOLDOWN
        has_invite_unlock = await self.membership_repo.has_new_circle_member_since(
            user_id,
            cooldown_started_at,
        )
        if has_invite_unlock:
            await user_repo.update_next_session_at(user_id, None)
            return VoteSessionAvailabilityResponse(
                can_start=True,
                unlocked_by_invite=True,
            )

        return VoteSessionAvailabilityResponse(
            can_start=False,
            next_session_at=next_session_at,
            remaining_seconds=max(0, int((next_session_at - now).total_seconds())),
        )

    async def _complete_vote_session(
        self,
        vote_session: VoteSession,
        user_id: uuid.UUID,
    ) -> None:
        """Mark a session complete and start the user's cooldown."""
        now = datetime.now(UTC)
        vote_session.status = "COMPLETED"
        vote_session.completed_at = now
        user_repo = self._require_user_repo()
        await user_repo.update_next_session_at(
            user_id,
            now + self.SESSION_COOLDOWN,
        )

    async def start_vote_session(
        self,
        user_id: uuid.UUID,
        *,
        circle_id: uuid.UUID | None = None,
    ) -> VoteSessionResponse:
        """Create a server-side vote session queue."""
        vote_session_repo = self._require_vote_session_repo()
        availability = await self.get_vote_session_availability(user_id)
        if not availability.can_start:
            raise BadRequestException("Session cooldown active")

        if circle_id is not None:
            is_member = await self.membership_repo.exists(circle_id, user_id)
            if not is_member:
                raise BadRequestException("You are not a member of this circle")
            circle_ids = [circle_id]
        else:
            memberships = await self.membership_repo.find_by_user_id(user_id)
            circle_ids = [membership.circle_id for membership in memberships]

        polls = await self.poll_repo.find_by_user_circles(circle_ids, PollStatus.ACTIVE)
        now = datetime.now(UTC)
        eligible_polls: list[Poll] = []
        for poll in polls:
            if poll.ends_at <= now:
                continue
            voter_hash = generate_voter_hash(user_id, poll.id, salt=str(poll.id))
            has_voted = await self.vote_repo.exists_by_voter_hash(poll.id, voter_hash)
            if not has_voted:
                eligible_polls.append(poll)

        queued_polls = self._build_round_robin_queue(
            eligible_polls,
            limit=self.SESSION_LIMIT,
        )
        vote_session = await vote_session_repo.create(
            user_id=user_id,
            circle_id=circle_id,
            poll_ids=[poll.id for poll in queued_polls],
        )
        return self._vote_session_to_response(vote_session)

    async def skip_vote_session_poll(
        self,
        session_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> VoteSessionResponse:
        """Skip the current poll in a server-side vote session."""
        vote_session_repo = self._require_vote_session_repo()
        vote_session = await vote_session_repo.find_by_id_for_user(session_id, user_id)
        if vote_session is None:
            raise BadRequestException("Vote session not found")

        if vote_session.status == "COMPLETED":
            return self._vote_session_to_response(vote_session)

        poll_ids = list(vote_session.poll_ids)
        skipped_poll_ids = list(vote_session.skipped_poll_ids)
        if vote_session.current_index < len(poll_ids):
            current_poll_id = poll_ids[vote_session.current_index]
            if current_poll_id not in skipped_poll_ids:
                skipped_poll_ids.append(current_poll_id)

        next_index = vote_session.current_index + 1
        vote_session.skipped_poll_ids = skipped_poll_ids
        vote_session.current_index = next_index
        if next_index >= len(poll_ids):
            await self._complete_vote_session(vote_session, user_id)

        vote_session = await vote_session_repo.save(vote_session)
        return self._vote_session_to_response(vote_session)

    async def advance_vote_session_poll(
        self,
        session_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> VoteSessionResponse:
        """Advance the current poll after a successful vote."""
        vote_session_repo = self._require_vote_session_repo()
        vote_session = await vote_session_repo.find_by_id_for_user(session_id, user_id)
        if vote_session is None:
            raise BadRequestException("Vote session not found")

        if vote_session.status == "COMPLETED":
            return self._vote_session_to_response(vote_session)

        next_index = vote_session.current_index + 1
        vote_session.current_index = next_index
        if next_index >= len(vote_session.poll_ids):
            await self._complete_vote_session(vote_session, user_id)

        vote_session = await vote_session_repo.save(vote_session)
        return self._vote_session_to_response(vote_session)

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

    async def get_poll(
        self,
        poll_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> PollResponse:
        """Get a poll by ID.

        Args:
            poll_id: UUID of the poll
            user_id: UUID of the requesting user (for membership check)

        Returns:
            PollResponse with poll data including has_voted and results

        Raises:
            PollNotFoundError: If poll not found
            BadRequestException: If user is not a member of the poll's circle
        """
        poll = await self.poll_repo.find_by_id(poll_id)
        if poll is None:
            raise PollNotFoundError()

        # Verify user is a member of the circle
        is_member = await self.membership_repo.exists(poll.circle_id, user_id)
        if not is_member:
            raise BadRequestException("You are not a member of this circle")

        # Check if user has voted
        voter_hash = generate_voter_hash(user_id, poll_id, salt=str(poll_id))
        has_voted = await self.vote_repo.exists_by_voter_hash(poll_id, voter_hash)

        # Get results if user has voted or poll is completed
        results = None
        if has_voted or poll.status == PollStatus.COMPLETED:
            results = await self.get_results(poll_id)

        # Build response with additional fields
        return self._poll_to_response(poll, has_voted=has_voted, results=results)

    async def get_received_hearts(
        self,
        user_id: uuid.UUID,
        limit: int = 50,
        offset: int = 0,
    ) -> list[ReceivedHeartItem]:
        """Get polls where the current user received votes.

        This powers the first-class Inbox/받은 하트 surface. Read state is
        persisted per user and poll in received_heart_reads.
        """
        rows = await self.vote_repo.find_received_hearts_for_user(
            user_id,
            limit=limit,
            offset=offset,
        )

        return [
            ReceivedHeartItem(
                poll_id=row["poll_id"],
                circle_id=row["circle_id"],
                circle_name=row["circle_name"],
                question_text=row["question_text"],
                emoji=row["emoji"],
                received_count=row["received_count"],
                latest_received_at=row["latest_received_at"],
                is_read=row["is_read"],
                free_hint=ReceivedHeartHint(
                    circle_name=row["circle_name"],
                    time_label="최근",
                ),
            )
            for row in rows
        ]

    async def mark_received_heart_as_read(
        self,
        user_id: uuid.UUID,
        poll_id: uuid.UUID,
    ) -> ReceivedHeartReadResponse:
        """Mark a received heart row as read."""
        marked = await self.vote_repo.mark_received_heart_as_read(user_id, poll_id)
        if not marked:
            raise BadRequestException("Received heart not found")
        return ReceivedHeartReadResponse(poll_id=poll_id, is_read=True)

    async def get_poll_candidates(
        self,
        poll_id: uuid.UUID,
        user_id: uuid.UUID,
        *,
        shuffle: bool = False,
    ) -> PollCandidatesResponse:
        """Get server-selected vote candidates for a poll."""
        poll = await self.poll_repo.find_by_id(poll_id)
        if poll is None:
            raise PollNotFoundError(str(poll_id))

        is_member = await self.membership_repo.exists(poll.circle_id, user_id)
        if not is_member:
            raise BadRequestException("You are not a member of this circle")

        rows = await self.vote_repo.find_candidate_options(
            circle_id=poll.circle_id,
            requester_id=user_id,
            creator_id=poll.creator_id,
        )

        if shuffle:
            random.SystemRandom().shuffle(rows)

        selected_rows = rows[: self.CANDIDATE_COUNT]
        status = (
            "READY"
            if len(selected_rows) >= self.CANDIDATE_COUNT
            else "NOT_ENOUGH_CANDIDATES"
        )

        return PollCandidatesResponse(
            poll_id=poll.id,
            status=status,
            required_count=self.CANDIDATE_COUNT,
            candidates=[
                CandidateOption(
                    user_id=row["user_id"],
                    nickname=row["nickname"],
                    profile_emoji=row["profile_emoji"],
                    received_count=row["received_count"],
                )
                for row in selected_rows
            ],
        )

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

        # Schedule deadline reminders and result notification.
        try:
            from app.tasks.notification_tasks import schedule_poll_deadline_notifications

            schedule_poll_deadline_notifications(str(poll.id), poll.ends_at)
        except Exception as e:
            logger.error("Failed to schedule poll deadline notifications: %s", e)

        # 🔔 Send poll started notification (excluding creator)
        if self.notification_service:
            try:
                members = await self.membership_repo.find_by_circle_id(circle_id)
                member_ids = [m.user_id for m in members if m.user_id != creator_id]
                if member_ids:
                    await self.notification_service.send_poll_started(poll, member_ids)
                    logger.info(
                        "Poll started notification sent: poll_id=%s, recipients=%d",
                        poll.id,
                        len(member_ids),
                    )
            except Exception as e:
                logger.error("Failed to send poll started notification: %s", e)

        return self._poll_to_response(poll, has_voted=False)

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

        # Create vote (with voter_id for Orb Mode feature)
        await self.vote_repo.create(
            poll_id=poll_id,
            voter_id=voter_id,
            voter_hash=voter_hash,
            voted_for_id=voted_for_id,
        )

        # Increment poll vote count
        await self.poll_repo.increment_vote_count(poll_id)

        # Grant a coin and update the daily streak
        await self._apply_vote_reward(voter_id)

        # 🔔 Send "someone chose you" notification
        if self.notification_service:
            try:
                await self.notification_service.send_vote_received(
                    poll=poll,
                    voted_for_id=voted_for_id,
                )
                logger.info(
                    "Vote received notification sent: poll_id=%s, voted_for=%s",
                    poll_id,
                    voted_for_id,
                )
            except Exception as e:
                logger.error("Failed to send vote received notification: %s", e)

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
                result["vote_count"] / total_votes * 100.0 if total_votes > 0 else 0.0
            )

            result_items.append(
                PollResultItem(
                    user_id=result["user_id"],
                    nickname=None,  # Will be populated by router/service if needed
                    profile_emoji="",  # Will be populated by router/service if needed
                    vote_count=result["vote_count"],
                    vote_percentage=round(percentage, 2),  # float rounded to 2 decimals
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

        # 🔔 Send poll ended notification to all circle members
        if self.notification_service:
            try:
                members = await self.membership_repo.find_by_circle_id(poll.circle_id)
                member_ids = [m.user_id for m in members]
                if member_ids:
                    await self.notification_service.send_poll_ended(poll, member_ids)
                    logger.info(
                        "Poll ended notification sent: poll_id=%s, recipients=%d",
                        poll_id,
                        len(member_ids),
                    )
            except Exception as e:
                logger.error("Failed to send poll ended notification: %s", e)

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

        # Get polls from user's circles (with circle and template eager loaded)
        polls = await self.poll_repo.find_by_user_circles(circle_ids, status)

        # Build responses with extended fields for each poll
        responses = []
        for poll in polls:
            voter_hash = generate_voter_hash(user_id, poll.id, salt=str(poll.id))
            has_voted = await self.vote_repo.exists_by_voter_hash(poll.id, voter_hash)

            # Extract circle info (eager loaded)
            circle_name = poll.circle.name if poll.circle else None
            total_members = poll.circle.member_count if poll.circle else None

            # Extract emoji from template (eager loaded)
            emoji = poll.template.emoji if poll.template else None

            # Get winner info for completed polls
            winner_name = None
            winner_vote_count = None
            if poll.status == PollStatus.COMPLETED:
                results = await self.get_results(poll.id)
                if results:
                    # Find the winner (rank 1 or highest vote count)
                    winner = next(
                        (r for r in results if r.rank == 1),
                        max(results, key=lambda r: r.vote_count) if results else None,
                    )
                    if winner:
                        winner_name = winner.nickname or "알 수 없음"
                        winner_vote_count = winner.vote_count

            responses.append(
                self._poll_to_response(
                    poll,
                    has_voted=has_voted,
                    circle_name=circle_name,
                    emoji=emoji,
                    total_members=total_members,
                    winner_name=winner_name,
                    winner_vote_count=winner_vote_count,
                )
            )

        return responses

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
        return [self._poll_to_response(p) for p in polls], total

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
        return self._poll_to_response(updated_poll)

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
        templates = await self.template_repo.find_all_templates(
            category, is_active, limit, offset
        )
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
        template = await self.template_repo.create_template(
            category, question_text, emoji
        )
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

    @staticmethod
    def _time_hint(voted_at: datetime) -> str:
        """Return a coarse time-of-day hint."""
        hour = voted_at.hour
        if 5 <= hour < 12:
            return "오전 시간대에 선택했어요"
        if 12 <= hour < 18:
            return "오후 시간대에 선택했어요"
        if 18 <= hour < 24:
            return "저녁 시간대에 선택했어요"
        return "밤 시간대에 선택했어요"

    @staticmethod
    def _safe_voter_label(vote: Vote) -> str:
        """Return the app display label, not a legal identity."""
        return vote.voter.username or vote.voter.display_name or "익명"

    def _build_hint_texts(self, vote: Vote, circle_name: str) -> dict[str, str]:
        """Build all safe hint tier texts for a vote."""
        label = self._safe_voter_label(vote)
        initial = label[0] if label else "?"
        return {
            "CIRCLE": f"{circle_name} Circle 친구가 선택했어요",
            "TIME": self._time_hint(vote.created_at),
            "INITIAL": f"앱 표시명의 첫 글자는 '{initial}'이에요",
            "FULL": f"{vote.voter.profile_emoji or '👤'} {label} 표시명의 친구가 선택했어요",
        }

    async def get_vote_hints_for_user(
        self,
        poll_id: uuid.UUID,
        user_id: uuid.UUID,
        *,
        is_orb_mode: bool,
    ) -> VoteHintResponse:
        """Return safe tiered hints for votes received by the user."""
        poll = await self.poll_repo.find_by_id(poll_id)
        if poll is None:
            raise PollNotFoundError()

        is_member = await self.membership_repo.exists(poll.circle_id, user_id)
        if not is_member:
            raise BadRequestException("You are not a member of this circle")

        if self.circle_repo is None:
            raise RuntimeError("CircleRepository is not configured")
        circle = await self.circle_repo.find_by_id(poll.circle_id)
        circle_name = circle.name if circle is not None else "내"

        votes = await self.vote_repo.find_votes_received_by_user(poll_id, user_id)
        existing_hints = await self.vote_repo.find_vote_hints_for_votes(
            [vote.id for vote in votes]
        )
        hint_map = {
            (hint.vote_id, hint.tier): hint
            for hint in existing_hints
        }
        unlocked_tiers = self.ORB_HINT_TIERS if is_orb_mode else self.FREE_HINT_TIERS

        response_hints: list[VoteHintItem] = []
        for vote in votes:
            tier_texts = self._build_hint_texts(vote, circle_name)
            for tier in ("CIRCLE", "TIME", "INITIAL", "FULL"):
                hint = hint_map.get((vote.id, tier))
                if hint is None:
                    hint = await self.vote_repo.create_vote_hint(
                        vote_id=vote.id,
                        user_id=user_id,
                        tier=tier,
                        hint_text=tier_texts[tier],
                    )
                    hint_map[(vote.id, tier)] = hint

                unlocked = tier in unlocked_tiers
                response_hints.append(
                    VoteHintItem(
                        vote_id=vote.id,
                        tier=tier,  # type: ignore[arg-type]
                        text=hint.hint_text if unlocked else "Orb Mode에서 열 수 있어요",
                        unlocked=unlocked,
                    )
                )

        return VoteHintResponse(
            poll_id=poll_id,
            question_text=poll.question_text,
            hints=response_hints,
        )

    async def broadcast_poll(
        self,
        admin_id: uuid.UUID,
        data: AdminPollCreate,
    ) -> BroadcastPollResponse:
        """Broadcast a poll to multiple circles (Admin only).

        Args:
            admin_id: UUID of the admin user
            data: Admin poll creation data

        Returns:
            BroadcastPollResponse with created polls

        Raises:
            BadRequestException: If no question provided or no circles selected
        """
        # 1. 질문 텍스트 결정
        question_text: str | None = None
        template_id: uuid.UUID | None = None

        if data.template_id:
            template = await self.template_repo.find_by_id(data.template_id)
            if template is None:
                raise BadRequestException("Template not found")
            question_text = template.question_text
            template_id = data.template_id
        elif data.custom_question:
            question_text = data.custom_question
        else:
            raise BadRequestException("Either template_id or custom_question is required")

        # 2. 대상 Circle 결정
        circle_ids: list[uuid.UUID] = []

        if data.apply_to_all:
            if self.circle_repo is None:
                raise BadRequestException("Circle repository not available")
            circles = await self.circle_repo.find_all(is_active=True, limit=1000)
            circle_ids = [c.id for c in circles]
        elif data.circle_ids:
            circle_ids = data.circle_ids
        else:
            raise BadRequestException("Either apply_to_all or circle_ids is required")

        if not circle_ids:
            raise BadRequestException("No circles to broadcast to")

        # 3. 투표 종료 시간 계산
        ends_at = self._calculate_end_time(data.duration)

        # 4. 각 Circle에 투표 생성
        created_polls: list[PollResponse] = []
        failed_count = 0

        for circle_id in circle_ids:
            try:
                poll = await self.poll_repo.create(
                    circle_id=circle_id,
                    template_id=template_id,
                    creator_id=admin_id,
                    question_text=question_text,
                    ends_at=ends_at,
                )
                created_polls.append(self._poll_to_response(poll))

                # 템플릿 사용 시 usage count 증가
                if template_id:
                    await self.template_repo.increment_usage_count(template_id)
            except Exception:
                failed_count += 1

        return BroadcastPollResponse(
            created_count=len(created_polls),
            failed_count=failed_count,
            polls=created_polls,
        )
