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
import { tokens, animations } from '../../theme';
import { Text } from './Text';

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
  const [isFocused, setIsFocused] = useState(false);
  const borderColor = useSharedValue<string>(tokens.colors.neutral[300]);
  const labelScale = useSharedValue(1);
  const labelY = useSharedValue(0);

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
      error ? tokens.colors.error[500] : tokens.colors.neutral[300],
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
          color={error ? tokens.colors.error[600] : tokens.colors.neutral[700]}
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
          placeholderTextColor={tokens.colors.neutral[400]}
        />
      </Animated.View>

      {(error || helperText) && (
        <View style={styles.messageContainer}>
          {error ? (
            <Text variant="xs" color={tokens.colors.error[600]} style={styles.message}>
              {error}
            </Text>
          ) : helperText ? (
            <Text variant="xs" color={tokens.colors.neutral[500]} style={styles.message}>
              {helperText}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: tokens.spacing.xs,
  },
  inputWrapper: {
    borderWidth: 1.5,
    borderRadius: tokens.borderRadius.md,
    backgroundColor: tokens.colors.white,
    overflow: 'hidden',
  },
  input: {
    height: tokens.touchTarget.md,
    paddingHorizontal: tokens.spacing.md,
    fontSize: tokens.typography.fontSize.base,
    fontFamily: tokens.typography.fontFamily.sans,
    color: tokens.colors.neutral[900],
  },
  inputDisabled: {
    backgroundColor: tokens.colors.neutral[100],
    color: tokens.colors.neutral[400],
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
