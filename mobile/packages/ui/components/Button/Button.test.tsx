/**
 * Button Component Tests
 * Harry School Mobile Design System
 * 
 * Comprehensive test suite covering functionality, accessibility, and animations
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '../../theme/ThemeProvider';
import Button from './Button';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  
  // The mock for `call` immediately calls the callback which is incorrect
  // So we override it with a no-op
  Reanimated.default.call = () => {};
  
  return Reanimated;
});

// Mock HapticFeedback
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  HapticFeedback: {
    trigger: jest.fn(),
  },
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider variant="student">
    {children}
  </ThemeProvider>
);

describe('Button Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('renders correctly with default props', () => {
      const { getByText } = render(
        <TestWrapper>
          <Button>Test Button</Button>
        </TestWrapper>
      );
      
      expect(getByText('Test Button')).toBeTruthy();
    });

    it('calls onPress when pressed', () => {
      const onPressMock = jest.fn();
      const { getByText } = render(
        <TestWrapper>
          <Button onPress={onPressMock}>Press Me</Button>
        </TestWrapper>
      );
      
      fireEvent.press(getByText('Press Me'));
      expect(onPressMock).toHaveBeenCalledTimes(1);
    });

    it('does not call onPress when disabled', () => {
      const onPressMock = jest.fn();
      const { getByText } = render(
        <TestWrapper>
          <Button onPress={onPressMock} disabled>Disabled Button</Button>
        </TestWrapper>
      );
      
      fireEvent.press(getByText('Disabled Button'));
      expect(onPressMock).not.toHaveBeenCalled();
    });

    it('does not call onPress when loading', () => {
      const onPressMock = jest.fn();
      const { getByTestId } = render(
        <TestWrapper>
          <Button onPress={onPressMock} loading testID="loading-button">
            Loading Button
          </Button>
        </TestWrapper>
      );
      
      fireEvent.press(getByTestId('loading-button'));
      expect(onPressMock).not.toHaveBeenCalled();
    });
  });

  describe('Variants', () => {
    const variants = ['primary', 'secondary', 'outline', 'ghost', 'destructive', 'bulk'] as const;
    
    variants.forEach(variant => {
      it(`renders ${variant} variant correctly`, () => {
        const { getByText } = render(
          <TestWrapper>
            <Button variant={variant}>{variant} Button</Button>
          </TestWrapper>
        );
        
        expect(getByText(`${variant} Button`)).toBeTruthy();
      });
    });

    it('renders bulk variant with selection count', () => {
      const { getByText } = render(
        <TestWrapper>
          <Button variant="bulk" selectionCount={5}>
            Bulk Action
          </Button>
        </TestWrapper>
      );
      
      expect(getByText('Bulk Action')).toBeTruthy();
      expect(getByText('5')).toBeTruthy();
    });

    it('shows 99+ for bulk variant with high selection count', () => {
      const { getByText } = render(
        <TestWrapper>
          <Button variant="bulk" selectionCount={150}>
            Bulk Action
          </Button>
        </TestWrapper>
      );
      
      expect(getByText('99+')).toBeTruthy();
    });
  });

  describe('Sizes', () => {
    const sizes = ['small', 'medium', 'large', 'xlarge'] as const;
    
    sizes.forEach(size => {
      it(`renders ${size} size correctly`, () => {
        const { getByText } = render(
          <TestWrapper>
            <Button size={size}>{size} Button</Button>
          </TestWrapper>
        );
        
        expect(getByText(`${size} Button`)).toBeTruthy();
      });
    });
  });

  describe('Loading State', () => {
    it('shows loading indicator when loading', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Button loading testID="loading-button">
            Submit
          </Button>
        </TestWrapper>
      );
      
      // ActivityIndicator should be present
      expect(getByTestId('loading-button')).toBeTruthy();
    });

    it('shows custom loading text', () => {
      const { getByText } = render(
        <TestWrapper>
          <Button loading loadingText="Submitting...">
            Submit
          </Button>
        </TestWrapper>
      );
      
      expect(getByText('Submitting...')).toBeTruthy();
    });

    it('hides original content when loading', () => {
      const { queryByText } = render(
        <TestWrapper>
          <Button loading loadingText="Please wait...">
            Original Text
          </Button>
        </TestWrapper>
      );
      
      expect(queryByText('Original Text')).toBeNull();
      expect(queryByText('Please wait...')).toBeTruthy();
    });
  });

  describe('Icons', () => {
    it('renders icon in leading position', () => {
      const TestIcon = () => <div>🔥</div>;
      const { getByText } = render(
        <TestWrapper>
          <Button icon={<TestIcon />} iconPosition="leading">
            With Icon
          </Button>
        </TestWrapper>
      );
      
      expect(getByText('With Icon')).toBeTruthy();
    });

    it('renders icon in trailing position', () => {
      const TestIcon = () => <div>→</div>;
      const { getByText } = render(
        <TestWrapper>
          <Button icon={<TestIcon />} iconPosition="trailing">
            With Icon
          </Button>
        </TestWrapper>
      );
      
      expect(getByText('With Icon')).toBeTruthy();
    });

    it('renders icon-only button', () => {
      const TestIcon = () => <div>✓</div>;
      const { queryByText } = render(
        <TestWrapper>
          <Button icon={<TestIcon />} iconPosition="only" accessibilityLabel="Check">
            Hidden Text
          </Button>
        </TestWrapper>
      );
      
      expect(queryByText('Hidden Text')).toBeNull();
    });
  });

  describe('Accessibility', () => {
    it('has correct accessibility role', () => {
      const { getByRole } = render(
        <TestWrapper>
          <Button>Accessible Button</Button>
        </TestWrapper>
      );
      
      expect(getByRole('button')).toBeTruthy();
    });

    it('uses custom accessibility label', () => {
      const { getByLabelText } = render(
        <TestWrapper>
          <Button accessibilityLabel="Custom Label">Button</Button>
        </TestWrapper>
      );
      
      expect(getByLabelText('Custom Label')).toBeTruthy();
    });

    it('sets accessibility state for disabled button', () => {
      const { getByRole } = render(
        <TestWrapper>
          <Button disabled>Disabled Button</Button>
        </TestWrapper>
      );
      
      const button = getByRole('button');
      expect(button.props.accessibilityState.disabled).toBe(true);
    });

    it('sets accessibility state for loading button', () => {
      const { getByRole } = render(
        <TestWrapper>
          <Button loading>Loading Button</Button>
        </TestWrapper>
      );
      
      const button = getByRole('button');
      expect(button.props.accessibilityState.busy).toBe(true);
    });

    it('applies accessibility hint', () => {
      const { getByRole } = render(
        <TestWrapper>
          <Button accessibilityHint="This will submit the form">
            Submit
          </Button>
        </TestWrapper>
      );
      
      const button = getByRole('button');
      expect(button.props.accessibilityHint).toBe('This will submit the form');
    });
  });

  describe('Full Width', () => {
    it('renders full width button', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Button fullWidth testID="full-width-button">
            Full Width
          </Button>
        </TestWrapper>
      );
      
      const button = getByTestId('full-width-button');
      expect(button.props.style).toEqual(
        expect.objectContaining({
          width: '100%'
        })
      );
    });
  });

  describe('Event Handlers', () => {
    it('calls onPressIn and onPressOut', () => {
      const onPressInMock = jest.fn();
      const onPressOutMock = jest.fn();
      
      const { getByText } = render(
        <TestWrapper>
          <Button onPressIn={onPressInMock} onPressOut={onPressOutMock}>
            Interactive Button
          </Button>
        </TestWrapper>
      );
      
      const button = getByText('Interactive Button');
      
      fireEvent(button, 'pressIn');
      expect(onPressInMock).toHaveBeenCalledTimes(1);
      
      fireEvent(button, 'pressOut');
      expect(onPressOutMock).toHaveBeenCalledTimes(1);
    });

    it('calls onLongPress', () => {
      const onLongPressMock = jest.fn();
      
      const { getByText } = render(
        <TestWrapper>
          <Button onLongPress={onLongPressMock}>
            Long Press Button
          </Button>
        </TestWrapper>
      );
      
      fireEvent(getByText('Long Press Button'), 'longPress');
      expect(onLongPressMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Custom Styling', () => {
    it('applies custom container style', () => {
      const customStyle = { marginTop: 20 };
      
      const { getByTestId } = render(
        <TestWrapper>
          <Button style={customStyle} testID="styled-button">
            Styled Button
          </Button>
        </TestWrapper>
      );
      
      const button = getByTestId('styled-button');
      expect(button.props.style).toEqual(
        expect.objectContaining(customStyle)
      );
    });

    it('applies custom text style', () => {
      const customTextStyle = { fontWeight: 'bold' };
      
      const { getByText } = render(
        <TestWrapper>
          <Button textStyle={customTextStyle}>
            Custom Text
          </Button>
        </TestWrapper>
      );
      
      const text = getByText('Custom Text');
      expect(text.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining(customTextStyle)
        ])
      );
    });
  });

  describe('Animation Props', () => {
    it('disables animations when disableAnimations is true', () => {
      const { getByText } = render(
        <TestWrapper>
          <Button disableAnimations>
            No Animation
          </Button>
        </TestWrapper>
      );
      
      expect(getByText('No Animation')).toBeTruthy();
      // Animation disabling is tested through integration
    });

    it('enables celebration animations', () => {
      const { getByText } = render(
        <TestWrapper>
          <Button enableCelebration>
            Celebration Button
          </Button>
        </TestWrapper>
      );
      
      expect(getByText('Celebration Button')).toBeTruthy();
    });
  });
});