import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  length?: 'small' | 'medium' | 'large' | 'full';
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  length = 'large'
}: ButtonProps) {
  const getButtonStyle = () => {
    const baseStyle: ViewStyle[] = [styles.button, styles[size]];
    
    switch (variant) {
      case 'primary':
        baseStyle.push(styles.primaryButton);
        break;
      case 'secondary':
        baseStyle.push(styles.secondaryButton);
        break;
      case 'outline':
        baseStyle.push(styles.outlineButton);
        break;
      case 'danger':
        baseStyle.push(styles.dangerButton);
        break;
    }

    switch (length) {
    case 'full':
        baseStyle.push({ width: '100%' });
        break;
    case 'medium':
        baseStyle.push({ width: 300 });
        break;
    case 'small':
        baseStyle.push({ width: 100 });
        break;
    case 'large':
    default:
        break;
    }
    
    if (disabled) {
      baseStyle.push(styles.disabledButton);
    }
    
    if (style) {
      baseStyle.push(style);
    }
    
    return baseStyle;
  };

  const getTextStyle = () => {
    const baseTextStyle: TextStyle[] = [styles.buttonText, styles[`${size}Text` as keyof typeof styles] as TextStyle];
    
    switch (variant) {
      case 'primary':
        baseTextStyle.push(styles.primaryButtonText);
        break;
      case 'secondary':
        baseTextStyle.push(styles.secondaryButtonText);
        break;
      case 'outline':
        baseTextStyle.push(styles.outlineButtonText);
        break;
      case 'danger':
        baseTextStyle.push(styles.dangerButtonText);
        break;
    }
    
    if (disabled) {
      baseTextStyle.push(styles.disabledButtonText);
    }
    
    if (textStyle) {
      baseTextStyle.push(textStyle);
    }
    
    return baseTextStyle;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? 'white' : '#007AFF'}
          size="small"
        />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  
  // Size variants
  small: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 32,
  },
  medium: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
  },
  large: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    minHeight: 52,
  },
  
  // Button variants
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#F2F2F7',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  disabledButton: {
    backgroundColor: '#E5E5EA',
    borderColor: '#E5E5EA',
  },
  
  // Text styles
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  
  // Text color variants
  primaryButtonText: {
    color: 'white',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
  outlineButtonText: {
    color: '#007AFF',
  },
  dangerButtonText: {
    color: 'white',
  },
  disabledButtonText: {
    color: '#8E8E93',
  },
});