import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const COLORS = {
  primary: '#1d7452',
  secondary: '#2d9e6a',
  gold: '#f7c52d',
  background: '#f8fafc',
  white: '#ffffff',
  text: '#1a1a1a',
  textSecondary: '#64748b',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  lightBlue: '#dbeafe',
  lightGreen: '#dcfce7',
};

export default function ScheduleScreen() {
  const todaySchedule = [
    {
      id: 1,
      subject: 'Arabic Grammar',
      teacher: 'Ustadh Omar',
      time: '09:00 - 10:00',
      location: 'Room A-201',
      status: 'completed'
    },
    {
      id: 2,
      subject: 'Islamic Studies',
      teacher: 'Ustadh Yusuf',
      time: '10:15 - 11:15',
      location: 'Room B-105',
      status: 'ongoing'
    },
    {
      id: 3,
      subject: 'English Literature',
      teacher: 'Ms. Sarah',
      time: '11:30 - 12:30',
      location: 'Room A-301',
      status: 'upcoming'
    },
    {
      id: 4,
      subject: 'Mathematics',
      teacher: 'Mr. Ahmed',
      time: '14:00 - 15:00',
      location: 'Room C-201',
      status: 'upcoming'
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return COLORS.success;
      case 'ongoing': return COLORS.warning;
      case 'upcoming': return COLORS.primary;
      default: return COLORS.textSecondary;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'completed': return COLORS.lightGreen;
      case 'ongoing': return '#fef3c7';
      case 'upcoming': return COLORS.lightBlue;
      default: return `${COLORS.textSecondary}20`;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>📅 Today's Schedule</Text>
          <Text style={styles.subtitle}>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>

        {/* Prayer Time Reminder */}
        <View style={styles.prayerCard}>
          <Icon name="access-time" size={20} color={COLORS.gold} />
          <View style={styles.prayerInfo}>
            <Text style={styles.prayerTitle}>Next Prayer: Asr</Text>
            <Text style={styles.prayerTime}>in 2h 45m (3:30 PM)</Text>
          </View>
          <TouchableOpacity style={styles.prayerButton}>
            <Icon name="notifications" size={16} color={COLORS.gold} />
          </TouchableOpacity>
        </View>

        {/* Schedule Items */}
        {todaySchedule.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={[styles.scheduleCard, { backgroundColor: getStatusBg(item.status) }]}
          >
            <View style={styles.scheduleHeader}>
              <View style={styles.subjectInfo}>
                <Text style={styles.subjectName}>{item.subject}</Text>
                <Text style={styles.teacherName}>{item.teacher}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>
                  {item.status.toUpperCase()}
                </Text>
              </View>
            </View>
            
            <View style={styles.scheduleDetails}>
              <View style={styles.detailItem}>
                <Icon name="schedule" size={16} color={getStatusColor(item.status)} />
                <Text style={styles.detailText}>{item.time}</Text>
              </View>
              <View style={styles.detailItem}>
                <Icon name="location-on" size={16} color={getStatusColor(item.status)} />
                <Text style={styles.detailText}>{item.location}</Text>
              </View>
            </View>

            {item.status === 'ongoing' && (
              <TouchableOpacity style={styles.joinButton}>
                <Text style={styles.joinButtonText}>Join Class</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}

        {/* Weekly Overview */}
        <View style={styles.weeklyCard}>
          <Text style={styles.weeklyTitle}>📊 This Week</Text>
          <View style={styles.weeklyStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>18/20</Text>
              <Text style={styles.statLabel}>Classes Attended</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>94%</Text>
              <Text style={styles.statLabel}>Attendance Rate</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>2</Text>
              <Text style={styles.statLabel}>Upcoming Tests</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  prayerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.gold}15`,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  prayerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  prayerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  prayerTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  prayerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: `${COLORS.gold}20`,
  },
  scheduleCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  teacherName: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  scheduleDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  joinButton: {
    backgroundColor: COLORS.warning,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  weeklyCard: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 12,
    marginTop: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  weeklyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  weeklyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});