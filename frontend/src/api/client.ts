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

// Request 인터셉터: Supabase 세션에서 토큰 자동 추가
apiClient.interceptors.request.use(
  async (config) => {
    console.log(`[API Client] ${config.method?.toUpperCase()} ${config.url}`);

    // Supabase 세션에서 토큰 가져오기
    const { supabase } = await import('../lib/supabase');
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
      console.log('[API Client] Supabase 토큰 추가됨');
    } else {
      console.log('[API Client] Supabase 세션 없음');
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
    // 성공 응답 처리
    console.log(`[API Client] 응답 성공: ${response.config.method?.toUpperCase()} ${response.config.url} - Status ${response.status}`);
    return response;
  },
  async (error: AxiosError<ApiErrorResponse>) => {
    console.error('[API Client] 응답 에러:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    // 에러 응답 처리
    if (error.response) {
      const { data, status } = error.response;

      console.error('[API Client] 에러 응답 데이터:', JSON.stringify(data, null, 2));

      // 401 Unauthorized: 토큰 만료 → Supabase 세션 갱신 시도
      if (status === 401) {
        console.warn('[API Client] 401 Unauthorized - 세션 갱신 시도');
        const { supabase } = await import('../lib/supabase');
        const { error: refreshError } = await supabase.auth.refreshSession();

        if (refreshError) {
          // 갱신 실패 → 로그아웃
          console.warn('[API Client] 세션 갱신 실패 - 로그아웃 처리');
          await supabase.auth.signOut();
        }
      }

      // API 에러 객체 생성
      if (data && !data.success && data.error) {
        console.error('[API Client] API 에러:', { code: data.error.code, message: data.error.message });
        throw new ApiError(data.error.code as any, data.error.message);
      } else if (data && !data.success) {
        // error 객체가 없는 경우
        console.error('[API Client] API 에러 (error 객체 없음):', data);
        throw new ApiError('UNKNOWN_ERROR' as any, '알 수 없는 오류가 발생했습니다');
      }
    }

    // 네트워크 에러
    if (error.request && !error.response) {
      console.error('[API Client] 네트워크 에러 - 서버 응답 없음');
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
