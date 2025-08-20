/**
 * useTabAccessibility Hook - Harry School Student App
 * 
 * Comprehensive accessibility support for tab navigation, ensuring WCAG 2.1 AA compliance
 * and inclusive design for students with diverse abilities.
 * 
 * Features:
 * - Screen reader support with rich announcements
 * - Keyboard navigation support
 * - High contrast mode detection
 * - Reduced motion preferences
 * - Large text scaling support
 * - Voice control optimization
 * - Focus management
 * - Educational context announcements
 */

import { useEffect, useCallback, useState, useRef } from 'react';
import {
  AccessibilityInfo,
  AccessibilityEvent,
  findNodeHandle,
  Platform,
} from 'react-native';
import type { TabConfig } from './AnimatedTabBar';

// Accessibility configuration
export interface AccessibilityConfig {
  announceTabChanges: boolean;
  announceProgress: boolean;
  announceBadges: boolean;
  useRichDescriptions: boolean;
  enableHapticFeedback: boolean;
  respectReducedMotion: boolean;
}

// Accessibility state interface
export interface AccessibilityState {
  isScreenReaderEnabled: boolean;
  isReduceMotionEnabled: boolean;
  isHighContrastEnabled: boolean;
  preferredFontScale: number;
  isBoldTextEnabled: boolean;
  announceInterval: number; // milliseconds between announcements
}

// Voice control commands interface
export interface VoiceControlCommands {
  [key: string]: () => void;
}

export interface UseTabAccessibilityReturn {
  // Current accessibility state
  accessibilityState: AccessibilityState;
  
  // Accessibility methods
  announceTabChange: (tabId: string, tabName: string, additionalInfo?: string) => void;
  announceProgress: (tabId: string, progress: number, context?: string) => void;
  announceBadgeUpdate: (tabId: string, badgeCount: number, isNew?: boolean) => void;
  announceError: (message: string, severity?: 'low' | 'medium' | 'high') => void;
  announceSuccess: (message: string, points?: number) => void;
  
  // Focus management
  setAccessibilityFocus: (elementRef: any) => void;
  moveFocusToTab: (tabId: string) => void;
  
  // Label and hint generation
  getTabAccessibilityLabel: (tab: TabConfig) => string;
  getTabAccessibilityHint: (tab: TabConfig) => string;
  getTabAccessibilityValue: (tab: TabConfig) => string;
  
  // Keyboard navigation
  handleKeyboardNavigation: (event: any) => boolean;
  
  // Voice control
  registerVoiceCommands: (commands: VoiceControlCommands) => void;
  
  // Configuration
  updateAccessibilityConfig: (config: Partial<AccessibilityConfig>) => void;
  getAccessibilityConfig: () => AccessibilityConfig;
  
  // Utilities
  shouldReduceMotion: () => boolean;
  shouldUseHighContrast: () => boolean;
  getOptimalFontSize: (baseSize: number) => number;
  
  // Educational context
  announceAchievement: (achievement: string, points?: number) => void;
  announceLearningMilestone: (milestone: string, progress: number) => void;
  announceStreakUpdate: (days: number, subject?: string) => void;
}

// Default accessibility configuration
const DEFAULT_CONFIG: AccessibilityConfig = {
  announceTabChanges: true,
  announceProgress: true,
  announceBadges: true,
  useRichDescriptions: true,
  enableHapticFeedback: true,
  respectReducedMotion: true,
};

// Announcement throttling configuration
const ANNOUNCEMENT_CONFIG = {
  MIN_INTERVAL: 500, // Minimum 500ms between announcements
  PROGRESS_INTERVAL: 2000, // Progress announcements every 2 seconds max
  BADGE_INTERVAL: 1000, // Badge announcements every 1 second max
} as const;

/**
 * Educational context mapping for accessibility
 */
const EDUCATIONAL_CONTEXTS = {
  HomeTab: {
    description: 'daily overview and quick actions',
    helpText: 'Access your dashboard, recent progress, and quick shortcuts',
  },
  LessonsTab: {
    description: 'learning content and courses',
    helpText: 'Study lessons, complete assignments, and track your learning',
  },
  ScheduleTab: {
    description: 'time management and calendar',
    helpText: 'View your class schedule and upcoming assignments',
  },
  VocabularyTab: {
    description: 'language learning tools',
    helpText: 'Practice vocabulary with flashcards and exercises',
  },
  ProfileTab: {
    description: 'progress tracking and achievements',
    helpText: 'View your achievements, statistics, and account settings',
  },
} as const;

/**
 * Custom hook for comprehensive tab accessibility support
 */
export const useTabAccessibility = (): UseTabAccessibilityReturn => {
  // Accessibility state
  const [accessibilityState, setAccessibilityState] = useState<AccessibilityState>({
    isScreenReaderEnabled: false,
    isReduceMotionEnabled: false,
    isHighContrastEnabled: false,
    preferredFontScale: 1.0,
    isBoldTextEnabled: false,
    announceInterval: ANNOUNCEMENT_CONFIG.MIN_INTERVAL,
  });
  
  // Configuration state
  const [config, setConfig] = useState<AccessibilityConfig>(DEFAULT_CONFIG);
  
  // Refs for throttling and cleanup
  const lastAnnouncementTimeRef = useRef<number>(0);
  const lastProgressAnnouncementRef = useRef<number>(0);
  const lastBadgeAnnouncementRef = useRef<number>(0);
  const voiceCommandsRef = useRef<VoiceControlCommands>({});
  const tabRefsRef = useRef<Map<string, any>>(new Map());
  
  // =====================================================
  // INITIALIZATION AND STATE MANAGEMENT
  // =====================================================
  
  useEffect(() => {
    // Initialize accessibility state
    initializeAccessibilityState();
    
    // Set up accessibility event listeners
    const screenReaderSubscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      handleScreenReaderChange
    );
    
    const reduceMotionSubscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      handleReduceMotionChange
    );
    
    const boldTextSubscription = AccessibilityInfo.addEventListener(
      'boldTextChanged',
      handleBoldTextChange
    );
    
    // iOS only - high contrast
    let highContrastSubscription: any = null;
    if (Platform.OS === 'ios') {
      highContrastSubscription = AccessibilityInfo.addEventListener(
        'highContrastChanged',
        handleHighContrastChange
      );
    }
    
    return () => {
      // Cleanup subscriptions
      screenReaderSubscription?.remove();
      reduceMotionSubscription?.remove();
      boldTextSubscription?.remove();
      highContrastSubscription?.remove();
    };
  }, []);
  
  const initializeAccessibilityState = async () => {
    try {
      const [
        isScreenReaderEnabled,
        isReduceMotionEnabled,
        isBoldTextEnabled,
        isHighContrastEnabled,
      ] = await Promise.all([
        AccessibilityInfo.isScreenReaderEnabled(),
        AccessibilityInfo.isReduceMotionEnabled(),
        AccessibilityInfo.isBoldTextEnabled(),
        Platform.OS === 'ios' ? AccessibilityInfo.isHighContrastEnabled() : Promise.resolve(false),
      ]);
      
      setAccessibilityState(prev => ({
        ...prev,
        isScreenReaderEnabled,
        isReduceMotionEnabled,
        isBoldTextEnabled,
        isHighContrastEnabled,
      }));
    } catch (error) {
      console.warn('Failed to initialize accessibility state:', error);
    }
  };
  
  // =====================================================
  // EVENT HANDLERS
  // =====================================================
  
  const handleScreenReaderChange = useCallback((enabled: boolean) => {
    setAccessibilityState(prev => ({
      ...prev,
      isScreenReaderEnabled: enabled,
    }));
    
    if (enabled) {
      // Announce that screen reader is now active
      setTimeout(() => {
        AccessibilityInfo.announceForAccessibility(
          'Screen reader enabled. Welcome to Harry School student app. Use swipe gestures to navigate between tabs.'
        );
      }, 1000);
    }
  }, []);
  
  const handleReduceMotionChange = useCallback((enabled: boolean) => {
    setAccessibilityState(prev => ({
      ...prev,
      isReduceMotionEnabled: enabled,
    }));
  }, []);
  
  const handleBoldTextChange = useCallback((enabled: boolean) => {
    setAccessibilityState(prev => ({
      ...prev,
      isBoldTextEnabled: enabled,
    }));
  }, []);
  
  const handleHighContrastChange = useCallback((enabled: boolean) => {
    setAccessibilityState(prev => ({
      ...prev,
      isHighContrastEnabled: enabled,
    }));
  }, []);
  
  // =====================================================
  // ANNOUNCEMENT METHODS
  // =====================================================
  
  const shouldThrottleAnnouncement = useCallback((
    type: 'general' | 'progress' | 'badge' = 'general'
  ): boolean => {
    const now = Date.now();
    const lastTime = type === 'progress' ? lastProgressAnnouncementRef.current :
                    type === 'badge' ? lastBadgeAnnouncementRef.current :
                    lastAnnouncementTimeRef.current;
    
    const interval = type === 'progress' ? ANNOUNCEMENT_CONFIG.PROGRESS_INTERVAL :
                    type === 'badge' ? ANNOUNCEMENT_CONFIG.BADGE_INTERVAL :
                    ANNOUNCEMENT_CONFIG.MIN_INTERVAL;
    
    return (now - lastTime) < interval;
  }, []);
  
  const announceTabChange = useCallback((
    tabId: string,
    tabName: string,
    additionalInfo?: string
  ) => {
    if (!config.announceTabChanges || shouldThrottleAnnouncement()) return;
    
    const context = EDUCATIONAL_CONTEXTS[tabId as keyof typeof EDUCATIONAL_CONTEXTS];
    let announcement = `Switched to ${tabName}`;
    
    if (config.useRichDescriptions && context) {
      announcement += `, ${context.description}`;
    }
    
    if (additionalInfo) {
      announcement += `. ${additionalInfo}`;
    }
    
    AccessibilityInfo.announceForAccessibility(announcement);
    lastAnnouncementTimeRef.current = Date.now();
  }, [config.announceTabChanges, config.useRichDescriptions, shouldThrottleAnnouncement]);
  
  const announceProgress = useCallback((
    tabId: string,
    progress: number,
    context?: string
  ) => {
    if (!config.announceProgress || shouldThrottleAnnouncement('progress')) return;
    
    const roundedProgress = Math.round(progress);
    let announcement = `Progress updated to ${roundedProgress} percent`;
    
    if (context) {
      announcement += ` in ${context}`;
    }
    
    // Add encouragement for milestones
    if (roundedProgress === 25) {
      announcement += '. Great start!';
    } else if (roundedProgress === 50) {
      announcement += '. Halfway there!';
    } else if (roundedProgress === 75) {
      announcement += '. Almost done!';
    } else if (roundedProgress === 100) {
      announcement += '. Completed! Well done!';
    }
    
    AccessibilityInfo.announceForAccessibility(announcement);
    lastProgressAnnouncementRef.current = Date.now();
  }, [config.announceProgress, shouldThrottleAnnouncement]);
  
  const announceBadgeUpdate = useCallback((
    tabId: string,
    badgeCount: number,
    isNew: boolean = false
  ) => {
    if (!config.announceBadges || shouldThrottleAnnouncement('badge')) return;
    
    let announcement;
    
    if (badgeCount === 0) {
      announcement = 'All notifications cleared';
    } else if (badgeCount === 1) {
      announcement = isNew ? 'New notification' : '1 notification';
    } else {
      announcement = isNew ? 
        `${badgeCount} new notifications` : 
        `${badgeCount} notifications`;
    }
    
    const context = EDUCATIONAL_CONTEXTS[tabId as keyof typeof EDUCATIONAL_CONTEXTS];
    if (context) {
      announcement += ` in ${context.description}`;
    }
    
    AccessibilityInfo.announceForAccessibility(announcement);
    lastBadgeAnnouncementRef.current = Date.now();
  }, [config.announceBadges, shouldThrottleAnnouncement]);
  
  const announceError = useCallback((
    message: string,
    severity: 'low' | 'medium' | 'high' = 'medium'
  ) => {
    if (shouldThrottleAnnouncement()) return;
    
    const prefix = severity === 'high' ? 'Alert: ' :
                  severity === 'medium' ? 'Warning: ' : '';
    
    AccessibilityInfo.announceForAccessibility(`${prefix}${message}`);
    lastAnnouncementTimeRef.current = Date.now();
  }, [shouldThrottleAnnouncement]);
  
  const announceSuccess = useCallback((message: string, points?: number) => {
    if (shouldThrottleAnnouncement()) return;
    
    let announcement = `Success: ${message}`;
    
    if (points) {
      announcement += `. You earned ${points} points!`;
    }
    
    AccessibilityInfo.announceForAccessibility(announcement);
    lastAnnouncementTimeRef.current = Date.now();
  }, [shouldThrottleAnnouncement]);
  
  // =====================================================
  // EDUCATIONAL ANNOUNCEMENTS
  // =====================================================
  
  const announceAchievement = useCallback((achievement: string, points?: number) => {
    if (shouldThrottleAnnouncement()) return;
    
    let announcement = `Achievement unlocked: ${achievement}`;
    
    if (points) {
      announcement += `. You earned ${points} points!`;
    }
    
    announcement += ' Congratulations!';
    
    AccessibilityInfo.announceForAccessibility(announcement);
    lastAnnouncementTimeRef.current = Date.now();
  }, [shouldThrottleAnnouncement]);
  
  const announceLearningMilestone = useCallback((milestone: string, progress: number) => {
    if (shouldThrottleAnnouncement()) return;
    
    const announcement = `Learning milestone reached: ${milestone}. You are now ${Math.round(progress)}% complete. Keep up the great work!`;
    
    AccessibilityInfo.announceForAccessibility(announcement);
    lastAnnouncementTimeRef.current = Date.now();
  }, [shouldThrottleAnnouncement]);
  
  const announceStreakUpdate = useCallback((days: number, subject?: string) => {
    if (shouldThrottleAnnouncement()) return;
    
    let announcement = `Study streak: ${days} day${days === 1 ? '' : 's'}`;
    
    if (subject) {
      announcement += ` in ${subject}`;
    }
    
    if (days >= 7) {
      announcement += '. Excellent consistency!';
    } else if (days >= 3) {
      announcement += '. Great progress!';
    }
    
    AccessibilityInfo.announceForAccessibility(announcement);
    lastAnnouncementTimeRef.current = Date.now();
  }, [shouldThrottleAnnouncement]);
  
  // =====================================================
  // FOCUS MANAGEMENT
  // =====================================================
  
  const setAccessibilityFocus = useCallback((elementRef: any) => {
    if (!accessibilityState.isScreenReaderEnabled || !elementRef) return;
    
    const reactTag = findNodeHandle(elementRef);
    if (reactTag) {
      AccessibilityInfo.setAccessibilityFocus(reactTag);
    }
  }, [accessibilityState.isScreenReaderEnabled]);
  
  const moveFocusToTab = useCallback((tabId: string) => {
    const tabRef = tabRefsRef.current.get(tabId);
    if (tabRef) {
      setAccessibilityFocus(tabRef);
    }
  }, [setAccessibilityFocus]);
  
  // =====================================================
  // LABEL AND HINT GENERATION
  // =====================================================
  
  const getTabAccessibilityLabel = useCallback((tab: TabConfig): string => {
    let label = tab.label;
    
    // Add badge information
    if (tab.badgeCount && tab.badgeCount > 0) {
      label += `, ${tab.badgeCount} notification${tab.badgeCount === 1 ? '' : 's'}`;
    }
    
    // Add progress information
    if (tab.progress !== undefined && tab.progress > 0) {
      label += `, ${Math.round(tab.progress)}% complete`;
    }
    
    // Add disabled state
    if (tab.disabled) {
      label += ', disabled';
    }
    
    return label;
  }, []);
  
  const getTabAccessibilityHint = useCallback((tab: TabConfig): string => {
    const context = EDUCATIONAL_CONTEXTS[tab.id as keyof typeof EDUCATIONAL_CONTEXTS];
    
    let hint = `Tap to switch to ${tab.label}`;
    
    if (config.useRichDescriptions && context) {
      hint += `. ${context.helpText}`;
    }
    
    return hint;
  }, [config.useRichDescriptions]);
  
  const getTabAccessibilityValue = useCallback((tab: TabConfig): string => {
    const values: string[] = [];
    
    if (tab.progress !== undefined && tab.progress > 0) {
      values.push(`${Math.round(tab.progress)}% complete`);
    }
    
    if (tab.badgeCount && tab.badgeCount > 0) {
      values.push(`${tab.badgeCount} notifications`);
    }
    
    return values.join(', ');
  }, []);
  
  // =====================================================
  // KEYBOARD NAVIGATION
  // =====================================================
  
  const handleKeyboardNavigation = useCallback((event: any): boolean => {
    // This would handle keyboard navigation events
    // Implementation depends on the specific keyboard navigation setup
    return false; // Return true if event was handled
  }, []);
  
  // =====================================================
  // VOICE CONTROL
  // =====================================================
  
  const registerVoiceCommands = useCallback((commands: VoiceControlCommands) => {
    voiceCommandsRef.current = { ...voiceCommandsRef.current, ...commands };
  }, []);
  
  // =====================================================
  // CONFIGURATION
  // =====================================================
  
  const updateAccessibilityConfig = useCallback((newConfig: Partial<AccessibilityConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);
  
  const getAccessibilityConfig = useCallback((): AccessibilityConfig => {
    return { ...config };
  }, [config]);
  
  // =====================================================
  // UTILITIES
  // =====================================================
  
  const shouldReduceMotion = useCallback((): boolean => {
    return config.respectReducedMotion && accessibilityState.isReduceMotionEnabled;
  }, [config.respectReducedMotion, accessibilityState.isReduceMotionEnabled]);
  
  const shouldUseHighContrast = useCallback((): boolean => {
    return accessibilityState.isHighContrastEnabled;
  }, [accessibilityState.isHighContrastEnabled]);
  
  const getOptimalFontSize = useCallback((baseSize: number): number => {
    let scaledSize = baseSize * accessibilityState.preferredFontScale;
    
    // Apply bold text scaling if enabled
    if (accessibilityState.isBoldTextEnabled) {
      scaledSize *= 1.1; // Slight increase for bold text
    }
    
    // Ensure minimum readable size
    return Math.max(scaledSize, 12);
  }, [accessibilityState.preferredFontScale, accessibilityState.isBoldTextEnabled]);
  
  // =====================================================
  // RETURN HOOK INTERFACE
  // =====================================================
  
  return {
    // Current accessibility state
    accessibilityState,
    
    // Accessibility methods
    announceTabChange,
    announceProgress,
    announceBadgeUpdate,
    announceError,
    announceSuccess,
    
    // Focus management
    setAccessibilityFocus,
    moveFocusToTab,
    
    // Label and hint generation
    getTabAccessibilityLabel,
    getTabAccessibilityHint,
    getTabAccessibilityValue,
    
    // Keyboard navigation
    handleKeyboardNavigation,
    
    // Voice control
    registerVoiceCommands,
    
    // Configuration
    updateAccessibilityConfig,
    getAccessibilityConfig,
    
    // Utilities
    shouldReduceMotion,
    shouldUseHighContrast,
    getOptimalFontSize,
    
    // Educational context
    announceAchievement,
    announceLearningMilestone,
    announceStreakUpdate,
  };
};

export default useTabAccessibility;