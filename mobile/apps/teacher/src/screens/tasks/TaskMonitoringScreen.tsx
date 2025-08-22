import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Animated,
  StyleSheet,
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Internal imports
import { useTaskSubmissions } from '../../hooks/useTaskSubmissions';
import { useIslamicCalendar } from '../../hooks/useIslamicCalendar';
import { TaskSubmissionCard } from '../../components/tasks/TaskSubmissionCard';
import { ProgressAnalyticsDashboard } from '../../components/tasks/ProgressAnalyticsDashboard';
import { CulturalInsightsPanel } from '../../components/tasks/CulturalInsightsPanel';
import { StudentProgressFilters } from '../../components/tasks/StudentProgressFilters';
import { RealTimeSubmissionIndicator } from '../../components/ui/RealTimeSubmissionIndicator';
import { IslamicProgressVisualizer } from '../../components/ui/IslamicProgressVisualizer';

interface TaskMonitoringData {
  taskId: string;
  title: string;
  dueDate: Date;
  totalStudents: number;
  submissions: Array<{
    id: string;
    studentId: string;
    studentName: string;
    status: 'submitted' | 'late' | 'pending' | 'graded' | 'returned';
    submittedAt: Date | null;
    score: number | null;
    culturalAppropriateness: number;
    islamicValuesAlignment: number;
    teacherComments: string;
    culturalContext: {
      languageUsed: string;
      culturalReferences: string[];
      islamicValues: string[];
      appropriatenessScore: number;
    };
    aiAnalysis: {
      contentQuality: number;
      learningObjectivesAlignment: number;
      culturalSensitivity: number;
      factualAccuracy: number;
      recommendations: string[];
    };
  }>;
  analytics: {
    submissionRate: number;
    averageScore: number;
    culturalAppropriatenessAverage: number;
    islamicValuesComplianceRate: number;
    onTimeSubmissionRate: number;
    languageDistribution: { [key: string]: number };
    commonChallenges: string[];
    improvementSuggestions: string[];
  };
  culturalInsights: {
    mostUsedIslamicValues: Array<{ value: string; count: number }>;
    culturalAdaptationSuccess: number;
    languagePreferenceAlignment: number;
    familyEngagementLevel: number;
  };
}

interface TaskMonitoringScreenProps {
  navigation: any;
  route: {
    params: {
      taskId: string;
    };
  };
}

const { width: screenWidth } = Dimensions.get('window');

const TaskMonitoringScreen: React.FC<TaskMonitoringScreenProps> = ({ navigation, route }) => {
  const { taskId } = route.params;

  // Component state
  const [activeTab, setActiveTab] = useState<'overview' | 'submissions' | 'analytics' | 'cultural'>('overview');
  const [filterStatus, setFilterStatus] = useState<'all' | 'submitted' | 'pending' | 'late' | 'graded'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'score' | 'date' | 'cultural'>('date');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);

  // Hooks
  const {
    taskData,
    submissions,
    analytics,
    loading,
    error,
    refreshData,
    gradeSubmission,
    provideFeedback,
    returnForRevision,
  } = useTaskSubmissions(taskId);

  const {
    currentIslamicDate,
    prayerTimes,
    getIslamicCalendarContext,
  } = useIslamicCalendar();

  // Animation refs
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Initialize component with Islamic awareness
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshData]);

  // Filter submissions based on current filters
  const filteredSubmissions = useCallback(() => {
    if (!submissions) return [];

    let filtered = submissions;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(submission => submission.status === filterStatus);
    }

    // Sort submissions
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.studentName.localeCompare(b.studentName);
        case 'score':
          return (b.score || 0) - (a.score || 0);
        case 'date':
          return (b.submittedAt?.getTime() || 0) - (a.submittedAt?.getTime() || 0);
        case 'cultural':
          return b.culturalAppropriateness - a.culturalAppropriateness;
        default:
          return 0;
      }
    });

    return filtered;
  }, [submissions, filterStatus, sortBy]);

  // Handle grading with cultural considerations
  const handleGradeSubmission = useCallback(async (
    submissionId: string,
    score: number,
    feedback: string,
    culturalNotes?: string
  ) => {
    try {
      await gradeSubmission({
        submissionId,
        score,
        feedback,
        culturalConsiderations: culturalNotes,
        islamicValuesAlignment: true,
        gradedAt: new Date().toISOString(),
        teacherId: 'current_teacher', // Will be filled with actual teacher ID
      });

      Alert.alert(
        'Baholash amalga oshirildi',
        'Talaba baholash natijasini ko\'radi',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Grading error:', error);
      Alert.alert('Xatolik', 'Baholashda xatolik yuz berdi');
    }
  }, [gradeSubmission]);

  // Handle feedback provision
  const handleProvideFeedback = useCallback(async (
    submissionId: string,
    feedback: string,
    culturalSuggestions: string[]
  ) => {
    try {
      await provideFeedback({
        submissionId,
        feedback,
        culturalSuggestions,
        islamicGuidance: feedback.includes('islamic') || feedback.includes('islom'),
        feedbackType: 'constructive',
        languagePreference: 'uz',
      });

      Alert.alert(
        'Fikr-mulohaza yuborildi',
        'Talaba sizning sharhlaringizni ko\'radi',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Feedback error:', error);
      Alert.alert('Xatolik', 'Fikr-mulohaza yuborishda xatolik');
    }
  }, [provideFeedback]);

  // Render overview tab
  const renderOverview = () => (
    <ScrollView style={styles.tabContent} refreshControl={
      <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
    }>
      {/* Task Status Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>{taskData?.title}</Text>
        <Text style={styles.summarySubtitle}>
          {currentIslamicDate} • Muddati: {taskData?.dueDate ? new Date(taskData.dueDate).toLocaleDateString() : 'Belgilanmagan'}
        </Text>

        {/* Progress Ring with Islamic Pattern */}
        <IslamicProgressVisualizer
          progress={analytics?.submissionRate || 0}
          total={taskData?.totalStudents || 0}
          culturalPattern="geometric"
          showBlessings={true}
        />

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{submissions?.length || 0}</Text>
            <Text style={styles.statLabel}>Topshirdi</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {Math.round((analytics?.averageScore || 0))}%
            </Text>
            <Text style={styles.statLabel}>O'rtacha ball</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {Math.round((analytics?.culturalAppropriatenessAverage || 0) * 100)}%
            </Text>
            <Text style={styles.statLabel}>Madaniy moslik</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {Math.round((analytics?.islamicValuesComplianceRate || 0) * 100)}%
            </Text>
            <Text style={styles.statLabel}>Islomiy qiymatlar</Text>
          </View>
        </View>
      </View>

      {/* Recent Submissions */}
      <View style={styles.recentSubmissions}>
        <Text style={styles.sectionTitle}>So'nggi topshiriqlar</Text>
        {filteredSubmissions()
          .slice(0, 3)
          .map((submission) => (
            <TaskSubmissionCard
              key={submission.id}
              submission={submission}
              onGrade={(score, feedback, cultural) => 
                handleGradeSubmission(submission.id, score, feedback, cultural)
              }
              onProvideFeedback={(feedback, suggestions) => 
                handleProvideFeedback(submission.id, feedback, suggestions)
              }
              showCulturalInsights={true}
              islamicContext={true}
            />
          ))}
      </View>
    </ScrollView>
  );

  // Render submissions tab
  const renderSubmissions = () => (
    <View style={styles.tabContent}>
      {/* Filters */}
      <StudentProgressFilters
        filterStatus={filterStatus}
        sortBy={sortBy}
        onFilterChange={setFilterStatus}
        onSortChange={setSortBy}
        culturalFiltersEnabled={true}
        islamicValuesFilter={true}
      />

      {/* Submissions List */}
      <FlatList
        data={filteredSubmissions()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskSubmissionCard
            submission={item}
            onGrade={(score, feedback, cultural) => 
              handleGradeSubmission(item.id, score, feedback, cultural)
            }
            onProvideFeedback={(feedback, suggestions) => 
              handleProvideFeedback(item.id, feedback, suggestions)
            }
            showCulturalInsights={true}
            islamicContext={true}
            expanded={selectedSubmission === item.id}
            onToggleExpansion={() => 
              setSelectedSubmission(prev => prev === item.id ? null : item.id)
            }
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.submissionsList}
      />
    </View>
  );

  // Render analytics tab
  const renderAnalytics = () => (
    <ScrollView style={styles.tabContent} refreshControl={
      <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
    }>
      <ProgressAnalyticsDashboard
        analytics={analytics}
        submissions={submissions || []}
        taskData={taskData}
        culturalInsights={{
          languageDistribution: analytics?.languageDistribution || {},
          islamicValuesUsage: taskData?.culturalInsights?.mostUsedIslamicValues || [],
          culturalAdaptationSuccess: taskData?.culturalInsights?.culturalAdaptationSuccess || 0,
        }}
        showCulturalMetrics={true}
        islamicCalendarContext={getIslamicCalendarContext()}
      />
    </ScrollView>
  );

  // Render cultural insights tab
  const renderCulturalInsights = () => (
    <ScrollView style={styles.tabContent} refreshControl={
      <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
    }>
      {taskData?.culturalInsights && (
        <CulturalInsightsPanel
          insights={taskData.culturalInsights}
          submissions={submissions || []}
          analytics={analytics}
          onInsightAction={(action, data) => {
            switch (action) {
              case 'adjust_cultural_sensitivity':
                // Handle cultural sensitivity adjustment
                console.log('Adjusting cultural sensitivity:', data);
                break;
              case 'provide_islamic_guidance':
                // Handle Islamic guidance provision
                console.log('Providing Islamic guidance:', data);
                break;
              case 'language_support':
                // Handle language support provision
                console.log('Providing language support:', data);
                break;
            }
          }}
          islamicValuesFramework={true}
          uzbekistanContext={true}
        />
      )}
    </ScrollView>
  );

  if (loading && !taskData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="analytics" size={48} color="#1d7452" />
          <Text style={styles.loadingText}>Monitoring ma'lumotlari yuklanmoqda...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#dc2626" />
          <Text style={styles.errorText}>Ma'lumotlarni yuklashda xatolik</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Qaytadan urinish</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Islamic Calendar */}
      <LinearGradient
        colors={['#1d7452', '#2d8f5f']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Vazifa kuzatuvi</Text>
            <Text style={styles.headerSubtitle}>
              {currentIslamicDate} • {prayerTimes?.current?.name}
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={handleRefresh}
          >
            <Ionicons 
              name="refresh" 
              size={24} 
              color="white"
              style={refreshing && { opacity: 0.5 }}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Real-time Submission Indicator */}
      <RealTimeSubmissionIndicator
        taskId={taskId}
        onNewSubmission={(submission) => {
          // Handle new submission notification
          Alert.alert(
            'Yangi topshiriq',
            `${submission.studentName} vazifasini topshirdi`,
            [{ text: 'Ko\'rish', onPress: () => setActiveTab('submissions') }]
          );
        }}
      />

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        {[
          { key: 'overview', label: 'Umumiy', icon: 'speedometer' },
          { key: 'submissions', label: 'Topshiriqlar', icon: 'documents' },
          { key: 'analytics', label: 'Tahlil', icon: 'analytics' },
          { key: 'cultural', label: 'Madaniyat', icon: 'globe' },
        ].map(({ key, label, icon }) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.tabButton,
              activeTab === key && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab(key as any)}
          >
            <Ionicons
              name={icon as any}
              size={20}
              color={activeTab === key ? '#1d7452' : '#666'}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === key && styles.activeTabButtonText,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'submissions' && renderSubmissions()}
        {activeTab === 'analytics' && renderAnalytics()}
        {activeTab === 'cultural' && renderCulturalInsights()}
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#1d7452',
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#1d7452',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
    color: '#666',
  },
  activeTabButtonText: {
    color: '#1d7452',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1d7452',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  recentSubmissions: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  submissionsList: {
    paddingVertical: 8,
  },
});

export default TaskMonitoringScreen;