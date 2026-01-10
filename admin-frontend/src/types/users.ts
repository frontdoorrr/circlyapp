// Users API Types

export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  supabase_user_id: string | null;
  username: string | null;
  display_name: string | null;
  profile_emoji: string;
  role: UserRole;
  is_active: boolean;
  is_orb_mode: boolean;
  created_at: string;
}

export interface UserListResponse {
  items: User[];
  total: number;
  limit: number;
  offset: number;
}

export interface UpdateUserStatusRequest {
  is_active: boolean;
}

export interface UpdateUserRoleRequest {
  role: UserRole;
}

// Filter options
export interface UserFilters {
  search?: string;
  is_active?: boolean;
  role?: UserRole;
  limit?: number;
  offset?: number;
}

// Labels for display
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  USER: '일반 사용자',
  ADMIN: '관리자',
};

// Role colors for badges
export const USER_ROLE_COLORS: Record<UserRole, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  USER: 'secondary',
  ADMIN: 'default',
};
