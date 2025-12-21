/**
 * Circly Theme System
 *
 * 모든 디자인 토큰과 애니메이션 시스템의 통합 export
 *
 * @example
 * import { colors, spacing, durations, animateValue } from '@/theme';
 *
 * const styles = StyleSheet.create({
 *   container: {
 *     backgroundColor: colors.primary[500],
 *     padding: spacing[4],
 *   },
 * });
 */

// ============================================================================
// Token Exports
// ============================================================================

export {
  // Colors
  primaryColors,
  secondaryColors,
  semanticColors,
  neutralColors,
  gradients,
  darkTheme,

  // Typography
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  letterSpacing,

  // Spacing
  spacing,

  // Border Radius
  borderRadius,

  // Shadows
  shadows,

  // Z-Index
  zIndex,

  // Icons
  iconSizes,

  // Touch Targets
  touchTargets,
  accessibility,

  // Type Exports
  type PrimaryColor,
  type SecondaryColor,
  type NeutralColor,
  type FontSize,
  type FontWeight,
  type Spacing,
  type BorderRadius,
  type Shadow,
  type ZIndex,
  type IconSize,
} from './tokens';

export {
  // Durations
  durations,

  // Easing Curves
  easingCurves,
  cubicBezierValues,

  // Spring Configs
  springConfigs,

  // Animation Helpers
  animateValue,
  animateSpring,

  // Animation Patterns
  fadeAnimations,
  slideAnimations,
  scaleAnimations,
  buttonPressAnimation,
  cardFlipAnimation,
  modalAnimations,
  progressBarAnimation,
  toastAnimation,

  // Haptic Feedback
  hapticPatterns,
  hapticMapping,

  // Type Exports
  type Duration,
  type EasingCurve,
  type SpringConfig,
  type HapticPattern,
} from './animations';

// ============================================================================
// Convenience Re-exports
// ============================================================================

/**
 * Unified Colors Object
 * 모든 컬러 시스템 통합
 */
import {
  primaryColors,
  secondaryColors,
  semanticColors,
  neutralColors,
  gradients,
  darkTheme,
} from './tokens';

export const colors = {
  primary: primaryColors,
  secondary: secondaryColors,
  semantic: semanticColors,
  neutral: neutralColors,
  gradients,
  dark: darkTheme,
} as const;

/**
 * Unified Typography Object
 * 타이포그래피 시스템 통합
 */
import {
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  letterSpacing,
} from './tokens';

export const typography = {
  families: fontFamilies,
  sizes: fontSizes,
  weights: fontWeights,
  lineHeights,
  letterSpacing,
} as const;

/**
 * Unified Animations Object
 * 애니메이션 시스템 통합
 */
import {
  durations,
  easingCurves,
  springConfigs,
  fadeAnimations,
  slideAnimations,
  scaleAnimations,
  buttonPressAnimation,
  cardFlipAnimation,
  modalAnimations,
  progressBarAnimation,
  toastAnimation,
} from './animations';

export const animations = {
  durations,
  easing: easingCurves,
  spring: springConfigs,
  patterns: {
    fade: fadeAnimations,
    slide: slideAnimations,
    scale: scaleAnimations,
    button: buttonPressAnimation,
    card: cardFlipAnimation,
    modal: modalAnimations,
    progress: progressBarAnimation,
    toast: toastAnimation,
  },
} as const;

// ============================================================================
// Theme Object (전체 통합)
// ============================================================================

/**
 * Complete Theme Object
 * 모든 디자인 토큰 한 번에 접근
 *
 * @example
 * import { theme } from '@/theme';
 *
 * const color = theme.colors.primary[500];
 * const duration = theme.animations.durations.normal;
 */
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  zIndex,
  iconSizes,
  touchTargets,
  accessibility,
  animations,
} as const;

/**
 * Theme Type
 * 타입 안전성을 위한 전체 테마 타입
 */
export type Theme = typeof theme;

// ============================================================================
// Default Export
// ============================================================================

export default theme;
