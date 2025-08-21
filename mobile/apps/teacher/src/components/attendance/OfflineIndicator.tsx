import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import Svg, { Path, Circle } from 'react-native-svg';

interface OfflineIndicatorProps {
  isOnline: boolean;
  pendingChanges: number;
  onSyncPress: () => void;
}

export function OfflineIndicator({
  isOnline,
  pendingChanges,
  onSyncPress,
}: OfflineIndicatorProps) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  React.useEffect(() => {
    if (!isOnline || pendingChanges > 0) {
      rotation.value = withRepeat(
        withSequence(
          withSpring(360, { duration: 2000 }),
          withSpring(0, { duration: 0 })
        ),
        -1,
        false
      );
    }
  }, [isOnline, pendingChanges]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  const handleSyncPress = () => {
    scale.value = withSpring(0.9, { duration: 100 }, () => {
      scale.value = withSpring(1, { duration: 100 });
    });
    onSyncPress();
  };

  if (isOnline && pendingChanges === 0) {
    return (
      <View style={[styles.container, styles.onlineContainer]}>
        <Circle cx={8} cy={8} r={6} fill="#10b981" />
        <Text style={styles.onlineText}>All changes synced</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.offlineContainer]}>
      <View style={styles.statusRow}>
        <View style={styles.statusInfo}>
          <Circle cx={8} cy={8} r={6} fill={isOnline ? "#f59e0b" : "#dc2626"} />
          <View style={styles.statusText}>
            <Text style={styles.statusTitle}>
              {isOnline ? 'Pending Sync' : 'Offline Mode'}
            </Text>
            <Text style={styles.statusSubtitle}>
              {pendingChanges > 0
                ? `${pendingChanges} changes to sync`
                : 'Changes saved locally'
              }
            </Text>
          </View>
        </View>

        {pendingChanges > 0 && isOnline && (
          <Pressable
            style={styles.syncButton}
            onPress={handleSyncPress}
          >
            <Animated.View style={animatedStyle}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M1 4V10H7M23 20V14H17M20.49 9C19.9828 7.56678 19.1209 6.28923 17.9845 5.27412C16.8482 4.259 15.4745 3.54524 13.9917 3.19454C12.5089 2.84384 10.9652 2.86688 9.49209 3.26141C8.01899 3.65594 6.66989 4.40546 5.57 5.43L1 10M23 14L18.43 18.57C17.3301 19.5945 15.981 20.3441 14.5079 20.7386C13.0348 21.1331 11.4911 21.1562 10.0083 20.8055C8.52547 20.4548 7.1518 19.741 6.01547 18.7259C4.87913 17.7108 4.01717 16.4332 3.51 15"
                  stroke="#1d7452"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Animated.View>
            <Text style={styles.syncButtonText}>Sync Now</Text>
          </Pressable>
        )}
      </View>

      {!isOnline && (
        <View style={styles.offlineInfo}>
          <Text style={styles.offlineInfoText}>
            📱 Attendance is being saved locally. Changes will sync automatically when you're back online.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 12,
  },
  onlineContainer: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
    marginLeft: 8,
  },
  offlineContainer: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusText: {
    marginLeft: 8,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 2,
  },
  statusSubtitle: {
    fontSize: 12,
    color: '#a16207',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1d7452',
  },
  syncButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1d7452',
    marginLeft: 6,
  },
  offlineInfo: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
  },
  offlineInfoText: {
    fontSize: 12,
    color: '#7f1d1d',
    lineHeight: 16,
  },
});