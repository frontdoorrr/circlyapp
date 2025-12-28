/**
 * Circle Module Types
 *
 * Single Source of Truth: docs/DSL.md → Circle 모듈
 */

export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface CircleCreate {
  name: string;
  description?: string;
  max_members?: number; // default: 50
}

export interface CircleResponse {
  id: string; // UUID
  name: string;
  description: string | null;
  invite_code: string; // 6자리
  invite_code_expires_at: string; // ISO 8601
  owner_id: string; // UUID
  max_members: number;
  member_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MemberInfo {
  user_id: string; // UUID
  username: string | null;
  display_name: string | null;
  profile_emoji: string;
  nickname: string; // Circle 내 닉네임
  role: MemberRole;
  joined_at: string;
}

export interface CircleDetail extends CircleResponse {
  members: MemberInfo[];
}

export interface JoinByCodeRequest {
  invite_code: string; // 6자리
  nickname: string; // Circle 내 사용할 닉네임
}

export interface RegenerateInviteCodeResponse {
  invite_code: string;
  invite_code_expires_at: string;
}
