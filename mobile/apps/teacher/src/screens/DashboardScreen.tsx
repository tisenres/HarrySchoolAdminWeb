import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WelcomeHeader } from '../components/dashboard/WelcomeHeader';
import { QuickActions } from '../components/dashboard/QuickActions';
import { GroupsOverview } from '../components/dashboard/GroupsOverview';
import { TodaysClasses } from '../components/dashboard/TodaysClasses';
import { PerformanceMetrics } from '../components/dashboard/PerformanceMetrics';
import { useDashboardData } from '../hooks/useDashboardData';

export function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { 
    isLoading, 
    isRefreshing, 
    refresh, 
    teacherData, 
    todaysClasses, 
    groupsData, 
    performanceData 
  } = useDashboardData();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Header with Cultural Greetings */}
        <WelcomeHeader 
          teacher={teacherData}
          isLoading={isLoading}
        />

        {/* Quick Actions - F-Pattern Top Priority */}
        <QuickActions />

        {/* Today's Classes Timeline - High Priority Information */}
        <TodaysClasses 
          classes={todaysClasses}
          isLoading={isLoading}
        />

        {/* Groups Overview */}
        <GroupsOverview 
          groups={groupsData}
          isLoading={isLoading}
        />

        {/* Performance Metrics */}
        <PerformanceMetrics 
          data={performanceData}
          isLoading={isLoading}
        />

        {/* Bottom padding for floating actions */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Extra space for floating actions
  },
  bottomPadding: {
    height: 80,
  },
});