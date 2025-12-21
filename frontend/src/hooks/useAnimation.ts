/**
 * Animation Hooks
 *
 * React Native Reanimated 기반 공통 애니메이션 훅
 * 디자인 토큰의 duration, easing, spring 설정 사용
 */

import { useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
} from 'react-native-reanimated';
import { animations } from '../theme';

// ============================================================================
// Fade Animations
// ============================================================================

/**
 * Fade In 애니메이션
 *
 * @param delay - 지연 시간 (ms)
 * @param duration - 애니메이션 지속 시간
 * @returns Animated style object
 *
 * @example
 * const animatedStyle = useFadeIn();
 * return <Animated.View style={animatedStyle}>...</Animated.View>
 */
export function useFadeIn(delay = 0, duration = animations.duration.normal) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration })
    );
  }, [delay, duration]);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));
}

/**
 * Fade Out 애니메이션
 *
 * @param trigger - 애니메이션 트리거 값
 * @param duration - 애니메이션 지속 시간
 * @returns Animated style object
 */
export function useFadeOut(trigger: boolean, duration = animations.duration.normal) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withTiming(trigger ? 0 : 1, { duration });
  }, [trigger, duration]);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));
}

// ============================================================================
// Slide Animations
// ============================================================================

export type SlideDirection = 'up' | 'down' | 'left' | 'right';

/**
 * Slide In 애니메이션
 *
 * @param direction - 슬라이드 방향
 * @param distance - 슬라이드 거리 (px)
 * @param delay - 지연 시간 (ms)
 * @param duration - 애니메이션 지속 시간
 * @returns Animated style object
 *
 * @example
 * const animatedStyle = useSlideIn('up', 100);
 * return <Animated.View style={animatedStyle}>...</Animated.View>
 */
export function useSlideIn(
  direction: SlideDirection = 'up',
  distance = 100,
  delay = 0,
  duration = animations.duration.normal
) {
  const translateX = useSharedValue(direction === 'left' ? -distance : direction === 'right' ? distance : 0);
  const translateY = useSharedValue(direction === 'up' ? distance : direction === 'down' ? -distance : 0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateX.value = withDelay(delay, withSpring(0, animations.spring.responsive));
    translateY.value = withDelay(delay, withSpring(0, animations.spring.responsive));
    opacity.value = withDelay(delay, withTiming(1, { duration }));
  }, [delay, duration, distance, direction]);

  return useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));
}

// ============================================================================
// Scale Animations
// ============================================================================

/**
 * Scale In 애니메이션 (작은 크기에서 정상 크기로)
 *
 * @param delay - 지연 시간 (ms)
 * @param initialScale - 초기 스케일 (0~1)
 * @returns Animated style object
 *
 * @example
 * const animatedStyle = useScaleIn(0, 0.8);
 * return <Animated.View style={animatedStyle}>...</Animated.View>
 */
export function useScaleIn(delay = 0, initialScale = 0.8) {
  const scale = useSharedValue(initialScale);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, animations.spring.bouncy));
    opacity.value = withDelay(delay, withTiming(1, { duration: animations.duration.fast }));
  }, [delay, initialScale]);

  return useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
}

/**
 * Pulse 애니메이션 (심장 박동처럼 반복)
 *
 * @param enabled - 애니메이션 활성화 여부
 * @param scale - 최대 스케일
 * @returns Animated style object
 *
 * @example
 * const animatedStyle = usePulse(true, 1.1);
 * return <Animated.View style={animatedStyle}>...</Animated.View>
 */
export function usePulse(enabled = true, scale = 1.05) {
  const scaleValue = useSharedValue(1);

  useEffect(() => {
    if (enabled) {
      scaleValue.value = withSequence(
        withSpring(scale, animations.spring.responsive),
        withSpring(1, animations.spring.responsive)
      );
    }
  }, [enabled, scale]);

  return useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));
}

// ============================================================================
// Button Press Animation
// ============================================================================

/**
 * 버튼 Press 애니메이션
 *
 * @returns { animatedStyle, onPressIn, onPressOut }
 *
 * @example
 * const { animatedStyle, onPressIn, onPressOut } = useButtonPress();
 * return (
 *   <AnimatedPressable
 *     onPressIn={onPressIn}
 *     onPressOut={onPressOut}
 *     style={animatedStyle}
 *   >
 *     ...
 *   </AnimatedPressable>
 * );
 */
export function useButtonPress(pressScale = 0.96) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const onPressIn = () => {
    scale.value = withSpring(pressScale, animations.spring.responsive);
    opacity.value = withTiming(0.8, { duration: animations.duration.fast });
  };

  const onPressOut = () => {
    scale.value = withSpring(1, animations.spring.responsive);
    opacity.value = withTiming(1, { duration: animations.duration.fast });
  };

  return { animatedStyle, onPressIn, onPressOut };
}

// ============================================================================
// Combined Animations
// ============================================================================

/**
 * 스태거 애니메이션 (순차 등장)
 *
 * @param index - 아이템 인덱스
 * @param staggerDelay - 각 아이템 간 지연 시간 (ms)
 * @returns Animated style object
 *
 * @example
 * items.map((item, index) => {
 *   const animatedStyle = useStaggeredFadeIn(index);
 *   return <Animated.View key={item.id} style={animatedStyle}>...</Animated.View>
 * })
 */
export function useStaggeredFadeIn(index: number, staggerDelay = 100) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    const delay = index * staggerDelay;
    opacity.value = withDelay(delay, withTiming(1, { duration: animations.duration.normal }));
    translateY.value = withDelay(delay, withSpring(0, animations.spring.responsive));
  }, [index, staggerDelay]);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
}

/**
 * Shake 애니메이션 (에러 표시용)
 *
 * @param trigger - 애니메이션 트리거 값
 * @returns Animated style object
 *
 * @example
 * const [hasError, setHasError] = useState(false);
 * const animatedStyle = useShake(hasError);
 * return <Animated.View style={animatedStyle}>...</Animated.View>
 */
export function useShake(trigger: boolean) {
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (trigger) {
      translateX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [trigger]);

  return useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));
}
