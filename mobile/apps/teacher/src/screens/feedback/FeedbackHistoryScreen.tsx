import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp } from '@react-navigation/native';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeInRight,
  SlideInUp,
  LinearTransition,
  runOnJS,
} from 'react-native-reanimated';

// Types
interface FeedbackHistoryScreenProps {
  navigation: NavigationProp<any>;
}

interface FeedbackHistoryItem {
  id: string;
  studentId: string;
  studentName: string;
  templateId: string;
  content: string;
  voiceTranscript?: string;
  culturalScore: number;
  islamicValues: string[];
  pointImpact: number;
  language: 'uz' | 'ru' | 'en';
  timestamp: number;
  familyCommunicationSent: boolean;
  familyResponseReceived: boolean;
  status: 'sent' | 'delivered' | 'read' | 'responded';
  categoryType: 'akhlaq' | 'academic' | 'social' | 'improvement';
  completionTime: number; // Time taken to create feedback in seconds
}

interface IslamicCalendarDay {
  hijriDate: string;
  gregorianDate: Date;
  specialEvent?: string;
  prayerTimes: {
    fajr: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
  };
}

interface PerformanceMetrics {
  totalFeedbacks: number;
  averageCompletionTime: number;
  culturalAppropriatenessAverage: number;
  familyEngagementRate: number;
  islamicValuesIntegration: number;
  efficiencyTrend: 'improving' | 'stable' | 'declining';
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Mock Islamic Calendar data
const mockIslamicCalendar: IslamicCalendarDay[] = [
  {
    hijriDate: '٢٥ رمضان ١٤٤٥',
    gregorianDate: new Date('2024-04-03'),
    specialEvent: 'Рамазон',
    prayerTimes: {
      fajr: '05:20',
      dhuhr: '12:35',
      asr: '16:45',
      maghrib: '19:25',
      isha: '20:50'
    }
  },
  {
    hijriDate: '٢٤ رمضان ١٤٤٥',
    gregorianDate: new Date('2024-04-02'),
    prayerTimes: {
      fajr: '05:22',
      dhuhr: '12:34',
      asr: '16:44',
      maghrib: '19:23',
      isha: '20:48'
    }
  },
];

// Mock performance metrics
const mockPerformanceMetrics: PerformanceMetrics = {
  totalFeedbacks: 156,
  averageCompletionTime: 24, // seconds
  culturalAppropriatenessAverage: 0.91,
  familyEngagementRate: 0.78,
  islamicValuesIntegration: 0.95,
  efficiencyTrend: 'improving',
};

// Mock feedback history data
const mockFeedbackHistory: FeedbackHistoryItem[] = [
  {
    id: 'feedback-1',
    studentId: 'student-1',
    studentName: 'Азиза Каримова',
    templateId: 'akhlaq-excellent',
    content: 'Машаллоҳ! Бугун ўқувчи ажойиб ахлоқ ва адаб намойиш этди. Синфдошларига ёрдам бериш ва устозга ҳурмат билан муомала қилиш исломий тарбиянинг ғоявий намунасидир.',
    culturalScore: 0.95,
    islamicValues: ['akhlaq', 'adab', 'ihtiram'],
    pointImpact: 15,
    language: 'uz',
    timestamp: Date.now() - 1800000, // 30 minutes ago
    familyCommunicationSent: true,
    familyResponseReceived: true,
    status: 'responded',
    categoryType: 'akhlaq',
    completionTime: 18,
  },
  {
    id: 'feedback-2',
    studentId: 'student-2',
    studentName: 'Азиз Назаров',
    templateId: 'academic-progress',
    content: 'Алҳамдулиллаҳ! Ўқувчи математика фанида катта тараққиёт кўрсатди. Аллоҳ марҳамати билан янада юқори натижаларга эришади.',
    voiceTranscript: 'Бугун математика дарсида жуда яхши иш қилди',
    culturalScore: 0.89,
    islamicValues: ['ilm', 'sabr'],
    pointImpact: 12,
    language: 'uz',
    timestamp: Date.now() - 3600000, // 1 hour ago
    familyCommunicationSent: true,
    familyResponseReceived: false,
    status: 'delivered',
    categoryType: 'academic',
    completionTime: 25,
  },
  {
    id: 'feedback-3',
    studentId: 'student-3',
    studentName: 'Фатима Юсупова',
    templateId: 'social-cooperation',
    content: 'Машаллоҳ! Ўқувчи гуруҳий ишда ажойиб ҳамкорлик кўрсатди. Ҳаммани тинглаш, фикрини баҳам кўриш ва якка тартибда мулоҳаза юритиш исломий жамоа ҳаётининг асосидир.',
    culturalScore: 0.93,
    islamicValues: ['ta\'awun', 'shura', 'hikmah'],
    pointImpact: 10,
    language: 'uz',
    timestamp: Date.now() - 7200000, // 2 hours ago
    familyCommunicationSent: true,
    familyResponseReceived: false,
    status: 'read',
    categoryType: 'social',
    completionTime: 32,
  },
  {
    id: 'feedback-4',
    studentId: 'student-4',
    studentName: 'Муҳаммад Алиев',
    templateId: 'improvement-focus',
    content: 'Инша Аллоҳ, диққатни жамлашда яна ҳам яхши натижаларга эришамиз. Намоз ўқишдаги хушуъ каби, дарсларда ҳам диққатни бир нуқтага жамлаш муҳим маҳорат.',
    culturalScore: 0.87,
    islamicValues: ['sabr', 'muraqaba', 'taqwa'],
    pointImpact: 8,
    language: 'uz',
    timestamp: Date.now() - 10800000, // 3 hours ago
    familyCommunicationSent: true,
    familyResponseReceived: true,
    status: 'responded',
    categoryType: 'improvement',
    completionTime: 41,
  },
];

const FeedbackHistoryScreen: React.FC<FeedbackHistoryScreenProps> = ({ navigation }) => {
  // State management
  const [currentLanguage, setCurrentLanguage] = useState<'uz' | 'ru' | 'en'>('uz');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'akhlaq' | 'academic' | 'social' | 'improvement'>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(true);
  
  // Animation values
  const analyticsHeight = useSharedValue(showAnalytics ? 200 : 0);
  const filterTranslateX = useSharedValue(0);
  
  // Gesture for analytics panel toggle
  const analyticsGesture = Gesture.Pan()
    .activeOffsetY([-20, 20])
    .onEnd((event) => {
      if (event.translationY < -20) {
        // Swipe up - show analytics
        runOnJS(setShowAnalytics)(true);
      } else if (event.translationY > 20) {
        // Swipe down - hide analytics
        runOnJS(setShowAnalytics)(false);
      }
    });
  
  // Filter and sort feedback data
  const filteredFeedback = useMemo(() => {
    let filtered = mockFeedbackHistory;
    
    // Filter by category
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(item => item.categoryType === selectedFilter);
    }
    
    // Filter by time range
    const now = Date.now();
    switch (selectedTimeRange) {
      case 'today':
        filtered = filtered.filter(item => now - item.timestamp < 24 * 60 * 60 * 1000);
        break;
      case 'week':
        filtered = filtered.filter(item => now - item.timestamp < 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        filtered = filtered.filter(item => now - item.timestamp < 30 * 24 * 60 * 60 * 1000);
        break;
    }
    
    // Sort by timestamp (newest first)
    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }, [selectedFilter, selectedTimeRange]);
  
  // Performance analytics calculations
  const analyticsData = useMemo(() => {
    if (filteredFeedback.length === 0) return mockPerformanceMetrics;
    
    const totalFeedbacks = filteredFeedback.length;
    const averageCompletionTime = Math.round(
      filteredFeedback.reduce((sum, item) => sum + item.completionTime, 0) / totalFeedbacks
    );
    const culturalAppropriatenessAverage = 
      filteredFeedback.reduce((sum, item) => sum + item.culturalScore, 0) / totalFeedbacks;
    const familyEngagementRate = 
      filteredFeedback.filter(item => item.familyResponseReceived).length / totalFeedbacks;
    const islamicValuesIntegration = 
      filteredFeedback.filter(item => item.islamicValues.length > 0).length / totalFeedbacks;
    
    return {
      totalFeedbacks,
      averageCompletionTime,
      culturalAppropriatenessAverage,
      familyEngagementRate,
      islamicValuesIntegration,
      efficiencyTrend: averageCompletionTime < 30 ? 'improving' : 'stable' as const,
    };
  }, [filteredFeedback]);
  
  // Islamic date formatting
  const formatIslamicDate = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    
    if (date.toDateString() === today.toDateString()) {
      return `Бугун • ${date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Кеча • ${date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return `${date.toLocaleDateString('uz-UZ')} • ${date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}`;
    }
  }, []);
  
  // Status color helper
  const getStatusColor = useCallback((status: FeedbackHistoryItem['status']) => {
    switch (status) {
      case 'sent': return '#94a3b8';
      case 'delivered': return '#3b82f6';
      case 'read': return '#f59e0b';
      case 'responded': return '#22c55e';
      default: return '#6b7280';
    }
  }, []);
  
  const getStatusLabel = useCallback((status: FeedbackHistoryItem['status']) => {
    switch (status) {
      case 'sent': return 'Юборилди';
      case 'delivered': return 'Етказилди';
      case 'read': return 'Ўқилди';
      case 'responded': return 'Жавоб берилди';
      default: return 'Номаълум';
    }
  }, []);
  
  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  }, []);
  
  // Handle feedback item press
  const handleFeedbackPress = useCallback((feedback: FeedbackHistoryItem) => {
    Alert.alert(
      'Фикр-мулоҳаза тафсилотлари',
      `Талаба: ${feedback.studentName}\nВақт: ${formatIslamicDate(feedback.timestamp)}\nОчко таъсири: +${feedback.pointImpact}`,
      [
        { text: 'Ёпиш', style: 'cancel' },
        { text: 'Таҳрирлаш', onPress: () => navigation.navigate('EditFeedback', { feedbackId: feedback.id }) },
      ]
    );
  }, [formatIslamicDate, navigation]);
  
  // Animation effects
  React.useEffect(() => {
    analyticsHeight.value = withTiming(showAnalytics ? 200 : 0, { duration: 300 });
  }, [showAnalytics, analyticsHeight]);
  
  const analyticsAnimatedStyle = useAnimatedStyle(() => ({
    height: analyticsHeight.value,
    opacity: analyticsHeight.value / 200,
  }));
  
  const filterAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: filterTranslateX.value }],
  }));
  
  // Render feedback item
  const renderFeedbackItem = useCallback(({ item }: { item: FeedbackHistoryItem }) => (
    <Animated.View
      style={styles.feedbackItem}
      layout={LinearTransition}
      entering={FadeInRight}
    >
      <Pressable
        style={styles.feedbackItemContent}
        onPress={() => handleFeedbackPress(item)}
      >
        {/* F-pattern: Critical info in top-left */}
        <View style={styles.feedbackHeader}>
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{item.studentName}</Text>
            <Text style={styles.feedbackTime}>
              {formatIslamicDate(item.timestamp)}
            </Text>
          </View>
          
          <View style={styles.feedbackMeta}>
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsText}>+{item.pointImpact}</Text>
            </View>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
            </View>
          </View>
        </View>
        
        {/* Islamic Values Tags */}
        <View style={styles.islamicValuesRow}>
          {item.islamicValues.slice(0, 3).map((value, index) => (
            <Text key={index} style={styles.islamicValueTag}>
              {value}
            </Text>
          ))}
          {item.islamicValues.length > 3 && (
            <Text style={styles.islamicValueTag}>+{item.islamicValues.length - 3}</Text>
          )}
        </View>
        
        {/* Feedback Content Preview */}
        <Text style={styles.feedbackContent} numberOfLines={2}>
          {item.content}
        </Text>
        
        {/* Performance Metrics Row */}
        <View style={styles.performanceRow}>
          <View style={styles.performanceMetric}>
            <Text style={styles.metricLabel}>Маданий баҳо</Text>
            <Text style={styles.metricValue}>{Math.round(item.culturalScore * 100)}%</Text>
          </View>
          
          <View style={styles.performanceMetric}>
            <Text style={styles.metricLabel}>Тугатиш вақти</Text>
            <Text style={[
              styles.metricValue,
              item.completionTime <= 30 ? styles.metricGood : styles.metricWarning
            ]}>
              {item.completionTime}с
            </Text>
          </View>
          
          <View style={styles.performanceMetric}>
            <Text style={styles.metricLabel}>Оила алоқаси</Text>
            <Text style={styles.metricValue}>
              {item.familyCommunicationSent ? '✓' : '○'}
            </Text>
          </View>
          
          {item.voiceTranscript && (
            <View style={styles.performanceMetric}>
              <Text style={styles.voiceIndicator}>🎤</Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  ), [handleFeedbackPress, formatIslamicDate, getStatusColor, getStatusLabel]);
  
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <Animated.View style={styles.header} entering={SlideInUp}>
          <Text style={styles.headerTitle}>Фикр-мулоҳаза тарихи</Text>
          <Text style={styles.headerSubtitle}>Исломий календар билан</Text>
          
          {/* Islamic Calendar Date */}
          <View style={styles.islamicDateHeader}>
            <Text style={styles.hijriDate}>٢٥ رمضان ١٤٤٥ ھ</Text>
            <Text style={styles.gregorianDate}>
              {new Date().toLocaleDateString('uz-UZ', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          </View>
        </Animated.View>
        
        {/* Performance Analytics Panel */}
        <GestureDetector gesture={analyticsGesture}>
          <Animated.View style={[styles.analyticsPanel, analyticsAnimatedStyle]}>
            <View style={styles.analyticsPanelContent}>
              {/* Analytics Header */}
              <View style={styles.analyticsHeader}>
                <Text style={styles.analyticsTitle}>Самарадорлик кўрсаткичлари</Text>
                <Pressable 
                  style={styles.analyticsToggle}
                  onPress={() => setShowAnalytics(!showAnalytics)}
                >
                  <Text style={styles.analyticsToggleIcon}>
                    {showAnalytics ? '▼' : '▲'}
                  </Text>
                </Pressable>
              </View>
              
              {/* Metrics Grid */}
              <View style={styles.metricsGrid}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricCardValue}>{analyticsData.totalFeedbacks}</Text>
                  <Text style={styles.metricCardLabel}>Жами фикрлар</Text>
                </View>
                
                <View style={styles.metricCard}>
                  <Text style={[
                    styles.metricCardValue,
                    analyticsData.averageCompletionTime <= 30 ? styles.metricGood : styles.metricWarning
                  ]}>
                    {analyticsData.averageCompletionTime}с
                  </Text>
                  <Text style={styles.metricCardLabel}>Ўртача вақт</Text>
                </View>
                
                <View style={styles.metricCard}>
                  <Text style={styles.metricCardValue}>
                    {Math.round(analyticsData.culturalAppropriatenessAverage * 100)}%
                  </Text>
                  <Text style={styles.metricCardLabel}>Маданий мувофиқлик</Text>
                </View>
                
                <View style={styles.metricCard}>
                  <Text style={styles.metricCardValue}>
                    {Math.round(analyticsData.familyEngagementRate * 100)}%
                  </Text>
                  <Text style={styles.metricCardLabel}>Оила иштироки</Text>
                </View>
                
                <View style={styles.metricCard}>
                  <Text style={styles.metricCardValue}>
                    {Math.round(analyticsData.islamicValuesIntegration * 100)}%
                  </Text>
                  <Text style={styles.metricCardLabel}>Исломий қадриятлар</Text>
                </View>
                
                <View style={styles.metricCard}>
                  <Text style={[
                    styles.metricCardValue,
                    analyticsData.efficiencyTrend === 'improving' ? styles.metricGood : styles.metricWarning
                  ]}>
                    {analyticsData.efficiencyTrend === 'improving' ? '↗️' : '→'}
                  </Text>
                  <Text style={styles.metricCardLabel}>Тренд</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        </GestureDetector>
        
        {/* Filter Section */}
        <Animated.View style={[styles.filterSection, filterAnimatedStyle]}>
          {/* Category Filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            {[
              { key: 'all', label: 'Барча', color: '#6b7280' },
              { key: 'akhlaq', label: 'Ахлоқ', color: '#1d7452' },
              { key: 'academic', label: 'Илм', color: '#2563eb' },
              { key: 'social', label: 'Жамоавийлик', color: '#7c3aed' },
              { key: 'improvement', label: 'Ривожлантириш', color: '#f59e0b' },
            ].map((filter) => (
              <Pressable
                key={filter.key}
                style={[
                  styles.filterButton,
                  { backgroundColor: selectedFilter === filter.key ? filter.color : '#f3f4f6' },
                ]}
                onPress={() => setSelectedFilter(filter.key as any)}
              >
                <Text style={[
                  styles.filterButtonText,
                  { color: selectedFilter === filter.key ? 'white' : '#6b7280' },
                ]}>
                  {filter.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          
          {/* Time Range Filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            {[
              { key: 'today', label: 'Бугун' },
              { key: 'week', label: 'Бу ҳафта' },
              { key: 'month', label: 'Бу ой' },
              { key: 'all', label: 'Барча' },
            ].map((range) => (
              <Pressable
                key={range.key}
                style={[
                  styles.timeRangeButton,
                  selectedTimeRange === range.key && styles.selectedTimeRangeButton,
                ]}
                onPress={() => setSelectedTimeRange(range.key as any)}
              >
                <Text style={[
                  styles.timeRangeButtonText,
                  selectedTimeRange === range.key && styles.selectedTimeRangeButtonText,
                ]}>
                  {range.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>
        
        {/* Feedback History List */}
        <Animated.FlatList
          data={filteredFeedback}
          renderItem={renderFeedbackItem}
          keyExtractor={(item) => item.id}
          style={styles.feedbackList}
          contentContainerStyle={styles.feedbackListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#1d7452"
              colors={['#1d7452']}
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📝</Text>
              <Text style={styles.emptyStateTitle}>Фикр-мулоҳаза топилмади</Text>
              <Text style={styles.emptyStateDescription}>
                Танланган филтр бўйича ҳеч қандай фикр-мулоҳаза топилмади.
                Бошқа вақт оралиғини танланг ёки филтрни ўзгартиринг.
              </Text>
            </View>
          )}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={8}
          getItemLayout={(data, index) => ({
            length: 160,
            offset: 160 * index,
            index,
          })}
        />
        
        {/* Results Summary */}
        <Animated.View style={styles.resultsSummary}>
          <Text style={styles.resultsText}>
            {filteredFeedback.length} та натижа топилди
          </Text>
          {analyticsData.averageCompletionTime <= 30 && (
            <Text style={styles.efficiencyBadge}>⚡ Юқори самарадорлик</Text>
          )}
        </Animated.View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#1d7452',
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 4,
  },
  islamicDateHeader: {
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  hijriDate: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  gregorianDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  analyticsPanel: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    overflow: 'hidden',
  },
  analyticsPanelContent: {
    padding: 16,
  },
  analyticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  analyticsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  analyticsToggle: {
    padding: 4,
  },
  analyticsToggleIcon: {
    fontSize: 16,
    color: '#6b7280',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  metricCardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  metricCardLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  metricGood: {
    color: '#22c55e',
  },
  metricWarning: {
    color: '#f59e0b',
  },
  filterSection: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterRow: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  timeRangeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  selectedTimeRangeButton: {
    backgroundColor: '#1d7452',
  },
  timeRangeButtonText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  selectedTimeRangeButtonText: {
    color: 'white',
  },
  feedbackList: {
    flex: 1,
  },
  feedbackListContent: {
    padding: 16,
    paddingBottom: 100,
  },
  feedbackItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  feedbackItemContent: {
    padding: 16,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  feedbackTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  feedbackMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  pointsBadge: {
    backgroundColor: '#1d7452',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
    color: 'white',
  },
  islamicValuesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  islamicValueTag: {
    backgroundColor: '#1d7452',
    color: 'white',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: '500',
  },
  feedbackContent: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  performanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  performanceMetric: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  voiceIndicator: {
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
  resultsSummary: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultsText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  efficiencyBadge: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '600',
  },
});

export default FeedbackHistoryScreen;