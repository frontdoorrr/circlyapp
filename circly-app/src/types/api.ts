// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// HTTP Methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// API Configuration
export interface ApiConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
}

// Request types
export interface LoginRequest {
  device_id: string;
}

export interface CreateCircleRequest {
  name: string;
  description?: string;
}

export interface JoinCircleRequest {
  invite_code: string;
}

export interface CreatePollRequest {
  title: string;
  description?: string;
  question_template: string;
  circle_id: number;
  expires_at?: string;
  is_anonymous?: boolean;
  options: PollOptionCreate[];
}

export interface PollOptionCreate {
  text: string;
  user_id?: number;
  order_index?: number;
}

export interface VoteRequest {
  option_id: number;
}