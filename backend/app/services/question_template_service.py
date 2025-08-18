from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from typing import List, Optional
from app.models.question_template import QuestionTemplate
from app.schemas.question_template import QuestionTemplateCreate, QuestionTemplateUpdate


class QuestionTemplateService:
    def __init__(self, db_session: AsyncSession):
        self.db = db_session

    async def get_templates(
        self,
        category: Optional[str] = None,
        popular: Optional[bool] = None,
        limit: int = 20,
        offset: int = 0
    ) -> tuple[List[QuestionTemplate], int]:
        """템플릿 목록 조회"""
        query = select(QuestionTemplate).where(QuestionTemplate.is_active == True)
        
        if category:
            query = query.where(QuestionTemplate.category == category)
        
        if popular:
            query = query.where(QuestionTemplate.usage_count > 50)
        
        # 전체 개수 조회
        count_query = select(func.count(QuestionTemplate.id)).where(QuestionTemplate.is_active == True)
        if category:
            count_query = count_query.where(QuestionTemplate.category == category)
        if popular:
            count_query = count_query.where(QuestionTemplate.usage_count > 50)
        
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()
        
        # 데이터 조회 (사용량 순, 생성 시간 순, ID 순으로 정렬하여 일관성 보장)
        query = query.order_by(
            QuestionTemplate.usage_count.desc(), 
            QuestionTemplate.created_at.desc(),
            QuestionTemplate.id.asc()  # ID로 최종 정렬하여 일관성 보장
        )
        query = query.limit(limit).offset(offset)
        
        result = await self.db.execute(query)
        templates = result.scalars().all()
        
        return list(templates), total

    async def get_template_by_id(self, template_id: str) -> Optional[QuestionTemplate]:
        """특정 템플릿 조회"""
        query = select(QuestionTemplate).where(
            and_(
                QuestionTemplate.id == template_id,
                QuestionTemplate.is_active == True
            )
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_popular_templates(self, limit: int = 10) -> List[QuestionTemplate]:
        """인기 템플릿 조회"""
        query = select(QuestionTemplate).where(
            QuestionTemplate.is_active == True
        ).order_by(
            QuestionTemplate.usage_count.desc()
        ).limit(limit)
        
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_categories(self) -> List[str]:
        """사용 가능한 카테고리 목록 조회"""
        query = select(QuestionTemplate.category).where(
            QuestionTemplate.is_active == True
        ).distinct()
        
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def increment_usage_count(self, template_id: str) -> bool:
        """템플릿 사용 횟수 증가 (투표 생성 시 호출)"""
        template = await self.get_template_by_id(template_id)
        if not template:
            return False
        
        template.usage_count += 1
        await self.db.commit()
        return True

    async def create_template(self, template_data: QuestionTemplateCreate) -> QuestionTemplate:
        """새 템플릿 생성 (관리자용)"""
        template = QuestionTemplate(
            category=template_data.category,
            question_text=template_data.question_text
        )
        self.db.add(template)
        await self.db.commit()
        await self.db.refresh(template)
        return template

    async def update_template(
        self, 
        template_id: str, 
        update_data: QuestionTemplateUpdate
    ) -> Optional[QuestionTemplate]:
        """템플릿 업데이트 (관리자용)"""
        template = await self.get_template_by_id(template_id)
        if not template:
            return None
        
        update_dict = update_data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(template, field, value)
        
        await self.db.commit()
        await self.db.refresh(template)
        return template

    async def initialize_default_templates(self) -> bool:
        """기본 템플릿 데이터 초기화"""
        default_templates = [
            {"category": "외모", "question_text": "가장 잘생긴/예쁜 사람은?"},
            {"category": "외모", "question_text": "오늘 패션이 가장 멋진 사람은?"},
            {"category": "외모", "question_text": "미소가 가장 예쁜 사람은?"},
            {"category": "외모", "question_text": "가장 스타일이 좋은 사람은?"},
            {"category": "외모", "question_text": "가장 매력적인 사람은?"},
            
            {"category": "성격", "question_text": "가장 친절한 사람은?"},
            {"category": "성격", "question_text": "가장 재밌는 사람은?"},
            {"category": "성격", "question_text": "가장 든든한 사람은?"},
            {"category": "성격", "question_text": "가장 유머감각이 좋은 사람은?"},
            {"category": "성격", "question_text": "가장 배려심이 깊은 사람은?"},
            {"category": "성격", "question_text": "가장 긍정적인 사람은?"},
            
            {"category": "재능", "question_text": "가장 똑똑한 사람은?"},
            {"category": "재능", "question_text": "운동을 가장 잘하는 사람은?"},
            {"category": "재능", "question_text": "노래를 가장 잘하는 사람은?"},
            {"category": "재능", "question_text": "춤을 가장 잘 추는 사람은?"},
            {"category": "재능", "question_text": "그림을 가장 잘 그리는 사람은?"},
            {"category": "재능", "question_text": "요리를 가장 잘하는 사람은?"},
            
            {"category": "특별한날", "question_text": "오늘 기분이 가장 좋아 보이는 사람은?"},
            {"category": "특별한날", "question_text": "가장 열심히 공부하는 사람은?"},
            {"category": "특별한날", "question_text": "오늘 가장 행복해 보이는 사람은?"},
            {"category": "특별한날", "question_text": "가장 에너지가 넘치는 사람은?"},
        ]
        
        try:
            # 기존 템플릿이 있는지 확인
            existing_count_query = select(func.count(QuestionTemplate.id))
            result = await self.db.execute(existing_count_query)
            existing_count = result.scalar()
            
            if existing_count > 0:
                return True  # 이미 데이터가 있으면 스킵
            
            # 기본 템플릿 데이터 삽입
            for template_data in default_templates:
                template = QuestionTemplate(**template_data)
                self.db.add(template)
            
            await self.db.commit()
            return True
            
        except Exception as e:
            await self.db.rollback()
            print(f"Error initializing templates: {e}")
            return False