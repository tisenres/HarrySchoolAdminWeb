import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  HapticFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  withTiming,
  runOnJS,
  interpolateColor,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 60; // Minimum swipe distance to trigger action
const FULL_SWIPE_THRESHOLD = 120; // Distance for full swipe action
const MAX_TRANSLATE = 150; // Maximum swipe distance

// Swipe action configuration based on UX research
export interface SwipeAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  backgroundColor: string;
  onPress: () => void;
  side: 'left' | 'right';
  priority: 'high' | 'medium' | 'low'; // Based on UX research frequency
}

interface SwipeableRowProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  enabled?: boolean;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
  hapticFeedback?: boolean;
  style?: any;
}

type AnimatedGHContext = {
  startX: number;
  isSwipeStarted: boolean;
};

export const SwipeableRow: React.FC<SwipeableRowProps> = ({
  children,
  leftActions = [],
  rightActions = [],
  enabled = true,
  onSwipeStart,
  onSwipeEnd,
  hapticFeedback = true,
  style
}) => {
  const translateX = useSharedValue(0);
  const panGestureRef = useRef(null);

  // Trigger haptic feedback
  const triggerHaptic = () => {
    if (hapticFeedback && Platform.OS === 'ios') {
      HapticFeedback.impactAsync(HapticFeedback.ImpactFeedbackStyle.Light);
    }
  };

  // Reset swipe position
  const resetPosition = () => {
    translateX.value = withSpring(0, {
      damping: 20,
      stiffness: 200
    });
  };

  // Execute swipe action
  const executeAction = (action: SwipeAction) => {
    runOnJS(triggerHaptic)();
    runOnJS(action.onPress)();
    resetPosition();
  };

  // Gesture handler for swipe
  const gestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    AnimatedGHContext
  >({
    onStart: (_, context) => {
      context.startX = translateX.value;
      context.isSwipeStarted = false;
      
      if (onSwipeStart) {
        runOnJS(onSwipeStart)();
      }
    },
    onActive: (event, context) => {
      if (!enabled) return;

      const newTranslateX = context.startX + event.translationX;
      
      // Constrain swipe within bounds
      const leftBound = leftActions.length > 0 ? MAX_TRANSLATE : 0;
      const rightBound = rightActions.length > 0 ? -MAX_TRANSLATE : 0;
      
      translateX.value = Math.max(
        rightBound,
        Math.min(leftBound, newTranslateX)
      );

      // Trigger haptic feedback at thresholds
      if (!context.isSwipeStarted && Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        context.isSwipeStarted = true;
        runOnJS(triggerHaptic)();
      }
    },
    onEnd: (event) => {
      if (!enabled) return;

      const absTranslateX = Math.abs(translateX.value);
      const direction = translateX.value > 0 ? 'right' : 'left';

      if (onSwipeEnd) {
        runOnJS(onSwipeEnd)();
      }

      // Check if swipe threshold is met
      if (absTranslateX >= SWIPE_THRESHOLD) {
        const actions = direction === 'right' ? leftActions : rightActions;
        
        if (actions.length > 0) {
          // Full swipe executes primary action immediately
          if (absTranslateX >= FULL_SWIPE_THRESHOLD) {
            const primaryAction = actions.find(a => a.priority === 'high') || actions[0];
            runOnJS(executeAction)(primaryAction);
            return;
          }
          
          // Partial swipe shows actions
          const snapPosition = direction === 'right' ? 
            Math.min(actions.length * 80, MAX_TRANSLATE) : 
            -Math.min(actions.length * 80, MAX_TRANSLATE);
          
          translateX.value = withSpring(snapPosition, {
            damping: 20,
            stiffness: 200
          });
          return;
        }
      }

      // Reset if threshold not met or no actions
      resetPosition();
    }
  });

  // Animated style for the main content
  const mainContentStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }]
    };
  });

  // Animated style for left actions
  const leftActionsStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolate.CLAMP
    );

    const scale = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0.8, 1],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      transform: [{ scale }]
    };
  });

  // Animated style for right actions
  const rightActionsStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolate.CLAMP
    );

    const scale = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0.8],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      transform: [{ scale }]
    };
  });

  // Render action buttons
  const renderActions = (actions: SwipeAction[], side: 'left' | 'right') => {
    if (actions.length === 0) return null;

    return (
      <Animated.View 
        style={[
          styles.actionsContainer,
          side === 'left' ? styles.leftActions : styles.rightActions,
          side === 'left' ? leftActionsStyle : rightActionsStyle
        ]}
      >
        {actions.map((action, index) => (
          <TouchableOpacity
            key={action.id}
            style={[
              styles.actionButton,
              { backgroundColor: action.backgroundColor },
              action.priority === 'high' && styles.primaryAction
            ]}
            onPress={() => executeAction(action)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={action.icon as any} 
              size={20} 
              color={action.color} 
            />
            <Text style={[styles.actionText, { color: action.color }]}>
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* Left Actions */}
      {renderActions(leftActions, 'left')}
      
      {/* Right Actions */}
      {renderActions(rightActions, 'right')}
      
      {/* Main Content */}
      <PanGestureHandler
        ref={panGestureRef}
        onGestureEvent={gestureHandler}
        enabled={enabled}
        activeOffsetX={[-10, 10]}
        failOffsetY={[-20, 20]}
      >
        <Animated.View style={[styles.mainContent, mainContentStyle]}>
          {children}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

// Predefined action configurations based on UX research
export const SwipeActionPresets = {
  // Attendance actions (78% usage frequency from UX research)
  MARK_PRESENT: {
    id: 'mark_present',
    label: 'Present',
    icon: 'checkmark-circle',
    color: '#ffffff',
    backgroundColor: '#059669',
    side: 'right' as const,
    priority: 'high' as const
  },
  
  MARK_ABSENT: {
    id: 'mark_absent',
    label: 'Absent',
    icon: 'close-circle',
    color: '#ffffff',
    backgroundColor: '#dc2626',
    side: 'left' as const,
    priority: 'medium' as const
  },
  
  MARK_LATE: {
    id: 'mark_late',
    label: 'Late',
    icon: 'time',
    color: '#ffffff',
    backgroundColor: '#f59e0b',
    side: 'right' as const,
    priority: 'medium' as const
  },
  
  MARK_EXCUSED: {
    id: 'mark_excused',
    label: 'Excused',
    icon: 'medical',
    color: '#ffffff',
    backgroundColor: '#6366f1',
    side: 'left' as const,
    priority: 'low' as const
  },

  // Communication actions (Cultural priority for Uzbek context)
  CALL_PARENT: {
    id: 'call_parent',
    label: 'Call',
    icon: 'call',
    color: '#ffffff',
    backgroundColor: '#2563eb',
    side: 'right' as const,
    priority: 'high' as const
  },
  
  MESSAGE_PARENT: {
    id: 'message_parent',
    label: 'Message',
    icon: 'mail',
    color: '#ffffff',
    backgroundColor: '#1d7452',
    side: 'left' as const,
    priority: 'high' as const
  },

  // Group management actions
  ADD_STUDENT: {
    id: 'add_student',
    label: 'Add',
    icon: 'add-circle',
    color: '#ffffff',
    backgroundColor: '#1d7452',
    side: 'right' as const,
    priority: 'medium' as const
  },
  
  REMOVE_STUDENT: {
    id: 'remove_student',
    label: 'Remove',
    icon: 'remove-circle',
    color: '#ffffff',
    backgroundColor: '#dc2626',
    side: 'left' as const,
    priority: 'low' as const
  },

  // Performance actions
  ADD_GRADE: {
    id: 'add_grade',
    label: 'Grade',
    icon: 'star',
    color: '#ffffff',
    backgroundColor: '#7c3aed',
    side: 'right' as const,
    priority: 'medium' as const
  },
  
  ADD_NOTE: {
    id: 'add_note',
    label: 'Note',
    icon: 'document-text',
    color: '#ffffff',
    backgroundColor: '#f59e0b',
    side: 'left' as const,
    priority: 'medium' as const
  }
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  mainContent: {
    backgroundColor: '#ffffff',
    zIndex: 1,
  },
  actionsContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 0,
  },
  leftActions: {
    left: 0,
    paddingLeft: 16,
  },
  rightActions: {
    right: 0,
    paddingRight: 16,
  },
  actionButton: {
    minWidth: 70,
    height: '80%',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  primaryAction: {
    minWidth: 80,
    transform: [{ scale: 1.05 }],
  },
  actionText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
});