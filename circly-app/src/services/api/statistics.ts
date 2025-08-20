/**
 * 통계 API 서비스
 * TRD 08-statistics-system.md의 통계 시스템 요구사항 기반
 */

import { apiClient } from './client';
import type {
  UserStatisticsResponse,
  CircleStatisticsResponse,
  PollStatisticsResponse,
  DashboardStatisticsResponse,
  StatisticsFilter,
  TrendingData,
  StatisticsSummary,
} from '../../types/statistics';

class StatisticsApi {
  /**
   * 사용자 개인 통계 조회
   */
  async getUserStatistics(
    userId?: number,
    filter?: StatisticsFilter
  ): Promise<UserStatisticsResponse> {
    const params = new URLSearchParams();
    
    if (filter?.date_from) params.append('date_from', filter.date_from);
    if (filter?.date_to) params.append('date_to', filter.date_to);
    if (filter?.circle_id) params.append('circle_id', filter.circle_id.toString());

    const url = userId 
      ? `/v1/statistics/users/${userId}?${params.toString()}`
      : `/v1/statistics/users/me?${params.toString()}`;

    const response = await apiClient.get<UserStatisticsResponse>(url);
    
    if (response.error) {
      throw new Error(response.error);
    }

    return response.data!;
  }

  /**
   * 서클 통계 조회
   */
  async getCircleStatistics(
    circleId: number,
    filter?: StatisticsFilter
  ): Promise<CircleStatisticsResponse> {
    const params = new URLSearchParams();
    
    if (filter?.date_from) params.append('date_from', filter.date_from);
    if (filter?.date_to) params.append('date_to', filter.date_to);
    if (filter?.poll_type) params.append('poll_type', filter.poll_type);

    const url = `/v1/statistics/circles/${circleId}?${params.toString()}`;
    const response = await apiClient.get<CircleStatisticsResponse>(url);
    
    if (response.error) {
      throw new Error(response.error);
    }

    return response.data!;
  }

  /**
   * 투표 상세 통계 조회
   */
  async getPollStatistics(
    pollId: number,
    includeComparison: boolean = false
  ): Promise<PollStatisticsResponse> {
    const params = new URLSearchParams();
    if (includeComparison) params.append('include_comparison', 'true');

    const url = `/v1/statistics/polls/${pollId}?${params.toString()}`;
    const response = await apiClient.get<PollStatisticsResponse>(url);
    
    if (response.error) {
      throw new Error(response.error);
    }

    return response.data!;
  }

  /**
   * 대시보드 종합 통계 조회
   */
  async getDashboardStatistics(
    filter?: StatisticsFilter
  ): Promise<DashboardStatisticsResponse> {
    const params = new URLSearchParams();
    
    if (filter?.date_from) params.append('date_from', filter.date_from);
    if (filter?.date_to) params.append('date_to', filter.date_to);
    if (filter?.circle_id) params.append('circle_id', filter.circle_id.toString());

    const url = `/v1/statistics/dashboard?${params.toString()}`;
    const response = await apiClient.get<DashboardStatisticsResponse>(url);
    
    if (response.error) {
      throw new Error(response.error);
    }

    return response.data!;
  }

  /**
   * 트렌딩 데이터 조회
   */
  async getTrendingData(
    timeframe: '1h' | '24h' | '7d' = '24h'
  ): Promise<TrendingData> {
    const url = `/v1/statistics/trending?timeframe=${timeframe}`;
    const response = await apiClient.get<TrendingData>(url);
    
    if (response.error) {
      throw new Error(response.error);
    }

    return response.data!;
  }

  /**
   * 전체 서비스 통계 요약
   */
  async getServiceSummary(): Promise<StatisticsSummary> {
    const response = await apiClient.get<StatisticsSummary>('/v1/statistics/summary');
    
    if (response.error) {
      throw new Error(response.error);
    }

    return response.data!;
  }

  /**
   * 사용자 참여도 분석
   */
  async getUserEngagementAnalysis(
    userId?: number,
    period: 'week' | 'month' | 'quarter' = 'month'
  ): Promise<{
    engagement_score: number;
    participation_trend: 'increasing' | 'decreasing' | 'stable';
    recommendations: string[];
    comparison_with_peers: number; // percentile
  }> {
    const url = userId 
      ? `/v1/statistics/users/${userId}/engagement?period=${period}`
      : `/v1/statistics/users/me/engagement?period=${period}`;

    const response = await apiClient.get(url);
    
    if (response.error) {
      throw new Error(response.error);
    }

    return response.data!;
  }

  /**
   * 서클 건강도 분석
   */
  async getCircleHealthAnalysis(circleId: number): Promise<{
    health_score: number; // 0-100
    activity_level: 'low' | 'medium' | 'high';
    member_engagement: number; // 0-100
    poll_frequency_score: number; // 0-100
    retention_rate: number; // 0-100
    recommendations: string[];
    benchmarks: {
      similar_circles_avg: number;
      top_10_percent_threshold: number;
    };
  }> {
    const url = `/v1/statistics/circles/${circleId}/health`;
    const response = await apiClient.get(url);
    
    if (response.error) {
      throw new Error(response.error);
    }

    return response.data!;
  }

  /**
   * 투표 성과 분석
   */
  async getPollPerformanceAnalysis(pollId: number): Promise<{
    performance_score: number; // 0-100
    participation_rate: number;
    engagement_quality: 'low' | 'medium' | 'high';
    timing_effectiveness: number; // 0-100
    content_appeal: number; // 0-100
    similar_polls_comparison: {
      better_than_percentage: number;
      average_participation_rate: number;
    };
    improvement_suggestions: string[];
  }> {
    const url = `/v1/statistics/polls/${pollId}/performance`;
    const response = await apiClient.get(url);
    
    if (response.error) {
      throw new Error(response.error);
    }

    return response.data!;
  }

  /**
   * 시간대별 활동 패턴 분석
   */
  async getActivityPatterns(
    scope: 'user' | 'circle' | 'global',
    scopeId?: number,
    timeframe: 'week' | 'month' = 'week'
  ): Promise<{
    hourly_pattern: { [hour: string]: number };
    daily_pattern: { [day: string]: number };
    peak_hours: number[];
    peak_days: string[];
    activity_insights: string[];
  }> {
    const params = new URLSearchParams();
    params.append('scope', scope);
    params.append('timeframe', timeframe);
    if (scopeId) params.append('scope_id', scopeId.toString());

    const url = `/v1/statistics/patterns/activity?${params.toString()}`;
    const response = await apiClient.get(url);
    
    if (response.error) {
      throw new Error(response.error);
    }

    return response.data!;
  }

  /**
   * 통계 데이터 내보내기 (CSV/JSON)
   */
  async exportStatistics(
    type: 'user' | 'circle' | 'poll',
    id: number,
    format: 'csv' | 'json' = 'csv',
    filter?: StatisticsFilter
  ): Promise<Blob> {
    const params = new URLSearchParams();
    params.append('format', format);
    
    if (filter?.date_from) params.append('date_from', filter.date_from);
    if (filter?.date_to) params.append('date_to', filter.date_to);

    const url = `/v1/statistics/export/${type}/${id}?${params.toString()}`;
    
    // Note: 실제 구현에서는 blob 응답을 처리해야 함
    const response = await apiClient.get(url);
    
    if (response.error) {
      throw new Error(response.error);
    }

    // 임시로 빈 Blob 반환
    return new Blob([], { type: format === 'csv' ? 'text/csv' : 'application/json' });
  }
}

// 싱글톤 인스턴스
export const statisticsApi = new StatisticsApi();

// 기본 export
export default statisticsApi;