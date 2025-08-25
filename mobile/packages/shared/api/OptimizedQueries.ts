import { supabase } from '../config/supabase';
import { MMKV } from 'react-native-mmkv';
import { InteractionManager } from 'react-native';

// Query cache storage
const queryCache = new MMKV({
  id: 'api-query-cache',
  encryptionKey: 'harry-school-queries',
});

// Query optimization configuration
interface QueryOptimizationConfig {
  enableCache: boolean;
  cacheTTL: number;
  batchSize: number;
  maxRetries: number;
  respectPrayerTime: boolean;
  culturalContext: 'normal' | 'prayer_time' | 'ramadan';
  priority: 'low' | 'normal' | 'high';
}

const defaultConfig: QueryOptimizationConfig = {
  enableCache: true,
  cacheTTL: 300000, // 5 minutes
  batchSize: 50,
  maxRetries: 3,
  respectPrayerTime: true,
  culturalContext: 'normal',
  priority: 'normal',
};

// Prayer time check utility
function checkPrayerTime(): boolean {
  const hour = new Date().getHours();
  return [5, 12, 15, 18, 20].includes(hour);
}

// Query batching utility
class QueryBatcher {
  private static instance: QueryBatcher;
  private batchQueue: Array<{
    query: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
    priority: 'low' | 'normal' | 'high';
  }> = [];
  private isProcessing = false;

  static getInstance(): QueryBatcher {
    if (!QueryBatcher.instance) {
      QueryBatcher.instance = new QueryBatcher();
    }
    return QueryBatcher.instance;
  }

  addQuery<T>(
    query: () => Promise<T>,
    priority: 'low' | 'normal' | 'high' = 'normal'
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.batchQueue.push({ query, resolve, reject, priority });
      
      if (!this.isProcessing) {
        this.processBatch();
      }
    });
  }

  private async processBatch(): Promise<void> {
    if (this.isProcessing || this.batchQueue.length === 0) return;

    this.isProcessing = true;

    try {
      // Sort by priority
      this.batchQueue.sort((a, b) => {
        const priorities = { high: 3, normal: 2, low: 1 };
        return priorities[b.priority] - priorities[a.priority];
      });

      // Process in chunks to avoid overwhelming the database
      const chunkSize = checkPrayerTime() ? 3 : 5; // Smaller chunks during prayer
      
      while (this.batchQueue.length > 0) {
        const chunk = this.batchQueue.splice(0, chunkSize);
        
        // Execute queries in parallel within chunk
        await Promise.allSettled(
          chunk.map(async ({ query, resolve, reject }) => {
            try {
              const result = await query();
              resolve(result);
            } catch (error) {
              reject(error);
            }
          })
        );

        // Add delay between chunks, longer during prayer time
        if (this.batchQueue.length > 0) {
          const delay = checkPrayerTime() ? 200 : 50;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }
}

// Optimized query executor
async function executeOptimizedQuery<T>(
  queryKey: string,
  queryFn: () => Promise<T>,
  config: Partial<QueryOptimizationConfig> = {}
): Promise<T> {
  const finalConfig = { ...defaultConfig, ...config };
  
  // Check cache first
  if (finalConfig.enableCache) {
    const cachedData = getCachedData<T>(queryKey, finalConfig.cacheTTL);
    if (cachedData) {
      return cachedData;
    }
  }

  // Execute query with batching and error handling
  const batcher = QueryBatcher.getInstance();
  
  try {
    const result = await batcher.addQuery(
      async () => {
        let attempts = 0;
        let lastError: Error | null = null;

        while (attempts < finalConfig.maxRetries) {
          try {
            // Add delay for prayer time respect
            if (finalConfig.respectPrayerTime && checkPrayerTime()) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }

            const data = await queryFn();
            
            // Cache successful result
            if (finalConfig.enableCache) {
              setCachedData(queryKey, data);
            }
            
            return data;
          } catch (error) {
            lastError = error as Error;
            attempts++;
            
            if (attempts < finalConfig.maxRetries) {
              // Exponential backoff
              const delay = Math.min(1000 * Math.pow(2, attempts), 5000);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        }
        
        throw lastError || new Error('Query failed after retries');
      },
      finalConfig.priority
    );

    return result;
  } catch (error) {
    console.error(`Query failed: ${queryKey}`, error);
    throw error;
  }
}

// Cache utilities
function getCachedData<T>(key: string, ttl: number): T | null {
  try {
    const cached = queryCache.getString(key);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    
    if (Date.now() - timestamp > ttl) {
      queryCache.delete(key);
      return null;
    }
    
    return data;
  } catch {
    return null;
  }
}

function setCachedData<T>(key: string, data: T): void {
  try {
    queryCache.set(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (error) {
    console.warn('Failed to cache data:', error);
  }
}

// Optimized queries for mobile apps

// Student-focused queries (optimized for Student App)
export const StudentQueries = {
  // Get student profile with minimal fields
  getProfile: (studentId: string) =>
    executeOptimizedQuery(
      `student-profile-${studentId}`,
      () => supabase
        .from('students')
        .select(`
          id,
          full_name,
          email,
          phone,
          student_app_settings (
            language_preference,
            theme_preference,
            notification_preferences
          )
        `)
        .eq('id', studentId)
        .single(),
      { priority: 'high', cacheTTL: 600000 } // 10 minutes cache
    ),

  // Get student dashboard data (batched for efficiency)
  getDashboardData: (studentId: string) =>
    executeOptimizedQuery(
      `student-dashboard-${studentId}`,
      async () => {
        // Batch multiple queries for dashboard
        const [achievements, rankings, lessons, vocabulary] = await Promise.all([
          supabase
            .from('student_achievements')
            .select('achievement_type, unlocked_at, achievement_data')
            .eq('student_id', studentId)
            .order('unlocked_at', { ascending: false })
            .limit(5),
          
          supabase
            .from('student_rankings')
            .select('subject, current_rank, total_participants')
            .eq('student_id', studentId)
            .limit(5),
          
          supabase
            .from('student_lesson_progress')
            .select(`
              lesson_id,
              completion_percentage,
              lessons (id, title, estimated_duration)
            `)
            .eq('student_id', studentId)
            .gte('completion_percentage', 0)
            .lt('completion_percentage', 100)
            .limit(3),
          
          supabase
            .from('student_vocabulary_progress')
            .select('words_learned, total_words, streak_count')
            .eq('student_id', studentId)
            .single(),
        ]);

        return {
          achievements: achievements.data || [],
          rankings: rankings.data || [],
          lessons: lessons.data || [],
          vocabulary: vocabulary.data,
        };
      },
      { priority: 'high', cacheTTL: 180000 } // 3 minutes cache
    ),

  // Get lessons with pagination and filtering
  getLessons: (studentId: string, page = 0, limit = 20) =>
    executeOptimizedQuery(
      `student-lessons-${studentId}-${page}`,
      () => supabase
        .from('lessons')
        .select(`
          id,
          title,
          description,
          estimated_duration,
          difficulty_level,
          student_lesson_progress!inner (
            completion_percentage,
            last_accessed_at
          )
        `)
        .eq('student_lesson_progress.student_id', studentId)
        .order('student_lesson_progress.last_accessed_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1),
      { priority: 'normal', cacheTTL: 300000 }
    ),

  // Get vocabulary words with FSRS optimization
  getVocabularyWords: (studentId: string, limit = 20) =>
    executeOptimizedQuery(
      `student-vocabulary-${studentId}`,
      () => supabase
        .from('vocabulary_words')
        .select(`
          id,
          word,
          translation,
          difficulty_level,
          student_vocabulary_progress!inner (
            review_count,
            success_rate,
            next_review_date
          )
        `)
        .eq('student_vocabulary_progress.student_id', studentId)
        .lte('student_vocabulary_progress.next_review_date', new Date().toISOString())
        .order('student_vocabulary_progress.next_review_date', { ascending: true })
        .limit(limit),
      { priority: 'normal', cacheTTL: 120000 } // 2 minutes cache for active learning
    ),
};

// Teacher-focused queries (optimized for Teacher App)
export const TeacherQueries = {
  // Get teacher profile and assignments
  getProfile: (teacherId: string) =>
    executeOptimizedQuery(
      `teacher-profile-${teacherId}`,
      () => supabase
        .from('teachers')
        .select(`
          id,
          full_name,
          email,
          phone,
          specialization,
          teacher_group_assignments (
            group_id,
            groups (id, name, grade_level)
          )
        `)
        .eq('id', teacherId)
        .single(),
      { priority: 'high', cacheTTL: 600000 }
    ),

  // Get teacher dashboard data
  getDashboardData: (teacherId: string) =>
    executeOptimizedQuery(
      `teacher-dashboard-${teacherId}`,
      async () => {
        // Batch queries for teacher dashboard
        const [groups, students, attendance, evaluations] = await Promise.all([
          supabase
            .from('teacher_group_assignments')
            .select(`
              groups (
                id,
                name,
                student_count,
                active_status
              )
            `)
            .eq('teacher_id', teacherId),
          
          supabase
            .from('students')
            .select('id, full_name, current_level')
            .in('id', 
              supabase
                .from('student_group_enrollments')
                .select('student_id')
                .in('group_id', 
                  supabase
                    .from('teacher_group_assignments')
                    .select('group_id')
                    .eq('teacher_id', teacherId)
                )
            )
            .limit(10),
          
          supabase
            .from('student_attendance')
            .select('attendance_date, status, student_id')
            .gte('attendance_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
            .limit(50),
          
          supabase
            .from('teacher_evaluations')
            .select('evaluation_date, overall_rating')
            .eq('teacher_id', teacherId)
            .order('evaluation_date', { ascending: false })
            .limit(3),
        ]);

        return {
          groups: groups.data || [],
          students: students.data || [],
          attendance: attendance.data || [],
          evaluations: evaluations.data || [],
        };
      },
      { priority: 'high', cacheTTL: 180000 }
    ),

  // Get students for attendance marking
  getStudentsForAttendance: (groupId: string, date: string) =>
    executeOptimizedQuery(
      `attendance-students-${groupId}-${date}`,
      () => supabase
        .from('students')
        .select(`
          id,
          full_name,
          student_attendance (
            status,
            attendance_date
          )
        `)
        .in('id',
          supabase
            .from('student_group_enrollments')
            .select('student_id')
            .eq('group_id', groupId)
            .eq('status', 'active')
        )
        .order('full_name'),
      { priority: 'high', cacheTTL: 60000 } // 1 minute cache for real-time data
    ),

  // Batch update attendance (optimized for mobile)
  updateAttendanceBatch: async (attendanceData: Array<{
    student_id: string;
    group_id: string;
    attendance_date: string;
    status: 'present' | 'absent' | 'late';
  }>) => {
    const batcher = QueryBatcher.getInstance();
    
    return batcher.addQuery(
      async () => {
        // Use upsert for efficient batch updates
        const { data, error } = await supabase
          .from('student_attendance')
          .upsert(attendanceData, { 
            onConflict: 'student_id,group_id,attendance_date',
            ignoreDuplicates: false 
          });

        if (error) throw error;

        // Invalidate relevant caches
        attendanceData.forEach(item => {
          queryCache.delete(`attendance-students-${item.group_id}-${item.attendance_date}`);
        });

        return data;
      },
      'high'
    );
  },
};

// Common administrative queries
export const AdminQueries = {
  // Get system statistics (cached heavily)
  getSystemStats: () =>
    executeOptimizedQuery(
      'system-stats',
      async () => {
        const [studentsCount, teachersCount, activeGroups, totalLessons] = await Promise.all([
          supabase
            .from('students')
            .select('id', { count: 'exact' })
            .eq('status', 'active'),
          
          supabase
            .from('teachers')
            .select('id', { count: 'exact' })
            .eq('status', 'active'),
          
          supabase
            .from('groups')
            .select('id', { count: 'exact' })
            .eq('active_status', true),
          
          supabase
            .from('lessons')
            .select('id', { count: 'exact' }),
        ]);

        return {
          studentsCount: studentsCount.count || 0,
          teachersCount: teachersCount.count || 0,
          activeGroups: activeGroups.count || 0,
          totalLessons: totalLessons.count || 0,
        };
      },
      { priority: 'low', cacheTTL: 1800000 } // 30 minutes cache
    ),

  // Get cultural celebrations (for Islamic calendar integration)
  getCulturalCelebrations: (startDate: string, endDate: string) =>
    executeOptimizedQuery(
      `cultural-celebrations-${startDate}-${endDate}`,
      () => supabase
        .from('cultural_celebrations')
        .select('celebration_name, celebration_date, celebration_type, cultural_significance')
        .gte('celebration_date', startDate)
        .lte('celebration_date', endDate)
        .order('celebration_date'),
      { priority: 'low', cacheTTL: 3600000 } // 1 hour cache
    ),
};

// Utility functions for query optimization
export const QueryUtils = {
  // Clear all caches
  clearCache: () => {
    queryCache.clearAll();
  },

  // Clear specific cache pattern
  clearCachePattern: (pattern: string) => {
    const keys = queryCache.getAllKeys();
    keys.forEach(key => {
      if (key.includes(pattern)) {
        queryCache.delete(key);
      }
    });
  },

  // Preload critical data
  preloadCriticalData: async (userId: string, userType: 'student' | 'teacher') => {
    InteractionManager.runAfterInteractions(async () => {
      try {
        if (userType === 'student') {
          await Promise.allSettled([
            StudentQueries.getProfile(userId),
            StudentQueries.getDashboardData(userId),
          ]);
        } else if (userType === 'teacher') {
          await Promise.allSettled([
            TeacherQueries.getProfile(userId),
            TeacherQueries.getDashboardData(userId),
          ]);
        }
      } catch (error) {
        console.warn('Failed to preload critical data:', error);
      }
    });
  },

  // Get cache statistics
  getCacheStats: () => {
    const keys = queryCache.getAllKeys();
    let totalSize = 0;
    let expiredKeys = 0;
    const now = Date.now();

    keys.forEach(key => {
      try {
        const cached = queryCache.getString(key);
        if (cached) {
          totalSize += cached.length;
          const { timestamp } = JSON.parse(cached);
          if (now - timestamp > 300000) { // Default TTL
            expiredKeys++;
          }
        }
      } catch {
        // Invalid cache entry
      }
    });

    return {
      totalKeys: keys.length,
      totalSize,
      expiredKeys,
      hitRate: 0, // Would need to track this separately
    };
  },
};

export default {
  StudentQueries,
  TeacherQueries,
  AdminQueries,
  QueryUtils,
};