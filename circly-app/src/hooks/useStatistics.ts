/**
 * 통계 관련 React Hook
 * TRD 08-statistics-system.md의 통계 시스템 요구사항 기반
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { statisticsApi } from '../services/api/statistics';
import type {
  UserStatisticsResponse,
  CircleStatisticsResponse,
  PollStatisticsResponse,
  DashboardStatisticsResponse,
  TrendingData,
  StatisticsSummary,
  StatisticsFilter,
} from '../types/statistics';

const STATISTICS_QUERY_KEYS = {
  userStats: (userId?: number, filter?: StatisticsFilter) => ['statistics', 'user', userId, filter],
  circleStats: (circleId: number, filter?: StatisticsFilter) => ['statistics', 'circle', circleId, filter],
  pollStats: (pollId: number) => ['statistics', 'poll', pollId],
  dashboard: (filter?: StatisticsFilter) => ['statistics', 'dashboard', filter],
  trending: (timeframe: string) => ['statistics', 'trending', timeframe],
  summary: () => ['statistics', 'summary'],
  userEngagement: (userId?: number, period: string) => ['statistics', 'engagement', 'user', userId, period],
  circleHealth: (circleId: number) => ['statistics', 'health', 'circle', circleId],
  pollPerformance: (pollId: number) => ['statistics', 'performance', 'poll', pollId],
  activityPatterns: (scope: string, scopeId?: number, timeframe: string) => 
    ['statistics', 'patterns', scope, scopeId, timeframe],
} as const;

/**
 * 사용자 개인 통계 Hook
 */
export const useUserStatistics = (
  userId?: number,
  filter?: StatisticsFilter,
  enabled: boolean = true
): UseQueryResult<UserStatisticsResponse, Error> => {
  return useQuery({
    queryKey: STATISTICS_QUERY_KEYS.userStats(userId, filter),
    queryFn: () => statisticsApi.getUserStatistics(userId, filter),
    enabled,
    staleTime: 5 * 60 * 1000, // 5분
    cacheTime: 10 * 60 * 1000, // 10분
  });
};

/**
 * 서클 통계 Hook
 */
export const useCircleStatistics = (
  circleId: number,
  filter?: StatisticsFilter,
  enabled: boolean = true
): UseQueryResult<CircleStatisticsResponse, Error> => {
  return useQuery({
    queryKey: STATISTICS_QUERY_KEYS.circleStats(circleId, filter),
    queryFn: () => statisticsApi.getCircleStatistics(circleId, filter),
    enabled: enabled && circleId > 0,
    staleTime: 3 * 60 * 1000, // 3분
    cacheTime: 10 * 60 * 1000, // 10분
  });
};

/**
 * 투표 상세 통계 Hook
 */
export const usePollStatistics = (
  pollId: number,
  includeComparison: boolean = false,
  enabled: boolean = true
): UseQueryResult<PollStatisticsResponse, Error> => {
  return useQuery({
    queryKey: STATISTICS_QUERY_KEYS.pollStats(pollId),
    queryFn: () => statisticsApi.getPollStatistics(pollId, includeComparison),
    enabled: enabled && pollId > 0,
    staleTime: 2 * 60 * 1000, // 2분
    cacheTime: 10 * 60 * 1000, // 10분
  });
};

/**
 * 대시보드 통계 Hook
 */
export const useDashboardStatistics = (
  filter?: StatisticsFilter,
  enabled: boolean = true
): UseQueryResult<DashboardStatisticsResponse, Error> => {
  return useQuery({
    queryKey: STATISTICS_QUERY_KEYS.dashboard(filter),
    queryFn: () => statisticsApi.getDashboardStatistics(filter),
    enabled,
    staleTime: 2 * 60 * 1000, // 2분
    cacheTime: 5 * 60 * 1000, // 5분
    refetchInterval: 5 * 60 * 1000, // 5분마다 자동 갱신
  });
};

/**
 * 트렌딩 데이터 Hook
 */
export const useTrendingData = (
  timeframe: '1h' | '24h' | '7d' = '24h',
  enabled: boolean = true
): UseQueryResult<TrendingData, Error> => {
  return useQuery({
    queryKey: STATISTICS_QUERY_KEYS.trending(timeframe),
    queryFn: () => statisticsApi.getTrendingData(timeframe),
    enabled,
    staleTime: 5 * 60 * 1000, // 5분
    cacheTime: 10 * 60 * 1000, // 10분
    refetchInterval: 10 * 60 * 1000, // 10분마다 갱신
  });
};

/**
 * 서비스 요약 통계 Hook
 */
export const useServiceSummary = (
  enabled: boolean = true
): UseQueryResult<StatisticsSummary, Error> => {
  return useQuery({
    queryKey: STATISTICS_QUERY_KEYS.summary(),
    queryFn: () => statisticsApi.getServiceSummary(),
    enabled,
    staleTime: 10 * 60 * 1000, // 10분
    cacheTime: 30 * 60 * 1000, // 30분
  });
};

/**
 * 사용자 참여도 분석 Hook
 */
export const useUserEngagementAnalysis = (
  userId?: number,
  period: 'week' | 'month' | 'quarter' = 'month',
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: STATISTICS_QUERY_KEYS.userEngagement(userId, period),
    queryFn: () => statisticsApi.getUserEngagementAnalysis(userId, period),
    enabled,
    staleTime: 30 * 60 * 1000, // 30분
    cacheTime: 60 * 60 * 1000, // 1시간
  });
};

/**
 * 서클 건강도 분석 Hook
 */
export const useCircleHealthAnalysis = (
  circleId: number,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: STATISTICS_QUERY_KEYS.circleHealth(circleId),
    queryFn: () => statisticsApi.getCircleHealthAnalysis(circleId),
    enabled: enabled && circleId > 0,
    staleTime: 15 * 60 * 1000, // 15분
    cacheTime: 30 * 60 * 1000, // 30분
  });
};

/**
 * 투표 성과 분석 Hook
 */
export const usePollPerformanceAnalysis = (
  pollId: number,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: STATISTICS_QUERY_KEYS.pollPerformance(pollId),
    queryFn: () => statisticsApi.getPollPerformanceAnalysis(pollId),
    enabled: enabled && pollId > 0,
    staleTime: 10 * 60 * 1000, // 10분
    cacheTime: 30 * 60 * 1000, // 30분
  });
};

/**
 * 활동 패턴 분석 Hook
 */
export const useActivityPatterns = (
  scope: 'user' | 'circle' | 'global',
  scopeId?: number,
  timeframe: 'week' | 'month' = 'week',
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: STATISTICS_QUERY_KEYS.activityPatterns(scope, scopeId, timeframe),
    queryFn: () => statisticsApi.getActivityPatterns(scope, scopeId, timeframe),
    enabled: enabled && (scope === 'global' || scopeId !== undefined),
    staleTime: 15 * 60 * 1000, // 15분
    cacheTime: 30 * 60 * 1000, // 30분
  });
};

/**
 * 종합 통계 대시보드 Hook (여러 데이터를 함께 사용)
 */
export const useStatisticsDashboard = (
  circleId?: number,
  filter?: StatisticsFilter
) => {
  const dashboardStats = useDashboardStatistics(filter);
  const trendingData = useTrendingData('24h');
  const serviceSummary = useServiceSummary();
  const userStats = useUserStatistics(undefined, filter);
  
  const circleStats = useCircleStatistics(
    circleId || 0,
    filter,
    !!circleId
  );

  const isLoading = dashboardStats.isLoading || 
                   trendingData.isLoading || 
                   serviceSummary.isLoading || 
                   userStats.isLoading ||
                   (circleId && circleStats.isLoading);

  const error = dashboardStats.error || 
                trendingData.error || 
                serviceSummary.error || 
                userStats.error ||
                circleStats.error;

  return {
    // 데이터
    dashboardStats: dashboardStats.data,
    trendingData: trendingData.data,
    serviceSummary: serviceSummary.data,
    userStats: userStats.data,
    circleStats: circleStats.data,
    
    // 상태
    isLoading,
    error,
    
    // 개별 쿼리 상태
    queries: {
      dashboardStats,
      trendingData,
      serviceSummary,
      userStats,
      circleStats,
    },
    
    // 리프레시 함수
    refetch: () => {
      dashboardStats.refetch();
      trendingData.refetch();
      serviceSummary.refetch();
      userStats.refetch();
      if (circleId) circleStats.refetch();
    },
  };
};

/**
 * 성과 분석 통합 Hook
 */
export const usePerformanceAnalysis = (
  type: 'user' | 'circle' | 'poll',
  id: number
) => {
  const userEngagement = useUserEngagementAnalysis(
    type === 'user' ? id : undefined,
    'month',
    type === 'user'
  );
  
  const circleHealth = useCircleHealthAnalysis(
    type === 'circle' ? id : 0,
    type === 'circle'
  );
  
  const pollPerformance = usePollPerformanceAnalysis(
    type === 'poll' ? id : 0,
    type === 'poll'
  );

  const isLoading = userEngagement.isLoading || 
                   circleHealth.isLoading || 
                   pollPerformance.isLoading;

  const error = userEngagement.error || 
                circleHealth.error || 
                pollPerformance.error;

  return {
    userEngagement: userEngagement.data,
    circleHealth: circleHealth.data,
    pollPerformance: pollPerformance.data,
    isLoading,
    error,
    refetch: () => {
      if (type === 'user') userEngagement.refetch();
      if (type === 'circle') circleHealth.refetch();
      if (type === 'poll') pollPerformance.refetch();
    },
  };
};

export default {
  useUserStatistics,
  useCircleStatistics,
  usePollStatistics,
  useDashboardStatistics,
  useTrendingData,
  useServiceSummary,
  useStatisticsDashboard,
  usePerformanceAnalysis,
};