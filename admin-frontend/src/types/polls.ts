// Poll status enum
export type PollStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

// Template category enum
export type TemplateCategory = 'PERSONALITY' | 'APPEARANCE' | 'SPECIAL' | 'TALENT';

// Poll duration enum
export type PollDuration = '1H' | '3H' | '6H' | '24H';

// Poll response from API
export interface Poll {
  id: string;
  circle_id: string;
  template_id: string | null;
  creator_id: string;
  question_text: string;
  status: PollStatus;
  ends_at: string;
  vote_count: number;
  created_at: string;
  updated_at: string;
}

// Poll template response
export interface PollTemplate {
  id: string;
  category: TemplateCategory;
  question_text: string;
  emoji: string | null;
  usage_count: number;
  is_active?: boolean;
}

// Paginated poll list response
export interface PollListResponse {
  items: Poll[];
  total: number;
  limit: number;
  offset: number;
}

// Paginated template list response
export interface TemplateListResponse {
  items: PollTemplate[];
  total: number;
  limit: number;
  offset: number;
}

// Filters for poll list
export interface PollFilters {
  status?: PollStatus;
  circle_id?: string;
  limit?: number;
  offset?: number;
}

// Update poll status request
export interface UpdatePollStatusRequest {
  status: PollStatus;
}

// Status labels for UI
export const POLL_STATUS_LABELS: Record<PollStatus, string> = {
  ACTIVE: '진행 중',
  COMPLETED: '완료됨',
  CANCELLED: '취소됨',
};

// Category labels for UI
export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, { emoji: string; title: string }> = {
  PERSONALITY: { emoji: '😊', title: '성격 관련' },
  APPEARANCE: { emoji: '✨', title: '외모 관련' },
  SPECIAL: { emoji: '🎉', title: '특별한 날' },
  TALENT: { emoji: '🏆', title: '능력 관련' },
};

// Duration labels for UI
export const POLL_DURATION_LABELS: Record<PollDuration, string> = {
  '1H': '1시간',
  '3H': '3시간',
  '6H': '6시간',
  '24H': '24시간',
};

// Admin poll creation request
export interface AdminPollCreate {
  template_id?: string;
  custom_question?: string;
  duration: PollDuration;
  circle_ids?: string[];
  apply_to_all: boolean;
}

// Broadcast poll response
export interface BroadcastPollResponse {
  created_count: number;
  failed_count: number;
  polls: Poll[];
}
