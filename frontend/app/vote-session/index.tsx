import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { LoadingSpinner } from '../../src/components/states/LoadingSpinner';
import { Text } from '../../src/components/primitives/Text';
import { Button } from '../../src/components/primitives/Button';
import { VoteCard, VoteOption } from '../../src/components/patterns/VoteCard';
import {
  useAdvanceVoteSessionPoll,
  usePollCandidates,
  usePollDetail,
  useSkipVoteSessionPoll,
  useStartVoteSession,
  useVoteSessionAvailability,
  useVote,
} from '../../src/hooks/usePolls';
import { registerPushToken } from '../../src/api/notification';
import { useToast } from '../../src/providers/ToastProvider';
import { registerForPushNotificationsAsync } from '../../src/services/notification/pushNotification';
import { tokens } from '../../src/theme';
import { useThemedStyles } from '../../src/theme/ThemeContext';
import type { Theme } from '../../src/theme/tokens';
import type { VoteSessionAvailabilityResponse, VoteSessionResponse } from '../../src/types/poll';

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

function formatCooldownTime(seconds: number): string {
  if (seconds <= 0) return '곧 열려요';

  const minutes = Math.ceil(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0 && remainingMinutes > 0) return `${hours}시간 ${remainingMinutes}분`;
  if (hours > 0) return `${hours}시간`;
  return `${minutes}분`;
}

export default function VoteSessionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const { circleId } = useLocalSearchParams<{ circleId?: string }>();
  const scopedCircleId = Array.isArray(circleId) ? circleId[0] : circleId;
  const { showToast } = useToast();

  const voteMutation = useVote();
  const { mutateAsync: startSessionAsync, isPending: isStartingSession } = useStartVoteSession();
  const { mutateAsync: skipSessionAsync, isPending: isSkippingSession } = useSkipVoteSessionPoll();
  const { mutateAsync: advanceSessionAsync, isPending: isAdvancingSession } =
    useAdvanceVoteSessionPoll();
  const { refetch: refetchAvailability } = useVoteSessionAvailability(false);

  const [voteSession, setVoteSession] = useState<VoteSessionResponse | undefined>();
  const [sessionAvailability, setSessionAvailability] =
    useState<VoteSessionAvailabilityResponse | undefined>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [sessionError, setSessionError] = useState<string | undefined>();
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
  const [shuffleVersion, setShuffleVersion] = useState(0);
  const [isRegisteringPush, setIsRegisteringPush] = useState(false);
  const isVotingRef = useRef(false);

  const applySession = useCallback((session: VoteSessionResponse) => {
    setVoteSession(session);
    setCurrentIndex(session.current_index);
    setIsComplete(session.status === 'COMPLETED' || session.poll_ids.length === 0);
    setSelectedUserId(undefined);
    setShuffleVersion(0);
  }, []);

  const startSession = useCallback(async () => {
    setVoteSession(undefined);
    setCurrentIndex(0);
    setIsComplete(false);
    setSessionError(undefined);
    setSelectedUserId(undefined);
    setShuffleVersion(0);

    try {
      const availabilityResult = await refetchAvailability();
      if (availabilityResult.data && !availabilityResult.data.can_start) {
        setSessionAvailability(availabilityResult.data);
        setIsComplete(true);
        return;
      }
      setSessionAvailability(availabilityResult.data);

      const session = await startSessionAsync(
        scopedCircleId ? { circle_id: scopedCircleId } : {}
      );
      applySession(session);
    } catch (error) {
      setSessionError(error instanceof Error ? error.message : '투표를 불러오지 못했어요');
    }
  }, [applySession, refetchAvailability, scopedCircleId, startSessionAsync]);

  useEffect(() => {
    startSession();
  }, [startSession]);

  const currentPollId = voteSession?.poll_ids[currentIndex];
  const { data: currentPoll, isLoading: pollLoading } = usePollDetail(currentPollId ?? '');
  const {
    data: candidateResponse,
    isLoading: candidatesLoading,
    isFetching: candidatesFetching,
  } = usePollCandidates(currentPoll?.id ?? '', shuffleVersion);

  useEffect(() => {
    setShuffleVersion(0);
    setSelectedUserId(undefined);
  }, [currentPoll?.id]);

  const voteOptions: VoteOption[] = useMemo(
    () =>
      (candidateResponse?.candidates ?? []).map((candidate) => ({
        id: candidate.user_id,
        name: candidate.nickname || '익명',
        emoji: candidate.profile_emoji,
      })),
    [candidateResponse?.candidates]
  );
  const isNotEnoughCandidates = candidateResponse?.status === 'NOT_ENOUGH_CANDIDATES';
  const canShuffle = candidateResponse?.status === 'READY';

  const advanceLocally = useCallback(() => {
    setSelectedUserId(undefined);

    if (!voteSession || currentIndex + 1 >= voteSession.poll_ids.length) {
      setIsComplete(true);
      return;
    }

    setCurrentIndex((index) => index + 1);
  }, [currentIndex, voteSession]);

  useEffect(() => {
    if (!isComplete) return;

    refetchAvailability().then((result) => {
      if (result.data) {
        setSessionAvailability(result.data);
      }
    });
  }, [isComplete, refetchAvailability]);

  const handleSkip = useCallback(async () => {
    if (!voteSession || isSkippingSession) return;
    Haptics.selectionAsync();

    try {
      const session = await skipSessionAsync(voteSession.id);
      applySession(session);
      if (session.status === 'COMPLETED') {
        const availabilityResult = await refetchAvailability();
        if (availabilityResult.data) setSessionAvailability(availabilityResult.data);
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : '건너뛰기 중 문제가 발생했습니다', 'error');
    }
  }, [applySession, isSkippingSession, refetchAvailability, showToast, skipSessionAsync, voteSession]);

  const handleShuffle = useCallback(() => {
    if (!canShuffle) return;
    Haptics.selectionAsync();
    setSelectedUserId(undefined);
    setShuffleVersion((version) => version + 1);
  }, [canShuffle]);

  const handleSelect = useCallback(
    async (userId: string) => {
      if (!currentPoll || !voteSession || isVotingRef.current || voteMutation.isPending) return;

      isVotingRef.current = true;
      setSelectedUserId(userId);

      try {
        await voteMutation.mutateAsync({
          pollId: currentPoll.id,
          data: { voted_for_id: userId },
        });
        try {
          const session = await advanceSessionAsync(voteSession.id);
          applySession(session);
          if (session.status === 'COMPLETED') {
            const availabilityResult = await refetchAvailability();
            if (availabilityResult.data) setSessionAvailability(availabilityResult.data);
          }
        } catch {
          advanceLocally();
          showToast('투표는 완료됐지만 세션 상태 갱신에 실패했어요', 'error');
        }
      } catch (error) {
        setSelectedUserId(undefined);
        showToast(error instanceof Error ? error.message : '투표 중 문제가 발생했습니다', 'error');
      } finally {
        isVotingRef.current = false;
      }
    },
    [advanceLocally, advanceSessionAsync, applySession, currentPoll, refetchAvailability, showToast, voteMutation, voteSession]
  );

  const handleRetry = useCallback(() => {
    startSession();
  }, [startSession]);

  const totalCount = voteSession?.total_count ?? 0;
  const progressText = totalCount > 0 ? `${Math.min(currentIndex + 1, totalCount)}/${totalCount}` : '0/0';
  const progressPercent = totalCount > 0 ? ((currentIndex + 1) / totalCount) * 100 : 0;
  const circleName = currentPoll?.circle_name ?? 'Circle';
  const isScreenLoading =
    isStartingSession ||
    (!!currentPollId && (pollLoading || candidatesLoading) && !currentPoll);
  const cooldownSeconds = sessionAvailability?.remaining_seconds ?? 0;
  const isCoolingDown = !!sessionAvailability && !sessionAvailability.can_start && cooldownSeconds > 0;

  const handleInvite = useCallback(() => {
    if (scopedCircleId) {
      router.push(`/circle/${scopedCircleId}` as any);
      return;
    }
    router.push('/(main)/(1-circle)' as any);
  }, [router, scopedCircleId]);

  const handleEnableNotifications = useCallback(async () => {
    setIsRegisteringPush(true);
    try {
      const token = await registerForPushNotificationsAsync();
      if (!token) {
        showToast('알림 권한을 켜지 못했어요', 'error');
        return;
      }

      await registerPushToken(token);
      showToast('알림을 켰어요');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '알림 설정 중 문제가 발생했어요', 'error');
    } finally {
      setIsRegisteringPush(false);
    }
  }, [showToast]);

  if (isScreenLoading) {
    return (
      <View style={[styles.container, styles.centerContainer, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <LoadingSpinner />
      </View>
    );
  }

  if (sessionError) {
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
          {isCoolingDown
            ? `다음 세션까지 ${formatCooldownTime(cooldownSeconds)} 남았어요.\n친구가 새로 참여하면 바로 열려요.`
            : '답할 수 있는 투표를 모두 확인했어요.'}
        </Text>
        <View style={styles.completeActions}>
          <Button fullWidth onPress={handleInvite}>
            친구 초대하기
          </Button>
          <Button
            fullWidth
            variant="secondary"
            onPress={handleEnableNotifications}
            disabled={isRegisteringPush}
          >
            알림 켜기
          </Button>
          <Button fullWidth variant="ghost" onPress={() => router.replace('/(main)/(0-home)' as any)}>
            홈으로 가기
          </Button>
        </View>
      </View>
    );
  }

  if (!currentPoll || totalCount === 0) {
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

  if (isNotEnoughCandidates) {
    return (
      <View style={[styles.container, styles.centerContainer, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.emptyTitle}>선택할 친구가 부족해요</Text>
        <Text style={styles.emptyDescription}>
          4지선다 투표를 만들려면 이 Circle에 후보가 더 필요해요.
        </Text>
        <View style={styles.emptyActions}>
          <Button fullWidth onPress={() => router.push(`/circle/${currentPoll.circle_id}` as any)}>
            Circle 초대하기
          </Button>
          <Button fullWidth variant="secondary" onPress={handleSkip}>
            이 질문 건너뛰기
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
        <Animated.View
          key={currentPoll.id}
          entering={FadeInRight.duration(260)}
          exiting={FadeOutLeft.duration(180)}
          style={styles.voteCardTransition}
        >
          <VoteCard
            question={currentPoll.question || currentPoll.question_text}
            options={voteOptions}
            selectedId={selectedUserId}
            onSelect={handleSelect}
            disabled={
              voteMutation.isPending ||
              isAdvancingSession ||
              candidatesFetching ||
              voteOptions.length === 0
            }
          />
        </Animated.View>
      </View>

      <View style={[styles.bottomActions, { paddingBottom: Math.max(insets.bottom, tokens.spacing.lg) }]}>
        <Button
          variant="ghost"
          onPress={handleSkip}
          disabled={voteMutation.isPending || isSkippingSession}
          style={styles.bottomButton}
        >
          건너뛰기
        </Button>
        <Button
          variant="secondary"
          onPress={handleShuffle}
          disabled={!canShuffle || voteMutation.isPending || candidatesFetching}
          style={styles.bottomButton}
        >
          섞기
        </Button>
      </View>

      {voteOptions.length === 0 && !candidatesFetching && (
        <View style={styles.noCandidates}>
          <Text style={styles.noCandidatesText}>선택할 멤버가 부족해요</Text>
        </View>
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
      overflow: 'hidden',
    },
    voteCardTransition: {
      width: '100%',
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
