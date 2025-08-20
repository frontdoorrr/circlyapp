/**
 * 통계 화면
 * TRD 08-statistics-system.md의 통계 화면 요구사항 기반
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useStatisticsDashboard, useUserStatistics } from '../../hooks/useStatistics';
import type { StatisticsFilter } from '../../types/statistics';

const { width: screenWidth } = Dimensions.get('window');

export const StatisticsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { circleId, circleName } = route.params as { circleId?: number; circleName?: string };

  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [refreshing, setRefreshing] = useState(false);

  // 필터 생성
  const filter: StatisticsFilter = useMemo(() => {
    const now = new Date();
    const endDate = now.toISOString().split('T')[0];
    
    let startDate: string;
    switch (selectedPeriod) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
    }

    return {
      date_from: startDate,
      date_to: endDate,
      circle_id: circleId,
    };
  }, [selectedPeriod, circleId]);

  // 통계 데이터 조회
  const {
    dashboardStats,
    trendingData,
    userStats,
    circleStats,
    isLoading,
    error,
    refetch,
  } = useStatisticsDashboard(circleId, filter);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    change?: {
      value: number;
      trend: 'up' | 'down' | 'stable';
    };
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
  }> = ({ title, value, subtitle, change, icon, color }) => (
    <View style={styles.statCard}>
      <View style={styles.statCardHeader}>
        <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      {change && (
        <View style={styles.changeContainer}>
          <Ionicons 
            name={change.trend === 'up' ? 'trending-up' : change.trend === 'down' ? 'trending-down' : 'remove'} 
            size={16} 
            color={change.trend === 'up' ? '#34C759' : change.trend === 'down' ? '#FF3B30' : '#999'} 
          />
          <Text style={[
            styles.changeText,
            { color: change.trend === 'up' ? '#34C759' : change.trend === 'down' ? '#FF3B30' : '#999' }
          ]}>
            {Math.abs(change.value)}%
          </Text>
        </View>
      )}
    </View>
  );

  const PeriodSelector: React.FC = () => (
    <View style={styles.periodSelector}>
      {(['week', 'month', 'quarter'] as const).map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            selectedPeriod === period && styles.periodButtonActive,
          ]}
          onPress={() => setSelectedPeriod(period)}
        >
          <Text style={[
            styles.periodButtonText,
            selectedPeriod === period && styles.periodButtonTextActive,
          ]}>
            {period === 'week' ? '1주' : period === 'month' ? '1개월' : '3개월'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const TrendingSection: React.FC = () => {
    if (!trendingData?.trending_polls?.length) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔥 인기 투표</Text>
        {trendingData.trending_polls.slice(0, 3).map((poll, index) => (
          <View key={poll.poll_id} style={styles.trendingItem}>
            <View style={styles.trendingRank}>
              <Text style={styles.trendingRankText}>{index + 1}</Text>
            </View>
            <View style={styles.trendingContent}>
              <Text style={styles.trendingTitle}>{poll.poll_title}</Text>
              <Text style={styles.trendingSubtitle}>
                {poll.circle_name} • {poll.vote_count}표
              </Text>
            </View>
            <View style={styles.trendingGrowth}>
              <Ionicons name="trending-up" size={16} color="#34C759" />
              <Text style={styles.trendingGrowthText}>+{poll.growth_rate}%</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const UserAchievements: React.FC = () => {
    if (!userStats?.statistics) return null;

    const stats = userStats.statistics;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏆 내 활동 통계</Text>
        <View style={styles.achievementGrid}>
          <View style={styles.achievementItem}>
            <Ionicons name="ballot" size={24} color="#007AFF" />
            <Text style={styles.achievementValue}>{stats.total_votes_cast}</Text>
            <Text style={styles.achievementLabel}>총 투표 참여</Text>
          </View>
          <View style={styles.achievementItem}>
            <Ionicons name="people" size={24} color="#34C759" />
            <Text style={styles.achievementValue}>{stats.circles_joined}</Text>
            <Text style={styles.achievementLabel}>참여 서클</Text>
          </View>
          <View style={styles.achievementItem}>
            <Ionicons name="flame" size={24} color="#FF9500" />
            <Text style={styles.achievementValue}>{stats.streak_days}</Text>
            <Text style={styles.achievementLabel}>연속 활동일</Text>
          </View>
          <View style={styles.achievementItem}>
            <Ionicons name="trophy" size={24} color="#FFD700" />
            <Text style={styles.achievementValue}>{Math.round(stats.participation_rate)}%</Text>
            <Text style={styles.achievementLabel}>참여율</Text>
          </View>
        </View>
      </View>
    );
  };

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#FF3B30" />
          <Text style={styles.errorTitle}>통계를 불러올 수 없습니다</Text>
          <Text style={styles.errorMessage}>{error.message}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <LinearGradient colors={['#F8F9FF', '#FFFFFF']} style={styles.container}>
      <SafeAreaView style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            testID="back-button"
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>통계</Text>
            {circleName && (
              <Text style={styles.headerSubtitle}>{circleName}</Text>
            )}
          </View>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#007AFF"
            />
          }
        >
          {/* 기간 선택 */}
          <PeriodSelector />

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>통계를 분석하는 중...</Text>
            </View>
          ) : (
            <>
              {/* 주요 지표 */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📊 주요 지표</Text>
                <View style={styles.statsGrid}>
                  {dashboardStats?.summary && (
                    <>
                      <StatCard
                        title="총 투표 수"
                        value={dashboardStats.summary.total_polls}
                        subtitle="진행 중인 투표"
                        icon="ballot"
                        color="#007AFF"
                      />
                      <StatCard
                        title="오늘 투표 수"
                        value={dashboardStats.summary.total_votes_today}
                        subtitle="오늘 참여한 투표"
                        icon="today"
                        color="#34C759"
                      />
                      <StatCard
                        title="주간 활성 사용자"
                        value={dashboardStats.summary.active_users_week}
                        subtitle="이번 주 활동"
                        icon="people"
                        color="#FF9500"
                      />
                      <StatCard
                        title="완료율"
                        value={`${Math.round(dashboardStats.summary.poll_completion_rate)}%`}
                        subtitle="투표 완료율"
                        icon="checkmark-circle"
                        color="#30D158"
                      />
                    </>
                  )}
                </View>
              </View>

              {/* 서클 통계 (서클이 선택된 경우) */}
              {circleStats && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>👥 서클 통계</Text>
                  <View style={styles.statsGrid}>
                    <StatCard
                      title="총 멤버"
                      value={circleStats.statistics.total_members}
                      subtitle="서클 멤버 수"
                      icon="people"
                      color="#007AFF"
                    />
                    <StatCard
                      title="주간 활성"
                      value={circleStats.statistics.active_members_last_week}
                      subtitle="이번 주 활동 멤버"
                      icon="pulse"
                      color="#34C759"
                    />
                    <StatCard
                      title="평균 참여율"
                      value={`${Math.round(circleStats.statistics.average_participation_rate)}%`}
                      subtitle="투표 참여율"
                      icon="trending-up"
                      color="#FF9500"
                    />
                    <StatCard
                      title="생성된 투표"
                      value={circleStats.statistics.total_polls_created}
                      subtitle="총 투표 수"
                      icon="create"
                      color="#AF52DE"
                    />
                  </View>
                </View>
              )}

              {/* 트렌딩 */}
              <TrendingSection />

              {/* 사용자 성취 */}
              <UserAchievements />

              {/* 최근 활동 */}
              {dashboardStats?.recent_activities?.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>📝 최근 활동</Text>
                  {dashboardStats.recent_activities.slice(0, 5).map((activity) => (
                    <View key={activity.id} style={styles.activityItem}>
                      <View style={styles.activityIcon}>
                        <Ionicons 
                          name={activity.type === 'poll_created' ? 'add-circle' : 
                                activity.type === 'vote_cast' ? 'ballot' : 
                                activity.type === 'circle_joined' ? 'people' : 'checkmark-circle'} 
                          size={20} 
                          color="#007AFF" 
                        />
                      </View>
                      <View style={styles.activityContent}>
                        <Text style={styles.activityText}>
                          {activity.type === 'poll_created' && `새 투표 "${activity.poll_title}" 생성`}
                          {activity.type === 'vote_cast' && `"${activity.poll_title}"에 투표 참여`}
                          {activity.type === 'circle_joined' && `"${activity.circle_name}" 서클 참여`}
                          {activity.type === 'poll_completed' && `"${activity.poll_title}" 투표 완료`}
                        </Text>
                        <Text style={styles.activityTime}>
                          {new Date(activity.timestamp).toLocaleDateString('ko-KR')}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  headerTitle: {
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  periodButtonTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (screenWidth - 60) / 2,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  statTitle: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  trendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  trendingRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  trendingRankText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  trendingContent: {
    flex: 1,
  },
  trendingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  trendingSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  trendingGrowth: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendingGrowthText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34C759',
    marginLeft: 2,
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementItem: {
    width: (screenWidth - 60) / 2,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  achievementValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginVertical: 8,
  },
  achievementLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default StatisticsScreen;