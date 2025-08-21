/**
 * LessonsListScreen.tsx
 * Main entry point for Home Tasks with age-adaptive filtering and AI recommendations
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  StyleSheet,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Component imports
import { Header, Card, Badge, LoadingSpinner } from '@harry-school/ui';
import { TaskProgress } from '../../components/tasks/common/TaskProgress';
import { TaskFilterBar } from '../../components/tasks/common/TaskFilterBar';
import { EmptyTasksState } from '../../components/tasks/common/EmptyTasksState';

// Hook imports
import { useTasksData } from '../../hooks/tasks/useTasksData';
import { useAdaptiveContent } from '../../hooks/content/useAdaptiveContent';
import { useTaskSync } from '../../hooks/tasks/useTaskSync';
import { useAuth } from '@harry-school/shared/hooks';

// Type imports
import type { LessonsNavigationProp, LessonsRouteProps, StudentAgeGroup } from '../../navigation/types';

interface LessonsListScreenProps {
  navigation: LessonsNavigationProp;
  route: LessonsRouteProps<'TasksList'>;
}

interface TaskItem {
  id: string;
  title: string;
  type: 'text' | 'quiz' | 'speaking' | 'listening' | 'writing';
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedDuration: number; // minutes
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  progress: number; // 0-100
  aiRecommended: boolean;
  dueDate?: string;
  culturalContext?: string;
  lastAttempt?: string;
}

// Age-specific configurations based on UX research
const AGE_CONFIGS = {
  '10-12': {
    cardSize: 'large',
    showDifficulty: false,
    prioritizeVisual: true,
    gamificationLevel: 'high',
    maxTasksPerPage: 6,
    filterOptions: ['type', 'status'],
  },
  '13-15': {
    cardSize: 'medium', 
    showDifficulty: true,
    prioritizeVisual: false,
    gamificationLevel: 'medium',
    maxTasksPerPage: 8,
    filterOptions: ['type', 'status', 'difficulty', 'due_date'],
  },
  '16-18': {
    cardSize: 'compact',
    showDifficulty: true,
    prioritizeVisual: false,
    gamificationLevel: 'low',
    maxTasksPerPage: 12,
    filterOptions: ['type', 'status', 'difficulty', 'due_date', 'priority'],
  },
} as const;

export const LessonsListScreen: React.FC<LessonsListScreenProps> = ({
  navigation,
  route,
}) => {
  // Hooks
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const ageGroup = user?.profile?.ageGroup || '13-15';
  
  // State
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Custom hooks
  const {
    tasks,
    loading,
    error,
    refetch,
  } = useTasksData({
    lessonId: route.params.lessonId,
    courseId: route.params.courseId,
    filter: activeFilter,
  });

  const { adaptiveLayout, componentSizing } = useAdaptiveContent(ageGroup);
  const { syncStatus, triggerSync } = useTaskSync();

  // Age-specific configuration
  const config = AGE_CONFIGS[ageGroup];

  // Filtered and sorted tasks based on age group preferences
  const processedTasks = useMemo(() => {
    let filteredTasks = tasks;

    // Apply search filter
    if (searchQuery) {
      filteredTasks = filteredTasks.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (activeFilter !== 'all') {
      filteredTasks = filteredTasks.filter(task =>
        task.status === activeFilter || 
        (activeFilter === 'ai_recommended' && task.aiRecommended)
      );
    }

    // Age-specific sorting
    const sortedTasks = filteredTasks.sort((a, b) => {
      if (ageGroup === '10-12') {
        // Elementary: prioritize AI recommended, then by fun factor
        if (a.aiRecommended && !b.aiRecommended) return -1;
        if (!a.aiRecommended && b.aiRecommended) return 1;
        return a.type.localeCompare(b.type); // Group by type
      } else if (ageGroup === '13-15') {
        // Middle school: balance due dates and recommendations
        if (a.status === 'overdue' && b.status !== 'overdue') return -1;
        if (a.status !== 'overdue' && b.status === 'overdue') return 1;
        if (a.aiRecommended && !b.aiRecommended) return -1;
        if (!a.aiRecommended && b.aiRecommended) return 1;
        return new Date(a.dueDate || '').getTime() - new Date(b.dueDate || '').getTime();
      } else {
        // High school: prioritize by due date and difficulty
        if (a.status === 'overdue' && b.status !== 'overdue') return -1;
        if (a.status !== 'overdue' && b.status === 'overdue') return 1;
        const dueDateDiff = new Date(a.dueDate || '').getTime() - new Date(b.dueDate || '').getTime();
        if (dueDateDiff !== 0) return dueDateDiff;
        return a.difficulty.localeCompare(b.difficulty);
      }
    });

    return sortedTasks.slice(0, config.maxTasksPerPage);
  }, [tasks, searchQuery, activeFilter, ageGroup, config.maxTasksPerPage]);

  // Handle task selection
  const handleTaskPress = useCallback((task: TaskItem) => {
    // Navigate to appropriate task screen based on type
    const screenMap = {
      text: 'TextTask',
      quiz: 'QuizTask', 
      speaking: 'SpeakingTask',
      listening: 'ListeningTask',
      writing: 'WritingTask',
    } as const;

    navigation.navigate(screenMap[task.type], {
      taskId: task.id,
      lessonId: route.params.lessonId,
      ...(task.type === 'speaking' && { maxDuration: task.estimatedDuration * 60 }),
      ...(task.type === 'writing' && { wordLimit: ageGroup === '10-12' ? 100 : ageGroup === '13-15' ? 300 : 500 }),
    });
  }, [navigation, route.params.lessonId, ageGroup]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    await triggerSync();
    setRefreshing(false);
  }, [refetch, triggerSync]);

  // Render task card with age-appropriate styling
  const renderTaskCard = useCallback(({ item: task }: { item: TaskItem }) => (
    <TaskCard
      task={task}
      onPress={() => handleTaskPress(task)}
      ageGroup={ageGroup}
      config={config}
      componentSizing={componentSizing}
    />
  ), [handleTaskPress, ageGroup, config, componentSizing]);

  if (loading && !refreshing) {
    return <LoadingSpinner />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        title="Home Tasks"
        subtitle={`${processedTasks.length} tasks available`}
        showBack
        onBack={() => navigation.goBack()}
        rightComponent={
          <Badge 
            text={syncStatus === 'synced' ? 'Synced' : 'Syncing...'}
            variant={syncStatus === 'synced' ? 'success' : 'warning'}
          />
        }
      />

      <TaskFilterBar
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterOptions={config.filterOptions}
        ageGroup={ageGroup}
      />

      <FlatList
        data={processedTasks}
        renderItem={renderTaskCard}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyTasksState
            filter={activeFilter}
            onRefresh={handleRefresh}
            ageGroup={ageGroup}
          />
        }
        accessible={true}
        accessibilityLabel="Home tasks list"
        accessibilityHint="Browse and select tasks to complete"
      />
    </View>
  );
};

// Task Card Component with age-adaptive design
const TaskCard: React.FC<{
  task: TaskItem;
  onPress: () => void;
  ageGroup: StudentAgeGroup;
  config: typeof AGE_CONFIGS[keyof typeof AGE_CONFIGS];
  componentSizing: any;
}> = ({ task, onPress, ageGroup, config, componentSizing }) => {
  const getTaskIcon = useCallback((type: string) => {
    const icons = {
      text: '📚',
      quiz: '🧩',
      speaking: '🎙️',
      listening: '👂',
      writing: '✍️',
    };
    return icons[type as keyof typeof icons] || '📝';
  }, []);

  const getStatusColor = useCallback((status: string) => {
    const colors = {
      pending: '#3B82F6',
      in_progress: '#F59E0B',
      completed: '#10B981',
      overdue: '#EF4444',
    };
    return colors[status as keyof typeof colors] || '#6B7280';
  }, []);

  return (
    <Card
      style={[
        styles.taskCard,
        componentSizing?.cardSize?.[config.cardSize] || {},
        task.aiRecommended && styles.aiRecommended,
      ]}
      onPress={onPress}
      accessible={true}
      accessibilityLabel={`${task.title}, ${task.type} task, ${task.status}`}
      accessibilityHint="Tap to start this task"
    >
      <View style={styles.taskHeader}>
        <View style={styles.taskIcon}>
          <Text style={[styles.iconText, componentSizing?.iconSize || {}]}>
            {getTaskIcon(task.type)}
          </Text>
        </View>
        <View style={styles.taskInfo}>
          <Text style={[styles.taskTitle, componentSizing?.titleSize || {}]}>
            {task.title}
          </Text>
          <View style={styles.taskMeta}>
            <Badge
              text={task.type}
              variant="secondary"
              size={ageGroup === '10-12' ? 'large' : 'small'}
            />
            {config.showDifficulty && (
              <Badge
                text={task.difficulty}
                variant={task.difficulty === 'hard' ? 'danger' : 'neutral'}
                size="small"
              />
            )}
            {task.aiRecommended && ageGroup !== '16-18' && (
              <Badge text="AI Pick" variant="success" size="small" />
            )}
          </View>
        </View>
        <View style={styles.taskStatus}>
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: getStatusColor(task.status) },
            ]}
          />
        </View>
      </View>

      <TaskProgress
        progress={task.progress}
        estimatedDuration={task.estimatedDuration}
        ageGroup={ageGroup}
      />

      {task.culturalContext && ageGroup === '10-12' && (
        <Text style={styles.culturalNote}>{task.culturalContext}</Text>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  taskCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  aiRecommended: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  taskIcon: {
    marginRight: 12,
  },
  iconText: {
    fontSize: 24,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  taskMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  taskStatus: {
    alignItems: 'flex-end',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  culturalNote: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 8,
  },
});