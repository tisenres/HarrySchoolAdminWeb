/**
 * Navigation Types for Harry School Student App
 * 
 * Defines TypeScript types for all navigation stacks and screens
 * Based on UX research for educational mobile apps (ages 10-18)
 */

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

// =====================================================
// ROOT NAVIGATION TYPES
// =====================================================

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList> | undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  // Modal screens that overlay the main navigation
  StudentProfile: { studentId: string };
  TeacherProfile: { teacherId: string };
  LessonDetails: { lessonId: string };
  AssignmentDetails: { assignmentId: string };
  VocabularyTest: { wordIds: string[] };
  RewardsShop: undefined;
  Notifications: undefined;
  Settings: undefined;
  HelpSupport: undefined;
  LanguageSelector: undefined;
  BiometricSetup: undefined;
  PinSetup: undefined;
};

export type RootStackScreenProps<Screen extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, Screen>;

// =====================================================
// AUTH NAVIGATION TYPES
// =====================================================

export type AuthStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  ForgotPassword: undefined;
  BiometricLogin: undefined;
  PinLogin: undefined;
  OnboardingStart: undefined;
  OnboardingPersonalization: undefined;
  OnboardingGoals: undefined;
  OnboardingComplete: undefined;
};

export type AuthStackScreenProps<Screen extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, Screen>;

// =====================================================
// MAIN TAB NAVIGATION TYPES (5-Tab Bottom Navigation)
// =====================================================

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList> | undefined;
  LessonsTab: NavigatorScreenParams<LessonsStackParamList> | undefined;
  ScheduleTab: NavigatorScreenParams<ScheduleStackParamList> | undefined;
  VocabularyTab: NavigatorScreenParams<VocabularyStackParamList> | undefined;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList> | undefined;
};

export type MainTabScreenProps<Screen extends keyof MainTabParamList> =
  BottomTabScreenProps<MainTabParamList, Screen>;

// =====================================================
// HOME STACK NAVIGATION TYPES (40% usage priority)
// =====================================================

export type HomeStackParamList = {
  HomeDashboard: undefined;
  RankingLeaderboard: { period?: 'daily' | 'weekly' | 'monthly' | 'all-time' };
  AchievementDetails: { achievementId: string };
  DailyGoals: undefined;
  QuickActions: undefined;
  AnnouncementDetails: { announcementId: string };
  UpcomingClasses: undefined;
  RecentActivity: undefined;
  StudyStreak: undefined;
  FriendActivity: { friendId?: string };
};

export type HomeStackScreenProps<Screen extends keyof HomeStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<HomeStackParamList, Screen>,
    MainTabScreenProps<'HomeTab'>
  >;

// =====================================================
// LESSONS STACK NAVIGATION TYPES (35% usage priority)
// =====================================================

export type LessonsStackParamList = {
  LessonsOverview: undefined;
  ActiveLessons: undefined;
  CompletedLessons: undefined;
  LessonContent: { 
    lessonId: string; 
    moduleId: string;
    startTime?: number; // For resuming lessons
  };
  InteractiveLearning: {
    lessonId: string;
    activityType: 'text' | 'quiz' | 'speaking' | 'listening' | 'writing';
    activityId: string;
  };
  LessonProgress: { lessonId: string };
  HomeworkTasks: undefined;
  AIGeneratedTasks: { subject?: string; difficulty?: 'easy' | 'medium' | 'hard' };
  TaskSubmission: { 
    taskId: string; 
    taskType: 'homework' | 'ai-generated' | 'extra';
  };
  LessonFeedback: { lessonId: string; rating?: number };
  ExtraLearning: undefined;
  RequestAdditionalLesson: { subject?: string };
};

export type LessonsStackScreenProps<Screen extends keyof LessonsStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<LessonsStackParamList, Screen>,
    MainTabScreenProps<'LessonsTab'>
  >;

// =====================================================
// SCHEDULE STACK NAVIGATION TYPES (15% usage priority)
// =====================================================

export type ScheduleStackParamList = {
  ScheduleOverview: undefined;
  DailySchedule: { date?: string }; // ISO date string
  WeeklySchedule: { week?: string }; // ISO week string
  MonthlySchedule: { month?: string }; // ISO month string
  ClassDetails: { classId: string; date: string };
  AttendanceHistory: undefined;
  UpcomingAssignments: undefined;
  AssignmentCalendar: undefined;
  ExamSchedule: undefined;
  StudyPlanner: undefined;
  TimeBlocker: { date: string };
  ScheduleSettings: undefined;
};

export type ScheduleStackScreenProps<Screen extends keyof ScheduleStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<ScheduleStackParamList, Screen>,
    MainTabScreenProps<'ScheduleTab'>
  >;

// =====================================================
// VOCABULARY STACK NAVIGATION TYPES (8% usage priority)
// =====================================================

export type VocabularyStackParamList = {
  VocabularyDashboard: undefined;
  FlashcardSession: {
    setId?: string;
    wordIds?: string[];
    sessionType: 'review' | 'learn' | 'test';
  };
  VocabularyTranslator: undefined;
  PersonalDictionary: undefined;
  WordDetails: { wordId: string };
  VocabularyStats: undefined;
  LearningCategories: undefined;
  CategoryWords: { categoryId: string; categoryName: string };
  VocabularyGames: undefined;
  WordOfTheDay: undefined;
  SpellingPractice: { wordIds: string[] };
  PronunciationPractice: { wordIds: string[] };
  VocabularyQuiz: { 
    quizType: 'multiple-choice' | 'spelling' | 'pronunciation' | 'translation';
    wordIds: string[];
  };
};

export type VocabularyStackScreenProps<Screen extends keyof VocabularyStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<VocabularyStackParamList, Screen>,
    MainTabScreenProps<'VocabularyTab'>
  >;

// =====================================================
// PROFILE STACK NAVIGATION TYPES (2% usage priority)
// =====================================================

export type ProfileStackParamList = {
  ProfileOverview: undefined;
  EditProfile: undefined;
  ProgressTracking: undefined;
  AchievementGallery: undefined;
  BadgeCollection: undefined;
  LearningStats: undefined;
  ReferralProgram: undefined;
  InviteFriends: undefined;
  RedeemRewards: undefined;
  RewardHistory: undefined;
  PointsHistory: undefined;
  CoinBalance: undefined;
  FeedbackHistory: undefined;
  TeacherRatings: undefined;
  CourseRatings: undefined;
  AccountSettings: undefined;
  PrivacySettings: undefined;
  ParentalControls: undefined;
  DataExport: undefined;
  DeleteAccount: undefined;
};

export type ProfileStackScreenProps<Screen extends keyof ProfileStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<ProfileStackParamList, Screen>,
    MainTabScreenProps<'ProfileTab'>
  >;

// =====================================================
// NAVIGATION ANALYTICS TYPES
// =====================================================

export interface NavigationAnalytics {
  screenName: string;
  timeSpent: number;
  tapCount: number;
  scrollDepth: number;
  exitMethod: 'back' | 'tab' | 'gesture' | 'deep-link';
  timestamp: number;
  userRole: 'student';
  organizationId: string;
}

// =====================================================
// DEEP LINKING TYPES
// =====================================================

export type DeepLinkParams = {
  // Lesson deep links
  'lesson': { lessonId: string; moduleId?: string };
  'homework': { taskId: string };
  'quiz': { quizId: string };
  
  // Social deep links
  'referral': { referrerCode: string };
  'friend-profile': { friendId: string };
  
  // Achievement deep links
  'achievement': { achievementId: string };
  'badge': { badgeId: string };
  
  // Schedule deep links
  'class': { classId: string; date: string };
  'assignment': { assignmentId: string };
  
  // Vocabulary deep links
  'vocabulary-set': { setId: string };
  'word': { wordId: string };
  
  // Notification deep links
  'notification': { notificationId: string };
};

// =====================================================
// NAVIGATION STATE TYPES
// =====================================================

export interface NavigationState {
  isOnline: boolean;
  currentRoute: string;
  tabHistory: string[];
  lastActiveTab: keyof MainTabParamList;
  interruptionContext?: {
    screenName: string;
    params: Record<string, any>;
    timestamp: number;
    autoSaveData?: Record<string, any>;
  };
}

// =====================================================
// ACCESSIBILITY NAVIGATION TYPES
// =====================================================

export interface AccessibilityNavigationProps {
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityRole: 'button' | 'tab' | 'link' | 'menuitem';
  accessibilityState?: {
    selected?: boolean;
    disabled?: boolean;
  };
  testID?: string;
}

// =====================================================
// OFFLINE NAVIGATION TYPES
// =====================================================

export interface OfflineNavigationState {
  availableOfflineScreens: string[];
  cachedScreenData: Record<string, any>;
  pendingNavigationActions: Array<{
    action: 'navigate' | 'goBack' | 'reset';
    params: any;
    timestamp: number;
  }>;
}

// =====================================================
// MULTILINGUAL NAVIGATION TYPES
// =====================================================

export type SupportedLanguage = 'en' | 'ru' | 'uz';

export interface NavigationStrings {
  tabs: {
    home: string;
    lessons: string;
    schedule: string;
    vocabulary: string;
    profile: string;
  };
  headers: Record<string, string>;
  buttons: Record<string, string>;
  accessibility: Record<string, string>;
}

// =====================================================
// NAVIGATION GUARDS TYPES
// =====================================================

export interface NavigationGuard {
  screenName: string;
  condition: () => boolean | Promise<boolean>;
  redirectTo?: string;
  redirectParams?: Record<string, any>;
  onBlock?: () => void;
}

// =====================================================
// PROGRESS PRESERVATION TYPES
// =====================================================

export interface ProgressData {
  screenName: string;
  formData?: Record<string, any>;
  scrollPosition?: number;
  inputValues?: Record<string, any>;
  mediaPlaybackPosition?: number;
  quizProgress?: {
    currentQuestion: number;
    answers: Record<number, any>;
    timeSpent: number;
  };
  lessonProgress?: {
    currentStep: number;
    completedSteps: number[];
    timeSpent: number;
  };
}

// =====================================================
// EXPORT ALL NAVIGATION PROP TYPES
// =====================================================

export type {
  NativeStackScreenProps,
  BottomTabScreenProps,
  CompositeScreenProps,
  NavigatorScreenParams,
} from '@react-navigation/native';

// Declare global type for React Navigation
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}