/**
 * Authentication Store (Zustand)
 *
 * 전역 인증 상태 관리
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { UserResponse } from '../types/auth';

interface AuthState {
  // State
  user: UserResponse | null;
  token: string | null;
  isLoading: boolean;

  // Actions
  setAuth: (user: UserResponse, token: string) => Promise<void>;
  logout: () => Promise<void>;
  loadAuthFromStorage: () => Promise<void>;
  updateUser: (user: UserResponse) => Promise<void>;
}

const TOKEN_KEY = '@circly:token';
const USER_KEY = '@circly:user';

export const useAuthStore = create<AuthState>((set) => ({
  // Initial state
  user: null,
  token: null,
  isLoading: true,

  // 로그인 성공 시 호출
  setAuth: async (user, token) => {
    try {
      // AsyncStorage에 저장
      await AsyncStorage.setItem(TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));

      // 상태 업데이트
      set({ user, token, isLoading: false });
    } catch (error) {
      console.error('Failed to save auth:', error);
    }
  },

  // 로그아웃
  logout: async () => {
    try {
      // AsyncStorage에서 제거
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);

      // 상태 초기화
      set({ user: null, token: null, isLoading: false });
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  },

  // 앱 시작 시 저장된 인증 정보 로드
  loadAuthFromStorage: async () => {
    try {
      const [token, userJson] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);

      if (token && userJson) {
        const user = JSON.parse(userJson) as UserResponse;
        set({ user, token, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load auth:', error);
      set({ isLoading: false });
    }
  },

  // 사용자 정보 업데이트 (프로필 수정 후)
  updateUser: async (user) => {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      set({ user });
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  },
}));
