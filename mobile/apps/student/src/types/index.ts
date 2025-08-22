// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Onboarding: undefined;
  Lesson: { lessonId: string };
  Quiz: { quizId: string };
  Speaking: { taskId: string };
  Writing: { taskId: string };
  Rewards: undefined;
  Leaderboard: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Lessons: undefined;
  Vocabulary: undefined;
  Schedule: undefined;
  Profile: undefined;
};

export type HomeStackParamList = {
  Dashboard: undefined;
  Notifications: undefined;
  Achievements: undefined;
};

export type LessonsStackParamList = {
  LessonsList: undefined;
  LessonDetail: { lessonId: string };
  LessonPlayer: { lessonId: string };
};

export type VocabularyStackParamList = {
  VocabularyHome: undefined;
  Flashcards: { unitId?: string };
  Translator: undefined;
  WordDetail: { wordId: string };
};

export type ScheduleStackParamList = {
  Calendar: undefined;
  ClassDetail: { classId: string };
  AttendanceHistory: undefined;
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  Settings: undefined;
  EditProfile: undefined;
  Feedback: undefined;
  Referrals: undefined;
  Support: undefined;
};

// User & Student Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  level: number;
  points: number;
  coins: number;
  rank: number;
  totalStudents: number;
  attendancePercentage: number;
  averageGrade: number;
  streak: number;
  achievements: Achievement[];
  preferences: StudentPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface StudentPreferences {
  language: 'en' | 'ru' | 'uz';
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    lessons: boolean;
    homework: boolean;
    achievements: boolean;
    reminders: boolean;
  };
  audio: {
    effects: boolean;
    music: boolean;
    volume: number;
  };
}

// Learning & Lessons Types
export interface Lesson {
  id: string;
  title: string;
  description: string;
  type: LessonType;
  difficulty: DifficultyLevel;
  duration: number; // in minutes
  points: number;
  coins: number;
  thumbnail?: string;
  content: LessonContent;
  prerequisites?: string[];
  isCompleted: boolean;
  progress: number; // 0-100
  createdAt: string;
  updatedAt: string;
}

export type LessonType = 'text' | 'quiz' | 'speaking' | 'listening' | 'writing' | 'mixed';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface LessonContent {
  sections: LessonSection[];
  totalQuestions?: number;
  passingScore?: number;
}

export interface LessonSection {
  id: string;
  type: 'text' | 'question' | 'audio' | 'video' | 'image';
  title?: string;
  content: string;
  options?: string[];
  correctAnswer?: string | number;
  explanation?: string;
  media?: MediaContent;
}

export interface MediaContent {
  url: string;
  type: 'image' | 'audio' | 'video';
  duration?: number;
  thumbnail?: string;
}

// Vocabulary Types
export interface VocabularyUnit {
  id: string;
  title: string;
  description: string;
  words: VocabularyWord[];
  progress: number; // 0-100
  isCompleted: boolean;
  createdAt: string;
}

export interface VocabularyWord {
  id: string;
  word: string;
  translation: string;
  phonetic?: string;
  definition: string;
  example: string;
  difficulty: DifficultyLevel;
  category: string;
  masteryLevel: MasteryLevel;
  lastPracticed?: string;
  practiceCount: number;
  audioUrl?: string;
  imageUrl?: string;
  createdAt: string;
}

export type MasteryLevel = 0 | 1 | 2 | 3 | 4 | 5; // 0: not practiced, 5: mastered

// Gamification Types
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  points: number;
  coins: number;
  condition: AchievementCondition;
  isUnlocked: boolean;
  unlockedAt?: string;
  progress: number; // 0-100
  createdAt: string;
}

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface AchievementCondition {
  type: 'lessons_completed' | 'points_earned' | 'streak_days' | 'quiz_perfect' | 'attendance_rate';
  target: number;
  current: number;
}

export interface LeaderboardEntry {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  points: number;
  level: number;
  rank: number;
  isCurrentUser: boolean;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  type: RewardType;
  cost: number; // in coins
  icon: string;
  category: string;
  isAvailable: boolean;
  isPurchased: boolean;
  expiresAt?: string;
  createdAt: string;
}

export type RewardType = 'avatar' | 'theme' | 'badge' | 'privilege' | 'physical';

// Schedule Types
export interface ScheduleEvent {
  id: string;
  title: string;
  description: string;
  type: EventType;
  startTime: string;
  endTime: string;
  location?: string;
  teacher?: Teacher;
  subject: string;
  isRecurring: boolean;
  attendanceStatus?: AttendanceStatus;
  createdAt: string;
}

export type EventType = 'class' | 'exam' | 'homework' | 'event' | 'holiday';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  subject: string;
  rating: number;
}

// Progress & Analytics Types
export interface LearningProgress {
  studentId: string;
  totalLessonsCompleted: number;
  totalPoints: number;
  totalCoins: number;
  currentLevel: number;
  currentStreak: number;
  longestStreak: number;
  averageSessionDuration: number;
  weeklyActivity: WeeklyActivity[];
  subjectProgress: SubjectProgress[];
  updatedAt: string;
}

export interface WeeklyActivity {
  date: string;
  lessonsCompleted: number;
  pointsEarned: number;
  timeSpent: number; // in minutes
}

export interface SubjectProgress {
  subject: string;
  lessonsCompleted: number;
  totalLessons: number;
  averageScore: number;
  timeSpent: number; // in minutes
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface FeedbackForm {
  teacherId: string;
  rating: number;
  feedback: string;
  anonymous: boolean;
}

export interface ReferralData {
  code: string;
  shareUrl: string;
  referralsCount: number;
  pointsEarned: number;
}

// Animation Types
export interface AnimationConfig {
  duration: number;
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'bounce';
  delay?: number;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// Storage Types
export interface StorageKeys {
  USER_TOKEN: 'user_token';
  USER_PROFILE: 'user_profile';
  STUDENT_PROFILE: 'student_profile';
  PREFERENCES: 'preferences';
  OFFLINE_DATA: 'offline_data';
  LAST_SYNC: 'last_sync';
}

export type StorageValue = string | object | number | boolean | null;