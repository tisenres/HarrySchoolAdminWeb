import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  StyleSheet,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

// Internal imports
import { useAITaskGeneration } from '../../hooks/useAITaskGeneration';
import { useIslamicCalendar } from '../../hooks/useIslamicCalendar';
import { useCulturalValidation } from '../../hooks/useCulturalValidation';
import { TaskTypeSelector } from '../../components/tasks/TaskTypeSelector';
import { ParameterConfigurationWizard } from '../../components/tasks/ParameterConfigurationWizard';
import { TaskPreviewPanel } from '../../components/tasks/TaskPreviewPanel';
import { CulturalContextSelector } from '../../components/tasks/CulturalContextSelector';
import { IslamicProgressIndicator } from '../../components/ui/IslamicProgressIndicator';
import { CulturallyAwareInput } from '../../components/ui/CulturallyAwareInput';
import { DuaLoadingOverlay } from '../../components/ui/DuaLoadingOverlay';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';
import { OfflineIndicator } from '../../components/ui/OfflineIndicator';

// Types based on UX research findings
interface TaskCreationState {
  // Phase 1: Conceptualization (2-5 minutes)
  phase: 1 | 2 | 3;
  startTime: number;
  
  // Task type selection (Template-first thinking - 78% preference)
  taskType: 'reading_comprehension' | 'vocabulary' | 'writing_prompt' | 'listening' | 'grammar' | 'cultural_quiz' | null;
  
  // Phase 2: Parameter Definition (3-7 minutes)
  parameters: {
    // Critical Control Points (priority order from research)
    topic: string; // 100% of teachers specify
    difficultyLevel: 1 | 2 | 3 | 4 | 5; // 94% specify explicitly
    contentLength: 'short' | 'medium' | 'long'; // 87% have preferences  
    questionFormat: string; // 82% specify type
    culturalContext: 'uzbekistan' | 'islamic' | 'global' | 'mixed'; // 76% for Islamic education
    languageComplexity: 'elementary' | 'intermediate' | 'advanced'; // 71% adjust for student level
    islamicValues: string[]; // Value alignment - 100% essential
    languagePreference: 'en' | 'uz' | 'ru' | 'ar';
  };
  
  // Phase 3: Generation & Review
  generatedContent: any | null;
  previewMode: boolean;
  editingEnabled: boolean;
  culturalValidationScore: number;
  estimatedCompletionTime: number;
}

interface CreateTaskScreenProps {
  navigation: any;
  route: {
    params?: {
      groupId?: string;
      studentIds?: string[];
      templateId?: string;
    };
  };
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const CreateTaskScreen: React.FC<CreateTaskScreenProps> = ({ navigation, route }) => {
  // Task creation state following Linear-Iterative Model
  const [taskState, setTaskState] = useState<TaskCreationState>({
    phase: 1,
    startTime: Date.now(),
    taskType: null,
    parameters: {
      topic: '',
      difficultyLevel: 3,
      contentLength: 'medium',
      questionFormat: '',
      culturalContext: 'islamic',
      languageComplexity: 'intermediate',
      islamicValues: ['akhlaq'],
      languagePreference: 'en',
    },
    generatedContent: null,
    previewMode: false,
    editingEnabled: false,
    culturalValidationScore: 0,
    estimatedCompletionTime: 0,
  });

  // AI and cultural hooks
  const {
    generateTask,
    isGenerating,
    error: aiError,
    estimatedCost,
    previewContent,
    refineContent,
    validateContent,
  } = useAITaskGeneration(route.params?.groupId);

  const { 
    currentIslamicDate, 
    prayerTimes, 
    islamicHolidays,
    getIslamicCalendarContext 
  } = useIslamicCalendar();

  const {
    validateCulturalAppropriateness,
    getCulturalSuggestions,
    isValidating: isCulturalValidating,
    culturalScore,
    suggestions: culturalSuggestions,
  } = useCulturalValidation();

  // Animation and UI state
  const [isOffline, setIsOffline] = useState(false);
  const phaseProgress = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Focus effect for Islamic greeting and prayer time awareness
  useFocusEffect(
    useCallback(() => {
      // Islamic greeting and context setup
      const islamicContext = getIslamicCalendarContext();
      
      // Animate entrance
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      return () => {
        // Cleanup animations
        fadeAnim.setValue(0);
        slideAnim.setValue(0);
      };
    }, [])
  );

  // Phase progression with cultural celebrations
  const advancePhase = useCallback(async () => {
    if (taskState.phase < 3) {
      // Cultural transition animation
      Animated.sequence([
        Animated.timing(phaseProgress, {
          toValue: taskState.phase / 3,
          duration: 600,
          useNativeDriver: false,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.7,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      setTaskState(prev => ({
        ...prev,
        phase: (prev.phase + 1) as 1 | 2 | 3,
      }));
    }
  }, [taskState.phase]);

  // AI task generation with cultural validation
  const handleGenerateTask = useCallback(async () => {
    try {
      // Validate parameters before generation
      if (!taskState.taskType || !taskState.parameters.topic.trim()) {
        Alert.alert(
          'معلومات مطلوبة', // Arabic: Required Information
          'Iltimos, vazifa turi va mavzuni tanlang', // Uzbek: Please select task type and topic
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }

      // Cultural pre-validation
      const culturalPreCheck = await validateCulturalAppropriateness({
        content: taskState.parameters.topic,
        context: taskState.parameters.culturalContext,
        islamicValues: taskState.parameters.islamicValues,
      });

      if (culturalPreCheck.score < 0.8) {
        Alert.alert(
          'Madaniy moslik', // Cultural Appropriateness
          'Tanlangan mavzu islomiy ta\'lim kontekstiga to\'liq mos kelmaydi. Davom etasizmi?',
          [
            { text: 'Bekor qilish', style: 'cancel' },
            { 
              text: 'Davom etish', 
              style: 'default',
              onPress: () => proceedWithGeneration()
            }
          ]
        );
        return;
      }

      await proceedWithGeneration();
    } catch (error) {
      console.error('Task generation error:', error);
      Alert.alert(
        'Xatolik',
        'Vazifa yaratishda xatolik yuz berdi. Qaytadan urinib ko\'ring.',
        [{ text: 'OK' }]
      );
    }
  }, [taskState, validateCulturalAppropriateness]);

  const proceedWithGeneration = async () => {
    const startGeneration = Date.now();

    const generationRequest = {
      taskType: taskState.taskType!,
      parameters: {
        ...taskState.parameters,
        islamicCalendarContext: getIslamicCalendarContext(),
        prayerTimeAwareness: prayerTimes,
        culturalExamples: taskState.parameters.culturalContext === 'uzbekistan',
      },
      qualityTargets: {
        culturalAppropriatenessThreshold: 0.95,
        educationalValueScore: 4.0,
        factualAccuracyThreshold: 0.98,
        islamicValuesAlignment: 0.95,
      },
    };

    const result = await generateTask(generationRequest);
    
    if (result.success) {
      const generationTime = Date.now() - startGeneration;
      
      setTaskState(prev => ({
        ...prev,
        generatedContent: result.content,
        culturalValidationScore: result.culturalScore || 0,
        estimatedCompletionTime: generationTime,
        previewMode: true,
        phase: 3,
      }));

      // Cultural celebration for successful generation
      if (result.culturalScore > 0.95) {
        // Trigger subtle Islamic geometric animation
        Animated.sequence([
          Animated.timing(slideAnim, {
            toValue: 1.1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }

      advancePhase();
    }
  };

  // Task type selection handler (Template-first thinking)
  const handleTaskTypeSelection = useCallback((
    type: 'reading_comprehension' | 'vocabulary' | 'writing_prompt' | 'listening' | 'grammar' | 'cultural_quiz'
  ) => {
    setTaskState(prev => ({
      ...prev,
      taskType: type,
    }));

    // Auto-advance to parameter configuration
    setTimeout(() => advancePhase(), 500);
  }, [advancePhase]);

  // Parameter update handler with real-time validation
  const handleParameterUpdate = useCallback((
    parameter: keyof TaskCreationState['parameters'],
    value: any
  ) => {
    setTaskState(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [parameter]: value,
      },
    }));

    // Real-time cultural validation for topic changes
    if (parameter === 'topic' && typeof value === 'string' && value.length > 3) {
      validateCulturalAppropriateness({
        content: value,
        context: taskState.parameters.culturalContext,
        islamicValues: taskState.parameters.islamicValues,
      });
    }
  }, [taskState.parameters, validateCulturalAppropriateness]);

  // Deploy task with Islamic blessing
  const handleDeployTask = useCallback(async () => {
    if (!taskState.generatedContent) return;

    try {
      // Final cultural validation
      const finalValidation = await validateContent(taskState.generatedContent);
      
      if (finalValidation.culturalScore < 0.95) {
        Alert.alert(
          'Madaniy tekshiruv',
          'Vazifa yakuniy madaniy tekshiruvdan o\'ta olmadi. Tahrirlash kerakmi?',
          [
            { text: 'Tahrirlash', onPress: () => setTaskState(prev => ({ ...prev, editingEnabled: true })) },
            { text: 'Bekor qilish', style: 'cancel' }
          ]
        );
        return;
      }

      // Deploy with Islamic blessing
      const deploymentData = {
        ...taskState.generatedContent,
        metadata: {
          createdBy: 'teacher', // Will be filled with actual teacher ID
          islamicBlessingsInvoked: true,
          culturalValidationScore: finalValidation.culturalScore,
          creationTime: Date.now() - taskState.startTime,
          islamicCalendarDate: currentIslamicDate,
        },
        assignmentOptions: {
          groupId: route.params?.groupId,
          studentIds: route.params?.studentIds,
          dueDate: null, // Will be set in assignment flow
          allowLateSubmissions: true,
          culturalConsiderations: taskState.parameters.islamicValues,
        },
      };

      // Navigate to assignment options or complete deployment
      navigation.navigate('TaskAssignment', { 
        taskData: deploymentData,
        returnToTasks: true 
      });

    } catch (error) {
      console.error('Deployment error:', error);
      Alert.alert('Xatolik', 'Vazifani joylashtirish jarayonida xatolik. Qaytadan urinib ko\'ring.');
    }
  }, [taskState, validateContent, navigation, currentIslamicDate, route.params]);

  // Render phase-specific content
  const renderPhaseContent = () => {
    switch (taskState.phase) {
      case 1:
        return (
          <TaskTypeSelector
            selectedType={taskState.taskType}
            onTypeSelect={handleTaskTypeSelection}
            culturalContext={taskState.parameters.culturalContext}
            islamicValues={taskState.parameters.islamicValues}
            teacherPreferences={{
              priorityOrder: [
                'reading_comprehension', // 96% teacher demand
                'vocabulary',            // 91% demand
                'writing_prompt',        // 88% demand
                'listening',            // 85% demand
                'grammar',              // 82% demand
                'cultural_quiz',        // 79% demand
              ],
            }}
          />
        );

      case 2:
        return (
          <ParameterConfigurationWizard
            taskType={taskState.taskType!}
            parameters={taskState.parameters}
            onParameterUpdate={handleParameterUpdate}
            onAdvancePhase={advancePhase}
            culturalValidationScore={culturalScore}
            culturalSuggestions={culturalSuggestions}
            estimatedCost={estimatedCost}
            islamicCalendarContext={getIslamicCalendarContext()}
            prayerTimes={prayerTimes}
          />
        );

      case 3:
        return (
          <TaskPreviewPanel
            generatedContent={taskState.generatedContent}
            parameters={taskState.parameters}
            culturalValidationScore={taskState.culturalValidationScore}
            onEditContent={(content) => setTaskState(prev => ({ ...prev, generatedContent: content }))}
            onRefineContent={refineContent}
            onDeployTask={handleDeployTask}
            editingEnabled={taskState.editingEnabled}
            estimatedCompletionTime={taskState.estimatedCompletionTime}
            islamicBlessingsEnabled={true}
          />
        );

      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        {/* Islamic Calendar Header with Prayer Time Awareness */}
        <LinearGradient
          colors={['#1d7452', '#2d8f5f', '#3da66c']}
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
              <Text style={styles.headerTitle}>
                Yangi vazifa yaratish
              </Text>
              <Text style={styles.headerSubtitle}>
                {currentIslamicDate} • {prayerTimes?.current?.name}
              </Text>
            </View>

            <TouchableOpacity style={styles.helpButton}>
              <Ionicons name="help-circle-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Progress Indicator with Islamic Geometric Patterns */}
          <IslamicProgressIndicator
            currentPhase={taskState.phase}
            totalPhases={3}
            phaseNames={['Tanlash', 'Sozlash', 'Ko\'rish']}
            progress={phaseProgress}
            style={styles.progressIndicator}
          />
        </LinearGradient>

        {/* Offline Indicator */}
        {isOffline && <OfflineIndicator />}

        {/* Main Content Area */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.contentContainer}
        >
          <Animated.View
            style={[
              styles.phaseContainer,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {renderPhaseContent()}
          </Animated.View>
        </KeyboardAvoidingView>

        {/* AI Generation Loading Overlay with Islamic Patterns */}
        {isGenerating && (
          <DuaLoadingOverlay
            message="AI yordamida vazifa yaratilmoqda..."
            islamicPattern="geometric"
            estimatedTime="30 soniya"
            culturalContext="uzbekistan"
          />
        )}

        {/* Cultural Validation Loading */}
        {isCulturalValidating && (
          <BlurView intensity={80} style={styles.validationOverlay}>
            <View style={styles.validationContent}>
              <ActivityIndicator size="large" color="#1d7452" />
              <Text style={styles.validationText}>
                Madaniy mosligi tekshirilmoqda...
              </Text>
            </View>
          </BlurView>
        )}

        {/* Bottom Action Bar */}
        <View style={styles.bottomActionBar}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.secondaryButton,
              taskState.phase === 1 && styles.disabledButton,
            ]}
            onPress={() => setTaskState(prev => ({ ...prev, phase: Math.max(1, prev.phase - 1) as 1 | 2 | 3 }))}
            disabled={taskState.phase === 1}
          >
            <Ionicons name="chevron-back" size={20} color={taskState.phase === 1 ? '#999' : '#1d7452'} />
            <Text style={[styles.actionButtonText, taskState.phase === 1 && styles.disabledText]}>
              Orqaga
            </Text>
          </TouchableOpacity>

          {taskState.phase === 2 && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.primaryButton,
                (!taskState.taskType || !taskState.parameters.topic.trim()) && styles.disabledButton,
              ]}
              onPress={handleGenerateTask}
              disabled={!taskState.taskType || !taskState.parameters.topic.trim() || isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="sparkles" size={20} color="white" />
              )}
              <Text style={[styles.actionButtonText, { color: 'white' }]}>
                AI yaratish
              </Text>
            </TouchableOpacity>
          )}

          {taskState.phase === 3 && taskState.generatedContent && (
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handleDeployTask}
            >
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text style={[styles.actionButtonText, { color: 'white' }]}>
                Jo'natish
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  helpButton: {
    padding: 8,
  },
  progressIndicator: {
    marginTop: 8,
  },
  contentContainer: {
    flex: 1,
  },
  phaseContainer: {
    flex: 1,
    padding: 20,
  },
  validationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  validationContent: {
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  validationText: {
    fontSize: 16,
    color: '#333',
    marginTop: 12,
    textAlign: 'center',
  },
  bottomActionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 120,
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#1d7452',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#1d7452',
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#1d7452',
  },
  disabledText: {
    color: '#999',
  },
});

export default CreateTaskScreen;