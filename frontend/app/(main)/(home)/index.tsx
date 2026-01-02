import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  ListRenderItem,
  AccessibilityInfo,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';

import { HomeHeader } from '../../../src/components/home/HomeHeader';
import { SectionHeader } from '../../../src/components/home/SectionHeader';
import {
  PollCard,
  ActivePollData,
  CompletedPollData,
} from '../../../src/components/patterns/PollCard';
import { EmptyState } from '../../../src/components/states/EmptyState';
import { LoadingSpinner } from '../../../src/components/states/LoadingSpinner';
import { Skeleton, SkeletonCard } from '../../../src/components/states/Skeleton';
import { Text } from '../../../src/components/primitives/Text';
import { Button } from '../../../src/components/primitives/Button';
import { tokens, spacing, fontSizes, animations } from '../../../src/theme';
import {
  useMyActivePolls,
  useMyCompletedPolls,
  useRefreshPolls,
} from '../../../src/hooks/usePolls';
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

interface TransformedCompletedPoll extends CompletedPollData {}

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
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [refreshing, setRefreshing] = useState(false);

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

  // 현재 활성 Circle 이름 (TODO: useCircle 훅에서 가져오기)
  const circleName = 'OO고 2학년 1반';

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
        circleName: poll.circle_name || circleName,
        timeRemaining: formatTimeRemaining(poll.ends_at),
        participantCount: poll.vote_count || 0,
        totalMembers: poll.total_members || 15,
        participationRate: Math.round(
          ((poll.vote_count || 0) / (poll.total_members || 15)) * 100
        ),
        voteStatus: poll.has_voted ? 'voted' : 'not_voted',
        rawEndsAt: poll.ends_at,
      }))
      .sort((a, b) => new Date(a.rawEndsAt).getTime() - new Date(b.rawEndsAt).getTime());
  }, [activePolls, circleName]);

  const transformedCompletedPolls: TransformedCompletedPoll[] = useMemo(() => {
    if (!completedPolls) return [];

    return completedPolls.map((poll) => ({
      id: poll.id,
      question: poll.question,
      emoji: poll.emoji || '📊',
      circleName: poll.circle_name || circleName,
      winner: {
        name: poll.winner_name || '알 수 없음',
        voteCount: poll.winner_vote_count || 0,
      },
    }));
  }, [completedPolls, circleName]);

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
  }, []);

  // 투표 카드 클릭 - Active
  const handleActivePollPress = useCallback(
    (pollId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push(`/poll/${pollId}/vote` as any);
    },
    [router]
  );

  // 투표 카드 클릭 - Completed
  const handleCompletedPollPress = useCallback(
    (pollId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push(`/poll/${pollId}/result` as any);
    },
    [router]
  );

  // 알림 클릭
  const handleNotificationPress = useCallback(() => {
    router.push('/notifications' as any);
  }, [router]);

  // 프로필 클릭
  const handleProfilePress = useCallback(() => {
    router.push('/(main)/(profile)' as any);
  }, [router]);

  // 투표 만들기
  const handleCreatePoll = useCallback(() => {
    router.push('/(main)/(create)' as any);
  }, [router]);

  // ============================================================================
  // Render Helpers
  // ============================================================================

  const isLoading = activeTab === 'active' ? isLoadingActive : isLoadingCompleted;
  const isError = activeTab === 'active' ? isErrorActive : isErrorCompleted;
  const polls = activeTab === 'active' ? transformedActivePolls : transformedCompletedPolls;

  // Active Poll Render Item
  const renderActiveItem: ListRenderItem<TransformedActivePoll> = useCallback(
    ({ item, index }) => (
      <Animated.View
        entering={FadeIn.delay(index * 50).duration(300)}
        style={styles.cardWrapper}
      >
        <PollCard
          variant="active"
          poll={item}
          onPress={() => handleActivePollPress(item.id)}
        />
      </Animated.View>
    ),
    [handleActivePollPress]
  );

  // Completed Poll Render Item
  const renderCompletedItem: ListRenderItem<TransformedCompletedPoll> = useCallback(
    ({ item, index }) => (
      <Animated.View
        entering={FadeIn.delay(index * 50).duration(300)}
        style={styles.cardWrapper}
      >
        <PollCard
          variant="completed"
          poll={item}
          onPress={() => handleCompletedPollPress(item.id)}
        />
      </Animated.View>
    ),
    [handleCompletedPollPress]
  );

  const keyExtractor = useCallback((item: { id: string }) => item.id, []);

  const ItemSeparatorComponent = useCallback(() => <View style={styles.separator} />, []);

  // ============================================================================
  // Loading State
  // ============================================================================

  if (isLoading && !refreshing) {
    return (
      <View style={styles.container}>
        <HomeHeader
          circleName={circleName}
          notificationCount={0}
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
      <View style={styles.container}>
        <HomeHeader
          circleName={circleName}
          notificationCount={0}
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
    <View style={styles.container}>
      {/* Header */}
      <HomeHeader
        circleName={circleName}
        notificationCount={0}
        onNotificationPress={handleNotificationPress}
        onProfilePress={handleProfilePress}
      />

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TabButton
          label="진행 중"
          count={transformedActivePolls.length}
          isActive={activeTab === 'active'}
          onPress={() => handleTabChange('active')}
        />
        <TabButton
          label="완료됨"
          count={transformedCompletedPolls.length}
          isActive={activeTab === 'completed'}
          onPress={() => handleTabChange('completed')}
        />
      </View>

      {/* Content */}
      {polls.length === 0 ? (
        // Empty State
        <View style={styles.emptyContainer}>
          <EmptyState
            variant={activeTab === 'active' ? 'no-active-polls' : 'no-completed-polls'}
            onAction={activeTab === 'active' ? handleCreatePoll : undefined}
          />
        </View>
      ) : (
        // Poll List
        <FlatList
          data={polls as any}
          renderItem={activeTab === 'active' ? (renderActiveItem as any) : (renderCompletedItem as any)}
          keyExtractor={keyExtractor}
          ItemSeparatorComponent={ItemSeparatorComponent}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={tokens.colors.primary[500]}
              colors={[tokens.colors.primary[500]]}
            />
          }
          showsVerticalScrollIndicator={false}
          // Performance optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={5}
          getItemLayout={(_, index) => ({
            length: 140, // Estimated item height
            offset: 140 * index + 12 * index, // height + separator
            index,
          })}
          // Accessibility
          accessibilityRole="list"
          accessibilityLabel={
            activeTab === 'active'
              ? `진행 중인 투표 목록, ${polls.length}개`
              : `완료된 투표 목록, ${polls.length}개`
          }
        />
      )}
    </View>
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
}

function TabButton({ label, count, isActive, onPress }: TabButtonProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: isActive
      ? tokens.colors.primary[500]
      : tokens.colors.neutral[100],
  }));

  return (
    <Animated.View style={[styles.tabButton, animatedStyle]}>
      <Button
        variant="ghost"
        size="sm"
        onPress={onPress}
        style={styles.tabButtonInner}
        accessibilityRole="tab"
        accessibilityState={{ selected: isActive }}
        accessibilityLabel={`${label} 탭, ${count}개의 투표`}
      >
        <Text
          variant="sm"
          weight={isActive ? 'semibold' : 'medium'}
          color={isActive ? tokens.colors.white : tokens.colors.neutral[600]}
        >
          {label}
        </Text>
        {count > 0 && (
          <View
            style={[
              styles.countBadge,
              {
                backgroundColor: isActive
                  ? 'rgba(255,255,255,0.2)'
                  : tokens.colors.neutral[200],
              },
            ]}
          >
            <Text
              variant="xs"
              weight="semibold"
              color={isActive ? tokens.colors.white : tokens.colors.neutral[600]}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.neutral[50],
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
  },
  // Tab styles
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[2],
  },
  tabButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tabButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    gap: spacing[2],
  },
  countBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
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
});
