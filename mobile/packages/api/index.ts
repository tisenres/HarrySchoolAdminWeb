/**
 * Harry School Mobile API Package
 * 
 * Comprehensive Supabase client and API layer for Harry School mobile applications
 * 
 * Features:
 * - Mobile-optimized Supabase client with offline support
 * - Intelligent caching and performance optimization
 * - Comprehensive error handling and retry mechanisms
 * - Security management with session validation
 * - Real-time subscriptions with conflict resolution
 * - Environment configuration management
 * 
 * @version 1.0.0
 */

// Main API exports
export {
  initializeSupabase,
  getSupabaseClient,
  createApiClient,
  setupHarrySchoolApi,
  HarrySchoolApiClient,
} from './supabase';

// Core components
export {
  MobileSupabaseClient,
  OfflineQueue,
  ErrorHandler,
  SecurityManager,
  PerformanceManager,
} from './supabase';

// Configuration
export {
  loadEnvironmentConfig,
  getPlatformConfig,
  createDevelopmentConfig,
  createProductionConfig,
  getConfig,
  resetConfig,
} from './config/environment';

// Types
export type {
  // Supabase types
  SupabaseConfig,
  SupabaseResponse,
  SupabasePaginatedResponse,
  ConnectionStatus,
  QueryOptions,
  RetryOptions,
  RealtimeSubscriptionOptions,
  RealtimeEvent,
  MobileApiClient,
  
  // Authentication types
  AuthUser,
  UserProfile,
  AuthSession,
  
  // Student app types
  StudentData,
  StudentVocabulary,
  HomeTask,
  StudentAttendance,
  StudentFeedback,
  
  // Teacher app types
  TeacherData,
  GroupData,
  TeacherTask,
  
  // Shared types
  RankingEntry,
  NotificationData,
  VocabularyWord,
  RewardItem,
  StudentReward,
  
  // API utility types
  ApiError,
  ValidationError,
  PaginationParams,
  PaginatedResult,
  FileUploadOptions,
  FileUploadResult,
  BatchOperation,
  BatchResult,
  AnalyticsEvent,
  UserAnalytics,
  
  // Database types
  Database,
  DatabaseTable,
  TableRow,
  TableInsert,
  TableUpdate,
  
  // Configuration types
  AppEnvironmentConfig,
} from './types/supabase';

// Utility functions and helpers
export const ApiUtils = {
  /**
   * Create a query key for caching
   */
  createQueryKey: (table: string, params?: Record<string, any>): string => {
    const paramsString = params ? JSON.stringify(params) : '';
    return `${table}_${btoa(paramsString).replace(/[^a-zA-Z0-9]/g, '')}`;
  },

  /**
   * Validate email format
   */
  validateEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Format error message for display
   */
  formatErrorMessage: (error: any): string => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.error?.message) return error.error.message;
    return 'An unexpected error occurred';
  },

  /**
   * Check if error is network related
   */
  isNetworkError: (error: any): boolean => {
    const errorMessage = ApiUtils.formatErrorMessage(error).toLowerCase();
    return /network|connection|timeout|fetch|offline/.test(errorMessage);
  },

  /**
   * Generate a unique identifier
   */
  generateId: (): string => {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Deep merge objects
   */
  deepMerge: <T extends Record<string, any>>(target: T, source: Partial<T>): T => {
    const result = { ...target };
    
    Object.keys(source).forEach(key => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = ApiUtils.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    });
    
    return result;
  },

  /**
   * Debounce function
   */
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void => {
    let timeoutId: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  },

  /**
   * Throttle function
   */
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void => {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  /**
   * Retry function with exponential backoff
   */
  retry: async <T>(
    fn: () => Promise<T>,
    options: {
      maxRetries?: number;
      baseDelay?: number;
      maxDelay?: number;
      retryCondition?: (error: any) => boolean;
    } = {}
  ): Promise<T> => {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 5000,
      retryCondition = () => true,
    } = options;

    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt === maxRetries || !retryCondition(error)) {
          throw error;
        }

        const delay = Math.min(
          baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
          maxDelay
        );

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  },
};

// Constants
export const ApiConstants = {
  // Cache keys
  CACHE_KEYS: {
    USER_PROFILE: 'user_profile',
    STUDENT_DATA: 'student_data',
    TEACHER_DATA: 'teacher_data',
    GROUPS: 'groups',
    RANKINGS: 'rankings',
    NOTIFICATIONS: 'notifications',
    VOCABULARY: 'vocabulary',
    HOME_TASKS: 'home_tasks',
    ATTENDANCE: 'attendance',
    FEEDBACK: 'feedback',
    REWARDS: 'rewards',
  },

  // Event types
  EVENTS: {
    CONNECTION_CHANGED: 'connection_changed',
    AUTH_STATE_CHANGED: 'auth_state_changed',
    DATA_UPDATED: 'data_updated',
    SYNC_STARTED: 'sync_started',
    SYNC_COMPLETED: 'sync_completed',
    CONFLICT_DETECTED: 'conflict_detected',
    ERROR_OCCURRED: 'error_occurred',
  },

  // API endpoints (relative to Supabase URL)
  ENDPOINTS: {
    PROFILES: '/rest/v1/profiles',
    STUDENTS: '/rest/v1/students',
    TEACHERS: '/rest/v1/teachers',
    GROUPS: '/rest/v1/groups',
    HOME_TASKS: '/rest/v1/home_tasks',
    VOCABULARY: '/rest/v1/vocabulary_words',
    STUDENT_VOCABULARY: '/rest/v1/student_vocabulary',
    ATTENDANCE: '/rest/v1/attendance',
    FEEDBACK: '/rest/v1/feedback',
    NOTIFICATIONS: '/rest/v1/notifications',
    RANKINGS: '/rest/v1/rankings',
    REWARDS: '/rest/v1/rewards',
    STUDENT_REWARDS: '/rest/v1/student_rewards',
  },

  // HTTP status codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504,
  },

  // Error codes
  ERROR_CODES: {
    NETWORK_ERROR: 'NETWORK_ERROR',
    AUTH_ERROR: 'AUTH_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    PERMISSION_ERROR: 'PERMISSION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    RATE_LIMIT: 'RATE_LIMIT',
    SERVER_ERROR: 'SERVER_ERROR',
    TIMEOUT: 'TIMEOUT',
    OFFLINE: 'OFFLINE',
  },

  // Task types
  TASK_TYPES: {
    TEXT: 'text',
    QUIZ: 'quiz',
    SPEAKING: 'speaking',
    LISTENING: 'listening',
    WRITING: 'writing',
  },

  // Attendance statuses
  ATTENDANCE_STATUS: {
    PRESENT: 'present',
    ABSENT: 'absent',
    LATE: 'late',
    EXCUSED: 'excused',
  },

  // Feedback types
  FEEDBACK_TYPES: {
    POSITIVE: 'positive',
    CONSTRUCTIVE: 'constructive',
    CONCERN: 'concern',
  },

  // Notification types
  NOTIFICATION_TYPES: {
    RANKING: 'ranking',
    FEEDBACK: 'feedback',
    TASK: 'task',
    ATTENDANCE: 'attendance',
    GENERAL: 'general',
  },

  // User roles
  USER_ROLES: {
    STUDENT: 'student',
    TEACHER: 'teacher',
    ADMIN: 'admin',
    SUPERADMIN: 'superadmin',
  },

  // Mastery levels
  MASTERY_LEVELS: {
    NEW: 0,
    LEARNING: 1,
    PRACTICED: 2,
    MASTERED: 3,
  },

  // Reward categories
  REWARD_CATEGORIES: {
    PHYSICAL: 'physical',
    DIGITAL: 'digital',
    PRIVILEGE: 'privilege',
  },
};

// Version information
export const VERSION = '1.0.0';

// Default configuration
export const DEFAULT_CONFIG = {
  cacheConfig: {
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    maxSize: 10 * 1024 * 1024, // 10MB
    maxEntries: 1000,
  },
  retryConfig: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 5000,
  },
  securityConfig: {
    sessionTimeout: 4 * 60 * 60 * 1000, // 4 hours
    maxInactiveTime: 30 * 60 * 1000, // 30 minutes
    maxLoginAttempts: 5,
  },
};

/**
 * Quick start guide in comments:
 * 
 * 1. Install dependencies:
 *    npm install @supabase/supabase-js @react-native-async-storage/async-storage
 * 
 * 2. Set up environment variables in .env:
 *    EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
 *    EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
 * 
 * 3. Initialize the API in your app:
 *    import { setupHarrySchoolApi } from '@harry-school/api';
 *    const { api, signIn, signOut } = setupHarrySchoolApi();
 * 
 * 4. Use the API:
 *    // Sign in
 *    await signIn('user@example.com', 'password');
 *    
 *    // Query data
 *    const result = await api.query(client => 
 *      client.from('students').select('*').limit(10)
 *    );
 *    
 *    // Subscribe to real-time updates
 *    const unsubscribe = api.subscribe({
 *      table: 'rankings',
 *      event: '*'
 *    }, (event) => {
 *      console.log('Ranking updated:', event);
 *    });
 */