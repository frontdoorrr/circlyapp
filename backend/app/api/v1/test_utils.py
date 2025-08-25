from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Dict, Any
from datetime import datetime, timedelta
import uuid

from app.database import get_db
from app.models.user import User
from app.models.circle import Circle, CircleMember
from app.models.poll import Poll, PollOption
from app.dependencies import get_current_user
# from app.services.poll_service import PollService  # 사용하지 않음

# HTTPBearer 보안 스키마 정의
security = HTTPBearer()

router = APIRouter(tags=["test-utils"])


@router.post("/test/create-polls")
async def create_test_polls(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    token: HTTPAuthorizationCredentials = Depends(security)
):
    """
    테스트용 투표 5개를 모든 Circle에 생성합니다.
    
    - 사용자가 속한 모든 Circle에 동일한 5개 투표를 생성
    - 각 Circle의 멤버들이 선택지로 자동 추가
    - 마감일: 7일 후
    - 익명 투표로 설정
    """
    
    try:
        # 현재 사용자가 속한 Circle들 조회
        circles_query = select(Circle).join(CircleMember).where(
            CircleMember.user_id == current_user.id,
            Circle.is_active == True
        )
        circles_result = await db.execute(circles_query)
        circles = circles_result.scalars().all()
        
        if not circles:
            raise HTTPException(status_code=400, detail="속한 Circle이 없습니다.")
        
        # 테스트 투표 템플릿
        test_polls_data = [
            {
                "question_text": "우리 Circle에서 가장 웃긴 사람은? 😂",
                "template_id": "funny_person"
            },
            {
                "question_text": "가장 스타일이 좋은 사람은? 👗",
                "template_id": "stylish_person"
            },
            {
                "question_text": "가장 친근한 사람은? 😊",
                "template_id": "friendly_person"
            },
            {
                "question_text": "가장 똑똑한 사람은? 🤓",
                "template_id": "smart_person"
            },
            {
                "question_text": "가장 운동을 잘하는 사람은? ⚽",
                "template_id": "athletic_person"
            }
        ]
        
        created_polls = []
        
        for circle in circles:
            circle_info = {
                "circle_id": circle.id,
                "circle_name": circle.name,
                "created_polls": []
            }
            
            # Circle 멤버 조회
            members_query = select(CircleMember).join(User).where(
                CircleMember.circle_id == circle.id
            )
            members_result = await db.execute(members_query)
            members = members_result.scalars().all()
            
            if len(members) < 2:
                circle_info["error"] = f"멤버가 {len(members)}명뿐입니다. 최소 2명 필요."
                created_polls.append(circle_info)
                continue
            
            # 각 테스트 투표 생성
            for poll_data in test_polls_data:
                # 중복 체크
                existing_poll_query = select(Poll).where(
                    Poll.circle_id == circle.id,
                    Poll.question_text == poll_data["question_text"]
                )
                existing_poll_result = await db.execute(existing_poll_query)
                existing_poll = existing_poll_result.scalar_one_or_none()
                
                if existing_poll:
                    circle_info["created_polls"].append({
                        "question": poll_data["question_text"],
                        "status": "already_exists",
                        "poll_id": str(existing_poll.id)
                    })
                    continue
                
                # 새 투표 생성
                poll = Poll(
                    id=str(uuid.uuid4()),
                    question_text=poll_data["question_text"],
                    circle_id=circle.id,
                    creator_id=current_user.id,
                    template_id=poll_data["template_id"],
                    deadline=datetime.utcnow() + timedelta(days=7),
                    is_anonymous=True,
                    max_votes_per_user=1,
                    is_active=True,
                    is_closed=False,
                    total_votes=0,
                    total_participants=0
                )
                
                db.add(poll)
                await db.flush()  # ID 확보
                
                # 투표 옵션 생성 (Circle 멤버들, 최대 4명)
                for idx, member in enumerate(members[:4]):
                    # User 정보 가져오기
                    user_query = select(User).where(User.id == member.user_id)
                    user_result = await db.execute(user_query)
                    user = user_result.scalar_one()
                    
                    option = PollOption(
                        id=str(uuid.uuid4()),
                        poll_id=poll.id,
                        member_id=user.id,
                        member_nickname=user.display_name or f"User {user.id}",
                        display_order=idx + 1,
                        vote_count=0
                    )
                    db.add(option)
                
                circle_info["created_polls"].append({
                    "question": poll_data["question_text"],
                    "status": "created",
                    "poll_id": str(poll.id),
                    "options_count": min(len(members), 4)
                })
            
            created_polls.append(circle_info)
        
        await db.commit()
        
        # 요약 통계
        total_created = sum(
            len([p for p in circle["created_polls"] if p.get("status") == "created"])
            for circle in created_polls
            if "created_polls" in circle
        )
        
        total_existing = sum(
            len([p for p in circle["created_polls"] if p.get("status") == "already_exists"])
            for circle in created_polls
            if "created_polls" in circle
        )
        
        return {
            "message": "테스트 투표 생성 완료!",
            "summary": {
                "circles_processed": len(circles),
                "polls_created": total_created,
                "polls_already_existed": total_existing,
                "deadline": (datetime.utcnow() + timedelta(days=7)).isoformat()
            },
            "details": created_polls
        }
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"테스트 투표 생성 중 오류: {str(e)}")


@router.delete("/test/cleanup-polls")
async def cleanup_test_polls(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    token: HTTPAuthorizationCredentials = Depends(security)
):
    """
    테스트 투표들을 삭제합니다.
    
    - 테스트용으로 생성된 5개 질문 패턴과 일치하는 투표들을 삭제
    - 현재 사용자가 속한 Circle의 투표만 삭제
    """
    
    try:
        # 테스트 투표 질문 패턴들
        test_question_patterns = [
            "우리 Circle에서 가장 웃긴 사람은?",
            "가장 스타일이 좋은 사람은?",
            "가장 친근한 사람은?",
            "가장 똑똑한 사람은?",
            "가장 운동을 잘하는 사람은?"
        ]
        
        deleted_polls = []
        
        # 현재 사용자가 속한 Circle들 조회
        circles_query = select(Circle).join(CircleMember).where(
            CircleMember.user_id == current_user.id,
            Circle.is_active == True
        )
        circles_result = await db.execute(circles_query)
        circles = circles_result.scalars().all()
        
        for circle in circles:
            circle_deleted = []
            
            for pattern in test_question_patterns:
                # 패턴과 일치하는 투표 찾기
                polls_query = select(Poll).where(
                    Poll.circle_id == circle.id,
                    Poll.question_text.contains(pattern.split("?")[0])  # 이모지 제외하고 검색
                )
                polls_result = await db.execute(polls_query)
                polls = polls_result.scalars().all()
                
                for poll in polls:
                    # 투표 옵션들 먼저 삭제
                    options_query = select(PollOption).where(PollOption.poll_id == poll.id)
                    options_result = await db.execute(options_query)
                    options = options_result.scalars().all()
                    
                    for option in options:
                        await db.delete(option)
                    
                    # 투표 삭제
                    poll_info = {
                        "poll_id": str(poll.id),
                        "question": poll.question_text,
                        "options_deleted": len(options)
                    }
                    
                    await db.delete(poll)
                    circle_deleted.append(poll_info)
            
            if circle_deleted:
                deleted_polls.append({
                    "circle_id": circle.id,
                    "circle_name": circle.name,
                    "deleted_polls": circle_deleted
                })
        
        await db.commit()
        
        total_deleted = sum(len(circle["deleted_polls"]) for circle in deleted_polls)
        
        return {
            "message": "테스트 투표 정리 완료!",
            "summary": {
                "circles_processed": len([c for c in deleted_polls if c["deleted_polls"]]),
                "polls_deleted": total_deleted
            },
            "details": deleted_polls
        }
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"테스트 투표 정리 중 오류: {str(e)}")


@router.get("/test/poll-status")
async def get_test_poll_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    token: HTTPAuthorizationCredentials = Depends(security)
):
    """
    현재 테스트 투표 상태를 확인합니다.
    
    - 사용자가 속한 각 Circle의 테스트 투표 현황
    - 총 투표 수, 활성 투표 수 등 통계
    """
    
    try:
        # 현재 사용자가 속한 Circle들과 투표 상태 조회
        circles_query = select(Circle).join(CircleMember).where(
            CircleMember.user_id == current_user.id,
            CircleMember.is_active == True,
            Circle.is_active == True
        )
        circles_result = await db.execute(circles_query)
        circles = circles_result.scalars().all()
        
        circles_status = []
        
        for circle in circles:
            # Circle의 모든 투표 조회
            polls_query = select(Poll).where(Poll.circle_id == circle.id)
            polls_result = await db.execute(polls_query)
            polls = polls_result.scalars().all()
            
            # 테스트 투표 패턴 확인
            test_polls = []
            test_question_keywords = ["웃긴", "스타일", "친근한", "똑똑한", "운동"]
            
            for poll in polls:
                is_test_poll = any(keyword in poll.question_text for keyword in test_question_keywords)
                if is_test_poll:
                    # 투표 옵션 수 확인
                    options_query = select(PollOption).where(PollOption.poll_id == poll.id)
                    options_result = await db.execute(options_query)
                    options_count = len(options_result.scalars().all())
                    
                    test_polls.append({
                        "poll_id": str(poll.id),
                        "question": poll.question_text,
                        "is_active": poll.is_active,
                        "is_closed": poll.is_closed,
                        "total_votes": poll.total_votes,
                        "options_count": options_count,
                        "deadline": poll.deadline.isoformat() if poll.deadline else None,
                        "created_at": poll.created_at.isoformat()
                    })
            
            circles_status.append({
                "circle_id": circle.id,
                "circle_name": circle.name,
                "total_polls": len(polls),
                "test_polls": test_polls,
                "test_polls_count": len(test_polls)
            })
        
        # 전체 통계
        total_polls = sum(circle["total_polls"] for circle in circles_status)
        total_test_polls = sum(circle["test_polls_count"] for circle in circles_status)
        
        return {
            "message": "테스트 투표 상태 조회 완료",
            "summary": {
                "circles_count": len(circles_status),
                "total_polls": total_polls,
                "total_test_polls": total_test_polls
            },
            "circles": circles_status
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"상태 조회 중 오류: {str(e)}")