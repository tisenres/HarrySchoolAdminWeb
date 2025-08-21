/**
 * TaskProgress.tsx
 * Reusable task progress component with age-adaptive visualizations
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';

// Type imports
import type { StudentAgeGroup } from '../../../navigation/types';

interface TaskProgressProps {
  progress: number; // 0-100
  estimatedDuration?: number; // minutes
  showDuration?: boolean;
  showPercentage?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'bar' | 'circle' | 'steps';
  ageGroup: StudentAgeGroup;
  animated?: boolean;
}

export const TaskProgress: React.FC<TaskProgressProps> = ({
  progress,
  estimatedDuration,
  showDuration = true,
  showPercentage = true,
  size = 'medium',
  variant = 'bar',
  ageGroup,
  animated = true,
}) => {
  const animatedProgress = React.useRef(new Animated.Value(0)).current;

  // Animate progress changes
  React.useEffect(() => {
    if (animated) {
      Animated.timing(animatedProgress, {
        toValue: progress,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    } else {
      animatedProgress.setValue(progress);
    }
  }, [progress, animated, animatedProgress]);

  // Age-specific configurations
  const getAgeConfig = () => {
    switch (ageGroup) {
      case '10-12':
        return {
          showEmojis: true,
          colorful: true,
          encouragingText: true,
          largerSize: true,
        };
      case '13-15':
        return {
          showEmojis: false,
          colorful: false,
          encouragingText: true,
          largerSize: false,
        };
      case '16-18':
        return {
          showEmojis: false,
          colorful: false,
          encouragingText: false,
          largerSize: false,
        };
      default:
        return {
          showEmojis: false,
          colorful: false,
          encouragingText: false,
          largerSize: false,
        };
    }
  };

  const ageConfig = getAgeConfig();

  // Size configurations
  const getSizeConfig = () => {
    const baseSize = size === 'large' ? 1.2 : size === 'small' ? 0.8 : 1;
    const ageMultiplier = ageConfig.largerSize ? 1.1 : 1;
    
    return {
      height: Math.round(8 * baseSize * ageMultiplier),
      fontSize: Math.round(14 * baseSize * ageMultiplier),
      borderRadius: Math.round(4 * baseSize),
    };
  };

  const sizeConfig = getSizeConfig();

  // Progress color based on value and age group
  const getProgressColor = () => {
    if (ageConfig.colorful) {
      if (progress < 25) return '#EF4444'; // Red
      if (progress < 50) return '#F59E0B'; // Orange
      if (progress < 75) return '#3B82F6'; // Blue
      return '#10B981'; // Green
    } else {
      return '#1d7452'; // Harry School primary color
    }
  };

  // Progress message for elementary students
  const getProgressMessage = () => {
    if (!ageConfig.encouragingText) return null;
    
    if (ageGroup === '10-12') {
      if (progress < 25) return "Great start! 🌱";
      if (progress < 50) return "You're doing amazing! 🌿";
      if (progress < 75) return "Almost there! 🌳";
      if (progress < 100) return "So close! 🏆";
      return "Fantastic work! 🎉";
    } else if (ageGroup === '13-15') {
      if (progress < 50) return "Keep going, you've got this!";
      if (progress < 100) return "Great progress!";
      return "Well done!";
    }
    
    return null;
  };

  // Format duration
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return ageGroup === '10-12' ? `${minutes} mins` : `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
  };

  // Render based on variant
  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={[
        styles.progressTrack, 
        { 
          height: sizeConfig.height,
          borderRadius: sizeConfig.borderRadius,
        }
      ]}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: animatedProgress.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
                extrapolate: 'clamp',
              }),
              height: sizeConfig.height,
              borderRadius: sizeConfig.borderRadius,
              backgroundColor: getProgressColor(),
            },
          ]}
        />
      </View>
    </View>
  );

  const renderCircleProgress = () => {
    // Simplified circle progress for now
    // In a full implementation, this would use SVG or similar
    return (
      <View style={[styles.circleContainer, { width: 60, height: 60 }]}>
        <View style={styles.circleTrack}>
          <Text style={[styles.circleText, { fontSize: sizeConfig.fontSize }]}>
            {Math.round(progress)}%
          </Text>
        </View>
      </View>
    );
  };

  const renderStepProgress = () => {
    const steps = 5;
    const completedSteps = Math.ceil((progress / 100) * steps);
    
    return (
      <View style={styles.stepsContainer}>
        {Array.from({ length: steps }, (_, index) => (
          <View
            key={index}
            style={[
              styles.step,
              {
                backgroundColor: index < completedSteps 
                  ? getProgressColor() 
                  : '#E5E7EB',
                width: sizeConfig.height * 2,
                height: sizeConfig.height,
                borderRadius: sizeConfig.borderRadius,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  const renderProgress = () => {
    switch (variant) {
      case 'circle':
        return renderCircleProgress();
      case 'steps':
        return renderStepProgress();
      case 'bar':
      default:
        return renderProgressBar();
    }
  };

  return (
    <View style={styles.container}>
      {renderProgress()}
      
      <View style={styles.info}>
        {showPercentage && (
          <Text style={[styles.percentageText, { fontSize: sizeConfig.fontSize }]}>
            {Math.round(progress)}%
          </Text>
        )}
        
        {showDuration && estimatedDuration && (
          <Text style={[styles.durationText, { fontSize: sizeConfig.fontSize - 2 }]}>
            {formatDuration(estimatedDuration)}
          </Text>
        )}
      </View>
      
      {getProgressMessage() && (
        <Text style={[styles.messageText, { fontSize: sizeConfig.fontSize }]}>
          {getProgressMessage()}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  progressContainer: {
    marginBottom: 4,
  },
  progressTrack: {
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: '#1d7452',
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  circleTrack: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#1d7452',
  },
  circleText: {
    fontWeight: '600',
    color: '#1F2937',
  },
  stepsContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  step: {
    flex: 1,
  },
  info: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  percentageText: {
    fontWeight: '600',
    color: '#1F2937',
  },
  durationText: {
    color: '#6B7280',
  },
  messageText: {
    marginTop: 4,
    color: '#1d7452',
    fontWeight: '500',
    textAlign: 'center',
  },
});