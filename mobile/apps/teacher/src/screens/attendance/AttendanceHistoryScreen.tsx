import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, DateData } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useAttendanceData } from '../../hooks/useAttendanceData';
import { useAttendanceSync } from '../../hooks/useAttendanceSync';
import { memoryCache } from '../../services/memoryCache';

interface AttendanceStats {
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendanceRate: number;
}

interface CalendarMarkings {
  [date: string]: {
    marked: boolean;
    dotColor: string;
    selectedColor?: string;
    selected?: boolean;
  };
}

export const AttendanceHistoryScreen: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [calendarMarkings, setCalendarMarkings] = useState<CalendarMarkings>({});
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  const { getAttendanceHistory, getAttendanceStats } = useAttendanceData();
  const { isOnline, syncStatus, pendingCount, forceSyncAll } = useAttendanceSync();

  useEffect(() => {
    loadCalendarData();
    loadAttendanceStats(selectedDate);
  }, [selectedDate]);

  const loadCalendarData = async () => {
    try {
      // Load last 3 months of attendance data for calendar markings
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);

      const cacheKey = `calendar_markings_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}`;
      let markings = await memoryCache.get<CalendarMarkings>(cacheKey);

      if (!markings) {
        // Generate markings based on attendance data
        markings = {};
        
        // Mock data for demonstration - in real app, fetch from getAttendanceHistory
        const attendanceDates = await getAttendanceHistory(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        );

        attendanceDates.forEach(record => {
          const rate = (record.presentCount + record.lateCount) / record.totalStudents;
          let dotColor = '#e74c3c'; // Red for low attendance
          
          if (rate >= 0.9) dotColor = '#27ae60'; // Green for high attendance
          else if (rate >= 0.75) dotColor = '#f39c12'; // Orange for medium attendance

          markings[record.date] = {
            marked: true,
            dotColor,
            ...(record.date === selectedDate && {
              selected: true,
              selectedColor: '#1d7452'
            })
          };
        });

        await memoryCache.set(cacheKey, markings, 300); // Cache for 5 minutes
      }

      // Ensure selected date is marked
      markings[selectedDate] = {
        ...markings[selectedDate],
        selected: true,
        selectedColor: '#1d7452'
      };

      setCalendarMarkings(markings);
    } catch (error) {
      console.error('Error loading calendar data:', error);
    }
  };

  const loadAttendanceStats = async (date: string) => {
    try {
      const cacheKey = `attendance_stats_${date}`;
      let stats = await memoryCache.get<AttendanceStats>(cacheKey);

      if (!stats) {
        stats = await getAttendanceStats(date);
        await memoryCache.set(cacheKey, stats, 600); // Cache for 10 minutes
      }

      setAttendanceStats(stats);
    } catch (error) {
      console.error('Error loading attendance stats:', error);
    }
  };

  const onDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    
    try {
      // Clear relevant caches
      await memoryCache.clear('attendance_stats_');
      await memoryCache.clear('calendar_markings_');
      
      // Force sync if online
      if (isOnline && pendingCount > 0) {
        await forceSyncAll();
      }

      // Reload data
      await Promise.all([
        loadCalendarData(),
        loadAttendanceStats(selectedDate)
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const formatAttendanceRate = (rate: number): string => {
    return `${Math.round(rate * 100)}%`;
  };

  const getAttendanceColor = (rate: number): string => {
    if (rate >= 0.9) return '#27ae60';
    if (rate >= 0.75) return '#f39c12';
    return '#e74c3c';
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>Attendance History</Text>
        <View style={styles.headerActions}>
          {!isOnline && (
            <View style={styles.offlineIndicator}>
              <Ionicons name="cloud-offline" size={16} color="#e74c3c" />
              <Text style={styles.offlineText}>Offline</Text>
            </View>
          )}
          {pendingCount > 0 && (
            <View style={styles.pendingIndicator}>
              <Text style={styles.pendingText}>{pendingCount} pending</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.viewToggle}
            onPress={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
          >
            <Ionicons 
              name={viewMode === 'calendar' ? 'list' : 'calendar'} 
              size={20} 
              color="#1d7452" 
            />
          </TouchableOpacity>
        </View>
      </View>
      
      {attendanceStats && (
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{attendanceStats.totalStudents}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#27ae60' }]}>
                {attendanceStats.presentCount}
              </Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#f39c12' }]}>
                {attendanceStats.lateCount}
              </Text>
              <Text style={styles.statLabel}>Late</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#e74c3c' }]}>
                {attendanceStats.absentCount}
              </Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
          </View>
          
          <View style={styles.attendanceRateContainer}>
            <Text style={styles.attendanceRateLabel}>Attendance Rate</Text>
            <Text style={[
              styles.attendanceRateValue,
              { color: getAttendanceColor(attendanceStats.attendanceRate) }
            ]}>
              {formatAttendanceRate(attendanceStats.attendanceRate)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderCalendarView = () => (
    <Calendar
      current={selectedDate}
      onDayPress={onDayPress}
      markedDates={calendarMarkings}
      theme={{
        primaryColor: '#1d7452',
        selectedDayBackgroundColor: '#1d7452',
        selectedDayTextColor: '#ffffff',
        todayTextColor: '#1d7452',
        dayTextColor: '#2d4150',
        textDisabledColor: '#d9e1e8',
        dotColor: '#1d7452',
        selectedDotColor: '#ffffff',
        arrowColor: '#1d7452',
        disabledArrowColor: '#d9e1e8',
        monthTextColor: '#2d4150',
        indicatorColor: '#1d7452',
        textDayFontFamily: 'System',
        textMonthFontFamily: 'System',
        textDayHeaderFontFamily: 'System',
        textDayFontWeight: '400',
        textMonthFontWeight: '600',
        textDayHeaderFontWeight: '600',
        textDayFontSize: 16,
        textMonthFontSize: 16,
        textDayHeaderFontSize: 14
      }}
      enableSwipeMonths={true}
      hideExtraDays={true}
      firstDay={1} // Start week on Monday
    />
  );

  const renderListView = () => (
    <View style={styles.listContainer}>
      <Text style={styles.sectionTitle}>Recent Attendance</Text>
      {/* This would contain a FlatList of recent attendance records */}
      <View style={styles.placeholderList}>
        <Text style={styles.placeholderText}>
          List view implementation coming soon
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1d7452']}
            tintColor="#1d7452"
          />
        }
      >
        {renderHeader()}
        
        <View style={styles.content}>
          {viewMode === 'calendar' ? renderCalendarView() : renderListView()}
        </View>
        
        {selectedDate && (
          <View style={styles.selectedDateInfo}>
            <Text style={styles.selectedDateText}>
              Selected: {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2d4150',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  offlineText: {
    fontSize: 12,
    color: '#e74c3c',
    fontWeight: '500',
  },
  pendingIndicator: {
    backgroundColor: '#fff3cd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingText: {
    fontSize: 12,
    color: '#856404',
    fontWeight: '500',
  },
  viewToggle: {
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  statsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d4150',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
  },
  attendanceRateContainer: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  attendanceRateLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  attendanceRateValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  content: {
    backgroundColor: '#ffffff',
    margin: 20,
    borderRadius: 12,
    padding: 16,
  },
  listContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d4150',
    marginBottom: 16,
  },
  placeholderList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  placeholderText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
  selectedDateInfo: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  selectedDateText: {
    fontSize: 16,
    color: '#2d4150',
    fontWeight: '500',
  },
});