/**
 * Authentication Hooks (React Query)
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as authApi from '../api/auth';
import { LoginRequest, UserCreate, UserUpdate } from '../types/auth';
import { useAuthStore } from '../stores/auth';

/**
 * 회원가입 훅
 */
export function useRegister() {
  const { setAuth } = useAuthStore();

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
    onSuccess: (response) => {
      console.log('[useRegister] onSuccess - 자동 로그인 처리');
      // 자동 로그인
      setAuth(response.user, response.access_token);
    },
    onError: (error) => {
      console.error('[useRegister] onError:', error);
    },
  });
}

/**
 * 로그인 훅
 */
export function useLogin() {
  const { setAuth } = useAuthStore();

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
    onSuccess: (response) => {
      console.log('[useLogin] onSuccess - 로그인 처리');
      setAuth(response.user, response.access_token);
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
  const { token } = useAuthStore();

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.getCurrentUser,
    enabled: !!token, // 토큰이 있을 때만 실행
    staleTime: 5 * 60 * 1000, // 5분
  });
}

/**
 * 프로필 수정 훅
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { updateUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: UserUpdate) => authApi.updateProfile(data),
    onSuccess: (updatedUser) => {
      // Zustand store 업데이트
      updateUser(updatedUser);

      // React Query 캐시 업데이트
      queryClient.setQueryData(['auth', 'me'], updatedUser);
    },
  });
}
