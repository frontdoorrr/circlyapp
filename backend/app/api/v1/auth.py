from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse
from app.utils.security import create_access_token
from app.dependencies import get_current_active_user

router = APIRouter()

class LoginRequest(BaseModel):
    device_id: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

@router.post("/auth/login", response_model=LoginResponse)
async def login_device(
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """디바이스 기반 로그인"""
    # 기존 사용자 확인
    result = await db.execute(select(User).where(User.device_id == login_data.device_id))
    user = result.scalar_one_or_none()
    
    # 사용자가 없으면 새로 생성
    if not user:
        user = User(device_id=login_data.device_id)
        db.add(user)
        await db.commit()
        await db.refresh(user)
    
    # JWT 토큰 생성
    access_token = create_access_token(data={"user_id": user.id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(user)
    }

@router.post("/auth/logout")
async def logout():
    """로그아웃 (클라이언트에서 토큰 삭제)"""
    return {"message": "Successfully logged out"}

@router.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    """현재 사용자 정보 조회"""
    return UserResponse.from_orm(current_user)