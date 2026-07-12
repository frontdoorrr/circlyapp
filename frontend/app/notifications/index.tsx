import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Text } from '../../src/components/primitives/Text';
import { EmptyState } from '../../src/components/states';
import { tokens } from '../../src/theme';
import { useThemedStyles } from '../../src/theme/ThemeContext';
import {
  useMarkAllAsRead,
  useMarkAsRead,
  useNotifications,
} from '../../src/hooks/useNotifications';
import type { NotificationItem, NotificationType } from '../../src/api/notification';
import { formatRelativeTime } from '../../src/utils';
import type { Theme } from '../../src/theme/tokens';

/**
 * Notification Inbox Screen
 *
 * 알림 인박스 화면 — 홈 벨 아이콘에서 진입
 * @see prd/design/04-user-flow.md#알림 및 푸시 플로우
 */

const TYPE_ICONS: Record<NotificationType, string> = {
  POLL_STARTED: '🗳️',
  POLL_REMINDER: '⏰',
  POLL_ENDED: '🎉',
  VOTE_RECEIVED: '🎊',
  CIRCLE_INVITE: '🎈',
};

export default function NotificationInboxScreen() {
  const router = useRouter();
  const styles = useThemedStyles(createStyles);
  const { data: notifications, isLoading, error, refetch, isRefetching } = useNotifications();
  const { mutate: markRead } = useMarkAsRead();
  const { mutate: markAllRead, isPending: isMarkingAll } = useMarkAllAsRead();

  const hasUnread = notifications?.some((n) => !n.is_read) ?? false;

  const handleNotificationPress = useCallback(
    (notification: NotificationItem) => {
      Haptics.selectionAsync();
      if (!notification.is_read) {
        markRead(notification.id);
      }

      const pollId = notification.data?.poll_id;
      const circleId = notification.data?.circle_id;

      if (notification.type === 'CIRCLE_INVITE' && typeof circleId === 'string') {
        router.push(`/circle/${circleId}` as any);
        return;
      }

      if (typeof pollId !== 'string') return;

      switch (notification.type) {
        case 'POLL_STARTED':
        case 'POLL_REMINDER':
          router.push(`/poll/${pollId}` as any);
          break;
        case 'POLL_ENDED':
        case 'VOTE_RECEIVED':
          router.push(`/results/${pollId}` as any);
          break;
        default:
          break;
      }
    },
    [markRead, router]
  );

  const handleMarkAllRead = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    markAllRead();
  }, [markAllRead]);

  const renderItem = useCallback(
    ({ item, index }: { item: NotificationItem; index: number }) => (
      <Animated.View entering={FadeInUp.delay(Math.min(index, 8) * 50).springify()}>
        <TouchableOpacity
          style={[styles.item, !item.is_read && styles.itemUnread]}
          onPress={() => handleNotificationPress(item)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`${item.title}. ${item.body}`}
        >
          <View style={styles.iconContainer}>
            <Text variant="xl">{TYPE_ICONS[item.type] ?? '🔔'}</Text>
          </View>
          <View style={styles.itemContent}>
            <Text style={[styles.itemTitle, !item.is_read && styles.itemTitleUnread]}>
              {item.title}
            </Text>
            <Text style={styles.itemBody} numberOfLines={2}>
              {item.body}
            </Text>
            <Text style={styles.itemTime}>{formatRelativeTime(item.created_at)}</Text>
          </View>
          {!item.is_read && <View style={styles.unreadDot} />}
        </TouchableOpacity>
      </Animated.View>
    ),
    [handleNotificationPress, styles]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>알림</Text>
        <TouchableOpacity
          onPress={handleMarkAllRead}
          disabled={!hasUnread || isMarkingAll}
          style={styles.markAllButton}
        >
          <Text style={[styles.markAllText, !hasUnread && styles.markAllTextDisabled]}>
            모두 읽음
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={tokens.colors.primary[500]} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <EmptyState
            variant="network-error"
            actionLabel="다시 시도"
            onAction={() => refetch()}
          />
        </View>
      ) : !notifications || notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <EmptyState
            variant="generic"
            icon="🔔"
            title="아직 알림이 없어요"
            description="새 투표가 시작되거나 누군가 나를 선택하면 여기에 알려드릴게요"
          />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={tokens.colors.primary[500]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: tokens.spacing.md,
      paddingVertical: tokens.spacing.sm,
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    backButton: {
      padding: tokens.spacing.sm,
    },
    backText: {
      fontSize: 24,
      color: theme.text,
    },
    headerTitle: {
      fontSize: tokens.typography.fontSize.lg,
      fontWeight: tokens.typography.fontWeight.semibold,
      color: theme.text,
    },
    markAllButton: {
      padding: tokens.spacing.sm,
    },
    markAllText: {
      fontSize: tokens.typography.fontSize.sm,
      fontWeight: tokens.typography.fontWeight.medium,
      color: tokens.colors.primary[500],
    },
    markAllTextDisabled: {
      color: theme.textTertiary,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    listContent: {
      padding: tokens.spacing.md,
      gap: tokens.spacing.sm,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card,
      borderRadius: tokens.borderRadius.lg,
      padding: tokens.spacing.md,
      ...(isDark ? { borderWidth: 1, borderColor: theme.border } : tokens.shadows.sm),
    },
    itemUnread: {
      backgroundColor: isDark ? 'rgba(139, 92, 246, 0.12)' : tokens.colors.primary[50],
      ...(isDark && { borderColor: tokens.colors.primary[800] }),
    },
    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: tokens.spacing.md,
    },
    itemContent: {
      flex: 1,
    },
    itemTitle: {
      fontSize: tokens.typography.fontSize.base,
      fontWeight: tokens.typography.fontWeight.medium,
      color: theme.text,
      marginBottom: 2,
    },
    itemTitleUnread: {
      fontWeight: tokens.typography.fontWeight.semibold,
    },
    itemBody: {
      fontSize: tokens.typography.fontSize.sm,
      color: theme.textSecondary,
      marginBottom: tokens.spacing.xs,
    },
    itemTime: {
      fontSize: tokens.typography.fontSize.xs,
      color: theme.textTertiary,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: tokens.colors.primary[500],
      marginLeft: tokens.spacing.sm,
    },
  });
