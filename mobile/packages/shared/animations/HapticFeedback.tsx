import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Haptics } from 'expo-haptics';

export interface HapticConfig {
  enabled: boolean;
  respectPrayerTime: boolean;
  culturalContext: 'normal' | 'prayer_time' | 'ramadan' | 'celebration';
  intensity: 'minimal' | 'moderate' | 'full';
  studentAge?: 'elementary' | 'middle' | 'high';
  teacherMode?: boolean;
}

export interface HapticFeedbackContextValue {
  config: HapticConfig;
  updateConfig: (newConfig: Partial<HapticConfig>) => void;
  triggerHaptic: (type: HapticType, options?: HapticOptions) => Promise<void>;
  isHapticAllowed: () => boolean;
}

export type HapticType = 
  | 'success'
  | 'error' 
  | 'warning'
  | 'selection'
  | 'impact_light'
  | 'impact_medium' 
  | 'impact_heavy'
  | 'notification'
  | 'achievement'
  | 'button_press'
  | 'swipe'
  | 'long_press'
  | 'coin_collect'
  | 'level_up'
  | 'card_flip'
  | 'grade_submit'
  | 'attendance_mark'
  | 'prayer_reminder';

export interface HapticOptions {
  intensity?: number; // 0-1
  delay?: number;
  respectCulturalContext?: boolean;
  forceDisable?: boolean;
}

const defaultConfig: HapticConfig = {
  enabled: true,
  respectPrayerTime: true,
  culturalContext: 'normal',
  intensity: 'moderate',
  teacherMode: false,
};

const HapticFeedbackContext = createContext<HapticFeedbackContextValue | null>(null);

export const useHapticFeedback = () => {
  const context = useContext(HapticFeedbackContext);
  if (!context) {
    throw new Error('useHapticFeedback must be used within HapticFeedbackProvider');
  }
  return context;
};

export const HapticFeedbackProvider: React.FC<{
  children: React.ReactNode;
  initialConfig?: Partial<HapticConfig>;
}> = ({ children, initialConfig }) => {
  const [config, setConfig] = useState<HapticConfig>({
    ...defaultConfig,
    ...initialConfig,
  });

  const checkPrayerTimeRestriction = (): boolean => {
    if (!config.respectPrayerTime) return false;
    
    const now = new Date();
    const hour = now.getHours();
    const prayerHours = [5, 12, 15, 18, 20];
    return prayerHours.includes(hour);
  };

  const isRamadanPeriod = (): boolean => {
    // This would typically check against a calendar API or local storage
    // For now, we'll simulate with a simple check
    const now = new Date();
    const month = now.getMonth() + 1; // JavaScript months are 0-indexed
    return config.culturalContext === 'ramadan';
  };

  const isHapticAllowed = (): boolean => {
    if (!config.enabled || Platform.OS !== 'ios') return false;
    
    const isPrayerTime = checkPrayerTimeRestriction();
    const isRamadan = isRamadanPeriod();
    
    // Disable haptics during prayer time or adjust for Ramadan
    if (isPrayerTime && config.respectPrayerTime) return false;
    if (isRamadan && config.intensity === 'full') return false;
    
    return true;
  };

  const getHapticIntensityModifier = (): number => {
    switch (config.intensity) {
      case 'minimal':
        return 0.3;
      case 'moderate':
        return 0.7;
      case 'full':
        return 1.0;
      default:
        return 0.7;
    }
  };

  const getAgeAdjustedIntensity = (): number => {
    const baseModifier = getHapticIntensityModifier();
    
    if (!config.studentAge) return baseModifier;
    
    switch (config.studentAge) {
      case 'elementary':
        return Math.min(baseModifier, 0.5); // Gentler for younger students
      case 'middle':
        return baseModifier;
      case 'high':
        return Math.min(baseModifier * 1.1, 1.0); // Slightly stronger for older students
      default:
        return baseModifier;
    }
  };

  const getCulturallyAppropriateTiming = (baseDelay: number = 0): number => {
    if (config.culturalContext === 'prayer_time') {
      return baseDelay + 200; // Slower, more respectful timing
    }
    if (config.culturalContext === 'ramadan') {
      return baseDelay + 100; // Slightly slower
    }
    return baseDelay;
  };

  const triggerHaptic = async (type: HapticType, options?: HapticOptions): Promise<void> => {
    if (options?.forceDisable) return;
    
    if (!isHapticAllowed() && !options?.respectCulturalContext) return;
    
    const delay = getCulturallyAppropriateTiming(options?.delay || 0);
    const intensityModifier = getAgeAdjustedIntensity();
    
    const executeHaptic = async () => {
      try {
        switch (type) {
          case 'success':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            break;
          
          case 'error':
            if (config.teacherMode) {
              // More subtle error feedback for teachers
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } else {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
            break;
          
          case 'warning':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            break;
          
          case 'selection':
            await Haptics.selectionAsync();
            break;
          
          case 'impact_light':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            break;
          
          case 'impact_medium':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            break;
          
          case 'impact_heavy':
            if (intensityModifier >= 0.8) {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            } else {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            break;
          
          case 'achievement':
            // Double pulse for achievements
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setTimeout(async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }, 100);
            break;
          
          case 'button_press':
            if (config.teacherMode) {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } else {
              await Haptics.selectionAsync();
            }
            break;
          
          case 'swipe':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            break;
          
          case 'long_press':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            break;
          
          case 'coin_collect':
            // Quick light tap for coin collection
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            break;
          
          case 'level_up':
            // Celebration sequence: medium -> light -> light
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setTimeout(async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }, 150);
            setTimeout(async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }, 300);
            break;
          
          case 'card_flip':
            await Haptics.selectionAsync();
            break;
          
          case 'grade_submit':
            // Professional confirmation for teachers
            if (config.teacherMode) {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            break;
          
          case 'attendance_mark':
            // Quick confirmation for attendance
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            break;
          
          case 'prayer_reminder':
            // Very gentle reminder, only if culturally appropriate
            if (config.culturalContext !== 'prayer_time') {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            break;
          
          default:
            await Haptics.selectionAsync();
        }
      } catch (error) {
        console.warn('Haptic feedback error:', error);
      }
    };

    if (delay > 0) {
      setTimeout(executeHaptic, delay);
    } else {
      await executeHaptic();
    }
  };

  const updateConfig = (newConfig: Partial<HapticConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  // Auto-update cultural context based on time
  useEffect(() => {
    const updateCulturalContext = () => {
      if (checkPrayerTimeRestriction() && config.respectPrayerTime) {
        updateConfig({ culturalContext: 'prayer_time' });
      } else if (config.culturalContext === 'prayer_time') {
        updateConfig({ culturalContext: 'normal' });
      }
    };

    updateCulturalContext();
    const interval = setInterval(updateCulturalContext, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [config.respectPrayerTime]);

  const value: HapticFeedbackContextValue = {
    config,
    updateConfig,
    triggerHaptic,
    isHapticAllowed,
  };

  return (
    <HapticFeedbackContext.Provider value={value}>
      {children}
    </HapticFeedbackContext.Provider>
  );
};

// Utility hook for specific haptic patterns
export const useAnimationHaptics = () => {
  const { triggerHaptic, isHapticAllowed } = useHapticFeedback();

  return {
    // Student app haptics
    onAchievementUnlocked: () => triggerHaptic('achievement'),
    onCoinCollected: () => triggerHaptic('coin_collect'),
    onLevelUp: () => triggerHaptic('level_up'),
    onCardFlip: () => triggerHaptic('card_flip'),
    onQuizSuccess: () => triggerHaptic('success'),
    onQuizError: () => triggerHaptic('error'),
    onButtonPress: () => triggerHaptic('button_press'),
    onSwipeGesture: () => triggerHaptic('swipe'),
    
    // Teacher app haptics
    onGradeSubmitted: () => triggerHaptic('grade_submit'),
    onAttendanceMarked: () => triggerHaptic('attendance_mark'),
    onReportGenerated: () => triggerHaptic('success'),
    onSyncComplete: () => triggerHaptic('notification'),
    onLongPressAction: () => triggerHaptic('long_press'),
    
    // Cultural haptics
    onPrayerReminder: () => triggerHaptic('prayer_reminder'),
    
    // Utility
    isHapticAllowed,
  };
};

// Utility hook for gesture-based haptics
export const useGestureHaptics = () => {
  const { triggerHaptic } = useHapticFeedback();

  return {
    onPanStart: () => triggerHaptic('impact_light'),
    onPanEnd: () => triggerHaptic('selection'),
    onPinchStart: () => triggerHaptic('impact_light'),
    onPinchEnd: () => triggerHaptic('selection'),
    onRotationStart: () => triggerHaptic('impact_light'),
    onRotationEnd: () => triggerHaptic('selection'),
    onTapGesture: () => triggerHaptic('selection'),
    onLongPress: () => triggerHaptic('long_press'),
    onSwipeLeft: () => triggerHaptic('swipe'),
    onSwipeRight: () => triggerHaptic('swipe'),
    onSwipeUp: () => triggerHaptic('swipe'),
    onSwipeDown: () => triggerHaptic('swipe'),
  };
};

// Component for integrating haptics with animations
export const HapticAnimationWrapper: React.FC<{
  children: React.ReactNode;
  hapticType?: HapticType;
  triggerOnMount?: boolean;
  triggerOnUnmount?: boolean;
  hapticOptions?: HapticOptions;
}> = ({ 
  children, 
  hapticType = 'selection',
  triggerOnMount = false,
  triggerOnUnmount = false,
  hapticOptions 
}) => {
  const { triggerHaptic } = useHapticFeedback();

  useEffect(() => {
    if (triggerOnMount) {
      triggerHaptic(hapticType, hapticOptions);
    }

    return () => {
      if (triggerOnUnmount) {
        triggerHaptic(hapticType, hapticOptions);
      }
    };
  }, [triggerOnMount, triggerOnUnmount, hapticType]);

  return <>{children}</>;
};

// Pre-configured haptic patterns for common use cases
export const HapticPatterns = {
  // Success patterns
  achievementUnlocked: async (triggerHaptic: (type: HapticType) => Promise<void>) => {
    await triggerHaptic('impact_medium');
    setTimeout(() => triggerHaptic('impact_light'), 100);
    setTimeout(() => triggerHaptic('impact_light'), 200);
  },

  // Error patterns
  incorrectAnswer: async (triggerHaptic: (type: HapticType) => Promise<void>) => {
    await triggerHaptic('impact_heavy');
    setTimeout(() => triggerHaptic('impact_medium'), 150);
  },

  // Progress patterns
  progressIncrement: async (triggerHaptic: (type: HapticType) => Promise<void>) => {
    await triggerHaptic('impact_light');
  },

  // Completion patterns
  taskCompleted: async (triggerHaptic: (type: HapticType) => Promise<void>) => {
    await triggerHaptic('success');
  },

  // Cultural patterns
  respectfulNotification: async (triggerHaptic: (type: HapticType) => Promise<void>) => {
    await triggerHaptic('impact_light');
  },

  // Teacher workflow patterns
  gradeConfirmation: async (triggerHaptic: (type: HapticType) => Promise<void>) => {
    await triggerHaptic('impact_medium');
    setTimeout(() => triggerHaptic('selection'), 100);
  },

  attendanceConfirmation: async (triggerHaptic: (type: HapticType) => Promise<void>) => {
    await triggerHaptic('impact_light');
  },
};

export default HapticFeedbackProvider;