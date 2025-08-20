import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database';

// Core Supabase Configuration
export interface SupabaseConfig {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  appVersion?: string;
  enableOfflineQueue?: boolean;
  enablePerformanceMonitoring?: boolean;
  cacheConfig?: {
    defaultTTL?: number;
    maxSize?: number;
    maxEntries?: number;
  };
  retryConfig?: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
  };
  securityConfig?: {
    sessionTimeout?: number;
    maxInactiveTime?: number;
    maxLoginAttempts?: number;
  };
}

// Connection Status Types
export type ConnectionStatus = 
  | 'connecting' 
  | 'connected' 
  | 'disconnected' 
  | 'reconnecting' 
  | 'failed';

// Response Types
export interface SupabaseResponse<T> {
  data: T | null;
  error: { message: string } | null;
  meta?: {
    queueId?: string;
    fromCache?: boolean;
    executionTime?: number;
  };
}

export interface SupabasePaginatedResponse<T> {
  data: T[];
  error: { message: string } | null;
  count: number | null;
  meta?: {
    page?: number;
    pageSize?: number;
    totalPages?: number;
    fromCache?: boolean;
    executionTime?: number;
  };
}

// Query Options
export interface QueryOptions {
  enableCache?: boolean;
  ttl?: number; // Cache time-to-live in milliseconds
  forceRefresh?: boolean;
  priority?: 'high' | 'medium' | 'low';
  retryOptions?: RetryOptions;
  networkOptimized?: boolean;
  abortSignal?: AbortSignal;
}

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  retryCondition?: (error: any) => boolean;
}

// Realtime Subscription Types
export interface RealtimeSubscriptionOptions {
  table: string;
  filter?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  enableOfflineBuffer?: boolean;
  conflictResolution?: 'client' | 'server' | 'merge';
}

export interface RealtimeEvent<T> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T | null;
  old: T | null;
  timestamp: number;
  table: string;
}

// Authentication Types
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: 'student' | 'teacher' | 'admin' | 'superadmin';
  organization_id: string;
  profile?: UserProfile;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar_url?: string;
  language_preference: 'en' | 'ru' | 'uz';
  notification_preferences: {
    push_enabled: boolean;
    email_enabled: boolean;
    ranking_updates: boolean;
    group_updates: boolean;
    feedback_received: boolean;
  };
  app_preferences: {
    theme: 'light' | 'dark' | 'auto';
    sound_enabled: boolean;
    haptic_feedback: boolean;
  };
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: AuthUser;
}

// Mobile-specific API Types
export interface MobileApiClient {
  // Auth methods
  signIn(email: string, password: string): Promise<SupabaseResponse<AuthSession>>;
  signOut(): Promise<void>;
  refreshSession(): Promise<SupabaseResponse<AuthSession>>;
  getCurrentUser(): Promise<AuthUser | null>;
  
  // Query methods
  query<T>(
    queryFn: (client: SupabaseClient<Database>) => Promise<SupabaseResponse<T>>,
    options?: QueryOptions
  ): Promise<SupabaseResponse<T>>;
  
  // Realtime methods
  subscribe<T>(
    options: RealtimeSubscriptionOptions,
    callback: (event: RealtimeEvent<T>) => void
  ): () => void;
  
  // Offline queue methods
  getQueueStatus(): Promise<{
    totalOperations: number;
    operationsByPriority: Record<string, number>;
    conflicts: number;
    isProcessing: boolean;
  }>;
  
  resolveConflict(operationId: string, resolution: any): Promise<void>;
  
  // Performance methods
  getCacheStats(): any;
  invalidateCache(pattern?: string): Promise<void>;
  
  // Connection methods
  getConnectionStatus(): ConnectionStatus;
  onConnectionStatusChange(callback: (status: ConnectionStatus) => void): () => void;
}

// Student App Specific Types
export interface StudentData {
  id: string;
  name: string;
  email: string;
  group_ids: string[];
  ranking_points: number;
  ranking_coins: number;
  level: number;
  avatar_url?: string;
  referral_code: string;
  referrals_count: number;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface StudentVocabulary {
  id: string;
  student_id: string;
  word_id: string;
  is_learned: boolean;
  practice_count: number;
  last_practiced: string;
  mastery_level: 0 | 1 | 2 | 3; // 0: new, 1: learning, 2: practiced, 3: mastered
}

export interface HomeTask {
  id: string;
  student_id: string;
  title: string;
  description: string;
  task_type: 'text' | 'quiz' | 'speaking' | 'listening' | 'writing';
  content: any; // JSON content specific to task type
  due_date: string;
  completed_at?: string;
  score?: number;
  feedback?: string;
  created_at: string;
}

export interface StudentAttendance {
  id: string;
  student_id: string;
  group_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
  created_by: string;
  created_at: string;
}

export interface StudentFeedback {
  id: string;
  student_id: string;
  teacher_id: string;
  group_id?: string;
  feedback_type: 'positive' | 'constructive' | 'concern';
  subject: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

// Teacher App Specific Types
export interface TeacherData {
  id: string;
  name: string;
  email: string;
  specializations: string[];
  group_ids: string[];
  ranking_points: number;
  level: number;
  avatar_url?: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface GroupData {
  id: string;
  name: string;
  description?: string;
  level: string;
  teacher_ids: string[];
  student_ids: string[];
  schedule: {
    day: string;
    start_time: string;
    end_time: string;
    classroom?: string;
  }[];
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface TeacherTask {
  id: string;
  teacher_id: string;
  title: string;
  description: string;
  task_type: 'homework_creation' | 'feedback_review' | 'attendance_marking';
  target_type: 'student' | 'group';
  target_id: string;
  due_date?: string;
  completed_at?: string;
  created_at: string;
}

// Shared Types
export interface RankingEntry {
  id: string;
  user_id: string;
  user_type: 'student' | 'teacher';
  user_name: string;
  points: number;
  coins: number;
  level: number;
  rank: number;
  organization_id: string;
  updated_at: string;
}

export interface NotificationData {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'ranking' | 'feedback' | 'task' | 'attendance' | 'general';
  data?: any; // Additional notification data
  is_read: boolean;
  is_push_sent: boolean;
  created_at: string;
}

export interface VocabularyWord {
  id: string;
  word: string;
  translation: string;
  pronunciation?: string;
  example_sentence?: string;
  difficulty_level: 1 | 2 | 3 | 4 | 5;
  category: string;
  audio_url?: string;
  image_url?: string;
  organization_id: string;
  created_at: string;
}

export interface RewardItem {
  id: string;
  name: string;
  description: string;
  cost_coins: number;
  category: 'physical' | 'digital' | 'privilege';
  image_url?: string;
  is_available: boolean;
  stock_quantity?: number;
  organization_id: string;
  created_at: string;
}

export interface StudentReward {
  id: string;
  student_id: string;
  reward_id: string;
  redeemed_at: string;
  status: 'pending' | 'fulfilled' | 'cancelled';
  notes?: string;
}

// API Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
  requestId?: string;
}

export interface ValidationError extends ApiError {
  field: string;
  value: any;
  constraint: string;
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// File Upload Types
export interface FileUploadOptions {
  bucket: string;
  path: string;
  file: File | Blob;
  contentType?: string;
  cacheControl?: string;
  upsert?: boolean;
}

export interface FileUploadResult {
  path: string;
  fullPath: string;
  publicUrl: string;
  size: number;
}

// Batch Operation Types
export interface BatchOperation<T> {
  operation: 'insert' | 'update' | 'delete';
  table: string;
  data: T;
  conditions?: Record<string, any>;
}

export interface BatchResult<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  operation: BatchOperation<T>;
}

// Analytics Types
export interface AnalyticsEvent {
  name: string;
  parameters: Record<string, any>;
  timestamp: number;
  userId?: string;
  sessionId: string;
}

export interface UserAnalytics {
  userId: string;
  dailyActiveTime: number;
  featuresUsed: string[];
  performanceMetrics: {
    averageTaskCompletionTime: number;
    errorRate: number;
    cachHitRate: number;
  };
  engagementScore: number;
}

// Export utility types
export type DatabaseTable = keyof Database['public']['Tables'];
export type TableRow<T extends DatabaseTable> = Database['public']['Tables'][T]['Row'];
export type TableInsert<T extends DatabaseTable> = Database['public']['Tables'][T]['Insert'];
export type TableUpdate<T extends DatabaseTable> = Database['public']['Tables'][T]['Update'];

// Export for convenience
export type { Database };