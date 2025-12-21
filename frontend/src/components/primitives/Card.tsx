import React from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { tokens, animations, useThemedStyles } from '../../theme';

type CardElevation = 'none' | 'sm' | 'md' | 'lg';
type CardRadius = 'sm' | 'md' | 'lg' | 'xl';

interface CardProps {
  children: React.ReactNode;
  elevation?: CardElevation;
  radius?: CardRadius;
  onPress?: () => void;
  style?: ViewStyle;
  pressable?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedView = Animated.createAnimatedComponent(View);

export function Card({
  children,
  elevation = 'md',
  radius = 'lg',
  onPress,
  style,
  pressable = false,
}: CardProps) {
  const scale = useSharedValue(1);
  const styles = useThemedStyles(createStyles);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!pressable && !onPress) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(0.98, animations.spring.responsive);
  };

  const handlePressOut = () => {
    if (!pressable && !onPress) return;
    scale.value = withSpring(1, animations.spring.responsive);
  };

  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    }
  };

  const cardStyles = [
    styles.base,
    styles[`elevation_${elevation}` as keyof ReturnType<typeof createStyles>],
    styles[`radius_${radius}` as keyof ReturnType<typeof createStyles>],
    style,
  ];

  if (pressable || onPress) {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[cardStyles, animatedStyle]}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return <View style={cardStyles}>{children}</View>;
}

const createStyles = (theme: any, isDark: boolean) =>
  StyleSheet.create({
    base: {
      backgroundColor: theme.card,
      padding: tokens.spacing.lg,
      // Dark mode에서 border 추가로 구분감 강화
      ...(isDark && {
        borderWidth: 1,
        borderColor: theme.border,
      }),
    },
    // Elevation styles
    elevation_none: {
      shadowOpacity: 0,
      elevation: 0,
    },
    elevation_sm: {
      shadowColor: isDark ? '#ffffff' : tokens.shadows.sm.shadowColor,
      shadowOffset: tokens.shadows.sm.shadowOffset,
      shadowOpacity: isDark ? 0.05 : tokens.shadows.sm.shadowOpacity,
      shadowRadius: tokens.shadows.sm.shadowRadius,
      elevation: tokens.shadows.sm.elevation,
    },
    elevation_md: {
      shadowColor: isDark ? '#ffffff' : tokens.shadows.md.shadowColor,
      shadowOffset: tokens.shadows.md.shadowOffset,
      shadowOpacity: isDark ? 0.08 : tokens.shadows.md.shadowOpacity,
      shadowRadius: tokens.shadows.md.shadowRadius,
      elevation: tokens.shadows.md.elevation,
    },
    elevation_lg: {
      shadowColor: isDark ? '#ffffff' : tokens.shadows.lg.shadowColor,
      shadowOffset: tokens.shadows.lg.shadowOffset,
      shadowOpacity: isDark ? 0.1 : tokens.shadows.lg.shadowOpacity,
      shadowRadius: tokens.shadows.lg.shadowRadius,
      elevation: tokens.shadows.lg.elevation,
    },
    // Radius styles
    radius_sm: {
      borderRadius: tokens.borderRadius.sm,
    },
    radius_md: {
      borderRadius: tokens.borderRadius.md,
    },
    radius_lg: {
      borderRadius: tokens.borderRadius.lg,
    },
    radius_xl: {
      borderRadius: tokens.borderRadius.xl,
    },
  });
