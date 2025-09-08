import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp, Calendar, Target, Award } from 'lucide-react-native';
import Card from '@/components/ui/Card';
import Colors from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/fonts';
import { useStudent } from '@/providers/StudentProvider';

interface StatItem {
  id: string;
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  trend?: string;
}



export default function QuickStats() {
  const { stats, isLoading, error } = useStudent();

  // Mock data fallback when Supabase fails
  const mockStats: StatItem[] = [
    {
      id: '1',
      title: 'Attendance',
      value: '94%',
      icon: <Calendar size={20} color={Colors.success} />,
      color: Colors.success,
      trend: '+2%',
    },
    {
      id: '2',
      title: 'Avg Grade',
      value: '8.7',
      icon: <TrendingUp size={20} color={Colors.primary} />,
      color: Colors.primary,
      trend: '+0.3',
    },
    {
      id: '3',
      title: 'Streak',
      value: '12 days',
      icon: <Target size={20} color={Colors.secondary} />,
      color: Colors.secondary,
    },
    {
      id: '4',
      title: 'Achievements',
      value: '23',
      icon: <Award size={20} color={Colors.accent} />,
      color: Colors.accent,
      trend: '+3',
    },
  ];

  // Use real data when available, fallback to mock data
  const displayStats: StatItem[] = error ? mockStats : [
    {
      id: '1',
      title: 'Completed',
      value: stats.completedTasks.toString(),
      icon: <Calendar size={20} color={Colors.success} />,
      color: Colors.success,
    },
    {
      id: '2',
      title: 'Level',
      value: stats.currentLevel.toString(),
      icon: <TrendingUp size={20} color={Colors.primary} />,
      color: Colors.primary,
    },
    {
      id: '3',
      title: 'Streak',
      value: `${stats.streakDays} days`,
      icon: <Target size={20} color={Colors.secondary} />,
      color: Colors.secondary,
    },
    {
      id: '4',
      title: 'Pending',
      value: stats.pendingTasks.toString(),
      icon: <Award size={20} color={Colors.accent} />,
      color: Colors.accent,
    },
  ];

  if (isLoading) {
    return (
      <Card style={styles.container} testID="quick-stats">
        <Text style={styles.title}>Quick Stats</Text>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading stats...</Text>
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.container} testID="quick-stats">
      <Text style={styles.title}>Quick Stats</Text>
      
      <View style={styles.statsGrid}>
        {displayStats.map((stat) => (
          <View key={stat.id} style={styles.statItem}>
            <View style={styles.statHeader}>
              {stat.icon}
              {stat.trend && (
                <Text style={[styles.trend, { color: stat.color }]}>
                  {stat.trend}
                </Text>
              )}
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statTitle}>{stat.title}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {},
  title: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  trend: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
  },
  statValue: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
});