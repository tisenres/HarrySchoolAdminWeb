/**
 * ProfileScreen - Age-Adaptive Student Profile Management
 * Features cultural identity expression, achievement showcase, and privacy controls
 * Islamic values integration with Uzbek cultural context
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  SlideInUp,
  ZoomIn,
  BounceIn,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';

import { useStudentStore } from '../../store/studentStore';
import { useProfileData } from '../../hooks/useProfileData';
import { useAchievements } from '../../hooks/useAchievements';
import { useRankings } from '../../hooks/useRankings';
import { Student, Achievement, AgeGroup, CulturalPreferences } from '../../types';

const { width: screenWidth } = Dimensions.get('window');

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  // Store and data hooks
  const { 
    student, 
    culturalPreferences, 
    language, 
    updateProfile,
    updateCulturalPreferences 
  } = useStudentStore();
  const { 
    profileStats, 
    recentActivities, 
    isLoading, 
    error, 
    refreshProfile 
  } = useProfileData(student?.id);
  const { achievements, unlockedBadges, nextAchievements } = useAchievements(student?.id);
  const { currentRank, rankingHistory } = useRankings(student?.id);

  // State management
  const [refreshing, setRefreshing] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);

  // Animation values
  const fadeValue = useSharedValue(1);
  const profileScale = useSharedValue(0);
  const achievementScale = useSharedValue(0);

  // Age-appropriate configuration
  const ageGroup: AgeGroup = student?.age_group || 'middle';
  const isElementary = ageGroup === 'elementary';
  const isHighSchool = ageGroup === 'high';

  // Islamic greeting based on time
  const getIslamicGreeting = useCallback(() => {
    if (!culturalPreferences?.showIslamicGreetings) return `Hello, ${student?.first_name}!`;
    
    const hour = new Date().getHours();
    const name = student?.first_name || 'Student';
    
    if (hour < 12) return `Assalamu alaykum, ${name}!`;
    if (hour < 18) return `Ahlan wa sahlan, ${name}!`;
    return `Masa'a alkhayr, ${name}!`;
  }, [culturalPreferences, student]);

  // Initialize animations
  useEffect(() => {
    profileScale.value = withSpring(1, { duration: 800 });
    achievementScale.value = withSpring(1, { duration: 1000, delay: 200 });
  }, [profileScale, achievementScale]);

  // Get age-appropriate avatar options
  const getAvatarOptions = useMemo(() => {
    const baseOptions = [
      { id: 'student_1', source: require('../../assets/avatars/student_1.png'), culturallyAppropriate: true },
      { id: 'student_2', source: require('../../assets/avatars/student_2.png'), culturallyAppropriate: true },
      { id: 'student_3', source: require('../../assets/avatars/student_3.png'), culturallyAppropriate: true },
    ];

    // Filter based on cultural preferences and age appropriateness
    return baseOptions.filter(option => {
      if (culturalPreferences?.requireIslamicModesty && !option.culturallyAppropriate) {
        return false;
      }
      return true;
    });
  }, [culturalPreferences]);

  // Handle avatar change
  const handleAvatarChange = useCallback(async (avatarId: string) => {
    try {
      await updateProfile({ avatar_id: avatarId });
      setAvatarModalVisible(false);
      
      // Celebration animation
      profileScale.value = withSpring(1.1, { duration: 200 }, () => {
        profileScale.value = withSpring(1, { duration: 300 });
      });
      
      Alert.alert(
        culturalPreferences?.showIslamicGreetings ? 'Barakallahu feeki!' : 'Success!',
        'Your profile picture has been updated!',
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error) {
      console.error('Error updating avatar:', error);
      Alert.alert('Error', 'Unable to update profile picture');
    }
  }, [updateProfile, culturalPreferences, profileScale]);

  // Handle settings navigation
  const handleSettingsPress = useCallback(() => {
    navigation.navigate('Settings', {
      ageGroup,
      culturalPreferences
    });
  }, [navigation, ageGroup, culturalPreferences]);

  // Handle achievements view
  const handleAchievementsPress = useCallback(() => {
    navigation.navigate('Achievements', {
      achievements: unlockedBadges,
      nextAchievements,
      ageGroup
    });
  }, [navigation, unlockedBadges, nextAchievements, ageGroup]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
    } finally {
      setRefreshing(false);
    }
  }, [refreshProfile]);

  // Get achievement level color
  const getAchievementColor = (level: string): string => {
    const colors: Record<string, string> = {
      'bronze': '#cd7f32',
      'silver': '#c0c0c0',
      'gold': '#ffd700',
      'platinum': '#e5e4e2',
      'default': '#1d7452'
    };
    return colors[level] || colors.default;
  };

  // Animated styles
  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fadeValue.value,
  }));

  const profileScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: profileScale.value }],
  }));

  const achievementScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: achievementScale.value }],
  }));

  if (isLoading && !student) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#1d7452" />
        <Text style={[styles.loadingText, { fontSize: isElementary ? 18 : 16 }]}>
          Loading your profile...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Icon name="alert-circle" size={48} color="#e74c3c" />
        <Text style={[styles.errorText, { fontSize: isElementary ? 18 : 16 }]}>
          Unable to load profile
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View 
        style={styles.header}
        entering={FadeIn.delay(100)}
      >
        <LinearGradient
          colors={['#1d7452', '#2d8f61']}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <Text style={[styles.greeting, { fontSize: isElementary ? 20 : 18 }]}>
              {getIslamicGreeting()}
            </Text>
            
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={handleSettingsPress}
              accessibilityLabel="Open settings"
            >
              <Icon name="cog" size={isElementary ? 28 : 24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {culturalPreferences?.showIslamicDate && (
            <Text style={[styles.islamicDate, { fontSize: isElementary ? 14 : 12 }]}>
              {/* Islamic date would be calculated here */}
              Rajab 1446 AH
            </Text>
          )}
        </LinearGradient>
      </Animated.View>

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#1d7452']}
            tintColor="#1d7452"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <Animated.View 
          style={[styles.profileCard, profileScaleStyle]}
          entering={SlideInUp.delay(200)}
        >
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => setAvatarModalVisible(true)}
            disabled={isElementary && !culturalPreferences?.allowElementaryCustomization}
            accessibilityLabel="Change profile picture"
          >
            <Image
              source={student?.avatar_url ? { uri: student.avatar_url } : require('../../assets/avatars/default.png')}
              style={[
                styles.avatar,
                { 
                  width: isElementary ? 100 : 80, 
                  height: isElementary ? 100 : 80 
                }
              ]}
            />
            {(!isElementary || culturalPreferences?.allowElementaryCustomization) && (
              <View style={styles.avatarEditBadge}>
                <Icon name="camera" size={16} color="#ffffff" />
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <Text style={[styles.studentName, { fontSize: isElementary ? 24 : 22 }]}>
              {student?.first_name} {student?.last_name}
            </Text>
            
            <Text style={[styles.studentDetails, { fontSize: isElementary ? 16 : 14 }]}>
              {student?.grade ? `Grade ${student.grade}` : 'Student'} • 
              {student?.age ? ` ${student.age} years old` : ''}
            </Text>

            {currentRank && (
              <View style={styles.rankBadge}>
                <Icon name="trophy" size={isElementary ? 20 : 16} color="#ffd700" />
                <Text style={[styles.rankText, { fontSize: isElementary ? 14 : 12 }]}>
                  Rank #{currentRank.position}
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Quick Stats */}
        <Animated.View 
          style={styles.quickStatsContainer}
          entering={SlideInUp.delay(300)}
        >
          <Text style={[styles.sectionTitle, { fontSize: isElementary ? 20 : 18 }]}>
            Your Progress
          </Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Icon name="calendar-check" size={isElementary ? 32 : 28} color="#1d7452" />
              <Text style={[styles.statValue, { fontSize: isElementary ? 20 : 18 }]}>
                {profileStats?.attendance_rate ? `${Math.round(profileStats.attendance_rate * 100)}%` : '0%'}
              </Text>
              <Text style={[styles.statLabel, { fontSize: isElementary ? 14 : 12 }]}>
                Attendance
              </Text>
            </View>

            <View style={styles.statCard}>
              <Icon name="book-alphabet" size={isElementary ? 32 : 28} color="#3498db" />
              <Text style={[styles.statValue, { fontSize: isElementary ? 20 : 18 }]}>
                {profileStats?.vocabulary_learned || 0}
              </Text>
              <Text style={[styles.statLabel, { fontSize: isElementary ? 14 : 12 }]}>
                Words Learned
              </Text>
            </View>

            <View style={styles.statCard}>
              <Icon name="fire" size={isElementary ? 32 : 28} color="#e74c3c" />
              <Text style={[styles.statValue, { fontSize: isElementary ? 20 : 18 }]}>
                {profileStats?.current_streak || 0}
              </Text>
              <Text style={[styles.statLabel, { fontSize: isElementary ? 14 : 12 }]}>
                Day Streak
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Achievements Section */}
        <Animated.View 
          style={[styles.achievementsContainer, achievementScaleStyle]}
          entering={SlideInUp.delay(400)}
        >
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={handleAchievementsPress}
            accessibilityLabel="View all achievements"
          >
            <View style={styles.sectionHeaderLeft}>
              <Icon name="trophy-award" size={isElementary ? 28 : 24} color="#1d7452" />
              <Text style={[styles.sectionTitle, { fontSize: isElementary ? 20 : 18 }]}>
                Achievements
              </Text>
              <View style={[styles.badge, { backgroundColor: '#ffd700' }]}>
                <Text style={styles.badgeText}>{unlockedBadges?.length || 0}</Text>
              </View>
            </View>
            <Icon name="chevron-right" size={isElementary ? 28 : 24} color="#6c757d" />
          </TouchableOpacity>

          {unlockedBadges && unlockedBadges.length > 0 ? (
            <View style={styles.achievementsList}>
              {unlockedBadges.slice(0, isElementary ? 3 : 4).map((achievement, index) => (
                <Animated.View
                  key={achievement.id}
                  style={styles.achievementItem}
                  entering={ZoomIn.delay(500 + index * 100)}
                >
                  <View style={[
                    styles.achievementIcon,
                    { backgroundColor: getAchievementColor(achievement.level) }
                  ]}>
                    <Icon 
                      name={achievement.icon || 'star'} 
                      size={isElementary ? 24 : 20} 
                      color="#ffffff" 
                    />
                  </View>
                  <View style={styles.achievementContent}>
                    <Text style={[styles.achievementName, { fontSize: isElementary ? 16 : 14 }]}>
                      {achievement.name}
                    </Text>
                    <Text style={[styles.achievementDescription, { fontSize: isElementary ? 14 : 12 }]}>
                      {achievement.description}
                    </Text>
                  </View>
                  {achievement.level && (
                    <View style={[
                      styles.achievementBadge,
                      { backgroundColor: getAchievementColor(achievement.level) }
                    ]}>
                      <Text style={styles.achievementBadgeText}>
                        {achievement.level.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </Animated.View>
              ))}
              
              {unlockedBadges.length > (isElementary ? 3 : 4) && (
                <TouchableOpacity
                  style={styles.showMoreButton}
                  onPress={handleAchievementsPress}
                >
                  <Text style={[styles.showMoreText, { fontSize: isElementary ? 16 : 14 }]}>
                    View All {unlockedBadges.length} Achievements
                  </Text>
                  <Icon name="arrow-right" size={isElementary ? 24 : 20} color="#1d7452" />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Icon name="trophy-outline" size={48} color="#bdc3c7" />
              <Text style={[styles.emptyStateText, { fontSize: isElementary ? 16 : 14 }]}>
                Start learning to unlock achievements!
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Recent Activities - High School Only */}
        {isHighSchool && recentActivities && recentActivities.length > 0 && (
          <Animated.View 
            style={styles.activitiesContainer}
            entering={SlideInUp.delay(600)}
          >
            <Text style={[styles.sectionTitle, { fontSize: 18 }]}>
              Recent Activity
            </Text>
            
            <View style={styles.activitiesList}>
              {recentActivities.slice(0, 5).map((activity, index) => (
                <View key={activity.id} style={styles.activityItem}>
                  <View style={[
                    styles.activityIcon,
                    { backgroundColor: getActivityColor(activity.type) }
                  ]}>
                    <Icon 
                      name={getActivityIcon(activity.type)} 
                      size={16} 
                      color="#ffffff" 
                    />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={[styles.activityText, { fontSize: 14 }]}>
                      {activity.description}
                    </Text>
                    <Text style={[styles.activityTime, { fontSize: 12 }]}>
                      {formatActivityTime(activity.created_at)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Quick Actions */}
        <Animated.View 
          style={styles.quickActionsContainer}
          entering={BounceIn.delay(700)}
        >
          <Text style={[styles.sectionTitle, { fontSize: isElementary ? 20 : 18 }]}>
            Quick Actions
          </Text>
          
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={[styles.quickActionButton, { minHeight: isElementary ? 80 : 70 }]}
              onPress={() => navigation.navigate('Feedback')}
              accessibilityLabel="Give feedback"
            >
              <Icon name="comment-text" size={isElementary ? 32 : 28} color="#1d7452" />
              <Text style={[styles.quickActionText, { fontSize: isElementary ? 16 : 14 }]}>
                Feedback
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionButton, { minHeight: isElementary ? 80 : 70 }]}
              onPress={() => navigation.navigate('Referrals')}
              accessibilityLabel="Refer friends"
            >
              <Icon name="account-plus" size={isElementary ? 32 : 28} color="#3498db" />
              <Text style={[styles.quickActionText, { fontSize: isElementary ? 16 : 14 }]}>
                Refer Friend
              </Text>
            </TouchableOpacity>

            {!isElementary && (
              <TouchableOpacity
                style={[styles.quickActionButton, { minHeight: isElementary ? 80 : 70 }]}
                onPress={() => navigation.navigate('Goals')}
                accessibilityLabel="Set goals"
              >
                <Icon name="target" size={28} color="#e74c3c" />
                <Text style={[styles.quickActionText, { fontSize: 14 }]}>
                  Set Goals
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
};

// Helper functions
const getActivityColor = (type: string): string => {
  const colors: Record<string, string> = {
    'vocabulary': '#1d7452',
    'attendance': '#27ae60',
    'achievement': '#ffd700',
    'assignment': '#3498db',
    'default': '#95a5a6'
  };
  return colors[type] || colors.default;
};

const getActivityIcon = (type: string): string => {
  const icons: Record<string, string> = {
    'vocabulary': 'book-alphabet',
    'attendance': 'calendar-check',
    'achievement': 'trophy',
    'assignment': 'file-document',
    'default': 'information'
  };
  return icons[type] || icons.default;
};

const formatActivityTime = (timestamp: string): string => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return `${Math.floor(diffInHours / 24)}d ago`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    height: 120,
    marginBottom: -40,
  },
  headerGradient: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
    justifyContent: 'space-between',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    color: '#ffffff',
    fontWeight: '700',
  },
  islamicDate: {
    color: '#ffffff',
    opacity: 0.9,
    textAlign: 'center',
  },
  settingsButton: {
    padding: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 60,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#1d7452',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1d7452',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  profileInfo: {
    alignItems: 'center',
  },
  studentName: {
    fontWeight: '700',
    color: '#2d4150',
    marginBottom: 4,
    textAlign: 'center',
  },
  studentDetails: {
    color: '#6c757d',
    marginBottom: 8,
    textAlign: 'center',
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  rankText: {
    color: '#856404',
    fontWeight: '600',
    marginLeft: 4,
  },
  quickStatsContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#2d4150',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontWeight: '700',
    color: '#2d4150',
    marginVertical: 4,
  },
  statLabel: {
    color: '#6c757d',
    textAlign: 'center',
  },
  achievementsContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  achievementsList: {
    paddingBottom: 8,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  achievementContent: {
    flex: 1,
  },
  achievementName: {
    fontWeight: '600',
    color: '#2d4150',
    marginBottom: 2,
  },
  achievementDescription: {
    color: '#6c757d',
  },
  achievementBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    color: '#6c757d',
    marginTop: 12,
    textAlign: 'center',
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  showMoreText: {
    color: '#1d7452',
    fontWeight: '600',
    marginRight: 8,
  },
  activitiesContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activitiesList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    color: '#2d4150',
    marginBottom: 2,
  },
  activityTime: {
    color: '#6c757d',
  },
  quickActionsContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    minWidth: screenWidth * 0.25,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  quickActionText: {
    color: '#2d4150',
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingText: {
    color: '#6c757d',
    marginTop: 16,
  },
  errorText: {
    color: '#e74c3c',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#1d7452',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;