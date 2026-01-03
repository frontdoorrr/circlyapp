/**
 * Circle API Module
 *
 * Endpoint: /api/v1/circles
 */
import {
  CircleCreate,
  CircleDetail,
  CircleResponse,
  JoinByCodeRequest,
  MemberInfo,
  RegenerateInviteCodeResponse,
  ValidateInviteCodeResponse,
} from '../types/circle';
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
 * Circle 생성
 */
export async function createCircle(data: CircleCreate): Promise<CircleResponse> {
  console.log('[API] POST /circles 요청:', data);
  const response = await apiClient.post<ApiResponse<CircleResponse>>('/circles', data);
  console.log('[API] POST /circles 응답:', { status: response.status });
  return extractData<CircleResponse>(response.data, (d) => d.id && d.name);
}

/**
 * 내 Circle 목록 조회
 */
export async function getMyCircles(): Promise<CircleResponse[]> {
  console.log('[API] GET /circles 요청');
  const response = await apiClient.get<ApiResponse<CircleResponse[]>>('/circles');
  console.log('[API] GET /circles 응답:', { status: response.status });
  return extractData<CircleResponse[]>(response.data, (d) => Array.isArray(d));
}

/**
 * Circle 상세 조회 (멤버 포함)
 */
export async function getCircleDetail(circleId: string): Promise<CircleDetail> {
  console.log('[API] GET /circles/:id 요청:', circleId);
  const response = await apiClient.get<ApiResponse<CircleDetail>>(`/circles/${circleId}`);
  console.log('[API] GET /circles/:id 응답:', { status: response.status });
  return extractData<CircleDetail>(response.data, (d) => d.id && d.members);
}

/**
 * 초대 코드 검증
 */
export async function validateInviteCode(code: string): Promise<ValidateInviteCodeResponse> {
  console.log('[API] GET /circles/validate-code/:code 요청:', code);
  const response = await apiClient.get<ApiResponse<ValidateInviteCodeResponse>>(
    `/circles/validate-code/${code.toUpperCase()}`
  );
  console.log('[API] GET /circles/validate-code/:code 응답:', { status: response.status });
  return extractData<ValidateInviteCodeResponse>(response.data, (d) => typeof d.valid === 'boolean');
}

/**
 * 초대 코드로 Circle 참여
 */
export async function joinCircleByCode(data: JoinByCodeRequest): Promise<CircleResponse> {
  console.log('[API] POST /circles/join/code 요청:', data);
  const response = await apiClient.post<ApiResponse<CircleResponse>>('/circles/join/code', data);
  console.log('[API] POST /circles/join/code 응답:', { status: response.status });
  return extractData<CircleResponse>(response.data, (d) => d.id && d.name);
}

/**
 * Circle 나가기
 */
export async function leaveCircle(circleId: string): Promise<void> {
  console.log('[API] POST /circles/:id/leave 요청:', circleId);
  await apiClient.post(`/circles/${circleId}/leave`);
  console.log('[API] POST /circles/:id/leave 완료');
}

/**
 * Circle 멤버 목록 조회
 */
export async function getCircleMembers(circleId: string): Promise<MemberInfo[]> {
  console.log('[API] GET /circles/:id/members 요청:', circleId);
  const response = await apiClient.get<ApiResponse<MemberInfo[]>>(`/circles/${circleId}/members`);
  console.log('[API] GET /circles/:id/members 응답:', { status: response.status });
  return extractData<MemberInfo[]>(response.data, (d) => Array.isArray(d));
}

/**
 * 초대 코드 재생성
 */
export async function regenerateInviteCode(
  circleId: string
): Promise<RegenerateInviteCodeResponse> {
  console.log('[API] POST /circles/:id/regenerate-code 요청:', circleId);
  const response = await apiClient.post<ApiResponse<RegenerateInviteCodeResponse>>(
    `/circles/${circleId}/regenerate-code`
  );
  console.log('[API] POST /circles/:id/regenerate-code 응답:', { status: response.status });
  return extractData<RegenerateInviteCodeResponse>(response.data, (d) => d.invite_code);
}
