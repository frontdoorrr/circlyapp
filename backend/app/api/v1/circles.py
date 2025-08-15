from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List
import secrets
import string
from app.database import get_db
from app.models.user import User
from app.models.circle import Circle, CircleMember
from app.schemas.circle import CircleCreate, CircleUpdate, CircleResponse, CircleJoinRequest, CircleMember as CircleMemberSchema
from app.dependencies import get_current_active_user

router = APIRouter()

def generate_invite_code() -> str:
    """초대 코드 생성"""
    return ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))

@router.post("/circles", response_model=CircleResponse)
async def create_circle(
    circle_data: CircleCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Circle 생성"""
    # 고유한 초대 코드 생성
    invite_code = generate_invite_code()
    while True:
        result = await db.execute(select(Circle).where(Circle.invite_code == invite_code))
        if not result.scalar_one_or_none():
            break
        invite_code = generate_invite_code()
    
    # Circle 생성
    circle = Circle(
        name=circle_data.name,
        description=circle_data.description,
        invite_code=invite_code,
        creator_id=current_user.id
    )
    db.add(circle)
    await db.commit()
    await db.refresh(circle)
    
    # 생성자를 admin으로 멤버에 추가
    member = CircleMember(
        circle_id=circle.id,
        user_id=current_user.id,
        role="admin"
    )
    db.add(member)
    await db.commit()
    
    return CircleResponse.from_orm(circle)

@router.get("/circles", response_model=List[CircleResponse])
async def get_my_circles(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """내가 속한 Circle 목록 조회"""
    result = await db.execute(
        select(Circle)
        .join(CircleMember)
        .where(
            CircleMember.user_id == current_user.id,
            Circle.is_active == True
        )
        .options(selectinload(Circle.members))
    )
    circles = result.scalars().all()
    
    # 멤버 수 추가
    circle_responses = []
    for circle in circles:
        circle_dict = circle.__dict__.copy()
        circle_dict['member_count'] = len(circle.members)
        circle_responses.append(CircleResponse(**circle_dict))
    
    return circle_responses

@router.get("/circles/{circle_id}", response_model=CircleResponse)
async def get_circle(
    circle_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Circle 상세 조회"""
    # 사용자가 해당 Circle의 멤버인지 확인
    result = await db.execute(
        select(Circle)
        .join(CircleMember)
        .where(
            Circle.id == circle_id,
            CircleMember.user_id == current_user.id,
            Circle.is_active == True
        )
        .options(selectinload(Circle.members))
    )
    circle = result.scalar_one_or_none()
    
    if not circle:
        raise HTTPException(status_code=404, detail="Circle not found or not a member")
    
    circle_dict = circle.__dict__.copy()
    circle_dict['member_count'] = len(circle.members)
    return CircleResponse(**circle_dict)

@router.post("/circles/join", response_model=CircleResponse)
async def join_circle(
    join_request: CircleJoinRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Circle 참여"""
    # 초대 코드로 Circle 찾기
    result = await db.execute(
        select(Circle).where(
            Circle.invite_code == join_request.invite_code,
            Circle.is_active == True
        )
    )
    circle = result.scalar_one_or_none()
    
    if not circle:
        raise HTTPException(status_code=404, detail="Invalid invite code")
    
    # 이미 멤버인지 확인
    result = await db.execute(
        select(CircleMember).where(
            CircleMember.circle_id == circle.id,
            CircleMember.user_id == current_user.id
        )
    )
    existing_member = result.scalar_one_or_none()
    
    if existing_member:
        raise HTTPException(status_code=400, detail="Already a member of this circle")
    
    # 멤버로 추가
    member = CircleMember(
        circle_id=circle.id,
        user_id=current_user.id,
        role="member"
    )
    db.add(member)
    await db.commit()
    
    return CircleResponse.from_orm(circle)

@router.get("/circles/{circle_id}/members", response_model=List[CircleMemberSchema])
async def get_circle_members(
    circle_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Circle 멤버 목록 조회"""
    # 사용자가 해당 Circle의 멤버인지 확인
    result = await db.execute(
        select(CircleMember).where(
            CircleMember.circle_id == circle_id,
            CircleMember.user_id == current_user.id
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Circle not found or not a member")
    
    # 멤버 목록 조회
    result = await db.execute(
        select(CircleMember)
        .options(selectinload(CircleMember.user))
        .where(CircleMember.circle_id == circle_id)
    )
    members = result.scalars().all()
    
    return [CircleMemberSchema.from_orm(member) for member in members]