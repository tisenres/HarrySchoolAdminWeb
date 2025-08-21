/**
 * Quick Stats Card Component
 * Harry School Student Mobile App
 * 
 * Displays learning analytics and progress insights
 * Age-adaptive complexity and visualization
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Card, ProgressBar, Badge } from '@harry-school/ui';
import type { StudentAgeGroup } from '../../navigation/types';
import type { StatsData } from '../../hooks/useDashboardData';
import { theme } from '@harry-school/ui/theme';

interface QuickStatsCardProps {
  ageGroup: StudentAgeGroup;
  data?: StatsData;
  onPress?: () => void;
  onGoalPress?: (goalId: string) => void;
  style?: ViewStyle;
  testID?: string;
}

export const QuickStatsCard: React.FC<QuickStatsCardProps> = ({
  ageGroup,
  data,
  onPress,
  onGoalPress,
  style,
  testID,
}) => {
  // Age-specific configuration
  const config = useMemo(() => {
    const isElementary = ageGroup === '10-12';
    
    return {
      visualCharts: isElementary,
      encouragingLanguage: isElementary,
      parentReports: isElementary,
      simpleMetrics: isElementary,
      gamifiedGoals: isElementary,
      detailedAnalytics: !isElementary,
      trendAnalysis: !isElementary,
      correlationInsights: !isElementary,
      reflectionTools: !isElementary,
      academicPlanning: !isElementary,
      maxGoalsVisible: isElementary ? 2 : 3,
    };
  }, [ageGroup]);

  // Mock data for development
  const statsData: StatsData = data || {
    weeklyProgress: {
      studyTime: 420, // 7 hours
      tasksCompleted: 12,
      averageScore: 87,
      improvementRate: 15, // 15% improvement
    },
    streaks: {
      current: 7,
      longest: 14,
      type: 'daily_login',
    },
    improvements: [
      {
        subject: 'Math',
        improvement: 12,
        timeframe: 'week',
      },
      {
        subject: 'English',
        improvement: 8,
        timeframe: 'week',
      },
    ],
    goals: [
      {
        id: 'goal-1',
        title: 'Complete 15 vocabulary exercises',
        progress: 10,
        target: 15,
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        type: 'academic',
      },
      {
        id: 'goal-2',
        title: 'Maintain 90% quiz average',
        progress: 87,
        target: 90,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        type: 'academic',
      },
    ],
    subjectBreakdown: [
      {
        subject: 'Math',
        timeSpent: 120,
        score: 85,
        progress: 78,
      },
      {
        subject: 'English',
        timeSpent: 180,
        score: 92,
        progress: 85,
      },
      {
        subject: 'Science',
        timeSpent: 120,
        score: 84,
        progress: 72,
      },
    ],
  };

  // Format study time
  const formatStudyTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (config.simpleMetrics) {
      if (hours === 0) {
        return `${mins}m`;
      }
      return `${hours}h ${mins}m`;
    } else {
      return `${hours}h ${mins}m this week`;
    }
  };

  // Get improvement display
  const getImprovementDisplay = (rate: number) => {
    if (config.encouragingLanguage) {
      if (rate >= 20) return { text: 'Amazing growth! 🚀', color: theme.colors.educational.performance.excellent };
      if (rate >= 10) return { text: 'Great progress! ⭐', color: theme.colors.educational.performance.good };
      if (rate >= 5) return { text: 'Keep improving! 💪', color: theme.colors.educational.performance.average };
      return { text: 'Stay consistent! 📈', color: theme.colors.educational.performance.needsWork };
    } else {
      return {
        text: `${rate >= 0 ? '+' : ''}${rate}% this week`,
        color: rate >= 10 
          ? theme.colors.educational.performance.excellent 
          : rate >= 5 
          ? theme.colors.educational.performance.good 
          : theme.colors.educational.performance.average,
      };
    }
  };

  // Get performance color
  const getPerformanceColor = (score: number) => {
    if (score >= 90) return theme.colors.educational.performance.excellent;
    if (score >= 80) return theme.colors.educational.performance.good;
    if (score >= 70) return theme.colors.educational.performance.average;
    return theme.colors.educational.performance.needsWork;
  };

  // Get goal urgency
  const getGoalUrgency = (deadline: Date) => {
    const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 1) return 'urgent';
    if (daysLeft <= 3) return 'soon';
    return 'normal';
  };

  const improvementDisplay = getImprovementDisplay(statsData.weeklyProgress.improvementRate);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Weekly progress: ${statsData.weeklyProgress.averageScore}% average score`}
      accessibilityHint="View detailed statistics"
      testID={testID}
    >
      <Card variant="data" size="expanded" style={[styles.card, style]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {config.simpleMetrics ? 'This Week' : 'Learning Analytics'}
          </Text>
          
          {config.parentReports && (
            <TouchableOpacity style={styles.shareButton}>
              <Text style={styles.shareIcon}>📤</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Primary Stats */}
        <View style={styles.primaryStats}>
          {/* Study Time */}
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>⏱️</Text>
            <Text style={styles.statValue}>
              {formatStudyTime(statsData.weeklyProgress.studyTime)}
            </Text>
            <Text style={styles.statLabel}>Study Time</Text>
          </View>

          {/* Average Score */}
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>📊</Text>
            <Text style={[
              styles.statValue,
              { color: getPerformanceColor(statsData.weeklyProgress.averageScore) }
            ]}>
              {statsData.weeklyProgress.averageScore}%
            </Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>

          {/* Tasks Completed */}
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>✅</Text>
            <Text style={styles.statValue}>
              {statsData.weeklyProgress.tasksCompleted}
            </Text>
            <Text style={styles.statLabel}>
              {config.simpleMetrics ? 'Done' : 'Completed'}
            </Text>
          </View>
        </View>

        {/* Improvement Section */}
        <View style={styles.improvementSection}>
          <View style={styles.improvementHeader}>
            <Text style={styles.improvementTitle}>
              {config.encouragingLanguage ? 'Your Progress' : 'Weekly Improvement'}
            </Text>
            <Text style={[
              styles.improvementValue,
              { color: improvementDisplay.color }
            ]}>
              {improvementDisplay.text}
            </Text>
          </View>

          {/* Subject Improvements (for detailed view) */}
          {config.trendAnalysis && statsData.improvements.length > 0 && (
            <View style={styles.subjectImprovements}>
              {statsData.improvements.map((improvement, index) => (
                <View key={index} style={styles.subjectImprovement}>
                  <Text style={styles.subjectName}>{improvement.subject}</Text>
                  <Text style={[
                    styles.subjectValue,
                    { color: getPerformanceColor(improvement.improvement + 70) }
                  ]}>
                    +{improvement.improvement}%
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Goals Section */}
        {statsData.goals.length > 0 && (
          <View style={styles.goalsSection}>
            <Text style={styles.sectionTitle}>
              {config.gamifiedGoals ? 'Active Challenges' : 'Current Goals'}
            </Text>
            
            {statsData.goals.slice(0, config.maxGoalsVisible).map((goal) => {
              const progressPercent = (goal.progress / goal.target) * 100;
              const urgency = getGoalUrgency(goal.deadline);
              
              return (
                <TouchableOpacity
                  key={goal.id}
                  style={styles.goalItem}
                  onPress={() => onGoalPress?.(goal.id)}
                >
                  <View style={styles.goalHeader}>
                    <Text style={styles.goalTitle} numberOfLines={1}>
                      {goal.title}
                    </Text>
                    
                    {urgency === 'urgent' && (
                      <Badge
                        type="status"
                        variant="error"
                        text="!"
                        style={styles.urgentBadge}
                      />
                    )}
                  </View>
                  
                  <View style={styles.goalProgress}>
                    <View style={styles.goalMeta}>
                      <Text style={styles.goalValue}>
                        {goal.progress}/{goal.target}
                      </Text>
                      <Text style={styles.goalPercent}>
                        {Math.round(progressPercent)}%
                      </Text>
                    </View>
                    
                    <ProgressBar
                      progress={progressPercent}
                      color={urgency === 'urgent' 
                        ? theme.colors.semantic.error.main 
                        : theme.colors.primary.main
                      }
                      height={6}
                      style={styles.goalProgressBar}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Subject Breakdown (for secondary students) */}
        {config.detailedAnalytics && statsData.subjectBreakdown.length > 0 && (
          <View style={styles.subjectsSection}>
            <Text style={styles.sectionTitle}>Subject Performance</Text>
            
            <View style={styles.subjectGrid}>
              {statsData.subjectBreakdown.slice(0, 3).map((subject) => (
                <View key={subject.subject} style={styles.subjectCard}>
                  <Text style={styles.subjectCardTitle}>{subject.subject}</Text>
                  <Text style={[
                    styles.subjectScore,
                    { color: getPerformanceColor(subject.score) }
                  ]}>
                    {subject.score}%
                  </Text>
                  <Text style={styles.subjectTime}>
                    {Math.floor(subject.timeSpent / 60)}h studied
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Streak Display (simple version) */}
        {config.visualCharts && (
          <View style={styles.streakSection}>
            <Text style={styles.streakTitle}>Learning Streak</Text>
            <View style={styles.streakDisplay}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={styles.streakValue}>
                {statsData.streaks.current} days
              </Text>
              <Text style={styles.streakBest}>
                (Best: {statsData.streaks.longest})
              </Text>
            </View>
          </View>
        )}

        {/* Encouragement Message (Elementary) */}
        {config.encouragingLanguage && (
          <View style={styles.encouragementSection}>
            <Text style={styles.encouragementEmoji}>
              {statsData.weeklyProgress.averageScore >= 90 ? '🌟' :
               statsData.weeklyProgress.averageScore >= 80 ? '⭐' : '💪'}
            </Text>
            <Text style={styles.encouragementText}>
              {statsData.weeklyProgress.averageScore >= 90 
                ? "You're a superstar learner!"
                : statsData.weeklyProgress.averageScore >= 80
                ? "Great job this week!"
                : "Keep up the good work!"}
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
  
  shareButton: {
    padding: 4,
  },
  
  shareIcon: {
    fontSize: 16,
  },
  
  primaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.lg,
  },
  
  statItem: {
    alignItems: 'center',
  },
  
  statIcon: {
    fontSize: 20,
    marginBottom: theme.spacing.xs,
  },
  
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  
  statLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  
  improvementSection: {
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 8,
    paddingHorizontal: theme.spacing.md,
  },
  
  improvementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  improvementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  
  improvementValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  subjectImprovements: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: theme.spacing.sm,
  },
  
  subjectImprovement: {
    alignItems: 'center',
  },
  
  subjectName: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  
  subjectValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  goalsSection: {
    marginBottom: theme.spacing.md,
  },
  
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  
  goalItem: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 8,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  
  goalTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text.primary,
    flex: 1,
  },
  
  urgentBadge: {
    marginLeft: theme.spacing.xs,
  },
  
  goalProgress: {
    marginTop: theme.spacing.xs,
  },
  
  goalMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  
  goalValue: {
    fontSize: 10,
    color: theme.colors.text.secondary,
  },
  
  goalPercent: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  
  goalProgressBar: {
    height: 4,
  },
  
  subjectsSection: {
    marginBottom: theme.spacing.md,
  },
  
  subjectGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  subjectCard: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 6,
    padding: theme.spacing.sm,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  
  subjectCardTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  
  subjectScore: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  
  subjectTime: {
    fontSize: 8,
    color: theme.colors.text.tertiary,
  },
  
  streakSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  
  streakTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  
  streakDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  streakEmoji: {
    fontSize: 20,
    marginRight: theme.spacing.xs,
  },
  
  streakValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.educational.performance.excellent,
    marginRight: theme.spacing.xs,
  },
  
  streakBest: {
    fontSize: 10,
    color: theme.colors.text.secondary,
  },
  
  encouragementSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.primary,
    marginTop: theme.spacing.sm,
  },
  
  encouragementEmoji: {
    fontSize: 20,
    marginRight: theme.spacing.sm,
  },
  
  encouragementText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
});

export default QuickStatsCard;