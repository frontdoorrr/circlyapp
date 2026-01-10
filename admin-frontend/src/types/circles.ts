// Circles API Types

export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface Circle {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  invite_link_id: string | null;
  owner_id: string;
  max_members: number;
  member_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MemberInfo {
  id: string;
  user_id: string;
  role: MemberRole;
  nickname: string | null;
  joined_at: string;
  username: string | null;
  display_name: string | null;
  profile_emoji: string;
}

export interface CircleDetail extends Circle {
  members: MemberInfo[];
}

export interface CircleListResponse {
  items: Circle[];
  total: number;
  limit: number;
  offset: number;
}

export interface UpdateCircleStatusRequest {
  is_active: boolean;
}

// Filter options
export interface CircleFilters {
  search?: string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
}

// Labels for display
export const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  OWNER: '소유자',
  ADMIN: '관리자',
  MEMBER: '멤버',
};

// Role colors for badges
export const MEMBER_ROLE_COLORS: Record<MemberRole, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  OWNER: 'default',
  ADMIN: 'secondary',
  MEMBER: 'outline',
};
