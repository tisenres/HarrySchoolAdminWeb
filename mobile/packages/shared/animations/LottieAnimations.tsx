import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Platform,
  ViewStyle,
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
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import { Haptics } from 'expo-haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface LottieAnimationProps {
  animationName: LottieAnimationName;
  visible: boolean;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  loop?: boolean;
  autoPlay?: boolean;
  speed?: number;
  culturalTheme?: 'islamic' | 'modern' | 'educational' | 'celebration';
  respectPrayerTime?: boolean;
  onAnimationComplete?: () => void;
  onAnimationStart?: () => void;
  style?: ViewStyle;
}

export type LottieAnimationName =
  | 'achievement_star'
  | 'coin_collect'
  | 'level_up_burst'
  | 'loading_dots'
  | 'success_checkmark'
  | 'celebration_confetti'
  | 'book_flip'
  | 'progress_circle'
  | 'rocket_launch'
  | 'trophy_shine'
  | 'heart_beat'
  | 'clock_tick'
  | 'sync_spinner'
  | 'download_complete'
  | 'upload_complete';

export interface ComplexAnimationProps {
  visible: boolean;
  type: 'lesson_complete' | 'quiz_perfect' | 'daily_goal' | 'streak_milestone' | 'teacher_appreciation';
  culturalContext: 'prayer_time' | 'ramadan' | 'normal' | 'celebration';
  studentAge: 'elementary' | 'middle' | 'high';
  onComplete?: () => void;
}

// Lottie animation source mapping
const getLottieSource = (animationName: LottieAnimationName, culturalTheme: string = 'modern') => {
  // In a real implementation, these would be actual Lottie JSON files
  // For now, we'll use placeholder objects that represent the animation structure
  const animations = {
    achievement_star: {
      modern: require('../assets/lottie/achievement_star_modern.json'),
      islamic: require('../assets/lottie/achievement_star_islamic.json'),
      educational: require('../assets/lottie/achievement_star_educational.json'),
      celebration: require('../assets/lottie/achievement_star_celebration.json'),
    },
    coin_collect: {
      modern: require('../assets/lottie/coin_collect_modern.json'),
      islamic: require('../assets/lottie/coin_collect_islamic.json'),
      educational: require('../assets/lottie/coin_collect_educational.json'),
      celebration: require('../assets/lottie/coin_collect_celebration.json'),
    },
    level_up_burst: {
      modern: require('../assets/lottie/level_up_modern.json'),
      islamic: require('../assets/lottie/level_up_islamic.json'),
      educational: require('../assets/lottie/level_up_educational.json'),
      celebration: require('../assets/lottie/level_up_celebration.json'),
    },
    loading_dots: {
      modern: require('../assets/lottie/loading_dots.json'),
      islamic: require('../assets/lottie/loading_dots_islamic.json'),
      educational: require('../assets/lottie/loading_dots_educational.json'),
      celebration: require('../assets/lottie/loading_dots_celebration.json'),
    },
    success_checkmark: {
      modern: require('../assets/lottie/success_checkmark.json'),
      islamic: require('../assets/lottie/success_checkmark_islamic.json'),
      educational: require('../assets/lottie/success_checkmark_educational.json'),
      celebration: require('../assets/lottie/success_checkmark_celebration.json'),
    },
    celebration_confetti: {
      modern: require('../assets/lottie/confetti_modern.json'),
      islamic: require('../assets/lottie/confetti_islamic.json'),
      educational: require('../assets/lottie/confetti_educational.json'),
      celebration: require('../assets/lottie/confetti_celebration.json'),
    },
    book_flip: {
      modern: require('../assets/lottie/book_flip.json'),
      islamic: require('../assets/lottie/book_flip_islamic.json'),
      educational: require('../assets/lottie/book_flip_educational.json'),
      celebration: require('../assets/lottie/book_flip_celebration.json'),
    },
    progress_circle: {
      modern: require('../assets/lottie/progress_circle.json'),
      islamic: require('../assets/lottie/progress_circle_islamic.json'),
      educational: require('../assets/lottie/progress_circle_educational.json'),
      celebration: require('../assets/lottie/progress_circle_celebration.json'),
    },
    rocket_launch: {
      modern: require('../assets/lottie/rocket_launch.json'),
      islamic: require('../assets/lottie/rocket_launch_islamic.json'),
      educational: require('../assets/lottie/rocket_launch_educational.json'),
      celebration: require('../assets/lottie/rocket_launch_celebration.json'),
    },
    trophy_shine: {
      modern: require('../assets/lottie/trophy_shine.json'),
      islamic: require('../assets/lottie/trophy_shine_islamic.json'),
      educational: require('../assets/lottie/trophy_shine_educational.json'),
      celebration: require('../assets/lottie/trophy_shine_celebration.json'),
    },
    heart_beat: {
      modern: require('../assets/lottie/heart_beat.json'),
      islamic: require('../assets/lottie/heart_beat_islamic.json'),
      educational: require('../assets/lottie/heart_beat_educational.json'),
      celebration: require('../assets/lottie/heart_beat_celebration.json'),
    },
    clock_tick: {
      modern: require('../assets/lottie/clock_tick.json'),
      islamic: require('../assets/lottie/clock_tick_islamic.json'),
      educational: require('../assets/lottie/clock_tick_educational.json'),
      celebration: require('../assets/lottie/clock_tick_celebration.json'),
    },
    sync_spinner: {
      modern: require('../assets/lottie/sync_spinner.json'),
      islamic: require('../assets/lottie/sync_spinner_islamic.json'),
      educational: require('../assets/lottie/sync_spinner_educational.json'),
      celebration: require('../assets/lottie/sync_spinner_celebration.json'),
    },
    download_complete: {
      modern: require('../assets/lottie/download_complete.json'),
      islamic: require('../assets/lottie/download_complete_islamic.json'),
      educational: require('../assets/lottie/download_complete_educational.json'),
      celebration: require('../assets/lottie/download_complete_celebration.json'),
    },
    upload_complete: {
      modern: require('../assets/lottie/upload_complete.json'),
      islamic: require('../assets/lottie/upload_complete_islamic.json'),
      educational: require('../assets/lottie/upload_complete_educational.json'),
      celebration: require('../assets/lottie/upload_complete_celebration.json'),
    },
  };

  return animations[animationName]?.[culturalTheme] || animations[animationName]?.modern;
};

const getSizeStyle = (size: 'small' | 'medium' | 'large' | 'fullscreen') => {
  switch (size) {
    case 'small':
      return { width: 60, height: 60 };
    case 'medium':
      return { width: 120, height: 120 };
    case 'large':
      return { width: 200, height: 200 };
    case 'fullscreen':
      return { width: screenWidth, height: screenHeight };
    default:
      return { width: 120, height: 120 };
  }
};

export const LottieAnimation: React.FC<LottieAnimationProps> = ({
  animationName,
  visible,
  size = 'medium',
  loop = false,
  autoPlay = true,
  speed = 1,
  culturalTheme = 'modern',
  respectPrayerTime = true,
  onAnimationComplete,
  onAnimationStart,
  style,
}) => {
  const lottieRef = useRef<LottieView>(null);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  const checkPrayerTimeRestriction = (): boolean => {
    if (!respectPrayerTime) return false;
    
    const now = new Date();
    const hour = now.getHours();
    const prayerHours = [5, 12, 15, 18, 20];
    return prayerHours.includes(hour);
  };

  const getAnimationSpeed = (): number => {
    const isPrayerTime = checkPrayerTimeRestriction();
    return isPrayerTime ? speed * 0.7 : speed; // Slower during prayer time
  };

  useEffect(() => {
    if (visible) {
      if (onAnimationStart) {
        onAnimationStart();
      }

      // Entry animation
      opacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });

      // Start Lottie animation
      if (lottieRef.current) {
        lottieRef.current.play();
      }

      // Haptic feedback
      if (Platform.OS === 'ios' && !checkPrayerTimeRestriction()) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } else {
      // Exit animation
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0.8, { duration: 200 });

      if (lottieRef.current) {
        lottieRef.current.pause();
      }
    }
  }, [visible]);

  const handleAnimationFinish = () => {
    if (onAnimationComplete) {
      runOnJS(onAnimationComplete)();
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const sizeStyle = getSizeStyle(size);
  const animationSource = getLottieSource(animationName, culturalTheme);

  return (
    <Animated.View style={[styles.container, sizeStyle, animatedStyle, style]}>
      <LottieView
        ref={lottieRef}
        source={animationSource}
        autoPlay={autoPlay && visible}
        loop={loop}
        speed={getAnimationSpeed()}
        style={sizeStyle}
        onAnimationFinish={handleAnimationFinish}
        resizeMode="contain"
      />
    </Animated.View>
  );
};

export const ComplexLottieAnimation: React.FC<ComplexAnimationProps> = ({
  visible,
  type,
  culturalContext,
  studentAge,
  onComplete,
}) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [stageComplete, setStageComplete] = useState(false);

  const getAnimationSequence = () => {
    switch (type) {
      case 'lesson_complete':
        return [
          { animation: 'success_checkmark', duration: 1000 },
          { animation: 'achievement_star', duration: 1500 },
          { animation: 'celebration_confetti', duration: 2000 },
        ];
      case 'quiz_perfect':
        return [
          { animation: 'rocket_launch', duration: 1000 },
          { animation: 'trophy_shine', duration: 1500 },
          { animation: 'celebration_confetti', duration: 2000 },
        ];
      case 'daily_goal':
        return [
          { animation: 'progress_circle', duration: 1200 },
          { animation: 'heart_beat', duration: 800 },
          { animation: 'achievement_star', duration: 1000 },
        ];
      case 'streak_milestone':
        return [
          { animation: 'clock_tick', duration: 800 },
          { animation: 'level_up_burst', duration: 1500 },
          { animation: 'trophy_shine', duration: 1200 },
        ];
      case 'teacher_appreciation':
        return [
          { animation: 'heart_beat', duration: 1000 },
          { animation: 'book_flip', duration: 1200 },
          { animation: 'achievement_star', duration: 1000 },
        ];
      default:
        return [{ animation: 'success_checkmark', duration: 1000 }];
    }
  };

  const getCulturalTheme = (): string => {
    switch (culturalContext) {
      case 'prayer_time':
        return 'islamic';
      case 'ramadan':
        return 'islamic';
      case 'celebration':
        return 'celebration';
      case 'normal':
      default:
        return studentAge === 'elementary' ? 'educational' : 'modern';
    }
  };

  const getAnimationSize = (): 'small' | 'medium' | 'large' => {
    switch (studentAge) {
      case 'elementary':
        return 'large';
      case 'middle':
        return 'medium';
      case 'high':
        return 'medium';
      default:
        return 'medium';
    }
  };

  const animationSequence = getAnimationSequence();
  const culturalTheme = getCulturalTheme();
  const animationSize = getAnimationSize();

  useEffect(() => {
    if (visible && currentStage < animationSequence.length) {
      setStageComplete(false);
      
      const currentAnimation = animationSequence[currentStage];
      
      setTimeout(() => {
        setStageComplete(true);
        setCurrentStage(prev => prev + 1);
      }, currentAnimation.duration);
    } else if (currentStage >= animationSequence.length && onComplete) {
      setTimeout(() => {
        onComplete();
        setCurrentStage(0);
      }, 500);
    }
  }, [visible, currentStage, stageComplete]);

  if (!visible || currentStage >= animationSequence.length) {
    return null;
  }

  const currentAnimation = animationSequence[currentStage];

  return (
    <View style={styles.complexContainer}>
      <LottieAnimation
        animationName={currentAnimation.animation as LottieAnimationName}
        visible={!stageComplete}
        size={animationSize}
        culturalTheme={culturalTheme}
        respectPrayerTime={culturalContext === 'prayer_time'}
        autoPlay={true}
        loop={false}
      />
    </View>
  );
};

// Pre-configured Lottie components for common use cases
export const LoadingAnimation: React.FC<{
  visible: boolean;
  type?: 'dots' | 'spinner' | 'progress';
  culturalTheme?: 'islamic' | 'modern' | 'educational';
}> = ({ visible, type = 'dots', culturalTheme = 'modern' }) => {
  const animationName = type === 'spinner' ? 'sync_spinner' : 
                       type === 'progress' ? 'progress_circle' : 'loading_dots';

  return (
    <LottieAnimation
      animationName={animationName}
      visible={visible}
      size="medium"
      loop={true}
      culturalTheme={culturalTheme}
      respectPrayerTime={true}
    />
  );
};

export const SuccessAnimation: React.FC<{
  visible: boolean;
  type?: 'checkmark' | 'star' | 'trophy';
  size?: 'small' | 'medium' | 'large';
  onComplete?: () => void;
}> = ({ visible, type = 'checkmark', size = 'medium', onComplete }) => {
  const animationName = type === 'star' ? 'achievement_star' : 
                       type === 'trophy' ? 'trophy_shine' : 'success_checkmark';

  return (
    <LottieAnimation
      animationName={animationName}
      visible={visible}
      size={size}
      loop={false}
      culturalTheme="celebration"
      onAnimationComplete={onComplete}
    />
  );
};

export const CelebrationAnimation: React.FC<{
  visible: boolean;
  intensity?: 'mild' | 'moderate' | 'intense';
  culturalContext?: 'normal' | 'islamic' | 'ramadan';
  onComplete?: () => void;
}> = ({ visible, intensity = 'moderate', culturalContext = 'normal', onComplete }) => {
  const getAnimationType = () => {
    switch (intensity) {
      case 'mild':
        return 'heart_beat';
      case 'moderate':
        return 'achievement_star';
      case 'intense':
        return 'celebration_confetti';
      default:
        return 'achievement_star';
    }
  };

  const getCulturalTheme = () => {
    switch (culturalContext) {
      case 'islamic':
      case 'ramadan':
        return 'islamic';
      case 'normal':
      default:
        return 'celebration';
    }
  };

  return (
    <LottieAnimation
      animationName={getAnimationType()}
      visible={visible}
      size="large"
      loop={false}
      culturalTheme={getCulturalTheme()}
      respectPrayerTime={culturalContext === 'islamic' || culturalContext === 'ramadan'}
      onAnimationComplete={onComplete}
    />
  );
};

// Interactive Lottie component with gesture support
export const InteractiveLottieAnimation: React.FC<{
  animationName: LottieAnimationName;
  visible: boolean;
  onTap?: () => void;
  onLongPress?: () => void;
  size?: 'small' | 'medium' | 'large';
  culturalTheme?: string;
}> = ({ 
  animationName, 
  visible, 
  onTap, 
  onLongPress, 
  size = 'medium',
  culturalTheme = 'modern' 
}) => {
  const scaleValue = useSharedValue(1);

  const handlePressIn = () => {
    scaleValue.value = withSpring(0.95, { damping: 10, stiffness: 400 });
  };

  const handlePressOut = () => {
    scaleValue.value = withSpring(1, { damping: 10, stiffness: 400 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Animated.Pressable
        onPress={onTap}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.interactive}
      >
        <LottieAnimation
          animationName={animationName}
          visible={visible}
          size={size}
          culturalTheme={culturalTheme}
        />
      </Animated.Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  complexContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  interactive: {
    borderRadius: 8,
    overflow: 'hidden',
  },
});

export default LottieAnimation;