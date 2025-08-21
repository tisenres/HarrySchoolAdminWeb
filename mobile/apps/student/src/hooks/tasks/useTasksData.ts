/**
 * useTasksData.ts
 * Hook for managing Home Tasks data with offline support and age-adaptive filtering
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@harry-school/shared/hooks';
import { performanceMonitor } from '../../utils/performance';
import { useOfflineContent } from '../content/useOfflineContent';

interface TaskItem {
  id: string;
  title: string;
  type: 'text' | 'quiz' | 'speaking' | 'listening' | 'writing';
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedDuration: number; // minutes
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  progress: number; // 0-100
  aiRecommended: boolean;
  dueDate?: string;
  culturalContext?: string;
  lastAttempt?: string;
  lessonId: string;
  courseId: string;
  createdAt: string;
  updatedAt: string;
}

interface UseTasksDataParams {
  lessonId?: string;
  courseId?: string;
  filter?: string;
  ageGroup?: string;
}

interface UseTasksDataReturn {
  tasks: TaskItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  refetchTask: (taskId: string) => Promise<TaskItem | null>;
  updateTaskStatus: (taskId: string, status: TaskItem['status']) => Promise<void>;
  updateTaskProgress: (taskId: string, progress: number) => Promise<void>;
}

export const useTasksData = ({
  lessonId,
  courseId,
  filter = 'all',
  ageGroup,
}: UseTasksDataParams): UseTasksDataReturn => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { getCachedContent, cacheContent, isContentAvailable } = useOfflineContent();

  const studentAgeGroup = ageGroup || user?.profile?.ageGroup || '13-15';

  // Generate cache key for tasks
  const getCacheKey = useCallback((params: UseTasksDataParams) => {
    return `tasks_${params.courseId || 'all'}_${params.lessonId || 'all'}_${params.filter || 'all'}`;
  }, []);

  // Fetch tasks from API
  const fetchTasksFromAPI = useCallback(async (params: UseTasksDataParams): Promise<TaskItem[]> => {
    const queryParams = new URLSearchParams();
    
    if (params.courseId) queryParams.append('courseId', params.courseId);
    if (params.lessonId) queryParams.append('lessonId', params.lessonId);
    if (params.filter && params.filter !== 'all') queryParams.append('filter', params.filter);
    queryParams.append('ageGroup', studentAgeGroup);
    queryParams.append('studentId', user?.id || '');

    const response = await fetch(`/api/tasks?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user?.token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.statusText}`);
    }

    const data = await response.json();
    return data.tasks || [];
  }, [studentAgeGroup, user]);

  // Fetch tasks with caching and performance monitoring
  const fetchTasks = useCallback(async (params: UseTasksDataParams, useCache: boolean = true) => {
    const cacheKey = getCacheKey(params);
    
    try {
      setLoading(true);
      setError(null);

      // Try to get cached content first if available
      if (useCache && isContentAvailable('tasks', cacheKey)) {
        const cachedTasks = await getCachedContent('tasks', cacheKey);
        if (cachedTasks.length > 0) {
          setTasks(cachedTasks[0].data);
          setLoading(false);
        }
      }

      // Fetch fresh data with performance monitoring
      const fetchedTasks = await performanceMonitor.monitorTaskPerformance(
        'tasks_fetch',
        'data_loading',
        studentAgeGroup,
        () => fetchTasksFromAPI(params)
      );

      // Apply age-specific filtering and sorting
      const processedTasks = processTasksForAge(fetchedTasks, studentAgeGroup);
      
      setTasks(processedTasks);
      
      // Cache the results
      await cacheContent({
        type: 'tasks',
        data: processedTasks,
        lastUpdated: new Date().toISOString(),
        size: JSON.stringify(processedTasks).length,
        priority: 'high',
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tasks';
      setError(errorMessage);
      
      // Try to use cached data as fallback
      if (isContentAvailable('tasks', cacheKey)) {
        const cachedTasks = await getCachedContent('tasks', cacheKey);
        if (cachedTasks.length > 0) {
          setTasks(cachedTasks[0].data);
          setError(`Using offline data: ${errorMessage}`);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [getCacheKey, isContentAvailable, getCachedContent, cacheContent, fetchTasksFromAPI, studentAgeGroup]);

  // Process tasks based on age group
  const processTasksForAge = useCallback((rawTasks: TaskItem[], ageGroup: string): TaskItem[] => {
    let processed = [...rawTasks];

    // Age-specific filtering
    if (ageGroup === '10-12') {
      // Elementary: Filter out overly complex tasks, prioritize visual and interactive
      processed = processed.filter(task => 
        task.difficulty !== 'hard' || task.type === 'quiz' || task.type === 'speaking'
      );
    }

    // Sort by age-appropriate criteria
    processed.sort((a, b) => {
      // Always prioritize overdue tasks
      if (a.status === 'overdue' && b.status !== 'overdue') return -1;
      if (b.status === 'overdue' && a.status !== 'overdue') return 1;

      if (ageGroup === '10-12') {
        // Elementary: AI recommended first, then by type preference
        if (a.aiRecommended && !b.aiRecommended) return -1;
        if (b.aiRecommended && !a.aiRecommended) return 1;
        
        // Prefer interactive tasks
        const typePreference = ['quiz', 'speaking', 'listening', 'writing', 'text'];
        const aIndex = typePreference.indexOf(a.type);
        const bIndex = typePreference.indexOf(b.type);
        return aIndex - bIndex;
      } else if (ageGroup === '13-15') {
        // Middle school: Balance AI recommendations with due dates
        if (a.aiRecommended && !b.aiRecommended) return -1;
        if (b.aiRecommended && !a.aiRecommended) return 1;
        
        // Then by due date
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
      } else {
        // High school: Prioritize by due date, then difficulty
        if (a.dueDate && b.dueDate) {
          const dateDiff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          if (dateDiff !== 0) return dateDiff;
        }
        
        // Then by difficulty (harder tasks first for challenge)
        const difficultyOrder = ['hard', 'medium', 'easy'];
        return difficultyOrder.indexOf(a.difficulty) - difficultyOrder.indexOf(b.difficulty);
      }
      
      return 0;
    });

    return processed;
  }, []);

  // Refetch tasks
  const refetch = useCallback(async () => {
    await fetchTasks({ lessonId, courseId, filter }, false);
  }, [fetchTasks, lessonId, courseId, filter]);

  // Refetch a specific task
  const refetchTask = useCallback(async (taskId: string): Promise<TaskItem | null> => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch task');
      }

      const task = await response.json();
      
      // Update the task in the current list
      setTasks(prev => prev.map(t => t.id === taskId ? task : t));
      
      return task;
    } catch (err) {
      console.error('Failed to refetch task:', err);
      return null;
    }
  }, [user]);

  // Update task status
  const updateTaskStatus = useCallback(async (taskId: string, status: TaskItem['status']) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task status');
      }

      // Optimistically update local state
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status, updatedAt: new Date().toISOString() } : task
      ));
    } catch (err) {
      console.error('Failed to update task status:', err);
      // Could implement retry logic here
    }
  }, [user]);

  // Update task progress
  const updateTaskProgress = useCallback(async (taskId: string, progress: number) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/progress`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ progress }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task progress');
      }

      // Optimistically update local state
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, progress, updatedAt: new Date().toISOString() } : task
      ));
    } catch (err) {
      console.error('Failed to update task progress:', err);
    }
  }, [user]);

  // Load tasks on mount and when parameters change
  useEffect(() => {
    fetchTasks({ lessonId, courseId, filter });
  }, [fetchTasks, lessonId, courseId, filter]);

  // Monitor task data changes for analytics
  useEffect(() => {
    if (tasks.length > 0) {
      performanceMonitor.recordMetric('tasks_loaded_count', tasks.length, {
        lessonId,
        courseId,
        filter,
        ageGroup: studentAgeGroup,
      });
    }
  }, [tasks, lessonId, courseId, filter, studentAgeGroup]);

  return {
    tasks,
    loading,
    error,
    refetch,
    refetchTask,
    updateTaskStatus,
    updateTaskProgress,
  };
};

// Generate mock task data for development
export const generateMockTasks = (count: number = 10): TaskItem[] => {
  const types: TaskItem['type'][] = ['text', 'quiz', 'speaking', 'listening', 'writing'];
  const difficulties: TaskItem['difficulty'][] = ['easy', 'medium', 'hard'];
  const statuses: TaskItem['status'][] = ['pending', 'in_progress', 'completed'];

  return Array.from({ length: count }, (_, index) => ({
    id: `task-${index + 1}`,
    title: `Task ${index + 1}: ${types[index % types.length].charAt(0).toUpperCase() + types[index % types.length].slice(1)} Practice`,
    type: types[index % types.length],
    difficulty: difficulties[index % difficulties.length],
    estimatedDuration: Math.floor(Math.random() * 30) + 5, // 5-35 minutes
    status: statuses[index % statuses.length],
    progress: Math.floor(Math.random() * 101), // 0-100%
    aiRecommended: Math.random() > 0.7, // 30% chance
    dueDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(), // Within a week
    culturalContext: index % 3 === 0 ? 'Features Uzbek cultural context' : undefined,
    lessonId: 'lesson-1',
    courseId: 'course-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
};