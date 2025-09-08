import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { Stack } from 'expo-router';
import Colors from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/fonts';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { CalendarDays, CheckCircle2, XCircle, MinusCircle, ChevronLeft, ChevronRight } from 'lucide-react-native';

interface AttendanceEntry {
  id: string;
  date: string;
  subject: string;
  status: 'present' | 'absent' | 'late';
  starts_at: string;
  ends_at: string;
  teacher?: string;
  location?: string;
}

function formatDateLabel(date: Date) {
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function addDays(d: Date, days: number) {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + days);
  return nd;
}

export default function AttendanceScreen() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const weekDays = useMemo(() => {
    const start = new Date(selectedDate);
    const day = start.getDay();
    const diff = (day === 0 ? -6 : 1 - day); // start week on Monday
    const monday = addDays(start, diff);
    return new Array(7).fill(0).map((_, i) => addDays(monday, i));
  }, [selectedDate]);

  const mockAttendance: AttendanceEntry[] = useMemo(() => {
    const dayKey = selectedDate.toISOString().slice(0, 10);
    return [
      { id: '1-' + dayKey, date: dayKey, subject: 'English Grammar', status: 'present', starts_at: '09:00', ends_at: '10:30', teacher: 'Ms. Johnson', location: 'Room 201' },
      { id: '2-' + dayKey, date: dayKey, subject: 'Mathematics', status: 'late', starts_at: '11:00', ends_at: '12:00', teacher: 'Mr. Smith', location: 'Room 104' },
      { id: '3-' + dayKey, date: dayKey, subject: 'Science', status: 'absent', starts_at: '14:00', ends_at: '15:00', teacher: 'Dr. Brown', location: 'Lab 1' },
    ];
  }, [selectedDate]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
    } finally {
      setRefreshing(false);
    }
  }, []);

  const getStatusMeta = (status: AttendanceEntry['status']) => {
    switch (status) {
      case 'present':
        return { color: Colors.success, icon: <CheckCircle2 size={16} color={Colors.success} /> };
      case 'late':
        return { color: Colors.warning, icon: <MinusCircle size={16} color={Colors.warning} /> };
      default:
        return { color: Colors.error, icon: <XCircle size={16} color={Colors.error} /> };
    }
  };

  const changeDay = (delta: number) => setSelectedDate((d) => addDays(d, delta));

  const presentCount = mockAttendance.filter(a => a.status === 'present').length;
  const lateCount = mockAttendance.filter(a => a.status === 'late').length;
  const absentCount = mockAttendance.filter(a => a.status === 'absent').length;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Attendance & Schedule', headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.text }} />

      <ScrollView style={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.content}>
          <Card style={styles.headerCard} testID="attendance-header">
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <CalendarDays size={20} color={Colors.primary} />
                <Text style={styles.headerTitle}>This Week</Text>
              </View>
              <View style={styles.headerRight}>
                <TouchableOpacity onPress={() => changeDay(-1)} style={styles.navBtn}>
                  <ChevronLeft size={18} color={Colors.text} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setSelectedDate(new Date())} style={styles.todayBtn}>
                  <Text style={styles.todayText}>Today</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => changeDay(1)} style={styles.navBtn}>
                  <ChevronRight size={18} color={Colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekStrip}>
              {weekDays.map((d) => {
                const isSelected = d.toDateString() === selectedDate.toDateString();
                return (
                  <TouchableOpacity key={d.toISOString()} onPress={() => setSelectedDate(d)} style={[styles.dayPill, isSelected && styles.dayPillActive]} testID={`day-${d.getDate()}`}>
                    <Text style={[styles.dayPillText, isSelected && styles.dayPillTextActive]}>{formatDateLabel(d)}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Card>

          <Card style={styles.summaryCard} testID="attendance-summary">
            <View style={styles.summaryRow}>
              <View style={[styles.summaryPill, { backgroundColor: Colors.success + '18' }]}>
                <CheckCircle2 size={18} color={Colors.success} />
                <Text style={[styles.summaryText, { color: Colors.success }]}>Present {presentCount}</Text>
              </View>
              <View style={[styles.summaryPill, { backgroundColor: Colors.warning + '18' }]}>
                <MinusCircle size={18} color={Colors.warning} />
                <Text style={[styles.summaryText, { color: Colors.warning }]}>Late {lateCount}</Text>
              </View>
              <View style={[styles.summaryPill, { backgroundColor: Colors.error + '18' }]}>
                <XCircle size={18} color={Colors.error} />
                <Text style={[styles.summaryText, { color: Colors.error }]}>Absent {absentCount}</Text>
              </View>
            </View>
          </Card>

          <View style={styles.list}>
            {mockAttendance.map((a) => {
              const meta = getStatusMeta(a.status);
              return (
                <Card key={a.id} style={styles.item} testID={`attendance-${a.id}`}>
                  <View style={styles.itemHeader}>
                    <View style={[styles.statusDot, { backgroundColor: meta.color }]} />
                    <Text style={styles.itemTime}>{a.starts_at} - {a.ends_at}</Text>
                  </View>

                  <Text style={styles.itemTitle}>{a.subject}</Text>
                  <Text style={styles.itemSub}>{a.teacher} • {a.location}</Text>

                  <View style={styles.itemFooter}>
                    <View style={[styles.statusBadge, { backgroundColor: (meta.color + '22') as string }]}>
                      {meta.icon}
                      <Text style={[styles.statusText, { color: meta.color }]}>{a.status.toUpperCase()}</Text>
                    </View>
                    <Button title="Details" onPress={() => console.log('Open details', a.id)} />
                  </View>
                </Card>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 16, paddingBottom: 100 },
  headerCard: { padding: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.text },
  navBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  todayBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, backgroundColor: Colors.primary },
  todayText: { color: '#fff', fontSize: FontSizes.sm, fontWeight: FontWeights.semibold },
  weekStrip: { gap: 8, paddingTop: 12 },
  dayPill: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border },
  dayPillActive: { backgroundColor: Colors.primary },
  dayPillText: { color: Colors.text, fontSize: FontSizes.sm, fontWeight: FontWeights.medium },
  dayPillTextActive: { color: '#fff' },
  summaryCard: { padding: 12 },
  summaryRow: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  summaryPill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },
  summaryText: { fontSize: FontSizes.sm, fontWeight: FontWeights.semibold },
  list: { gap: 12 },
  item: { padding: 16 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  itemTime: { fontSize: FontSizes.xs, color: Colors.textSecondary, fontWeight: FontWeights.medium },
  itemTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.text },
  itemSub: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
  itemFooter: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: FontSizes.xs, fontWeight: FontWeights.semibold },
});
