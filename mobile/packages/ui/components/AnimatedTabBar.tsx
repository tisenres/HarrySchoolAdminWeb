/**
 * Animated Tab Bar Component - Harry School Design System
 * 
 * Enhanced tab bar with delightful micro-interactions including:
 * - Icon bounce animations on selection
 * - Smooth indicator transitions
 * - Haptic feedback on tab switches
 * - Badge support for notifications
 * - Accessibility support
 */

import React from 'react';
import { View, Pressable, ViewStyle, Dimensions } from 'react-native';
import Animated from 'react-native-reanimated';
import { Text } from './Text';
import { animations } from '../theme/animations';
import { colors } from '../theme/colors';

interface TabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  badge?: number;
  disabled?: boolean;
}

interface AnimatedTabBarProps {
  // Tab data
  tabs: TabItem[];
  activeTabId: string;
  
  // Interaction
  onTabPress: (tabId: string) => void;
  
  // Visual options
  variant?: 'primary' | 'secondary' | 'transparent';
  showLabels?: boolean;
  indicatorType?: 'line' | 'pill' | 'none';
  
  // Style props
  style?: ViewStyle;
  tabStyle?: ViewStyle;
  
  // Layout
  distribution?: 'equal' | 'content';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const { width: screenWidth } = Dimensions.get('window');

export const AnimatedTabBar: React.FC<AnimatedTabBarProps> = ({
  tabs,
  activeTabId,
  onTabPress,
  variant = 'primary',
  showLabels = true,
  indicatorType = 'line',
  style,
  tabStyle,
  distribution = 'equal',
}) => {
  const activeIndex = tabs.findIndex(tab => tab.id === activeTabId);
  const tabWidth = distribution === 'equal' ? screenWidth / tabs.length : 'auto';
  
  // Get variant colors
  const getVariantColors = () => {
    switch (variant) {
      case 'primary':
        return {
          background: colors.background.primary,
          activeColor: colors.semantic.primary.main,
          inactiveColor: colors.text.tertiary,
          indicatorColor: colors.semantic.primary.main,
        };
      case 'secondary':
        return {
          background: colors.background.secondary,
          activeColor: colors.semantic.primary.main,
          inactiveColor: colors.text.secondary,
          indicatorColor: colors.semantic.primary.main,
        };
      case 'transparent':
        return {
          background: 'transparent',
          activeColor: colors.semantic.primary.main,
          inactiveColor: colors.text.tertiary,
          indicatorColor: colors.semantic.primary.main,
        };
      default:
        return {
          background: colors.background.primary,
          activeColor: colors.semantic.primary.main,
          inactiveColor: colors.text.tertiary,
          indicatorColor: colors.semantic.primary.main,
        };
    }
  };
  
  const variantColors = getVariantColors();
  
  // Tab component with animations
  const AnimatedTab: React.FC<{ tab: TabItem; index: number; isActive: boolean }> = ({
    tab,
    index,
    isActive,
  }) => {
    const { animatedStyle: bounceStyle, bounce } = animations.navigation.useTabBounce();
    const { animatedStyle: pressStyle, onPressIn, onPressOut } = animations.button.usePress('light');
    const fadeStyle = animations.utility.useFade(isActive);
    
    const handlePress = () => {
      if (!tab.disabled && tab.id !== activeTabId) {
        bounce();
        onTabPress(tab.id);
      }
    };
    
    return (
      <AnimatedPressable
        style={[
          {
            flex: distribution === 'equal' ? 1 : undefined,
            paddingHorizontal: distribution === 'content' ? 16 : 0,
            paddingVertical: 12,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: tab.disabled ? 0.5 : 1,
          },
          pressStyle,
          tabStyle,
        ]}
        onPress={handlePress}
        onPressIn={tab.disabled ? undefined : onPressIn}
        onPressOut={tab.disabled ? undefined : onPressOut}
        disabled={tab.disabled}
        accessible={true}
        accessibilityRole="tab"
        accessibilityState={{
          selected: isActive,
          disabled: tab.disabled,
        }}
        accessibilityLabel={tab.label}
      >
        <View style={{ position: 'relative' }}>
          {/* Tab Icon */}
          <Animated.View style={[bounceStyle, { alignItems: 'center' }]}>
            <View
              style={{
                tintColor: isActive ? variantColors.activeColor : variantColors.inactiveColor,
              }}
            >
              {isActive && tab.activeIcon ? tab.activeIcon : tab.icon}
            </View>
          </Animated.View>
          
          {/* Badge */}
          {tab.badge && tab.badge > 0 && (
            <Animated.View
              style={[
                animations.utility.useScale(true),
                {
                  position: 'absolute',
                  top: -4,
                  right: -8,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: colors.semantic.error.main,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 4,
                },
              ]}
            >
              <Text
                style={{
                  color: colors.semantic.error.contrast,
                  fontSize: 10,
                  fontWeight: '600',
                  textAlign: 'center',
                }}
              >
                {tab.badge > 99 ? '99+' : tab.badge.toString()}
              </Text>
            </Animated.View>
          )}
        </View>
        
        {/* Tab Label */}
        {showLabels && (
          <Animated.View style={fadeStyle}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: isActive ? '600' : '500',
                color: isActive ? variantColors.activeColor : variantColors.inactiveColor,
                marginTop: 4,
                textAlign: 'center',
              }}
            >
              {tab.label}
            </Text>
          </Animated.View>
        )}
      </AnimatedPressable>
    );
  };
  
  // Indicator component
  const TabIndicator: React.FC = () => {
    const slideStyle = animations.utility.useSlide(true, 'up');
    
    if (indicatorType === 'none') return null;
    
    const indicatorWidth = distribution === 'equal' ? screenWidth / tabs.length : 60;
    const indicatorLeft = distribution === 'equal' ? activeIndex * indicatorWidth : activeIndex * 60;
    
    return (
      <Animated.View
        style={[
          slideStyle,
          {
            position: 'absolute',
            bottom: indicatorType === 'line' ? 0 : 8,
            left: indicatorLeft + (indicatorWidth * 0.25),
            width: indicatorWidth * 0.5,
            height: indicatorType === 'line' ? 2 : 4,
            backgroundColor: variantColors.indicatorColor,
            borderRadius: indicatorType === 'pill' ? 2 : 0,
          },
        ]}
      />
    );
  };
  
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          backgroundColor: variantColors.background,
          borderTopWidth: variant !== 'transparent' ? 1 : 0,
          borderTopColor: colors.border.primary,
          paddingBottom: 8,
          position: 'relative',
        },
        style,
      ]}
      accessible={true}
      accessibilityRole="tablist"
    >
      {/* Tabs */}
      {tabs.map((tab, index) => (
        <AnimatedTab
          key={tab.id}
          tab={tab}
          index={index}
          isActive={tab.id === activeTabId}
        />
      ))}
      
      {/* Indicator */}
      <TabIndicator />
    </View>
  );
};

export default AnimatedTabBar;