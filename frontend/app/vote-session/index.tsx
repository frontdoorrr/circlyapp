import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoadingSpinner } from '../../src/components/states/LoadingSpinner';
import { Text } from '../../src/components/primitives/Text';
import { Button } from '../../src/components/primitives/Button';
import { VoteCard, VoteOption } from '../../src/components/patterns/VoteCard';
import { VoteCelebration } from '../../src/components/patterns/VoteCelebration';
import { useCircleMembers } from '../../src/hooks/useCircles';
import { useCurrentUser } from '../../src/hooks/useAuth';
import { useMyActivePolls, usePollDetail, useVote } from '../../src/hooks/usePolls';
import { useToast } from '../../src/providers/ToastProvider';
import { tokens } from '../../src/theme';
import { useThemedStyles } from '../../src/theme/ThemeContext';
import type { Theme } from '../../src/theme/tokens';
import type { MemberInfo } from '../../src/types/circle';
import type { PollResponse } from '../../src/types/poll';
import { buildVoteSessionQueue } from '../../src/utils/voteSession';

function sampleMembers(members: MemberInfo[], count = 4): MemberInfo[] {
  const shuffled = [...members];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled.slice(0, count);
}

function formatSessionTime(endsAt?: string): string {
  if (!endsAt) return '';

  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return '마감됨';

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0) return `${hours}:${String(remainingMinutes).padStart(2, '0')}`;
  return `${Math.max(1, remainingMinutes)}분`;
}

export default function VoteSessionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const { circleId } = useLocalSearchParams<{ circleId?: string }>();
  const scopedCircleId = Array.isArray(circleId) ? circleId[0] : circleId;
  const { showToast } = useToast();

  const { data: activePolls, isLoading, isError, refetch } = useMyActivePolls();
  const { data: currentUser } = useCurrentUser();
  const voteMutation = useVote();

  const initialQueue = useMemo(
    () => buildVoteSessionQueue(activePolls, { circleId: scopedCircleId }),
    [activePolls, scopedCircleId]
  );
  const [queue, setQueue] = useState<PollResponse[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
  const [candidates, setCandidates] = useState<MemberInfo[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const isVotingRef = useRef(false);

  useEffect(() => {
    setQueue([]);
    setCurrentIndex(0);
    setIsComplete(false);
  }, [scopedCircleId]);

  useEffect(() => {
    if (queue.length === 0 && initialQueue.length > 0 && !isComplete) {
      setQueue(initialQueue);
      setCurrentIndex(0);
    }
  }, [initialQueue, isComplete, queue.length]);

  const currentPollFromQueue = queue[currentIndex];
  const { data: pollDetail, isLoading: pollLoading } = usePollDetail(currentPollFromQueue?.id ?? '');
  const currentPoll = pollDetail ?? currentPollFromQueue;
  const { data: members, isLoading: membersLoading } = useCircleMembers(currentPoll?.circle_id ?? '');

  const eligibleMembers = useMemo(
    () => (members ?? []).filter((member) => member.user_id !== currentUser?.id),
    [currentUser?.id, members]
  );

  useEffect(() => {
    setCandidates(sampleMembers(eligibleMembers));
    setSelectedUserId(undefined);
  }, [eligibleMembers, currentPoll?.id]);

  const canShuffle = eligibleMembers.length > 4;
  const voteOptions: VoteOption[] = candidates.map((member) => ({
    id: member.user_id,
    name: member.nickname || member.display_name || member.username || '익명',
    emoji: member.profile_emoji,
  }));

  const advance = useCallback(() => {
    setShowCelebration(false);
    setSelectedUserId(undefined);

    if (currentIndex + 1 >= queue.length) {
      setIsComplete(true);
      return;
    }

    setCurrentIndex((index) => index + 1);
  }, [currentIndex, queue.length]);

  const handleSkip = useCallback(() => {
    Haptics.selectionAsync();
    advance();
  }, [advance]);

  const handleShuffle = useCallback(() => {
    if (!canShuffle) return;
    Haptics.selectionAsync();
    setCandidates(sampleMembers(eligibleMembers));
    setSelectedUserId(undefined);
  }, [canShuffle, eligibleMembers]);

  const handleSelect = useCallback(
    async (userId: string) => {
      if (!currentPoll || isVotingRef.current || voteMutation.isPending) return;

      isVotingRef.current = true;
      setSelectedUserId(userId);

      try {
        await voteMutation.mutateAsync({
          pollId: currentPoll.id,
          data: { voted_for_id: userId },
        });
        setShowCelebration(true);
      } catch (error) {
        setSelectedUserId(undefined);
        showToast(error instanceof Error ? error.message : '투표 중 문제가 발생했습니다', 'error');
      } finally {
        isVotingRef.current = false;
      }
    },
    [currentPoll, showToast, voteMutation]
  );

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  const progressText = queue.length > 0 ? `${currentIndex + 1}/${queue.length}` : '0/0';
  const progressPercent = queue.length > 0 ? ((currentIndex + 1) / queue.length) * 100 : 0;
  const circleName = currentPoll?.circle_name ?? 'Circle';
  const isScreenLoading =
    isLoading ||
    (queue.length > 0 && (pollLoading || membersLoading) && !currentPoll);

  if (isScreenLoading) {
    return (
      <View style={[styles.container, styles.centerContainer, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <LoadingSpinner />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.container, styles.centerContainer, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.emptyTitle}>투표를 불러오지 못했어요</Text>
        <Text style={styles.emptyDescription}>잠시 후 다시 시도해주세요.</Text>
        <Button onPress={handleRetry}>다시 불러오기</Button>
      </View>
    );
  }

  if (isComplete) {
    return (
      <View style={[styles.container, styles.completeContainer, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.completeMark}>
          <Text style={styles.completeMarkText}>✓</Text>
        </View>
        <Text style={styles.completeTitle}>세션 완료</Text>
        <Text style={styles.completeDescription}>
          답할 수 있는 투표를 모두 확인했어요.
        </Text>
        <View style={styles.completeActions}>
          <Button fullWidth onPress={() => router.replace('/(main)/(0-home)' as any)}>
            홈으로 가기
          </Button>
          <Button
            fullWidth
            variant="secondary"
            onPress={() => router.push('/create' as any)}
          >
            새 투표 만들기
          </Button>
        </View>
      </View>
    );
  }

  if (!currentPoll || queue.length === 0) {
    return (
      <View style={[styles.container, styles.centerContainer, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.emptyTitle}>지금 답할 투표가 없어요</Text>
        <Text style={styles.emptyDescription}>
          새 Circle에 참여하거나 친구들이 만든 투표를 기다려보세요.
        </Text>
        <View style={styles.emptyActions}>
          <Button fullWidth onPress={() => router.push('/join/invite-code' as any)}>
            Circle 참여하기
          </Button>
          <Button fullWidth variant="secondary" onPress={() => router.back()}>
            돌아가기
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="투표 세션 닫기"
          style={styles.closeButton}
        >
          <Text style={styles.closeText}>×</Text>
        </Pressable>
        <View style={styles.progressCenter}>
          <Text style={styles.progressText}>{progressText}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>
        <Text style={styles.timeText}>{formatSessionTime(currentPoll.ends_at)}</Text>
      </View>

      <View style={styles.circlePill}>
        <Text style={styles.circlePillText} numberOfLines={1}>
          {circleName}
        </Text>
      </View>

      <View style={styles.voteArea}>
        <VoteCard
          question={currentPoll.question || currentPoll.question_text}
          options={voteOptions}
          selectedId={selectedUserId}
          onSelect={handleSelect}
          disabled={voteMutation.isPending || showCelebration || voteOptions.length === 0}
        />
      </View>

      <View style={[styles.bottomActions, { paddingBottom: Math.max(insets.bottom, tokens.spacing.lg) }]}>
        <Button
          variant="ghost"
          onPress={handleSkip}
          disabled={voteMutation.isPending}
          style={styles.bottomButton}
        >
          건너뛰기
        </Button>
        <Button
          variant="secondary"
          onPress={handleShuffle}
          disabled={!canShuffle || voteMutation.isPending}
          style={styles.bottomButton}
        >
          섞기
        </Button>
      </View>

      {voteOptions.length === 0 && (
        <View style={styles.noCandidates}>
          <Text style={styles.noCandidatesText}>선택할 멤버가 부족해요</Text>
        </View>
      )}

      {showCelebration && (
        <VoteCelebration
          message="전송 완료"
          onComplete={advance}
        />
      )}
    </View>
  );
}

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    centerContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: tokens.spacing.lg,
    },
    topBar: {
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: tokens.spacing.md,
      gap: tokens.spacing.md,
    },
    closeButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeText: {
      fontSize: 32,
      lineHeight: 36,
      color: theme.text,
    },
    progressCenter: {
      flex: 1,
      alignItems: 'center',
      gap: tokens.spacing.xs,
    },
    progressText: {
      fontSize: tokens.typography.fontSize.sm,
      fontWeight: tokens.typography.fontWeight.bold,
      color: theme.text,
    },
    progressTrack: {
      width: '100%',
      height: 6,
      overflow: 'hidden',
      borderRadius: 3,
      backgroundColor: isDark ? theme.backgroundTertiary : tokens.colors.neutral[200],
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
      backgroundColor: tokens.colors.primary[500],
    },
    timeText: {
      width: 48,
      textAlign: 'right',
      fontSize: tokens.typography.fontSize.sm,
      fontWeight: tokens.typography.fontWeight.semibold,
      color: theme.textSecondary,
    },
    circlePill: {
      alignSelf: 'center',
      maxWidth: '82%',
      paddingHorizontal: tokens.spacing.md,
      paddingVertical: tokens.spacing.sm,
      borderRadius: tokens.borderRadius.full,
      backgroundColor: isDark ? theme.backgroundSecondary : tokens.colors.primary[50],
      borderWidth: 1,
      borderColor: isDark ? theme.border : tokens.colors.primary[100],
    },
    circlePillText: {
      fontSize: tokens.typography.fontSize.sm,
      fontWeight: tokens.typography.fontWeight.semibold,
      color: tokens.colors.primary[isDark ? 300 : 700],
    },
    voteArea: {
      flex: 1,
      justifyContent: 'flex-start',
      paddingTop: tokens.spacing.sm,
      paddingBottom: tokens.spacing.sm,
    },
    bottomActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: tokens.spacing.lg,
      paddingTop: tokens.spacing.sm,
      gap: tokens.spacing.md,
    },
    bottomButton: {
      flex: 1,
    },
    noCandidates: {
      position: 'absolute',
      left: tokens.spacing.lg,
      right: tokens.spacing.lg,
      bottom: 104,
      alignItems: 'center',
      padding: tokens.spacing.md,
      borderRadius: tokens.borderRadius.lg,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
    },
    noCandidatesText: {
      color: theme.textSecondary,
      fontSize: tokens.typography.fontSize.sm,
    },
    emptyTitle: {
      marginBottom: tokens.spacing.sm,
      textAlign: 'center',
      fontSize: tokens.typography.fontSize.xl,
      fontWeight: tokens.typography.fontWeight.bold,
      color: theme.text,
    },
    emptyDescription: {
      marginBottom: tokens.spacing.lg,
      textAlign: 'center',
      fontSize: tokens.typography.fontSize.base,
      color: theme.textSecondary,
    },
    emptyActions: {
      width: '100%',
      gap: tokens.spacing.md,
    },
    completeContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: tokens.spacing.lg,
    },
    completeMark: {
      width: 88,
      height: 88,
      borderRadius: 44,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: tokens.spacing.lg,
      backgroundColor: tokens.colors.success[500],
    },
    completeMarkText: {
      fontSize: 52,
      lineHeight: 60,
      color: tokens.colors.white,
      fontWeight: tokens.typography.fontWeight.bold,
    },
    completeTitle: {
      marginBottom: tokens.spacing.sm,
      fontSize: tokens.typography.fontSize['2xl'],
      fontWeight: tokens.typography.fontWeight.bold,
      color: theme.text,
    },
    completeDescription: {
      marginBottom: tokens.spacing.xl,
      textAlign: 'center',
      fontSize: tokens.typography.fontSize.base,
      color: theme.textSecondary,
    },
    completeActions: {
      width: '100%',
      gap: tokens.spacing.md,
    },
  });
