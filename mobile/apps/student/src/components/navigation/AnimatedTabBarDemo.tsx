/**
 * AnimatedTabBar Demo Component - Harry School Student App
 * 
 * Interactive demonstration of the AnimatedTabBar features including:
 * - Badge animations with different counts
 * - Progress ring animations with completion states
 * - Tab switching with bounce and spring effects
 * - Accessibility features demonstration
 * - Reduced motion mode testing
 * - Educational context examples
 * 
 * This component serves as:
 * 1. Feature showcase for stakeholders
 * 2. Testing playground for developers
 * 3. Accessibility validation tool
 * 4. Animation performance benchmarking
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

// Import our custom tab bar components
import {
  AnimatedTabBar,
  useTabState,
  useTabAnalytics,
  useTabAccessibility,
  studentTabConfig,
  tabConfigUtils,
} from './';
import type { TabConfig } from './AnimatedTabBar';

// Demo configuration
interface DemoState {
  showBadges: boolean;
  showProgress: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  autoAnimation: boolean;
  simulateNotifications: boolean;
}

interface DemoScenario {
  id: string;
  name: string;
  description: string;
  badgeCounts: Record<string, number>;
  progressValues: Record<string, number>;
  disabled?: Record<string, boolean>;
}

// Pre-configured demo scenarios
const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'fresh_student',
    name: 'Fresh Student',
    description: 'New student with minimal activity',
    badgeCounts: {
      HomeTab: 2,
      LessonsTab: 1,
      ScheduleTab: 0,
      VocabularyTab: 0,
      ProfileTab: 1,
    },
    progressValues: {
      HomeTab: 15,
      LessonsTab: 5,
      ScheduleTab: 0,
      VocabularyTab: 0,
      ProfileTab: 10,
    },
  },
  {
    id: 'active_learner',
    name: 'Active Learner',
    description: 'Student with good engagement across all areas',
    badgeCounts: {
      HomeTab: 3,
      LessonsTab: 5,
      ScheduleTab: 2,
      VocabularyTab: 8,
      ProfileTab: 0,
    },
    progressValues: {
      HomeTab: 65,
      LessonsTab: 78,
      ScheduleTab: 45,
      VocabularyTab: 82,
      ProfileTab: 55,
    },
  },
  {
    id: 'high_achiever',
    name: 'High Achiever',
    description: 'Student near completion with achievements',
    badgeCounts: {
      HomeTab: 1,
      LessonsTab: 2,
      ScheduleTab: 0,
      VocabularyTab: 15,
      ProfileTab: 3,
    },
    progressValues: {
      HomeTab: 95,
      LessonsTab: 92,
      ScheduleTab: 88,
      VocabularyTab: 97,
      ProfileTab: 89,
    },
  },
  {
    id: 'notification_heavy',
    name: 'Notification Heavy',
    description: 'Many pending items requiring attention',
    badgeCounts: {
      HomeTab: 12,
      LessonsTab: 8,
      ScheduleTab: 5,
      VocabularyTab: 23,
      ProfileTab: 7,
    },
    progressValues: {
      HomeTab: 40,
      LessonsTab: 35,
      ScheduleTab: 60,
      VocabularyTab: 25,
      ProfileTab: 70,
    },
  },
];

// =====================================================
// DEMO COMPONENT
// =====================================================

export const AnimatedTabBarDemo: React.FC = () => {
  // Demo state
  const [demoState, setDemoState] = useState<DemoState>({
    showBadges: true,
    showProgress: true,
    reducedMotion: false,
    highContrast: false,
    autoAnimation: false,
    simulateNotifications: false,
  });

  const [currentScenario, setCurrentScenario] = useState<DemoScenario>(DEMO_SCENARIOS[0]);
  const [customBadges, setCustomBadges] = useState<Record<string, number>>({});
  const [customProgress, setCustomProgress] = useState<Record<string, number>>({});

  // Tab management
  const {
    activeTabId,
    switchToTab,
    getTabUsageStats,
    resetTabState,
  } = useTabState('HomeTab', studentTabConfig);

  // Analytics
  const {
    startSession,
    endSession,
    trackTabSwitch,
    getEngagementMetrics,
    isTrackingSession,
  } = useTabAnalytics();

  // Accessibility
  const {
    announceTabChange,
    announceProgress,
    announceAchievement,
    updateAccessibilityConfig,
    shouldReduceMotion,
  } = useTabAccessibility();

  // =====================================================
  // DEMO SCENARIOS
  // =====================================================

  const applyScenario = useCallback((scenario: DemoScenario) => {
    setCurrentScenario(scenario);
    setCustomBadges(scenario.badgeCounts);
    setCustomProgress(scenario.progressValues);
    
    // Announce scenario change
    setTimeout(() => {
      announceTabChange(
        'demo',
        `Applied ${scenario.name} scenario`,
        scenario.description
      );
    }, 500);
  }, [announceTabChange]);

  // =====================================================
  // AUTO ANIMATION DEMO
  // =====================================================

  useEffect(() => {
    if (!demoState.autoAnimation) return;

    const animationInterval = setInterval(() => {
      // Cycle through tabs automatically
      const tabs = studentTabConfig.map(t => t.id);
      const currentIndex = tabs.indexOf(activeTabId);
      const nextIndex = (currentIndex + 1) % tabs.length;
      switchToTab(tabs[nextIndex]);

      // Simulate badge updates
      if (demoState.simulateNotifications) {
        const randomTab = tabs[Math.floor(Math.random() * tabs.length)];
        setCustomBadges(prev => ({
          ...prev,
          [randomTab]: (prev[randomTab] || 0) + 1,
        }));
      }
    }, 3000); // Switch every 3 seconds

    return () => clearInterval(animationInterval);
  }, [demoState.autoAnimation, demoState.simulateNotifications, activeTabId, switchToTab]);

  // =====================================================
  // NOTIFICATION SIMULATION
  // =====================================================

  useEffect(() => {
    if (!demoState.simulateNotifications) return;

    const notificationInterval = setInterval(() => {
      const tabs = studentTabConfig.map(t => t.id);
      const randomTab = tabs[Math.floor(Math.random() * tabs.length)];
      
      setCustomBadges(prev => ({
        ...prev,
        [randomTab]: Math.min((prev[randomTab] || 0) + 1, 99),
      }));
    }, 2000); // New notification every 2 seconds

    return () => clearInterval(notificationInterval);
  }, [demoState.simulateNotifications]);

  // =====================================================
  // TAB CONFIGURATION BUILDER
  // =====================================================

  const getDemoTabConfig = useCallback((): TabConfig[] => {
    let baseConfig = studentTabConfig;
    
    // Apply accessibility optimizations
    if (demoState.highContrast || demoState.reducedMotion) {
      baseConfig = tabConfigUtils.getAccessibilityOptimizedTabs(
        demoState.highContrast,
        false // Large text would be handled by system settings
      );
    }

    // Apply current badge and progress data
    return tabConfigUtils.getTabsWithDynamicData(
      demoState.showBadges ? customBadges : {},
      demoState.showProgress ? customProgress : {}
    );
  }, [demoState, customBadges, customProgress]);

  // =====================================================
  // INTERACTION HANDLERS
  // =====================================================

  const handleTabPress = useCallback((tabId: string) => {
    const tab = studentTabConfig.find(t => t.id === tabId);
    if (!tab) return;

    switchToTab(tabId);
    trackTabSwitch(activeTabId, tabId, tab.label);
  }, [activeTabId, switchToTab, trackTabSwitch]);

  const handleDemoStateChange = useCallback((key: keyof DemoState, value: boolean) => {
    setDemoState(prev => ({ ...prev, [key]: value }));
    
    // Update accessibility configuration
    if (key === 'reducedMotion') {
      updateAccessibilityConfig({ respectReducedMotion: value });
    }
  }, [updateAccessibilityConfig]);

  const simulateAchievement = useCallback(() => {
    const achievements = [
      'First Lesson Complete',
      'Vocabulary Master',
      '7-Day Streak',
      'Perfect Attendance',
      'Quick Learner',
    ];
    
    const randomAchievement = achievements[Math.floor(Math.random() * achievements.length)];
    const points = Math.floor(Math.random() * 100) + 50;
    
    announceAchievement(randomAchievement, points);
    
    Alert.alert(
      'Achievement Unlocked! 🎉',
      `${randomAchievement}\n\nYou earned ${points} points!`,
      [{ text: 'Awesome!', style: 'default' }]
    );
  }, [announceAchievement]);

  const resetDemo = useCallback(() => {
    setCustomBadges({});
    setCustomProgress({});
    resetTabState();
    setDemoState(prev => ({
      ...prev,
      autoAnimation: false,
      simulateNotifications: false,
    }));
  }, [resetTabState]);

  // =====================================================
  // ANALYTICS DISPLAY
  // =====================================================

  const showAnalytics = useCallback(async () => {
    try {
      const metrics = await getEngagementMetrics();
      const usage = getTabUsageStats();
      
      Alert.alert(
        'Analytics Summary',
        `Session Duration: ${Math.round(metrics.averageSessionDuration / 1000)}s\n` +
        `Tab Switches: ${metrics.tabSwitchFrequency}\n` +
        `Engagement Score: ${metrics.engagementScore}/100\n` +
        `Total Time: ${Math.round(metrics.totalTimeSpent / 1000)}s\n\n` +
        `Tab Usage:\n${Object.entries(usage)
          .map(([tab, count]) => `${tab}: ${count} times`)
          .join('\n')}`,
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to load analytics data');
    }
  }, [getEngagementMetrics, getTabUsageStats]);

  // =====================================================
  // RENDER COMPONENT
  // =====================================================

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Icon name="construct-outline" size={28} color="#1d7452" />
          <Text style={styles.headerTitle}>AnimatedTabBar Demo</Text>
          <Text style={styles.headerSubtitle}>
            Interactive showcase of student-friendly tab navigation
          </Text>
        </View>

        {/* Demo Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Demo Controls</Text>
          
          {/* Feature Toggles */}
          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>Show Badges</Text>
            <Switch
              value={demoState.showBadges}
              onValueChange={(value) => handleDemoStateChange('showBadges', value)}
              trackColor={{ false: '#d1d5db', true: '#1d7452' }}
            />
          </View>
          
          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>Show Progress</Text>
            <Switch
              value={demoState.showProgress}
              onValueChange={(value) => handleDemoStateChange('showProgress', value)}
              trackColor={{ false: '#d1d5db', true: '#1d7452' }}
            />
          </View>
          
          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>High Contrast</Text>
            <Switch
              value={demoState.highContrast}
              onValueChange={(value) => handleDemoStateChange('highContrast', value)}
              trackColor={{ false: '#d1d5db', true: '#1d7452' }}
            />
          </View>
          
          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>Reduced Motion</Text>
            <Switch
              value={demoState.reducedMotion}
              onValueChange={(value) => handleDemoStateChange('reducedMotion', value)}
              trackColor={{ false: '#d1d5db', true: '#1d7452' }}
            />
          </View>
          
          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>Auto Animation</Text>
            <Switch
              value={demoState.autoAnimation}
              onValueChange={(value) => handleDemoStateChange('autoAnimation', value)}
              trackColor={{ false: '#d1d5db', true: '#1d7452' }}
            />
          </View>
          
          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>Simulate Notifications</Text>
            <Switch
              value={demoState.simulateNotifications}
              onValueChange={(value) => handleDemoStateChange('simulateNotifications', value)}
              trackColor={{ false: '#d1d5db', true: '#1d7452' }}
            />
          </View>
        </View>

        {/* Scenario Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Demo Scenarios</Text>
          <Text style={styles.sectionDescription}>
            Pre-configured student states to test different use cases
          </Text>
          
          {DEMO_SCENARIOS.map((scenario) => (
            <TouchableOpacity
              key={scenario.id}
              style={[
                styles.scenarioButton,
                currentScenario.id === scenario.id && styles.scenarioButtonActive,
              ]}
              onPress={() => applyScenario(scenario)}
            >
              <Text
                style={[
                  styles.scenarioButtonText,
                  currentScenario.id === scenario.id && styles.scenarioButtonTextActive,
                ]}
              >
                {scenario.name}
              </Text>
              <Text style={styles.scenarioDescription}>
                {scenario.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Actions</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={simulateAchievement}>
            <Icon name="trophy-outline" size={20} color="#f59e0b" />
            <Text style={styles.actionButtonText}>Simulate Achievement</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={showAnalytics}>
            <Icon name="analytics-outline" size={20} color="#3b82f6" />
            <Text style={styles.actionButtonText}>Show Analytics</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={resetDemo}>
            <Icon name="refresh-outline" size={20} color="#ef4444" />
            <Text style={styles.actionButtonText}>Reset Demo</Text>
          </TouchableOpacity>
        </View>

        {/* Current State Display */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current State</Text>
          <View style={styles.stateDisplay}>
            <Text style={styles.stateText}>Active Tab: {activeTabId}</Text>
            <Text style={styles.stateText}>
              Session: {isTrackingSession ? 'Active' : 'Inactive'}
            </Text>
            <Text style={styles.stateText}>
              Reduced Motion: {shouldReduceMotion() ? 'On' : 'Off'}
            </Text>
          </View>
        </View>

        {/* Footer spacing for tab bar */}
        <View style={styles.footer} />
      </ScrollView>

      {/* Demo Tab Bar */}
      <AnimatedTabBar
        tabs={getDemoTabConfig()}
        activeTabId={activeTabId}
        onTabPress={handleTabPress}
        testID="demo-animated-tab-bar"
      />
    </SafeAreaView>
  );
};

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  
  scrollView: {
    flex: 1,
  },
  
  header: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 8,
    textAlign: 'center',
  },
  
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  
  section: {
    backgroundColor: '#ffffff',
    marginTop: 12,
    padding: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  
  controlLabel: {
    fontSize: 16,
    color: '#374151',
  },
  
  scenarioButton: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  
  scenarioButtonActive: {
    backgroundColor: '#1d7452',
    borderColor: '#1d7452',
  },
  
  scenarioButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  
  scenarioButtonTextActive: {
    color: '#ffffff',
  },
  
  scenarioDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  
  actionButtonText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 8,
  },
  
  stateDisplay: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
  },
  
  stateText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  
  footer: {
    height: 120, // Space for the tab bar
  },
});

export default AnimatedTabBarDemo;