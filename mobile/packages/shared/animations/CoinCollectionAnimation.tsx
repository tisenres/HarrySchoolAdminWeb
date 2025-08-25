import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  runOnJS,
  interpolate,
  Easing,
  withRepeat,
} from 'react-native-reanimated';
import { Canvas, Group, Circle, Path, Skia, LinearGradient, vec } from '@shopify/react-native-skia';
import { Haptics } from 'expo-haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface CoinCollectionProps {
  visible: boolean;
  coinValue: number;
  startPosition: { x: number; y: number };
  targetPosition: { x: number; y: number };
  coinType: 'knowledge' | 'achievement' | 'bonus' | 'streak';
  culturalDesign: 'islamic_pattern' | 'geometric' | 'calligraphy' | 'star';
  onAnimationComplete?: (collectedValue: number) => void;
  respectPrayerTime?: boolean;
  age: 'elementary' | 'middle' | 'high';
  showValue?: boolean;
}

interface CoinTrajectory {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  controlX: number;
  controlY: number;
  duration: number;
}

export const CoinCollectionAnimation: React.FC<CoinCollectionProps> = ({
  visible,
  coinValue,
  startPosition,
  targetPosition,
  coinType,
  culturalDesign,
  onAnimationComplete,
  respectPrayerTime = true,
  age,
  showValue = true,
}) => {
  const coinProgress = useSharedValue(0);
  const scaleValue = useSharedValue(1);
  const rotationValue = useSharedValue(0);
  const glowValue = useSharedValue(0);
  const valueTextScale = useSharedValue(0);

  // Cultural coin colors and patterns
  const coinDesigns = {
    islamic_pattern: {
      primaryColor: '#1D7452', // Islamic green
      secondaryColor: '#F1C40F', // Gold accent
      pattern: 'geometric_star',
      glowColor: '#2ECC71',
    },
    geometric: {
      primaryColor: '#3498DB', // Blue
      secondaryColor: '#9B59B6', // Purple accent
      pattern: 'hexagon',
      glowColor: '#5DADE2',
    },
    calligraphy: {
      primaryColor: '#2C3E50', // Dark blue-gray
      secondaryColor: '#ECF0F1', // Light accent
      pattern: 'arabic_script',
      glowColor: '#34495E',
    },
    star: {
      primaryColor: '#E67E22', // Orange
      secondaryColor: '#F39C12', // Golden orange
      pattern: 'eight_pointed_star',
      glowColor: '#F8C471',
    },
  };

  // Age-appropriate coin sizes and animation speeds
  const ageConfigurations = {
    elementary: {
      coinSize: 32,
      animationDuration: 1200,
      bounceHeight: 40,
      rotations: 2,
    },
    middle: {
      coinSize: 28,
      animationDuration: 1000,
      bounceHeight: 30,
      rotations: 1.5,
    },
    high: {
      coinSize: 24,
      animationDuration: 800,
      bounceHeight: 20,
      rotations: 1,
    },
  };

  const coinDesign = coinDesigns[culturalDesign];
  const config = ageConfigurations[age];

  const createIslamicStarPattern = (size: number): string => {
    const points = 8;
    const outerRadius = size * 0.4;
    const innerRadius = size * 0.2;
    let path = '';
    
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      if (i === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    }
    path += ' Z';
    return path;
  };

  const createGeometricPattern = (size: number): string => {
    const points = 6;
    const radius = size * 0.3;
    let path = '';
    
    for (let i = 0; i <= points; i++) {
      const angle = (i * 2 * Math.PI) / points;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      if (i === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    }
    return path;
  };

  const calculateTrajectory = (): CoinTrajectory => {
    const midX = (startPosition.x + targetPosition.x) / 2;
    const midY = Math.min(startPosition.y, targetPosition.y) - config.bounceHeight;
    
    return {
      startX: startPosition.x,
      startY: startPosition.y,
      endX: targetPosition.x,
      endY: targetPosition.y,
      controlX: midX,
      controlY: midY,
      duration: config.animationDuration,
    };
  };

  const triggerHapticFeedback = () => {
    if (Platform.OS === 'ios') {
      // Light haptic for coin collection
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const triggerCollectionHaptic = () => {
    if (Platform.OS === 'ios') {
      // Success haptic for collection completion
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const checkPrayerTimeRestriction = (): boolean => {
    if (!respectPrayerTime) return false;
    
    const now = new Date();
    const hour = now.getHours();
    
    // Simplified prayer time check
    const prayerHours = [5, 12, 15, 18, 20];
    return prayerHours.includes(hour);
  };

  const startAnimation = () => {
    const trajectory = calculateTrajectory();
    const isPrayerTime = checkPrayerTimeRestriction();
    const duration = isPrayerTime ? trajectory.duration * 1.5 : trajectory.duration;
    
    // Initial coin appearance with bounce
    scaleValue.value = withSequence(
      withSpring(1.3, { damping: 10, stiffness: 200 }),
      withSpring(1, { damping: 15, stiffness: 300 })
    );

    // Rotation animation
    rotationValue.value = withTiming(config.rotations * 360, {
      duration: duration,
      easing: Easing.out(Easing.cubic),
    });

    // Glow effect
    glowValue.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0.3, { duration: 300 })
      ),
      -1,
      true
    );

    // Main trajectory animation
    coinProgress.value = withTiming(1, {
      duration: duration,
      easing: Easing.out(Easing.cubic),
    }, (finished) => {
      if (finished) {
        runOnJS(triggerCollectionHaptic)();
        
        // Value text pop animation
        if (showValue) {
          valueTextScale.value = withSequence(
            withSpring(1.5, { damping: 10, stiffness: 300 }),
            withTiming(0, { duration: 300 })
          );
        }
        
        // Scale down coin
        scaleValue.value = withTiming(0, { duration: 200 });
        
        // Complete animation
        setTimeout(() => {
          runOnJS(onAnimationComplete)?.(coinValue);
        }, showValue ? 600 : 200);
      }
    });

    // Trigger initial haptic
    triggerHapticFeedback();
  };

  useEffect(() => {
    if (visible) {
      startAnimation();
    } else {
      // Reset all values
      coinProgress.value = 0;
      scaleValue.value = 1;
      rotationValue.value = 0;
      glowValue.value = 0;
      valueTextScale.value = 0;
    }
  }, [visible]);

  const coinAnimatedStyle = useAnimatedStyle(() => {
    const trajectory = calculateTrajectory();
    
    // Quadratic bezier curve for smooth trajectory
    const t = coinProgress.value;
    const x = (1 - t) * (1 - t) * trajectory.startX + 
             2 * (1 - t) * t * trajectory.controlX + 
             t * t * trajectory.endX;
    const y = (1 - t) * (1 - t) * trajectory.startY + 
             2 * (1 - t) * t * trajectory.controlY + 
             t * t * trajectory.endY;

    return {
      transform: [
        { translateX: x - config.coinSize / 2 },
        { translateY: y - config.coinSize / 2 },
        { scale: scaleValue.value },
        { rotateY: `${rotationValue.value}deg` },
      ],
      opacity: interpolate(coinProgress.value, [0, 0.1, 0.9, 1], [0, 1, 1, 0]),
    };
  });

  const glowAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: glowValue.value * 0.6,
      transform: [
        { scale: 1 + glowValue.value * 0.3 },
      ],
    };
  });

  const valueTextAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: valueTextScale.value },
        { translateY: -20 * valueTextScale.value },
      ],
      opacity: interpolate(valueTextScale.value, [0, 0.5, 1, 1.5], [0, 1, 1, 0]),
    };
  });

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Coin with cultural pattern */}
      <Animated.View style={[styles.coinContainer, coinAnimatedStyle]}>
        {/* Glow effect */}
        <Animated.View style={[styles.glow, glowAnimatedStyle]}>
          <Canvas style={styles.coinCanvas}>
            <Circle
              cx={config.coinSize / 2}
              cy={config.coinSize / 2}
              r={config.coinSize / 2}
              color={coinDesign.glowColor}
              opacity={0.6}
            />
          </Canvas>
        </Animated.View>

        {/* Main coin */}
        <Canvas style={styles.coinCanvas}>
          {/* Coin background gradient */}
          <Circle
            cx={config.coinSize / 2}
            cy={config.coinSize / 2}
            r={config.coinSize / 2 - 2}
          >
            <LinearGradient
              start={vec(0, 0)}
              end={vec(config.coinSize, config.coinSize)}
              colors={[coinDesign.primaryColor, coinDesign.secondaryColor]}
            />
          </Circle>

          {/* Cultural pattern overlay */}
          <Group
            transform={[
              { translateX: config.coinSize / 2 },
              { translateY: config.coinSize / 2 },
            ]}
          >
            {culturalDesign === 'islamic_pattern' && (
              <Path
                path={createIslamicStarPattern(config.coinSize)}
                color={coinDesign.secondaryColor}
                style="fill"
                opacity={0.8}
              />
            )}
            {culturalDesign === 'geometric' && (
              <Path
                path={createGeometricPattern(config.coinSize)}
                color={coinDesign.secondaryColor}
                style="fill"
                opacity={0.8}
              />
            )}
            {(culturalDesign === 'calligraphy' || culturalDesign === 'star') && (
              <Circle
                cx={0}
                cy={0}
                r={config.coinSize / 4}
                color={coinDesign.secondaryColor}
                opacity={0.8}
              />
            )}
          </Group>

          {/* Coin border */}
          <Circle
            cx={config.coinSize / 2}
            cy={config.coinSize / 2}
            r={config.coinSize / 2 - 1}
            color={coinDesign.secondaryColor}
            style="stroke"
            strokeWidth={2}
          />
        </Canvas>

        {/* Value text */}
        {showValue && (
          <Animated.View style={[styles.valueText, valueTextAnimatedStyle]}>
            <Canvas style={styles.textCanvas}>
              <Group>
                {/* Value background */}
                <Circle
                  cx={15}
                  cy={10}
                  r={12}
                  color={coinDesign.primaryColor}
                  opacity={0.9}
                />
                {/* Value text would be rendered here with custom text rendering */}
              </Group>
            </Canvas>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  coinContainer: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinCanvas: {
    width: 40,
    height: 40,
  },
  glow: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
  },
  valueText: {
    position: 'absolute',
    top: -15,
    alignSelf: 'center',
  },
  textCanvas: {
    width: 30,
    height: 20,
  },
});

// Coin type specific components
export const KnowledgeCoin: React.FC<{
  visible: boolean;
  value: number;
  startPos: { x: number; y: number };
  targetPos: { x: number; y: number };
  onComplete?: (value: number) => void;
  age: 'elementary' | 'middle' | 'high';
}> = ({ visible, value, startPos, targetPos, onComplete, age }) => (
  <CoinCollectionAnimation
    visible={visible}
    coinValue={value}
    startPosition={startPos}
    targetPosition={targetPos}
    coinType="knowledge"
    culturalDesign="islamic_pattern"
    age={age}
    onAnimationComplete={onComplete}
  />
);

export const AchievementCoin: React.FC<{
  visible: boolean;
  value: number;
  startPos: { x: number; y: number };
  targetPos: { x: number; y: number };
  onComplete?: (value: number) => void;
  age: 'elementary' | 'middle' | 'high';
}> = ({ visible, value, startPos, targetPos, onComplete, age }) => (
  <CoinCollectionAnimation
    visible={visible}
    coinValue={value}
    startPosition={startPos}
    targetPosition={targetPos}
    coinType="achievement"
    culturalDesign="star"
    age={age}
    onAnimationComplete={onComplete}
  />
);

export const BonusCoin: React.FC<{
  visible: boolean;
  value: number;
  startPos: { x: number; y: number };
  targetPos: { x: number; y: number };
  onComplete?: (value: number) => void;
  age: 'elementary' | 'middle' | 'high';
}> = ({ visible, value, startPos, targetPos, onComplete, age }) => (
  <CoinCollectionAnimation
    visible={visible}
    coinValue={value}
    startPosition={startPos}
    targetPosition={targetPos}
    coinType="bonus"
    culturalDesign="geometric"
    age={age}
    onAnimationComplete={onComplete}
  />
);

export default CoinCollectionAnimation;