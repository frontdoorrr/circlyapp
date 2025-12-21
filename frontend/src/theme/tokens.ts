/**
 * Circly Design Tokens
 *
 * Single Source of Truth: prd/design/02-ui-design-system.md
 *
 * 모든 디자인 토큰은 TypeScript 타입과 함께 정의되어 있습니다.
 * React Native StyleSheet에서 직접 사용 가능합니다.
 */

// ============================================================================
// 1. Color System
// ============================================================================

/**
 * Primary Colors (Gas 앱 영감)
 * 브랜드 메인 컬러 - 신뢰와 친근함
 */
export const primaryColors = {
  50: '#f3f4ff',
  100: '#e8eaff',
  200: '#d4d8ff',
  300: '#b1b8ff',
  400: '#8a92ff',
  500: '#667eea', // Main Brand
  600: '#5a6fd8',
  700: '#4c5bc5',
  800: '#3f4ba0',
  900: '#36427d',
} as const;

/**
 * Secondary Colors
 * 서브 브랜드 컬러 - 따뜻함과 감성
 */
export const secondaryColors = {
  50: '#fdf2ff',
  100: '#fae8ff',
  200: '#f5d0fe',
  300: '#f0abfc',
  400: '#e879f9',
  500: '#764ba2', // Secondary Brand
  600: '#8b5cf6',
  700: '#7c3aed',
  800: '#6d28d9',
  900: '#5b21b6',
} as const;

/**
 * Semantic Colors
 * 성공, 경고, 에러 피드백용
 */
export const semanticColors = {
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
  },
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706',
  },
  error: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
  },
} as const;

/**
 * Neutral Colors (Gas 앱 스타일)
 * 텍스트, 배경, 보더에 사용
 */
export const neutralColors = {
  50: '#fafafa',
  100: '#f5f5f5',
  200: '#e5e5e5',
  300: '#d4d4d4',
  400: '#a3a3a3',
  500: '#737373',
  600: '#525252',
  700: '#404040',
  800: '#262626',
  900: '#171717',
} as const;

/**
 * Gradient System
 * 브랜드 그라디언트 및 감정 표현용
 */
export const gradients = {
  // Primary Gradients
  primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  primarySoft: 'linear-gradient(135deg, #e8eaff 0%, #fae8ff 100%)',

  // Emotion Gradients
  joy: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  calm: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  energy: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  trust: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',

  // Background Gradients
  bgLight: 'linear-gradient(135deg, #fafafa 0%, #f0f0f0 100%)',
  bgDark: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
} as const;

// ============================================================================
// 2. Typography
// ============================================================================

/**
 * Font Families (한국어 최적화)
 */
export const fontFamilies = {
  primary: 'Pretendard Variable',
  mono: 'SF Mono',
} as const;

/**
 * Font Sizes
 * rem 대신 픽셀 값 직접 사용 (React Native)
 */
export const fontSizes = {
  xs: 12,    // 0.75rem
  sm: 14,    // 0.875rem
  base: 16,  // 1rem
  lg: 18,    // 1.125rem
  xl: 20,    // 1.25rem
  '2xl': 24, // 1.5rem
  '3xl': 30, // 1.875rem
  '4xl': 36, // 2.25rem
} as const;

/**
 * Font Weights
 */
export const fontWeights = {
  thin: '100',
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

/**
 * Line Heights
 * 배수로 표현 (React Native lineHeight)
 */
export const lineHeights = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.75,
  loose: 2,
} as const;

/**
 * Letter Spacing
 * 픽셀 값 (React Native letterSpacing)
 */
export const letterSpacing = {
  tighter: -0.5,
  tight: -0.25,
  normal: 0,
  wide: 0.25,
  wider: 0.5,
  widest: 1,
} as const;

// ============================================================================
// 3. Spacing System (8pt Grid)
// ============================================================================

/**
 * Spacing Scale
 * 모든 값은 8의 배수 또는 4px 단위
 */
export const spacing = {
  0: 0,
  1: 4,   // 0.25rem
  2: 8,   // 0.5rem
  3: 12,  // 0.75rem
  4: 16,  // 1rem
  5: 20,  // 1.25rem
  6: 24,  // 1.5rem
  8: 32,  // 2rem
  10: 40, // 2.5rem
  12: 48, // 3rem
  16: 64, // 4rem
  20: 80, // 5rem
} as const;

// ============================================================================
// 4. Border Radius (Gas 앱 스타일)
// ============================================================================

/**
 * Border Radius
 * 부드러운 라운드 처리
 */
export const borderRadius = {
  none: 0,
  sm: 6,     // 0.375rem
  base: 8,   // 0.5rem
  md: 12,    // 0.75rem
  lg: 16,    // 1rem
  xl: 20,    // 1.25rem
  '2xl': 24, // 1.5rem
  full: 9999,
} as const;

// ============================================================================
// 5. Shadow System (Elevation)
// ============================================================================

/**
 * Shadow Elevations
 * React Native에서는 shadow 속성 조합으로 표현
 */
export const shadows = {
  none: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  '2xl': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 16,
  },
  inner: {
    // React Native에서는 inner shadow 직접 지원 안함
    // 필요시 추가 라이브러리 사용 또는 디자인 변경
  },
  // Brand Colored Shadows
  primary: {
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 4,
  },
  primaryLg: {
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 8,
  },
  secondary: {
    shadowColor: '#764ba2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 4,
  },
  success: {
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 4,
  },
  error: {
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 4,
  },
} as const;

// ============================================================================
// 6. Z-Index Scale
// ============================================================================

/**
 * Z-Index Hierarchy
 * 레이어 우선순위 관리
 */
export const zIndex = {
  behind: -1,
  base: 0,
  raised: 10,
  dropdown: 100,
  sticky: 200,
  overlay: 300,
  modal: 400,
  popover: 500,
  toast: 600,
  maximum: 9999,
} as const;

// ============================================================================
// 7. Icon Sizes
// ============================================================================

/**
 * Icon Size System
 * 아이콘 크기 표준화
 */
export const iconSizes = {
  '2xs': 12, // 인라인 아이콘
  xs: 14,    // 작은 버튼 아이콘
  sm: 16,    // 리스트 아이콘
  base: 20,  // 기본 아이콘
  md: 24,    // 버튼/탭바 아이콘
  lg: 28,    // 강조 아이콘
  xl: 32,    // 빈 상태 아이콘
  '2xl': 40, // 큰 상태 아이콘
  '3xl': 48, // 히어로 아이콘
  '4xl': 64, // 온보딩 아이콘
} as const;

// ============================================================================
// 8. Touch Targets & Accessibility
// ============================================================================

/**
 * Touch Targets
 * Apple HIG 기준 최소 터치 영역
 */
export const touchTargets = {
  min: 44,         // 최소 (Apple HIG)
  comfortable: 48, // 권장
  spacious: 56,    // 여유있는
} as const;

/**
 * Accessibility Guidelines
 */
export const accessibility = {
  // 텍스트 대비 최소값 (WCAG AA)
  textContrast: {
    normal: 4.5, // 일반 텍스트
    large: 3.0,  // 18px+ 텍스트
  },
  // 최소 터치 영역
  minTouchArea: touchTargets.min,
} as const;

// ============================================================================
// 9. Dark Mode Support
// ============================================================================

/**
 * Light Theme Colors (Default)
 */
export const lightTheme = {
  background: '#ffffff',
  backgroundSecondary: '#fafafa',
  backgroundTertiary: '#f5f5f5',

  text: '#171717',
  textSecondary: '#525252',
  textTertiary: '#a3a3a3',
  textInverse: '#ffffff',

  border: '#e5e5e5',
  borderSecondary: '#d4d4d4',

  card: '#ffffff',
  cardElevated: '#ffffff',

  overlay: 'rgba(0, 0, 0, 0.5)',
  scrim: 'rgba(0, 0, 0, 0.3)',
} as const;

/**
 * Dark Theme Colors
 * 다크 모드 전용 컬러 시스템
 */
export const darkTheme = {
  background: '#0a0a0a',
  backgroundSecondary: '#1a1a1a',
  backgroundTertiary: '#2d2d2d',

  text: '#ffffff',
  textSecondary: '#e5e5e5',
  textTertiary: '#a3a3a3',
  textInverse: '#171717',

  border: '#404040',
  borderSecondary: '#525252',

  card: '#1a1a1a',
  cardElevated: '#2d2d2d',

  overlay: 'rgba(0, 0, 0, 0.7)',
  scrim: 'rgba(0, 0, 0, 0.5)',
} as const;

/**
 * Theme-agnostic Semantic Colors
 * 라이트/다크 모드에서 동일하게 사용되는 색상
 */
export const themeAgnosticColors = {
  primary: primaryColors,
  secondary: secondaryColors,
  semantic: semanticColors,
  neutral: neutralColors,
} as const;

// ============================================================================
// 10. Unified Colors Export (Theme-aware)
// ============================================================================

/**
 * Unified Colors
 * useTheme()으로 접근하여 현재 테마에 맞는 색상 사용
 */
export const colors = {
  // Brand colors (theme-agnostic)
  primary: primaryColors,
  secondary: secondaryColors,
  semantic: semanticColors,
  neutral: neutralColors,

  // Light theme (default)
  white: '#ffffff',
  black: '#000000',
  background: lightTheme.background,
  backgroundSecondary: lightTheme.backgroundSecondary,
  backgroundTertiary: lightTheme.backgroundTertiary,

  text: lightTheme.text,
  textSecondary: lightTheme.textSecondary,
  textTertiary: lightTheme.textTertiary,
  textInverse: lightTheme.textInverse,

  border: lightTheme.border,
  borderSecondary: lightTheme.borderSecondary,

  card: lightTheme.card,
  cardElevated: lightTheme.cardElevated,

  overlay: lightTheme.overlay,
  scrim: lightTheme.scrim,
} as const;

// ============================================================================
// Type Exports
// ============================================================================

export type ThemeMode = 'light' | 'dark';
export type Theme = typeof lightTheme;
export type Colors = typeof colors;

export type PrimaryColor = keyof typeof primaryColors;
export type SecondaryColor = keyof typeof secondaryColors;
export type NeutralColor = keyof typeof neutralColors;
export type FontSize = keyof typeof fontSizes;
export type FontWeight = keyof typeof fontWeights;
export type Spacing = keyof typeof spacing;
export type BorderRadius = keyof typeof borderRadius;
export type Shadow = keyof typeof shadows;
export type ZIndex = keyof typeof zIndex;
export type IconSize = keyof typeof iconSizes;
