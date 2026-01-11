import React, { useState } from 'react';
import {
  TextInput,
  View,
  StyleSheet,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { tokens, animations, useThemedStyles, useTheme } from '../../theme';
import { Text } from './Text';
import type { Theme } from '../../theme/tokens';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Input({
  label,
  error,
  helperText,
  disabled = false,
  style,
  onFocus,
  onBlur,
  ...textInputProps
}: InputProps) {
  const { theme, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [isFocused, setIsFocused] = useState(false);

  // 테마에 맞는 기본 테두리 색상
  const defaultBorderColor = isDark ? theme.border : tokens.colors.neutral[300];
  const borderColor = useSharedValue<string>(defaultBorderColor);

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: borderColor.value as string,
  }));

  const handleFocus = (e: any) => {
    setIsFocused(true);
    borderColor.value = withTiming(
      error ? tokens.colors.error[500] : tokens.colors.primary[500],
      { duration: animations.duration.normal }
    );

    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    borderColor.value = withTiming(
      error ? tokens.colors.error[500] : defaultBorderColor,
      { duration: animations.duration.normal }
    );

    if (onBlur) onBlur(e);
  };

  const containerStyles = [styles.container, style];
  const inputStyles = [
    styles.input,
    disabled && styles.inputDisabled,
    error && styles.inputError,
  ];

  return (
    <View style={containerStyles}>
      {label && (
        <Text
          variant="sm"
          weight="medium"
          style={styles.label}
          color={error ? tokens.colors.error[600] : theme.textSecondary}
        >
          {label}
        </Text>
      )}

      <Animated.View style={[styles.inputWrapper, animatedBorderStyle]}>
        <TextInput
          {...textInputProps}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled}
          style={inputStyles}
          placeholderTextColor={theme.textTertiary}
        />
      </Animated.View>

      {(error || helperText) && (
        <View style={styles.messageContainer}>
          {error ? (
            <Text variant="xs" color={tokens.colors.error[600]} style={styles.message}>
              {error}
            </Text>
          ) : helperText ? (
            <Text variant="xs" color={theme.textTertiary} style={styles.message}>
              {helperText}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
    container: {
      width: '100%',
    },
    label: {
      marginBottom: tokens.spacing.xs,
    },
    inputWrapper: {
      borderWidth: 1.5,
      borderRadius: tokens.borderRadius.md,
      backgroundColor: isDark ? theme.backgroundSecondary : tokens.colors.white,
      overflow: 'hidden',
    },
    input: {
      height: tokens.touchTarget.md,
      paddingHorizontal: tokens.spacing.md,
      fontSize: tokens.typography.fontSize.base,
      fontFamily: tokens.typography.fontFamily.sans,
      color: theme.text,
    },
    inputDisabled: {
      backgroundColor: isDark ? theme.backgroundTertiary : tokens.colors.neutral[100],
      color: theme.textTertiary,
    },
    inputError: {
      borderColor: tokens.colors.error[500],
    },
    messageContainer: {
      marginTop: tokens.spacing.xs,
      minHeight: 16,
    },
    message: {
      lineHeight: 16,
    },
  });
