import React, { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Text } from '../primitives/Text';
import { tokens } from '../../theme';

// ============================================================================
// Types
// ============================================================================

interface VoteCelebrationProps {
  /** 연출 종료 시 호출 (약 1.8초 후) */
  onComplete: () => void;
  /** 중앙 메시지 (기본: 투표 완료!) */
  message?: string;
}

const HEART_COUNT = 8;
const DURATION = 1800;

// ============================================================================
// VoteCelebration Component
// ============================================================================

/**
 * VoteCelebration
 *
 * 투표 완료 시 하트 버스트 오버레이 연출
 * @see prd/design/04-user-flow.md#투표 참여 플로우 (완료 애니메이션)
 *
 * @example
 * {showCelebration && (
 *   <VoteCelebration onComplete={() => setShowCelebration(false)} />
 * )}
 */
export function VoteCelebration({ onComplete, message = '투표 완료!' }: VoteCelebrationProps) {
  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const timer = setTimeout(onComplete, DURATION);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.overlay} pointerEvents="none">
      <CenterHeart message={message} />
      {Array.from({ length: HEART_COUNT }).map((_, i) => (
        <FloatingHeart key={i} index={i} />
      ))}
    </View>
  );
}

// ============================================================================
// CenterHeart
// ============================================================================

function CenterHeart({ message }: { message: string }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 150 });
    scale.value = withSequence(
      withSpring(1.2, { damping: 8, stiffness: 200 }),
      withSpring(1, { damping: 12, stiffness: 150 }),
      withDelay(900, withTiming(0, { duration: 250, easing: Easing.in(Easing.quad) }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.center, animatedStyle]}>
      <Text style={styles.centerHeart}>💜</Text>
      <Text style={styles.centerMessage}>{message}</Text>
    </Animated.View>
  );
}

// ============================================================================
// FloatingHeart
// ============================================================================

const HEARTS = ['💜', '💖', '💙', '✨', '💜', '💛', '💚', '🩷'];

function FloatingHeart({ index }: { index: number }) {
  const { width, height } = useWindowDimensions();
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  // 하트별 고정 시작 위치/지연 (index 기반이라 리렌더에도 안정적)
  const startX = ((index * 137) % 80) / 100 + 0.1; // 0.1 ~ 0.9
  const delay = (index * 90) % 500;
  const distance = height * (0.25 + ((index * 53) % 20) / 100);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(600, withTiming(0, { duration: 500 }))
      )
    );
    translateY.value = withDelay(
      delay,
      withTiming(-distance, { duration: 1400, easing: Easing.out(Easing.quad) })
    );
    scale.value = withDelay(delay, withSpring(1, { damping: 10 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.floatingHeart,
        { left: width * startX, top: height * 0.65 },
        animatedStyle,
      ]}
    >
      <Text style={styles.floatingHeartText}>{HEARTS[index % HEARTS.length]}</Text>
    </Animated.View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    zIndex: tokens.zIndex.modal,
  },
  center: {
    alignItems: 'center',
  },
  centerHeart: {
    fontSize: 72,
    lineHeight: 84,
  },
  centerMessage: {
    marginTop: tokens.spacing.md,
    fontSize: tokens.typography.fontSize.xl,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.white,
  },
  floatingHeart: {
    position: 'absolute',
  },
  floatingHeartText: {
    fontSize: 32,
    lineHeight: 38,
  },
});
