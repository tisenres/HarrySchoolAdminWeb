/**
 * ProfileSettings Component
 * Harry School Mobile Design System
 * 
 * Settings list with toggles, navigation items, and dark theme styling
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  Switch,
  Platform,
  HapticFeedback,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeProvider';
import { ProfileSettingsProps, SettingItem, SettingType } from './ProfileSettings.types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Individual setting item component
const SettingItemComponent: React.FC<{
  item: SettingItem;
  index: number;
  onPress?: (item: SettingItem, index: number) => void;
  onToggle?: (item: SettingItem, value: boolean) => void;
  enableHaptics: boolean;
  theme: 'light' | 'dark';
}> = ({ item, index, onPress, onToggle, enableHaptics, theme }) => {
  const { theme: designTheme } = useTheme();
  const tokens = designTheme.tokens;
  
  const scale = useSharedValue(1);
  
  const themeColors = useMemo(() => ({
    background: theme === 'dark' ? '#2d2d2d' : tokens.colors.background.primary,
    text: theme === 'dark' ? '#ffffff' : tokens.colors.text.primary,
    textSecondary: theme === 'dark' ? '#a0a0a0' : tokens.colors.text.secondary,
    border: theme === 'dark' ? '#4a4a4a' : tokens.colors.border.light,
    accent: '#1d7452',
  }), [theme, tokens]);
  
  const triggerHaptic = useCallback(() => {
    if (enableHaptics && Platform.OS === 'ios') {
      HapticFeedback.trigger('light');
    }
  }, [enableHaptics]);
  
  const handlePress = useCallback(() => {
    if (item.disabled) return;
    
    triggerHaptic();
    scale.value = withSpring(0.98, { damping: 15, stiffness: 200 }, () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
    });
    
    onPress?.(item, index);
  }, [item, index, onPress, triggerHaptic, scale]);
  
  const handleToggle = useCallback((value: boolean) => {
    if (item.disabled) return;
    
    triggerHaptic();
    onToggle?.(item, value);
  }, [item, onToggle, triggerHaptic]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: item.disabled ? 0.5 : 1,
  }));
  
  const renderRightElement = () => {
    switch (item.type) {
      case 'toggle':
        return (
          <Switch
            value={item.value as boolean}
            onValueChange={handleToggle}
            disabled={item.disabled}
            trackColor={{
              false: theme === 'dark' ? '#4a4a4a' : '#e5e7eb',
              true: themeColors.accent,
            }}
            thumbColor={Platform.OS === 'ios' ? undefined : '#ffffff'}
            ios_backgroundColor={theme === 'dark' ? '#4a4a4a' : '#e5e7eb'}
          />
        );
      case 'value':
        return (
          <Text style={[styles.valueText, { color: themeColors.textSecondary }]}>
            {item.value as string}
          </Text>
        );
      case 'navigation':
        return (
          <Text style={[styles.chevron, { color: themeColors.textSecondary }]}>
            →
          </Text>
        );
      case 'button':
        return (
          <View style={[styles.button, { backgroundColor: themeColors.accent }]}>
            <Text style={styles.buttonText}>{item.buttonText || 'Action'}</Text>
          </View>
        );
      default:
        return null;
    }
  };
  
  const Container = item.type === 'toggle' ? Animated.View : AnimatedPressable;
  const containerProps = item.type === 'toggle' ? {} : {
    onPress: handlePress,
    disabled: item.disabled,
  };
  
  return (
    <Container
      style={[
        styles.itemContainer,
        {
          backgroundColor: themeColors.background,
          borderBottomColor: themeColors.border,
        },
        animatedStyle,
      ]}
      accessibilityRole={item.type === 'toggle' ? 'switch' : 'button'}
      accessibilityLabel={item.title}
      accessibilityHint={item.subtitle}
      accessibilityState={{
        disabled: item.disabled,
        checked: item.type === 'toggle' ? item.value as boolean : undefined,
      }}
      {...containerProps}
    >
      {/* Icon */}
      {item.icon && (
        <View style={[styles.iconContainer, { backgroundColor: `${item.iconColor || themeColors.accent}20` }]}>
          <Text style={[styles.icon, { color: item.iconColor || themeColors.accent }]}>
            {item.icon}
          </Text>
        </View>
      )}
      
      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: themeColors.text }]}>
          {item.title}
        </Text>
        {item.subtitle && (
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            {item.subtitle}
          </Text>
        )}
      </View>
      
      {/* Right element */}
      <View style={styles.rightElement}>
        {renderRightElement()}
      </View>
    </Container>
  );
};

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  sections,
  onItemPress,
  onToggle,
  enableHaptics = true,
  theme = 'dark',
  style,
  testID = 'profile-settings',
}) => {
  const { theme: designTheme } = useTheme();
  const tokens = designTheme.tokens;
  
  const themeColors = useMemo(() => ({
    background: theme === 'dark' ? '#1a1a1a' : tokens.colors.background.secondary,
    sectionBackground: theme === 'dark' ? '#2d2d2d' : tokens.colors.background.primary,
    text: theme === 'dark' ? '#ffffff' : tokens.colors.text.primary,
    textSecondary: theme === 'dark' ? '#a0a0a0' : tokens.colors.text.secondary,
  }), [theme, tokens]);
  
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: themeColors.background },
        style,
      ]}
      testID={testID}
    >
      {sections.map((section, sectionIndex) => (
        <View key={section.id || sectionIndex} style={styles.section}>
          {/* Section header */}
          {section.title && (
            <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>
              {section.title.toUpperCase()}
            </Text>
          )}
          
          {/* Section items */}
          <View
            style={[
              styles.sectionContent,
              { backgroundColor: themeColors.sectionBackground },
            ]}
          >
            {section.items.map((item, itemIndex) => (
              <SettingItemComponent
                key={item.id || itemIndex}
                item={item}
                index={itemIndex}
                onPress={onItemPress}
                onToggle={onToggle}
                enableHaptics={enableHaptics}
                theme={theme}
              />
            ))}
          </View>
          
          {/* Section footer */}
          {section.footer && (
            <Text style={[styles.sectionFooter, { color: themeColors.textSecondary }]}>
              {section.footer}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginHorizontal: 20,
  },
  sectionContent: {
    borderRadius: 12,
    marginHorizontal: 20,
    overflow: 'hidden' as const,
  },
  sectionFooter: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    marginTop: 8,
    marginHorizontal: 20,
  },
  itemContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  icon: {
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 16,
    marginTop: 2,
  },
  rightElement: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  valueText: {
    fontSize: 14,
    fontWeight: '500',
  },
  chevron: {
    fontSize: 18,
    fontWeight: '600',
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
};

ProfileSettings.displayName = 'ProfileSettings';

export default ProfileSettings;