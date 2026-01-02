/**
 * Auth API Module
 *
 * Endpoint: /api/v1/auth
 */
import {
  AuthResponse,
  LoginRequest,
  UserCreate,
  UserResponse,
  UserUpdate,
} from '../types/auth';
import { ApiSuccessResponse } from '../types/api';
import { apiClient } from './client';

/**
 * 회원가입
 */
export async function register(data: UserCreate): Promise<AuthResponse> {
  console.log('[API] POST /auth/register 요청:', { email: data.email, username: data.username });
  const response = await apiClient.post<ApiSuccessResponse<AuthResponse>>('/auth/register', data);
  console.log('[API] POST /auth/register 응답:', { status: response.status });
  return response.data.data;
}

/**
 * 로그인
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  console.log('[API] POST /auth/login 요청:', { email: data.email });
  const response = await apiClient.post<ApiSuccessResponse<AuthResponse>>('/auth/login', data);
  console.log('[API] POST /auth/login 응답:', { status: response.status, data: JSON.stringify(response.data) });

  // 백엔드 응답 형식에 따라 처리
  const responseData = response.data as any;
  if (responseData.success && responseData.data) {
    // { success: true, data: AuthResponse } 형식
    return responseData.data;
  } else if (responseData.user && responseData.access_token) {
    // AuthResponse 직접 반환 형식
    return responseData;
  }

  throw new Error('Unexpected response format');
}

/**
 * 현재 사용자 정보 조회
 */
export async function getCurrentUser(): Promise<UserResponse> {
  console.log('[API] GET /auth/me 요청');
  const response = await apiClient.get<ApiSuccessResponse<UserResponse>>('/auth/me');
  console.log('[API] GET /auth/me 응답:', { status: response.status, data: JSON.stringify(response.data) });

  // 백엔드 응답 형식에 따라 처리
  const responseData = response.data as any;
  if (responseData.success && responseData.data) {
    // { success: true, data: UserResponse } 형식
    return responseData.data;
  } else if (responseData.id && responseData.email) {
    // UserResponse 직접 반환 형식
    return responseData;
  }

  throw new Error('Unexpected response format');
}

/**
 * 프로필 수정
 */
export async function updateProfile(data: UserUpdate): Promise<UserResponse> {
  console.log('[API] PUT /auth/me 요청:', data);
  const response = await apiClient.put<ApiSuccessResponse<UserResponse>>('/auth/me', data);
  console.log('[API] PUT /auth/me 응답:', { status: response.status, data: JSON.stringify(response.data) });

  // 백엔드 응답 형식에 따라 처리
  const responseData = response.data as any;
  if (responseData.success && responseData.data) {
    // { success: true, data: UserResponse } 형식
    return responseData.data;
  } else if (responseData.id && responseData.email) {
    // UserResponse 직접 반환 형식
    return responseData;
  }

  throw new Error('Unexpected response format');
}
