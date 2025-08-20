/**
 * Attendance Button Component - Harry School Design System
 * 
 * Quick attendance marking button optimized for teacher efficiency
 * Features:
 * - Ultra-fast animations (100-150ms) for rapid marking
 * - Clear visual feedback for present/absent states
 * - Haptic feedback for tactile confirmation
 * - Batch selection support for efficiency
 */

import React from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { Text } from './Text';
import { animations } from '../theme/animations';
import { colors } from '../theme/colors';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | null;

interface AttendanceButtonProps {
  // Student data
  studentId: string;
  studentName: string;
  currentStatus: AttendanceStatus;
  
  // Interaction props
  onStatusChange: (studentId: string, status: AttendanceStatus) => void;
  
  // Visual props
  size?: 'small' | 'medium';
  style?: ViewStyle;
  
  // Batch selection mode
  batchMode?: boolean;
  isSelected?: boolean;
  onBatchSelect?: (studentId: string) => void;
  
  // Accessibility
  testID?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const AttendanceButton: React.FC<AttendanceButtonProps> = ({
  studentId,
  studentName,
  currentStatus,
  onStatusChange,
  size = 'medium',
  style,
  batchMode = false,
  isSelected = false,
  onBatchSelect,
  testID,
}) => {
  // Animation hooks optimized for teacher efficiency
  const { animatedStyle, checkStyle, markAttendance } = animations.teacher.useAttendanceCheck();
  const { animatedStyle: submitStyle, submitSuccess } = animations.teacher.useQuickSubmit();
  const selectionStyle = animations.utility.useScale(batchMode && isSelected);
  
  // Get status colors and labels
  const getStatusConfig = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return {
          color: colors.semantic.success.main,
          textColor: colors.semantic.success.contrast,
          label: '✓',
          bgColor: colors.semantic.success.light,
        };
      case 'absent':
        return {
          color: colors.semantic.error.main,
          textColor: colors.semantic.error.contrast,
          label: '✗',
          bgColor: colors.semantic.error.light,
        };
      case 'late':
        return {
          color: colors.semantic.warning.main,
          textColor: colors.semantic.warning.contrast,
          label: '⏰',
          bgColor: colors.semantic.warning.light,
        };
      case 'excused':
        return {
          color: colors.educational.level.intermediate,
          textColor: colors.neutral[50],
          label: 'E',
          bgColor: colors.educational.level.beginner,
        };
      default:
        return {
          color: colors.neutral[300],
          textColor: colors.neutral[700],
          label: '?',
          bgColor: colors.neutral[100],
        };
    }
  };
  
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          width: 60,
          height: 36,
          borderRadius: 6,
          fontSize: 12,
          iconSize: 16,
        };
      case 'medium':
        return {
          width: 80,
          height: 44,
          borderRadius: 8,
          fontSize: 14,
          iconSize: 20,
        };
      default:
        return {
          width: 80,
          height: 44,
          borderRadius: 8,
          fontSize: 14,
          iconSize: 20,
        };
    }
  };
  
  const statusConfig = getStatusConfig(currentStatus);
  const sizeStyles = getSizeStyles();
  
  // Cycle through attendance statuses for quick marking
  const cycleStatus = () => {
    const statusCycle: AttendanceStatus[] = ['present', 'absent', 'late', 'excused'];
    const currentIndex = statusCycle.indexOf(currentStatus);
    const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];
    
    markAttendance(nextStatus === 'present');
    onStatusChange(studentId, nextStatus);
    submitSuccess();
  };
  
  const handlePress = () => {
    if (batchMode && onBatchSelect) {
      onBatchSelect(studentId);
    } else {
      cycleStatus();
    }
  };
  
  return (
    <View style={[{ alignItems: 'center', minWidth: sizeStyles.width }, style]}>
      {/* Student Name Label */}
      <Text
        style={{
          fontSize: sizeStyles.fontSize - 2,
          color: colors.text.secondary,
          textAlign: 'center',
          marginBottom: 4,
          fontWeight: '500',
        }}
        numberOfLines={1}
      >
        {studentName}
      </Text>
      
      {/* Attendance Status Button */}
      <AnimatedPressable
        style={[
          {
            width: sizeStyles.width,
            height: sizeStyles.height,
            borderRadius: sizeStyles.borderRadius,
            backgroundColor: batchMode && isSelected 
              ? colors.semantic.primary.main 
              : statusConfig.bgColor,
            borderWidth: 2,
            borderColor: batchMode && isSelected 
              ? colors.semantic.primary.dark 
              : statusConfig.color,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: colors.neutral[900],
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          },
          animatedStyle,
          submitStyle,
          selectionStyle,
        ]}
        onPress={handlePress}
        testID={testID}
      >
        {/* Status Icon/Label */}
        <Animated.Text
          style={[
            checkStyle,
            {
              fontSize: sizeStyles.iconSize,
              color: batchMode && isSelected 
                ? colors.semantic.primary.contrast 
                : statusConfig.textColor,
              fontWeight: '700',
            },
          ]}
        >
          {batchMode && isSelected ? '✓' : statusConfig.label}
        </Animated.Text>
        
        {/* Quick Status Indicator */}
        {currentStatus && !batchMode && (
          <View
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: statusConfig.color,
              borderWidth: 1,
              borderColor: colors.background.primary,
            }}
          />
        )}
      </AnimatedPressable>
      
      {/* Batch Mode Selection Indicator */}
      {batchMode && (
        <View
          style={{
            marginTop: 2,
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: isSelected 
              ? colors.semantic.primary.main 
              : colors.neutral[300],
          }}
        />
      )}
    </View>
  );
};

export default AttendanceButton;