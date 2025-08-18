import pytest
import pytest_asyncio
from datetime import datetime, timedelta
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.circle import Circle, CircleMember
from app.models.question_template import QuestionTemplate
from app.models.poll import Poll, PollOption


@pytest_asyncio.fixture
async def authenticated_user(async_session: AsyncSession, async_client: AsyncClient):
    """인증된 사용자 생성"""
    user = User(
        username=f"testuser_{datetime.now().microsecond}",
        email=f"test_{datetime.now().microsecond}@example.com",
        hashed_password="hashed_password",
        nickname="테스트유저"
    )
    async_session.add(user)
    await async_session.commit()
    await async_session.refresh(user)
    
    # JWT 토큰 생성 (실제 인증 로직에 맞춰 수정 필요)
    # 여기서는 테스트용으로 간단히 처리
    return user


@pytest_asyncio.fixture
async def test_circle(async_session: AsyncSession, authenticated_user: User):
    """테스트용 서클 생성"""
    circle = Circle(
        name=f"테스트서클_{datetime.now().microsecond}",
        description="테스트용 서클",
        creator_id=authenticated_user.id,
        invite_code=f"TEST{datetime.now().microsecond}",
        member_limit=10
    )
    async_session.add(circle)
    await async_session.commit()
    await async_session.refresh(circle)
    return circle


@pytest_asyncio.fixture
async def test_template(async_session: AsyncSession):
    """테스트용 질문 템플릿 생성"""
    template = QuestionTemplate(
        category="성격",
        question_text="가장 친근한 사람은?",
        usage_count=5
    )
    async_session.add(template)
    await async_session.commit()
    await async_session.refresh(template)
    return template


@pytest_asyncio.fixture
async def circle_members(async_session: AsyncSession, test_circle: Circle, authenticated_user: User):
    """서클 멤버들 생성 (생성자 포함)"""
    members = []
    
    # 생성자 멤버십 생성
    creator_membership = CircleMember(
        circle_id=test_circle.id,
        user_id=authenticated_user.id,
        nickname="생성자",
        is_active=True
    )
    async_session.add(creator_membership)
    members.append(creator_membership)
    
    # 추가 멤버들 생성
    for i in range(4):
        user = User(
            username=f"member_{i}_{datetime.now().microsecond}",
            email=f"member_{i}_{datetime.now().microsecond}@example.com",
            hashed_password="hashed_password",
            nickname=f"멤버{i+1}"
        )
        async_session.add(user)
        await async_session.flush()
        
        member = CircleMember(
            circle_id=test_circle.id,
            user_id=user.id,
            nickname=f"멤버{i+1}",
            is_active=True
        )
        async_session.add(member)
        members.append(member)
    
    await async_session.commit()
    for member in members:
        await async_session.refresh(member)
    
    return members


@pytest_asyncio.fixture
async def auth_headers(authenticated_user: User):
    """인증 헤더 생성"""
    # 실제 JWT 토큰 생성 로직 필요
    # 임시로 사용자 ID를 헤더로 전달 (실제 구현에서는 JWT 토큰 사용)
    return {"X-User-ID": str(authenticated_user.id)}


class TestPollAPI:
    """Poll API 통합 테스트"""

    @pytest.mark.asyncio
    async def test_create_poll_success(
        self,
        async_client: AsyncClient,
        authenticated_user: User,
        test_circle: Circle,
        test_template: QuestionTemplate,
        circle_members: list,
        auth_headers: dict
    ):
        """투표 생성 API 성공 테스트"""
        # Given
        poll_data = {
            "template_id": test_template.id,
            "circle_id": test_circle.id,
            "question_text": test_template.question_text,
            "deadline": (datetime.now() + timedelta(hours=24)).isoformat()
        }

        # When
        response = await async_client.post(
            "/api/v1/polls/",
            json=poll_data,
            headers=auth_headers
        )

        # Then
        assert response.status_code == 200
        data = response.json()
        
        assert data["creator_id"] == authenticated_user.id
        assert data["circle_id"] == test_circle.id
        assert data["template_id"] == test_template.id
        assert data["question_text"] == test_template.question_text
        assert data["is_active"] is True
        assert data["is_closed"] is False
        assert len(data["options"]) == len(circle_members) - 1  # 생성자 제외

    @pytest.mark.asyncio
    async def test_create_poll_invalid_template(
        self,
        async_client: AsyncClient,
        test_circle: Circle,
        circle_members: list,
        auth_headers: dict
    ):
        """존재하지 않는 템플릿으로 투표 생성 실패 테스트"""
        # Given
        poll_data = {
            "template_id": "non_existent_template_id",
            "circle_id": test_circle.id,
            "question_text": "테스트 질문",
            "deadline": (datetime.now() + timedelta(hours=24)).isoformat()
        }

        # When
        response = await async_client.post(
            "/api/v1/polls/",
            json=poll_data,
            headers=auth_headers
        )

        # Then
        assert response.status_code == 400
        assert "존재하지 않는 템플릿입니다" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_create_poll_past_deadline(
        self,
        async_client: AsyncClient,
        test_circle: Circle,
        test_template: QuestionTemplate,
        circle_members: list,
        auth_headers: dict
    ):
        """과거 시간으로 마감일 설정 시 실패 테스트"""
        # Given
        poll_data = {
            "template_id": test_template.id,
            "circle_id": test_circle.id,
            "question_text": test_template.question_text,
            "deadline": (datetime.now() - timedelta(hours=1)).isoformat()
        }

        # When
        response = await async_client.post(
            "/api/v1/polls/",
            json=poll_data,
            headers=auth_headers
        )

        # Then
        assert response.status_code == 422  # 유효성 검사 실패

    @pytest.mark.asyncio
    async def test_get_polls_list(
        self,
        async_client: AsyncClient,
        async_session: AsyncSession,
        authenticated_user: User,
        test_circle: Circle,
        test_template: QuestionTemplate,
        circle_members: list,
        auth_headers: dict
    ):
        """투표 목록 조회 API 테스트"""
        # Given - 여러 투표 생성
        from app.services.poll_service import PollService
        from app.schemas.poll import PollCreate
        
        poll_service = PollService(async_session)
        
        for i in range(3):
            poll_data = PollCreate(
                template_id=test_template.id,
                circle_id=test_circle.id,
                question_text=f"테스트 질문 {i+1}",
                deadline=datetime.now() + timedelta(hours=24)
            )
            await poll_service.create_poll(poll_data, authenticated_user.id)

        # When
        response = await async_client.get(
            f"/api/v1/polls/?circle_id={test_circle.id}&limit=10&offset=0",
            headers=auth_headers
        )

        # Then
        assert response.status_code == 200
        data = response.json()
        
        assert data["total"] == 3
        assert len(data["polls"]) == 3
        assert data["limit"] == 10
        assert data["offset"] == 0

        # 각 투표에 사용자 투표 여부 정보가 포함되어 있는지 확인
        for poll in data["polls"]:
            assert "user_voted" in poll
            assert "user_vote_option_id" in poll
            assert poll["user_voted"] is False
            assert poll["user_vote_option_id"] is None

    @pytest.mark.asyncio
    async def test_get_polls_with_status_filter(
        self,
        async_client: AsyncClient,
        async_session: AsyncSession,
        authenticated_user: User,
        test_circle: Circle,
        test_template: QuestionTemplate,
        circle_members: list,
        auth_headers: dict
    ):
        """상태 필터로 투표 목록 조회 테스트"""
        # Given - 활성 투표와 만료된 투표 생성
        from app.services.poll_service import PollService
        from app.schemas.poll import PollCreate
        
        poll_service = PollService(async_session)
        
        # 활성 투표 생성
        active_poll_data = PollCreate(
            template_id=test_template.id,
            circle_id=test_circle.id,
            question_text="활성 투표",
            deadline=datetime.now() + timedelta(hours=24)
        )
        await poll_service.create_poll(active_poll_data, authenticated_user.id)
        
        # 만료된 투표 생성
        expired_poll_data = PollCreate(
            template_id=test_template.id,
            circle_id=test_circle.id,
            question_text="만료된 투표",
            deadline=datetime.now() - timedelta(hours=1)
        )
        await poll_service.create_poll(expired_poll_data, authenticated_user.id)

        # When - 활성 투표만 조회
        response = await async_client.get(
            f"/api/v1/polls/?circle_id={test_circle.id}&status=active",
            headers=auth_headers
        )

        # Then
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["polls"][0]["question_text"] == "활성 투표"

        # When - 만료된 투표만 조회
        response = await async_client.get(
            f"/api/v1/polls/?circle_id={test_circle.id}&status=expired",
            headers=auth_headers
        )

        # Then
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["polls"][0]["question_text"] == "만료된 투표"

    @pytest.mark.asyncio
    async def test_get_poll_by_id(
        self,
        async_client: AsyncClient,
        async_session: AsyncSession,
        authenticated_user: User,
        test_circle: Circle,
        test_template: QuestionTemplate,
        circle_members: list,
        auth_headers: dict
    ):
        """특정 투표 상세 조회 API 테스트"""
        # Given
        from app.services.poll_service import PollService
        from app.schemas.poll import PollCreate
        
        poll_service = PollService(async_session)
        poll_data = PollCreate(
            template_id=test_template.id,
            circle_id=test_circle.id,
            question_text="상세 조회 테스트",
            deadline=datetime.now() + timedelta(hours=24)
        )
        poll = await poll_service.create_poll(poll_data, authenticated_user.id)

        # When
        response = await async_client.get(
            f"/api/v1/polls/{poll.id}",
            headers=auth_headers
        )

        # Then
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == poll.id
        assert data["question_text"] == "상세 조회 테스트"
        assert data["circle_id"] == test_circle.id
        assert data["creator_id"] == authenticated_user.id
        assert "user_voted" in data
        assert "options" in data

    @pytest.mark.asyncio
    async def test_vote_on_poll_success(
        self,
        async_client: AsyncClient,
        async_session: AsyncSession,
        authenticated_user: User,
        test_circle: Circle,
        test_template: QuestionTemplate,
        circle_members: list
    ):
        """투표 참여 API 성공 테스트"""
        # Given - 투표 생성
        from app.services.poll_service import PollService
        from app.schemas.poll import PollCreate
        
        poll_service = PollService(async_session)
        poll_data = PollCreate(
            template_id=test_template.id,
            circle_id=test_circle.id,
            question_text="투표 참여 테스트",
            deadline=datetime.now() + timedelta(hours=24)
        )
        poll = await poll_service.create_poll(poll_data, authenticated_user.id)

        # 다른 사용자로 투표 참여
        voter = User(
            username=f"voter_{datetime.now().microsecond}",
            email=f"voter_{datetime.now().microsecond}@example.com",
            hashed_password="hashed_password",
            nickname="투표자"
        )
        async_session.add(voter)
        await async_session.flush()

        voter_membership = CircleMember(
            circle_id=test_circle.id,
            user_id=voter.id,
            nickname="투표자",
            is_active=True
        )
        async_session.add(voter_membership)
        await async_session.commit()
        await async_session.refresh(voter)

        option = poll.options[0]
        vote_data = {"option_id": option.id}
        voter_headers = {"X-User-ID": str(voter.id)}

        # When
        response = await async_client.post(
            f"/api/v1/polls/{poll.id}/vote",
            json=vote_data,
            headers=voter_headers
        )

        # Then
        assert response.status_code == 200
        data = response.json()
        
        assert data["poll_id"] == poll.id
        assert data["option_id"] == option.id

    @pytest.mark.asyncio
    async def test_vote_on_nonexistent_poll(
        self,
        async_client: AsyncClient,
        auth_headers: dict
    ):
        """존재하지 않는 투표 참여 시도 테스트"""
        # Given
        vote_data = {"option_id": "some_option_id"}

        # When
        response = await async_client.post(
            "/api/v1/polls/nonexistent_poll_id/vote",
            json=vote_data,
            headers=auth_headers
        )

        # Then
        assert response.status_code == 400
        assert "존재하지 않는 투표입니다" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_get_poll_results(
        self,
        async_client: AsyncClient,
        async_session: AsyncSession,
        authenticated_user: User,
        test_circle: Circle,
        test_template: QuestionTemplate,
        circle_members: list,
        auth_headers: dict
    ):
        """투표 결과 조회 API 테스트"""
        # Given - 투표 생성 및 투표 참여
        from app.services.poll_service import PollService
        from app.schemas.poll import PollCreate, VoteCreate
        
        poll_service = PollService(async_session)
        poll_data = PollCreate(
            template_id=test_template.id,
            circle_id=test_circle.id,
            question_text="결과 조회 테스트",
            deadline=datetime.now() + timedelta(hours=24)
        )
        poll = await poll_service.create_poll(poll_data, authenticated_user.id)

        # 투표 참여
        voter = User(
            username=f"voter_{datetime.now().microsecond}",
            email=f"voter_{datetime.now().microsecond}@example.com",
            hashed_password="hashed_password",
            nickname="투표자"
        )
        async_session.add(voter)
        await async_session.flush()

        voter_membership = CircleMember(
            circle_id=test_circle.id,
            user_id=voter.id,
            nickname="투표자",
            is_active=True
        )
        async_session.add(voter_membership)
        await async_session.commit()
        await async_session.refresh(voter)

        option = poll.options[0]
        await poll_service.vote_on_poll(poll.id, VoteCreate(option_id=option.id), voter.id)

        # When
        response = await async_client.get(
            f"/api/v1/polls/{poll.id}/results",
            headers=auth_headers
        )

        # Then
        assert response.status_code == 200
        data = response.json()
        
        assert data["poll_id"] == poll.id
        assert data["total_votes"] == 1
        assert data["total_participants"] == 1
        assert len(data["results"]) > 0
        
        # 첫 번째 결과 확인
        first_result = data["results"][0]
        assert first_result["vote_count"] == 1
        assert first_result["percentage"] == 100.0
        assert first_result["rank"] == 1

    @pytest.mark.asyncio
    async def test_close_poll_success(
        self,
        async_client: AsyncClient,
        async_session: AsyncSession,
        authenticated_user: User,
        test_circle: Circle,
        test_template: QuestionTemplate,
        circle_members: list,
        auth_headers: dict
    ):
        """투표 마감 API 성공 테스트"""
        # Given
        from app.services.poll_service import PollService
        from app.schemas.poll import PollCreate
        
        poll_service = PollService(async_session)
        poll_data = PollCreate(
            template_id=test_template.id,
            circle_id=test_circle.id,
            question_text="마감 테스트",
            deadline=datetime.now() + timedelta(hours=24)
        )
        poll = await poll_service.create_poll(poll_data, authenticated_user.id)

        # When
        response = await async_client.post(
            f"/api/v1/polls/{poll.id}/close",
            headers=auth_headers
        )

        # Then
        assert response.status_code == 200
        data = response.json()
        assert "성공적으로 마감되었습니다" in data["message"]

    @pytest.mark.asyncio
    async def test_close_poll_unauthorized(
        self,
        async_client: AsyncClient,
        async_session: AsyncSession,
        authenticated_user: User,
        test_circle: Circle,
        test_template: QuestionTemplate,
        circle_members: list
    ):
        """비생성자의 투표 마감 시도 실패 테스트"""
        # Given
        from app.services.poll_service import PollService
        from app.schemas.poll import PollCreate
        
        poll_service = PollService(async_session)
        poll_data = PollCreate(
            template_id=test_template.id,
            circle_id=test_circle.id,
            question_text="마감 권한 테스트",
            deadline=datetime.now() + timedelta(hours=24)
        )
        poll = await poll_service.create_poll(poll_data, authenticated_user.id)

        # 다른 사용자로 마감 시도
        other_user = User(
            username=f"other_{datetime.now().microsecond}",
            email=f"other_{datetime.now().microsecond}@example.com",
            hashed_password="hashed_password",
            nickname="다른사용자"
        )
        async_session.add(other_user)
        await async_session.commit()
        await async_session.refresh(other_user)

        other_headers = {"X-User-ID": str(other_user.id)}

        # When
        response = await async_client.post(
            f"/api/v1/polls/{poll.id}/close",
            headers=other_headers
        )

        # Then
        assert response.status_code == 400
        assert "투표 생성자만 마감할 수 있습니다" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_delete_poll_success(
        self,
        async_client: AsyncClient,
        async_session: AsyncSession,
        authenticated_user: User,
        test_circle: Circle,
        test_template: QuestionTemplate,
        circle_members: list,
        auth_headers: dict
    ):
        """투표 삭제 API 성공 테스트"""
        # Given
        from app.services.poll_service import PollService
        from app.schemas.poll import PollCreate
        
        poll_service = PollService(async_session)
        poll_data = PollCreate(
            template_id=test_template.id,
            circle_id=test_circle.id,
            question_text="삭제 테스트",
            deadline=datetime.now() + timedelta(hours=24)
        )
        poll = await poll_service.create_poll(poll_data, authenticated_user.id)

        # When
        response = await async_client.delete(
            f"/api/v1/polls/{poll.id}",
            headers=auth_headers
        )

        # Then
        assert response.status_code == 200
        data = response.json()
        assert "성공적으로 삭제되었습니다" in data["message"]

        # 삭제된 투표 조회 시 404 반환 확인
        get_response = await async_client.get(
            f"/api/v1/polls/{poll.id}",
            headers=auth_headers
        )
        assert get_response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_polls_non_member(
        self,
        async_client: AsyncClient,
        test_circle: Circle
    ):
        """비멤버의 투표 목록 조회 실패 테스트"""
        # Given - 비멤버 사용자
        non_member_headers = {"X-User-ID": "99999"}

        # When
        response = await async_client.get(
            f"/api/v1/polls/?circle_id={test_circle.id}",
            headers=non_member_headers
        )

        # Then
        assert response.status_code == 403
        assert "Circle 멤버가 아닙니다" in response.json()["detail"]