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
  spacing,
  borderRadius,
  shadows,
  zIndex,
  iconSizes,
  touchTargets,
  accessibility,
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
  duration: {
    instant: durations.instant,
    fast: durations.fast,
    normal: durations.normal,
    slow: durations.slow,
  },
  easing: easingCurves,
  spring: {
    responsive: springConfigs.gentle,
    bouncy: springConfigs.bouncy,
    stiff: springConfigs.stiff,
  },
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
// Consolidated Tokens Object (for component usage)
// ============================================================================

/**
 * Tokens Object
 * 컴포넌트에서 사용하기 편한 통합 토큰 객체
 *
 * @example
 * import { tokens } from '@/theme';
 *
 * const styles = StyleSheet.create({
 *   button: {
 *     backgroundColor: tokens.colors.primary[500],
 *     padding: tokens.spacing.md,
 *     borderRadius: tokens.borderRadius.lg,
 *   },
 * });
 */
export const tokens = {
  colors: {
    primary: primaryColors,
    secondary: secondaryColors,
    semantic: semanticColors,
    neutral: neutralColors,
    white: '#ffffff',
    black: '#000000',
    error: semanticColors.error,
    success: semanticColors.success,
    warning: semanticColors.warning,
    gradients,
    dark: darkTheme,
  },
  typography: {
    fontFamily: {
      sans: fontFamilies.primary,
      mono: fontFamilies.mono,
    },
    fontSize: fontSizes,
    fontWeight: {
      normal: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
    lineHeight: {
      xs: fontSizes.xs * 1.5,
      sm: fontSizes.sm * 1.5,
      base: fontSizes.base * 1.5,
      lg: fontSizes.lg * 1.5,
      xl: fontSizes.xl * 1.5,
      '2xl': fontSizes['2xl'] * 1.5,
      '3xl': fontSizes['3xl'] * 1.5,
      '4xl': fontSizes['4xl'] * 1.5,
    },
    letterSpacing,
  },
  spacing: {
    xs: spacing[1],
    sm: spacing[2],
    md: spacing[4],
    lg: spacing[6],
    xl: spacing[8],
    '2xl': spacing[12],
  },
  borderRadius,
  shadows,
  zIndex,
  iconSizes,
  touchTarget: {
    sm: touchTargets.min,
    md: touchTargets.comfortable,
    lg: touchTargets.spacious,
  },
  accessibility,
} as const;

// ============================================================================
// Default Export
// ============================================================================

export default theme;
