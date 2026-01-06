/**
 * Authentication Store (Zustand)
 *
 * Supabase Auth 직접 연동 방식
 * Supabase SDK가 토큰 저장/갱신 자동 처리
 */
import { Session } from '@supabase/supabase-js';
import { create } from 'zustand';
import { UserResponse } from '../types/auth';

interface AuthState {
  // State
  user: UserResponse | null;
  supabaseSession: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  setSession: (session: Session | null) => void;
  setUser: (user: UserResponse | null) => void;
  logout: () => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Initial state
  user: null,
  supabaseSession: null,
  isLoading: true,
  isAuthenticated: false,

  // Supabase 세션 설정 (onAuthStateChange에서 호출)
  setSession: (session) => {
    set({
      supabaseSession: session,
      isAuthenticated: !!session,
      isLoading: false,
    });
  },

  // 사용자 프로필 설정 (백엔드에서 가져온 UserResponse)
  setUser: (user) => {
    set({ user });
  },

  // 로그아웃 (상태 초기화)
  logout: () => {
    set({
      user: null,
      supabaseSession: null,
      isLoading: false,
      isAuthenticated: false,
    });
  },

  // 로딩 상태 설정
  setLoading: (isLoading) => {
    set({ isLoading });
  },
}));

/**
 * API Client에서 사용할 토큰 getter
 * Supabase 세션에서 access_token 추출
 */
export const getAccessToken = (): string | null => {
  return useAuthStore.getState().supabaseSession?.access_token ?? null;
};
