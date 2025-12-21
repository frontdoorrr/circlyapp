import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { tokens, animations } from '../../theme';
import { Text } from '../primitives/Text';

// ============================================================================
// Types
// ============================================================================

export interface ProgressBarProps {
  current: number;
  total: number;
  showLabel?: boolean;
  animate?: boolean;
}

// ============================================================================
// ProgressBar Component
// ============================================================================

/**
 * ProgressBar Component
 *
 * 질문 진행 표시 컴포넌트
 *
 * @param current - 현재 질문 번호 (1-based)
 * @param total - 전체 질문 개수
 * @param showLabel - 라벨 표시 여부 (기본: true)
 * @param animate - 애니메이션 활성화 (기본: true)
 *
 * @example
 * <ProgressBar current={3} total={10} />
 * // 표시: "3 / 10" 및 30% 진행바
 */
export function ProgressBar({
  current,
  total,
  showLabel = true,
  animate = true,
}: ProgressBarProps) {
  const progress = Math.min(Math.max((current / total) * 100, 0), 100);

  const width = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (animate) {
      width.value = withSpring(progress, animations.spring.responsive);
      opacity.value = withTiming(1, { duration: animations.duration.normal });
    } else {
      width.value = progress;
      opacity.value = 1;
    }
  }, [progress, animate]);

  const barAnimatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      {/* Label */}
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text variant="sm" weight="medium" color={tokens.colors.neutral[600]}>
            질문
          </Text>
          <Text variant="base" weight="bold" color={tokens.colors.primary[600]}>
            {current} / {total}
          </Text>
        </View>
      )}

      {/* Progress Bar */}
      <View style={styles.barContainer}>
        <View style={styles.barBackground}>
          <Animated.View style={[styles.barFill, barAnimatedStyle]} />
        </View>
      </View>

      {/* Percentage (optional) */}
      {progress > 0 && (
        <Text
          variant="xs"
          weight="medium"
          color={tokens.colors.neutral[500]}
          style={styles.percentage}
        >
          {Math.round(progress)}% 완료
        </Text>
      )}
    </Animated.View>
  );
}

// ============================================================================
// Compact ProgressBar Variant
// ============================================================================

export interface CompactProgressBarProps {
  current: number;
  total: number;
}

/**
 * CompactProgressBar Component
 *
 * 간단한 진행 표시 (라벨 없음, 작은 높이)
 *
 * @param current - 현재 위치
 * @param total - 전체 개수
 *
 * @example
 * <CompactProgressBar current={5} total={10} />
 */
export function CompactProgressBar({ current, total }: CompactProgressBarProps) {
  const progress = Math.min(Math.max((current / total) * 100, 0), 100);

  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withSpring(progress, animations.spring.responsive);
  }, [progress]);

  const barAnimatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View style={styles.compactContainer}>
      <View style={styles.compactBarBackground}>
        <Animated.View style={[styles.compactBarFill, barAnimatedStyle]} />
      </View>
    </View>
  );
}

// ============================================================================
// Dot Progress Indicator
// ============================================================================

export interface DotProgressProps {
  current: number;
  total: number;
}

/**
 * DotProgress Component
 *
 * 점으로 진행 상태 표시 (최대 10개 추천)
 *
 * @param current - 현재 위치 (1-based)
 * @param total - 전체 개수
 *
 * @example
 * <DotProgress current={3} total={5} />
 */
export function DotProgress({ current, total }: DotProgressProps) {
  const dots = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <View style={styles.dotContainer}>
      {dots.map((index) => (
        <Dot key={index} isActive={index <= current} index={index} />
      ))}
    </View>
  );
}

interface DotProps {
  isActive: boolean;
  index: number;
}

function Dot({ isActive, index }: DotProps) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    scale.value = withSpring(isActive ? 1 : 0.8, animations.spring.responsive);
    opacity.value = withTiming(isActive ? 1 : 0.3, {
      duration: animations.duration.fast,
    });
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    backgroundColor: isActive
      ? tokens.colors.primary[500]
      : tokens.colors.neutral[300],
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.xs,
  },
  barContainer: {
    width: '100%',
  },
  barBackground: {
    height: 8,
    backgroundColor: tokens.colors.neutral[100],
    borderRadius: tokens.borderRadius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: tokens.colors.primary[500],
    borderRadius: tokens.borderRadius.full,
  },
  percentage: {
    marginTop: tokens.spacing.xs,
    textAlign: 'center',
  },
  // Compact variant
  compactContainer: {
    width: '100%',
  },
  compactBarBackground: {
    height: 4,
    backgroundColor: tokens.colors.neutral[100],
    borderRadius: tokens.borderRadius.full,
    overflow: 'hidden',
  },
  compactBarFill: {
    height: '100%',
    backgroundColor: tokens.colors.primary[500],
    borderRadius: tokens.borderRadius.full,
  },
  // Dot variant
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
