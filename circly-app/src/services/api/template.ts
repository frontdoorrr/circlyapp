/**
 * 질문 템플릿 API 서비스
 * TRD 05-api-specification.md의 템플릿 API 구현
 */

import { apiClient } from './client';
import type {
  QuestionTemplate,
  TemplateListResponse,
  PopularTemplatesResponse,
  GetTemplatesParams,
  TemplateCategory
} from '../../types/template';

class TemplateAPI {
  /**
   * 질문 템플릿 목록 조회
   * GET /templates?category=외모|성격|재능|특별한날&popular=true&limit=20&offset=0
   */
  async getTemplates(params: GetTemplatesParams = {}): Promise<TemplateListResponse> {
    const { category, popular, limit = 20, offset = 0 } = params;
    
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });
    
    if (category) {
      queryParams.append('category', category);
    }
    
    if (popular !== undefined) {
      queryParams.append('popular', popular.toString());
    }

    const response = await apiClient.get(`/templates?${queryParams.toString()}`);
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch templates');
    }
  }

  /**
   * 특정 템플릿 상세 조회
   * GET /templates/{template_id}
   */
  async getTemplateById(templateId: string): Promise<QuestionTemplate> {
    const response = await apiClient.get(`/templates/${templateId}`);
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch template');
    }
  }

  /**
   * 인기 질문 템플릿 조회
   * GET /templates/popular?limit=10
   */
  async getPopularTemplates(limit: number = 10): Promise<PopularTemplatesResponse> {
    const response = await apiClient.get(`/templates/popular?limit=${limit}`);
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch popular templates');
    }
  }

  /**
   * 카테고리별 템플릿 조회
   */
  async getTemplatesByCategory(category: TemplateCategory, limit: number = 20, offset: number = 0): Promise<TemplateListResponse> {
    return this.getTemplates({ category, limit, offset });
  }

  /**
   * 인기 템플릿만 조회
   */
  async getPopularTemplatesOnly(limit: number = 20, offset: number = 0): Promise<TemplateListResponse> {
    return this.getTemplates({ popular: true, limit, offset });
  }

  /**
   * 템플릿 검색 (프론트엔드에서 필터링)
   */
  async searchTemplates(query: string, category?: TemplateCategory): Promise<QuestionTemplate[]> {
    const params: GetTemplatesParams = { limit: 100 }; // 검색을 위해 많은 데이터 가져오기
    if (category) {
      params.category = category;
    }

    const response = await this.getTemplates(params);
    
    // 클라이언트 사이드 검색
    const filteredTemplates = response.templates.filter(template =>
      template.question_text.toLowerCase().includes(query.toLowerCase())
    );

    return filteredTemplates;
  }
}

// 싱글톤 인스턴스 내보내기
export const templateAPI = new TemplateAPI();