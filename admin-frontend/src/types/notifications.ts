// Notifications Admin API Types

export interface BroadcastRequest {
  title: string;
  body: string;
}

export interface BroadcastResponse {
  id: string;
  target_count: number;
  sent_count: number;
  message: string;
}

export interface BroadcastLog {
  id: string;
  admin_id: string | null;
  title: string;
  body: string;
  target_count: number;
  sent_count: number;
  created_at: string;
  admin_email: string | null;
}

export interface BroadcastHistoryResponse {
  items: BroadcastLog[];
  total: number;
  limit: number;
  offset: number;
}
