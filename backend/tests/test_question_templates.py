import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.main import app
from app.models.question_template import QuestionTemplate
from app.services.question_template_service import QuestionTemplateService
from tests.conftest import create_test_user, get_auth_headers


class TestQuestionTemplateService:
    """질문 템플릿 서비스 단위 테스트"""
    
    @pytest.mark.asyncio
    async def test_initialize_default_templates(self, db_session: AsyncSession):
        """기본 템플릿 초기화 테스트"""
        service = QuestionTemplateService(db_session)
        
        # 기본 템플릿 초기화
        success = await service.initialize_default_templates()
        assert success is True
        
        # 템플릿이 생성되었는지 확인
        templates, total = await service.get_templates()
        assert total > 0
        assert len(templates) > 0
        
        # 카테고리별로 템플릿이 있는지 확인
        categories = ["외모", "성격", "재능", "특별한날"]
        for category in categories:
            category_templates, count = await service.get_templates(category=category)
            assert count > 0
    
    @pytest.mark.asyncio
    async def test_get_templates_with_filters(self, db_session: AsyncSession):
        """필터링 조건으로 템플릿 조회 테스트"""
        service = QuestionTemplateService(db_session)
        
        # 기본 템플릿 초기화
        await service.initialize_default_templates()
        
        # 카테고리별 필터링
        templates, total = await service.get_templates(category="성격")
        assert total > 0
        for template in templates:
            assert template.category == "성격"
        
        # 페이지네이션 테스트
        templates_page1, total = await service.get_templates(limit=5, offset=0)
        templates_page2, _ = await service.get_templates(limit=5, offset=5)
        
        assert len(templates_page1) <= 5
        assert len(templates_page2) <= 5
        
        # 충분한 데이터가 있는 경우만 중복 체크
        if total > 10:  # 총 템플릿이 10개 이상일 때만 검증
            ids_page1 = {t.id for t in templates_page1}
            ids_page2 = {t.id for t in templates_page2}
            assert len(ids_page1.intersection(ids_page2)) == 0
    
    @pytest.mark.asyncio
    async def test_get_template_by_id(self, db_session: AsyncSession):
        """특정 템플릿 조회 테스트"""
        service = QuestionTemplateService(db_session)
        
        # 기본 템플릿 초기화
        await service.initialize_default_templates()
        
        # 템플릿 목록에서 하나 선택
        templates, _ = await service.get_templates(limit=1)
        assert len(templates) > 0
        
        template_id = templates[0].id
        
        # 특정 템플릿 조회
        template = await service.get_template_by_id(template_id)
        assert template is not None
        assert template.id == template_id
        
        # 존재하지 않는 템플릿 조회
        nonexistent_template = await service.get_template_by_id("nonexistent-id")
        assert nonexistent_template is None
    
    @pytest.mark.asyncio
    async def test_increment_usage_count(self, db_session: AsyncSession):
        """사용 횟수 증가 테스트"""
        service = QuestionTemplateService(db_session)
        
        # 기본 템플릿 초기화
        await service.initialize_default_templates()
        
        # 템플릿 선택
        templates, _ = await service.get_templates(limit=1)
        template = templates[0]
        original_count = template.usage_count
        
        # 사용 횟수 증가
        success = await service.increment_usage_count(template.id)
        assert success is True
        
        # 증가 확인
        updated_template = await service.get_template_by_id(template.id)
        assert updated_template.usage_count == original_count + 1
    
    @pytest.mark.asyncio
    async def test_get_popular_templates(self, db_session: AsyncSession):
        """인기 템플릿 조회 테스트"""
        service = QuestionTemplateService(db_session)
        
        # 기본 템플릿 초기화
        await service.initialize_default_templates()
        
        # 일부 템플릿의 사용 횟수 증가
        templates, _ = await service.get_templates(limit=3)
        for i, template in enumerate(templates):
            # 사용 횟수를 다르게 설정
            for _ in range((i + 1) * 20):
                await service.increment_usage_count(template.id)
        
        # 인기 템플릿 조회
        popular_templates = await service.get_popular_templates(limit=5)
        assert len(popular_templates) <= 5
        
        # 사용 횟수 순으로 정렬되어 있는지 확인
        for i in range(len(popular_templates) - 1):
            assert popular_templates[i].usage_count >= popular_templates[i + 1].usage_count
    
    @pytest.mark.asyncio
    async def test_get_categories(self, db_session: AsyncSession):
        """카테고리 목록 조회 테스트"""
        service = QuestionTemplateService(db_session)
        
        # 기본 템플릿 초기화
        await service.initialize_default_templates()
        
        # 카테고리 목록 조회
        categories = await service.get_categories()
        
        expected_categories = ["외모", "성격", "재능", "특별한날"]
        for category in expected_categories:
            assert category in categories


class TestQuestionTemplateAPI:
    """질문 템플릿 API 통합 테스트"""
    
    @pytest.mark.asyncio
    async def test_get_templates_unauthorized(self, client: AsyncClient):
        """인증 없이 템플릿 조회 시도 테스트"""
        response = await client.get("/v1/templates/")
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_initialize_default_templates(self, client: AsyncClient):
        """기본 템플릿 초기화 API 테스트"""
        response = await client.post("/v1/templates/initialize")
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
    
    @pytest.mark.asyncio
    async def test_get_templates_success(self, client: AsyncClient, db_session: AsyncSession):
        """템플릿 목록 조회 성공 테스트"""
        # 사용자 생성 및 인증
        user = await create_test_user(db_session)
        headers = await get_auth_headers(user.device_id)
        
        # 기본 템플릿 초기화
        await client.post("/v1/templates/initialize")
        
        # 템플릿 목록 조회
        response = await client.get("/v1/templates/", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "templates" in data
        assert "total" in data
        assert "limit" in data
        assert "offset" in data
        assert data["total"] > 0
        assert len(data["templates"]) > 0
        
        # 템플릿 구조 확인
        template = data["templates"][0]
        required_fields = ["id", "category", "question_text", "is_active", "created_at", "usage_count", "is_popular"]
        for field in required_fields:
            assert field in template
    
    @pytest.mark.asyncio
    async def test_get_templates_with_category_filter(self, client: AsyncClient, db_session: AsyncSession):
        """카테고리 필터로 템플릿 조회 테스트"""
        user = await create_test_user(db_session)
        headers = await get_auth_headers(user.device_id)
        
        # 기본 템플릿 초기화
        await client.post("/v1/templates/initialize")
        
        # 카테고리 필터 적용
        response = await client.get("/v1/templates/?category=성격", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["total"] > 0
        
        # 모든 템플릿이 해당 카테고리인지 확인
        for template in data["templates"]:
            assert template["category"] == "성격"
    
    @pytest.mark.asyncio
    async def test_get_templates_with_pagination(self, client: AsyncClient, db_session: AsyncSession):
        """페이지네이션 테스트"""
        user = await create_test_user(db_session)
        headers = await get_auth_headers(user.device_id)
        
        # 기본 템플릿 초기화
        await client.post("/v1/templates/initialize")
        
        # 첫 번째 페이지
        response1 = await client.get("/v1/templates/?limit=5&offset=0", headers=headers)
        assert response1.status_code == 200
        data1 = response1.json()
        
        # 두 번째 페이지
        response2 = await client.get("/v1/templates/?limit=5&offset=5", headers=headers)
        assert response2.status_code == 200
        data2 = response2.json()
        
        # 같은 총 개수여야 함
        assert data1["total"] == data2["total"]
        
        # 충분한 데이터가 있는 경우만 중복 체크
        if data1["total"] > 10:
            ids1 = {t["id"] for t in data1["templates"]}
            ids2 = {t["id"] for t in data2["templates"]}
            assert len(ids1.intersection(ids2)) == 0
    
    @pytest.mark.asyncio
    async def test_get_popular_templates(self, client: AsyncClient, db_session: AsyncSession):
        """인기 템플릿 조회 API 테스트"""
        user = await create_test_user(db_session)
        headers = await get_auth_headers(user.device_id)
        
        # 기본 템플릿 초기화
        await client.post("/v1/templates/initialize")
        
        # 인기 템플릿 조회
        response = await client.get("/v1/templates/popular", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # 랭킹 확인
        for i, template in enumerate(data):
            assert template["rank"] == i + 1
            assert "usage_count" in template
    
    @pytest.mark.asyncio
    async def test_get_template_categories(self, client: AsyncClient, db_session: AsyncSession):
        """카테고리 목록 조회 API 테스트"""
        user = await create_test_user(db_session)
        headers = await get_auth_headers(user.device_id)
        
        # 기본 템플릿 초기화
        await client.post("/v1/templates/initialize")
        
        # 카테고리 목록 조회
        response = await client.get("/v1/templates/categories", headers=headers)
        assert response.status_code == 200
        
        categories = response.json()
        assert isinstance(categories, list)
        assert len(categories) > 0
        
        expected_categories = ["외모", "성격", "재능", "특별한날"]
        for expected in expected_categories:
            assert expected in categories
    
    @pytest.mark.asyncio
    async def test_get_template_by_id(self, client: AsyncClient, db_session: AsyncSession):
        """특정 템플릿 조회 API 테스트"""
        user = await create_test_user(db_session)
        headers = await get_auth_headers(user.device_id)
        
        # 기본 템플릿 초기화
        await client.post("/v1/templates/initialize")
        
        # 템플릿 목록에서 ID 가져오기
        response = await client.get("/v1/templates/?limit=1", headers=headers)
        templates = response.json()["templates"]
        template_id = templates[0]["id"]
        
        # 특정 템플릿 조회
        response = await client.get(f"/v1/templates/{template_id}", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == template_id
        assert "category" in data
        assert "question_text" in data
    
    @pytest.mark.asyncio
    async def test_get_nonexistent_template(self, client: AsyncClient, db_session: AsyncSession):
        """존재하지 않는 템플릿 조회 테스트"""
        user = await create_test_user(db_session)
        headers = await get_auth_headers(user.device_id)
        
        # 존재하지 않는 템플릿 ID로 조회
        response = await client.get("/v1/templates/nonexistent-id", headers=headers)
        assert response.status_code == 404
        
        data = response.json()
        assert "detail" in data


class TestQuestionTemplateModel:
    """질문 템플릿 모델 테스트"""
    
    def test_template_to_dict(self):
        """템플릿 to_dict 메서드 테스트"""
        template = QuestionTemplate(
            id="test-id",
            category="성격",
            question_text="가장 친절한 사람은?",
            usage_count=100
        )
        
        data = template.to_dict()
        
        required_fields = ["id", "category", "question_text", "is_active", "created_at", "usage_count", "is_popular"]
        for field in required_fields:
            assert field in data
        
        assert data["id"] == "test-id"
        assert data["category"] == "성격"
        assert data["question_text"] == "가장 친절한 사람은?"
        assert data["usage_count"] == 100
        assert data["is_popular"] is True  # usage_count > 50
    
    def test_template_popularity_threshold(self):
        """인기 템플릿 기준 테스트"""
        # 인기 템플릿 (사용 횟수 > 50)
        popular_template = QuestionTemplate(
            category="성격",
            question_text="인기 질문",
            usage_count=100
        )
        assert popular_template.to_dict()["is_popular"] is True
        
        # 일반 템플릿 (사용 횟수 <= 50)
        normal_template = QuestionTemplate(
            category="성격", 
            question_text="일반 질문",
            usage_count=30
        )
        assert normal_template.to_dict()["is_popular"] is False


# 성능 테스트
class TestQuestionTemplatePerformance:
    """질문 템플릿 시스템 성능 테스트"""
    
    @pytest.mark.asyncio
    async def test_large_template_query_performance(self, db_session: AsyncSession):
        """대량의 템플릿 조회 성능 테스트"""
        import time
        
        service = QuestionTemplateService(db_session)
        await service.initialize_default_templates()
        
        # 성능 측정
        start_time = time.time()
        templates, total = await service.get_templates(limit=100)
        end_time = time.time()
        
        query_time = end_time - start_time
        
        # 100개 템플릿 조회가 1초 이내에 완료되어야 함
        assert query_time < 1.0
        assert len(templates) <= 100
    
    @pytest.mark.asyncio
    async def test_concurrent_usage_count_increment(self, db_session: AsyncSession):
        """동시성 사용 횟수 증가 테스트"""
        import asyncio
        
        service = QuestionTemplateService(db_session)
        await service.initialize_default_templates()
        
        # 템플릿 선택
        templates, _ = await service.get_templates(limit=1)
        template_id = templates[0].id
        original_count = templates[0].usage_count
        
        # 동시에 여러 번 사용 횟수 증가
        increment_count = 10
        tasks = [
            service.increment_usage_count(template_id) 
            for _ in range(increment_count)
        ]
        
        results = await asyncio.gather(*tasks)
        
        # 모든 작업이 성공해야 함
        assert all(results)
        
        # 최종 사용 횟수 확인
        updated_template = await service.get_template_by_id(template_id)
        assert updated_template.usage_count == original_count + increment_count