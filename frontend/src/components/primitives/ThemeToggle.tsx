/**
 * Theme Toggle Component
 *
 * 다크모드/라이트모드 전환 컴포넌트
 *
 * @example
 * ```tsx
 * // Simple toggle
 * <ThemeToggle />
 *
 * // With custom styling
 * <ThemeToggle variant="button" />
 *
 * // With system preference option
 * <ThemeToggle showSystemOption />
 * ```
 */

import React from 'react';
import { View, StyleSheet, Pressable, Switch } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';
import { tokens } from '../../theme';
import { Text } from './Text';
import * as Haptics from 'expo-haptics';

// ============================================================================
// Types
// ============================================================================

type ThemeToggleVariant = 'switch' | 'button' | 'card';

interface ThemeToggleProps {
  /** Visual variant (default: 'switch') */
  variant?: ThemeToggleVariant;

  /** Show system preference option (default: false) */
  showSystemOption?: boolean;

  /** Custom style */
  style?: object;
}

// ============================================================================
// Theme Toggle Component
// ============================================================================

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ThemeToggle({
  variant = 'switch',
  showSystemOption = false,
  style,
}: ThemeToggleProps) {
  const { mode, isDark, toggleTheme, followSystem, setFollowSystem } = useTheme();

  if (variant === 'switch') {
    return <SwitchVariant isDark={isDark} onToggle={toggleTheme} style={style} />;
  }

  if (variant === 'button') {
    return <ButtonVariant isDark={isDark} onToggle={toggleTheme} style={style} />;
  }

  if (variant === 'card') {
    return (
      <CardVariant
        mode={mode}
        isDark={isDark}
        followSystem={followSystem}
        onToggle={toggleTheme}
        onSetFollowSystem={setFollowSystem}
        showSystemOption={showSystemOption}
        style={style}
      />
    );
  }

  return null;
}

// ============================================================================
// Switch Variant
// ============================================================================

interface SwitchVariantProps {
  isDark: boolean;
  onToggle: () => void;
  style?: object;
}

function SwitchVariant({ isDark, onToggle, style }: SwitchVariantProps) {
  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  };

  return (
    <View style={[styles.switchContainer, style]}>
      <Text variant="sm" style={styles.switchLabel}>
        ☀️ 라이트
      </Text>
      <Switch
        value={isDark}
        onValueChange={handleToggle}
        trackColor={{
          false: tokens.colors.neutral[200],
          true: tokens.colors.primary[500],
        }}
        thumbColor={tokens.colors.white}
        ios_backgroundColor={tokens.colors.neutral[200]}
      />
      <Text variant="sm" style={styles.switchLabel}>
        🌙 다크
      </Text>
    </View>
  );
}

// ============================================================================
// Button Variant
// ============================================================================

interface ButtonVariantProps {
  isDark: boolean;
  onToggle: () => void;
  style?: object;
}

function ButtonVariant({ isDark, onToggle, style }: ButtonVariantProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggle();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.button, animatedStyle, style]}
    >
      <Text variant="2xl">{isDark ? '🌙' : '☀️'}</Text>
    </AnimatedPressable>
  );
}

// ============================================================================
// Card Variant
// ============================================================================

interface CardVariantProps {
  mode: 'light' | 'dark';
  isDark: boolean;
  followSystem: boolean;
  onToggle: () => void;
  onSetFollowSystem: (follow: boolean) => void;
  showSystemOption: boolean;
  style?: object;
}

function CardVariant({
  mode,
  isDark,
  followSystem,
  onToggle,
  onSetFollowSystem,
  showSystemOption,
  style,
}: CardVariantProps) {
  const handleModeSelect = (newMode: 'light' | 'dark') => {
    if (newMode !== mode) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onToggle();
    }
  };

  const handleSystemToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSetFollowSystem(!followSystem);
  };

  return (
    <View style={[styles.card, style]}>
      {/* Header */}
      <Text variant="lg" weight="semibold" style={styles.cardTitle}>
        테마 설정
      </Text>

      {/* Mode Options */}
      <View style={styles.modeOptions}>
        <ModeOption
          icon="☀️"
          label="라이트"
          isSelected={mode === 'light' && !followSystem}
          onPress={() => handleModeSelect('light')}
        />
        <ModeOption
          icon="🌙"
          label="다크"
          isSelected={mode === 'dark' && !followSystem}
          onPress={() => handleModeSelect('dark')}
        />
      </View>

      {/* System Option */}
      {showSystemOption && (
        <>
          <View style={styles.divider} />
          <Pressable
            onPress={handleSystemToggle}
            style={styles.systemOption}
          >
            <View style={styles.systemOptionLeft}>
              <Text variant="base">⚙️</Text>
              <Text variant="base" style={styles.systemOptionLabel}>
                시스템 설정 따르기
              </Text>
            </View>
            <Switch
              value={followSystem}
              onValueChange={handleSystemToggle}
              trackColor={{
                false: tokens.colors.neutral[200],
                true: tokens.colors.primary[500],
              }}
              thumbColor={tokens.colors.white}
              ios_backgroundColor={tokens.colors.neutral[200]}
            />
          </Pressable>
        </>
      )}
    </View>
  );
}

// ============================================================================
// Mode Option Component
// ============================================================================

interface ModeOptionProps {
  icon: string;
  label: string;
  isSelected: boolean;
  onPress: () => void;
}

function ModeOption({ icon, label, isSelected, onPress }: ModeOptionProps) {
  const scale = useSharedValue(1);
  const borderWidth = useSharedValue(isSelected ? 2 : 1);

  React.useEffect(() => {
    borderWidth.value = withTiming(isSelected ? 2 : 1, { duration: 200 });
  }, [isSelected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderWidth: borderWidth.value,
    borderColor: isSelected
      ? tokens.colors.primary[500]
      : tokens.colors.neutral[200],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.modeOption, animatedStyle]}
    >
      <Text variant="3xl">{icon}</Text>
      <Text
        variant="sm"
        weight={isSelected ? 'semibold' : 'normal'}
        style={{
          color: isSelected
            ? tokens.colors.primary[600]
            : tokens.colors.neutral[600],
        }}
      >
        {label}
      </Text>
      {isSelected && (
        <View style={styles.selectedIndicator}>
          <View style={styles.checkmark} />
        </View>
      )}
    </AnimatedPressable>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  // Switch Variant
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  switchLabel: {
    color: tokens.colors.neutral[600],
  },

  // Button Variant
  button: {
    width: 48,
    height: 48,
    borderRadius: tokens.borderRadius.full,
    backgroundColor: tokens.colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    ...tokens.shadows.sm,
  },

  // Card Variant
  card: {
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.borderRadius.xl,
    padding: tokens.spacing.lg,
    ...tokens.shadows.md,
  },
  cardTitle: {
    marginBottom: tokens.spacing.md,
  },
  modeOptions: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
  },
  modeOption: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing.xs,
    position: 'relative',
  },
  selectedIndicator: {
    position: 'absolute',
    top: tokens.spacing.xs,
    right: tokens.spacing.xs,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: tokens.colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    width: 8,
    height: 5,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: tokens.colors.white,
    transform: [{ rotate: '-45deg' }, { translateY: -1 }],
  },
  divider: {
    height: 1,
    backgroundColor: tokens.colors.neutral[200],
    marginVertical: tokens.spacing.md,
  },
  systemOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  systemOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  systemOptionLabel: {
    color: tokens.colors.neutral[700],
  },
});
