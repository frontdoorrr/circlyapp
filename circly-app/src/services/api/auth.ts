import { apiClient } from './client';
import { AuthResponse, UserResponse, LoginRequest, UserUpdate } from '../../types';

export const authApi = {
  /**
   * Login with device ID
   */
  async login(loginData: LoginRequest): Promise<AuthResponse | null> {
    const response = await apiClient.post<AuthResponse>('/v1/auth/login', loginData);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    if (response.data) {
      // Set token for future requests
      apiClient.setToken(response.data.access_token);
      return response.data;
    }
    
    return null;
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/v1/auth/logout');
    } finally {
      // Always clear token, even if API call fails
      apiClient.clearToken();
    }
  },

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<UserResponse | null> {
    const response = await apiClient.get<UserResponse>('/v1/auth/me');
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data || null;
  },

  /**
   * Update current user profile
   */
  async updateProfile(updateData: UserUpdate): Promise<UserResponse | null> {
    const response = await apiClient.put<UserResponse>('/v1/users/me', updateData);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data || null;
  },

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: number): Promise<UserResponse | null> {
    const response = await apiClient.get<UserResponse>(`/v1/users/${userId}`);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.data || null;
  },
};