import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Platform,
  Text,
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
  Easing,
  SlideInUp,
  SlideOutUp,
  FadeIn,
  FadeOut,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import { Canvas, Circle, Path, Skia, useFont } from '@shopify/react-native-skia';
import { Haptics } from 'expo-haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface SuccessConfirmationProps {
  visible: boolean;
  message: string;
  type: 'attendance_saved' | 'grade_submitted' | 'report_generated' | 'backup_created' | 'sync_complete' | 'task_completed';
  culturalTheme: 'islamic_green' | 'professional' | 'achievement' | 'traditional';
  duration?: number;
  showIcon?: boolean;
  respectPrayerTime?: boolean;
  onComplete?: () => void;
  language?: 'en' | 'uz' | 'ru' | 'ar';
}

export interface QuickSuccessProps {
  visible: boolean;
  type: 'checkmark' | 'thumbs_up' | 'star' | 'heart' | 'trophy';
  size?: 'small' | 'medium' | 'large';
  color?: string;
  onComplete?: () => void;
}

const localizedMessages = {
  attendance_saved: {
    en: 'Attendance Saved Successfully',
    uz: 'Davomat Muvaffaqiyatli Saqlandi',
    ru: 'Посещаемость Успешно Сохранена',
    ar: 'تم حفظ الحضور بنجاح',
  },
  grade_submitted: {
    en: 'Grade Submitted Successfully',
    uz: 'Baho Muvaffaqiyatli Yuborildi',
    ru: 'Оценка Успешно Отправлена',
    ar: 'تم إرسال الدرجة بنجاح',
  },
  report_generated: {
    en: 'Report Generated Successfully',
    uz: 'Hisobot Muvaffaqiyatli Yaratildi',
    ru: 'Отчет Успешно Создан',
    ar: 'تم إنشاء التقرير بنجاح',
  },
  backup_created: {
    en: 'Backup Created Successfully',
    uz: 'Zaxira Nusxa Muvaffaqiyatli Yaratildi',
    ru: 'Резервная Копия Успешно Создана',
    ar: 'تم إنشاء النسخة الاحتياطية بنجاح',
  },
  sync_complete: {
    en: 'Sync Completed Successfully',
    uz: 'Sinxronlash Muvaffaqiyatli Tugadi',
    ru: 'Синхронизация Успешно Завершена',
    ar: 'تم إنجاز المزامنة بنجاح',
  },
  task_completed: {
    en: 'Task Completed Successfully',
    uz: 'Vazifa Muvaffaqiyatli Bajarildi',
    ru: 'Задача Успешно Выполнена',
    ar: 'تم إنجاز المهمة بنجاح',
  },
};

const culturalColors = {
  islamic_green: {
    primary: '#1d7452',
    secondary: '#22c55e',
    accent: '#dcfce7',
    text: '#14532d',
  },
  professional: {
    primary: '#2563eb',
    secondary: '#3b82f6',
    accent: '#dbeafe',
    text: '#1e40af',
  },
  achievement: {
    primary: '#f59e0b',
    secondary: '#fbbf24',
    accent: '#fef3c7',
    text: '#92400e',
  },
  traditional: {
    primary: '#7c3aed',
    secondary: '#8b5cf6',
    accent: '#ede9fe',
    text: '#5b21b6',
  },
};

const SuccessIcon: React.FC<{
  type: SuccessConfirmationProps['type'];
  size: number;
  color: string;
  progress: Animated.SharedValue<number>;
}> = ({ type, size, color, progress }) => {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(progress.value, [0, 0.5, 1], [0, 1.2, 1]) },
      { rotate: `${interpolate(progress.value, [0, 1], [0, 360])}deg` },
    ],
    opacity: progress.value,
  }));

  const getIconPath = () => {
    switch (type) {
      case 'attendance_saved':
        return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'; // Checkmark circle
      case 'grade_submitted':
        return 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z'; // Star
      case 'report_generated':
        return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'; // Document
      case 'backup_created':
        return 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10'; // Cloud download
      case 'sync_complete':
        return 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'; // Refresh
      case 'task_completed':
        return 'M5 13l4 4L19 7'; // Check
      default:
        return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  };

  const path = Skia.Path.MakeFromSVGString(getIconPath());

  return (
    <Animated.View style={[{ width: size, height: size }, animatedStyle]}>
      <Canvas style={{ flex: 1 }}>
        <Path
          path={path}
          color={color}
          style="stroke"
          strokeWidth={2}
          strokeCap="round"
          strokeJoin="round"
        />
      </Canvas>
    </Animated.View>
  );
};

export const SuccessConfirmation: React.FC<SuccessConfirmationProps> = ({
  visible,
  message,
  type,
  culturalTheme = 'islamic_green',
  duration = 3000,
  showIcon = true,
  respectPrayerTime = true,
  onComplete,
  language = 'en',
}) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const translateY = useSharedValue(50);
  const iconProgress = useSharedValue(0);
  const progressWidth = useSharedValue(0);

  const checkPrayerTimeRestriction = (): boolean => {
    if (!respectPrayerTime) return false;
    
    const now = new Date();
    const hour = now.getHours();
    const prayerHours = [5, 12, 15, 18, 20];
    return prayerHours.includes(hour);
  };

  const triggerHapticFeedback = () => {
    if (Platform.OS === 'ios' && !checkPrayerTimeRestriction()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const colors = culturalColors[culturalTheme];
  
  const localizedMessage = message || localizedMessages[type]?.[language] || localizedMessages[type]?.en || 'Success';

  const showAnimation = () => {
    triggerHapticFeedback();

    const isPrayerTime = checkPrayerTimeRestriction();
    const animationDuration = isPrayerTime ? 400 : 300;

    // Entry animation
    opacity.value = withTiming(1, { duration: animationDuration, easing: Easing.out(Easing.cubic) });
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    translateY.value = withSpring(0, { damping: 20, stiffness: 400 });

    // Icon animation
    if (showIcon) {
      iconProgress.value = withDelay(
        100,
        withSpring(1, { damping: 12, stiffness: 350 })
      );
    }

    // Progress bar animation
    progressWidth.value = withTiming(100, { duration: duration - 500, easing: Easing.linear });

    // Exit animation
    setTimeout(() => {
      opacity.value = withTiming(0, { duration: animationDuration });
      translateY.value = withTiming(-30, { duration: animationDuration });
      scale.value = withTiming(0.9, { duration: animationDuration }, () => {
        if (onComplete) {
          runOnJS(onComplete)();
        }
      });
    }, duration - 500);
  };

  const hideAnimation = () => {
    opacity.value = withTiming(0, { duration: 200 });
    scale.value = withTiming(0.8, { duration: 200 });
    translateY.value = withTiming(50, { duration: 200 });
    iconProgress.value = withTiming(0, { duration: 200 });
    progressWidth.value = withTiming(0, { duration: 200 });
  };

  useEffect(() => {
    if (visible) {
      showAnimation();
    } else {
      hideAnimation();
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const isRTL = language === 'ar';

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: colors.accent },
        containerStyle,
      ]}
    >
      <View style={[styles.content, isRTL && styles.contentRTL]}>
        {showIcon && (
          <View style={styles.iconContainer}>
            <SuccessIcon
              type={type}
              size={32}
              color={colors.primary}
              progress={iconProgress}
            />
          </View>
        )}
        
        <View style={[styles.textContainer, isRTL && styles.textContainerRTL]}>
          <Text
            style={[
              styles.message,
              { color: colors.text },
              isRTL && styles.messageRTL,
            ]}
          >
            {localizedMessage}
          </Text>
        </View>
      </View>
      
      <View style={[styles.progressContainer, { backgroundColor: colors.primary + '20' }]}>
        <Animated.View
          style={[
            styles.progressBar,
            { backgroundColor: colors.primary },
            progressStyle,
          ]}
        />
      </View>
    </Animated.View>
  );
};

export const QuickSuccess: React.FC<QuickSuccessProps> = ({
  visible,
  type,
  size = 'medium',
  color = '#22c55e',
  onComplete,
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  const sizeMap = {
    small: 24,
    medium: 32,
    large: 48,
  };

  const iconSize = sizeMap[size];

  useEffect(() => {
    if (visible) {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      scale.value = withSequence(
        withSpring(1.2, { damping: 10, stiffness: 500 }),
        withSpring(1, { damping: 15, stiffness: 300 })
      );
      
      opacity.value = withTiming(1, { duration: 200 });
      rotation.value = withTiming(360, { duration: 500, easing: Easing.out(Easing.cubic) });

      setTimeout(() => {
        opacity.value = withTiming(0, { duration: 200 });
        scale.value = withTiming(0.8, { duration: 200 }, () => {
          if (onComplete) {
            runOnJS(onComplete)();
          }
        });
      }, 1000);
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const getIconPath = () => {
    switch (type) {
      case 'checkmark':
        return 'M5 13l4 4L19 7';
      case 'thumbs_up':
        return 'M14 10V4.21c0-.45.54-.67.85-.35l4.86 4.86a.5.5 0 010 .71l-4.86 4.86c-.31.32-.85.1-.85-.35V10h-4a2 2 0 00-2 2v5a1 1 0 01-1 1H5a1 1 0 01-1-1v-5a4 4 0 014-4h6z';
      case 'star':
        return 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z';
      case 'heart':
        return 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z';
      case 'trophy':
        return 'M7 8h10M7 8V6a2 2 0 012-2h4a2 2 0 012 2v2m-9 0l1 8a2 2 0 002 2h4a2 2 0 002-2l1-8M9 10v4h6v-4';
      default:
        return 'M5 13l4 4L19 7';
    }
  };

  const path = Skia.Path.MakeFromSVGString(getIconPath());

  return (
    <Animated.View style={[styles.quickSuccess, { width: iconSize, height: iconSize }, animatedStyle]}>
      <Canvas style={{ flex: 1 }}>
        <Path
          path={path}
          color={color}
          style="stroke"
          strokeWidth={2}
          strokeCap="round"
          strokeJoin="round"
        />
      </Canvas>
    </Animated.View>
  );
};

// Utility component for floating success messages
export const FloatingSuccessMessage: React.FC<{
  message: string;
  visible: boolean;
  position?: { x: number; y: number };
  onComplete?: () => void;
}> = ({ message, visible, position, onComplete }) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withSequence(
        withTiming(-50, { duration: 1000, easing: Easing.out(Easing.cubic) }),
        withTiming(-80, { duration: 500, easing: Easing.in(Easing.cubic) })
      );
      
      setTimeout(() => {
        opacity.value = withTiming(0, { duration: 300 }, () => {
          if (onComplete) {
            runOnJS(onComplete)();
          }
        });
      }, 1200);
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.floatingMessage,
        {
          position: 'absolute',
          left: position?.x || screenWidth / 2 - 50,
          top: position?.y || screenHeight / 2,
        },
        animatedStyle,
      ]}
    >
      <Text style={styles.floatingText}>{message}</Text>
    </Animated.View>
  );
};

// Pre-configured success confirmations for common teacher actions
export const AttendanceSuccess: React.FC<{
  visible: boolean;
  language?: 'en' | 'uz' | 'ru' | 'ar';
  onComplete?: () => void;
}> = ({ visible, language = 'en', onComplete }) => (
  <SuccessConfirmation
    visible={visible}
    message=""
    type="attendance_saved"
    culturalTheme="islamic_green"
    duration={2500}
    respectPrayerTime={true}
    language={language}
    onComplete={onComplete}
  />
);

export const GradeSuccess: React.FC<{
  visible: boolean;
  language?: 'en' | 'uz' | 'ru' | 'ar';
  onComplete?: () => void;
}> = ({ visible, language = 'en', onComplete }) => (
  <SuccessConfirmation
    visible={visible}
    message=""
    type="grade_submitted"
    culturalTheme="achievement"
    duration={2000}
    respectPrayerTime={true}
    language={language}
    onComplete={onComplete}
  />
);

export const SyncSuccess: React.FC<{
  visible: boolean;
  language?: 'en' | 'uz' | 'ru' | 'ar';
  onComplete?: () => void;
}> = ({ visible, language = 'en', onComplete }) => (
  <SuccessConfirmation
    visible={visible}
    message=""
    type="sync_complete"
    culturalTheme="professional"
    duration={1500}
    respectPrayerTime={true}
    language={language}
    onComplete={onComplete}
  />
);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contentRTL: {
    flexDirection: 'row-reverse',
  },
  iconContainer: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  textContainerRTL: {
    alignItems: 'flex-end',
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'left',
  },
  messageRTL: {
    textAlign: 'right',
  },
  progressContainer: {
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 1.5,
  },
  quickSuccess: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  floatingMessage: {
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 1000,
  },
  floatingText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default SuccessConfirmation;