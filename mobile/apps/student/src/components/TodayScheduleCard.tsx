import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const COLORS = {
  primary: '#1d7452',
  secondary: '#2d9e6a',
  gold: '#f7c52d',
  white: '#ffffff',
  text: '#1a1a1a',
  textSecondary: '#64748b',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  lightBlue: '#dbeafe',
  lightGreen: '#dcfce7',
  lightOrange: '#fed7aa',
  lightPurple: '#f3e8ff',
};

interface ScheduleItem {
  id: string;
  subject: string;
  teacher: string;
  startTime: string;
  endTime: string;
  location: string;
  type: 'class' | 'exam' | 'activity';
  status: 'upcoming' | 'ongoing' | 'completed';
}

export default function TodayScheduleCard() {
  const todaySchedule: ScheduleItem[] = [
    {
      id: '1',
      subject: 'Arabic Grammar',
      teacher: 'Ustadh Omar',
      startTime: '09:00',
      endTime: '10:00',
      location: 'Room A-201',
      type: 'class',
      status: 'completed',
    },
    {
      id: '2',
      subject: 'Islamic Studies',
      teacher: 'Ustadh Yusuf',
      startTime: '10:15',
      endTime: '11:15',
      location: 'Room B-105',
      type: 'class',
      status: 'ongoing',
    },
    {
      id: '3',
      subject: 'English Literature',
      teacher: 'Ms. Sarah',
      startTime: '11:30',
      endTime: '12:30',
      location: 'Room A-301',
      type: 'class',
      status: 'upcoming',
    },
    {
      id: '4',
      subject: 'Mathematics Quiz',
      teacher: 'Mr. Ahmed',
      startTime: '14:00',
      endTime: '15:00',
      location: 'Room C-201',
      type: 'exam',
      status: 'upcoming',
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
      case 'ongoing': return COLORS.lightOrange;
      case 'upcoming': return COLORS.lightBlue;
      default: return `${COLORS.textSecondary}20`;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'class': return 'school';
      case 'exam': return 'quiz';
      case 'activity': return 'sports-soccer';
      default: return 'event';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'check-circle';
      case 'ongoing': return 'play-circle-filled';
      case 'upcoming': return 'schedule';
      default: return 'event';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Today's Schedule</Text>
          <Text style={styles.subtitle}>{new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          })}</Text>
        </View>
        <TouchableOpacity style={styles.calendarButton}>
          <Icon name="calendar-today" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scheduleList}
      >
        {todaySchedule.map((item, index) => (
          <TouchableOpacity 
            key={item.id} 
            style={[
              styles.scheduleItem,
              { backgroundColor: getStatusBg(item.status) }
            ]}
            activeOpacity={0.7}
          >
            {/* Status indicator */}
            <View style={styles.itemHeader}>
              <View style={[styles.typeIcon, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
                <Icon name={getTypeIcon(item.type)} size={16} color={getStatusColor(item.status)} />
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Icon name={getStatusIcon(item.status)} size={12} color={COLORS.white} />
              </View>
            </View>

            {/* Time */}
            <View style={styles.timeSection}>
              <Text style={[styles.startTime, { color: getStatusColor(item.status) }]}>
                {item.startTime}
              </Text>
              <Text style={styles.duration}>
                {item.endTime}
              </Text>
            </View>

            {/* Subject info */}
            <View style={styles.subjectSection}>
              <Text style={styles.subject} numberOfLines={2}>
                {item.subject}
              </Text>
              <Text style={styles.teacher} numberOfLines={1}>
                {item.teacher}
              </Text>
              <View style={styles.locationRow}>
                <Icon name="location-on" size={12} color={COLORS.textSecondary} />
                <Text style={styles.location}>{item.location}</Text>
              </View>
            </View>

            {/* Action button */}
            {item.status === 'ongoing' && (
              <TouchableOpacity style={styles.joinButton}>
                <Text style={styles.joinButtonText}>Join Now</Text>
              </TouchableOpacity>
            )}
            
            {item.status === 'upcoming' && (
              <TouchableOpacity style={styles.prepareButton}>
                <Text style={styles.prepareButtonText}>Prepare</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}

        {/* Add new schedule item */}
        <TouchableOpacity style={styles.addScheduleItem}>
          <Icon name="add" size={32} color={COLORS.textSecondary} />
          <Text style={styles.addText}>View Full Schedule</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Prayer time reminder */}
      <View style={styles.prayerReminder}>
        <Icon name="access-time" size={16} color={COLORS.primary} />
        <Text style={styles.prayerText}>
          Don't forget Dhuhr prayer at 12:45 PM
        </Text>
        <TouchableOpacity>
          <Icon name="notifications" size={16} color={COLORS.gold} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  calendarButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: `${COLORS.primary}10`,
  },
  scheduleList: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 16,
  },
  scheduleItem: {
    width: 160,
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    position: 'relative',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeSection: {
    marginBottom: 12,
  },
  startTime: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  duration: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  subjectSection: {
    marginBottom: 12,
  },
  subject: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
    lineHeight: 18,
  },
  teacher: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  joinButton: {
    backgroundColor: COLORS.warning,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  prepareButton: {
    backgroundColor: `${COLORS.primary}20`,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  prepareButtonText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  addScheduleItem: {
    width: 120,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: `${COLORS.textSecondary}30`,
    borderStyle: 'dashed',
  },
  addText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  prayerReminder: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}10`,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  prayerText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.primary,
    marginLeft: 8,
  },
});