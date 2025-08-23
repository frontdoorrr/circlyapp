// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// HTTP Methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// API Configuration
export interface ApiConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
}

// Request types
export interface LoginRequest {
  device_id: string;
}

export interface CreateCircleRequest {
  name: string;
  description?: string;
}

export interface JoinCircleRequest {
  invite_code: string;
}

export interface CreatePollRequest {
  title: string;
  description?: string;
  question_template: string;
  circle_id: number;
  expires_at?: string;
  is_anonymous?: boolean;
  options: PollOptionCreate[];
}

export interface PollOptionCreate {
  text: string;
  user_id?: number;
  order_index?: number;
}

export interface VoteRequest {
  option_id: number;
}

// Extended Authentication Types
export interface EmailLoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  display_name?: string;
  profile_emoji?: string;
}

export interface AccountMigrationRequest {
  email: string;
  password: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  new_password: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface EmailVerificationRequest {
  token: string;
}

export interface ExtendedAuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: ExtendedUserResponse;
}

export interface ExtendedUserResponse {
  id: number;
  device_id: string;
  email?: string;
  username?: string;
  display_name?: string;
  profile_emoji: string;
  account_type: 'device' | 'email' | 'social';
  email_verified: boolean;
  email_verified_at?: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface PasswordStrengthResponse {
  score: number;
  max_score: number;
  issues: string[];
  is_valid: boolean;
}