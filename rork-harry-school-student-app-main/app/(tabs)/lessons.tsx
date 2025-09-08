import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, RefreshControl } from 'react-native';

import { BookOpen, Clock, Play, CheckCircle, Loader2, FileText } from 'lucide-react-native';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Colors from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/fonts';
import { useQuery } from '@tanstack/react-query';
import { useStudentLessons, Lesson, useStudentHometasks } from '@/lib/student';
import { useAuthStore } from '@/store/authStore';
import { router } from 'expo-router';
import { Hometask, StudentHometaskSubmission } from '@/lib/supabase';


type StudySection = 'lessons' | 'homework';

type HomeworkStatus = 'pending' | 'submitted' | 'graded' | 'overdue';

export default function LessonsScreen() {
  const [section, setSection] = useState<StudySection>('lessons');
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'in_progress'>('all');
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  const { data: lessons = [], isLoading: isLoadingLessons, error: lessonsError, refetch: refetchLessons } = useQuery(useStudentLessons(user?.id || '', filter));
  const { data: allHomework = [], isLoading: isLoadingHomework, refetch: refetchHomework } = useQuery(useStudentHometasks(user?.id || '', 'all'));
  const { data: pendingHomework = [] } = useQuery(useStudentHometasks(user?.id || '', 'pending'));
  const { data: completedHomework = [] } = useQuery(useStudentHometasks(user?.id || '', 'completed'));

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      if (section === 'lessons') {
        await refetchLessons();
      } else {
        await Promise.all([refetchHomework()]);
      }
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetchLessons, refetchHomework, section]);

  const handleStartLesson = (lesson: Lesson) => {
    console.log('Starting lesson:', lesson.title);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return Colors.success;
      case 'medium': return Colors.secondary;
      case 'hard': return Colors.error;
      default: return Colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} color={Colors.success} />;
      case 'in_progress': return <Play size={16} color={Colors.warning} />;
      case 'upcoming': return <Clock size={16} color={Colors.info} />;
      default: return <BookOpen size={16} color={Colors.textSecondary} />;
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return Colors.success;
      case 'in_progress': return Colors.warning;
      case 'upcoming': return Colors.info;
      default: return Colors.textSecondary;
    }
  };

  const LessonCard = ({ lesson }: { lesson: Lesson }) => (
    <Card style={styles.taskCard} testID={`lesson-${lesson.id}`}>
      <View style={styles.taskHeader}>
        <View style={styles.taskType}>
          {getStatusIcon(lesson.status)}
          <Text style={styles.taskTypeText}>{lesson.subject}</Text>
        </View>
        <View style={styles.taskMeta}>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(lesson.difficulty) }]}>
            <Text style={styles.difficultyText}>{lesson.difficulty}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(lesson.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(lesson.status) }]}> 
              {lesson.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.taskTitle}>{lesson.title}</Text>
      <Text style={styles.taskDescription}>{lesson.description}</Text>

      <View style={styles.taskFooter}>
        <View style={styles.taskInfo}>
          <Clock size={14} color={Colors.textSecondary} />
          <Text style={styles.timeText}>{lesson.duration} min</Text>
        </View>
        
        <Button
          title={lesson.status === 'completed' ? "Review" : "Start Lesson"}
          size="sm"
          onPress={() => handleStartLesson(lesson)}
          style={styles.startButton}
          variant={lesson.status === 'completed' ? 'outline' : 'primary'}
        />
      </View>
    </Card>
  );

  const getHomeworkStatus = (hw: Hometask & { submission?: StudentHometaskSubmission }): HomeworkStatus => {
    if (!hw.due_date) return 'pending';
    const dueDate = new Date(hw.due_date);
    const now = new Date();
    if (hw.submission?.is_completed) return 'graded';
    if (hw.submission && !hw.submission.is_completed) return 'submitted';
    if (dueDate < now) return 'overdue';
    return 'pending';
  };

  const getHomeworkStatusColor = (hw: Hometask & { submission?: StudentHometaskSubmission }) => {
    const status = getHomeworkStatus(hw);
    switch (status) {
      case 'pending':
        return Colors.warning;
      case 'submitted':
        return Colors.info;
      case 'graded':
        return Colors.success;
      case 'overdue':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const getHomeworkStatusIcon = (hw: Hometask & { submission?: StudentHometaskSubmission }) => {
    const status = getHomeworkStatus(hw);
    switch (status) {
      case 'pending':
        return <Clock size={16} color={Colors.warning} />;
      case 'submitted':
        return <CheckCircle size={16} color={Colors.info} />;
      case 'graded':
        return <CheckCircle size={16} color={Colors.success} />;
      case 'overdue':
        return <FileText size={16} color={Colors.error} />;
      default:
        return <FileText size={16} color={Colors.textSecondary} />;
    }
  };

  const formatDue = (dateString?: string | null) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays > 0) return `Due in ${diffDays} days`;
    if (diffDays === -1) return 'Due yesterday';
    return `${Math.abs(diffDays)} days overdue`;
  };

  const upcomingHomework = useMemo(() => pendingHomework.filter((hw: Hometask & { submission?: StudentHometaskSubmission }) => {
    if (!hw.due_date) return false;
    const dueDate = new Date(hw.due_date);
    return dueDate > new Date();
  }), [pendingHomework]);

  const pastHomework = completedHomework;

  const handleHomeworkPress = (homework: Hometask & { submission?: StudentHometaskSubmission }) => {
    router.push(`/homework/${homework.id}`);
  };

  const HomeworkCard = ({ homework }: { homework: Hometask & { submission?: StudentHometaskSubmission } }) => (
    <TouchableOpacity onPress={() => handleHomeworkPress(homework)} testID={`homework-card-${homework.id}`}>
      <Card style={styles.homeworkCard}>
        <View style={styles.cardHeader}> 
          <View style={styles.titleRow}>
            <Text style={styles.homeworkTitle} numberOfLines={2}>{homework.title}</Text>
            <View style={[styles.priorityBadge, { backgroundColor: (Colors.primary + '15') }]}>
              <Text style={[styles.priorityText, { color: Colors.primary }]}>{String(homework.difficulty || 'normal').toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.subjectRow}>
            <Text style={styles.subject}>{homework.type}</Text>
            <View style={styles.statusBadge}>
              {getHomeworkStatusIcon(homework)}
              <Text style={[styles.statusText, { color: getHomeworkStatusColor(homework) }]}>
                {getHomeworkStatus(homework).charAt(0).toUpperCase() + getHomeworkStatus(homework).slice(1)}
              </Text>
            </View>
          </View>
        </View>
        <Text style={styles.description} numberOfLines={2}>{homework.description}</Text>
        <View style={styles.cardFooter}>
          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <Clock size={14} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{formatDue(homework.due_date || undefined)}</Text>
            </View>
          </View>
          {homework.submission?.score !== undefined && (
            <View style={styles.gradeContainer}>
              <Text style={styles.gradeText}>{homework.submission.score}/{homework.submission.max_score}</Text>
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );

  const isLoading = section === 'lessons' ? isLoadingLessons : isLoadingHomework;
  const hasError = section === 'lessons' ? Boolean(lessonsError) : false;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Study</Text>
        <Text style={styles.subtitle}>Lessons and homework in one place</Text>
      </View>

      <View style={styles.segmented}>
        {(['lessons', 'homework'] as const).map((s) => (
          <TouchableOpacity key={s} onPress={() => setSection(s)} style={[styles.segment, section === s && styles.segmentActive]} testID={`segment-${s}`}>
            <Text style={[styles.segmentText, section === s && styles.segmentTextActive]}>{s.charAt(0).toUpperCase() + s.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {section === 'lessons' && (
        <View style={styles.filterContainer}>
          {(['all', 'upcoming', 'in_progress', 'completed'] as const).map((filterType) => (
            <TouchableOpacity
              key={filterType}
              style={[styles.filterButton, filter === filterType && styles.filterButtonActive]}
              onPress={() => setFilter(filterType)}
            >
              <Text style={[styles.filterText, filter === filterType && styles.filterTextActive]}>
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Loader2 size={32} color={Colors.primary} />
              <Text style={styles.loadingText}>Loading {section}...</Text>
            </View>
          ) : hasError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Failed to load {section}</Text>
              <Button title="Retry" onPress={onRefresh} style={styles.retryButton} />
            </View>
          ) : section === 'lessons' ? (
            lessons.length === 0 ? (
              <View style={styles.emptyContainer}>
                <BookOpen size={48} color={Colors.textSecondary} />
                <Text style={styles.emptyTitle}>No {filter} lessons</Text>
                <Text style={styles.emptyText}>
                  {filter === 'all' ? 'No lessons available at the moment.' : `No ${filter.replace('_', ' ')} lessons found.`}
                </Text>
              </View>
            ) : (
              lessons.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} />)
            )
          ) : (
            (() => {
              const list = upcomingHomework.length ? upcomingHomework : pastHomework;
              if (!list.length) {
                return (
                  <View style={styles.emptyContainer}>
                    <FileText size={48} color={Colors.textSecondary} />
                    <Text style={styles.emptyTitle}>No homework</Text>
                    <Text style={styles.emptyText}>You're all caught up!</Text>
                  </View>
                );
              }
              return (
                <View style={styles.homeworkList}>
                  {list.map((hw) => (
                    <HomeworkCard key={hw.id} homework={hw as Hometask & { submission?: StudentHometaskSubmission }} />
                  ))}
                </View>
              );
            })()
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: Colors.primary,
  },
  segmentText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.textSecondary,
  },
  segmentTextActive: {
    color: '#fff',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 100,
  },
  taskCard: {
    padding: 16,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskTypeText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    color: Colors.textSecondary,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  difficultyText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    color: '#ffffff',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
  },
  taskTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    marginBottom: 8,
  },
  taskDescription: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },

  startButton: {
    paddingHorizontal: 20,
  },
  homeworkList: {
    gap: 16,
  },
  homeworkCard: {
    padding: 16,
  },
  cardHeader: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  homeworkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: 12,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  subjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subject: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaInfo: {
    flexDirection: 'row',
    gap: 16,
    flex: 1,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  gradeContainer: {
    backgroundColor: Colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gradeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.success,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    fontWeight: FontWeights.medium,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  errorText: {
    fontSize: FontSizes.lg,
    color: Colors.error,
    fontWeight: FontWeights.semibold,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
});