import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useMyCircles } from '../../../src/hooks/useCircles';
import { CircleCard } from '../../../src/components/home/CircleCard';
import { JoinCircleModal } from '../../../src/components/home/JoinCircleModal';
import { HomeEmptyState } from '../../../src/components/home/HomeEmptyState';
import { LoadingSpinner } from '../../../src/components/states/LoadingSpinner';
import { Text } from '../../../src/components/primitives/Text';
import { Button } from '../../../src/components/primitives/Button';
import { tokens } from '../../../src/theme';

/**
 * Home Screen
 *
 * Circle 목록 및 진행 중인 투표 화면
 */
export default function HomeScreen() {
  const router = useRouter();
  const [isJoinModalOpen, setJoinModalOpen] = useState(false);

  // Circle 목록 조회
  const { data: circles, isLoading, isError, refetch } = useMyCircles();

  // Pull to Refresh
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Circle 카드 클릭 → 상세 화면
  const handleCirclePress = (circleId: string) => {
    router.push(`/circle/${circleId}` as any);
  };

  // Circle 참여 성공 후
  const handleJoinSuccess = () => {
    refetch();
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
        <Text style={styles.errorText}>Circle 목록을 불러올 수 없습니다</Text>
        <Button onPress={() => refetch()}>다시 시도</Button>
      </View>
    );
  }

  // Circle이 없을 때
  if (!circles || circles.length === 0) {
    return (
      <>
        <HomeEmptyState onJoinCircle={() => setJoinModalOpen(true)} />
        <JoinCircleModal
          isOpen={isJoinModalOpen}
          onClose={() => setJoinModalOpen(false)}
          onSuccess={handleJoinSuccess}
        />
      </>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tokens.colors.primary[500]}
          />
        }
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.title}>내 Circle</Text>
          <TouchableOpacity onPress={() => setJoinModalOpen(true)}>
            <Text style={styles.headerButton}>➕ 참여</Text>
          </TouchableOpacity>
        </View>

        {/* Circle 목록 */}
        <View style={styles.circleList}>
          {circles.map((circle, index) => (
            <CircleCard
              key={circle.id}
              circle={circle}
              onPress={() => handleCirclePress(circle.id)}
              index={index}
            />
          ))}
        </View>

        {/* Circle 참여 버튼 */}
        <View style={styles.joinButtonContainer}>
          <Button
            variant="secondary"
            onPress={() => setJoinModalOpen(true)}
            fullWidth
          >
            ➕ 다른 Circle 참여하기
          </Button>
        </View>
      </ScrollView>

      {/* Circle 참여 모달 */}
      <JoinCircleModal
        isOpen={isJoinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        onSuccess={handleJoinSuccess}
      />
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
    padding: tokens.spacing.lg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: tokens.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
  },
  title: {
    fontSize: tokens.typography.fontSize['2xl'],
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.neutral[900],
  },
  headerButton: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.primary[600],
  },
  circleList: {
    marginBottom: tokens.spacing.lg,
  },
  joinButtonContainer: {
    marginTop: tokens.spacing.md,
    marginBottom: tokens.spacing.xl,
  },
  errorText: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.neutral[600],
    marginBottom: tokens.spacing.lg,
    textAlign: 'center',
  },
});
