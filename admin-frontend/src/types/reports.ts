// Reports API Types

export type ReportStatus = 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';
export type ReportTargetType = 'USER' | 'CIRCLE' | 'POLL';
export type ReportReason = 'INAPPROPRIATE' | 'SPAM' | 'HARASSMENT' | 'OTHER';

export interface Report {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface ReportListResponse {
  items: Report[];
  total: number;
  limit: number;
  offset: number;
}

export interface ReportReviewRequest {
  status: ReportStatus;
  notes?: string;
}

// Filter options
export interface ReportFilters {
  status?: ReportStatus;
  target_type?: ReportTargetType;
  limit?: number;
  offset?: number;
}

// Labels for display
export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  PENDING: '대기 중',
  REVIEWED: '검토 완료',
  RESOLVED: '해결됨',
  DISMISSED: '기각됨',
};

export const REPORT_TARGET_TYPE_LABELS: Record<ReportTargetType, string> = {
  USER: '사용자',
  CIRCLE: 'Circle',
  POLL: '투표',
};

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  INAPPROPRIATE: '부적절한 콘텐츠',
  SPAM: '스팸',
  HARASSMENT: '괴롭힘',
  OTHER: '기타',
};

// Status colors for badges
export const REPORT_STATUS_COLORS: Record<ReportStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PENDING: 'destructive',
  REVIEWED: 'secondary',
  RESOLVED: 'default',
  DISMISSED: 'outline',
};
