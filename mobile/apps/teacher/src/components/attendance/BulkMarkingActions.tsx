import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const { width: screenWidth } = Dimensions.get('window');

interface QuickAction {
  label: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  frequency: number;
  color: string;
  icon: React.ReactNode;
}

interface BulkMarkingActionsProps {
  actions: QuickAction[];
  selectedCount: number;
  totalCount: number;
  isMarking: boolean;
  onAction: (status: QuickAction['status']) => void;
}

export function BulkMarkingActions({
  actions,
  selectedCount,
  totalCount,
  isMarking,
  onAction,
}: BulkMarkingActionsProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = (action: QuickAction) => {
    scale.value = withSpring(0.95, { duration: 150 }, () => {
      scale.value = withSpring(1, { duration: 150 });
    });
    onAction(action.status);
  };

  return (
    <View style={styles.container}>
      {/* Selection Info */}
      <View style={styles.selectionInfo}>
        <Text style={styles.selectionText}>
          {selectedCount > 0 
            ? `${selectedCount} of ${totalCount} students selected`
            : 'Quick Actions - Select students first'
          }
        </Text>
        {selectedCount > 0 && (
          <View style={styles.selectionIndicator}>
            <View 
              style={[
                styles.selectionBar,
                { width: `${(selectedCount / totalCount) * 100}%` }
              ]} 
            />
          </View>
        )}
      </View>

      {/* Quick Action Buttons */}
      <View style={styles.actionsContainer}>
        {actions.map((action, index) => {
          const isDisabled = isMarking || (action.status !== 'present' && selectedCount === 0);
          
          return (
            <Animated.View key={action.status} style={animatedStyle}>
              <Pressable
                style={[
                  styles.actionButton,
                  { 
                    backgroundColor: isDisabled ? '#94a3b8' : action.color,
                    width: (screenWidth - 48 - (actions.length - 1) * 8) / actions.length,
                  }
                ]}
                onPress={() => handlePress(action)}
                disabled={isDisabled}
                android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
              >
                <View style={styles.iconContainer}>
                  {action.icon}
                </View>
                <Text style={styles.actionLabel} numberOfLines={2}>
                  {action.label}
                </Text>
                <Text style={styles.frequencyText}>
                  {action.frequency}% usage
                </Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionText}>
          💡 Tip: Start with "Mark All Present", then select absent students
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  selectionInfo: {
    marginBottom: 16,
  },
  selectionText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 8,
  },
  selectionIndicator: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  selectionBar: {
    height: '100%',
    backgroundColor: '#1d7452',
    borderRadius: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  actionButton: {
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconContainer: {
    marginBottom: 6,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 2,
  },
  frequencyText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  instructionsContainer: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 12,
  },
  instructionText: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 16,
  },
});