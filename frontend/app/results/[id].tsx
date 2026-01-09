import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { tokens } from '../../src/theme';
import { useCurrentUser } from '../../src/hooks/useAuth';
import { usePollDetail } from '../../src/hooks/usePolls';
import { LoadingSpinner, EmptyState } from '../../src/components/states';

/**
 * 투표 결과 화면
 *
 * 투표 결과를 실시간으로 확인합니다.
 * - 득표 순위별 막대 그래프
 * - 각 선택지별 득표 수/비율
 * - 총 참여자 수
 * - 결과 공유하기 버튼
 */
export default function ResultsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: currentUser } = useCurrentUser();
  const isOrbMode = currentUser?.is_orb_mode ?? false;

  // 투표 결과 API 연동
  const { data: poll, isLoading, error, refetch } = usePollDetail(id ?? '');

  const handleShare = () => {
    // TODO: 결과 공유 기능 구현
    console.log('Share results:', id);
  };

  const handleOrbMode = () => {
    if (isOrbMode) {
      // Orb Mode 활성화됨 - 투표자 공개 화면으로 이동
      router.push(`/results/${id}/voters`);
    } else {
      // Orb Mode 필요 안내 (TODO: 구독 유도 모달)
      console.log('Orb Mode subscription required');
    }
  };

  const getBarWidth = (percentage: number) => {
    return `${percentage}%` as const;
  };

  // ID 유효성 검증
  if (!id) {
    return (
      <>
        <Stack.Screen
          options={{
            title: '투표 결과',
            headerShown: true,
            headerBackTitle: '뒤로',
          }}
        />
        <View style={styles.container}>
          <EmptyState
            variant="network-error"
            title="잘못된 접근이에요"
            description="투표를 찾을 수 없습니다"
          />
        </View>
      </>
    );
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: '투표 결과',
            headerShown: true,
            headerBackTitle: '뒤로',
          }}
        />
        <View style={styles.container}>
          <LoadingSpinner />
        </View>
      </>
    );
  }

  // 에러 상태
  if (error || !poll) {
    return (
      <>
        <Stack.Screen
          options={{
            title: '투표 결과',
            headerShown: true,
            headerBackTitle: '뒤로',
          }}
        />
        <View style={styles.container}>
          <EmptyState
            variant="network-error"
            title="결과를 불러올 수 없어요"
            description="잠시 후 다시 시도해주세요"
            onAction={() => refetch()}
          />
        </View>
      </>
    );
  }

  // 결과 없음 상태 (투표 전이거나 결과가 없는 경우)
  if (!poll.results || poll.results.length === 0) {
    return (
      <>
        <Stack.Screen
          options={{
            title: '투표 결과',
            headerShown: true,
            headerBackTitle: '뒤로',
          }}
        />
        <View style={styles.container}>
          <EmptyState
            variant="no-results"
            title="아직 결과가 없어요"
            description="투표에 참여하면 결과를 볼 수 있어요"
          />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: '투표 결과',
          headerShown: true,
          headerBackTitle: '뒤로',
        }}
      />

      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* 질문 헤더 */}
          <View style={styles.header}>
            <Text style={styles.emoji}>{poll.emoji || '🗳️'}</Text>
            <Text style={styles.question}>{poll.question_text}</Text>
            <Text style={styles.stats}>총 {poll.vote_count}명 참여</Text>
          </View>

          {/* 결과 리스트 */}
          <View style={styles.resultsList}>
            {poll.results.map((result, index) => (
              <View key={result.user_id} style={styles.resultItem}>
                {/* 순위 */}
                <View style={styles.rank}>
                  {index === 0 && <Text style={styles.rankEmoji}>👑</Text>}
                  <Text style={styles.rankNumber}>{index + 1}</Text>
                </View>

                {/* 이름과 득표 정보 */}
                <View style={styles.resultInfo}>
                  <View style={styles.resultHeader}>
                    <Text style={styles.resultName}>{result.nickname || '익명'}</Text>
                    <Text style={styles.resultVotes}>
                      {result.vote_count}표 ({result.vote_percentage}%)
                    </Text>
                  </View>

                  {/* 막대 그래프 */}
                  <View style={styles.barContainer}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: getBarWidth(result.vote_percentage),
                          backgroundColor:
                            index === 0
                              ? tokens.colors.primary[500]
                              : tokens.colors.primary[300],
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* 투표 종료 정보 */}
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              ⏰ 투표가 종료되었어요
            </Text>
            <Text style={styles.infoSubtext}>
              결과를 친구들과 공유해보세요!
            </Text>
          </View>

          {/* Orb Mode 버튼 */}
          <Pressable
            style={[
              styles.orbModeButton,
              !isOrbMode && styles.orbModeButtonDisabled,
            ]}
            onPress={handleOrbMode}
          >
            <View style={styles.orbModeContent}>
              <Text style={styles.orbModeIcon}>
                {isOrbMode ? '🔮' : '🔒'}
              </Text>
              <View style={styles.orbModeTextContainer}>
                <Text style={[
                  styles.orbModeTitle,
                  !isOrbMode && styles.orbModeTitleDisabled,
                ]}>
                  누가 나를 선택했는지 보기
                </Text>
                <Text style={[
                  styles.orbModeSubtitle,
                  !isOrbMode && styles.orbModeSubtitleDisabled,
                ]}>
                  {isOrbMode ? '투표자를 확인해보세요' : 'Orb Mode 구독 필요'}
                </Text>
              </View>
              <Text style={styles.orbModeArrow}>→</Text>
            </View>
          </Pressable>
        </ScrollView>

        {/* 하단 액션 버튼 */}
        <View style={styles.footer}>
          <Pressable
            style={[styles.actionButton, styles.shareButton]}
            onPress={handleShare}
          >
            <Text style={styles.shareButtonText}>📤 결과 공유하기</Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.neutral[50],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: tokens.spacing.lg,
    paddingBottom: 140,
  },
  header: {
    alignItems: 'center',
    marginBottom: tokens.spacing.xl,
  },
  emoji: {
    fontSize: 64,
    lineHeight: 76,  // fontSize * 1.2 (iOS 잘림 방지)
    marginBottom: tokens.spacing.md,
    textAlign: 'center',
  },
  question: {
    fontSize: tokens.typography.fontSize['2xl'],
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.neutral[900],
    textAlign: 'center',
    marginBottom: tokens.spacing.sm,
  },
  stats: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.neutral[500],
  },
  resultsList: {
    gap: tokens.spacing.lg,
  },
  resultItem: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
  },
  rank: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  rankEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  rankNumber: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.neutral[400],
  },
  resultInfo: {
    flex: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
  },
  resultName: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.neutral[900],
  },
  resultVotes: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.primary[600],
  },
  barContainer: {
    height: 12,
    backgroundColor: tokens.colors.neutral[200],
    borderRadius: tokens.borderRadius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: tokens.borderRadius.full,
  },
  infoCard: {
    backgroundColor: tokens.colors.primary[50],
    padding: tokens.spacing.lg,
    borderRadius: tokens.borderRadius.lg,
    marginTop: tokens.spacing.xl,
    alignItems: 'center',
  },
  infoText: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.primary[700],
    marginBottom: tokens.spacing.xs,
  },
  infoSubtext: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.primary[600],
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: tokens.spacing.lg,
    backgroundColor: tokens.colors.white,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.neutral[200],
    gap: tokens.spacing.sm,
  },
  actionButton: {
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.borderRadius.lg,
    alignItems: 'center',
  },
  shareButton: {
    backgroundColor: tokens.colors.primary[500],
  },
  shareButtonText: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.white,
  },
  // Orb Mode 버튼 스타일
  orbModeButton: {
    marginTop: tokens.spacing.lg,
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.borderRadius.lg,
    borderWidth: 2,
    borderColor: tokens.colors.primary[400],
    padding: tokens.spacing.lg,
  },
  orbModeButtonDisabled: {
    borderColor: tokens.colors.neutral[300],
    backgroundColor: tokens.colors.neutral[100],
  },
  orbModeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
  },
  orbModeIcon: {
    fontSize: 32,
    lineHeight: 40,  // fontSize * 1.25 (iOS 잘림 방지)
    textAlign: 'center',
  },
  orbModeTextContainer: {
    flex: 1,
  },
  orbModeTitle: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.primary[700],
    marginBottom: 2,
  },
  orbModeTitleDisabled: {
    color: tokens.colors.neutral[500],
  },
  orbModeSubtitle: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.primary[500],
  },
  orbModeSubtitleDisabled: {
    color: tokens.colors.neutral[400],
  },
  orbModeArrow: {
    fontSize: tokens.typography.fontSize.xl,
    color: tokens.colors.primary[400],
  },
});
