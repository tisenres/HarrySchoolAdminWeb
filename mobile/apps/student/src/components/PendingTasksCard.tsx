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
  lightRed: '#fee2e2',
};

interface PendingTask {
  id: string;
  title: string;
  subject: string;
  type: 'homework' | 'quiz' | 'reading' | 'practice' | 'speaking';
  dueDate: string;
  dueTime: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: number;
  points: number;
  progress?: number;
}

export default function PendingTasksCard() {
  const pendingTasks: PendingTask[] = [
    {
      id: '1',
      title: 'Complete Chapter 5 Exercises',
      subject: 'Mathematics',
      type: 'homework',
      dueDate: 'Today',
      dueTime: '11:59 PM',
      priority: 'high',
      estimatedTime: 45,
      points: 25,
      progress: 60,
    },
    {
      id: '2',
      title: 'Vocabulary Practice - Unit 8',
      subject: 'Arabic',
      type: 'practice',
      dueDate: 'Tomorrow',
      dueTime: '9:00 AM',
      priority: 'medium',
      estimatedTime: 30,
      points: 15,
    },
    {
      id: '3',
      title: 'Reading Comprehension Quiz',
      subject: 'English',
      type: 'quiz',
      dueDate: 'Aug 24',
      dueTime: '2:00 PM',
      priority: 'high',
      estimatedTime: 20,
      points: 30,
    },
    {
      id: '4',
      title: 'Recitation Practice - Surah Al-Mulk',
      subject: 'Quran',
      type: 'speaking',
      dueDate: 'Aug 25',
      dueTime: '10:00 AM',
      priority: 'medium',
      estimatedTime: 25,
      points: 20,
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return COLORS.error;
      case 'medium': return COLORS.warning;
      case 'low': return COLORS.success;
      default: return COLORS.textSecondary;
    }
  };

  const getPriorityBg = (priority: string) => {
    switch (priority) {
      case 'high': return COLORS.lightRed;
      case 'medium': return COLORS.lightOrange;
      case 'low': return COLORS.lightGreen;
      default: return `${COLORS.textSecondary}20`;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'homework': return 'assignment';
      case 'quiz': return 'quiz';
      case 'reading': return 'menu-book';
      case 'practice': return 'fitness-center';
      case 'speaking': return 'record-voice-over';
      default: return 'task';
    }
  };

  const getSubjectEmoji = (subject: string) => {
    switch (subject.toLowerCase()) {
      case 'mathematics': return '🔢';
      case 'arabic': return '🌙';
      case 'english': return '🌍';
      case 'quran': return '📖';
      case 'islamic studies': return '☪️';
      case 'science': return '🔬';
      default: return '📚';
    }
  };

  const isOverdue = (dueDate: string) => {
    return dueDate === 'Today' && new Date().getHours() > 18;
  };

  const getDueColor = (dueDate: string, priority: string) => {
    if (isOverdue(dueDate)) return COLORS.error;
    if (dueDate === 'Today') return COLORS.warning;
    if (priority === 'high') return COLORS.error;
    return COLORS.textSecondary;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Pending Tasks</Text>
          <Text style={styles.subtitle}>
            {pendingTasks.length} tasks to complete
          </Text>
        </View>
        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View All</Text>
          <Icon name="arrow-forward" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tasksList}
      >
        {pendingTasks.map((task) => (
          <TouchableOpacity 
            key={task.id} 
            style={[
              styles.taskItem,
              { backgroundColor: getPriorityBg(task.priority) }
            ]}
            activeOpacity={0.7}
          >
            {/* Task Header */}
            <View style={styles.taskHeader}>
              <View style={styles.subjectBadge}>
                <Text style={styles.subjectEmoji}>
                  {getSubjectEmoji(task.subject)}
                </Text>
                <Text style={styles.subjectText}>{task.subject}</Text>
              </View>
              <View style={[
                styles.priorityBadge,
                { backgroundColor: getPriorityColor(task.priority) }
              ]}>
                <Text style={styles.priorityText}>
                  {task.priority.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Task Content */}
            <View style={styles.taskContent}>
              <View style={styles.taskTitleRow}>
                <View style={[
                  styles.typeIcon,
                  { backgroundColor: `${getPriorityColor(task.priority)}20` }
                ]}>
                  <Icon 
                    name={getTypeIcon(task.type)} 
                    size={16} 
                    color={getPriorityColor(task.priority)} 
                  />
                </View>
                <View style={styles.taskTitleSection}>
                  <Text style={styles.taskTitle} numberOfLines={2}>
                    {task.title}
                  </Text>
                </View>
              </View>

              {/* Progress Bar (if available) */}
              {task.progress !== undefined && (
                <View style={styles.progressSection}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill,
                        { 
                          width: `${task.progress}%`,
                          backgroundColor: getPriorityColor(task.priority)
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>{task.progress}%</Text>
                </View>
              )}
            </View>

            {/* Task Footer */}
            <View style={styles.taskFooter}>
              <View style={styles.taskMeta}>
                <View style={styles.timeInfo}>
                  <Icon name="schedule" size={12} color={COLORS.textSecondary} />
                  <Text style={styles.timeText}>{task.estimatedTime}min</Text>
                </View>
                <View style={styles.pointsInfo}>
                  <Icon name="star" size={12} color={COLORS.gold} />
                  <Text style={styles.pointsText}>{task.points}pts</Text>
                </View>
              </View>
              
              <View style={styles.dueInfo}>
                <Text style={[
                  styles.dueDate,
                  { color: getDueColor(task.dueDate, task.priority) }
                ]}>
                  {task.dueDate}
                </Text>
                <Text style={styles.dueTime}>{task.dueTime}</Text>
              </View>
            </View>

            {/* Action Button */}
            <TouchableOpacity 
              style={[
                styles.startButton,
                { backgroundColor: getPriorityColor(task.priority) }
              ]}
            >
              <Icon name="play-arrow" size={16} color={COLORS.white} />
              <Text style={styles.startButtonText}>
                {task.progress ? 'Continue' : 'Start'}
              </Text>
            </TouchableOpacity>

            {/* Overdue indicator */}
            {isOverdue(task.dueDate) && (
              <View style={styles.overdueIndicator}>
                <Icon name="warning" size={12} color={COLORS.white} />
                <Text style={styles.overdueText}>OVERDUE</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* Add task button */}
        <TouchableOpacity style={styles.addTaskButton}>
          <Icon name="add-task" size={28} color={COLORS.primary} />
          <Text style={styles.addTaskText}>Request Extra Homework</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Summary Stats */}
      <View style={styles.summarySection}>
        <View style={styles.summaryItem}>
          <Icon name="pending-actions" size={16} color={COLORS.warning} />
          <Text style={styles.summaryText}>
            2 tasks due today
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Icon name="trending-up" size={16} color={COLORS.success} />
          <Text style={styles.summaryText}>
            85% completion rate
          </Text>
        </View>
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
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}10`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  viewAllText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  tasksList: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 16,
  },
  taskItem: {
    width: 200,
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    position: 'relative',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subjectEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  subjectText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  taskContent: {
    marginBottom: 12,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  typeIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  taskTitleSection: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 16,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: `${COLORS.textSecondary}30`,
    borderRadius: 2,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  taskFooter: {
    marginBottom: 12,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  timeText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginLeft: 2,
  },
  pointsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 10,
    color: COLORS.gold,
    marginLeft: 2,
    fontWeight: '600',
  },
  dueInfo: {
    alignItems: 'flex-end',
  },
  dueDate: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 1,
  },
  dueTime: {
    fontSize: 9,
    color: COLORS.textSecondary,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  startButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  overdueIndicator: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.error,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  overdueText: {
    color: COLORS.white,
    fontSize: 8,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  addTaskButton: {
    width: 140,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: `${COLORS.primary}30`,
    borderStyle: 'dashed',
  },
  addTaskText: {
    fontSize: 11,
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: 6,
    fontWeight: '500',
  },
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: `${COLORS.textSecondary}20`,
    marginTop: 8,
    paddingTop: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
});