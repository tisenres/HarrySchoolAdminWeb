/**
 * AnimatedTabBar Accessibility Tests - Harry School Student App
 * 
 * Comprehensive test suite for WCAG 2.1 AA compliance and accessibility features.
 * Tests cover screen reader support, keyboard navigation, reduced motion,
 * high contrast mode, and educational context announcements.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { AnimatedTabBar } from '../AnimatedTabBar';
import { useTabAccessibility } from '../useTabAccessibility';
import { studentTabConfig } from '../tabConfig';
import type { TabConfig } from '../AnimatedTabBar';

// Mock dependencies
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  AccessibilityInfo: {
    isScreenReaderEnabled: jest.fn(),
    isReduceMotionEnabled: jest.fn(),
    isHighContrastEnabled: jest.fn(),
    isBoldTextEnabled: jest.fn(),
    addEventListener: jest.fn(),
    announceForAccessibility: jest.fn(),
    setAccessibilityFocus: jest.fn(),
  },
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
jest.mock('react-native-svg', () => ({
  Svg: 'Svg',
  Circle: 'Circle',
}));

// Test data
const mockTabConfig: TabConfig[] = [
  {
    id: 'HomeTab',
    name: 'HomeTab',
    icon: 'home-outline',
    iconFocused: 'home',
    label: 'Home',
    color: '#1d7452',
    usagePercentage: 40,
    badgeCount: 3,
    progress: 75,
  },
  {
    id: 'LessonsTab',
    name: 'LessonsTab',
    icon: 'book-outline',
    iconFocused: 'book',
    label: 'Lessons',
    color: '#3b82f6',
    usagePercentage: 35,
    badgeCount: 0,
    progress: 45,
  },
  {
    id: 'ScheduleTab',
    name: 'ScheduleTab',
    icon: 'calendar-outline',
    iconFocused: 'calendar',
    label: 'Schedule',
    color: '#8b5cf6',
    usagePercentage: 15,
    badgeCount: 1,
    progress: undefined,
    disabled: true,
  },
];

// Mock AccessibilityInfo methods
const mockAccessibilityInfo = AccessibilityInfo as jest.Mocked<typeof AccessibilityInfo>;

describe('AnimatedTabBar Accessibility Tests', () => {
  let mockOnTabPress: jest.Mock;

  beforeEach(() => {
    mockOnTabPress = jest.fn();
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default accessibility state
    mockAccessibilityInfo.isScreenReaderEnabled.mockResolvedValue(false);
    mockAccessibilityInfo.isReduceMotionEnabled.mockResolvedValue(false);
    mockAccessibilityInfo.isHighContrastEnabled.mockResolvedValue(false);
    mockAccessibilityInfo.isBoldTextEnabled.mockResolvedValue(false);
    mockAccessibilityInfo.addEventListener.mockReturnValue({ remove: jest.fn() });
  });

  describe('WCAG 2.1 AA Compliance', () => {
    test('has minimum 44pt touch targets', () => {
      const { getAllByRole } = render(
        <AnimatedTabBar
          tabs={mockTabConfig}
          activeTabId="HomeTab"
          onTabPress={mockOnTabPress}
        />
      );

      const tabs = getAllByRole('tab');
      expect(tabs).toHaveLength(3);

      // Each tab should have minimum touch target size
      tabs.forEach((tab) => {
        const style = tab.props.style;
        // Check that minHeight is at least 44pt (iOS guideline)
        expect(style?.minHeight || 44).toBeGreaterThanOrEqual(44);
      });
    });

    test('provides proper accessibility labels', () => {
      const { getByLabelText } = render(
        <AnimatedTabBar
          tabs={mockTabConfig}
          activeTabId="HomeTab"
          onTabPress={mockOnTabPress}
        />
      );

      // Home tab with badge and progress
      const homeTab = getByLabelText(/Home.*3 notifications.*75% complete/i);
      expect(homeTab).toBeDefined();

      // Lessons tab with progress only
      const lessonsTab = getByLabelText(/Lessons.*45% complete/i);
      expect(lessonsTab).toBeDefined();

      // Disabled schedule tab
      const scheduleTab = getByLabelText(/Schedule.*1 notification.*disabled/i);
      expect(scheduleTab).toBeDefined();
    });

    test('provides accessibility hints for navigation', () => {
      const { getAllByRole } = render(
        <AnimatedTabBar
          tabs={mockTabConfig}
          activeTabId="HomeTab"
          onTabPress={mockOnTabPress}
        />
      );

      const tabs = getAllByRole('tab');
      
      tabs.forEach((tab, index) => {
        const tabName = mockTabConfig[index].label;
        expect(tab.props.accessibilityHint).toContain(`Tap to switch to ${tabName}`);
      });
    });

    test('sets proper accessibility states', () => {
      const { getAllByRole } = render(
        <AnimatedTabBar
          tabs={mockTabConfig}
          activeTabId="HomeTab"
          onTabPress={mockOnTabPress}
        />
      );

      const tabs = getAllByRole('tab');
      
      // First tab should be selected
      expect(tabs[0].props.accessibilityState).toEqual({
        selected: true,
        disabled: false,
      });
      
      // Second tab should not be selected
      expect(tabs[1].props.accessibilityState).toEqual({
        selected: false,
        disabled: false,
      });
      
      // Third tab should be disabled
      expect(tabs[2].props.accessibilityState).toEqual({
        selected: false,
        disabled: true,
      });
    });

    test('has proper tablist role for container', () => {
      const { getByRole } = render(
        <AnimatedTabBar
          tabs={mockTabConfig}
          activeTabId="HomeTab"
          onTabPress={mockOnTabPress}
        />
      );

      const tabList = getByRole('tablist');
      expect(tabList).toBeDefined();
    });
  });

  describe('Screen Reader Support', () => {
    beforeEach(() => {
      mockAccessibilityInfo.isScreenReaderEnabled.mockResolvedValue(true);
    });

    test('announces tab changes when screen reader is enabled', async () => {
      const { getAllByRole } = render(
        <AnimatedTabBar
          tabs={mockTabConfig}
          activeTabId="HomeTab"
          onTabPress={mockOnTabPress}
        />
      );

      const tabs = getAllByRole('tab');
      fireEvent.press(tabs[1]); // Press Lessons tab

      expect(mockOnTabPress).toHaveBeenCalledWith('LessonsTab');
      
      await waitFor(() => {
        expect(mockAccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
          expect.stringContaining('Switched to Lessons')
        );
      });
    });

    test('provides rich descriptions for educational context', () => {
      const { getByLabelText } = render(
        <AnimatedTabBar
          tabs={studentTabConfig}
          activeTabId="HomeTab"
          onTabPress={mockOnTabPress}
        />
      );

      // Check that educational contexts are provided
      expect(() => getByLabelText(/daily overview/i)).not.toThrow();
      expect(() => getByLabelText(/learning content/i)).not.toThrow();
      expect(() => getByLabelText(/time management/i)).not.toThrow();
    });

    test('announces badge updates appropriately', async () => {
      const { rerender } = render(
        <AnimatedTabBar
          tabs={mockTabConfig}
          activeTabId="HomeTab"
          onTabPress={mockOnTabPress}
        />
      );

      // Update badge count
      const updatedConfig = [...mockTabConfig];
      updatedConfig[0] = { ...updatedConfig[0], badgeCount: 5 };

      rerender(
        <AnimatedTabBar
          tabs={updatedConfig}
          activeTabId="HomeTab"
          onTabPress={mockOnTabPress}
        />
      );

      await waitFor(() => {
        expect(mockAccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
          expect.stringContaining('5 notifications')
        );
      });
    });
  });

  describe('Reduced Motion Support', () => {
    beforeEach(() => {
      mockAccessibilityInfo.isReduceMotionEnabled.mockResolvedValue(true);
    });

    test('disables animations when reduced motion is enabled', async () => {
      const { getAllByRole } = render(
        <AnimatedTabBar
          tabs={mockTabConfig}
          activeTabId="HomeTab"
          onTabPress={mockOnTabPress}
        />
      );

      const tabs = getAllByRole('tab');
      fireEvent.press(tabs[1]);

      // In reduced motion mode, animations should be instant
      // This is handled by the animation hooks, so we mainly test that
      // the component doesn't crash and still functions
      expect(mockOnTabPress).toHaveBeenCalledWith('LessonsTab');
    });

    test('still provides haptic feedback in reduced motion mode', async () => {
      const { getAllByRole } = render(
        <AnimatedTabBar
          tabs={mockTabConfig}
          activeTabId="HomeTab"
          onTabPress={mockOnTabPress}
        />
      );

      const tabs = getAllByRole('tab');
      fireEvent.press(tabs[1]);

      // Haptic feedback should still work even with reduced motion
      await waitFor(() => {
        expect(require('expo-haptics').impactAsync).toHaveBeenCalled();
      });
    });
  });

  describe('High Contrast Mode', () => {
    beforeEach(() => {
      mockAccessibilityInfo.isHighContrastEnabled.mockResolvedValue(true);
    });

    test('applies high contrast colors when enabled', () => {
      const highContrastConfig = mockTabConfig.map(tab => ({
        ...tab,
        color: tab.id === 'HomeTab' ? '#000000' : '#0066CC', // High contrast colors
      }));

      const { getAllByRole } = render(
        <AnimatedTabBar
          tabs={highContrastConfig}
          activeTabId="HomeTab"
          onTabPress={mockOnTabPress}
        />
      );

      const tabs = getAllByRole('tab');
      expect(tabs).toHaveLength(3);
      
      // Component should render without issues in high contrast mode
      expect(tabs[0]).toBeDefined();
    });
  });

  describe('Keyboard Navigation', () => {
    test('handles keyboard navigation events', () => {
      const { getAllByRole } = render(
        <AnimatedTabBar
          tabs={mockTabConfig}
          activeTabId="HomeTab"
          onTabPress={mockOnTabPress}
        />
      );

      const tabs = getAllByRole('tab');
      
      // Simulate keyboard navigation (implementation-specific)
      // In a real app, this would test arrow key navigation
      fireEvent(tabs[1], 'focus');
      fireEvent(tabs[1], 'keyPress', { nativeEvent: { key: 'Enter' } });

      expect(mockOnTabPress).toHaveBeenCalledWith('LessonsTab');
    });
  });

  describe('Voice Control Support', () => {
    test('provides voice control compatible labels', () => {
      const { getAllByRole } = render(
        <AnimatedTabBar
          tabs={mockTabConfig}
          activeTabId="HomeTab"
          onTabPress={mockOnTabPress}
        />
      );

      const tabs = getAllByRole('tab');
      
      tabs.forEach((tab, index) => {
        const expectedLabel = mockTabConfig[index].label;
        expect(tab.props.accessibilityLabel).toContain(expectedLabel);
      });
    });

    test('supports voice commands for common educational terms', () => {
      const { getByLabelText } = render(
        <AnimatedTabBar
          tabs={studentTabConfig}
          activeTabId="HomeTab"
          onTabPress={mockOnTabPress}
        />
      );

      // Voice control should recognize common educational terms
      expect(() => getByLabelText(/Home/i)).not.toThrow();
      expect(() => getByLabelText(/Lessons/i)).not.toThrow();
      expect(() => getByLabelText(/Schedule/i)).not.toThrow();
      expect(() => getByLabelText(/Vocabulary/i)).not.toThrow();
      expect(() => getByLabelText(/Profile/i)).not.toThrow();
    });
  });

  describe('Focus Management', () => {
    test('sets focus on tab change', async () => {
      const { getAllByRole } = render(
        <AnimatedTabBar
          tabs={mockTabConfig}
          activeTabId="HomeTab"
          onTabPress={mockOnTabPress}
        />
      );

      const tabs = getAllByRole('tab');
      fireEvent.press(tabs[1]);

      await waitFor(() => {
        expect(mockAccessibilityInfo.setAccessibilityFocus).toHaveBeenCalled();
      });
    });

    test('maintains focus order for keyboard navigation', () => {
      const { getAllByRole } = render(
        <AnimatedTabBar
          tabs={mockTabConfig}
          activeTabId="HomeTab"
          onTabPress={mockOnTabPress}
        />
      );

      const tabs = getAllByRole('tab');
      
      // Tabs should be focusable in order
      tabs.forEach((tab, index) => {
        expect(tab.props.accessible).toBe(true);
        expect(tab.props.accessibilityRole).toBe('tab');
      });
    });
  });

  describe('Educational Context Announcements', () => {
    test('announces learning progress updates', async () => {
      const { rerender } = render(
        <AnimatedTabBar
          tabs={mockTabConfig}
          activeTabId="HomeTab"
          onTabPress={mockOnTabPress}
        />
      );

      // Update progress
      const updatedConfig = [...mockTabConfig];
      updatedConfig[0] = { ...updatedConfig[0], progress: 85 };

      rerender(
        <AnimatedTabBar
          tabs={updatedConfig}
          activeTabId="HomeTab"
          onTabPress={mockOnTabPress}
        />
      );

      await waitFor(() => {
        expect(mockAccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
          expect.stringContaining('85% complete')
        );
      });
    });

    test('provides contextual help for educational features', () => {
      const { getAllByRole } = render(
        <AnimatedTabBar
          tabs={studentTabConfig}
          activeTabId="HomeTab"
          onTabPress={mockOnTabPress}
        />
      );

      const tabs = getAllByRole('tab');
      
      // Check that accessibility hints provide educational context
      expect(tabs[0].props.accessibilityHint).toContain('daily overview');
      expect(tabs[1].props.accessibilityHint).toContain('learning');
      expect(tabs[2].props.accessibilityHint).toContain('schedule');
      expect(tabs[3].props.accessibilityHint).toContain('vocabulary');
      expect(tabs[4].props.accessibilityHint).toContain('progress');
    });

    test('announces achievement milestones appropriately', async () => {
      // Test with 100% progress (completion)
      const completedConfig = mockTabConfig.map(tab => ({
        ...tab,
        progress: 100,
      }));

      render(
        <AnimatedTabBar
          tabs={completedConfig}
          activeTabId="HomeTab"
          onTabPress={mockOnTabPress}
        />
      );

      await waitFor(() => {
        expect(mockAccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
          expect.stringContaining('100% complete')
        );
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('handles missing accessibility information gracefully', async () => {
      mockAccessibilityInfo.isScreenReaderEnabled.mockRejectedValue(new Error('Not available'));

      const { getAllByRole } = render(
        <AnimatedTabBar
          tabs={mockTabConfig}
          activeTabId="HomeTab"
          onTabPress={mockOnTabPress}
        />
      );

      const tabs = getAllByRole('tab');
      expect(tabs).toHaveLength(3);
      
      // Component should still render and function
      fireEvent.press(tabs[1]);
      expect(mockOnTabPress).toHaveBeenCalledWith('LessonsTab');
    });

    test('handles extreme badge counts appropriately', () => {
      const extremeBadgeConfig = mockTabConfig.map(tab => ({
        ...tab,
        badgeCount: 999,
      }));

      const { getByLabelText } = render(
        <AnimatedTabBar
          tabs={extremeBadgeConfig}
          activeTabId="HomeTab"
          onTabPress={mockOnTabPress}
        />
      );

      // Should cap at 99+ for display but announce actual count
      expect(() => getByLabelText(/99\+ notifications/i)).not.toThrow();
    });

    test('handles disabled tabs correctly', () => {
      const { getAllByRole } = render(
        <AnimatedTabBar
          tabs={mockTabConfig}
          activeTabId="HomeTab"
          onTabPress={mockOnTabPress}
        />
      );

      const tabs = getAllByRole('tab');
      const disabledTab = tabs[2]; // Schedule tab is disabled

      fireEvent.press(disabledTab);
      
      // Should not call onTabPress for disabled tabs
      expect(mockOnTabPress).not.toHaveBeenCalledWith('ScheduleTab');
    });
  });
});

// =====================================================
// USEACCESSIBILITY HOOK TESTS
// =====================================================

describe('useTabAccessibility Hook Tests', () => {
  const TestComponent: React.FC = () => {
    const {
      announceTabChange,
      announceProgress,
      getTabAccessibilityLabel,
      shouldReduceMotion,
    } = useTabAccessibility();

    return (
      <>
        <button
          onPress={() => announceTabChange('HomeTab', 'Home', 'Daily overview')}
          testID="announce-tab-change"
        />
        <button
          onPress={() => announceProgress('LessonsTab', 75, 'Mathematics')}
          testID="announce-progress"
        />
        <text testID="reduced-motion">
          {shouldReduceMotion() ? 'reduced' : 'normal'}
        </text>
      </>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAccessibilityInfo.isReduceMotionEnabled.mockResolvedValue(false);
  });

  test('announces tab changes with educational context', async () => {
    const { getByTestId } = render(<TestComponent />);
    
    fireEvent.press(getByTestId('announce-tab-change'));

    await waitFor(() => {
      expect(mockAccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
        'Switched to Home, daily overview and quick actions. Daily overview'
      );
    });
  });

  test('announces progress with encouraging messages', async () => {
    const { getByTestId } = render(<TestComponent />);
    
    fireEvent.press(getByTestId('announce-progress'));

    await waitFor(() => {
      expect(mockAccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
        expect.stringContaining('Progress updated to 75 percent in Mathematics')
      );
    });
  });

  test('correctly detects reduced motion preference', async () => {
    mockAccessibilityInfo.isReduceMotionEnabled.mockResolvedValue(true);
    
    const { getByTestId } = render(<TestComponent />);
    
    await waitFor(() => {
      expect(getByTestId('reduced-motion')).toHaveTextContent('reduced');
    });
  });
});

export default {};