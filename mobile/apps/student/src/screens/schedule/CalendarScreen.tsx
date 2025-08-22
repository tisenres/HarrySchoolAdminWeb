import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/design';

interface ScheduleEvent {
  id: string;
  title: string;
  time: string;
  type: 'class' | 'exam' | 'homework';
  status: 'upcoming' | 'in_progress' | 'completed';
}

const mockEvents: ScheduleEvent[] = [
  { id: '1', title: 'English Grammar', time: '9:00 AM', type: 'class', status: 'completed' },
  { id: '2', title: 'Math Quiz', time: '11:00 AM', type: 'exam', status: 'upcoming' },
  { id: '3', title: 'History Essay', time: '2:00 PM', type: 'homework', status: 'upcoming' },
  { id: '4', title: 'Science Lab', time: '4:00 PM', type: 'class', status: 'upcoming' },
];

export default function CalendarScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Today's Schedule</Text>
        <Text style={styles.subtitle}>Wednesday, March 15, 2024</Text>
        
        {mockEvents.map((event) => (
          <TouchableOpacity key={event.id} style={styles.eventCard}>
            <View style={styles.eventTime}>
              <Text style={styles.timeText}>{event.time}</Text>
            </View>
            <View style={styles.eventContent}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventType}>{event.type}</Text>
            </View>
            <View style={[styles.statusIndicator, 
              { backgroundColor: event.status === 'completed' ? COLORS.success : 
                               event.status === 'in_progress' ? COLORS.warning : COLORS.primary }
            ]} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.xl },
  title: { fontSize: TYPOGRAPHY['3xl'], fontWeight: TYPOGRAPHY.bold, color: COLORS.text, marginBottom: SPACING.sm },
  subtitle: { fontSize: TYPOGRAPHY.lg, color: COLORS.textSecondary, marginBottom: SPACING['2xl'] },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.base,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.base,
    ...SHADOWS.sm,
  },
  eventTime: { minWidth: 80, marginRight: SPACING.base },
  timeText: { fontSize: TYPOGRAPHY.base, fontWeight: TYPOGRAPHY.semiBold, color: COLORS.primary },
  eventContent: { flex: 1 },
  eventTitle: { fontSize: TYPOGRAPHY.base, fontWeight: TYPOGRAPHY.semiBold, color: COLORS.text, marginBottom: SPACING.xs },
  eventType: { fontSize: TYPOGRAPHY.sm, color: COLORS.textSecondary, textTransform: 'capitalize' },
  statusIndicator: { width: 12, height: 12, borderRadius: 6 },
});