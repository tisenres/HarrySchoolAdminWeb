/**
 * Button Component - REAL Implementation
 * Based on International Student App Screenshots
 * 
 * ACTUAL working button with green background, white text, rounded corners, and scale animation
 */

import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  GestureResponderEvent,
  Animated,
  Platform,
} from 'react-native';

export interface ButtonProps {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'gold';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  testID,
}) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePress = (event: GestureResponderEvent) => {
    if (!disabled && !loading) {
      onPress(event);
    }
  };

  const getButtonStyle = (): ViewStyle => {
    const baseStyle = [styles.button, styles[size]];
    
    switch (variant) {
      case 'primary':
        baseStyle.push(styles.primaryButton);
        break;
      case 'secondary':
        baseStyle.push(styles.secondaryButton);
        break;
      case 'ghost':
        baseStyle.push(styles.ghostButton);
        break;
      case 'gold':
        baseStyle.push(styles.goldButton);
        break;
    }

    if (disabled) {
      baseStyle.push(styles.disabled);
    }

    return StyleSheet.flatten(baseStyle);
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle = [styles.text, styles[`${size}Text`]];
    
    switch (variant) {
      case 'primary':
        baseStyle.push(styles.primaryText);
        break;
      case 'secondary':
        baseStyle.push(styles.secondaryText);
        break;
      case 'ghost':
        baseStyle.push(styles.ghostText);
        break;
      case 'gold':
        baseStyle.push(styles.goldText);
        break;
    }

    if (disabled) {
      baseStyle.push(styles.disabledText);
    }

    return StyleSheet.flatten(baseStyle);
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity
        style={[getButtonStyle(), style]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityHint={disabled ? 'Button is disabled' : 'Double tap to activate'}
      >
        <Text style={[getTextStyle(), textStyle]}>
          {loading ? 'Loading...' : title}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // Base button styles
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  // Size variants
  small: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
  },
  medium: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    minHeight: 48,
  },
  large: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    minHeight: 56,
  },

  // Button variants
  primaryButton: {
    backgroundColor: '#1d7452', // Harry School Green from screenshots
  },
  secondaryButton: {
    backgroundColor: '#2d2d2d', // Dark card background from screenshots
    borderWidth: 1,
    borderColor: '#4a4a4a',
  },
  ghostButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#1d7452',
  },
  goldButton: {
    backgroundColor: '#fbbf24', // Gold from screenshots
  },

  // Text base styles
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  smallText: {
    fontSize: 14,
    lineHeight: 20,
  },
  mediumText: {
    fontSize: 16,
    lineHeight: 24,
  },
  largeText: {
    fontSize: 18,
    lineHeight: 28,
  },

  // Text variants
  primaryText: {
    color: '#ffffff',
  },
  secondaryText: {
    color: '#ffffff',
  },
  ghostText: {
    color: '#1d7452',
  },
  goldText: {
    color: '#1a1a1a', // Dark text on gold background
  },

  // Disabled states
  disabled: {
    backgroundColor: '#4a4a4a',
    opacity: 0.5,
  },
  disabledText: {
    color: '#a0a0a0',
  },
});

export default Button;