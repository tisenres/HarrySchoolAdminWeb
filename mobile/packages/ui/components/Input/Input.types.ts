/**
 * Input Component Type Definitions
 * Harry School Mobile Design System
 * 
 * Comprehensive TypeScript definitions for Input variants, states, and validation
 */

import { ReactNode } from 'react';
import { TextInputProps, ViewStyle, TextStyle } from 'react-native';

export type InputVariant = 'default' | 'filled' | 'outlined' | 'underlined';

export type InputType = 'text' | 'number' | 'password' | 'multiline' | 'search' | 'email' | 'phone';

export type InputState = 'default' | 'focused' | 'error' | 'disabled' | 'valid';

export type ValidationRule = {
  /** Rule name for identification */
  name: string;
  /** Validation function */
  validate: (value: string) => boolean;
  /** Error message to show when validation fails */
  message: string;
};

export interface InputValidationProps {
  /** Array of validation rules */
  validationRules?: ValidationRule[];
  /** Enable real-time validation */
  validateOnChange?: boolean;
  /** Enable validation on blur */
  validateOnBlur?: boolean;
  /** Show validation state visually */
  showValidationState?: boolean;
  /** Custom error message override */
  errorMessage?: string;
  /** Custom success message */
  successMessage?: string;
  /** Validation state callback */
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
}

export interface InputLabelProps {
  /** Input label text */
  label?: string;
  /** Enable floating label animation */
  floatingLabel?: boolean;
  /** Required field indicator */
  required?: boolean;
  /** Custom label style */
  labelStyle?: TextStyle;
  /** Label animation duration */
  labelAnimationDuration?: number;
}

export interface InputHelperProps {
  /** Helper text below input */
  helperText?: string;
  /** Character counter (for maxLength) */
  showCharacterCount?: boolean;
  /** Helper text style */
  helperTextStyle?: TextStyle;
  /** Error text style */
  errorTextStyle?: TextStyle;
  /** Success text style */
  successTextStyle?: TextStyle;
}

export interface InputIconProps {
  /** Leading icon (left side) */
  leadingIcon?: ReactNode | string;
  /** Trailing icon (right side) */
  trailingIcon?: ReactNode | string;
  /** Leading icon press handler */
  onLeadingIconPress?: () => void;
  /** Trailing icon press handler */
  onTrailingIconPress?: () => void;
  /** Icon size override */
  iconSize?: number;
  /** Icon color override */
  iconColor?: string;
  /** Clear button (for text inputs) */
  showClearButton?: boolean;
  /** Password visibility toggle */
  showPasswordToggle?: boolean;
}

export interface InputAnimationProps {
  /** Enable all animations */
  enableAnimations?: boolean;
  /** Focus animation duration */
  focusAnimationDuration?: number;
  /** Error shake animation */
  enableErrorShake?: boolean;
  /** Success pulse animation */
  enableSuccessPulse?: boolean;
  /** Disable animations (accessibility) */
  disableAnimations?: boolean;
}

export interface InputAccessibilityProps {
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
  /** Accessibility hint for additional context */
  accessibilityHint?: string;
  /** Live region for error announcements */
  accessibilityLiveRegion?: 'none' | 'polite' | 'assertive';
  /** Accessibility role override */
  accessibilityRole?: string;
  /** Accessibility state for validation */
  accessibilityInvalid?: boolean;
}

export interface InputStyleProps {
  /** Input variant determining appearance */
  variant?: InputVariant;
  /** Input type affecting keyboard and behavior */
  type?: InputType;
  /** Full width input */
  fullWidth?: boolean;
  /** Custom container style */
  containerStyle?: ViewStyle;
  /** Custom input style */
  inputStyle?: TextStyle;
  /** Custom placeholder color */
  placeholderTextColor?: string;
  /** Custom border radius */
  borderRadius?: number;
}

export interface InputMultilineProps {
  /** Number of visible text lines (multiline) */
  numberOfLines?: number;
  /** Minimum height (multiline) */
  minHeight?: number;
  /** Maximum height (multiline) */
  maxHeight?: number;
  /** Auto-grow height */
  autoGrow?: boolean;
}

export interface InputNumberProps {
  /** Minimum value (number type) */
  min?: number;
  /** Maximum value (number type) */
  max?: number;
  /** Step value for increment/decrement */
  step?: number;
  /** Show increment/decrement buttons */
  showStepperButtons?: boolean;
  /** Number format (integer, decimal) */
  numberFormat?: 'integer' | 'decimal';
  /** Decimal places */
  decimalPlaces?: number;
}

export interface InputSearchProps {
  /** Search suggestions */
  suggestions?: string[];
  /** Show search suggestions */
  showSuggestions?: boolean;
  /** Search handler */
  onSearch?: (query: string) => void;
  /** Search debounce delay */
  searchDebounce?: number;
  /** Clear search on escape */
  clearOnEscape?: boolean;
}

export interface InputProps
  extends Omit<TextInputProps, 'style'>,
          InputStyleProps,
          InputLabelProps,
          InputHelperProps,
          InputIconProps,
          InputValidationProps,
          InputAnimationProps,
          InputAccessibilityProps,
          InputMultilineProps,
          InputNumberProps,
          InputSearchProps {
  /** Test ID for testing */
  testID?: string;
  /** Custom ref forwarding */
  ref?: React.Ref<any>;
}

// Component configuration interfaces
export interface InputDimensions {
  height: number;
  paddingHorizontal: number;
  paddingVertical: number;
  borderRadius: number;
  fontSize: number;
  lineHeight: number;
}

export interface InputColors {
  background: string;
  backgroundFocused?: string;
  backgroundDisabled: string;
  border: string;
  borderFocused: string;
  borderError: string;
  borderSuccess: string;
  borderDisabled: string;
  text: string;
  textDisabled: string;
  placeholder: string;
  label: string;
  labelFocused: string;
  labelError: string;
  helperText: string;
  errorText: string;
  successText: string;
}

export interface InputShadow {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export interface InputAnimationConfig {
  label: {
    focused: {
      scale: number;
      translateY: number;
      duration: number;
    };
    unfocused: {
      scale: number;
      translateY: number;
      duration: number;
    };
  };
  border: {
    focusDuration: number;
    blurDuration: number;
  };
  error: {
    shakeDuration: number;
    shakeDistance: number;
  };
  success: {
    pulseDuration: number;
    pulseScale: number;
  };
}

// Theme-specific configurations
export interface InputThemeConfig {
  teacher: {
    animations: 'minimal' | 'standard';
    validationTiming: 'immediate' | 'onBlur';
    labelStyle: 'floating' | 'static';
  };
  student: {
    animations: 'standard' | 'enhanced';
    validationTiming: 'immediate' | 'onChange';
    labelStyle: 'floating' | 'animated';
  };
}

// Validation state interface
export interface InputValidationState {
  isValid: boolean;
  errors: string[];
  touched: boolean;
  validatedOnce: boolean;
}

// Export utility types
export type InputVariantConfig = {
  [K in InputVariant]: {
    colors: InputColors;
    shadow?: InputShadow;
    borderWidth: number;
    underlineOnly?: boolean;
  };
};

export type InputTypeConfig = {
  [K in InputType]: {
    keyboardType: TextInputProps['keyboardType'];
    autoCapitalize: TextInputProps['autoCapitalize'];
    autoCorrect: boolean;
    secureTextEntry?: boolean;
    multiline?: boolean;
    textContentType?: TextInputProps['textContentType'];
  };
};