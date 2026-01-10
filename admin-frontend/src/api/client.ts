import axios from 'axios';
import { toast } from 'sonner';
import { getAccessToken } from '@/stores/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Error message mapping
const getErrorMessage = (status: number, errorData?: { error?: { message?: string; code?: string } }): string => {
  // Use backend error message if available
  if (errorData?.error?.message) {
    return errorData.error.message;
  }

  // Fallback to status-based messages
  switch (status) {
    case 400:
      return '잘못된 요청입니다.';
    case 401:
      return '인증이 필요합니다.';
    case 403:
      return '접근 권한이 없습니다.';
    case 404:
      return '요청한 리소스를 찾을 수 없습니다.';
    case 409:
      return '이미 존재하는 데이터입니다.';
    case 422:
      return '입력값을 확인해주세요.';
    case 429:
      return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
    case 500:
      return '서버 오류가 발생했습니다.';
    case 502:
    case 503:
    case 504:
      return '서버가 일시적으로 이용할 수 없습니다.';
    default:
      return '알 수 없는 오류가 발생했습니다.';
  }
};

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const errorData = error.response?.data;

    if (status === 401) {
      // Token expired or invalid - redirect without toast
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Show toast for other errors (except network errors that will be handled by React Query)
    if (status && status !== 401) {
      const message = getErrorMessage(status, errorData);
      toast.error(message);
    } else if (!error.response) {
      // Network error
      toast.error('네트워크 연결을 확인해주세요.');
    }

    return Promise.reject(error);
  }
);
