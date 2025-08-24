import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../styles/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'right',
  style,
  textStyle,
  testID,
}) => {
  const buttonStyle = [
    styles.base,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    style,
  ];

  const textBaseStyle = [
    styles.textBase,
    styles[`${variant}Text` as keyof typeof styles],
    styles[`${size}Text` as keyof typeof styles],
    disabled && styles.disabledText,
    textStyle,
  ];

  const renderContent = () => {
    const iconSize = getIconSize(size);
    const iconColor = getIconColor(variant, disabled);

    return (
      <>
        {loading && (
          <ActivityIndicator
            size={size === 'large' ? 'small' : 'small'}
            color={iconColor}
            style={styles.loader}
          />
        )}
        
        {!loading && icon && iconPosition === 'left' && (
          <Ionicons
            name={icon}
            size={iconSize}
            color={iconColor}
            style={styles.iconLeft}
          />
        )}
        
        <Text style={textBaseStyle}>
          {loading ? 'Loading...' : title}
        </Text>
        
        {!loading && icon && iconPosition === 'right' && (
          <Ionicons
            name={icon}
            size={iconSize}
            color={iconColor}
            style={styles.iconRight}
          />
        )}
      </>
    );
  };

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        style={buttonStyle}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        testID={testID}
      >
        <LinearGradient
          colors={tokens.gradients.primary}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        {renderContent()}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      testID={testID}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const getIconSize = (size: ButtonSize): number => {
  switch (size) {
    case 'small': return 16;
    case 'medium': return 18;
    case 'large': return 20;
  }
};

const getIconColor = (variant: ButtonVariant, disabled: boolean): string => {
  if (disabled) {
    return tokens.colors.gray[400];
  }

  switch (variant) {
    case 'primary':
      return tokens.colors.white;
    case 'secondary':
      return tokens.colors.primary[500];
    case 'outline':
      return tokens.colors.primary[600];
    case 'ghost':
      return tokens.colors.gray[600];
    default:
      return tokens.colors.white;
  }
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.borderRadius.xl,
    borderWidth: 0,
    overflow: 'hidden',
  },

  // Variants
  primary: {
    ...tokens.shadows.primary,
  },
  secondary: {
    backgroundColor: tokens.colors.white,
    borderWidth: 2,
    borderColor: tokens.colors.gray[200],
  },
  outline: {
    backgroundColor: tokens.colors.transparent,
    borderWidth: 2,
    borderColor: tokens.colors.primary[500],
  },
  ghost: {
    backgroundColor: tokens.colors.transparent,
  },

  // Sizes
  small: {
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: tokens.spacing[2],
    borderRadius: tokens.borderRadius.lg,
  },
  medium: {
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[3],
  },
  large: {
    paddingHorizontal: tokens.spacing[6],
    paddingVertical: tokens.spacing[4],
  },

  // States
  disabled: {
    opacity: 0.5,
  },

  // Text Base
  textBase: {
    fontFamily: tokens.typography.fontFamily.primary,
    textAlign: 'center',
    fontWeight: tokens.typography.fontWeight.semibold,
  },

  // Text Variants
  primaryText: {
    color: tokens.colors.white,
  },
  secondaryText: {
    color: tokens.colors.primary[500],
  },
  outlineText: {
    color: tokens.colors.primary[600],
  },
  ghostText: {
    color: tokens.colors.gray[600],
  },

  // Text Sizes
  smallText: {
    fontSize: tokens.typography.fontSize.sm,
  },
  mediumText: {
    fontSize: tokens.typography.fontSize.base,
  },
  largeText: {
    fontSize: tokens.typography.fontSize.lg,
  },

  disabledText: {
    color: tokens.colors.gray[400],
  },

  // Icons
  loader: {
    marginRight: tokens.spacing[2],
  },
  iconLeft: {
    marginRight: tokens.spacing[2],
  },
  iconRight: {
    marginLeft: tokens.spacing[2],
  },
});

// 기존 호환성을 위한 default export
export default Button;