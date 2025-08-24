/**
 * Circly Design System - TypeScript 디자인 토큰
 * React Native용 디자인 시스템 토큰 정의
 */

// ========== 컬러 시스템 ==========
export const colors = {
  // Primary Colors - Gas 앱 스타일
  primary: {
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
  },

  // Secondary Colors
  secondary: {
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
  },

  // Semantic Colors
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

  // Neutral Colors - Gas 앱 스타일
  gray: {
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
  },

  // Special Colors
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
};

// ========== 그라디언트 시스템 ==========
export const gradients = {
  // Primary Gradients
  primary: ['#667eea', '#764ba2'],
  primarySoft: ['#e8eaff', '#fae8ff'],
  
  // Emotion Gradients
  joy: ['#ff9a9e', '#fecfef'],
  calm: ['#a8edea', '#fed6e3'],
  energy: ['#ffecd2', '#fcb69f'],
  trust: ['#667eea', '#764ba2'],

  // Background Gradients
  bgLight: ['#fafafa', '#f0f0f0'],
  bgDark: ['#1a1a1a', '#2d2d2d'],
};

// ========== 타이포그래피 ==========
export const typography = {
  // Font Family - React Native 기본 폰트
  fontFamily: {
    primary: 'System', // iOS: SF Pro, Android: Roboto
    mono: 'monospace',
  },

  // Font Sizes (React Native는 단위 없이 숫자)
  fontSize: {
    xs: 12,    // 0.75rem
    sm: 14,    // 0.875rem
    base: 16,  // 1rem
    lg: 18,    // 1.125rem
    xl: 20,    // 1.25rem
    '2xl': 24, // 1.5rem
    '3xl': 30, // 1.875rem
    '4xl': 36, // 2.25rem
  },

  // Font Weights (React Native 호환)
  fontWeight: {
    thin: '100' as const,
    light: '300' as const,
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },

  // Line Heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },
};

// ========== 간격 시스템 - 8pt Grid ==========
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
};

// ========== 반경 시스템 - Gas 앱 스타일 ==========
export const borderRadius = {
  none: 0,
  sm: 6,   // 0.375rem
  base: 8, // 0.5rem
  md: 12,  // 0.75rem
  lg: 16,  // 1rem
  xl: 20,  // 1.25rem
  '2xl': 24, // 1.5rem
  full: 9999,
};

// ========== 그림자 시스템 ==========
export const shadows = {
  // React Native Shadow Props
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 12,
  },

  // Brand Shadows
  primary: {
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  },
  primaryHover: {
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 10,
  },
  success: {
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  error: {
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
};

// ========== Z-Index 관리 ==========
export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
  toast: 80,
  maximum: 9999,
};

// ========== 애니메이션 & 트랜지션 ==========
export const animation = {
  // Duration (milliseconds)
  duration: {
    fast: 150,
    base: 200,
    slow: 300,
    slower: 500,
    slowest: 800,
  },

  // Easing
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    // React Native에서는 cubic-bezier 대신 Easing 모듈 사용
  },

  // Spring Animation Config (React Native Animated.spring)
  spring: {
    default: {
      tension: 100,
      friction: 8,
    },
    gentle: {
      tension: 80,
      friction: 10,
    },
    bouncy: {
      tension: 120,
      friction: 6,
    },
  },
};

// ========== 레이아웃 시스템 ==========
export const layout = {
  // Container Max Width (모바일 최적화)
  container: {
    maxWidth: 480,
    padding: spacing[4],
  },

  // Grid System
  grid: {
    cols2: '48%', // 2열 그리드 (간격 고려)
    cols3: '31%', // 3열 그리드
    cols4: '23%', // 4열 그리드
    gap: spacing[4],
  },

  // Safe Area (React Native에서는 react-native-safe-area-context 사용)
  safeArea: {
    paddingTop: 'env(safe-area-inset-top)',
    paddingBottom: 'env(safe-area-inset-bottom)',
    paddingLeft: 'env(safe-area-inset-left)',
    paddingRight: 'env(safe-area-inset-right)',
  },
};

// ========== 다크 테마 ==========
export const darkTheme = {
  colors: {
    // Background Colors
    bg: {
      primary: '#1a1a1a',
      secondary: '#2d2d2d',
      tertiary: '#404040',
    },
    
    // Text Colors
    text: {
      primary: '#ffffff',
      secondary: '#e5e5e5',
      tertiary: '#a3a3a3',
    },
    
    // Border Colors
    border: {
      primary: '#404040',
      secondary: '#525252',
    },
    
    // Component Overrides
    card: '#2d2d2d',
    input: '#404040',
  },

  // Gradient Overrides
  gradients: {
    bgLight: ['#2d2d2d', '#404040'],
  },
};

// ========== 통합 디자인 토큰 ==========
export const tokens = {
  colors,
  gradients,
  typography,
  spacing,
  borderRadius,
  shadows,
  zIndex,
  animation,
  layout,
  darkTheme,
} as const;

// 타입 정의
export type Colors = typeof colors;
export type Typography = typeof typography;
export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type Shadows = typeof shadows;
export type Tokens = typeof tokens;