/**
 * Profile Stack Navigator for Harry School Student App
 * 
 * Handles the Profile tab navigation (2% usage priority).
 * Focuses on progress tracking, rewards, settings, and account management.
 */

import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

// Shared components and theme
import { theme } from '@harry-school/ui';
import { useAuth } from '@harry-school/shared';

// Screen components (will be implemented in separate files)
import { ProfileOverviewScreen } from '../screens/profile/ProfileOverviewScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { ProgressTrackingScreen } from '../screens/profile/ProgressTrackingScreen';
import { AchievementGalleryScreen } from '../screens/profile/AchievementGalleryScreen';
import { BadgeCollectionScreen } from '../screens/profile/BadgeCollectionScreen';
import { LearningStatsScreen } from '../screens/profile/LearningStatsScreen';
import { ReferralProgramScreen } from '../screens/profile/ReferralProgramScreen';
import { InviteFriendsScreen } from '../screens/profile/InviteFriendsScreen';
import { RedeemRewardsScreen } from '../screens/profile/RedeemRewardsScreen';
import { RewardHistoryScreen } from '../screens/profile/RewardHistoryScreen';
import { PointsHistoryScreen } from '../screens/profile/PointsHistoryScreen';
import { CoinBalanceScreen } from '../screens/profile/CoinBalanceScreen';
import { FeedbackHistoryScreen } from '../screens/profile/FeedbackHistoryScreen';
import { TeacherRatingsScreen } from '../screens/profile/TeacherRatingsScreen';
import { CourseRatingsScreen } from '../screens/profile/CourseRatingsScreen';
import { AccountSettingsScreen } from '../screens/profile/AccountSettingsScreen';
import { PrivacySettingsScreen } from '../screens/profile/PrivacySettingsScreen';
import { ParentalControlsScreen } from '../screens/profile/ParentalControlsScreen';
import { DataExportScreen } from '../screens/profile/DataExportScreen';
import { DeleteAccountScreen } from '../screens/profile/DeleteAccountScreen';

// Types
import type { ProfileStackParamList, ProfileStackScreenProps } from './types';

// Analytics and services
import { profileAnalytics } from '../services/profile-analytics';
import { rewardsService } from '../services/rewards-service';

// Icons
import Icon from 'react-native-vector-icons/Ionicons';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

// =====================================================
// HEADER CONFIGURATION
// =====================================================

const getHeaderOptions = (title: string, showBackButton: boolean = true) => ({
  title,
  headerShown: true,
  headerStyle: {
    backgroundColor: theme.colors.white,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTitleStyle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: theme.colors.neutral[900],
  },
  headerBackTitle: 'Back',
  headerBackTitleVisible: false,
  headerTintColor: theme.colors.green[600],
  headerLeft: showBackButton ? undefined : () => null,
});

// =====================================================
// CUSTOM HEADER COMPONENTS
// =====================================================

interface ProfileOverviewHeaderProps {
  navigation: any;
  studentName?: string;
  level?: number;
  points?: number;
  coins?: number;
}

const ProfileOverviewHeader: React.FC<ProfileOverviewHeaderProps> = ({ 
  navigation, 
  studentName,
  level = 1,
  points = 0,
  coins = 0
}) => {
  const handleEditPress = useCallback(() => {
    navigation.navigate('EditProfile');
  }, [navigation]);

  const handleSettingsPress = useCallback(() => {
    navigation.navigate('AccountSettings');
  }, [navigation]);

  const handleRewardsPress = useCallback(() => {
    navigation.navigate('RedeemRewards');
  }, [navigation]);

  return (
    <View style={styles.profileHeader}>
      <View style={styles.profileHeaderTop}>
        <View style={styles.profileHeaderLeft}>
          <Text style={styles.profileTitle}>Profile</Text>
          <Text style={styles.profileSubtitle}>
            Level {level} • {points} points • {coins} coins
          </Text>
        </View>
        <View style={styles.profileHeaderRight}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleRewardsPress}
            accessibilityLabel="View rewards"
            accessibilityRole="button"
          >
            <Icon name="gift-outline" size={24} color={theme.colors.green[600]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleEditPress}
            accessibilityLabel="Edit profile"
            accessibilityRole="button"
          >
            <Icon name="create-outline" size={24} color={theme.colors.green[600]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleSettingsPress}
            accessibilityLabel="Account settings"
            accessibilityRole="button"
          >
            <Icon name="settings-outline" size={24} color={theme.colors.green[600]} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// =====================================================
// HEADER RIGHT ACTIONS
// =====================================================

interface HeaderRightProps {
  navigation: any;
  route: any;
}

const getHeaderRight = (screenName: string) => ({ navigation, route }: HeaderRightProps) => {
  switch (screenName) {
    case 'EditProfile':
      return (
        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => {
            // Save profile changes
          }}
          accessibilityLabel="Save changes"
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      );
    
    case 'ProgressTracking':
      return (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {
            // Export progress report
          }}
          accessibilityLabel="Export progress"
        >
          <Icon name="download-outline" size={24} color={theme.colors.green[600]} />
        </TouchableOpacity>
      );
    
    case 'AchievementGallery':
    case 'BadgeCollection':
      return (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {
            // Share achievements
          }}
          accessibilityLabel="Share achievements"
        >
          <Icon name="share-outline" size={24} color={theme.colors.green[600]} />
        </TouchableOpacity>
      );
    
    case 'ReferralProgram':
      return (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate('InviteFriends')}
          accessibilityLabel="Invite friends"
        >
          <Icon name="person-add-outline" size={24} color={theme.colors.green[600]} />
        </TouchableOpacity>
      );
    
    case 'RedeemRewards':
      return (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate('RewardHistory')}
          accessibilityLabel="Reward history"
        >
          <Icon name="time-outline" size={24} color={theme.colors.green[600]} />
        </TouchableOpacity>
      );
    
    case 'AccountSettings':
      return (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {
            Alert.alert(
              'Sign Out',
              'Are you sure you want to sign out?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Sign Out', 
                  style: 'destructive',
                  onPress: () => {
                    // Handle sign out
                  }
                },
              ]
            );
          }}
          accessibilityLabel="Sign out"
        >
          <Icon name="log-out-outline" size={24} color={theme.colors.red[600]} />
        </TouchableOpacity>
      );
    
    case 'DataExport':
      return (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {
            // Start data export
          }}
          accessibilityLabel="Start export"
        >
          <Icon name="download-outline" size={24} color={theme.colors.green[600]} />
        </TouchableOpacity>
      );
    
    default:
      return null;
  }
};

// =====================================================
// MAIN PROFILE STACK NAVIGATOR
// =====================================================

interface ProfileStackNavigatorProps {}

export const ProfileStackNavigator: React.FC<ProfileStackNavigatorProps> = () => {
  const { getStudentProfile, updateActivity, signOut } = useAuth();
  const studentProfile = getStudentProfile();

  // Track profile section usage
  useFocusEffect(
    useCallback(() => {
      profileAnalytics.trackProfileSectionEnter();
      updateActivity();
      
      return () => {
        profileAnalytics.trackProfileSectionExit();
      };
    }, [updateActivity])
  );

  return (
    <Stack.Navigator
      initialRouteName="ProfileOverview"
      screenOptions={{
        gestureEnabled: true,
        animation: 'slide_from_right',
        contentStyle: {
          backgroundColor: theme.colors.neutral[50],
        },
      }}
    >
      {/* =====================================================
          MAIN PROFILE OVERVIEW (Entry Point)
          ===================================================== */}
      <Stack.Screen
        name="ProfileOverview"
        component={ProfileOverviewScreen}
        options={({ navigation }) => ({
          headerShown: true,
          header: () => (
            <ProfileOverviewHeader
              navigation={navigation}
              studentName={studentProfile?.firstName}
              level={studentProfile?.level || 1}
              points={studentProfile?.points || 0}
              coins={studentProfile?.coins || 0}
            />
          ),
        })}
      />

      {/* =====================================================
          PROFILE MANAGEMENT
          ===================================================== */}
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={({ navigation, route }) => ({
          ...getHeaderOptions('Edit Profile'),
          headerRight: getHeaderRight('EditProfile')({ navigation, route }),
        })}
      />

      {/* =====================================================
          PROGRESS AND STATISTICS
          ===================================================== */}
      <Stack.Screen
        name="ProgressTracking"
        component={ProgressTrackingScreen}
        options={({ navigation, route }) => ({
          ...getHeaderOptions('Progress Tracking'),
          headerRight: getHeaderRight('ProgressTracking')({ navigation, route }),
        })}
      />

      <Stack.Screen
        name="LearningStats"
        component={LearningStatsScreen}
        options={getHeaderOptions('Learning Statistics')}
      />

      {/* =====================================================
          ACHIEVEMENTS AND REWARDS
          ===================================================== */}
      <Stack.Screen
        name="AchievementGallery"
        component={AchievementGalleryScreen}
        options={({ navigation, route }) => ({
          ...getHeaderOptions('Achievements'),
          headerRight: getHeaderRight('AchievementGallery')({ navigation, route }),
        })}
      />

      <Stack.Screen
        name="BadgeCollection"
        component={BadgeCollectionScreen}
        options={({ navigation, route }) => ({
          ...getHeaderOptions('Badge Collection'),
          headerRight: getHeaderRight('BadgeCollection')({ navigation, route }),
        })}
      />

      <Stack.Screen
        name="RedeemRewards"
        component={RedeemRewardsScreen}
        options={({ navigation, route }) => ({
          ...getHeaderOptions('Redeem Rewards'),
          headerRight: getHeaderRight('RedeemRewards')({ navigation, route }),
        })}
      />

      <Stack.Screen
        name="RewardHistory"
        component={RewardHistoryScreen}
        options={getHeaderOptions('Reward History')}
      />

      <Stack.Screen
        name="PointsHistory"
        component={PointsHistoryScreen}
        options={getHeaderOptions('Points History')}
      />

      <Stack.Screen
        name="CoinBalance"
        component={CoinBalanceScreen}
        options={getHeaderOptions('Coin Balance')}
      />

      {/* =====================================================
          SOCIAL AND REFERRALS
          ===================================================== */}
      <Stack.Screen
        name="ReferralProgram"
        component={ReferralProgramScreen}
        options={({ navigation, route }) => ({
          ...getHeaderOptions('Referral Program'),
          headerRight: getHeaderRight('ReferralProgram')({ navigation, route }),
        })}
      />

      <Stack.Screen
        name="InviteFriends"
        component={InviteFriendsScreen}
        options={getHeaderOptions('Invite Friends')}
      />

      {/* =====================================================
          FEEDBACK AND RATINGS
          ===================================================== */}
      <Stack.Screen
        name="FeedbackHistory"
        component={FeedbackHistoryScreen}
        options={getHeaderOptions('Feedback History')}
      />

      <Stack.Screen
        name="TeacherRatings"
        component={TeacherRatingsScreen}
        options={getHeaderOptions('Teacher Ratings')}
      />

      <Stack.Screen
        name="CourseRatings"
        component={CourseRatingsScreen}
        options={getHeaderOptions('Course Ratings')}
      />

      {/* =====================================================
          SETTINGS AND SECURITY
          ===================================================== */}
      <Stack.Screen
        name="AccountSettings"
        component={AccountSettingsScreen}
        options={({ navigation, route }) => ({
          ...getHeaderOptions('Account Settings'),
          headerRight: getHeaderRight('AccountSettings')({ navigation, route }),
        })}
      />

      <Stack.Screen
        name="PrivacySettings"
        component={PrivacySettingsScreen}
        options={getHeaderOptions('Privacy Settings')}
      />

      <Stack.Screen
        name="ParentalControls"
        component={ParentalControlsScreen}
        options={getHeaderOptions('Parental Controls')}
      />

      {/* =====================================================
          DATA MANAGEMENT
          ===================================================== */}
      <Stack.Screen
        name="DataExport"
        component={DataExportScreen}
        options={({ navigation, route }) => ({
          ...getHeaderOptions('Export Data'),
          headerRight: getHeaderRight('DataExport')({ navigation, route }),
        })}
      />

      <Stack.Screen
        name="DeleteAccount"
        component={DeleteAccountScreen}
        options={{
          ...getHeaderOptions('Delete Account'),
          headerStyle: {
            backgroundColor: theme.colors.red[50],
          },
          headerTitleStyle: {
            color: theme.colors.red[700],
            fontWeight: '700',
          },
          headerTintColor: theme.colors.red[600],
        }}
      />
    </Stack.Navigator>
  );
};

// =====================================================
// PLACEHOLDER SCREEN COMPONENTS
// =====================================================
// These will be moved to separate files in the screens/profile directory

const PlaceholderScreen: React.FC<{ 
  title: string; 
  description?: string;
  iconName?: string;
  isDestructive?: boolean;
}> = ({ title, description, iconName = 'person-outline', isDestructive = false }) => (
  <View style={styles.placeholderContainer}>
    <Icon 
      name={iconName} 
      size={64} 
      color={isDestructive ? theme.colors.red[400] : theme.colors.green[400]} 
      style={styles.placeholderIcon}
    />
    <Text 
      style={[
        styles.placeholderTitle,
        isDestructive && { color: theme.colors.red[600] }
      ]}
    >
      {title}
    </Text>
    {description && (
      <Text style={styles.placeholderDescription}>{description}</Text>
    )}
    <Text style={styles.placeholderSubtitle}>Screen implementation coming soon</Text>
  </View>
);

// Temporary placeholder implementations
export const ProfileOverviewScreen = () => (
  <PlaceholderScreen 
    title="Profile Overview" 
    description="Student profile, progress, and quick access to key features"
    iconName="person"
  />
);

export const EditProfileScreen = () => (
  <PlaceholderScreen 
    title="Edit Profile" 
    description="Update personal information and preferences"
    iconName="create-outline"
  />
);

export const ProgressTrackingScreen = () => (
  <PlaceholderScreen 
    title="Progress Tracking" 
    description="Detailed learning progress and milestone tracking"
    iconName="trending-up-outline"
  />
);

export const AchievementGalleryScreen = () => (
  <PlaceholderScreen 
    title="Achievement Gallery" 
    description="Showcase of earned achievements and milestones"
    iconName="trophy-outline"
  />
);

export const BadgeCollectionScreen = () => (
  <PlaceholderScreen 
    title="Badge Collection" 
    description="Collection of earned badges and certifications"
    iconName="medal-outline"
  />
);

export const LearningStatsScreen = () => (
  <PlaceholderScreen 
    title="Learning Statistics" 
    description="Detailed analytics of learning activities and performance"
    iconName="analytics-outline"
  />
);

export const ReferralProgramScreen = () => (
  <PlaceholderScreen 
    title="Referral Program" 
    description="Invite friends and earn rewards for referrals"
    iconName="people-outline"
  />
);

export const InviteFriendsScreen = () => (
  <PlaceholderScreen 
    title="Invite Friends" 
    description="Share referral codes and invite friends to join"
    iconName="person-add-outline"
  />
);

export const RedeemRewardsScreen = () => (
  <PlaceholderScreen 
    title="Redeem Rewards" 
    description="Browse and redeem available rewards with earned coins"
    iconName="gift-outline"
  />
);

export const RewardHistoryScreen = () => (
  <PlaceholderScreen 
    title="Reward History" 
    description="History of redeemed rewards and transactions"
    iconName="receipt-outline"
  />
);

export const PointsHistoryScreen = () => (
  <PlaceholderScreen 
    title="Points History" 
    description="Track points earned from various activities"
    iconName="star-outline"
  />
);

export const CoinBalanceScreen = () => (
  <PlaceholderScreen 
    title="Coin Balance" 
    description="Current coin balance and earning history"
    iconName="wallet-outline"
  />
);

export const FeedbackHistoryScreen = () => (
  <PlaceholderScreen 
    title="Feedback History" 
    description="History of feedback given and received"
    iconName="chatbubble-outline"
  />
);

export const TeacherRatingsScreen = () => (
  <PlaceholderScreen 
    title="Teacher Ratings" 
    description="Rate and review teachers and instructors"
    iconName="school-outline"
  />
);

export const CourseRatingsScreen = () => (
  <PlaceholderScreen 
    title="Course Ratings" 
    description="Rate and review completed courses"
    iconName="book-outline"
  />
);

export const AccountSettingsScreen = () => (
  <PlaceholderScreen 
    title="Account Settings" 
    description="Manage account preferences and security settings"
    iconName="settings-outline"
  />
);

export const PrivacySettingsScreen = () => (
  <PlaceholderScreen 
    title="Privacy Settings" 
    description="Control privacy and data sharing preferences"
    iconName="shield-outline"
  />
);

export const ParentalControlsScreen = () => (
  <PlaceholderScreen 
    title="Parental Controls" 
    description="Settings for parental oversight and restrictions"
    iconName="lock-closed-outline"
  />
);

export const DataExportScreen = () => (
  <PlaceholderScreen 
    title="Export Data" 
    description="Download personal data and learning records"
    iconName="download-outline"
  />
);

export const DeleteAccountScreen = () => (
  <PlaceholderScreen 
    title="Delete Account" 
    description="Permanently delete account and all associated data"
    iconName="trash-outline"
    isDestructive={true}
  />
);

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  profileHeader: {
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  profileHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileHeaderLeft: {
    flex: 1,
  },
  profileHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileTitle: {
    fontSize: 24,
    color: theme.colors.neutral[900],
    fontWeight: '700',
  },
  profileSubtitle: {
    fontSize: 14,
    color: theme.colors.neutral[600],
    fontWeight: '500',
    marginTop: 2,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.green[50],
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
    minHeight: 40,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.green[600],
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    padding: 24,
  },
  placeholderIcon: {
    marginBottom: 16,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.green[600],
    marginBottom: 8,
    textAlign: 'center',
  },
  placeholderDescription: {
    fontSize: 16,
    color: theme.colors.neutral[600],
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  placeholderSubtitle: {
    fontSize: 14,
    color: theme.colors.neutral[500],
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ProfileStackNavigator;