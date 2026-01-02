/**
 * Authentication Store (Zustand)
 *
 * 전역 인증 상태 관리 - Backend Proxy 방식
 * 백엔드에서 발급받은 Supabase JWT 토큰을 저장/관리
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { UserResponse } from '../types/auth';

const ACCESS_TOKEN_KEY = '@circly:access_token';

interface AuthState {
  // State
  user: UserResponse | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  setAuth: (user: UserResponse, accessToken: string) => Promise<void>;
  setUser: (user: UserResponse | null) => void;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  accessToken: null,
  isLoading: true,
  isAuthenticated: false,

  // 로그인 성공 시 호출
  setAuth: async (user, accessToken) => {
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    set({ user, accessToken, isAuthenticated: true });
  },

  // Set user profile
  setUser: (user) => {
    set({ user });
  },

  // 로그아웃
  logout: async () => {
    try {
      await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
      set({ user: null, accessToken: null, isLoading: false, isAuthenticated: false });
    } catch (error) {
      console.error('Failed to logout:', error);
      // Force clear state even on error
      set({ user: null, accessToken: null, isLoading: false, isAuthenticated: false });
    }
  },

  // 앱 시작 시 저장된 토큰 로드
  initialize: async () => {
    try {
      const storedToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);

      if (storedToken) {
        set({
          accessToken: storedToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      set({ isLoading: false });
    }
  },
}));

// API Client에서 사용할 토큰 getter
export const getAccessToken = (): string | null => {
  return useAuthStore.getState().accessToken;
};
