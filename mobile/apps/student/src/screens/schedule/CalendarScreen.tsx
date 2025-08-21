/**
 * CalendarScreen - Age-Adaptive Schedule Management
 * Features Islamic calendar integration, prayer time awareness, and cultural celebrations
 * Supports three age groups with progressive complexity levels
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Calendar, CalendarList, Agenda, LocaleConfig } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  SlideInRight,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useStudentStore } from '../../store/studentStore';
import { useScheduleData } from '../../hooks/useScheduleData';
import { useIslamicCalendar } from '../../hooks/useIslamicCalendar';
import { usePrayerTimes } from '../../hooks/usePrayerTimes';
import { StudentSchedule, ClassSession, IslamicEvent, AgeGroup } from '../../types';

// Configure calendar localization
LocaleConfig.locales['uz'] = {
  monthNames: [
    'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
    'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
  ],
  monthNamesShort: ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'],
  dayNames: ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'],
  dayNamesShort: ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'],
  today: 'Bugun'
};

LocaleConfig.locales['ru'] = {
  monthNames: [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ],
  monthNamesShort: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
  dayNames: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
  dayNamesShort: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
  today: 'Сегодня'
};

interface CalendarScreenProps {
  route?: {
    params?: {
      initialDate?: string;
      view?: 'calendar' | 'agenda' | 'list';
    };
  };
}

type CalendarView = 'calendar' | 'agenda' | 'week';

const CalendarScreen: React.FC<CalendarScreenProps> = ({ route }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  // Store and data hooks
  const { student, culturalPreferences, language } = useStudentStore();
  const { 
    scheduleData, 
    todayClasses, 
    upcomingClasses, 
    isLoading, 
    error, 
    refreshSchedule 
  } = useScheduleData(student?.id);
  const { islamicDate, islamicEvents } = useIslamicCalendar();
  const { prayerTimes, nextPrayerTime } = usePrayerTimes();

  // State management
  const [selectedDate, setSelectedDate] = useState(route?.params?.initialDate || new Date().toISOString().split('T')[0]);
  const [calendarView, setCalendarView] = useState<CalendarView>(
    student?.age_group === 'elementary' ? 'week' : route?.params?.view || 'calendar'
  );
  const [refreshing, setRefreshing] = useState(false);
  const [showPrayerTimes, setShowPrayerTimes] = useState(culturalPreferences?.showPrayerTimes ?? true);

  // Animation values
  const fadeValue = useSharedValue(1);
  const slideValue = useSharedValue(0);

  // Age-appropriate configuration
  const ageGroup: AgeGroup = student?.age_group || 'middle';
  const isElementary = ageGroup === 'elementary';
  const isHighSchool = ageGroup === 'high';

  // Set locale based on student preference
  useEffect(() => {
    LocaleConfig.defaultLocale = language === 'uzbek' ? 'uz' : language === 'russian' ? 'ru' : 'en';
  }, [language]);

  // Calendar configuration based on age group
  const calendarTheme = useMemo(() => ({
    backgroundColor: '#ffffff',
    calendarBackground: '#ffffff',
    textSectionTitleColor: '#1d7452',
    selectedDayBackgroundColor: '#1d7452',
    selectedDayTextColor: '#ffffff',
    todayTextColor: '#1d7452',
    dayTextColor: '#2d4150',
    textDisabledColor: '#d9e1e8',
    dotColor: '#1d7452',
    selectedDotColor: '#ffffff',
    arrowColor: '#1d7452',
    monthTextColor: '#2d4150',
    indicatorColor: '#1d7452',
    textDayFontFamily: 'System',
    textMonthFontFamily: 'System',
    textDayHeaderFontFamily: 'System',
    textDayFontWeight: '400',
    textMonthFontWeight: '700',
    textDayHeaderFontWeight: '600',
    textDayFontSize: isElementary ? 18 : 16,
    textMonthFontSize: isElementary ? 20 : 18,
    textDayHeaderFontSize: isElementary ? 16 : 14,
    'stylesheet.calendar.header': {
      week: {
        marginTop: isElementary ? 10 : 5,
        marginBottom: isElementary ? 10 : 5,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: isElementary ? 15 : 10,
      }
    }
  }), [isElementary]);

  // Marked dates for calendar
  const markedDates = useMemo(() => {
    const marked: any = {};
    
    // Mark scheduled class days
    scheduleData?.forEach((classSession) => {
      const dateKey = classSession.date;
      if (!marked[dateKey]) {
        marked[dateKey] = { dots: [] };
      }
      
      // Add different colored dots for different class types
      const dotColor = classSession.subject === 'English' ? '#1d7452' : 
                      classSession.subject === 'Math' ? '#3498db' :
                      classSession.subject === 'Science' ? '#e74c3c' : '#f39c12';
      
      marked[dateKey].dots.push({ color: dotColor });
      marked[dateKey].markingType = 'multi-dot';
    });

    // Mark Islamic events
    islamicEvents?.forEach((event) => {
      const dateKey = event.date;
      if (!marked[dateKey]) {
        marked[dateKey] = { dots: [] };
      }
      
      marked[dateKey].dots.push({ color: '#8e44ad' });
      marked[dateKey].markingType = 'multi-dot';
    });

    // Mark selected date
    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: '#1d7452',
      };
    }

    // Mark today
    const today = new Date().toISOString().split('T')[0];
    if (today !== selectedDate) {
      marked[today] = {
        ...marked[today],
        today: true,
      };
    }

    return marked;
  }, [scheduleData, islamicEvents, selectedDate]);

  // Get classes for selected date
  const selectedDateClasses = useMemo(() => {
    return scheduleData?.filter(session => session.date === selectedDate) || [];
  }, [scheduleData, selectedDate]);

  // Handle date selection
  const handleDateSelect = useCallback((date: any) => {
    setSelectedDate(date.dateString);
    
    // Animate transition for age-appropriate feedback
    slideValue.value = withSpring(slideValue.value === 0 ? 1 : 0);
  }, [slideValue]);

  // Handle calendar view change
  const handleViewChange = useCallback((view: CalendarView) => {
    setCalendarView(view);
    fadeValue.value = withTiming(0, { duration: 150 }, () => {
      fadeValue.value = withTiming(1, { duration: 150 });
    });
  }, [fadeValue]);

  // Handle class session press
  const handleClassPress = useCallback((classSession: ClassSession) => {
    navigation.navigate('ClassDetail', { 
      classId: classSession.id,
      sessionDate: selectedDate,
      fromCalendar: true 
    });
  }, [navigation, selectedDate]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshSchedule();
    } finally {
      setRefreshing(false);
    }
  }, [refreshSchedule]);

  // Animated styles
  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fadeValue.value,
  }));

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideValue.value * 10 }],
  }));

  // Prayer time component
  const PrayerTimeIndicator = () => {
    if (!showPrayerTimes || !nextPrayerTime) return null;

    return (
      <Animated.View 
        style={[styles.prayerTimeContainer, { backgroundColor: culturalPreferences?.accentColor || '#8e44ad' }]}
        entering={FadeIn.delay(300)}
      >
        <Icon name="mosque" size={isElementary ? 24 : 20} color="#ffffff" />
        <Text style={[styles.prayerTimeText, { fontSize: isElementary ? 16 : 14 }]}>
          {nextPrayerTime.name}: {nextPrayerTime.time}
        </Text>
      </Animated.View>
    );
  };

  // Islamic date component
  const IslamicDateIndicator = () => {
    if (!culturalPreferences?.showIslamicDate) return null;

    return (
      <Animated.View 
        style={styles.islamicDateContainer}
        entering={SlideInRight.delay(200)}
      >
        <Text style={[styles.islamicDateText, { fontSize: isElementary ? 16 : 14 }]}>
          {islamicDate}
        </Text>
      </Animated.View>
    );
  };

  // View toggle buttons
  const ViewToggle = () => {
    if (isElementary) return null; // Elementary students use simple week view

    const views: { key: CalendarView; icon: string; label: string }[] = [
      { key: 'calendar', icon: 'calendar-month', label: 'Month' },
      { key: 'agenda', icon: 'format-list-bulleted', label: 'Agenda' },
      { key: 'week', icon: 'calendar-week', label: 'Week' }
    ];

    return (
      <View style={styles.viewToggleContainer}>
        {views.map((view) => (
          <TouchableOpacity
            key={view.key}
            style={[
              styles.viewToggleButton,
              calendarView === view.key && styles.viewToggleButtonActive
            ]}
            onPress={() => handleViewChange(view.key)}
            accessibilityLabel={`Switch to ${view.label} view`}
          >
            <Icon 
              name={view.icon} 
              size={isHighSchool ? 24 : 20} 
              color={calendarView === view.key ? '#ffffff' : '#1d7452'} 
            />
            {isHighSchool && (
              <Text style={[
                styles.viewToggleText,
                calendarView === view.key && styles.viewToggleTextActive
              ]}>
                {view.label}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Class session item
  const ClassSessionItem = ({ session }: { session: ClassSession }) => (
    <TouchableOpacity
      style={[
        styles.classSessionItem,
        { minHeight: isElementary ? 72 : 64 }
      ]}
      onPress={() => handleClassPress(session)}
      accessibilityLabel={`${session.subject} class at ${session.start_time}`}
    >
      <View style={[
        styles.classTimeIndicator,
        { backgroundColor: getSubjectColor(session.subject) }
      ]} />
      <View style={styles.classSessionContent}>
        <Text style={[
          styles.classSubject,
          { fontSize: isElementary ? 18 : 16 }
        ]}>
          {session.subject}
        </Text>
        <Text style={[
          styles.classTime,
          { fontSize: isElementary ? 16 : 14 }
        ]}>
          {session.start_time} - {session.end_time}
        </Text>
        <Text style={[
          styles.classTeacher,
          { fontSize: isElementary ? 14 : 12 }
        ]}>
          {session.teacher_name}
        </Text>
      </View>
      <View style={styles.classActions}>
        <Icon 
          name={session.attendance_marked ? 'check-circle' : 'clock-outline'} 
          size={isElementary ? 28 : 24} 
          color={session.attendance_marked ? '#27ae60' : '#95a5a6'} 
        />
      </View>
    </TouchableOpacity>
  );

  // Get subject color helper
  const getSubjectColor = (subject: string): string => {
    const colors: Record<string, string> = {
      'English': '#1d7452',
      'Math': '#3498db',
      'Science': '#e74c3c',
      'History': '#f39c12',
      'Art': '#9b59b6',
      'Default': '#95a5a6'
    };
    return colors[subject] || colors.Default;
  };

  if (isLoading && !scheduleData?.length) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#1d7452" />
        <Text style={styles.loadingText}>Loading your schedule...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Icon name="alert-circle" size={48} color="#e74c3c" />
        <Text style={styles.errorText}>Unable to load schedule</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header with cultural elements */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={[
            styles.headerTitle,
            { fontSize: isElementary ? 24 : 20 }
          ]}>
            Schedule
          </Text>
          <PrayerTimeIndicator />
        </View>
        <IslamicDateIndicator />
        <ViewToggle />
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
        <Animated.View style={[styles.calendarContainer, fadeStyle]}>
          {/* Calendar View */}
          {calendarView === 'calendar' && (
            <Calendar
              current={selectedDate}
              onDayPress={handleDateSelect}
              markedDates={markedDates}
              markingType="multi-dot"
              theme={calendarTheme}
              enableSwipeMonths={true}
              hideExtraDays={true}
              firstDay={1} // Monday as first day (common in Uzbekistan)
              showWeekNumbers={isHighSchool}
              accessibilityLabel="Calendar view"
            />
          )}

          {/* Agenda View */}
          {calendarView === 'agenda' && (
            <Agenda
              selected={selectedDate}
              items={{}}
              renderDay={(day, item) => <View />}
              renderItem={(item, firstItemInDay) => <View />}
              renderEmptyDate={() => <View />}
              rowHasChanged={(r1, r2) => r1.text !== r2.text}
              theme={calendarTheme}
              accessibilityLabel="Agenda view"
            />
          )}

          {/* Week View - Default for elementary */}
          {calendarView === 'week' && (
            <CalendarList
              current={selectedDate}
              onDayPress={handleDateSelect}
              markedDates={markedDates}
              markingType="multi-dot"
              theme={calendarTheme}
              horizontal={true}
              pagingEnabled={true}
              calendarWidth={320}
              accessibilityLabel="Week view"
            />
          )}
        </Animated.View>

        {/* Selected Date Classes */}
        <Animated.View style={[styles.selectedDateContainer, slideStyle]}>
          <Text style={[
            styles.selectedDateTitle,
            { fontSize: isElementary ? 20 : 18 }
          ]}>
            {new Date(selectedDate).toLocaleDateString(
              language === 'uzbek' ? 'uz-UZ' : language === 'russian' ? 'ru-RU' : 'en-US',
              { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }
            )}
          </Text>

          {selectedDateClasses.length === 0 ? (
            <View style={styles.noClassesContainer}>
              <Icon name="calendar-remove" size={48} color="#bdc3c7" />
              <Text style={[
                styles.noClassesText,
                { fontSize: isElementary ? 16 : 14 }
              ]}>
                No classes scheduled for this day
              </Text>
            </View>
          ) : (
            <View style={styles.classSessionsList}>
              {selectedDateClasses.map((session, index) => (
                <ClassSessionItem
                  key={`${session.id}-${index}`}
                  session={session}
                />
              ))}
            </View>
          )}
        </Animated.View>

        {/* Today's Quick Stats - High School Only */}
        {isHighSchool && (
          <Animated.View 
            style={styles.quickStatsContainer}
            entering={FadeIn.delay(400)}
          >
            <Text style={styles.quickStatsTitle}>Today's Overview</Text>
            <View style={styles.quickStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{todayClasses?.length || 0}</Text>
                <Text style={styles.statLabel}>Classes</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {todayClasses?.filter(c => c.attendance_marked).length || 0}
                </Text>
                <Text style={styles.statLabel}>Attended</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{upcomingClasses?.length || 0}</Text>
                <Text style={styles.statLabel}>Upcoming</Text>
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontWeight: '700',
    color: '#2d4150',
  },
  prayerTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  prayerTimeText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 6,
  },
  islamicDateContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  islamicDateText: {
    color: '#8e44ad',
    fontWeight: '500',
  },
  viewToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 4,
  },
  viewToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 48,
    justifyContent: 'center',
  },
  viewToggleButtonActive: {
    backgroundColor: '#1d7452',
  },
  viewToggleText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#1d7452',
  },
  viewToggleTextActive: {
    color: '#ffffff',
  },
  scrollContainer: {
    flex: 1,
  },
  calendarContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedDateContainer: {
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
  selectedDateTitle: {
    fontWeight: '700',
    color: '#2d4150',
    marginBottom: 16,
    textAlign: 'center',
  },
  noClassesContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noClassesText: {
    color: '#6c757d',
    marginTop: 12,
    textAlign: 'center',
  },
  classSessionsList: {
    gap: 12,
  },
  classSessionItem: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  classTimeIndicator: {
    width: 4,
  },
  classSessionContent: {
    flex: 1,
    padding: 16,
  },
  classSubject: {
    fontWeight: '700',
    color: '#2d4150',
    marginBottom: 4,
  },
  classTime: {
    color: '#6c757d',
    marginBottom: 2,
  },
  classTeacher: {
    color: '#495057',
    fontStyle: 'italic',
  },
  classActions: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  quickStatsContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 32,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickStatsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d4150',
    marginBottom: 16,
    textAlign: 'center',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
    color: '#6c757d',
    marginTop: 4,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  loadingText: {
    fontSize: 16,
    color: '#6c757d',
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
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

export default CalendarScreen;