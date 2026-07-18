import React, { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Platform,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { BlurView, type BlurTint } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';

import { useTheme } from '../../theme/ThemeContext';

type GlassVariant = 'clear' | 'regular' | 'thick';

interface GlassSurfaceProps {
  children?: React.ReactNode;
  variant?: GlassVariant;
  interactive?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  tintColor?: string;
  accessibilityLabel?: string;
}

const blurIntensity: Record<GlassVariant, number> = {
  clear: 24,
  regular: 48,
  thick: 72,
};

export function GlassSurface({
  children,
  variant = 'regular',
  interactive = false,
  style,
  contentStyle,
  tintColor,
  accessibilityLabel,
}: GlassSurfaceProps) {
  const { isDark } = useTheme();
  const [reduceTransparency, setReduceTransparency] = useState<boolean | null>(null);

  useEffect(() => {
    AccessibilityInfo.isReduceTransparencyEnabled()
      .then(setReduceTransparency)
      .catch(() => setReduceTransparency(true));
    const subscription = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      setReduceTransparency
    );

    return () => subscription.remove();
  }, []);

  const fallbackColor = isDark
    ? 'rgba(27, 20, 42, 0.96)'
    : 'rgba(255, 255, 255, 0.96)';
  const washColor = isDark
    ? variant === 'clear' ? 'rgba(31, 23, 48, 0.22)' : 'rgba(31, 23, 48, 0.36)'
    : variant === 'clear' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.28)';
  const canUseLiquidGlass = Platform.OS === 'ios' && isLiquidGlassAvailable();
  const blurTint: BlurTint = isDark
    ? 'systemMaterialDark'
    : variant === 'thick' ? 'systemThickMaterialLight' : 'systemMaterialLight';

  const content = (
    <>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: washColor }]}
      />
      <View style={contentStyle}>{children}</View>
    </>
  );

  if (reduceTransparency !== false) {
    return (
      <View
        style={[styles.container, { backgroundColor: fallbackColor }, style]}
        accessibilityLabel={accessibilityLabel}
      >
        <View style={contentStyle}>{children}</View>
      </View>
    );
  }

  if (canUseLiquidGlass) {
    return (
      <GlassView
        glassEffectStyle={variant === 'clear' ? 'clear' : 'regular'}
        isInteractive={interactive}
        colorScheme={isDark ? 'dark' : 'light'}
        tintColor={tintColor}
        style={[styles.container, style]}
        accessibilityLabel={accessibilityLabel}
      >
        {content}
      </GlassView>
    );
  }

  return (
    <BlurView
      tint={blurTint}
      intensity={blurIntensity[variant]}
      experimentalBlurMethod="none"
      style={[styles.container, style]}
      accessibilityLabel={accessibilityLabel}
    >
      {content}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
