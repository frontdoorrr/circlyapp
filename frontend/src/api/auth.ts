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
import { ApiResponse } from '../types/api';
import { apiClient } from './client';

/**
 * 회원가입
 */
export async function register(data: UserCreate): Promise<AuthResponse> {
  console.log('[API] POST /auth/register 요청:', { email: data.email, username: data.username });
  try {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    console.log('[API] POST /auth/register 응답:', { status: response.status });
    return response.data;
  } catch (error) {
    console.error('[API] POST /auth/register 에러:', error);
    throw error;
  }
}

/**
 * 로그인
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  console.log('[API] POST /auth/login 요청:', { email: data.email });
  try {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    console.log('[API] POST /auth/login 응답:', { status: response.status });
    return response.data;
  } catch (error) {
    console.error('[API] POST /auth/login 에러:', error);
    throw error;
  }
}

/**
 * 현재 사용자 정보 조회
 */
export async function getCurrentUser(): Promise<UserResponse> {
  const response = await apiClient.get<UserResponse>('/auth/me');
  return response.data;
}

/**
 * 프로필 수정
 */
export async function updateProfile(data: UserUpdate): Promise<UserResponse> {
  const response = await apiClient.put<UserResponse>('/auth/me', data);
  return response.data;
}
