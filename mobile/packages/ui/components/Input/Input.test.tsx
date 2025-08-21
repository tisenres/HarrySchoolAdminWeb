/**
 * Input Component Tests
 * Harry School Mobile Design System
 * 
 * Comprehensive test suite for Input component functionality and accessibility
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { ThemeProvider } from '../../theme/ThemeProvider';
import Input from './Input';
import type { ValidationRule } from './Input.types';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider variant="student">
    {children}
  </ThemeProvider>
);

describe('Input Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('renders correctly with default props', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Input testID="test-input" />
        </TestWrapper>
      );
      
      expect(getByTestId('test-input')).toBeTruthy();
    });

    it('renders with label', () => {
      const { getByText } = render(
        <TestWrapper>
          <Input label="Test Label" />
        </TestWrapper>
      );
      
      expect(getByText('Test Label')).toBeTruthy();
    });

    it('shows required indicator', () => {
      const { getByText } = render(
        <TestWrapper>
          <Input label="Required Field" required />
        </TestWrapper>
      );
      
      expect(getByText('Required Field')).toBeTruthy();
      expect(getByText('*')).toBeTruthy();
    });

    it('calls onChangeText when text changes', () => {
      const onChangeTextMock = jest.fn();
      const { getByTestID } = render(
        <TestWrapper>
          <Input onChangeText={onChangeTextMock} testID="input-field" />
        </TestWrapper>
      );
      
      fireEvent.changeText(getByTestID('input-field'), 'test text');
      expect(onChangeTextMock).toHaveBeenCalledWith('test text');
    });

    it('displays initial value', () => {
      const { getByDisplayValue } = render(
        <TestWrapper>
          <Input value="Initial Value" />
        </TestWrapper>
      );
      
      expect(getByDisplayValue('Initial Value')).toBeTruthy();
    });
  });

  describe('Variants', () => {
    const variants = ['default', 'filled', 'outlined', 'underlined'] as const;
    
    variants.forEach(variant => {
      it(`renders ${variant} variant correctly`, () => {
        const { getByTestId } = render(
          <TestWrapper>
            <Input variant={variant} testID={`${variant}-input`} />
          </TestWrapper>
        );
        
        expect(getByTestId(`${variant}-input`)).toBeTruthy();
      });
    });
  });

  describe('Input Types', () => {
    it('renders password input with toggle', () => {
      const { getByLabelText } = render(
        <TestWrapper>
          <Input type="password" />
        </TestWrapper>
      );
      
      expect(getByLabelText('Show password')).toBeTruthy();
    });

    it('toggles password visibility', () => {
      const { getByLabelText } = render(
        <TestWrapper>
          <Input type="password" />
        </TestWrapper>
      );
      
      const toggleButton = getByLabelText('Show password');
      fireEvent.press(toggleButton);
      
      expect(getByLabelText('Hide password')).toBeTruthy();
    });

    it('renders multiline input', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Input type="multiline" numberOfLines={3} testID="multiline-input" />
        </TestWrapper>
      );
      
      expect(getByTestId('multiline-input')).toBeTruthy();
    });

    it('renders search input', () => {
      const onSearchMock = jest.fn();
      const { getByTestId } = render(
        <TestWrapper>
          <Input type="search" onSearch={onSearchMock} testID="search-input" />
        </TestWrapper>
      );
      
      expect(getByTestId('search-input')).toBeTruthy();
    });
  });

  describe('Validation', () => {
    const validationRules: ValidationRule[] = [
      {
        name: 'required',
        validate: (value: string) => value.length > 0,
        message: 'This field is required',
      },
      {
        name: 'minLength',
        validate: (value: string) => value.length >= 3,
        message: 'Minimum 3 characters required',
      },
    ];

    it('validates on blur', async () => {
      const { getByTestId, queryByText } = render(
        <TestWrapper>
          <Input 
            validationRules={validationRules}
            validateOnBlur
            testID="validation-input"
          />
        </TestWrapper>
      );
      
      const input = getByTestId('validation-input');
      
      // Focus and blur without entering text
      fireEvent(input, 'focus');
      fireEvent(input, 'blur');
      
      await waitFor(() => {
        expect(queryByText('This field is required')).toBeTruthy();
      });
    });

    it('validates on change', async () => {
      const { getByTestId, queryByText } = render(
        <TestWrapper>
          <Input 
            validationRules={validationRules}
            validateOnChange
            testID="validation-input"
          />
        </TestWrapper>
      );
      
      const input = getByTestId('validation-input');
      
      fireEvent.changeText(input, 'ab');
      
      await waitFor(() => {
        expect(queryByText('Minimum 3 characters required')).toBeTruthy();
      });
    });

    it('shows success state when valid', async () => {
      const { getByTestId, queryByText } = render(
        <TestWrapper>
          <Input 
            validationRules={validationRules}
            validateOnChange
            successMessage="Looks good!"
            testID="validation-input"
          />
        </TestWrapper>
      );
      
      const input = getByTestId('validation-input');
      
      fireEvent.changeText(input, 'valid text');
      
      await waitFor(() => {
        expect(queryByText('Looks good!')).toBeTruthy();
      });
    });

    it('calls onValidationChange callback', async () => {
      const onValidationChangeMock = jest.fn();
      const { getByTestId } = render(
        <TestWrapper>
          <Input 
            validationRules={validationRules}
            validateOnChange
            onValidationChange={onValidationChangeMock}
            testID="validation-input"
          />
        </TestWrapper>
      );
      
      const input = getByTestId('validation-input');
      
      fireEvent.changeText(input, 'valid text');
      
      await waitFor(() => {
        expect(onValidationChangeMock).toHaveBeenCalledWith(true, []);
      });
    });

    it('displays custom error message', async () => {
      const { getByTestId, queryByText } = render(
        <TestWrapper>
          <Input 
            validationRules={validationRules}
            validateOnBlur
            errorMessage="Custom error message"
            testID="validation-input"
          />
        </TestWrapper>
      );
      
      const input = getByTestId('validation-input');
      
      fireEvent(input, 'focus');
      fireEvent(input, 'blur');
      
      await waitFor(() => {
        expect(queryByText('Custom error message')).toBeTruthy();
      });
    });
  });

  describe('Helper Text', () => {
    it('displays helper text', () => {
      const { getByText } = render(
        <TestWrapper>
          <Input helperText="This is helper text" />
        </TestWrapper>
      );
      
      expect(getByText('This is helper text')).toBeTruthy();
    });

    it('shows character count', () => {
      const { getByText } = render(
        <TestWrapper>
          <Input 
            value="test"
            maxLength={10}
            showCharacterCount 
          />
        </TestWrapper>
      );
      
      expect(getByText('4/10')).toBeTruthy();
    });
  });

  describe('Icons and Actions', () => {
    it('renders leading icon', () => {
      const { getByLabelText } = render(
        <TestWrapper>
          <Input leadingIcon="🔍" />
        </TestWrapper>
      );
      
      expect(getByLabelText('Leading icon')).toBeTruthy();
    });

    it('renders trailing icon', () => {
      const { getByLabelText } = render(
        <TestWrapper>
          <Input trailingIcon="→" />
        </TestWrapper>
      );
      
      expect(getByLabelText('Trailing icon')).toBeTruthy();
    });

    it('calls icon press handlers', () => {
      const onLeadingIconPressMock = jest.fn();
      const onTrailingIconPressMock = jest.fn();
      
      const { getByLabelText } = render(
        <TestWrapper>
          <Input 
            leadingIcon="🔍"
            trailingIcon="→"
            onLeadingIconPress={onLeadingIconPressMock}
            onTrailingIconPress={onTrailingIconPressMock}
          />
        </TestWrapper>
      );
      
      fireEvent.press(getByLabelText('Leading icon'));
      expect(onLeadingIconPressMock).toHaveBeenCalledTimes(1);
      
      fireEvent.press(getByLabelText('Trailing icon'));
      expect(onTrailingIconPressMock).toHaveBeenCalledTimes(1);
    });

    it('shows clear button when input has value', () => {
      const { getByLabelText } = render(
        <TestWrapper>
          <Input value="test value" showClearButton />
        </TestWrapper>
      );
      
      expect(getByLabelText('Clear input')).toBeTruthy();
    });

    it('clears input when clear button pressed', () => {
      const onChangeTextMock = jest.fn();
      const { getByLabelText } = render(
        <TestWrapper>
          <Input 
            value="test value" 
            showClearButton 
            onChangeText={onChangeTextMock}
          />
        </TestWrapper>
      );
      
      fireEvent.press(getByLabelText('Clear input'));
      expect(onChangeTextMock).toHaveBeenCalledWith('');
    });
  });

  describe('Focus and Blur', () => {
    it('calls onFocus when input is focused', () => {
      const onFocusMock = jest.fn();
      const { getByTestId } = render(
        <TestWrapper>
          <Input onFocus={onFocusMock} testID="focus-input" />
        </TestWrapper>
      );
      
      fireEvent(getByTestId('focus-input'), 'focus');
      expect(onFocusMock).toHaveBeenCalledTimes(1);
    });

    it('calls onBlur when input loses focus', () => {
      const onBlurMock = jest.fn();
      const { getByTestId } = render(
        <TestWrapper>
          <Input onBlur={onBlurMock} testID="blur-input" />
        </TestWrapper>
      );
      
      fireEvent(getByTestId('blur-input'), 'blur');
      expect(onBlurMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has correct accessibility properties', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Input 
            accessibilityLabel="Test Input"
            accessibilityHint="Enter your text here"
            testID="accessible-input"
          />
        </TestWrapper>
      );
      
      const input = getByTestId('accessible-input');
      expect(input.props.accessibilityLabel).toBe('Test Input');
      expect(input.props.accessibilityHint).toBe('Enter your text here');
    });

    it('uses label as accessibility label when no explicit label provided', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Input 
            label="Input Label"
            testID="labeled-input"
          />
        </TestWrapper>
      );
      
      const input = getByTestId('labeled-input');
      expect(input.props.accessibilityLabel).toBe('Input Label');
    });

    it('sets accessibility invalid state for errors', async () => {
      const validationRules: ValidationRule[] = [
        {
          name: 'required',
          validate: (value: string) => value.length > 0,
          message: 'Required',
        },
      ];

      const { getByTestId } = render(
        <TestWrapper>
          <Input 
            validationRules={validationRules}
            validateOnBlur
            testID="validation-input"
          />
        </TestWrapper>
      );
      
      const input = getByTestId('validation-input');
      
      fireEvent(input, 'focus');
      fireEvent(input, 'blur');
      
      await waitFor(() => {
        expect(input.props.accessibilityInvalid).toBe(true);
      });
    });
  });

  describe('Floating Label', () => {
    it('renders floating label by default', () => {
      const { getByText } = render(
        <TestWrapper>
          <Input label="Floating Label" />
        </TestWrapper>
      );
      
      expect(getByText('Floating Label')).toBeTruthy();
    });

    it('disables floating label when floatingLabel is false', () => {
      const { getByText } = render(
        <TestWrapper>
          <Input label="Static Label" floatingLabel={false} />
        </TestWrapper>
      );
      
      expect(getByText('Static Label')).toBeTruthy();
    });
  });

  describe('Full Width', () => {
    it('applies full width styling by default', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Input testID="full-width-input" />
        </TestWrapper>
      );
      
      const inputContainer = getByTestId('full-width-input').parent;
      expect(inputContainer?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ width: '100%' })
        ])
      );
    });

    it('removes full width when fullWidth is false', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Input fullWidth={false} testID="non-full-width-input" />
        </TestWrapper>
      );
      
      const inputContainer = getByTestId('non-full-width-input').parent;
      expect(inputContainer?.props.style).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ width: '100%' })
        ])
      );
    });
  });

  describe('Disabled State', () => {
    it('renders disabled input correctly', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Input editable={false} testID="disabled-input" />
        </TestWrapper>
      );
      
      expect(getByTestId('disabled-input')).toBeTruthy();
      expect(getByTestId('disabled-input').props.editable).toBe(false);
    });
  });
});