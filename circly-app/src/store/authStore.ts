import { create } from 'zustand';
import { AuthState, UserResponse, LoginRequest, UserUpdate } from '../types';
import { authApi } from '../services/api';
import { apiClient } from '../services/api/client';

interface AuthStore extends AuthState {
  // Actions
  login: (loginData: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  updateProfile: (updateData: UserUpdate) => Promise<void>;
  restoreAuth: () => Promise<void>;
  setUser: (user: UserResponse) => void;
  setToken: (token: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthStore>()((set) => {
  console.log('🏪 [AuthStore] Store created with initial state');
  
  return {
    // Initial state
    isAuthenticated: false,
    user: null,
    token: null,
    loading: false,
    error: null,

    // Actions
    login: async (loginData: LoginRequest) => {
      console.log('🏪 [AuthStore] Login started with data:', loginData);
      try {
        set({ loading: true, error: null });
        console.log('🏪 [AuthStore] Set loading to true');
      
      const authResponse = await authApi.login(loginData);
      
      if (authResponse) {
        // Update API client token
        apiClient.setToken(authResponse.access_token);
        
        set({
          isAuthenticated: true,
          user: authResponse.user,
          token: authResponse.access_token,
          loading: false,
        });
      }
    } catch (error: any) {
      // Clear API client token on error
      apiClient.clearToken();
      
      set({
        loading: false,
        error: error.message || 'Login failed',
        isAuthenticated: false,
        user: null,
        token: null,
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      set({ loading: true });
      await authApi.logout();
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      // Clear API client token
      apiClient.clearToken();
      
      set({
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: null,
      });
    }
  },

  getCurrentUser: async () => {
    try {
      set({ loading: true, error: null });
      
      const user = await authApi.getCurrentUser();
      
      if (user) {
        set({
          user,
          isAuthenticated: true,
          loading: false,
        });
      } else {
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          loading: false,
        });
      }
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || 'Failed to get user info',
        isAuthenticated: false,
        user: null,
        token: null,
      });
    }
  },

  updateProfile: async (updateData: UserUpdate) => {
    try {
      set({ loading: true, error: null });
      
      const updatedUser = await authApi.updateProfile(updateData);
      
      if (updatedUser) {
        set({
          user: updatedUser,
          loading: false,
        });
      }
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || 'Failed to update profile',
      });
      throw error;
    }
  },

  restoreAuth: async () => {
    // Simplified - no persistence for now
    console.log('Restore auth called - no persistence active');
  },

  setUser: (user: UserResponse) => {
    set({ user, isAuthenticated: true });
  },

  setToken: (token: string) => {
    apiClient.setToken(token);
    set({ token, isAuthenticated: true });
  },

  clearAuth: () => {
    apiClient.clearToken();
    set({
      isAuthenticated: false,
      user: null,
      token: null,
      error: null,
    });
  },

  setLoading: (loading: boolean) => {
    set({ loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },
};
});