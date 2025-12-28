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
  const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data);
  return response.data.success ? response.data.data : Promise.reject(response.data);
}

/**
 * 로그인
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data);
  return response.data.success ? response.data.data : Promise.reject(response.data);
}

/**
 * 현재 사용자 정보 조회
 */
export async function getCurrentUser(): Promise<UserResponse> {
  const response = await apiClient.get<ApiResponse<UserResponse>>('/auth/me');
  return response.data.success ? response.data.data : Promise.reject(response.data);
}

/**
 * 프로필 수정
 */
export async function updateProfile(data: UserUpdate): Promise<UserResponse> {
  const response = await apiClient.put<ApiResponse<UserResponse>>('/auth/me', data);
  return response.data.success ? response.data.data : Promise.reject(response.data);
}
