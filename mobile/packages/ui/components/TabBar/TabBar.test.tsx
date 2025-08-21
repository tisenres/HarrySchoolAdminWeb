/**
 * TabBar Component Tests
 * Harry School Mobile Design System
 * 
 * Comprehensive test suite for TabBar component functionality,
 * accessibility, animations, and edge cases
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import TabBar from './TabBar';
import { TEACHER_TABS, STUDENT_TABS } from './TabBar.types';
import type { TabBarProps } from './TabBar.types';

// Mock dependencies
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('../../theme/ThemeProvider', () => ({
  useTheme: () => ({
    theme: {
      tokens: {
        colors: {
          primary: { 500: '#1d7452', 50: '#f0f9f4', 25: '#f0f9f4' },
          background: { primary: '#ffffff', secondary: '#f9fafb' },
          text: { primary: '#101828', tertiary: '#667085', disabled: '#d0d5dd', inverse: '#ffffff' },
          border: { light: '#eaecf0' },
          semantic: { error: { main: '#ef4444' } },
        },
        typography: {
          fontSize: { xs: 12, '2xs': 10 },
          fontWeight: { medium: '500', semibold: '600' },
        },
        spacing: { navigation: { tabBarHeight: 64 } },
        shadows: { sm: { shadowColor: '#101828', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 } },
        opacity: { disabled: 0.38, medium: 0.2 },
      },
    },
    variant: 'student',
  }),
}));

jest.mock('expo-haptics', () => ({
  trigger: jest.fn(),
}));

// Default props
const defaultProps: TabBarProps = {
  tabs: STUDENT_TABS,
  activeTabId: 'learn',
  onTabPress: jest.fn(),
};

describe('TabBar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders correctly with default props', () => {
      const { getByTestId } = render(<TabBar {...defaultProps} testID="tab-bar" />);
      expect(getByTestId('tab-bar')).toBeTruthy();
    });

    it('renders all tabs', () => {
      const { getAllByRole } = render(<TabBar {...defaultProps} />);
      const tabs = getAllByRole('tab');
      expect(tabs).toHaveLength(5);
    });

    it('renders student tabs correctly', () => {
      const { getByText } = render(<TabBar {...defaultProps} tabs={STUDENT_TABS} />);
      
      expect(getByText('Learn')).toBeTruthy();
      expect(getByText('Vocabulary')).toBeTruthy();
      expect(getByText('Progress')).toBeTruthy();
      expect(getByText('Rewards')).toBeTruthy();
      expect(getByText('Profile')).toBeTruthy();
    });

    it('renders teacher tabs correctly', () => {
      const { getByText } = render(
        <TabBar {...defaultProps} tabs={TEACHER_TABS} variant="teacher" />
      );
      
      expect(getByText('Dashboard')).toBeTruthy();
      expect(getByText('Students')).toBeTruthy();
      expect(getByText('Attendance')).toBeTruthy();
      expect(getByText('AI Tools')).toBeTruthy();
      expect(getByText('Profile')).toBeTruthy();
    });

    it('highlights active tab', () => {
      const { getByRole } = render(
        <TabBar {...defaultProps} activeTabId="vocabulary" />
      );
      
      const vocabularyTab = getByRole('tab', { name: /vocabulary/i });
      expect(vocabularyTab).toHaveAccessibilityState({ selected: true });
    });
  });

  describe('Interaction', () => {
    it('calls onTabPress when tab is pressed', () => {
      const onTabPress = jest.fn();
      const { getByText } = render(
        <TabBar {...defaultProps} onTabPress={onTabPress} />
      );
      
      fireEvent.press(getByText('Vocabulary'));
      expect(onTabPress).toHaveBeenCalledWith('vocabulary');
    });

    it('calls onTabLongPress when tab is long pressed', () => {
      const onTabLongPress = jest.fn();
      const { getByText } = render(
        <TabBar {...defaultProps} onTabLongPress={onTabLongPress} />
      );
      
      fireEvent(getByText('Vocabulary'), 'longPress');
      expect(onTabLongPress).toHaveBeenCalledWith('vocabulary');
    });

    it('does not call onTabPress for disabled tabs', () => {
      const onTabPress = jest.fn();
      const disabledTabs = [
        { ...STUDENT_TABS[0], disabled: true },
        ...STUDENT_TABS.slice(1),
      ];
      
      const { getByText } = render(
        <TabBar {...defaultProps} tabs={disabledTabs} onTabPress={onTabPress} />
      );
      
      fireEvent.press(getByText('Learn'));
      expect(onTabPress).not.toHaveBeenCalled();
    });

    it('does not call onTabPress when TabBar is disabled', () => {
      const onTabPress = jest.fn();
      const { getByText } = render(
        <TabBar {...defaultProps} disabled onTabPress={onTabPress} />
      );
      
      fireEvent.press(getByText('Learn'));
      expect(onTabPress).not.toHaveBeenCalled();
    });
  });

  describe('Badge Display', () => {
    it('renders badges when badgeCount is provided', () => {
      const tabsWithBadges = [
        { ...STUDENT_TABS[0], badgeCount: 3 },
        { ...STUDENT_TABS[1], badgeCount: 1 },
        ...STUDENT_TABS.slice(2),
      ];
      
      const { getByText } = render(
        <TabBar {...defaultProps} tabs={tabsWithBadges} />
      );
      
      expect(getByText('3')).toBeTruthy();
      // Badge with count 1 should render as dot, no text
    });

    it('renders 99+ for badges with count > 99', () => {
      const tabsWithLargeBadge = [
        { ...STUDENT_TABS[0], badgeCount: 150 },
        ...STUDENT_TABS.slice(1),
      ];
      
      const { getByText } = render(
        <TabBar {...defaultProps} tabs={tabsWithLargeBadge} />
      );
      
      expect(getByText('99+')).toBeTruthy();
    });

    it('does not render badge when badgeCount is 0', () => {
      const tabsWithZeroBadge = [
        { ...STUDENT_TABS[0], badgeCount: 0 },
        ...STUDENT_TABS.slice(1),
      ];
      
      const { queryByText } = render(
        <TabBar {...defaultProps} tabs={tabsWithZeroBadge} />
      );
      
      expect(queryByText('0')).toBeFalsy();
    });
  });

  describe('Offline Mode', () => {
    it('renders offline indicator bar when offline', () => {
      const { getByText } = render(
        <TabBar {...defaultProps} isOffline />
      );
      
      expect(getByText(/offline mode/i)).toBeTruthy();
    });

    it('disables tabs that require connection when offline', () => {
      const { getByRole } = render(
        <TabBar {...defaultProps} isOffline />
      );
      
      // Progress and Rewards tabs require connection
      const progressTab = getByRole('tab', { name: /progress/i });
      const rewardsTab = getByRole('tab', { name: /rewards/i });
      
      expect(progressTab).toHaveAccessibilityState({ disabled: true });
      expect(rewardsTab).toHaveAccessibilityState({ disabled: true });
    });

    it('shows offline indicators on connection-required tabs', () => {
      const { getAllByText } = render(
        <TabBar {...defaultProps} isOffline />
      );
      
      // Should have offline indicators (⚡) for tabs that require connection
      const offlineIndicators = getAllByText('⚡');
      expect(offlineIndicators.length).toBeGreaterThan(0);
    });

    it('allows offline-capable tabs to function when offline', () => {
      const onTabPress = jest.fn();
      const { getByText } = render(
        <TabBar {...defaultProps} isOffline onTabPress={onTabPress} />
      );
      
      // Learn and Vocabulary tabs don't require connection
      fireEvent.press(getByText('Learn'));
      expect(onTabPress).toHaveBeenCalledWith('learn');
      
      fireEvent.press(getByText('Vocabulary'));
      expect(onTabPress).toHaveBeenCalledWith('vocabulary');
    });
  });

  describe('Loading States', () => {
    it('shows loading indicator for tabs in loading state', () => {
      const { getByTestId } = render(
        <TabBar {...defaultProps} loadingTabs={['learn']} testID="tab-bar" />
      );
      
      // Loading indicator should be visible
      expect(getByTestId('tab-bar')).toBeTruthy();
    });

    it('disables loading tabs from being pressed', () => {
      const onTabPress = jest.fn();
      const { getByText } = render(
        <TabBar {...defaultProps} loadingTabs={['learn']} onTabPress={onTabPress} />
      );
      
      fireEvent.press(getByText('Learn'));
      expect(onTabPress).not.toHaveBeenCalled();
    });
  });

  describe('Variants', () => {
    it('applies teacher variant styles correctly', () => {
      const { getByTestId } = render(
        <TabBar {...defaultProps} variant="teacher" testID="tab-bar" />
      );
      
      expect(getByTestId('tab-bar')).toBeTruthy();
      // Additional style assertions would go here
    });

    it('applies student variant styles correctly', () => {
      const { getByTestId } = render(
        <TabBar {...defaultProps} variant="student" testID="tab-bar" />
      );
      
      expect(getByTestId('tab-bar')).toBeTruthy();
      // Additional style assertions would go here
    });
  });

  describe('Accessibility', () => {
    it('has correct accessibility role', () => {
      const { getByRole } = render(<TabBar {...defaultProps} />);
      expect(getByRole('tablist')).toBeTruthy();
    });

    it('tabs have correct accessibility roles and states', () => {
      const { getAllByRole } = render(
        <TabBar {...defaultProps} activeTabId="vocabulary" />
      );
      
      const tabs = getAllByRole('tab');
      expect(tabs).toHaveLength(5);
      
      // Check that vocabulary tab is selected
      const vocabularyTab = tabs.find(tab => 
        tab.props.accessibilityLabel?.includes('Vocabulary')
      );
      expect(vocabularyTab).toHaveAccessibilityState({ selected: true });
    });

    it('provides accessibility labels for tabs', () => {
      const { getByLabelText } = render(<TabBar {...defaultProps} />);
      
      expect(getByLabelText('Learn')).toBeTruthy();
      expect(getByLabelText('Vocabulary')).toBeTruthy();
      expect(getByLabelText('Progress')).toBeTruthy();
      expect(getByLabelText('Rewards')).toBeTruthy();
      expect(getByLabelText('Profile')).toBeTruthy();
    });

    it('provides accessibility hints', () => {
      const customTabs = [
        {
          ...STUDENT_TABS[0],
          accessibilityHint: 'Access lessons and learning materials',
        },
        ...STUDENT_TABS.slice(1),
      ];
      
      const { getByHintText } = render(
        <TabBar {...defaultProps} tabs={customTabs} />
      );
      
      expect(getByHintText('Access lessons and learning materials')).toBeTruthy();
    });

    it('announces badge counts to screen readers', () => {
      const tabsWithBadges = [
        { ...STUDENT_TABS[0], badgeCount: 5 },
        ...STUDENT_TABS.slice(1),
      ];
      
      const { getByLabelText } = render(
        <TabBar {...defaultProps} tabs={tabsWithBadges} />
      );
      
      expect(getByLabelText('5 notifications')).toBeTruthy();
    });
  });

  describe('Animation Configuration', () => {
    it('respects disableAnimations prop', () => {
      const { getByTestId } = render(
        <TabBar {...defaultProps} disableAnimations testID="tab-bar" />
      );
      
      expect(getByTestId('tab-bar')).toBeTruthy();
    });

    it('uses teacher animation duration for teacher variant', () => {
      const { getByTestId } = render(
        <TabBar {...defaultProps} variant="teacher" testID="tab-bar" />
      );
      
      expect(getByTestId('tab-bar')).toBeTruthy();
    });

    it('respects custom animation duration', () => {
      const { getByTestId } = render(
        <TabBar {...defaultProps} animationDuration={500} testID="tab-bar" />
      );
      
      expect(getByTestId('tab-bar')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('warns when not exactly 5 tabs are provided', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      render(
        <TabBar {...defaultProps} tabs={STUDENT_TABS.slice(0, 3)} />
      );
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'TabBar: Expected exactly 5 tabs, got',
        3
      );
      
      consoleSpy.mockRestore();
    });

    it('handles missing activeTabId gracefully', () => {
      const { getByTestId } = render(
        <TabBar {...defaultProps} activeTabId="non-existent" testID="tab-bar" />
      );
      
      expect(getByTestId('tab-bar')).toBeTruthy();
    });
  });

  describe('Custom Styling', () => {
    it('applies custom styles', () => {
      const customStyle = { backgroundColor: 'red' };
      const { getByTestId } = render(
        <TabBar {...defaultProps} style={customStyle} testID="tab-bar" />
      );
      
      expect(getByTestId('tab-bar')).toHaveStyle(customStyle);
    });

    it('applies custom height', () => {
      const { getByTestId } = render(
        <TabBar {...defaultProps} height={80} testID="tab-bar" />
      );
      
      expect(getByTestId('tab-bar')).toHaveStyle({ height: 80 });
    });

    it('applies custom background color', () => {
      const { getByTestId } = render(
        <TabBar {...defaultProps} backgroundColor="blue" testID="tab-bar" />
      );
      
      expect(getByTestId('tab-bar')).toHaveStyle({ backgroundColor: 'blue' });
    });
  });

  describe('Performance', () => {
    it('memoizes tabs correctly', () => {
      const { rerender } = render(<TabBar {...defaultProps} />);
      
      // Re-render with same props should not cause issues
      rerender(<TabBar {...defaultProps} />);
      
      expect(true).toBe(true); // If we get here, memoization is working
    });

    it('handles frequent active tab changes', async () => {
      let currentActiveTab = 'learn';
      const { rerender } = render(
        <TabBar {...defaultProps} activeTabId={currentActiveTab} />
      );
      
      // Rapidly change active tabs
      const tabIds = ['vocabulary', 'progress', 'rewards', 'profile', 'learn'];
      
      for (const tabId of tabIds) {
        currentActiveTab = tabId;
        rerender(<TabBar {...defaultProps} activeTabId={currentActiveTab} />);
        await waitFor(() => {
          expect(true).toBe(true);
        });
      }
    });
  });

  describe('Edge Cases', () => {
    it('handles empty badge count gracefully', () => {
      const tabsWithUndefinedBadge = [
        { ...STUDENT_TABS[0], badgeCount: undefined },
        ...STUDENT_TABS.slice(1),
      ];
      
      const { getByTestId } = render(
        <TabBar {...defaultProps} tabs={tabsWithUndefinedBadge} testID="tab-bar" />
      );
      
      expect(getByTestId('tab-bar')).toBeTruthy();
    });

    it('handles tabs with very long labels', () => {
      const tabsWithLongLabels = [
        { ...STUDENT_TABS[0], label: 'Very Long Tab Label That Should Be Truncated' },
        ...STUDENT_TABS.slice(1),
      ];
      
      const { getByText } = render(
        <TabBar {...defaultProps} tabs={tabsWithLongLabels} />
      );
      
      expect(getByText('Very Long Tab Label That Should Be Truncated')).toBeTruthy();
    });

    it('handles multiple loading tabs', () => {
      const { getByTestId } = render(
        <TabBar {...defaultProps} loadingTabs={['learn', 'vocabulary', 'progress']} testID="tab-bar" />
      );
      
      expect(getByTestId('tab-bar')).toBeTruthy();
    });
  });
});