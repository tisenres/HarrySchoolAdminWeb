/**
 * Input Component
 * Harry School Mobile Design System
 * 
 * Premium input component with 4 variants, floating labels, validation, and accessibility
 * Optimized for educational forms and data entry
 */

import React, { forwardRef, useMemo, useCallback, useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeProvider';
import type { 
  InputProps, 
  InputColors, 
  InputDimensions, 
  InputValidationState,
  ValidationRule 
} from './Input.types';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);
const AnimatedView = Animated.createAnimatedComponent(View);

export const Input = forwardRef<TextInput, InputProps>(({
  variant = 'default',
  type = 'text',
  label,
  floatingLabel = true,
  required = false,
  helperText,
  showCharacterCount = false,
  leadingIcon,
  trailingIcon,
  onLeadingIconPress,
  onTrailingIconPress,
  showClearButton = true,
  showPasswordToggle = true,
  validationRules = [],
  validateOnChange = false,
  validateOnBlur = true,
  showValidationState = true,
  errorMessage,
  successMessage,
  onValidationChange,
  enableAnimations = true,
  enableErrorShake = true,
  enableSuccessPulse = true,
  fullWidth = true,
  numberOfLines = 1,
  minHeight,
  maxHeight,
  autoGrow = false,
  min,
  max,
  step = 1,
  showStepperButtons = false,
  suggestions = [],
  showSuggestions = false,
  onSearch,
  searchDebounce = 300,
  containerStyle,
  inputStyle,
  labelStyle,
  helperTextStyle,
  errorTextStyle,
  successTextStyle,
  placeholderTextColor,
  value = '',
  onChangeText,
  onFocus,
  onBlur,
  testID,
  accessibilityLabel,
  accessibilityHint,
  accessibilityInvalid,
  disableAnimations = false,
  ...textInputProps
}, ref) => {
  const { theme, variant: themeVariant } = useTheme();
  const internalRef = useRef<TextInput>(null);
  const inputRef = ref || internalRef;
  
  // Internal state
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [validationState, setValidationState] = useState<InputValidationState>({
    isValid: true,
    errors: [],
    touched: false,
    validatedOnce: false,
  });

  // Animation values
  const labelPosition = useSharedValue(0);
  const borderWidth = useSharedValue(1);
  const errorShake = useSharedValue(0);
  const successPulse = useSharedValue(1);
  const inputHeight = useSharedValue(0);

  // Get input configuration
  const inputConfig = useMemo(() => {
    return getInputConfig(variant, type, theme, themeVariant);
  }, [variant, type, theme, themeVariant]);

  // Validation logic
  const validateInput = useCallback((inputValue: string): InputValidationState => {
    if (validationRules.length === 0) {
      return { isValid: true, errors: [], touched: true, validatedOnce: true };
    }

    const errors: string[] = [];
    
    validationRules.forEach((rule) => {
      if (!rule.validate(inputValue)) {
        errors.push(rule.message);
      }
    });

    const isValid = errors.length === 0;
    
    return {
      isValid,
      errors,
      touched: true,
      validatedOnce: true,
    };
  }, [validationRules]);

  // Handle text changes
  const handleChangeText = useCallback((text: string) => {
    onChangeText?.(text);
    
    if (validateOnChange && validationRules.length > 0) {
      const newValidationState = validateInput(text);
      setValidationState(newValidationState);
      onValidationChange?.(newValidationState.isValid, newValidationState.errors);
    }

    // Handle search debouncing
    if (type === 'search' && onSearch) {
      const timeoutId = setTimeout(() => {
        onSearch(text);
      }, searchDebounce);
      
      return () => clearTimeout(timeoutId);
    }
  }, [onChangeText, validateOnChange, validationRules, validateInput, onValidationChange, type, onSearch, searchDebounce]);

  // Handle focus
  const handleFocus = useCallback((event: any) => {
    setIsFocused(true);
    
    if (!disableAnimations && enableAnimations) {
      // Animate label to focused position
      labelPosition.value = withSpring(1, { damping: 20, stiffness: 200 });
      borderWidth.value = withTiming(2, { duration: 200 });
    }
    
    onFocus?.(event);
  }, [disableAnimations, enableAnimations, labelPosition, borderWidth, onFocus]);

  // Handle blur
  const handleBlur = useCallback((event: any) => {
    setIsFocused(false);
    
    if (!disableAnimations && enableAnimations) {
      // Animate label based on content
      const shouldKeepLabelUp = value.length > 0;
      labelPosition.value = withSpring(shouldKeepLabelUp ? 1 : 0, { damping: 20, stiffness: 200 });
      borderWidth.value = withTiming(1, { duration: 200 });
    }
    
    // Validate on blur
    if (validateOnBlur && validationRules.length > 0) {
      const newValidationState = validateInput(value);
      setValidationState(newValidationState);
      onValidationChange?.(newValidationState.isValid, newValidationState.errors);
      
      // Trigger error animation
      if (!newValidationState.isValid && enableErrorShake && !disableAnimations) {
        errorShake.value = withSequence(
          withTiming(-5, { duration: 50 }),
          withTiming(5, { duration: 50 }),
          withTiming(-5, { duration: 50 }),
          withTiming(0, { duration: 50 })
        );
      }
    }
    
    onBlur?.(event);
  }, [
    disableAnimations,
    enableAnimations,
    value.length,
    validateOnBlur,
    validationRules,
    validateInput,
    onValidationChange,
    enableErrorShake,
    labelPosition,
    borderWidth,
    errorShake,
    onBlur
  ]);

  // Initialize label position based on value
  useEffect(() => {
    if (!disableAnimations && floatingLabel) {
      const hasValue = value.length > 0;
      labelPosition.value = hasValue ? 1 : 0;
    }
  }, [value.length, disableAnimations, floatingLabel, labelPosition]);

  // Success animation effect
  useEffect(() => {
    if (validationState.isValid && validationState.validatedOnce && enableSuccessPulse && !disableAnimations) {
      successPulse.value = withSequence(
        withSpring(1.05, { damping: 15, stiffness: 200 }),
        withSpring(1, { damping: 20, stiffness: 200 })
      );
    }
  }, [validationState.isValid, validationState.validatedOnce, enableSuccessPulse, disableAnimations, successPulse]);

  // Get current colors based on state
  const currentColors = useMemo(() => {
    if (textInputProps.editable === false) {
      return {
        background: inputConfig.colors.backgroundDisabled,
        border: inputConfig.colors.borderDisabled,
        text: inputConfig.colors.textDisabled,
        label: inputConfig.colors.textDisabled,
      };
    }

    if (!validationState.isValid && validationState.touched) {
      return {
        background: inputConfig.colors.background,
        border: inputConfig.colors.borderError,
        text: inputConfig.colors.text,
        label: inputConfig.colors.labelError,
      };
    }

    if (validationState.isValid && validationState.validatedOnce) {
      return {
        background: inputConfig.colors.background,
        border: inputConfig.colors.borderSuccess,
        text: inputConfig.colors.text,
        label: inputConfig.colors.labelFocused,
      };
    }

    if (isFocused) {
      return {
        background: inputConfig.colors.backgroundFocused || inputConfig.colors.background,
        border: inputConfig.colors.borderFocused,
        text: inputConfig.colors.text,
        label: inputConfig.colors.labelFocused,
      };
    }

    return {
      background: inputConfig.colors.background,
      border: inputConfig.colors.border,
      text: inputConfig.colors.text,
      label: inputConfig.colors.label,
    };
  }, [textInputProps.editable, validationState, isFocused, inputConfig.colors]);

  // Animated styles
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: errorShake.value },
      { scale: successPulse.value },
    ],
  }));

  const labelAnimatedStyle = useAnimatedStyle(() => {
    if (!floatingLabel) return {};
    
    const translateY = interpolate(
      labelPosition.value,
      [0, 1],
      [0, -24],
      Extrapolate.CLAMP
    );
    
    const scale = interpolate(
      labelPosition.value,
      [0, 1],
      [1, 0.85],
      Extrapolate.CLAMP
    );
    
    return {
      transform: [
        { translateY },
        { scale },
      ],
    };
  });

  const borderAnimatedStyle = useAnimatedStyle(() => ({
    borderWidth: borderWidth.value,
  }));

  // Handle clear button press
  const handleClear = useCallback(() => {
    handleChangeText('');
    inputRef.current?.focus();
  }, [handleChangeText, inputRef]);

  // Handle password toggle
  const handlePasswordToggle = useCallback(() => {
    setIsPasswordVisible(!isPasswordVisible);
  }, [isPasswordVisible]);

  // Render leading icon
  const renderLeadingIcon = () => {
    if (!leadingIcon) return null;
    
    return (
      <Pressable
        style={styles.iconContainer}
        onPress={onLeadingIconPress}
        accessibilityRole="button"
        accessibilityLabel="Leading icon"
      >
        {typeof leadingIcon === 'string' ? (
          <Text style={[styles.iconText, { color: inputConfig.colors.placeholder }]}>
            {leadingIcon}
          </Text>
        ) : (
          leadingIcon
        )}
      </Pressable>
    );
  };

  // Render trailing icon
  const renderTrailingIcon = () => {
    const hasTrailingIcon = trailingIcon;
    const hasClearButton = showClearButton && value.length > 0 && type !== 'password';
    const hasPasswordToggle = showPasswordToggle && type === 'password';
    
    if (!hasTrailingIcon && !hasClearButton && !hasPasswordToggle) return null;
    
    return (
      <View style={styles.trailingContainer}>
        {/* Clear button */}
        {hasClearButton && (
          <Pressable
            style={styles.iconContainer}
            onPress={handleClear}
            accessibilityRole="button"
            accessibilityLabel="Clear input"
          >
            <Text style={[styles.iconText, { color: inputConfig.colors.placeholder }]}>
              ×
            </Text>
          </Pressable>
        )}
        
        {/* Password toggle */}
        {hasPasswordToggle && (
          <Pressable
            style={styles.iconContainer}
            onPress={handlePasswordToggle}
            accessibilityRole="button"
            accessibilityLabel={isPasswordVisible ? "Hide password" : "Show password"}
          >
            <Text style={[styles.iconText, { color: inputConfig.colors.placeholder }]}>
              {isPasswordVisible ? '🙈' : '👁️'}
            </Text>
          </Pressable>
        )}
        
        {/* Custom trailing icon */}
        {hasTrailingIcon && (
          <Pressable
            style={styles.iconContainer}
            onPress={onTrailingIconPress}
            accessibilityRole="button"
            accessibilityLabel="Trailing icon"
          >
            {typeof trailingIcon === 'string' ? (
              <Text style={[styles.iconText, { color: inputConfig.colors.placeholder }]}>
                {trailingIcon}
              </Text>
            ) : (
              trailingIcon
            )}
          </Pressable>
        )}
      </View>
    );
  };

  // Render helper text
  const renderHelperText = () => {
    const hasError = !validationState.isValid && validationState.touched;
    const hasSuccess = validationState.isValid && validationState.validatedOnce && successMessage;
    const characterCount = showCharacterCount && textInputProps.maxLength;
    
    if (!helperText && !hasError && !hasSuccess && !characterCount) return null;
    
    return (
      <View style={styles.helperContainer}>
        <View style={styles.helperTextContainer}>
          {/* Error message */}
          {hasError && (
            <Text
              style={[
                styles.helperText,
                styles.errorText,
                { color: inputConfig.colors.errorText },
                errorTextStyle,
              ]}
              accessibilityLiveRegion="assertive"
            >
              {errorMessage || validationState.errors[0]}
            </Text>
          )}
          
          {/* Success message */}
          {hasSuccess && (
            <Text
              style={[
                styles.helperText,
                styles.successText,
                { color: inputConfig.colors.successText },
                successTextStyle,
              ]}
            >
              {successMessage}
            </Text>
          )}
          
          {/* Regular helper text */}
          {!hasError && !hasSuccess && helperText && (
            <Text
              style={[
                styles.helperText,
                { color: inputConfig.colors.helperText },
                helperTextStyle,
              ]}
            >
              {helperText}
            </Text>
          )}
        </View>
        
        {/* Character count */}
        {characterCount && (
          <Text
            style={[
              styles.characterCount,
              { color: inputConfig.colors.helperText },
            ]}
          >
            {value.length}/{textInputProps.maxLength}
          </Text>
        )}
      </View>
    );
  };

  // Container styles
  const containerStyle = [
    styles.container,
    fullWidth && styles.fullWidth,
    containerStyle,
  ];

  // Input container styles
  const inputContainerStyle = [
    styles.inputContainer,
    {
      height: inputConfig.dimensions.height,
      paddingHorizontal: inputConfig.dimensions.paddingHorizontal,
      backgroundColor: currentColors.background,
      borderRadius: inputConfig.dimensions.borderRadius,
      borderColor: currentColors.border,
    },
    variant === 'underlined' ? styles.underlined : null,
    variant === 'filled' ? styles.filled : null,
    inputConfig.shadow,
  ];

  // Text input styles
  const textInputStyle = [
    styles.textInput,
    {
      fontSize: inputConfig.dimensions.fontSize,
      lineHeight: inputConfig.dimensions.lineHeight,
      color: currentColors.text,
      paddingVertical: inputConfig.dimensions.paddingVertical,
    },
    type === 'multiline' && {
      minHeight: minHeight || inputConfig.dimensions.height,
      maxHeight: maxHeight,
      textAlignVertical: 'top' as const,
    },
    inputStyle,
  ];

  // Get keyboard type and other props based on input type
  const getTypeProps = () => {
    const typeConfig = {
      text: {
        keyboardType: 'default' as const,
        autoCapitalize: 'sentences' as const,
        autoCorrect: true,
      },
      number: {
        keyboardType: 'numeric' as const,
        autoCapitalize: 'none' as const,
        autoCorrect: false,
      },
      email: {
        keyboardType: 'email-address' as const,
        autoCapitalize: 'none' as const,
        autoCorrect: false,
        textContentType: 'emailAddress' as const,
      },
      password: {
        keyboardType: 'default' as const,
        autoCapitalize: 'none' as const,
        autoCorrect: false,
        secureTextEntry: !isPasswordVisible,
        textContentType: 'password' as const,
      },
      phone: {
        keyboardType: 'phone-pad' as const,
        autoCapitalize: 'none' as const,
        autoCorrect: false,
        textContentType: 'telephoneNumber' as const,
      },
      search: {
        keyboardType: 'web-search' as const,
        autoCapitalize: 'none' as const,
        autoCorrect: false,
        returnKeyType: 'search' as const,
      },
      multiline: {
        keyboardType: 'default' as const,
        autoCapitalize: 'sentences' as const,
        autoCorrect: true,
        multiline: true,
        numberOfLines,
      },
    };
    
    return typeConfig[type] || typeConfig.text;
  };

  return (
    <AnimatedView style={[containerStyle, containerAnimatedStyle]}>
      {/* Label */}
      {label && (
        <Animated.View
          style={[
            styles.labelContainer,
            floatingLabel ? styles.floatingLabel : styles.staticLabel,
            labelAnimatedStyle,
          ]}
          pointerEvents="none"
        >
          <Text
            style={[
              styles.label,
              { color: currentColors.label },
              labelStyle,
            ]}
          >
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        </Animated.View>
      )}

      {/* Input Container */}
      <Animated.View style={[inputContainerStyle, borderAnimatedStyle]}>
        {renderLeadingIcon()}
        
        <AnimatedTextInput
          ref={inputRef}
          style={textInputStyle}
          value={value}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={placeholderTextColor || inputConfig.colors.placeholder}
          accessible={true}
          accessibilityLabel={accessibilityLabel || label}
          accessibilityHint={accessibilityHint}
          accessibilityInvalid={accessibilityInvalid || (!validationState.isValid && validationState.touched)}
          testID={testID}
          {...getTypeProps()}
          {...textInputProps}
        />
        
        {renderTrailingIcon()}
      </Animated.View>

      {/* Helper Text */}
      {renderHelperText()}
    </AnimatedView>
  );
});

Input.displayName = 'Input';

// Utility function to get input configuration
const getInputConfig = (
  variant: InputProps['variant'],
  type: InputProps['type'],
  theme: any,
  themeVariant: string
) => {
  const { tokens } = theme;
  
  // Base dimensions
  const baseDimensions: InputDimensions = {
    height: 44,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: tokens.borderRadius.md,
    fontSize: 14,
    lineHeight: 20,
  };

  // Adjust dimensions for multiline
  if (type === 'multiline') {
    baseDimensions.height = 88;
    baseDimensions.paddingVertical = 16;
  }

  // Variant configurations
  const variantConfig: Record<string, any> = {
    default: {
      colors: {
        background: tokens.colors.background.primary,
        border: tokens.colors.border.medium,
        borderFocused: tokens.colors.primary[500],
        borderError: tokens.colors.semantic.error.main,
        borderSuccess: tokens.colors.semantic.success.main,
        borderDisabled: tokens.colors.border.light,
        backgroundDisabled: tokens.colors.neutral[50],
        text: tokens.colors.text.primary,
        textDisabled: tokens.colors.text.disabled,
        placeholder: tokens.colors.text.tertiary,
        label: tokens.colors.text.secondary,
        labelFocused: tokens.colors.primary[500],
        labelError: tokens.colors.semantic.error.main,
        helperText: tokens.colors.text.tertiary,
        errorText: tokens.colors.semantic.error.main,
        successText: tokens.colors.semantic.success.main,
      },
      shadow: tokens.shadows.xs,
      borderWidth: 1,
    },
    filled: {
      colors: {
        background: tokens.colors.background.secondary,
        border: 'transparent',
        borderFocused: tokens.colors.primary[500],
        borderError: tokens.colors.semantic.error.main,
        borderSuccess: tokens.colors.semantic.success.main,
        borderDisabled: 'transparent',
        backgroundDisabled: tokens.colors.neutral[100],
        text: tokens.colors.text.primary,
        textDisabled: tokens.colors.text.disabled,
        placeholder: tokens.colors.text.tertiary,
        label: tokens.colors.text.secondary,
        labelFocused: tokens.colors.primary[500],
        labelError: tokens.colors.semantic.error.main,
        helperText: tokens.colors.text.tertiary,
        errorText: tokens.colors.semantic.error.main,
        successText: tokens.colors.semantic.success.main,
      },
      shadow: tokens.shadows.none,
      borderWidth: 0,
      borderBottomWidth: 2,
    },
    outlined: {
      colors: {
        background: 'transparent',
        border: tokens.colors.border.medium,
        borderFocused: tokens.colors.primary[500],
        borderError: tokens.colors.semantic.error.main,
        borderSuccess: tokens.colors.semantic.success.main,
        borderDisabled: tokens.colors.border.light,
        backgroundDisabled: tokens.colors.neutral[25],
        text: tokens.colors.text.primary,
        textDisabled: tokens.colors.text.disabled,
        placeholder: tokens.colors.text.tertiary,
        label: tokens.colors.text.secondary,
        labelFocused: tokens.colors.primary[500],
        labelError: tokens.colors.semantic.error.main,
        helperText: tokens.colors.text.tertiary,
        errorText: tokens.colors.semantic.error.main,
        successText: tokens.colors.semantic.success.main,
      },
      shadow: tokens.shadows.none,
      borderWidth: 2,
    },
    underlined: {
      colors: {
        background: 'transparent',
        border: tokens.colors.border.medium,
        borderFocused: tokens.colors.primary[500],
        borderError: tokens.colors.semantic.error.main,
        borderSuccess: tokens.colors.semantic.success.main,
        borderDisabled: tokens.colors.border.light,
        backgroundDisabled: 'transparent',
        text: tokens.colors.text.primary,
        textDisabled: tokens.colors.text.disabled,
        placeholder: tokens.colors.text.tertiary,
        label: tokens.colors.text.secondary,
        labelFocused: tokens.colors.primary[500],
        labelError: tokens.colors.semantic.error.main,
        helperText: tokens.colors.text.tertiary,
        errorText: tokens.colors.semantic.error.main,
        successText: tokens.colors.semantic.success.main,
      },
      shadow: tokens.shadows.none,
      borderWidth: 0,
      borderBottomWidth: 1,
    },
  };

  const config = variantConfig[variant || 'default'];

  return {
    dimensions: baseDimensions,
    colors: config.colors,
    shadow: config.shadow,
    borderWidth: config.borderWidth,
  };
};

// Styles
const styles = {
  container: {
    marginBottom: 4,
  },
  fullWidth: {
    width: '100%',
  },
  labelContainer: {
    position: 'absolute' as const,
    left: 12,
    zIndex: 1,
  },
  floatingLabel: {
    top: 12,
  },
  staticLabel: {
    top: -20,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    backgroundColor: 'transparent',
    paddingHorizontal: 4,
  },
  required: {
    color: '#ef4444',
  },
  inputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    position: 'relative' as const,
  },
  underlined: {
    borderWidth: 0,
    borderBottomWidth: 1,
    borderRadius: 0,
    paddingHorizontal: 0,
  },
  filled: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  textInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    textAlignVertical: 'center' as const,
    includeFontPadding: false,
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  iconText: {
    fontSize: 16,
  },
  trailingContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  helperContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  helperTextContainer: {
    flex: 1,
  },
  helperText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    lineHeight: 16,
  },
  errorText: {
    fontFamily: 'Inter-Medium',
  },
  successText: {
    fontFamily: 'Inter-Medium',
  },
  characterCount: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginLeft: 8,
  },
};

export default Input;