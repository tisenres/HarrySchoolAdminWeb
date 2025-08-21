/**
 * useTaskTimer.ts
 * Hook for tracking task completion time with pause/resume functionality
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UseTaskTimerReturn {
  elapsedTime: number; // seconds
  isRunning: boolean;
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  getElapsedTime: () => number;
}

export const useTaskTimer = (
  taskId?: string,
  autoSave: boolean = true
): UseTaskTimerReturn => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [totalPausedTime, setTotalPausedTime] = useState(0);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pauseStartTime = useRef<number | null>(null);

  // Storage keys
  const getStorageKey = useCallback((key: string) => {
    return taskId ? `@harry_school:timer:${taskId}:${key}` : `@harry_school:timer:${key}`;
  }, [taskId]);

  // Save timer state to storage
  const saveTimerState = useCallback(async () => {
    if (!autoSave || !taskId) return;

    try {
      const state = {
        elapsedTime,
        startTime,
        totalPausedTime,
        isRunning,
        lastSaved: Date.now(),
      };
      
      await AsyncStorage.setItem(
        getStorageKey('state'), 
        JSON.stringify(state)
      );
    } catch (error) {
      console.warn('Failed to save timer state:', error);
    }
  }, [elapsedTime, startTime, totalPausedTime, isRunning, autoSave, taskId, getStorageKey]);

  // Load timer state from storage
  const loadTimerState = useCallback(async () => {
    if (!autoSave || !taskId) return;

    try {
      const savedState = await AsyncStorage.getItem(getStorageKey('state'));
      if (savedState) {
        const state = JSON.parse(savedState);
        
        // Calculate time that passed since last save if timer was running
        if (state.isRunning && state.lastSaved) {
          const timeSinceLastSave = Math.floor((Date.now() - state.lastSaved) / 1000);
          setElapsedTime(state.elapsedTime + timeSinceLastSave);
        } else {
          setElapsedTime(state.elapsedTime || 0);
        }
        
        setStartTime(state.startTime || null);
        setTotalPausedTime(state.totalPausedTime || 0);
        
        // Don't automatically resume running timer on app restart
        setIsRunning(false);
      }
    } catch (error) {
      console.warn('Failed to load timer state:', error);
    }
  }, [autoSave, taskId, getStorageKey]);

  // Update timer every second
  const updateTimer = useCallback(() => {
    if (!startTime) return;

    const now = Date.now();
    const rawElapsed = Math.floor((now - startTime) / 1000);
    const adjustedElapsed = Math.max(0, rawElapsed - totalPausedTime);
    
    setElapsedTime(adjustedElapsed);
  }, [startTime, totalPausedTime]);

  // Start the timer
  const startTimer = useCallback(() => {
    if (isRunning) return;

    const now = Date.now();
    
    if (!startTime) {
      // First time starting
      setStartTime(now);
      setElapsedTime(0);
      setTotalPausedTime(0);
    } else if (pauseStartTime.current) {
      // Resuming from pause
      const pauseDuration = Math.floor((now - pauseStartTime.current) / 1000);
      setTotalPausedTime(prev => prev + pauseDuration);
      pauseStartTime.current = null;
    }
    
    setIsRunning(true);
    
    // Start the update interval
    intervalRef.current = setInterval(updateTimer, 1000);
  }, [isRunning, startTime, updateTimer]);

  // Pause the timer
  const pauseTimer = useCallback(() => {
    if (!isRunning) return;

    setIsRunning(false);
    pauseStartTime.current = Date.now();
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [isRunning]);

  // Resume the timer
  const resumeTimer = useCallback(() => {
    if (isRunning) return;
    startTimer();
  }, [isRunning, startTimer]);

  // Reset the timer
  const resetTimer = useCallback(() => {
    setElapsedTime(0);
    setIsRunning(false);
    setStartTime(null);
    setTotalPausedTime(0);
    pauseStartTime.current = null;
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Clear saved state
    if (autoSave && taskId) {
      AsyncStorage.removeItem(getStorageKey('state')).catch(console.warn);
    }
  }, [autoSave, taskId, getStorageKey]);

  // Get current elapsed time
  const getElapsedTime = useCallback(() => {
    return elapsedTime;
  }, [elapsedTime]);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App is going to background, pause timer and save state
        if (isRunning) {
          pauseTimer();
          saveTimerState();
        }
      }
      // Note: We don't auto-resume when app becomes active
      // This is intentional UX to avoid accidental time tracking
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isRunning, pauseTimer, saveTimerState]);

  // Load saved state on mount
  useEffect(() => {
    loadTimerState();
  }, [loadTimerState]);

  // Save state when timer values change
  useEffect(() => {
    if (elapsedTime > 0 || startTime) {
      saveTimerState();
    }
  }, [elapsedTime, startTime, totalPausedTime, isRunning, saveTimerState]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Update timer while running
  useEffect(() => {
    if (isRunning && startTime) {
      intervalRef.current = setInterval(updateTimer, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, startTime, updateTimer]);

  return {
    elapsedTime,
    isRunning,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    getElapsedTime,
  };
};

// Utility function to format time display
export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
};

// Utility function to get readable duration
export const getReadableDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (remainingSeconds === 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      return `${minutes}m ${remainingSeconds}s`;
    }
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (minutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      return `${hours}h ${minutes}m`;
    }
  }
};