/**
 * Pending Tasks Card Component
 * Harry School Student Mobile App
 * 
 * Displays pending tasks with age-appropriate presentation
 * Elementary: Quest-like format, Secondary: Productivity-focused
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ViewStyle,
} from 'react-native';
import { Card, Badge } from '@harry-school/ui';
import type { StudentAgeGroup } from '../../navigation/types';
import type { TaskData } from '../../hooks/useDashboardData';
import { theme } from '@harry-school/ui/theme';

interface PendingTasksCardProps {
  ageGroup: StudentAgeGroup;
  data?: TaskData[];
  onPress?: () => void;
  onTaskPress?: (taskId: string) => void;
  style?: ViewStyle;
  testID?: string;
}

export const PendingTasksCard: React.FC<PendingTasksCardProps> = ({
  ageGroup,
  data,
  onPress,
  onTaskPress,
  style,
  testID,
}) => {
  // Age-specific configuration
  const config = useMemo(() => {
    const isElementary = ageGroup === '10-12';
    
    return {
      questFormat: isElementary,
      maxVisible: isElementary ? 3 : 5,
      rewardPreviews: isElementary,
      characterIntegration: isElementary,
      storyContext: isElementary,
      priorityMatrix: !isElementary,
      projectBreakdown: !isElementary,
      timeBlocking: !isElementary,
      collaborationFeatures: !isElementary,
      academicIntegration: !isElementary,
    };
  }, [ageGroup]);

  // Mock data for development
  const tasks: TaskData[] = data || [
    {
      id: 'task-1',
      title: 'Complete Math Worksheet',
      subject: 'Math',
      type: 'homework',
      priority: 'high',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      estimatedTime: 30,
      difficulty: 'medium',
      completed: false,
      progress: 0,
    },
    {
      id: 'task-2',
      title: 'Read Chapter 5',
      subject: 'English',
      type: 'homework',
      priority: 'medium',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
      estimatedTime: 45,
      difficulty: 'easy',
      completed: false,
      progress: 60,
    },
    {
      id: 'task-3',
      title: 'Science Lab Report',
      subject: 'Science',
      type: 'project',
      priority: 'urgent',
      dueDate: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours
      estimatedTime: 90,
      difficulty: 'hard',
      completed: false,
      progress: 25,
    },
  ];

  // Filter and sort tasks
  const visibleTasks = useMemo(() => {
    const sortedTasks = [...tasks].sort((a, b) => {
      // Priority order: urgent > high > medium > low
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority] || 0;
      const bPriority = priorityOrder[b.priority] || 0;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      // Then by due date
      return a.dueDate.getTime() - b.dueDate.getTime();
    });

    return sortedTasks.slice(0, config.maxVisible);
  }, [tasks, config.maxVisible]);

  // Get task display format
  const getTaskDisplay = (task: TaskData) => {
    if (config.questFormat) {
      // Elementary: Quest-like presentation
      const questEmojis = {
        homework: '📝',
        practice: '🎯',
        quiz: '🧩',
        project: '🏗️',
      };
      
      const difficultyStars = {
        easy: '⭐',
        medium: '⭐⭐',
        hard: '⭐⭐⭐',
      };
      
      return {
        icon: questEmojis[task.type] || '📋',
        title: `Quest: ${task.title}`,
        subtitle: `${difficultyStars[task.difficulty]} • ${task.estimatedTime}min adventure`,
        reward: task.type === 'homework' ? '🪙 50 coins' : '💎 25 gems',
      };
    } else {
      // Secondary: Productivity-focused presentation
      const formatDueDate = (date: Date) => {
        const now = new Date();
        const diffHours = (date.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        if (diffHours < 24) {
          return `Due in ${Math.floor(diffHours)}h`;
        } else {
          const diffDays = Math.floor(diffHours / 24);
          return `Due in ${diffDays}d`;
        }
      };
      
      return {
        icon: task.type === 'project' ? '📁' : '📄',
        title: task.title,
        subtitle: `${task.subject} • ${formatDueDate(task.dueDate)}`,
        progress: task.progress || 0,
      };
    }
  };

  // Get priority color
  const getPriorityColor = (priority: TaskData['priority']) => {
    switch (priority) {
      case 'urgent':
        return theme.colors.semantic.error.main;
      case 'high':
        return theme.colors.semantic.warning.main;
      case 'medium':
        return theme.colors.semantic.info.main;
      case 'low':
        return theme.colors.neutral[500];
    }
  };

  // Empty state
  if (visibleTasks.length === 0) {
    return (
      <TouchableOpacity onPress={onPress} testID={testID}>
        <Card variant="interactive" style={[styles.card, style]}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>
              {config.questFormat ? '🏆' : '✅'}
            </Text>
            <Text style={styles.emptyTitle}>
              {config.questFormat ? 'All quests complete!' : 'All caught up!'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {config.questFormat 
                ? 'Ready for new adventures!'
                : 'No pending tasks at the moment'}
            </Text>
          </View>
        </Card>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${visibleTasks.length} pending tasks`}
      accessibilityHint="View all tasks"
      testID={testID}
    >
      <Card variant="interactive" size="expanded" style={[styles.card, style]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {config.questFormat ? 'Active Quests' : 'Pending Tasks'}
          </Text>
          
          <View style={styles.headerRight}>
            <Badge
              type="count"
              count={tasks.length}
              style={styles.countBadge}
            />
          </View>
        </View>

        {/* Tasks List */}
        <ScrollView 
          style={styles.tasksList}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          {visibleTasks.map((task) => {
            const display = getTaskDisplay(task);
            
            return (
              <TouchableOpacity
                key={task.id}
                style={[
                  styles.taskItem,
                  config.questFormat && styles.questItem,
                ]}
                onPress={() => onTaskPress?.(task.id)}
                accessibilityRole="button"
                accessibilityLabel={`${task.title}, ${task.priority} priority`}
              >
                {/* Priority Indicator */}
                <View style={[
                  styles.priorityIndicator,
                  { backgroundColor: getPriorityColor(task.priority) }
                ]} />

                {/* Task Content */}
                <View style={styles.taskContent}>
                  <View style={styles.taskHeader}>
                    <Text style={styles.taskIcon}>{display.icon}</Text>
                    <View style={styles.taskInfo}>
                      <Text 
                        style={styles.taskTitle}
                        numberOfLines={1}
                      >
                        {display.title}
                      </Text>
                      <Text 
                        style={styles.taskSubtitle}
                        numberOfLines={1}
                      >
                        {display.subtitle}
                      </Text>
                    </View>
                    
                    {/* Task Actions */}
                    <View style={styles.taskActions}>
                      {config.questFormat && display.reward && (
                        <Text style={styles.rewardText}>{display.reward}</Text>
                      )}
                      
                      {!config.questFormat && typeof display.progress === 'number' && display.progress > 0 && (
                        <View style={styles.progressContainer}>
                          <Text style={styles.progressText}>
                            {display.progress}%
                          </Text>
                          <View style={styles.progressBar}>
                            <View 
                              style={[
                                styles.progressFill,
                                { 
                                  width: `${display.progress}%`,
                                  backgroundColor: getPriorityColor(task.priority)
                                }
                              ]} 
                            />
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* View More Button */}
        {tasks.length > config.maxVisible && (
          <TouchableOpacity
            style={styles.viewMoreButton}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`View ${tasks.length - config.maxVisible} more tasks`}
          >
            <Text style={styles.viewMoreText}>
              View {tasks.length - config.maxVisible} more
            </Text>
            <Text style={styles.viewMoreArrow}>→</Text>
          </TouchableOpacity>
        )}

        {/* Character Message (Elementary) */}
        {config.characterIntegration && config.storyContext && (
          <View style={styles.characterMessage}>
            <Text style={styles.characterEmoji}>🦉</Text>
            <Text style={styles.characterText}>
              {visibleTasks.length > 2 
                ? "Lots of adventures await! Take them one at a time." 
                : "You're doing great! Keep up the good work!"}
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
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  countBadge: {
    marginLeft: theme.spacing.xs,
  },
  
  tasksList: {
    maxHeight: 200,
  },
  
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  
  questItem: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 8,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderBottomWidth: 0,
  },
  
  priorityIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginRight: theme.spacing.sm,
  },
  
  taskContent: {
    flex: 1,
  },
  
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  taskIcon: {
    fontSize: 20,
    marginRight: theme.spacing.sm,
  },
  
  taskInfo: {
    flex: 1,
  },
  
  taskTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  
  taskSubtitle: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  
  taskActions: {
    alignItems: 'flex-end',
  },
  
  rewardText: {
    fontSize: 10,
    color: theme.colors.educational.performance.excellent,
    fontWeight: '500',
  },
  
  progressContainer: {
    alignItems: 'center',
    minWidth: 50,
  },
  
  progressText: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  
  progressBar: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: 2,
    overflow: 'hidden',
  },
  
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.primary,
    marginTop: theme.spacing.sm,
  },
  
  viewMoreText: {
    fontSize: 14,
    color: theme.colors.primary.main,
    fontWeight: '500',
    marginRight: theme.spacing.xs,
  },
  
  viewMoreArrow: {
    fontSize: 14,
    color: theme.colors.primary.main,
  },
  
  characterMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.primary.light,
    borderRadius: 8,
  },
  
  characterEmoji: {
    fontSize: 20,
    marginRight: theme.spacing.sm,
  },
  
  characterText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  
  emptyEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});

export default PendingTasksCard;