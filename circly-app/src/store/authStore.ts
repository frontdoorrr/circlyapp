import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState, UserResponse, LoginRequest, UserUpdate } from '../types';
import { authApi } from '../services/api';

interface AuthStore extends AuthState {
  // Actions
  login: (loginData: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  updateProfile: (updateData: UserUpdate) => Promise<void>;
  setUser: (user: UserResponse) => void;
  setToken: (token: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false,
      error: null,

      // Actions
      login: async (loginData: LoginRequest) => {
        try {
          set({ loading: true, error: null });
          
          const authResponse = await authApi.login(loginData);
          
          if (authResponse) {
            set({
              isAuthenticated: true,
              user: authResponse.user,
              token: authResponse.access_token,
              loading: false,
            });
          }
        } catch (error: any) {
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

      setUser: (user: UserResponse) => {
        set({ user, isAuthenticated: true });
      },

      setToken: (token: string) => {
        set({ token, isAuthenticated: true });
      },

      clearAuth: () => {
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
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        token: state.token,
      }),
    }
  )
);