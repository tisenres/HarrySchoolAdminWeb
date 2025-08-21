import { supabase } from './supabase';

export interface Group {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  group_code?: string;
  subject: string;
  level?: string;
  curriculum?: any;
  schedule: {
    days: string[];
    time: string;
    duration: number;
  };
  start_date: string;
  end_date?: string;
  duration_weeks?: number;
  max_students: number;
  current_enrollment?: number;
  waiting_list_count?: number;
  status?: string;
  group_type?: string;
  price_per_student?: number;
  currency?: string;
  payment_frequency?: string;
  classroom?: string;
  online_meeting_url?: string;
  required_materials?: any;
  is_active?: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TeacherGroupAssignment {
  id: string;
  organization_id: string;
  teacher_id: string;
  group_id: string;
  role?: string;
  start_date: string;
  end_date?: string;
  compensation_rate?: number;
  compensation_type?: string;
  status?: string;
  notes?: string;
}

export interface StudentGroupEnrollment {
  id: string;
  organization_id: string;
  student_id: string;
  group_id: string;
  enrollment_date: string;
  start_date: string;
  end_date?: string;
  completion_date?: string;
  status?: string;
  attendance_rate?: number;
  progress_notes?: string;
  tuition_amount?: number;
  amount_paid?: number;
  payment_status?: string;
  final_grade?: string;
  certificate_issued?: boolean;
  certificate_number?: string;
  notes?: string;
}

export interface GroupWithStats {
  id: string;
  name: string;
  subject: string;
  level?: string;
  student_count: number;
  avg_attendance_rate: number;
  active_students: number;
  max_students: number;
  group_status?: string;
  start_date: string;
  end_date?: string;
  classroom?: string;
  schedule: any;
  color?: string;
  stats: {
    presentToday: number;
    totalToday: number;
    averagePerformance: number;
    pendingTasks: number;
  };
}

export interface GroupDetail extends Group {
  students: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
    attendance_rate: number;
    status: 'present' | 'absent' | 'late' | 'excused';
  }[];
  teacher: {
    id: string;
    name: string;
  };
  recentActivity: {
    type: 'attendance' | 'performance' | 'message' | 'task';
    description: string;
    timestamp: string;
  }[];
}

export class OptimizedGroupsQueries {
  /**
   * Get teacher's groups with statistics using materialized view
   * Performance target: <500ms for 6 groups, <1s for 50+ students per group
   */
  static async getTeacherGroups(
    teacherId: string,
    organizationId: string
  ): Promise<GroupWithStats[]> {
    try {
      // Use materialized view for optimized performance
      const { data: groupStats, error } = await supabase
        .from('teacher_group_stats')
        .select('*')
        .eq('teacher_id', teacherId)
        .eq('organization_id', organizationId)
        .order('group_name', { ascending: true });

      if (error) throw error;

      // Transform to GroupWithStats format and add mock stats for demo
      const groupsWithStats: GroupWithStats[] = (groupStats || []).map(group => ({
        id: group.group_id,
        name: group.group_name,
        subject: group.subject,
        level: group.level,
        student_count: group.student_count || 0,
        avg_attendance_rate: parseFloat(group.avg_attendance_rate) || 0,
        active_students: group.active_students || 0,
        max_students: group.max_students,
        group_status: group.group_status,
        start_date: group.start_date,
        end_date: group.end_date,
        classroom: group.classroom,
        schedule: group.schedule,
        color: OptimizedGroupsQueries.getGroupColor(group.subject),
        stats: {
          presentToday: Math.floor((group.active_students || 0) * 0.9), // Mock data
          totalToday: group.active_students || 0,
          averagePerformance: 75 + Math.random() * 20, // Mock data
          pendingTasks: Math.floor(Math.random() * 5) // Mock data
        }
      }));

      return groupsWithStats;
    } catch (error) {
      console.error('Error fetching teacher groups:', error);
      throw error;
    }
  }

  /**
   * Get detailed group information with students
   * Uses optimized joins and indexes for fast retrieval
   */
  static async getGroupDetail(
    groupId: string,
    teacherId?: string
  ): Promise<GroupDetail | null> {
    try {
      // Get group basic information
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select(`
          *,
          teacher_group_assignments!inner (
            teacher_id,
            users:teacher_id (
              id,
              full_name
            )
          )
        `)
        .eq('id', groupId)
        .eq('is_active', true)
        .is('deleted_at', null)
        .single();

      if (groupError) throw groupError;
      if (!group) return null;

      // Get enrolled students with attendance data
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('student_group_enrollments')
        .select(`
          *,
          students (
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('group_id', groupId)
        .eq('status', 'enrolled')
        .is('deleted_at', null)
        .order('students(last_name)', { ascending: true });

      if (enrollmentsError) throw enrollmentsError;

      // Transform students data
      const students = (enrollments || []).map(enrollment => ({
        id: enrollment.students.id,
        first_name: enrollment.students.first_name,
        last_name: enrollment.students.last_name,
        avatar_url: enrollment.students.avatar_url,
        attendance_rate: parseFloat(enrollment.attendance_rate) || 0,
        status: 'present' as const // Mock status - would come from today's attendance
      }));

      // Get teacher information
      const teacher = group.teacher_group_assignments[0]?.users || {
        id: 'unknown',
        full_name: 'Unknown Teacher'
      };

      // Mock recent activity - would be fetched from actual activity log
      const recentActivity = [
        {
          type: 'attendance' as const,
          description: 'Marked attendance for today\'s class',
          timestamp: new Date().toISOString()
        },
        {
          type: 'performance' as const,
          description: 'Updated quiz scores for Unit 3',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      return {
        ...group,
        students,
        teacher: {
          id: teacher.id,
          name: teacher.full_name
        },
        recentActivity
      };

    } catch (error) {
      console.error('Error fetching group detail:', error);
      throw error;
    }
  }

  /**
   * Search groups across teacher's assignments
   * Uses trigram indexes for fuzzy text search
   */
  static async searchTeacherGroups(
    teacherId: string,
    organizationId: string,
    searchQuery: string
  ): Promise<GroupWithStats[]> {
    try {
      const { data, error } = await supabase
        .from('teacher_group_stats')
        .select('*')
        .eq('teacher_id', teacherId)
        .eq('organization_id', organizationId)
        .or(`group_name.ilike.%${searchQuery}%,subject.ilike.%${searchQuery}%,level.ilike.%${searchQuery}%`)
        .order('group_name', { ascending: true });

      if (error) throw error;

      return (data || []).map(group => ({
        id: group.group_id,
        name: group.group_name,
        subject: group.subject,
        level: group.level,
        student_count: group.student_count || 0,
        avg_attendance_rate: parseFloat(group.avg_attendance_rate) || 0,
        active_students: group.active_students || 0,
        max_students: group.max_students,
        group_status: group.group_status,
        start_date: group.start_date,
        end_date: group.end_date,
        classroom: group.classroom,
        schedule: group.schedule,
        color: OptimizedGroupsQueries.getGroupColor(group.subject),
        stats: {
          presentToday: Math.floor((group.active_students || 0) * 0.9),
          totalToday: group.active_students || 0,
          averagePerformance: 75 + Math.random() * 20,
          pendingTasks: Math.floor(Math.random() * 5)
        }
      }));

    } catch (error) {
      console.error('Error searching groups:', error);
      throw error;
    }
  }

  /**
   * Get group students with pagination for large groups
   * Optimized for 50+ students per group
   */
  static async getGroupStudents(
    groupId: string,
    page: number = 0,
    limit: number = 20
  ): Promise<{
    students: any[];
    totalCount: number;
    hasMore: boolean;
  }> {
    try {
      const offset = page * limit;

      // Get total count first
      const { count, error: countError } = await supabase
        .from('student_group_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId)
        .eq('status', 'enrolled')
        .is('deleted_at', null);

      if (countError) throw countError;

      // Get paginated students
      const { data: enrollments, error } = await supabase
        .from('student_group_enrollments')
        .select(`
          *,
          students (
            id,
            first_name,
            last_name,
            avatar_url,
            date_of_birth,
            phone_number,
            email
          )
        `)
        .eq('group_id', groupId)
        .eq('status', 'enrolled')
        .is('deleted_at', null)
        .order('students(last_name)', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const students = (enrollments || []).map(enrollment => ({
        ...enrollment.students,
        enrollment_data: {
          enrollment_date: enrollment.enrollment_date,
          attendance_rate: parseFloat(enrollment.attendance_rate) || 0,
          progress_notes: enrollment.progress_notes,
          payment_status: enrollment.payment_status
        }
      }));

      return {
        students,
        totalCount: count || 0,
        hasMore: (offset + limit) < (count || 0)
      };

    } catch (error) {
      console.error('Error fetching group students:', error);
      throw error;
    }
  }

  /**
   * Get group performance analytics
   * Optimized aggregation queries for dashboard
   */
  static async getGroupPerformanceAnalytics(
    groupId: string,
    startDate?: string,
    endDate?: string
  ): Promise<{
    attendanceStats: {
      averageRate: number;
      totalClasses: number;
      trend: 'up' | 'down' | 'stable';
    };
    academicStats: {
      averageGrade: number;
      passRate: number;
      completionRate: number;
    };
    engagementStats: {
      activeStudents: number;
      atRiskStudents: number;
      topPerformers: number;
    };
  }> {
    try {
      // This would use actual performance tables in real implementation
      // For now, returning mock data that matches the expected structure
      
      const attendanceStats = {
        averageRate: 0.87,
        totalClasses: 32,
        trend: 'up' as const
      };

      const academicStats = {
        averageGrade: 78.5,
        passRate: 0.89,
        completionRate: 0.92
      };

      const engagementStats = {
        activeStudents: 16,
        atRiskStudents: 2,
        topPerformers: 5
      };

      return {
        attendanceStats,
        academicStats,
        engagementStats
      };

    } catch (error) {
      console.error('Error fetching group analytics:', error);
      throw error;
    }
  }

  /**
   * Bulk update student enrollments
   * Optimized for batch operations
   */
  static async bulkUpdateStudentStatus(
    updates: {
      studentId: string;
      groupId: string;
      status: string;
      notes?: string;
    }[]
  ): Promise<{ success: number; errors: any[] }> {
    try {
      const results = await Promise.allSettled(
        updates.map(update =>
          supabase
            .from('student_group_enrollments')
            .update({
              status: update.status,
              notes: update.notes,
              updated_at: new Date().toISOString()
            })
            .eq('student_id', update.studentId)
            .eq('group_id', update.groupId)
            .is('deleted_at', null)
        )
      );

      const success = results.filter(r => r.status === 'fulfilled').length;
      const errors = results
        .filter(r => r.status === 'rejected')
        .map(r => (r as PromiseRejectedResult).reason);

      return { success, errors };

    } catch (error) {
      console.error('Error bulk updating students:', error);
      throw error;
    }
  }

  /**
   * Get group communication history
   * Optimized for teacher messaging workflows
   */
  static async getGroupCommunicationHistory(
    groupId: string,
    limit: number = 20
  ): Promise<any[]> {
    try {
      // This would query actual communication logs table
      // For now, returning mock data
      return [
        {
          id: '1',
          type: 'group_message',
          subject: 'Homework Reminder',
          content: 'Please remember to complete Chapter 3 exercises for tomorrow.',
          sent_at: new Date().toISOString(),
          recipients_count: 18,
          read_count: 15,
          response_count: 3
        }
      ];

    } catch (error) {
      console.error('Error fetching communication history:', error);
      throw error;
    }
  }

  /**
   * Refresh materialized view for updated statistics
   * Should be called after significant data changes
   */
  static async refreshGroupStats(): Promise<void> {
    try {
      await supabase.rpc('refresh_teacher_group_stats');
    } catch (error) {
      console.error('Error refreshing group stats:', error);
      // Don't throw - this is a performance optimization, not critical
    }
  }

  /**
   * Get group color based on subject for UI consistency
   */
  static getGroupColor(subject: string): string {
    const colorMap: Record<string, string> = {
      'English': '#1d7452',
      'Math': '#2563eb',
      'Science': '#7c3aed',
      'History': '#dc2626',
      'Art': '#f59e0b',
      'Music': '#ec4899',
      'Physical Education': '#059669',
      'Computer Science': '#6366f1'
    };

    return colorMap[subject] || '#6b7280';
  }

  /**
   * Get group schedule conflicts for teacher
   * Helps prevent double-booking
   */
  static async getScheduleConflicts(
    teacherId: string,
    organizationId: string,
    schedule: { days: string[]; time: string; duration: number },
    excludeGroupId?: string
  ): Promise<GroupWithStats[]> {
    try {
      const { data, error } = await supabase
        .from('teacher_group_stats')
        .select('*')
        .eq('teacher_id', teacherId)
        .eq('organization_id', organizationId)
        .neq('group_id', excludeGroupId || '')
        .contains('schedule', { days: schedule.days });

      if (error) throw error;

      // Filter for time conflicts (would need more sophisticated logic)
      return (data || []).map(group => ({
        id: group.group_id,
        name: group.group_name,
        subject: group.subject,
        level: group.level,
        student_count: group.student_count || 0,
        avg_attendance_rate: parseFloat(group.avg_attendance_rate) || 0,
        active_students: group.active_students || 0,
        max_students: group.max_students,
        group_status: group.group_status,
        start_date: group.start_date,
        end_date: group.end_date,
        classroom: group.classroom,
        schedule: group.schedule,
        color: OptimizedGroupsQueries.getGroupColor(group.subject),
        stats: {
          presentToday: Math.floor((group.active_students || 0) * 0.9),
          totalToday: group.active_students || 0,
          averagePerformance: 75 + Math.random() * 20,
          pendingTasks: Math.floor(Math.random() * 5)
        }
      }));

    } catch (error) {
      console.error('Error checking schedule conflicts:', error);
      throw error;
    }
  }
}

export default OptimizedGroupsQueries;