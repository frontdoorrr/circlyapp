/**
 * Poll API Module
 *
 * Endpoint: /api/v1/polls
 */
import {
  CategoryInfo,
  PollDetailResponse,
  PollResponse,
  PollTemplateResponse,
  TemplateCategory,
  VoteRequest,
  VoteResponse,
} from '../types/poll';
import { ApiResponse } from '../types/api';
import { apiClient } from './client';

/**
 * 백엔드 응답 형식에 따라 데이터 추출
 * - { success: true, data: T } 래핑 형식
 * - T 직접 반환 형식
 */
function extractData<T>(responseData: any, validator: (data: any) => boolean): T {
  if (responseData.success && responseData.data !== undefined) {
    return responseData.data;
  } else if (validator(responseData)) {
    return responseData;
  }
  throw new Error('Unexpected response format');
}

/**
 * 투표 템플릿 목록 조회
 */
export async function getPollTemplates(
  category?: TemplateCategory
): Promise<PollTemplateResponse[]> {
  console.log('[API] GET /polls/templates 요청:', { category });
  const params = category ? { category } : {};
  const response = await apiClient.get<ApiResponse<PollTemplateResponse[]>>(
    '/polls/templates',
    { params }
  );
  console.log('[API] GET /polls/templates 응답:', { status: response.status });
  return extractData<PollTemplateResponse[]>(response.data, (d) => Array.isArray(d));
}

/**
 * 템플릿 카테고리 목록 조회
 */
export async function getCategories(): Promise<CategoryInfo[]> {
  console.log('[API] GET /polls/templates/categories 요청');
  const response = await apiClient.get<ApiResponse<CategoryInfo[]>>(
    '/polls/templates/categories'
  );
  console.log('[API] GET /polls/templates/categories 응답:', { status: response.status });
  return extractData<CategoryInfo[]>(response.data, (d) => Array.isArray(d));
}

/**
 * 투표 상세 조회 (결과 포함)
 */
export async function getPollDetail(pollId: string): Promise<PollDetailResponse> {
  console.log('[API] GET /polls/:pollId 요청:', pollId);
  const response = await apiClient.get<ApiResponse<PollDetailResponse>>(`/polls/${pollId}`);
  console.log('[API] GET /polls/:pollId 응답:', { status: response.status });
  return extractData<PollDetailResponse>(response.data, (d) => d.id && d.question_text);
}

/**
 * 투표하기
 */
export async function vote(pollId: string, data: VoteRequest): Promise<VoteResponse> {
  console.log('[API] POST /polls/:pollId/vote 요청:', { pollId, data });
  const response = await apiClient.post<ApiResponse<VoteResponse>>(
    `/polls/${pollId}/vote`,
    data
  );
  console.log('[API] POST /polls/:pollId/vote 응답:', { status: response.status });
  // 백엔드는 { success, results, message } 형식으로 응답
  return extractData<VoteResponse>(response.data, (d) => d.success !== undefined && d.results);
}

/**
 * 현재 사용자의 모든 투표 목록 조회 (모든 Circle 통합)
 * - status: 'ACTIVE' | 'COMPLETED' | undefined (전체)
 */
export async function getMyPolls(
  status?: 'ACTIVE' | 'COMPLETED'
): Promise<PollResponse[]> {
  console.log('[API] GET /polls/me 요청:', { status });
  const params = status ? { status } : {};
  const response = await apiClient.get<ApiResponse<PollResponse[]>>(
    '/polls/me',
    { params }
  );
  console.log('[API] GET /polls/me 응답:', { status: response.status });
  return extractData<PollResponse[]>(response.data, (d) => Array.isArray(d));
}
