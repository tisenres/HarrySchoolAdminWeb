import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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
  lightPurple: '#f3e8ff',
};

interface QuickStatsCardProps {
  attendancePercentage: number;
  averageGrade: number;
  streak: number;
}

export default function QuickStatsCard({ 
  attendancePercentage, 
  averageGrade, 
  streak 
}: QuickStatsCardProps) {
  const stats = [
    {
      id: 1,
      title: 'Attendance',
      value: `${attendancePercentage}%`,
      icon: 'event-available',
      color: COLORS.success,
      bgColor: COLORS.lightGreen,
      trend: '+2%',
      trendUp: true,
    },
    {
      id: 2,
      title: 'Avg Grade',
      value: `${averageGrade}%`,
      icon: 'grade',
      color: COLORS.primary,
      bgColor: COLORS.lightBlue,
      trend: '+5%',
      trendUp: true,
    },
    {
      id: 3,
      title: 'Day Streak',
      value: `${streak}`,
      icon: 'local-fire-department',
      color: COLORS.warning,
      bgColor: COLORS.lightOrange,
      trend: streak > 7 ? '🔥' : '+1',
      trendUp: true,
    },
    {
      id: 4,
      title: 'Completed',
      value: '24/30',
      icon: 'check-circle',
      color: COLORS.secondary,
      bgColor: COLORS.lightPurple,
      trend: '80%',
      trendUp: true,
    },
  ];

  const getGradeEmoji = (grade: number) => {
    if (grade >= 95) return '🌟';
    if (grade >= 90) return '⭐';
    if (grade >= 85) return '👏';
    if (grade >= 80) return '👍';
    return '📈';
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return '🏆';
    if (streak >= 14) return '🔥';
    if (streak >= 7) return '⚡';
    return '💪';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Quick Stats</Text>
          <Text style={styles.subtitle}>Your progress overview</Text>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Icon name="more-horiz" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <TouchableOpacity 
            key={stat.id} 
            style={[styles.statItem, { backgroundColor: stat.bgColor }]}
            activeOpacity={0.7}
          >
            {/* Icon */}
            <View style={[styles.statIcon, { backgroundColor: `${stat.color}20` }]}>
              <Icon name={stat.icon} size={20} color={stat.color} />
            </View>

            {/* Value and Title */}
            <View style={styles.statContent}>
              <Text style={[styles.statValue, { color: stat.color }]}>
                {stat.value}
              </Text>
              <Text style={styles.statTitle}>{stat.title}</Text>
            </View>

            {/* Trend */}
            <View style={[
              styles.trendContainer,
              { backgroundColor: stat.trendUp ? `${COLORS.success}20` : `${COLORS.error}20` }
            ]}>
              <Icon 
                name={stat.trendUp ? 'trending-up' : 'trending-down'} 
                size={12} 
                color={stat.trendUp ? COLORS.success : COLORS.error} 
              />
              <Text style={[
                styles.trendText,
                { color: stat.trendUp ? COLORS.success : COLORS.error }
              ]}>
                {stat.trend}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Motivational Messages */}
      <View style={styles.motivationSection}>
        <View style={styles.motivationItem}>
          <Text style={styles.motivationEmoji}>
            {getGradeEmoji(averageGrade)}
          </Text>
          <Text style={styles.motivationText}>
            {averageGrade >= 90 
              ? "Excellent work! Keep it up!" 
              : averageGrade >= 80 
                ? "Great progress! Almost there!" 
                : "You're improving every day!"}
          </Text>
        </View>

        <View style={styles.motivationItem}>
          <Text style={styles.motivationEmoji}>
            {getStreakEmoji(streak)}
          </Text>
          <Text style={styles.motivationText}>
            {streak >= 30 
              ? "Amazing streak! You're unstoppable!" 
              : streak >= 14 
                ? "Your consistency is paying off!" 
                : streak >= 7 
                  ? "Building a great habit!" 
                  : "Keep the momentum going!"}
          </Text>
        </View>
      </View>

      {/* Weekly Goal */}
      <View style={styles.goalSection}>
        <View style={styles.goalHeader}>
          <Text style={styles.goalTitle}>🎯 Weekly Goal</Text>
          <Text style={styles.goalProgress}>4/7 days</Text>
        </View>
        <View style={styles.goalProgressBar}>
          <View style={[styles.goalProgressFill, { width: '57%' }]} />
        </View>
        <Text style={styles.goalDescription}>
          Study for at least 30 minutes daily
        </Text>
      </View>

      {/* Islamic Reminder */}
      <View style={styles.islamicReminder}>
        <Icon name="auto-awesome" size={16} color={COLORS.gold} />
        <Text style={styles.reminderText}>
          "Seek knowledge from the cradle to the grave" - Prophet Muhammad (PBUH)
        </Text>
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
  moreButton: {
    padding: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    position: 'relative',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statContent: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  trendContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  motivationSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  motivationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.gold}10`,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  motivationEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  motivationText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
  goalSection: {
    margin: 20,
    marginTop: 0,
    padding: 16,
    backgroundColor: `${COLORS.primary}08`,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  goalProgress: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  goalProgressBar: {
    height: 6,
    backgroundColor: `${COLORS.primary}30`,
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  goalDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  islamicReminder: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    marginTop: 0,
    padding: 12,
    backgroundColor: `${COLORS.gold}15`,
    borderRadius: 8,
  },
  reminderText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.text,
    fontStyle: 'italic',
    marginLeft: 8,
    lineHeight: 16,
  },
});