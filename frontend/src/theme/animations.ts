/**
 * Circly Animation Tokens
 *
 * Single Source of Truth: prd/design/03-animations.md
 *
 * React Native Reanimated와 함께 사용 가능한 모션 디자인 토큰
 */

import { Easing, withSpring, withTiming } from 'react-native-reanimated';

// ============================================================================
// 1. Duration (지속시간)
// ============================================================================

/**
 * Animation Duration Tokens
 * 밀리초 단위
 */
export const durations = {
  instant: 0,      // 즉시
  fastest: 50,     // 즉각 피드백 (터치 하이라이트)
  faster: 100,     // 빠른 피드백 (버튼 press)
  fast: 150,       // 마이크로 인터랙션
  normal: 200,     // 표준 전환 (기본값)
  slow: 300,       // 화면 전환
  slower: 400,     // 복잡한 애니메이션
  slowest: 500,    // 모달 전환
  gentle: 800,     // 결과 그래프 애니메이션
  relaxed: 1000,   // 축하 애니메이션
} as const;

// ============================================================================
// 2. Easing Curves
// ============================================================================

/**
 * Easing Function Tokens
 * React Native Reanimated Easing 사용
 */
export const easingCurves = {
  // 기본 이징
  linear: Easing.linear,
  easeIn: Easing.in(Easing.ease),
  easeOut: Easing.out(Easing.ease),
  easeInOut: Easing.inOut(Easing.ease),

  // 특수 이징 (Gas 앱 스타일)
  bounce: Easing.bezier(0.34, 1.56, 0.64, 1),      // 선택 완료, 축하
  backOut: Easing.bezier(0.34, 1.3, 0.64, 1),      // 버튼 등장
  spring: Easing.bezier(0.37, 0, 0.63, 1),         // 카드 전환
  smooth: Easing.bezier(0.25, 0.1, 0.25, 1),       // 부드러운 스크롤
} as const;

/**
 * Cubic Bezier Values (CSS 호환)
 * Web 또는 CSS Animations 사용 시
 */
export const cubicBezierValues = {
  linear: [0, 0, 1, 1],
  easeIn: [0.4, 0, 1, 1],
  easeOut: [0, 0, 0.2, 1],
  easeInOut: [0.4, 0, 0.2, 1],
  bounce: [0.34, 1.56, 0.64, 1],
  backOut: [0.34, 1.3, 0.64, 1],
  spring: [0.37, 0, 0.63, 1],
  smooth: [0.25, 0.1, 0.25, 1],
} as const;

// ============================================================================
// 3. Spring Configuration (React Native Reanimated)
// ============================================================================

/**
 * Spring Animation Presets
 * React Native Reanimated withSpring() 설정
 */
export const springConfigs = {
  // 빠르고 단단한 반응
  stiff: {
    damping: 15,
    stiffness: 200,
    mass: 1,
  },
  // 바운스 효과
  bouncy: {
    damping: 12,
    stiffness: 180,
    mass: 1,
  },
  // 부드러운 전환
  gentle: {
    damping: 20,
    stiffness: 100,
    mass: 1,
  },
  // 흔들리는 효과
  wobbly: {
    damping: 10,
    stiffness: 150,
    mass: 1,
  },
} as const;

// ============================================================================
// 4. Animation Helpers
// ============================================================================

/**
 * Timing Animation Helper
 * withTiming wrapper with preset easing
 *
 * @example
 * animateValue(value, 100, 'normal', 'easeOut');
 */
export const animateValue = (
  value: number,
  toValue: number,
  duration: keyof typeof durations = 'normal',
  easing: keyof typeof easingCurves = 'easeInOut'
) => {
  'worklet';
  return withTiming(toValue, {
    duration: durations[duration],
    easing: easingCurves[easing],
  });
};

/**
 * Spring Animation Helper
 * withSpring wrapper with preset configs
 *
 * @example
 * animateSpring(value, 100, 'bouncy');
 */
export const animateSpring = (
  value: number,
  toValue: number,
  preset: keyof typeof springConfigs = 'gentle'
) => {
  'worklet';
  return withSpring(toValue, springConfigs[preset]);
};

// ============================================================================
// 5. Common Animation Patterns
// ============================================================================

/**
 * Fade In/Out
 */
export const fadeAnimations = {
  fadeIn: {
    duration: durations.normal,
    easing: easingCurves.easeOut,
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  fadeOut: {
    duration: durations.normal,
    easing: easingCurves.easeIn,
    from: { opacity: 1 },
    to: { opacity: 0 },
  },
} as const;

/**
 * Slide In/Out
 */
export const slideAnimations = {
  slideInUp: {
    duration: durations.slow,
    easing: easingCurves.easeOut,
    from: { translateY: 100 },
    to: { translateY: 0 },
  },
  slideInDown: {
    duration: durations.slow,
    easing: easingCurves.easeOut,
    from: { translateY: -100 },
    to: { translateY: 0 },
  },
  slideInLeft: {
    duration: durations.slow,
    easing: easingCurves.easeOut,
    from: { translateX: -100 },
    to: { translateX: 0 },
  },
  slideInRight: {
    duration: durations.slow,
    easing: easingCurves.easeOut,
    from: { translateX: 100 },
    to: { translateX: 0 },
  },
} as const;

/**
 * Scale In/Out
 */
export const scaleAnimations = {
  scaleIn: {
    duration: durations.normal,
    easing: easingCurves.backOut,
    from: { scale: 0 },
    to: { scale: 1 },
  },
  scaleOut: {
    duration: durations.normal,
    easing: easingCurves.easeIn,
    from: { scale: 1 },
    to: { scale: 0 },
  },
  scalePulse: {
    duration: durations.fast,
    easing: easingCurves.bounce,
    from: { scale: 1 },
    to: { scale: 1.05 },
  },
} as const;

/**
 * Button Press Animation
 */
export const buttonPressAnimation = {
  duration: durations.faster,
  easing: easingCurves.easeInOut,
  scaleDown: 0.95,
  scaleUp: 1,
} as const;

/**
 * Card Flip Animation
 */
export const cardFlipAnimation = {
  duration: durations.slower,
  easing: easingCurves.spring,
  from: { rotateY: '0deg' },
  to: { rotateY: '180deg' },
} as const;

/**
 * Modal Animations
 */
export const modalAnimations = {
  backdrop: {
    fadeIn: {
      duration: durations.slow,
      easing: easingCurves.easeOut,
      from: { opacity: 0 },
      to: { opacity: 0.5 },
    },
    fadeOut: {
      duration: durations.slow,
      easing: easingCurves.easeIn,
      from: { opacity: 0.5 },
      to: { opacity: 0 },
    },
  },
  content: {
    slideUp: {
      duration: durations.slowest,
      easing: easingCurves.backOut,
      from: { translateY: 300 },
      to: { translateY: 0 },
    },
    slideDown: {
      duration: durations.slow,
      easing: easingCurves.easeIn,
      from: { translateY: 0 },
      to: { translateY: 300 },
    },
  },
} as const;

/**
 * Progress Bar Animation
 */
export const progressBarAnimation = {
  duration: durations.gentle,
  easing: easingCurves.smooth,
} as const;

/**
 * Toast Notification Animation
 */
export const toastAnimation = {
  enter: {
    duration: durations.slow,
    easing: easingCurves.backOut,
    from: { translateY: -100, opacity: 0 },
    to: { translateY: 0, opacity: 1 },
  },
  exit: {
    duration: durations.normal,
    easing: easingCurves.easeIn,
    from: { translateY: 0, opacity: 1 },
    to: { translateY: -100, opacity: 0 },
  },
} as const;

// ============================================================================
// 6. Haptic Feedback Patterns
// ============================================================================

/**
 * Haptic Feedback Types (iOS)
 * React Native Haptics와 함께 사용
 */
export const hapticPatterns = {
  selection: 'selection', // 가벼운 탭
  light: 'light',         // 가벼운 임팩트
  medium: 'medium',       // 중간 임팩트
  heavy: 'heavy',         // 강한 임팩트
  success: 'success',     // 성공 피드백
  warning: 'warning',     // 경고 피드백
  error: 'error',         // 에러 피드백
} as const;

/**
 * Haptic Mapping to User Actions
 */
export const hapticMapping = {
  buttonPress: 'selection',
  voteSubmit: 'medium',
  pollComplete: 'success',
  errorOccurred: 'error',
  cardSwipe: 'light',
  tabSwitch: 'selection',
} as const;

// ============================================================================
// Type Exports
// ============================================================================

export type Duration = keyof typeof durations;
export type EasingCurve = keyof typeof easingCurves;
export type SpringConfig = keyof typeof springConfigs;
export type HapticPattern = keyof typeof hapticPatterns;
