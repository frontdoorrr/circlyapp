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
  status: PollStatus;
  ends_at: string; // ISO 8601
  vote_count: number;
  created_at: string;
  updated_at: string;
}

export interface VoteRequest {
  voted_for_id: string; // UUID (투표 대상 사용자)
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
