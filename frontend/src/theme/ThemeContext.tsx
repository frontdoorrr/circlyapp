/**
 * Theme Context
 *
 * 다크모드 지원을 위한 테마 컨텍스트
 *
 * @example
 * ```tsx
 * import { ThemeProvider, useTheme } from '@/theme/ThemeContext';
 *
 * // App root
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 *
 * // In component
 * const { theme, isDark, toggleTheme } = useTheme();
 * ```
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme, ThemeMode, Theme } from './tokens';

// ============================================================================
// Types
// ============================================================================

interface ThemeContextType {
  /** Current theme object */
  theme: Theme;

  /** Current theme mode ('light' | 'dark') */
  mode: ThemeMode;

  /** Whether dark mode is active */
  isDark: boolean;

  /** Toggle between light and dark mode */
  toggleTheme: () => void;

  /** Set theme mode explicitly */
  setThemeMode: (mode: ThemeMode) => void;

  /** Whether to follow system theme */
  followSystem: boolean;

  /** Set whether to follow system theme */
  setFollowSystem: (follow: boolean) => void;
}

// ============================================================================
// Context
// ============================================================================

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@circly/theme_mode';
const FOLLOW_SYSTEM_KEY = '@circly/follow_system';

// ============================================================================
// Provider
// ============================================================================

interface ThemeProviderProps {
  children: ReactNode;
  /** Initial theme mode (default: 'light') */
  initialMode?: ThemeMode;
  /** Whether to follow system theme by default (default: true) */
  initialFollowSystem?: boolean;
}

export function ThemeProvider({
  children,
  initialMode = 'light',
  initialFollowSystem = true,
}: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(initialMode);
  const [followSystem, setFollowSystemState] = useState(initialFollowSystem);
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preferences from AsyncStorage
  useEffect(() => {
    loadThemePreferences();
  }, []);

  // Follow system theme if enabled
  useEffect(() => {
    if (followSystem && systemColorScheme) {
      setMode(systemColorScheme === 'dark' ? 'dark' : 'light');
    }
  }, [systemColorScheme, followSystem]);

  const loadThemePreferences = async () => {
    try {
      const [savedMode, savedFollowSystem] = await Promise.all([
        AsyncStorage.getItem(THEME_STORAGE_KEY),
        AsyncStorage.getItem(FOLLOW_SYSTEM_KEY),
      ]);

      if (savedFollowSystem !== null) {
        const shouldFollow = savedFollowSystem === 'true';
        setFollowSystemState(shouldFollow);

        if (shouldFollow && systemColorScheme) {
          setMode(systemColorScheme === 'dark' ? 'dark' : 'light');
        } else if (savedMode) {
          setMode(savedMode as ThemeMode);
        }
      } else if (savedMode) {
        setMode(savedMode as ThemeMode);
      }
    } catch (error) {
      console.error('Failed to load theme preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveThemeMode = async (newMode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
    } catch (error) {
      console.error('Failed to save theme mode:', error);
    }
  };

  const saveFollowSystem = async (follow: boolean) => {
    try {
      await AsyncStorage.setItem(FOLLOW_SYSTEM_KEY, follow.toString());
    } catch (error) {
      console.error('Failed to save follow system preference:', error);
    }
  };

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    setFollowSystemState(false);
    saveThemeMode(newMode);
    saveFollowSystem(false);
  };

  const setThemeMode = (newMode: ThemeMode) => {
    setMode(newMode);
    setFollowSystemState(false);
    saveThemeMode(newMode);
    saveFollowSystem(false);
  };

  const setFollowSystem = (follow: boolean) => {
    setFollowSystemState(follow);
    saveFollowSystem(follow);

    if (follow && systemColorScheme) {
      const newMode = systemColorScheme === 'dark' ? 'dark' : 'light';
      setMode(newMode);
      saveThemeMode(newMode);
    }
  };

  const theme: Theme = mode === 'dark' ? darkTheme : lightTheme;
  const isDark = mode === 'dark';

  const value: ThemeContextType = {
    theme,
    mode,
    isDark,
    toggleTheme,
    setThemeMode,
    followSystem,
    setFollowSystem,
  };

  // Don't render children until theme is loaded
  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

/**
 * useTheme Hook
 *
 * Access current theme and theme controls
 *
 * @example
 * ```tsx
 * const { theme, isDark, toggleTheme } = useTheme();
 *
 * <View style={{ backgroundColor: theme.background }}>
 *   <Text style={{ color: theme.text }}>Hello</Text>
 *   <Button onPress={toggleTheme}>Toggle Theme</Button>
 * </View>
 * ```
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}

// ============================================================================
// Helper Hooks
// ============================================================================

/**
 * useThemedStyles Hook
 *
 * Create theme-aware styles
 *
 * @example
 * ```tsx
 * const styles = useThemedStyles((theme) => ({
 *   container: {
 *     backgroundColor: theme.background,
 *   },
 *   text: {
 *     color: theme.text,
 *   },
 * }));
 * ```
 */
export function useThemedStyles<T>(
  stylesFn: (theme: Theme, isDark: boolean) => T
): T {
  const { theme, isDark } = useTheme();
  return React.useMemo(() => stylesFn(theme, isDark), [theme, isDark, stylesFn]);
}

/**
 * useThemeColor Hook
 *
 * Get color based on current theme
 *
 * @example
 * ```tsx
 * const backgroundColor = useThemeColor(
 *   lightTheme.background,
 *   darkTheme.background
 * );
 * ```
 */
export function useThemeColor(
  lightColor: string,
  darkColor: string
): string {
  const { isDark } = useTheme();
  return isDark ? darkColor : lightColor;
}
