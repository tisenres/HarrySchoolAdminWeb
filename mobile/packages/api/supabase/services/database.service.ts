/**
 * Type-Safe Database Service for Harry School Mobile Apps
 * 
 * Provides a comprehensive, type-safe interface to Supabase database operations
 * with educational domain-specific methods, caching, and offline support.
 * 
 * Features:
 * - Type-safe CRUD operations
 * - Educational domain methods (enrollment, attendance, tasks)
 * - Smart caching with TTL
 * - Offline queue integration
 * - Performance monitoring
 * - Error handling and retry logic
 */

import type { Database } from '../types/database';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { 
  SupabaseResponse, 
  SupabasePaginatedResponse,
  RetryOptions,
  CacheOptions 
} from '../types/supabase';
import { MobileSupabaseClient } from '../client';
import { PerformanceMonitor } from '../performance';
import { CacheManager } from '../cache';
import { ErrorHandler } from '../error-handler';

// Type aliases for cleaner code
type Tables = Database['public']['Tables'];
type TableName = keyof Tables;
type TableRow<T extends TableName> = Tables[T]['Row'];
type TableInsert<T extends TableName> = Tables[T]['Insert'];
type TableUpdate<T extends TableName> = Tables[T]['Update'];

/**
 * Educational domain-specific filter types
 */
export interface StudentFilters {
  groupIds?: string[];
  levelRange?: [number, number];
  rankingPointsMin?: number;
  searchQuery?: string;
  enrollmentStatus?: 'active' | 'inactive' | 'completed';
}

export interface TeacherFilters {
  specializations?: string[];
  groupIds?: string[];
  levelMin?: number;
  searchQuery?: string;
  availabilityStatus?: 'active' | 'on_leave' | 'unavailable';
}

export interface GroupFilters {
  subjects?: string[];
  levels?: string[];
  teacherIds?: string[];
  status?: string[];
  enrollmentStatus?: 'open' | 'full' | 'closed';
  dateRange?: [string, string];
}

export interface TaskFilters {
  taskTypes?: Array<'text' | 'quiz' | 'speaking' | 'listening' | 'writing'>;
  completionStatus?: 'completed' | 'pending' | 'overdue';
  dateRange?: [string, string];
  difficultyLevel?: [1, 5];
}

export interface AttendanceFilters {
  dateRange?: [string, string];
  status?: Array<'present' | 'absent' | 'late' | 'excused'>;
  groupIds?: string[];
  studentIds?: string[];
}

/**
 * Pagination configuration
 */
export interface PaginationConfig {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Analytics and reporting types
 */
export interface StudentAnalytics {
  totalPoints: number;
  currentLevel: number;
  completedTasks: number;
  attendanceRate: number;
  vocabularyMastery: number;
  weeklyProgress: Array<{
    week: string;
    points: number;
    tasksCompleted: number;
  }>;
}

export interface GroupAnalytics {
  totalStudents: number;
  averageAttendance: number;
  averagePerformance: number;
  taskCompletionRate: number;
  studentRetentionRate: number;
}

/**
 * Main Database Service Class
 */
export class DatabaseService {
  private client: MobileSupabaseClient;
  private supabaseClient: SupabaseClient<Database> | null;
  private performanceMonitor: PerformanceMonitor;
  private cacheManager: CacheManager;
  private errorHandler: ErrorHandler;

  constructor(client: MobileSupabaseClient) {
    this.client = client;
    this.supabaseClient = client.getClient();
    this.performanceMonitor = new PerformanceMonitor();
    this.cacheManager = new CacheManager();
    this.errorHandler = new ErrorHandler();
  }

  /**
   * Generic CRUD Operations
   */

  async create<T extends TableName>(
    table: T,
    data: TableInsert<T>,
    options?: { 
      cache?: boolean;
      retryOptions?: RetryOptions;
    }
  ): Promise<SupabaseResponse<TableRow<T>>> {
    const startTime = Date.now();
    
    try {
      const result = await this.client.query(
        async (client) => {
          const { data: result, error } = await client
            .from(table)
            .insert(data)
            .select()
            .single();
          
          return { data: result, error };
        },
        options?.retryOptions
      );

      if (result.data && options?.cache) {
        this.cacheManager.set(`${table}:${result.data.id}`, result.data);
        this.cacheManager.invalidatePattern(`${table}:list:*`);
      }

      this.performanceMonitor.recordQuery({
        operation: 'INSERT',
        table,
        duration: Date.now() - startTime,
        success: !result.error
      });

      return result;
    } catch (error) {
      this.errorHandler.logError('DATABASE_CREATE_ERROR', error);
      throw error;
    }
  }

  async findById<T extends TableName>(
    table: T,
    id: string,
    options?: CacheOptions
  ): Promise<SupabaseResponse<TableRow<T>>> {
    const cacheKey = `${table}:${id}`;
    
    // Check cache first
    if (options?.useCache) {
      const cached = this.cacheManager.get<TableRow<T>>(cacheKey);
      if (cached) {
        return { data: cached, error: null };
      }
    }

    const startTime = Date.now();
    
    try {
      const result = await this.client.query(
        async (client) => {
          const { data, error } = await client
            .from(table)
            .select('*')
            .eq('id', id)
            .eq('deleted_at', null)
            .single();
          
          return { data, error };
        }
      );

      if (result.data && options?.useCache) {
        this.cacheManager.set(cacheKey, result.data, options.ttl);
      }

      this.performanceMonitor.recordQuery({
        operation: 'SELECT',
        table,
        duration: Date.now() - startTime,
        success: !result.error
      });

      return result;
    } catch (error) {
      this.errorHandler.logError('DATABASE_FIND_ERROR', error);
      throw error;
    }
  }

  async update<T extends TableName>(
    table: T,
    id: string,
    data: TableUpdate<T>,
    options?: { 
      cache?: boolean;
      retryOptions?: RetryOptions;
    }
  ): Promise<SupabaseResponse<TableRow<T>>> {
    const startTime = Date.now();
    
    try {
      const result = await this.client.query(
        async (client) => {
          const { data: result, error } = await client
            .from(table)
            .update(data)
            .eq('id', id)
            .select()
            .single();
          
          return { data: result, error };
        },
        options?.retryOptions
      );

      if (result.data && options?.cache) {
        this.cacheManager.set(`${table}:${id}`, result.data);
        this.cacheManager.invalidatePattern(`${table}:list:*`);
      }

      this.performanceMonitor.recordQuery({
        operation: 'UPDATE',
        table,
        duration: Date.now() - startTime,
        success: !result.error
      });

      return result;
    } catch (error) {
      this.errorHandler.logError('DATABASE_UPDATE_ERROR', error);
      throw error;
    }
  }

  async softDelete<T extends TableName>(
    table: T,
    id: string,
    deletedBy?: string
  ): Promise<SupabaseResponse<TableRow<T>>> {
    const startTime = Date.now();
    
    try {
      const result = await this.client.query(
        async (client) => {
          const { data: result, error } = await client
            .from(table)
            .update({ 
              deleted_at: new Date().toISOString(),
              deleted_by: deletedBy || null 
            } as any)
            .eq('id', id)
            .select()
            .single();
          
          return { data: result, error };
        }
      );

      if (result.data) {
        this.cacheManager.delete(`${table}:${id}`);
        this.cacheManager.invalidatePattern(`${table}:list:*`);
      }

      this.performanceMonitor.recordQuery({
        operation: 'DELETE',
        table,
        duration: Date.now() - startTime,
        success: !result.error
      });

      return result;
    } catch (error) {
      this.errorHandler.logError('DATABASE_DELETE_ERROR', error);
      throw error;
    }
  }

  /**
   * Student-Specific Operations
   */

  async getStudents(
    filters?: StudentFilters,
    pagination?: PaginationConfig,
    cacheOptions?: CacheOptions
  ): Promise<SupabasePaginatedResponse<TableRow<'students'>>> {
    const cacheKey = `students:list:${JSON.stringify({ filters, pagination })}`;
    
    if (cacheOptions?.useCache) {
      const cached = this.cacheManager.get(cacheKey);
      if (cached) return cached;
    }

    const startTime = Date.now();
    
    try {
      const result = await this.client.query(
        async (client) => {
          let query = client
            .from('students')
            .select('*', { count: 'exact' })
            .eq('deleted_at', null);

          // Apply filters
          if (filters) {
            if (filters.groupIds?.length) {
              query = query.overlaps('group_ids', filters.groupIds);
            }
            if (filters.levelRange) {
              query = query
                .gte('level', filters.levelRange[0])
                .lte('level', filters.levelRange[1]);
            }
            if (filters.rankingPointsMin) {
              query = query.gte('ranking_points', filters.rankingPointsMin);
            }
            if (filters.searchQuery) {
              query = query.or(`name.ilike.%${filters.searchQuery}%,email.ilike.%${filters.searchQuery}%`);
            }
          }

          // Apply pagination
          if (pagination) {
            const { page, pageSize, sortBy = 'created_at', sortOrder = 'desc' } = pagination;
            const offset = (page - 1) * pageSize;
            
            query = query
              .order(sortBy, { ascending: sortOrder === 'asc' })
              .range(offset, offset + pageSize - 1);
          }

          const { data, error, count } = await query;
          
          return { 
            data: data || [], 
            error,
            count: count || 0,
            page: pagination?.page || 1,
            pageSize: pagination?.pageSize || data?.length || 0
          };
        }
      );

      if (cacheOptions?.useCache && result.data) {
        this.cacheManager.set(cacheKey, result, cacheOptions.ttl);
      }

      this.performanceMonitor.recordQuery({
        operation: 'SELECT',
        table: 'students',
        duration: Date.now() - startTime,
        success: !result.error
      });

      return result;
    } catch (error) {
      this.errorHandler.logError('DATABASE_STUDENTS_QUERY_ERROR', error);
      throw error;
    }
  }

  async getStudentAnalytics(
    studentId: string,
    dateRange?: [string, string]
  ): Promise<SupabaseResponse<StudentAnalytics>> {
    const cacheKey = `analytics:student:${studentId}:${JSON.stringify(dateRange)}`;
    const cached = this.cacheManager.get<StudentAnalytics>(cacheKey);
    
    if (cached) {
      return { data: cached, error: null };
    }

    try {
      const result = await this.client.query(
        async (client) => {
          // Parallel queries for analytics data
          const [
            studentData,
            tasksData, 
            attendanceData,
            vocabularyData
          ] = await Promise.all([
            client.from('students').select('ranking_points, level').eq('id', studentId).single(),
            client.from('home_tasks')
              .select('completed_at, score, created_at')
              .eq('student_id', studentId)
              .gte('created_at', dateRange?.[0] || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
            client.from('attendance')
              .select('status, date')
              .eq('student_id', studentId)
              .gte('date', dateRange?.[0] || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
            client.from('student_vocabulary')
              .select('mastery_level')
              .eq('student_id', studentId)
          ]);

          if (studentData.error) throw studentData.error;

          const student = studentData.data;
          const tasks = tasksData.data || [];
          const attendance = attendanceData.data || [];
          const vocabulary = vocabularyData.data || [];

          // Calculate analytics
          const completedTasks = tasks.filter(t => t.completed_at).length;
          const attendanceRate = attendance.length > 0 
            ? attendance.filter(a => a.status === 'present').length / attendance.length 
            : 0;
          
          const vocabularyMastery = vocabulary.length > 0
            ? vocabulary.reduce((sum, v) => sum + v.mastery_level, 0) / vocabulary.length / 3 // 3 is max mastery
            : 0;

          // Weekly progress calculation
          const weeklyProgress = this.calculateWeeklyProgress(tasks);

          const analytics: StudentAnalytics = {
            totalPoints: student.ranking_points,
            currentLevel: student.level,
            completedTasks,
            attendanceRate,
            vocabularyMastery,
            weeklyProgress
          };

          return { data: analytics, error: null };
        }
      );

      if (result.data) {
        this.cacheManager.set(cacheKey, result.data, 300000); // 5 minutes cache
      }

      return result;
    } catch (error) {
      this.errorHandler.logError('STUDENT_ANALYTICS_ERROR', error);
      return { data: null, error: { message: 'Failed to fetch student analytics' } };
    }
  }

  /**
   * Teacher-Specific Operations
   */

  async getTeachers(
    filters?: TeacherFilters,
    pagination?: PaginationConfig,
    cacheOptions?: CacheOptions
  ): Promise<SupabasePaginatedResponse<TableRow<'teachers'>>> {
    const cacheKey = `teachers:list:${JSON.stringify({ filters, pagination })}`;
    
    if (cacheOptions?.useCache) {
      const cached = this.cacheManager.get(cacheKey);
      if (cached) return cached;
    }

    try {
      const result = await this.client.query(
        async (client) => {
          let query = client
            .from('teachers')
            .select('*', { count: 'exact' })
            .eq('deleted_at', null);

          // Apply filters
          if (filters) {
            if (filters.specializations?.length) {
              query = query.overlaps('specializations', filters.specializations);
            }
            if (filters.groupIds?.length) {
              query = query.overlaps('group_ids', filters.groupIds);
            }
            if (filters.levelMin) {
              query = query.gte('level', filters.levelMin);
            }
            if (filters.searchQuery) {
              query = query.or(`name.ilike.%${filters.searchQuery}%,email.ilike.%${filters.searchQuery}%`);
            }
          }

          // Apply pagination
          if (pagination) {
            const { page, pageSize, sortBy = 'created_at', sortOrder = 'desc' } = pagination;
            const offset = (page - 1) * pageSize;
            
            query = query
              .order(sortBy, { ascending: sortOrder === 'asc' })
              .range(offset, offset + pageSize - 1);
          }

          const { data, error, count } = await query;
          
          return { 
            data: data || [], 
            error,
            count: count || 0,
            page: pagination?.page || 1,
            pageSize: pagination?.pageSize || data?.length || 0
          };
        }
      );

      if (cacheOptions?.useCache && result.data) {
        this.cacheManager.set(cacheKey, result, cacheOptions.ttl);
      }

      return result;
    } catch (error) {
      this.errorHandler.logError('DATABASE_TEACHERS_QUERY_ERROR', error);
      throw error;
    }
  }

  async getTeacherGroups(
    teacherId: string,
    cacheOptions?: CacheOptions
  ): Promise<SupabaseResponse<TableRow<'groups'>[]>> {
    const cacheKey = `teacher:${teacherId}:groups`;
    
    if (cacheOptions?.useCache) {
      const cached = this.cacheManager.get(cacheKey);
      if (cached) return cached;
    }

    try {
      const result = await this.client.query(
        async (client) => {
          const { data, error } = await client
            .from('groups')
            .select('*')
            .contains('teacher_ids', [teacherId])
            .eq('deleted_at', null)
            .order('start_date', { ascending: false });

          return { data: data || [], error };
        }
      );

      if (cacheOptions?.useCache && result.data) {
        this.cacheManager.set(cacheKey, result.data, cacheOptions.ttl);
      }

      return result;
    } catch (error) {
      this.errorHandler.logError('TEACHER_GROUPS_QUERY_ERROR', error);
      throw error;
    }
  }

  /**
   * Group-Specific Operations
   */

  async getGroups(
    filters?: GroupFilters,
    pagination?: PaginationConfig,
    cacheOptions?: CacheOptions
  ): Promise<SupabasePaginatedResponse<TableRow<'groups'>>> {
    const cacheKey = `groups:list:${JSON.stringify({ filters, pagination })}`;
    
    if (cacheOptions?.useCache) {
      const cached = this.cacheManager.get(cacheKey);
      if (cached) return cached;
    }

    try {
      const result = await this.client.query(
        async (client) => {
          let query = client
            .from('groups')
            .select('*', { count: 'exact' })
            .eq('deleted_at', null);

          // Apply filters
          if (filters) {
            if (filters.subjects?.length) {
              query = query.in('subject', filters.subjects);
            }
            if (filters.levels?.length) {
              query = query.in('level', filters.levels);
            }
            if (filters.teacherIds?.length) {
              query = query.overlaps('teacher_ids', filters.teacherIds);
            }
            if (filters.status?.length) {
              query = query.in('status', filters.status);
            }
            if (filters.dateRange) {
              query = query
                .gte('start_date', filters.dateRange[0])
                .lte('start_date', filters.dateRange[1]);
            }
          }

          // Apply pagination
          if (pagination) {
            const { page, pageSize, sortBy = 'created_at', sortOrder = 'desc' } = pagination;
            const offset = (page - 1) * pageSize;
            
            query = query
              .order(sortBy, { ascending: sortOrder === 'asc' })
              .range(offset, offset + pageSize - 1);
          }

          const { data, error, count } = await query;
          
          return { 
            data: data || [], 
            error,
            count: count || 0,
            page: pagination?.page || 1,
            pageSize: pagination?.pageSize || data?.length || 0
          };
        }
      );

      if (cacheOptions?.useCache && result.data) {
        this.cacheManager.set(cacheKey, result, cacheOptions.ttl);
      }

      return result;
    } catch (error) {
      this.errorHandler.logError('DATABASE_GROUPS_QUERY_ERROR', error);
      throw error;
    }
  }

  async enrollStudentInGroup(
    groupId: string,
    studentId: string
  ): Promise<SupabaseResponse<TableRow<'groups'>>> {
    try {
      const result = await this.client.query(
        async (client) => {
          // First, get current group data
          const { data: group, error: fetchError } = await client
            .from('groups')
            .select('student_ids, max_students, current_enrollment')
            .eq('id', groupId)
            .single();

          if (fetchError) throw fetchError;
          if (!group) throw new Error('Group not found');

          // Check if student is already enrolled
          if (group.student_ids.includes(studentId)) {
            return { 
              data: null, 
              error: { message: 'Student already enrolled in this group' } 
            };
          }

          // Check capacity
          if (group.current_enrollment && group.current_enrollment >= group.max_students) {
            return { 
              data: null, 
              error: { message: 'Group is at maximum capacity' } 
            };
          }

          // Update group with new student
          const updatedStudentIds = [...group.student_ids, studentId];
          const { data: updatedGroup, error: updateError } = await client
            .from('groups')
            .update({
              student_ids: updatedStudentIds,
              current_enrollment: updatedStudentIds.length,
              updated_at: new Date().toISOString()
            })
            .eq('id', groupId)
            .select()
            .single();

          return { data: updatedGroup, error: updateError };
        }
      );

      if (result.data) {
        this.cacheManager.invalidatePattern(`groups:*`);
        this.cacheManager.invalidatePattern(`student:${studentId}:*`);
      }

      return result;
    } catch (error) {
      this.errorHandler.logError('GROUP_ENROLLMENT_ERROR', error);
      throw error;
    }
  }

  /**
   * Task-Specific Operations
   */

  async getStudentTasks(
    studentId: string,
    filters?: TaskFilters,
    cacheOptions?: CacheOptions
  ): Promise<SupabaseResponse<TableRow<'home_tasks'>[]>> {
    const cacheKey = `student:${studentId}:tasks:${JSON.stringify(filters)}`;
    
    if (cacheOptions?.useCache) {
      const cached = this.cacheManager.get(cacheKey);
      if (cached) return cached;
    }

    try {
      const result = await this.client.query(
        async (client) => {
          let query = client
            .from('home_tasks')
            .select('*')
            .eq('student_id', studentId);

          // Apply filters
          if (filters) {
            if (filters.taskTypes?.length) {
              query = query.in('task_type', filters.taskTypes);
            }
            if (filters.completionStatus) {
              if (filters.completionStatus === 'completed') {
                query = query.not('completed_at', 'is', null);
              } else if (filters.completionStatus === 'pending') {
                query = query.is('completed_at', null).gte('due_date', new Date().toISOString());
              } else if (filters.completionStatus === 'overdue') {
                query = query.is('completed_at', null).lt('due_date', new Date().toISOString());
              }
            }
            if (filters.dateRange) {
              query = query
                .gte('created_at', filters.dateRange[0])
                .lte('created_at', filters.dateRange[1]);
            }
          }

          const { data, error } = await query.order('created_at', { ascending: false });
          
          return { data: data || [], error };
        }
      );

      if (cacheOptions?.useCache && result.data) {
        this.cacheManager.set(cacheKey, result.data, cacheOptions.ttl);
      }

      return result;
    } catch (error) {
      this.errorHandler.logError('STUDENT_TASKS_QUERY_ERROR', error);
      throw error;
    }
  }

  async completeTask(
    taskId: string,
    completionData: {
      score?: number;
      content: any;
    }
  ): Promise<SupabaseResponse<TableRow<'home_tasks'>>> {
    try {
      const result = await this.client.query(
        async (client) => {
          const { data, error } = await client
            .from('home_tasks')
            .update({
              completed_at: new Date().toISOString(),
              score: completionData.score,
              content: {
                ...completionData.content,
                completed: true,
                completionTime: new Date().toISOString()
              },
              updated_at: new Date().toISOString()
            })
            .eq('id', taskId)
            .select()
            .single();

          return { data, error };
        }
      );

      if (result.data) {
        this.cacheManager.invalidatePattern(`student:${result.data.student_id}:tasks:*`);
        this.cacheManager.invalidatePattern(`analytics:student:${result.data.student_id}:*`);
      }

      return result;
    } catch (error) {
      this.errorHandler.logError('TASK_COMPLETION_ERROR', error);
      throw error;
    }
  }

  /**
   * Attendance Operations (Teacher App)
   */

  async markAttendance(
    attendanceRecords: Array<{
      student_id: string;
      group_id: string;
      date: string;
      status: 'present' | 'absent' | 'late' | 'excused';
      notes?: string;
    }>
  ): Promise<SupabaseResponse<TableRow<'attendance'>[]>> {
    try {
      const result = await this.client.query(
        async (client) => {
          const { data, error } = await client
            .from('attendance')
            .upsert(
              attendanceRecords.map(record => ({
                ...record,
                created_at: new Date().toISOString()
              })),
              { 
                onConflict: 'student_id,group_id,date',
                ignoreDuplicates: false 
              }
            )
            .select();

          return { data: data || [], error };
        }
      );

      if (result.data) {
        // Invalidate related caches
        const groupIds = [...new Set(attendanceRecords.map(r => r.group_id))];
        const studentIds = [...new Set(attendanceRecords.map(r => r.student_id))];
        
        groupIds.forEach(groupId => {
          this.cacheManager.invalidatePattern(`attendance:group:${groupId}:*`);
        });
        
        studentIds.forEach(studentId => {
          this.cacheManager.invalidatePattern(`analytics:student:${studentId}:*`);
        });
      }

      return result;
    } catch (error) {
      this.errorHandler.logError('ATTENDANCE_MARKING_ERROR', error);
      throw error;
    }
  }

  async getAttendance(
    filters: AttendanceFilters,
    cacheOptions?: CacheOptions
  ): Promise<SupabaseResponse<TableRow<'attendance'>[]>> {
    const cacheKey = `attendance:${JSON.stringify(filters)}`;
    
    if (cacheOptions?.useCache) {
      const cached = this.cacheManager.get(cacheKey);
      if (cached) return cached;
    }

    try {
      const result = await this.client.query(
        async (client) => {
          let query = client.from('attendance').select('*');

          if (filters.dateRange) {
            query = query
              .gte('date', filters.dateRange[0])
              .lte('date', filters.dateRange[1]);
          }

          if (filters.status?.length) {
            query = query.in('status', filters.status);
          }

          if (filters.groupIds?.length) {
            query = query.in('group_id', filters.groupIds);
          }

          if (filters.studentIds?.length) {
            query = query.in('student_id', filters.studentIds);
          }

          const { data, error } = await query.order('date', { ascending: false });
          
          return { data: data || [], error };
        }
      );

      if (cacheOptions?.useCache && result.data) {
        this.cacheManager.set(cacheKey, result.data, cacheOptions.ttl);
      }

      return result;
    } catch (error) {
      this.errorHandler.logError('ATTENDANCE_QUERY_ERROR', error);
      throw error;
    }
  }

  /**
   * Utility Methods
   */

  private calculateWeeklyProgress(tasks: any[]): StudentAnalytics['weeklyProgress'] {
    const weeklyData: Record<string, { points: number; tasksCompleted: number }> = {};
    
    tasks.forEach(task => {
      if (task.completed_at) {
        const week = this.getWeekKey(new Date(task.completed_at));
        
        if (!weeklyData[week]) {
          weeklyData[week] = { points: 0, tasksCompleted: 0 };
        }
        
        weeklyData[week].points += task.score || 0;
        weeklyData[week].tasksCompleted += 1;
      }
    });

    return Object.entries(weeklyData)
      .map(([week, data]) => ({ week, ...data }))
      .sort((a, b) => a.week.localeCompare(b.week));
  }

  private getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const week = this.getWeekNumber(date);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  /**
   * Cleanup method
   */
  public cleanup(): void {
    this.performanceMonitor.cleanup();
    this.cacheManager.cleanup();
  }
}

export default DatabaseService;