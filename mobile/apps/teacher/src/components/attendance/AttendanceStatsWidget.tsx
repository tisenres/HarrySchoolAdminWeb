import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { attendanceStatsService, TeacherValueableStats } from '../../services/attendanceStats';
import { memoryCache } from '../../services/memoryCache';

interface AttendanceStatsWidgetProps {
  teacherId: string;
  onStatsLoad?: (stats: TeacherValueableStats) => void;
}

export const AttendanceStatsWidget: React.FC<AttendanceStatsWidgetProps> = ({
  teacherId,
  onStatsLoad
}) => {
  const [stats, setStats] = useState<TeacherValueableStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'trends' | 'groups' | 'patterns' | 'alerts'>('trends');
  const [refreshing, setRefreshing] = useState(false);

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 40;

  useEffect(() => {
    loadStats();
  }, [teacherId]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const teacherStats = await attendanceStatsService.getTeacherValueableStats(teacherId);
      setStats(teacherStats);
      onStatsLoad?.(teacherStats);
    } catch (error) {
      console.error('Error loading teacher stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshStats = async () => {
    try {
      setRefreshing(true);
      await memoryCache.clear(`teacher_stats_${teacherId}`);
      await loadStats();
    } catch (error) {
      console.error('Error refreshing stats:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const renderWeeklyTrends = () => {
    if (!stats?.weeklyTrends.length) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="trending-up" size={32} color="#6c757d" />
          <Text style={styles.emptyText}>No trend data available</Text>
        </View>
      );
    }

    const chartData = {
      labels: stats.weeklyTrends.map(week => week.week),
      datasets: [{
        data: stats.weeklyTrends.map(week => week.averageAttendance * 100),
        color: (opacity = 1) => `rgba(29, 116, 82, ${opacity})`,
        strokeWidth: 3
      }]
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Weekly Attendance Trends</Text>
        <LineChart
          data={chartData}
          width={chartWidth}
          height={200}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(29, 116, 82, ${opacity})`,
            style: {
              borderRadius: 16
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: '#1d7452'
            }
          }}
          bezier
          style={styles.chart}
          suffix="%"
        />
        <Text style={styles.chartSubtitle}>
          Average attendance over the last 4 weeks
        </Text>
      </View>
    );
  };

  const renderTopGroups = () => {
    if (!stats?.topPerformingGroups.length) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="people" size={32} color="#6c757d" />
          <Text style={styles.emptyText}>No group data available</Text>
        </View>
      );
    }

    return (
      <View style={styles.groupsContainer}>
        <Text style={styles.sectionTitle}>Top Performing Groups</Text>
        {stats.topPerformingGroups.map((group, index) => (
          <View key={group.groupId} style={styles.groupItem}>
            <View style={styles.groupRank}>
              <Text style={styles.rankNumber}>{index + 1}</Text>
            </View>
            <View style={styles.groupInfo}>
              <Text style={styles.groupName}>{group.groupName}</Text>
              <Text style={styles.groupStudents}>
                {group.studentCount} students
              </Text>
            </View>
            <View style={styles.groupRate}>
              <Text style={[
                styles.rateText,
                { color: group.attendanceRate >= 0.9 ? '#27ae60' : 
                         group.attendanceRate >= 0.75 ? '#f39c12' : '#e74c3c' }
              ]}>
                {Math.round(group.attendanceRate * 100)}%
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderAttendancePatterns = () => {
    if (!stats?.attendancePatterns.length) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="calendar" size={32} color="#6c757d" />
          <Text style={styles.emptyText}>No pattern data available</Text>
        </View>
      );
    }

    const chartData = {
      labels: stats.attendancePatterns.map(day => day.dayOfWeek.slice(0, 3)),
      datasets: [{
        data: stats.attendancePatterns.map(day => day.averageAttendance * 100)
      }]
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Daily Attendance Patterns</Text>
        <BarChart
          data={chartData}
          width={chartWidth}
          height={200}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(29, 116, 82, ${opacity})`,
            barPercentage: 0.7,
            style: {
              borderRadius: 16
            }
          }}
          style={styles.chart}
        />
        <Text style={styles.chartSubtitle}>
          Average attendance by day of the week
        </Text>
      </View>
    );
  };

  const renderLowAttendanceAlerts = () => {
    if (!stats?.lowAttendanceAlerts.length) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle" size={32} color="#27ae60" />
          <Text style={[styles.emptyText, { color: '#27ae60' }]}>
            No attendance concerns
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.alertsContainer}>
        <Text style={styles.sectionTitle}>Students Needing Attention</Text>
        {stats.lowAttendanceAlerts.map((alert, index) => (
          <View key={alert.studentId} style={styles.alertItem}>
            <Ionicons name="warning" size={20} color="#e74c3c" />
            <View style={styles.alertInfo}>
              <Text style={styles.alertStudentName}>{alert.studentName}</Text>
              <Text style={styles.alertDetails}>
                Missed {alert.missedDays} days · Last attended: {
                  new Date(alert.lastAttendance).toLocaleDateString()
                }
              </Text>
            </View>
            <TouchableOpacity style={styles.alertAction}>
              <Ionicons name="chevron-forward" size={16} color="#6c757d" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      {[
        { key: 'trends', label: 'Trends', icon: 'trending-up' },
        { key: 'groups', label: 'Groups', icon: 'people' },
        { key: 'patterns', label: 'Patterns', icon: 'calendar' },
        { key: 'alerts', label: 'Alerts', icon: 'warning' }
      ].map(tab => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tabItem,
            selectedView === tab.key && styles.tabItemActive
          ]}
          onPress={() => setSelectedView(tab.key as any)}
        >
          <Ionicons
            name={tab.icon as any}
            size={16}
            color={selectedView === tab.key ? '#1d7452' : '#6c757d'}
          />
          <Text style={[
            styles.tabLabel,
            selectedView === tab.key && styles.tabLabelActive
          ]}>
            {tab.label}
          </Text>
          {tab.key === 'alerts' && stats?.lowAttendanceAlerts.length > 0 && (
            <View style={styles.alertBadge}>
              <Text style={styles.alertBadgeText}>
                {stats.lowAttendanceAlerts.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderContent = () => {
    switch (selectedView) {
      case 'trends':
        return renderWeeklyTrends();
      case 'groups':
        return renderTopGroups();
      case 'patterns':
        return renderAttendancePatterns();
      case 'alerts':
        return renderLowAttendanceAlerts();
      default:
        return renderWeeklyTrends();
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingState}>
          <Ionicons name="analytics" size={32} color="#6c757d" />
          <Text style={styles.loadingText}>Loading statistics...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Attendance Insights</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={refreshStats}
          disabled={refreshing}
        >
          <Ionicons
            name="refresh"
            size={20}
            color={refreshing ? '#6c757d' : '#1d7452'}
          />
        </TouchableOpacity>
      </View>

      {renderTabBar()}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderContent()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    margin: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d4150',
  },
  refreshButton: {
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    marginHorizontal: 2,
    position: 'relative',
  },
  tabItemActive: {
    backgroundColor: '#ffffff',
  },
  tabLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 4,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#1d7452',
  },
  alertBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBadgeText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6c757d',
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6c757d',
    marginTop: 8,
    textAlign: 'center',
  },
  chartContainer: {
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d4150',
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 16,
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 8,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d4150',
    marginBottom: 16,
  },
  groupsContainer: {
    flex: 1,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  groupRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1d7452',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d4150',
    marginBottom: 2,
  },
  groupStudents: {
    fontSize: 12,
    color: '#6c757d',
  },
  groupRate: {
    alignItems: 'flex-end',
  },
  rateText: {
    fontSize: 16,
    fontWeight: '700',
  },
  alertsContainer: {
    flex: 1,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff5f5',
    borderRadius: 8,
    marginBottom: 8,
  },
  alertInfo: {
    flex: 1,
    marginLeft: 12,
  },
  alertStudentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d4150',
    marginBottom: 2,
  },
  alertDetails: {
    fontSize: 12,
    color: '#6c757d',
  },
  alertAction: {
    padding: 4,
  },
});