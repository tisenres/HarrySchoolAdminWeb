/**
 * Real-time Animations System
 * 
 * Provides engaging animations for real-time events like notifications,
 * achievements, rankings, and Islamic celebrations with cultural sensitivity.
 */

import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Animated,
  Dimensions,
  StyleSheet,
  Easing,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

export interface AnimationEvent {
  type: 'notification' | 'celebration' | 'ranking' | 'prayer' | 'attendance' | 'task_complete';
  subtype?: string;
  data: any;
  culturalContext?: {
    islamic_content?: boolean;
    prayer_time_sensitive?: boolean;
    celebration_type?: 'academic' | 'character' | 'helping' | 'islamic_values';
    arabic_text?: string;
    greeting_type?: 'salam' | 'barakallah' | 'masha_allah' | 'insha_allah' | 'allahu_akbar';
  };
  duration?: number;
  intensity?: 'low' | 'medium' | 'high' | 'celebration';
}

interface RealtimeAnimationsProps {
  isEnabled: boolean;
  culturalSettings: {
    respectPrayerTimes: boolean;
    showIslamicGreetings: boolean;
    preferredLanguage: 'en' | 'uz' | 'ru' | 'ar';
    celebration_animations: boolean;
    reduced_motion: boolean;
  };
  onAnimationStart?: (event: AnimationEvent) => void;
  onAnimationComplete?: (event: AnimationEvent) => void;
}

export class RealtimeAnimationsController {
  private animationsRef: React.RefObject<RealtimeAnimations>;

  constructor(animationsRef: React.RefObject<RealtimeAnimations>) {
    this.animationsRef = animationsRef;
  }

  triggerAnimation(event: AnimationEvent) {
    this.animationsRef.current?.triggerAnimation(event);
  }

  celebrateAchievement(achievement: {
    type: 'academic' | 'character' | 'helping' | 'islamic_values';
    level: 'bronze' | 'silver' | 'gold' | 'platinum';
    title: string;
    message: string;
    arabic_text?: string;
  }) {
    this.triggerAnimation({
      type: 'celebration',
      subtype: 'achievement',
      data: achievement,
      culturalContext: {
        islamic_content: achievement.type === 'islamic_values',
        celebration_type: achievement.type,
        arabic_text: achievement.arabic_text,
        greeting_type: 'masha_allah',
      },
      intensity: 'celebration',
    });
  }

  notifyRankingUpdate(update: {
    oldRank: number;
    newRank: number;
    improvement: boolean;
    studentName: string;
  }) {
    this.triggerAnimation({
      type: 'ranking',
      subtype: update.improvement ? 'rank_up' : 'rank_down',
      data: update,
      intensity: update.improvement ? 'high' : 'medium',
    });
  }

  showPrayerReminder(prayer: {
    name: string;
    time: string;
    arabic_name: string;
  }) {
    this.triggerAnimation({
      type: 'prayer',
      data: prayer,
      culturalContext: {
        islamic_content: true,
        prayer_time_sensitive: true,
        arabic_text: prayer.arabic_name,
        greeting_type: 'salam',
      },
      intensity: 'medium',
    });
  }
}

export const RealtimeAnimations = React.forwardRef<any, RealtimeAnimationsProps>(
  ({ isEnabled, culturalSettings, onAnimationStart, onAnimationComplete }, ref) => {
    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(-100)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const sparkleAnims = useRef(
      Array.from({ length: 8 }, () => ({
        scale: new Animated.Value(0),
        translateX: new Animated.Value(0),
        translateY: new Animated.Value(0),
        rotate: new Animated.Value(0),
      }))
    ).current;

    // Current event state
    const currentEvent = useRef<AnimationEvent | null>(null);
    const isAnimating = useRef(false);

    React.useImperativeHandle(ref, () => ({
      triggerAnimation: handleTriggerAnimation,
    }));

    const handleTriggerAnimation = useCallback(
      async (event: AnimationEvent) => {
        if (!isEnabled || isAnimating.current) return;

        // Check cultural restrictions
        if (culturalSettings.respectPrayerTimes && event.culturalContext?.prayer_time_sensitive) {
          const isPrayerTime = await checkPrayerTime();
          if (isPrayerTime && event.type !== 'prayer') {
            return; // Skip non-prayer animations during prayer times
          }
        }

        if (culturalSettings.reduced_motion && event.intensity === 'celebration') {
          // Reduce animation intensity for accessibility
          event.intensity = 'medium';
        }

        currentEvent.current = event;
        isAnimating.current = true;

        onAnimationStart?.(event);

        // Trigger haptic feedback based on event type
        await triggerHapticFeedback(event);

        // Run appropriate animation
        switch (event.type) {
          case 'celebration':
            await runCelebrationAnimation(event);
            break;
          case 'notification':
            await runNotificationAnimation(event);
            break;
          case 'ranking':
            await runRankingAnimation(event);
            break;
          case 'prayer':
            await runPrayerAnimation(event);
            break;
          case 'attendance':
            await runAttendanceAnimation(event);
            break;
          case 'task_complete':
            await runTaskCompleteAnimation(event);
            break;
        }

        isAnimating.current = false;
        onAnimationComplete?.(event);
        currentEvent.current = null;
      },
      [isEnabled, culturalSettings, onAnimationStart, onAnimationComplete]
    );

    const triggerHapticFeedback = async (event: AnimationEvent) => {
      if (!isEnabled) return;

      switch (event.intensity) {
        case 'celebration':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          // Additional celebration feedback
          setTimeout(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }, 200);
          break;
        case 'high':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'low':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
      }
    };

    const checkPrayerTime = async (): Promise<boolean> => {
      // This would integrate with a proper prayer time service
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      const prayerTimes = [
        { hour: 5, minute: 30 }, // Fajr
        { hour: 12, minute: 30 }, // Dhuhr
        { hour: 16, minute: 0 }, // Asr
        { hour: 19, minute: 0 }, // Maghrib
        { hour: 20, minute: 30 }, // Isha
      ];

      return prayerTimes.some(prayer => {
        const timeDiff = Math.abs((currentHour * 60 + currentMinute) - (prayer.hour * 60 + prayer.minute));
        return timeDiff <= 15; // Within 15 minutes of prayer time
      });
    };

    const runCelebrationAnimation = async (event: AnimationEvent) => {
      // Reset all values
      fadeAnim.setValue(0);
      scaleAnim.setValue(0);
      translateY.setValue(-100);
      rotateAnim.setValue(0);
      sparkleAnims.forEach(sparkle => {
        sparkle.scale.setValue(0);
        sparkle.translateX.setValue(0);
        sparkle.translateY.setValue(0);
        sparkle.rotate.setValue(0);
      });

      // Main celebration sequence
      const celebrationSequence = Animated.parallel([
        // Main element entrance
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0.9,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
        
        // Scale animation
        Animated.sequence([
          Animated.spring(scaleAnim, {
            toValue: 1.2,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),

        // Slide in from top
        Animated.spring(translateY, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),

        // Gentle rotation for Islamic celebrations
        ...(event.culturalContext?.islamic_content ? [
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 3000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ] : []),
      ]);

      // Sparkle effects
      const sparkleAnimations = sparkleAnims.map((sparkle, index) => {
        const angle = (index * 45) * (Math.PI / 180); // 45 degrees apart
        const distance = 80;

        return Animated.sequence([
          Animated.delay(100 + index * 50),
          Animated.parallel([
            Animated.spring(sparkle.scale, {
              toValue: 1,
              tension: 150,
              friction: 8,
              useNativeDriver: true,
            }),
            Animated.timing(sparkle.translateX, {
              toValue: Math.cos(angle) * distance,
              duration: 800,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(sparkle.translateY, {
              toValue: Math.sin(angle) * distance,
              duration: 800,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(sparkle.rotate, {
              toValue: 1,
              duration: 800,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(sparkle.scale, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]);
      });

      return new Promise<void>(resolve => {
        Animated.parallel([
          celebrationSequence,
          ...sparkleAnimations,
        ]).start(resolve);
      });
    };

    const runNotificationAnimation = async (event: AnimationEvent) => {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      translateY.setValue(-50);

      return new Promise<void>(resolve => {
        Animated.sequence([
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
              toValue: 1,
              tension: 150,
              friction: 8,
              useNativeDriver: true,
            }),
            Animated.spring(translateY, {
              toValue: 0,
              tension: 150,
              friction: 8,
              useNativeDriver: true,
            }),
          ]),
          Animated.delay(2000),
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(translateY, {
              toValue: -50,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
        ]).start(resolve);
      });
    };

    const runRankingAnimation = async (event: AnimationEvent) => {
      const isImprovement = event.subtype === 'rank_up';
      
      fadeAnim.setValue(0);
      scaleAnim.setValue(0);
      
      return new Promise<void>(resolve => {
        Animated.sequence([
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
              toValue: isImprovement ? 1.1 : 0.9,
              tension: 100,
              friction: 8,
              useNativeDriver: true,
            }),
          ]),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.delay(1500),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start(resolve);
      });
    };

    const runPrayerAnimation = async (event: AnimationEvent) => {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
      
      return new Promise<void>(resolve => {
        Animated.sequence([
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 0.95,
              duration: 500,
              easing: Easing.ease,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 500,
              easing: Easing.ease,
              useNativeDriver: true,
            }),
          ]),
          Animated.delay(3000),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 800,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ]).start(resolve);
      });
    };

    const runAttendanceAnimation = async (event: AnimationEvent) => {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);

      return new Promise<void>(resolve => {
        Animated.sequence([
          Animated.spring(fadeAnim, {
            toValue: 1,
            tension: 150,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 150,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.delay(1200),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(resolve);
      });
    };

    const runTaskCompleteAnimation = async (event: AnimationEvent) => {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);

      return new Promise<void>(resolve => {
        Animated.sequence([
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
              toValue: 1,
              tension: 200,
              friction: 8,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.elastic(2),
            useNativeDriver: true,
          }),
          Animated.delay(800),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(resolve);
      });
    };

    const renderContent = () => {
      if (!currentEvent.current) return null;

      const event = currentEvent.current;

      switch (event.type) {
        case 'celebration':
          return renderCelebrationContent(event);
        case 'notification':
          return renderNotificationContent(event);
        case 'ranking':
          return renderRankingContent(event);
        case 'prayer':
          return renderPrayerContent(event);
        case 'attendance':
          return renderAttendanceContent(event);
        case 'task_complete':
          return renderTaskCompleteContent(event);
        default:
          return null;
      }
    };

    const renderCelebrationContent = (event: AnimationEvent) => {
      const isIslamic = event.culturalContext?.islamic_content;
      
      return (
        <View style={styles.celebrationContainer}>
          {/* Sparkle effects */}
          {sparkleAnims.map((sparkle, index) => (
            <Animated.View
              key={index}
              style={[
                styles.sparkle,
                {
                  transform: [
                    { translateX: sparkle.translateX },
                    { translateY: sparkle.translateY },
                    { scale: sparkle.scale },
                    {
                      rotate: sparkle.rotate.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              <MaterialCommunityIcons
                name={isIslamic ? "star-crescent" : "star-four-points"}
                size={16}
                color="#FFD700"
              />
            </Animated.View>
          ))}

          {/* Main celebration */}
          <LinearGradient
            colors={isIslamic ? ['#7C3AED', '#3B82F6'] : ['#F59E0B', '#EF4444']}
            style={styles.celebrationContent}
          >
            <MaterialCommunityIcons
              name={isIslamic ? "star-crescent" : "trophy-variant"}
              size={48}
              color="white"
            />
            
            <Text style={styles.celebrationTitle}>
              {event.data.title || '🎉 Achievement Unlocked!'}
            </Text>
            
            <Text style={styles.celebrationMessage}>
              {event.data.message || 'Congratulations!'}
            </Text>

            {event.culturalContext?.arabic_text && (
              <Animated.Text
                style={[
                  styles.arabicText,
                  {
                    transform: [
                      {
                        rotate: rotateAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '5deg'],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {event.culturalContext.arabic_text}
              </Animated.Text>
            )}
          </LinearGradient>
        </View>
      );
    };

    const renderNotificationContent = (event: AnimationEvent) => (
      <BlurView intensity={80} style={styles.notificationContainer}>
        <View style={styles.notificationContent}>
          <Ionicons name="notifications" size={24} color="#1d7452" />
          <Text style={styles.notificationText}>
            {event.data.message || 'New notification'}
          </Text>
        </View>
      </BlurView>
    );

    const renderRankingContent = (event: AnimationEvent) => {
      const isImprovement = event.subtype === 'rank_up';
      
      return (
        <LinearGradient
          colors={isImprovement ? ['#10B981', '#059669'] : ['#F59E0B', '#D97706']}
          style={styles.rankingContainer}
        >
          <Ionicons
            name={isImprovement ? "trending-up" : "trending-down"}
            size={32}
            color="white"
          />
          <Text style={styles.rankingTitle}>
            {isImprovement ? 'Rank Up!' : 'Ranking Update'}
          </Text>
          <Text style={styles.rankingMessage}>
            {event.data.studentName} is now #{event.data.newRank}
          </Text>
        </LinearGradient>
      );
    };

    const renderPrayerContent = (event: AnimationEvent) => (
      <LinearGradient
        colors={['#7C3AED', '#5B21B6']}
        style={styles.prayerContainer}
      >
        <Ionicons name="moon" size={32} color="white" />
        <Text style={styles.prayerTitle}>Prayer Time</Text>
        <Text style={styles.prayerMessage}>
          {event.data.name} - {event.data.time}
        </Text>
        {event.culturalContext?.arabic_text && (
          <Text style={styles.arabicText}>
            {event.culturalContext.arabic_text}
          </Text>
        )}
      </LinearGradient>
    );

    const renderAttendanceContent = (event: AnimationEvent) => (
      <View style={styles.attendanceContainer}>
        <Ionicons name="checkmark-circle" size={32} color="#10B981" />
        <Text style={styles.attendanceTitle}>Attendance Marked</Text>
        <Text style={styles.attendanceMessage}>
          {event.data.message || 'Successfully marked present'}
        </Text>
      </View>
    );

    const renderTaskCompleteContent = (event: AnimationEvent) => (
      <View style={styles.taskContainer}>
        <Animated.View
          style={{
            transform: [
              {
                rotate: rotateAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          }}
        >
          <Ionicons name="checkmark-done-circle" size={40} color="#10B981" />
        </Animated.View>
        <Text style={styles.taskTitle}>Task Completed!</Text>
        <Text style={styles.taskMessage}>
          {event.data.message || 'Great job!'}
        </Text>
      </View>
    );

    if (!isEnabled || !currentEvent.current) return null;

    return (
      <Animated.View
        style={[
          styles.animationOverlay,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: translateY },
            ],
          },
        ]}
        pointerEvents="none"
      >
        {renderContent()}
      </Animated.View>
    );
  }
);

const styles = StyleSheet.create({
  animationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  
  // Celebration styles
  celebrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationContent: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  celebrationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginTop: 12,
  },
  celebrationMessage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 8,
  },
  sparkle: {
    position: 'absolute',
  },
  arabicText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center',
  },

  // Notification styles
  notificationContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    minWidth: 280,
  },
  notificationText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },

  // Ranking styles
  rankingContainer: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 260,
  },
  rankingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
  },
  rankingMessage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },

  // Prayer styles
  prayerContainer: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 260,
  },
  prayerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
  },
  prayerMessage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },

  // Attendance styles
  attendanceContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  attendanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 8,
  },
  attendanceMessage: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },

  // Task completion styles
  taskContainer: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 260,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
    marginTop: 12,
  },
  taskMessage: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'center',
  },
});

export default RealtimeAnimations;