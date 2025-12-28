/**
 * Responsive utility functions for Circly
 * Handles different screen sizes and device types
 */

import { Dimensions, Platform, PixelRatio } from 'react-native';

// Screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 14 Pro as reference)
const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

/**
 * Device size categories
 */
export const DeviceSize = {
  SMALL: 'SMALL', // iPhone SE, iPhone 8
  MEDIUM: 'MEDIUM', // iPhone 14 Pro
  LARGE: 'LARGE', // iPhone 14 Pro Max, Plus models
  TABLET: 'TABLET', // iPad
} as const;

/**
 * Screen breakpoints (width in dp)
 */
export const Breakpoints = {
  SMALL: 375, // iPhone SE, iPhone 8
  MEDIUM: 390, // iPhone 14, 13 Pro
  LARGE: 428, // iPhone 14 Pro Max, Plus
  TABLET: 768, // iPad
} as const;

/**
 * Get current device size category
 */
export const getDeviceSize = (): keyof typeof DeviceSize => {
  if (SCREEN_WIDTH >= Breakpoints.TABLET) {
    return DeviceSize.TABLET;
  } else if (SCREEN_WIDTH >= Breakpoints.LARGE) {
    return DeviceSize.LARGE;
  } else if (SCREEN_WIDTH >= Breakpoints.MEDIUM) {
    return DeviceSize.MEDIUM;
  } else {
    return DeviceSize.SMALL;
  }
};

/**
 * Check if device is small (iPhone SE, iPhone 8)
 */
export const isSmallDevice = (): boolean => {
  return SCREEN_WIDTH < Breakpoints.MEDIUM;
};

/**
 * Check if device is tablet
 */
export const isTablet = (): boolean => {
  return SCREEN_WIDTH >= Breakpoints.TABLET;
};

/**
 * Scale size based on screen width
 * Use sparingly - prefer fixed sizes from design tokens
 */
export const scaleWidth = (size: number): number => {
  return (SCREEN_WIDTH / BASE_WIDTH) * size;
};

/**
 * Scale size based on screen height
 * Use sparingly - prefer fixed sizes from design tokens
 */
export const scaleHeight = (size: number): number => {
  return (SCREEN_HEIGHT / BASE_HEIGHT) * size;
};

/**
 * Scale font size moderately (max 1.2x scaling)
 * Prevents text from becoming too large on bigger screens
 */
export const scaleFontSize = (size: number): number => {
  const scale = Math.min(SCREEN_WIDTH / BASE_WIDTH, 1.2);
  return Math.round(size * scale);
};

/**
 * Get responsive spacing based on device size
 * Returns smaller spacing on small devices
 */
export const getResponsiveSpacing = (base: number): number => {
  const deviceSize = getDeviceSize();

  switch (deviceSize) {
    case DeviceSize.SMALL:
      return Math.max(base * 0.85, 8); // Min 8pt
    case DeviceSize.TABLET:
      return base * 1.2;
    default:
      return base;
  }
};

/**
 * Get number of columns for grid layouts
 */
export const getGridColumns = (): number => {
  const deviceSize = getDeviceSize();

  switch (deviceSize) {
    case DeviceSize.SMALL:
      return 2; // 2x2 grid
    case DeviceSize.TABLET:
      return 3; // 3x2 or 3x3 grid
    default:
      return 2; // 2x2 grid
  }
};

/**
 * Get safe padding for content
 * Ensures minimum touch target and comfortable reading width
 */
export const getContentPadding = (): number => {
  const deviceSize = getDeviceSize();

  switch (deviceSize) {
    case DeviceSize.SMALL:
      return 16;
    case DeviceSize.TABLET:
      return 32;
    default:
      return 20;
  }
};

/**
 * Check if screen is in landscape orientation
 */
export const isLandscape = (): boolean => {
  return SCREEN_WIDTH > SCREEN_HEIGHT;
};

/**
 * Get pixel ratio for current device
 */
export const getPixelRatio = (): number => {
  return PixelRatio.get();
};

/**
 * Device info for debugging
 */
export const getDeviceInfo = () => {
  return {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    size: getDeviceSize(),
    isSmall: isSmallDevice(),
    isTablet: isTablet(),
    isLandscape: isLandscape(),
    pixelRatio: getPixelRatio(),
    platform: Platform.OS,
    platformVersion: Platform.Version,
  };
};

/**
 * Common device dimensions for testing
 */
export const TestDevices = {
  'iPhone SE': { width: 375, height: 667, scale: 2 },
  'iPhone 8': { width: 375, height: 667, scale: 2 },
  'iPhone 13': { width: 390, height: 844, scale: 3 },
  'iPhone 14 Pro': { width: 393, height: 852, scale: 3 },
  'iPhone 14 Pro Max': { width: 430, height: 932, scale: 3 },
  'iPad Air': { width: 820, height: 1180, scale: 2 },
  'iPad Pro 11"': { width: 834, height: 1194, scale: 2 },
  'iPad Pro 12.9"': { width: 1024, height: 1366, scale: 2 },
} as const;

/**
 * Get responsive value based on screen size
 * Example: getResponsiveValue({ small: 12, medium: 14, large: 16, tablet: 18 })
 */
export const getResponsiveValue = <T>(values: {
  SMALL?: T;
  MEDIUM?: T;
  LARGE?: T;
  TABLET?: T;
  default: T;
}): T => {
  const deviceSize = getDeviceSize();

  switch (deviceSize) {
    case DeviceSize.SMALL:
      return values.SMALL ?? values.default;
    case DeviceSize.MEDIUM:
      return values.MEDIUM ?? values.default;
    case DeviceSize.LARGE:
      return values.LARGE ?? values.default;
    case DeviceSize.TABLET:
      return values.TABLET ?? values.default;
    default:
      return values.default;
  }
};

/**
 * Screen dimensions (updated on orientation change)
 */
export const getScreenDimensions = () => {
  const { width, height } = Dimensions.get('window');
  return { width, height };
};

/**
 * Hook to listen to dimension changes
 * Use this in components that need to re-render on orientation change
 */
export const useDimensions = () => {
  // Note: This should be used with React hooks in actual component
  // For now, returning static values
  return {
    window: Dimensions.get('window'),
    screen: Dimensions.get('screen'),
  };
};
