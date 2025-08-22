/**
 * Input Component - REAL Implementation
 * Based on International Student App Screenshots
 * 
 * ACTUAL working input with gray border, floating label animation, focus state with green border, error state with red border
 */

import React, { useRef, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Animated,
  Platform,
  TextInputProps,
} from 'react-native';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  disabled?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
  testID?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  disabled = false,
  style,
  inputStyle,
  labelStyle,
  errorStyle,
  testID,
  onFocus,
  onBlur,
  value = '',
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedLabel = useRef(new Animated.Value(value ? 1 : 0)).current;

  const handleFocus = (event: any) => {
    setIsFocused(true);
    Animated.spring(animatedLabel, {
      toValue: 1,
      useNativeDriver: false,
      tension: 200,
      friction: 10,
    }).start();
    onFocus?.(event);
  };

  const handleBlur = (event: any) => {
    setIsFocused(false);
    if (!value) {
      Animated.spring(animatedLabel, {
        toValue: 0,
        useNativeDriver: false,
        tension: 200,
        friction: 10,
      }).start();
    }
    onBlur?.(event);
  };

  // Update animation when value changes from outside
  React.useEffect(() => {
    if (value) {
      animatedLabel.setValue(1);
    }
  }, [value]);

  const getContainerStyle = (): ViewStyle => {
    const baseStyle = [styles.container];
    
    if (error) {
      baseStyle.push(styles.errorContainer);
    } else if (isFocused) {
      baseStyle.push(styles.focusedContainer);
    } else {
      baseStyle.push(styles.defaultContainer);
    }

    if (disabled) {
      baseStyle.push(styles.disabledContainer);
    }

    return StyleSheet.flatten(baseStyle);
  };

  const getInputStyle = (): TextStyle => {
    const baseStyle = [styles.input];
    
    if (disabled) {
      baseStyle.push(styles.disabledInput);
    }

    return StyleSheet.flatten(baseStyle);
  };

  const getLabelStyle = () => {
    return {
      position: 'absolute' as const,
      left: 16,
      top: animatedLabel.interpolate({
        inputRange: [0, 1],
        outputRange: [20, 8],
      }),
      fontSize: animatedLabel.interpolate({
        inputRange: [0, 1],
        outputRange: [16, 12],
      }),
      color: error 
        ? '#ef4444' 
        : isFocused 
          ? '#1d7452' // Harry School green 
          : '#6b7280',
      backgroundColor: '#ffffff',
      paddingHorizontal: 4,
      zIndex: 1,
    };
  };

  return (
    <View style={[styles.wrapper, style]}>
      <View style={getContainerStyle()}>
        <Animated.Text 
          style={[getLabelStyle(), labelStyle]}
          pointerEvents="none"
        >
          {label}
        </Animated.Text>
        
        <TextInput
          {...textInputProps}
          style={[getInputStyle(), inputStyle]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          value={value}
          editable={!disabled}
          testID={testID}
          accessibilityLabel={label}
          accessibilityHint={error ? `Error: ${error}` : undefined}
          placeholderTextColor="#9ca3af"
        />
      </View>
      
      {error && (
        <Text style={[styles.errorText, errorStyle]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 8,
  },
  
  container: {
    position: 'relative',
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 56,
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  
  // Container variants
  defaultContainer: {
    borderColor: '#e5e5e5', // Gray border
  },
  
  focusedContainer: {
    borderColor: '#1d7452', // Green border on focus (Harry School green)
    borderWidth: 2,
  },
  
  errorContainer: {
    borderColor: '#ef4444', // Red border on error
    borderWidth: 2,
  },
  
  disabledContainer: {
    backgroundColor: '#f9fafb',
    borderColor: '#d1d5db',
    opacity: 0.6,
  },
  
  input: {
    fontSize: 16,
    color: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 24, // Extra padding for floating label
    margin: 0,
    ...Platform.select({
      web: {
        outline: 'none',
      },
    }),
  },
  
  disabledInput: {
    color: '#9ca3af',
  },
  
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 16,
    fontWeight: '500',
  },
});

export default Input;