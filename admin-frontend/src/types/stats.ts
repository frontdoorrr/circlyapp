// Stats API Types

export interface StatsOverview {
  total_users: number;
  total_circles: number;
  total_polls: number;
  active_polls: number;
  pending_reports: number;
  today_new_users: number;
  today_new_polls: number;
}

export interface DailyCount {
  date: string;
  count: number;
}

export interface UserStatsResponse {
  new_users: DailyCount[];
  active_users: DailyCount[];
}

export interface PollStatsResponse {
  created: DailyCount[];
  votes: DailyCount[];
}

export interface ReportStatusCount {
  status: string;
  count: number;
}

export interface ReportTypeCount {
  target_type: string;
  count: number;
}

export interface ReportStatsResponse {
  by_status: ReportStatusCount[];
  by_type: ReportTypeCount[];
  total: number;
}
