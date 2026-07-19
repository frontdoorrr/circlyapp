import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { EmptyState } from '../../../src/components/states/EmptyState';
import { SkeletonCard } from '../../../src/components/states/Skeleton';
import { Text } from '../../../src/components/primitives/Text';
import { Button } from '../../../src/components/primitives/Button';
import { GlassSurface } from '../../../src/components/primitives/GlassSurface';
import { LiquidBackground } from '../../../src/components/primitives/LiquidBackground';
import { tokens, spacing } from '../../../src/theme';
import { useTheme, useThemedStyles } from '../../../src/theme/ThemeContext';
import type { Theme } from '../../../src/theme/tokens';
import {
  useCreateRound,
  useMyActivePolls,
  useVoteSessionAvailability,
} from '../../../src/hooks/usePolls';
import { useMyCircles } from '../../../src/hooks/useCircles';
import { registerPushToken } from '../../../src/api/notification';
import { useToast } from '../../../src/providers/ToastProvider';
import { registerForPushNotificationsAsync } from '../../../src/services/notification/pushNotification';
import { isExpired } from '../../../src/utils/timeUtils';
import { buildInviteUrl } from '../../../src/services/invite/inviteUrl';
import { ApiError } from '../../../src/types/api';
import { getHomeState } from '../../../src/utils/homeState';

// ============================================================================
// Home Screen Component
// ============================================================================

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { showToast } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [isRegisteringPush, setIsRegisteringPush] = useState(false);

  // API 연동
  const {
    data: activePolls,
    isLoading: isLoadingActive,
    isError: isErrorActive,
    refetch: refetchActive,
  } = useMyActivePolls();

  const {
    data: myCircles,
    isLoading: isLoadingCircles,
    refetch: refetchCircles,
  } = useMyCircles();

  const {
    data: sessionAvailability,
    refetch: refetchAvailability,
  } = useVoteSessionAvailability();

  // ============================================================================
  // 상태 계산
  // ============================================================================

  const pendingPolls = useMemo(() => {
    if (!activePolls) return [];
    return activePolls
      .filter((poll) => !poll.has_voted && !isExpired(poll.ends_at))
      .sort((a, b) => new Date(a.ends_at).getTime() - new Date(b.ends_at).getTime());
  }, [activePolls]);

  const isCoolingDown =
    !!sessionAvailability &&
    !sessionAvailability.can_start &&
    sessionAvailability.remaining_seconds > 0;
  const canStartSession = sessionAvailability?.can_start ?? pendingPolls.length > 0;

  const homeState = useMemo(
    () =>
      getHomeState({
        circles: (myCircles ?? []).map((circle) => ({
          id: circle.id,
          memberCount: circle.member_count,
          activePollCount: circle.active_polls_count,
          role: circle.my_role,
        })),
        pendingPollCircleIds: pendingPolls.map((poll) => poll.circle_id),
        canStartSession,
        isCoolingDown,
      }),
    [myCircles, pendingPolls, canStartSession, isCoolingDown]
  );
  const actionCircle = useMemo(
    () =>
      'circleId' in homeState
        ? myCircles?.find((circle) => circle.id === homeState.circleId)
        : undefined,
    [homeState, myCircles]
  );
  const membersNeeded = Math.max(0, 5 - (actionCircle?.member_count ?? 0));
  const createRoundMutation = useCreateRound(actionCircle?.id ?? '');

  // 쿨다운 마감 시각 (서버 remaining_seconds 기준으로 고정)
  const cooldownDeadline = useMemo(() => {
    if (!isCoolingDown) return undefined;
    return Date.now() + sessionAvailability!.remaining_seconds * 1000;
  }, [isCoolingDown, sessionAvailability]);

  // 쿨다운 카운트다운 갱신용 tick (30초)
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!isCoolingDown) return;
    const timer = setInterval(() => setTick((prev) => prev + 1), 30 * 1000);
    return () => clearInterval(timer);
  }, [isCoolingDown]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    try {
      await Promise.all([refetchActive(), refetchCircles(), refetchAvailability()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchActive, refetchCircles, refetchAvailability]);

  const handleStartSession = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/vote-session' as any);
  }, [router]);

  const handleOpenInbox = useCallback(() => {
    Haptics.selectionAsync();
    router.push('/(main)/(1-inbox)' as any);
  }, [router]);

  const handleJoinByCode = useCallback(() => {
    Haptics.selectionAsync();
    router.push('/join/invite-code' as any);
  }, [router]);

  const handleCreateCircle = useCallback(() => {
    Haptics.selectionAsync();
    router.push('/circle/create' as any);
  }, [router]);

  const handleOpenCircle = useCallback(() => {
    if (!actionCircle) return;
    Haptics.selectionAsync();
    router.push(`/circle/${actionCircle.id}` as any);
  }, [actionCircle, router]);

  const handleShareInvite = useCallback(async () => {
    if (!actionCircle) return;
    Haptics.selectionAsync();
    const inviteUrl = buildInviteUrl(actionCircle.invite_link_id);
    await Share.share({
      message: `🎉 Circly에서 익명 칭찬 투표해요!\nCircle: ${actionCircle.name}\n링크: ${inviteUrl}\n코드: ${actionCircle.invite_code}\n\n링크를 누르면 바로 참여할 수 있어요.`,
      url: inviteUrl,
    });
  }, [actionCircle]);

  const handleCreateRound = useCallback(async () => {
    if (!actionCircle) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await createRoundMutation.mutateAsync();
      showToast('질문 5개로 라운드가 열렸어요', 'success');
    } catch (error) {
      const code = error instanceof ApiError ? error.code : undefined;
      if (code === 'ROUND_ALREADY_ACTIVE') {
        showToast('이미 진행 중인 라운드가 있어요', 'error');
      } else if (code === 'NOT_ENOUGH_MEMBERS') {
        showToast('라운드를 열려면 멤버가 5명 이상 필요해요', 'error');
      } else {
        showToast('라운드를 열지 못했어요. 다시 시도해주세요', 'error');
      }
    }
  }, [actionCircle, createRoundMutation, showToast]);

  const handleEnableNotifications = useCallback(async () => {
    setIsRegisteringPush(true);
    try {
      const token = await registerForPushNotificationsAsync();
      if (!token) {
        showToast('알림 권한을 켜지 못했어요', 'error');
        return;
      }

      await registerPushToken(token);
      showToast('알림을 켰어요', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '알림 설정 중 문제가 발생했어요', 'error');
    } finally {
      setIsRegisteringPush(false);
    }
  }, [showToast]);

  // ============================================================================
  // Render
  // ============================================================================

  const isLoading = (isLoadingActive || isLoadingCircles) && !refreshing;

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LiquidBackground />
        <Wordmark />
        <View style={styles.loadingContainer}>
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} style={styles.skeletonCard} />
          ))}
        </View>
      </View>
    );
  }

  if (isErrorActive) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LiquidBackground />
        <Wordmark />
        <View style={styles.centerContainer}>
          <EmptyState variant="network-error" onAction={onRefresh} />
        </View>
      </View>
    );
  }

  const firstPending = pendingPolls[0];
  const restCount = pendingPolls.length - 1;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LiquidBackground />
      <Wordmark />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tokens.colors.primary[500]}
            colors={[tokens.colors.primary[500]]}
          />
        }
      >
        {homeState.kind === 'ready' && (
          <StateView
            emoji="💌"
            title={`${pendingPolls.length}개의 질문이 기다리고 있어요`}
            description={`${myCircles?.length ?? 0}개 Circle · 친구들이 아직 내 답을 기다려요`}
            preview={
              firstPending
                ? `${firstPending.emoji || '📊'} ${firstPending.question}${
                    restCount > 0 ? `  외 ${restCount}개` : ''
                  }`
                : undefined
            }
            primaryLabel="투표 시작"
            primaryAccessibilityLabel="통합 투표 세션 시작"
            onPrimary={handleStartSession}
            secondaryLabel="초대 코드로 참여"
            onSecondary={handleJoinByCode}
            isDark={isDark}
          />
        )}

        {homeState.kind === 'cooldown' && (
          <StateView
            emoji="🎉"
            title={`다음 라운드까지 ${formatCooldownTime(
              cooldownDeadline ? Math.max(0, cooldownDeadline - Date.now()) / 1000 : 0
            )}`}
            description="그동안 친구들이 나를 선택한 순간을 확인해보세요."
            primaryLabel="알림 켜고 기다리기"
            primaryAccessibilityLabel="다음 세션 알림 켜기"
            primaryDisabled={isRegisteringPush}
            onPrimary={handleEnableNotifications}
            secondaryLabel="받은하트 보기"
            onSecondary={handleOpenInbox}
            isDark={isDark}
          />
        )}

        {homeState.kind === 'can-open-round' && (
          <StateView
            emoji="🚀"
            title={`${actionCircle?.name ?? 'Circle'}의 라운드를 열어볼까요?`}
            description="친구가 충분히 모였어요. 칭찬 질문 5개를 열면 바로 투표를 시작할 수 있어요."
            primaryLabel="라운드 열기"
            primaryAccessibilityLabel="칭찬 질문 5개로 라운드 열기"
            primaryDisabled={createRoundMutation.isPending}
            onPrimary={handleCreateRound}
            secondaryLabel="Circle 확인하기"
            onSecondary={handleOpenCircle}
            isDark={isDark}
          />
        )}

        {homeState.kind === 'needs-members' && (
          <StateView
            emoji="🫶"
            title={`친구 ${membersNeeded}명만 더 초대하면 돼요`}
            description={`${actionCircle?.name ?? 'Circle'}에 5명이 모이면 첫 칭찬 라운드를 열 수 있어요.`}
            primaryLabel="친구 초대하기"
            primaryAccessibilityLabel="Circle 영구 초대 링크 공유"
            onPrimary={handleShareInvite}
            secondaryLabel="Circle 확인하기"
            onSecondary={handleOpenCircle}
            isDark={isDark}
          />
        )}

        {homeState.kind === 'candidate-shortage' && (
          <StateView
            emoji="👥"
            title="선택할 친구가 부족해요"
            description="라운드는 열려 있지만 4명의 후보가 필요해요. 친구를 초대하면 투표를 이어갈 수 있어요."
            primaryLabel="친구 초대하기"
            primaryAccessibilityLabel="후보를 늘리기 위해 친구 초대 링크 공유"
            onPrimary={handleShareInvite}
            secondaryLabel="Circle 확인하기"
            onSecondary={handleOpenCircle}
            isDark={isDark}
          />
        )}

        {homeState.kind === 'empty' && actionCircle?.active_polls_count === 0 && (
          <StateView
            emoji="⏳"
            title="아직 열린 라운드가 없어요"
            description="관리자가 라운드를 준비하고 있어요. 친구를 더 초대해 Circle을 채워보세요."
            primaryLabel="친구 초대하기"
            primaryAccessibilityLabel="라운드를 기다리며 친구 초대 링크 공유"
            onPrimary={handleShareInvite}
            secondaryLabel="Circle 확인하기"
            onSecondary={handleOpenCircle}
            isDark={isDark}
          />
        )}

        {homeState.kind === 'empty' && actionCircle?.active_polls_count !== 0 && (
          <StateView
            emoji="🕊️"
            title="이번 라운드 답변을 모두 마쳤어요"
            description="친구들의 답을 기다리는 동안 받은 하트를 확인해보세요."
            primaryLabel="받은하트 보기"
            primaryAccessibilityLabel="받은 하트 보기"
            onPrimary={handleOpenInbox}
            secondaryLabel="초대 코드로 참여"
            onSecondary={handleJoinByCode}
            isDark={isDark}
          />
        )}

        {homeState.kind === 'no-circle' && (
          <StateView
            emoji="⭕"
            title="첫 Circle에 참여해보세요"
            description="친구가 보낸 초대 코드가 있나요? 코드 하나면 바로 시작할 수 있어요."
            primaryLabel="초대 코드 입력"
            primaryAccessibilityLabel="초대 코드 입력하기"
            onPrimary={handleJoinByCode}
            secondaryLabel="새 Circle 만들기"
            onSecondary={handleCreateCircle}
            isDark={isDark}
          />
        )}
      </ScrollView>
    </View>
  );
}

// ============================================================================
// Wordmark Header
// ============================================================================

function Wordmark() {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.wordmarkContainer} accessibilityRole="header">
      <Text style={styles.wordmark}>Circly</Text>
    </View>
  );
}

// ============================================================================
// State View Component
// ============================================================================

interface StateViewProps {
  emoji: string;
  title: string;
  description: string;
  preview?: string;
  primaryLabel: string;
  primaryAccessibilityLabel: string;
  primaryDisabled?: boolean;
  onPrimary: () => void;
  secondaryLabel: string;
  onSecondary: () => void;
  isDark: boolean;
}

function StateView({
  emoji,
  title,
  description,
  preview,
  primaryLabel,
  primaryAccessibilityLabel,
  primaryDisabled,
  onPrimary,
  secondaryLabel,
  onSecondary,
  isDark,
}: StateViewProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <Animated.View entering={FadeInUp.delay(80)} style={styles.stateContainer}>
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>{emoji}</Text>
        <Text style={styles.heroTitle}>{title}</Text>
        <Text style={styles.heroDescription}>{description}</Text>
      </View>

      {preview && (
        <GlassSurface
          variant="clear"
          style={styles.previewCard}
          contentStyle={styles.previewContent}
          tintColor={isDark ? '#6d28d9' : '#f5f3ff'}
        >
          <Text style={styles.previewText} numberOfLines={1}>
            {preview}
          </Text>
        </GlassSurface>
      )}

      <View style={styles.actions}>
        <Button
          onPress={onPrimary}
          fullWidth
          disabled={primaryDisabled}
          accessibilityLabel={primaryAccessibilityLabel}
        >
          {primaryLabel}
        </Button>
        <Button
          onPress={onSecondary}
          fullWidth
          variant="ghost"
          accessibilityLabel={secondaryLabel}
        >
          {secondaryLabel}
        </Button>
      </View>
    </Animated.View>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function formatCooldownTime(seconds: number): string {
  if (seconds <= 0) return '곧 열려요';

  const minutes = Math.ceil(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0 && remainingMinutes > 0) return `${hours}시간 ${remainingMinutes}분`;
  if (hours > 0) return `${hours}시간`;
  return `${minutes}분`;
}

// ============================================================================
// Styles
// ============================================================================

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#0D0914' : '#FCFAFF',
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
    wordmarkContainer: {
      height: 56,
      alignItems: 'center',
      justifyContent: 'center',
    },
    wordmark: {
      fontSize: tokens.typography.fontSize.xl,
      fontWeight: tokens.typography.fontWeight.bold,
      letterSpacing: -0.5,
      color: tokens.colors.primary[isDark ? 300 : 600],
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: spacing[5],
      paddingBottom: 120,
    },
    stateContainer: {
      gap: spacing[5],
    },
    hero: {
      alignItems: 'center',
      gap: spacing[2],
    },
    heroEmoji: {
      fontSize: 64,
      lineHeight: 76,
      marginBottom: spacing[2],
    },
    heroTitle: {
      fontSize: tokens.typography.fontSize['2xl'],
      fontWeight: tokens.typography.fontWeight.bold,
      color: theme.text,
      textAlign: 'center',
      lineHeight: tokens.typography.fontSize['2xl'] * 1.3,
    },
    heroDescription: {
      fontSize: tokens.typography.fontSize.base,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: tokens.typography.fontSize.base * 1.5,
      paddingHorizontal: spacing[4],
    },
    previewCard: {
      borderRadius: tokens.borderRadius.xl,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.76)',
    },
    previewContent: {
      paddingVertical: spacing[3],
      paddingHorizontal: spacing[4],
      alignItems: 'center',
    },
    previewText: {
      fontSize: tokens.typography.fontSize.sm,
      fontWeight: tokens.typography.fontWeight.medium,
      color: theme.textSecondary,
    },
    actions: {
      gap: spacing[2],
    },
  });
