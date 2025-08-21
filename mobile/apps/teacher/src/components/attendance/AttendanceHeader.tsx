import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

interface ClassSession {
  id: string;
  group_name: string;
  subject: string;
  start_time: string;
  end_time: string;
  students: any[];
}

interface AttendanceHeaderProps {
  classSession: ClassSession;
  hijriDate: string;
  isPrayerTime: boolean;
}

export function AttendanceHeader({
  classSession,
  hijriDate,
  isPrayerTime,
}: AttendanceHeaderProps) {
  const formatTime = (time: string) => {
    return new Date(`2024-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      {/* Class Information */}
      <View style={styles.classInfo}>
        <Text style={styles.groupName}>{classSession.group_name}</Text>
        <Text style={styles.subject}>{classSession.subject}</Text>
        <View style={styles.timeRow}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 8V12L16 16M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
              stroke="#64748b"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <Text style={styles.timeText}>
            {formatTime(classSession.start_time)} - {formatTime(classSession.end_time)}
          </Text>
        </View>
      </View>

      {/* Date Information */}
      <View style={styles.dateInfo}>
        <Text style={styles.gregorianDate}>{getCurrentDate()}</Text>
        <Text style={styles.hijriDate}>{hijriDate}</Text>
        
        {isPrayerTime && (
          <View style={styles.prayerAlert}>
            <Circle cx={4} cy={4} r={4} fill="#059669" />
            <Text style={styles.prayerText}>Prayer time</Text>
          </View>
        )}
      </View>

      {/* Attendance Summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{classSession.students.length}</Text>
          <Text style={styles.summaryLabel}>Total Students</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNumber, { color: '#10b981' }]}>
            {classSession.students.filter(s => s.attendance_status === 'present').length}
          </Text>
          <Text style={styles.summaryLabel}>Present</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNumber, { color: '#dc2626' }]}>
            {classSession.students.filter(s => s.attendance_status === 'absent').length}
          </Text>
          <Text style={styles.summaryLabel}>Absent</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  classInfo: {
    marginBottom: 16,
  },
  groupName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subject: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
    fontWeight: '500',
  },
  dateInfo: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  gregorianDate: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
    marginBottom: 4,
  },
  hijriDate: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  prayerAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  prayerText: {
    fontSize: 12,
    color: '#059669',
    marginLeft: 6,
    fontWeight: '500',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 8,
  },
});