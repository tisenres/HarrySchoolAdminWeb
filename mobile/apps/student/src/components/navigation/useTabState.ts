/**
 * useTabState Hook - Harry School Student App
 * 
 * Manages tab navigation state, transitions, and student-specific features like:
 * - Badge counts from notifications
 * - Learning progress tracking
 * - Tab usage analytics
 * - Accessibility announcements
 * - Reduced motion preferences
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { AccessibilityInfo } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { TabConfig } from './AnimatedTabBar';

// Student-specific tab states
export interface StudentTabState {
  activeTabId: string;
  previousTabId: string | null;
  navigationHistory: string[];
  tabUsageCount: Record<string, number>;
  lastTabSwitchTime: number;
  isReducedMotion: boolean;
}

// Badge and progress data interface
export interface TabMetrics {
  badgeCount?: number;
  progress?: number; // 0-100 for learning progress
  hasNewContent?: boolean;
  isCompleted?: boolean;
  streakCount?: number;
}

// Tab state hook interface
export interface UseTabStateReturn {
  // Current state
  activeTabId: string;
  previousTabId: string | null;
  isReducedMotion: boolean;
  
  // Navigation methods
  switchToTab: (tabId: string) => void;
  goBack: () => boolean;
  
  // Metrics and badges
  updateTabMetrics: (tabId: string, metrics: Partial<TabMetrics>) => void;
  getTabMetrics: (tabId: string) => TabMetrics;
  
  // Analytics
  getTabUsageStats: () => Record<string, number>;
  getMostUsedTab: () => string | null;
  getNavigationHistory: () => string[];
  
  // Accessibility
  announceTabChange: (tabId: string, tabName: string) => void;
  
  // Reset and configuration
  resetTabState: () => void;
  setInitialTab: (tabId: string) => void;
}

// Default tab metrics
const DEFAULT_TAB_METRICS: TabMetrics = {
  badgeCount: 0,
  progress: 0,
  hasNewContent: false,
  isCompleted: false,
  streakCount: 0,
};

// Maximum navigation history entries
const MAX_HISTORY_LENGTH = 20;

/**
 * Custom hook for managing tab navigation state with student-specific features
 */
export const useTabState = (
  initialTabId: string = 'HomeTab',
  tabConfigs: TabConfig[] = []
): UseTabStateReturn => {
  // Core navigation state
  const [activeTabId, setActiveTabId] = useState<string>(initialTabId);
  const [previousTabId, setPreviousTabId] = useState<string | null>(null);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([initialTabId]);
  const [tabUsageCount, setTabUsageCount] = useState<Record<string, number>>({});
  const [lastTabSwitchTime, setLastTabSwitchTime] = useState<number>(Date.now());
  const [isReducedMotion, setIsReducedMotion] = useState<boolean>(false);
  
  // Tab metrics (badges, progress, etc.)
  const [tabMetrics, setTabMetrics] = useState<Record<string, TabMetrics>>({});
  
  // Refs for performance
  const tabSwitchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousTabRef = useRef<string | null>(null);
  
  // =====================================================
  // ACCESSIBILITY SETUP
  // =====================================================
  
  useEffect(() => {
    // Check initial reduced motion preference
    AccessibilityInfo.isReduceMotionEnabled().then(setIsReducedMotion);
    
    // Listen for changes to reduced motion preference
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setIsReducedMotion
    );
    
    return () => subscription?.remove();
  }, []);
  
  // =====================================================
  // NAVIGATION METHODS
  // =====================================================
  
  /**
   * Switch to a specific tab with analytics and feedback
   */
  const switchToTab = useCallback((tabId: string) => {
    // Validate tab exists
    if (!tabConfigs.find(tab => tab.id === tabId)) {
      console.warn(`Tab ${tabId} not found in configuration`);
      return;
    }
    
    // Don't switch if already active
    if (tabId === activeTabId) {
      return;
    }
    
    const currentTime = Date.now();
    const timeSinceLastSwitch = currentTime - lastTabSwitchTime;
    
    // Prevent rapid tab switching (< 200ms)
    if (timeSinceLastSwitch < 200) {
      return;
    }
    
    // Update previous tab reference
    setPreviousTabId(activeTabId);
    previousTabRef.current = activeTabId;
    
    // Update navigation history
    setNavigationHistory(prev => {
      const newHistory = [...prev, tabId];
      return newHistory.slice(-MAX_HISTORY_LENGTH);
    });
    
    // Update usage analytics
    setTabUsageCount(prev => ({
      ...prev,
      [tabId]: (prev[tabId] || 0) + 1,
    }));
    
    // Update timing
    setLastTabSwitchTime(currentTime);
    
    // Switch to new tab
    setActiveTabId(tabId);
    
    // Haptic feedback for engagement
    if (!isReducedMotion) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // Announce tab change for accessibility
    const tabConfig = tabConfigs.find(tab => tab.id === tabId);
    if (tabConfig) {
      announceTabChange(tabId, tabConfig.label);
    }
  }, [activeTabId, lastTabSwitchTime, isReducedMotion, tabConfigs]);
  
  /**
   * Go back to the previous tab
   */
  const goBack = useCallback((): boolean => {
    if (previousTabId && previousTabId !== activeTabId) {
      switchToTab(previousTabId);
      return true;
    }
    
    // Fallback to navigation history
    if (navigationHistory.length > 1) {
      const previousInHistory = navigationHistory[navigationHistory.length - 2];
      if (previousInHistory && previousInHistory !== activeTabId) {
        switchToTab(previousInHistory);
        return true;
      }
    }
    
    return false;
  }, [previousTabId, activeTabId, navigationHistory, switchToTab]);
  
  // =====================================================
  // METRICS AND BADGES
  // =====================================================
  
  /**
   * Update metrics for a specific tab (badges, progress, etc.)
   */
  const updateTabMetrics = useCallback((tabId: string, metrics: Partial<TabMetrics>) => {
    setTabMetrics(prev => ({
      ...prev,
      [tabId]: {
        ...DEFAULT_TAB_METRICS,
        ...prev[tabId],
        ...metrics,
      },
    }));
  }, []);
  
  /**
   * Get current metrics for a tab
   */
  const getTabMetrics = useCallback((tabId: string): TabMetrics => {
    return {
      ...DEFAULT_TAB_METRICS,
      ...tabMetrics[tabId],
    };
  }, [tabMetrics]);
  
  // =====================================================
  // ANALYTICS
  // =====================================================
  
  /**
   * Get tab usage statistics
   */
  const getTabUsageStats = useCallback((): Record<string, number> => {
    return { ...tabUsageCount };
  }, [tabUsageCount]);
  
  /**
   * Get the most frequently used tab
   */
  const getMostUsedTab = useCallback((): string | null => {
    const entries = Object.entries(tabUsageCount);
    if (entries.length === 0) return null;
    
    const mostUsed = entries.reduce((max, [tabId, count]) => 
      count > max.count ? { tabId, count } : max
    , { tabId: '', count: 0 });
    
    return mostUsed.tabId || null;
  }, [tabUsageCount]);
  
  /**
   * Get navigation history
   */
  const getNavigationHistory = useCallback((): string[] => {
    return [...navigationHistory];
  }, [navigationHistory]);
  
  // =====================================================
  // ACCESSIBILITY
  // =====================================================
  
  /**
   * Announce tab change for screen readers
   */
  const announceTabChange = useCallback((tabId: string, tabName: string) => {
    const metrics = getTabMetrics(tabId);
    
    let announcement = `Switched to ${tabName}`;
    
    // Add badge information
    if (metrics.badgeCount && metrics.badgeCount > 0) {
      announcement += `, ${metrics.badgeCount} notification${metrics.badgeCount === 1 ? '' : 's'}`;
    }
    
    // Add progress information
    if (metrics.progress && metrics.progress > 0) {
      announcement += `, ${Math.round(metrics.progress)}% complete`;
    }
    
    // Add new content information
    if (metrics.hasNewContent) {
      announcement += ', has new content';
    }
    
    // Announce to screen reader
    AccessibilityInfo.announceForAccessibility(announcement);
  }, [getTabMetrics]);
  
  // =====================================================
  // RESET AND CONFIGURATION
  // =====================================================
  
  /**
   * Reset tab state to initial values
   */
  const resetTabState = useCallback(() => {
    setActiveTabId(initialTabId);
    setPreviousTabId(null);
    setNavigationHistory([initialTabId]);
    setTabUsageCount({});
    setLastTabSwitchTime(Date.now());
    setTabMetrics({});
    previousTabRef.current = null;
    
    // Clear any pending timeouts
    if (tabSwitchTimeoutRef.current) {
      clearTimeout(tabSwitchTimeoutRef.current);
      tabSwitchTimeoutRef.current = null;
    }
  }, [initialTabId]);
  
  /**
   * Set initial tab (useful for deep linking)
   */
  const setInitialTab = useCallback((tabId: string) => {
    if (tabConfigs.find(tab => tab.id === tabId)) {
      setActiveTabId(tabId);
      setNavigationHistory([tabId]);
      setLastTabSwitchTime(Date.now());
    }
  }, [tabConfigs]);
  
  // =====================================================
  // CLEANUP
  // =====================================================
  
  useEffect(() => {
    return () => {
      if (tabSwitchTimeoutRef.current) {
        clearTimeout(tabSwitchTimeoutRef.current);
      }
    };
  }, []);
  
  // =====================================================
  // RETURN HOOK INTERFACE
  // =====================================================
  
  return {
    // Current state
    activeTabId,
    previousTabId,
    isReducedMotion,
    
    // Navigation methods
    switchToTab,
    goBack,
    
    // Metrics and badges
    updateTabMetrics,
    getTabMetrics,
    
    // Analytics
    getTabUsageStats,
    getMostUsedTab,
    getNavigationHistory,
    
    // Accessibility
    announceTabChange,
    
    // Reset and configuration
    resetTabState,
    setInitialTab,
  };
};

export default useTabState;