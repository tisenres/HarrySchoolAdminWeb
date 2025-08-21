import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Svg, { Path, Circle } from 'react-native-svg';
import { AttendanceHeader } from '../../components/attendance/AttendanceHeader';
import { BulkMarkingActions } from '../../components/attendance/BulkMarkingActions';
import { StudentAttendanceRow } from '../../components/attendance/StudentAttendanceRow';
import { OfflineIndicator } from '../../components/attendance/OfflineIndicator';
import { useAttendanceData } from '../../hooks/useAttendanceData';
import { useAttendanceSync } from '../../hooks/useAttendanceSync';
import { useIslamicCalendar } from '../../hooks/useIslamicCalendar';

interface Student {
  id: string;
  name: string;
  photo_url?: string;
  attendance_status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
}

interface ClassSession {
  id: string;
  group_name: string;
  subject: string;
  start_time: string;
  end_time: string;
  students: Student[];
}

export function MarkAttendanceScreen({ route }: any) {
  const insets = useSafeAreaInsets();
  const { classId } = route.params;
  const { hijriDate, isPrayerTime } = useIslamicCalendar();
  
  const {
    classSession,
    isLoading,
    updateAttendance,
    bulkUpdateAttendance,
    saveAttendance,
  } = useAttendanceData(classId);
  
  const { isOnline, pendingChanges, syncNow } = useAttendanceSync();
  
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [isMarking, setIsMarking] = useState(false);

  // Quick marking presets based on UX research frequency
  const quickActions = [
    {
      label: 'Mark All Present',
      status: 'present' as const,
      frequency: 85, // 85% of classes start with all present
      color: '#10b981',
      icon: (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path
            d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
            stroke="white"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ),
    },
    {
      label: 'Mark Selected Absent',
      status: 'absent' as const,
      frequency: 60, // Common follow-up action
      color: '#dc2626',
      icon: (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path
            d="M18 6L6 18M6 6L18 18"
            stroke="white"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ),
    },
    {
      label: 'Mark Selected Late',
      status: 'late' as const,
      frequency: 40,
      color: '#f59e0b',
      icon: (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 8V12L16 16M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
            stroke="white"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ),
    },
  ];

  const handleBulkAction = async (status: Student['attendance_status']) => {
    setIsMarking(true);
    try {
      if (status === 'present') {
        // Mark all students present
        await bulkUpdateAttendance(classSession?.students.map(s => s.id) || [], status);
        setSelectedStudents(new Set());
      } else {
        // Mark selected students with the status
        if (selectedStudents.size === 0) {
          Alert.alert(
            'No Students Selected',
            'Please select students first, or use "Mark All Present" to mark everyone present.',
            [{ text: 'OK' }]
          );
          return;
        }
        await bulkUpdateAttendance(Array.from(selectedStudents), status);
        setSelectedStudents(new Set());
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update attendance. Changes saved offline.');
    } finally {
      setIsMarking(false);
    }
  };

  const handleStudentToggle = (studentId: string) => {
    const newSelection = new Set(selectedStudents);
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId);
    } else {
      newSelection.add(studentId);
    }
    setSelectedStudents(newSelection);
  };

  const handleSaveAttendance = async () => {
    try {
      await saveAttendance();
      Alert.alert(
        'Attendance Saved',
        'Attendance has been saved successfully.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save attendance. Changes saved offline.');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading class attendance...</Text>
        </View>
      </View>
    );
  }

  if (!classSession) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Class session not found</Text>
        </View>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header with class information and Islamic calendar */}
      <AttendanceHeader
        classSession={classSession}
        hijriDate={hijriDate}
        isPrayerTime={isPrayerTime}
      />

      {/* Offline indicator */}
      <OfflineIndicator 
        isOnline={isOnline} 
        pendingChanges={pendingChanges}
        onSyncPress={syncNow}
      />

      {/* Bulk marking actions */}
      <BulkMarkingActions
        actions={quickActions}
        selectedCount={selectedStudents.size}
        totalCount={classSession.students.length}
        isMarking={isMarking}
        onAction={handleBulkAction}
      />

      {/* Student list */}
      <ScrollView style={styles.studentList} showsVerticalScrollIndicator={false}>
        <View style={styles.studentListHeader}>
          <Text style={styles.studentListTitle}>
            Students ({classSession.students.length})
          </Text>
          <Text style={styles.instructionText}>
            Tap to select, then use bulk actions above
          </Text>
        </View>

        {classSession.students.map((student, index) => (
          <StudentAttendanceRow
            key={student.id}
            student={student}
            index={index}
            isSelected={selectedStudents.has(student.id)}
            onToggleSelect={() => handleStudentToggle(student.id)}
            onStatusChange={(status) => updateAttendance(student.id, status)}
          />
        ))}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Save button */}
      <View style={styles.saveButtonContainer}>
        <Pressable
          style={[
            styles.saveButton,
            isMarking && styles.saveButtonDisabled,
          ]}
          onPress={handleSaveAttendance}
          disabled={isMarking}
        >
          <Text style={styles.saveButtonText}>
            {isMarking ? 'Saving...' : 'Save Attendance'}
          </Text>
        </Pressable>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
  },
  studentList: {
    flex: 1,
  },
  studentListHeader: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  studentListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  instructionText: {
    fontSize: 14,
    color: '#64748b',
  },
  bottomPadding: {
    height: 100,
  },
  saveButtonContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  saveButton: {
    backgroundColor: '#1d7452',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  saveButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});