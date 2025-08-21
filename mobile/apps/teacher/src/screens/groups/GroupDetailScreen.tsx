import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
  withTiming
} from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';

// Types based on UX research and architecture
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  attendanceRate: number;
  performanceScore: number;
  lastAttendance: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  parentContact: {
    name: string;
    phone: string;
    preferredLanguage: 'en' | 'ru' | 'uz';
  };
  notes: string[];
  tasks: {
    pending: number;
    completed: number;
  };
}

interface GroupDetail {
  id: string;
  name: string;
  subject: string;
  level: string;
  color: string;
  description: string;
  schedule: {
    days: string[];
    time: string;
    room: string;
  };
  teacher: {
    id: string;
    name: string;
  };
  stats: {
    totalStudents: number;
    averageAttendance: number;
    averagePerformance: number;
    totalClasses: number;
    completedClasses: number;
  };
  students: Student[];
  recentActivity: {
    type: 'attendance' | 'performance' | 'message' | 'task';
    description: string;
    timestamp: string;
  }[];
}

type TabType = 'attendance' | 'students' | 'performance' | 'messages' | 'overview';

// Tab configuration based on UX research frequency (Attendance 78%, Performance, Communication)
const TABS: { key: TabType; label: string; icon: string; priority: number }[] = [
  { key: 'attendance', label: 'Attendance', icon: 'checkmark-circle', priority: 1 },
  { key: 'students', label: 'Students', icon: 'people', priority: 2 },
  { key: 'performance', label: 'Performance', icon: 'trending-up', priority: 3 },
  { key: 'messages', label: 'Messages', icon: 'mail', priority: 4 },
  { key: 'overview', label: 'Overview', icon: 'analytics', priority: 5 }
];

interface GroupDetailScreenProps {
  route: {
    params: {
      groupId: string;
    };
  };
}

export const GroupDetailScreen: React.FC<GroupDetailScreenProps> = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { groupId } = route.params as { groupId: string };
  const { width: screenWidth } = Dimensions.get('window');

  // State management
  const [groupDetail, setGroupDetail] = useState<GroupDetail | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('attendance');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

  // Animation values
  const tabIndicatorPosition = useSharedValue(0);
  const headerHeight = useSharedValue(200);

  // Load group detail data
  const loadGroupDetail = useCallback(async () => {
    try {
      setLoading(true);
      
      // Mock data - replace with actual API call
      const mockGroupDetail: GroupDetail = {
        id: groupId,
        name: 'Beginner English A1',
        subject: 'English',
        level: 'A1',
        color: '#1d7452',
        description: 'Foundation English course for beginners with focus on basic communication skills and grammar fundamentals.',
        schedule: {
          days: ['Mon', 'Wed', 'Fri'],
          time: '09:00 - 10:30',
          room: 'Room 101'
        },
        teacher: {
          id: 'teacher1',
          name: 'Gulnara Karimova'
        },
        stats: {
          totalStudents: 18,
          averageAttendance: 0.89,
          averagePerformance: 78.5,
          totalClasses: 45,
          completedClasses: 32
        },
        students: [
          {
            id: '1',
            firstName: 'Aziza',
            lastName: 'Yusupova',
            attendanceRate: 0.95,
            performanceScore: 85,
            lastAttendance: '2024-01-15',
            status: 'present',
            parentContact: {
              name: 'Dilnoza Yusupova',
              phone: '+998901234567',
              preferredLanguage: 'uz'
            },
            notes: ['Excellent progress in speaking', 'Needs more writing practice'],
            tasks: { pending: 2, completed: 15 }
          },
          {
            id: '2',
            firstName: 'Bobur',
            lastName: 'Karimov',
            attendanceRate: 0.78,
            performanceScore: 72,
            lastAttendance: '2024-01-13',
            status: 'absent',
            parentContact: {
              name: 'Sevara Karimova',
              phone: '+998907654321',
              preferredLanguage: 'ru'
            },
            notes: ['Struggles with grammar', 'Very active in speaking exercises'],
            tasks: { pending: 5, completed: 12 }
          },
          {
            id: '3',
            firstName: 'Malika',
            lastName: 'Rustamova',
            attendanceRate: 0.92,
            performanceScore: 88,
            lastAttendance: '2024-01-15',
            status: 'present',
            parentContact: {
              name: 'Nodira Rustamova',
              phone: '+998901122334',
              preferredLanguage: 'en'
            },
            notes: ['Top performer', 'Ready for next level'],
            tasks: { pending: 1, completed: 18 }
          }
        ],
        recentActivity: [
          {
            type: 'attendance',
            description: 'Marked attendance for today\'s class',
            timestamp: '2024-01-15T09:00:00Z'
          },
          {
            type: 'performance',
            description: 'Updated quiz scores for Unit 3',
            timestamp: '2024-01-14T15:30:00Z'
          },
          {
            type: 'message',
            description: 'Sent homework reminder to parents',
            timestamp: '2024-01-14T18:00:00Z'
          }
        ]
      };

      setGroupDetail(mockGroupDetail);
    } catch (error) {
      console.error('Error loading group detail:', error);
      Alert.alert('Error', 'Failed to load group details');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadGroupDetail();
  }, [loadGroupDetail]);

  // Tab change handler with animation
  const changeTab = (tab: TabType, index: number) => {
    setActiveTab(tab);
    const tabWidth = screenWidth / TABS.length;
    tabIndicatorPosition.value = withSpring(index * tabWidth);
  };

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadGroupDetail();
    setRefreshing(false);
  }, [loadGroupDetail]);

  // Student selection handlers
  const toggleStudentSelection = (studentId: string) => {
    const newSelection = new Set(selectedStudents);
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId);
    } else {
      newSelection.add(studentId);
    }
    setSelectedStudents(newSelection);
  };

  // Quick actions
  const markAllPresent = () => {
    Alert.alert(
      'Mark All Present',
      'Mark all students as present for today?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark Present', onPress: () => console.log('Mark all present') }
      ]
    );
  };

  const sendGroupMessage = () => {
    navigation.navigate('ComposeMessage' as never, { 
      groupId: groupDetail?.id,
      recipients: 'group'
    } as never);
  };

  // Animation styles
  const tabIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tabIndicatorPosition.value }]
  }));

  // Render methods for each tab
  const renderAttendanceTab = () => {
    if (!groupDetail) return null;

    return (
      <View style={styles.tabContent}>
        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity style={styles.primaryAction} onPress={markAllPresent}>
            <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
            <Text style={styles.primaryActionText}>Mark All Present</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryAction} onPress={() => {}}>
            <Ionicons name="list" size={18} color="#1d7452" />
            <Text style={styles.secondaryActionText}>Take Attendance</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Attendance Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Today's Attendance</Text>
            <Text style={styles.summaryDate}>
              {new Date().toLocaleDateString()}
            </Text>
          </View>
          
          <View style={styles.attendanceStats}>
            <View style={styles.statItem}>
              <View style={[styles.statDot, { backgroundColor: '#059669' }]} />
              <Text style={styles.statLabel}>Present</Text>
              <Text style={styles.statValue}>16</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statDot, { backgroundColor: '#dc2626' }]} />
              <Text style={styles.statLabel}>Absent</Text>
              <Text style={styles.statValue}>2</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statDot, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.statLabel}>Late</Text>
              <Text style={styles.statValue}>0</Text>
            </View>
          </View>
        </View>

        {/* Student List with Attendance Status */}
        <FlatList
          data={groupDetail.students}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.studentAttendanceItem}>
              <View style={styles.studentInfo}>
                <View style={styles.studentAvatar}>
                  <Text style={styles.studentInitials}>
                    {item.firstName[0]}{item.lastName[0]}
                  </Text>
                </View>
                <View>
                  <Text style={styles.studentName}>
                    {item.firstName} {item.lastName}
                  </Text>
                  <Text style={styles.studentRate}>
                    Attendance: {Math.round(item.attendanceRate * 100)}%
                  </Text>
                </View>
              </View>
              
              <View style={styles.attendanceActions}>
                <TouchableOpacity 
                  style={[
                    styles.statusButton,
                    item.status === 'present' && styles.statusButtonActive
                  ]}
                  onPress={() => {}}
                >
                  <Ionicons 
                    name="checkmark" 
                    size={16} 
                    color={item.status === 'present' ? '#ffffff' : '#059669'} 
                  />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.statusButton,
                    item.status === 'absent' && styles.statusButtonActive
                  ]}
                  onPress={() => {}}
                >
                  <Ionicons 
                    name="close" 
                    size={16} 
                    color={item.status === 'absent' ? '#ffffff' : '#dc2626'} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}
          scrollEnabled={false}
        />
      </View>
    );
  };

  const renderStudentsTab = () => {
    if (!groupDetail) return null;

    return (
      <View style={styles.tabContent}>
        <FlatList
          data={groupDetail.students}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.studentCard}
              onPress={() => navigation.navigate('StudentProfile' as never, { 
                studentId: item.id 
              } as never)}
            >
              <View style={styles.studentCardHeader}>
                <View style={styles.studentAvatar}>
                  <Text style={styles.studentInitials}>
                    {item.firstName[0]}{item.lastName[0]}
                  </Text>
                </View>
                <View style={styles.studentCardInfo}>
                  <Text style={styles.studentCardName}>
                    {item.firstName} {item.lastName}
                  </Text>
                  <Text style={styles.studentCardDetails}>
                    Attendance: {Math.round(item.attendanceRate * 100)}% • 
                    Performance: {item.performanceScore}%
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </View>
              
              <View style={styles.studentCardStats}>
                <View style={styles.studentStat}>
                  <Text style={styles.studentStatLabel}>Tasks</Text>
                  <Text style={styles.studentStatValue}>
                    {item.tasks.pending} pending
                  </Text>
                </View>
                <View style={styles.studentStat}>
                  <Text style={styles.studentStatLabel}>Last Seen</Text>
                  <Text style={styles.studentStatValue}>
                    {new Date(item.lastAttendance).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          scrollEnabled={false}
        />
      </View>
    );
  };

  const renderPerformanceTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.performanceSummary}>
        <Text style={styles.sectionTitle}>Group Performance</Text>
        <View style={styles.performanceGrid}>
          <View style={styles.performanceCard}>
            <Text style={styles.performanceValue}>78.5%</Text>
            <Text style={styles.performanceLabel}>Average Score</Text>
          </View>
          <View style={styles.performanceCard}>
            <Text style={styles.performanceValue}>32/45</Text>
            <Text style={styles.performanceLabel}>Classes Complete</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderMessagesTab = () => (
    <View style={styles.tabContent}>
      <TouchableOpacity style={styles.composeButton} onPress={sendGroupMessage}>
        <Ionicons name="add" size={20} color="#ffffff" />
        <Text style={styles.composeButtonText}>Send Group Message</Text>
      </TouchableOpacity>
      
      <Text style={styles.sectionTitle}>Recent Messages</Text>
      <View style={styles.emptyMessages}>
        <Ionicons name="mail-outline" size={48} color="#d1d5db" />
        <Text style={styles.emptyText}>No messages yet</Text>
      </View>
    </View>
  );

  const renderOverviewTab = () => {
    if (!groupDetail) return null;

    return (
      <View style={styles.tabContent}>
        <View style={styles.overviewGrid}>
          <View style={styles.overviewCard}>
            <Ionicons name="people" size={24} color="#1d7452" />
            <Text style={styles.overviewValue}>{groupDetail.stats.totalStudents}</Text>
            <Text style={styles.overviewLabel}>Students</Text>
          </View>
          
          <View style={styles.overviewCard}>
            <Ionicons name="calendar" size={24} color="#2563eb" />
            <Text style={styles.overviewValue}>
              {groupDetail.stats.completedClasses}/{groupDetail.stats.totalClasses}
            </Text>
            <Text style={styles.overviewLabel}>Classes</Text>
          </View>
          
          <View style={styles.overviewCard}>
            <Ionicons name="checkmark-circle" size={24} color="#059669" />
            <Text style={styles.overviewValue}>
              {Math.round(groupDetail.stats.averageAttendance * 100)}%
            </Text>
            <Text style={styles.overviewLabel}>Attendance</Text>
          </View>
          
          <View style={styles.overviewCard}>
            <Ionicons name="trending-up" size={24} color="#7c3aed" />
            <Text style={styles.overviewValue}>
              {groupDetail.stats.averagePerformance}%
            </Text>
            <Text style={styles.overviewLabel}>Performance</Text>
          </View>
        </View>

        <View style={styles.scheduleCard}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          <View style={styles.scheduleInfo}>
            <View style={styles.scheduleItem}>
              <Ionicons name="calendar" size={16} color="#6b7280" />
              <Text style={styles.scheduleText}>
                {groupDetail.schedule.days.join(', ')}
              </Text>
            </View>
            <View style={styles.scheduleItem}>
              <Ionicons name="time" size={16} color="#6b7280" />
              <Text style={styles.scheduleText}>
                {groupDetail.schedule.time}
              </Text>
            </View>
            <View style={styles.scheduleItem}>
              <Ionicons name="location" size={16} color="#6b7280" />
              <Text style={styles.scheduleText}>
                {groupDetail.schedule.room}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'attendance':
        return renderAttendanceTab();
      case 'students':
        return renderStudentsTab();
      case 'performance':
        return renderPerformanceTab();
      case 'messages':
        return renderMessagesTab();
      case 'overview':
        return renderOverviewTab();
      default:
        return renderAttendanceTab();
    }
  };

  if (loading || !groupDetail) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading group details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: groupDetail.color }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerActionButton}>
              <Ionicons name="settings" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{groupDetail.name}</Text>
          <Text style={styles.headerSubtitle}>
            {groupDetail.subject} • {groupDetail.level}
          </Text>
          <Text style={styles.headerDescription}>
            {groupDetail.description}
          </Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {TABS.map((tab, index) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && styles.activeTab
              ]}
              onPress={() => changeTab(tab.key, index)}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={16} 
                color={activeTab === tab.key ? '#1d7452' : '#6b7280'} 
              />
              <Text style={[
                styles.tabText,
                activeTab === tab.key && styles.activeTabText
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <Animated.View style={[styles.tabIndicator, tabIndicatorStyle]} />
      </View>

      {/* Tab Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[groupDetail.color]}
            tintColor={groupDetail.color}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderTabContent()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  headerDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 16,
  },
  tabContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    position: 'relative',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  activeTab: {
    backgroundColor: 'rgba(29, 116, 82, 0.05)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#1d7452',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    backgroundColor: '#1d7452',
    width: 40,
    marginLeft: 16,
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  primaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1d7452',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#1d7452',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  secondaryActionText: {
    color: '#1d7452',
    fontSize: 14,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  summaryDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  attendanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  studentAttendanceItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1d7452',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentInitials: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  studentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  studentRate: {
    fontSize: 12,
    color: '#6b7280',
  },
  attendanceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statusButtonActive: {
    backgroundColor: '#1d7452',
    borderColor: '#1d7452',
  },
  studentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  studentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentCardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  studentCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  studentCardDetails: {
    fontSize: 12,
    color: '#6b7280',
  },
  studentCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  studentStat: {
    flex: 1,
  },
  studentStatLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 2,
  },
  studentStatValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1f2937',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  performanceSummary: {
    marginBottom: 20,
  },
  performanceGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  performanceCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  performanceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  performanceLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  composeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1d7452',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  composeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyMessages: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 12,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  overviewCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  overviewValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginVertical: 8,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  scheduleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  scheduleInfo: {
    gap: 12,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scheduleText: {
    fontSize: 14,
    color: '#1f2937',
  },
});