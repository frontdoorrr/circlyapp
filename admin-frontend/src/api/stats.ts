import { apiClient } from './client';
import type {
  StatsOverview,
  UserStatsResponse,
  PollStatsResponse,
  ReportStatsResponse,
} from '@/types/stats';

export const statsApi = {
  /**
   * Get overview statistics
   */
  getOverview: async (): Promise<StatsOverview> => {
    const response = await apiClient.get<StatsOverview>('/admin/stats/overview');
    return response.data;
  },

  /**
   * Get user statistics
   */
  getUserStats: async (days: number = 30): Promise<UserStatsResponse> => {
    const response = await apiClient.get<UserStatsResponse>('/admin/stats/users', {
      params: { days },
    });
    return response.data;
  },

  /**
   * Get poll statistics
   */
  getPollStats: async (days: number = 30): Promise<PollStatsResponse> => {
    const response = await apiClient.get<PollStatsResponse>('/admin/stats/polls', {
      params: { days },
    });
    return response.data;
  },

  /**
   * Get report statistics
   */
  getReportStats: async (): Promise<ReportStatsResponse> => {
    const response = await apiClient.get<ReportStatsResponse>('/admin/stats/reports');
    return response.data;
  },
};
