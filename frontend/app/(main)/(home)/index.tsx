import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { HomeHeader } from '../../../src/components/home/HomeHeader';
import { SectionHeader } from '../../../src/components/home/SectionHeader';
import { PollCard, PollCardData } from '../../../src/components/patterns/PollCard';
import { PollEmptyState } from '../../../src/components/home/PollEmptyState';
import { LoadingSpinner } from '../../../src/components/states/LoadingSpinner';
import { Text } from '../../../src/components/primitives/Text';
import { Button } from '../../../src/components/primitives/Button';
import { tokens, spacing, fontSizes } from '../../../src/theme';

/**
 * Home Screen - 진행 중인 투표 화면
 *
 * Spec: prd/design/05-complete-ui-specification.md - 섹션 2.2
 *
 * Layout:
 * - Header: Circle 이름, 알림, 프로필
 * - Section: 진행 중인 투표 목록
 * - Empty State: 투표가 없을 때
 */
export default function HomeScreen() {
  const router = useRouter();

  // TODO: API 연동 - useActivePolls() 훅으로 대체
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data - API 연동 후 제거
  const mockPolls: PollCardData[] = [
    {
      id: '1',
      question: '가장 친절한 사람은?',
      emoji: '😊',
      timeRemaining: '2시간 23분 남음',
      participantCount: 12,
      totalMembers: 16,
      participationRate: 75,
    },
    {
      id: '2',
      question: '가장 잘생긴/예쁜 사람은?',
      emoji: '✨',
      timeRemaining: '5시간 10분 남음',
      participantCount: 8,
      totalMembers: 16,
      participationRate: 50,
    },
    {
      id: '3',
      question: '가장 창의적인 사람은?',
      emoji: '🎨',
      timeRemaining: '1시간 45분 남음',
      participantCount: 14,
      totalMembers: 16,
      participationRate: 88,
    },
  ];

  const activePolls = mockPolls; // TODO: API data로 대체
  const circleName = 'OO고 2학년 1반'; // TODO: 현재 선택된 Circle 이름

  // Pull to Refresh
  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: API refetch
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  // 투표 카드 클릭
  const handlePollPress = (pollId: string) => {
    router.push(`/poll/${pollId}` as any);
  };

  // 알림 클릭
  const handleNotificationPress = () => {
    router.push('/notifications' as any);
  };

  // 프로필 클릭
  const handleProfilePress = () => {
    router.push('/(main)/(profile)' as any);
  };

  // 투표 만들기
  const handleCreatePoll = () => {
    router.push('/(main)/(create)' as any);
  };

  // 로딩 중
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <LoadingSpinner />
      </View>
    );
  }

  // 에러
  if (isError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>투표 목록을 불러올 수 없습니다</Text>
        <Button onPress={onRefresh}>다시 시도</Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <HomeHeader
        circleName={circleName}
        notificationCount={0} // TODO: API에서 가져오기
        onNotificationPress={handleNotificationPress}
        onProfilePress={handleProfilePress}
      />

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={
          activePolls.length === 0 ? styles.scrollContentCenter : styles.scrollContent
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tokens.colors.primary[500]}
          />
        }
      >
        {activePolls.length === 0 ? (
          // Empty State
          <PollEmptyState onCreatePoll={handleCreatePoll} />
        ) : (
          // Poll List
          <>
            <SectionHeader title="진행 중인 투표" count={activePolls.length} />
            <View style={styles.pollList}>
              {activePolls.map((poll) => (
                <PollCard
                  key={poll.id}
                  poll={poll}
                  onPress={() => handlePollPress(poll.id)}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.neutral[50],
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.colors.neutral[50],
    padding: spacing[6], // 24px
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing[6], // 24px
  },
  scrollContentCenter: {
    flexGrow: 1,
  },
  pollList: {
    paddingHorizontal: spacing[4], // 16px
  },
  errorText: {
    fontSize: fontSizes.base,
    color: tokens.colors.neutral[600],
    marginBottom: spacing[6],
    textAlign: 'center',
  },
});
