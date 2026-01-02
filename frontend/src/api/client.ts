/**
 * Axios API Client
 *
 * Backend Proxy 방식 - Zustand store에서 토큰 관리
 */
import axios, { AxiosError, AxiosInstance } from 'axios';
import { ApiError, ApiErrorResponse } from '../types/api';
import { getAccessToken, useAuthStore } from '../stores/auth';

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

// Request 인터셉터: 저장된 토큰 자동 추가
apiClient.interceptors.request.use(
  (config) => {
    console.log(`[API Client] ${config.method?.toUpperCase()} ${config.url}`);

    // Zustand store에서 토큰 가져오기
    const accessToken = getAccessToken();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
      console.log('[API Client] 토큰 추가됨');
    } else {
      console.log('[API Client] 토큰 없음');
    }

    return config;
  },
  (error) => {
    console.error('[API Client] Request 인터셉터 에러:', error);
    return Promise.reject(error);
  }
);

// Response 인터셉터: 에러 처리
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API Client] 응답 성공: ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  async (error: AxiosError<ApiErrorResponse>) => {
    console.error('[API Client] 응답 에러:', {
      url: error.config?.url,
      status: error.response?.status,
    });

    if (error.response) {
      const { data, status } = error.response;

      // 401 Unauthorized: 토큰 만료 → 로그아웃
      if (status === 401) {
        console.warn('[API Client] 401 Unauthorized - 로그아웃 처리');
        const { logout } = useAuthStore.getState();
        await logout();
      }

      // API 에러 객체 생성
      if (data && !data.success && data.error) {
        console.error('[API Client] API 에러:', data.error);
        throw new ApiError(data.error.code as any, data.error.message);
      }
    }

    // 네트워크 에러
    if (error.request && !error.response) {
      console.error('[API Client] 네트워크 에러');
      throw new ApiError('NETWORK_ERROR' as any, '네트워크 연결을 확인해주세요');
    }

    return Promise.reject(error);
  }
);

/**
 * API 응답 unwrap 헬퍼 함수
 */
export function unwrapResponse<T>(response: { data: T }): T {
  return response.data;
}
