/**
 * Poll Module Types
 *
 * Single Source of Truth: docs/DSL.md → Poll 모듈
 */

export type TemplateCategory = 'APPEARANCE' | 'PERSONALITY' | 'TALENT' | 'SPECIAL';
export type PollStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type PollDuration = '1H' | '3H' | '6H' | '24H';

export interface PollTemplateResponse {
  id: string; // UUID
  category: TemplateCategory;
  question_text: string;
  emoji: string | null;
  usage_count: number;
}

export interface PollCreate {
  template_id: string; // UUID
  duration: PollDuration;
  question_text?: string; // 템플릿 텍스트 오버라이드 (선택)
}

export interface PollResponse {
  id: string; // UUID
  circle_id: string;
  template_id: string;
  creator_id: string;
  question_text: string;
  question: string; // Alias for question_text
  status: PollStatus;
  ends_at: string; // ISO 8601
  vote_count: number;
  created_at: string;
  updated_at: string;
  // Extended fields for Home Tab
  emoji?: string;
  circle_name?: string;
  total_members?: number;
  has_voted?: boolean;
  // Winner info for completed polls
  winner_name?: string;
  winner_vote_count?: number;
}

export interface VoteRequest {
  voted_for_id: string; // UUID (투표 대상 사용자)
}

export type PollCandidatesStatus = 'READY' | 'NOT_ENOUGH_CANDIDATES';

export interface CandidateOption {
  user_id: string;
  nickname: string | null;
  profile_emoji: string;
  received_count: number;
}

export interface PollCandidatesResponse {
  poll_id: string;
  status: PollCandidatesStatus;
  required_count: number;
  candidates: CandidateOption[];
}

export type VoteSessionStatus = 'ACTIVE' | 'COMPLETED';

export interface VoteSessionCreate {
  circle_id?: string;
}

export interface VoteSessionResponse {
  id: string;
  user_id: string;
  circle_id: string | null;
  status: VoteSessionStatus;
  poll_ids: string[];
  skipped_poll_ids: string[];
  current_index: number;
  total_count: number;
  current_poll_id: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface VoteResponse {
  success: boolean;
  results: PollResultItem[]; // 투표 후 실시간 결과
  message: string;
}

export interface PollResultItem {
  user_id: string;
  nickname: string | null; // Circle 내 닉네임
  profile_emoji: string;
  vote_count: number;
  vote_percentage: number;
  rank: number | null; // 순위 (동률 시 null 가능)
}

export interface PollDetailResponse extends PollResponse {
  results: PollResultItem[];
  has_voted: boolean;
}

export interface CategoryInfo {
  category: TemplateCategory;
  emoji: string;
  title: string;
  question_count: number;
}

export interface ReceivedHeartHint {
  circle_name: string;
  time_label: string;
}

export interface ReceivedHeartItem {
  poll_id: string;
  circle_id: string;
  circle_name: string;
  question_text: string;
  emoji: string | null;
  received_count: number;
  latest_received_at: string;
  is_read: boolean;
  free_hint: ReceivedHeartHint;
}

// ==================== Orb Mode Types ====================

/**
 * Orb Mode 투표자 정보 - 나를 선택한 사람
 */
export interface VoterInfo {
  user_id: string;
  nickname: string | null;
  profile_emoji: string;
  voted_at: string; // ISO 8601
}

/**
 * Orb Mode API 응답 - 나를 선택한 투표자 목록
 */
export interface VoterRevealResponse {
  poll_id: string;
  question_text: string;
  voters: VoterInfo[];
}
