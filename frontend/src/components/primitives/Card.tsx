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
import { tokens, animations } from '../../theme';

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
    styles[`elevation_${elevation}`],
    styles[`radius_${radius}`],
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

const styles = StyleSheet.create({
  base: {
    backgroundColor: tokens.colors.white,
    padding: tokens.spacing.lg,
  },
  // Elevation styles
  elevation_none: {
    shadowOpacity: 0,
    elevation: 0,
  },
  elevation_sm: {
    shadowColor: tokens.shadows.sm.shadowColor,
    shadowOffset: tokens.shadows.sm.shadowOffset,
    shadowOpacity: tokens.shadows.sm.shadowOpacity,
    shadowRadius: tokens.shadows.sm.shadowRadius,
    elevation: tokens.shadows.sm.elevation,
  },
  elevation_md: {
    shadowColor: tokens.shadows.md.shadowColor,
    shadowOffset: tokens.shadows.md.shadowOffset,
    shadowOpacity: tokens.shadows.md.shadowOpacity,
    shadowRadius: tokens.shadows.md.shadowRadius,
    elevation: tokens.shadows.md.elevation,
  },
  elevation_lg: {
    shadowColor: tokens.shadows.lg.shadowColor,
    shadowOffset: tokens.shadows.lg.shadowOffset,
    shadowOpacity: tokens.shadows.lg.shadowOpacity,
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
