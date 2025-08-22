import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const COLORS = {
  primary: '#1d7452',
  secondary: '#2d9e6a',
  gold: '#f7c52d',
  white: '#ffffff',
  text: '#1a1a1a',
  textSecondary: '#64748b',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  lightGreen: '#dcfce7',
  lightBlue: '#dbeafe',
  lightRed: '#fee2e2',
  lightGray: '#f8fafc',
};

type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

export default function SyncStatusIndicator() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [pendingItems, setPendingItems] = useState(0);
  const spinValue = new Animated.Value(0);

  // Simulate sync status changes
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate different sync states
      const states: SyncStatus[] = ['synced', 'syncing', 'offline'];
      const randomState = states[Math.floor(Math.random() * states.length)];
      
      if (randomState === 'syncing') {
        setSyncStatus('syncing');
        setPendingItems(Math.floor(Math.random() * 5) + 1);
        
        // Start spinning animation
        Animated.loop(
          Animated.timing(spinValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          })
        ).start();

        // Complete sync after 3 seconds
        setTimeout(() => {
          setSyncStatus('synced');
          setLastSyncTime(new Date());
          setPendingItems(0);
          spinValue.setValue(0);
        }, 3000);
      } else {
        setSyncStatus(randomState);
        if (randomState === 'offline') {
          setPendingItems(Math.floor(Math.random() * 3) + 1);
        }
      }
    }, 15000); // Change status every 15 seconds

    return () => clearInterval(interval);
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getSyncStatusConfig = (status: SyncStatus) => {
    switch (status) {
      case 'synced':
        return {
          color: COLORS.success,
          bgColor: COLORS.lightGreen,
          icon: 'cloud-done',
          text: 'All synced',
          description: `Last sync: ${getTimeAgo(lastSyncTime)}`,
        };
      case 'syncing':
        return {
          color: COLORS.warning,
          bgColor: '#fef3c7',
          icon: 'sync',
          text: 'Syncing...',
          description: `${pendingItems} items pending`,
        };
      case 'offline':
        return {
          color: COLORS.textSecondary,
          bgColor: COLORS.lightGray,
          icon: 'cloud-off',
          text: 'Offline mode',
          description: `${pendingItems} items cached`,
        };
      case 'error':
        return {
          color: COLORS.error,
          bgColor: COLORS.lightRed,
          icon: 'error',
          text: 'Sync failed',
          description: 'Tap to retry',
        };
      default:
        return {
          color: COLORS.textSecondary,
          bgColor: COLORS.lightGray,
          icon: 'cloud',
          text: 'Unknown',
          description: '',
        };
    }
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const handleSyncTap = () => {
    if (syncStatus === 'error' || syncStatus === 'offline') {
      setSyncStatus('syncing');
      setPendingItems(2);
      
      // Start spinning animation
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();

      // Complete sync after 2 seconds
      setTimeout(() => {
        setSyncStatus('synced');
        setLastSyncTime(new Date());
        setPendingItems(0);
        spinValue.setValue(0);
      }, 2000);
    }
  };

  const config = getSyncStatusConfig(syncStatus);
  const isInteractive = syncStatus === 'error' || syncStatus === 'offline';

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: config.bgColor }]}
      onPress={handleSyncTap}
      disabled={!isInteractive}
      activeOpacity={isInteractive ? 0.7 : 1}
    >
      <View style={styles.content}>
        <View style={styles.iconSection}>
          <Animated.View
            style={[
              styles.iconContainer,
              { backgroundColor: `${config.color}20` },
              syncStatus === 'syncing' && { transform: [{ rotate: spin }] }
            ]}
          >
            <Icon name={config.icon} size={16} color={config.color} />
          </Animated.View>
          
          {/* Connection quality indicator */}
          <View style={styles.signalStrength}>
            <View style={[
              styles.signalBar,
              { 
                backgroundColor: syncStatus === 'offline' ? COLORS.textSecondary : config.color,
                opacity: 1 
              }
            ]} />
            <View style={[
              styles.signalBar,
              { 
                backgroundColor: syncStatus === 'offline' ? COLORS.textSecondary : config.color,
                opacity: syncStatus === 'synced' ? 1 : 0.4 
              }
            ]} />
            <View style={[
              styles.signalBar,
              { 
                backgroundColor: syncStatus === 'offline' ? COLORS.textSecondary : config.color,
                opacity: syncStatus === 'synced' ? 1 : 0.2 
              }
            ]} />
          </View>
        </View>

        <View style={styles.textSection}>
          <Text style={[styles.statusText, { color: config.color }]}>
            {config.text}
          </Text>
          <Text style={styles.descriptionText}>
            {config.description}
          </Text>
        </View>

        {/* Additional info based on status */}
        <View style={styles.infoSection}>
          {syncStatus === 'synced' && (
            <View style={styles.badge}>
              <Icon name="check" size={10} color={COLORS.success} />
            </View>
          )}
          
          {syncStatus === 'syncing' && (
            <View style={styles.progressDots}>
              <View style={[styles.dot, { backgroundColor: config.color }]} />
              <View style={[styles.dot, { backgroundColor: config.color, opacity: 0.6 }]} />
              <View style={[styles.dot, { backgroundColor: config.color, opacity: 0.3 }]} />
            </View>
          )}
          
          {(syncStatus === 'offline' || syncStatus === 'error') && pendingItems > 0 && (
            <View style={[styles.pendingBadge, { backgroundColor: config.color }]}>
              <Text style={styles.pendingCount}>{pendingItems}</Text>
            </View>
          )}
        </View>

        {/* Retry indicator */}
        {isInteractive && (
          <View style={styles.retryIndicator}>
            <Icon name="refresh" size={12} color={config.color} />
          </View>
        )}
      </View>

      {/* Islamic connectivity note */}
      {syncStatus === 'synced' && (
        <View style={styles.islamicNote}>
          <Icon name="wifi" size={12} color={COLORS.gold} />
          <Text style={styles.islamicNoteText}>
            Connected with Barakah 🌙
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  signalStrength: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  signalBar: {
    width: 2,
    marginHorizontal: 0.5,
  },
  textSection: {
    flex: 1,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 1,
  },
  descriptionText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  infoSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  badge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.lightGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 1,
  },
  pendingBadge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  pendingCount: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  retryIndicator: {
    marginLeft: 4,
  },
  islamicNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: `${COLORS.gold}30`,
  },
  islamicNoteText: {
    fontSize: 10,
    color: COLORS.gold,
    marginLeft: 4,
    fontWeight: '500',
  },
});

// Add signal bar heights
const signalBarStyles = StyleSheet.create({
  signalBar: {
    width: 2,
    marginHorizontal: 0.5,
  },
});

// Update the signal bars with different heights
const signalBarHeights = [6, 10, 14];
signalBarHeights.forEach((height, index) => {
  signalBarStyles[`signalBar${index}`] = {
    ...signalBarStyles.signalBar,
    height,
  };
});