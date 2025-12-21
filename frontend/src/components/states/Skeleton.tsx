import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { tokens } from '../../theme';

// ============================================================================
// Types
// ============================================================================

export type SkeletonShape = 'rect' | 'circle' | 'rounded';

export interface SkeletonProps {
  width?: number | string;
  height?: number;
  shape?: SkeletonShape;
  style?: ViewStyle;
}

// ============================================================================
// Skeleton Component
// ============================================================================

/**
 * Skeleton Component
 *
 * 스켈레톤 로딩 컴포넌트
 *
 * @param width - 너비 (숫자 또는 퍼센트 문자열)
 * @param height - 높이
 * @param shape - 모양 (rect, circle, rounded)
 * @param style - 커스텀 스타일
 *
 * @example
 * // 기본 사각형
 * <Skeleton width={200} height={20} />
 *
 * // 원형 (아바타)
 * <Skeleton width={60} height={60} shape="circle" />
 *
 * // 둥근 사각형 (카드)
 * <Skeleton width="100%" height={120} shape="rounded" />
 */
export function Skeleton({
  width = '100%',
  height = 20,
  shape = 'rect',
  style,
}: SkeletonProps) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const borderRadius = getBorderRadius(shape, height);

  const skeletonStyle: ViewStyle = {
    width: width as any,
    height,
    borderRadius,
  };

  return (
    <Animated.View
      style={[
        styles.skeleton,
        skeletonStyle,
        animatedStyle,
        style,
      ]}
    />
  );
}

// ============================================================================
// Skeleton Variants
// ============================================================================

/**
 * SkeletonText Component
 *
 * 텍스트 스켈레톤 (여러 줄)
 *
 * @param lines - 줄 수
 * @param lastLineWidth - 마지막 줄 너비 (%)
 *
 * @example
 * <SkeletonText lines={3} lastLineWidth={60} />
 */
export function SkeletonText({
  lines = 3,
  lastLineWidth = 80,
}: {
  lines?: number;
  lastLineWidth?: number;
}) {
  return (
    <View style={styles.textContainer}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? `${lastLineWidth}%` : '100%'}
          height={16}
          style={styles.textLine}
        />
      ))}
    </View>
  );
}

/**
 * SkeletonAvatar Component
 *
 * 아바타 스켈레톤
 *
 * @param size - 아바타 크기
 *
 * @example
 * <SkeletonAvatar size={60} />
 */
export function SkeletonAvatar({ size = 60 }: { size?: number }) {
  return <Skeleton width={size} height={size} shape="circle" />;
}

/**
 * SkeletonCard Component
 *
 * 카드 스켈레톤 (아바타 + 텍스트)
 *
 * @param avatarSize - 아바타 크기
 * @param lines - 텍스트 줄 수
 *
 * @example
 * <SkeletonCard />
 */
export function SkeletonCard({
  avatarSize = 60,
  lines = 2,
}: {
  avatarSize?: number;
  lines?: number;
}) {
  return (
    <View style={styles.cardContainer}>
      <SkeletonAvatar size={avatarSize} />
      <View style={styles.cardContent}>
        <SkeletonText lines={lines} lastLineWidth={70} />
      </View>
    </View>
  );
}

/**
 * SkeletonList Component
 *
 * 리스트 스켈레톤 (여러 개의 카드)
 *
 * @param count - 아이템 개수
 *
 * @example
 * <SkeletonList count={5} />
 */
export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </View>
  );
}

/**
 * SkeletonVoteCard Component
 *
 * 투표 카드 스켈레톤 (2x2 그리드)
 *
 * @example
 * <SkeletonVoteCard />
 */
export function SkeletonVoteCard() {
  return (
    <View style={styles.voteCardContainer}>
      {/* Question */}
      <Skeleton width="80%" height={28} shape="rounded" style={styles.voteQuestion} />

      {/* Options Grid */}
      <View style={styles.voteOptionsGrid}>
        {Array.from({ length: 4 }).map((_, index) => (
          <View key={index} style={styles.voteOption}>
            <SkeletonAvatar size={80} />
            <Skeleton width="80%" height={16} shape="rounded" style={styles.voteOptionName} />
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * SkeletonResultBar Component
 *
 * 결과 바 스켈레톤
 *
 * @param count - 결과 개수
 *
 * @example
 * <SkeletonResultBar count={4} />
 */
export function SkeletonResultBar({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.resultBarContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.resultBarItem}>
          <View style={styles.resultBarHeader}>
            <Skeleton width={24} height={24} shape="circle" />
            <Skeleton width={120} height={16} style={styles.resultBarName} />
            <Skeleton width={60} height={20} />
          </View>
          <Skeleton width="100%" height={12} shape="rounded" />
        </View>
      ))}
    </View>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getBorderRadius(shape: SkeletonShape, height: number): number {
  switch (shape) {
    case 'circle':
      return height / 2;
    case 'rounded':
      return tokens.borderRadius.lg;
    case 'rect':
    default:
      return tokens.borderRadius.sm;
  }
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: tokens.colors.neutral[200],
  },
  // Text
  textContainer: {
    width: '100%',
  },
  textLine: {
    marginBottom: tokens.spacing.xs,
  },
  // Card
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.spacing.md,
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.borderRadius.lg,
    marginBottom: tokens.spacing.md,
  },
  cardContent: {
    flex: 1,
    marginLeft: tokens.spacing.md,
  },
  // List
  listContainer: {
    width: '100%',
  },
  // Vote Card
  voteCardContainer: {
    padding: tokens.spacing.lg,
    alignItems: 'center',
  },
  voteQuestion: {
    marginBottom: tokens.spacing.xl,
  },
  voteOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    gap: tokens.spacing.md,
  },
  voteOption: {
    width: '48%',
    alignItems: 'center',
    padding: tokens.spacing.md,
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.borderRadius.xl,
    ...tokens.shadows.sm,
  },
  voteOptionName: {
    marginTop: tokens.spacing.sm,
  },
  // Result Bar
  resultBarContainer: {
    width: '100%',
    padding: tokens.spacing.lg,
  },
  resultBarItem: {
    marginBottom: tokens.spacing.lg,
  },
  resultBarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.xs,
    gap: tokens.spacing.sm,
  },
  resultBarName: {
    flex: 1,
  },
});
