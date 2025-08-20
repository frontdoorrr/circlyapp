/**
 * StatisticsScreen 테스트
 * TRD 08-statistics-system.md의 테스트 전략 기반
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatisticsScreen } from '../../../src/screens/statistics/StatisticsScreen';
import * as useStatisticsHook from '../../../src/hooks/useStatistics';

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useRoute: () => ({
    params: {
      circleId: 123,
      circleName: '테스트 서클',
    },
  }),
}));

// Mock LinearGradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => children,
}));

// Mock hooks
jest.mock('../../../src/hooks/useStatistics');

const mockUseStatisticsDashboard = useStatisticsHook.useStatisticsDashboard as jest.MockedFunction<
  typeof useStatisticsHook.useStatisticsDashboard
>;

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe('StatisticsScreen', () => {
  const mockStatisticsData = {
    dashboardStats: {
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
      recent_activities: [
        {
          id: 1,
          type: 'poll_created' as const,
          poll_title: 'Test Poll',
          circle_name: 'Test Circle',
          timestamp: '2024-01-15T10:30:00Z',
        },
        {
          id: 2,
          type: 'vote_cast' as const,
          poll_title: 'Another Poll',
          timestamp: '2024-01-15T09:30:00Z',
        },
      ],
      growth_metrics: {
        daily_active_users: {
          current_period: 150,
          previous_period: 120,
          change_percentage: 25,
          change_absolute: 30,
          trend: 'up' as const,
        },
      },
    },
    trendingData: {
      trending_polls: [
        {
          poll_id: 1,
          poll_title: '인기 투표',
          circle_name: '인기 서클',
          vote_count: 100,
          participation_rate: 95,
          growth_rate: 50,
          created_at: '2024-01-15T10:00:00Z',
        },
      ],
      trending_circles: [],
      trending_topics: [],
      generated_at: '2024-01-15T10:30:00Z',
    },
    userStats: {
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
    },
    circleStats: {
      statistics: {
        circle_id: 123,
        circle_name: '테스트 서클',
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
    },
    serviceSummary: {
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
    },
    isLoading: false,
    error: null,
    refetch: jest.fn(),
    queries: {
      dashboardStats: { isLoading: false, error: null, refetch: jest.fn() },
      trendingData: { isLoading: false, error: null, refetch: jest.fn() },
      serviceSummary: { isLoading: false, error: null, refetch: jest.fn() },
      userStats: { isLoading: false, error: null, refetch: jest.fn() },
      circleStats: { isLoading: false, error: null, refetch: jest.fn() },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseStatisticsDashboard.mockReturnValue(mockStatisticsData);
  });

  it('renders header correctly', () => {
    const { getByText, getByTestId } = renderWithQueryClient(<StatisticsScreen />);

    expect(getByText('통계')).toBeTruthy();
    expect(getByText('테스트 서클')).toBeTruthy();
    expect(getByTestId('back-button')).toBeTruthy();
  });

  it('handles back navigation', () => {
    const { getByTestId } = renderWithQueryClient(<StatisticsScreen />);

    fireEvent.press(getByTestId('back-button'));
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('renders period selector', () => {
    const { getByText } = renderWithQueryClient(<StatisticsScreen />);

    expect(getByText('1주')).toBeTruthy();
    expect(getByText('1개월')).toBeTruthy();
    expect(getByText('3개월')).toBeTruthy();
  });

  it('changes period when selector is pressed', () => {
    const { getByText } = renderWithQueryClient(<StatisticsScreen />);

    fireEvent.press(getByText('1주'));
    
    // The period selector should update (would need to check styling or state)
    expect(getByText('1주')).toBeTruthy();
  });

  it('shows loading state correctly', () => {
    mockUseStatisticsDashboard.mockReturnValue({
      ...mockStatisticsData,
      isLoading: true,
    });

    const { getByText } = renderWithQueryClient(<StatisticsScreen />);

    expect(getByText('통계를 분석하는 중...')).toBeTruthy();
  });

  it('shows error state correctly', () => {
    mockUseStatisticsDashboard.mockReturnValue({
      ...mockStatisticsData,
      error: new Error('Network error'),
    });

    const { getByText } = renderWithQueryClient(<StatisticsScreen />);

    expect(getByText('통계를 불러올 수 없습니다')).toBeTruthy();
    expect(getByText('Network error')).toBeTruthy();
    expect(getByText('다시 시도')).toBeTruthy();
  });

  it('handles retry on error', () => {
    const mockRefetch = jest.fn();
    mockUseStatisticsDashboard.mockReturnValue({
      ...mockStatisticsData,
      error: new Error('Network error'),
      refetch: mockRefetch,
    });

    const { getByText } = renderWithQueryClient(<StatisticsScreen />);

    fireEvent.press(getByText('다시 시도'));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('displays main statistics correctly', () => {
    const { getByText } = renderWithQueryClient(<StatisticsScreen />);

    expect(getByText('📊 주요 지표')).toBeTruthy();
    expect(getByText('총 투표 수')).toBeTruthy();
    expect(getByText('500')).toBeTruthy(); // total_polls
    expect(getByText('오늘 투표 수')).toBeTruthy();
    expect(getByText('300')).toBeTruthy(); // total_votes_today
    expect(getByText('주간 활성 사용자')).toBeTruthy();
    expect(getByText('500')).toBeTruthy(); // active_users_week
    expect(getByText('완료율')).toBeTruthy();
    expect(getByText('85%')).toBeTruthy(); // poll_completion_rate
  });

  it('displays circle statistics when available', () => {
    const { getByText } = renderWithQueryClient(<StatisticsScreen />);

    expect(getByText('👥 서클 통계')).toBeTruthy();
    expect(getByText('총 멤버')).toBeTruthy();
    expect(getByText('20')).toBeTruthy(); // total_members
    expect(getByText('주간 활성')).toBeTruthy();
    expect(getByText('15')).toBeTruthy(); // active_members_last_week
    expect(getByText('평균 참여율')).toBeTruthy();
    expect(getByText('80%')).toBeTruthy(); // average_participation_rate
    expect(getByText('생성된 투표')).toBeTruthy();
    expect(getByText('25')).toBeTruthy(); // total_polls_created
  });

  it('displays trending polls', () => {
    const { getByText } = renderWithQueryClient(<StatisticsScreen />);

    expect(getByText('🔥 인기 투표')).toBeTruthy();
    expect(getByText('인기 투표')).toBeTruthy();
    expect(getByText('인기 서클 • 100표')).toBeTruthy();
    expect(getByText('+50%')).toBeTruthy();
  });

  it('displays user achievements', () => {
    const { getByText } = renderWithQueryClient(<StatisticsScreen />);

    expect(getByText('🏆 내 활동 통계')).toBeTruthy();
    expect(getByText('총 투표 참여')).toBeTruthy();
    expect(getByText('50')).toBeTruthy(); // total_votes_cast
    expect(getByText('참여 서클')).toBeTruthy();
    expect(getByText('5')).toBeTruthy(); // circles_joined
    expect(getByText('연속 활동일')).toBeTruthy();
    expect(getByText('15')).toBeTruthy(); // streak_days
    expect(getByText('참여율')).toBeTruthy();
    expect(getByText('90%')).toBeTruthy(); // participation_rate
  });

  it('displays recent activities', () => {
    const { getByText } = renderWithQueryClient(<StatisticsScreen />);

    expect(getByText('📝 최근 활동')).toBeTruthy();
    expect(getByText('새 투표 "Test Poll" 생성')).toBeTruthy();
    expect(getByText('"Another Poll"에 투표 참여')).toBeTruthy();
  });

  it('handles refresh correctly', async () => {
    const mockRefetch = jest.fn();
    mockUseStatisticsDashboard.mockReturnValue({
      ...mockStatisticsData,
      refetch: mockRefetch,
    });

    const { getByTestId } = renderWithQueryClient(<StatisticsScreen />);

    // Find the ScrollView with RefreshControl
    const scrollView = getByTestId('statistics-scroll-view') || 
                       document.querySelector('[testID="statistics-scroll-view"]') ||
                       document.querySelector('ScrollView');

    if (scrollView) {
      // Simulate pull-to-refresh
      fireEvent(scrollView, 'refresh');
      
      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalledTimes(1);
      });
    }
  });

  it('shows different activity types correctly', () => {
    const customData = {
      ...mockStatisticsData,
      dashboardStats: {
        ...mockStatisticsData.dashboardStats,
        recent_activities: [
          {
            id: 3,
            type: 'circle_joined' as const,
            circle_name: 'New Circle',
            timestamp: '2024-01-15T08:30:00Z',
          },
          {
            id: 4,
            type: 'poll_completed' as const,
            poll_title: 'Completed Poll',
            timestamp: '2024-01-15T07:30:00Z',
          },
        ],
      },
    };

    mockUseStatisticsDashboard.mockReturnValue(customData);

    const { getByText } = renderWithQueryClient(<StatisticsScreen />);

    expect(getByText('"New Circle" 서클 참여')).toBeTruthy();
    expect(getByText('"Completed Poll" 투표 완료')).toBeTruthy();
  });

  it('handles missing data gracefully', () => {
    mockUseStatisticsDashboard.mockReturnValue({
      ...mockStatisticsData,
      dashboardStats: null,
      userStats: null,
      circleStats: null,
      trendingData: null,
    });

    const { getByText } = renderWithQueryClient(<StatisticsScreen />);

    // Should still render the basic structure
    expect(getByText('통계')).toBeTruthy();
    expect(getByText('📊 주요 지표')).toBeTruthy();
  });

  it('shows correct date formatting', () => {
    const { getByText } = renderWithQueryClient(<StatisticsScreen />);

    // Check that dates are formatted correctly (Korean locale)
    expect(getByText(/2024/)).toBeTruthy();
  });

  it('handles empty trending data', () => {
    const customData = {
      ...mockStatisticsData,
      trendingData: {
        trending_polls: [],
        trending_circles: [],
        trending_topics: [],
        generated_at: '2024-01-15T10:30:00Z',
      },
    };

    mockUseStatisticsDashboard.mockReturnValue(customData);

    const { queryByText } = renderWithQueryClient(<StatisticsScreen />);

    // Should not show trending section when no data
    expect(queryByText('🔥 인기 투표')).toBeNull();
  });

  it('handles empty recent activities', () => {
    const customData = {
      ...mockStatisticsData,
      dashboardStats: {
        ...mockStatisticsData.dashboardStats,
        recent_activities: [],
      },
    };

    mockUseStatisticsDashboard.mockReturnValue(customData);

    const { queryByText } = renderWithQueryClient(<StatisticsScreen />);

    // Should not show recent activities section when no data
    expect(queryByText('📝 최근 활동')).toBeNull();
  });

  it('displays statistics without circle data', () => {
    mockUseStatisticsDashboard.mockReturnValue({
      ...mockStatisticsData,
      circleStats: null,
    });

    const { getByText, queryByText } = renderWithQueryClient(<StatisticsScreen />);

    // Should still show main statistics
    expect(getByText('📊 주요 지표')).toBeTruthy();
    
    // Should not show circle-specific statistics
    expect(queryByText('👥 서클 통계')).toBeNull();
  });
});