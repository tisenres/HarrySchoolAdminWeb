/**
 * Student Tab Configuration - Harry School Student App
 * 
 * Defines the 5 main tabs based on UX research for students ages 10-18:
 * - Home (40% usage) - Daily overview and quick actions
 * - Lessons (35% usage) - Core learning content
 * - Schedule (15% usage) - Time management and assignments  
 * - Vocabulary (8% usage) - Language learning tools
 * - Profile (2% usage) - Progress tracking and achievements
 * 
 * Each tab includes:
 * - Educational color coding
 * - Usage-based priority ordering
 * - Icon selection optimized for student recognition
 * - Accessibility-friendly naming
 */

import type { TabConfig } from './AnimatedTabBar';

// Educational color system for tabs
export const TAB_COLORS = {
  home: '#1d7452',      // Primary brand green - trustworthy, stable
  lessons: '#3b82f6',   // Blue - focus, learning, concentration  
  schedule: '#8b5cf6',  // Purple - organization, planning
  vocabulary: '#f59e0b', // Orange - energy, language, creativity
  profile: '#10b981',   // Emerald - growth, progress, achievement
} as const;

// Icon mappings for consistent visual language
export const TAB_ICONS = {
  home: {
    default: 'home-outline',
    focused: 'home',
    alt: 'house-outline', // Alternative for variety
  },
  lessons: {
    default: 'book-outline', 
    focused: 'book',
    alt: 'library-outline',
  },
  schedule: {
    default: 'calendar-outline',
    focused: 'calendar',
    alt: 'time-outline',
  },
  vocabulary: {
    default: 'library-outline',
    focused: 'library', 
    alt: 'language-outline',
  },
  profile: {
    default: 'person-outline',
    focused: 'person',
    alt: 'medal-outline',
  },
} as const;

// Base tab configuration for Harry School Student App
export const studentTabConfig: TabConfig[] = [
  {
    id: 'HomeTab',
    name: 'HomeTab',
    icon: TAB_ICONS.home.default,
    iconFocused: TAB_ICONS.home.focused,
    label: 'Home',
    color: TAB_COLORS.home,
    usagePercentage: 40,
    // Dynamic properties (set by hooks/services)
    badgeCount: 0,
    progress: undefined,
    disabled: false,
  },
  {
    id: 'LessonsTab', 
    name: 'LessonsTab',
    icon: TAB_ICONS.lessons.default,
    iconFocused: TAB_ICONS.lessons.focused,
    label: 'Lessons',
    color: TAB_COLORS.lessons,
    usagePercentage: 35,
    // Dynamic properties
    badgeCount: 0,
    progress: undefined,
    disabled: false,
  },
  {
    id: 'ScheduleTab',
    name: 'ScheduleTab', 
    icon: TAB_ICONS.schedule.default,
    iconFocused: TAB_ICONS.schedule.focused,
    label: 'Schedule',
    color: TAB_COLORS.schedule,
    usagePercentage: 15,
    // Dynamic properties
    badgeCount: 0,
    progress: undefined,
    disabled: false,
  },
  {
    id: 'VocabularyTab',
    name: 'VocabularyTab',
    icon: TAB_ICONS.vocabulary.default,
    iconFocused: TAB_ICONS.vocabulary.focused, 
    label: 'Vocabulary',
    color: TAB_COLORS.vocabulary,
    usagePercentage: 8,
    // Dynamic properties
    badgeCount: 0,
    progress: undefined,
    disabled: false,
  },
  {
    id: 'ProfileTab',
    name: 'ProfileTab',
    icon: TAB_ICONS.profile.default,
    iconFocused: TAB_ICONS.profile.focused,
    label: 'Profile', 
    color: TAB_COLORS.profile,
    usagePercentage: 2,
    // Dynamic properties
    badgeCount: 0,
    progress: undefined,
    disabled: false,
  },
];

// Alternative tab configurations for different contexts
export const alternativeTabConfigs = {
  // Compact version for smaller screens
  compact: studentTabConfig.map(tab => ({
    ...tab,
    label: tab.label.length > 7 ? tab.label.substring(0, 6) + '...' : tab.label,
  })),
  
  // High contrast version for accessibility
  highContrast: studentTabConfig.map(tab => ({
    ...tab,
    color: tab.id === 'HomeTab' ? '#000000' : // Black for primary
           tab.id === 'LessonsTab' ? '#0066CC' : // High contrast blue
           tab.id === 'ScheduleTab' ? '#6600CC' : // High contrast purple  
           tab.id === 'VocabularyTab' ? '#CC6600' : // High contrast orange
           '#00CC66', // High contrast green for profile
  })),
  
  // Beginner mode - simplified labels
  beginner: studentTabConfig.map(tab => ({
    ...tab,
    label: tab.id === 'HomeTab' ? 'Home' :
           tab.id === 'LessonsTab' ? 'Learn' :
           tab.id === 'ScheduleTab' ? 'Time' :
           tab.id === 'VocabularyTab' ? 'Words' :
           'Me',
  })),
};

// Tab feature flags for progressive enhancement
export const tabFeatures = {
  HOME: {
    showDashboard: true,
    showQuickActions: true,
    showRecentActivity: true,
    showAchievements: true,
    enableNotifications: true,
  },
  LESSONS: {
    showProgress: true,
    enableBookmarks: true,
    showDifficulty: true,
    enableNotes: true,
    trackTimeSpent: true,
  },
  SCHEDULE: {
    showCalendar: true,
    enableReminders: true,
    showUpcoming: true,
    trackAttendance: true,
    enablePlanning: true,
  },
  VOCABULARY: {
    showProgress: true,
    enableFlashcards: true,
    trackMemorization: true,
    enableTranslation: true,
    showStreak: true,
  },
  PROFILE: {
    showAchievements: true,
    showStatistics: true,
    enableGoals: true,
    showRanking: true,
    enableSharing: false, // Privacy-first for students
  },
};

// Dynamic badge calculation functions
export const badgeCalculators = {
  home: (notifications: any[], assignments: any[]) => {
    return notifications.length + assignments.filter(a => a.isUrgent).length;
  },
  
  lessons: (unreadLessons: any[], newAssignments: any[]) => {
    return unreadLessons.length + newAssignments.length;
  },
  
  schedule: (upcomingClasses: any[], overdueAssignments: any[]) => {
    const now = new Date();
    const todayClasses = upcomingClasses.filter(c => 
      new Date(c.date).toDateString() === now.toDateString()
    );
    return todayClasses.length + overdueAssignments.length;
  },
  
  vocabulary: (newWords: any[], reviewDue: any[]) => {
    return newWords.length + reviewDue.length;
  },
  
  profile: (newAchievements: any[], unreadMessages: any[]) => {
    return newAchievements.length + unreadMessages.length;
  },
};

// Progress calculation functions  
export const progressCalculators = {
  home: (overallProgress: number) => overallProgress,
  
  lessons: (completedLessons: number, totalLessons: number) => {
    return totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
  },
  
  schedule: (attendedClasses: number, totalScheduledClasses: number) => {
    return totalScheduledClasses > 0 ? (attendedClasses / totalScheduledClasses) * 100 : 0;
  },
  
  vocabulary: (knownWords: number, totalWords: number) => {
    return totalWords > 0 ? (knownWords / totalWords) * 100 : 0;
  },
  
  profile: (achievementsEarned: number, totalAchievements: number) => {
    return totalAchievements > 0 ? (achievementsEarned / totalAchievements) * 100 : 0;
  },
};

// Utility functions for tab configuration
export const tabConfigUtils = {
  /**
   * Get tab by ID
   */
  getTabById: (tabId: string): TabConfig | undefined => {
    return studentTabConfig.find(tab => tab.id === tabId);
  },
  
  /**
   * Get tabs sorted by usage percentage (most used first)
   */
  getTabsByUsage: (): TabConfig[] => {
    return [...studentTabConfig].sort((a, b) => b.usagePercentage - a.usagePercentage);
  },
  
  /**
   * Get tab configuration with dynamic data
   */
  getTabsWithDynamicData: (
    badges: Record<string, number> = {},
    progress: Record<string, number> = {},
    disabled: Record<string, boolean> = {}
  ): TabConfig[] => {
    return studentTabConfig.map(tab => ({
      ...tab,
      badgeCount: badges[tab.id] || 0,
      progress: progress[tab.id],
      disabled: disabled[tab.id] || false,
    }));
  },
  
  /**
   * Get accessibility-optimized tab configuration
   */
  getAccessibilityOptimizedTabs: (
    isHighContrast: boolean = false,
    isLargeText: boolean = false
  ): TabConfig[] => {
    let config = isHighContrast ? alternativeTabConfigs.highContrast : studentTabConfig;
    
    if (isLargeText) {
      config = config.map(tab => ({
        ...tab,
        label: tab.label.length > 5 ? tab.label.substring(0, 4) + '...' : tab.label,
      }));
    }
    
    return config;
  },
  
  /**
   * Validate tab configuration
   */
  validateTabConfig: (config: TabConfig[]): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // Check for duplicate IDs
    const ids = config.map(tab => tab.id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      errors.push(`Duplicate tab IDs found: ${duplicateIds.join(', ')}`);
    }
    
    // Check for missing required properties
    config.forEach((tab, index) => {
      if (!tab.id) errors.push(`Tab at index ${index} missing ID`);
      if (!tab.name) errors.push(`Tab at index ${index} missing name`);
      if (!tab.label) errors.push(`Tab at index ${index} missing label`);
      if (!tab.icon) errors.push(`Tab at index ${index} missing icon`);
      if (!tab.color) errors.push(`Tab at index ${index} missing color`);
    });
    
    // Check usage percentages sum to 100
    const totalUsage = config.reduce((sum, tab) => sum + tab.usagePercentage, 0);
    if (Math.abs(totalUsage - 100) > 0.1) {
      errors.push(`Usage percentages should sum to 100, got ${totalUsage}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};

// Export default configuration
export default studentTabConfig;