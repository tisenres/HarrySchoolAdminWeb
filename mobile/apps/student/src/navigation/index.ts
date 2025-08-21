/**
 * Navigation Index for Harry School Student App
 * 
 * Simplified export file for initial development
 */

// =====================================================
// MAIN NAVIGATORS
// =====================================================

export { RootNavigator } from './RootNavigator';
export { MainTabNavigator } from './MainTabNavigator';

// =====================================================
// NAVIGATION SERVICES (Available)
// =====================================================

export { deepLinkingService } from '../services/deepLinking.service';
export { navigationService } from './NavigationService';

// =====================================================
// NAVIGATION CONSTANTS
// =====================================================

export const NAVIGATION_CONSTANTS = {
  // Tab priorities based on UX research
  TAB_PRIORITIES: {
    HOME: 40, // 40% usage
    LESSONS: 35, // 35% usage
    SCHEDULE: 15, // 15% usage
    VOCABULARY: 8, // 8% usage
    PROFILE: 2, // 2% usage
  },
  
  // Touch target sizes (iOS HIG compliance)
  TOUCH_TARGETS: {
    MINIMUM: 44, // Minimum touch target size
    RECOMMENDED: 48, // Recommended for better accessibility
    TAB_BAR_HEIGHT_IOS: 85,
    TAB_BAR_HEIGHT_ANDROID: 65,
  },
  
  // Animation configurations
  ANIMATIONS: {
    SPRING_CONFIG: {
      damping: 15,
      stiffness: 150,
    },
    DURATION: {
      FAST: 200,
      NORMAL: 300,
      SLOW: 500,
    },
  },
  
  // Deep linking prefixes
  DEEP_LINK_PREFIXES: [
    'harryschool://student',
    'https://student.harryschool.app',
  ],
  
  // Accessibility
  ACCESSIBILITY: {
    MINIMUM_CONTRAST_RATIO: 4.5,
    LARGE_TEXT_CONTRAST_RATIO: 3.0,
    TIMEOUT_ANNOUNCEMENT: 150, // ms delay for screen reader announcements
  },
  
  // Offline navigation
  OFFLINE: {
    MAX_CACHED_SCREENS: 10,
    CACHE_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
    RETRY_INTERVAL: 5000, // 5 seconds
  },
  
  // Progress preservation
  PROGRESS: {
    AUTO_SAVE_INTERVAL: 30000, // 30 seconds
    MAX_STORED_PROGRESS: 5, // Maximum number of screens to store progress for
    CLEANUP_INTERVAL: 60 * 60 * 1000, // 1 hour
  },
  
  // Analytics
  ANALYTICS: {
    BATCH_SIZE: 10, // Events to batch before sending
    FLUSH_INTERVAL: 30000, // 30 seconds
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  },
} as const;

// =====================================================
// NAVIGATION GUARDS
// =====================================================

export const NAVIGATION_GUARDS = {
  // Authentication required
  AUTH_REQUIRED: (isAuthenticated: boolean) => isAuthenticated,
  
  // Student role required
  STUDENT_ONLY: (userRole?: string) => userRole === 'student',
  
  // Onboarding completed
  ONBOARDING_COMPLETED: (hasCompletedOnboarding: boolean) => hasCompletedOnboarding,
  
  // Parental consent (for users under 13)
  PARENTAL_CONSENT: (hasParentalConsent: boolean, age: number) => 
    age >= 13 || hasParentalConsent,
  
  // Network required (for certain features)
  NETWORK_REQUIRED: (isOnline: boolean) => isOnline,
  
  // Biometric available
  BIOMETRIC_AVAILABLE: (canUseBiometric: boolean) => canUseBiometric,
} as const;

// =====================================================
// SCREEN NAMES (for type safety and analytics)
// =====================================================

export const SCREEN_NAMES = {
  // Auth screens
  AUTH: {
    WELCOME: 'Welcome',
    SIGN_IN: 'SignIn',
    FORGOT_PASSWORD: 'ForgotPassword',
    BIOMETRIC_LOGIN: 'BiometricLogin',
    PIN_LOGIN: 'PinLogin',
    ONBOARDING_START: 'OnboardingStart',
    ONBOARDING_PERSONALIZATION: 'OnboardingPersonalization',
    ONBOARDING_GOALS: 'OnboardingGoals',
    ONBOARDING_COMPLETE: 'OnboardingComplete',
  },
  
  // Main tabs
  TABS: {
    HOME: 'HomeTab',
    LESSONS: 'LessonsTab',
    SCHEDULE: 'ScheduleTab',
    VOCABULARY: 'VocabularyTab',
    PROFILE: 'ProfileTab',
  },
  
  // Home stack
  HOME: {
    DASHBOARD: 'HomeDashboard',
    RANKING_LEADERBOARD: 'RankingLeaderboard',
    ACHIEVEMENT_DETAILS: 'AchievementDetails',
    DAILY_GOALS: 'DailyGoals',
    QUICK_ACTIONS: 'QuickActions',
    ANNOUNCEMENT_DETAILS: 'AnnouncementDetails',
    UPCOMING_CLASSES: 'UpcomingClasses',
    RECENT_ACTIVITY: 'RecentActivity',
    STUDY_STREAK: 'StudyStreak',
    FRIEND_ACTIVITY: 'FriendActivity',
  },
  
  // Lessons stack
  LESSONS: {
    OVERVIEW: 'LessonsOverview',
    ACTIVE_LESSONS: 'ActiveLessons',
    COMPLETED_LESSONS: 'CompletedLessons',
    LESSON_CONTENT: 'LessonContent',
    INTERACTIVE_LEARNING: 'InteractiveLearning',
    LESSON_PROGRESS: 'LessonProgress',
    HOMEWORK_TASKS: 'HomeworkTasks',
    AI_GENERATED_TASKS: 'AIGeneratedTasks',
    TASK_SUBMISSION: 'TaskSubmission',
    LESSON_FEEDBACK: 'LessonFeedback',
    EXTRA_LEARNING: 'ExtraLearning',
    REQUEST_ADDITIONAL_LESSON: 'RequestAdditionalLesson',
  },
  
  // Schedule stack
  SCHEDULE: {
    OVERVIEW: 'ScheduleOverview',
    DAILY_SCHEDULE: 'DailySchedule',
    WEEKLY_SCHEDULE: 'WeeklySchedule',
    MONTHLY_SCHEDULE: 'MonthlySchedule',
    CLASS_DETAILS: 'ClassDetails',
    ATTENDANCE_HISTORY: 'AttendanceHistory',
    UPCOMING_ASSIGNMENTS: 'UpcomingAssignments',
    ASSIGNMENT_CALENDAR: 'AssignmentCalendar',
    EXAM_SCHEDULE: 'ExamSchedule',
    STUDY_PLANNER: 'StudyPlanner',
    TIME_BLOCKER: 'TimeBlocker',
    SCHEDULE_SETTINGS: 'ScheduleSettings',
  },
  
  // Vocabulary stack
  VOCABULARY: {
    DASHBOARD: 'VocabularyDashboard',
    FLASHCARD_SESSION: 'FlashcardSession',
    TRANSLATOR: 'VocabularyTranslator',
    PERSONAL_DICTIONARY: 'PersonalDictionary',
    WORD_DETAILS: 'WordDetails',
    STATS: 'VocabularyStats',
    LEARNING_CATEGORIES: 'LearningCategories',
    CATEGORY_WORDS: 'CategoryWords',
    GAMES: 'VocabularyGames',
    WORD_OF_THE_DAY: 'WordOfTheDay',
    SPELLING_PRACTICE: 'SpellingPractice',
    PRONUNCIATION_PRACTICE: 'PronunciationPractice',
    QUIZ: 'VocabularyQuiz',
  },
  
  // Profile stack
  PROFILE: {
    OVERVIEW: 'ProfileOverview',
    EDIT_PROFILE: 'EditProfile',
    PROGRESS_TRACKING: 'ProgressTracking',
    ACHIEVEMENT_GALLERY: 'AchievementGallery',
    BADGE_COLLECTION: 'BadgeCollection',
    LEARNING_STATS: 'LearningStats',
    REFERRAL_PROGRAM: 'ReferralProgram',
    INVITE_FRIENDS: 'InviteFriends',
    REDEEM_REWARDS: 'RedeemRewards',
    REWARD_HISTORY: 'RewardHistory',
    POINTS_HISTORY: 'PointsHistory',
    COIN_BALANCE: 'CoinBalance',
    FEEDBACK_HISTORY: 'FeedbackHistory',
    TEACHER_RATINGS: 'TeacherRatings',
    COURSE_RATINGS: 'CourseRatings',
    ACCOUNT_SETTINGS: 'AccountSettings',
    PRIVACY_SETTINGS: 'PrivacySettings',
    PARENTAL_CONTROLS: 'ParentalControls',
    DATA_EXPORT: 'DataExport',
    DELETE_ACCOUNT: 'DeleteAccount',
  },
  
  // Modal screens
  MODALS: {
    STUDENT_PROFILE: 'StudentProfile',
    TEACHER_PROFILE: 'TeacherProfile',
    LESSON_DETAILS: 'LessonDetails',
    ASSIGNMENT_DETAILS: 'AssignmentDetails',
    VOCABULARY_TEST: 'VocabularyTest',
    REWARDS_SHOP: 'RewardsShop',
    NOTIFICATIONS: 'Notifications',
    SETTINGS: 'Settings',
    HELP_SUPPORT: 'HelpSupport',
    LANGUAGE_SELECTOR: 'LanguageSelector',
    BIOMETRIC_SETUP: 'BiometricSetup',
    PIN_SETUP: 'PinSetup',
  },
} as const;

// =====================================================
// DEFAULT EXPORT
// =====================================================

export default {
  NAVIGATION_CONSTANTS,
  NAVIGATION_GUARDS,
  SCREEN_NAMES,
};