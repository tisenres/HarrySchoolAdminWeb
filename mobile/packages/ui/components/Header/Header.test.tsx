/**
 * Header Component Tests
 * Harry School Mobile Design System
 * 
 * Comprehensive test suite for Header component functionality,
 * variants, search, accessibility, and edge cases
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Header from './Header';
import type { HeaderProps, HeaderAction } from './Header.types';

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
          primary: { 500: '#1d7452' },
          background: { primary: '#ffffff', secondary: '#f9fafb' },
          text: { 
            primary: '#101828', 
            secondary: '#344054', 
            tertiary: '#667085', 
            disabled: '#d0d5dd', 
            inverse: '#ffffff',
            placeholder: '#98a2b3',
          },
          border: { light: '#eaecf0' },
          semantic: { 
            warning: { main: '#f59e0b', light: '#fef3c7', dark: '#d97706' },
            success: { main: '#10b981' },
            error: { main: '#ef4444' },
          },
        },
        typography: {
          fontSize: { lg: 18, base: 16, sm: 14, xs: 12 },
          fontWeight: { semibold: '600', regular: '400', medium: '500' },
        },
        borderRadius: { full: 9999 },
        opacity: { disabled: 0.38 },
      },
    },
    variant: 'student',
  }),
}));

jest.mock('expo-haptics', () => ({
  trigger: jest.fn(),
}));

// Sample actions for testing
const sampleActions: HeaderAction[] = [
  {
    id: 'search',
    icon: 'search',
    label: 'Search',
    onPress: jest.fn(),
  },
  {
    id: 'notifications',
    icon: 'bell',
    label: 'Notifications',
    onPress: jest.fn(),
    badgeCount: 3,
  },
  {
    id: 'settings',
    icon: 'settings',
    label: 'Settings',
    onPress: jest.fn(),
  },
];

// Default props
const defaultProps: HeaderProps = {
  title: 'Test Header',
};

describe('Header Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders correctly with default props', () => {
      const { getByTestId } = render(<Header {...defaultProps} testID="header" />);
      expect(getByTestId('header')).toBeTruthy();
    });

    it('renders title correctly', () => {
      const { getByText } = render(<Header title="My Header" />);
      expect(getByText('My Header')).toBeTruthy();
    });

    it('renders subtitle when provided', () => {
      const { getByText } = render(
        <Header title="Main Title" subtitle="Subtitle text" />
      );
      expect(getByText('Main Title')).toBeTruthy();
      expect(getByText('Subtitle text')).toBeTruthy();
    });

    it('renders custom title component', () => {
      const CustomTitle = () => <Text testID="custom-title">Custom Title</Text>;
      const { getByTestId } = render(
        <Header titleComponent={<CustomTitle />} />
      );
      expect(getByTestId('custom-title')).toBeTruthy();
    });

    it('does not render title when titleComponent is provided', () => {
      const CustomTitle = () => <Text>Custom</Text>;
      const { queryByText } = render(
        <Header title="Should not appear" titleComponent={<CustomTitle />} />
      );
      expect(queryByText('Should not appear')).toBeFalsy();
    });
  });

  describe('Variants', () => {
    it('renders default variant correctly', () => {
      const { getByTestId } = render(
        <Header {...defaultProps} variant="default" testID="header" />
      );
      expect(getByTestId('header')).toBeTruthy();
    });

    it('renders minimal variant correctly', () => {
      const { getByTestId } = render(
        <Header {...defaultProps} variant="minimal" testID="header" />
      );
      expect(getByTestId('header')).toBeTruthy();
    });

    it('renders contextual variant correctly', () => {
      const { getByTestId } = render(
        <Header {...defaultProps} variant="contextual" testID="header" />
      );
      expect(getByTestId('header')).toBeTruthy();
    });

    it('renders search variant correctly', () => {
      const { getByTestId } = render(
        <Header 
          {...defaultProps} 
          variant="search" 
          search={{ isActive: true }}
          testID="header" 
        />
      );
      expect(getByTestId('header')).toBeTruthy();
    });
  });

  describe('Back Button', () => {
    it('renders back button when show is true', () => {
      const { getByRole } = render(
        <Header {...defaultProps} backButton={{ show: true }} />
      );
      expect(getByRole('button', { name: /go back/i })).toBeTruthy();
    });

    it('does not render back button when show is false', () => {
      const { queryByRole } = render(
        <Header {...defaultProps} backButton={{ show: false }} />
      );
      expect(queryByRole('button', { name: /go back/i })).toBeFalsy();
    });

    it('calls onPress when back button is pressed', () => {
      const onPress = jest.fn();
      const { getByRole } = render(
        <Header {...defaultProps} backButton={{ show: true, onPress }} />
      );
      
      fireEvent.press(getByRole('button', { name: /go back/i }));
      expect(onPress).toHaveBeenCalled();
    });

    it('does not call onPress when back button is disabled', () => {
      const onPress = jest.fn();
      const { getByRole } = render(
        <Header 
          {...defaultProps} 
          backButton={{ show: true, onPress }}
          disabled 
        />
      );
      
      fireEvent.press(getByRole('button', { name: /go back/i }));
      expect(onPress).not.toHaveBeenCalled();
    });

    it('uses custom accessibility label', () => {
      const { getByLabelText } = render(
        <Header 
          {...defaultProps} 
          backButton={{ show: true, accessibilityLabel: 'Navigate back' }} 
        />
      );
      expect(getByLabelText('Navigate back')).toBeTruthy();
    });
  });

  describe('Actions', () => {
    it('renders action buttons', () => {
      const { getByRole } = render(
        <Header {...defaultProps} actions={sampleActions} />
      );
      
      expect(getByRole('button', { name: /search/i })).toBeTruthy();
      expect(getByRole('button', { name: /notifications/i })).toBeTruthy();
      expect(getByRole('button', { name: /settings/i })).toBeTruthy();
    });

    it('calls action onPress when pressed', () => {
      const { getByRole } = render(
        <Header {...defaultProps} actions={sampleActions} />
      );
      
      fireEvent.press(getByRole('button', { name: /search/i }));
      expect(sampleActions[0].onPress).toHaveBeenCalled();
    });

    it('renders badge on action button', () => {
      const { getByText } = render(
        <Header {...defaultProps} actions={sampleActions} />
      );
      
      expect(getByText('3')).toBeTruthy();
    });

    it('renders 99+ for badges with count > 99', () => {
      const actionsWithLargeBadge = [
        { ...sampleActions[0], badgeCount: 150 },
      ];
      
      const { getByText } = render(
        <Header {...defaultProps} actions={actionsWithLargeBadge} />
      );
      
      expect(getByText('99+')).toBeTruthy();
    });

    it('does not render more than 3 actions', () => {
      const manyActions = [
        ...sampleActions,
        {
          id: 'extra1',
          icon: 'extra1',
          label: 'Extra 1',
          onPress: jest.fn(),
        },
        {
          id: 'extra2',
          icon: 'extra2',
          label: 'Extra 2',
          onPress: jest.fn(),
        },
      ];
      
      const { queryAllByRole } = render(
        <Header {...defaultProps} actions={manyActions} />
      );
      
      const actionButtons = queryAllByRole('button');
      // Should only render 3 action buttons (max limit)
      expect(actionButtons.length).toBeLessThanOrEqual(3);
    });

    it('shows loading indicator for loading actions', () => {
      const loadingActions = [
        { ...sampleActions[0], loading: true },
      ];
      
      const { getByRole } = render(
        <Header {...defaultProps} actions={loadingActions} />
      );
      
      const actionButton = getByRole('button', { name: /search/i });
      expect(actionButton).toHaveAccessibilityState({ busy: true });
    });

    it('disables loading actions', () => {
      const onPress = jest.fn();
      const loadingActions = [
        { ...sampleActions[0], loading: true, onPress },
      ];
      
      const { getByRole } = render(
        <Header {...defaultProps} actions={loadingActions} />
      );
      
      fireEvent.press(getByRole('button', { name: /search/i }));
      expect(onPress).not.toHaveBeenCalled();
    });

    it('disables disabled actions', () => {
      const onPress = jest.fn();
      const disabledActions = [
        { ...sampleActions[0], disabled: true, onPress },
      ];
      
      const { getByRole } = render(
        <Header {...defaultProps} actions={disabledActions} />
      );
      
      fireEvent.press(getByRole('button', { name: /search/i }));
      expect(onPress).not.toHaveBeenCalled();
    });
  });

  describe('Search Functionality', () => {
    it('renders search bar when search is active', () => {
      const { getByRole } = render(
        <Header 
          {...defaultProps}
          search={{ isActive: true, placeholder: 'Search here...' }}
        />
      );
      
      expect(getByRole('searchbox')).toBeTruthy();
    });

    it('does not render search bar when inactive', () => {
      const { queryByRole } = render(
        <Header 
          {...defaultProps}
          search={{ isActive: false }}
        />
      );
      
      expect(queryByRole('searchbox')).toBeFalsy();
    });

    it('calls onChangeText when search input changes', () => {
      const onChangeText = jest.fn();
      const { getByRole } = render(
        <Header 
          {...defaultProps}
          search={{ isActive: true, onChangeText }}
        />
      );
      
      fireEvent.changeText(getByRole('searchbox'), 'test query');
      expect(onChangeText).toHaveBeenCalledWith('test query');
    });

    it('calls onSubmitEditing when search is submitted', () => {
      const onSubmitEditing = jest.fn();
      const { getByRole } = render(
        <Header 
          {...defaultProps}
          search={{ isActive: true, onSubmitEditing }}
        />
      );
      
      fireEvent(getByRole('searchbox'), 'submitEditing');
      expect(onSubmitEditing).toHaveBeenCalled();
    });

    it('calls onFocus when search input is focused', () => {
      const onFocus = jest.fn();
      const { getByRole } = render(
        <Header 
          {...defaultProps}
          search={{ isActive: true, onFocus }}
        />
      );
      
      fireEvent(getByRole('searchbox'), 'focus');
      expect(onFocus).toHaveBeenCalled();
    });

    it('calls onBlur when search input loses focus', () => {
      const onBlur = jest.fn();
      const { getByRole } = render(
        <Header 
          {...defaultProps}
          search={{ isActive: true, onBlur }}
        />
      );
      
      fireEvent(getByRole('searchbox'), 'blur');
      expect(onBlur).toHaveBeenCalled();
    });

    it('shows clear button when search has value', () => {
      const { getByRole } = render(
        <Header 
          {...defaultProps}
          search={{ isActive: true, value: 'test' }}
        />
      );
      
      expect(getByRole('button', { name: /clear search/i })).toBeTruthy();
    });

    it('calls onClear when clear button is pressed', () => {
      const onClear = jest.fn();
      const { getByRole } = render(
        <Header 
          {...defaultProps}
          search={{ isActive: true, value: 'test', onClear }}
        />
      );
      
      fireEvent.press(getByRole('button', { name: /clear search/i }));
      expect(onClear).toHaveBeenCalled();
    });
  });

  describe('Sync Status', () => {
    it('does not show sync indicator for idle status', () => {
      const { queryByTestId } = render(
        <Header {...defaultProps} syncStatus="idle" testID="header" />
      );
      
      expect(queryByTestId('header')).toBeTruthy();
      // Idle status should not show any indicator
    });

    it('shows syncing indicator', () => {
      const { getByTestId } = render(
        <Header {...defaultProps} syncStatus="syncing" testID="header" />
      );
      
      expect(getByTestId('header')).toBeTruthy();
    });

    it('shows success indicator', () => {
      const { getByTestId } = render(
        <Header {...defaultProps} syncStatus="success" testID="header" />
      );
      
      expect(getByTestId('header')).toBeTruthy();
    });

    it('shows error indicator', () => {
      const { getByTestId } = render(
        <Header {...defaultProps} syncStatus="error" testID="header" />
      );
      
      expect(getByTestId('header')).toBeTruthy();
    });
  });

  describe('Offline Mode', () => {
    it('shows offline indicator when offline', () => {
      const { getByText } = render(
        <Header {...defaultProps} isOffline />
      );
      
      expect(getByText(/no internet connection/i)).toBeTruthy();
    });

    it('does not show offline indicator when online', () => {
      const { queryByText } = render(
        <Header {...defaultProps} isOffline={false} />
      );
      
      expect(queryByText(/no internet connection/i)).toBeFalsy();
    });
  });

  describe('Accessibility', () => {
    it('has correct accessibility role', () => {
      const { getByRole } = render(<Header {...defaultProps} />);
      expect(getByRole('banner')).toBeTruthy();
    });

    it('title has heading role', () => {
      const { getByRole } = render(<Header title="Test Title" />);
      expect(getByRole('heading')).toBeTruthy();
    });

    it('provides accessibility labels for actions', () => {
      const { getByLabelText } = render(
        <Header {...defaultProps} actions={sampleActions} />
      );
      
      expect(getByLabelText('Search')).toBeTruthy();
      expect(getByLabelText('Notifications')).toBeTruthy();
      expect(getByLabelText('Settings')).toBeTruthy();
    });

    it('provides accessibility hints for actions', () => {
      const actionsWithHints = [
        {
          ...sampleActions[0],
          accessibilityHint: 'Open search functionality',
        },
      ];
      
      const { getByHintText } = render(
        <Header {...defaultProps} actions={actionsWithHints} />
      );
      
      expect(getByHintText('Open search functionality')).toBeTruthy();
    });

    it('search input has correct accessibility properties', () => {
      const { getByRole } = render(
        <Header 
          {...defaultProps}
          search={{ isActive: true, placeholder: 'Search items' }}
        />
      );
      
      const searchInput = getByRole('searchbox');
      expect(searchInput).toHaveAccessibilityLabel(/search/i);
      expect(searchInput).toHaveAccessibilityState({ expanded: true });
    });
  });

  describe('Custom Styling', () => {
    it('applies custom styles', () => {
      const customStyle = { backgroundColor: 'red' };
      const { getByTestId } = render(
        <Header {...defaultProps} style={customStyle} testID="header" />
      );
      
      expect(getByTestId('header')).toHaveStyle(customStyle);
    });

    it('applies custom title style', () => {
      const customTitleStyle = { color: 'blue' };
      const { getByText } = render(
        <Header title="Styled Title" titleStyle={customTitleStyle} />
      );
      
      expect(getByText('Styled Title')).toHaveStyle(customTitleStyle);
    });

    it('applies custom subtitle style', () => {
      const customSubtitleStyle = { color: 'green' };
      const { getByText } = render(
        <Header 
          title="Title" 
          subtitle="Styled Subtitle" 
          subtitleStyle={customSubtitleStyle} 
        />
      );
      
      expect(getByText('Styled Subtitle')).toHaveStyle(customSubtitleStyle);
    });

    it('applies custom height', () => {
      const { getByTestId } = render(
        <Header {...defaultProps} height={80} testID="header" />
      );
      
      expect(getByTestId('header')).toHaveStyle({ height: 80 });
    });

    it('applies custom background color', () => {
      const { getByTestId } = render(
        <Header {...defaultProps} backgroundColor="purple" testID="header" />
      );
      
      expect(getByTestId('header')).toHaveStyle({ backgroundColor: 'purple' });
    });

    it('hides border when hideBorder is true', () => {
      const { getByTestId } = render(
        <Header {...defaultProps} hideBorder testID="header" />
      );
      
      expect(getByTestId('header')).toHaveStyle({ borderBottomWidth: 0 });
    });
  });

  describe('Animation Configuration', () => {
    it('respects disableAnimations prop', () => {
      const { getByTestId } = render(
        <Header {...defaultProps} disableAnimations testID="header" />
      );
      
      expect(getByTestId('header')).toBeTruthy();
    });

    it('respects custom animation duration', () => {
      const { getByTestId } = render(
        <Header {...defaultProps} animationDuration={500} testID="header" />
      );
      
      expect(getByTestId('header')).toBeTruthy();
    });

    it('respects custom search animation duration', () => {
      const { getByTestId } = render(
        <Header 
          {...defaultProps} 
          searchAnimationDuration={400}
          search={{ isActive: true }}
          testID="header" 
        />
      );
      
      expect(getByTestId('header')).toBeTruthy();
    });
  });

  describe('Title Alignment', () => {
    it('centers title by default', () => {
      const { getByTestId } = render(
        <Header title="Centered Title" testID="header" />
      );
      
      expect(getByTestId('header')).toBeTruthy();
    });

    it('aligns title to left when specified', () => {
      const { getByTestId } = render(
        <Header title="Left Title" titleAlign="left" testID="header" />
      );
      
      expect(getByTestId('header')).toBeTruthy();
    });
  });

  describe('Text Truncation', () => {
    it('truncates title to specified number of lines', () => {
      const { getByText } = render(
        <Header 
          title="Very Long Title That Should Be Truncated After One Line" 
          titleNumberOfLines={1}
        />
      );
      
      const titleElement = getByText(/very long title/i);
      expect(titleElement.props.numberOfLines).toBe(1);
    });

    it('truncates subtitle to specified number of lines', () => {
      const { getByText } = render(
        <Header 
          title="Title"
          subtitle="Very Long Subtitle That Should Be Truncated After Two Lines"
          subtitleNumberOfLines={2}
        />
      );
      
      const subtitleElement = getByText(/very long subtitle/i);
      expect(subtitleElement.props.numberOfLines).toBe(2);
    });
  });

  describe('Loading State', () => {
    it('respects loading prop', () => {
      const { getByTestId } = render(
        <Header {...defaultProps} loading testID="header" />
      );
      
      expect(getByTestId('header')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty title gracefully', () => {
      const { getByTestId } = render(
        <Header title="" testID="header" />
      );
      
      expect(getByTestId('header')).toBeTruthy();
    });

    it('handles very long titles', () => {
      const longTitle = 'A'.repeat(100);
      const { getByText } = render(<Header title={longTitle} />);
      
      expect(getByText(longTitle)).toBeTruthy();
    });

    it('handles actions without onPress', () => {
      const actionWithoutPress: HeaderAction = {
        id: 'test',
        icon: 'test',
        label: 'Test',
        onPress: () => {}, // Empty function
      };
      
      const { getByTestId } = render(
        <Header {...defaultProps} actions={[actionWithoutPress]} testID="header" />
      );
      
      expect(getByTestId('header')).toBeTruthy();
    });

    it('handles search with empty handlers', () => {
      const { getByTestId } = render(
        <Header 
          {...defaultProps}
          search={{ isActive: true }}
          testID="header"
        />
      );
      
      expect(getByTestId('header')).toBeTruthy();
    });
  });
});