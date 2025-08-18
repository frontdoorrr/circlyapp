import pytest
import pytest_asyncio
from datetime import datetime, timedelta
from unittest.mock import Mock, AsyncMock, patch
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.poll import Poll, PollOption, Vote
from app.models.circle import Circle, CircleMember
from app.models.user import User
from app.models.question_template import QuestionTemplate
from app.services.poll_service import PollService
from app.schemas.poll import PollCreate, VoteCreate


@pytest_asyncio.fixture
async def poll_service(db_session: AsyncSession):
    """PollService 인스턴스 생성"""
    return PollService(db_session)


@pytest_asyncio.fixture
async def sample_user(db_session: AsyncSession):
    """테스트용 사용자 생성"""
    user = User(
        device_id=f"test_device_{datetime.now().microsecond}",
        username=f"testuser_{datetime.now().microsecond}",
        display_name="테스트유저"
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def sample_circle(db_session: AsyncSession, sample_user: User):
    """테스트용 서클 생성"""
    circle = Circle(
        name=f"테스트서클_{datetime.now().microsecond}",
        description="테스트용 서클",
        creator_id=sample_user.id,
        invite_code=f"TEST{datetime.now().microsecond}"
    )
    db_session.add(circle)
    await db_session.commit()
    await db_session.refresh(circle)
    return circle


@pytest_asyncio.fixture
async def sample_template(db_session: AsyncSession):
    """테스트용 질문 템플릿 생성"""
    template = QuestionTemplate(
        category="성격",
        question_text="가장 친근한 사람은?",
        usage_count=5
    )
    db_session.add(template)
    await db_session.commit()
    await db_session.refresh(template)
    return template


@pytest_asyncio.fixture
async def sample_members(db_session: AsyncSession, sample_circle: Circle):
    """테스트용 서클 멤버들 생성"""
    members = []
    
    # 추가 사용자들 생성
    for i in range(4):
        user = User(
            device_id=f"member_device_{i}_{datetime.now().microsecond}",
            username=f"member_{i}_{datetime.now().microsecond}",
            display_name=f"멤버{i+1}"
        )
        db_session.add(user)
        await db_session.flush()
        
        # CircleMember 생성
        member = CircleMember(
            circle_id=sample_circle.id,
            user_id=user.id
        )
        db_session.add(member)
        members.append(member)
    
    await db_session.commit()
    for member in members:
        await db_session.refresh(member)
    
    return members


@pytest_asyncio.fixture
async def creator_membership(db_session: AsyncSession, sample_circle: Circle, sample_user: User):
    """투표 생성자의 멤버십 생성"""
    membership = CircleMember(
        circle_id=sample_circle.id,
        user_id=sample_user.id
    )
    db_session.add(membership)
    await db_session.commit()
    await db_session.refresh(membership)
    return membership


class TestPollService:
    """PollService 테스트"""

    @pytest.mark.asyncio
    async def test_create_poll_success(
        self, 
        poll_service: PollService, 
        db_session: AsyncSession,
        sample_user: User,
        sample_circle: Circle,
        sample_template: QuestionTemplate,
        sample_members: list,
        creator_membership: CircleMember
    ):
        """투표 생성 성공 케이스"""
        # Given
        poll_data = PollCreate(
            template_id=sample_template.id,
            circle_id=sample_circle.id,
            question_text=sample_template.question_text,
            deadline=datetime.now() + timedelta(hours=24)
        )

        # When
        poll = await poll_service.create_poll(poll_data, sample_user.id)

        # Then
        assert poll is not None
        assert poll.creator_id == sample_user.id
        assert poll.circle_id == sample_circle.id
        assert poll.template_id == sample_template.id
        assert poll.question_text == sample_template.question_text
        assert len(poll.options) == len(sample_members)  # 생성자 제외한 멤버 수
        assert poll.is_active is True
        assert poll.is_closed is False

        # 템플릿 사용 횟수 증가 확인
        await db_session.refresh(sample_template)
        assert sample_template.usage_count == 6

    @pytest.mark.asyncio
    async def test_create_poll_not_member(
        self,
        poll_service: PollService,
        sample_circle: Circle,
        sample_template: QuestionTemplate
    ):
        """비멤버의 투표 생성 실패 케이스"""
        # Given
        non_member_id = 99999
        poll_data = PollCreate(
            template_id=sample_template.id,
            circle_id=sample_circle.id,
            question_text=sample_template.question_text,
            deadline=datetime.now() + timedelta(hours=24)
        )

        # When & Then
        with pytest.raises(ValueError, match="Circle 멤버가 아니므로 투표를 생성할 수 없습니다"):
            await poll_service.create_poll(poll_data, non_member_id)

    @pytest.mark.asyncio
    async def test_create_poll_insufficient_members(
        self,
        db_session: AsyncSession,
        poll_service: PollService,
        sample_user: User,
        sample_template: QuestionTemplate,
        creator_membership: CircleMember
    ):
        """멤버 수 부족으로 투표 생성 실패"""
        # Given - 멤버가 1명만 있는 경우 (생성자만)
        poll_data = PollCreate(
            template_id=sample_template.id,
            circle_id=creator_membership.circle_id,
            question_text=sample_template.question_text,
            deadline=datetime.now() + timedelta(hours=24)
        )

        # When & Then
        with pytest.raises(ValueError, match="투표를 생성하려면 최소 3명의 Circle 멤버가 필요합니다"):
            await poll_service.create_poll(poll_data, sample_user.id)

    @pytest.mark.asyncio 
    async def test_get_polls_with_filters(
        self,
        db_session: AsyncSession,
        poll_service: PollService,
        sample_user: User,
        sample_circle: Circle,
        sample_template: QuestionTemplate,
        sample_members: list,
        creator_membership: CircleMember
    ):
        """필터링된 투표 목록 조회"""
        # Given - 여러 투표 생성
        active_poll_data = PollCreate(
            template_id=sample_template.id,
            circle_id=sample_circle.id,
            question_text="활성 투표",
            deadline=datetime.now() + timedelta(hours=24)
        )
        active_poll = await poll_service.create_poll(active_poll_data, sample_user.id)

        expired_poll_data = PollCreate(
            template_id=sample_template.id,
            circle_id=sample_circle.id,
            question_text="만료된 투표",
            deadline=datetime.now() - timedelta(hours=1)
        )
        expired_poll = await poll_service.create_poll(expired_poll_data, sample_user.id)

        # When - 활성 투표만 조회
        active_polls, total_active = await poll_service.get_polls(
            circle_id=sample_circle.id,
            status="active",
            limit=10,
            offset=0
        )

        # Then
        assert len(active_polls) == 1
        assert total_active == 1
        assert active_polls[0].id == active_poll.id

        # When - 만료된 투표만 조회
        expired_polls, total_expired = await poll_service.get_polls(
            circle_id=sample_circle.id,
            status="expired",
            limit=10,
            offset=0
        )

        # Then
        assert len(expired_polls) == 1
        assert total_expired == 1
        assert expired_polls[0].id == expired_poll.id

    @pytest.mark.asyncio
    async def test_vote_on_poll_success(
        self,
        db_session: AsyncSession,
        poll_service: PollService,
        sample_user: User,
        sample_circle: Circle,
        sample_template: QuestionTemplate,
        sample_members: list,
        creator_membership: CircleMember
    ):
        """투표 참여 성공 케이스"""
        # Given - 투표 생성
        poll_data = PollCreate(
            template_id=sample_template.id,
            circle_id=sample_circle.id,
            question_text=sample_template.question_text,
            deadline=datetime.now() + timedelta(hours=24)
        )
        poll = await poll_service.create_poll(poll_data, sample_user.id)

        # 투표할 다른 사용자 생성 및 멤버십 추가
        voter = User(
            device_id=f"voter_device_{datetime.now().microsecond}",
            username=f"voter_{datetime.now().microsecond}",
            display_name="투표자"
        )
        db_session.add(voter)
        await db_session.flush()

        voter_membership = CircleMember(
            circle_id=sample_circle.id,
            user_id=voter.id
        )
        db_session.add(voter_membership)
        await db_session.commit()
        await db_session.refresh(voter)

        option = poll.options[0]
        vote_data = VoteCreate(option_id=option.id)

        # When
        vote = await poll_service.vote_on_poll(poll.id, vote_data, voter.id)

        # Then
        assert vote is not None
        assert vote.poll_id == poll.id
        assert vote.option_id == option.id
        assert vote.user_id == voter.id
        assert vote.anonymous_hash is not None

        # 투표 통계 업데이트 확인
        await db_session.refresh(poll)
        assert poll.total_votes == 1
        assert poll.total_participants == 1

        await db_session.refresh(option)
        assert option.vote_count == 1

    @pytest.mark.asyncio
    async def test_vote_on_poll_duplicate_vote(
        self,
        db_session: AsyncSession,
        poll_service: PollService,
        sample_user: User,
        sample_circle: Circle,
        sample_template: QuestionTemplate,
        sample_members: list,
        creator_membership: CircleMember
    ):
        """중복 투표 방지 테스트"""
        # Given - 투표 생성 및 첫 번째 투표
        poll_data = PollCreate(
            template_id=sample_template.id,
            circle_id=sample_circle.id,
            question_text=sample_template.question_text,
            deadline=datetime.now() + timedelta(hours=24)
        )
        poll = await poll_service.create_poll(poll_data, sample_user.id)

        voter = User(
            device_id=f"voter_device_{datetime.now().microsecond}",
            username=f"voter_{datetime.now().microsecond}",
            display_name="투표자"
        )
        db_session.add(voter)
        await db_session.flush()

        voter_membership = CircleMember(
            circle_id=sample_circle.id,
            user_id=voter.id
        )
        db_session.add(voter_membership)
        await db_session.commit()
        await db_session.refresh(voter)

        option = poll.options[0]
        vote_data = VoteCreate(option_id=option.id)

        # 첫 번째 투표
        await poll_service.vote_on_poll(poll.id, vote_data, voter.id)

        # When & Then - 두 번째 투표 시도
        with pytest.raises(ValueError, match="이미 투표에 참여했습니다"):
            await poll_service.vote_on_poll(poll.id, vote_data, voter.id)

    @pytest.mark.asyncio
    async def test_vote_on_expired_poll(
        self,
        db_session: AsyncSession,
        poll_service: PollService,
        sample_user: User,
        sample_circle: Circle,
        sample_template: QuestionTemplate,
        sample_members: list,
        creator_membership: CircleMember
    ):
        """만료된 투표 참여 실패 테스트"""
        # Given - 만료된 투표 생성
        poll_data = PollCreate(
            template_id=sample_template.id,
            circle_id=sample_circle.id,
            question_text=sample_template.question_text,
            deadline=datetime.now() - timedelta(hours=1)  # 만료된 시간
        )
        poll = await poll_service.create_poll(poll_data, sample_user.id)

        voter = User(
            device_id=f"voter_device_{datetime.now().microsecond}",
            username=f"voter_{datetime.now().microsecond}",
            display_name="투표자"
        )
        db_session.add(voter)
        await db_session.flush()

        voter_membership = CircleMember(
            circle_id=sample_circle.id,
            user_id=voter.id
        )
        db_session.add(voter_membership)
        await db_session.commit()
        await db_session.refresh(voter)

        option = poll.options[0]
        vote_data = VoteCreate(option_id=option.id)

        # When & Then
        with pytest.raises(ValueError, match="투표 마감 시간이 지났습니다"):
            await poll_service.vote_on_poll(poll.id, vote_data, voter.id)

    @pytest.mark.asyncio
    async def test_get_poll_results(
        self,
        db_session: AsyncSession,
        poll_service: PollService,
        sample_user: User,
        sample_circle: Circle,
        sample_template: QuestionTemplate,
        sample_members: list,
        creator_membership: CircleMember
    ):
        """투표 결과 조회 테스트"""
        # Given - 투표 생성
        poll_data = PollCreate(
            template_id=sample_template.id,
            circle_id=sample_circle.id,
            question_text=sample_template.question_text,
            deadline=datetime.now() + timedelta(hours=24)
        )
        poll = await poll_service.create_poll(poll_data, sample_user.id)

        # 여러 투표자가 투표
        voters = []
        for i in range(3):
            voter = User(
                device_id=f"voter_device_{i}_{datetime.now().microsecond}",
                username=f"voter_{i}_{datetime.now().microsecond}",
                display_name=f"투표자{i+1}"
            )
            db_session.add(voter)
            await db_session.flush()

            voter_membership = CircleMember(
                circle_id=sample_circle.id,
                user_id=voter.id,
                nickname=f"투표자{i+1}",
                is_active=True
            )
            db_session.add(voter_membership)
            voters.append(voter)
        
        await db_session.commit()
        for voter in voters:
            await db_session.refresh(voter)

        # 첫 번째 옵션에 2표, 두 번째 옵션에 1표
        option1 = poll.options[0]
        option2 = poll.options[1]

        await poll_service.vote_on_poll(poll.id, VoteCreate(option_id=option1.id), voters[0].id)
        await poll_service.vote_on_poll(poll.id, VoteCreate(option_id=option1.id), voters[1].id)
        await poll_service.vote_on_poll(poll.id, VoteCreate(option_id=option2.id), voters[2].id)

        # When
        results = await poll_service.get_poll_results(poll.id)

        # Then
        assert results is not None
        assert results["poll_id"] == poll.id
        assert results["total_votes"] == 3
        assert results["total_participants"] == 3
        assert len(results["results"]) == len(poll.options)

        # 결과 정렬 확인 (투표수 내림차순)
        sorted_results = results["results"]
        assert sorted_results[0]["vote_count"] >= sorted_results[1]["vote_count"]

        # 우승자 확인
        winner = results["winner"]
        assert winner is not None
        assert winner["vote_count"] == 2
        assert winner["percentage"] == 66.7

    @pytest.mark.asyncio
    async def test_close_poll_success(
        self,
        db_session: AsyncSession,
        poll_service: PollService,
        sample_user: User,
        sample_circle: Circle,
        sample_template: QuestionTemplate,
        sample_members: list,
        creator_membership: CircleMember
    ):
        """투표 마감 성공 테스트"""
        # Given
        poll_data = PollCreate(
            template_id=sample_template.id,
            circle_id=sample_circle.id,
            question_text=sample_template.question_text,
            deadline=datetime.now() + timedelta(hours=24)
        )
        poll = await poll_service.create_poll(poll_data, sample_user.id)

        # When
        success = await poll_service.close_poll(poll.id, sample_user.id)

        # Then
        assert success is True
        
        # 투표가 마감되었는지 확인
        updated_poll = await poll_service.get_poll_by_id(poll.id)
        assert updated_poll.is_closed is True

    @pytest.mark.asyncio
    async def test_close_poll_unauthorized(
        self,
        db_session: AsyncSession,
        poll_service: PollService,
        sample_user: User,
        sample_circle: Circle,
        sample_template: QuestionTemplate,
        sample_members: list,
        creator_membership: CircleMember
    ):
        """비생성자의 투표 마감 실패 테스트"""
        # Given
        poll_data = PollCreate(
            template_id=sample_template.id,
            circle_id=sample_circle.id,
            question_text=sample_template.question_text,
            deadline=datetime.now() + timedelta(hours=24)
        )
        poll = await poll_service.create_poll(poll_data, sample_user.id)

        other_user_id = 99999

        # When & Then
        with pytest.raises(ValueError, match="투표 생성자만 마감할 수 있습니다"):
            await poll_service.close_poll(poll.id, other_user_id)

    @pytest.mark.asyncio
    async def test_delete_poll_success(
        self,
        db_session: AsyncSession,
        poll_service: PollService,
        sample_user: User,
        sample_circle: Circle,
        sample_template: QuestionTemplate,
        sample_members: list,
        creator_membership: CircleMember
    ):
        """투표 삭제 성공 테스트"""
        # Given
        poll_data = PollCreate(
            template_id=sample_template.id,
            circle_id=sample_circle.id,
            question_text=sample_template.question_text,
            deadline=datetime.now() + timedelta(hours=24)
        )
        poll = await poll_service.create_poll(poll_data, sample_user.id)

        # When
        success = await poll_service.delete_poll(poll.id, sample_user.id)

        # Then
        assert success is True
        
        # 투표가 비활성화되었는지 확인
        deleted_poll = await poll_service.get_poll_by_id(poll.id)
        assert deleted_poll is None  # is_active=False이므로 조회되지 않음

    @pytest.mark.asyncio
    async def test_delete_poll_after_24_hours(
        self,
        db_session: AsyncSession,
        poll_service: PollService,
        sample_user: User,
        sample_circle: Circle,
        sample_template: QuestionTemplate,
        sample_members: list,
        creator_membership: CircleMember
    ):
        """24시간 후 투표 삭제 실패 테스트"""
        # Given - 24시간 전에 생성된 투표 시뮬레이션
        poll_data = PollCreate(
            template_id=sample_template.id,
            circle_id=sample_circle.id,
            question_text=sample_template.question_text,
            deadline=datetime.now() + timedelta(hours=24)
        )
        poll = await poll_service.create_poll(poll_data, sample_user.id)

        # 생성 시간을 25시간 전으로 수정
        poll.created_at = datetime.now() - timedelta(hours=25)
        await db_session.commit()

        # When & Then
        with pytest.raises(ValueError, match="투표 생성 후 24시간이 지나면 삭제할 수 없습니다"):
            await poll_service.delete_poll(poll.id, sample_user.id)

    @pytest.mark.asyncio
    async def test_check_circle_membership(
        self,
        poll_service: PollService,
        sample_circle: Circle,
        creator_membership: CircleMember
    ):
        """Circle 멤버십 확인 테스트"""
        # When & Then - 멤버인 경우
        is_member = await poll_service.check_circle_membership(
            sample_circle.id, 
            creator_membership.user_id
        )
        assert is_member is True

        # When & Then - 비멤버인 경우
        is_non_member = await poll_service.check_circle_membership(
            sample_circle.id, 
            99999
        )
        assert is_non_member is False