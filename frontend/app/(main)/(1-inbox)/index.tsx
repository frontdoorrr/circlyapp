import React, { useCallback, useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../../src/components/primitives/Button';
import { Text } from '../../../src/components/primitives/Text';
import { LoadingSpinner } from '../../../src/components/states/LoadingSpinner';
import { LiquidBackground } from '../../../src/components/primitives/LiquidBackground';
import {
  useMarkReceivedHeartAsRead,
  useMyCompletedPolls,
  useReceivedHearts,
} from '../../../src/hooks/usePolls';
import { useUnreadCount } from '../../../src/hooks/useNotifications';
import { tokens } from '../../../src/theme';
import { useTheme, useThemedStyles } from '../../../src/theme/ThemeContext';
import type { Theme } from '../../../src/theme/tokens';
import type { ReceivedHeartItem } from '../../../src/types/poll';

function formatRelativeTime(value: string): string {
  const timestamp = new Date(value).getTime();
  const diffMs = Date.now() - timestamp;
  const minutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;

  return new Date(value).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  });
}

export default function InboxScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { data, isLoading, isRefetching, refetch } = useReceivedHearts();
  const { data: completedPolls } = useMyCompletedPolls();
  const { data: notificationUnreadCount } = useUnreadCount();
  const { mutateAsync: markAsReadAsync } = useMarkReceivedHeartAsRead();
  const hearts = useMemo(() => data ?? [], [data]);
  const unreadCount = useMemo(
    () => hearts.reduce((sum, item) => sum + (item.is_read ? 0 : item.received_count), 0),
    [hearts]
  );
  const totalCount = useMemo(
    () => hearts.reduce((sum, item) => sum + item.received_count, 0),
    [hearts]
  );

  const todayCount = useMemo(() => {
    const today = new Date();
    return hearts
      .filter((item) => {
        const receivedAt = new Date(item.latest_received_at);
        return (
          receivedAt.getFullYear() === today.getFullYear() &&
          receivedAt.getMonth() === today.getMonth() &&
          receivedAt.getDate() === today.getDate()
        );
      })
      .reduce((sum, item) => sum + item.received_count, 0);
  }, [hearts]);

  const handlePress = useCallback(
    async (item: ReceivedHeartItem) => {
      await Haptics.selectionAsync();
      if (!item.is_read) {
        try {
          await markAsReadAsync(item.poll_id);
        } catch {
          // Result navigation should not be blocked by read-state sync failure.
        }
      }
      router.push(`/results/${item.poll_id}` as any);
    },
    [markAsReadAsync, router]
  );

  const handleGoVote = useCallback(() => {
    router.push('/vote-session' as any);
  }, [router]);

  const handleOpenNotifications = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/notifications' as any);
  }, [router]);

  const handleOpenResult = useCallback(
    (pollId: string) => {
      Haptics.selectionAsync();
      router.push(`/results/${pollId}` as any);
    },
    [router]
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <LiquidBackground />
        <Stack.Screen options={{ headerShown: false }} />
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LiquidBackground />
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        <View style={styles.headerRow}>
          <View style={styles.header}>
            <Text style={styles.title}>받은 하트</Text>
            <Text style={styles.subtitle}>친구들이 나를 고른 순간을 모아봤어요</Text>
          </View>
          <Pressable
            onPress={handleOpenNotifications}
            style={styles.bellButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`알림 보기, 읽지 않은 알림 ${notificationUnreadCount ?? 0}개`}
          >
            <Ionicons name="notifications-outline" size={22} color={theme.text} />
            {(notificationUnreadCount ?? 0) > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>
                  {(notificationUnreadCount ?? 0) > 9 ? '9+' : notificationUnreadCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {hearts.length > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>
              💖{' '}
              {unreadCount > 0
                ? `새 하트 ${unreadCount}개 · 전체 ${totalCount}개`
                : `오늘 ${todayCount}개 · 전체 ${totalCount}개`}
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>최근 받은 하트</Text>

        {hearts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💖</Text>
            <Text style={styles.emptyTitle}>아직 받은 하트가 없어요</Text>
            <Text style={styles.emptyDescription}>
              투표에 참여하면 친구들도 나를 선택할 수 있어요.
            </Text>
            <Button onPress={handleGoVote}>투표하러 가기</Button>
          </View>
        ) : (
          <View style={styles.list}>
            {hearts.map((item) => (
              <Pressable
                key={item.poll_id}
                onPress={() => handlePress(item)}
                style={({ pressed }) => [
                  styles.heartCard,
                  !item.is_read && styles.unreadCard,
                  pressed && styles.pressedCard,
                ]}
              >
                {!item.is_read && <View style={styles.unreadIndicator} />}
                <View style={styles.cardContent}>
                  <Text style={styles.question} numberOfLines={2}>
                    {item.emoji ? `${item.emoji} ` : ''}
                    {item.question_text}
                  </Text>
                  <Text style={styles.meta}>
                    {item.received_count}명이 선택했어요 ·{' '}
                    {formatRelativeTime(item.latest_received_at)}
                  </Text>
                  <Text style={styles.circleName} numberOfLines={1}>
                    {item.circle_name}
                  </Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </Pressable>
            ))}
          </View>
        )}

        {(completedPolls?.length ?? 0) > 0 && (
          <>
            <Text style={styles.sectionTitle}>지난 투표 결과</Text>
            <View style={styles.list}>
              {completedPolls!.map((poll) => (
                <Pressable
                  key={poll.id}
                  onPress={() => handleOpenResult(poll.id)}
                  style={({ pressed }) => [styles.heartCard, pressed && styles.pressedCard]}
                  accessibilityRole="button"
                  accessibilityLabel={`${poll.question} 결과 보기`}
                >
                  <View style={styles.cardContent}>
                    <Text style={styles.question} numberOfLines={2}>
                      {poll.emoji ? `${poll.emoji} ` : ''}
                      {poll.question}
                    </Text>
                    <Text style={styles.meta}>
                      1위 {poll.winner_name || '알 수 없음'} · {poll.winner_vote_count || 0}표
                    </Text>
                    <Text style={styles.circleName} numberOfLines={1}>
                      {poll.circle_name || 'Circle'}
                    </Text>
                  </View>
                  <Text style={styles.arrow}>›</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    center: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      paddingTop: tokens.spacing['2xl'],
      paddingHorizontal: tokens.spacing.lg,
      paddingBottom: 120,
      gap: tokens.spacing.lg,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: tokens.spacing.md,
    },
    header: {
      flex: 1,
      gap: tokens.spacing.xs,
    },
    bellButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: tokens.borderRadius.full,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
    },
    bellBadge: {
      position: 'absolute',
      top: 4,
      right: 4,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: tokens.colors.semantic.error[500],
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    bellBadgeText: {
      fontSize: 10,
      lineHeight: 12,
      fontWeight: tokens.typography.fontWeight.bold,
      color: tokens.colors.white,
    },
    title: {
      fontSize: tokens.typography.fontSize['3xl'],
      fontWeight: tokens.typography.fontWeight.bold,
      color: theme.text,
    },
    subtitle: {
      fontSize: tokens.typography.fontSize.sm,
      color: theme.textSecondary,
    },
    summaryRow: {
      alignSelf: 'flex-start',
      paddingVertical: tokens.spacing.sm,
      paddingHorizontal: tokens.spacing.md,
      borderRadius: tokens.borderRadius.full,
      backgroundColor: isDark ? theme.card : tokens.colors.primary[50],
      borderWidth: 1,
      borderColor: theme.border,
    },
    summaryText: {
      fontSize: tokens.typography.fontSize.sm,
      fontWeight: tokens.typography.fontWeight.semibold,
      color: tokens.colors.primary[isDark ? 300 : 700],
    },
    sectionTitle: {
      fontSize: tokens.typography.fontSize.lg,
      fontWeight: tokens.typography.fontWeight.semibold,
      color: theme.text,
    },
    list: {
      gap: tokens.spacing.md,
    },
    heartCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: tokens.spacing.lg,
      borderRadius: tokens.borderRadius.xl,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
      ...(isDark ? {} : tokens.shadows.sm),
    },
    unreadCard: {
      borderColor: tokens.colors.primary[300],
    },
    pressedCard: {
      transform: [{ scale: 0.98 }],
      opacity: 0.9,
    },
    unreadIndicator: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 5,
      backgroundColor: tokens.colors.primary[500],
    },
    cardContent: {
      flex: 1,
      gap: tokens.spacing.xs,
    },
    question: {
      fontSize: tokens.typography.fontSize.base,
      fontWeight: tokens.typography.fontWeight.semibold,
      color: theme.text,
      lineHeight: 22,
    },
    meta: {
      fontSize: tokens.typography.fontSize.sm,
      color: theme.textSecondary,
    },
    circleName: {
      fontSize: tokens.typography.fontSize.sm,
      color: theme.textTertiary,
    },
    arrow: {
      marginLeft: tokens.spacing.md,
      fontSize: 30,
      color: theme.textTertiary,
    },
    emptyState: {
      alignItems: 'center',
      gap: tokens.spacing.md,
      paddingVertical: tokens.spacing['2xl'],
      paddingHorizontal: tokens.spacing.lg,
    },
    emptyIcon: {
      fontSize: 64,
      lineHeight: 72,
    },
    emptyTitle: {
      fontSize: tokens.typography.fontSize.lg,
      fontWeight: tokens.typography.fontWeight.semibold,
      color: theme.text,
      textAlign: 'center',
    },
    emptyDescription: {
      fontSize: tokens.typography.fontSize.sm,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });
