import pytest
import pytest_asyncio
from datetime import datetime, timedelta
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.circle import Circle, CircleMember
from app.models.question_template import QuestionTemplate


class TestPollE2EScenarios:
    """투표 시스템 E2E 시나리오 테스트"""

    @pytest.mark.asyncio
    async def test_complete_poll_lifecycle(
        self,
        async_client: AsyncClient,
        async_session: AsyncSession
    ):
        """전체 투표 라이프사이클 E2E 테스트"""
        
        # 1. 기본 데이터 생성
        # 사용자 생성
        creator = User(
            username=f"creator_{datetime.now().microsecond}",
            email=f"creator_{datetime.now().microsecond}@example.com",
            hashed_password="hashed_password",
            nickname="투표생성자"
        )
        async_session.add(creator)
        await async_session.flush()

        # 서클 생성
        circle = Circle(
            name=f"테스트서클_{datetime.now().microsecond}",
            description="E2E 테스트용 서클",
            creator_id=creator.id,
            invite_code=f"E2E{datetime.now().microsecond}",
            member_limit=10
        )
        async_session.add(circle)
        await async_session.flush()

        # 질문 템플릿 생성
        template = QuestionTemplate(
            category="성격",
            question_text="가장 친근한 사람은?",
            usage_count=0
        )
        async_session.add(template)
        await async_session.flush()

        # 서클 멤버들 생성 (생성자 포함)
        creator_membership = CircleMember(
            circle_id=circle.id,
            user_id=creator.id,
            nickname="생성자",
            is_active=True
        )
        async_session.add(creator_membership)

        members = []
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
                circle_id=circle.id,
                user_id=user.id,
                nickname=f"멤버{i+1}",
                is_active=True
            )
            async_session.add(member)
            members.append((user, member))

        await async_session.commit()
        
        # 모든 객체 refresh
        await async_session.refresh(creator)
        await async_session.refresh(circle)
        await async_session.refresh(template)
        await async_session.refresh(creator_membership)
        for user, member in members:
            await async_session.refresh(user)
            await async_session.refresh(member)

        creator_headers = {"X-User-ID": str(creator.id)}

        # 2. 투표 생성 (Creator)
        poll_data = {
            "template_id": template.id,
            "circle_id": circle.id,
            "question_text": template.question_text,
            "deadline": (datetime.now() + timedelta(hours=24)).isoformat()
        }

        create_response = await async_client.post(
            "/api/v1/polls/",
            json=poll_data,
            headers=creator_headers
        )
        
        assert create_response.status_code == 200
        poll = create_response.json()
        poll_id = poll["id"]
        
        # 생성된 투표 검증
        assert poll["creator_id"] == creator.id
        assert poll["circle_id"] == circle.id
        assert len(poll["options"]) == 4  # 생성자 제외한 멤버 수
        assert poll["is_active"] is True
        assert poll["is_closed"] is False

        # 3. 투표 목록 조회 - 생성자 확인
        list_response = await async_client.get(
            f"/api/v1/polls/?circle_id={circle.id}",
            headers=creator_headers
        )
        
        assert list_response.status_code == 200
        poll_list = list_response.json()
        assert poll_list["total"] == 1
        assert poll_list["polls"][0]["id"] == poll_id

        # 4. 여러 멤버들의 투표 참여
        votes_cast = []
        for i, (user, member) in enumerate(members[:3]):  # 3명이 투표
            member_headers = {"X-User-ID": str(user.id)}
            
            # 투표 상세 조회 - 투표 전 상태 확인
            detail_response = await async_client.get(
                f"/api/v1/polls/{poll_id}",
                headers=member_headers
            )
            assert detail_response.status_code == 200
            poll_detail = detail_response.json()
            assert poll_detail["user_voted"] is False
            assert poll_detail["user_vote_option_id"] is None

            # 투표 참여 - 첫 번째 옵션에 집중 투표
            option_id = poll["options"][0]["id"] if i < 2 else poll["options"][1]["id"]
            vote_data = {"option_id": option_id}
            
            vote_response = await async_client.post(
                f"/api/v1/polls/{poll_id}/vote",
                json=vote_data,
                headers=member_headers
            )
            
            assert vote_response.status_code == 200
            vote = vote_response.json()
            assert vote["poll_id"] == poll_id
            assert vote["option_id"] == option_id
            votes_cast.append((user.id, option_id))

            # 투표 후 상태 확인
            detail_response_after = await async_client.get(
                f"/api/v1/polls/{poll_id}",
                headers=member_headers
            )
            assert detail_response_after.status_code == 200
            poll_detail_after = detail_response_after.json()
            assert poll_detail_after["user_voted"] is True
            assert poll_detail_after["user_vote_option_id"] == option_id

        # 5. 중복 투표 시도 및 실패 확인
        first_voter_headers = {"X-User-ID": str(members[0][0].id)}
        duplicate_vote_data = {"option_id": poll["options"][1]["id"]}
        
        duplicate_response = await async_client.post(
            f"/api/v1/polls/{poll_id}/vote",
            json=duplicate_vote_data,
            headers=first_voter_headers
        )
        
        assert duplicate_response.status_code == 400
        assert "이미 투표에 참여했습니다" in duplicate_response.json()["detail"]

        # 6. 투표 결과 조회 - 중간 결과
        results_response = await async_client.get(
            f"/api/v1/polls/{poll_id}/results",
            headers=creator_headers
        )
        
        assert results_response.status_code == 200
        results = results_response.json()
        
        assert results["poll_id"] == poll_id
        assert results["total_votes"] == 3
        assert results["total_participants"] == 3
        assert len(results["results"]) == 4  # 모든 옵션

        # 결과 순위 확인
        sorted_results = results["results"]
        assert sorted_results[0]["vote_count"] == 2  # 첫 번째 옵션
        assert sorted_results[1]["vote_count"] == 1  # 두 번째 옵션
        assert sorted_results[2]["vote_count"] == 0  # 나머지 옵션들
        
        # 승자 확인
        winner = results["winner"]
        assert winner is not None
        assert winner["vote_count"] == 2
        assert winner["percentage"] == 66.7
        assert winner["rank"] == 1

        # 7. 추가 투표자의 투표 (동률 만들기)
        last_voter_headers = {"X-User-ID": str(members[3][0].id)}
        tie_vote_data = {"option_id": poll["options"][1]["id"]}
        
        tie_vote_response = await async_client.post(
            f"/api/v1/polls/{poll_id}/vote",
            json=tie_vote_data,
            headers=last_voter_headers
        )
        
        assert tie_vote_response.status_code == 200

        # 8. 동률 상황에서의 결과 조회
        final_results_response = await async_client.get(
            f"/api/v1/polls/{poll_id}/results",
            headers=creator_headers
        )
        
        assert final_results_response.status_code == 200
        final_results = final_results_response.json()
        
        assert final_results["total_votes"] == 4
        assert final_results["total_participants"] == 4
        
        # 동률 확인
        top_results = [r for r in final_results["results"] if r["rank"] == 1]
        assert len(top_results) == 2  # 2명이 공동 1위
        for result in top_results:
            assert result["vote_count"] == 2
            assert result["percentage"] == 50.0

        # 동률 시 우승자는 None이어야 함
        assert final_results["winner"] is None

        # 9. 투표 마감 (생성자에 의한)
        close_response = await async_client.post(
            f"/api/v1/polls/{poll_id}/close",
            headers=creator_headers
        )
        
        assert close_response.status_code == 200
        assert "성공적으로 마감되었습니다" in close_response.json()["message"]

        # 10. 마감된 투표에 투표 시도 (실패해야 함)
        # 새 멤버 생성
        late_user = User(
            username=f"late_{datetime.now().microsecond}",
            email=f"late_{datetime.now().microsecond}@example.com",
            hashed_password="hashed_password",
            nickname="늦은투표자"
        )
        async_session.add(late_user)
        await async_session.flush()
        
        late_membership = CircleMember(
            circle_id=circle.id,
            user_id=late_user.id,
            nickname="늦은투표자",
            is_active=True
        )
        async_session.add(late_membership)
        await async_session.commit()
        await async_session.refresh(late_user)

        late_headers = {"X-User-ID": str(late_user.id)}
        late_vote_data = {"option_id": poll["options"][0]["id"]}
        
        late_vote_response = await async_client.post(
            f"/api/v1/polls/{poll_id}/vote",
            json=late_vote_data,
            headers=late_headers
        )
        
        assert late_vote_response.status_code == 400
        assert "마감된 투표입니다" in late_vote_response.json()["detail"]

        # 11. 마감된 투표의 상태별 목록 조회
        completed_polls_response = await async_client.get(
            f"/api/v1/polls/?circle_id={circle.id}&status=completed",
            headers=creator_headers
        )
        
        assert completed_polls_response.status_code == 200
        completed_polls = completed_polls_response.json()
        assert completed_polls["total"] == 1
        assert completed_polls["polls"][0]["id"] == poll_id

        active_polls_response = await async_client.get(
            f"/api/v1/polls/?circle_id={circle.id}&status=active",
            headers=creator_headers
        )
        
        assert active_polls_response.status_code == 200
        active_polls = active_polls_response.json()
        assert active_polls["total"] == 0

    @pytest.mark.asyncio
    async def test_expired_poll_scenario(
        self,
        async_client: AsyncClient,
        async_session: AsyncSession
    ):
        """만료된 투표 시나리오 테스트"""
        
        # 기본 데이터 생성
        creator = User(
            username=f"creator_{datetime.now().microsecond}",
            email=f"creator_{datetime.now().microsecond}@example.com",
            hashed_password="hashed_password",
            nickname="생성자"
        )
        async_session.add(creator)
        await async_session.flush()

        circle = Circle(
            name=f"만료테스트_{datetime.now().microsecond}",
            description="만료 테스트용",
            creator_id=creator.id,
            invite_code=f"EXP{datetime.now().microsecond}",
            member_limit=10
        )
        async_session.add(circle)
        await async_session.flush()

        template = QuestionTemplate(
            category="테스트",
            question_text="만료 테스트 질문",
            usage_count=0
        )
        async_session.add(template)
        await async_session.flush()

        # 생성자 멤버십
        creator_membership = CircleMember(
            circle_id=circle.id,
            user_id=creator.id,
            nickname="생성자",
            is_active=True
        )
        async_session.add(creator_membership)

        # 추가 멤버
        member_user = User(
            username=f"member_{datetime.now().microsecond}",
            email=f"member_{datetime.now().microsecond}@example.com",
            hashed_password="hashed_password",
            nickname="멤버"
        )
        async_session.add(member_user)
        await async_session.flush()
        
        member = CircleMember(
            circle_id=circle.id,
            user_id=member_user.id,
            nickname="멤버",
            is_active=True
        )
        async_session.add(member)

        await async_session.commit()
        await async_session.refresh(creator)
        await async_session.refresh(circle)
        await async_session.refresh(template)
        await async_session.refresh(member_user)

        creator_headers = {"X-User-ID": str(creator.id)}
        member_headers = {"X-User-ID": str(member_user.id)}

        # 이미 만료된 투표 생성 시도 (유효성 검사 실패)
        expired_poll_data = {
            "template_id": template.id,
            "circle_id": circle.id,
            "question_text": template.question_text,
            "deadline": (datetime.now() - timedelta(hours=1)).isoformat()
        }

        expired_create_response = await async_client.post(
            "/api/v1/polls/",
            json=expired_poll_data,
            headers=creator_headers
        )
        
        assert expired_create_response.status_code == 422  # 유효성 검사 실패

        # 정상적으로 만료된 투표 생성 (백엔드에서 직접 생성)
        from app.services.poll_service import PollService
        from app.schemas.poll import PollCreate
        
        poll_service = PollService(async_session)
        
        # 곧 만료될 투표 생성 (1초 후 만료)
        soon_expired_poll_data = PollCreate(
            template_id=template.id,
            circle_id=circle.id,
            question_text="곧 만료될 투표",
            deadline=datetime.now() + timedelta(seconds=1)
        )
        poll = await poll_service.create_poll(soon_expired_poll_data, creator.id)

        # 잠시 대기하여 투표 만료
        import asyncio
        await asyncio.sleep(2)

        # 만료된 투표에 투표 시도
        vote_data = {"option_id": poll.options[0].id}
        expired_vote_response = await async_client.post(
            f"/api/v1/polls/{poll.id}/vote",
            json=vote_data,
            headers=member_headers
        )
        
        assert expired_vote_response.status_code == 400
        assert "투표 마감 시간이 지났습니다" in expired_vote_response.json()["detail"]

        # 만료된 투표 목록 조회
        expired_list_response = await async_client.get(
            f"/api/v1/polls/?circle_id={circle.id}&status=expired",
            headers=creator_headers
        )
        
        assert expired_list_response.status_code == 200
        expired_list = expired_list_response.json()
        assert expired_list["total"] == 1
        assert expired_list["polls"][0]["id"] == poll.id

        # 만료된 투표 결과 조회 (여전히 가능해야 함)
        expired_results_response = await async_client.get(
            f"/api/v1/polls/{poll.id}/results",
            headers=creator_headers
        )
        
        assert expired_results_response.status_code == 200
        expired_results = expired_results_response.json()
        assert expired_results["is_closed"] is True  # 자동으로 마감 처리
        assert expired_results["total_votes"] == 0

    @pytest.mark.asyncio
    async def test_unauthorized_access_scenarios(
        self,
        async_client: AsyncClient,
        async_session: AsyncSession
    ):
        """권한 없는 접근 시나리오 테스트"""
        
        # 데이터 생성
        creator = User(
            username=f"creator_{datetime.now().microsecond}",
            email=f"creator_{datetime.now().microsecond}@example.com",
            hashed_password="hashed_password",
            nickname="생성자"
        )
        outsider = User(
            username=f"outsider_{datetime.now().microsecond}",
            email=f"outsider_{datetime.now().microsecond}@example.com",
            hashed_password="hashed_password",
            nickname="외부인"
        )
        async_session.add_all([creator, outsider])
        await async_session.flush()

        circle = Circle(
            name=f"프라이빗서클_{datetime.now().microsecond}",
            description="권한 테스트용",
            creator_id=creator.id,
            invite_code=f"PRIV{datetime.now().microsecond}",
            member_limit=10
        )
        async_session.add(circle)
        await async_session.flush()

        template = QuestionTemplate(
            category="테스트",
            question_text="권한 테스트 질문",
            usage_count=0
        )
        async_session.add(template)
        await async_session.flush()

        # 생성자만 멤버로 추가
        creator_membership = CircleMember(
            circle_id=circle.id,
            user_id=creator.id,
            nickname="생성자",
            is_active=True
        )
        async_session.add(creator_membership)

        await async_session.commit()
        await async_session.refresh(creator)
        await async_session.refresh(outsider)
        await async_session.refresh(circle)
        await async_session.refresh(template)

        creator_headers = {"X-User-ID": str(creator.id)}
        outsider_headers = {"X-User-ID": str(outsider.id)}

        # 외부인의 투표 생성 시도
        outsider_poll_data = {
            "template_id": template.id,
            "circle_id": circle.id,
            "question_text": template.question_text,
            "deadline": (datetime.now() + timedelta(hours=24)).isoformat()
        }

        outsider_create_response = await async_client.post(
            "/api/v1/polls/",
            json=outsider_poll_data,
            headers=outsider_headers
        )
        
        assert outsider_create_response.status_code == 400
        assert "Circle 멤버가 아니므로 투표를 생성할 수 없습니다" in outsider_create_response.json()["detail"]

        # 외부인의 투표 목록 조회 시도
        outsider_list_response = await async_client.get(
            f"/api/v1/polls/?circle_id={circle.id}",
            headers=outsider_headers
        )
        
        assert outsider_list_response.status_code == 403
        assert "Circle 멤버가 아닙니다" in outsider_list_response.json()["detail"]

        # 생성자가 투표 생성 (멤버 부족으로 실패해야 함)
        creator_poll_response = await async_client.post(
            "/api/v1/polls/",
            json=outsider_poll_data,
            headers=creator_headers
        )
        
        assert creator_poll_response.status_code == 400
        assert "투표를 생성하려면 최소 3명의 Circle 멤버가 필요합니다" in creator_poll_response.json()["detail"]