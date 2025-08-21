import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { memoryCache } from './memoryCache';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  groupId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  teacherId: string;
  studentName: string;
  timestamp: number;
}

export interface AttendanceStats {
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendanceRate: number;
}

export interface AttendanceHistoryRecord {
  date: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendanceRate: number;
}

export interface TeacherValueableStats {
  weeklyTrends: {
    week: string;
    averageAttendance: number;
    totalClasses: number;
  }[];
  topPerformingGroups: {
    groupId: string;
    groupName: string;
    attendanceRate: number;
    studentCount: number;
  }[];
  attendancePatterns: {
    dayOfWeek: string;
    averageAttendance: number;
  }[];
  lowAttendanceAlerts: {
    studentId: string;
    studentName: string;
    groupId: string;
    missedDays: number;
    lastAttendance: string;
  }[];
}

class AttendanceStatsService {
  private cachePrefix = 'attendance_stats_';
  
  async getAttendanceStats(date: string, groupId?: string): Promise<AttendanceStats> {
    const cacheKey = `${this.cachePrefix}${date}_${groupId || 'all'}`;
    
    // Try memory cache first
    const cached = await memoryCache.get<AttendanceStats>(cacheKey);
    if (cached) return cached;

    try {
      // Try to get from Supabase first
      const stats = await this.fetchFromSupabase(date, groupId);
      await memoryCache.set(cacheKey, stats, 600); // Cache for 10 minutes
      return stats;
    } catch (error) {
      // Fallback to offline data
      console.log('Fetching from offline storage:', error);
      return this.getOfflineStats(date, groupId);
    }
  }

  private async fetchFromSupabase(date: string, groupId?: string): Promise<AttendanceStats> {
    let query = supabase
      .from('attendance')
      .select(`
        status,
        students (
          id,
          first_name,
          last_name
        )
      `)
      .eq('date', date);

    if (groupId) {
      query = query.eq('group_id', groupId);
    }

    const { data, error } = await query;
    
    if (error) throw error;

    return this.calculateStats(data || []);
  }

  private async getOfflineStats(date: string, groupId?: string): Promise<AttendanceStats> {
    try {
      const offlineData = await AsyncStorage.getItem('attendance_offline_data');
      if (!offlineData) {
        return this.getEmptyStats();
      }

      const records: AttendanceRecord[] = JSON.parse(offlineData);
      const filteredRecords = records.filter(record => {
        if (record.date !== date) return false;
        if (groupId && record.groupId !== groupId) return false;
        return true;
      });

      return this.calculateStats(filteredRecords);
    } catch (error) {
      console.error('Error getting offline stats:', error);
      return this.getEmptyStats();
    }
  }

  private calculateStats(records: any[]): AttendanceStats {
    const statusCounts = records.reduce((acc, record) => {
      const status = record.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const totalStudents = records.length;
    const presentCount = statusCounts.present || 0;
    const absentCount = statusCounts.absent || 0;
    const lateCount = statusCounts.late || 0;
    const excusedCount = statusCounts.excused || 0;

    const attendanceRate = totalStudents > 0 
      ? (presentCount + lateCount) / totalStudents 
      : 0;

    return {
      totalStudents,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      attendanceRate
    };
  }

  private getEmptyStats(): AttendanceStats {
    return {
      totalStudents: 0,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      excusedCount: 0,
      attendanceRate: 0
    };
  }

  async getAttendanceHistory(startDate: string, endDate: string): Promise<AttendanceHistoryRecord[]> {
    const cacheKey = `attendance_history_${startDate}_${endDate}`;
    
    // Try memory cache first
    const cached = await memoryCache.get<AttendanceHistoryRecord[]>(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('date, status')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) throw error;

      // Group by date and calculate stats
      const groupedByDate = (data || []).reduce((acc, record) => {
        if (!acc[record.date]) {
          acc[record.date] = [];
        }
        acc[record.date].push(record);
        return acc;
      }, {} as Record<string, any[]>);

      const history = Object.entries(groupedByDate).map(([date, records]) => {
        const stats = this.calculateStats(records);
        return {
          date,
          ...stats
        };
      });

      await memoryCache.set(cacheKey, history, 1800); // Cache for 30 minutes
      return history;
    } catch (error) {
      console.error('Error fetching attendance history:', error);
      return [];
    }
  }

  async getTeacherValueableStats(teacherId: string): Promise<TeacherValueableStats> {
    const cacheKey = `teacher_stats_${teacherId}`;
    
    // Try memory cache first
    const cached = await memoryCache.get<TeacherValueableStats>(cacheKey);
    if (cached) return cached;

    try {
      // Get last 4 weeks of data for trends
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

      const { data: attendanceData, error } = await supabase
        .from('attendance')
        .select(`
          date,
          status,
          group_id,
          groups (
            id,
            name,
            students (count)
          ),
          students (
            id,
            first_name,
            last_name
          )
        `)
        .eq('teacher_id', teacherId)
        .gte('date', fourWeeksAgo.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;

      const stats = this.calculateTeacherStats(attendanceData || []);
      await memoryCache.set(cacheKey, stats, 3600); // Cache for 1 hour
      return stats;
    } catch (error) {
      console.error('Error fetching teacher stats:', error);
      return this.getEmptyTeacherStats();
    }
  }

  private calculateTeacherStats(data: any[]): TeacherValueableStats {
    // Calculate weekly trends
    const weeklyData = this.groupByWeek(data);
    const weeklyTrends = weeklyData.map(week => ({
      week: week.weekLabel,
      averageAttendance: week.averageAttendance,
      totalClasses: week.totalClasses
    }));

    // Calculate top performing groups
    const groupData = this.groupByGroup(data);
    const topPerformingGroups = groupData
      .map(group => ({
        groupId: group.groupId,
        groupName: group.groupName,
        attendanceRate: group.attendanceRate,
        studentCount: group.studentCount
      }))
      .sort((a, b) => b.attendanceRate - a.attendanceRate)
      .slice(0, 5);

    // Calculate attendance patterns by day of week
    const dayData = this.groupByDayOfWeek(data);
    const attendancePatterns = dayData.map(day => ({
      dayOfWeek: day.dayName,
      averageAttendance: day.averageAttendance
    }));

    // Find students with low attendance (missed 3+ of last 5 classes)
    const lowAttendanceAlerts = this.findLowAttendanceStudents(data);

    return {
      weeklyTrends,
      topPerformingGroups,
      attendancePatterns,
      lowAttendanceAlerts
    };
  }

  private groupByWeek(data: any[]) {
    const weekGroups: Record<string, any[]> = {};
    
    data.forEach(record => {
      const date = new Date(record.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay() + 1); // Start on Monday
      const weekLabel = weekStart.toISOString().split('T')[0];
      
      if (!weekGroups[weekLabel]) {
        weekGroups[weekLabel] = [];
      }
      weekGroups[weekLabel].push(record);
    });

    return Object.entries(weekGroups).map(([weekLabel, records]) => {
      const stats = this.calculateStats(records);
      const uniqueDates = [...new Set(records.map(r => r.date))];
      
      return {
        weekLabel,
        averageAttendance: stats.attendanceRate,
        totalClasses: uniqueDates.length
      };
    }).sort((a, b) => a.weekLabel.localeCompare(b.weekLabel));
  }

  private groupByGroup(data: any[]) {
    const groupGroups: Record<string, any[]> = {};
    
    data.forEach(record => {
      const groupId = record.group_id;
      if (!groupGroups[groupId]) {
        groupGroups[groupId] = [];
      }
      groupGroups[groupId].push(record);
    });

    return Object.entries(groupGroups).map(([groupId, records]) => {
      const stats = this.calculateStats(records);
      const groupName = records[0]?.groups?.name || `Group ${groupId}`;
      const uniqueStudents = [...new Set(records.map(r => r.students?.id))];
      
      return {
        groupId,
        groupName,
        attendanceRate: stats.attendanceRate,
        studentCount: uniqueStudents.length
      };
    });
  }

  private groupByDayOfWeek(data: any[]) {
    const dayGroups: Record<number, any[]> = {};
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    data.forEach(record => {
      const dayOfWeek = new Date(record.date).getDay();
      if (!dayGroups[dayOfWeek]) {
        dayGroups[dayOfWeek] = [];
      }
      dayGroups[dayOfWeek].push(record);
    });

    return Object.entries(dayGroups).map(([day, records]) => {
      const stats = this.calculateStats(records);
      const dayIndex = parseInt(day);
      
      return {
        dayName: dayNames[dayIndex],
        averageAttendance: stats.attendanceRate
      };
    }).sort((a, b) => dayNames.indexOf(a.dayName) - dayNames.indexOf(b.dayName));
  }

  private findLowAttendanceStudents(data: any[]) {
    const studentAttendance: Record<string, { records: any[], student: any }> = {};
    
    // Group records by student
    data.forEach(record => {
      const studentId = record.students?.id;
      if (!studentId) return;
      
      if (!studentAttendance[studentId]) {
        studentAttendance[studentId] = {
          records: [],
          student: record.students
        };
      }
      studentAttendance[studentId].records.push(record);
    });

    // Find students with low attendance (attendance rate < 70%)
    const alerts = Object.entries(studentAttendance)
      .map(([studentId, data]) => {
        const stats = this.calculateStats(data.records);
        const missedDays = stats.absentCount;
        const lastAttendanceRecord = data.records
          .filter(r => r.status === 'present' || r.status === 'late')
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        
        return {
          studentId,
          studentName: `${data.student.first_name} ${data.student.last_name}`,
          groupId: data.records[0]?.group_id || '',
          missedDays,
          lastAttendance: lastAttendanceRecord?.date || 'Never',
          attendanceRate: stats.attendanceRate
        };
      })
      .filter(alert => alert.attendanceRate < 0.7 && alert.missedDays >= 3)
      .sort((a, b) => a.attendanceRate - b.attendanceRate)
      .slice(0, 10); // Top 10 students with lowest attendance

    return alerts;
  }

  private getEmptyTeacherStats(): TeacherValueableStats {
    return {
      weeklyTrends: [],
      topPerformingGroups: [],
      attendancePatterns: [],
      lowAttendanceAlerts: []
    };
  }

  async saveOfflineAttendance(records: AttendanceRecord[]) {
    try {
      const existingData = await AsyncStorage.getItem('attendance_offline_data');
      const existing = existingData ? JSON.parse(existingData) : [];
      
      // Merge new records with existing, avoiding duplicates
      const merged = [...existing];
      records.forEach(newRecord => {
        const existingIndex = merged.findIndex(
          existing => existing.studentId === newRecord.studentId && 
                     existing.date === newRecord.date
        );
        
        if (existingIndex >= 0) {
          merged[existingIndex] = newRecord;
        } else {
          merged.push(newRecord);
        }
      });

      await AsyncStorage.setItem('attendance_offline_data', JSON.stringify(merged));
    } catch (error) {
      console.error('Error saving offline attendance:', error);
    }
  }

  async clearCache() {
    await memoryCache.clear(this.cachePrefix);
  }
}

export const attendanceStatsService = new AttendanceStatsService();