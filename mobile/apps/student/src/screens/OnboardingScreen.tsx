import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  PanGestureHandler,
  State,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/design';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  id: number;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: string[];
}

const slides: OnboardingSlide[] = [
  {
    id: 1,
    title: 'Learn & Grow',
    description: 'Interactive lessons designed to make learning fun and engaging with personalized content.',
    icon: 'school-outline',
    gradient: [COLORS.primary, COLORS.primaryLight],
  },
  {
    id: 2,
    title: 'Track Progress',
    description: 'Monitor your learning journey with detailed progress tracking and achievements.',
    icon: 'trending-up-outline',
    gradient: [COLORS.secondary, COLORS.purple],
  },
  {
    id: 3,
    title: 'Earn Rewards',
    description: 'Complete lessons, earn points, and unlock amazing rewards in our gamified system.',
    icon: 'trophy-outline',
    gradient: [COLORS.gold, COLORS.goldLight],
  },
  {
    id: 4,
    title: 'Join Community',
    description: 'Connect with classmates, compete on leaderboards, and celebrate achievements together.',
    icon: 'people-outline',
    gradient: [COLORS.pink, COLORS.pinkLight],
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slideRef = useRef(null);

  const goToNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleGetStarted = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Navigation will be handled by the navigation system
  };

  const currentSlide = slides[currentIndex];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <LinearGradient
        colors={currentSlide.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Skip Button */}
        <TouchableOpacity style={styles.skipButton} onPress={handleGetStarted}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.content}>
          {/* Icon */}
          <Animated.View 
            style={[
              styles.iconContainer,
              {
                transform: [{
                  scale: scrollX.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                    extrapolate: 'clamp',
                  }),
                }],
              },
            ]}
          >
            <Ionicons 
              name={currentSlide.icon} 
              size={120} 
              color={COLORS.white}
            />
          </Animated.View>

          {/* Text Content */}
          <View style={styles.textContent}>
            <Text style={styles.title}>{currentSlide.title}</Text>
            <Text style={styles.description}>{currentSlide.description}</Text>
          </View>
        </View>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          {/* Pagination Dots */}
          <View style={styles.pagination}>
            {slides.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentIndex && styles.activeDot,
                ]}
              />
            ))}
          </View>

          {/* Navigation Buttons */}
          <View style={styles.navigationContainer}>
            {currentIndex > 0 && (
              <TouchableOpacity 
                style={styles.backButton}
                onPress={goToPrevious}
              >
                <Ionicons name="chevron-back" size={24} color={COLORS.white} />
              </TouchableOpacity>
            )}

            <View style={styles.buttonSpacer} />

            {currentIndex < slides.length - 1 ? (
              <TouchableOpacity 
                style={styles.nextButton}
                onPress={goToNext}
              >
                <Text style={styles.nextText}>Next</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.white} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.getStartedButton}
                onPress={handleGetStarted}
              >
                <Text style={styles.getStartedText}>Get Started</Text>
                <Ionicons name="rocket" size={20} color={COLORS.white} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: SPACING.xl,
    zIndex: 1,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
  },
  skipText: {
    fontSize: TYPOGRAPHY.base,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.medium,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING['2xl'],
  },
  iconContainer: {
    marginBottom: SPACING['4xl'],
  },
  textContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY['4xl'],
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  description: {
    fontSize: TYPOGRAPHY.lg,
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: 28,
    opacity: 0.9,
  },
  bottomSection: {
    paddingHorizontal: SPACING['2xl'],
    paddingBottom: SPACING['4xl'],
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING['3xl'],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: COLORS.white,
    width: 24,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonSpacer: {
    flex: 1,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.base,
    borderRadius: BORDER_RADIUS.full,
  },
  nextText: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.white,
    marginRight: SPACING.sm,
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.base,
    borderRadius: BORDER_RADIUS.full,
  },
  getStartedText: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.primary,
    marginRight: SPACING.sm,
  },
});