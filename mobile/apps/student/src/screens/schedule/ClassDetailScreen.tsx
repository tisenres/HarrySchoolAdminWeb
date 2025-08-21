/**
 * ClassDetailScreen - Comprehensive Class Session Details
 * Features attendance marking, resource access, teacher communication, and vocabulary integration
 * Age-adaptive interface with Islamic values and Uzbek cultural considerations
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
  Linking,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  SlideInUp,
  BounceIn,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useStudentStore } from '../../store/studentStore';
import { useClassDetailData } from '../../hooks/useClassDetailData';
import { useAttendance } from '../../hooks/useAttendance';
import { useSupabase } from '../../hooks/useSupabase';
import { ClassSession, ClassResource, AgeGroup } from '../../types';

type ClassDetailRouteProps = {
  ClassDetail: {
    classId: string;
    sessionDate: string;
    fromCalendar?: boolean;
  };
};

type ClassDetailRouteProp = RouteProp<ClassDetailRouteProps, 'ClassDetail'>;

const ClassDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<ClassDetailRouteProp>();
  const insets = useSafeAreaInsets();
  
  const { classId, sessionDate, fromCalendar } = route.params;
  
  // Store and data hooks
  const { student, culturalPreferences, language } = useStudentStore();
  const { 
    classDetail, 
    classResources, 
    vocabularyWords,
    isLoading, 
    error, 
    refreshClassDetail 
  } = useClassDetailData(classId, sessionDate);
  const { markAttendance, isMarkingAttendance } = useAttendance();
  const { supabase } = useSupabase();

  // State management
  const [refreshing, setRefreshing] = useState(false);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const [showVocabulary, setShowVocabulary] = useState(false);
  const [selectedResource, setSelectedResource] = useState<ClassResource | null>(null);

  // Animation values
  const fadeValue = useSharedValue(1);
  const scaleValue = useSharedValue(1);
  const attendanceScale = useSharedValue(1);

  // Age-appropriate configuration
  const ageGroup: AgeGroup = student?.age_group || 'middle';
  const isElementary = ageGroup === 'elementary';
  const isHighSchool = ageGroup === 'high';

  // Islamic greeting based on time
  const getIslamicGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Assalamu alaykum wa rahmatullahi wa barakatuh'; // Morning
    if (hour < 18) return 'Assalamu alaykum'; // Afternoon  
    return 'Assalamu alaykum wa rahmatullahi'; // Evening
  };

  // Check if attendance can be marked (within time window)
  const canMarkAttendance = useMemo(() => {
    if (!classDetail || attendanceMarked) return false;
    
    const now = new Date();
    const classStart = new Date(`${sessionDate} ${classDetail.start_time}`);
    const classEnd = new Date(`${sessionDate} ${classDetail.end_time}`);
    
    // Allow marking 15 minutes before start to 30 minutes after start
    const markingWindow = {
      start: new Date(classStart.getTime() - 15 * 60 * 1000),
      end: new Date(classStart.getTime() + 30 * 60 * 1000)
    };
    
    return now >= markingWindow.start && now <= markingWindow.end;
  }, [classDetail, sessionDate, attendanceMarked]);

  // Initialize attendance state
  useEffect(() => {
    if (classDetail?.attendance_marked) {
      setAttendanceMarked(true);
    }
  }, [classDetail]);

  // Handle attendance marking
  const handleMarkAttendance = useCallback(async () => {
    if (!canMarkAttendance || !classDetail || !student?.id) return;

    try {
      attendanceScale.value = withSpring(0.8, { duration: 100 }, () => {
        attendanceScale.value = withSpring(1.2, { duration: 200 }, () => {
          attendanceScale.value = withSpring(1, { duration: 100 });
        });
      });

      const success = await markAttendance({
        studentId: student.id,
        classId: classDetail.id,
        sessionDate,
        timestamp: new Date().toISOString(),
        location: 'mobile_app'
      });

      if (success) {
        setAttendanceMarked(true);
        
        // Show age-appropriate celebration
        const message = isElementary 
          ? '🎉 Great job! You marked your attendance!' 
          : isHighSchool 
          ? 'Attendance recorded successfully' 
          : '✅ Attendance marked! Well done!';
        
        Alert.alert(
          culturalPreferences?.showIslamicGreetings ? 'Barakallahu feeki!' : 'Success!',
          message,
          [{ text: 'OK', style: 'default' }]
        );

        // Real-time update via Supabase
        if (supabase) {
          await supabase
            .from('student_attendance')
            .insert({
              student_id: student.id,
              class_session_id: classDetail.id,
              session_date: sessionDate,
              marked_at: new Date().toISOString(),
              marked_via: 'mobile_app'
            });
        }
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      Alert.alert(
        'Error',
        'Unable to mark attendance. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  }, [canMarkAttendance, classDetail, student, sessionDate, markAttendance, attendanceScale, culturalPreferences, isElementary, isHighSchool, supabase]);

  // Handle resource download/view
  const handleResourceAccess = useCallback(async (resource: ClassResource) => {
    setSelectedResource(resource);
    
    try {
      if (resource.type === 'external_link') {
        const supported = await Linking.canOpenURL(resource.url);
        if (supported) {
          await Linking.openURL(resource.url);
        } else {
          Alert.alert('Error', 'Cannot open this link');
        }
      } else {
        // Handle file download or preview
        navigation.navigate('ResourceViewer', {
          resource,
          classTitle: classDetail?.title
        });
      }
    } catch (error) {
      console.error('Error accessing resource:', error);
      Alert.alert('Error', 'Unable to access resource');
    }
  }, [navigation, classDetail]);

  // Handle vocabulary word press
  const handleVocabularyPress = useCallback((wordId: string) => {
    navigation.navigate('VocabularyDetail', {
      wordId,
      fromClass: true,
      classContext: {
        subject: classDetail?.subject,
        date: sessionDate
      }
    });
  }, [navigation, classDetail, sessionDate]);

  // Handle teacher communication
  const handleContactTeacher = useCallback(() => {
    const greeting = culturalPreferences?.showIslamicGreetings ? getIslamicGreeting() : 'Hello';
    const message = `${greeting},\n\nI have a question about the ${classDetail?.subject} class on ${sessionDate}.\n\n`;
    
    navigation.navigate('MessageTeacher', {
      teacherId: classDetail?.teacher_id,
      prefilledMessage: message,
      classContext: {
        classId: classDetail?.id,
        subject: classDetail?.subject,
        date: sessionDate
      }
    });
  }, [navigation, classDetail, sessionDate, culturalPreferences]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshClassDetail();
    } finally {
      setRefreshing(false);
    }
  }, [refreshClassDetail]);

  // Animated styles
  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fadeValue.value,
  }));

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  const attendanceButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: attendanceScale.value }],
  }));

  if (isLoading && !classDetail) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#1d7452" />
        <Text style={[styles.loadingText, { fontSize: isElementary ? 18 : 16 }]}>
          Loading class details...
        </Text>
      </View>
    );
  }

  if (error || !classDetail) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Icon name="alert-circle" size={48} color="#e74c3c" />
        <Text style={[styles.errorText, { fontSize: isElementary ? 18 : 16 }]}>
          Unable to load class details
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
            {classDetail.subject}
          </Text>
          <Text style={[styles.headerSubtitle, { fontSize: isElementary ? 16 : 14 }]}>
            {new Date(sessionDate).toLocaleDateString(
              language === 'uzbek' ? 'uz-UZ' : language === 'russian' ? 'ru-RU' : 'en-US',
              { weekday: 'long', month: 'long', day: 'numeric' }
            )}
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.shareButton, { padding: isElementary ? 12 : 8 }]}
          onPress={() => Share.share({
            message: `${classDetail.subject} class - ${sessionDate}`,
            title: 'Class Details'
          })}
          accessibilityLabel="Share class"
        >
          <Icon name="share-variant" size={isElementary ? 28 : 24} color="#1d7452" />
        </TouchableOpacity>
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
        {/* Class Information Card */}
        <Animated.View 
          style={[styles.classInfoCard, fadeStyle]}
          entering={FadeIn.delay(100)}
        >
          <View style={styles.classInfoHeader}>
            <View style={[
              styles.subjectIcon, 
              { backgroundColor: getSubjectColor(classDetail.subject) }
            ]}>
              <Icon name={getSubjectIcon(classDetail.subject)} size={32} color="#ffffff" />
            </View>
            <View style={styles.classInfoDetails}>
              <Text style={[styles.classTitle, { fontSize: isElementary ? 22 : 20 }]}>
                {classDetail.title || `${classDetail.subject} Class`}
              </Text>
              <Text style={[styles.classTime, { fontSize: isElementary ? 18 : 16 }]}>
                {classDetail.start_time} - {classDetail.end_time}
              </Text>
              <Text style={[styles.classTeacher, { fontSize: isElementary ? 16 : 14 }]}>
                {classDetail.teacher_name}
              </Text>
            </View>
          </View>

          {classDetail.description && (
            <View style={styles.classDescription}>
              <Text style={[styles.classDescriptionText, { fontSize: isElementary ? 16 : 14 }]}>
                {classDetail.description}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Attendance Section */}
        <Animated.View 
          style={styles.attendanceCard}
          entering={SlideInUp.delay(200)}
        >
          <View style={styles.attendanceHeader}>
            <Icon name="clipboard-check" size={isElementary ? 28 : 24} color="#1d7452" />
            <Text style={[styles.attendanceTitle, { fontSize: isElementary ? 20 : 18 }]}>
              Attendance
            </Text>
          </View>

          {attendanceMarked ? (
            <View style={styles.attendanceMarked}>
              <Icon name="check-circle" size={isElementary ? 32 : 28} color="#27ae60" />
              <Text style={[styles.attendanceMarkedText, { fontSize: isElementary ? 18 : 16 }]}>
                Attendance Marked ✓
              </Text>
              <Text style={[styles.attendanceTime, { fontSize: isElementary ? 14 : 12 }]}>
                Marked at {classDetail.attendance_time || new Date().toLocaleTimeString()}
              </Text>
            </View>
          ) : (
            <View style={styles.attendanceSection}>
              <Animated.View style={attendanceButtonStyle}>
                <TouchableOpacity
                  style={[
                    styles.attendanceButton,
                    !canMarkAttendance && styles.attendanceButtonDisabled,
                    { minHeight: isElementary ? 60 : 48 }
                  ]}
                  onPress={handleMarkAttendance}
                  disabled={!canMarkAttendance || isMarkingAttendance}
                  accessibilityLabel="Mark attendance"
                >
                  {isMarkingAttendance ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Icon name="check-bold" size={isElementary ? 28 : 24} color="#ffffff" />
                  )}
                  <Text style={[styles.attendanceButtonText, { fontSize: isElementary ? 18 : 16 }]}>
                    {isMarkingAttendance ? 'Marking...' : 'Mark Attendance'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
              
              {!canMarkAttendance && (
                <Text style={[styles.attendanceNote, { fontSize: isElementary ? 14 : 12 }]}>
                  Attendance can be marked 15 minutes before class starts
                </Text>
              )}
            </View>
          )}
        </Animated.View>

        {/* Class Resources */}
        {classResources && classResources.length > 0 && (
          <Animated.View 
            style={styles.resourcesCard}
            entering={SlideInUp.delay(300)}
          >
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setShowResources(!showResources)}
              accessibilityLabel={showResources ? "Hide resources" : "Show resources"}
            >
              <View style={styles.sectionHeaderLeft}>
                <Icon name="folder-multiple" size={isElementary ? 28 : 24} color="#1d7452" />
                <Text style={[styles.sectionTitle, { fontSize: isElementary ? 20 : 18 }]}>
                  Class Resources
                </Text>
                <View style={[styles.badge, { backgroundColor: getSubjectColor(classDetail.subject) }]}>
                  <Text style={styles.badgeText}>{classResources.length}</Text>
                </View>
              </View>
              <Icon 
                name={showResources ? "chevron-up" : "chevron-down"} 
                size={isElementary ? 28 : 24} 
                color="#6c757d" 
              />
            </TouchableOpacity>

            {showResources && (
              <View style={styles.resourcesList}>
                {classResources.map((resource, index) => (
                  <TouchableOpacity
                    key={resource.id}
                    style={[styles.resourceItem, { minHeight: isElementary ? 68 : 56 }]}
                    onPress={() => handleResourceAccess(resource)}
                    accessibilityLabel={`Access ${resource.title}`}
                  >
                    <View style={styles.resourceIcon}>
                      <Icon 
                        name={getResourceIcon(resource.type)} 
                        size={isElementary ? 28 : 24} 
                        color="#1d7452" 
                      />
                    </View>
                    <View style={styles.resourceContent}>
                      <Text style={[styles.resourceTitle, { fontSize: isElementary ? 18 : 16 }]}>
                        {resource.title}
                      </Text>
                      {resource.description && (
                        <Text style={[styles.resourceDescription, { fontSize: isElementary ? 14 : 12 }]}>
                          {resource.description}
                        </Text>
                      )}
                      <Text style={[styles.resourceType, { fontSize: isElementary ? 12 : 10 }]}>
                        {resource.type.toUpperCase()} • {resource.size || 'N/A'}
                      </Text>
                    </View>
                    <Icon name="chevron-right" size={isElementary ? 24 : 20} color="#6c757d" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Animated.View>
        )}

        {/* Vocabulary Words */}
        {vocabularyWords && vocabularyWords.length > 0 && (
          <Animated.View 
            style={styles.vocabularyCard}
            entering={SlideInUp.delay(400)}
          >
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setShowVocabulary(!showVocabulary)}
              accessibilityLabel={showVocabulary ? "Hide vocabulary" : "Show vocabulary"}
            >
              <View style={styles.sectionHeaderLeft}>
                <Icon name="book-alphabet" size={isElementary ? 28 : 24} color="#1d7452" />
                <Text style={[styles.sectionTitle, { fontSize: isElementary ? 20 : 18 }]}>
                  Vocabulary
                </Text>
                <View style={[styles.badge, { backgroundColor: '#8e44ad' }]}>
                  <Text style={styles.badgeText}>{vocabularyWords.length}</Text>
                </View>
              </View>
              <Icon 
                name={showVocabulary ? "chevron-up" : "chevron-down"} 
                size={isElementary ? 28 : 24} 
                color="#6c757d" 
              />
            </TouchableOpacity>

            {showVocabulary && (
              <View style={styles.vocabularyList}>
                {vocabularyWords.slice(0, isElementary ? 5 : 8).map((word, index) => (
                  <TouchableOpacity
                    key={word.id}
                    style={[styles.vocabularyItem, { minHeight: isElementary ? 60 : 48 }]}
                    onPress={() => handleVocabularyPress(word.id)}
                    accessibilityLabel={`Learn word ${word.word_en}`}
                  >
                    <View style={styles.vocabularyContent}>
                      <Text style={[styles.vocabularyWord, { fontSize: isElementary ? 18 : 16 }]}>
                        {word.word_en}
                      </Text>
                      {word.definition_en && (
                        <Text 
                          style={[styles.vocabularyDefinition, { fontSize: isElementary ? 14 : 12 }]}
                          numberOfLines={1}
                        >
                          {word.definition_en}
                        </Text>
                      )}
                    </View>
                    <Icon name="chevron-right" size={isElementary ? 24 : 20} color="#6c757d" />
                  </TouchableOpacity>
                ))}
                
                {vocabularyWords.length > (isElementary ? 5 : 8) && (
                  <TouchableOpacity
                    style={styles.showMoreButton}
                    onPress={() => navigation.navigate('VocabularyList', {
                      classContext: {
                        classId: classDetail.id,
                        subject: classDetail.subject,
                        date: sessionDate
                      }
                    })}
                  >
                    <Text style={[styles.showMoreText, { fontSize: isElementary ? 16 : 14 }]}>
                      View All {vocabularyWords.length} Words
                    </Text>
                    <Icon name="arrow-right" size={isElementary ? 24 : 20} color="#1d7452" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </Animated.View>
        )}

        {/* Teacher Communication */}
        <Animated.View 
          style={styles.communicationCard}
          entering={BounceIn.delay(500)}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Icon name="message-text" size={isElementary ? 28 : 24} color="#1d7452" />
              <Text style={[styles.sectionTitle, { fontSize: isElementary ? 20 : 18 }]}>
                Contact Teacher
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.contactButton, { minHeight: isElementary ? 60 : 48 }]}
            onPress={handleContactTeacher}
            accessibilityLabel={`Contact ${classDetail.teacher_name}`}
          >
            <Icon name="account-tie" size={isElementary ? 28 : 24} color="#1d7452" />
            <View style={styles.contactButtonContent}>
              <Text style={[styles.contactButtonTitle, { fontSize: isElementary ? 18 : 16 }]}>
                {classDetail.teacher_name}
              </Text>
              <Text style={[styles.contactButtonSubtitle, { fontSize: isElementary ? 14 : 12 }]}>
                Send a respectful message about this class
              </Text>
            </View>
            <Icon name="chevron-right" size={isElementary ? 24 : 20} color="#6c757d" />
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
};

// Helper functions
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

const getSubjectIcon = (subject: string): string => {
  const icons: Record<string, string> = {
    'English': 'translate',
    'Math': 'calculator',
    'Science': 'flask',
    'History': 'book-open-page-variant',
    'Art': 'palette',
    'Default': 'book'
  };
  return icons[subject] || icons.Default;
};

const getResourceIcon = (type: string): string => {
  const icons: Record<string, string> = {
    'pdf': 'file-pdf-box',
    'video': 'video-box',
    'audio': 'music-box',
    'image': 'image-box',
    'document': 'file-document-box',
    'external_link': 'link-box',
    'default': 'file-box'
  };
  return icons[type] || icons.default;
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
  shareButton: {
    marginLeft: 16,
  },
  scrollContainer: {
    flex: 1,
  },
  classInfoCard: {
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
  classInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  subjectIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  classInfoDetails: {
    flex: 1,
  },
  classTitle: {
    fontWeight: '700',
    color: '#2d4150',
    marginBottom: 4,
  },
  classTime: {
    color: '#1d7452',
    fontWeight: '600',
    marginBottom: 2,
  },
  classTeacher: {
    color: '#6c757d',
    fontStyle: 'italic',
  },
  classDescription: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  classDescriptionText: {
    color: '#495057',
    lineHeight: 20,
  },
  attendanceCard: {
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
  attendanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  attendanceTitle: {
    fontWeight: '700',
    color: '#2d4150',
    marginLeft: 12,
  },
  attendanceMarked: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  attendanceMarkedText: {
    color: '#27ae60',
    fontWeight: '600',
    marginTop: 8,
  },
  attendanceTime: {
    color: '#6c757d',
    marginTop: 4,
  },
  attendanceSection: {
    alignItems: 'center',
  },
  attendanceButton: {
    backgroundColor: '#1d7452',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  attendanceButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  attendanceButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 8,
  },
  attendanceNote: {
    color: '#6c757d',
    marginTop: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  resourcesCard: {
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
  vocabularyCard: {
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
  communicationCard: {
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#2d4150',
    marginLeft: 12,
  },
  badge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  resourcesList: {
    paddingBottom: 8,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  resourceIcon: {
    marginRight: 16,
  },
  resourceContent: {
    flex: 1,
  },
  resourceTitle: {
    fontWeight: '600',
    color: '#2d4150',
    marginBottom: 2,
  },
  resourceDescription: {
    color: '#6c757d',
    marginBottom: 2,
  },
  resourceType: {
    color: '#95a5a6',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  vocabularyList: {
    paddingBottom: 8,
  },
  vocabularyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  vocabularyContent: {
    flex: 1,
  },
  vocabularyWord: {
    fontWeight: '600',
    color: '#2d4150',
    marginBottom: 2,
  },
  vocabularyDefinition: {
    color: '#6c757d',
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  showMoreText: {
    color: '#1d7452',
    fontWeight: '600',
    marginRight: 8,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  contactButtonContent: {
    flex: 1,
    marginLeft: 16,
  },
  contactButtonTitle: {
    fontWeight: '600',
    color: '#2d4150',
    marginBottom: 2,
  },
  contactButtonSubtitle: {
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

export default ClassDetailScreen;