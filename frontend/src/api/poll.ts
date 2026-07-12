/**
 * Poll API Module
 *
 * Endpoint: /api/v1/polls
 */
import {
  CategoryInfo,
  PollCandidatesResponse,
  PollDetailResponse,
  PollResponse,
  PollTemplateResponse,
  ReceivedHeartItem,
  ReceivedHeartReadResponse,
  TemplateCategory,
  VoteRequest,
  VoteResponse,
  VoteSessionCreate,
  VoteSessionAvailabilityResponse,
  VoteSessionResponse,
  VoterRevealResponse,
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
 * 투표 후보 목록 조회
 */
export async function getPollCandidates(
  pollId: string,
  shuffle = false
): Promise<PollCandidatesResponse> {
  console.log('[API] GET /polls/:pollId/candidates 요청:', { pollId, shuffle });
  const response = await apiClient.get<ApiResponse<PollCandidatesResponse>>(
    `/polls/${pollId}/candidates`,
    { params: { shuffle } }
  );
  console.log('[API] GET /polls/:pollId/candidates 응답:', { status: response.status });
  return extractData<PollCandidatesResponse>(
    response.data,
    (d) => d.poll_id && d.status && Array.isArray(d.candidates)
  );
}

/**
 * 서버 투표 세션 시작 가능 상태 조회
 */
export async function getVoteSessionAvailability(): Promise<VoteSessionAvailabilityResponse> {
  console.log('[API] GET /polls/sessions/availability 요청');
  const response = await apiClient.get<ApiResponse<VoteSessionAvailabilityResponse>>(
    '/polls/sessions/availability'
  );
  console.log('[API] GET /polls/sessions/availability 응답:', { status: response.status });
  return extractData<VoteSessionAvailabilityResponse>(
    response.data,
    (d) => typeof d?.can_start === 'boolean'
  );
}

/**
 * 서버 투표 세션 시작
 */
export async function startVoteSession(
  data: VoteSessionCreate
): Promise<VoteSessionResponse> {
  console.log('[API] POST /polls/sessions 요청:', data);
  const response = await apiClient.post<ApiResponse<VoteSessionResponse>>(
    '/polls/sessions',
    data
  );
  console.log('[API] POST /polls/sessions 응답:', { status: response.status });
  return extractData<VoteSessionResponse>(
    response.data,
    (d) => d.id && d.status && Array.isArray(d.poll_ids)
  );
}

/**
 * 서버 투표 세션 현재 질문 건너뛰기
 */
export async function skipVoteSessionPoll(sessionId: string): Promise<VoteSessionResponse> {
  console.log('[API] POST /polls/sessions/:sessionId/skip 요청:', sessionId);
  const response = await apiClient.post<ApiResponse<VoteSessionResponse>>(
    `/polls/sessions/${sessionId}/skip`
  );
  console.log('[API] POST /polls/sessions/:sessionId/skip 응답:', { status: response.status });
  return extractData<VoteSessionResponse>(
    response.data,
    (d) => d.id && d.status && Array.isArray(d.poll_ids)
  );
}

/**
 * 서버 투표 세션 현재 질문 완료 처리
 */
export async function advanceVoteSessionPoll(sessionId: string): Promise<VoteSessionResponse> {
  console.log('[API] POST /polls/sessions/:sessionId/advance 요청:', sessionId);
  const response = await apiClient.post<ApiResponse<VoteSessionResponse>>(
    `/polls/sessions/${sessionId}/advance`
  );
  console.log('[API] POST /polls/sessions/:sessionId/advance 응답:', { status: response.status });
  return extractData<VoteSessionResponse>(
    response.data,
    (d) => d.id && d.status && Array.isArray(d.poll_ids)
  );
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

/**
 * 현재 사용자가 받은 하트/칭찬 목록 조회
 */
export async function getReceivedHearts(): Promise<ReceivedHeartItem[]> {
  console.log('[API] GET /polls/me/received 요청');
  const response = await apiClient.get<ApiResponse<ReceivedHeartItem[]>>(
    '/polls/me/received'
  );
  console.log('[API] GET /polls/me/received 응답:', { status: response.status });
  return extractData<ReceivedHeartItem[]>(response.data, (d) => Array.isArray(d));
}

/**
 * 받은 하트 읽음 처리
 */
export async function markReceivedHeartAsRead(
  pollId: string
): Promise<ReceivedHeartReadResponse> {
  console.log('[API] POST /polls/me/received/:pollId/read 요청:', pollId);
  const response = await apiClient.post<ApiResponse<ReceivedHeartReadResponse>>(
    `/polls/me/received/${pollId}/read`
  );
  console.log('[API] POST /polls/me/received/:pollId/read 응답:', { status: response.status });
  return extractData<ReceivedHeartReadResponse>(
    response.data,
    (d) => d.poll_id && d.is_read === true
  );
}

// ==================== Orb Mode API ====================

/**
 * [Orb Mode] 나를 선택한 투표자 목록 조회
 * - Orb Mode 구독자 전용
 */
export async function getMyVoters(pollId: string): Promise<VoterRevealResponse> {
  console.log('[API] GET /polls/:pollId/voters 요청:', pollId);
  const response = await apiClient.get<ApiResponse<VoterRevealResponse>>(
    `/polls/${pollId}/voters`
  );
  console.log('[API] GET /polls/:pollId/voters 응답:', { status: response.status });
  return extractData<VoterRevealResponse>(response.data, (d) => d.poll_id && d.voters);
}
