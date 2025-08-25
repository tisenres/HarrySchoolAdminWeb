import React, { ReactNode } from 'react';
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
  withSpring,
  withSequence,
  interpolate,
  runOnJS,
  Easing,
  SlideInRight,
  SlideOutLeft,
  SlideInLeft,
  SlideOutRight,
  FadeIn,
  FadeOut,
  Layout,
  SlideInUp,
  SlideOutDown,
} from 'react-native-reanimated';
import { Haptics } from 'expo-haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface TransitionConfig {
  type: 'slide' | 'fade' | 'scale' | 'flip' | 'modal' | 'professional';
  direction?: 'left' | 'right' | 'up' | 'down';
  duration?: number;
  easing?: 'ease' | 'spring' | 'linear' | 'professional';
  hapticFeedback?: boolean;
  respectPrayerTime?: boolean;
}

export interface TeacherTransitionProps {
  children: ReactNode;
  config: TransitionConfig;
  visible: boolean;
  onTransitionComplete?: () => void;
}

// Professional easing curves for teacher workflows
const professionalEasing = {
  ease: Easing.out(Easing.cubic),
  spring: { damping: 20, stiffness: 400 },
  linear: Easing.linear,
  professional: Easing.bezier(0.4, 0.0, 0.2, 1), // Material Design easing
};

export const TeacherTransition: React.FC<TeacherTransitionProps> = ({
  children,
  config,
  visible,
  onTransitionComplete,
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(visible ? 1 : 0);
  const scale = useSharedValue(visible ? 1 : 0.95);
  const rotateY = useSharedValue(0);

  const checkPrayerTimeRestriction = (): boolean => {
    if (!config.respectPrayerTime) return false;
    
    const now = new Date();
    const hour = now.getHours();
    const prayerHours = [5, 12, 15, 18, 20];
    return prayerHours.includes(hour);
  };

  const triggerHapticFeedback = () => {
    if (config.hapticFeedback && Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const getDuration = (): number => {
    const baseDuration = config.duration || 300;
    const isPrayerTime = checkPrayerTimeRestriction();
    return isPrayerTime ? baseDuration * 1.2 : baseDuration;
  };

  const getEasing = () => {
    return professionalEasing[config.easing || 'professional'];
  };

  const performTransition = () => {
    const duration = getDuration();
    const easing = getEasing();

    triggerHapticFeedback();

    switch (config.type) {
      case 'slide':
        handleSlideTransition(duration, easing);
        break;
      case 'fade':
        handleFadeTransition(duration, easing);
        break;
      case 'scale':
        handleScaleTransition(duration, easing);
        break;
      case 'flip':
        handleFlipTransition(duration, easing);
        break;
      case 'modal':
        handleModalTransition(duration, easing);
        break;
      case 'professional':
        handleProfessionalTransition(duration, easing);
        break;
      default:
        handleFadeTransition(duration, easing);
    }
  };

  const handleSlideTransition = (duration: number, easing: any) => {
    const direction = config.direction || 'right';
    const slideDistance = direction === 'left' || direction === 'right' ? screenWidth : screenHeight;
    
    if (visible) {
      // Slide in
      if (direction === 'right') {
        translateX.value = slideDistance;
        translateX.value = withTiming(0, { duration, easing }, runOnJS(onTransitionComplete));
      } else if (direction === 'left') {
        translateX.value = -slideDistance;
        translateX.value = withTiming(0, { duration, easing }, runOnJS(onTransitionComplete));
      } else if (direction === 'down') {
        translateY.value = -slideDistance;
        translateY.value = withTiming(0, { duration, easing }, runOnJS(onTransitionComplete));
      } else if (direction === 'up') {
        translateY.value = slideDistance;
        translateY.value = withTiming(0, { duration, easing }, runOnJS(onTransitionComplete));
      }
    } else {
      // Slide out
      if (direction === 'right') {
        translateX.value = withTiming(-slideDistance, { duration, easing }, runOnJS(onTransitionComplete));
      } else if (direction === 'left') {
        translateX.value = withTiming(slideDistance, { duration, easing }, runOnJS(onTransitionComplete));
      } else if (direction === 'down') {
        translateY.value = withTiming(slideDistance, { duration, easing }, runOnJS(onTransitionComplete));
      } else if (direction === 'up') {
        translateY.value = withTiming(-slideDistance, { duration, easing }, runOnJS(onTransitionComplete));
      }
    }
  };

  const handleFadeTransition = (duration: number, easing: any) => {
    opacity.value = withTiming(visible ? 1 : 0, { duration, easing }, runOnJS(onTransitionComplete));
  };

  const handleScaleTransition = (duration: number, easing: any) => {
    const targetScale = visible ? 1 : 0.95;
    const targetOpacity = visible ? 1 : 0;
    
    scale.value = withTiming(targetScale, { duration, easing });
    opacity.value = withTiming(targetOpacity, { duration, easing }, runOnJS(onTransitionComplete));
  };

  const handleFlipTransition = (duration: number, easing: any) => {
    if (visible) {
      rotateY.value = withSequence(
        withTiming(90, { duration: duration / 2, easing }),
        withTiming(0, { duration: duration / 2, easing }, runOnJS(onTransitionComplete))
      );
    } else {
      rotateY.value = withTiming(90, { duration: duration / 2, easing }, runOnJS(onTransitionComplete));
    }
  };

  const handleModalTransition = (duration: number, easing: any) => {
    if (visible) {
      translateY.value = screenHeight;
      scale.value = 0.9;
      opacity.value = 0;
      
      translateY.value = withSpring(0, professionalEasing.spring);
      scale.value = withSpring(1, professionalEasing.spring);
      opacity.value = withTiming(1, { duration, easing }, runOnJS(onTransitionComplete));
    } else {
      translateY.value = withSpring(screenHeight, professionalEasing.spring, runOnJS(onTransitionComplete));
      opacity.value = withTiming(0, { duration: duration * 0.8, easing });
    }
  };

  const handleProfessionalTransition = (duration: number, easing: any) => {
    // Smooth, professional transition combining multiple effects
    if (visible) {
      translateY.value = 20;
      opacity.value = 0;
      scale.value = 0.98;
      
      translateY.value = withTiming(0, { duration, easing });
      scale.value = withTiming(1, { duration, easing });
      opacity.value = withTiming(1, { duration, easing }, runOnJS(onTransitionComplete));
    } else {
      translateY.value = withTiming(-10, { duration, easing });
      opacity.value = withTiming(0, { duration, easing }, runOnJS(onTransitionComplete));
    }
  };

  React.useEffect(() => {
    performTransition();
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
        { perspective: 1000 },
        { rotateY: `${rotateY.value}deg` },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

// Pre-configured teacher workflow transitions
export const AttendanceCardTransition: React.FC<{
  children: ReactNode;
  visible: boolean;
  index?: number;
}> = ({ children, visible, index = 0 }) => (
  <Animated.View
    entering={SlideInRight.delay(index * 50).duration(400)}
    exiting={SlideOutLeft.duration(300)}
    layout={Layout.springify().damping(20).stiffness(400)}
  >
    {children}
  </Animated.View>
);

export const GradeEntryTransition: React.FC<{
  children: ReactNode;
  visible: boolean;
  onComplete?: () => void;
}> = ({ children, visible, onComplete }) => (
  <TeacherTransition
    config={{
      type: 'professional',
      duration: 350,
      easing: 'professional',
      hapticFeedback: true,
      respectPrayerTime: true,
    }}
    visible={visible}
    onTransitionComplete={onComplete}
  >
    {children}
  </TeacherTransition>
);

export const ClassManagementModal: React.FC<{
  children: ReactNode;
  visible: boolean;
  onComplete?: () => void;
}> = ({ children, visible, onComplete }) => (
  <TeacherTransition
    config={{
      type: 'modal',
      duration: 400,
      easing: 'spring',
      hapticFeedback: true,
      respectPrayerTime: true,
    }}
    visible={visible}
    onTransitionComplete={onComplete}
  >
    {children}
  </TeacherTransition>
);

export const NavigationTransition: React.FC<{
  children: ReactNode;
  direction: 'forward' | 'backward';
}> = ({ children, direction }) => (
  <Animated.View
    entering={direction === 'forward' ? SlideInRight.duration(300) : SlideInLeft.duration(300)}
    exiting={direction === 'forward' ? SlideOutLeft.duration(250) : SlideOutRight.duration(250)}
    layout={Layout.springify().damping(15).stiffness(300)}
  >
    {children}
  </Animated.View>
);

export const ReportGenerationProgress: React.FC<{
  children: ReactNode;
  visible: boolean;
  step: number;
  totalSteps: number;
}> = ({ children, visible, step, totalSteps }) => {
  const progressValue = useSharedValue(0);

  React.useEffect(() => {
    progressValue.value = withSpring((step / totalSteps) * 100, {
      damping: 20,
      stiffness: 400,
    });
  }, [step, totalSteps]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            progressValue.value,
            [0, 100],
            [20, 0]
          ),
        },
      ],
      opacity: interpolate(
        progressValue.value,
        [0, 10, 100],
        [0, 1, 1]
      ),
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <TeacherTransition
        config={{
          type: 'fade',
          duration: 200,
          easing: 'professional',
          hapticFeedback: false,
        }}
        visible={visible}
      >
        {children}
      </TeacherTransition>
    </Animated.View>
  );
};

export const StudentListItem: React.FC<{
  children: ReactNode;
  index: number;
  total: number;
}> = ({ children, index, total }) => (
  <Animated.View
    entering={SlideInUp.delay(index * 30).duration(400).springify().damping(20)}
    exiting={FadeOut.duration(200)}
    layout={Layout.springify().damping(18).stiffness(350)}
  >
    {children}
  </Animated.View>
);

export const QuickActionButton: React.FC<{
  children: ReactNode;
  onPress: () => void;
  actionType: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}> = ({ children, onPress, actionType }) => {
  const scaleValue = useSharedValue(1);
  const opacityValue = useSharedValue(1);

  const handlePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    scaleValue.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 15, stiffness: 400 })
    );

    opacityValue.value = withSequence(
      withTiming(0.8, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );

    setTimeout(onPress, 150);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
    opacity: opacityValue.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Animated.Pressable onPress={handlePress} style={styles.quickActionButton}>
        {children}
      </Animated.Pressable>
    </Animated.View>
  );
};

export const TabTransition: React.FC<{
  children: ReactNode;
  activeTab: number;
  tabIndex: number;
}> = ({ children, activeTab, tabIndex }) => {
  const isActive = activeTab === tabIndex;
  
  return (
    <Animated.View
      style={[
        styles.tabContent,
        { display: isActive ? 'flex' : 'none' }
      ]}
    >
      <TeacherTransition
        config={{
          type: 'fade',
          duration: 250,
          easing: 'professional',
          hapticFeedback: false,
        }}
        visible={isActive}
      >
        {children}
      </TeacherTransition>
    </Animated.View>
  );
};

// Cultural-aware transition wrapper
export const CulturalTeacherTransition: React.FC<{
  children: ReactNode;
  visible: boolean;
  culturalContext: 'prayer_time' | 'ramadan' | 'normal';
  onComplete?: () => void;
}> = ({ children, visible, culturalContext, onComplete }) => {
  const getTransitionConfig = (): TransitionConfig => {
    switch (culturalContext) {
      case 'prayer_time':
        return {
          type: 'fade',
          duration: 600, // Slower, more respectful
          easing: 'ease',
          hapticFeedback: false, // No haptic during prayer
          respectPrayerTime: true,
        };
      case 'ramadan':
        return {
          type: 'professional',
          duration: 450, // Slightly slower
          easing: 'ease',
          hapticFeedback: true,
          respectPrayerTime: true,
        };
      case 'normal':
      default:
        return {
          type: 'professional',
          duration: 300,
          easing: 'professional',
          hapticFeedback: true,
          respectPrayerTime: false,
        };
    }
  };

  return (
    <TeacherTransition
      config={getTransitionConfig()}
      visible={visible}
      onTransitionComplete={onComplete}
    >
      {children}
    </TeacherTransition>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  quickActionButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  tabContent: {
    flex: 1,
  },
});

export default TeacherTransition;