import { UserResponse } from './user';

// Poll Option types
export interface PollOption {
  id: number;
  poll_id: number;
  text: string;
  user_id?: number;
  order_index: number;
  user?: UserResponse;
  vote_count: number;
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
  options: PollOption[];
  total_votes: number;
  user_voted: boolean;
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
  option_id: number;
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