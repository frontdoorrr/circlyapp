// User types
export interface User {
  id: number;
  device_id: string;
  username?: string;
  display_name?: string;
  profile_emoji: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface UserResponse {
  id: number;
  username?: string;
  display_name?: string;
  profile_emoji: string;
  is_active: boolean;
  created_at: string;
}

export interface UserCreate {
  device_id: string;
  username?: string;
  display_name?: string;
  profile_emoji?: string;
}

export interface UserUpdate {
  username?: string;
  display_name?: string;
  profile_emoji?: string;
}

// Auth types
export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserResponse | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}