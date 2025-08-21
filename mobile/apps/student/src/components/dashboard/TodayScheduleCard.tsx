/**
 * Today Schedule Card Component
 * Harry School Student Mobile App
 * 
 * Displays today's schedule with current/next class and upcoming events
 * Age-adaptive presentation with time management features
 */

import React, { useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ViewStyle,
} from 'react-native';
import { Card, Badge, ProgressBar } from '@harry-school/ui';
import type { StudentAgeGroup } from '../../navigation/types';
import type { ScheduleData } from '../../hooks/useDashboardData';
import { theme } from '@harry-school/ui/theme';

interface TodayScheduleCardProps {
  ageGroup: StudentAgeGroup;
  data?: ScheduleData;
  onPress?: () => void;
  onClassPress?: (classId: string) => void;
  style?: ViewStyle;
  testID?: string;
}

export const TodayScheduleCard: React.FC<TodayScheduleCardProps> = ({
  ageGroup,
  data,
  onPress,
  onClassPress,
  style,
  testID,
}) => {
  // Current time state for real-time updates
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Age-specific configuration
  const config = useMemo(() => {
    const isElementary = ageGroup === '10-12';
    
    return {
      visualTimeline: isElementary,
      largeTimeDisplay: isElementary,
      iconHeavy: isElementary,
      completionRewards: isElementary,
      multiDayView: !isElementary,
      conflictDetection: !isElementary,
      integrationOptions: !isElementary,
      productivityInsights: !isElementary,
      textScale: isElementary ? 1.1 : 1.0,
      colorSaturation: isElementary ? 'high' : 'standard',
    };
  }, [ageGroup]);

  // Mock data for development
  const scheduleData: ScheduleData = data || {
    currentClass: {
      id: 'class-1',
      name: 'English Literature',
      teacher: 'Ms. Johnson',
      startTime: new Date(currentTime.getTime() - 30 * 60 * 1000), // 30 min ago
      endTime: new Date(currentTime.getTime() + 30 * 60 * 1000), // 30 min from now
      room: 'Room 205',
      subject: 'English',
    },
    nextClass: {
      id: 'class-2',
      name: 'Mathematics',
      teacher: 'Mr. Davis',
      startTime: new Date(currentTime.getTime() + 45 * 60 * 1000), // 45 min from now
      endTime: new Date(currentTime.getTime() + 105 * 60 * 1000), // 1h 45m from now
      room: 'Room 101',
      subject: 'Math',
    },
    upcomingEvents: [
      {
        id: 'event-1',
        title: 'Math Quiz',
        type: 'exam',
        dueDate: new Date(currentTime.getTime() + 2 * 24 * 60 * 60 * 1000),
        subject: 'Math',
        priority: 'high',
      },
      {
        id: 'event-2',
        title: 'Essay Submission',
        type: 'assignment',
        dueDate: new Date(currentTime.getTime() + 3 * 24 * 60 * 60 * 1000),
        subject: 'English',
        priority: 'medium',
      },
    ],
    completedToday: 3,
    totalToday: 6,
  };

  // Format time display
  const formatTime = (date: Date, detailed = false) => {
    if (config.largeTimeDisplay && !detailed) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else {
      return date.toLocaleTimeString('en-US', {
        hour: detailed ? '2-digit' : 'numeric',
        minute: '2-digit',
        hour12: !detailed,
      });
    }
  };

  // Calculate time until class
  const getTimeUntil = (date: Date) => {
    const diff = date.getTime() - currentTime.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 60) {
      return `in ${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMin = minutes % 60;
      return `in ${hours}h ${remainingMin}m`;
    }
  };

  // Get subject color
  const getSubjectColor = (subject: string) => {
    const colors = theme.colors.educational.subjects;
    return colors[subject.toLowerCase() as keyof typeof colors] || colors.english;
  };

  // Current class progress
  const currentClassProgress = useMemo(() => {
    if (!scheduleData.currentClass) return null;
    
    const { startTime, endTime } = scheduleData.currentClass;
    const total = endTime.getTime() - startTime.getTime();
    const elapsed = currentTime.getTime() - startTime.getTime();
    const progress = Math.max(0, Math.min(100, (elapsed / total) * 100));
    
    return {
      progress,
      remaining: Math.max(0, Math.floor((endTime.getTime() - currentTime.getTime()) / (1000 * 60))),
    };
  }, [scheduleData.currentClass, currentTime]);

  // Daily completion progress
  const dailyProgress = useMemo(() => {
    if (scheduleData.totalToday === 0) return 0;
    return (scheduleData.completedToday / scheduleData.totalToday) * 100;
  }, [scheduleData.completedToday, scheduleData.totalToday]);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Today's schedule. ${scheduleData.completedToday} of ${scheduleData.totalToday} classes completed.`}
      accessibilityHint="Tap to view full schedule"
      testID={testID}
    >
      <Card
        variant="interactive"
        size="expanded"
        style={[styles.card, style]}
      >
        {/* Header with Time and Progress */}
        <View style={styles.header}>
          <View style={styles.timeContainer}>
            <Text style={[
              styles.currentTime,
              { fontSize: config.textScale * (config.largeTimeDisplay ? 28 : 24) }
            ]}>
              {formatTime(currentTime)}
            </Text>
            <Text style={styles.dateText}>
              {currentTime.toLocaleDateString('en-US', { 
                weekday: 'long',
                month: 'short',
                day: 'numeric'
              })}
            </Text>
          </View>

          {/* Daily Progress */}
          <View style={styles.progressContainer}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>
                {scheduleData.completedToday}/{scheduleData.totalToday} classes
              </Text>
              {config.completionRewards && dailyProgress >= 50 && (
                <Text style={styles.rewardEmoji}>
                  {dailyProgress >= 100 ? '🎉' : dailyProgress >= 75 ? '⭐' : '💪'}
                </Text>
              )}
            </View>
            <ProgressBar
              progress={dailyProgress}
              color={theme.colors.educational.performance.excellent}
              height={6}
              style={styles.progressBar}
            />
          </View>
        </View>

        {/* Current Class */}
        {scheduleData.currentClass && currentClassProgress && (
          <View style={styles.currentClassSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Now</Text>
              <Badge
                type="status"
                variant="success"
                text={`${currentClassProgress.remaining}m left`}
              />
            </View>
            
            <TouchableOpacity
              style={[
                styles.classCard,
                { borderLeftColor: getSubjectColor(scheduleData.currentClass.subject) }
              ]}
              onPress={() => onClassPress?.(scheduleData.currentClass!.id)}
            >
              <View style={styles.classHeader}>
                <View style={styles.classInfo}>
                  <Text style={[
                    styles.className,
                    { fontSize: config.textScale * 16 }
                  ]}>
                    {scheduleData.currentClass.name}
                  </Text>
                  <Text style={styles.classTeacher}>
                    {scheduleData.currentClass.teacher} • {scheduleData.currentClass.room}
                  </Text>
                </View>
                {config.iconHeavy && (
                  <Text style={styles.subjectIcon}>
                    {scheduleData.currentClass.subject === 'English' ? '📚' :
                     scheduleData.currentClass.subject === 'Math' ? '🔢' :
                     scheduleData.currentClass.subject === 'Science' ? '🔬' : '📖'}
                  </Text>
                )}
              </View>
              
              <View style={styles.classTime}>
                <Text style={styles.timeText}>
                  {formatTime(scheduleData.currentClass.startTime)} - {formatTime(scheduleData.currentClass.endTime)}
                </Text>
                <ProgressBar
                  progress={currentClassProgress.progress}
                  color={getSubjectColor(scheduleData.currentClass.subject)}
                  height={4}
                  style={styles.classProgress}
                />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Next Class */}
        {scheduleData.nextClass && (
          <View style={styles.nextClassSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Up Next</Text>
              <Text style={styles.timeUntil}>
                {getTimeUntil(scheduleData.nextClass.startTime)}
              </Text>
            </View>
            
            <TouchableOpacity
              style={[
                styles.classCard,
                styles.nextClassCard,
                { borderLeftColor: getSubjectColor(scheduleData.nextClass.subject) }
              ]}
              onPress={() => onClassPress?.(scheduleData.nextClass!.id)}
            >
              <View style={styles.classHeader}>
                <View style={styles.classInfo}>
                  <Text style={[
                    styles.className,
                    { fontSize: config.textScale * 16 }
                  ]}>
                    {scheduleData.nextClass.name}
                  </Text>
                  <Text style={styles.classTeacher}>
                    {scheduleData.nextClass.teacher} • {scheduleData.nextClass.room}
                  </Text>
                </View>
                {config.iconHeavy && (
                  <Text style={styles.subjectIcon}>
                    {scheduleData.nextClass.subject === 'English' ? '📚' :
                     scheduleData.nextClass.subject === 'Math' ? '🔢' :
                     scheduleData.nextClass.subject === 'Science' ? '🔬' : '📖'}
                  </Text>
                )}
              </View>
              
              <Text style={styles.timeText}>
                {formatTime(scheduleData.nextClass.startTime)} - {formatTime(scheduleData.nextClass.endTime)}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Upcoming Events */}
        {scheduleData.upcomingEvents.length > 0 && (
          <View style={styles.eventsSection}>
            <Text style={styles.sectionTitle}>Upcoming</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.eventsScroll}
            >
              {scheduleData.upcomingEvents.slice(0, 3).map((event) => (
                <View
                  key={event.id}
                  style={[
                    styles.eventCard,
                    { borderColor: event.priority === 'high' 
                      ? theme.colors.semantic.error.light 
                      : theme.colors.border.primary 
                    }
                  ]}
                >
                  <View style={styles.eventHeader}>
                    <Text style={styles.eventType}>
                      {event.type === 'exam' ? '📝' :
                       event.type === 'assignment' ? '📋' : '📅'}
                    </Text>
                    {event.priority === 'high' && (
                      <Badge
                        type="status"
                        variant="error"
                        text="!"
                        style={styles.priorityBadge}
                      />
                    )}
                  </View>
                  
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventSubject}>{event.subject}</Text>
                  <Text style={styles.eventDue}>
                    Due {event.dueDate.toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Empty State */}
        {!scheduleData.currentClass && !scheduleData.nextClass && scheduleData.upcomingEvents.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📅</Text>
            <Text style={styles.emptyText}>
              {config.iconHeavy ? "All done for today! 🎉" : "No more classes today"}
            </Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: theme.spacing.lg,
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  
  timeContainer: {
    flex: 1,
  },
  
  currentTime: {
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  
  dateText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  
  progressContainer: {
    alignItems: 'flex-end',
    minWidth: 100,
  },
  
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  
  progressText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginRight: theme.spacing.xs,
  },
  
  rewardEmoji: {
    fontSize: 14,
  },
  
  progressBar: {
    width: 80,
  },
  
  currentClassSection: {
    marginBottom: theme.spacing.lg,
  },
  
  nextClassSection: {
    marginBottom: theme.spacing.lg,
  },
  
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  
  timeUntil: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  
  classCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 12,
    padding: theme.spacing.md,
    borderLeftWidth: 4,
  },
  
  nextClassCard: {
    backgroundColor: theme.colors.background.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  
  classInfo: {
    flex: 1,
  },
  
  className: {
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  
  classTeacher: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  
  subjectIcon: {
    fontSize: 24,
    marginLeft: theme.spacing.sm,
  },
  
  classTime: {
    marginTop: theme.spacing.xs,
  },
  
  timeText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  
  classProgress: {
    height: 3,
  },
  
  eventsSection: {
    marginBottom: theme.spacing.md,
  },
  
  eventsScroll: {
    marginTop: theme.spacing.sm,
  },
  
  eventCard: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: 8,
    padding: theme.spacing.sm,
    borderWidth: 1,
    marginRight: theme.spacing.sm,
    width: 120,
  },
  
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  
  eventType: {
    fontSize: 16,
  },
  
  priorityBadge: {
    minWidth: 16,
    minHeight: 16,
  },
  
  eventTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  
  eventSubject: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  
  eventDue: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
  },
  
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  
  emptyEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.sm,
  },
  
  emptyText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});

export default TodayScheduleCard;