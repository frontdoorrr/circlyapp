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
  invite_link_id: string | null; // 초대 링크 ID (UUID, 영구 사용)
  owner_id: string; // UUID
  max_members: number;
  member_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MemberInfo {
  id: string; // Membership ID (UUID)
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
  nickname?: string; // Circle 내 사용할 닉네임 (선택)
}

export interface RegenerateInviteCodeResponse {
  invite_code: string;
  message: string; // 성공 메시지
  invite_code_expires_at?: string; // 만료 시간 (선택, 백엔드 확인 필요)
}

export interface ValidateInviteCodeResponse {
  valid: boolean;
  circle_name: string | null;
  circle_id: string | null; // UUID
  member_count: number | null;
  max_members: number | null;
  message: string | null;
}
