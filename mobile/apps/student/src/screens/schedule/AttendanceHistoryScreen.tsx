/**
 * AttendanceHistoryScreen - Student Attendance Analytics
 * Features historical data visualization, pattern analysis, and goal setting
 * Age-adaptive interface with Islamic values and family involvement considerations
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  SlideInUp,
  ZoomIn,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

import { useStudentStore } from '../../store/studentStore';
import { useAttendanceHistory } from '../../hooks/useAttendanceHistory';
import { useGoalSetting } from '../../hooks/useGoalSetting';
import { AttendanceRecord, AttendanceStats, AgeGroup } from '../../types';

const { width: screenWidth } = Dimensions.get('window');

const AttendanceHistoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  // Store and data hooks
  const { student, culturalPreferences, language } = useStudentStore();
  const { 
    attendanceHistory, 
    monthlyStats, 
    weeklyStats,
    attendanceGoal,
    isLoading, 
    error, 
    refreshHistory 
  } = useAttendanceHistory(student?.id);
  const { setGoal, updateGoal, goalProgress } = useGoalSetting();

  // State management
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'semester'>('month');
  const [showGoalSetting, setShowGoalSetting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Animation values
  const fadeValue = useSharedValue(1);
  const chartScale = useSharedValue(0);

  // Age-appropriate configuration
  const ageGroup: AgeGroup = student?.age_group || 'middle';
  const isElementary = ageGroup === 'elementary';
  const isHighSchool = ageGroup === 'high';

  // Initialize chart animations
  useEffect(() => {
    chartScale.value = withSpring(1, { duration: 800 });
  }, [chartScale]);

  // Calculate attendance statistics
  const attendanceStats = useMemo(() => {
    if (!attendanceHistory?.length) return null;

    const total = attendanceHistory.length;
    const present = attendanceHistory.filter(record => record.status === 'present').length;
    const late = attendanceHistory.filter(record => record.status === 'late').length;
    const absent = attendanceHistory.filter(record => record.status === 'absent').length;
    const excused = attendanceHistory.filter(record => record.status === 'excused').length;

    const attendanceRate = total > 0 ? (present + late) / total : 0;
    const punctualityRate = total > 0 ? present / total : 0;

    return {
      total,
      present,
      late,
      absent,
      excused,
      attendanceRate,
      punctualityRate,
      streak: calculateCurrentStreak(attendanceHistory),
      bestStreak: calculateBestStreak(attendanceHistory)
    };
  }, [attendanceHistory]);

  // Prepare chart data based on selected period and age group
  const chartData = useMemo(() => {
    if (!attendanceHistory?.length) return null;

    const data = selectedPeriod === 'week' ? weeklyStats :
                 selectedPeriod === 'month' ? monthlyStats :
                 attendanceHistory; // semester view

    if (isElementary) {
      // Simple bar chart for elementary students
      return {
        labels: data?.slice(-6).map((_, index) => `Week ${index + 1}`) || [],
        datasets: [{
          data: data?.slice(-6).map(item => 
            item.present / (item.present + item.absent + item.late) || 0
          ) || [],
          color: () => '#1d7452',
        }]
      };
    } else if (isHighSchool) {
      // Advanced analytics for high school students
      return {
        attendance: {
          labels: data?.slice(-12).map(item => item.period) || [],
          datasets: [{
            data: data?.slice(-12).map(item => 
              (item.present + item.late) / (item.present + item.absent + item.late) * 100
            ) || [],
            strokeWidth: 3,
            color: () => '#1d7452',
          }]
        },
        punctuality: {
          labels: data?.slice(-12).map(item => item.period) || [],
          datasets: [{
            data: data?.slice(-12).map(item => 
              item.present / (item.present + item.absent + item.late) * 100
            ) || [],
            strokeWidth: 3,
            color: () => '#3498db',
          }]
        },
        breakdown: {
          data: [
            { name: 'Present', count: attendanceStats?.present || 0, color: '#27ae60' },
            { name: 'Late', count: attendanceStats?.late || 0, color: '#f39c12' },
            { name: 'Absent', count: attendanceStats?.absent || 0, color: '#e74c3c' },
            { name: 'Excused', count: attendanceStats?.excused || 0, color: '#9b59b6' },
          ]
        }
      };
    } else {
      // Balanced view for middle school
      return {
        labels: data?.slice(-8).map(item => item.period.substring(0, 3)) || [],
        datasets: [{
          data: data?.slice(-8).map(item => 
            (item.present + item.late) / (item.present + item.absent + item.late) * 100
          ) || [],
          strokeWidth: 2,
          color: () => '#1d7452',
        }]
      };
    }
  }, [attendanceHistory, weeklyStats, monthlyStats, selectedPeriod, attendanceStats, isElementary, isHighSchool]);

  // Handle period selection
  const handlePeriodChange = useCallback((period: 'week' | 'month' | 'semester') => {
    setSelectedPeriod(period);
    fadeValue.value = withTiming(0, { duration: 200 }, () => {
      fadeValue.value = withTiming(1, { duration: 300 });
    });
  }, [fadeValue]);

  // Handle goal setting
  const handleSetGoal = useCallback(async (goalPercentage: number) => {
    try {
      await setGoal({
        studentId: student?.id,
        type: 'attendance',
        target: goalPercentage,
        period: 'monthly'
      });
      setShowGoalSetting(false);
    } catch (error) {
      console.error('Error setting goal:', error);
    }
  }, [student?.id, setGoal]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshHistory();
    } finally {
      setRefreshing(false);
    }
  }, [refreshHistory]);

  // Calculate current and best streaks
  const calculateCurrentStreak = (records: AttendanceRecord[]): number => {
    if (!records?.length) return 0;
    
    const sortedRecords = [...records].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    let streak = 0;
    for (const record of sortedRecords) {
      if (record.status === 'present' || record.status === 'late') {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const calculateBestStreak = (records: AttendanceRecord[]): number => {
    if (!records?.length) return 0;
    
    let maxStreak = 0;
    let currentStreak = 0;
    
    for (const record of records) {
      if (record.status === 'present' || record.status === 'late') {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    return maxStreak;
  };

  // Animated styles
  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fadeValue.value,
  }));

  const chartScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: chartScale.value }],
  }));

  // Get motivational message based on attendance rate
  const getMotivationalMessage = (rate: number): string => {
    const messages = {
      excellent: culturalPreferences?.showIslamicGreetings 
        ? 'Barakallahu feeki! Excellent attendance! 🌟'
        : 'Excellent attendance! Keep it up! 🌟',
      good: 'Good attendance! You\'re doing well! 👏',
      improvement: 'Let\'s work on improving attendance together! 💪',
      concern: 'Your attendance needs attention. Let\'s make a plan! 📚'
    };

    if (rate >= 0.95) return messages.excellent;
    if (rate >= 0.85) return messages.good;
    if (rate >= 0.75) return messages.improvement;
    return messages.concern;
  };

  if (isLoading && !attendanceHistory?.length) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#1d7452" />
        <Text style={[styles.loadingText, { fontSize: isElementary ? 18 : 16 }]}>
          Loading attendance history...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Icon name="alert-circle" size={48} color="#e74c3c" />
        <Text style={[styles.errorText, { fontSize: isElementary ? 18 : 16 }]}>
          Unable to load attendance data
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.backButton, { padding: isElementary ? 12 : 8 }]}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
        >
          <Icon name="arrow-left" size={isElementary ? 28 : 24} color="#1d7452" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { fontSize: isElementary ? 24 : 20 }]}>
            Attendance History
          </Text>
          <Text style={[styles.headerSubtitle, { fontSize: isElementary ? 16 : 14 }]}>
            Track your learning journey
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#1d7452']}
            tintColor="#1d7452"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Overview Stats */}
        <Animated.View 
          style={styles.statsContainer}
          entering={FadeIn.delay(100)}
        >
          <Text style={[styles.sectionTitle, { fontSize: isElementary ? 22 : 20 }]}>
            Your Attendance Overview
          </Text>
          
          <View style={styles.statsGrid}>
            <Animated.View 
              style={[styles.statCard, styles.primaryStat]}
              entering={ZoomIn.delay(200)}
            >
              <Icon name="check-circle" size={isElementary ? 40 : 32} color="#27ae60" />
              <Text style={[styles.statValue, { fontSize: isElementary ? 28 : 24 }]}>
                {Math.round((attendanceStats?.attendanceRate || 0) * 100)}%
              </Text>
              <Text style={[styles.statLabel, { fontSize: isElementary ? 16 : 14 }]}>
                Attendance Rate
              </Text>
            </Animated.View>

            <View style={styles.secondaryStats}>
              <Animated.View 
                style={styles.statCard}
                entering={ZoomIn.delay(300)}
              >
                <Icon name="calendar-check" size={isElementary ? 32 : 24} color="#1d7452" />
                <Text style={[styles.statValue, { fontSize: isElementary ? 20 : 18 }]}>
                  {attendanceStats?.present || 0}
                </Text>
                <Text style={[styles.statLabel, { fontSize: isElementary ? 14 : 12 }]}>
                  Classes Attended
                </Text>
              </Animated.View>

              <Animated.View 
                style={styles.statCard}
                entering={ZoomIn.delay(400)}
              >
                <Icon name="fire" size={isElementary ? 32 : 24} color="#e74c3c" />
                <Text style={[styles.statValue, { fontSize: isElementary ? 20 : 18 }]}>
                  {attendanceStats?.streak || 0}
                </Text>
                <Text style={[styles.statLabel, { fontSize: isElementary ? 14 : 12 }]}>
                  Current Streak
                </Text>
              </Animated.View>
            </View>
          </View>

          {attendanceStats && (
            <View style={styles.motivationSection}>
              <Text style={[styles.motivationText, { fontSize: isElementary ? 18 : 16 }]}>
                {getMotivationalMessage(attendanceStats.attendanceRate)}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Period Selection - Hidden for Elementary */}
        {!isElementary && (
          <Animated.View 
            style={styles.periodSelector}
            entering={SlideInUp.delay(300)}
          >
            {(['week', 'month', 'semester'] as const).map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  selectedPeriod === period && styles.periodButtonActive
                ]}
                onPress={() => handlePeriodChange(period)}
                accessibilityLabel={`View ${period} data`}
              >
                <Text style={[
                  styles.periodButtonText,
                  selectedPeriod === period && styles.periodButtonTextActive,
                  { fontSize: isHighSchool ? 16 : 14 }
                ]}>
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        {/* Charts Section */}
        <Animated.View 
          style={[styles.chartContainer, fadeStyle, chartScaleStyle]}
          entering={SlideInUp.delay(400)}
        >
          {chartData && (
            <>
              {isElementary ? (
                // Simple bar chart for elementary
                <View style={styles.chartWrapper}>
                  <Text style={[styles.chartTitle, { fontSize: 18 }]}>
                    Weekly Attendance
                  </Text>
                  <BarChart
                    data={chartData}
                    width={screenWidth - 60}
                    height={200}
                    yAxisLabel=""
                    yAxisSuffix=""
                    chartConfig={{
                      backgroundColor: '#ffffff',
                      backgroundGradientFrom: '#ffffff',
                      backgroundGradientTo: '#ffffff',
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(29, 116, 82, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(45, 65, 80, ${opacity})`,
                      style: { borderRadius: 16 },
                      propsForLabels: { fontSize: 12 }
                    }}
                    style={styles.chart}
                  />
                </View>
              ) : isHighSchool ? (
                // Advanced analytics for high school
                <View style={styles.advancedCharts}>
                  <View style={styles.chartWrapper}>
                    <Text style={[styles.chartTitle, { fontSize: 18 }]}>
                      Attendance Trend
                    </Text>
                    <LineChart
                      data={chartData.attendance}
                      width={screenWidth - 60}
                      height={220}
                      chartConfig={{
                        backgroundColor: '#ffffff',
                        backgroundGradientFrom: '#ffffff',
                        backgroundGradientTo: '#ffffff',
                        decimalPlaces: 1,
                        color: (opacity = 1) => `rgba(29, 116, 82, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(45, 65, 80, ${opacity})`,
                        style: { borderRadius: 16 },
                        propsForDots: { r: '4', strokeWidth: '2', stroke: '#1d7452' }
                      }}
                      style={styles.chart}
                      bezier
                    />
                  </View>

                  <View style={styles.chartWrapper}>
                    <Text style={[styles.chartTitle, { fontSize: 18 }]}>
                      Punctuality Rate
                    </Text>
                    <LineChart
                      data={chartData.punctuality}
                      width={screenWidth - 60}
                      height={180}
                      chartConfig={{
                        backgroundColor: '#ffffff',
                        backgroundGradientFrom: '#ffffff',
                        backgroundGradientTo: '#ffffff',
                        decimalPlaces: 1,
                        color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(45, 65, 80, ${opacity})`,
                        style: { borderRadius: 16 }
                      }}
                      style={styles.chart}
                    />
                  </View>

                  <View style={styles.chartWrapper}>
                    <Text style={[styles.chartTitle, { fontSize: 18 }]}>
                      Attendance Breakdown
                    </Text>
                    <PieChart
                      data={chartData.breakdown}
                      width={screenWidth - 60}
                      height={200}
                      chartConfig={{
                        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                      }}
                      accessor="count"
                      backgroundColor="transparent"
                      paddingLeft="15"
                    />
                  </View>
                </View>
              ) : (
                // Balanced view for middle school
                <View style={styles.chartWrapper}>
                  <Text style={[styles.chartTitle, { fontSize: 18 }]}>
                    Monthly Attendance
                  </Text>
                  <LineChart
                    data={chartData}
                    width={screenWidth - 60}
                    height={200}
                    chartConfig={{
                      backgroundColor: '#ffffff',
                      backgroundGradientFrom: '#ffffff',
                      backgroundGradientTo: '#ffffff',
                      decimalPlaces: 1,
                      color: (opacity = 1) => `rgba(29, 116, 82, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(45, 65, 80, ${opacity})`,
                      style: { borderRadius: 16 }
                    }}
                    style={styles.chart}
                    bezier
                  />
                </View>
              )}
            </>
          )}
        </Animated.View>

        {/* Goal Setting Section - Hidden for Elementary */}
        {!isElementary && (
          <Animated.View 
            style={styles.goalContainer}
            entering={SlideInUp.delay(500)}
          >
            <View style={styles.goalHeader}>
              <Icon name="target" size={isHighSchool ? 28 : 24} color="#1d7452" />
              <Text style={[styles.goalTitle, { fontSize: isHighSchool ? 20 : 18 }]}>
                Attendance Goal
              </Text>
            </View>

            {attendanceGoal ? (
              <View style={styles.goalProgress}>
                <View style={styles.goalProgressBar}>
                  <View 
                    style={[
                      styles.goalProgressFill,
                      { width: `${Math.min((goalProgress?.current || 0) / attendanceGoal.target * 100, 100)}%` }
                    ]}
                  />
                </View>
                <Text style={[styles.goalProgressText, { fontSize: isHighSchool ? 16 : 14 }]}>
                  {Math.round((goalProgress?.current || 0) * 100)}% of {attendanceGoal.target}% goal
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.setGoalButton}
                onPress={() => setShowGoalSetting(true)}
                accessibilityLabel="Set attendance goal"
              >
                <Text style={[styles.setGoalText, { fontSize: isHighSchool ? 16 : 14 }]}>
                  Set Monthly Goal
                </Text>
                <Icon name="plus" size={isHighSchool ? 24 : 20} color="#1d7452" />
              </TouchableOpacity>
            )}
          </Animated.View>
        )}

        {/* Recent Activity - All Age Groups */}
        <Animated.View 
          style={styles.recentActivity}
          entering={SlideInUp.delay(600)}
        >
          <Text style={[styles.sectionTitle, { fontSize: isElementary ? 20 : 18 }]}>
            Recent Classes
          </Text>
          
          <View style={styles.activityList}>
            {attendanceHistory?.slice(0, isElementary ? 5 : 8).map((record, index) => (
              <TouchableOpacity
                key={record.id}
                style={styles.activityItem}
                onPress={() => setSelectedDate(record.date)}
                accessibilityLabel={`${record.subject} class on ${record.date}`}
              >
                <View style={[
                  styles.activityStatus,
                  { backgroundColor: getStatusColor(record.status) }
                ]}>
                  <Icon 
                    name={getStatusIcon(record.status)} 
                    size={isElementary ? 20 : 16} 
                    color="#ffffff" 
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text style={[styles.activitySubject, { fontSize: isElementary ? 16 : 14 }]}>
                    {record.subject}
                  </Text>
                  <Text style={[styles.activityDate, { fontSize: isElementary ? 14 : 12 }]}>
                    {new Date(record.date).toLocaleDateString(
                      language === 'uzbek' ? 'uz-UZ' : language === 'russian' ? 'ru-RU' : 'en-US',
                      { weekday: 'short', month: 'short', day: 'numeric' }
                    )}
                  </Text>
                </View>
                <Text style={[
                  styles.activityStatus,
                  { color: getStatusColor(record.status), fontSize: isElementary ? 14 : 12 }
                ]}>
                  {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
};

// Helper functions
const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'present': '#27ae60',
    'late': '#f39c12',
    'absent': '#e74c3c',
    'excused': '#9b59b6',
    'default': '#95a5a6'
  };
  return colors[status] || colors.default;
};

const getStatusIcon = (status: string): string => {
  const icons: Record<string, string> = {
    'present': 'check',
    'late': 'clock',
    'absent': 'close',
    'excused': 'information',
    'default': 'help'
  };
  return icons[status] || icons.default;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: '700',
    color: '#2d4150',
    marginBottom: 2,
  },
  headerSubtitle: {
    color: '#6c757d',
  },
  scrollContainer: {
    flex: 1,
  },
  statsContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#2d4150',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
  },
  primaryStat: {
    backgroundColor: '#e8f5e8',
    flex: 2,
  },
  secondaryStats: {
    flex: 1.5,
    gap: 12,
  },
  statValue: {
    fontWeight: '700',
    color: '#2d4150',
    marginVertical: 4,
  },
  statLabel: {
    color: '#6c757d',
    textAlign: 'center',
  },
  motivationSection: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  motivationText: {
    color: '#1d7452',
    fontWeight: '600',
    textAlign: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#1d7452',
  },
  periodButtonText: {
    color: '#6c757d',
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: '#ffffff',
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartWrapper: {
    padding: 20,
  },
  chartTitle: {
    fontWeight: '700',
    color: '#2d4150',
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  advancedCharts: {
    gap: 20,
  },
  goalContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalTitle: {
    fontWeight: '700',
    color: '#2d4150',
    marginLeft: 12,
  },
  goalProgress: {
    alignItems: 'center',
  },
  goalProgressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginBottom: 8,
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: '#1d7452',
    borderRadius: 4,
  },
  goalProgressText: {
    color: '#6c757d',
  },
  setGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1d7452',
    borderStyle: 'dashed',
  },
  setGoalText: {
    color: '#1d7452',
    fontWeight: '600',
    marginRight: 8,
  },
  recentActivity: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activityList: {
    gap: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  activityStatus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activitySubject: {
    fontWeight: '600',
    color: '#2d4150',
    marginBottom: 2,
  },
  activityDate: {
    color: '#6c757d',
  },
  loadingText: {
    color: '#6c757d',
    marginTop: 16,
  },
  errorText: {
    color: '#e74c3c',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#1d7452',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AttendanceHistoryScreen;