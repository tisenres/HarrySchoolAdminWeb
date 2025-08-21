/**
 * Sync Status Indicator Component
 * Harry School Student Mobile App
 * 
 * Visual indicator for offline sync status and connection state
 * Provides user feedback on data synchronization
 */

import React, { useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ViewStyle,
} from 'react-native';
import type { SyncStatus, ConnectionState, OfflineAction } from '../../hooks/useOfflineSync';
import { theme } from '@harry-school/ui/theme';

interface SyncStatusIndicatorProps {
  status: SyncStatus;
  connectionState?: ConnectionState;
  pendingActions?: OfflineAction[];
  onRetry?: () => void;
  compact?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  status,
  connectionState = 'offline',
  pendingActions = [],
  onRetry,
  compact = false,
  style,
  testID,
}) => {
  // Animation for syncing state
  const rotateAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  // Status configuration
  const statusConfig = useMemo(() => {
    switch (status) {
      case 'synced':
        return {
          color: theme.colors.semantic.success.main,
          backgroundColor: theme.colors.semantic.success.light,
          icon: '✓',
          text: 'Synced',
          description: 'All data up to date',
          showAnimation: false,
        };
      
      case 'syncing':
        return {
          color: theme.colors.semantic.warning.main,
          backgroundColor: theme.colors.semantic.warning.light,
          icon: '↻',
          text: 'Syncing',
          description: `Syncing ${pendingActions.length} items`,
          showAnimation: true,
        };
      
      case 'offline':
        return {
          color: theme.colors.semantic.info.main,
          backgroundColor: theme.colors.semantic.info.light,
          icon: '📱',
          text: 'Offline',
          description: `${pendingActions.length} items queued`,
          showAnimation: false,
        };
      
      case 'error':
        return {
          color: theme.colors.semantic.error.main,
          backgroundColor: theme.colors.semantic.error.light,
          icon: '⚠️',
          text: 'Error',
          description: 'Sync failed - tap to retry',
          showAnimation: false,
        };
      
      case 'conflicts':
        return {
          color: theme.colors.semantic.warning.main,
          backgroundColor: theme.colors.semantic.warning.light,
          icon: '❗',
          text: 'Attention',
          description: 'Conflicts need resolution',
          showAnimation: true,
        };
      
      default:
        return {
          color: theme.colors.neutral[500],
          backgroundColor: theme.colors.neutral[100],
          icon: '?',
          text: 'Unknown',
          description: '',
          showAnimation: false,
        };
    }
  }, [status, pendingActions.length]);

  // Connection indicator
  const connectionConfig = useMemo(() => {
    switch (connectionState) {
      case 'online':
        return {
          color: theme.colors.semantic.success.main,
          text: 'Online',
        };
      case 'offline':
        return {
          color: theme.colors.neutral[400],
          text: 'Offline',
        };
      case 'connecting':
        return {
          color: theme.colors.semantic.warning.main,
          text: 'Connecting',
        };
      case 'reconnecting':
        return {
          color: theme.colors.semantic.warning.main,
          text: 'Reconnecting',
        };
    }
  }, [connectionState]);

  // Rotation animation for syncing state
  useEffect(() => {
    if (statusConfig.showAnimation && status === 'syncing') {
      const rotateLoop = Animated.loop(
        Animated.timing(rotateAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      rotateLoop.start();
      
      return () => rotateLoop.stop();
    }
  }, [statusConfig.showAnimation, status, rotateAnimation]);

  // Pulse animation for conflicts
  useEffect(() => {
    if (statusConfig.showAnimation && status === 'conflicts') {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
      
      return () => pulseLoop.stop();
    }
  }, [statusConfig.showAnimation, status, pulseAnimation]);

  // Rotation interpolation
  const rotateInterpolate = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handlePress = () => {
    if (onRetry && (status === 'error' || status === 'offline')) {
      onRetry();
    }
  };

  // Compact version for header
  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactContainer, style]}
        onPress={handlePress}
        disabled={!onRetry || (status !== 'error' && status !== 'offline')}
        accessibilityRole="button"
        accessibilityLabel={`Sync status: ${statusConfig.text}`}
        accessibilityHint={statusConfig.description}
        testID={testID}
      >
        <View style={[
          styles.compactIndicator,
          { backgroundColor: statusConfig.backgroundColor }
        ]}>
          <Animated.View style={{
            transform: [
              { rotate: status === 'syncing' ? rotateInterpolate : '0deg' },
              { scale: status === 'conflicts' ? pulseAnimation : 1 },
            ],
          }}>
            <Text style={[styles.compactIcon, { color: statusConfig.color }]}>
              {statusConfig.icon}
            </Text>
          </Animated.View>
        </View>
        
        <View style={styles.connectionDot}>
          <View style={[
            styles.dot,
            { backgroundColor: connectionConfig.color }
          ]} />
        </View>
      </TouchableOpacity>
    );
  }

  // Full version for dashboard footer
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handlePress}
      disabled={!onRetry || (status !== 'error' && status !== 'offline')}
      accessibilityRole="button"
      accessibilityLabel={`Sync status: ${statusConfig.text}. ${statusConfig.description}`}
      accessibilityHint={onRetry ? 'Tap to retry sync' : undefined}
      testID={testID}
    >
      <View style={styles.content}>
        {/* Status Icon */}
        <View style={[
          styles.iconContainer,
          { backgroundColor: statusConfig.backgroundColor }
        ]}>
          <Animated.View style={{
            transform: [
              { rotate: status === 'syncing' ? rotateInterpolate : '0deg' },
              { scale: status === 'conflicts' ? pulseAnimation : 1 },
            ],
          }}>
            <Text style={[styles.icon, { color: statusConfig.color }]}>
              {statusConfig.icon}
            </Text>
          </Animated.View>
        </View>

        {/* Status Text */}
        <View style={styles.textContainer}>
          <View style={styles.statusRow}>
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.text}
            </Text>
            
            {/* Connection Status */}
            <View style={styles.connectionStatus}>
              <View style={[
                styles.connectionDot,
                { backgroundColor: connectionConfig.color }
              ]} />
              <Text style={styles.connectionText}>
                {connectionConfig.text}
              </Text>
            </View>
          </View>
          
          {statusConfig.description && (
            <Text style={styles.descriptionText}>
              {statusConfig.description}
            </Text>
          )}
        </View>

        {/* Pending Count Badge */}
        {pendingActions.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {pendingActions.length > 99 ? '99+' : pendingActions.length}
            </Text>
          </View>
        )}
      </View>

      {/* Progress Bar for Syncing */}
      {status === 'syncing' && (
        <View style={styles.progressContainer}>
          <View style={[
            styles.progressBar,
            { backgroundColor: statusConfig.color }
          ]} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  
  compactIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  compactIcon: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  connectionDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  
  // Full styles
  container: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 12,
    padding: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  
  icon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  textContainer: {
    flex: 1,
  },
  
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  connectionText: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
    marginLeft: 4,
  },
  
  descriptionText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  
  badge: {
    backgroundColor: theme.colors.semantic.error.main,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.xs,
  },
  
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.text.inverse,
  },
  
  progressContainer: {
    height: 2,
    backgroundColor: theme.colors.neutral[200],
    marginTop: theme.spacing.xs,
    borderRadius: 1,
    overflow: 'hidden',
  },
  
  progressBar: {
    height: '100%',
    width: '100%',
    opacity: 0.7,
  },
});

export default SyncStatusIndicator;