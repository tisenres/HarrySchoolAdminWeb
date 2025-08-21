import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  State,
  GestureHandlerGestureEvent,
  PanGestureHandlerEventPayload,
} from 'react-native-gesture-handler';
import Svg, { Path, Circle } from 'react-native-svg';

interface Student {
  id: string;
  name: string;
  photo_url?: string;
  attendance_status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
}

interface StudentAttendanceRowProps {
  student: Student;
  index: number;
  isSelected: boolean;
  onToggleSelect: () => void;
  onStatusChange: (status: Student['attendance_status']) => void;
}

export function StudentAttendanceRow({
  student,
  index,
  isSelected,
  onToggleSelect,
  onStatusChange,
}: StudentAttendanceRowProps) {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const selectionStyle = useAnimatedStyle(() => ({
    opacity: isSelected ? 1 : 0,
    transform: [{ scale: isSelected ? 1 : 0.8 }],
  }));

  const getStatusIcon = (status: Student['attendance_status']) => {
    switch (status) {
      case 'present':
        return (
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
              stroke="#10b981"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        );
      case 'absent':
        return (
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M18 6L6 18M6 6L18 18"
              stroke="#dc2626"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        );
      case 'late':
        return (
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 8V12L16 16M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        );
      case 'excused':
        return (
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
              stroke="#3b82f6"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        );
      default:
        return (
          <Circle cx={10} cy={10} r={8} stroke="#94a3b8" strokeWidth={2} fill="none" />
        );
    }
  };

  const getStatusColor = (status: Student['attendance_status']) => {
    switch (status) {
      case 'present':
        return '#10b981';
      case 'absent':
        return '#dc2626';
      case 'late':
        return '#f59e0b';
      case 'excused':
        return '#3b82f6';
      default:
        return '#94a3b8';
    }
  };

  const getStatusLabel = (status: Student['attendance_status']) => {
    switch (status) {
      case 'present':
        return 'Present';
      case 'absent':
        return 'Absent';
      case 'late':
        return 'Late';
      case 'excused':
        return 'Excused';
      default:
        return 'Unknown';
    }
  };

  const handleGesture = (event: GestureHandlerGestureEvent<PanGestureHandlerEventPayload>) => {
    const { translationX, state } = event.nativeEvent;

    if (state === State.ACTIVE) {
      translateX.value = translationX;
      
      // Provide haptic feedback for gesture zones
      if (Math.abs(translationX) > 80) {
        // Trigger haptic feedback
      }
    } else if (state === State.END) {
      if (translationX > 80) {
        // Swipe right for present
        onStatusChange('present');
      } else if (translationX < -80) {
        // Swipe left for absent
        onStatusChange('absent');
      }
      
      translateX.value = withSpring(0);
    }
  };

  const handlePress = () => {
    scale.value = withSpring(0.98, { duration: 100 }, () => {
      scale.value = withSpring(1, { duration: 100 });
    });
    onToggleSelect();
  };

  const statusActions = [
    { status: 'present' as const, label: 'Present', color: '#10b981' },
    { status: 'absent' as const, label: 'Absent', color: '#dc2626' },
    { status: 'late' as const, label: 'Late', color: '#f59e0b' },
    { status: 'excused' as const, label: 'Excused', color: '#3b82f6' },
  ];

  return (
    <PanGestureHandler onGestureEvent={handleGesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <Pressable style={styles.row} onPress={handlePress}>
          {/* Selection indicator */}
          <Animated.View style={[styles.selectionIndicator, selectionStyle]}>
            <Circle cx={12} cy={12} r={10} fill="#1d7452" />
            <Svg width={24} height={24} viewBox="0 0 24 24" style={styles.checkIcon}>
              <Path
                d="M9 12L11 14L15 10"
                stroke="white"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Animated.View>

          {/* Student info */}
          <View style={styles.studentInfo}>
            <View style={styles.avatarContainer}>
              {student.photo_url ? (
                <Image source={{ uri: student.photo_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {student.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.nameContainer}>
              <Text style={styles.studentName}>{student.name}</Text>
              <Text style={styles.studentIndex}>Student #{index + 1}</Text>
            </View>
          </View>

          {/* Current status */}
          <View style={styles.statusContainer}>
            <View style={styles.statusIcon}>
              {getStatusIcon(student.attendance_status)}
            </View>
            <Text style={[
              styles.statusLabel,
              { color: getStatusColor(student.attendance_status) }
            ]}>
              {getStatusLabel(student.attendance_status)}
            </Text>
          </View>
        </Pressable>

        {/* Quick status change buttons */}
        <View style={styles.statusActions}>
          {statusActions.map((action) => (
            <Pressable
              key={action.status}
              style={[
                styles.statusActionButton,
                { 
                  backgroundColor: action.color,
                  opacity: student.attendance_status === action.status ? 1 : 0.7,
                }
              ]}
              onPress={() => onStatusChange(action.status)}
            >
              <Text style={styles.statusActionText}>
                {action.label.charAt(0)}
              </Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  selectionIndicator: {
    width: 24,
    height: 24,
    marginRight: 12,
    position: 'relative',
  },
  checkIcon: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  studentInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#64748b',
  },
  nameContainer: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  studentIndex: {
    fontSize: 12,
    color: '#64748b',
  },
  statusContainer: {
    alignItems: 'center',
    minWidth: 80,
  },
  statusIcon: {
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  statusActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusActionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});