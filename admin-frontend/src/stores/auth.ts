import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/auth';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) =>
        set({ user, isAuthenticated: !!user }),

      setAccessToken: (token) =>
        set({ accessToken: token }),

      setLoading: (loading) =>
        set({ isLoading: loading }),

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;

          const accessToken = data.session?.access_token || null;
          set({ accessToken });

          // 백엔드에서 사용자 정보 가져오기
          if (accessToken) {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
            const response = await fetch(`${apiUrl}/auth/me`, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            });

            if (response.ok) {
              const user = await response.json() as User;

              // Admin 권한 확인
              if (user.role !== 'ADMIN') {
                await supabase.auth.signOut();
                throw new Error('관리자 권한이 필요합니다');
              }

              set({ user, isAuthenticated: true });
            } else {
              throw new Error('사용자 정보를 가져올 수 없습니다');
            }
          }
        } catch (error) {
          set({ user: null, accessToken: null, isAuthenticated: false });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        });
      },

      checkAuth: async () => {
        set({ isLoading: true });
        try {
          const { data: { session } } = await supabase.auth.getSession();

          if (session?.access_token) {
            const accessToken = session.access_token;
            set({ accessToken });

            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
            const response = await fetch(`${apiUrl}/auth/me`, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            });

            if (response.ok) {
              const user = await response.json() as User;

              if (user.role === 'ADMIN') {
                set({ user, isAuthenticated: true });
              } else {
                await get().logout();
              }
            } else {
              await get().logout();
            }
          } else {
            set({ user: null, accessToken: null, isAuthenticated: false });
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          set({ user: null, accessToken: null, isAuthenticated: false });
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'circly-admin-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
      }),
    }
  )
);

// 토큰 접근 헬퍼
export const getAccessToken = () => useAuthStore.getState().accessToken;
