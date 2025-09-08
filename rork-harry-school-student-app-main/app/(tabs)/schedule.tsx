import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, CalendarDays, CheckCircle2, XCircle, Clock, MapPin, User, ChevronRight, Loader2, Filter } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/fonts';
import Card from '@/components/ui/Card';
import { useStudent } from '@/providers/StudentProvider';

interface DaySection {
  key: string;
  label: string;
  date: Date;
}

interface AttendanceRecord {
  id: string;
  date: string;
  subject: string;
  teacher: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  note?: string;
}

const mockAttendance: AttendanceRecord[] = Array.from({ length: 24 }).map((_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - i);
  const statuses = ['present', 'absent', 'late', 'excused'] as const;
  const status = statuses[(i * 7) % statuses.length];
  return {
    id: `att-${i + 1}`,
    date: d.toISOString(),
    subject: ['English', 'Math', 'History', 'Science'][i % 4],
    teacher: ['Ms. Johnson', 'Mr. Smith', 'Mrs. Lee', 'Mr. Brown'][i % 4],
    status,
    note: status !== 'present' ? 'Parent informed' : undefined,
  };
});

export default function ScheduleAttendanceScreen() {
  const { todaySchedule, isLoadingSchedule, scheduleError, refreshData } = useStudent();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [mode, setMode] = useState<'schedule' | 'attendance'>('schedule');
  const [filter, setFilter] = useState<'all' | 'present' | 'absent' | 'late' | 'excused'>('all');

  const weekDays: DaySection[] = useMemo(() => {
    const start = new Date();
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(start.setDate(diff));
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      const key = d.toISOString().slice(0, 10);
      return { key, label, date: d };
    });
  }, []);

  const [selectedDay, setSelectedDay] = useState<string>(() => weekDays.find(w => w.date.toDateString() === new Date().toDateString())?.key || weekDays[0]?.key || '');

  const itemsByDay = useMemo(() => {
    const map: Record<string, typeof todaySchedule> = {};
    weekDays.forEach((d) => { map[d.key] = []; });
    (todaySchedule ?? []).forEach((it) => {
      const key = new Date(it.start_time).toISOString().slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(it);
    });
    return map;
  }, [todaySchedule, weekDays]);

  const filteredAttendance = useMemo(() => {
    const byDay = mockAttendance.filter((r) => r.date.slice(0, 10) === selectedDay);
    if (filter === 'all') return byDay;
    return byDay.filter((r) => r.status === filter);
  }, [filter, selectedDay]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshData(),
        new Promise((r) => setTimeout(r, 400)),
      ]);
    } catch (e) {
      console.log('[ScheduleAttendance] refresh error', e);
    } finally {
      setRefreshing(false);
    }
  }, [refreshData]);

  const formatTimeRange = (startISO: string, endISO: string) => {
    const start = new Date(startISO);
    const end = new Date(endISO);
    const f = (d: Date) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${f(start)} - ${f(end)}`;
  };

  const getStatusMeta = (s: AttendanceRecord['status']) => {
    switch (s) {
      case 'present':
        return { color: Colors.success, label: 'Present', icon: <CheckCircle2 size={16} color={Colors.success} /> } as const;
      case 'absent':
        return { color: Colors.error, label: 'Absent', icon: <XCircle size={16} color={Colors.error} /> } as const;
      case 'late':
        return { color: Colors.secondary, label: 'Late', icon: <Clock size={16} color={Colors.secondary} /> } as const;
      case 'excused':
        return { color: Colors.info, label: 'Excused', icon: <CalendarDays size={16} color={Colors.info} /> } as const;
      default:
        return { color: Colors.textSecondary, label: 'Unknown', icon: null } as const;
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      <View style={styles.header}>
        <Text style={styles.title}>Schedule & Attendance</Text>
        <View style={styles.modeSwitch}>
          {(['schedule', 'attendance'] as const).map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setMode(m)}
              style={[styles.switchPill, mode === m && styles.switchPillActive]}
              testID={`mode-${m}`}
            >
              <Text style={[styles.switchText, mode === m && styles.switchTextActive]}>
                {m === 'schedule' ? 'Schedule' : 'Attendance'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        testID="schedule-attendance-scroll"
      >
        <View style={styles.content}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayStripContent}>
            {weekDays.map((d) => {
              const active = selectedDay === d.key;
              return (
                <TouchableOpacity key={d.key} onPress={() => setSelectedDay(d.key)} style={[styles.dayPill, active && styles.dayPillActive]} testID={`day-${d.key}`}>
                  <Text style={[styles.dayPillLabel, active && styles.dayPillLabelActive]}>{d.label}</Text>
                  <Text style={[styles.dayPillDate, active && styles.dayPillLabelActive]}>{d.date.getDate()}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {mode === 'schedule' ? (
            <View style={styles.section}>
              {isLoadingSchedule ? (
                <View style={styles.loadingContainer}>
                  <Loader2 size={32} color={Colors.primary} />
                  <Text style={styles.loadingText}>Loading schedule...</Text>
                </View>
              ) : scheduleError ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>Failed to load schedule</Text>
                </View>
              ) : (
                (itemsByDay[selectedDay] || []).length === 0 ? (
                  <Card style={styles.emptyCard}><Text style={styles.emptyText}>No classes</Text></Card>
                ) : (
                  (itemsByDay[selectedDay] || []).map((it) => (
                    <Card key={it.id} style={styles.itemCard} testID={`schedule-item-${it.id}`}>
                      <TouchableOpacity style={styles.itemRow} onPress={() => console.log('open schedule item', it.id)}>
                        <View style={styles.itemLeft}>
                          <View style={styles.itemIcon}>
                            <Clock size={16} color={Colors.primary} />
                          </View>
                          <View style={styles.itemInfo}>
                            <Text style={styles.itemTitle}>{it.title}</Text>
                            <View style={styles.itemMetaRow}>
                              <Clock size={12} color={Colors.textSecondary} />
                              <Text style={styles.itemMetaText}>{formatTimeRange(it.start_time, it.end_time)}</Text>
                            </View>
                            <View style={styles.itemMetaRow}>
                              <User size={12} color={Colors.textSecondary} />
                              <Text style={styles.itemMetaText}>{it.teacher || 'Teacher'}</Text>
                            </View>
                            <View style={styles.itemMetaRow}>
                              <MapPin size={12} color={Colors.textSecondary} />
                              <Text style={styles.itemMetaText}>{it.location || 'Online'}</Text>
                            </View>
                          </View>
                        </View>
                        <ChevronRight size={18} color={Colors.textSecondary} />
                      </TouchableOpacity>
                    </Card>
                  ))
                )
              )}
            </View>
          ) : (
            <View style={styles.section}>
              <View style={styles.filtersRow}>
                {(['all', 'present', 'absent', 'late', 'excused'] as const).map((f) => (
                  <TouchableOpacity
                    key={f}
                    onPress={() => setFilter(f)}
                    style={[styles.filterPill, filter === f && styles.filterPillActive]}
                    testID={`att-filter-${f}`}
                  >
                    <Filter size={14} color={filter === f ? '#fff' : Colors.textSecondary} />
                    <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f[0].toUpperCase() + f.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {!filteredAttendance.length ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No attendance records</Text>
                </View>
              ) : (
                filteredAttendance.map((rec) => {
                  const meta = getStatusMeta(rec.status);
                  return (
                    <Card key={rec.id} style={styles.itemCard} testID={`attendance-${rec.id}`}>
                      <View style={styles.itemRow}>
                        <View style={styles.itemLeft}>
                          <View style={[styles.badge, { backgroundColor: meta.color + '22' }]}>
                            {meta.icon}
                          </View>
                          <View style={styles.itemInfo}>
                            <Text style={styles.itemTitle}>{rec.subject}</Text>
                            <View style={styles.itemMetaRow}>
                              <CalendarDays size={12} color={Colors.textSecondary} />
                              <Text style={styles.itemMetaText}>{new Date(rec.date).toLocaleDateString()}</Text>
                              <Text style={styles.dot}>•</Text>
                              <Text style={[styles.itemMetaText, { color: meta.color }]}>{meta.label}</Text>
                            </View>
                            <Text style={styles.itemMetaText}>with {rec.teacher}</Text>
                            {rec.note ? <Text style={[styles.itemMetaText, { color: Colors.info }]}>{rec.note}</Text> : null}
                          </View>
                        </View>
                      </View>
                    </Card>
                  );
                })
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold, color: Colors.text },
  modeSwitch: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  switchPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  switchPillActive: { backgroundColor: Colors.primary },
  switchText: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontWeight: FontWeights.medium },
  switchTextActive: { color: '#fff' },

  scrollView: { flex: 1 },
  content: { padding: 20, gap: 16, paddingBottom: 120 },
  dayStripContent: { paddingHorizontal: 4, gap: 8 },
  dayPill: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  dayPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dayPillLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary },
  dayPillDate: { fontSize: FontSizes.sm, color: Colors.text, fontWeight: FontWeights.semibold },
  dayPillLabelActive: { color: '#fff' },

  loadingContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  loadingText: { fontSize: FontSizes.base, color: Colors.textSecondary, fontWeight: FontWeights.medium },
  errorContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  errorText: { color: Colors.error, fontSize: FontSizes.lg, fontWeight: FontWeights.semibold },

  section: { gap: 12 },
  emptyCard: { padding: 16, alignItems: 'center' },
  emptyText: { color: Colors.textSecondary, fontSize: FontSizes.sm },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 36, gap: 8 },

  itemCard: { padding: 0 },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  itemLeft: { flexDirection: 'row', gap: 12, flex: 1, alignItems: 'flex-start' },
  itemIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  badge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  itemInfo: { flex: 1, gap: 4 },
  itemTitle: { fontSize: FontSizes.base, fontWeight: FontWeights.semibold, color: Colors.text },
  itemMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemMetaText: { fontSize: FontSizes.xs, color: Colors.textSecondary },
  dot: { color: Colors.textSecondary },

  filtersRow: { flexDirection: 'row', gap: 8 },
  filterPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.surface, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  filterPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontWeight: FontWeights.medium },
  filterTextActive: { color: '#fff' },
});