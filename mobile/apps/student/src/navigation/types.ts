/**
 * Navigation Types for Harry School Student App
 * 
 * Type-safe navigation parameter definitions based on UX research findings
 * Supports age-appropriate navigation patterns and educational workflows
 */

import { NavigationProp, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

// Age group for UI adaptations
export type StudentAgeGroup = '10-12' | '13-15' | '16-18';

// User data interfaces
export interface StudentProfile {
  id: string;
  name: string;
  ageGroup: StudentAgeGroup;
  grade: string;
  preferences: {
    language: 'en' | 'ru' | 'uz';
    theme: 'light' | 'dark' | 'auto';
    accessibility: {
      largeText: boolean;
      highContrast: boolean;
      reducedMotion: boolean;
    };
  };
}

// ============================================================================
// ROOT NAVIGATION
// ============================================================================

export type RootStackParamList = {
  // Authentication Flow
  Onboarding: undefined;
  Login: {
    initialRole?: 'student';
    returnTo?: keyof MainTabParamList;
  };
  
  // Main Application
  MainTabs: {
    initialTab?: keyof MainTabParamList;
    student?: StudentProfile;
  };
  
  // Global Modals
  Settings: {
    section?: 'general' | 'privacy' | 'notifications' | 'about';
  };
  FullscreenActivity: {
    activityId: string;
    lessonId: string;
    type: 'quiz' | 'video' | 'interactive' | 'assessment';
  };
  OfflineSync: undefined;
  ParentalConsent: {
    studentId: string;
    feature: string;
  };
};

export type RootNavigationProp = StackNavigationProp<RootStackParamList>;

// ============================================================================
// MAIN TAB NAVIGATION
// ============================================================================

export type MainTabParamList = {
  Home: undefined;
  Lessons: {
    courseId?: string;
    resumeLesson?: string;
  };
  Schedule: {
    date?: string;
    viewType?: 'day' | 'week' | 'month';
  };
  Vocabulary: {
    practiceMode?: 'flashcards' | 'games' | 'translator';
    wordListId?: string;
  };
  Profile: {
    section?: 'achievements' | 'progress' | 'settings';
  };
};

export type MainTabNavigationProp = BottomTabNavigationProp<MainTabParamList>;

// ============================================================================
// HOME STACK NAVIGATION
// ============================================================================

export type HomeStackParamList = {
  Dashboard: undefined;
  QuickActions: {
    action?: 'homework' | 'practice' | 'games' | 'progress';
  };
  ProgressOverview: {
    subject?: string;
    timeframe?: 'week' | 'month' | 'semester';
  };
  Achievements: {
    category?: 'academic' | 'engagement' | 'streaks' | 'social';
  };
  Notifications: undefined;
  News: {
    category?: 'school' | 'class' | 'general';
  };
  WeeklyReport: {
    weekId: string;
  };
};

export type HomeNavigationProp = StackNavigationProp<HomeStackParamList>;

// ============================================================================
// LESSONS STACK NAVIGATION
// ============================================================================

export type LessonsStackParamList = {
  CourseList: {
    filter?: 'active' | 'completed' | 'upcoming';
    searchQuery?: string;
  };
  CourseDetail: {
    courseId: string;
    resumeFromLesson?: string;
  };
  LessonDetail: {
    lessonId: string;
    courseId: string;
    previousLessonId?: string;
    nextLessonId?: string;
  };
  InteractiveActivity: {
    activityId: string;
    lessonId: string;
    type: 'quiz' | 'video' | 'reading' | 'practice' | 'assessment';
  };
  QuizResults: {
    quizId: string;
    score: number;
    totalQuestions: number;
    reviewMode?: boolean;
  };
  LessonProgress: {
    courseId: string;
    currentLessonId: string;
  };
  DownloadedContent: {
    courseId?: string;
  };
  StudyPlanner: {
    courseId?: string;
    dueDate?: string;
  };
};

export type LessonsNavigationProp = StackNavigationProp<LessonsStackParamList>;

// ============================================================================
// SCHEDULE STACK NAVIGATION
// ============================================================================

export type ScheduleStackParamList = {
  Calendar: {
    initialDate?: string;
    viewType?: 'day' | 'week' | 'month';
  };
  ClassDetail: {
    classId: string;
    date: string;
  };
  Assignment: {
    assignmentId: string;
    courseId: string;
    dueDate: string;
  };
  Homework: {
    homeworkId: string;
    subjectId: string;
    completed?: boolean;
  };
  ExamPrep: {
    examId: string;
    subject: string;
    examDate: string;
  };
  AttendanceHistory: {
    subjectId?: string;
    month?: string;
  };
  Timetable: {
    weekId?: string;
    dayOfWeek?: number;
  };
};

export type ScheduleNavigationProp = StackNavigationProp<ScheduleStackParamList>;

// ============================================================================
// VOCABULARY STACK NAVIGATION
// ============================================================================

export type VocabularyStackParamList = {
  WordLists: {
    category?: 'recent' | 'favorites' | 'difficult' | 'mastered';
    searchQuery?: string;
  };
  Flashcards: {
    wordListId: string;
    practiceMode: 'new' | 'review' | 'difficult';
    sessionLength?: number;
  };
  Translator: {
    sourceLanguage?: 'en' | 'ru' | 'uz';
    targetLanguage?: 'en' | 'ru' | 'uz';
    initialText?: string;
  };
  VocabularyGames: {
    gameType: 'matching' | 'spelling' | 'pronunciation' | 'context';
    wordListId?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
  };
  WordDetail: {
    wordId: string;
    wordListId?: string;
    showExamples?: boolean;
  };
  PracticeSession: {
    sessionId: string;
    wordListId: string;
    duration?: number;
  };
  VocabularyProgress: {
    timeframe?: 'week' | 'month' | 'all';
    subject?: string;
  };
  PronunciationPractice: {
    wordId: string;
    attempts?: number;
  };
};

export type VocabularyNavigationProp = StackNavigationProp<VocabularyStackParamList>;

// ============================================================================
// PROFILE STACK NAVIGATION
// ============================================================================

export type ProfileStackParamList = {
  ProfileOverview: undefined;
  EditProfile: {
    section?: 'basic' | 'preferences' | 'privacy';
  };
  AchievementDetail: {
    achievementId: string;
    category: 'academic' | 'engagement' | 'streaks' | 'social';
  };
  ProgressReports: {
    reportType?: 'academic' | 'engagement' | 'overall';
    timeframe?: 'week' | 'month' | 'semester';
  };
  Settings: {
    category?: 'app' | 'privacy' | 'notifications' | 'parental';
  };
  ParentalControls: {
    feature?: 'screen_time' | 'content_filter' | 'social_features';
  };
  DataExport: {
    dataType?: 'progress' | 'achievements' | 'all';
  };
  Support: {
    issueType?: 'technical' | 'academic' | 'account' | 'feedback';
  };
  About: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
};

export type ProfileNavigationProp = StackNavigationProp<ProfileStackParamList>;

// ============================================================================
// COMBINED NAVIGATION TYPES
// ============================================================================

export type AppNavigationProp = 
  | RootNavigationProp
  | MainTabNavigationProp
  | HomeNavigationProp
  | LessonsNavigationProp
  | ScheduleNavigationProp
  | VocabularyNavigationProp
  | ProfileNavigationProp;

// Route props for screen components
export type HomeRouteProps<T extends keyof HomeStackParamList> = RouteProp<HomeStackParamList, T>;
export type LessonsRouteProps<T extends keyof LessonsStackParamList> = RouteProp<LessonsStackParamList, T>;
export type ScheduleRouteProps<T extends keyof ScheduleStackParamList> = RouteProp<ScheduleStackParamList, T>;
export type VocabularyRouteProps<T extends keyof VocabularyStackParamList> = RouteProp<VocabularyStackParamList, T>;
export type ProfileRouteProps<T extends keyof ProfileStackParamList> = RouteProp<ProfileStackParamList, T>;

// Navigation state for offline support
export interface NavigationState {
  routeName: string;
  params?: any;
  timestamp: number;
  offline?: boolean;
}

// Deep linking types
export interface DeepLinkConfig {
  screens: {
    [key: string]: string | { path: string; params?: any };
  };
}

// Analytics event types for navigation tracking
export interface NavigationAnalytics {
  screen_view: {
    screen_name: string;
    screen_class: string;
    student_age_group: StudentAgeGroup;
    timestamp: number;
  };
  navigation_action: {
    action: 'navigate' | 'go_back' | 'reset' | 'replace';
    from_screen: string;
    to_screen: string;
    params?: any;
  };
}

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}