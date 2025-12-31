/**
 * Auth Module Types
 *
 * Single Source of Truth: docs/DSL.md → Auth 모듈
 */

export type UserRole = 'USER' | 'ADMIN';

export interface UserCreate {
  email: string;
  password: string;
  username?: string;
  display_name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string; // UUID
  email: string;
  supabase_user_id: string | null; // Supabase Auth user ID
  username: string | null;
  display_name: string | null;
  profile_emoji: string;
  role: UserRole;
  is_active: boolean;
  created_at: string; // ISO 8601
}

export interface AuthResponse {
  user: UserResponse;
  access_token: string;
  token_type: string; // "bearer"
}

export interface UserUpdate {
  username?: string;
  display_name?: string;
  profile_emoji?: string;
}

export interface TokenPayload {
  sub: string; // user_id
  exp: number;
  email: string;
}
