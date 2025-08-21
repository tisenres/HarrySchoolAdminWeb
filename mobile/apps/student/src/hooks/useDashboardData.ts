/**
 * Dashboard Data Hook
 * Harry School Student Mobile App
 * 
 * Manages dashboard data fetching, caching, and real-time updates
 * Implements offline-first architecture with sync capabilities
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@harry-school/shared/services';
import type { StudentAgeGroup } from '../navigation/types';

// Data interfaces
export interface RankingData {
  position: number;
  points: number;
  streak: number;
  pointsToNext?: number;
  totalStudents: number;
  percentile: number;
  recentChange: 'up' | 'down' | 'same';
  changeAmount?: number;
}

export interface ScheduleData {
  currentClass?: {
    id: string;
    name: string;
    teacher: string;
    startTime: Date;
    endTime: Date;
    room: string;
    subject: string;
  };
  nextClass?: {
    id: string;
    name: string;
    teacher: string;
    startTime: Date;
    endTime: Date;
    room: string;
    subject: string;
  };
  upcomingEvents: Array<{
    id: string;
    title: string;
    type: 'assignment' | 'exam' | 'event';
    dueDate: Date;
    subject?: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  completedToday: number;
  totalToday: number;
}

export interface TaskData {
  id: string;
  title: string;
  subject: string;
  type: 'homework' | 'practice' | 'quiz' | 'project';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  dueDate: Date;
  estimatedTime: number; // minutes
  difficulty: 'easy' | 'medium' | 'hard';
  completed: boolean;
  progress?: number; // 0-100
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'academic' | 'engagement' | 'streaks' | 'social';
  earnedDate: Date;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  shared: boolean;
}

export interface AchievementData {
  recent: Achievement[];
  featured?: Achievement;
  progressTowardNext: Array<{
    id: string;
    title: string;
    progress: number;
    target: number;
    category: string;
  }>;
  totalEarned: number;
  totalPossible: number;
}

export interface StatsData {
  weeklyProgress: {
    studyTime: number; // minutes
    tasksCompleted: number;
    averageScore: number;
    improvementRate: number; // percentage
  };
  streaks: {
    current: number;
    longest: number;
    type: 'daily_login' | 'task_completion' | 'perfect_score';
  };
  improvements: Array<{
    subject: string;
    improvement: number; // percentage
    timeframe: 'week' | 'month';
  }>;
  goals: Array<{
    id: string;
    title: string;
    progress: number;
    target: number;
    deadline: Date;
    type: 'academic' | 'personal';
  }>;
  subjectBreakdown: Array<{
    subject: string;
    timeSpent: number;
    score: number;
    progress: number;
  }>;
}

export interface DashboardData {
  ranking?: RankingData;
  schedule?: ScheduleData;
  tasks?: TaskData[];
  achievements?: AchievementData;
  stats?: StatsData;
  lastUpdated: Date;
  cacheKey: string;
}

// Cache configuration
const CACHE_CONFIG = {
  ranking: { ttl: 300000 }, // 5 minutes
  schedule: { ttl: 900000 }, // 15 minutes
  tasks: { ttl: 600000 }, // 10 minutes
  achievements: { ttl: 3600000 }, // 1 hour
  stats: { ttl: 1800000 }, // 30 minutes
};

// Data loading priorities based on age group
const LOADING_PRIORITIES = {
  '10-12': ['ranking', 'schedule', 'achievements', 'tasks', 'stats'],
  '13-18': ['schedule', 'stats', 'tasks', 'ranking', 'achievements'],
} as const;

/**
 * Custom hook for managing dashboard data
 * 
 * @param studentId - Student's unique identifier
 * @param ageGroup - Student's age group for prioritized loading
 * @returns Dashboard data and management functions
 */
export const useDashboardData = (studentId: string, ageGroup: StudentAgeGroup) => {
  // State
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

  // Refs for cleanup and cache management
  const abortController = useRef<AbortController | null>(null);
  const cacheTimer = useRef<NodeJS.Timeout | null>(null);
  const retryCount = useRef(0);

  // Get loading priority based on age group
  const loadingPriority = LOADING_PRIORITIES[ageGroup === '10-12' ? '10-12' : '13-18'];

  // Cache management
  const getCacheKey = useCallback((dataType: string) => {
    return `dashboard_${studentId}_${dataType}`;
  }, [studentId]);

  const getCachedData = useCallback(async (dataType: string) => {
    try {
      const cacheKey = getCacheKey(dataType);
      const cached = await localStorage.getItem(cacheKey);
      
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      const ttl = CACHE_CONFIG[dataType as keyof typeof CACHE_CONFIG]?.ttl || 300000;
      
      if (Date.now() - timestamp > ttl) {
        localStorage.removeItem(cacheKey);
        return null;
      }
      
      return data;
    } catch (error) {
      console.warn(`Cache retrieval failed for ${dataType}:`, error);
      return null;
    }
  }, [getCacheKey]);

  const setCachedData = useCallback(async (dataType: string, data: any) => {
    try {
      const cacheKey = getCacheKey(dataType);
      const cacheData = {
        data,
        timestamp: Date.now(),
      };
      await localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn(`Cache storage failed for ${dataType}:`, error);
    }
  }, [getCacheKey]);

  // Data fetching functions
  const fetchRankingData = async (): Promise<RankingData> => {
    const { data, error } = await supabase
      .from('student_rankings')
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (error) throw error;

    return {
      position: data.position,
      points: data.points,
      streak: data.streak,
      pointsToNext: data.points_to_next,
      totalStudents: data.total_students,
      percentile: data.percentile,
      recentChange: data.recent_change,
      changeAmount: data.change_amount,
    };
  };

  const fetchScheduleData = async (): Promise<ScheduleData> => {
    const { data, error } = await supabase
      .from('student_schedules')
      .select(`
        *,
        current_class(*),
        next_class(*),
        upcoming_events(*)
      `)
      .eq('student_id', studentId)
      .single();

    if (error) throw error;

    return {
      currentClass: data.current_class ? {
        id: data.current_class.id,
        name: data.current_class.name,
        teacher: data.current_class.teacher,
        startTime: new Date(data.current_class.start_time),
        endTime: new Date(data.current_class.end_time),
        room: data.current_class.room,
        subject: data.current_class.subject,
      } : undefined,
      nextClass: data.next_class ? {
        id: data.next_class.id,
        name: data.next_class.name,
        teacher: data.next_class.teacher,
        startTime: new Date(data.next_class.start_time),
        endTime: new Date(data.next_class.end_time),
        room: data.next_class.room,
        subject: data.next_class.subject,
      } : undefined,
      upcomingEvents: data.upcoming_events?.map((event: any) => ({
        id: event.id,
        title: event.title,
        type: event.type,
        dueDate: new Date(event.due_date),
        subject: event.subject,
        priority: event.priority,
      })) || [],
      completedToday: data.completed_today,
      totalToday: data.total_today,
    };
  };

  const fetchTasksData = async (): Promise<TaskData[]> => {
    const { data, error } = await supabase
      .from('student_tasks')
      .select('*')
      .eq('student_id', studentId)
      .eq('completed', false)
      .order('priority', { ascending: true })
      .order('due_date', { ascending: true });

    if (error) throw error;

    return data.map((task: any) => ({
      id: task.id,
      title: task.title,
      subject: task.subject,
      type: task.type,
      priority: task.priority,
      dueDate: new Date(task.due_date),
      estimatedTime: task.estimated_time,
      difficulty: task.difficulty,
      completed: task.completed,
      progress: task.progress,
    }));
  };

  const fetchAchievementsData = async (): Promise<AchievementData> => {
    const { data, error } = await supabase
      .from('student_achievements')
      .select('*')
      .eq('student_id', studentId)
      .order('earned_date', { ascending: false });

    if (error) throw error;

    const achievements = data.map((achievement: any) => ({
      id: achievement.id,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      category: achievement.category,
      earnedDate: new Date(achievement.earned_date),
      points: achievement.points,
      rarity: achievement.rarity,
      shared: achievement.shared,
    }));

    // Get progress toward next achievements
    const { data: progressData } = await supabase
      .from('achievement_progress')
      .select('*')
      .eq('student_id', studentId);

    return {
      recent: achievements.slice(0, 5),
      featured: achievements.find(a => a.rarity === 'legendary') || achievements[0],
      progressTowardNext: progressData?.map((progress: any) => ({
        id: progress.achievement_id,
        title: progress.achievement_title,
        progress: progress.current_value,
        target: progress.target_value,
        category: progress.category,
      })) || [],
      totalEarned: achievements.length,
      totalPossible: 100, // This would come from a separate query
    };
  };

  const fetchStatsData = async (): Promise<StatsData> => {
    const { data, error } = await supabase
      .from('student_stats')
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (error) throw error;

    return {
      weeklyProgress: {
        studyTime: data.weekly_study_time,
        tasksCompleted: data.weekly_tasks_completed,
        averageScore: data.weekly_average_score,
        improvementRate: data.weekly_improvement_rate,
      },
      streaks: {
        current: data.current_streak,
        longest: data.longest_streak,
        type: data.streak_type,
      },
      improvements: data.improvements || [],
      goals: data.goals?.map((goal: any) => ({
        id: goal.id,
        title: goal.title,
        progress: goal.progress,
        target: goal.target,
        deadline: new Date(goal.deadline),
        type: goal.type,
      })) || [],
      subjectBreakdown: data.subject_breakdown || [],
    };
  };

  // Main data fetching function with prioritized loading
  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    else setRefreshing(true);
    
    setError(null);

    try {
      // Cancel previous request
      if (abortController.current) {
        abortController.current.abort();
      }
      abortController.current = new AbortController();

      const fetchPromises: Record<string, Promise<any>> = {};
      const cachedData: Partial<DashboardData> = {};

      // Load cached data first
      for (const dataType of loadingPriority) {
        const cached = await getCachedData(dataType);
        if (cached) {
          cachedData[dataType as keyof DashboardData] = cached;
        }
      }

      // Set cached data immediately for better UX
      if (Object.keys(cachedData).length > 0) {
        setDashboardData(prev => ({
          ...prev,
          ...cachedData,
          lastUpdated: new Date(),
          cacheKey: `${studentId}_${Date.now()}`,
        } as DashboardData));
        
        if (!isRefresh) setLoading(false);
      }

      // Fetch fresh data based on priority
      for (const dataType of loadingPriority) {
        switch (dataType) {
          case 'ranking':
            fetchPromises.ranking = fetchRankingData();
            break;
          case 'schedule':
            fetchPromises.schedule = fetchScheduleData();
            break;
          case 'tasks':
            fetchPromises.tasks = fetchTasksData();
            break;
          case 'achievements':
            fetchPromises.achievements = fetchAchievementsData();
            break;
          case 'stats':
            fetchPromises.stats = fetchStatsData();
            break;
        }
      }

      // Process results as they complete (streaming approach)
      const newData: Partial<DashboardData> = {};
      
      for (const [dataType, promise] of Object.entries(fetchPromises)) {
        try {
          const result = await promise;
          newData[dataType as keyof DashboardData] = result;
          
          // Cache the result
          await setCachedData(dataType, result);
          
          // Update UI incrementally
          setDashboardData(prev => ({
            ...prev,
            ...newData,
            lastUpdated: new Date(),
            cacheKey: `${studentId}_${Date.now()}`,
          } as DashboardData));
        } catch (err) {
          console.warn(`Failed to fetch ${dataType}:`, err);
          // Continue with other data types
        }
      }

      setLastFetchTime(new Date());
      retryCount.current = 0;

    } catch (err: any) {
      console.error('Dashboard data fetch failed:', err);
      setError(err.message || 'Failed to load dashboard data');
      
      // Implement exponential backoff for retries
      if (retryCount.current < 3) {
        retryCount.current++;
        const delay = Math.pow(2, retryCount.current) * 1000;
        setTimeout(() => fetchDashboardData(isRefresh), delay);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [studentId, ageGroup, loadingPriority, getCachedData, setCachedData]);

  // Refetch function for pull-to-refresh
  const refetch = useCallback(async () => {
    await fetchDashboardData(true);
  }, [fetchDashboardData]);

  // Update specific data type
  const updateData = useCallback(async (dataType: keyof DashboardData, newData: any) => {
    setDashboardData(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        [dataType]: newData,
        lastUpdated: new Date(),
      };
    });
    
    // Update cache
    await setCachedData(dataType, newData);
  }, [setCachedData]);

  // Initial data load
  useEffect(() => {
    if (studentId) {
      fetchDashboardData();
    }

    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
      if (cacheTimer.current) {
        clearTimeout(cacheTimer.current);
      }
    };
  }, [studentId, fetchDashboardData]);

  // Automatic refresh timer (every 5 minutes when app is active)
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchDashboardData(true);
      }
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  return {
    dashboardData,
    loading,
    refreshing,
    error,
    lastFetchTime,
    refetch,
    updateData,
    retryCount: retryCount.current,
  };
};

export default useDashboardData;