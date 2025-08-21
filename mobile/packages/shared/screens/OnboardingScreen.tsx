import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  StatusBar,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  interpolate,
  runOnJS,
  Extrapolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeProvider';
import { UserRole } from './LoginScreen';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: (role: UserRole) => void;
  onSkip: () => void;
}

interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  gradient: string[];
  teacherFocused?: boolean;
  studentFocused?: boolean;
}

const onboardingSlides: OnboardingSlide[] = [
  {
    id: 'welcome',
    title: 'Welcome to Harry School',
    subtitle: 'Your Digital Learning Companion',
    description: 'Join thousands of students and teachers in our innovative educational platform designed for modern learning.',
    icon: '🎓',
    gradient: ['#1d7452', '#26a065'],
  },
  {
    id: 'teachers',
    title: 'For Teachers',
    subtitle: 'Powerful Tools at Your Fingertips',
    description: 'Manage classes, track student progress, create engaging content, and streamline your teaching workflow.',
    icon: '👨‍🏫',
    gradient: ['#3b82f6', '#60a5fa'],
    teacherFocused: true,
  },
  {
    id: 'students',
    title: 'For Students',
    subtitle: 'Learn, Grow, and Achieve',
    description: 'Access interactive lessons, track your progress, earn achievements, and connect with your learning community.',
    icon: '👨‍🎓',
    gradient: ['#f59e0b', '#fbbf24'],
    studentFocused: true,
  },
  {
    id: 'security',
    title: 'Safe & Secure',
    subtitle: 'Your Privacy Matters',
    description: 'Built with educational privacy standards in mind. COPPA, GDPR, and FERPA compliant with end-to-end encryption.',
    icon: '🔒',
    gradient: ['#10b981', '#34d399'],
  },
  {
    id: 'offline',
    title: 'Works Offline',
    subtitle: 'Learn Anywhere, Anytime',
    description: 'Continue learning even without internet connection. Your progress syncs automatically when you\'re back online.',
    icon: '📱',
    gradient: ['#8b5cf6', '#a78bfa'],
  },
];

const OnboardingSlide: React.FC<{
  slide: OnboardingSlide;
  index: number;
  currentIndex: number;
  theme: any;
}> = ({ slide, index, currentIndex, theme }) => {
  const slideAnimation = useSharedValue(0);
  const iconAnimation = useSharedValue(0);
  const textAnimation = useSharedValue(0);

  useEffect(() => {
    if (index === currentIndex) {
      // Animate in
      slideAnimation.value = withTiming(1, { duration: 600 });
      iconAnimation.value = withDelay(200, withSpring(1, { damping: 12 }));
      textAnimation.value = withDelay(400, withTiming(1, { duration: 500 }));
    } else {
      // Reset for next use
      slideAnimation.value = 0;
      iconAnimation.value = 0;
      textAnimation.value = 0;
    }
  }, [currentIndex, index]);

  const slideStyle = useAnimatedStyle(() => ({
    opacity: slideAnimation.value,
    transform: [
      {
        translateY: interpolate(
          slideAnimation.value,
          [0, 1],
          [50, 0],
          Extrapolate.CLAMP
        ),
      },
    ],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconAnimation.value },
      {
        rotate: `${interpolate(
          iconAnimation.value,
          [0, 1],
          [180, 0],
          Extrapolate.CLAMP
        )}deg`,
      },
    ],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textAnimation.value,
    transform: [
      {
        translateY: interpolate(
          textAnimation.value,
          [0, 1],
          [20, 0],
          Extrapolate.CLAMP
        ),
      },
    ],
  }));

  return (
    <Animated.View style={[styles.slide, slideStyle]}>
      <LinearGradient
        colors={slide.gradient}
        style={styles.slideGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.slideContent}>
          <Animated.Text style={[styles.slideIcon, iconStyle]}>
            {slide.icon}
          </Animated.Text>
          
          <Animated.View style={[styles.slideTextContainer, textStyle]}>
            <Text style={[styles.slideTitle, { color: '#ffffff' }]}>
              {slide.title}
            </Text>
            <Text style={[styles.slideSubtitle, { color: 'rgba(255, 255, 255, 0.9)' }]}>
              {slide.subtitle}
            </Text>
            <Text style={[styles.slideDescription, { color: 'rgba(255, 255, 255, 0.8)' }]}>
              {slide.description}
            </Text>
          </Animated.View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const PaginationDot: React.FC<{
  index: number;
  currentIndex: number;
  theme: any;
}> = ({ index, currentIndex, theme }) => {
  const dotAnimation = useSharedValue(index === currentIndex ? 1 : 0);

  useEffect(() => {
    dotAnimation.value = withTiming(index === currentIndex ? 1 : 0, {
      duration: 300,
    });
  }, [currentIndex, index]);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(dotAnimation.value, [0, 1], [1, 1.2]) }],
    backgroundColor: interpolate(
      dotAnimation.value,
      [0, 1],
      [
        theme.tokens.colors.neutral[300],
        theme.tokens.colors.primary[500],
      ] as any
    ),
    width: interpolate(dotAnimation.value, [0, 1], [8, 24]),
  }));

  return <Animated.View style={[styles.paginationDot, dotStyle]} />;
};

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onComplete,
  onSkip,
}) => {
  const theme = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const buttonAnimation = useSharedValue(0);
  const progressAnimation = useSharedValue(0);

  useEffect(() => {
    buttonAnimation.value = withDelay(800, withSpring(1, { damping: 12 }));
    progressAnimation.value = withTiming((currentIndex + 1) / onboardingSlides.length, {
      duration: 300,
    });
  }, [currentIndex]);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonAnimation.value }],
    opacity: buttonAnimation.value,
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressAnimation.value * 100}%`,
  }));

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (currentIndex < onboardingSlides.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * SCREEN_WIDTH,
        animated: true,
      });
      buttonAnimation.value = 0;
    } else {
      handleGetStarted();
    }
  };

  const handlePrevious = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      scrollViewRef.current?.scrollTo({
        x: prevIndex * SCREEN_WIDTH,
        animated: true,
      });
      buttonAnimation.value = 0;
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSkip();
  };

  const handleGetStarted = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Show role selection or go to login
    onComplete('teacher'); // Default to teacher, but this could be made dynamic
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    
    if (index !== currentIndex && index >= 0 && index < onboardingSlides.length) {
      setCurrentIndex(index);
      buttonAnimation.value = 0;
    }
  };

  const renderProgressBar = () => (
    <View style={[styles.progressContainer, { backgroundColor: theme.tokens.colors.neutral[100] }]}>
      <Animated.View
        style={[
          styles.progressBar,
          { backgroundColor: theme.tokens.colors.primary[500] },
          progressStyle,
        ]}
      />
    </View>
  );

  const renderControls = () => {
    const isFirstSlide = currentIndex === 0;
    const isLastSlide = currentIndex === onboardingSlides.length - 1;

    return (
      <View style={styles.controlsContainer}>
        {/* Skip Button */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Text style={[styles.skipButtonText, { color: theme.tokens.colors.neutral[600] }]}>
            Skip
          </Text>
        </TouchableOpacity>

        {/* Pagination Dots */}
        <View style={styles.paginationContainer}>
          {onboardingSlides.map((_, index) => (
            <PaginationDot
              key={index}
              index={index}
              currentIndex={currentIndex}
              theme={theme}
            />
          ))}
        </View>

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          {!isFirstSlide && (
            <TouchableOpacity
              style={[styles.navigationButton, { backgroundColor: theme.tokens.colors.neutral[100] }]}
              onPress={handlePrevious}
            >
              <Text style={[styles.navigationButtonText, { color: theme.tokens.colors.neutral[700] }]}>
                ←
              </Text>
            </TouchableOpacity>
          )}

          <Animated.View style={[styles.primaryButtonContainer, buttonStyle]}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.tokens.colors.primary[500] }]}
              onPress={handleNext}
            >
              <Text style={styles.primaryButtonText}>
                {isLastSlide ? 'Get Started 🚀' : 'Next'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.tokens.colors.neutral[25] }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Progress Bar */}
      {renderProgressBar()}
      
      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
        style={styles.slidesContainer}
      >
        {onboardingSlides.map((slide, index) => (
          <OnboardingSlide
            key={slide.id}
            slide={slide}
            index={index}
            currentIndex={currentIndex}
            theme={theme}
          />
        ))}
      </ScrollView>
      
      {/* Controls */}
      {renderControls()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Progress Bar Styles
  progressContainer: {
    height: 4,
    marginHorizontal: 24,
    marginTop: Platform.OS === 'ios' ? 0 : 24,
    borderRadius: 2,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  
  // Slides Container
  slidesContainer: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    margin: 0,
    padding: 0,
  },
  slideGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  slideContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  slideIcon: {
    fontSize: 80,
    marginBottom: 32,
  },
  slideTextContainer: {
    alignItems: 'center',
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 34,
  },
  slideSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  slideDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  
  // Controls Styles
  controlsContainer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    paddingTop: 24,
  },
  skipButton: {
    alignSelf: 'flex-end',
    padding: 12,
    marginBottom: 24,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  
  // Pagination Styles
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  
  // Navigation Styles
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navigationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navigationButtonText: {
    fontSize: 20,
    fontWeight: '600',
  },
  primaryButtonContainer: {
    flex: 1,
    marginLeft: 16,
  },
  primaryButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});