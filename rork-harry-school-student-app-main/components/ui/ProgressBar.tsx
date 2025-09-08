import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Colors from '@/constants/colors';

interface ProgressBarProps {
  progress: number; // 0-1
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  animated?: boolean;
  testID?: string;
}

export default function ProgressBar({
  progress,
  height = 8,
  backgroundColor = Colors.borderLight,
  progressColor = Colors.primary,
  animated = true,
  testID,
}: ProgressBarProps) {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedWidth, {
        toValue: progress,
        duration: 500,
        useNativeDriver: false,
      }).start();
    } else {
      animatedWidth.setValue(progress);
    }
  }, [progress, animated]);

  return (
    <View
      style={[
        styles.container,
        { height, backgroundColor },
      ]}
      testID={testID}
    >
      <Animated.View
        style={[
          styles.progress,
          {
            height,
            backgroundColor: progressColor,
            width: animatedWidth.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  progress: {
    borderRadius: 4,
  },
});