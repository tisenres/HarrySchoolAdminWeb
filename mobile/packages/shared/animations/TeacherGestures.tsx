import React, { ReactNode, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Platform,
  Text,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withTiming,
  withSpring,
  withSequence,
  runOnJS,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  PinchGestureHandler,
  TapGestureHandler,
  LongPressGestureHandler,
  State,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { Haptics } from 'expo-haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface GestureAction {
  id: string;
  type: 'swipe_left' | 'swipe_right' | 'swipe_up' | 'swipe_down' | 'long_press' | 'double_tap' | 'pinch';
  threshold?: number;
  onAction: () => void;
  hapticType?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';
  culturallyAppropriate?: boolean;
}

export interface TeacherGestureProps {
  children: ReactNode;
  actions: GestureAction[];
  disabled?: boolean;
  respectPrayerTime?: boolean;
  showVisualFeedback?: boolean;
  professionalMode?: boolean;
}

export const TeacherGestureHandler: React.FC<TeacherGestureProps> = ({
  children,
  actions,
  disabled = false,
  respectPrayerTime = true,
  showVisualFeedback = true,
  professionalMode = true,
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const rotation = useSharedValue(0);
  
  const tapRef = useRef(null);
  const longPressRef = useRef(null);
  const panRef = useRef(null);
  const pinchRef = useRef(null);

  const checkPrayerTimeRestriction = (): boolean => {
    if (!respectPrayerTime) return false;
    
    const now = new Date();
    const hour = now.getHours();
    const prayerHours = [5, 12, 15, 18, 20];
    return prayerHours.includes(hour);
  };

  const triggerHapticFeedback = (type: GestureAction['hapticType'] = 'light') => {
    if (Platform.OS !== 'ios' || checkPrayerTimeRestriction()) return;

    switch (type) {
      case 'light':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'success':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  };

  const executeAction = (actionType: GestureAction['type']) => {
    const action = actions.find(a => a.type === actionType);
    if (action && (!action.culturallyAppropriate || !checkPrayerTimeRestriction())) {
      triggerHapticFeedback(action.hapticType);
      action.onAction();
    }
  };

  const resetToCenter = (withHaptic = false) => {
    if (withHaptic) {
      triggerHapticFeedback('light');
    }
    
    translateX.value = withSpring(0, { damping: 20, stiffness: 400 });
    translateY.value = withSpring(0, { damping: 20, stiffness: 400 });
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    opacity.value = withTiming(1, { duration: 200 });
    rotation.value = withSpring(0, { damping: 20, stiffness: 400 });
  };

  // Pan gesture handler for swipe actions
  const panGestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      if (disabled) return;
      context.startX = translateX.value;
      context.startY = translateY.value;
      
      if (showVisualFeedback) {
        scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
      }
    },
    onActive: (event, context) => {
      if (disabled) return;
      
      if (professionalMode) {
        // Constrained movement for professional use
        translateX.value = context.startX + event.translationX * 0.3;
        translateY.value = context.startY + event.translationY * 0.3;
      } else {
        translateX.value = context.startX + event.translationX;
        translateY.value = context.startY + event.translationY;
      }

      if (showVisualFeedback) {
        // Visual feedback based on gesture direction
        const distance = Math.sqrt(
          Math.pow(event.translationX, 2) + Math.pow(event.translationY, 2)
        );
        opacity.value = interpolate(distance, [0, 100], [1, 0.8]);
      }
    },
    onEnd: (event) => {
      if (disabled) return;

      const velocityThreshold = 800;
      const distanceThreshold = 100;
      
      const absVelocityX = Math.abs(event.velocityX);
      const absVelocityY = Math.abs(event.velocityY);
      const absTranslationX = Math.abs(event.translationX);
      const absTranslationY = Math.abs(event.translationY);

      // Determine gesture type
      if (absVelocityX > velocityThreshold || absTranslationX > distanceThreshold) {
        if (event.velocityX > 0 || event.translationX > 0) {
          runOnJS(executeAction)('swipe_right');
        } else {
          runOnJS(executeAction)('swipe_left');
        }
      } else if (absVelocityY > velocityThreshold || absTranslationY > distanceThreshold) {
        if (event.velocityY > 0 || event.translationY > 0) {
          runOnJS(executeAction)('swipe_down');
        } else {
          runOnJS(executeAction)('swipe_up');
        }
      }

      runOnJS(resetToCenter)(true);
    },
  });

  // Pinch gesture handler for zoom actions
  const pinchGestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      if (disabled) return;
      context.startScale = scale.value;
    },
    onActive: (event, context) => {
      if (disabled) return;
      
      const newScale = context.startScale * event.scale;
      scale.value = Math.max(0.8, Math.min(1.5, newScale));
      
      if (showVisualFeedback && event.scale > 1.2) {
        rotation.value = interpolate(event.scale, [1, 1.5], [0, 5]);
      }
    },
    onEnd: (event) => {
      if (disabled) return;
      
      if (event.scale > 1.3 || event.scale < 0.7) {
        runOnJS(executeAction)('pinch');
      }
      
      runOnJS(resetToCenter)(true);
    },
  });

  // Double tap handler
  const doubleTapHandler = useAnimatedGestureHandler({
    onActive: () => {
      if (disabled) return;
      
      if (showVisualFeedback) {
        scale.value = withSequence(
          withSpring(1.05, { damping: 15, stiffness: 400 }),
          withSpring(1, { damping: 15, stiffness: 400 })
        );
      }
      
      runOnJS(executeAction)('double_tap');
    },
  });

  // Long press handler
  const longPressHandler = useAnimatedGestureHandler({
    onActive: () => {
      if (disabled) return;
      
      if (showVisualFeedback) {
        scale.value = withSpring(0.95, { damping: 10, stiffness: 300 });
        opacity.value = withTiming(0.8, { duration: 100 });
      }
      
      runOnJS(executeAction)('long_press');
    },
    onEnd: () => {
      if (!disabled && showVisualFeedback) {
        runOnJS(resetToCenter)(false);
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
        { rotate: `${rotation.value}deg` },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <GestureHandlerRootView style={styles.container}>
      <PinchGestureHandler
        ref={pinchRef}
        onGestureEvent={pinchGestureHandler}
        enabled={!disabled && actions.some(a => a.type === 'pinch')}
      >
        <Animated.View>
          <PanGestureHandler
            ref={panRef}
            onGestureEvent={panGestureHandler}
            enabled={!disabled && actions.some(a => 
              a.type.startsWith('swipe_')
            )}
            simultaneousHandlers={[pinchRef]}
          >
            <Animated.View>
              <LongPressGestureHandler
                ref={longPressRef}
                onGestureEvent={longPressHandler}
                minDurationMs={professionalMode ? 800 : 500}
                enabled={!disabled && actions.some(a => a.type === 'long_press')}
                simultaneousHandlers={[panRef, pinchRef]}
              >
                <Animated.View>
                  <TapGestureHandler
                    ref={tapRef}
                    numberOfTaps={2}
                    onGestureEvent={doubleTapHandler}
                    enabled={!disabled && actions.some(a => a.type === 'double_tap')}
                    simultaneousHandlers={[longPressRef]}
                  >
                    <Animated.View style={[styles.gestureArea, animatedStyle]}>
                      {children}
                    </Animated.View>
                  </TapGestureHandler>
                </Animated.View>
              </LongPressGestureHandler>
            </Animated.View>
          </PanGestureHandler>
        </Animated.View>
      </PinchGestureHandler>
    </GestureHandlerRootView>
  );
};

// Pre-configured gesture handlers for teacher workflows

export const AttendanceSwipeCard: React.FC<{
  children: ReactNode;
  studentId: string;
  onMarkPresent: (studentId: string) => void;
  onMarkAbsent: (studentId: string) => void;
  onViewDetails: (studentId: string) => void;
}> = ({ children, studentId, onMarkPresent, onMarkAbsent, onViewDetails }) => {
  const actions: GestureAction[] = [
    {
      id: 'mark-present',
      type: 'swipe_right',
      onAction: () => onMarkPresent(studentId),
      hapticType: 'success',
      culturallyAppropriate: true,
    },
    {
      id: 'mark-absent',
      type: 'swipe_left',
      onAction: () => onMarkAbsent(studentId),
      hapticType: 'warning',
      culturallyAppropriate: true,
    },
    {
      id: 'view-details',
      type: 'double_tap',
      onAction: () => onViewDetails(studentId),
      hapticType: 'light',
      culturallyAppropriate: true,
    },
  ];

  return (
    <TeacherGestureHandler
      actions={actions}
      professionalMode={true}
      showVisualFeedback={true}
      respectPrayerTime={true}
    >
      {children}
    </TeacherGestureHandler>
  );
};

export const GradeEntryGesture: React.FC<{
  children: ReactNode;
  studentId: string;
  onQuickGrade: (studentId: string, grade: 'excellent' | 'good' | 'needs_improvement') => void;
  onDetailedGrading: (studentId: string) => void;
}> = ({ children, studentId, onQuickGrade, onDetailedGrading }) => {
  const actions: GestureAction[] = [
    {
      id: 'excellent',
      type: 'swipe_up',
      onAction: () => onQuickGrade(studentId, 'excellent'),
      hapticType: 'success',
      culturallyAppropriate: true,
    },
    {
      id: 'needs-improvement',
      type: 'swipe_down',
      onAction: () => onQuickGrade(studentId, 'needs_improvement'),
      hapticType: 'warning',
      culturallyAppropriate: true,
    },
    {
      id: 'good',
      type: 'double_tap',
      onAction: () => onQuickGrade(studentId, 'good'),
      hapticType: 'medium',
      culturallyAppropriate: true,
    },
    {
      id: 'detailed',
      type: 'long_press',
      onAction: () => onDetailedGrading(studentId),
      hapticType: 'heavy',
      culturallyAppropriate: true,
    },
  ];

  return (
    <TeacherGestureHandler
      actions={actions}
      professionalMode={true}
      showVisualFeedback={true}
      respectPrayerTime={true}
    >
      {children}
    </TeacherGestureHandler>
  );
};

export const ClassManagementGesture: React.FC<{
  children: ReactNode;
  classId: string;
  onQuickActions: {
    startClass: (classId: string) => void;
    endClass: (classId: string) => void;
    takeAttendance: (classId: string) => void;
    viewDetails: (classId: string) => void;
    scheduleHomework: (classId: string) => void;
  };
}> = ({ children, classId, onQuickActions }) => {
  const actions: GestureAction[] = [
    {
      id: 'start-class',
      type: 'swipe_right',
      onAction: () => onQuickActions.startClass(classId),
      hapticType: 'success',
      culturallyAppropriate: true,
    },
    {
      id: 'end-class',
      type: 'swipe_left',
      onAction: () => onQuickActions.endClass(classId),
      hapticType: 'medium',
      culturallyAppropriate: true,
    },
    {
      id: 'attendance',
      type: 'swipe_up',
      onAction: () => onQuickActions.takeAttendance(classId),
      hapticType: 'light',
      culturallyAppropriate: true,
    },
    {
      id: 'homework',
      type: 'swipe_down',
      onAction: () => onQuickActions.scheduleHomework(classId),
      hapticType: 'light',
      culturallyAppropriate: true,
    },
    {
      id: 'details',
      type: 'double_tap',
      onAction: () => onQuickActions.viewDetails(classId),
      hapticType: 'light',
      culturallyAppropriate: true,
    },
  ];

  return (
    <TeacherGestureHandler
      actions={actions}
      professionalMode={true}
      showVisualFeedback={true}
      respectPrayerTime={true}
    >
      {children}
    </TeacherGestureHandler>
  );
};

export const ReportZoomGesture: React.FC<{
  children: ReactNode;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}> = ({ children, onZoomIn, onZoomOut, onResetZoom }) => {
  const actions: GestureAction[] = [
    {
      id: 'zoom',
      type: 'pinch',
      onAction: onZoomIn, // This will be determined by pinch scale
      hapticType: 'light',
      culturallyAppropriate: true,
    },
    {
      id: 'reset-zoom',
      type: 'double_tap',
      onAction: onResetZoom,
      hapticType: 'medium',
      culturallyAppropriate: true,
    },
  ];

  return (
    <TeacherGestureHandler
      actions={actions}
      professionalMode={true}
      showVisualFeedback={true}
      respectPrayerTime={true}
    >
      {children}
    </TeacherGestureHandler>
  );
};

export const HomeworkReviewGesture: React.FC<{
  children: ReactNode;
  homeworkId: string;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRequestRevision: (id: string) => void;
  onDetailedReview: (id: string) => void;
}> = ({ children, homeworkId, onApprove, onReject, onRequestRevision, onDetailedReview }) => {
  const actions: GestureAction[] = [
    {
      id: 'approve',
      type: 'swipe_right',
      onAction: () => onApprove(homeworkId),
      hapticType: 'success',
      culturallyAppropriate: true,
    },
    {
      id: 'reject',
      type: 'swipe_left',
      onAction: () => onReject(homeworkId),
      hapticType: 'error',
      culturallyAppropriate: true,
    },
    {
      id: 'revision',
      type: 'swipe_up',
      onAction: () => onRequestRevision(homeworkId),
      hapticType: 'warning',
      culturallyAppropriate: true,
    },
    {
      id: 'detailed-review',
      type: 'long_press',
      onAction: () => onDetailedReview(homeworkId),
      hapticType: 'heavy',
      culturallyAppropriate: true,
    },
  ];

  return (
    <TeacherGestureHandler
      actions={actions}
      professionalMode={true}
      showVisualFeedback={true}
      respectPrayerTime={true}
    >
      {children}
    </TeacherGestureHandler>
  );
};

// Cultural-aware gesture wrapper
export const CulturalGestureWrapper: React.FC<{
  children: ReactNode;
  actions: GestureAction[];
  culturalContext: 'prayer_time' | 'ramadan' | 'normal';
}> = ({ children, actions, culturalContext }) => {
  const getGestureSettings = () => {
    switch (culturalContext) {
      case 'prayer_time':
        return {
          disabled: true, // No gestures during prayer
          showVisualFeedback: false,
          professionalMode: true,
        };
      case 'ramadan':
        return {
          disabled: false,
          showVisualFeedback: true,
          professionalMode: true,
          // Filter out intensive haptic feedback
          actions: actions.map(action => ({
            ...action,
            hapticType: action.hapticType === 'heavy' ? 'light' : action.hapticType,
          })),
        };
      case 'normal':
      default:
        return {
          disabled: false,
          showVisualFeedback: true,
          professionalMode: true,
          actions,
        };
    }
  };

  const settings = getGestureSettings();

  return (
    <TeacherGestureHandler
      actions={settings.actions}
      disabled={settings.disabled}
      showVisualFeedback={settings.showVisualFeedback}
      professionalMode={settings.professionalMode}
      respectPrayerTime={true}
    >
      {children}
    </TeacherGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gestureArea: {
    flex: 1,
  },
});

export default TeacherGestureHandler;