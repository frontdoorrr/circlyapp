import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { tokens, animations } from '../../theme';
import { Text } from '../primitives/Text';

// ============================================================================
// Types
// ============================================================================

export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

export interface LoadingSpinnerProps {
  size?: SpinnerSize;
  color?: string;
  message?: string;
  fullScreen?: boolean;
  style?: ViewStyle;
}

// ============================================================================
// LoadingSpinner Component
// ============================================================================

/**
 * LoadingSpinner Component
 *
 * 로딩 스피너 컴포넌트
 *
 * @param size - 스피너 크기
 * @param color - 스피너 색상
 * @param message - 로딩 메시지
 * @param fullScreen - 전체 화면 오버레이
 * @param style - 커스텀 스타일
 *
 * @example
 * <LoadingSpinner size="md" message="로딩 중..." />
 *
 * // 전체 화면 로딩
 * <LoadingSpinner fullScreen message="데이터를 불러오는 중..." />
 */
export function LoadingSpinner({
  size = 'md',
  color = tokens.colors.primary[500],
  message,
  fullScreen = false,
  style,
}: LoadingSpinnerProps) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: animations.duration.fast });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const spinnerSize = getSizeValue(size);

  const content = (
    <Animated.View style={[styles.container, animatedStyle, style]}>
      <ActivityIndicator size={spinnerSize} color={color} />
      {message && (
        <Text
          variant="sm"
          align="center"
          color={tokens.colors.neutral[600]}
          style={styles.message}
        >
          {message}
        </Text>
      )}
    </Animated.View>
  );

  if (fullScreen) {
    return (
      <View style={styles.fullScreenContainer}>
        <View style={styles.fullScreenOverlay} />
        {content}
      </View>
    );
  }

  return content;
}

// ============================================================================
// Dots Loading Indicator
// ============================================================================

export interface DotsLoadingProps {
  color?: string;
  size?: number;
}

/**
 * DotsLoading Component
 *
 * 점 3개로 로딩 표시 (애니메이션)
 *
 * @param color - 점 색상
 * @param size - 점 크기
 *
 * @example
 * <DotsLoading />
 */
export function DotsLoading({
  color = tokens.colors.primary[500],
  size = 8,
}: DotsLoadingProps) {
  return (
    <View style={styles.dotsContainer}>
      <Dot color={color} size={size} delay={0} />
      <Dot color={color} size={size} delay={150} />
      <Dot color={color} size={size} delay={300} />
    </View>
  );
}

interface DotProps {
  color: string;
  size: number;
  delay: number;
}

function Dot({ color, size, delay }: DotProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 400 }),
        withTiming(1, { duration: 400 })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: color,
  }));

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        animatedStyle,
      ]}
    />
  );
}

// ============================================================================
// Pulse Loading Indicator
// ============================================================================

export interface PulseLoadingProps {
  color?: string;
  size?: number;
}

/**
 * PulseLoading Component
 *
 * 펄스 애니메이션 로딩 표시
 *
 * @param color - 펄스 색상
 * @param size - 펄스 크기
 *
 * @example
 * <PulseLoading size={40} />
 */
export function PulseLoading({
  color = tokens.colors.primary[500],
  size = 40,
}: PulseLoadingProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      false
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    backgroundColor: color,
  }));

  return (
    <View style={styles.pulseContainer}>
      <Animated.View
        style={[
          styles.pulse,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getSizeValue(size: SpinnerSize): 'small' | 'large' {
  switch (size) {
    case 'sm':
    case 'md':
      return 'small';
    case 'lg':
    case 'xl':
      return 'large';
    default:
      return 'small';
  }
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.lg,
  },
  message: {
    marginTop: tokens.spacing.md,
  },
  // Full screen
  fullScreenContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: tokens.zIndex.overlay,
  },
  fullScreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: tokens.colors.black,
    opacity: 0.3,
  },
  // Dots
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  dot: {
    // Dynamic styles applied inline
  },
  // Pulse
  pulseContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulse: {
    // Dynamic styles applied inline
  },
});
