/**
 * Supabase Auth Error Handling Utilities
 *
 * Supabase Auth 에러를 한글로 변환하고 처리하는 유틸리티
 */
import { AuthError } from '@supabase/supabase-js';

/**
 * Supabase Auth 에러를 래핑하는 커스텀 에러 클래스
 */
export class SupabaseAuthError extends Error {
  code: string;
  status?: number;

  constructor(error: AuthError) {
    super(error.message);
    this.name = 'SupabaseAuthError';
    this.code = error.name;
    this.status = error.status;
  }
}

/**
 * Supabase Auth 에러 메시지를 한글로 변환
 */
export function translateSupabaseError(error: SupabaseAuthError | AuthError): string {
  const code = error instanceof SupabaseAuthError ? error.code : error.name;
  const message = error.message.toLowerCase();

  // 에러 코드 기반 매핑
  const errorCodeMap: Record<string, string> = {
    AuthApiError: '인증 오류가 발생했습니다',
    AuthRetryableFetchError: '네트워크 연결을 확인해주세요',
    AuthSessionMissingError: '세션이 만료되었습니다. 다시 로그인해주세요',
    AuthInvalidCredentialsError: '이메일 또는 비밀번호가 올바르지 않습니다',
    AuthWeakPasswordError: '비밀번호가 너무 약합니다',
  };

  // 에러 메시지 기반 매핑 (Supabase 에러 메시지 패턴)
  const errorMessageMap: Record<string, string> = {
    'invalid login credentials': '이메일 또는 비밀번호가 올바르지 않습니다',
    'email not confirmed': '이메일 인증이 필요합니다',
    'user already registered': '이미 가입된 이메일입니다',
    'password should be at least': '비밀번호는 최소 6자 이상이어야 합니다',
    'unable to validate email address': '유효하지 않은 이메일 형식입니다',
    'email rate limit exceeded': '요청이 너무 많습니다. 잠시 후 다시 시도해주세요',
    'signup is disabled': '현재 회원가입이 비활성화되어 있습니다',
    'user not found': '등록되지 않은 사용자입니다',
    'invalid refresh token': '세션이 만료되었습니다. 다시 로그인해주세요',
    'new password should be different': '새 비밀번호는 기존 비밀번호와 달라야 합니다',
  };

  // 에러 코드로 먼저 확인
  if (errorCodeMap[code]) {
    return errorCodeMap[code];
  }

  // 에러 메시지 패턴으로 확인
  for (const [pattern, translation] of Object.entries(errorMessageMap)) {
    if (message.includes(pattern)) {
      return translation;
    }
  }

  // 기본 메시지 반환
  return error.message || '알 수 없는 오류가 발생했습니다';
}

/**
 * 에러가 Supabase Auth 에러인지 확인
 */
export function isSupabaseAuthError(error: unknown): error is SupabaseAuthError {
  return error instanceof SupabaseAuthError;
}

/**
 * 에러가 네트워크 관련 에러인지 확인
 */
export function isNetworkError(error: SupabaseAuthError | AuthError): boolean {
  return error.name === 'AuthRetryableFetchError' || error.message.includes('fetch');
}
