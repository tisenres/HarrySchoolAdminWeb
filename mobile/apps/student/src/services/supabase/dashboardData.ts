/**
 * Student Dashboard Data Service
 * Harry School Student App
 * 
 * Handles data fetching for schedule, tasks, and stats components
 */

import { supabase } from '@harry-school/api';

export interface GroupScheduleData {
  id: string;
  name: string;
  description: string | null;
  subject: string;
  level: string;
  schedule: Record<string, any>;
  capacity: number;
  current_enrollment: number;
  age_range_min: number | null;
  age_range_max: number | null;
  is_active: boolean;
}

export interface StudentGroupEnrollment {
  id: string;
  student_id: string;
  group_id: string;
  enrollment_date: string;
  is_active: boolean;
  group: GroupScheduleData;
}

export interface TodayScheduleItem {
  id: string;
  group_name: string;
  subject: string;
  level: string;
  start_time: string;
  end_time: string;
  status: 'upcoming' | 'current' | 'completed';
  location?: string;
  teacher_name?: string;
}

export interface PendingTaskData {
  id: string;
  title: string;
  description: string;
  type: 'homework' | 'quiz' | 'assignment' | 'practice';
  priority: 'low' | 'medium' | 'high';
  due_date: string;
  estimated_duration: number; // minutes
  points_reward: number;
  completion_percentage: number;
  subject: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
}

export interface QuickStatsData {
  total_points: number;
  current_level: number;
  level_progress: number;
  points_to_next_level: number;
  current_streak: number;
  longest_streak: number;
  weekly_points: number;
  monthly_points: number;
  daily_study_minutes: number;
  weekly_study_minutes: number;
  completion_rate: number;
  achievements_count: number;
  current_rank: number | null;
  class_rank: number | null;
}

/**
 * Get student's today schedule
 */
export async function getTodaySchedule(studentId: string): Promise<TodayScheduleItem[]> {
  try {
    const today = new Date();
    const dayOfWeek = today.toLocaleLowerCase(); // 'monday', 'tuesday', etc.
    
    // Get student's group enrollments with group schedule data
    const { data: enrollments, error } = await supabase
      .from('student_group_enrollments')
      .select(`
        id,
        student_id,
        group_id,
        enrollment_date,
        is_active,
        group:groups (
          id,
          name,
          description,
          subject,
          level,
          schedule,
          capacity,
          current_enrollment,
          age_range_min,
          age_range_max,
          is_active
        )
      `)
      .eq('student_id', studentId)
      .eq('is_active', true);

    if (error) throw error;

    const scheduleItems: TodayScheduleItem[] = [];
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight

    for (const enrollment of (enrollments as StudentGroupEnrollment[])) {
      const group = enrollment.group;
      const schedule = group.schedule as Record<string, any>;
      
      // Check if group has classes today
      if (schedule && schedule[dayOfWeek]) {
        const todayClasses = Array.isArray(schedule[dayOfWeek]) 
          ? schedule[dayOfWeek] 
          : [schedule[dayOfWeek]];

        for (const classTime of todayClasses) {
          const startTime = classTime.start_time || classTime.time;
          const endTime = classTime.end_time || classTime.duration;
          
          if (startTime) {
            // Parse time (assuming HH:MM format)
            const [startHour, startMinute] = startTime.split(':').map(Number);
            const startTimeMinutes = startHour * 60 + startMinute;
            
            let status: 'upcoming' | 'current' | 'completed' = 'upcoming';
            
            if (endTime) {
              const [endHour, endMinute] = endTime.split(':').map(Number);
              const endTimeMinutes = endHour * 60 + endMinute;
              
              if (currentTime >= startTimeMinutes && currentTime <= endTimeMinutes) {
                status = 'current';
              } else if (currentTime > endTimeMinutes) {
                status = 'completed';
              }
            } else if (currentTime > startTimeMinutes + 90) { // Assume 90 min default duration
              status = 'completed';
            } else if (currentTime >= startTimeMinutes) {
              status = 'current';
            }

            scheduleItems.push({
              id: `${group.id}-${startTime}`,
              group_name: group.name,
              subject: group.subject,
              level: group.level,
              start_time: startTime,
              end_time: endTime || '',
              status,
              location: classTime.location || '',
              teacher_name: classTime.teacher || ''
            });
          }
        }
      }
    }

    // Sort by start time
    return scheduleItems.sort((a, b) => {
      const aTime = a.start_time.split(':').map(Number);
      const bTime = b.start_time.split(':').map(Number);
      return (aTime[0] * 60 + aTime[1]) - (bTime[0] * 60 + bTime[1]);
    });

  } catch (error) {
    console.error('❌ Failed to fetch today schedule:', error);
    return [];
  }
}

/**
 * Get student's pending tasks (mock data - to be replaced with actual task system)
 */
export async function getPendingTasks(studentId: string): Promise<PendingTaskData[]> {
  try {
    // This is mock data - replace with actual task queries when task system is implemented
    const mockTasks: PendingTaskData[] = [
      {
        id: '1',
        title: 'Complete Math Worksheet',
        description: 'Solve problems 1-20 from Chapter 5',
        type: 'homework',
        priority: 'high',
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        estimated_duration: 45,
        points_reward: 50,
        completion_percentage: 0,
        subject: 'Mathematics',
        difficulty_level: 'intermediate'
      },
      {
        id: '2',
        title: 'English Reading Quiz',
        description: 'Quiz on Chapter 3: The Adventure Begins',
        type: 'quiz',
        priority: 'medium',
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
        estimated_duration: 30,
        points_reward: 75,
        completion_percentage: 0,
        subject: 'English',
        difficulty_level: 'beginner'
      },
      {
        id: '3',
        title: 'Science Project Preparation',
        description: 'Research and prepare presentation on solar system',
        type: 'assignment',
        priority: 'medium',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Next week
        estimated_duration: 120,
        points_reward: 150,
        completion_percentage: 25,
        subject: 'Science',
        difficulty_level: 'advanced'
      }
    ];

    return mockTasks;

  } catch (error) {
    console.error('❌ Failed to fetch pending tasks:', error);
    return [];
  }
}

/**
 * Get student's quick stats from rankings table
 */
export async function getQuickStats(studentId: string): Promise<QuickStatsData | null> {
  try {
    const { data: ranking, error: rankingError } = await supabase
      .from('student_rankings')
      .select('*')
      .eq('student_id', studentId)
      .eq('is_active', true)
      .single();

    if (rankingError) throw rankingError;

    const { data: achievementsCount, error: achievementsError } = await supabase
      .from('student_achievements')
      .select('id', { count: 'exact' })
      .eq('student_id', studentId)
      .eq('is_active', true);

    if (achievementsError) throw achievementsError;

    // Calculate daily and weekly study minutes (mock data for now)
    const dailyStudyMinutes = Math.floor(Math.random() * 120) + 30; // 30-150 minutes
    const weeklyStudyMinutes = dailyStudyMinutes * 7;

    // Calculate completion rate (mock data for now)
    const completionRate = Math.floor(Math.random() * 40) + 60; // 60-100%

    return {
      total_points: ranking.total_points,
      current_level: ranking.current_level,
      level_progress: ranking.level_progress,
      points_to_next_level: ranking.points_to_next_level,
      current_streak: ranking.current_streak,
      longest_streak: ranking.longest_streak,
      weekly_points: ranking.weekly_points,
      monthly_points: ranking.monthly_points,
      daily_study_minutes: dailyStudyMinutes,
      weekly_study_minutes: weeklyStudyMinutes,
      completion_rate: completionRate,
      achievements_count: achievementsCount?.length || 0,
      current_rank: ranking.current_rank,
      class_rank: ranking.class_rank
    };

  } catch (error) {
    console.error('❌ Failed to fetch quick stats:', error);
    return null;
  }
}

/**
 * Get comprehensive dashboard data in one call
 */
export async function getDashboardData(studentId: string) {
  try {
    const [todaySchedule, pendingTasks, quickStats] = await Promise.allSettled([
      getTodaySchedule(studentId),
      getPendingTasks(studentId),
      getQuickStats(studentId)
    ]);

    return {
      schedule: todaySchedule.status === 'fulfilled' ? todaySchedule.value : [],
      tasks: pendingTasks.status === 'fulfilled' ? pendingTasks.value : [],
      stats: quickStats.status === 'fulfilled' ? quickStats.value : null,
      errors: [
        todaySchedule.status === 'rejected' ? todaySchedule.reason : null,
        pendingTasks.status === 'rejected' ? pendingTasks.reason : null,
        quickStats.status === 'rejected' ? quickStats.reason : null,
      ].filter(Boolean)
    };

  } catch (error) {
    console.error('❌ Failed to fetch dashboard data:', error);
    throw error;
  }
}

/**
 * Update task completion percentage
 */
export async function updateTaskProgress(taskId: string, completionPercentage: number): Promise<boolean> {
  try {
    // Mock update - replace with actual implementation when task system exists
    console.log(`📝 Task ${taskId} updated to ${completionPercentage}% completion`);
    return true;
  } catch (error) {
    console.error('❌ Failed to update task progress:', error);
    return false;
  }
}

/**
 * Mark task as completed
 */
export async function completeTask(taskId: string): Promise<boolean> {
  try {
    // Mock completion - replace with actual implementation
    console.log(`✅ Task ${taskId} marked as completed`);
    return true;
  } catch (error) {
    console.error('❌ Failed to complete task:', error);
    return false;
  }
}

/**
 * Get student's group enrollment details
 */
export async function getStudentGroups(studentId: string): Promise<StudentGroupEnrollment[]> {
  try {
    const { data, error } = await supabase
      .from('student_group_enrollments')
      .select(`
        id,
        student_id,
        group_id,
        enrollment_date,
        is_active,
        group:groups (
          id,
          name,
          description,
          subject,
          level,
          schedule,
          capacity,
          current_enrollment,
          age_range_min,
          age_range_max,
          is_active
        )
      `)
      .eq('student_id', studentId)
      .eq('is_active', true);

    if (error) throw error;
    return data as StudentGroupEnrollment[];

  } catch (error) {
    console.error('❌ Failed to fetch student groups:', error);
    return [];
  }
}