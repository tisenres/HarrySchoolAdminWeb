import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

interface ClassItem {
  id: string;
  subject: string;
  group_name: string;
  start_time: string;
  end_time: string;
  room: string;
  student_count: number;
  is_current: boolean;
  is_upcoming: boolean;
  attendance_marked: boolean;
}

interface TodaysClassesProps {
  classes: ClassItem[];
  isLoading: boolean;
}

function ClassCard({ classItem }: { classItem: ClassItem }) {
  const timeFormat = (time: string) => {
    return new Date(`2024-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  return (
    <View style={[
      styles.classCard,
      classItem.is_current && styles.currentClass,
    ]}>
      {classItem.is_current && (
        <View style={styles.currentIndicator}>
          <Circle cx={6} cy={6} r={6} fill="#10b981" />
          <Text style={styles.currentText}>Current Class</Text>
        </View>
      )}

      <View style={styles.classHeader}>
        <Text style={styles.subject}>{classItem.subject}</Text>
        <Text style={styles.time}>
          {timeFormat(classItem.start_time)} - {timeFormat(classItem.end_time)}
        </Text>
      </View>

      <View style={styles.classDetails}>
        <View style={styles.detailRow}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path
              d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z"
              stroke="#64748b"
              strokeWidth={1.5}
            />
            <Path
              d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z"
              stroke="#64748b"
              strokeWidth={1.5}
            />
          </Svg>
          <Text style={styles.detailText}>
            {classItem.group_name} • {classItem.student_count} students
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path
              d="M17.657 16.657L13.414 20.9C13.039 21.275 12.529 21.485 12 21.485C11.471 21.485 10.961 21.275 10.586 20.9L6.343 16.657C5.22422 15.5381 4.46234 14.1127 4.15369 12.5608C3.84504 11.0089 4.00349 9.40047 4.60901 7.93853C5.21452 6.4766 6.2399 5.22671 7.55548 4.34696C8.87107 3.46721 10.4178 3 12 3C13.5822 3 15.1289 3.46721 16.4445 4.34696C17.7601 5.22671 18.7855 6.4766 19.391 7.93853C19.9965 9.40047 20.155 11.0089 19.8463 12.5608C19.5377 14.1127 18.7758 15.5381 17.657 16.657Z"
              stroke="#64748b"
              strokeWidth={1.5}
            />
            <Path
              d="M15 11C15 12.6569 13.6569 14 12 14C10.3431 14 9 12.6569 9 11C9 9.34315 10.3431 8 12 8C13.6569 8 15 9.34315 15 11Z"
              stroke="#64748b"
              strokeWidth={1.5}
            />
          </Svg>
          <Text style={styles.detailText}>Room {classItem.room}</Text>
        </View>
      </View>

      <View style={styles.attendanceStatus}>
        {classItem.attendance_marked ? (
          <View style={styles.attendanceMarked}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path
                d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                stroke="#10b981"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.attendanceText}>Attendance marked</Text>
          </View>
        ) : classItem.is_current ? (
          <View style={styles.attendancePending}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 8V12L16 16M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                stroke="#f59e0b"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={[styles.attendanceText, { color: '#f59e0b' }]}>
              Mark attendance now
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function TodaysClasses({ classes, isLoading }: TodaysClassesProps) {
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Today's Classes</Text>
        <View style={styles.loadingCard} />
        <View style={styles.loadingCard} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Today's Classes</Text>
      
      {classes.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No classes scheduled for today</Text>
        </View>
      ) : (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.classesContainer}
        >
          {classes.map((classItem) => (
            <ClassCard key={classItem.id} classItem={classItem} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  classesContainer: {
    paddingHorizontal: 4,
  },
  classCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    width: 280,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  currentClass: {
    borderWidth: 2,
    borderColor: '#10b981',
  },
  currentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  currentText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
    marginLeft: 8,
  },
  classHeader: {
    marginBottom: 12,
  },
  subject: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  time: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  classDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
  },
  attendanceStatus: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  attendanceMarked: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendancePending: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendanceText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
    marginLeft: 6,
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
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
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  loadingCard: {
    height: 120,
    backgroundColor: '#e2e8f0',
    borderRadius: 16,
    marginBottom: 12,
  },
});