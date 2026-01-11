import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import { useMyCircles } from '../../../src/hooks/useCircles';
import { Text } from '../../../src/components/primitives/Text';
import { EmptyState } from '../../../src/components/states/EmptyState';
import { SkeletonCard } from '../../../src/components/states/Skeleton';
import { tokens } from '../../../src/theme';
import { useTheme, useThemedStyles } from '../../../src/theme/ThemeContext';
import type { Theme } from '../../../src/theme/tokens';

/**
 * Circle Tab - 내 Circle 목록
 *
 * 참여 중인 Circle 목록을 표시하고 관리합니다:
 * - Circle 목록 조회
 * - Circle 카드 클릭 → 상세 화면
 * - Pull-to-refresh
 * - FAB으로 새 Circle 만들기
 */
export default function CircleListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { data: circles, isLoading, refetch, isRefetching } = useMyCircles();

  // Circle 카드 클릭
  const handleCirclePress = useCallback(
    (circleId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/circle/${circleId}` as any);
    },
    [router]
  );

  // 코드로 참여하기
  const handleJoinByCode = useCallback(() => {
    Haptics.selectionAsync();
    router.push('/join/invite-code' as any);
  }, [router]);

  // FAB 클릭 - 새 Circle 만들기
  const handleCreateCircle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/circle/create' as any);
  }, [router]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refetch();
  }, [refetch]);

  // 로딩 상태
  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>내 Circle</Text>
        </View>
        <View style={styles.loadingContainer}>
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} style={styles.skeletonCard} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>내 Circle</Text>
        <TouchableOpacity
          style={styles.joinButton}
          onPress={handleJoinByCode}
          activeOpacity={0.7}
        >
          <Text style={styles.joinButtonText}>코드로 참여</Text>
        </TouchableOpacity>
      </View>

      {/* Circle 목록 */}
      {circles && circles.length > 0 ? (
        <FlatList
          data={circles}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInUp.delay(index * 50).duration(300)}>
              <CircleCard
                circle={item}
                onPress={() => handleCirclePress(item.id)}
                theme={theme}
                isDark={isDark}
                styles={styles}
              />
            </Animated.View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              tintColor={tokens.colors.primary[500]}
              colors={[tokens.colors.primary[500]]}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <EmptyState
            emoji="👥"
            title="참여한 Circle이 없어요"
            description="친구의 초대 코드로 Circle에 참여하거나\n새로운 Circle을 만들어보세요"
            actionLabel="코드로 참여하기"
            onAction={handleJoinByCode}
          />
        </View>
      )}

      {/* FAB - 새 Circle 만들기 */}
      <Animated.View
        entering={FadeIn.delay(300).duration(300)}
        style={[
          styles.fabContainer,
          { bottom: insets.bottom + 16 },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.fab,
            pressed && styles.fabPressed,
          ]}
          onPress={handleCreateCircle}
          accessibilityRole="button"
          accessibilityLabel="새 Circle 만들기"
        >
          <Text style={styles.fabIcon}>+</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ============================================================================
// Circle Card Component
// ============================================================================

interface CircleCardProps {
  circle: {
    id: string;
    name: string;
    description?: string;
    member_count: number;
    invite_code: string;
  };
  onPress: () => void;
  theme: Theme;
  isDark: boolean;
  styles: ReturnType<typeof createStyles>;
}

function CircleCard({ circle, onPress, theme, isDark, styles }: CircleCardProps) {
  return (
    <TouchableOpacity
      style={styles.circleCard}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${circle.name} Circle, ${circle.member_count}명 참여중`}
    >
      <View style={styles.circleInfo}>
        <View style={styles.circleHeader}>
          <Text style={styles.circleEmoji}>🎯</Text>
          <Text style={[styles.circleName, { color: theme.text }]} numberOfLines={1}>
            {circle.name}
          </Text>
        </View>
        {circle.description && (
          <Text style={[styles.circleDescription, { color: theme.textTertiary }]} numberOfLines={2}>
            {circle.description}
          </Text>
        )}
      </View>

      <View style={styles.circleMeta}>
        <View style={styles.memberBadge}>
          <Text style={styles.memberCount}>👥 {circle.member_count}명</Text>
        </View>
        <Text style={[styles.inviteCode, { color: theme.textTertiary }]}>코드: {circle.invite_code}</Text>
      </View>

      <View style={styles.circleArrow}>
        <Text style={[styles.arrowIcon, { color: theme.textTertiary }]}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

// ============================================================================
// Styles
// ============================================================================

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: tokens.spacing.lg,
      paddingVertical: tokens.spacing.md,
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTitle: {
      fontSize: tokens.typography.fontSize.xl,
      fontWeight: tokens.typography.fontWeight.bold,
      color: theme.text,
    },
    joinButton: {
      backgroundColor: isDark ? tokens.colors.primary[900] : tokens.colors.primary[50],
      paddingHorizontal: tokens.spacing.md,
      paddingVertical: tokens.spacing.sm,
      borderRadius: tokens.borderRadius.md,
      borderWidth: 1,
      borderColor: isDark ? tokens.colors.primary[700] : tokens.colors.primary[200],
    },
    joinButtonText: {
      fontSize: tokens.typography.fontSize.sm,
      fontWeight: tokens.typography.fontWeight.medium,
      color: tokens.colors.primary[isDark ? 400 : 600],
    },
    loadingContainer: {
      flex: 1,
      padding: tokens.spacing.lg,
    },
    skeletonCard: {
      height: 120,
      marginBottom: tokens.spacing.md,
      borderRadius: tokens.borderRadius.lg,
    },
    listContent: {
      padding: tokens.spacing.lg,
      paddingBottom: 100, // FAB 공간 확보
    },
    separator: {
      height: tokens.spacing.md,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: tokens.spacing.lg,
    },
    // Circle Card
    circleCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card,
      borderRadius: tokens.borderRadius.lg,
      padding: tokens.spacing.lg,
      ...(isDark
        ? { borderWidth: 1, borderColor: theme.border }
        : tokens.shadows.sm),
    },
    circleInfo: {
      flex: 1,
    },
    circleHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing.sm,
      marginBottom: tokens.spacing.xs,
    },
    circleEmoji: {
      fontSize: 24,
    },
    circleName: {
      flex: 1,
      fontSize: tokens.typography.fontSize.lg,
      fontWeight: tokens.typography.fontWeight.semibold,
    },
    circleDescription: {
      fontSize: tokens.typography.fontSize.sm,
      marginLeft: 32, // emoji 너비 + gap
      marginBottom: tokens.spacing.sm,
    },
    circleMeta: {
      alignItems: 'flex-end',
      marginRight: tokens.spacing.sm,
    },
    memberBadge: {
      backgroundColor: isDark ? tokens.colors.primary[900] : tokens.colors.primary[50],
      paddingHorizontal: tokens.spacing.sm,
      paddingVertical: 2,
      borderRadius: tokens.borderRadius.sm,
      marginBottom: tokens.spacing.xs,
    },
    memberCount: {
      fontSize: tokens.typography.fontSize.xs,
      fontWeight: tokens.typography.fontWeight.medium,
      color: tokens.colors.primary[isDark ? 400 : 600],
    },
    inviteCode: {
      fontSize: tokens.typography.fontSize.xs,
    },
    circleArrow: {
      paddingLeft: tokens.spacing.sm,
    },
    arrowIcon: {
      fontSize: 24,
    },
    // FAB
    fabContainer: {
      position: 'absolute',
      right: tokens.spacing.lg,
    },
    fab: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: tokens.colors.primary[500],
      justifyContent: 'center',
      alignItems: 'center',
      ...(isDark ? {} : tokens.shadows.lg),
    },
    fabPressed: {
      backgroundColor: tokens.colors.primary[600],
      transform: [{ scale: 0.95 }],
    },
    fabIcon: {
      fontSize: 32,
      lineHeight: 32,
      fontWeight: tokens.typography.fontWeight.light,
      color: tokens.colors.white,
    },
  });
