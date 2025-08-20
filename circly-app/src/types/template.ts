/**
 * 질문 템플릿 관련 타입 정의
 * PRD 01-anonymous-voting-detailed.md와 TRD 05-api-specification.md 기반
 */

export type TemplateCategory = '외모' | '성격' | '재능' | '특별한날';

export interface QuestionTemplate {
  id: string;
  category: TemplateCategory;
  question_text: string;
  usage_count: number;
  is_popular: boolean;
  is_active: boolean;
  created_at: string;
}

export interface TemplateListResponse {
  templates: QuestionTemplate[];
  total: number;
  limit: number;
  offset: number;
}

export interface PopularTemplate extends QuestionTemplate {
  rank: number;
}

export interface PopularTemplatesResponse {
  templates: PopularTemplate[];
}

// 템플릿 선택 상태
export interface TemplateSelectionState {
  selectedCategory: TemplateCategory | null;
  selectedTemplate: QuestionTemplate | null;
  isLoading: boolean;
  error: string | null;
}

// API 요청 파라미터
export interface GetTemplatesParams {
  category?: TemplateCategory;
  popular?: boolean;
  limit?: number;
  offset?: number;
}

// 카테고리별 정보
export interface CategoryInfo {
  key: TemplateCategory;
  name: string;
  description: string;
  icon: string;
  color: string;
}

// 템플릿 카테고리 상수
export const TEMPLATE_CATEGORIES: CategoryInfo[] = [
  {
    key: '외모',
    name: '외모',
    description: '패션, 스타일, 매력에 대한 질문',
    icon: '✨',
    color: '#FF6B6B'
  },
  {
    key: '성격',
    name: '성격',
    description: '친절함, 유머, 긍정성에 대한 질문',
    icon: '💝',
    color: '#4ECDC4'
  },
  {
    key: '재능',
    name: '재능',
    description: '운동, 공부, 특기에 대한 질문',
    icon: '🏆',
    color: '#45B7D1'
  },
  {
    key: '특별한날',
    name: '특별한 날',
    description: '오늘의 기분, 특별한 순간의 질문',
    icon: '🌟',
    color: '#96CEB4'
  }
];