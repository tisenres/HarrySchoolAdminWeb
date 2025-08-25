import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface NotificationBadgeProps {
  count: number;
  maxCount?: number;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  backgroundColor?: string;
  showZero?: boolean;
  onPress?: () => void;
  icon?: string;
  iconSize?: number;
  animateChanges?: boolean;
  style?: any;
  testID?: string;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  maxCount = 99,
  size = 'medium',
  color = 'white',
  backgroundColor = '#EF4444',
  showZero = false,
  onPress,
  icon = 'notifications-outline',
  iconSize,
  animateChanges = true,
  style,
  testID,
}) => {
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const previousCount = useRef(count);

  const sizes = {
    small: {
      container: 16,
      fontSize: 10,
      iconSize: 16,
      minWidth: 16,
    },
    medium: {
      container: 20,
      fontSize: 12,
      iconSize: 20,
      minWidth: 20,
    },
    large: {
      container: 24,
      fontSize: 14,
      iconSize: 24,
      minWidth: 24,
    },
  };

  const sizeConfig = sizes[size];
  const finalIconSize = iconSize || sizeConfig.iconSize;

  useEffect(() => {
    if (animateChanges && count !== previousCount.current) {
      // Animate scale when count changes
      Animated.sequence([
        Animated.timing(scaleAnimation, {
          toValue: 1.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnimation, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      // Pulse effect for new notifications
      if (count > previousCount.current) {
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.2,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1.1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }

      previousCount.current = count;
    }
  }, [count, animateChanges, scaleAnimation, pulseAnimation]);

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();
  const shouldShowBadge = count > 0 || showZero;

  const renderBadge = () => {
    if (!shouldShowBadge) return null;

    return (
      <Animated.View
        style={[
          styles.badge,
          {
            backgroundColor,
            minWidth: sizeConfig.container,
            height: sizeConfig.container,
            transform: [
              { scale: scaleAnimation },
              { scale: pulseAnimation },
            ],
          },
        ]}
        testID={`${testID}-badge`}
      >
        <Text
          style={[
            styles.badgeText,
            {
              color,
              fontSize: sizeConfig.fontSize,
            },
          ]}
          numberOfLines={1}
        >
          {displayCount}
        </Text>
      </Animated.View>
    );
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[styles.container, style]}
        activeOpacity={0.7}
        testID={testID}
      >
        <Ionicons name={icon} size={finalIconSize} color="#6B7280" />
        {renderBadge()}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, style]} testID={testID}>
      <Ionicons name={icon} size={finalIconSize} color="#6B7280" />
      {renderBadge()}
    </View>
  );
};

// Preset notification badge for common use cases
export const NotificationIconBadge: React.FC<{
  count: number;
  onPress: () => void;
  size?: 'small' | 'medium' | 'large';
}> = ({ count, onPress, size = 'medium' }) => (
  <NotificationBadge
    count={count}
    onPress={onPress}
    icon="notifications-outline"
    size={size}
    backgroundColor="#1d7452"
    testID="notification-icon-badge"
  />
);

// Islamic-themed notification badge
export const IslamicNotificationBadge: React.FC<{
  count: number;
  onPress: () => void;
  type?: 'general' | 'prayer' | 'celebration' | 'reminder';
  size?: 'small' | 'medium' | 'large';
}> = ({ count, onPress, type = 'general', size = 'medium' }) => {
  const configs = {
    general: {
      icon: 'notifications-outline',
      backgroundColor: '#1d7452',
    },
    prayer: {
      icon: 'moon-outline',
      backgroundColor: '#7C3AED',
    },
    celebration: {
      icon: 'trophy-outline',
      backgroundColor: '#F59E0B',
    },
    reminder: {
      icon: 'alarm-outline',
      backgroundColor: '#3B82F6',
    },
  };

  const config = configs[type];

  return (
    <NotificationBadge
      count={count}
      onPress={onPress}
      icon={config.icon}
      backgroundColor={config.backgroundColor}
      size={size}
      testID={`islamic-notification-badge-${type}`}
    />
  );
};

// Floating Action Button style notification badge
export const FABNotificationBadge: React.FC<{
  count: number;
  onPress: () => void;
  icon?: string;
  backgroundColor?: string;
  fabColor?: string;
}> = ({
  count,
  onPress,
  icon = 'add',
  backgroundColor = '#EF4444',
  fabColor = '#1d7452',
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.fab, { backgroundColor: fabColor }]}
    activeOpacity={0.8}
    testID="fab-notification-badge"
  >
    <Ionicons name={icon} size={24} color="white" />
    {count > 0 && (
      <View
        style={[
          styles.fabBadge,
          { backgroundColor },
        ]}
      >
        <Text style={styles.fabBadgeText}>
          {count > 99 ? '99+' : count.toString()}
        </Text>
      </View>
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    borderRadius: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  badgeText: {
    fontWeight: 'bold',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  fabBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});