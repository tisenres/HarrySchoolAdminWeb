/**
 * Dashboard Header Component
 * Harry School Student Mobile App
 * 
 * Displays student identity, sync status, and navigation controls
 * Adapts to age group and connection state
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { Avatar, Badge } from '@harry-school/ui';
import { SyncStatusIndicator } from './SyncStatusIndicator';
import type { StudentProfile } from '../../navigation/types';
import type { SyncStatus, ConnectionState } from '../../hooks/useOfflineSync';
import type { OfflineAction } from '../../hooks/useOfflineSync';
import { theme } from '@harry-school/ui/theme';

interface DashboardHeaderProps {
  student: StudentProfile;
  syncStatus: SyncStatus;
  connectionState?: ConnectionState;
  pendingActions?: OfflineAction[];
  onSettingsPress: () => void;
  onNotificationsPress: () => void;
  onSyncPress?: () => void;
  style?: any;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  student,
  syncStatus,
  connectionState = 'offline',
  pendingActions = [],
  onSettingsPress,
  onNotificationsPress,
  onSyncPress,
  style,
}) => {
  // Age-specific adaptations
  const ageAdaptations = useMemo(() => {
    const isElementary = student.ageGroup === '10-12';
    
    return {
      avatarSize: isElementary ? 'large' : 'medium' as const,
      greetingStyle: isElementary ? 'friendly' : 'professional',
      colorSaturation: isElementary ? 'high' : 'standard',
      textSize: isElementary ? 'large' : 'medium',
    };
  }, [student.ageGroup]);

  // Generate time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const isElementary = student.ageGroup === '10-12';
    
    let timeGreeting = '';
    if (hour < 12) {
      timeGreeting = 'Good morning';
    } else if (hour < 17) {
      timeGreeting = 'Good afternoon';
    } else {
      timeGreeting = 'Good evening';
    }
    
    if (isElementary) {
      // More enthusiastic greetings for elementary students
      const enthusiasticGreetings = [
        `${timeGreeting}, superstar!`,
        `${timeGreeting}, champion!`,
        `Ready to learn, ${student.name}?`,
        `${timeGreeting}, amazing learner!`,
      ];
      return enthusiasticGreetings[Math.floor(Math.random() * enthusiasticGreetings.length)];
    } else {
      return `${timeGreeting}, ${student.name}`;
    }
  }, [student.name, student.ageGroup]);

  // Notification badge count
  const notificationCount = useMemo(() => {
    // In a real app, this would come from notification state
    return pendingActions.length > 0 ? Math.min(pendingActions.length, 99) : 0;
  }, [pendingActions.length]);

  // Sync status display
  const syncStatusDisplay = useMemo(() => {
    switch (syncStatus) {
      case 'synced':
        return {
          color: theme.colors.semantic.success.main,
          text: 'Up to date',
          icon: '✓',
        };
      case 'syncing':
        return {
          color: theme.colors.semantic.warning.main,
          text: 'Syncing...',
          icon: '↻',
        };
      case 'offline':
        return {
          color: theme.colors.semantic.info.main,
          text: 'Offline',
          icon: '📱',
        };
      case 'error':
        return {
          color: theme.colors.semantic.error.main,
          text: 'Sync error',
          icon: '⚠️',
        };
      case 'conflicts':
        return {
          color: theme.colors.semantic.warning.main,
          text: 'Needs attention',
          icon: '❗',
        };
    }
  }, [syncStatus]);

  return (
    <View style={[styles.container, style]}>
      <StatusBar
        barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
        backgroundColor={theme.colors.background.primary}
      />
      
      {/* Main Header Content */}
      <View style={styles.content}>
        {/* Left Side - Avatar and Greeting */}
        <View style={styles.leftContent}>
          <Avatar
            size={ageAdaptations.avatarSize}
            source={student.avatar}
            name={student.name}
            status="online"
            style={styles.avatar}
          />
          
          <View style={styles.greetingContainer}>
            <Text 
              style={[
                styles.greeting,
                ageAdaptations.textSize === 'large' && styles.greetingLarge
              ]}
              numberOfLines={1}
            >
              {greeting}
            </Text>
            
            <View style={styles.statusRow}>
              <Text style={styles.grade}>
                {student.grade} Grade
              </Text>
              
              {/* Connection Status Indicator */}
              <View style={styles.connectionIndicator}>
                <View 
                  style={[
                    styles.connectionDot,
                    { backgroundColor: connectionState === 'online' ? theme.colors.semantic.success.main : theme.colors.neutral[400] }
                  ]} 
                />
                <Text style={styles.connectionText}>
                  {connectionState === 'online' ? 'Online' : 'Offline'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Right Side - Actions */}
        <View style={styles.rightContent}>
          {/* Sync Status */}
          {onSyncPress && (
            <TouchableOpacity
              style={styles.syncButton}
              onPress={onSyncPress}
              accessibilityRole="button"
              accessibilityLabel={`Sync status: ${syncStatusDisplay.text}`}
              accessibilityHint="Tap to refresh data"
            >
              <SyncStatusIndicator
                status={syncStatus}
                pendingActions={pendingActions}
                connectionState={connectionState}
                compact
              />
            </TouchableOpacity>
          )}

          {/* Notifications */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onNotificationsPress}
            accessibilityRole="button"
            accessibilityLabel={`Notifications${notificationCount > 0 ? ` (${notificationCount} new)` : ''}`}
            accessibilityHint="View notifications and updates"
          >
            <View style={styles.notificationContainer}>
              <Text style={styles.notificationIcon}>🔔</Text>
              {notificationCount > 0 && (
                <Badge
                  type="notification"
                  count={notificationCount}
                  position="top-right"
                  style={styles.notificationBadge}
                />
              )}
            </View>
          </TouchableOpacity>

          {/* Settings */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onSettingsPress}
            accessibilityRole="button"
            accessibilityLabel="Settings"
            accessibilityHint="Open app settings and preferences"
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sync Status Bar (if needed) */}
      {syncStatus !== 'synced' && (
        <View style={styles.statusBar}>
          <View style={[styles.statusIndicator, { backgroundColor: syncStatusDisplay.color }]} />
          <Text style={styles.statusText}>
            {syncStatusDisplay.icon} {syncStatusDisplay.text}
            {pendingActions.length > 0 && ` (${pendingActions.length} pending)`}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.primary,
    paddingBottom: theme.spacing.sm,
  },
  
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  avatar: {
    marginRight: theme.spacing.sm,
  },
  
  greetingContainer: {
    flex: 1,
  },
  
  greeting: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  
  greetingLarge: {
    fontSize: 20,
    fontWeight: '700',
  },
  
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  
  grade: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginRight: theme.spacing.sm,
  },
  
  connectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  connectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  
  connectionText: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
  },
  
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  syncButton: {
    marginRight: theme.spacing.sm,
  },
  
  iconButton: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.xs,
    borderRadius: 20,
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  notificationContainer: {
    position: 'relative',
  },
  
  notificationIcon: {
    fontSize: 20,
  },
  
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
  
  settingsIcon: {
    fontSize: 20,
  },
  
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.background.secondary,
    marginTop: theme.spacing.xs,
  },
  
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.xs,
  },
  
  statusText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
});

export default DashboardHeader;