import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { tokens, animations } from '../../theme';
import { Text } from '../primitives/Text';

// ============================================================================
// Types
// ============================================================================

export interface ResultBarProps {
  name: string;
  votes: number;
  percentage: number;
  rank: number;
  totalVotes: number;
  delay?: number;
  isWinner?: boolean;
}

// ============================================================================
// ResultBar Component
// ============================================================================

/**
 * ResultBar Component
 *
 * 투표 결과 바 컴포넌트
 *
 * @param name - 옵션 이름
 * @param votes - 투표 수
 * @param percentage - 득표율 (0-100)
 * @param rank - 순위
 * @param totalVotes - 전체 투표 수
 * @param delay - 애니메이션 지연 (ms)
 * @param isWinner - 1위 여부
 *
 * @example
 * <ResultBar
 *   name="김철수"
 *   votes={15}
 *   percentage={37.5}
 *   rank={1}
 *   totalVotes={40}
 *   isWinner={true}
 * />
 */
export function ResultBar({
  name,
  votes,
  percentage,
  rank,
  totalVotes,
  delay = 0,
  isWinner = false,
}: ResultBarProps) {
  const width = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // 진행바 애니메이션
    width.value = withDelay(
      delay,
      withSpring(percentage, animations.spring.bouncy)
    );
    opacity.value = withDelay(
      delay,
      withSpring(1, animations.spring.responsive)
    );
  }, [percentage, delay]);

  const barAnimatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
    opacity: opacity.value,
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // 그라디언트 색상 선택
  const gradientColors = isWinner
    ? ([tokens.colors.primary[400], tokens.colors.primary[600]] as const)
    : rank === 2
    ? ([tokens.colors.secondary[400], tokens.colors.secondary[600]] as const)
    : ([tokens.colors.neutral[300], tokens.colors.neutral[400]] as const);

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.nameContainer}>
          {/* Rank Badge */}
          <View
            style={[
              styles.rankBadge,
              isWinner && styles.rankBadgeWinner,
            ]}
          >
            <Text
              variant="xs"
              weight="bold"
              color={isWinner ? tokens.colors.white : tokens.colors.neutral[600]}
            >
              {rank}
            </Text>
          </View>

          {/* Name */}
          <Text
            variant="base"
            weight={isWinner ? 'bold' : 'semibold'}
            numberOfLines={1}
            color={isWinner ? tokens.colors.primary[600] : tokens.colors.neutral[900]}
          >
            {name}
          </Text>
        </View>

        {/* Votes & Percentage */}
        <View style={styles.statsContainer}>
          <Text variant="sm" weight="medium" color={tokens.colors.neutral[600]}>
            {votes}표
          </Text>
          <Text
            variant="lg"
            weight="bold"
            color={isWinner ? tokens.colors.primary[600] : tokens.colors.neutral[700]}
            style={styles.percentage}
          >
            {percentage.toFixed(1)}%
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.barContainer}>
        <View style={styles.barBackground}>
          <Animated.View style={[styles.barFill, barAnimatedStyle]}>
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradient}
            />
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: tokens.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.xs,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: tokens.spacing.md,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: tokens.colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing.sm,
  },
  rankBadgeWinner: {
    backgroundColor: tokens.colors.primary[500],
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  percentage: {
    minWidth: 60,
    textAlign: 'right',
  },
  barContainer: {
    width: '100%',
  },
  barBackground: {
    height: 12,
    backgroundColor: tokens.colors.neutral[100],
    borderRadius: tokens.borderRadius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: tokens.borderRadius.full,
    overflow: 'hidden',
  },
  gradient: {
    width: '100%',
    height: '100%',
  },
});
