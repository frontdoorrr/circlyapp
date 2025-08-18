from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.database import get_db
from app.services.question_template_service import QuestionTemplateService
from app.schemas.question_template import (
    QuestionTemplateResponse, 
    QuestionTemplateList,
    PopularTemplateResponse
)
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/templates", tags=["templates"])


@router.get("/", response_model=QuestionTemplateList)
async def get_templates(
    category: Optional[str] = Query(None, description="카테고리 필터 (외모, 성격, 재능, 특별한날)"),
    popular: Optional[bool] = Query(None, description="인기 템플릿만 조회"),
    limit: int = Query(20, ge=1, le=100, description="조회할 템플릿 수"),
    offset: int = Query(0, ge=0, description="건너뛸 템플릿 수"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """질문 템플릿 목록 조회"""
    try:
        service = QuestionTemplateService(db)
        templates, total = await service.get_templates(
            category=category,
            popular=popular,
            limit=limit,
            offset=offset
        )
        
        return QuestionTemplateList(
            templates=[QuestionTemplateResponse.model_validate(template.to_dict()) for template in templates],
            total=total,
            limit=limit,
            offset=offset
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"템플릿 목록 조회에 실패했습니다: {str(e)}"
        )


@router.get("/popular", response_model=list[PopularTemplateResponse])
async def get_popular_templates(
    limit: int = Query(10, ge=1, le=20, description="조회할 인기 템플릿 수"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """인기 질문 템플릿 조회"""
    try:
        service = QuestionTemplateService(db)
        templates = await service.get_popular_templates(limit=limit)
        
        popular_templates = []
        for idx, template in enumerate(templates):
            template_dict = template.to_dict()
            template_dict['rank'] = idx + 1
            popular_templates.append(PopularTemplateResponse.model_validate(template_dict))
        
        return popular_templates
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"인기 템플릿 조회에 실패했습니다: {str(e)}"
        )


@router.get("/categories", response_model=list[str])
async def get_template_categories(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """사용 가능한 템플릿 카테고리 목록 조회"""
    try:
        service = QuestionTemplateService(db)
        categories = await service.get_categories()
        return categories
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"카테고리 목록 조회에 실패했습니다: {str(e)}"
        )


@router.get("/{template_id}", response_model=QuestionTemplateResponse)
async def get_template_by_id(
    template_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """특정 템플릿 상세 조회"""
    try:
        service = QuestionTemplateService(db)
        template = await service.get_template_by_id(template_id)
        
        if not template:
            raise HTTPException(
                status_code=404,
                detail="템플릿을 찾을 수 없습니다"
            )
        
        return QuestionTemplateResponse.model_validate(template.to_dict())
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"템플릿 조회에 실패했습니다: {str(e)}"
        )


@router.post("/initialize", response_model=dict)
async def initialize_default_templates(
    db: AsyncSession = Depends(get_db)
):
    """기본 템플릿 데이터 초기화 (개발용)"""
    try:
        service = QuestionTemplateService(db)
        success = await service.initialize_default_templates()
        
        if success:
            return {"message": "기본 템플릿 데이터가 성공적으로 초기화되었습니다"}
        else:
            raise HTTPException(
                status_code=500,
                detail="템플릿 초기화에 실패했습니다"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"템플릿 초기화에 실패했습니다: {str(e)}"
        )