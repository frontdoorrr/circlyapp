/**
 * Common API Types
 *
 * Standard API response format from CLAUDE.md
 */

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Common Error Codes
export type AuthErrorCode =
  | 'AUTH_REQUIRED'
  | 'INVALID_CREDENTIALS'
  | 'TOKEN_EXPIRED'
  | 'EMAIL_ALREADY_EXISTS';

export type CircleErrorCode =
  | 'CIRCLE_NOT_FOUND'
  | 'INVALID_INVITE_CODE'
  | 'CIRCLE_FULL'
  | 'ALREADY_MEMBER'
  | 'NOT_CIRCLE_MEMBER'
  | 'INSUFFICIENT_PERMISSIONS';

export type PollErrorCode =
  | 'POLL_NOT_FOUND'
  | 'POLL_ENDED'
  | 'ALREADY_VOTED'
  | 'SELF_VOTE_NOT_ALLOWED'
  | 'MAX_POLLS_EXCEEDED'
  | 'NOT_CIRCLE_MEMBER';

export type ErrorCode = AuthErrorCode | CircleErrorCode | PollErrorCode;

export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public status?: number // HTTP 상태 코드 (선택)
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
