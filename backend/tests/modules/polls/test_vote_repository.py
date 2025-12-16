"""Tests for Vote Repository."""

import uuid
from datetime import datetime, timedelta

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import TemplateCategory
from app.core.security import generate_invite_code
from app.modules.auth.repository import UserRepository
from app.modules.auth.schemas import UserCreate
from app.modules.circles.repository import CircleRepository
from app.modules.circles.schemas import CircleCreate
from app.modules.polls.models import Poll, PollTemplate, Vote
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
        vote = await repo.create(poll_id=poll.id, voter_hash=voter_hash, voted_for_id=voted_for.id)

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
        vote = Vote(poll_id=poll.id, voter_hash=voter_hash, voted_for_id=voted_for.id)
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
        vote1 = Vote(poll_id=poll.id, voter_hash="hash1", voted_for_id=voted_for.id)
        vote2 = Vote(poll_id=poll.id, voter_hash="hash2", voted_for_id=voted_for.id)
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
            Vote(poll_id=poll.id, voter_hash="hash1", voted_for_id=member1.id),
            Vote(poll_id=poll.id, voter_hash="hash2", voted_for_id=member1.id),
            Vote(poll_id=poll.id, voter_hash="hash3", voted_for_id=member2.id),
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
