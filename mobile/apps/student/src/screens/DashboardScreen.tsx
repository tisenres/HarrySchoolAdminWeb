import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Import dashboard components
import RankingCard from '../components/RankingCard';
import TodayScheduleCard from '../components/TodayScheduleCard';
import QuickStatsCard from '../components/QuickStatsCard';
import PendingTasksCard from '../components/PendingTasksCard';
import RecentAchievementsCard from '../components/RecentAchievementsCard';
import DashboardHeader from '../components/DashboardHeader';
import SyncStatusIndicator from '../components/SyncStatusIndicator';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#1d7452',
  secondary: '#2d9e6a',
  gold: '#f7c52d',
  background: '#f8fafc',
  white: '#ffffff',
  text: '#1a1a1a',
  textSecondary: '#64748b',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  lightGreen: '#dcfce7',
  lightBlue: '#dbeafe',
  lightPurple: '#f3e8ff',
  lightOrange: '#fed7aa',
};

export default function DashboardScreen() {
  // Mock data - in real app this would come from API/store
  const studentData = {
    name: 'Ahmed Al-Rashid',
    level: 12,
    points: 2847,
    coins: 156,
    rank: 8,
    totalStudents: 245,
    attendancePercentage: 94,
    averageGrade: 87,
    streak: 12,
  };

  const quickActions = [
    { id: 1, title: 'Start Lesson', icon: 'play-circle-filled', color: COLORS.success },
    { id: 2, title: 'Practice Words', icon: 'library-books', color: COLORS.primary },
    { id: 3, title: 'Take Quiz', icon: 'quiz', color: COLORS.warning },
    { id: 4, title: 'View Rewards', icon: 'card-giftcard', color: COLORS.gold },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <DashboardHeader 
        studentName={studentData.name}
        level={studentData.level}
        coins={studentData.coins}
      />

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Sync Status */}
        <SyncStatusIndicator />

        {/* Ranking Card */}
        <RankingCard 
          points={studentData.points}
          coins={studentData.coins}
          rank={studentData.rank}
          totalStudents={studentData.totalStudents}
          level={studentData.level}
        />

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map(action => (
              <TouchableOpacity 
                key={action.id} 
                style={[styles.actionButton, { backgroundColor: `${action.color}15` }]}
                activeOpacity={0.7}
              >
                <Icon name={action.icon} size={28} color={action.color} />
                <Text style={[styles.actionText, { color: action.color }]}>
                  {action.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Today's Schedule */}
        <TodayScheduleCard />

        {/* Quick Stats */}
        <QuickStatsCard 
          attendancePercentage={studentData.attendancePercentage}
          averageGrade={studentData.averageGrade}
          streak={studentData.streak}
        />

        {/* Pending Tasks */}
        <PendingTasksCard />

        {/* Recent Achievements */}
        <RecentAchievementsCard />

        {/* Islamic Greeting */}
        <View style={styles.islamicGreeting}>
          <Icon name="star" size={24} color={COLORS.gold} />
          <Text style={styles.greetingText}>
            "And whoever relies upon Allah - then He is sufficient for him"
          </Text>
          <Text style={styles.greetingSource}>Quran 65:3</Text>
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  quickActions: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: (width - 48) / 2,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  islamicGreeting: {
    margin: 16,
    padding: 20,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.gold,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  greetingText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: COLORS.text,
    textAlign: 'center',
    marginVertical: 8,
    lineHeight: 24,
  },
  greetingSource: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 20,
  },
});