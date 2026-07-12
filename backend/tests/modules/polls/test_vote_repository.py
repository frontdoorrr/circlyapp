"""Tests for Vote Repository."""

from datetime import datetime, timedelta

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import MemberRole
from app.core.security import generate_invite_code
from app.modules.auth.repository import UserRepository
from app.modules.auth.schemas import UserCreate
from app.modules.circles.repository import CircleRepository, MembershipRepository
from app.modules.circles.schemas import CircleCreate
from app.modules.polls.models import Poll, Vote
from app.modules.polls.repository import VoteRepository


class TestVoteRepository:
    """Tests for VoteRepository."""

    @pytest.mark.asyncio
    async def test_create_vote(self, db_session: AsyncSession) -> None:
        """Test vote creation."""
        # Setup: Create users, circle, and poll
        user_repo = UserRepository(db_session)
        voter = await user_repo.create(
            UserCreate(email="voter@example.com", password="password123")
        )
        voted_for = await user_repo.create(
            UserCreate(email="votedfor@example.com", password="password123")
        )

        circle_repo = CircleRepository(db_session)
        circle = await circle_repo.create(
            CircleCreate(name="Circle"), voter.id, generate_invite_code()
        )

        poll = Poll(
            circle_id=circle.id,
            creator_id=voter.id,
            question_text="Test question?",
            ends_at=datetime.now() + timedelta(hours=1),
        )
        db_session.add(poll)
        await db_session.commit()
        await db_session.refresh(poll)

        # Create vote
        repo = VoteRepository(db_session)
        voter_hash = "test_hash_12345"
        vote = await repo.create(
            poll_id=poll.id,
            voter_id=voter.id,
            voter_hash=voter_hash,
            voted_for_id=voted_for.id,
        )

        assert vote is not None
        assert vote.poll_id == poll.id
        assert vote.voter_hash == voter_hash
        assert vote.voted_for_id == voted_for.id

    @pytest.mark.asyncio
    async def test_exists_by_voter_hash_true(self, db_session: AsyncSession) -> None:
        """Test checking if vote exists (positive case)."""
        # Setup
        user_repo = UserRepository(db_session)
        voter = await user_repo.create(
            UserCreate(email="voter@example.com", password="password123")
        )
        voted_for = await user_repo.create(
            UserCreate(email="votedfor@example.com", password="password123")
        )

        circle_repo = CircleRepository(db_session)
        circle = await circle_repo.create(
            CircleCreate(name="Circle"), voter.id, generate_invite_code()
        )

        poll = Poll(
            circle_id=circle.id,
            creator_id=voter.id,
            question_text="Test?",
            ends_at=datetime.now() + timedelta(hours=1),
        )
        db_session.add(poll)
        await db_session.commit()
        await db_session.refresh(poll)

        # Create vote
        voter_hash = "existing_hash"
        vote = Vote(poll_id=poll.id, voter_id=voter.id, voter_hash=voter_hash, voted_for_id=voted_for.id)
        db_session.add(vote)
        await db_session.commit()

        # Test
        repo = VoteRepository(db_session)
        exists = await repo.exists_by_voter_hash(poll.id, voter_hash)

        assert exists is True

    @pytest.mark.asyncio
    async def test_exists_by_voter_hash_false(self, db_session: AsyncSession) -> None:
        """Test checking if vote exists (negative case)."""
        # Setup
        user_repo = UserRepository(db_session)
        voter = await user_repo.create(
            UserCreate(email="voter@example.com", password="password123")
        )

        circle_repo = CircleRepository(db_session)
        circle = await circle_repo.create(
            CircleCreate(name="Circle"), voter.id, generate_invite_code()
        )

        poll = Poll(
            circle_id=circle.id,
            creator_id=voter.id,
            question_text="Test?",
            ends_at=datetime.now() + timedelta(hours=1),
        )
        db_session.add(poll)
        await db_session.commit()
        await db_session.refresh(poll)

        # Test with non-existent voter hash
        repo = VoteRepository(db_session)
        exists = await repo.exists_by_voter_hash(poll.id, "nonexistent_hash")

        assert exists is False

    @pytest.mark.asyncio
    async def test_count_by_poll_id(self, db_session: AsyncSession) -> None:
        """Test counting votes for a poll."""
        # Setup
        user_repo = UserRepository(db_session)
        voter1 = await user_repo.create(
            UserCreate(email="voter1@example.com", password="password123")
        )
        voter2 = await user_repo.create(
            UserCreate(email="voter2@example.com", password="password123")
        )
        voted_for = await user_repo.create(
            UserCreate(email="votedfor@example.com", password="password123")
        )

        circle_repo = CircleRepository(db_session)
        circle = await circle_repo.create(
            CircleCreate(name="Circle"), voter1.id, generate_invite_code()
        )

        poll = Poll(
            circle_id=circle.id,
            creator_id=voter1.id,
            question_text="Test?",
            ends_at=datetime.now() + timedelta(hours=1),
        )
        db_session.add(poll)
        await db_session.commit()
        await db_session.refresh(poll)

        # Create votes
        vote1 = Vote(poll_id=poll.id, voter_id=voter1.id, voter_hash="hash1", voted_for_id=voted_for.id)
        vote2 = Vote(poll_id=poll.id, voter_id=voter2.id, voter_hash="hash2", voted_for_id=voted_for.id)
        db_session.add_all([vote1, vote2])
        await db_session.commit()

        # Test
        repo = VoteRepository(db_session)
        count = await repo.count_by_poll_id(poll.id)

        assert count == 2

    @pytest.mark.asyncio
    async def test_get_results_by_poll_id(self, db_session: AsyncSession) -> None:
        """Test getting vote results for a poll."""
        # Setup
        user_repo = UserRepository(db_session)
        creator = await user_repo.create(
            UserCreate(email="creator@example.com", password="password123")
        )
        member1 = await user_repo.create(
            UserCreate(email="member1@example.com", password="password123")
        )
        member2 = await user_repo.create(
            UserCreate(email="member2@example.com", password="password123")
        )

        circle_repo = CircleRepository(db_session)
        circle = await circle_repo.create(
            CircleCreate(name="Circle"), creator.id, generate_invite_code()
        )

        poll = Poll(
            circle_id=circle.id,
            creator_id=creator.id,
            question_text="Test?",
            ends_at=datetime.now() + timedelta(hours=1),
        )
        db_session.add(poll)
        await db_session.commit()
        await db_session.refresh(poll)

        # Create votes: member1 gets 2 votes, member2 gets 1 vote
        votes = [
            Vote(poll_id=poll.id, voter_id=creator.id, voter_hash="hash1", voted_for_id=member1.id),
            Vote(poll_id=poll.id, voter_id=member1.id, voter_hash="hash2", voted_for_id=member1.id),
            Vote(poll_id=poll.id, voter_id=member2.id, voter_hash="hash3", voted_for_id=member2.id),
        ]
        db_session.add_all(votes)
        await db_session.commit()

        # Test
        repo = VoteRepository(db_session)
        results = await repo.get_results_by_poll_id(poll.id)

        assert len(results) == 2
        # Results should be ordered by vote_count desc
        assert results[0]["user_id"] == member1.id
        assert results[0]["vote_count"] == 2
        assert results[1]["user_id"] == member2.id
        assert results[1]["vote_count"] == 1

    @pytest.mark.asyncio
    async def test_find_candidate_options_excludes_voter_and_creator(
        self, db_session: AsyncSession
    ) -> None:
        """Candidate options exclude the current voter and poll creator."""
        user_repo = UserRepository(db_session)
        creator = await user_repo.create(
            UserCreate(email="creator@example.com", password="password123")
        )
        voter = await user_repo.create(
            UserCreate(email="session-voter@example.com", password="password123")
        )
        member = await user_repo.create(
            UserCreate(email="candidate@example.com", password="password123")
        )

        circle_repo = CircleRepository(db_session)
        circle = await circle_repo.create(
            CircleCreate(name="Circle"), creator.id, generate_invite_code()
        )
        membership_repo = MembershipRepository(db_session)
        await membership_repo.create(circle.id, creator.id, MemberRole.OWNER)
        await membership_repo.create(circle.id, voter.id)
        await membership_repo.create(circle.id, member.id, nickname="Candidate")

        repo = VoteRepository(db_session)
        candidates = await repo.find_candidate_options(
            circle_id=circle.id,
            requester_id=voter.id,
            creator_id=creator.id,
        )

        assert [candidate["user_id"] for candidate in candidates] == [member.id]
        assert candidates[0]["nickname"] == "Candidate"

    @pytest.mark.asyncio
    async def test_find_candidate_options_orders_by_received_count(
        self, db_session: AsyncSession
    ) -> None:
        """Candidates with fewer received votes in the circle are shown first."""
        user_repo = UserRepository(db_session)
        creator = await user_repo.create(
            UserCreate(email="creator2@example.com", password="password123")
        )
        voter = await user_repo.create(
            UserCreate(email="session-voter2@example.com", password="password123")
        )
        popular = await user_repo.create(
            UserCreate(email="popular@example.com", password="password123")
        )
        underexposed = await user_repo.create(
            UserCreate(email="underexposed@example.com", password="password123")
        )

        circle_repo = CircleRepository(db_session)
        circle = await circle_repo.create(
            CircleCreate(name="Circle"), creator.id, generate_invite_code()
        )
        membership_repo = MembershipRepository(db_session)
        await membership_repo.create(circle.id, creator.id, MemberRole.OWNER)
        await membership_repo.create(circle.id, voter.id)
        await membership_repo.create(circle.id, popular.id, nickname="Popular")
        await membership_repo.create(circle.id, underexposed.id, nickname="Under")

        poll = Poll(
            circle_id=circle.id,
            creator_id=creator.id,
            question_text="Test?",
            ends_at=datetime.now() + timedelta(hours=1),
        )
        db_session.add(poll)
        await db_session.flush()

        db_session.add(
            Vote(
                poll_id=poll.id,
                voter_id=voter.id,
                voter_hash="popular-hash",
                voted_for_id=popular.id,
            )
        )
        await db_session.commit()

        repo = VoteRepository(db_session)
        candidates = await repo.find_candidate_options(
            circle_id=circle.id,
            requester_id=voter.id,
            creator_id=creator.id,
        )

        assert [candidate["user_id"] for candidate in candidates] == [
            underexposed.id,
            popular.id,
        ]
        assert candidates[0]["received_count"] == 0
        assert candidates[1]["received_count"] == 1

    @pytest.mark.asyncio
    async def test_received_hearts_read_state(
        self, db_session: AsyncSession
    ) -> None:
        """Received heart rows reflect persisted read state."""
        user_repo = UserRepository(db_session)
        voter = await user_repo.create(
            UserCreate(email="heart-voter@example.com", password="password123")
        )
        receiver = await user_repo.create(
            UserCreate(email="heart-receiver@example.com", password="password123")
        )

        circle_repo = CircleRepository(db_session)
        circle = await circle_repo.create(
            CircleCreate(name="Heart Circle"), voter.id, generate_invite_code()
        )
        membership_repo = MembershipRepository(db_session)
        await membership_repo.create(circle.id, voter.id, MemberRole.OWNER)
        await membership_repo.create(circle.id, receiver.id)

        poll = Poll(
            circle_id=circle.id,
            creator_id=voter.id,
            question_text="Who made your day?",
            ends_at=datetime.now() + timedelta(hours=1),
        )
        db_session.add(poll)
        await db_session.flush()

        repo = VoteRepository(db_session)
        await repo.create(
            poll_id=poll.id,
            voter_id=voter.id,
            voter_hash="heart-read-hash",
            voted_for_id=receiver.id,
        )
        await db_session.commit()

        rows = await repo.find_received_hearts_for_user(receiver.id)
        assert rows[0]["is_read"] is False

        marked = await repo.mark_received_heart_as_read(receiver.id, poll.id)
        rows = await repo.find_received_hearts_for_user(receiver.id)

        assert marked is True
        assert rows[0]["is_read"] is True
