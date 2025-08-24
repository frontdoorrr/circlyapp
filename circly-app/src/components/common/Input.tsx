import React from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../styles/tokens';

export type InputVariant = 'default' | 'filled' | 'outlined';
export type InputSize = 'small' | 'medium' | 'large';
export type InputState = 'default' | 'error' | 'success' | 'disabled';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  success?: string;
  helperText?: string;
  variant?: InputVariant;
  size?: InputSize;
  state?: InputState;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  messageStyle?: TextStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  success,
  helperText,
  variant = 'default',
  size = 'medium',
  state = 'default',
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  labelStyle,
  messageStyle,
  ...textInputProps
}) => {
  const currentState = error ? 'error' : success ? 'success' : state;
  const message = error || success || helperText;

  const inputContainerStyle = [
    styles.inputContainer,
    styles[variant],
    styles[size],
    styles[currentState],
  ];

  const textInputStyle = [
    styles.input,
    styles[`${size}Input` as keyof typeof styles],
    leftIcon && styles.inputWithLeftIcon,
    rightIcon && styles.inputWithRightIcon,
    inputStyle,
  ];

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, labelStyle]}>
          {label}
        </Text>
      )}
      
      <View style={inputContainerStyle}>
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={getIconSize(size)}
            color={getIconColor(currentState)}
            style={styles.leftIcon}
          />
        )}
        
        <TextInput
          style={textInputStyle}
          placeholderTextColor={tokens.colors.gray[400]}
          editable={currentState !== 'disabled'}
          {...textInputProps}
        />
        
        {rightIcon && (
          <Ionicons
            name={rightIcon}
            size={getIconSize(size)}
            color={getIconColor(currentState)}
            style={styles.rightIcon}
            onPress={onRightIconPress}
          />
        )}
      </View>
      
      {message && (
        <Text style={[
          styles.message, 
          styles[`${currentState}Message` as keyof typeof styles],
          messageStyle
        ]}>
          {message}
        </Text>
      )}
    </View>
  );
};

const getIconSize = (size: InputSize): number => {
  switch (size) {
    case 'small': return 16;
    case 'medium': return 18;
    case 'large': return 20;
  }
};

const getIconColor = (state: InputState): string => {
  switch (state) {
    case 'error': return tokens.colors.error[500];
    case 'success': return tokens.colors.success[500];
    case 'disabled': return tokens.colors.gray[300];
    default: return tokens.colors.gray[400];
  }
};

const styles = StyleSheet.create({
  container: {
    marginBottom: tokens.spacing[4],
  },

  // Label
  label: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    fontFamily: tokens.typography.fontFamily.primary,
    color: tokens.colors.gray[700],
    marginBottom: tokens.spacing[2],
  },

  // Input Container
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: tokens.borderRadius.lg,
    backgroundColor: tokens.colors.white,
    overflow: 'hidden',
  },

  // Variants
  default: {
    borderColor: tokens.colors.gray[200],
  },
  filled: {
    backgroundColor: tokens.colors.gray[50],
    borderColor: tokens.colors.transparent,
  },
  outlined: {
    backgroundColor: tokens.colors.transparent,
    borderColor: tokens.colors.gray[300],
  },

  // Sizes
  small: {
    minHeight: 40,
    paddingHorizontal: tokens.spacing[3],
  },
  medium: {
    minHeight: 48,
    paddingHorizontal: tokens.spacing[4],
  },
  large: {
    minHeight: 56,
    paddingHorizontal: tokens.spacing[5],
  },

  // States
  error: {
    borderColor: tokens.colors.error[500],
  },
  success: {
    borderColor: tokens.colors.success[500],
  },
  disabled: {
    backgroundColor: tokens.colors.gray[100],
    borderColor: tokens.colors.gray[200],
    opacity: 0.6,
  },

  // Input Field
  input: {
    flex: 1,
    fontFamily: tokens.typography.fontFamily.primary,
    color: tokens.colors.gray[900],
    paddingVertical: tokens.spacing[3],
  },

  // Input Sizes
  smallInput: {
    fontSize: tokens.typography.fontSize.sm,
  },
  mediumInput: {
    fontSize: tokens.typography.fontSize.base,
  },
  largeInput: {
    fontSize: tokens.typography.fontSize.lg,
  },

  // Input with Icons
  inputWithLeftIcon: {
    paddingLeft: 0,
  },
  inputWithRightIcon: {
    paddingRight: 0,
  },

  // Icons
  leftIcon: {
    marginRight: tokens.spacing[3],
  },
  rightIcon: {
    marginLeft: tokens.spacing[3],
  },

  // Messages
  message: {
    fontSize: tokens.typography.fontSize.sm,
    fontFamily: tokens.typography.fontFamily.primary,
    marginTop: tokens.spacing[1],
    fontWeight: tokens.typography.fontWeight.medium,
  },

  // Message States
  defaultMessage: {
    color: tokens.colors.gray[600],
  },
  errorMessage: {
    color: tokens.colors.error[500],
  },
  successMessage: {
    color: tokens.colors.success[500],
  },
  disabledMessage: {
    color: tokens.colors.gray[400],
  },
});

// 기존 호환성을 위한 default export
export default Input;