import { UserResponse } from './user';

// Circle types
export interface Circle {
  id: number;
  name: string;
  description?: string;
  invite_code: string;
  creator_id: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CircleResponse {
  id: number;
  name: string;
  description?: string;
  invite_code: string;
  creator_id: number;
  is_active: boolean;
  created_at: string;
  member_count: number;
}

export interface CircleCreate {
  name: string;
  description?: string;
}

export interface CircleUpdate {
  name?: string;
  description?: string;
}

// Circle Member types
export interface CircleMember {
  id: number;
  circle_id: number;
  user_id: number;
  role: 'admin' | 'member';
  joined_at: string;
  user?: UserResponse;
}

export interface CircleMemberCreate {
  circle_id: number;
  user_id: number;
  role?: 'admin' | 'member';
}

export interface CircleJoinRequest {
  invite_code: string;
}

// Circle state
export interface CircleState {
  circles: CircleResponse[];
  currentCircle: CircleResponse | null;
  members: CircleMember[];
  loading: boolean;
  error: string | null;
}