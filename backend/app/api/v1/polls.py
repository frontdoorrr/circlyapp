from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.database import get_db
from app.models.user import User
from app.services.poll_service import PollService
from app.schemas.poll import (
    PollCreate, 
    PollUpdate, 
    PollResponse, 
    PollListResponse,
    VoteCreate, 
    VoteResponse,
    PollResultResponse,
    PollWithUserStatus
)
from app.dependencies import get_current_user

router = APIRouter(tags=["polls"])


@router.post("/", response_model=PollResponse)
async def create_poll(
    poll_data: PollCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """새 투표 생성 - 현재 개발용으로 모든 사용자 허용"""
    try:
        service = PollService(db)
        poll = await service.create_poll(poll_data, current_user.id)
        return PollResponse.model_validate(poll.to_dict())
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"🚀 [create_poll] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"투표 생성에 실패했습니다: {str(e)}")

@router.get("/", response_model=PollListResponse)
async def get_polls(
    circle_id: Optional[int] = Query(None, description="Circle ID 필터"),
    status: Optional[str] = Query(None, description="투표 상태 필터 (active, completed, expired)"),
    limit: int = Query(20, ge=1, le=100, description="조회할 투표 수"),
    offset: int = Query(0, ge=0, description="건너뛸 투표 수"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """투표 목록 조회"""
    print(f"🚀 [get_polls] Function called with params: circle_id={circle_id}, status={status}, limit={limit}, offset={offset}")
    print(f"👤 [get_polls] Current user: id={current_user.id if current_user else 'None'}, username={getattr(current_user, 'username', 'Unknown') if current_user else 'None'}")
    try:
        service = PollService(db)
        
        # Circle ID가 지정된 경우 멤버십 확인
        if circle_id:
            is_member = await service.check_circle_membership(circle_id, current_user.id)
            if not is_member:
                raise HTTPException(status_code=403, detail="Circle 멤버가 아닙니다")
        
        polls, total = await service.get_polls(
            circle_id=circle_id,
            user_id=current_user.id,
            status=status,
            limit=limit,
            offset=offset
        )
        
        poll_responses = []
        for poll in polls:
            poll_dict = poll.to_dict()
            
            # 사용자 투표 여부 확인
            user_vote = await service.get_user_vote_for_poll(poll.id, current_user.id)
            poll_dict['user_voted'] = user_vote is not None
            poll_dict['user_vote_option_id'] = user_vote.option_id if user_vote else None
            
            # 옵션 정보 포함
            poll_dict['options'] = [option.to_dict() for option in poll.options]
            
            poll_responses.append(PollWithUserStatus.model_validate(poll_dict))
        
        print(PollListResponse(
            polls=poll_responses,
            total=total,
            limit=limit,
            offset=offset
        ))
        return PollListResponse(
            polls=poll_responses,
            total=total,
            limit=limit,
            offset=offset
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"투표 목록 조회에 실패했습니다: {str(e)}")


@router.get("/{poll_id}", response_model=PollWithUserStatus)
async def get_poll_by_id(
    poll_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """특정 투표 상세 조회"""
    try:
        service = PollService(db)
        poll = await service.get_poll_by_id(poll_id)
        
        if not poll:
            raise HTTPException(status_code=404, detail="투표를 찾을 수 없습니다")
        
        # Circle 멤버십 확인
        is_member = await service.check_circle_membership(poll.circle_id, current_user.id)
        if not is_member:
            raise HTTPException(status_code=403, detail="Circle 멤버가 아닙니다")
        
        # 사용자 투표 여부 확인
        user_vote = await service.get_user_vote_for_poll(poll_id, current_user.id)
        
        poll_dict = poll.to_dict()
        poll_dict['user_voted'] = user_vote is not None
        poll_dict['user_vote_option_id'] = user_vote.option_id if user_vote else None
        poll_dict['options'] = [option.to_dict() for option in poll.options]
        
        return PollWithUserStatus.model_validate(poll_dict)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"투표 조회에 실패했습니다: {str(e)}")


@router.post("/{poll_id}/vote", response_model=VoteResponse)
async def vote_on_poll(
    poll_id: str,
    vote_data: VoteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """투표 참여"""
    try:
        service = PollService(db)
        vote = await service.vote_on_poll(poll_id, vote_data, current_user.id)
        return VoteResponse.model_validate(vote.to_dict())
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"🚀 [vote_on_poll] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"투표 참여에 실패했습니다: {str(e)}")


@router.get("/{poll_id}/results", response_model=PollResultResponse)
async def get_poll_results(
    poll_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """투표 결과 조회"""
    try:
        service = PollService(db)
        poll = await service.get_poll_by_id(poll_id)
        
        if not poll:
            raise HTTPException(status_code=404, detail="투표를 찾을 수 없습니다")
        
        # Circle 멤버십 확인
        is_member = await service.check_circle_membership(poll.circle_id, current_user.id)
        if not is_member:
            raise HTTPException(status_code=403, detail="Circle 멤버가 아닙니다")
        
        results = await service.get_poll_results(poll_id)
        if not results:
            raise HTTPException(status_code=404, detail="투표 결과를 찾을 수 없습니다")
        
        return PollResultResponse.model_validate(results)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"투표 결과 조회에 실패했습니다: {str(e)}")


@router.put("/{poll_id}", response_model=PollResponse)
async def update_poll(
    poll_id: str,
    update_data: PollUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """투표 정보 수정 - 관리자 전용"""
    # 사용자는 투표 수정 불가
    raise HTTPException(
        status_code=403, 
        detail="투표 수정은 관리자만 가능합니다."
    )


@router.delete("/{poll_id}")
async def delete_poll(
    poll_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """투표 삭제 - 관리자 전용"""
    # 사용자는 투표 삭제 불가
    raise HTTPException(
        status_code=403, 
        detail="투표 삭제는 관리자만 가능합니다."
    )


@router.post("/{poll_id}/close")
async def close_poll(
    poll_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """투표 마감 - 관리자 전용"""
    # 사용자는 투표 마감 불가
    raise HTTPException(
        status_code=403, 
        detail="투표 마감은 관리자만 가능합니다."
    )