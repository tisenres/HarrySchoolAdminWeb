/**
 * Navigation Components Example
 * Harry School Mobile Design System
 * 
 * Demonstrates TabBar and Header components in action
 * with Teacher and Student variants
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, Switch } from 'react-native';
import { TabBar, Header } from '../components';
import { TEACHER_TABS, STUDENT_TABS } from '../components/TabBar/TabBar.types';
import type { HeaderAction, SyncStatus } from '../components/Header/Header.types';

export const NavigationExample: React.FC = () => {
  // State for demo controls
  const [activeVariant, setActiveVariant] = useState<'teacher' | 'student'>('student');
  const [activeTabId, setActiveTabId] = useState('learn');
  const [isOffline, setIsOffline] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [searchActive, setSearchActive] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [badgeCount, setBadgeCount] = useState(3);

  // Sample header actions
  const headerActions: HeaderAction[] = [
    {
      id: 'search',
      icon: 'search',
      label: 'Search',
      onPress: () => setSearchActive(!searchActive),
      accessibilityHint: 'Toggle search functionality',
    },
    {
      id: 'notifications',
      icon: 'bell',
      label: 'Notifications',
      onPress: () => console.log('Notifications pressed'),
      badgeCount: badgeCount,
      accessibilityHint: 'View notifications',
    },
    {
      id: 'settings',
      icon: 'settings',
      label: 'Settings',
      onPress: () => console.log('Settings pressed'),
      accessibilityHint: 'Open settings',
    },
  ];

  // Get current tabs based on variant
  const currentTabs = activeVariant === 'teacher' ? TEACHER_TABS : STUDENT_TABS;

  // Update active tab when variant changes
  React.useEffect(() => {
    if (activeVariant === 'teacher') {
      setActiveTabId('dashboard');
    } else {
      setActiveTabId('learn');
    }
  }, [activeVariant]);

  // Simulate sync status changes
  const cycleSyncStatus = () => {
    const statuses: SyncStatus[] = ['idle', 'syncing', 'success', 'error'];
    const currentIndex = statuses.indexOf(syncStatus);
    const nextIndex = (currentIndex + 1) % statuses.length;
    setSyncStatus(statuses[nextIndex]);
  };

  return (
    <View style={styles.container}>
      {/* Demo Controls */}
      <View style={styles.controls}>
        <Text style={styles.controlsTitle}>Navigation Demo Controls</Text>
        
        <View style={styles.controlRow}>
          <Text style={styles.controlLabel}>App Variant:</Text>
          <View style={styles.variantButtons}>
            <Text 
              style={[
                styles.variantButton, 
                activeVariant === 'student' && styles.variantButtonActive
              ]}
              onPress={() => setActiveVariant('student')}
            >
              Student
            </Text>
            <Text 
              style={[
                styles.variantButton, 
                activeVariant === 'teacher' && styles.variantButtonActive
              ]}
              onPress={() => setActiveVariant('teacher')}
            >
              Teacher
            </Text>
          </View>
        </View>

        <View style={styles.controlRow}>
          <Text style={styles.controlLabel}>Offline Mode:</Text>
          <Switch value={isOffline} onValueChange={setIsOffline} />
        </View>

        <View style={styles.controlRow}>
          <Text 
            style={[styles.controlLabel, styles.pressable]} 
            onPress={cycleSyncStatus}
          >
            Sync Status: {syncStatus} (tap to cycle)
          </Text>
        </View>

        <View style={styles.controlRow}>
          <Text 
            style={[styles.controlLabel, styles.pressable]} 
            onPress={() => setBadgeCount(prev => prev === 0 ? 9 : prev === 9 ? 99 : prev === 99 ? 150 : 0)}
          >
            Badge Count: {badgeCount} (tap to cycle)
          </Text>
        </View>
      </View>

      {/* Header Examples */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Header Variants</Text>
        
        {/* Default Header */}
        <View style={styles.example}>
          <Text style={styles.exampleTitle}>Default Header</Text>
          <Header
            title={`${activeVariant === 'teacher' ? 'Teacher' : 'Student'} Dashboard`}
            subtitle="Welcome back!"
            backButton={{ show: true, onPress: () => console.log('Back pressed') }}
            actions={headerActions}
            syncStatus={syncStatus}
            isOffline={isOffline}
          />
        </View>

        {/* Search Header */}
        <View style={styles.example}>
          <Text style={styles.exampleTitle}>Search Header</Text>
          <Header
            variant="search"
            title="Search Results"
            search={{
              isActive: searchActive,
              placeholder: 'Search lessons, vocabulary...',
              value: searchValue,
              onChangeText: setSearchValue,
              onClear: () => setSearchValue(''),
            }}
            backButton={{ show: true }}
          />
        </View>

        {/* Contextual Header */}
        <View style={styles.example}>
          <Text style={styles.exampleTitle}>Contextual Header</Text>
          <Header
            variant="contextual"
            title="Lesson in Progress"
            actions={[
              {
                id: 'pause',
                icon: 'pause',
                label: 'Pause',
                onPress: () => console.log('Pause lesson'),
              },
              {
                id: 'help',
                icon: 'help',
                label: 'Help',
                onPress: () => console.log('Show help'),
              },
            ]}
          />
        </View>

        {/* Minimal Header */}
        <View style={styles.example}>
          <Text style={styles.exampleTitle}>Minimal Header</Text>
          <Header
            variant="minimal"
            title="Quick View"
            backButton={{ show: true }}
            actions={[
              {
                id: 'share',
                icon: 'share',
                label: 'Share',
                onPress: () => console.log('Share'),
              },
            ]}
          />
        </View>
      </View>

      {/* TabBar Examples */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>TabBar</Text>
        
        <View style={styles.example}>
          <Text style={styles.exampleTitle}>
            {activeVariant === 'teacher' ? 'Teacher' : 'Student'} Tab Bar
          </Text>
          <TabBar
            variant={activeVariant}
            tabs={currentTabs.map((tab, index) => ({
              ...tab,
              badgeCount: index === 1 ? badgeCount : index === 2 ? 1 : undefined,
            }))}
            activeTabId={activeTabId}
            isOffline={isOffline}
            loadingTabs={syncStatus === 'syncing' ? ['progress'] : []}
            onTabPress={(tabId) => {
              setActiveTabId(tabId);
              console.log('Tab pressed:', tabId);
            }}
            onTabLongPress={(tabId) => {
              console.log('Tab long pressed:', tabId);
            }}
          />
        </View>
      </View>

      {/* Feature Showcase */}
      <ScrollView style={styles.features}>
        <Text style={styles.sectionTitle}>Features Showcase</Text>
        
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>🎯 Accessibility</Text>
          <Text style={styles.featureText}>
            • Screen reader support with proper roles and labels{'\n'}
            • 48pt minimum touch targets for comfortable interaction{'\n'}
            • High contrast colors meeting WCAG AA standards{'\n'}
            • Haptic feedback for tactile confirmation
          </Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>🚀 Animations</Text>
          <Text style={styles.featureText}>
            • Smooth spring animations using React Native Reanimated{'\n'}
            • Teacher variant: Fast, efficiency-focused (100-150ms){'\n'}
            • Student variant: Engaging, delightful (200-300ms){'\n'}
            • Reduced motion support for accessibility
          </Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>🔌 Offline Support</Text>
          <Text style={styles.featureText}>
            • Visual offline indicators and status bars{'\n'}
            • Disabled state for connection-required features{'\n'}
            • Graceful degradation of functionality{'\n'}
            • Clear user communication about limitations
          </Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>⚙️ Customization</Text>
          <Text style={styles.featureText}>
            • Teacher vs Student theme variants{'\n'}
            • Comprehensive styling props{'\n'}
            • Badge support with smart count display{'\n'}
            • Loading states and sync indicators
          </Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>📱 Mobile Optimized</Text>
          <Text style={styles.featureText}>
            • Thumb zone optimization for reachability{'\n'}
            • Responsive layouts for different screen sizes{'\n'}
            • Platform-appropriate interactions (iOS/Android){'\n'}
            • Performance optimized for 60fps animations
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  controls: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eaecf0',
  },
  controlsTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 12,
    color: '#101828',
  },
  controlRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 8,
  },
  controlLabel: {
    fontSize: 14,
    color: '#344054',
  },
  pressable: {
    textDecorationLine: 'underline' as const,
    color: '#1d7452',
  },
  variantButtons: {
    flexDirection: 'row' as const,
    backgroundColor: '#f2f4f7',
    borderRadius: 8,
    padding: 2,
  },
  variantButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#667085',
    borderRadius: 6,
  },
  variantButtonActive: {
    backgroundColor: '#ffffff',
    color: '#1d7452',
    fontWeight: '600' as const,
  },
  section: {
    backgroundColor: '#ffffff',
    marginTop: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    marginBottom: 16,
    color: '#101828',
  },
  example: {
    marginBottom: 24,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: '500' as const,
    marginBottom: 8,
    color: '#344054',
  },
  features: {
    flex: 1,
    backgroundColor: '#ffffff',
    marginTop: 8,
    padding: 16,
  },
  featureCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#1d7452',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 8,
    color: '#101828',
  },
  featureText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#344054',
  },
};

export default NavigationExample;