/**
 * useTabAnalytics Hook - Harry School Student App
 * 
 * Advanced analytics tracking for student tab navigation patterns.
 * Helps understand learning behavior and optimize the educational experience.
 * 
 * Features:
 * - Tab usage patterns and timing
 * - Learning session tracking
 * - Engagement metrics
 * - Performance insights
 * - Accessibility usage patterns
 * - Educational milestone tracking
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Analytics data interfaces
export interface TabAnalyticsData {
  tabId: string;
  tabName: string;
  timestamp: number;
  sessionId: string;
  timeSpent: number; // milliseconds
  previousTab?: string;
  navigationPath: string[];
}

export interface LearningSession {
  sessionId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  tabSwitches: number;
  primaryTab: string; // Most used tab in session
  completedTasks: number;
  engagementScore: number; // 0-100
  learningProgress: Record<string, number>; // Tab -> progress
}

export interface EngagementMetrics {
  averageSessionDuration: number;
  tabSwitchFrequency: number;
  mostEngagingTab: string;
  learningVelocity: number; // Progress per minute
  streakDays: number;
  totalTimeSpent: number;
  achievementCount: number;
}

export interface UseTabAnalyticsReturn {
  // Current session
  currentSession: LearningSession | null;
  isTrackingSession: boolean;
  
  // Analytics methods
  startSession: () => string;
  endSession: () => void;
  trackTabSwitch: (fromTab: string, toTab: string, tabName: string) => void;
  trackTaskCompletion: (tabId: string, taskType: string, points?: number) => void;
  trackLearningProgress: (tabId: string, progress: number) => void;
  
  // Metrics and insights
  getEngagementMetrics: () => Promise<EngagementMetrics>;
  getTabUsagePattern: () => Promise<Record<string, number>>;
  getLearningInsights: () => Promise<{
    preferredLearningTime: string;
    strongSubjects: string[];
    improvementAreas: string[];
    studyStreak: number;
  }>;
  
  // Educational analytics
  calculateLearningVelocity: (tabId: string) => Promise<number>;
  getAchievementProgress: () => Promise<Record<string, number>>;
  getWeeklyProgress: () => Promise<Array<{ date: string; progress: number }>>;
  
  // Privacy and data management
  exportAnalyticsData: () => Promise<string>;
  clearAnalyticsData: () => Promise<void>;
  setPrivacyMode: (enabled: boolean) => void;
}

// Storage keys
const STORAGE_KEYS = {
  SESSIONS: '@harry_school_sessions',
  TAB_ANALYTICS: '@harry_school_tab_analytics',
  LEARNING_PROGRESS: '@harry_school_learning_progress',
  ENGAGEMENT_METRICS: '@harry_school_engagement',
  PRIVACY_MODE: '@harry_school_privacy_mode',
} as const;

// Session configuration
const SESSION_CONFIG = {
  MIN_SESSION_DURATION: 30000, // 30 seconds minimum
  MAX_IDLE_TIME: 300000, // 5 minutes idle = end session
  ENGAGEMENT_CALCULATION_INTERVAL: 60000, // 1 minute
} as const;

/**
 * Generate unique session ID
 */
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Calculate engagement score based on activity patterns
 */
const calculateEngagementScore = (
  duration: number,
  tabSwitches: number,
  completedTasks: number
): number => {
  // Base score from duration (up to 30 points for 30+ minutes)
  const durationScore = Math.min(30, (duration / 60000) * 1); // 1 point per minute, max 30
  
  // Tab engagement score (up to 20 points for optimal switching)
  const optimalSwitches = duration / 120000; // Every 2 minutes is optimal
  const switchScore = Math.min(20, 20 - Math.abs(tabSwitches - optimalSwitches) * 2);
  
  // Task completion score (up to 50 points)
  const taskScore = Math.min(50, completedTasks * 10);
  
  return Math.round(Math.max(0, Math.min(100, durationScore + switchScore + taskScore)));
};

/**
 * Custom hook for advanced tab analytics tracking
 */
export const useTabAnalytics = (): UseTabAnalyticsReturn => {
  // Current session state
  const [currentSession, setCurrentSession] = useState<LearningSession | null>(null);
  const [isTrackingSession, setIsTrackingSession] = useState<boolean>(false);
  const [privacyMode, setPrivacyModeState] = useState<boolean>(false);
  
  // Refs for performance and cleanup
  const sessionStartTimeRef = useRef<number>(0);
  const lastActivityTimeRef = useRef<number>(Date.now());
  const engagementIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const analyticsQueueRef = useRef<TabAnalyticsData[]>([]);
  
  // =====================================================
  // INITIALIZATION AND CLEANUP
  // =====================================================
  
  useEffect(() => {
    // Load privacy mode setting
    loadPrivacyMode();
    
    // Set up app state listener for session management
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Set up periodic analytics flushing
    const flushInterval = setInterval(flushAnalyticsQueue, 30000); // Every 30 seconds
    
    return () => {
      // Cleanup
      if (currentSession) {
        endSession();
      }
      
      appStateSubscription?.remove();
      clearInterval(flushInterval);
      
      if (engagementIntervalRef.current) {
        clearInterval(engagementIntervalRef.current);
      }
      
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
      
      // Flush any remaining analytics
      flushAnalyticsQueue();
    };
  }, []);
  
  // =====================================================
  // PRIVACY AND SETTINGS
  // =====================================================
  
  const loadPrivacyMode = async () => {
    try {
      const privacyModeValue = await AsyncStorage.getItem(STORAGE_KEYS.PRIVACY_MODE);
      setPrivacyModeState(privacyModeValue === 'true');
    } catch (error) {
      console.warn('Failed to load privacy mode setting:', error);
    }
  };
  
  const setPrivacyMode = useCallback(async (enabled: boolean) => {
    setPrivacyModeState(enabled);
    
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PRIVACY_MODE, enabled.toString());
      
      if (enabled) {
        // Clear existing analytics data when privacy mode is enabled
        await clearAnalyticsData();
      }
    } catch (error) {
      console.error('Failed to update privacy mode:', error);
    }
  }, []);
  
  // =====================================================
  // SESSION MANAGEMENT
  // =====================================================
  
  const startSession = useCallback((): string => {
    if (privacyMode) {
      return 'privacy_mode_session';
    }
    
    const sessionId = generateSessionId();
    const startTime = Date.now();
    
    const newSession: LearningSession = {
      sessionId,
      startTime,
      tabSwitches: 0,
      primaryTab: '',
      completedTasks: 0,
      engagementScore: 0,
      learningProgress: {},
    };
    
    setCurrentSession(newSession);
    setIsTrackingSession(true);
    sessionStartTimeRef.current = startTime;
    lastActivityTimeRef.current = startTime;
    
    // Start engagement tracking
    engagementIntervalRef.current = setInterval(() => {
      updateEngagementScore();
    }, SESSION_CONFIG.ENGAGEMENT_CALCULATION_INTERVAL);
    
    // Start idle detection
    resetIdleTimeout();
    
    return sessionId;
  }, [privacyMode]);
  
  const endSession = useCallback(async () => {
    if (!currentSession || privacyMode) {
      setCurrentSession(null);
      setIsTrackingSession(false);
      return;
    }
    
    const endTime = Date.now();
    const duration = endTime - sessionStartTimeRef.current;
    
    // Only save sessions longer than minimum duration
    if (duration >= SESSION_CONFIG.MIN_SESSION_DURATION) {
      const finalSession: LearningSession = {
        ...currentSession,
        endTime,
        duration,
        engagementScore: calculateEngagementScore(
          duration,
          currentSession.tabSwitches,
          currentSession.completedTasks
        ),
      };
      
      // Save session to storage
      await saveSession(finalSession);
    }
    
    // Cleanup
    setCurrentSession(null);
    setIsTrackingSession(false);
    
    if (engagementIntervalRef.current) {
      clearInterval(engagementIntervalRef.current);
      engagementIntervalRef.current = null;
    }
    
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }
    
    // Flush any remaining analytics
    await flushAnalyticsQueue();
  }, [currentSession, privacyMode]);
  
  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      // App going to background - end session
      if (isTrackingSession) {
        endSession();
      }
    } else if (nextAppState === 'active') {
      // App becoming active - start new session if not tracking
      if (!isTrackingSession && !privacyMode) {
        startSession();
      }
    }
  }, [isTrackingSession, privacyMode, endSession, startSession]);
  
  // =====================================================
  // ACTIVITY TRACKING
  // =====================================================
  
  const updateActivity = useCallback(() => {
    lastActivityTimeRef.current = Date.now();
    resetIdleTimeout();
  }, []);
  
  const resetIdleTimeout = useCallback(() => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }
    
    idleTimeoutRef.current = setTimeout(() => {
      if (isTrackingSession) {
        endSession();
      }
    }, SESSION_CONFIG.MAX_IDLE_TIME);
  }, [isTrackingSession, endSession]);
  
  const trackTabSwitch = useCallback((fromTab: string, toTab: string, tabName: string) => {
    if (privacyMode) return;
    
    updateActivity();
    
    // Update current session
    if (currentSession) {
      setCurrentSession(prev => prev ? {
        ...prev,
        tabSwitches: prev.tabSwitches + 1,
        primaryTab: determinePrimaryTab(prev, toTab),
      } : null);
    }
    
    // Queue analytics data
    const analyticsData: TabAnalyticsData = {
      tabId: toTab,
      tabName,
      timestamp: Date.now(),
      sessionId: currentSession?.sessionId || 'no_session',
      timeSpent: 0, // Will be calculated on next switch
      previousTab: fromTab,
      navigationPath: [], // Will be populated by analytics processor
    };
    
    analyticsQueueRef.current.push(analyticsData);
  }, [privacyMode, currentSession, updateActivity]);
  
  const trackTaskCompletion = useCallback((tabId: string, taskType: string, points?: number) => {
    if (privacyMode) return;
    
    updateActivity();
    
    if (currentSession) {
      setCurrentSession(prev => prev ? {
        ...prev,
        completedTasks: prev.completedTasks + 1,
      } : null);
    }
    
    // Track task completion in analytics
    // This would typically send to analytics service
  }, [privacyMode, currentSession, updateActivity]);
  
  const trackLearningProgress = useCallback((tabId: string, progress: number) => {
    if (privacyMode) return;
    
    updateActivity();
    
    if (currentSession) {
      setCurrentSession(prev => prev ? {
        ...prev,
        learningProgress: {
          ...prev.learningProgress,
          [tabId]: progress,
        },
      } : null);
    }
  }, [privacyMode, currentSession, updateActivity]);
  
  // =====================================================
  // ANALYTICS UTILITIES
  // =====================================================
  
  const determinePrimaryTab = (session: LearningSession, newTab: string): string => {
    // Simple heuristic: tab with most recent activity
    return newTab;
  };
  
  const updateEngagementScore = useCallback(() => {
    if (!currentSession) return;
    
    const duration = Date.now() - sessionStartTimeRef.current;
    const engagementScore = calculateEngagementScore(
      duration,
      currentSession.tabSwitches,
      currentSession.completedTasks
    );
    
    setCurrentSession(prev => prev ? {
      ...prev,
      engagementScore,
    } : null);
  }, [currentSession]);
  
  const flushAnalyticsQueue = useCallback(async () => {
    if (analyticsQueueRef.current.length === 0 || privacyMode) return;
    
    try {
      // Save analytics data to storage
      const existingData = await AsyncStorage.getItem(STORAGE_KEYS.TAB_ANALYTICS);
      const analyticsHistory: TabAnalyticsData[] = existingData ? JSON.parse(existingData) : [];
      
      const updatedHistory = [...analyticsHistory, ...analyticsQueueRef.current];
      
      // Keep only last 1000 entries for performance
      const trimmedHistory = updatedHistory.slice(-1000);
      
      await AsyncStorage.setItem(STORAGE_KEYS.TAB_ANALYTICS, JSON.stringify(trimmedHistory));
      
      // Clear the queue
      analyticsQueueRef.current = [];
    } catch (error) {
      console.error('Failed to flush analytics queue:', error);
    }
  }, [privacyMode]);
  
  const saveSession = useCallback(async (session: LearningSession) => {
    try {
      const existingSessions = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS);
      const sessions: LearningSession[] = existingSessions ? JSON.parse(existingSessions) : [];
      
      sessions.push(session);
      
      // Keep only last 100 sessions
      const trimmedSessions = sessions.slice(-100);
      
      await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(trimmedSessions));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }, []);
  
  // =====================================================
  // METRICS AND INSIGHTS
  // =====================================================
  
  const getEngagementMetrics = useCallback(async (): Promise<EngagementMetrics> => {
    try {
      const sessionsData = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS);
      const sessions: LearningSession[] = sessionsData ? JSON.parse(sessionsData) : [];
      
      if (sessions.length === 0) {
        return {
          averageSessionDuration: 0,
          tabSwitchFrequency: 0,
          mostEngagingTab: '',
          learningVelocity: 0,
          streakDays: 0,
          totalTimeSpent: 0,
          achievementCount: 0,
        };
      }
      
      const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
      const totalSwitches = sessions.reduce((sum, s) => sum + s.tabSwitches, 0);
      
      return {
        averageSessionDuration: totalDuration / sessions.length,
        tabSwitchFrequency: totalSwitches / sessions.length,
        mostEngagingTab: sessions[0]?.primaryTab || '',
        learningVelocity: 0, // Would calculate based on progress data
        streakDays: 0, // Would calculate based on session dates
        totalTimeSpent: totalDuration,
        achievementCount: sessions.reduce((sum, s) => sum + s.completedTasks, 0),
      };
    } catch (error) {
      console.error('Failed to get engagement metrics:', error);
      throw error;
    }
  }, []);
  
  const getTabUsagePattern = useCallback(async (): Promise<Record<string, number>> => {
    try {
      const analyticsData = await AsyncStorage.getItem(STORAGE_KEYS.TAB_ANALYTICS);
      const analytics: TabAnalyticsData[] = analyticsData ? JSON.parse(analyticsData) : [];
      
      const usagePattern: Record<string, number> = {};
      
      analytics.forEach(data => {
        usagePattern[data.tabId] = (usagePattern[data.tabId] || 0) + 1;
      });
      
      return usagePattern;
    } catch (error) {
      console.error('Failed to get tab usage pattern:', error);
      return {};
    }
  }, []);
  
  const getLearningInsights = useCallback(async () => {
    // This would implement complex analytics to determine:
    // - Preferred learning times
    // - Strong subjects based on progress and engagement
    // - Areas needing improvement
    // - Study streak calculation
    
    return {
      preferredLearningTime: 'afternoon',
      strongSubjects: ['vocabulary', 'lessons'],
      improvementAreas: ['schedule'],
      studyStreak: 3,
    };
  }, []);
  
  const calculateLearningVelocity = useCallback(async (tabId: string): Promise<number> => {
    // Calculate learning progress per unit time for specific tab
    return 0; // Placeholder implementation
  }, []);
  
  const getAchievementProgress = useCallback(async (): Promise<Record<string, number>> => {
    // Return progress towards various achievements
    return {}; // Placeholder implementation
  }, []);
  
  const getWeeklyProgress = useCallback(async (): Promise<Array<{ date: string; progress: number }>> => {
    // Return weekly progress data for charts
    return []; // Placeholder implementation
  }, []);
  
  // =====================================================
  // DATA MANAGEMENT
  // =====================================================
  
  const exportAnalyticsData = useCallback(async (): Promise<string> => {
    try {
      const [sessions, analytics, progress] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.SESSIONS),
        AsyncStorage.getItem(STORAGE_KEYS.TAB_ANALYTICS),
        AsyncStorage.getItem(STORAGE_KEYS.LEARNING_PROGRESS),
      ]);
      
      const exportData = {
        sessions: sessions ? JSON.parse(sessions) : [],
        analytics: analytics ? JSON.parse(analytics) : [],
        progress: progress ? JSON.parse(progress) : {},
        exportDate: new Date().toISOString(),
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export analytics data:', error);
      throw error;
    }
  }, []);
  
  const clearAnalyticsData = useCallback(async (): Promise<void> => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.SESSIONS),
        AsyncStorage.removeItem(STORAGE_KEYS.TAB_ANALYTICS),
        AsyncStorage.removeItem(STORAGE_KEYS.LEARNING_PROGRESS),
        AsyncStorage.removeItem(STORAGE_KEYS.ENGAGEMENT_METRICS),
      ]);
      
      // Clear current session
      setCurrentSession(null);
      setIsTrackingSession(false);
      
      // Clear analytics queue
      analyticsQueueRef.current = [];
    } catch (error) {
      console.error('Failed to clear analytics data:', error);
      throw error;
    }
  }, []);
  
  // =====================================================
  // RETURN HOOK INTERFACE
  // =====================================================
  
  return {
    // Current session
    currentSession,
    isTrackingSession,
    
    // Analytics methods
    startSession,
    endSession,
    trackTabSwitch,
    trackTaskCompletion,
    trackLearningProgress,
    
    // Metrics and insights
    getEngagementMetrics,
    getTabUsagePattern,
    getLearningInsights,
    
    // Educational analytics
    calculateLearningVelocity,
    getAchievementProgress,
    getWeeklyProgress,
    
    // Privacy and data management
    exportAnalyticsData,
    clearAnalyticsData,
    setPrivacyMode,
  };
};

export default useTabAnalytics;