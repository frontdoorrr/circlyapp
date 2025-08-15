import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiConfig, ApiResponse } from '../../types/api';

class ApiClient {
  private instance: AxiosInstance;
  private token: string | null = null;

  constructor(config: ApiConfig) {
    this.instance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
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
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => {
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

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.get(url, config);
      return {
        data: response.data,
      };
    } catch (error: any) {
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