/**
 * Axios API Client
 *
 * 기본 설정 및 인터셉터 포함
 */
import axios, { AxiosError, AxiosInstance } from 'axios';
import { ApiError, ApiErrorResponse, ApiResponse } from '../types/api';

// 환경 변수에서 API URL 가져오기
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Axios 인스턴스 생성
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request 인터셉터: 토큰 자동 추가
apiClient.interceptors.request.use(
  async (config) => {
    // Zustand store에서 토큰 가져오기 (동적 import로 순환 참조 방지)
    const { useAuthStore } = await import('../stores/auth');
    const token = useAuthStore.getState().token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response 인터셉터: 에러 처리
apiClient.interceptors.response.use(
  (response) => {
    // 성공 응답 처리
    return response;
  },
  async (error: AxiosError<ApiErrorResponse>) => {
    // 에러 응답 처리
    if (error.response) {
      const { data, status } = error.response;

      // 401 Unauthorized: 토큰 만료 → 자동 로그아웃
      if (status === 401) {
        const { useAuthStore } = await import('../stores/auth');
        useAuthStore.getState().logout();
      }

      // API 에러 객체 생성
      if (data && !data.success) {
        throw new ApiError(data.error.code as any, data.error.message);
      }
    }

    // 네트워크 에러
    if (error.request && !error.response) {
      throw new ApiError('NETWORK_ERROR' as any, '네트워크 연결을 확인해주세요');
    }

    return Promise.reject(error);
  }
);

/**
 * API 응답 unwrap 헬퍼 함수
 *
 * ApiResponse<T> → T 추출
 */
export function unwrapResponse<T>(response: ApiResponse<T>): T {
  if (response.success) {
    return response.data;
  }
  throw new ApiError(response.error.code as any, response.error.message);
}
