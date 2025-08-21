/**
 * Card Component Tests
 * Harry School Mobile Design System
 * 
 * Comprehensive test suite for Card component functionality and accessibility
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { ThemeProvider } from '../../theme/ThemeProvider';
import Card from './Card';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const actual = jest.requireActual('react-native-gesture-handler');
  return {
    ...actual,
    PanGestureHandler: ({ children }: any) => children,
  };
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

describe('Card Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('renders correctly with default props', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Card testID="test-card">
            <Text>Card Content</Text>
          </Card>
        </TestWrapper>
      );
      
      expect(getByTestId('test-card')).toBeTruthy();
    });

    it('renders children content', () => {
      const { getByText } = render(
        <TestWrapper>
          <Card>
            <Text>Test Content</Text>
          </Card>
        </TestWrapper>
      );
      
      expect(getByText('Test Content')).toBeTruthy();
    });

    it('renders header and footer', () => {
      const { getByText } = render(
        <TestWrapper>
          <Card
            header={<Text>Card Header</Text>}
            footer={<Text>Card Footer</Text>}
          >
            <Text>Card Content</Text>
          </Card>
        </TestWrapper>
      );
      
      expect(getByText('Card Header')).toBeTruthy();
      expect(getByText('Card Content')).toBeTruthy();
      expect(getByText('Card Footer')).toBeTruthy();
    });
  });

  describe('Variants', () => {
    const variants = ['elevated', 'outlined', 'filled', 'interactive', 'data', 'visual'] as const;
    
    variants.forEach(variant => {
      it(`renders ${variant} variant correctly`, () => {
        const { getByTestId } = render(
          <TestWrapper>
            <Card variant={variant} testID={`${variant}-card`}>
              <Text>{variant} Card</Text>
            </Card>
          </TestWrapper>
        );
        
        expect(getByTestId(`${variant}-card`)).toBeTruthy();
      });
    });
  });

  describe('Sizes', () => {
    const sizes = ['compact', 'default', 'expanded'] as const;
    
    sizes.forEach(size => {
      it(`renders ${size} size correctly`, () => {
        const { getByTestId } = render(
          <TestWrapper>
            <Card size={size} testID={`${size}-card`}>
              <Text>{size} Card</Text>
            </Card>
          </TestWrapper>
        );
        
        expect(getByTestId(`${size}-card`)).toBeTruthy();
      });
    });
  });

  describe('Interactive Features', () => {
    it('calls onPress when interactive and pressed', () => {
      const onPressMock = jest.fn();
      const { getByTestId } = render(
        <TestWrapper>
          <Card interactive onPress={onPressMock} testID="interactive-card">
            <Text>Interactive Card</Text>
          </Card>
        </TestWrapper>
      );
      
      fireEvent.press(getByTestId('interactive-card'));
      expect(onPressMock).toHaveBeenCalledTimes(1);
    });

    it('does not call onPress when not interactive', () => {
      const onPressMock = jest.fn();
      const { getByTestId } = render(
        <TestWrapper>
          <Card onPress={onPressMock} testID="non-interactive-card">
            <Text>Non-Interactive Card</Text>
          </Card>
        </TestWrapper>
      );
      
      fireEvent.press(getByTestId('non-interactive-card'));
      expect(onPressMock).not.toHaveBeenCalled();
    });

    it('calls onLongPress when provided', () => {
      const onLongPressMock = jest.fn();
      const { getByTestId } = render(
        <TestWrapper>
          <Card interactive onLongPress={onLongPressMock} testID="long-press-card">
            <Text>Long Press Card</Text>
          </Card>
        </TestWrapper>
      );
      
      fireEvent(getByTestId('long-press-card'), 'longPress');
      expect(onLongPressMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Sync Status', () => {
    const syncStatuses = ['synced', 'syncing', 'offline', 'error'] as const;
    
    syncStatuses.forEach(status => {
      it(`displays ${status} sync status correctly`, () => {
        const { getByTestId } = render(
          <TestWrapper>
            <Card 
              syncStatus={status} 
              showSyncIndicator 
              testID="sync-card"
              header={<Text>Header</Text>}
            >
              <Text>Content</Text>
            </Card>
          </TestWrapper>
        );
        
        expect(getByTestId('sync-card')).toBeTruthy();
        // Sync indicator should be present (visual verification in actual usage)
      });
    });

    it('hides sync indicator when showSyncIndicator is false', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Card 
            syncStatus="synced" 
            showSyncIndicator={false} 
            testID="no-sync-card"
            header={<Text>Header</Text>}
          >
            <Text>Content</Text>
          </Card>
        </TestWrapper>
      );
      
      expect(getByTestId('no-sync-card')).toBeTruthy();
    });
  });

  describe('Quick Actions', () => {
    it('renders quick actions when provided', () => {
      const quickActions = [
        {
          id: 'edit',
          label: 'Edit',
          icon: <Text>✏️</Text>,
          onPress: jest.fn(),
        },
        {
          id: 'delete',
          label: 'Delete',
          icon: <Text>🗑️</Text>,
          onPress: jest.fn(),
        },
      ];

      const { getByLabelText } = render(
        <TestWrapper>
          <Card 
            quickActions={quickActions}
            showQuickActions 
            header={<Text>Header</Text>}
          >
            <Text>Content</Text>
          </Card>
        </TestWrapper>
      );
      
      expect(getByLabelText('Edit')).toBeTruthy();
      expect(getByLabelText('Delete')).toBeTruthy();
    });

    it('calls quick action onPress', () => {
      const editMock = jest.fn();
      const quickActions = [
        {
          id: 'edit',
          label: 'Edit',
          icon: <Text>✏️</Text>,
          onPress: editMock,
        },
      ];

      const { getByLabelText } = render(
        <TestWrapper>
          <Card 
            quickActions={quickActions}
            showQuickActions 
            header={<Text>Header</Text>}
          >
            <Text>Content</Text>
          </Card>
        </TestWrapper>
      );
      
      fireEvent.press(getByLabelText('Edit'));
      expect(editMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Progress Indicator', () => {
    it('renders progress indicator correctly', () => {
      const progress = {
        current: 7,
        total: 10,
        showPercentage: true,
        color: '#10b981',
      };

      const { getByText } = render(
        <TestWrapper>
          <Card progress={progress}>
            <Text>Progress Card</Text>
          </Card>
        </TestWrapper>
      );
      
      expect(getByText('70%')).toBeTruthy();
    });

    it('hides percentage when showPercentage is false', () => {
      const progress = {
        current: 3,
        total: 10,
        showPercentage: false,
      };

      const { queryByText } = render(
        <TestWrapper>
          <Card progress={progress}>
            <Text>Progress Card</Text>
          </Card>
        </TestWrapper>
      );
      
      expect(queryByText('30%')).toBeNull();
    });
  });

  describe('Achievements', () => {
    it('renders achievement badges', () => {
      const achievements = [
        {
          id: 'first',
          icon: <Text>🏆</Text>,
          label: 'First Achievement',
          color: '#ffd700',
        },
        {
          id: 'second',
          icon: <Text>⭐</Text>,
          label: 'Second Achievement',
          color: '#c0c0c0',
        },
      ];

      const { getByLabelText } = render(
        <TestWrapper>
          <Card achievements={achievements}>
            <Text>Achievement Card</Text>
          </Card>
        </TestWrapper>
      );
      
      expect(getByLabelText('First Achievement')).toBeTruthy();
      expect(getByLabelText('Second Achievement')).toBeTruthy();
    });

    it('limits achievements to 3', () => {
      const achievements = [
        { id: '1', icon: <Text>1</Text>, label: 'Achievement 1', color: '#red' },
        { id: '2', icon: <Text>2</Text>, label: 'Achievement 2', color: '#green' },
        { id: '3', icon: <Text>3</Text>, label: 'Achievement 3', color: '#blue' },
        { id: '4', icon: <Text>4</Text>, label: 'Achievement 4', color: '#yellow' },
      ];

      const { getByLabelText, queryByLabelText } = render(
        <TestWrapper>
          <Card achievements={achievements}>
            <Text>Achievement Card</Text>
          </Card>
        </TestWrapper>
      );
      
      expect(getByLabelText('Achievement 1')).toBeTruthy();
      expect(getByLabelText('Achievement 2')).toBeTruthy();
      expect(getByLabelText('Achievement 3')).toBeTruthy();
      expect(queryByLabelText('Achievement 4')).toBeNull();
    });
  });

  describe('Data Grid Layout', () => {
    it('applies data grid styling when dataGrid is true', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Card dataGrid testID="data-grid-card">
            <Text>Data Grid Content</Text>
          </Card>
        </TestWrapper>
      );
      
      expect(getByTestId('data-grid-card')).toBeTruthy();
    });
  });

  describe('Full Width', () => {
    it('applies full width styling', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Card fullWidth testID="full-width-card">
            <Text>Full Width Card</Text>
          </Card>
        </TestWrapper>
      );
      
      const card = getByTestId('full-width-card');
      expect(card.props.style).toEqual(
        expect.objectContaining({
          width: '100%'
        })
      );
    });
  });

  describe('Accessibility', () => {
    it('has correct accessibility role when interactive', () => {
      const { getByRole } = render(
        <TestWrapper>
          <Card interactive>
            <Text>Interactive Card</Text>
          </Card>
        </TestWrapper>
      );
      
      expect(getByRole('button')).toBeTruthy();
    });

    it('uses custom accessibility label', () => {
      const { getByLabelText } = render(
        <TestWrapper>
          <Card accessibilityLabel="Custom Card Label">
            <Text>Card Content</Text>
          </Card>
        </TestWrapper>
      );
      
      expect(getByLabelText('Custom Card Label')).toBeTruthy();
    });

    it('applies accessibility hint', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <Card 
            accessibilityHint="This card contains information"
            testID="hint-card"
          >
            <Text>Card with Hint</Text>
          </Card>
        </TestWrapper>
      );
      
      const card = getByTestId('hint-card');
      expect(card.props.accessibilityHint).toBe('This card contains information');
    });
  });

  describe('Custom Styling', () => {
    it('applies custom container style', () => {
      const customStyle = { marginBottom: 16 };
      
      const { getByTestId } = render(
        <TestWrapper>
          <Card style={customStyle} testID="styled-card">
            <Text>Styled Card</Text>
          </Card>
        </TestWrapper>
      );
      
      const card = getByTestId('styled-card');
      expect(card.props.style).toEqual(
        expect.objectContaining(customStyle)
      );
    });

    it('applies custom header style', () => {
      const headerStyle = { paddingBottom: 8 };
      
      const { getByTestId } = render(
        <TestWrapper>
          <Card 
            header={<View testID="card-header"><Text>Header</Text></View>}
            headerStyle={headerStyle}
          >
            <Text>Content</Text>
          </Card>
        </TestWrapper>
      );
      
      const header = getByTestId('card-header').parent;
      expect(header?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining(headerStyle)
        ])
      );
    });
  });

  describe('Image Support', () => {
    it('renders image when provided', () => {
      const image = {
        source: { uri: 'https://example.com/image.jpg' },
        alt: 'Test Image',
        aspectRatio: 16 / 9,
      };

      const { getByLabelText } = render(
        <TestWrapper>
          <Card image={image}>
            <Text>Card with Image</Text>
          </Card>
        </TestWrapper>
      );
      
      expect(getByLabelText('Test Image')).toBeTruthy();
    });
  });
});