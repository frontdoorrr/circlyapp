from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, update
from sqlalchemy.orm import selectinload
from typing import List, Optional, Tuple
from datetime import datetime, timedelta
import hashlib
import secrets

from app.models.poll import Poll, PollOption, Vote
from app.models.circle import Circle, CircleMember
from app.models.question_template import QuestionTemplate
from app.schemas.poll import PollCreate, PollUpdate, VoteCreate


class PollService:
    def __init__(self, db_session: AsyncSession):
        self.db = db_session

    async def create_poll(self, poll_data: PollCreate, creator_id: int) -> Poll:
        """새 투표 생성"""
        
        # 1. Circle 멤버십 확인
        membership_query = select(CircleMember).where(
            and_(
                CircleMember.circle_id == poll_data.circle_id,
                CircleMember.user_id == creator_id
            )
        )
        membership_result = await self.db.execute(membership_query)
        membership = membership_result.scalar_one_or_none()
        
        if not membership:
            raise ValueError("Circle 멤버가 아니므로 투표를 생성할 수 없습니다")

        # 2. 템플릿 정보 조회 및 사용 횟수 증가
        from app.services.question_template_service import QuestionTemplateService
        template_service = QuestionTemplateService(self.db)
        
        template = await template_service.get_template_by_id(poll_data.template_id)
        if not template:
            raise ValueError("존재하지 않는 템플릿입니다")
        
        await template_service.increment_usage_count(poll_data.template_id)

        # 3. Poll 생성
        poll = Poll(
            circle_id=poll_data.circle_id,
            creator_id=creator_id,
            template_id=poll_data.template_id,
            question_text=poll_data.question_text,
            deadline=poll_data.deadline
        )
        
        self.db.add(poll)
        await self.db.flush()  # poll.id를 얻기 위해 flush

        # 4. Circle의 활성 멤버들을 선택지로 생성 (투표 생성자 제외)
        from sqlalchemy.orm import selectinload
        members_query = select(CircleMember).options(
            selectinload(CircleMember.user)
        ).where(
            and_(
                CircleMember.circle_id == poll_data.circle_id,
                CircleMember.user_id != creator_id  # 투표 생성자는 선택지에서 제외
            )
        ).order_by(CircleMember.joined_at)
        
        members_result = await self.db.execute(members_query)
        members = members_result.scalars().all()

        if len(members) < 2:
            raise ValueError("투표를 생성하려면 최소 3명의 Circle 멤버가 필요합니다")

        # 5. PollOption들 생성 (User의 display_name 사용)
        options = []
        for idx, member in enumerate(members):
            # member.user로 User 정보에 접근
            option = PollOption(
                poll_id=poll.id,
                member_id=member.id,
                member_nickname=member.user.display_name or f"멤버{idx+1}",
                display_order=idx
            )
            options.append(option)
            self.db.add(option)

        await self.db.commit()
        await self.db.refresh(poll)
        
        # options 관계 로드
        poll_with_options = await self.get_poll_by_id(poll.id)
        return poll_with_options

    async def get_polls(
        self, 
        circle_id: Optional[int] = None,
        user_id: Optional[int] = None,
        status: Optional[str] = None,  # 'active', 'completed', 'expired'
        limit: int = 20,
        offset: int = 0
    ) -> Tuple[List[Poll], int]:
        """투표 목록 조회"""
        
        query = select(Poll).options(
            selectinload(Poll.options),
            selectinload(Poll.template)
        )
        count_query = select(func.count(Poll.id))

        # 필터 적용
        conditions = [Poll.is_active == True]
        
        if circle_id:
            conditions.append(Poll.circle_id == circle_id)
            
        if status == 'active':
            conditions.append(Poll.deadline > datetime.now())
            conditions.append(Poll.is_closed == False)
        elif status == 'completed':
            conditions.append(Poll.is_closed == True)
        elif status == 'expired':
            conditions.append(Poll.deadline <= datetime.now())
            conditions.append(Poll.is_closed == False)

        if conditions:
            query = query.where(and_(*conditions))
            count_query = count_query.where(and_(*conditions))

        # 전체 개수 조회
        count_result = await self.db.execute(count_query)
        total = count_result.scalar()

        # 데이터 조회
        query = query.order_by(Poll.created_at.desc())
        query = query.limit(limit).offset(offset)
        
        result = await self.db.execute(query)
        polls = result.scalars().all()
        
        return list(polls), total

    async def get_poll_by_id(self, poll_id: str) -> Optional[Poll]:
        """특정 투표 상세 조회"""
        query = select(Poll).where(
            and_(
                Poll.id == poll_id,
                Poll.is_active == True
            )
        ).options(
            selectinload(Poll.options),
            selectinload(Poll.template)
        )
        
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def vote_on_poll(self, poll_id: str, vote_data: VoteCreate, user_id: int) -> Vote:
        """투표 참여"""
        
        # 1. Poll 존재 및 상태 확인
        poll = await self.get_poll_by_id(poll_id)
        if not poll:
            raise ValueError("존재하지 않는 투표입니다")
        
        if poll.is_closed:
            raise ValueError("마감된 투표입니다")
            
        if poll.deadline <= datetime.now():
            raise ValueError("투표 마감 시간이 지났습니다")

        # 2. Circle 멤버십 확인
        membership_query = select(CircleMember).where(
            and_(
                CircleMember.circle_id == poll.circle_id,
                CircleMember.user_id == user_id
            )
        )
        membership_result = await self.db.execute(membership_query)
        membership = membership_result.scalar_one_or_none()
        
        if not membership:
            raise ValueError("Circle 멤버가 아니므로 투표할 수 없습니다")

        # 3. 중복 투표 확인
        existing_vote_query = select(Vote).where(
            and_(
                Vote.poll_id == poll_id,
                Vote.user_id == user_id
            )
        )
        existing_vote_result = await self.db.execute(existing_vote_query)
        existing_vote = existing_vote_result.scalar_one_or_none()
        
        if existing_vote:
            raise ValueError("이미 투표에 참여했습니다")

        # 4. 선택지 유효성 확인
        option_query = select(PollOption).where(
            and_(
                PollOption.id == vote_data.option_id,
                PollOption.poll_id == poll_id
            )
        )
        option_result = await self.db.execute(option_query)
        option = option_result.scalar_one_or_none()
        
        if not option:
            raise ValueError("유효하지 않은 선택지입니다")

        # 5. 익명성 보장을 위한 해시 생성
        anonymous_hash = hashlib.sha256(
            f"{poll_id}:{user_id}:{secrets.token_hex(16)}".encode()
        ).hexdigest()

        # 6. Vote 생성
        vote = Vote(
            poll_id=poll_id,
            option_id=vote_data.option_id,
            user_id=user_id,
            anonymous_hash=anonymous_hash
        )
        
        self.db.add(vote)

        # 7. 통계 업데이트
        # Option 투표 수 증가
        await self.db.execute(
            update(PollOption)
            .where(PollOption.id == vote_data.option_id)
            .values(vote_count=PollOption.vote_count + 1)
        )

        # Poll 총 투표 수 증가
        await self.db.execute(
            update(Poll)
            .where(Poll.id == poll_id)
            .values(
                total_votes=Poll.total_votes + 1,
                total_participants=Poll.total_participants + 1
            )
        )

        await self.db.commit()
        await self.db.refresh(vote)
        
        return vote

    async def get_poll_results(self, poll_id: str) -> Optional[dict]:
        """투표 결과 조회"""
        poll = await self.get_poll_by_id(poll_id)
        if not poll:
            return None

        # 결과 데이터 구성
        results = []
        for option in poll.options:
            percentage = 0.0
            if poll.total_votes > 0:
                percentage = round((option.vote_count / poll.total_votes) * 100, 1)
            
            results.append({
                "option_id": option.id,
                "member_nickname": option.member_nickname,
                "vote_count": option.vote_count,
                "percentage": percentage
            })

        # 투표 수 기준으로 정렬하고 순위 매기기
        results.sort(key=lambda x: x["vote_count"], reverse=True)
        for idx, result in enumerate(results):
            result["rank"] = idx + 1

        # 우승자 결정 (동률일 경우 None)
        winner = None
        if results and results[0]["vote_count"] > 0:
            # 1위가 동률이 아닌 경우만 우승자로 설정
            if len(results) == 1 or results[0]["vote_count"] > results[1]["vote_count"]:
                winner = results[0]

        return {
            "poll_id": poll.id,
            "question_text": poll.question_text,
            "total_votes": poll.total_votes,
            "total_participants": poll.total_participants,
            "is_closed": poll.is_closed or poll.deadline <= datetime.now(),
            "deadline": poll.deadline,
            "results": results,
            "winner": winner
        }

    async def close_poll(self, poll_id: str, user_id: int) -> bool:
        """투표 마감 (생성자만 가능)"""
        poll = await self.get_poll_by_id(poll_id)
        if not poll:
            return False
        
        if poll.creator_id != user_id:
            raise ValueError("투표 생성자만 마감할 수 있습니다")
        
        if poll.is_closed:
            raise ValueError("이미 마감된 투표입니다")

        await self.db.execute(
            update(Poll)
            .where(Poll.id == poll_id)
            .values(is_closed=True)
        )
        
        await self.db.commit()
        return True

    async def delete_poll(self, poll_id: str, user_id: int) -> bool:
        """투표 삭제 (생성자만, 생성 후 24시간 이내)"""
        poll = await self.get_poll_by_id(poll_id)
        if not poll:
            return False
        
        if poll.creator_id != user_id:
            raise ValueError("투표 생성자만 삭제할 수 있습니다")
        
        # 생성 후 24시간 이내만 삭제 가능
        if datetime.now() - poll.created_at > timedelta(hours=24):
            raise ValueError("투표 생성 후 24시간이 지나면 삭제할 수 없습니다")

        await self.db.execute(
            update(Poll)
            .where(Poll.id == poll_id)
            .values(is_active=False)
        )
        
        await self.db.commit()
        return True

    async def get_user_vote_for_poll(self, poll_id: str, user_id: int) -> Optional[Vote]:
        """사용자의 특정 투표 참여 내역 조회"""
        query = select(Vote).where(
            and_(
                Vote.poll_id == poll_id,
                Vote.user_id == user_id
            )
        )
        
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def check_circle_membership(self, circle_id: int, user_id: int) -> bool:
        """Circle 멤버십 확인"""
        query = select(CircleMember).where(
            and_(
                CircleMember.circle_id == circle_id,
                CircleMember.user_id == user_id,
            )
        )
        
        result = await self.db.execute(query)
        return result.scalar_one_or_none() is not None