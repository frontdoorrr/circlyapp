/**
 * Authentication Hooks (React Query + Supabase Auth 직접 연동)
 *
 * Supabase Auth를 직접 호출하여 인증 처리
 * 토큰 갱신은 Supabase SDK가 자동 처리
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as authApi from '../api/auth';
import * as notificationApi from '../api/notification';
import { LoginRequest, UserCreate, UserUpdate } from '../types/auth';
import { useAuthStore } from '../stores/auth';
import { supabase } from '../lib/supabase';
import { SupabaseAuthError } from '../utils/supabaseErrors';
import { logger } from '../utils/logger';

const AUTH_MODE = process.env.EXPO_PUBLIC_AUTH_MODE || 'supabase';
const isMockAuth = AUTH_MODE === 'mock';

/**
 * 회원가입 훅 (2단계 방식)
 * 1단계: Supabase Auth 회원가입
 * 2단계: 백엔드 Profile 업데이트 (username, display_name)
 */
export function useRegister() {
  const { setDevSession, setUser } = useAuthStore();

  return useMutation({
    mutationFn: async (data: UserCreate) => {
      logger.log('[useRegister] 회원가입 호출:', { email: data.email, authMode: AUTH_MODE });

      if (isMockAuth) {
        logger.log('[useRegister] Mock Auth 회원가입 호출:', { email: data.email });
        const authData = await authApi.devLogin(data);
        setDevSession(authData.access_token);
        setUser(authData.user);
        return authData;
      }

      // 1단계: Supabase Auth 회원가입
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (error) {
        logger.error('[useRegister] Supabase 에러:', error);
        throw new SupabaseAuthError(error);
      }

      if (!authData.session) {
        logger.log('[useRegister] 세션 없음 - 이메일 인증 필요할 수 있음');
        // 이메일 인증이 필요한 경우 세션이 없을 수 있음
        return authData;
      }

      logger.log('[useRegister] Supabase 회원가입 성공');

      // 2단계: 백엔드 Profile 업데이트 (username, display_name)
      if (data.username || data.display_name) {
        try {
          logger.log('[useRegister] 백엔드 Profile 업데이트:', {
            username: data.username,
            display_name: data.display_name,
          });
          await authApi.updateProfile({
            username: data.username,
            display_name: data.display_name,
          });
          logger.log('[useRegister] Profile 업데이트 성공');
        } catch (profileError) {
          // Profile 업데이트 실패해도 회원가입은 성공으로 처리
          // 사용자가 나중에 Profile 설정 가능
          logger.warn('[useRegister] Profile 업데이트 실패 (무시됨):', profileError);
        }
      }

      return authData;
    },
    onError: (error) => {
      logger.error('[useRegister] onError:', error);
    },
  });
}

/**
 * 로그인 훅
 * Supabase Auth 직접 로그인
 * onAuthStateChange 리스너가 세션 동기화 처리
 */
export function useLogin() {
  const { setDevSession, setUser } = useAuthStore();

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      logger.log('[useLogin] 로그인 호출:', { email: data.email, authMode: AUTH_MODE });

      if (isMockAuth) {
        logger.log('[useLogin] Mock Auth 로그인 호출:', { email: data.email });
        const authData = await authApi.devLogin(data);
        setDevSession(authData.access_token);
        setUser(authData.user);
        return authData;
      }

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        logger.error('[useLogin] Supabase 에러:', error);
        throw new SupabaseAuthError(error);
      }

      logger.log('[useLogin] 로그인 성공');
      return authData;
    },
    onError: (error) => {
      logger.error('[useLogin] onError:', error);
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
      try {
        await notificationApi.unregisterPushToken();
      } catch (error) {
        logger.warn('[useLogout] 푸시 토큰 해제 실패 (로그아웃 계속):', error);
      }

      if (isMockAuth) {
        logger.log('[useLogout] Mock Auth 로그아웃');
        return;
      }

      logger.log('[useLogout] Supabase 로그아웃 호출');
      const { error } = await supabase.auth.signOut();

      if (error) {
        logger.error('[useLogout] Supabase 에러:', error);
        throw new SupabaseAuthError(error);
      }

      logger.log('[useLogout] 로그아웃 성공');
    },
    onSuccess: () => {
      logger.log('[useLogout] onSuccess - 상태 초기화');
      logout();
      queryClient.clear();
    },
    onError: (error) => {
      logger.error('[useLogout] onError:', error);
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
 * Profile 수정 훅
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
      logger.log('[useDeleteAccount] 회원 탈퇴 호출');

      // 백엔드에서 사용자 데이터 삭제 (Supabase Auth도 함께 삭제됨)
      await authApi.deleteAccount();

      if (isMockAuth) {
        return;
      }

      // Supabase Auth 로그아웃 (로컬 세션 정리)
      const { error } = await supabase.auth.signOut();
      if (error) {
        logger.warn('[useDeleteAccount] Supabase 로그아웃 경고:', error);
        // 백엔드 삭제는 성공했으므로 계속 진행
      }
    },
    onSuccess: () => {
      logger.log('[useDeleteAccount] 회원 탈퇴 성공 - 상태 초기화');
      logout();
      queryClient.clear();
    },
  });
}
