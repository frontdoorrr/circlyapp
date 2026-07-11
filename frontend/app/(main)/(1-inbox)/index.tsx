import React, { useCallback, useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Button } from '../../../src/components/primitives/Button';
import { Text } from '../../../src/components/primitives/Text';
import { LoadingSpinner } from '../../../src/components/states/LoadingSpinner';
import { useReceivedHearts } from '../../../src/hooks/usePolls';
import { tokens } from '../../../src/theme';
import { useThemedStyles } from '../../../src/theme/ThemeContext';
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
  const styles = useThemedStyles(createStyles);
  const { data, isLoading, isRefetching, refetch } = useReceivedHearts();
  const hearts = data ?? [];

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
      router.push(`/results/${item.poll_id}` as any);
    },
    [router]
  );

  const handleGoVote = useCallback(() => {
    router.push('/vote-session' as any);
  }, [router]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <Stack.Screen options={{ headerShown: false }} />
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>받은 하트</Text>
          <Text style={styles.subtitle}>친구들이 나를 고른 순간을 모아봤어요</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryIcon}>💖</Text>
          <View style={styles.summaryText}>
            <Text style={styles.summaryCount}>{todayCount}</Text>
            <Text style={styles.summaryLabel}>오늘 받은 하트</Text>
          </View>
        </View>

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
      paddingBottom: tokens.spacing['2xl'],
      gap: tokens.spacing.lg,
    },
    header: {
      gap: tokens.spacing.xs,
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
    summaryCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing.md,
      padding: tokens.spacing.lg,
      borderRadius: tokens.borderRadius['2xl'],
      backgroundColor: isDark ? theme.card : tokens.colors.primary[50],
      borderWidth: 1,
      borderColor: theme.border,
    },
    summaryIcon: {
      fontSize: 42,
      lineHeight: 48,
    },
    summaryText: {
      gap: tokens.spacing.xs,
    },
    summaryCount: {
      fontSize: tokens.typography.fontSize['4xl'],
      fontWeight: tokens.typography.fontWeight.bold,
      color: theme.text,
      lineHeight: 40,
    },
    summaryLabel: {
      fontSize: tokens.typography.fontSize.sm,
      color: theme.textSecondary,
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
