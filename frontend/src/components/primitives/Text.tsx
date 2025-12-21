import React from 'react';
import {
  Text as RNText,
  TextStyle,
  StyleSheet,
} from 'react-native';
import { tokens, useThemedStyles } from '../../theme';

type TextVariant = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold';
type TextAlign = 'left' | 'center' | 'right';

interface TextProps {
  children: React.ReactNode;
  variant?: TextVariant;
  weight?: TextWeight;
  align?: TextAlign;
  color?: string;
  style?: TextStyle;
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
}

export function Text({
  children,
  variant = 'base',
  weight = 'normal',
  align = 'left',
  color,
  style,
  numberOfLines,
  ellipsizeMode,
}: TextProps) {
  const styles = useThemedStyles(createStyles);

  const textStyles: (TextStyle | undefined | false)[] = [
    styles.base,
    styles[`variant_${variant}` as keyof ReturnType<typeof createStyles>],
    styles[`weight_${weight}` as keyof ReturnType<typeof createStyles>],
    styles[`align_${align}` as keyof ReturnType<typeof createStyles>],
    color && { color },
    style,
  ].filter((s): s is TextStyle => !!s);

  return (
    <RNText
      style={textStyles}
      numberOfLines={numberOfLines}
      ellipsizeMode={ellipsizeMode}
    >
      {children}
    </RNText>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    base: {
      fontFamily: tokens.typography.fontFamily.sans,
      color: theme.text,
    },
  // Variant styles
  variant_xs: {
    fontSize: tokens.typography.fontSize.xs,
    lineHeight: tokens.typography.lineHeight.xs,
  },
  variant_sm: {
    fontSize: tokens.typography.fontSize.sm,
    lineHeight: tokens.typography.lineHeight.sm,
  },
  variant_base: {
    fontSize: tokens.typography.fontSize.base,
    lineHeight: tokens.typography.lineHeight.base,
  },
  variant_lg: {
    fontSize: tokens.typography.fontSize.lg,
    lineHeight: tokens.typography.lineHeight.lg,
  },
  variant_xl: {
    fontSize: tokens.typography.fontSize.xl,
    lineHeight: tokens.typography.lineHeight.xl,
  },
  variant_2xl: {
    fontSize: tokens.typography.fontSize['2xl'],
    lineHeight: tokens.typography.lineHeight['2xl'],
  },
  variant_3xl: {
    fontSize: tokens.typography.fontSize['3xl'],
    lineHeight: tokens.typography.lineHeight['3xl'],
  },
  variant_4xl: {
    fontSize: tokens.typography.fontSize['4xl'],
    lineHeight: tokens.typography.lineHeight['4xl'],
  },
  // Weight styles
  weight_normal: {
    fontWeight: String(tokens.typography.fontWeight.normal) as TextStyle['fontWeight'],
  },
  weight_medium: {
    fontWeight: String(tokens.typography.fontWeight.medium) as TextStyle['fontWeight'],
  },
  weight_semibold: {
    fontWeight: String(tokens.typography.fontWeight.semibold) as TextStyle['fontWeight'],
  },
  weight_bold: {
    fontWeight: String(tokens.typography.fontWeight.bold) as TextStyle['fontWeight'],
  },
  // Align styles
  align_left: {
    textAlign: 'left',
  },
  align_center: {
    textAlign: 'center',
  },
  align_right: {
    textAlign: 'right',
  },
});
