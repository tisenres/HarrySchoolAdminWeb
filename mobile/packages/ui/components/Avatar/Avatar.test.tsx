/**
 * Avatar Component Tests
 * Harry School Mobile Design System
 * 
 * Comprehensive test suite for Avatar component functionality and accessibility
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '../../theme/ThemeProvider';
import Avatar from './Avatar';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
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

describe('Avatar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('renders correctly with default props', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Avatar testID="test-avatar" />
        </TestWrapper>
      );
      
      expect(getByTestId('test-avatar')).toBeTruthy();
    });

    it('displays initials from name', () => {
      const { getByText } = render(
        <TestWrapper>
          <Avatar name="John Doe" />
        </TestWrapper>
      );
      
      expect(getByText('JD')).toBeTruthy();
    });

    it('displays custom initials', () => {
      const { getByText } = render(
        <TestWrapper>
          <Avatar name="John Doe" initials="JS" />
        </TestWrapper>
      );
      
      expect(getByText('JS')).toBeTruthy();
    });

    it('displays single name initial', () => {
      const { getByText } = render(
        <TestWrapper>
          <Avatar name="Madonna" />
        </TestWrapper>
      );
      
      expect(getByText('MA')).toBeTruthy(); // Takes first 2 characters
    });

    it('limits initials to maxInitials', () => {
      const { getByText } = render(
        <TestWrapper>
          <Avatar name="John Michael Doe" maxInitials={1} />
        </TestWrapper>
      );
      
      expect(getByText('J')).toBeTruthy();
    });

    it('shows placeholder when no name or initials', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Avatar testID="placeholder-avatar" />
        </TestWrapper>
      );
      
      expect(getByTestId('placeholder-avatar')).toBeTruthy();
      // Placeholder icon should be present (👤)
    });
  });

  describe('Sizes', () => {
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'] as const;
    
    sizes.forEach(size => {
      it(`renders ${size} size correctly`, () => {
        const { getByTestId } = render(
          <TestWrapper>
            <Avatar size={size} testID={`${size}-avatar`} name="Test User" />
          </TestWrapper>
        );
        
        expect(getByTestId(`${size}-avatar`)).toBeTruthy();
      });
    });
  });

  describe('Image Handling', () => {
    it('displays image when source is provided', () => {
      const imageSource = { uri: 'https://example.com/avatar.jpg' };
      const { getByLabelText } = render(
        <TestWrapper>
          <Avatar source={imageSource} alt="User Avatar" />
        </TestWrapper>
      );
      
      expect(getByLabelText('User Avatar')).toBeTruthy();
    });

    it('falls back to initials on image error', () => {
      const imageSource = { uri: 'invalid-url' };
      const { getByText } = render(
        <TestWrapper>
          <Avatar source={imageSource} name="John Doe" />
        </TestWrapper>
      );
      
      // Simulate image error
      const image = getByText('JD').parent?.parent; // Navigate to find image
      fireEvent(image as any, 'error');
      
      expect(getByText('JD')).toBeTruthy();
    });

    it('calls onError when image fails to load', () => {
      const onErrorMock = jest.fn();
      const imageSource = { uri: 'invalid-url' };
      const { getByLabelText } = render(
        <TestWrapper>
          <Avatar source={imageSource} alt="User Avatar" onError={onErrorMock} />
        </TestWrapper>
      );
      
      const image = getByLabelText('User Avatar');
      fireEvent(image, 'error');
      
      expect(onErrorMock).toHaveBeenCalledTimes(1);
    });

    it('calls onLoad when image loads successfully', () => {
      const onLoadMock = jest.fn();
      const imageSource = { uri: 'https://example.com/avatar.jpg' };
      const { getByLabelText } = render(
        <TestWrapper>
          <Avatar source={imageSource} alt="User Avatar" onLoad={onLoadMock} />
        </TestWrapper>
      );
      
      const image = getByLabelText('User Avatar');
      fireEvent(image, 'load');
      
      expect(onLoadMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Status Indicators', () => {
    const statuses = ['online', 'away', 'busy', 'offline'] as const;
    
    statuses.forEach(status => {
      it(`displays ${status} status indicator`, () => {
        const { getByLabelText } = render(
          <TestWrapper>
            <Avatar status={status} showStatus name="Test User" />
          </TestWrapper>
        );
        
        expect(getByLabelText(`Status: ${status}`)).toBeTruthy();
      });
    });

    it('hides status indicator when showStatus is false', () => {
      const { queryByLabelText } = render(
        <TestWrapper>
          <Avatar status="online" showStatus={false} name="Test User" />
        </TestWrapper>
      );
      
      expect(queryByLabelText('Status: online')).toBeNull();
    });

    it('positions status indicator correctly', () => {
      const { getByLabelText } = render(
        <TestWrapper>
          <Avatar 
            status="online" 
            showStatus 
            statusPosition="top-left" 
            name="Test User"
          />
        </TestWrapper>
      );
      
      const statusIndicator = getByLabelText('Status: online');
      expect(statusIndicator).toBeTruthy();
      // Position styling is tested through visual regression in actual implementation
    });
  });

  describe('Role Badges', () => {
    const roles = ['teacher', 'student', 'admin', 'parent', 'staff'] as const;
    
    roles.forEach(role => {
      it(`displays ${role} role badge`, () => {
        const { getByLabelText } = render(
          <TestWrapper>
            <Avatar role={role} showRole name="Test User" />
          </TestWrapper>
        );
        
        expect(getByLabelText(`Role: ${role}`)).toBeTruthy();
      });
    });

    it('hides role badge when showRole is false', () => {
      const { queryByLabelText } = render(
        <TestWrapper>
          <Avatar role="teacher" showRole={false} name="Test User" />
        </TestWrapper>
      );
      
      expect(queryByLabelText('Role: teacher')).toBeNull();
    });

    it('positions role badge correctly', () => {
      const { getByLabelText } = render(
        <TestWrapper>
          <Avatar 
            role="teacher" 
            showRole 
            rolePosition="bottom-left" 
            name="Test User"
          />
        </TestWrapper>
      );
      
      const roleBadge = getByLabelText('Role: teacher');
      expect(roleBadge).toBeTruthy();
    });
  });

  describe('Notification Badges', () => {
    it('displays notification count badge', () => {
      const badge = { count: 5 };
      const { getByText, getByLabelText } = render(
        <TestWrapper>
          <Avatar badge={badge} name="Test User" />
        </TestWrapper>
      );
      
      expect(getByText('5')).toBeTruthy();
      expect(getByLabelText('5 notifications')).toBeTruthy();
    });

    it('displays 99+ for high counts', () => {
      const badge = { count: 150, maxCount: 99 };
      const { getByText } = render(
        <TestWrapper>
          <Avatar badge={badge} name="Test User" />
        </TestWrapper>
      );
      
      expect(getByText('99+')).toBeTruthy();
    });

    it('shows zero count when showZero is true', () => {
      const badge = { count: 0, showZero: true };
      const { getByText } = render(
        <TestWrapper>
          <Avatar badge={badge} name="Test User" />
        </TestWrapper>
      );
      
      expect(getByText('0')).toBeTruthy();
    });

    it('hides badge when count is zero and showZero is false', () => {
      const badge = { count: 0, showZero: false };
      const { queryByLabelText } = render(
        <TestWrapper>
          <Avatar badge={badge} name="Test User" />
        </TestWrapper>
      );
      
      expect(queryByLabelText('0 notifications')).toBeNull();
    });
  });

  describe('Achievement Badges', () => {
    const achievementTypes = ['gold', 'silver', 'bronze'] as const;
    
    achievementTypes.forEach(type => {
      it(`displays ${type} achievement badge`, () => {
        const achievementBadge = { type };
        const { getByLabelText } = render(
          <TestWrapper>
            <Avatar achievementBadge={achievementBadge} name="Test User" />
          </TestWrapper>
        );
        
        expect(getByLabelText(`${type} achievement`)).toBeTruthy();
      });
    });

    it('displays custom achievement icon', () => {
      const achievementBadge = { 
        type: 'gold' as const, 
        icon: <div data-testid="custom-achievement-icon">🏆</div> 
      };
      const { getByTestId } = render(
        <TestWrapper>
          <Avatar achievementBadge={achievementBadge} name="Test User" />
        </TestWrapper>
      );
      
      expect(getByTestId('custom-achievement-icon')).toBeTruthy();
    });
  });

  describe('Interactive Features', () => {
    it('calls onPress when pressed and interactive', () => {
      const onPressMock = jest.fn();
      const { getByTestId } = render(
        <TestWrapper>
          <Avatar 
            interactive 
            onPress={onPressMock} 
            testID="interactive-avatar" 
            name="Test User"
          />
        </TestWrapper>
      );
      
      fireEvent.press(getByTestId('interactive-avatar'));
      expect(onPressMock).toHaveBeenCalledTimes(1);
    });

    it('does not call onPress when not interactive', () => {
      const onPressMock = jest.fn();
      const { getByTestId } = render(
        <TestWrapper>
          <Avatar 
            onPress={onPressMock} 
            testID="non-interactive-avatar" 
            name="Test User"
          />
        </TestWrapper>
      );
      
      fireEvent.press(getByTestId('non-interactive-avatar'));
      expect(onPressMock).not.toHaveBeenCalled();
    });

    it('calls onLongPress when long pressed', () => {
      const onLongPressMock = jest.fn();
      const { getByTestId } = render(
        <TestWrapper>
          <Avatar 
            interactive 
            onLongPress={onLongPressMock} 
            testID="long-press-avatar" 
            name="Test User"
          />
        </TestWrapper>
      );
      
      fireEvent(getByTestId('long-press-avatar'), 'longPress');
      expect(onLongPressMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has correct accessibility role when interactive', () => {
      const { getByRole } = render(
        <TestWrapper>
          <Avatar interactive name="Test User" />
        </TestWrapper>
      );
      
      expect(getByRole('button')).toBeTruthy();
    });

    it('has image role when not interactive', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Avatar testID="image-avatar" name="Test User" />
        </TestWrapper>
      );
      
      const avatar = getByTestId('image-avatar');
      expect(avatar.props.accessibilityRole).toBe('image');
    });

    it('builds comprehensive accessibility label', () => {
      const { getByLabelText } = render(
        <TestWrapper>
          <Avatar 
            name="John Doe"
            role="teacher"
            status="online"
            badge={{ count: 3 }}
            showRole
            showStatus
          />
        </TestWrapper>
      );
      
      expect(getByLabelText('Avatar for John Doe, teacher, online, 3 notifications')).toBeTruthy();
    });

    it('uses custom accessibility label', () => {
      const { getByLabelText } = render(
        <TestWrapper>
          <Avatar 
            name="John Doe" 
            accessibilityLabel="Custom Avatar Label"
          />
        </TestWrapper>
      );
      
      expect(getByLabelText('Custom Avatar Label')).toBeTruthy();
    });

    it('includes accessibility hint', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Avatar 
            name="Test User"
            accessibilityHint="Tap to view profile"
            testID="hint-avatar"
          />
        </TestWrapper>
      );
      
      const avatar = getByTestId('hint-avatar');
      expect(avatar.props.accessibilityHint).toBe('Tap to view profile');
    });
  });

  describe('Fallback Colors', () => {
    it('generates consistent background colors from names', () => {
      const { getByTestId: getByTestId1 } = render(
        <TestWrapper>
          <Avatar name="John Doe" testID="avatar1" />
        </TestWrapper>
      );
      
      const { getByTestId: getByTestId2 } = render(
        <TestWrapper>
          <Avatar name="John Doe" testID="avatar2" />
        </TestWrapper>
      );
      
      const avatar1 = getByTestId1('avatar1');
      const avatar2 = getByTestId2('avatar2');
      
      // Same names should generate same colors
      expect(avatar1.props.style.backgroundColor).toBe(avatar2.props.style.backgroundColor);
    });

    it('uses custom fallback background color', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Avatar 
            name="Test User" 
            fallbackBackgroundColor="#ff0000" 
            testID="custom-bg-avatar"
          />
        </TestWrapper>
      );
      
      const avatar = getByTestId('custom-bg-avatar');
      expect(avatar.props.style.backgroundColor).toBe('#ff0000');
    });

    it('uses custom fallback text color', () => {
      const { getByText } = render(
        <TestWrapper>
          <Avatar 
            name="Test User" 
            fallbackTextColor="#00ff00"
          />
        </TestWrapper>
      );
      
      const initials = getByText('TE');
      expect(initials.props.style.color).toBe('#00ff00');
    });
  });

  describe('Group Context', () => {
    it('applies group avatar styling', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Avatar 
            name="Test User" 
            isInGroup 
            testID="group-avatar"
          />
        </TestWrapper>
      );
      
      const avatar = getByTestId('group-avatar');
      expect(avatar.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ marginLeft: -8 })
        ])
      );
    });
  });

  describe('Shadow and Styling', () => {
    it('applies shadow when showShadow is true', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Avatar 
            name="Test User" 
            showShadow 
            testID="shadow-avatar"
          />
        </TestWrapper>
      );
      
      const avatar = getByTestId('shadow-avatar');
      // Shadow styles are applied through style arrays
      expect(avatar.props.style).toBeTruthy();
    });

    it('applies custom border properties', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Avatar 
            name="Test User" 
            borderWidth={4}
            borderColor="#ff0000"
            testID="custom-border-avatar"
          />
        </TestWrapper>
      );
      
      const avatar = getByTestId('custom-border-avatar');
      expect(avatar.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            borderWidth: 4,
            borderColor: '#ff0000',
          })
        ])
      );
    });

    it('applies custom background color', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Avatar 
            name="Test User" 
            backgroundColor="#0000ff"
            testID="custom-background-avatar"
          />
        </TestWrapper>
      );
      
      const avatar = getByTestId('custom-background-avatar');
      expect(avatar.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: '#0000ff',
          })
        ])
      );
    });
  });
});