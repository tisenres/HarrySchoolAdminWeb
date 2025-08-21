/**
 * TaskHeader.tsx
 * Unified task header component with progress, timer, and navigation
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Component imports
import { Header } from '@harry-school/ui';

// Type imports
import type { StudentAgeGroup } from '../../../navigation/types';

interface TaskHeaderProps {
  title: string;
  subtitle?: string;
  progress: number; // 0-100
  timeElapsed?: number; // seconds
  showTimer?: boolean;
  onBack: () => void;
  onHelp?: () => void;
  rightComponent?: React.ReactNode;
  ageGroup: StudentAgeGroup;
}

export const TaskHeader: React.FC<TaskHeaderProps> = ({
  title,
  subtitle,
  progress,
  timeElapsed = 0,
  showTimer = true,
  onBack,
  onHelp,
  rightComponent,
  ageGroup,
}) => {
  const insets = useSafeAreaInsets();

  // Format elapsed time
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Age-appropriate styling
  const getAgeStyles = () => {
    switch (ageGroup) {
      case '10-12':
        return {
          fontSize: 20,
          progressHeight: 8,
          showEmojis: true,
        };
      case '13-15':
        return {
          fontSize: 18,
          progressHeight: 6,
          showEmojis: false,
        };
      case '16-18':
        return {
          fontSize: 16,
          progressHeight: 4,
          showEmojis: false,
        };
      default:
        return {
          fontSize: 18,
          progressHeight: 6,
          showEmojis: false,
        };
    }
  };

  const ageStyles = getAgeStyles();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Main header */}
      <Header
        title={title}
        subtitle={subtitle}
        showBack
        onBack={onBack}
        rightComponent={
          <View style={styles.rightSection}>
            {showTimer && timeElapsed > 0 && (
              <View style={styles.timerContainer}>
                <Text style={[styles.timerText, { fontSize: ageStyles.fontSize - 2 }]}>
                  {formatTime(timeElapsed)}
                </Text>
              </View>
            )}
            {onHelp && (
              <Pressable
                style={styles.helpButton}
                onPress={onHelp}
                accessible={true}
                accessibilityLabel="Get help"
                accessibilityHint="Tap for instructions and hints"
              >
                <Text style={styles.helpIcon}>
                  {ageStyles.showEmojis ? '❓' : '?'}
                </Text>
              </Pressable>
            )}
            {rightComponent}
          </View>
        }
      />

      {/* Progress bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressLabel, { fontSize: ageStyles.fontSize - 4 }]}>
            {ageGroup === '10-12' 
              ? `${progress}% complete! ${getProgressEmoji(progress)}`
              : `Progress: ${progress}%`
            }
          </Text>
        </View>
        
        <View style={[styles.progressBarTrack, { height: ageStyles.progressHeight }]}>
          <View 
            style={[
              styles.progressBarFill, 
              { 
                width: `${progress}%`,
                height: ageStyles.progressHeight,
                backgroundColor: getProgressColor(progress, ageGroup),
              }
            ]} 
          />
        </View>
      </View>
    </View>
  );
};

// Helper functions
const getProgressEmoji = (progress: number): string => {
  if (progress < 25) return '🌱';
  if (progress < 50) return '🌿';
  if (progress < 75) return '🌳';
  if (progress < 100) return '🏆';
  return '🎉';
};

const getProgressColor = (progress: number, ageGroup: StudentAgeGroup): string => {
  if (ageGroup === '10-12') {
    // More colorful for elementary
    if (progress < 25) return '#10B981'; // Green
    if (progress < 50) return '#3B82F6'; // Blue  
    if (progress < 75) return '#8B5CF6'; // Purple
    return '#F59E0B'; // Orange
  } else {
    // More professional for older students
    if (progress < 50) return '#EF4444'; // Red for early progress
    if (progress < 75) return '#F59E0B'; // Orange for mid progress
    return '#10B981'; // Green for near completion
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timerContainer: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    fontVariant: ['tabular-nums'],
  },
  helpButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpIcon: {
    fontSize: 16,
    color: '#4338CA',
    fontWeight: '600',
  },
  progressSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  progressBarTrack: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    borderRadius: 8,
    transition: Platform.select({
      web: 'width 0.3s ease-in-out',
      default: undefined,
    }),
  },
});