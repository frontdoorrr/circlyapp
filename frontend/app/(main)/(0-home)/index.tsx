import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  ListRenderItem,
  AccessibilityInfo,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  FadeIn,
  FadeInUp,
} from 'react-native-reanimated';
import PagerView from 'react-native-pager-view';

import { HomeHeader } from '../../../src/components/home/HomeHeader';
import { SectionHeader } from '../../../src/components/home/SectionHeader';
import {
  PollCard,
  ActivePollData,
  CompletedPollData,
  VoteStatus,
} from '../../../src/components/patterns/PollCard';
import { EmptyState } from '../../../src/components/states/EmptyState';
import { LoadingSpinner } from '../../../src/components/states/LoadingSpinner';
import { Skeleton, SkeletonCard } from '../../../src/components/states/Skeleton';
import { Text } from '../../../src/components/primitives/Text';
import { Button } from '../../../src/components/primitives/Button';
import { tokens, spacing, fontSizes, animations } from '../../../src/theme';
import { useTheme, useThemedStyles } from '../../../src/theme/ThemeContext';
import type { Theme } from '../../../src/theme/tokens';
import {
  useMyActivePolls,
  useMyCompletedPolls,
  useRefreshPolls,
} from '../../../src/hooks/usePolls';
import { useMyCircles } from '../../../src/hooks/useCircles';
import { useUnreadCount } from '../../../src/hooks/useNotifications';
import {
  formatTimeRemaining,
  getTimeRemainingColor,
  isExpired,
} from '../../../src/utils/timeUtils';

// ============================================================================
// Types
// ============================================================================

type TabType = 'active' | 'completed';

interface TransformedActivePoll extends ActivePollData {
  rawEndsAt: string;
}

interface TransformedCompletedPoll extends CompletedPollData { }

// ============================================================================
// Home Screen Component
// ============================================================================

/**
 * Home Screen - 투표 피드 화면
 *
 * Spec: prd/design/05-complete-ui-specification.md - 섹션 2.2
 *
 * Features:
 * - 진행 중 / 완료됨 탭 전환
 * - Pull-to-Refresh
 * - 실시간 카운트다운
 * - FlatList 최적화
 * - 접근성 지원
 */
export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [refreshing, setRefreshing] = useState(false);
  const pagerRef = useRef<PagerView>(null);

  // API 연동
  const {
    data: activePolls,
    isLoading: isLoadingActive,
    isError: isErrorActive,
    refetch: refetchActive,
  } = useMyActivePolls();

  const {
    data: completedPolls,
    isLoading: isLoadingCompleted,
    isError: isErrorCompleted,
    refetch: refetchCompleted,
  } = useMyCompletedPolls();

  const { refreshActivePolls, refreshCompletedPolls } = useRefreshPolls();

  // 내 Circle 목록 조회
  const { data: myCircles } = useMyCircles();

  // 읽지 않은 알림 개수 (벨 배지)
  const { data: unreadCount } = useUnreadCount();

  // 홈은 여러 Circle의 투표를 통합해서 보여준다.
  const circleName = '전체 Circle';

  // ============================================================================
  // 실시간 카운트다운
  // ============================================================================

  const [, setTick] = useState(0);

  useEffect(() => {
    // 1분마다 시간 업데이트
    const timer = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 60 * 1000);

    return () => clearInterval(timer);
  }, []);

  // ============================================================================
  // 데이터 변환
  // ============================================================================

  const transformedActivePolls: TransformedActivePoll[] = useMemo(() => {
    if (!activePolls) return [];

    return activePolls
      .filter((poll) => !isExpired(poll.ends_at))
      .map((poll) => ({
        id: poll.id,
        question: poll.question,
        emoji: poll.emoji || '📊',
        circleName: poll.circle_name || 'Circle',
        timeRemaining: formatTimeRemaining(poll.ends_at),
        participantCount: poll.vote_count || 0,
        totalMembers: poll.total_members || 15,
        participationRate: Math.round(
          ((poll.vote_count || 0) / (poll.total_members || 15)) * 100
        ),
        voteStatus: (poll.has_voted ? 'voted' : 'not_voted') as VoteStatus,
        rawEndsAt: poll.ends_at,
      }))
      .sort((a, b) => new Date(a.rawEndsAt).getTime() - new Date(b.rawEndsAt).getTime());
  }, [activePolls]);

  const transformedCompletedPolls: TransformedCompletedPoll[] = useMemo(() => {
    if (!completedPolls) return [];

    return completedPolls.map((poll) => ({
      id: poll.id,
      question: poll.question,
      emoji: poll.emoji || '📊',
      circleName: poll.circle_name || 'Circle',
      winner: {
        name: poll.winner_name || '알 수 없음',
        voteCount: poll.winner_vote_count || 0,
      },
    }));
  }, [completedPolls]);

  const sessionReadyCount = useMemo(() => {
    if (!activePolls) return 0;
    return activePolls.filter((poll) => !poll.has_voted && !isExpired(poll.ends_at)).length;
  }, [activePolls]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  // Pull to Refresh
  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);

    try {
      if (activeTab === 'active') {
        await refetchActive();
      } else {
        await refetchCompleted();
      }
    } finally {
      setRefreshing(false);
    }
  }, [activeTab, refetchActive, refetchCompleted]);

  // 탭 전환
  const handleTabChange = useCallback((tab: TabType) => {
    Haptics.selectionAsync();
    setActiveTab(tab);
    pagerRef.current?.setPage(tab === 'active' ? 0 : 1);
  }, []);

  // 페이지 스와이프 시 탭 상태 동기화
  const handlePageSelected = useCallback((e: { nativeEvent: { position: number } }) => {
    const tab = e.nativeEvent.position === 0 ? 'active' : 'completed';
    if (tab !== activeTab) {
      Haptics.selectionAsync();
      setActiveTab(tab);
    }
  }, [activeTab]);

  // 투표 카드 클릭 - Active
  const handleActivePollPress = useCallback(
    (pollId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push(`/poll/${pollId}` as any);
    },
    [router]
  );

  // 투표 카드 클릭 - Completed
  const handleCompletedPollPress = useCallback(
    (pollId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push(`/results/${pollId}` as any);
    },
    [router]
  );

  // 알림 클릭
  const handleNotificationPress = useCallback(() => {
    router.push('/notifications' as any);
  }, [router]);

  // Profile 클릭
  const handleProfilePress = useCallback(() => {
    router.push('/(main)/(2-profile)' as any);
  }, [router]);

  // Circle 탭으로 이동
  const handleGoToCircles = useCallback(() => {
    router.push('/(main)/(1-circle)' as any);
  }, [router]);

  // Circle 참여 (코드로 참여)
  const handleJoinCircle = useCallback(() => {
    Haptics.selectionAsync();
    router.push('/join/invite-code' as any);
  }, [router]);

  const handleCreatePoll = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/create' as any);
  }, [router]);

  const handleStartSession = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/vote-session' as any);
  }, [router]);

  // ============================================================================
  // Render Helpers
  // ============================================================================

  const isLoading = isLoadingActive || isLoadingCompleted;
  const isError = isErrorActive || isErrorCompleted;

  // Active Poll Render Item
  // Animated.View + FadeInUp 패턴 적용 (Circle과 동일)
  const renderActiveItem: ListRenderItem<TransformedActivePoll> = useCallback(
    ({ item, index }) => (
      <Animated.View entering={FadeInUp.delay(index * 50)} style={styles.cardWrapper}>
        <PollCard
          variant="active"
          poll={item}
          onPress={() => handleActivePollPress(item.id)}
        />
      </Animated.View>
    ),
    [handleActivePollPress, styles.cardWrapper]
  );

  // Completed Poll Render Item
  // Animated.View + FadeInUp 패턴 적용 (Circle과 동일)
  const renderCompletedItem: ListRenderItem<TransformedCompletedPoll> = useCallback(
    ({ item, index }) => (
      <Animated.View entering={FadeInUp.delay(index * 50)} style={styles.cardWrapper}>
        <PollCard
          variant="completed"
          poll={item}
          onPress={() => handleCompletedPollPress(item.id)}
        />
      </Animated.View>
    ),
    [handleCompletedPollPress, styles.cardWrapper]
  );

  const keyExtractor = useCallback((item: { id: string }) => item.id, []);

  const ItemSeparatorComponent = useCallback(() => <View style={styles.separator} />, []);

  // ============================================================================
  // Loading State
  // ============================================================================

  if (isLoading && !refreshing) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <HomeHeader
          circleName={circleName}
          notificationCount={unreadCount ?? 0}
          onNotificationPress={handleNotificationPress}
          onProfilePress={handleProfilePress}
        />
        <View style={styles.loadingContainer}>
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} style={styles.skeletonCard} />
          ))}
        </View>
      </View>
    );
  }

  // ============================================================================
  // Error State
  // ============================================================================

  if (isError) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <HomeHeader
          circleName={circleName}
          notificationCount={unreadCount ?? 0}
          onNotificationPress={handleNotificationPress}
          onProfilePress={handleProfilePress}
        />
        <View style={styles.centerContainer}>
          <EmptyState
            variant="network-error"
            onAction={onRefresh}
          />
        </View>
      </View>
    );
  }

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <HomeHeader
        circleName={circleName}
        notificationCount={unreadCount ?? 0}
        onNotificationPress={handleNotificationPress}
        onProfilePress={handleProfilePress}
      />

      <SessionStartCard
        count={sessionReadyCount}
        circleCount={myCircles?.length ?? 0}
        onStart={handleStartSession}
        onCreatePoll={handleCreatePoll}
        isDark={isDark}
      />

      {/* Tab Selector with Join Button */}
      <View style={styles.tabRow}>
        <View style={styles.tabContainer}>
          <TabButton
            label="진행 중"
            count={transformedActivePolls.length}
            isActive={activeTab === 'active'}
            onPress={() => handleTabChange('active')}
            isDark={isDark}
            theme={theme}
          />
          <TabButton
            label="완료됨"
            count={transformedCompletedPolls.length}
            isActive={activeTab === 'completed'}
            onPress={() => handleTabChange('completed')}
            isDark={isDark}
            theme={theme}
          />
        </View>
        <JoinCircleButton onPress={handleJoinCircle} isDark={isDark} />
      </View>

      {/* Content - PagerView로 스와이프 지원 */}
      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={0}
        onPageSelected={handlePageSelected}
      >
        {/* 진행 중 탭 */}
        <View key="active" style={styles.pageContainer}>
          {transformedActivePolls.length === 0 ? (
            <View style={styles.emptyContainer}>
              <EmptyState
                variant="no-active-polls"
                onAction={handleJoinCircle}
              />
            </View>
          ) : (
            <FlatList
              data={transformedActivePolls}
              renderItem={renderActiveItem}
              keyExtractor={keyExtractor}
              ItemSeparatorComponent={ItemSeparatorComponent}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing && activeTab === 'active'}
                  onRefresh={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setRefreshing(true);
                    refetchActive().finally(() => setRefreshing(false));
                  }}
                  tintColor={tokens.colors.primary[500]}
                  colors={[tokens.colors.primary[500]]}
                />
              }
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={false}
              maxToRenderPerBatch={10}
              windowSize={5}
              initialNumToRender={5}
              getItemLayout={(_, index) => ({
                length: 140,
                offset: 140 * index + 12 * index,
                index,
              })}
              accessibilityRole="list"
              accessibilityLabel={`진행 중인 투표 목록, ${transformedActivePolls.length}개`}
            />
          )}
        </View>

        {/* 완료됨 탭 */}
        <View key="completed" style={styles.pageContainer}>
          {transformedCompletedPolls.length === 0 ? (
            <View style={styles.emptyContainer}>
              <EmptyState variant="no-completed-polls" />
            </View>
          ) : (
            <FlatList
              data={transformedCompletedPolls}
              renderItem={renderCompletedItem}
              keyExtractor={keyExtractor}
              ItemSeparatorComponent={ItemSeparatorComponent}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing && activeTab === 'completed'}
                  onRefresh={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setRefreshing(true);
                    refetchCompleted().finally(() => setRefreshing(false));
                  }}
                  tintColor={tokens.colors.primary[500]}
                  colors={[tokens.colors.primary[500]]}
                />
              }
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={false}
              maxToRenderPerBatch={10}
              windowSize={5}
              initialNumToRender={5}
              getItemLayout={(_, index) => ({
                length: 140,
                offset: 140 * index + 12 * index,
                index,
              })}
              accessibilityRole="list"
              accessibilityLabel={`완료된 투표 목록, ${transformedCompletedPolls.length}개`}
            />
          )}
        </View>
      </PagerView>
      {myCircles?.length ? (
        <Button
          onPress={handleCreatePoll}
          style={styles.createButton}
          accessibilityLabel="새 투표 만들기"
        >
          + 새 투표
        </Button>
      ) : null}
    </View>
  );
}

// ============================================================================
// Session Start Card Component
// ============================================================================

interface SessionStartCardProps {
  count: number;
  circleCount: number;
  onStart: () => void;
  onCreatePoll: () => void;
  isDark: boolean;
}

function SessionStartCard({
  count,
  circleCount,
  onStart,
  onCreatePoll,
  isDark,
}: SessionStartCardProps) {
  const styles = useThemedStyles(createStyles);
  const hasVotes = count > 0;

  return (
    <Animated.View entering={FadeInUp.delay(80)} style={styles.sessionCard}>
      <View style={styles.sessionHeader}>
        <View style={styles.sessionBadge}>
          <Text style={styles.sessionBadgeText}>{circleCount} Circle</Text>
        </View>
        <Text style={styles.sessionCountText}>
          {hasVotes ? `${count}개 대기 중` : '대기 중인 투표 없음'}
        </Text>
      </View>
      <Text style={styles.sessionTitle}>
        {hasVotes ? '친구들이 기다리는 질문부터 답하기' : '새 질문으로 Circle을 움직이기'}
      </Text>
      <Text style={styles.sessionDescription}>
        {hasVotes
          ? '여러 Circle의 질문을 한 번에 넘기며 답해요.'
          : '지금은 답할 질문이 없어요. 새 투표를 만들 수 있어요.'}
      </Text>
      <View style={styles.sessionActions}>
        <Button
          onPress={hasVotes ? onStart : onCreatePoll}
          fullWidth
          accessibilityLabel={hasVotes ? '통합 투표 세션 시작' : '새 투표 만들기'}
        >
          {hasVotes ? '투표 시작' : '새 투표 만들기'}
        </Button>
      </View>
    </Animated.View>
  );
}

// ============================================================================
// Join Circle Button Component
// ============================================================================

interface JoinCircleButtonProps {
  onPress: () => void;
  isDark: boolean;
}

function JoinCircleButton({ onPress, isDark }: JoinCircleButtonProps) {
  const joinButtonStyle: ViewStyle = {
    backgroundColor: isDark ? tokens.colors.primary[900] : tokens.colors.primary[50],
    borderRadius: 12,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderColor: isDark ? tokens.colors.primary[700] : tokens.colors.primary[200],
  };

  const joinButtonContentStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  };

  return (
    <Animated.View entering={FadeIn.duration(300)}>
      <Button
        variant="ghost"
        size="sm"
        onPress={onPress}
        style={joinButtonStyle}
        accessibilityRole="button"
        accessibilityLabel="코드로 Circle 참여하기"
        accessibilityHint="초대 코드를 입력하여 새로운 Circle에 참여합니다"
      >
        <View style={joinButtonContentStyle}>
          <Text variant="lg" style={{ fontSize: 16 }}>
            🎯
          </Text>
          <Text
            variant="sm"
            weight="medium"
            color={tokens.colors.primary[isDark ? 400 : 600]}
          >
            참여
          </Text>
        </View>
      </Button>
    </Animated.View>
  );
}

// ============================================================================
// Tab Button Component
// ============================================================================

interface TabButtonProps {
  label: string;
  count: number;
  isActive: boolean;
  onPress: () => void;
  isDark: boolean;
  theme: Theme;
}

function TabButton({ label, count, isActive, onPress, isDark, theme }: TabButtonProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: isActive
      ? tokens.colors.primary[500]
      : isDark ? theme.backgroundSecondary : tokens.colors.neutral[100],
  }));

  const tabButtonStyle: ViewStyle = {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  };

  const tabButtonInnerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    gap: spacing[2],
  };

  const countBadgeStyle: ViewStyle = {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  };

  return (
    <Animated.View style={[tabButtonStyle, animatedStyle]}>
      <Button
        variant="ghost"
        size="sm"
        onPress={onPress}
        style={tabButtonInnerStyle}
        accessibilityRole="tab"
        accessibilityState={{ selected: isActive }}
        accessibilityLabel={`${label} 탭, ${count}개의 투표`}
      >
        <Text
          variant="sm"
          weight={isActive ? 'semibold' : 'medium'}
          color={isActive ? tokens.colors.white : theme.textSecondary}
        >
          {label}
        </Text>
        {count > 0 && (
          <View
            style={[
              countBadgeStyle,
              {
                backgroundColor: isActive
                  ? 'rgba(255,255,255,0.2)'
                  : isDark ? theme.backgroundTertiary : tokens.colors.neutral[200],
              },
            ]}
          >
            <Text
              variant="xs"
              weight="semibold"
              color={isActive ? tokens.colors.white : theme.textSecondary}
            >
              {count}
            </Text>
          </View>
        )}
      </Button>
    </Animated.View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing[6],
    },
    loadingContainer: {
      flex: 1,
      padding: spacing[4],
    },
    skeletonCard: {
      height: 140,
      marginBottom: spacing[3],
      borderRadius: 20,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    // PagerView styles
    pagerView: {
      flex: 1,
    },
    pageContainer: {
      flex: 1,
    },
    sessionCard: {
      position: 'relative',
      overflow: 'hidden',
      marginHorizontal: spacing[4],
      marginTop: spacing[2],
      marginBottom: spacing[2],
      padding: spacing[4],
      borderRadius: tokens.borderRadius.lg,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: isDark ? theme.border : tokens.colors.primary[100],
      ...(isDark ? {} : tokens.shadows.sm),
    },
    sessionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing[3],
      gap: spacing[3],
    },
    sessionBadge: {
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[1],
      borderRadius: tokens.borderRadius.full,
      backgroundColor: isDark ? theme.backgroundSecondary : tokens.colors.primary[50],
    },
    sessionBadgeText: {
      fontSize: tokens.typography.fontSize.xs,
      fontWeight: tokens.typography.fontWeight.semibold,
      color: tokens.colors.primary[isDark ? 300 : 700],
    },
    sessionCountText: {
      flexShrink: 1,
      textAlign: 'right',
      fontSize: tokens.typography.fontSize.sm,
      fontWeight: tokens.typography.fontWeight.semibold,
      color: theme.textSecondary,
    },
    sessionTitle: {
      marginBottom: spacing[1],
      fontSize: tokens.typography.fontSize.xl,
      fontWeight: tokens.typography.fontWeight.bold,
      color: theme.text,
    },
    sessionDescription: {
      marginBottom: spacing[4],
      fontSize: tokens.typography.fontSize.sm,
      lineHeight: tokens.typography.fontSize.sm * 1.45,
      color: theme.textSecondary,
    },
    sessionActions: {
      width: '100%',
    },
    // Tab row with join button
    tabRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
      gap: spacing[3],
    },
    // Tab styles
    tabContainer: {
      flex: 1,
      flexDirection: 'row',
      gap: spacing[2],
    },
    // List styles
    listContent: {
      paddingHorizontal: spacing[4],
      paddingBottom: spacing[6],
    },
    cardWrapper: {
      // For animation wrapper
    },
    separator: {
      height: spacing[3], // 12px
    },
    createButton: {
      position: 'absolute',
      right: spacing[4],
      bottom: spacing[5],
      minWidth: 120,
      ...tokens.shadows.lg,
    },
  });
