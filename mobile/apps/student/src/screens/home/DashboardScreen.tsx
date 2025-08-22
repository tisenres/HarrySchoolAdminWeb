import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useAuthStore } from '../../store/authStore';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/design';

const { width } = Dimensions.get('window');

interface QuickAction {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}

interface StatCardProps {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  trend?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, trend }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View 
      style={[
        styles.statCard, 
        { transform: [{ scale: scaleAnim }] }
      ]}
    >
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        {trend && (
          <Text style={[styles.trend, { color }]}>
            {trend}
          </Text>
        )}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </Animated.View>
  );
};

const RankingCard: React.FC<{
  points: number;
  coins: number;
  rank: number;
  level: number;
  totalStudents: number;
}> = ({ points, coins, rank, level, totalStudents }) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: false,
    }).start();
  }, []);

  const levelProgress = ((points % 1000) / 1000) * 100;
  
  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.primaryLight]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.rankingCard}
    >
      <View style={styles.rankingHeader}>
        <View>
          <Text style={styles.rankingTitle}>Your Ranking</Text>
          <Text style={styles.rankingSubtitle}>
            #{rank} of {totalStudents} students
          </Text>
        </View>
        <View style={styles.coinsContainer}>
          <Ionicons name="diamond" size={20} color={COLORS.gold} />
          <Text style={styles.coinsText}>{coins}</Text>
        </View>
      </View>
      
      <View style={styles.levelContainer}>
        <Text style={styles.levelText}>Level {level}</Text>
        <Text style={styles.pointsText}>{points.toLocaleString()} points</Text>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View 
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', `${levelProgress}%`],
                }),
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round(levelProgress)}% to Level {level + 1}
        </Text>
      </View>
    </LinearGradient>
  );
};

export default function DashboardScreen() {
  const { user, studentProfile } = useAuthStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  if (!studentProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  const quickActions: QuickAction[] = [
    {
      id: '1',
      title: 'Start Lesson',
      icon: 'play-circle',
      color: COLORS.success,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      },
    },
    {
      id: '2',
      title: 'Practice Words',
      icon: 'library',
      color: COLORS.primary,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      },
    },
    {
      id: '3',
      title: 'Take Quiz',
      icon: 'help-circle',
      color: COLORS.warning,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      },
    },
    {
      id: '4',
      title: 'View Rewards',
      icon: 'gift',
      color: COLORS.gold,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      },
    },
  ];

  const todayStats = [
    {
      title: 'Lessons Today',
      value: '3',
      icon: 'book' as keyof typeof Ionicons.glyphMap,
      color: COLORS.primary,
      trend: '+2',
    },
    {
      title: 'Points Earned',
      value: '250',
      icon: 'star' as keyof typeof Ionicons.glyphMap,
      color: COLORS.gold,
      trend: '+15%',
    },
    {
      title: 'Streak',
      value: `${studentProfile.streak}`,
      icon: 'flame' as keyof typeof Ionicons.glyphMap,
      color: COLORS.error,
      trend: 'New!',
    },
    {
      title: 'Accuracy',
      value: `${studentProfile.averageGrade}%`,
      icon: 'checkmark-circle' as keyof typeof Ionicons.glyphMap,
      color: COLORS.success,
      trend: '+3%',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <View>
          <Text style={styles.greeting}>
            Good morning, {user?.firstName || 'Student'}! 👋
          </Text>
          <Text style={styles.subGreeting}>
            Ready to continue learning?
          </Text>
        </View>
        
        <TouchableOpacity style={styles.profileButton}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileInitial}>
              {user?.firstName?.charAt(0) || 'S'}
            </Text>
          </View>
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationText}>3</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Ranking Card */}
        <RankingCard 
          points={studentProfile.points}
          coins={studentProfile.coins}
          rank={studentProfile.rank}
          level={studentProfile.level}
          totalStudents={studentProfile.totalStudents}
        />

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <Animated.View
                key={action.id}
                style={{
                  opacity: fadeAnim,
                  transform: [{
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50 + (index * 10), 0],
                    }),
                  }],
                }}
              >
                <TouchableOpacity 
                  style={[
                    styles.actionButton,
                    { backgroundColor: `${action.color}15` }
                  ]}
                  onPress={action.onPress}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                    <Ionicons name={action.icon} size={24} color={COLORS.white} />
                  </View>
                  <Text style={[styles.actionText, { color: action.color }]}>
                    {action.title}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Today's Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Progress</Text>
          <View style={styles.statsGrid}>
            {todayStats.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </View>
        </View>

        {/* Upcoming Lessons */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Lessons</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.lessonCard}>
            <View style={styles.lessonTimeContainer}>
              <Text style={styles.lessonTime}>2:00 PM</Text>
              <Text style={styles.lessonDate}>Today</Text>
            </View>
            <View style={styles.lessonInfo}>
              <Text style={styles.lessonTitle}>English Grammar</Text>
              <Text style={styles.lessonSubtitle}>Present Perfect Tense</Text>
              <View style={styles.lessonMeta}>
                <Ionicons name="person" size={14} color={COLORS.textSecondary} />
                <Text style={styles.lessonTeacher}>Ms. Johnson</Text>
                <View style={styles.lessonDuration}>
                  <Ionicons name="time" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.durationText}>45 min</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.joinButton}>
              <Text style={styles.joinButtonText}>Join</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Achievements */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Achievements</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.achievementsContainer}
          >
            {[
              { title: 'First Quiz', icon: 'trophy', color: COLORS.gold },
              { title: '7 Day Streak', icon: 'flame', color: COLORS.error },
              { title: 'Word Master', icon: 'library', color: COLORS.primary },
            ].map((achievement, index) => (
              <View key={index} style={styles.achievementCard}>
                <LinearGradient
                  colors={[achievement.color, `${achievement.color}80`]}
                  style={styles.achievementIcon}
                >
                  <Ionicons name={achievement.icon as any} size={24} color={COLORS.white} />
                </LinearGradient>
                <Text style={styles.achievementTitle}>{achievement.title}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.base,
  },
  greeting: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
  },
  subGreeting: {
    fontSize: TYPOGRAPHY.base,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  profileButton: {
    position: 'relative',
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.white,
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    marginBottom: SPACING['2xl'],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.base,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
  },
  seeAllText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.primary,
  },
  
  // Ranking Card
  rankingCard: {
    margin: SPACING.xl,
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.lg,
  },
  rankingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  rankingTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.white,
  },
  rankingSubtitle: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: SPACING.xs,
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  coinsText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.white,
    marginLeft: SPACING.xs,
  },
  levelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  levelText: {
    fontSize: TYPOGRAPHY['2xl'],
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.white,
  },
  pointsText: {
    fontSize: TYPOGRAPHY.base,
    color: COLORS.white,
    opacity: 0.9,
  },
  progressContainer: {
    marginTop: SPACING.base,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.full,
  },
  progressText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: SPACING.sm,
  },
  
  // Quick Actions
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.xl,
    justifyContent: 'space-between',
  },
  actionButton: {
    width: (width - SPACING.xl * 2 - SPACING.base) / 2,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    marginBottom: SPACING.base,
    ...SHADOWS.sm,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  actionText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semiBold,
    textAlign: 'center',
  },
  
  // Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.xl,
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - SPACING.xl * 2 - SPACING.base) / 2,
    backgroundColor: COLORS.white,
    padding: SPACING.base,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.base,
    ...SHADOWS.sm,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trend: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semiBold,
  },
  statValue: {
    fontSize: TYPOGRAPHY['2xl'],
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  statTitle: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
  },
  
  // Lesson Card
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.xl,
    padding: SPACING.base,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  lessonTimeContainer: {
    alignItems: 'center',
    marginRight: SPACING.base,
    minWidth: 60,
  },
  lessonTime: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.primary,
  },
  lessonDate: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
  },
  lessonInfo: {
    flex: 1,
    marginRight: SPACING.base,
  },
  lessonTitle: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  lessonSubtitle: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lessonTeacher: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
    marginRight: SPACING.md,
  },
  lessonDuration: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  joinButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.base,
  },
  joinButtonText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semiBold,
    color: COLORS.white,
  },
  
  // Achievements
  achievementsContainer: {
    paddingHorizontal: SPACING.xl,
  },
  achievementCard: {
    alignItems: 'center',
    marginRight: SPACING.base,
    width: 80,
  },
  achievementIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  achievementTitle: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  
  bottomSpacing: {
    height: SPACING.xl,
  },
});