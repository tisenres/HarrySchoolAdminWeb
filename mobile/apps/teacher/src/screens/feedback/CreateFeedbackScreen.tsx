import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, RouteProp, useFocusEffect } from '@react-navigation/native';
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeInRight,
  SlideInUp,
} from 'react-native-reanimated';

// Types
interface CreateFeedbackScreenProps {
  navigation: NavigationProp<any>;
  route: RouteProp<any, 'CreateFeedback'>;
}

interface Student {
  id: string;
  name: string;
  points: number;
  grade: string;
  culturalContext: {
    familyLanguage: 'uz' | 'ru' | 'en';
    familyHierarchy: boolean;
    islamicValues: boolean;
  };
}

interface FeedbackTemplate {
  id: string;
  category: 'akhlaq' | 'academic' | 'social' | 'improvement';
  title: { uz: string; ru: string; en: string };
  content: { uz: string; ru: string; en: string };
  islamicValues: string[];
  culturalScore: number;
  pointImpact: number;
  usageCount: number;
}

interface VoiceInputState {
  isRecording: boolean;
  transcript: string;
  language: 'uz' | 'ru' | 'en';
  culturalValidation: {
    score: number;
    suggestions: string[];
    isAppropriate: boolean;
  };
}

interface PointImpact {
  basePoints: number;
  multiplier: number;
  bonusPoints: number;
  totalPoints: number;
  breakdown: Array<{
    source: string;
    points: number;
    reason: string;
  }>;
}

// Islamic Values-Based Template Categories
const TEMPLATE_CATEGORIES = [
  {
    id: 'akhlaq',
    name: { uz: 'Ахлоқ', ru: 'Характер', en: 'Character' },
    description: { uz: 'Хулқ ва одоб тарбияси', ru: 'Воспитание характера', en: 'Character development' },
    icon: '🤝',
    color: '#1d7452', // Harry School green
    gesture: 'swipe_right',
  },
  {
    id: 'academic',
    name: { uz: 'Илм', ru: 'Знания', en: 'Knowledge' },
    description: { uz: 'Илмий ютуқлар', ru: 'Академические достижения', en: 'Academic achievement' },
    icon: '📚',
    color: '#2563eb',
    gesture: 'swipe_up',
  },
  {
    id: 'social',
    name: { uz: 'Жамоавийлик', ru: 'Социальность', en: 'Community' },
    description: { uz: 'Ижтимоий алоқа', ru: 'Социальное взаимодействие', en: 'Social interaction' },
    icon: '👥',
    color: '#7c3aed',
    gesture: 'swipe_down',
  },
  {
    id: 'improvement',
    name: { uz: 'Ривожлантириш', ru: 'Развитие', en: 'Development' },
    description: { uz: 'Яхшилаш тавсиялари', ru: 'Рекомендации по улучшению', en: 'Improvement suggestions' },
    icon: '🌱',
    color: '#f59e0b',
    gesture: 'swipe_left',
  },
];

// Mock data - replace with actual hooks in implementation
const mockStudent: Student = {
  id: 'student-1',
  name: 'Азиза Каримова',
  points: 45,
  grade: '5А',
  culturalContext: {
    familyLanguage: 'uz',
    familyHierarchy: true,
    islamicValues: true,
  },
};

const mockTemplates: FeedbackTemplate[] = [
  {
    id: 'akhlaq-excellent',
    category: 'akhlaq',
    title: {
      uz: 'Ажойиб ахлоқ',
      ru: 'Отличный характер',
      en: 'Excellent character'
    },
    content: {
      uz: 'Машаллоҳ! Бугун дарсда ўқувчи ажойиб ахлоқ ва адаб намойиш этди. Синфдошларига ёрдам бериш ва устозга ҳурмат билан муомала қилиш исломий тарбиянинг ғоявий намунасидир.',
      ru: 'Машаллах! Сегодня на уроке ученик проявил отличный характер и воспитанность. Помощь одноклассникам и уважительное отношение к учителю - прекрасный пример исламского воспитания.',
      en: 'Mashallah! Today the student demonstrated excellent character and manners. Helping classmates and respectful behavior towards the teacher is a wonderful example of Islamic education.'
    },
    islamicValues: ['akhlaq', 'adab', 'ihsan'],
    culturalScore: 0.95,
    pointImpact: 12,
    usageCount: 45,
  },
  {
    id: 'academic-progress',
    category: 'academic',
    title: {
      uz: 'Илмий тараққиёт',
      ru: 'Академический прогресс',
      en: 'Academic progress'
    },
    content: {
      uz: 'Алҳамдулиллаҳ! Ўқувчи математика фанида катта тараққиёт кўрсатди. Аллоҳ марҳамати билан янада юқори натижаларга эришади.',
      ru: 'Алхамдулиллах! Ученик показал большой прогресс по математике. С помощью Аллаха достигнет еще более высоких результатов.',
      en: 'Alhamdulillah! The student showed great progress in mathematics. With Allah\'s blessing, will achieve even higher results.'
    },
    islamicValues: ['ilm', 'sabr'],
    culturalScore: 0.92,
    pointImpact: 8,
    usageCount: 67,
  },
];

const CreateFeedbackScreen: React.FC<CreateFeedbackScreenProps> = ({ 
  navigation, 
  route 
}) => {
  // Performance tracking for 30-second target
  const [startTime] = useState(Date.now());
  const [currentLanguage, setCurrentLanguage] = useState<'uz' | 'ru' | 'en'>('uz');
  
  // Feedback creation state
  const [selectedTemplate, setSelectedTemplate] = useState<FeedbackTemplate | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [customFeedback, setCustomFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Voice input state
  const [voiceInput, setVoiceInput] = useState<VoiceInputState>({
    isRecording: false,
    transcript: '',
    language: 'uz',
    culturalValidation: {
      score: 0,
      suggestions: [],
      isAppropriate: true,
    },
  });
  
  // Point calculation state
  const [pointImpact, setPointImpact] = useState<PointImpact>({
    basePoints: 0,
    multiplier: 1.0,
    bonusPoints: 0,
    totalPoints: 0,
    breakdown: [],
  });
  
  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const categoryTranslateX = useSharedValue(0);
  
  // Islamic Calendar integration
  const [hijriDate] = useState('٢٥ رمضان ١٤٤٥ ھ');
  const [prayerTimeWarning, setPrayerTimeWarning] = useState(false);
  
  // Check for prayer time on screen focus
  useFocusEffect(
    useCallback(() => {
      checkPrayerTime();
    }, [])
  );
  
  const checkPrayerTime = useCallback(() => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    // Simple prayer time check - in real implementation, use Islamic calendar service
    const prayerTimes = [
      { name: 'Фажр', time: { hour: 5, minute: 30 } },
      { name: 'Зуҳр', time: { hour: 12, minute: 30 } },
      { name: 'Аср', time: { hour: 16, minute: 45 } },
      { name: 'Мағриб', time: { hour: 19, minute: 15 } },
      { name: 'Хуфтон', time: { hour: 20, minute: 45 } },
    ];
    
    const isNearPrayerTime = prayerTimes.some(prayer => {
      const timeDiff = Math.abs(
        (hour * 60 + minute) - (prayer.time.hour * 60 + prayer.time.minute)
      );
      return timeDiff <= 15; // 15 minutes before/after
    });
    
    setPrayerTimeWarning(isNearPrayerTime);
  }, []);
  
  // Template filtering based on category
  const filteredTemplates = useMemo(() => {
    if (!selectedCategory) return mockTemplates;
    return mockTemplates.filter(template => template.category === selectedCategory);
  }, [selectedCategory]);
  
  // Calculate point impact in real-time
  const calculatePointImpact = useCallback((template: FeedbackTemplate, customText: string) => {
    let basePoints = template.pointImpact;
    let multiplier = 1.0;
    let bonusPoints = 0;
    
    // Islamic values multiplier
    template.islamicValues.forEach(value => {
      switch (value) {
        case 'akhlaq':
          multiplier *= 1.5;
          break;
        case 'adab':
          multiplier *= 1.3;
          break;
        case 'ihsan':
          multiplier *= 1.4;
          break;
        case 'taqwa':
          multiplier *= 1.6;
          break;
        default:
          multiplier *= 1.1;
      }
    });
    
    // Cultural appropriateness bonus
    if (template.culturalScore > 0.9) {
      bonusPoints += 3;
    }
    
    // Custom text bonus for personalization
    if (customText.length > 20) {
      bonusPoints += 2;
    }
    
    const totalPoints = Math.round((basePoints * multiplier) + bonusPoints);
    
    const breakdown = [
      { source: 'Template Base', points: basePoints, reason: 'Selected template points' },
      { source: 'Islamic Values', points: Math.round(basePoints * (multiplier - 1)), reason: 'Islamic educational values bonus' },
      { source: 'Cultural Score', points: template.culturalScore > 0.9 ? 3 : 0, reason: 'High cultural appropriateness' },
      { source: 'Personalization', points: customText.length > 20 ? 2 : 0, reason: 'Custom feedback added' },
    ];
    
    setPointImpact({
      basePoints,
      multiplier,
      bonusPoints,
      totalPoints,
      breakdown: breakdown.filter(item => item.points > 0),
    });
    
    return totalPoints;
  }, []);
  
  // Handle template selection
  const handleTemplateSelect = useCallback((template: FeedbackTemplate) => {
    setSelectedTemplate(template);
    calculatePointImpact(template, customFeedback);
    
    // Haptic feedback
    Vibration.vibrate(50);
    
    // Animation feedback
    scale.value = withSpring(0.95, {}, () => {
      scale.value = withSpring(1);
    });
  }, [customFeedback, calculatePointImpact, scale]);
  
  // Handle category selection with gesture
  const handleCategorySelect = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedTemplate(null);
    
    // Visual feedback
    categoryTranslateX.value = withSpring(10, {}, () => {
      categoryTranslateX.value = withSpring(0);
    });
    
    Vibration.vibrate(30);
  }, [categoryTranslateX]);
  
  // Voice input handlers
  const startVoiceRecording = useCallback(async () => {
    try {
      setVoiceInput(prev => ({ ...prev, isRecording: true }));
      // In real implementation, start voice recording with Uzbek language
      console.log('Starting Uzbek voice recording...');
    } catch (error) {
      console.error('Voice recording failed:', error);
      Alert.alert('Хато', 'Овозли киритиш хатоси юз берди');
    }
  }, []);
  
  const stopVoiceRecording = useCallback(async () => {
    try {
      setVoiceInput(prev => ({ ...prev, isRecording: false }));
      // Mock transcript for demo
      const mockTranscript = 'Бугун ўқувчи дарсда жуда фаол иштирок этди ва синфдошларига ёрдам берди';
      setVoiceInput(prev => ({
        ...prev,
        transcript: mockTranscript,
        culturalValidation: {
          score: 0.92,
          suggestions: [],
          isAppropriate: true,
        },
      }));
      setCustomFeedback(mockTranscript);
    } catch (error) {
      console.error('Voice recording stop failed:', error);
    }
  }, []);
  
  // Submit feedback
  const handleSubmitFeedback = useCallback(async () => {
    if (!selectedTemplate) {
      Alert.alert('Танлов керак', 'Илтимос, шаблон танланг');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const completionTime = Date.now() - startTime;
      
      const feedbackData = {
        studentId: mockStudent.id,
        templateId: selectedTemplate.id,
        content: customFeedback || selectedTemplate.content[currentLanguage],
        voiceTranscript: voiceInput.transcript,
        culturalScore: selectedTemplate.culturalScore,
        pointImpact: pointImpact.totalPoints,
        islamicValues: selectedTemplate.islamicValues,
        language: currentLanguage,
        timestamp: Date.now(),
        completionTime,
        culturalContext: {
          familyHierarchy: mockStudent.culturalContext.familyHierarchy,
          respectfulTone: selectedTemplate.culturalScore > 0.8,
          islamicAlignment: true,
          prayerTimeConsidered: prayerTimeWarning,
        },
      };
      
      // Mock submission - replace with actual API call
      console.log('Submitting feedback:', feedbackData);
      
      // Show success feedback
      Alert.alert(
        'Муваффақият!',
        `Фикр-мулоҳаза ${completionTime < 30000 ? 'тез' : 'муваффақиятли'} юборилди`,
        [
          {
            text: 'Давом этиш',
            onPress: () => navigation.goBack(),
          },
        ]
      );
      
    } catch (error) {
      console.error('Feedback submission failed:', error);
      Alert.alert('Хато', 'Фикр-мулоҳаза юборишда хатолик юз берди');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    selectedTemplate,
    customFeedback,
    voiceInput.transcript,
    pointImpact.totalPoints,
    currentLanguage,
    startTime,
    navigation,
    prayerTimeWarning,
  ]);
  
  // Animated styles
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  
  const categoryAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: categoryTranslateX.value }],
  }));
  
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        {/* Islamic Calendar Header */}
        <Animated.View 
          style={[styles.header, { backgroundColor: '#1d7452' }]}
          entering={SlideInUp}
        >
          <Text style={styles.islamicGreeting}>بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ</Text>
          <Text style={styles.hijriDate}>{hijriDate}</Text>
          {prayerTimeWarning && (
            <View style={styles.prayerWarning}>
              <Text style={styles.prayerWarningText}>🕌 Намоз вақти яқин</Text>
            </View>
          )}
        </Animated.View>
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Student Info */}
          <Animated.View 
            style={styles.studentCard}
            entering={FadeInRight.delay(200)}
          >
            <Text style={styles.studentName}>{mockStudent.name}</Text>
            <Text style={styles.studentDetails}>
              {mockStudent.grade} • {mockStudent.points} очко
            </Text>
          </Animated.View>
          
          {/* Category Selection */}
          <Animated.View 
            style={[styles.categorySection, categoryAnimatedStyle]}
            entering={FadeInRight.delay(400)}
          >
            <Text style={styles.sectionTitle}>Категория танланг</Text>
            <View style={styles.categoryGrid}>
              {TEMPLATE_CATEGORIES.map((category) => (
                <Pressable
                  key={category.id}
                  style={[
                    styles.categoryCard,
                    { backgroundColor: category.color },
                    selectedCategory === category.id && styles.selectedCategory,
                  ]}
                  onPress={() => handleCategorySelect(category.id)}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text style={styles.categoryName}>
                    {category.name[currentLanguage]}
                  </Text>
                  <Text style={styles.categoryDescription}>
                    {category.description[currentLanguage]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
          
          {/* Template Selection */}
          {selectedCategory && (
            <Animated.View 
              style={styles.templateSection}
              entering={FadeInRight.delay(600)}
            >
              <Text style={styles.sectionTitle}>Шаблон танланг</Text>
              {filteredTemplates.map((template) => (
                <Pressable
                  key={template.id}
                  style={[
                    styles.templateCard,
                    selectedTemplate?.id === template.id && styles.selectedTemplate,
                  ]}
                  onPress={() => handleTemplateSelect(template)}
                >
                  <View style={styles.templateHeader}>
                    <Text style={styles.templateTitle}>
                      {template.title[currentLanguage]}
                    </Text>
                    <View style={styles.islamicValuesBadge}>
                      {template.islamicValues.map((value) => (
                        <Text key={value} style={styles.islamicValueTag}>
                          {value}
                        </Text>
                      ))}
                    </View>
                  </View>
                  <Text style={styles.templateContent} numberOfLines={3}>
                    {template.content[currentLanguage]}
                  </Text>
                  <View style={styles.templateFooter}>
                    <Text style={styles.culturalScore}>
                      Маданий мувофиқлик: {Math.round(template.culturalScore * 100)}%
                    </Text>
                    <Text style={styles.pointImpact}>+{template.pointImpact} очко</Text>
                  </View>
                </Pressable>
              ))}
            </Animated.View>
          )}
          
          {/* Voice Input Section */}
          {selectedTemplate && (
            <Animated.View 
              style={styles.voiceSection}
              entering={FadeInRight.delay(800)}
            >
              <Text style={styles.sectionTitle}>Қўшимча фикр-мулоҳаза</Text>
              <Pressable
                style={[
                  styles.voiceButton,
                  voiceInput.isRecording && styles.voiceButtonRecording,
                ]}
                onPress={voiceInput.isRecording ? stopVoiceRecording : startVoiceRecording}
              >
                <Text style={styles.voiceButtonIcon}>
                  {voiceInput.isRecording ? '⏹️' : '🎤'}
                </Text>
                <Text style={styles.voiceButtonText}>
                  {voiceInput.isRecording 
                    ? 'Тўхтатиш учун босинг' 
                    : 'Овозли киритиш учун босинг'
                  }
                </Text>
              </Pressable>
              
              {voiceInput.transcript && (
                <View style={styles.transcriptBox}>
                  <Text style={styles.transcriptText}>{voiceInput.transcript}</Text>
                  <View style={styles.culturalValidation}>
                    <Text style={styles.validationScore}>
                      Маданий баҳо: {Math.round(voiceInput.culturalValidation.score * 100)}%
                    </Text>
                  </View>
                </View>
              )}
            </Animated.View>
          )}
          
          {/* Point Impact Preview */}
          {selectedTemplate && (
            <Animated.View 
              style={styles.pointPreviewSection}
              entering={FadeInRight.delay(1000)}
            >
              <Text style={styles.sectionTitle}>Очколар таъсири</Text>
              <View style={styles.pointPreviewCard}>
                <View style={styles.pointSummary}>
                  <Text style={styles.totalPoints}>{pointImpact.totalPoints}</Text>
                  <Text style={styles.pointsLabel}>очко қўшилади</Text>
                </View>
                <View style={styles.pointBreakdown}>
                  {pointImpact.breakdown.map((item, index) => (
                    <View key={index} style={styles.pointBreakdownItem}>
                      <Text style={styles.breakdownSource}>{item.source}</Text>
                      <Text style={styles.breakdownPoints}>+{item.points}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </Animated.View>
          )}
        </ScrollView>
        
        {/* Submit Button */}
        {selectedTemplate && (
          <Animated.View 
            style={[styles.submitSection, containerAnimatedStyle]}
            entering={SlideInUp.delay(1200)}
          >
            <Pressable
              style={[
                styles.submitButton,
                isSubmitting && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmitFeedback}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Юборилмоқда...' : 'Фикр-мулоҳаза юбориш'}
              </Text>
            </Pressable>
            
            {/* Timer indicator for 30-second target */}
            <View style={styles.timerIndicator}>
              <Text style={styles.timerText}>
                Мақсад: 30 сония • Ҳозирги: {Math.round((Date.now() - startTime) / 1000)}с
              </Text>
            </View>
          </Animated.View>
        )}
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  islamicGreeting: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: 4,
  },
  hijriDate: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    opacity: 0.9,
  },
  prayerWarning: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  prayerWarningText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  studentCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  studentName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  studentDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  categorySection: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    flex: 0.48,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  selectedCategory: {
    borderWidth: 3,
    borderColor: '#fbbf24',
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  templateSection: {
    margin: 16,
  },
  templateCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectedTemplate: {
    borderColor: '#1d7452',
    borderWidth: 2,
    backgroundColor: '#f0fdf4',
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    marginRight: 8,
  },
  islamicValuesBadge: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
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
  templateContent: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  templateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  culturalScore: {
    fontSize: 12,
    color: '#6b7280',
  },
  pointImpact: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1d7452',
  },
  voiceSection: {
    margin: 16,
  },
  voiceButton: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderStyle: 'dashed',
    alignItems: 'center',
    marginBottom: 12,
  },
  voiceButtonRecording: {
    backgroundColor: '#fee2e2',
    borderColor: '#dc2626',
  },
  voiceButtonIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  voiceButtonText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '500',
  },
  transcriptBox: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  transcriptText: {
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 20,
    marginBottom: 8,
  },
  culturalValidation: {
    alignItems: 'flex-end',
  },
  validationScore: {
    fontSize: 12,
    color: '#1d7452',
    fontWeight: '500',
  },
  pointPreviewSection: {
    margin: 16,
  },
  pointPreviewCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  pointSummary: {
    alignItems: 'center',
    marginBottom: 16,
  },
  totalPoints: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1d7452',
  },
  pointsLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  pointBreakdown: {
    gap: 8,
  },
  pointBreakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownSource: {
    fontSize: 14,
    color: '#4b5563',
  },
  breakdownPoints: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1d7452',
  },
  submitSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  submitButton: {
    backgroundColor: '#1d7452',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  timerIndicator: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: 12,
    color: '#6b7280',
  },
});

export default CreateFeedbackScreen;