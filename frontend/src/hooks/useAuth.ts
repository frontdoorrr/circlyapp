/**
 * Authentication Hooks (React Query)
 *
 * Backend API를 통한 Supabase Auth 연동
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as authApi from '../api/auth';
import { LoginRequest, UserCreate, UserUpdate } from '../types/auth';
import { useAuthStore } from '../stores/auth';

/**
 * 회원가입 훅
 * Backend가 Supabase Auth signup을 프록시로 처리
 */
export function useRegister() {
  const { setUser, setSession } = useAuthStore();

  return useMutation({
    mutationFn: async (data: UserCreate) => {
      console.log('[useRegister] 회원가입 API 호출:', { email: data.email, username: data.username });
      try {
        const response = await authApi.register(data);
        console.log('[useRegister] API 응답 성공:', { user: response.user.email });
        return response;
      } catch (error) {
        console.error('[useRegister] API 호출 실패:', error);
        throw error;
      }
    },
    onSuccess: async (response) => {
      console.log('[useRegister] onSuccess - 자동 로그인 처리');
      // Backend 응답으로 Supabase 세션 설정
      // Note: Backend가 Supabase 토큰을 반환하므로, 이를 세션으로 사용
      setUser(response.user);

      // Supabase 세션 동기화를 위해 getSession 호출
      const { supabase } = await import('../lib/supabase');
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setSession(data.session);
      }
    },
    onError: (error) => {
      console.error('[useRegister] onError:', error);
    },
  });
}

/**
 * 로그인 훅
 * Backend가 Supabase Auth signin을 프록시로 처리
 */
export function useLogin() {
  const { setUser, setSession } = useAuthStore();

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      console.log('[useLogin] 로그인 API 호출:', { email: data.email });
      try {
        const response = await authApi.login(data);
        console.log('[useLogin] API 응답 성공:', { user: response.user.email });
        return response;
      } catch (error) {
        console.error('[useLogin] API 호출 실패:', error);
        throw error;
      }
    },
    onSuccess: async (response) => {
      console.log('[useLogin] onSuccess - 로그인 처리');
      setUser(response.user);

      // Supabase 세션 동기화
      const { supabase } = await import('../lib/supabase');
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setSession(data.session);
      }
    },
    onError: (error) => {
      console.error('[useLogin] onError:', error);
    },
  });
}

/**
 * 로그아웃 훅
 */
export function useLogout() {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await logout();
    },
    onSuccess: () => {
      // 모든 쿼리 캐시 초기화
      queryClient.clear();
    },
  });
}

/**
 * 현재 사용자 조회 훅
 */
export function useCurrentUser() {
  const { session } = useAuthStore();

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.getCurrentUser,
    enabled: !!session, // 세션이 있을 때만 실행
    staleTime: 5 * 60 * 1000, // 5분
  });
}

/**
 * 프로필 수정 훅
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: UserUpdate) => authApi.updateProfile(data),
    onSuccess: (updatedUser) => {
      // Zustand store 업데이트
      setUser(updatedUser);

      // React Query 캐시 업데이트
      queryClient.setQueryData(['auth', 'me'], updatedUser);
    },
  });
}
