/**
 * Badge Component Tests
 * Harry School Mobile Design System
 * 
 * Comprehensive test suite for Badge component functionality and accessibility
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ThemeProvider } from '../../theme/ThemeProvider';
import Badge from './Badge';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: any) => children,
}));

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

describe('Badge Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('renders correctly with default props', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Badge testID="test-badge" />
        </TestWrapper>
      );
      
      expect(getByTestId('test-badge')).toBeTruthy();
    });

    it('displays count content', () => {
      const { getByText } = render(
        <TestWrapper>
          <Badge count={5} />
        </TestWrapper>
      );
      
      expect(getByText('5')).toBeTruthy();
    });

    it('displays custom content', () => {
      const { getByText } = render(
        <TestWrapper>
          <Badge content="New" />
        </TestWrapper>
      );
      
      expect(getByText('New')).toBeTruthy();
    });

    it('formats high counts with max display', () => {
      const { getByText } = render(
        <TestWrapper>
          <Badge count={150} maxDisplayCount={99} />
        </TestWrapper>
      );
      
      expect(getByText('99+')).toBeTruthy();
    });

    it('hides when count is zero and showZero is false', () => {
      const { queryByTestId } = render(
        <TestWrapper>
          <Badge count={0} showZero={false} testID="zero-badge" />
        </TestWrapper>
      );
      
      expect(queryByTestId('zero-badge')).toBeNull();
    });

    it('shows when count is zero and showZero is true', () => {
      const { getByText } = render(
        <TestWrapper>
          <Badge count={0} showZero testID="zero-badge" />
        </TestWrapper>
      );
      
      expect(getByText('0')).toBeTruthy();
    });
  });

  describe('Types', () => {
    const types = ['notification', 'achievement', 'status'] as const;
    
    types.forEach(type => {
      it(`renders ${type} type correctly`, () => {
        const { getByTestId } = render(
          <TestWrapper>
            <Badge type={type} content="Test" testID={`${type}-badge`} />
          </TestWrapper>
        );
        
        expect(getByTestId(`${type}-badge`)).toBeTruthy();
      });
    });
  });

  describe('Variants', () => {
    const variants = ['dot', 'count', 'icon', 'text', 'achievement', 'status'] as const;
    
    variants.forEach(variant => {
      it(`renders ${variant} variant correctly`, () => {
        const { getByTestId } = render(
          <TestWrapper>
            <Badge 
              variant={variant} 
              content={variant !== 'dot' ? 'Test' : undefined}
              testID={`${variant}-badge`} 
            />
          </TestWrapper>
        );
        
        expect(getByTestId(`${variant}-badge`)).toBeTruthy();
      });
    });
  });

  describe('Sizes', () => {
    const sizes = ['sm', 'md', 'lg'] as const;
    
    sizes.forEach(size => {
      it(`renders ${size} size correctly`, () => {
        const { getByTestId } = render(
          <TestWrapper>
            <Badge size={size} content="Test" testID={`${size}-badge`} />
          </TestWrapper>
        );
        
        expect(getByTestId(`${size}-badge`)).toBeTruthy();
      });
    });
  });

  describe('Colors', () => {
    const colors = ['primary', 'secondary', 'success', 'warning', 'error', 'info', 'neutral'] as const;
    
    colors.forEach(color => {
      it(`renders ${color} color correctly`, () => {
        const { getByTestId } = render(
          <TestWrapper>
            <Badge color={color} content="Test" testID={`${color}-badge`} />
          </TestWrapper>
        );
        
        expect(getByTestId(`${color}-badge`)).toBeTruthy();
      });
    });
  });

  describe('Achievement Badges', () => {
    const achievementTypes = ['gold', 'silver', 'bronze', 'platinum'] as const;
    
    achievementTypes.forEach(type => {
      it(`renders ${type} achievement badge`, () => {
        const { getByLabelText } = render(
          <TestWrapper>
            <Badge type="achievement" achievementType={type} />
          </TestWrapper>
        );
        
        expect(getByLabelText(`${type} achievement`)).toBeTruthy();
      });
    });

    it('shows level indicator when specified', () => {
      const { getByLabelText } = render(
        <TestWrapper>
          <Badge 
            type="achievement" 
            achievementType="gold" 
            level={3} 
            showLevel 
          />
        </TestWrapper>
      );
      
      expect(getByLabelText('gold achievement, level 3')).toBeTruthy();
    });
  });

  describe('Status Badges', () => {
    const statusTypes = ['active', 'pending', 'inactive', 'completed', 'error', 'new'] as const;
    
    statusTypes.forEach(status => {
      it(`renders ${status} status badge`, () => {
        const { getByLabelText } = render(
          <TestWrapper>
            <Badge type="status" statusType={status} />
          </TestWrapper>
        );
        
        expect(getByLabelText(`Status: ${status}`)).toBeTruthy();
      });
    });

    it('displays custom status message', () => {
      const { getByText } = render(
        <TestWrapper>
          <Badge type="status" statusMessage="Custom Status" />
        </TestWrapper>
      );
      
      expect(getByText('Custom Status')).toBeTruthy();
    });
  });

  describe('Interactive Features', () => {
    it('calls onPress when pressed and interactive', () => {
      const onPressMock = jest.fn();
      const { getByTestId } = render(
        <TestWrapper>
          <Badge 
            interactive 
            onPress={onPressMock} 
            content="Interactive"
            testID="interactive-badge" 
          />
        </TestWrapper>
      );
      
      fireEvent.press(getByTestId('interactive-badge'));
      expect(onPressMock).toHaveBeenCalledTimes(1);
    });

    it('does not call onPress when not interactive', () => {
      const onPressMock = jest.fn();
      const { getByTestId } = render(
        <TestWrapper>
          <Badge 
            onPress={onPressMock} 
            content="Non-Interactive"
            testID="non-interactive-badge" 
          />
        </TestWrapper>
      );
      
      fireEvent.press(getByTestId('non-interactive-badge'));
      expect(onPressMock).not.toHaveBeenCalled();
    });

    it('calls onLongPress when long pressed', () => {
      const onLongPressMock = jest.fn();
      const { getByTestId } = render(
        <TestWrapper>
          <Badge 
            interactive 
            onLongPress={onLongPressMock} 
            content="Long Press"
            testID="long-press-badge" 
          />
        </TestWrapper>
      );
      
      fireEvent(getByTestId('long-press-badge'), 'longPress');
      expect(onLongPressMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Icons', () => {
    it('renders icon content', () => {
      const TestIcon = () => <Text>🔔</Text>;
      const { getByTestId } = render(
        <TestWrapper>
          <Badge icon={<TestIcon />} testID="icon-badge" />
        </TestWrapper>
      );
      
      expect(getByTestId('icon-badge')).toBeTruthy();
    });

    it('renders string icon', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Badge icon="🔔" content="5" testID="string-icon-badge" />
        </TestWrapper>
      );
      
      expect(getByTestId('string-icon-badge')).toBeTruthy();
    });
  });

  describe('Positioning', () => {
    const positions = ['top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center', 'bottom-center'] as const;
    
    positions.forEach(position => {
      it(`positions badge ${position} correctly`, () => {
        const { getByTestId } = render(
          <TestWrapper>
            <Badge 
              position={position} 
              content="Positioned"
              testID={`${position}-badge`} 
            />
          </TestWrapper>
        );
        
        expect(getByTestId(`${position}-badge`)).toBeTruthy();
      });
    });

    it('applies position offsets', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Badge 
            position="top-right" 
            offsetX={10} 
            offsetY={5}
            content="Offset"
            testID="offset-badge" 
          />
        </TestWrapper>
      );
      
      expect(getByTestId('offset-badge')).toBeTruthy();
    });

    it('renders without absolute positioning', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Badge 
            absolute={false} 
            content="Relative"
            testID="relative-badge" 
          />
        </TestWrapper>
      );
      
      expect(getByTestId('relative-badge')).toBeTruthy();
    });
  });

  describe('Visibility', () => {
    it('hides badge when visible is false', () => {
      const { queryByTestId } = render(
        <TestWrapper>
          <Badge visible={false} content="Hidden" testID="hidden-badge" />
        </TestWrapper>
      );
      
      expect(queryByTestId('hidden-badge')).toBeNull();
    });

    it('shows badge when visible is true', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Badge visible content="Visible" testID="visible-badge" />
        </TestWrapper>
      );
      
      expect(getByTestId('visible-badge')).toBeTruthy();
    });
  });

  describe('Custom Styling', () => {
    it('applies custom background color', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Badge 
            backgroundColor="#ff0000" 
            content="Custom BG"
            testID="custom-bg-badge" 
          />
        </TestWrapper>
      );
      
      const badge = getByTestId('custom-bg-badge');
      expect(badge.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: '#ff0000',
          })
        ])
      );
    });

    it('applies custom text color', () => {
      const { getByText } = render(
        <TestWrapper>
          <Badge textColor="#00ff00" content="Custom Text" />
        </TestWrapper>
      );
      
      const text = getByText('Custom Text');
      expect(text.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            color: '#00ff00',
          })
        ])
      );
    });

    it('applies custom border', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Badge 
            borderColor="#0000ff" 
            borderWidth={2}
            content="Custom Border"
            testID="custom-border-badge" 
          />
        </TestWrapper>
      );
      
      const badge = getByTestId('custom-border-badge');
      expect(badge.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            borderColor: '#0000ff',
            borderWidth: 2,
          })
        ])
      );
    });

    it('applies custom border radius', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Badge 
            borderRadius={4} 
            content="Custom Radius"
            testID="custom-radius-badge" 
          />
        </TestWrapper>
      );
      
      const badge = getByTestId('custom-radius-badge');
      expect(badge.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            borderRadius: 4,
          })
        ])
      );
    });
  });

  describe('Accessibility', () => {
    it('has correct accessibility role when interactive', () => {
      const { getByRole } = render(
        <TestWrapper>
          <Badge interactive content="Interactive Badge" />
        </TestWrapper>
      );
      
      expect(getByRole('button')).toBeTruthy();
    });

    it('has text role when not interactive', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Badge content="Text Badge" testID="text-badge" />
        </TestWrapper>
      );
      
      const badge = getByTestId('text-badge');
      expect(badge.props.accessibilityRole).toBe('text');
    });

    it('builds notification accessibility label', () => {
      const { getByLabelText } = render(
        <TestWrapper>
          <Badge type="notification" count={3} />
        </TestWrapper>
      );
      
      expect(getByLabelText('3 notifications')).toBeTruthy();
    });

    it('handles singular notification label', () => {
      const { getByLabelText } = render(
        <TestWrapper>
          <Badge type="notification" count={1} />
        </TestWrapper>
      );
      
      expect(getByLabelText('1 notification')).toBeTruthy();
    });

    it('handles zero notification label', () => {
      const { getByLabelText } = render(
        <TestWrapper>
          <Badge type="notification" count={0} showZero />
        </TestWrapper>
      );
      
      expect(getByLabelText('No notifications')).toBeTruthy();
    });

    it('uses custom accessibility label', () => {
      const { getByLabelText } = render(
        <TestWrapper>
          <Badge 
            content="Custom" 
            accessibilityLabel="Custom Badge Label"
          />
        </TestWrapper>
      );
      
      expect(getByLabelText('Custom Badge Label')).toBeTruthy();
    });

    it('applies accessibility hint', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Badge 
            content="Hint Badge"
            accessibilityHint="This badge has a hint"
            testID="hint-badge"
          />
        </TestWrapper>
      );
      
      const badge = getByTestId('hint-badge');
      expect(badge.props.accessibilityHint).toBe('This badge has a hint');
    });
  });

  describe('Theme Variants', () => {
    it('uses teacher theme variant', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Badge 
            themeVariant="teacher" 
            content="Teacher Badge"
            testID="teacher-badge" 
          />
        </TestWrapper>
      );
      
      expect(getByTestId('teacher-badge')).toBeTruthy();
    });

    it('uses student theme variant', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Badge 
            themeVariant="student" 
            content="Student Badge"
            testID="student-badge" 
          />
        </TestWrapper>
      );
      
      expect(getByTestId('student-badge')).toBeTruthy();
    });
  });

  describe('Priority Levels', () => {
    const priorities = ['low', 'medium', 'high', 'urgent'] as const;
    
    priorities.forEach(priority => {
      it(`renders ${priority} priority badge`, () => {
        const { getByTestId } = render(
          <TestWrapper>
            <Badge 
              priority={priority} 
              content="Priority"
              testID={`${priority}-priority-badge`} 
            />
          </TestWrapper>
        );
        
        expect(getByTestId(`${priority}-priority-badge`)).toBeTruthy();
      });
    });
  });

  describe('Animation Props', () => {
    it('enables pulse animation', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Badge 
            pulse 
            content="Pulsing Badge"
            testID="pulse-badge" 
          />
        </TestWrapper>
      );
      
      expect(getByTestId('pulse-badge')).toBeTruthy();
    });

    it('enables bounce animation', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Badge 
            bounce 
            content="Bouncing Badge"
            testID="bounce-badge" 
          />
        </TestWrapper>
      );
      
      expect(getByTestId('bounce-badge')).toBeTruthy();
    });

    it('enables celebration animation', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Badge 
            celebration 
            content="Celebration Badge"
            testID="celebration-badge" 
          />
        </TestWrapper>
      );
      
      expect(getByTestId('celebration-badge')).toBeTruthy();
    });

    it('disables all animations', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Badge 
            disableAnimations 
            content="No Animation Badge"
            testID="no-animation-badge" 
          />
        </TestWrapper>
      );
      
      expect(getByTestId('no-animation-badge')).toBeTruthy();
    });
  });
});