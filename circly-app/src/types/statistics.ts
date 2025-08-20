/**
 * 통계 관련 타입 정의
 * TRD 08-statistics-system.md의 통계 시스템 요구사항 기반
 */

export interface UserStatistics {
  user_id: number;
  total_votes_cast: number;
  total_polls_created: number;
  total_polls_participated: number;
  circles_joined: number;
  circles_created: number;
  favorite_poll_categories: string[];
  participation_rate: number; // 0-100
  streak_days: number;
  last_active_date: string;
  created_at: string;
}

export interface CircleStatistics {
  circle_id: number;
  circle_name: string;
  total_members: number;
  active_members_last_week: number;
  total_polls_created: number;
  total_votes_cast: number;
  average_participation_rate: number; // 0-100
  most_active_day: string; // day of week
  most_active_hour: number; // 0-23
  popular_poll_types: string[];
  created_at: string;
  last_poll_date?: string;
}

export interface PollStatistics {
  poll_id: number;
  poll_title: string;
  total_votes: number;
  participation_rate: number; // votes / circle members
  time_to_first_vote: number; // minutes
  average_vote_time: number; // minutes from poll creation
  peak_voting_hour: number; // 0-23
  demographic_breakdown: DemographicBreakdown;
  option_statistics: OptionStatistics[];
  voting_pattern: VotingPattern;
  created_at: string;
  completed_at?: string;
}

export interface OptionStatistics {
  option_id: number;
  option_text: string;
  vote_count: number;
  percentage: number;
  vote_times: string[]; // timestamps when this option was voted
  demographic_breakdown: DemographicBreakdown;
}

export interface DemographicBreakdown {
  by_age_group?: { [ageGroup: string]: number };
  by_gender?: { [gender: string]: number };
  by_join_date?: { [period: string]: number }; // new vs old members
}

export interface VotingPattern {
  votes_by_hour: { [hour: string]: number }; // 0-23
  votes_by_day: { [day: string]: number }; // day of week
  early_voters: number; // voted in first 10% of poll duration
  late_voters: number; // voted in last 10% of poll duration
  peak_voting_time: string; // timestamp of highest activity
}

export interface TrendingData {
  trending_polls: TrendingPoll[];
  trending_circles: TrendingCircle[];
  trending_topics: TrendingTopic[];
  generated_at: string;
}

export interface TrendingPoll {
  poll_id: number;
  poll_title: string;
  circle_name: string;
  vote_count: number;
  participation_rate: number;
  growth_rate: number; // percentage increase in last 24h
  created_at: string;
}

export interface TrendingCircle {
  circle_id: number;
  circle_name: string;
  member_count: number;
  active_polls: number;
  growth_rate: number; // new members in last 7 days
  activity_score: number; // calculated activity metric
}

export interface TrendingTopic {
  topic: string;
  poll_count: number;
  total_votes: number;
  growth_rate: number;
  related_keywords: string[];
}

export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

export interface ComparisonData {
  current_period: number;
  previous_period: number;
  change_percentage: number;
  change_absolute: number;
  trend: 'up' | 'down' | 'stable';
}

export interface StatisticsFilter {
  date_from?: string;
  date_to?: string;
  circle_id?: number;
  user_id?: number;
  poll_type?: string;
  include_inactive?: boolean;
}

export interface StatisticsSummary {
  total_users: number;
  active_users_today: number;
  active_users_week: number;
  total_circles: number;
  active_circles: number;
  total_polls: number;
  active_polls: number;
  total_votes_today: number;
  total_votes_week: number;
  total_votes_all_time: number;
  average_daily_active_users: number;
  user_retention_rate: number;
  poll_completion_rate: number;
}

// API 응답 타입들
export interface UserStatisticsResponse {
  statistics: UserStatistics;
  recent_activity: TimeSeriesData[];
  participation_history: TimeSeriesData[];
  achievement_progress: { [achievement: string]: number };
}

export interface CircleStatisticsResponse {
  statistics: CircleStatistics;
  activity_timeline: TimeSeriesData[];
  member_growth: TimeSeriesData[];
  poll_performance: PollStatistics[];
  engagement_metrics: { [metric: string]: number };
}

export interface PollStatisticsResponse {
  statistics: PollStatistics;
  voting_timeline: TimeSeriesData[];
  option_performance: OptionStatistics[];
  comparison_data?: ComparisonData;
}

export interface DashboardStatisticsResponse {
  summary: StatisticsSummary;
  trending: TrendingData;
  recent_activities: ActivityItem[];
  growth_metrics: { [metric: string]: ComparisonData };
}

export interface ActivityItem {
  id: number;
  type: 'poll_created' | 'vote_cast' | 'circle_joined' | 'poll_completed';
  user_name?: string;
  poll_title?: string;
  circle_name?: string;
  timestamp: string;
  metadata?: { [key: string]: any };
}

export default {
  UserStatistics,
  CircleStatistics,
  PollStatistics,
  TrendingData,
  StatisticsSummary,
};