import React from 'react';
import {
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  AccessibilityRole,
  AccessibilityState,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { tokens, animations } from '../../theme';
import { Text } from './Text';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  // Accessibility props
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: AccessibilityState;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  accessibilityRole,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
}: ButtonProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    if (disabled || loading) return;

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Scale down animation
    scale.value = withSpring(0.96, animations.spring.responsive);
    opacity.value = withTiming(0.8, { duration: animations.duration.fast });
  };

  const handlePressOut = () => {
    if (disabled || loading) return;

    // Scale back animation
    scale.value = withSpring(1, animations.spring.responsive);
    opacity.value = withTiming(1, { duration: animations.duration.fast });
  };

  const handlePress = () => {
    if (disabled || loading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
    style,
  ];

  const textColor = getTextColor(variant, disabled || loading);

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[buttonStyles, animatedStyle]}
      accessibilityRole={accessibilityRole || 'button'}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={accessibilityState}
    >
      {loading ? (
        <ActivityIndicator
          color={textColor}
          size={size === 'sm' ? 'small' : 'small'}
        />
      ) : (
        <Text
          variant={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'base'}
          weight="semibold"
          style={{ color: textColor }}
        >
          {children}
        </Text>
      )}
    </AnimatedPressable>
  );
}

function getTextColor(variant: ButtonVariant, disabled: boolean): string {
  if (disabled) {
    return tokens.colors.neutral[400];
  }

  switch (variant) {
    case 'primary':
      return tokens.colors.white;
    case 'secondary':
      return tokens.colors.primary[600];
    case 'ghost':
      return tokens.colors.primary[600];
    default:
      return tokens.colors.white;
  }
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.borderRadius.lg,
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: tokens.colors.primary[500],
    shadowColor: tokens.colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  secondary: {
    backgroundColor: tokens.colors.primary[50],
    borderWidth: 1,
    borderColor: tokens.colors.primary[200],
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  size_sm: {
    height: tokens.touchTarget.sm,
    paddingHorizontal: tokens.spacing.md,
    minWidth: 80,
  },
  size_md: {
    height: tokens.touchTarget.md,
    paddingHorizontal: tokens.spacing.lg,
    minWidth: 120,
  },
  size_lg: {
    height: tokens.touchTarget.lg,
    paddingHorizontal: tokens.spacing.xl,
    minWidth: 160,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    backgroundColor: tokens.colors.neutral[200],
    shadowOpacity: 0,
    elevation: 0,
    borderColor: tokens.colors.neutral[300],
  },
});
