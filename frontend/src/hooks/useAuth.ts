/**
 * Authentication Hooks (React Query + Backend Proxy)
 *
 * 백엔드를 통해 Supabase Auth 호출
 * 백엔드가 Supabase와 통신하고 JWT 토큰 반환
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as authApi from '../api/auth';
import { LoginRequest, UserCreate, UserUpdate } from '../types/auth';
import { useAuthStore } from '../stores/auth';

/**
 * 회원가입 훅
 * 백엔드 → Supabase 회원가입 → JWT 토큰 반환
 */
export function useRegister() {
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: async (data: UserCreate) => {
      console.log('[useRegister] 백엔드 회원가입 호출:', { email: data.email });
      const response = await authApi.register(data);
      console.log('[useRegister] 회원가입 성공');
      return response;
    },
    onSuccess: async (result) => {
      console.log('[useRegister] onSuccess - 토큰 저장');
      await setAuth(result.user, result.access_token);
    },
    onError: (error) => {
      console.error('[useRegister] onError:', error);
    },
  });
}

/**
 * 로그인 훅
 * 백엔드 → Supabase 로그인 → JWT 토큰 반환
 */
export function useLogin() {
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      console.log('[useLogin] 백엔드 로그인 호출:', { email: data.email });
      const response = await authApi.login(data);
      console.log('[useLogin] 로그인 성공');
      return response;
    },
    onSuccess: async (result) => {
      console.log('[useLogin] onSuccess - 토큰 저장');
      await setAuth(result.user, result.access_token);
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
      console.log('[useLogout] 로그아웃 호출');
      await logout();
    },
    onSuccess: () => {
      console.log('[useLogout] 로그아웃 성공 - 캐시 초기화');
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
 * TODO: 백엔드 API 구현 후 연동 필요
 */
export function useDeleteAccount() {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      console.log('[useDeleteAccount] 회원 탈퇴 호출');
      // TODO: 백엔드 API 호출
      // await authApi.deleteAccount();
      await logout();
    },
    onSuccess: () => {
      console.log('[useDeleteAccount] 회원 탈퇴 성공 - 캐시 초기화');
      queryClient.clear();
    },
  });
}
