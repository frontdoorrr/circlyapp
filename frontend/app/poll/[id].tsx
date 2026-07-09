/**
 * Poll Detail Screen
 *
 * 투표하기 및 결과 보기
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { usePollDetail, useVote } from '../../src/hooks/usePolls';
import { useCircleMembers } from '../../src/hooks/useCircles';
import { LoadingSpinner } from '../../src/components/states/LoadingSpinner';
import { Text } from '../../src/components/primitives/Text';
import { Button } from '../../src/components/primitives/Button';
import { ResultCard } from '../../src/components/share/ResultCard';
import { tokens } from '../../src/theme';
import { useTheme, useThemedStyles } from '../../src/theme/ThemeContext';
import type { Theme } from '../../src/theme/tokens';
import { ApiError } from '../../src/types/api';
import { useCurrentUser } from '../../src/hooks/useAuth';
import { VoteCard, VoteOption } from '../../src/components/patterns/VoteCard';
import { VoteCelebration } from '../../src/components/patterns/VoteCelebration';
import type { MemberInfo } from '../../src/types/circle';

function sampleMembers(members: MemberInfo[], count = 4): MemberInfo[] {
  const shuffled = [...members];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled.slice(0, count);
}

// 애니메이션 결과 바 컴포넌트
function AnimatedResultBar({ percentage, isDark, theme }: { percentage: number; isDark: boolean; theme: Theme }) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withSpring(percentage, {
      damping: 15,
      stiffness: 100,
    });
  }, [percentage]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  const containerStyle = {
    height: 8,
    backgroundColor: isDark ? theme.backgroundTertiary : tokens.colors.neutral[200],
    borderRadius: 4,
    overflow: 'hidden' as const,
  };

  const barStyle = {
    height: '100%' as const,
    backgroundColor: tokens.colors.primary[500],
    borderRadius: 4,
  };

  return (
    <View style={containerStyle}>
      <Animated.View style={[barStyle, animatedStyle]} />
    </View>
  );
}

export default function PollDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);

  // 사용자 정보 (Orb Mode 확인용)
  const { data: currentUser } = useCurrentUser();
  const isOrbMode = currentUser?.is_orb_mode ?? false;

  // Poll 정보 조회
  const { data: poll, isLoading: pollLoading } = usePollDetail(id);
  const { data: members, isLoading: membersLoading } = useCircleMembers(poll?.circle_id || '');

  // 투표 선택 상태
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<MemberInfo[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);

  // 실시간 카운트다운 상태
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // 결과 카드 참조 (이미지 캡처용)
  const resultCardRef = React.useRef<View | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  // 투표하기
  const voteMutation = useVote();

  // 중복 요청 방지를 위한 ref (React 상태보다 빠르게 업데이트)
  const isVotingRef = React.useRef(false);
  const handleVote = async () => {
    // 이미 투표 진행 중이면 무시 (중복 요청 방지)
    if (isVotingRef.current || voteMutation.isPending) {
      return;
    }

    if (!selectedUserId) {
      Alert.alert('선택 오류', '투표할 친구를 선택해주세요');
      return;
    }

    // 동기적으로 플래그 설정 (React 상태 업데이트보다 빠름)
    isVotingRef.current = true;

    try {
      await voteMutation.mutateAsync({
        pollId: id,
        data: { voted_for_id: selectedUserId }
      });

      setShowCelebration(true);
    } catch (error) {
      if (error instanceof ApiError) {
        Alert.alert('투표 실패', error.message);
      } else {
        Alert.alert('오류', '투표 중 문제가 발생했습니다');
      }
    } finally {
      // 투표 완료 후 플래그 해제
      isVotingRef.current = false;
    }
  };

  const eligibleMembers = useMemo(
    () => (members ?? []).filter((member) => member.user_id !== currentUser?.id),
    [members, currentUser?.id]
  );
  const canShuffle = eligibleMembers.length > 4;

  useEffect(() => {
    setCandidates(sampleMembers(eligibleMembers));
    setSelectedUserId(null);
  }, [eligibleMembers]);

  const handleShuffle = () => {
    if (!canShuffle) return;
    Haptics.selectionAsync();
    setCandidates(sampleMembers(eligibleMembers));
    setSelectedUserId(null);
  };

  const voteOptions: VoteOption[] = candidates.map((member) => ({
    id: member.user_id,
    name: member.nickname || member.display_name || member.username || '익명',
    emoji: member.profile_emoji,
  }));

  // 남은 시간 계산 (초 단위 포함)
  const calculateTimeRemaining = (endsAt: string): string => {
    const now = new Date();
    const end = new Date(endsAt);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return '마감됨';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) {
      return `${days}일 ${hours}시간 남음`;
    }

    if (hours > 0) {
      return `${hours}시간 ${minutes}분 ${seconds}초`;
    }

    if (minutes > 0) {
      return `${minutes}분 ${seconds}초`;
    }

    return `${seconds}초`;
  };

  // Orb Mode - 투표자 보기
  const handleOrbMode = () => {
    if (isOrbMode) {
      router.push(`/results/${id}/voters`);
    } else {
      // Orb Mode 구독 화면으로 이동
      router.push('/subscription');
    }
  };

  // 결과 카드 공유
  const handleShareResult = async () => {
    if (!resultCardRef.current || !poll) return;

    try {
      setIsSharing(true);

      // 결과 카드를 이미지로 캡처
      const uri = await captureRef(resultCardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      // 공유 가능한지 확인
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('오류', '이 기기에서는 공유 기능을 사용할 수 없습니다');
        return;
      }

      // 이미지 공유
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Circly 투표 결과 공유',
      });
    } catch (error) {
      console.error('Share failed:', error);
      Alert.alert('오류', '결과 공유에 실패했습니다');
    } finally {
      setIsSharing(false);
    }
  };

  // 실시간 카운트다운 타이머
  useEffect(() => {
    if (!poll || poll.status !== 'ACTIVE') return;

    // 초기 시간 설정
    setTimeRemaining(calculateTimeRemaining(poll.ends_at));

    // 1초마다 업데이트
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(poll.ends_at));
    }, 1000);

    return () => clearInterval(interval);
  }, [poll]);

  if (pollLoading || membersLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: '투표',
            headerBackTitle: '뒤로',
          }}
        />
        <View style={styles.centerContainer}>
          <LoadingSpinner />
        </View>
      </>
    );
  }

  if (!poll) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: '투표',
            headerBackTitle: '뒤로',
          }}
        />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>투표를 찾을 수 없습니다</Text>
          <Button onPress={() => router.back()}>돌아가기</Button>
        </View>
      </>
    );
  }

  // 투표 전 - 투표하기 화면
  if (!poll.has_voted && poll.status === 'ACTIVE') {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: '투표하기',
            headerBackTitle: '뒤로',
          }}
        />
        <View style={styles.container}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
          <View style={styles.voteProgress}>
            <Text style={styles.voteProgressText}>1 / 1</Text>
            <Text style={styles.timeRemaining}>
              ⏰ {timeRemaining}
            </Text>
          </View>

          <VoteCard
            question={poll.question_text}
            options={voteOptions}
            selectedId={selectedUserId ?? undefined}
            onSelect={setSelectedUserId}
            disabled={voteMutation.isPending}
          />

          <View style={styles.voteButtonContainer}>
            <View style={styles.voteActions}>
              <Button variant="ghost" onPress={() => router.back()}>
                건너뛰기
              </Button>
              <Button
                variant="secondary"
                onPress={handleShuffle}
                disabled={!canShuffle || voteMutation.isPending}
              >
                섞기
              </Button>
            </View>
            <Button
              onPress={handleVote}
              loading={voteMutation.isPending}
              disabled={!selectedUserId || voteMutation.isPending}
              fullWidth
            >
              선택 완료
            </Button>
          </View>
          </ScrollView>
          {showCelebration && (
            <VoteCelebration
              onComplete={() => router.replace(`/results/${id}` as any)}
            />
          )}
        </View>
      </>
    );
  }

  // 투표 후 - 결과 보기 화면
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: '투표 결과',
          headerBackTitle: '뒤로',
        }}
      />
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 질문 */}
        <View style={styles.questionCard}>
          <Text style={styles.question}>{poll.question_text}</Text>
          <Text style={styles.resultStatus}>
            {poll.status === 'COMPLETED' ? '✅ 마감됨' : '📊 투표 완료'}
          </Text>
        </View>

        {/* 결과 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            결과 (총 {poll.vote_count}표)
          </Text>

          <View style={styles.resultList}>
            {poll.results?.map((result, index) => (
              <View key={result.user_id} style={styles.resultItem}>
                <View style={styles.resultRank}>
                  <Text style={styles.resultRankText}>
                    {result.rank === 1 ? '🥇' : result.rank === 2 ? '🥈' : result.rank === 3 ? '🥉' : `${result.rank}위`}
                  </Text>
                </View>

                <View style={styles.resultAvatar}>
                  <Text style={styles.resultEmoji}>{result.profile_emoji}</Text>
                </View>

                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>
                    {result.nickname || '익명'}
                  </Text>

                  {/* 득표율 바 (애니메이션) */}
                  <AnimatedResultBar percentage={result.vote_percentage} isDark={isDark} theme={theme} />
                </View>

                <View style={styles.resultStats}>
                  <Text style={styles.resultVotes}>{result.vote_count}표</Text>
                  <Text style={styles.resultPercentage}>
                    {result.vote_percentage.toFixed(1)}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 공유 버튼 */}
        <View style={styles.shareSection}>
          <Button
            variant="secondary"
            onPress={handleShareResult}
            loading={isSharing}
            fullWidth
          >
            📤 결과 공유하기
          </Button>
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

        {/* 결과 카드 (화면 밖에 숨김 - 캡처용) */}
        <View style={styles.hiddenCard}>
          <ResultCard poll={poll} cardRef={resultCardRef} />
        </View>
      </View>
    </>
  );
}

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
      backgroundColor: theme.background,
      padding: tokens.spacing.lg,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: tokens.spacing.lg,
    },
    questionCard: {
      backgroundColor: theme.card,
      borderRadius: tokens.borderRadius.lg,
      padding: tokens.spacing.lg,
      marginBottom: tokens.spacing.lg,
      alignItems: 'center',
      ...(isDark
        ? { borderWidth: 1, borderColor: theme.border }
        : tokens.shadows.sm),
    },
    question: {
      fontSize: tokens.typography.fontSize['2xl'],
      fontWeight: tokens.typography.fontWeight.bold,
      color: theme.text,
      textAlign: 'center',
      marginBottom: tokens.spacing.sm,
    },
    timeRemaining: {
      fontSize: tokens.typography.fontSize.base,
      color: tokens.colors.primary[isDark ? 400 : 600],
    },
    resultStatus: {
      fontSize: tokens.typography.fontSize.base,
      color: tokens.colors.success[isDark ? 400 : 600],
    },
    section: {
      marginBottom: tokens.spacing.lg,
    },
    sectionTitle: {
      fontSize: tokens.typography.fontSize.lg,
      fontWeight: tokens.typography.fontWeight.semibold,
      color: theme.text,
      marginBottom: tokens.spacing.md,
    },
    memberGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: tokens.spacing.sm,
    },
    memberCard: {
      width: '48%',
      backgroundColor: theme.card,
      borderRadius: tokens.borderRadius.lg,
      padding: tokens.spacing.md,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.border,
    },
    memberCardSelected: {
      backgroundColor: isDark ? 'rgba(102, 126, 234, 0.15)' : tokens.colors.primary[50],
      borderColor: tokens.colors.primary[500],
    },
    memberCardAvatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: isDark ? tokens.colors.primary[900] : tokens.colors.primary[50],
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: tokens.spacing.sm,
    },
    memberCardEmoji: {
      fontSize: 36,
      lineHeight: 40,
      textAlign: 'center',
    },
    memberCardName: {
      fontSize: tokens.typography.fontSize.base,
      fontWeight: tokens.typography.fontWeight.semibold,
      color: theme.text,
      textAlign: 'center',
    },
    voteButtonContainer: {
      marginTop: tokens.spacing.lg,
      gap: tokens.spacing.md,
    },
    voteActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    voteProgress: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: tokens.spacing.lg,
      paddingTop: tokens.spacing.md,
    },
    voteProgressText: {
      fontSize: tokens.typography.fontSize.sm,
      fontWeight: tokens.typography.fontWeight.semibold,
      color: theme.textSecondary,
    },
    resultList: {
      gap: tokens.spacing.sm,
    },
    resultItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card,
      borderRadius: tokens.borderRadius.lg,
      padding: tokens.spacing.md,
      ...(isDark
        ? { borderWidth: 1, borderColor: theme.border }
        : tokens.shadows.sm),
    },
    resultRank: {
      width: 40,
      alignItems: 'center',
      marginRight: tokens.spacing.sm,
    },
    resultRankText: {
      fontSize: tokens.typography.fontSize.lg,
      fontWeight: tokens.typography.fontWeight.bold,
    },
    resultAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: isDark ? tokens.colors.primary[900] : tokens.colors.primary[50],
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: tokens.spacing.md,
    },
    resultEmoji: {
      fontSize: 24,
    },
    resultInfo: {
      flex: 1,
      marginRight: tokens.spacing.md,
    },
    resultName: {
      fontSize: tokens.typography.fontSize.base,
      fontWeight: tokens.typography.fontWeight.semibold,
      color: theme.text,
      marginBottom: tokens.spacing.xs,
    },
    resultBarContainer: {
      height: 8,
      backgroundColor: isDark ? theme.backgroundTertiary : tokens.colors.neutral[200],
      borderRadius: 4,
      overflow: 'hidden',
    },
    resultBar: {
      height: '100%',
      backgroundColor: tokens.colors.primary[500],
      borderRadius: 4,
    },
    resultStats: {
      alignItems: 'flex-end',
    },
    resultVotes: {
      fontSize: tokens.typography.fontSize.base,
      fontWeight: tokens.typography.fontWeight.bold,
      color: tokens.colors.primary[isDark ? 400 : 600],
    },
    resultPercentage: {
      fontSize: tokens.typography.fontSize.sm,
      color: theme.textSecondary,
    },
    shareSection: {
      marginTop: tokens.spacing.lg,
      marginBottom: tokens.spacing.xl,
    },
    errorText: {
      fontSize: tokens.typography.fontSize.base,
      color: theme.textSecondary,
      marginBottom: tokens.spacing.lg,
      textAlign: 'center',
    },
    hiddenCard: {
      position: 'absolute',
      left: -10000,
      top: 0,
    },
    // Orb Mode 버튼 스타일
    orbModeButton: {
      marginBottom: tokens.spacing.xl,
      backgroundColor: theme.card,
      borderRadius: tokens.borderRadius.lg,
      borderWidth: 2,
      borderColor: tokens.colors.primary[isDark ? 500 : 400],
      padding: tokens.spacing.lg,
    },
    orbModeButtonDisabled: {
      borderColor: theme.border,
      backgroundColor: theme.backgroundSecondary,
    },
    orbModeContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing.md,
    },
    orbModeIcon: {
      fontSize: 32,
      lineHeight: 40,
      textAlign: 'center',
    },
    orbModeTextContainer: {
      flex: 1,
    },
    orbModeTitle: {
      fontSize: tokens.typography.fontSize.base,
      fontWeight: tokens.typography.fontWeight.semibold,
      color: tokens.colors.primary[isDark ? 400 : 700],
      marginBottom: 2,
    },
    orbModeTitleDisabled: {
      color: theme.textTertiary,
    },
    orbModeSubtitle: {
      fontSize: tokens.typography.fontSize.sm,
      color: tokens.colors.primary[isDark ? 400 : 500],
    },
    orbModeSubtitleDisabled: {
      color: theme.textTertiary,
    },
    orbModeArrow: {
      fontSize: tokens.typography.fontSize.xl,
      color: tokens.colors.primary[isDark ? 400 : 400],
    },
  });
