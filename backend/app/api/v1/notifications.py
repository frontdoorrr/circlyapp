from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.notification import PushToken, NotificationSetting, NotificationLog
from app.schemas.notification import (
    PushTokenCreate, 
    PushTokenResponse,
    NotificationSettingsUpdate,
    NotificationSettingsResponse,
    NotificationLogResponse
)

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.post("/push-tokens", response_model=PushTokenResponse)
async def register_push_token(
    token_data: PushTokenCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """푸시 토큰 등록/갱신"""
    try:
        # 기존 토큰 확인
        existing_token_query = select(PushToken).where(
            PushToken.user_id == current_user.id
        )
        existing_result = await db.execute(existing_token_query)
        existing_token = existing_result.scalar_one_or_none()
        
        if existing_token:
            # 토큰 업데이트
            existing_token.expo_token = token_data.expo_token
            existing_token.device_id = token_data.device_id
            existing_token.platform = token_data.platform
            existing_token.is_active = True
            db.add(existing_token)
        else:
            # 새 토큰 생성
            new_token = PushToken(
                user_id=current_user.id,
                expo_token=token_data.expo_token,
                device_id=token_data.device_id,
                platform=token_data.platform
            )
            db.add(new_token)
            existing_token = new_token
        
        await db.commit()
        await db.refresh(existing_token)
        
        return existing_token
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to register push token: {str(e)}"
        )

@router.get("/settings", response_model=NotificationSettingsResponse)
async def get_notification_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """사용자 알림 설정 조회"""
    settings_query = select(NotificationSetting).where(
        NotificationSetting.user_id == current_user.id
    )
    result = await db.execute(settings_query)
    settings = result.scalar_one_or_none()
    
    if not settings:
        # 기본 설정 생성
        settings = NotificationSetting(user_id=current_user.id)
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    
    return settings

@router.put("/settings", response_model=NotificationSettingsResponse)
async def update_notification_settings(
    settings_update: NotificationSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """사용자 알림 설정 업데이트"""
    try:
        settings_query = select(NotificationSetting).where(
            NotificationSetting.user_id == current_user.id
        )
        result = await db.execute(settings_query)
        settings = result.scalar_one_or_none()
        
        if not settings:
            # 새로운 설정 생성
            settings = NotificationSetting(user_id=current_user.id)
            db.add(settings)
        
        # 필드별 업데이트
        update_data = settings_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(settings, field, value)
        
        await db.commit()
        await db.refresh(settings)
        
        return settings
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update notification settings: {str(e)}"
        )

@router.get("/logs", response_model=List[NotificationLogResponse])
async def get_notification_history(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """알림 발송 내역 조회 (최근 20개)"""
    logs_query = select(NotificationLog).where(
        NotificationLog.user_id == current_user.id
    ).order_by(
        NotificationLog.created_at.desc()
    ).limit(limit)
    
    result = await db.execute(logs_query)
    logs = result.scalars().all()
    
    return logs