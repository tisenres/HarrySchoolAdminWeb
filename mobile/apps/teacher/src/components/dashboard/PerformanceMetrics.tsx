import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

interface PerformanceData {
  overall_rating: number;
  students_improved: number;
  total_students: number;
  attendance_rate: number;
  assignment_completion: number;
  parent_satisfaction: number;
  recent_achievements: Achievement[];
}

interface Achievement {
  id: string;
  title: string;
  date: string;
  type: 'attendance' | 'performance' | 'engagement' | 'parent_feedback';
}

interface PerformanceMetricsProps {
  data?: PerformanceData;
  isLoading: boolean;
}

function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color = '#1d7452' 
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        {icon}
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricSubtitle}>{subtitle}</Text>
    </View>
  );
}

function AchievementItem({ achievement }: { achievement: Achievement }) {
  const getAchievementIcon = (type: Achievement['type']) => {
    switch (type) {
      case 'attendance':
        return (
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path
              d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
              stroke="#10b981"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        );
      case 'performance':
        return (
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path
              d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
              stroke="#f59e0b"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        );
      case 'engagement':
        return (
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path
              d="M20.84 4.61C19.32 3.74 17.61 3.74 16.09 4.61L12 7.5L7.91 4.61C6.39 3.74 4.68 3.74 3.16 4.61C1.64 5.48 1.64 7.52 3.16 8.39L12 13.5L20.84 8.39C22.36 7.52 22.36 5.48 20.84 4.61Z"
              stroke="#ec4899"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        );
      case 'parent_feedback':
        return (
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path
              d="M7 8H17M7 12H17M7 16H11M21 12C21 16.9706 16.9706 21 12 21C10.4649 21 9.01613 20.5767 7.77907 19.8389L3 21L4.16107 16.2209C3.42328 14.9839 3 13.5351 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
              stroke="#3b82f6"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        );
    }
  };

  return (
    <View style={styles.achievementItem}>
      {getAchievementIcon(achievement.type)}
      <View style={styles.achievementContent}>
        <Text style={styles.achievementTitle}>{achievement.title}</Text>
        <Text style={styles.achievementDate}>
          {new Date(achievement.date).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );
}

export function PerformanceMetrics({ data, isLoading }: PerformanceMetricsProps) {
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Performance Overview</Text>
        <View style={styles.loadingGrid}>
          <View style={styles.loadingCard} />
          <View style={styles.loadingCard} />
        </View>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Performance Overview</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Performance data will appear here</Text>
        </View>
      </View>
    );
  }

  const improvementRate = data.total_students > 0 
    ? (data.students_improved / data.total_students) * 100 
    : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Performance Overview</Text>
      
      {/* Key Metrics Grid */}
      <View style={styles.metricsGrid}>
        <MetricCard
          title="Overall Rating"
          value={`${data.overall_rating.toFixed(1)}/5.0`}
          subtitle="This month"
          color="#1d7452"
          icon={
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                stroke="#1d7452"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          }
        />

        <MetricCard
          title="Student Progress"
          value={`${improvementRate.toFixed(0)}%`}
          subtitle={`${data.students_improved}/${data.total_students} improved`}
          color="#10b981"
          icon={
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path
                d="M7 14L9 12L13 16L21 8M3 12H9M9 8V16"
                stroke="#10b981"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          }
        />

        <MetricCard
          title="Attendance Rate"
          value={`${data.attendance_rate.toFixed(0)}%`}
          subtitle="Class average"
          color="#0ea5e9"
          icon={
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path
                d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z"
                stroke="#0ea5e9"
                strokeWidth={2}
              />
              <Path
                d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z"
                stroke="#0ea5e9"
                strokeWidth={2}
              />
            </Svg>
          }
        />

        <MetricCard
          title="Assignments"
          value={`${data.assignment_completion.toFixed(0)}%`}
          subtitle="Completion rate"
          color="#7c3aed"
          icon={
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path
                d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                stroke="#7c3aed"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M14 2V8H20M16 13H8M16 17H8M10 9H8"
                stroke="#7c3aed"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          }
        />
      </View>

      {/* Recent Achievements */}
      {data.recent_achievements.length > 0 && (
        <View style={styles.achievementsSection}>
          <Text style={styles.achievementsTitle}>Recent Achievements</Text>
          <View style={styles.achievementsList}>
            {data.recent_achievements.slice(0, 3).map((achievement) => (
              <AchievementItem key={achievement.id} achievement={achievement} />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconContainer: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
    marginBottom: 2,
  },
  metricSubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  achievementsSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  achievementsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  achievementsList: {
    gap: 12,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementContent: {
    marginLeft: 12,
    flex: 1,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 2,
  },
  achievementDate: {
    fontSize: 12,
    color: '#64748b',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  loadingGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  loadingCard: {
    height: 120,
    backgroundColor: '#e2e8f0',
    borderRadius: 16,
    flex: 1,
  },
});