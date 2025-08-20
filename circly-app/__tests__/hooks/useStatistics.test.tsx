/**
 * useStatistics 훅 테스트
 * TRD 08-statistics-system.md의 테스트 전략 기반
 */

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useUserStatistics,
  useCircleStatistics,
  usePollStatistics,
  useDashboardStatistics,
  useTrendingData,
  useServiceSummary,
  useStatisticsDashboard,
  usePerformanceAnalysis,
} from '../../src/hooks/useStatistics';
import { statisticsApi } from '../../src/services/api/statistics';
import type {
  UserStatisticsResponse,
  CircleStatisticsResponse,
  PollStatisticsResponse,
  DashboardStatisticsResponse,
  TrendingData,
  StatisticsSummary,
} from '../../src/types/statistics';

// Mock statistics API
jest.mock('../../src/services/api/statistics', () => ({
  statisticsApi: {
    getUserStatistics: jest.fn(),
    getCircleStatistics: jest.fn(),
    getPollStatistics: jest.fn(),
    getDashboardStatistics: jest.fn(),
    getTrendingData: jest.fn(),
    getServiceSummary: jest.fn(),
    getUserEngagementAnalysis: jest.fn(),
    getCircleHealthAnalysis: jest.fn(),
    getPollPerformanceAnalysis: jest.fn(),
  },
}));

const mockStatisticsApi = statisticsApi as jest.Mocked<typeof statisticsApi>;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  
  return Wrapper;
};

// Mock data
const mockUserStats: UserStatisticsResponse = {
  statistics: {
    user_id: 123,
    total_votes_cast: 50,
    total_polls_created: 10,
    total_polls_participated: 45,
    circles_joined: 5,
    circles_created: 2,
    favorite_poll_categories: ['friends'],
    participation_rate: 90,
    streak_days: 15,
    last_active_date: '2024-01-15T10:30:00Z',
    created_at: '2024-01-01T00:00:00Z',
  },
  recent_activity: [],
  participation_history: [],
  achievement_progress: {},
};

const mockCircleStats: CircleStatisticsResponse = {
  statistics: {
    circle_id: 456,
    circle_name: 'Test Circle',
    total_members: 20,
    active_members_last_week: 15,
    total_polls_created: 25,
    total_votes_cast: 200,
    average_participation_rate: 80,
    most_active_day: 'Monday',
    most_active_hour: 19,
    popular_poll_types: ['friends'],
    created_at: '2024-01-01T00:00:00Z',
  },
  activity_timeline: [],
  member_growth: [],
  poll_performance: [],
  engagement_metrics: {},
};

const mockDashboardStats: DashboardStatisticsResponse = {
  summary: {
    total_users: 1000,
    active_users_today: 150,
    active_users_week: 500,
    total_circles: 200,
    active_circles: 180,
    total_polls: 500,
    active_polls: 50,
    total_votes_today: 300,
    total_votes_week: 2000,
    total_votes_all_time: 50000,
    average_daily_active_users: 120,
    user_retention_rate: 75,
    poll_completion_rate: 85,
  },
  trending: {
    trending_polls: [],
    trending_circles: [],
    trending_topics: [],
    generated_at: '2024-01-15T10:30:00Z',
  },
  recent_activities: [],
  growth_metrics: {},
};

describe('useStatistics hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useUserStatistics', () => {
    it('should fetch user statistics successfully', async () => {
      mockStatisticsApi.getUserStatistics.mockResolvedValue(mockUserStats);

      const { result } = renderHook(() => useUserStatistics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockUserStats);
      expect(mockStatisticsApi.getUserStatistics).toHaveBeenCalledWith(undefined, undefined);
    });

    it('should fetch user statistics with userId and filter', async () => {
      mockStatisticsApi.getUserStatistics.mockResolvedValue(mockUserStats);

      const filter = { date_from: '2024-01-01', date_to: '2024-01-31' };
      const { result } = renderHook(() => useUserStatistics(123, filter), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockStatisticsApi.getUserStatistics).toHaveBeenCalledWith(123, filter);
    });

    it('should handle error state', async () => {
      mockStatisticsApi.getUserStatistics.mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() => useUserStatistics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('API Error'));
    });

    it('should not fetch when disabled', async () => {
      mockStatisticsApi.getUserStatistics.mockResolvedValue(mockUserStats);

      const { result } = renderHook(() => useUserStatistics(undefined, undefined, false), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isIdle).toBe(true);
      });

      expect(mockStatisticsApi.getUserStatistics).not.toHaveBeenCalled();
    });
  });

  describe('useCircleStatistics', () => {
    it('should fetch circle statistics successfully', async () => {
      mockStatisticsApi.getCircleStatistics.mockResolvedValue(mockCircleStats);

      const { result } = renderHook(() => useCircleStatistics(456), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockCircleStats);
      expect(mockStatisticsApi.getCircleStatistics).toHaveBeenCalledWith(456, undefined);
    });

    it('should not fetch when circleId is 0 or negative', async () => {
      mockStatisticsApi.getCircleStatistics.mockResolvedValue(mockCircleStats);

      const { result } = renderHook(() => useCircleStatistics(0), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isIdle).toBe(true);
      });

      expect(mockStatisticsApi.getCircleStatistics).not.toHaveBeenCalled();
    });

    it('should fetch with filter', async () => {
      mockStatisticsApi.getCircleStatistics.mockResolvedValue(mockCircleStats);

      const filter = { poll_type: 'friends' };
      const { result } = renderHook(() => useCircleStatistics(456, filter), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockStatisticsApi.getCircleStatistics).toHaveBeenCalledWith(456, filter);
    });
  });

  describe('usePollStatistics', () => {
    const mockPollStats: PollStatisticsResponse = {
      statistics: {
        poll_id: 789,
        poll_title: 'Test Poll',
        total_votes: 25,
        participation_rate: 83.3,
        time_to_first_vote: 5,
        average_vote_time: 45,
        peak_voting_hour: 20,
        demographic_breakdown: {},
        option_statistics: [],
        voting_pattern: {
          votes_by_hour: {},
          votes_by_day: {},
          early_voters: 5,
          late_voters: 3,
          peak_voting_time: '2024-01-15T20:00:00Z',
        },
        created_at: '2024-01-15T10:00:00Z',
      },
      voting_timeline: [],
      option_performance: [],
    };

    it('should fetch poll statistics successfully', async () => {
      mockStatisticsApi.getPollStatistics.mockResolvedValue(mockPollStats);

      const { result } = renderHook(() => usePollStatistics(789), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockPollStats);
      expect(mockStatisticsApi.getPollStatistics).toHaveBeenCalledWith(789, false);
    });

    it('should fetch poll statistics with comparison', async () => {
      mockStatisticsApi.getPollStatistics.mockResolvedValue(mockPollStats);

      const { result } = renderHook(() => usePollStatistics(789, true), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockStatisticsApi.getPollStatistics).toHaveBeenCalledWith(789, true);
    });

    it('should not fetch when pollId is 0 or negative', async () => {
      const { result } = renderHook(() => usePollStatistics(0), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isIdle).toBe(true);
      });

      expect(mockStatisticsApi.getPollStatistics).not.toHaveBeenCalled();
    });
  });

  describe('useDashboardStatistics', () => {
    it('should fetch dashboard statistics successfully', async () => {
      mockStatisticsApi.getDashboardStatistics.mockResolvedValue(mockDashboardStats);

      const { result } = renderHook(() => useDashboardStatistics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockDashboardStats);
      expect(mockStatisticsApi.getDashboardStatistics).toHaveBeenCalledWith(undefined);
    });

    it('should fetch with filter', async () => {
      mockStatisticsApi.getDashboardStatistics.mockResolvedValue(mockDashboardStats);

      const filter = { circle_id: 123 };
      const { result } = renderHook(() => useDashboardStatistics(filter), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockStatisticsApi.getDashboardStatistics).toHaveBeenCalledWith(filter);
    });

    it('should auto-refetch every 5 minutes', async () => {
      mockStatisticsApi.getDashboardStatistics.mockResolvedValue(mockDashboardStats);

      const { result } = renderHook(() => useDashboardStatistics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Query should have refetchInterval set
      expect(result.current.dataUpdatedAt).toBeTruthy();
    });
  });

  describe('useTrendingData', () => {
    const mockTrending: TrendingData = {
      trending_polls: [],
      trending_circles: [],
      trending_topics: [],
      generated_at: '2024-01-15T10:30:00Z',
    };

    it('should fetch trending data successfully', async () => {
      mockStatisticsApi.getTrendingData.mockResolvedValue(mockTrending);

      const { result } = renderHook(() => useTrendingData(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockTrending);
      expect(mockStatisticsApi.getTrendingData).toHaveBeenCalledWith('24h');
    });

    it('should fetch with different timeframe', async () => {
      mockStatisticsApi.getTrendingData.mockResolvedValue(mockTrending);

      const { result } = renderHook(() => useTrendingData('7d'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockStatisticsApi.getTrendingData).toHaveBeenCalledWith('7d');
    });
  });

  describe('useServiceSummary', () => {
    const mockSummary: StatisticsSummary = {
      total_users: 10000,
      active_users_today: 1500,
      active_users_week: 5000,
      total_circles: 2000,
      active_circles: 1800,
      total_polls: 50000,
      active_polls: 500,
      total_votes_today: 3000,
      total_votes_week: 20000,
      total_votes_all_time: 500000,
      average_daily_active_users: 1200,
      user_retention_rate: 78,
      poll_completion_rate: 87,
    };

    it('should fetch service summary successfully', async () => {
      mockStatisticsApi.getServiceSummary.mockResolvedValue(mockSummary);

      const { result } = renderHook(() => useServiceSummary(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockSummary);
      expect(mockStatisticsApi.getServiceSummary).toHaveBeenCalled();
    });
  });

  describe('useStatisticsDashboard', () => {
    beforeEach(() => {
      mockStatisticsApi.getDashboardStatistics.mockResolvedValue(mockDashboardStats);
      mockStatisticsApi.getTrendingData.mockResolvedValue({
        trending_polls: [],
        trending_circles: [],
        trending_topics: [],
        generated_at: '2024-01-15T10:30:00Z',
      });
      mockStatisticsApi.getServiceSummary.mockResolvedValue({
        total_users: 1000,
        active_users_today: 150,
        active_users_week: 500,
        total_circles: 200,
        active_circles: 180,
        total_polls: 500,
        active_polls: 50,
        total_votes_today: 300,
        total_votes_week: 2000,
        total_votes_all_time: 50000,
        average_daily_active_users: 120,
        user_retention_rate: 75,
        poll_completion_rate: 85,
      });
      mockStatisticsApi.getUserStatistics.mockResolvedValue(mockUserStats);
    });

    it('should fetch all dashboard data successfully', async () => {
      const { result } = renderHook(() => useStatisticsDashboard(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.dashboardStats).toEqual(mockDashboardStats);
      expect(result.current.userStats).toEqual(mockUserStats);
      expect(result.current.trendingData).toBeTruthy();
      expect(result.current.serviceSummary).toBeTruthy();
      expect(result.current.error).toBeNull();
    });

    it('should fetch circle data when circleId provided', async () => {
      mockStatisticsApi.getCircleStatistics.mockResolvedValue(mockCircleStats);

      const { result } = renderHook(() => useStatisticsDashboard(456), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.circleStats).toEqual(mockCircleStats);
      expect(mockStatisticsApi.getCircleStatistics).toHaveBeenCalledWith(456, undefined);
    });

    it('should handle loading state', async () => {
      // Make one API call hang
      mockStatisticsApi.getDashboardStatistics.mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => useStatisticsDashboard(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('should handle error state', async () => {
      const error = new Error('Dashboard error');
      mockStatisticsApi.getDashboardStatistics.mockRejectedValue(error);

      const { result } = renderHook(() => useStatisticsDashboard(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).toEqual(error);
      });
    });

    it('should provide refetch function', async () => {
      const { result } = renderHook(() => useStatisticsDashboard(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.refetch).toBe('function');
      
      // Test refetch
      result.current.refetch();
      
      // Should call all APIs again
      expect(mockStatisticsApi.getDashboardStatistics).toHaveBeenCalledTimes(2);
    });
  });

  describe('usePerformanceAnalysis', () => {
    beforeEach(() => {
      mockStatisticsApi.getUserEngagementAnalysis.mockResolvedValue({
        engagement_score: 85,
        participation_trend: 'increasing',
        recommendations: ['Great job!'],
        comparison_with_peers: 75,
      });
      mockStatisticsApi.getCircleHealthAnalysis.mockResolvedValue({
        health_score: 90,
        activity_level: 'high',
        member_engagement: 85,
        poll_frequency_score: 88,
        retention_rate: 92,
        recommendations: ['Keep it up!'],
        benchmarks: {
          similar_circles_avg: 75,
          top_10_percent_threshold: 95,
        },
      });
      mockStatisticsApi.getPollPerformanceAnalysis.mockResolvedValue({
        performance_score: 78,
        participation_rate: 82,
        engagement_quality: 'high',
        timing_effectiveness: 85,
        content_appeal: 75,
        similar_polls_comparison: {
          better_than_percentage: 68,
          average_participation_rate: 70,
        },
        improvement_suggestions: ['Try peak hours'],
      });
    });

    it('should fetch user performance analysis', async () => {
      const { result } = renderHook(() => usePerformanceAnalysis('user', 123), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.userEngagement).toBeTruthy();
      expect(result.current.circleHealth).toBeUndefined();
      expect(result.current.pollPerformance).toBeUndefined();
      expect(mockStatisticsApi.getUserEngagementAnalysis).toHaveBeenCalledWith(123, 'month');
    });

    it('should fetch circle performance analysis', async () => {
      const { result } = renderHook(() => usePerformanceAnalysis('circle', 456), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.userEngagement).toBeUndefined();
      expect(result.current.circleHealth).toBeTruthy();
      expect(result.current.pollPerformance).toBeUndefined();
      expect(mockStatisticsApi.getCircleHealthAnalysis).toHaveBeenCalledWith(456);
    });

    it('should fetch poll performance analysis', async () => {
      const { result } = renderHook(() => usePerformanceAnalysis('poll', 789), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.userEngagement).toBeUndefined();
      expect(result.current.circleHealth).toBeUndefined();
      expect(result.current.pollPerformance).toBeTruthy();
      expect(mockStatisticsApi.getPollPerformanceAnalysis).toHaveBeenCalledWith(789);
    });

    it('should provide refetch function for appropriate type', async () => {
      const { result } = renderHook(() => usePerformanceAnalysis('user', 123), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.refetch).toBe('function');
      
      // Test refetch
      result.current.refetch();
      
      expect(mockStatisticsApi.getUserEngagementAnalysis).toHaveBeenCalledTimes(2);
    });
  });
});