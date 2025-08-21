import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { teacherCache } from '../services/memoryCache';

interface Teacher {
  id: string;
  name: string;
  title?: string;
  avatar_url?: string;
  preferred_language: 'en' | 'ru' | 'uz';
}

interface ClassItem {
  id: string;
  subject: string;
  group_name: string;
  start_time: string;
  end_time: string;
  room: string;
  student_count: number;
  is_current: boolean;
  is_upcoming: boolean;
  attendance_marked: boolean;
}

interface GroupData {
  id: string;
  name: string;
  student_count: number;
  present_today: number;
  absent_today: number;
  subject: string;
  level: string;
  next_class: string | null;
  has_alerts: boolean;
}

interface PerformanceData {
  overall_rating: number;
  students_improved: number;
  total_students: number;
  attendance_rate: number;
  assignment_completion: number;
  parent_satisfaction: number;
  recent_achievements: {
    id: string;
    title: string;
    date: string;
    type: 'attendance' | 'performance' | 'engagement' | 'parent_feedback';
  }[];
}

export function useDashboardData() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [teacherData, setTeacherData] = useState<Teacher | undefined>();
  const [todaysClasses, setTodaysClasses] = useState<ClassItem[]>([]);
  const [groupsData, setGroupsData] = useState<GroupData[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData | undefined>();

  useEffect(() => {
    loadDashboardData();
    
    // Set up real-time subscriptions
    const subscriptions = [
      // Real-time updates for classes
      supabase
        .channel('dashboard_classes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'teacher_classes',
          },
          () => loadTodaysClasses()
        )
        .subscribe(),

      // Real-time updates for attendance
      supabase
        .channel('dashboard_attendance')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'attendance_records',
          },
          () => {
            loadTodaysClasses();
            loadGroupsData();
          }
        )
        .subscribe(),
    ];

    return () => {
      subscriptions.forEach(subscription => {
        supabase.removeChannel(subscription);
      });
    };
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadTeacherData(),
        loadTodaysClasses(),
        loadGroupsData(),
        loadPerformanceData(),
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  const loadTeacherData = async () => {
    try {
      const teacherId = 'teacher-1'; // Replace with actual teacher ID
      
      // Try cache first
      const cached = await teacherCache.getDashboardData(teacherId);
      if (cached?.teacher) {
        setTeacherData(cached.teacher);
        return;
      }

      // For now, using mock data. Replace with actual Supabase query
      const mockTeacher: Teacher = {
        id: 'teacher-1',
        name: 'Gulnora Karimova',
        title: 'Ms.',
        preferred_language: 'en',
      };
      
      setTeacherData(mockTeacher);
      
      // Cache the data
      await teacherCache.setDashboardData(teacherId, { teacher: mockTeacher });
    } catch (error) {
      console.error('Error loading teacher data:', error);
    }
  };

  const loadTodaysClasses = async () => {
    try {
      const teacherId = 'teacher-1'; // Replace with actual teacher ID
      const today = new Date().toISOString().split('T')[0];
      
      // Try cache first
      const cached = await teacherCache.getTodaysClasses(teacherId, today);
      if (cached) {
        setTodaysClasses(cached);
        return;
      }

      // Mock data for development. Replace with actual Supabase query
      const currentTime = new Date();
      const currentHour = currentTime.getHours();
      const currentMinute = currentTime.getMinutes();

      const mockClasses: ClassItem[] = [
        {
          id: 'class-1',
          subject: 'English Grammar',
          group_name: 'Elementary A1',
          start_time: '09:00',
          end_time: '10:30',
          room: '101',
          student_count: 12,
          is_current: currentHour === 9 && currentMinute >= 0 && currentMinute <= 90,
          is_upcoming: currentHour < 9,
          attendance_marked: false,
        },
        {
          id: 'class-2',
          subject: 'Speaking Practice',
          group_name: 'Intermediate B1',
          start_time: '11:00',
          end_time: '12:30',
          room: '102',
          student_count: 15,
          is_current: currentHour === 11 && currentMinute >= 0 && currentMinute <= 90,
          is_upcoming: currentHour < 11,
          attendance_marked: true,
        },
        {
          id: 'class-3',
          subject: 'IELTS Preparation',
          group_name: 'Advanced C1',
          start_time: '14:00',
          end_time: '15:30',
          room: '203',
          student_count: 8,
          is_current: currentHour === 14 && currentMinute >= 0 && currentMinute <= 90,
          is_upcoming: currentHour < 14,
          attendance_marked: false,
        },
      ];

      setTodaysClasses(mockClasses);
      
      // Cache the data
      await teacherCache.setTodaysClasses(teacherId, today, mockClasses);
    } catch (error) {
      console.error('Error loading today\'s classes:', error);
    }
  };

  const loadGroupsData = async () => {
    try {
      const teacherId = 'teacher-1'; // Replace with actual teacher ID
      
      // Try cache first
      const cached = await teacherCache.getGroupsData(teacherId);
      if (cached) {
        setGroupsData(cached);
        return;
      }

      // Mock data for development. Replace with actual Supabase query
      const mockGroups: GroupData[] = [
        {
          id: 'group-1',
          name: 'Elementary A1',
          student_count: 12,
          present_today: 10,
          absent_today: 2,
          subject: 'English Grammar',
          level: 'Beginner',
          next_class: 'Tomorrow 9:00 AM',
          has_alerts: true,
        },
        {
          id: 'group-2',
          name: 'Intermediate B1',
          student_count: 15,
          present_today: 14,
          absent_today: 1,
          subject: 'Speaking Practice',
          level: 'Intermediate',
          next_class: 'Today 11:00 AM',
          has_alerts: false,
        },
        {
          id: 'group-3',
          name: 'Advanced C1',
          student_count: 8,
          present_today: 7,
          absent_today: 1,
          subject: 'IELTS Preparation',
          level: 'Advanced',
          next_class: 'Today 2:00 PM',
          has_alerts: false,
        },
      ];

      setGroupsData(mockGroups);
      
      // Cache the data
      await teacherCache.setGroupsData(teacherId, mockGroups);
    } catch (error) {
      console.error('Error loading groups data:', error);
    }
  };

  const loadPerformanceData = async () => {
    try {
      const teacherId = 'teacher-1'; // Replace with actual teacher ID
      
      // Try cache first
      const cached = await teacherCache.getPerformanceData(teacherId);
      if (cached) {
        setPerformanceData(cached);
        return;
      }

      // Mock data for development. Replace with actual Supabase query
      const mockPerformance: PerformanceData = {
        overall_rating: 4.8,
        students_improved: 28,
        total_students: 35,
        attendance_rate: 92.5,
        assignment_completion: 87.3,
        parent_satisfaction: 96.2,
        recent_achievements: [
          {
            id: 'ach-1',
            title: '100% attendance rate for Elementary A1',
            date: '2024-03-15',
            type: 'attendance',
          },
          {
            id: 'ach-2',
            title: 'Student progress: 85% improvement rate',
            date: '2024-03-14',
            type: 'performance',
          },
          {
            id: 'ach-3',
            title: 'Excellent parent feedback received',
            date: '2024-03-13',
            type: 'parent_feedback',
          },
        ],
      };

      setPerformanceData(mockPerformance);
      
      // Cache the data
      await teacherCache.setPerformanceData(teacherId, mockPerformance);
    } catch (error) {
      console.error('Error loading performance data:', error);
    }
  };

  return {
    isLoading,
    isRefreshing,
    refresh,
    teacherData,
    todaysClasses,
    groupsData,
    performanceData,
  };
}