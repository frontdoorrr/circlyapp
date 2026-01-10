/**
 * Authentication Hooks (React Query + Supabase Auth 직접 연동)
 *
 * Supabase Auth를 직접 호출하여 인증 처리
 * 토큰 갱신은 Supabase SDK가 자동 처리
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as authApi from '../api/auth';
import { LoginRequest, UserCreate, UserUpdate } from '../types/auth';
import { useAuthStore } from '../stores/auth';
import { supabase } from '../lib/supabase';
import { SupabaseAuthError } from '../utils/supabaseErrors';

/**
 * 회원가입 훅 (2단계 방식)
 * 1단계: Supabase Auth 회원가입
 * 2단계: 백엔드 프로필 업데이트 (username, display_name)
 */
export function useRegister() {
  return useMutation({
    mutationFn: async (data: UserCreate) => {
      console.log('[useRegister] Supabase 회원가입 호출:', { email: data.email });

      // 1단계: Supabase Auth 회원가입
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (error) {
        console.error('[useRegister] Supabase 에러:', error);
        throw new SupabaseAuthError(error);
      }

      if (!authData.session) {
        console.log('[useRegister] 세션 없음 - 이메일 인증 필요할 수 있음');
        // 이메일 인증이 필요한 경우 세션이 없을 수 있음
        return authData;
      }

      console.log('[useRegister] Supabase 회원가입 성공');

      // 2단계: 백엔드 프로필 업데이트 (username, display_name)
      if (data.username || data.display_name) {
        try {
          console.log('[useRegister] 백엔드 프로필 업데이트:', {
            username: data.username,
            display_name: data.display_name,
          });
          await authApi.updateProfile({
            username: data.username,
            display_name: data.display_name,
          });
          console.log('[useRegister] 프로필 업데이트 성공');
        } catch (profileError) {
          // 프로필 업데이트 실패해도 회원가입은 성공으로 처리
          // 사용자가 나중에 프로필 설정 가능
          console.warn('[useRegister] 프로필 업데이트 실패 (무시됨):', profileError);
        }
      }

      return authData;
    },
    onError: (error) => {
      console.error('[useRegister] onError:', error);
    },
  });
}

/**
 * 로그인 훅
 * Supabase Auth 직접 로그인
 * onAuthStateChange 리스너가 세션 동기화 처리
 */
export function useLogin() {
  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      console.log('[useLogin] Supabase 로그인 호출:', { email: data.email });

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        console.error('[useLogin] Supabase 에러:', error);
        throw new SupabaseAuthError(error);
      }

      console.log('[useLogin] 로그인 성공');
      return authData;
    },
    onError: (error) => {
      console.error('[useLogin] onError:', error);
    },
  });
}

/**
 * 로그아웃 훅
 * Supabase Auth 로그아웃 + React Query 캐시 초기화
 */
export function useLogout() {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      console.log('[useLogout] Supabase 로그아웃 호출');
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('[useLogout] Supabase 에러:', error);
        throw new SupabaseAuthError(error);
      }

      console.log('[useLogout] 로그아웃 성공');
    },
    onSuccess: () => {
      console.log('[useLogout] onSuccess - 상태 초기화');
      logout();
      queryClient.clear();
    },
    onError: (error) => {
      console.error('[useLogout] onError:', error);
      // 에러 발생해도 로컬 상태는 초기화
      logout();
      queryClient.clear();
    },
  });
}

/**
 * 현재 사용자 조회 훅
 */
export function useCurrentUser() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.getCurrentUser,
    enabled: isAuthenticated, // 인증된 경우에만 실행
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

/**
 * 회원 탈퇴 훅
 * 백엔드에서 사용자 데이터 삭제 후 Supabase 로그아웃
 */
export function useDeleteAccount() {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      console.log('[useDeleteAccount] 회원 탈퇴 호출');

      // 백엔드에서 사용자 데이터 삭제 (Supabase Auth도 함께 삭제됨)
      await authApi.deleteAccount();

      // Supabase Auth 로그아웃 (로컬 세션 정리)
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn('[useDeleteAccount] Supabase 로그아웃 경고:', error);
        // 백엔드 삭제는 성공했으므로 계속 진행
      }
    },
    onSuccess: () => {
      console.log('[useDeleteAccount] 회원 탈퇴 성공 - 상태 초기화');
      logout();
      queryClient.clear();
    },
  });
}
