import { supabase } from './supabase';

export interface AttendanceRecord {
  id: string;
  student_id: string;
  class_id: string;
  session_date: string;
  attendance_status: 'present' | 'absent' | 'late' | 'excused';
  marked_at?: string;
  marked_by_student?: boolean;
  location?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceWithStudent extends AttendanceRecord {
  students: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

export interface AttendanceStats {
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendanceRate: number;
}

export class OptimizedAttendanceQueries {
  /**
   * Get attendance records for a specific class and date
   * Uses idx_student_attendance_class_date index for optimal performance
   */
  static async getClassAttendanceByDate(classId: string, date: string): Promise<AttendanceWithStudent[]> {
    const { data, error } = await supabase
      .from('student_attendance')
      .select(`
        *,
        students (
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('class_id', classId)
      .eq('session_date', date)
      .order('students(last_name)', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get attendance statistics for a specific class and date range
   * Uses idx_student_attendance_class_date index
   */
  static async getClassAttendanceStats(
    classId: string, 
    startDate: string, 
    endDate: string
  ): Promise<AttendanceStats[]> {
    const { data, error } = await supabase
      .from('student_attendance')
      .select('session_date, attendance_status')
      .eq('class_id', classId)
      .gte('session_date', startDate)
      .lte('session_date', endDate)
      .order('session_date', { ascending: true });

    if (error) throw error;

    // Group by date and calculate stats
    const groupedByDate = (data || []).reduce((acc, record) => {
      if (!acc[record.session_date]) {
        acc[record.session_date] = {
          date: record.session_date,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          total: 0
        };
      }
      
      acc[record.session_date][record.attendance_status]++;
      acc[record.session_date].total++;
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(groupedByDate).map((stats: any) => ({
      totalStudents: stats.total,
      presentCount: stats.present,
      absentCount: stats.absent,
      lateCount: stats.late,
      excusedCount: stats.excused,
      attendanceRate: (stats.present + stats.late) / stats.total
    }));
  }

  /**
   * Get student attendance history
   * Uses idx_student_attendance_student_date index
   */
  static async getStudentAttendanceHistory(
    studentId: string, 
    startDate: string, 
    endDate: string
  ): Promise<AttendanceRecord[]> {
    const { data, error } = await supabase
      .from('student_attendance')
      .select('*')
      .eq('student_id', studentId)
      .gte('session_date', startDate)
      .lte('session_date', endDate)
      .order('session_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get recent attendance trends for dashboard
   * Uses idx_student_attendance_student_recent index
   */
  static async getRecentAttendanceTrends(studentId: string): Promise<{
    totalClasses: number;
    attendedClasses: number;
    attendanceRate: number;
    recentPattern: string[];
  }> {
    const { data, error } = await supabase
      .from('student_attendance')
      .select('attendance_status, session_date')
      .eq('student_id', studentId)
      .gte('session_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('session_date', { ascending: false })
      .limit(10);

    if (error) throw error;

    const records = data || [];
    const totalClasses = records.length;
    const attendedClasses = records.filter(r => 
      r.attendance_status === 'present' || r.attendance_status === 'late'
    ).length;

    return {
      totalClasses,
      attendedClasses,
      attendanceRate: totalClasses > 0 ? attendedClasses / totalClasses : 0,
      recentPattern: records.map(r => r.attendance_status).reverse()
    };
  }

  /**
   * Bulk upsert attendance records with conflict resolution
   * Optimized for offline sync scenarios
   */
  static async bulkUpsertAttendance(records: Partial<AttendanceRecord>[]): Promise<{
    success: AttendanceRecord[];
    errors: { record: Partial<AttendanceRecord>; error: string }[];
  }> {
    const success: AttendanceRecord[] = [];
    const errors: { record: Partial<AttendanceRecord>; error: string }[] = [];

    // Process in batches of 100 for optimal performance
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      try {
        const { data, error } = await supabase
          .from('student_attendance')
          .upsert(batch, {
            onConflict: 'student_id,class_id,session_date',
            ignoreDuplicates: false
          })
          .select();

        if (error) {
          batch.forEach(record => errors.push({ record, error: error.message }));
        } else {
          success.push(...(data || []));
        }
      } catch (batchError) {
        batch.forEach(record => errors.push({ 
          record, 
          error: batchError instanceof Error ? batchError.message : 'Unknown error'
        }));
      }
    }

    return { success, errors };
  }

  /**
   * Get attendance calendar data with aggregated stats
   * Uses idx_student_attendance_date_status for efficient filtering
   */
  static async getAttendanceCalendarData(
    classId: string,
    startDate: string,
    endDate: string
  ): Promise<Record<string, {
    date: string;
    totalStudents: number;
    presentCount: number;
    attendanceRate: number;
    hasData: boolean;
  }>> {
    const { data, error } = await supabase
      .from('student_attendance')
      .select('session_date, attendance_status')
      .eq('class_id', classId)
      .gte('session_date', startDate)
      .lte('session_date', endDate);

    if (error) throw error;

    const calendar = (data || []).reduce((acc, record) => {
      if (!acc[record.session_date]) {
        acc[record.session_date] = {
          date: record.session_date,
          totalStudents: 0,
          presentCount: 0,
          attendanceRate: 0,
          hasData: true
        };
      }

      acc[record.session_date].totalStudents++;
      if (record.attendance_status === 'present' || record.attendance_status === 'late') {
        acc[record.session_date].presentCount++;
      }

      acc[record.session_date].attendanceRate = 
        acc[record.session_date].presentCount / acc[record.session_date].totalStudents;

      return acc;
    }, {} as Record<string, any>);

    return calendar;
  }

  /**
   * Get low attendance alerts
   * Identifies students with poor attendance patterns
   */
  static async getLowAttendanceAlerts(classId: string, threshold: number = 0.75): Promise<{
    studentId: string;
    studentName: string;
    totalClasses: number;
    attendedClasses: number;
    attendanceRate: number;
    lastAttendance: string | null;
  }[]> {
    // Get last 30 days of data
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('student_attendance')
      .select(`
        student_id,
        attendance_status,
        session_date,
        students (
          first_name,
          last_name
        )
      `)
      .eq('class_id', classId)
      .gte('session_date', thirtyDaysAgo)
      .order('session_date', { ascending: false });

    if (error) throw error;

    // Group by student and calculate attendance rates
    const studentStats = (data || []).reduce((acc, record) => {
      if (!acc[record.student_id]) {
        acc[record.student_id] = {
          studentId: record.student_id,
          studentName: `${record.students.first_name} ${record.students.last_name}`,
          totalClasses: 0,
          attendedClasses: 0,
          attendanceRate: 0,
          lastAttendance: null
        };
      }

      acc[record.student_id].totalClasses++;
      
      if (record.attendance_status === 'present' || record.attendance_status === 'late') {
        acc[record.student_id].attendedClasses++;
        if (!acc[record.student_id].lastAttendance) {
          acc[record.student_id].lastAttendance = record.session_date;
        }
      }

      acc[record.student_id].attendanceRate = 
        acc[record.student_id].attendedClasses / acc[record.student_id].totalClasses;

      return acc;
    }, {} as Record<string, any>);

    // Filter students below threshold
    return Object.values(studentStats).filter((student: any) => 
      student.attendanceRate < threshold && student.totalClasses >= 5
    );
  }

  /**
   * Get class performance overview
   * Aggregated stats for teacher dashboard
   */
  static async getClassPerformanceOverview(classIds: string[]): Promise<{
    classId: string;
    totalStudents: number;
    averageAttendanceRate: number;
    lastSevenDays: {
      date: string;
      attendanceRate: number;
    }[];
  }[]> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const results = await Promise.all(classIds.map(async (classId) => {
      const { data, error } = await supabase
        .from('student_attendance')
        .select('session_date, attendance_status')
        .eq('class_id', classId)
        .gte('session_date', sevenDaysAgo)
        .order('session_date', { ascending: true });

      if (error) {
        console.error(`Error fetching data for class ${classId}:`, error);
        return null;
      }

      // Calculate daily stats
      const dailyStats = (data || []).reduce((acc, record) => {
        if (!acc[record.session_date]) {
          acc[record.session_date] = { total: 0, attended: 0 };
        }
        
        acc[record.session_date].total++;
        if (record.attendance_status === 'present' || record.attendance_status === 'late') {
          acc[record.session_date].attended++;
        }
        
        return acc;
      }, {} as Record<string, { total: number; attended: number }>);

      const lastSevenDays = Object.entries(dailyStats).map(([date, stats]) => ({
        date,
        attendanceRate: stats.total > 0 ? stats.attended / stats.total : 0
      }));

      const totalStudents = Math.max(...Object.values(dailyStats).map(s => s.total), 0);
      const averageAttendanceRate = lastSevenDays.length > 0
        ? lastSevenDays.reduce((sum, day) => sum + day.attendanceRate, 0) / lastSevenDays.length
        : 0;

      return {
        classId,
        totalStudents,
        averageAttendanceRate,
        lastSevenDays
      };
    }));

    return results.filter((result): result is NonNullable<typeof result> => result !== null);
  }
}

export default OptimizedAttendanceQueries;