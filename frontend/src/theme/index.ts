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
// Theme Context Exports
// ============================================================================

export {
  ThemeProvider,
  useTheme,
  useThemedStyles,
  useThemeColor,
} from './ThemeContext';

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

// TEMPORARILY DISABLED: animations.ts causing Worklets version mismatch
// export {
//   // Durations
//   durations,
//
//   // Easing Curves
//   easingCurves,
//   cubicBezierValues,
//
//   // Spring Configs
//   springConfigs,
//
//   // Animation Helpers
//   animateValue,
//   animateSpring,
//
//   // Animation Patterns
//   fadeAnimations,
//   slideAnimations,
//   scaleAnimations,
//   buttonPressAnimation,
//   cardFlipAnimation,
//   modalAnimations,
//   progressBarAnimation,
//   toastAnimation,
//
//   // Haptic Feedback
//   hapticPatterns,
//   hapticMapping,
//
//   // Type Exports
//   type Duration,
//   type EasingCurve,
//   type SpringConfig,
//   type HapticPattern,
// } from './animations';

// Temporary dummy exports
export const durations = { instant: 0, fast: 200, normal: 300, slow: 500 };
export const easingCurves = {};
export const cubicBezierValues = {};
export const springConfigs = {};
export const animateValue = () => {};
export const animateSpring = () => {};
export const fadeAnimations = {};
export const slideAnimations = {};
export const scaleAnimations = {};
export const buttonPressAnimation = {};
export const cardFlipAnimation = {};
export const modalAnimations = {};
export const progressBarAnimation = {};
export const toastAnimation = {};
export const hapticPatterns = {};
export const hapticMapping = {};
export type Duration = number;
export type EasingCurve = any;
export type SpringConfig = any;
export type HapticPattern = any;

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
  colors as tokenColors,
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
// TEMPORARILY DISABLED: animations.ts import
// import {
//   durations,
//   easingCurves,
//   springConfigs,
//   fadeAnimations,
//   slideAnimations,
//   scaleAnimations,
//   buttonPressAnimation,
//   cardFlipAnimation,
//   modalAnimations,
//   progressBarAnimation,
//   toastAnimation,
// } from './animations';

export const animations = {
  duration: {
    instant: 0,
    fast: 200,
    normal: 300,
    slow: 500,
  },
  easing: {},
  spring: {
    responsive: {},
    bouncy: {},
    stiff: {},
  },
  patterns: {
    fade: {},
    slide: {},
    scale: {},
    button: {},
    card: {},
    modal: {},
    progress: {},
    toast: {},
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
  // Use colors from tokens.ts directly (includes red, green, yellow, error, success, warning aliases)
  colors: tokenColors,
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
