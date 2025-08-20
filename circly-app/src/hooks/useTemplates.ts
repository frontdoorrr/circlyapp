/**
 * 템플릿 관련 커스텀 훅
 * React Query를 사용한 캐싱과 상태 관리
 * TRD 01-frontend-architecture.md 기반
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { templateAPI } from '../services/api/template';
import type {
  QuestionTemplate,
  TemplateListResponse,
  PopularTemplatesResponse,
  TemplateCategory,
  GetTemplatesParams
} from '../types/template';

// Query Keys
const QUERY_KEYS = {
  templates: 'templates',
  templatesByCategory: (category: TemplateCategory) => ['templates', 'category', category],
  popularTemplates: 'popular-templates',
  templateById: (id: string) => ['templates', 'id', id]
} as const;

/**
 * 전체 템플릿 목록 조회
 */
export const useTemplates = (
  params: GetTemplatesParams = {}
): UseQueryResult<TemplateListResponse, Error> => {
  return useQuery({
    queryKey: [QUERY_KEYS.templates, params],
    queryFn: () => templateAPI.getTemplates(params),
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    gcTime: 10 * 60 * 1000, // 10분 후 가비지 컬렉션
  });
};

/**
 * 카테고리별 템플릿 조회
 */
export const useTemplatesByCategory = (
  category: TemplateCategory,
  limit: number = 20,
  offset: number = 0
): UseQueryResult<TemplateListResponse, Error> => {
  return useQuery({
    queryKey: [QUERY_KEYS.templatesByCategory(category), limit, offset],
    queryFn: () => templateAPI.getTemplatesByCategory(category, limit, offset),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

/**
 * 인기 템플릿 조회
 */
export const usePopularTemplates = (
  limit: number = 10
): UseQueryResult<PopularTemplatesResponse, Error> => {
  return useQuery({
    queryKey: [QUERY_KEYS.popularTemplates, limit],
    queryFn: () => templateAPI.getPopularTemplates(limit),
    staleTime: 10 * 60 * 1000, // 인기 템플릿은 더 오래 캐시
    gcTime: 30 * 60 * 1000,
  });
};

/**
 * 특정 템플릿 상세 조회
 */
export const useTemplateById = (
  templateId: string
): UseQueryResult<QuestionTemplate, Error> => {
  return useQuery({
    queryKey: QUERY_KEYS.templateById(templateId),
    queryFn: () => templateAPI.getTemplateById(templateId),
    enabled: !!templateId, // templateId가 있을 때만 실행
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
};

/**
 * 모든 카테고리의 템플릿을 미리 로드하는 훅
 * 사용자 경험 향상을 위한 사전 로딩
 */
export const usePrefetchAllCategories = () => {
  const categories: TemplateCategory[] = ['외모', '성격', '재능', '특별한날'];
  
  const queries = categories.map(category =>
    useTemplatesByCategory(category, 10, 0)
  );

  return {
    isLoading: queries.some(q => q.isLoading),
    hasError: queries.some(q => q.error),
    allLoaded: queries.every(q => q.data)
  };
};