/**
 * AnimatedTabBar Integration Example
 * Harry School Student App
 * 
 * Demonstrates how to integrate the enhanced AnimatedTabBar component
 * with realistic data and proper configuration for different age groups.
 * 
 * @example
 * // Basic Integration
 * import { AnimatedTabBar, defaultStudentTabs } from '../components/AnimatedTabBar';
 * 
 * <AnimatedTabBar
 *   tabs={tabs}
 *   activeTabId={activeTab}
 *   onTabPress={handleTabPress}
 *   userAge={student.age}
 *   language={user.language}
 *   isOnline={networkStatus.connected}
 * />
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { AnimatedTabBar, StudentTabItem, defaultStudentTabs } from '../components/AnimatedTabBar';

// Example student data structure
interface StudentData {
  id: string;
  name: string;
  age: number;
  language: 'en' | 'ru' | 'uz';
  theme: 'light' | 'dark';
  gamificationEnabled: boolean;
  progressData: {
    home: { streakCount: number; todayCompleted: boolean };
    lessons: { progressPercent: number; newAchievement: boolean };
    schedule: { upcomingItems: number };
    vocabulary: { dailyGoalProgress: number; masteredWords: number };
    profile: { rankingPosition: number; newRewards: number };
  };
}

// Example implementation component
export const TabBarExample: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [isOnline, setIsOnline] = useState(true);
  const [student] = useState<StudentData>({
    id: '1',
    name: 'Alex Student',
    age: 12, // Elementary age group
    language: 'en',
    theme: 'light',
    gamificationEnabled: true,
    progressData: {
      home: { streakCount: 7, todayCompleted: false },
      lessons: { progressPercent: 75, newAchievement: true },
      schedule: { upcomingItems: 3 },
      vocabulary: { dailyGoalProgress: 85, masteredWords: 45 },
      profile: { rankingPosition: 8, newRewards: 2 },
    },
  });

  // Enhanced tabs with real student progress data
  const enhancedTabs: StudentTabItem[] = [
    {
      ...defaultStudentTabs[0], // Home
      streakCount: student.progressData.home.streakCount,
      progressPercent: student.progressData.home.todayCompleted ? 100 : 60,
      isOfflineCapable: true,
    },
    {
      ...defaultStudentTabs[1], // Lessons
      progressPercent: student.progressData.lessons.progressPercent,
      achievementUnlocked: student.progressData.lessons.newAchievement,
      isOfflineCapable: true,
    },
    {
      ...defaultStudentTabs[2], // Schedule
      badge: student.progressData.schedule.upcomingItems,
      isOfflineCapable: false, // Requires online sync
    },
    {
      ...defaultStudentTabs[3], // Vocabulary
      progressPercent: student.progressData.vocabulary.dailyGoalProgress,
      streakCount: student.progressData.vocabulary.masteredWords > 40 ? 3 : 0,
      isOfflineCapable: true,
    },
    {
      ...defaultStudentTabs[4], // Profile
      badge: student.progressData.profile.newRewards,
      progressPercent: Math.min(95, student.progressData.profile.rankingPosition * 10),
      isOfflineCapable: true,
    },
  ];

  // Simulate network status changes
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate occasional offline state for demonstration
      if (Math.random() < 0.1) {
        setIsOnline(false);
        setTimeout(() => setIsOnline(true), 3000);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleTabPress = (tabId: string) => {
    console.log(`Navigating to tab: ${tabId}`);
    setActiveTab(tabId);
    
    // Handle tab-specific actions
    switch (tabId) {
      case 'home':
        // Navigate to home screen, update streak if needed
        break;
      case 'lessons':
        // Navigate to lessons, mark achievement as viewed
        break;
      case 'schedule':
        // Navigate to schedule, clear badge count
        break;
      case 'vocabulary':
        // Navigate to vocabulary practice
        break;
      case 'profile':
        // Navigate to profile, clear reward notifications
        break;
    }
  };

  const handleTabLongPress = (tabId: string) => {
    console.log(`Long pressed tab: ${tabId}`);
    // Show contextual menu or shortcuts
    // For example: quick actions, bookmarks, etc.
  };

  return (
    <View style={styles.container}>
      {/* Main content area would go here */}
      <View style={styles.content}>
        {/* Current tab content */}
      </View>

      {/* Enhanced AnimatedTabBar */}
      <AnimatedTabBar
        tabs={enhancedTabs}
        activeTabId={activeTab}
        onTabPress={handleTabPress}
        onTabLongPress={handleTabLongPress}
        userAge={student.age}
        language={student.language}
        theme={student.theme}
        variant="enhanced" // Use enhanced variant for elementary students
        enableGamification={student.gamificationEnabled}
        enableProgressRings={true}
        enableCelebrations={true}
        isOnline={isOnline}
        style={styles.tabBar}
      />
    </View>
  );
};

// Age-specific configuration examples
export const ElementaryTabBarExample: React.FC = () => (
  <AnimatedTabBar
    tabs={defaultStudentTabs}
    activeTabId="home"
    onTabPress={() => {}}
    userAge={10} // Elementary configuration
    language="en"
    variant="enhanced"
    enableGamification={true}
    enableProgressRings={true}
    enableCelebrations={true}
    isOnline={true}
  />
);

export const SecondaryTabBarExample: React.FC = () => (
  <AnimatedTabBar
    tabs={defaultStudentTabs}
    activeTabId="lessons"
    onTabPress={() => {}}
    userAge={16} // Secondary configuration
    language="ru"
    variant="standard"
    enableGamification={true}
    enableProgressRings={true}
    enableCelebrations={false} // Less distracting for older students
    isOnline={true}
  />
);

// Multilingual examples
export const RussianTabBarExample: React.FC = () => {
  const russianTabs: StudentTabItem[] = [
    {
      id: 'home',
      label: 'Home',
      labelRu: 'Главная',
      icon: '🏠',
      activeIcon: '🏡',
      isOfflineCapable: true,
      progressPercent: 80,
      streakCount: 5,
    },
    {
      id: 'lessons',
      label: 'Lessons',
      labelRu: 'Уроки',
      icon: '📚',
      activeIcon: '📖',
      isOfflineCapable: true,
      progressPercent: 65,
    },
    {
      id: 'schedule',
      label: 'Schedule',
      labelRu: 'Расписание',
      icon: '📅',
      activeIcon: '🗓️',
      isOfflineCapable: false,
      badge: 2,
    },
    {
      id: 'vocabulary',
      label: 'Vocabulary',
      labelRu: 'Словарь',
      icon: '🔤',
      activeIcon: '📝',
      isOfflineCapable: true,
      progressPercent: 90,
    },
    {
      id: 'profile',
      label: 'Profile',
      labelRu: 'Профиль',
      icon: '👤',
      activeIcon: '👨‍🎓',
      isOfflineCapable: true,
      badge: 1,
    },
  ];

  return (
    <AnimatedTabBar
      tabs={russianTabs}
      activeTabId="home"
      onTabPress={() => {}}
      userAge={14}
      language="ru"
      theme="light"
      isOnline={true}
    />
  );
};

// Dark theme example
export const DarkThemeTabBarExample: React.FC = () => (
  <AnimatedTabBar
    tabs={defaultStudentTabs}
    activeTabId="profile"
    onTabPress={() => {}}
    userAge={15}
    language="en"
    theme="dark"
    enableGamification={true}
    isOnline={true}
    backgroundColor="#1d2939" // Custom dark background
  />
);

// Minimal variant example (for focus mode)
export const MinimalTabBarExample: React.FC = () => (
  <AnimatedTabBar
    tabs={defaultStudentTabs}
    activeTabId="lessons"
    onTabPress={() => {}}
    userAge={17}
    language="en"
    variant="minimal"
    enableGamification={false} // Reduced distractions
    enableProgressRings={false}
    enableCelebrations={false}
    isOnline={true}
  />
);

// Offline mode example
export const OfflineTabBarExample: React.FC = () => {
  const offlineTabs = defaultStudentTabs.map(tab => ({
    ...tab,
    // Schedule tab requires online connection
    disabled: tab.id === 'schedule',
  }));

  return (
    <AnimatedTabBar
      tabs={offlineTabs}
      activeTabId="vocabulary"
      onTabPress={() => {}}
      userAge={13}
      language="en"
      isOnline={false} // Offline state
      enableGamification={true}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    // Custom tab bar styling if needed
  },
});

export default TabBarExample;