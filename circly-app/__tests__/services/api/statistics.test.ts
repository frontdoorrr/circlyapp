/**
 * 통계 API 서비스 테스트
 * TRD 08-statistics-system.md의 테스트 전략 기반
 */

import { statisticsApi } from '../../../src/services/api/statistics';
import { apiClient } from '../../../src/services/api/client';
import type {
  UserStatisticsResponse,
  CircleStatisticsResponse,
  PollStatisticsResponse,
  DashboardStatisticsResponse,
  TrendingData,
  StatisticsSummary,
  StatisticsFilter,
} from '../../../src/types/statistics';

// Mock API client
jest.mock('../../../src/services/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('StatisticsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserStatistics', () => {
    const mockUserStats: UserStatisticsResponse = {
      statistics: {
        user_id: 123,
        total_votes_cast: 50,
        total_polls_created: 10,
        total_polls_participated: 45,
        circles_joined: 5,
        circles_created: 2,
        favorite_poll_categories: ['friends', 'lifestyle'],
        participation_rate: 90,
        streak_days: 15,
        last_active_date: '2024-01-15T10:30:00Z',
        created_at: '2024-01-01T00:00:00Z',
      },
      recent_activity: [
        { date: '2024-01-15', value: 5, label: 'votes' },
        { date: '2024-01-14', value: 3, label: 'votes' },
      ],
      participation_history: [
        { date: '2024-01-15', value: 100, label: 'participation_rate' },
      ],
      achievement_progress: {
        'first_vote': 100,
        'poll_creator': 50,
      },
    };

    it('should get user statistics successfully', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockUserStats });

      const result = await statisticsApi.getUserStatistics();

      expect(result).toEqual(mockUserStats);
      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/statistics/users/me?');
    });

    it('should get user statistics with userId', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockUserStats });

      const result = await statisticsApi.getUserStatistics(123);

      expect(result).toEqual(mockUserStats);
      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/statistics/users/123?');
    });

    it('should get user statistics with filter', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockUserStats });
      
      const filter: StatisticsFilter = {
        date_from: '2024-01-01',
        date_to: '2024-01-31',
        circle_id: 456,
      };

      const result = await statisticsApi.getUserStatistics(123, filter);

      expect(result).toEqual(mockUserStats);
      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/v1/statistics/users/123?date_from=2024-01-01&date_to=2024-01-31&circle_id=456'
      );
    });

    it('should handle API error', async () => {
      mockApiClient.get.mockResolvedValue({ error: 'Not found' });

      await expect(statisticsApi.getUserStatistics()).rejects.toThrow('Not found');
    });
  });

  describe('getCircleStatistics', () => {
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
        popular_poll_types: ['friends', 'food'],
        created_at: '2024-01-01T00:00:00Z',
        last_poll_date: '2024-01-15T10:30:00Z',
      },
      activity_timeline: [
        { date: '2024-01-15', value: 10, label: 'votes' },
      ],
      member_growth: [
        { date: '2024-01-15', value: 20, label: 'members' },
      ],
      poll_performance: [],
      engagement_metrics: {
        daily_active_users: 12,
        weekly_retention: 75,
      },
    };

    it('should get circle statistics successfully', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockCircleStats });

      const result = await statisticsApi.getCircleStatistics(456);

      expect(result).toEqual(mockCircleStats);
      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/statistics/circles/456?');
    });

    it('should get circle statistics with filter', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockCircleStats });
      
      const filter: StatisticsFilter = {
        date_from: '2024-01-01',
        poll_type: 'friends',
      };

      const result = await statisticsApi.getCircleStatistics(456, filter);

      expect(result).toEqual(mockCircleStats);
      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/v1/statistics/circles/456?date_from=2024-01-01&poll_type=friends'
      );
    });
  });

  describe('getPollStatistics', () => {
    const mockPollStats: PollStatisticsResponse = {
      statistics: {
        poll_id: 789,
        poll_title: 'Test Poll',
        total_votes: 25,
        participation_rate: 83.3,
        time_to_first_vote: 5,
        average_vote_time: 45,
        peak_voting_hour: 20,
        demographic_breakdown: {
          by_age_group: { '18-24': 15, '25-34': 10 },
        },
        option_statistics: [
          {
            option_id: 1,
            option_text: 'Option A',
            vote_count: 15,
            percentage: 60,
            vote_times: ['2024-01-15T10:30:00Z'],
            demographic_breakdown: {},
          },
        ],
        voting_pattern: {
          votes_by_hour: { '20': 10, '21': 8 },
          votes_by_day: { 'Monday': 15, 'Tuesday': 10 },
          early_voters: 5,
          late_voters: 3,
          peak_voting_time: '2024-01-15T20:00:00Z',
        },
        created_at: '2024-01-15T10:00:00Z',
        completed_at: '2024-01-16T10:00:00Z',
      },
      voting_timeline: [
        { date: '2024-01-15T20:00:00Z', value: 10, label: 'votes' },
      ],
      option_performance: [],
      comparison_data: {
        current_period: 25,
        previous_period: 20,
        change_percentage: 25,
        change_absolute: 5,
        trend: 'up',
      },
    };

    it('should get poll statistics successfully', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockPollStats });

      const result = await statisticsApi.getPollStatistics(789);

      expect(result).toEqual(mockPollStats);
      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/statistics/polls/789?');
    });

    it('should get poll statistics with comparison', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockPollStats });

      const result = await statisticsApi.getPollStatistics(789, true);

      expect(result).toEqual(mockPollStats);
      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/statistics/polls/789?include_comparison=true');
    });
  });

  describe('getDashboardStatistics', () => {
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
      growth_metrics: {
        daily_active_users: {
          current_period: 150,
          previous_period: 120,
          change_percentage: 25,
          change_absolute: 30,
          trend: 'up',
        },
      },
    };

    it('should get dashboard statistics successfully', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockDashboardStats });

      const result = await statisticsApi.getDashboardStatistics();

      expect(result).toEqual(mockDashboardStats);
      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/statistics/dashboard?');
    });

    it('should get dashboard statistics with filter', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockDashboardStats });
      
      const filter: StatisticsFilter = {
        circle_id: 123,
        date_from: '2024-01-01',
      };

      const result = await statisticsApi.getDashboardStatistics(filter);

      expect(result).toEqual(mockDashboardStats);
      expect(mockApiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/v1/statistics/dashboard?')
      );
      expect(mockApiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('circle_id=123')
      );
      expect(mockApiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('date_from=2024-01-01')
      );
    });
  });

  describe('getTrendingData', () => {
    const mockTrendingData: TrendingData = {
      trending_polls: [
        {
          poll_id: 1,
          poll_title: 'Popular Poll',
          circle_name: 'Popular Circle',
          vote_count: 100,
          participation_rate: 95,
          growth_rate: 50,
          created_at: '2024-01-15T10:00:00Z',
        },
      ],
      trending_circles: [],
      trending_topics: [],
      generated_at: '2024-01-15T10:30:00Z',
    };

    it('should get trending data successfully', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockTrendingData });

      const result = await statisticsApi.getTrendingData();

      expect(result).toEqual(mockTrendingData);
      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/statistics/trending?timeframe=24h');
    });

    it('should get trending data with different timeframe', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockTrendingData });

      const result = await statisticsApi.getTrendingData('7d');

      expect(result).toEqual(mockTrendingData);
      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/statistics/trending?timeframe=7d');
    });
  });

  describe('getServiceSummary', () => {
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

    it('should get service summary successfully', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockSummary });

      const result = await statisticsApi.getServiceSummary();

      expect(result).toEqual(mockSummary);
      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/statistics/summary');
    });
  });

  describe('getUserEngagementAnalysis', () => {
    const mockEngagement = {
      engagement_score: 85,
      participation_trend: 'increasing' as const,
      recommendations: ['Increase poll frequency', 'Try new poll types'],
      comparison_with_peers: 75,
    };

    it('should get user engagement analysis successfully', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockEngagement });

      const result = await statisticsApi.getUserEngagementAnalysis();

      expect(result).toEqual(mockEngagement);
      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/statistics/users/me/engagement?period=month');
    });

    it('should get user engagement analysis for specific user', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockEngagement });

      const result = await statisticsApi.getUserEngagementAnalysis(123, 'week');

      expect(result).toEqual(mockEngagement);
      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/statistics/users/123/engagement?period=week');
    });
  });

  describe('getCircleHealthAnalysis', () => {
    const mockHealth = {
      health_score: 90,
      activity_level: 'high' as const,
      member_engagement: 85,
      poll_frequency_score: 88,
      retention_rate: 92,
      recommendations: ['Great job!', 'Keep up the engagement'],
      benchmarks: {
        similar_circles_avg: 75,
        top_10_percent_threshold: 95,
      },
    };

    it('should get circle health analysis successfully', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockHealth });

      const result = await statisticsApi.getCircleHealthAnalysis(456);

      expect(result).toEqual(mockHealth);
      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/statistics/circles/456/health');
    });
  });

  describe('getPollPerformanceAnalysis', () => {
    const mockPerformance = {
      performance_score: 78,
      participation_rate: 82,
      engagement_quality: 'high' as const,
      timing_effectiveness: 85,
      content_appeal: 75,
      similar_polls_comparison: {
        better_than_percentage: 68,
        average_participation_rate: 70,
      },
      improvement_suggestions: ['Try posting at peak hours', 'Use more engaging content'],
    };

    it('should get poll performance analysis successfully', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockPerformance });

      const result = await statisticsApi.getPollPerformanceAnalysis(789);

      expect(result).toEqual(mockPerformance);
      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/statistics/polls/789/performance');
    });
  });

  describe('getActivityPatterns', () => {
    const mockPatterns = {
      hourly_pattern: { '20': 15, '21': 12, '22': 8 },
      daily_pattern: { 'Monday': 25, 'Tuesday': 20, 'Wednesday': 18 },
      peak_hours: [20, 21],
      peak_days: ['Monday', 'Tuesday'],
      activity_insights: ['Most active on Monday evenings', 'Low activity on weekends'],
    };

    it('should get activity patterns successfully', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockPatterns });

      const result = await statisticsApi.getActivityPatterns('user', 123);

      expect(result).toEqual(mockPatterns);
      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/v1/statistics/patterns/activity?scope=user&timeframe=week&scope_id=123'
      );
    });

    it('should get global activity patterns', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockPatterns });

      const result = await statisticsApi.getActivityPatterns('global', undefined, 'month');

      expect(result).toEqual(mockPatterns);
      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/v1/statistics/patterns/activity?scope=global&timeframe=month'
      );
    });
  });

  describe('exportStatistics', () => {
    it('should export statistics successfully', async () => {
      const mockBlob = new Blob(['test data'], { type: 'text/csv' });
      mockApiClient.get.mockResolvedValue({ data: mockBlob });

      const result = await statisticsApi.exportStatistics('user', 123, 'csv');

      expect(result).toBeInstanceOf(Blob);
      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/statistics/export/user/123?format=csv');
    });

    it('should export statistics with filter', async () => {
      const mockBlob = new Blob(['test data'], { type: 'application/json' });
      mockApiClient.get.mockResolvedValue({ data: mockBlob });

      const filter: StatisticsFilter = {
        date_from: '2024-01-01',
        date_to: '2024-01-31',
      };

      const result = await statisticsApi.exportStatistics('poll', 789, 'json', filter);

      expect(result).toBeInstanceOf(Blob);
      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/v1/statistics/export/poll/789?format=json&date_from=2024-01-01&date_to=2024-01-31'
      );
    });
  });
});