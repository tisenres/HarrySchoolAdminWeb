import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

// Internal imports
import { useStudentGroups } from '../../hooks/useStudentGroups';
import { useIslamicCalendar } from '../../hooks/useIslamicCalendar';
import { StudentGroupSelector } from '../../components/tasks/StudentGroupSelector';
import { IslamicCalendarIntegration } from '../../components/ui/IslamicCalendarIntegration';
import { AssignmentOptionsPanel } from '../../components/tasks/AssignmentOptionsPanel';
import { IndividualStudentSelector } from '../../components/tasks/IndividualStudentSelector';
import { CulturalConsiderationPanel } from '../../components/tasks/CulturalConsiderationPanel';
import { ParentNotificationSettings } from '../../components/tasks/ParentNotificationSettings';

interface AssignmentOptions {
  // Core assignment settings
  assignmentType: 'individual' | 'group' | 'mixed';
  targetGroups: string[];
  targetStudents: string[];
  
  // Timing and scheduling
  dueDate: Date | null;
  allowLateSubmissions: boolean;
  submissionWindow: {
    startDate: Date;
    endDate: Date;
  };
  
  // Islamic and cultural considerations
  prayerTimeAwareness: boolean;
  islamicHolidayConsideration: boolean;
  culturalSensitivityLevel: 1 | 2 | 3 | 4 | 5;
  languagePreference: 'en' | 'uz' | 'ru' | 'ar';
  
  // Collaboration and workflow
  allowPeerReview: boolean;
  enableTeacherComments: boolean;
  requireParentSignature: boolean;
  
  // Assessment and grading
  gradingRubric: string | null;
  pointsTotal: number;
  passingThreshold: number;
  culturalBonusPoints: number;
  
  // Notifications and communication
  parentNotifications: {
    onAssignment: boolean;
    onSubmission: boolean;
    onGrading: boolean;
    onLateSubmission: boolean;
    culturallyAppropriateTiming: boolean;
  };
  
  // Privacy and compliance
  dataRetentionPeriod: number; // days
  allowDataExport: boolean;
  complianceLevel: 'standard' | 'enhanced' | 'maximum';
}

interface TaskAssignmentScreenProps {
  navigation: any;
  route: {
    params: {
      taskData: any;
      returnToTasks?: boolean;
    };
  };
}

const { width: screenWidth } = Dimensions.get('window');

const TaskAssignmentScreen: React.FC<TaskAssignmentScreenProps> = ({ navigation, route }) => {
  const { taskData } = route.params;
  
  // Assignment configuration state
  const [assignmentOptions, setAssignmentOptions] = useState<AssignmentOptions>({
    assignmentType: 'individual',
    targetGroups: [],
    targetStudents: [],
    dueDate: null,
    allowLateSubmissions: true,
    submissionWindow: {
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week default
    },
    prayerTimeAwareness: true,
    islamicHolidayConsideration: true,
    culturalSensitivityLevel: 4,
    languagePreference: 'uz',
    allowPeerReview: false,
    enableTeacherComments: true,
    requireParentSignature: false,
    gradingRubric: null,
    pointsTotal: 100,
    passingThreshold: 70,
    culturalBonusPoints: 10,
    parentNotifications: {
      onAssignment: true,
      onSubmission: true,
      onGrading: true,
      onLateSubmission: true,
      culturallyAppropriateTiming: true,
    },
    dataRetentionPeriod: 365,
    allowDataExport: true,
    complianceLevel: 'enhanced',
  });

  // UI state
  const [activeSection, setActiveSection] = useState<'targets' | 'timing' | 'cultural' | 'assessment' | 'notifications'>('targets');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  // Hooks
  const { 
    studentGroups, 
    individualStudents, 
    getGroupStudents,
    loading: groupsLoading 
  } = useStudentGroups();
  
  const {
    currentIslamicDate,
    prayerTimes,
    islamicHolidays,
    getIslamicCalendarContext,
    isIslamicHoliday,
    getNextPrayerTime,
  } = useIslamicCalendar();

  // Animation refs
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Initialize component with Islamic awareness
  useEffect(() => {
    // Entrance animation
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Set culturally appropriate default due date
    const now = new Date();
    const defaultDueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Avoid Islamic holidays for due dates
    if (isIslamicHoliday(defaultDueDate)) {
      const adjustedDate = new Date(defaultDueDate.getTime() + 3 * 24 * 60 * 60 * 1000);
      setAssignmentOptions(prev => ({
        ...prev,
        dueDate: adjustedDate,
        submissionWindow: {
          ...prev.submissionWindow,
          endDate: adjustedDate,
        },
      }));
    } else {
      setAssignmentOptions(prev => ({
        ...prev,
        dueDate: defaultDueDate,
      }));
    }
  }, [isIslamicHoliday]);

  // Handle assignment type changes
  const handleAssignmentTypeChange = useCallback((type: 'individual' | 'group' | 'mixed') => {
    setAssignmentOptions(prev => ({
      ...prev,
      assignmentType: type,
      // Reset selections when changing type
      targetGroups: type === 'individual' ? [] : prev.targetGroups,
      targetStudents: type === 'group' ? [] : prev.targetStudents,
    }));
  }, []);

  // Handle due date selection with Islamic calendar awareness
  const handleDueDateChange = useCallback((event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    
    if (selectedDate) {
      // Check if selected date conflicts with Islamic holidays or prayer times
      if (isIslamicHoliday(selectedDate)) {
        Alert.alert(
          'Islomiy bayram',
          'Tanlangan sana islomiy bayramga to\'g\'ri keladi. Boshqa sana tanlaysizmi?',
          [
            { 
              text: 'Boshqa sana', 
              onPress: () => setShowDatePicker(true) 
            },
            { 
              text: 'Davom etish', 
              onPress: () => setAssignmentOptions(prev => ({ ...prev, dueDate: selectedDate }))
            },
          ]
        );
        return;
      }

      setAssignmentOptions(prev => ({
        ...prev,
        dueDate: selectedDate,
        submissionWindow: {
          ...prev.submissionWindow,
          endDate: selectedDate,
        },
      }));
    }
  }, [isIslamicHoliday]);

  // Handle group selection
  const handleGroupSelection = useCallback((groupIds: string[], add: boolean) => {
    setAssignmentOptions(prev => ({
      ...prev,
      targetGroups: add 
        ? [...new Set([...prev.targetGroups, ...groupIds])]
        : prev.targetGroups.filter(id => !groupIds.includes(id)),
    }));
  }, []);

  // Handle individual student selection
  const handleStudentSelection = useCallback((studentIds: string[], add: boolean) => {
    setAssignmentOptions(prev => ({
      ...prev,
      targetStudents: add 
        ? [...new Set([...prev.targetStudents, ...studentIds])]
        : prev.targetStudents.filter(id => !studentIds.includes(id)),
    }));
  }, []);

  // Deploy assignment with cultural considerations
  const handleDeployAssignment = useCallback(async () => {
    // Validation
    const hasTargets = assignmentOptions.targetGroups.length > 0 || assignmentOptions.targetStudents.length > 0;
    
    if (!hasTargets) {
      Alert.alert(
        'Nishon tanlang',
        'Iltimos, talabalar yoki guruhlarni tanlang',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!assignmentOptions.dueDate) {
      Alert.alert(
        'Muddat belgilang',
        'Iltimos, topshirish muddatini belgilang',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsDeploying(true);

    try {
      // Prepare assignment data with cultural considerations
      const assignmentData = {
        taskId: taskData.id || `task_${Date.now()}`,
        title: taskData.title,
        content: taskData,
        assignmentOptions: {
          ...assignmentOptions,
          islamicCalendarContext: getIslamicCalendarContext(),
          deployedAt: new Date().toISOString(),
          culturalMetadata: {
            islamicValues: taskData.culturalContext?.islamicValues || [],
            culturalSensitivityScore: taskData.metadata?.culturalAppropriatenessScore || 0,
            languageAdaptation: assignmentOptions.languagePreference,
            prayerTimeConsideration: assignmentOptions.prayerTimeAwareness,
          },
        },
        notification: {
          title: 'Yangi vazifa',
          body: `${taskData.title} vazifasi tayinlandi`,
          culturallyAppropriate: true,
          islamicGreeting: true,
        },
      };

      // Deploy to Supabase (will be handled by the API integration)
      console.log('Deploying assignment:', assignmentData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Success feedback
      Alert.alert(
        'Muvaffaqiyat!',
        'Vazifa muvaffaqiyatli tayinlandi. Talabalar bildirishnoma olishadi.',
        [
          {
            text: 'OK',
            onPress: () => {
              if (route.params.returnToTasks) {
                navigation.navigate('TasksList');
              } else {
                navigation.goBack();
              }
            },
          },
        ]
      );

    } catch (error) {
      console.error('Assignment deployment error:', error);
      Alert.alert(
        'Xatolik',
        'Vazifani tayinlashda xatolik yuz berdi. Qaytadan urinib ko\'ring.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsDeploying(false);
    }
  }, [assignmentOptions, taskData, getIslamicCalendarContext, navigation, route.params]);

  // Render target selection section
  const renderTargetSelection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Kimga tayinlash?</Text>
      
      {/* Assignment Type Selector */}
      <View style={styles.assignmentTypeContainer}>
        {[
          { key: 'individual', label: 'Alohida talabalar', icon: 'person' },
          { key: 'group', label: 'Guruhlar', icon: 'people' },
          { key: 'mixed', label: 'Aralash', icon: 'layers' },
        ].map(({ key, label, icon }) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.assignmentTypeButton,
              assignmentOptions.assignmentType === key && styles.activeAssignmentType,
            ]}
            onPress={() => handleAssignmentTypeChange(key as any)}
          >
            <Ionicons 
              name={icon as any} 
              size={24} 
              color={assignmentOptions.assignmentType === key ? '#1d7452' : '#666'} 
            />
            <Text 
              style={[
                styles.assignmentTypeText,
                assignmentOptions.assignmentType === key && styles.activeAssignmentTypeText,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Group Selection */}
      {(assignmentOptions.assignmentType === 'group' || assignmentOptions.assignmentType === 'mixed') && (
        <StudentGroupSelector
          groups={studentGroups}
          selectedGroups={assignmentOptions.targetGroups}
          onGroupSelect={handleGroupSelection}
          loading={groupsLoading}
          culturalContext="uzbekistan"
          islamicCalendarContext={getIslamicCalendarContext()}
        />
      )}

      {/* Individual Student Selection */}
      {(assignmentOptions.assignmentType === 'individual' || assignmentOptions.assignmentType === 'mixed') && (
        <IndividualStudentSelector
          students={individualStudents}
          selectedStudents={assignmentOptions.targetStudents}
          onStudentSelect={handleStudentSelection}
          loading={groupsLoading}
          culturalContext="uzbekistan"
          showParentInfo={true}
        />
      )}
    </View>
  );

  // Render timing configuration section
  const renderTimingConfiguration = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Vaqt sozlamalari</Text>
      
      <IslamicCalendarIntegration
        selectedDate={assignmentOptions.dueDate}
        onDateSelect={(date) => setAssignmentOptions(prev => ({ ...prev, dueDate: date }))}
        prayerTimes={prayerTimes}
        islamicHolidays={islamicHolidays}
        culturalConsiderations={true}
      />

      {/* Late Submission Settings */}
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Kech topshirish ruxsati</Text>
        <Switch
          value={assignmentOptions.allowLateSubmissions}
          onValueChange={(value) => 
            setAssignmentOptions(prev => ({ ...prev, allowLateSubmissions: value }))
          }
          trackColor={{ false: '#ddd', true: '#1d745280' }}
          thumbColor={assignmentOptions.allowLateSubmissions ? '#1d7452' : '#999'}
        />
      </View>

      {/* Prayer Time Awareness */}
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Namoz vaqtini hisobga olish</Text>
        <Switch
          value={assignmentOptions.prayerTimeAwareness}
          onValueChange={(value) => 
            setAssignmentOptions(prev => ({ ...prev, prayerTimeAwareness: value }))
          }
          trackColor={{ false: '#ddd', true: '#1d745280' }}
          thumbColor={assignmentOptions.prayerTimeAwareness ? '#1d7452' : '#999'}
        />
      </View>
    </View>
  );

  // Render cultural considerations section
  const renderCulturalConsiderations = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Madaniy mulohaza</Text>
      
      <CulturalConsiderationPanel
        culturalSensitivityLevel={assignmentOptions.culturalSensitivityLevel}
        languagePreference={assignmentOptions.languagePreference}
        islamicValues={taskData.culturalContext?.islamicValues || []}
        onSensitivityChange={(level) => 
          setAssignmentOptions(prev => ({ ...prev, culturalSensitivityLevel: level }))
        }
        onLanguageChange={(lang) => 
          setAssignmentOptions(prev => ({ ...prev, languagePreference: lang }))
        }
        requireParentSignature={assignmentOptions.requireParentSignature}
        onParentSignatureChange={(required) =>
          setAssignmentOptions(prev => ({ ...prev, requireParentSignature: required }))
        }
      />
    </View>
  );

  // Render assessment configuration section
  const renderAssessmentConfiguration = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Baholash sozlamalari</Text>
      
      <AssignmentOptionsPanel
        pointsTotal={assignmentOptions.pointsTotal}
        passingThreshold={assignmentOptions.passingThreshold}
        culturalBonusPoints={assignmentOptions.culturalBonusPoints}
        allowPeerReview={assignmentOptions.allowPeerReview}
        enableTeacherComments={assignmentOptions.enableTeacherComments}
        onPointsChange={(points) => 
          setAssignmentOptions(prev => ({ ...prev, pointsTotal: points }))
        }
        onThresholdChange={(threshold) => 
          setAssignmentOptions(prev => ({ ...prev, passingThreshold: threshold }))
        }
        onCulturalBonusChange={(bonus) => 
          setAssignmentOptions(prev => ({ ...prev, culturalBonusPoints: bonus }))
        }
        onPeerReviewChange={(enabled) => 
          setAssignmentOptions(prev => ({ ...prev, allowPeerReview: enabled }))
        }
        onTeacherCommentsChange={(enabled) => 
          setAssignmentOptions(prev => ({ ...prev, enableTeacherComments: enabled }))
        }
      />
    </View>
  );

  // Render notification settings section
  const renderNotificationSettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Bildirishnoma sozlamalari</Text>
      
      <ParentNotificationSettings
        notifications={assignmentOptions.parentNotifications}
        onNotificationChange={(key, value) =>
          setAssignmentOptions(prev => ({
            ...prev,
            parentNotifications: {
              ...prev.parentNotifications,
              [key]: value,
            },
          }))
        }
        culturallyAppropriateTiming={assignmentOptions.parentNotifications.culturallyAppropriateTiming}
        prayerTimes={prayerTimes}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1d7452" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Vazifa tayinlash</Text>
        
        <TouchableOpacity style={styles.helpButton}>
          <Ionicons name="help-circle-outline" size={24} color="#1d7452" />
        </TouchableOpacity>
      </View>

      {/* Section Navigation */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sectionNav}>
        {[
          { key: 'targets', label: 'Nishon', icon: 'people' },
          { key: 'timing', label: 'Vaqt', icon: 'time' },
          { key: 'cultural', label: 'Madaniyat', icon: 'globe' },
          { key: 'assessment', label: 'Baholash', icon: 'star' },
          { key: 'notifications', label: 'Bildirishnoma', icon: 'notifications' },
        ].map(({ key, label, icon }) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.sectionNavButton,
              activeSection === key && styles.activeSectionNavButton,
            ]}
            onPress={() => setActiveSection(key as any)}
          >
            <Ionicons
              name={icon as any}
              size={20}
              color={activeSection === key ? '#1d7452' : '#666'}
            />
            <Text
              style={[
                styles.sectionNavText,
                activeSection === key && styles.activeSectionNavText,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Main Content */}
      <Animated.View
        style={[
          styles.content,
          {
            transform: [
              {
                translateX: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [screenWidth, 0],
                }),
              },
            ],
          },
        ]}
      >
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {activeSection === 'targets' && renderTargetSelection()}
          {activeSection === 'timing' && renderTimingConfiguration()}
          {activeSection === 'cultural' && renderCulturalConsiderations()}
          {activeSection === 'assessment' && renderAssessmentConfiguration()}
          {activeSection === 'notifications' && renderNotificationSettings()}
        </ScrollView>
      </Animated.View>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Bekor qilish</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.deployButton,
            isDeploying && styles.disabledButton,
          ]}
          onPress={handleDeployAssignment}
          disabled={isDeploying}
        >
          <Ionicons 
            name={isDeploying ? "time" : "send"} 
            size={20} 
            color="white" 
          />
          <Text style={styles.deployButtonText}>
            {isDeploying ? 'Tayinlanmoqda...' : 'Vazifani tayinlash'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={assignmentOptions.dueDate || new Date()}
          mode="date"
          display="default"
          onChange={handleDueDateChange}
          minimumDate={new Date()}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  helpButton: {
    padding: 8,
  },
  sectionNav: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  activeSectionNavButton: {
    backgroundColor: '#f0f4f0',
    borderColor: '#1d7452',
  },
  sectionNavText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
    color: '#666',
  },
  activeSectionNavText: {
    color: '#1d7452',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  assignmentTypeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  assignmentTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: 'white',
  },
  activeAssignmentType: {
    borderColor: '#1d7452',
    backgroundColor: '#f0f4f0',
  },
  assignmentTypeText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    color: '#666',
  },
  activeAssignmentTypeText: {
    color: '#1d7452',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingLabel: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    marginRight: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  deployButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#1d7452',
    borderRadius: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  deployButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
});

export default TaskAssignmentScreen;