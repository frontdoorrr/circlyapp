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
} from '../types/circle';
import { ApiResponse } from '../types/api';
import { apiClient } from './client';

/**
 * Circle 생성
 */
export async function createCircle(data: CircleCreate): Promise<CircleResponse> {
  const response = await apiClient.post<ApiResponse<CircleResponse>>('/circles', data);
  return response.data.success ? response.data.data : Promise.reject(response.data);
}

/**
 * 내 Circle 목록 조회
 */
export async function getMyCircles(): Promise<CircleResponse[]> {
  const response = await apiClient.get<ApiResponse<CircleResponse[]>>('/circles');
  return response.data.success ? response.data.data : Promise.reject(response.data);
}

/**
 * Circle 상세 조회 (멤버 포함)
 */
export async function getCircleDetail(circleId: string): Promise<CircleDetail> {
  const response = await apiClient.get<ApiResponse<CircleDetail>>(`/circles/${circleId}`);
  return response.data.success ? response.data.data : Promise.reject(response.data);
}

/**
 * 초대 코드로 Circle 참여
 */
export async function joinCircleByCode(data: JoinByCodeRequest): Promise<CircleResponse> {
  const response = await apiClient.post<ApiResponse<CircleResponse>>('/circles/join/code', data);
  return response.data.success ? response.data.data : Promise.reject(response.data);
}

/**
 * Circle 나가기
 */
export async function leaveCircle(circleId: string): Promise<void> {
  await apiClient.post(`/circles/${circleId}/leave`);
}

/**
 * Circle 멤버 목록 조회
 */
export async function getCircleMembers(circleId: string): Promise<MemberInfo[]> {
  const response = await apiClient.get<ApiResponse<MemberInfo[]>>(`/circles/${circleId}/members`);
  return response.data.success ? response.data.data : Promise.reject(response.data);
}

/**
 * 초대 코드 재생성
 */
export async function regenerateInviteCode(
  circleId: string
): Promise<RegenerateInviteCodeResponse> {
  const response = await apiClient.post<ApiResponse<RegenerateInviteCodeResponse>>(
    `/circles/${circleId}/regenerate-code`
  );
  return response.data.success ? response.data.data : Promise.reject(response.data);
}
