/**
 * Poll API Module
 *
 * Endpoint: /api/v1/polls
 */
import {
  PollCreate,
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
 * 투표 템플릿 목록 조회
 */
export async function getPollTemplates(
  category?: TemplateCategory
): Promise<PollTemplateResponse[]> {
  const params = category ? { category } : {};
  const response = await apiClient.get<ApiResponse<PollTemplateResponse[]>>(
    '/polls/templates',
    { params }
  );
  return response.data.success ? response.data.data : Promise.reject(response.data);
}

/**
 * 투표 생성
 */
export async function createPoll(circleId: string, data: PollCreate): Promise<PollResponse> {
  const response = await apiClient.post<ApiResponse<PollResponse>>(
    `/polls/circles/${circleId}/polls`,
    data
  );
  return response.data.success ? response.data.data : Promise.reject(response.data);
}

/**
 * Circle의 진행 중인 투표 목록
 */
export async function getActivePolls(circleId: string): Promise<PollResponse[]> {
  const response = await apiClient.get<ApiResponse<PollResponse[]>>(
    `/polls/circles/${circleId}/polls`,
    { params: { status: 'ACTIVE' } }
  );
  return response.data.success ? response.data.data : Promise.reject(response.data);
}

/**
 * 투표 상세 조회 (결과 포함)
 */
export async function getPollDetail(pollId: string): Promise<PollDetailResponse> {
  const response = await apiClient.get<ApiResponse<PollDetailResponse>>(`/polls/${pollId}`);
  return response.data.success ? response.data.data : Promise.reject(response.data);
}

/**
 * 투표하기
 */
export async function vote(pollId: string, data: VoteRequest): Promise<VoteResponse> {
  const response = await apiClient.post<ApiResponse<VoteResponse>>(
    `/polls/${pollId}/vote`,
    data
  );
  return response.data.success ? response.data.data : Promise.reject(response.data);
}
