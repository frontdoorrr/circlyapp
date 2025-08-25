// Removed UserResponse import as it's not used

// Poll Option types
export interface PollOption {
  id: string; // UUID
  poll_id: string;
  member_id: number;
  member_nickname: string;
  display_order: number;
  vote_count: number;
  created_at: string;
}

export interface PollOptionCreate {
  text: string;
  user_id?: number;
  order_index?: number;
}

// Poll types
export interface Poll {
  id: number;
  title: string;
  description?: string;
  question_template: string;
  circle_id: number;
  creator_id: number;
  expires_at?: string;
  is_active: boolean;
  is_anonymous: boolean;
  created_at: string;
  updated_at?: string;
}

export interface PollResponse {
  id: string; // UUID
  question_text: string; // 백엔드의 question_text
  circle_id: number;
  circle_name?: string; // Circle 이름 (선택적)
  creator_id: number;
  template_id?: string;
  deadline: string; // 백엔드의 deadline
  is_active: boolean;
  is_anonymous: boolean;
  is_closed: boolean;
  max_votes_per_user: number;
  total_votes: number;
  total_participants: number;
  created_at: string;
  options: PollOption[];
  user_voted: boolean;
  user_vote_option_id?: string;
}

export interface PollCreate {
  title: string;
  description?: string;
  question_template: string;
  circle_id: number;
  expires_at?: string;
  is_anonymous?: boolean;
  options: PollOptionCreate[];
}

export interface PollUpdate {
  title?: string;
  description?: string;
  expires_at?: string;
  is_active?: boolean;
}

// Vote types
export interface Vote {
  id: number;
  poll_id: number;
  option_id: number;
  user_id: number;
  voted_at: string;
}

export interface VoteCreate {
  option_id: string; // UUID
}

export interface VoteResult {
  option_id: string; // UUID
  vote_count: number;
  percentage: number;
}

// Poll participation types
export interface PollParticipation {
  poll_id: string; // UUID
  has_voted: boolean;
  selected_option_id?: string;
  voted_at?: string;
}

// Poll state
export interface PollState {
  polls: PollResponse[];
  currentPoll: PollResponse | null;
  loading: boolean;
  error: string | null;
}

// Poll template types
export interface PollTemplate {
  id: string;
  title: string;
  question: string;
  category: string;
  description?: string;
  defaultOptions?: string[];
}