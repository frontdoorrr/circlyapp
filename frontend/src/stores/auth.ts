/**
 * Authentication Store (Zustand)
 *
 * 전역 인증 상태 관리 - Supabase Auth 연동
 */
import { Session } from '@supabase/supabase-js';
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { UserResponse } from '../types/auth';

interface AuthState {
  // State
  user: UserResponse | null;
  session: Session | null;
  isLoading: boolean;

  // Actions
  setSession: (session: Session | null) => void;
  setUser: (user: UserResponse | null) => void;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Initial state
  user: null,
  session: null,
  isLoading: true,

  // Set Supabase session
  setSession: (session) => {
    set({ session });
  },

  // Set user profile
  setUser: (user) => {
    set({ user });
  },

  // 로그아웃
  logout: async () => {
    try {
      await supabase.auth.signOut();
      set({ user: null, session: null, isLoading: false });
    } catch (error) {
      console.error('Failed to logout:', error);
      // Force clear state even on error
      set({ user: null, session: null, isLoading: false });
    }
  },

  // 앱 시작 시 Supabase 세션 로드
  initialize: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      set({
        session,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      set({ isLoading: false });
    }
  },
}));

// Legacy compatibility: token getter for API client
export const getAccessToken = (): string | null => {
  const session = useAuthStore.getState().session;
  return session?.access_token ?? null;
};
