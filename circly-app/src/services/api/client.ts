import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiConfig, ApiResponse } from '../../types/api';

class ApiClient {
  private instance: AxiosInstance;
  private token: string | null = null;

  constructor(config: ApiConfig) {
    this.instance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      maxRedirects: 5,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.instance.interceptors.request.use(
      (config) => {
        console.log('🔧 [ApiClient] Request interceptor - token exists:', !!this.token);
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
          console.log('🔧 [ApiClient] Added Authorization header:', config.headers.Authorization?.substring(0, 30) + '...');
        } else {
          console.log('⚠️ [ApiClient] No token available for request');
        }
        console.log('🔧 [ApiClient] Final request headers:', config.headers);
        return config;
      },
      (error) => {
        console.error('🚨 [ApiClient] Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - clear token and redirect to login
          this.clearToken();
          // You might want to emit an event or use navigation here
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  async testAuth(): Promise<boolean> {
    try {
      console.log('🧪 [ApiClient] Testing authentication...');
      console.log('🔑 [ApiClient] Current token:', this.token ? `${this.token.substring(0, 30)}...` : 'null');
      
      // Test with a simple endpoint first
      const response = await this.instance.get('/v1/users/me');
      console.log('✅ [ApiClient] Auth test successful:', response.status);
      console.log('📄 [ApiClient] Auth test response:', response.data);
      return true;
    } catch (error: any) {
      console.error('❌ [ApiClient] Auth test failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      return false;
    }
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      console.log('🌐 [ApiClient] GET request:', url);
      console.log('🔑 [ApiClient] Auth token:', this.token ? `✅ Present (${this.token.substring(0, 20)}...)` : '❌ Missing');
      
      const response = await this.instance.get(url, config);
      console.log('📥 [ApiClient] GET response status:', response.status);
      console.log('📊 [ApiClient] GET response data:', response.data);
      
      return {
        data: response.data,
      };
    } catch (error: any) {
      console.error('🚨 [ApiClient] GET error:', {
        url,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      return {
        error: error.response?.data?.detail || error.message || 'An error occurred',
      };
    }
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.post(url, data, config);
      return {
        data: response.data,
      };
    } catch (error: any) {
      return {
        error: error.response?.data?.detail || error.message || 'An error occurred',
      };
    }
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.put(url, data, config);
      return {
        data: response.data,
      };
    } catch (error: any) {
      return {
        error: error.response?.data?.detail || error.message || 'An error occurred',
      };
    }
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.delete(url, config);
      return {
        data: response.data,
      };
    } catch (error: any) {
      return {
        error: error.response?.data?.detail || error.message || 'An error occurred',
      };
    }
  }
}

// Create and export API client instance
const apiConfig: ApiConfig = {
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 10000,
  headers: {},
};

export const apiClient = new ApiClient(apiConfig);
export default apiClient;