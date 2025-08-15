from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List
from datetime import datetime
from app.database import get_db
from app.models.user import User
from app.models.circle import Circle, CircleMember
from app.models.poll import Poll, PollOption, Vote
from app.schemas.poll import PollCreate, PollUpdate, PollResponse, VoteCreate
from app.dependencies import get_current_active_user

router = APIRouter()

@router.post("/polls", response_model=PollResponse)
async def create_poll(
    poll_data: PollCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """투표 생성"""
    # Circle 멤버인지 확인
    result = await db.execute(
        select(CircleMember).where(
            CircleMember.circle_id == poll_data.circle_id,
            CircleMember.user_id == current_user.id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not a member of this circle")
    
    # Poll 생성
    poll = Poll(
        title=poll_data.title,
        description=poll_data.description,
        question_template=poll_data.question_template,
        circle_id=poll_data.circle_id,
        creator_id=current_user.id,
        expires_at=poll_data.expires_at,
        is_anonymous=poll_data.is_anonymous
    )
    db.add(poll)
    await db.commit()
    await db.refresh(poll)
    
    # 옵션 생성
    for idx, option_data in enumerate(poll_data.options):
        option = PollOption(
            poll_id=poll.id,
            text=option_data.text,
            user_id=option_data.user_id,
            order_index=idx
        )
        db.add(option)
    
    await db.commit()
    
    # 응답 데이터 구성
    return await get_poll_response(poll.id, current_user.id, db)

@router.get("/circles/{circle_id}/polls", response_model=List[PollResponse])
async def get_circle_polls(
    circle_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Circle의 투표 목록 조회"""
    # Circle 멤버인지 확인
    result = await db.execute(
        select(CircleMember).where(
            CircleMember.circle_id == circle_id,
            CircleMember.user_id == current_user.id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not a member of this circle")
    
    # 투표 목록 조회
    result = await db.execute(
        select(Poll).where(
            Poll.circle_id == circle_id,
            Poll.is_active == True
        ).order_by(Poll.created_at.desc())
    )
    polls = result.scalars().all()
    
    poll_responses = []
    for poll in polls:
        poll_response = await get_poll_response(poll.id, current_user.id, db)
        poll_responses.append(poll_response)
    
    return poll_responses

@router.get("/polls/{poll_id}", response_model=PollResponse)
async def get_poll(
    poll_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """투표 상세 조회"""
    # 투표 존재 확인
    result = await db.execute(select(Poll).where(Poll.id == poll_id))
    poll = result.scalar_one_or_none()
    
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    
    # Circle 멤버인지 확인
    result = await db.execute(
        select(CircleMember).where(
            CircleMember.circle_id == poll.circle_id,
            CircleMember.user_id == current_user.id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not a member of this circle")
    
    return await get_poll_response(poll_id, current_user.id, db)

@router.post("/polls/{poll_id}/vote")
async def vote_poll(
    poll_id: int,
    vote_data: VoteCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """투표 참여"""
    # 투표 존재 및 활성 상태 확인
    result = await db.execute(
        select(Poll).where(
            Poll.id == poll_id,
            Poll.is_active == True
        )
    )
    poll = result.scalar_one_or_none()
    
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found or inactive")
    
    # 만료 시간 확인
    if poll.expires_at and poll.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Poll has expired")
    
    # Circle 멤버인지 확인
    result = await db.execute(
        select(CircleMember).where(
            CircleMember.circle_id == poll.circle_id,
            CircleMember.user_id == current_user.id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not a member of this circle")
    
    # 옵션 존재 확인
    result = await db.execute(
        select(PollOption).where(
            PollOption.id == vote_data.option_id,
            PollOption.poll_id == poll_id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Option not found")
    
    # 이미 투표했는지 확인
    result = await db.execute(
        select(Vote).where(
            Vote.poll_id == poll_id,
            Vote.user_id == current_user.id
        )
    )
    existing_vote = result.scalar_one_or_none()
    
    if existing_vote:
        # 기존 투표 수정
        existing_vote.option_id = vote_data.option_id
        existing_vote.voted_at = datetime.utcnow()
    else:
        # 새 투표 생성
        vote = Vote(
            poll_id=poll_id,
            option_id=vote_data.option_id,
            user_id=current_user.id
        )
        db.add(vote)
    
    await db.commit()
    
    return {"message": "Vote recorded successfully"}

async def get_poll_response(poll_id: int, user_id: int, db: AsyncSession) -> PollResponse:
    """투표 응답 데이터 구성"""
    # 투표 정보 조회
    result = await db.execute(
        select(Poll).options(selectinload(Poll.options)).where(Poll.id == poll_id)
    )
    poll = result.scalar_one()
    
    # 각 옵션별 투표 수 조회
    vote_counts = {}
    for option in poll.options:
        result = await db.execute(
            select(func.count(Vote.id)).where(Vote.option_id == option.id)
        )
        vote_counts[option.id] = result.scalar() or 0
    
    # 사용자 투표 여부 확인
    result = await db.execute(
        select(Vote).where(Vote.poll_id == poll_id, Vote.user_id == user_id)
    )
    user_voted = result.scalar_one_or_none() is not None
    
    # 전체 투표 수
    result = await db.execute(
        select(func.count(Vote.id)).where(Vote.poll_id == poll_id)
    )
    total_votes = result.scalar() or 0
    
    # 옵션 데이터 구성
    options_data = []
    for option in poll.options:
        option_dict = option.__dict__.copy()
        option_dict['vote_count'] = vote_counts.get(option.id, 0)
        options_data.append(option_dict)
    
    # 응답 구성
    poll_dict = poll.__dict__.copy()
    poll_dict['options'] = options_data
    poll_dict['total_votes'] = total_votes
    poll_dict['user_voted'] = user_voted
    
    return PollResponse(**poll_dict)