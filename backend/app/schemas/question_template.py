from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class QuestionTemplateBase(BaseModel):
    category: str = Field(..., description="템플릿 카테고리 (외모, 성격, 재능, 특별한날)")
    question_text: str = Field(..., min_length=5, max_length=200, description="질문 텍스트")


class QuestionTemplateCreate(QuestionTemplateBase):
    pass


class QuestionTemplateUpdate(BaseModel):
    category: Optional[str] = None
    question_text: Optional[str] = None
    is_active: Optional[bool] = None


class QuestionTemplateResponse(QuestionTemplateBase):
    id: str
    is_active: bool
    created_at: datetime
    usage_count: int
    is_popular: bool

    class Config:
        from_attributes = True


class QuestionTemplateList(BaseModel):
    templates: list[QuestionTemplateResponse]
    total: int
    limit: int
    offset: int


class PopularTemplateResponse(QuestionTemplateResponse):
    rank: int