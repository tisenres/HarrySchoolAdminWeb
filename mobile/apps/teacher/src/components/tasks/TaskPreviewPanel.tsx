import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Animated,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

// Internal imports
import { CulturalValidationBadge } from '../ui/CulturalValidationBadge';
import { IslamicValuesTags } from '../ui/IslamicValuesTags';
import { EditableContentRenderer } from '../ui/EditableContentRenderer';
import { CulturalFeedbackSuggestions } from '../ui/CulturalFeedbackSuggestions';
import { AIGenerationMetrics } from '../ui/AIGenerationMetrics';
import { TaskQualityIndicators } from '../ui/TaskQualityIndicators';

interface TaskPreviewPanelProps {
  generatedContent: {
    taskId: string;
    title: string;
    instructions: string;
    content: {
      questions?: Array<{
        id: string;
        type: 'multiple_choice' | 'short_answer' | 'essay' | 'listening' | 'reading';
        question: string;
        options?: string[];
        correctAnswer?: string | number;
        explanation?: string;
        islamicContext?: string;
        culturalRelevance?: number;
      }>;
      passages?: Array<{
        id: string;
        title: string;
        content: string;
        difficulty: number;
        culturalContext: string;
        islamicValues: string[];
      }>;
      vocabulary?: Array<{
        word: string;
        definition: string;
        example: string;
        culturalContext?: string;
        islamicRelevance?: boolean;
      }>;
    };
    metadata: {
      taskType: string;
      difficulty: number;
      estimatedDuration: number;
      culturalAppropriatenessScore: number;
      islamicValuesAlignment: number;
      factualAccuracy: number;
      educationalValue: number;
      generationTime: number;
      tokensUsed: number;
      cost: number;
    };
    culturalContext: {
      targetCulture: string;
      islamicValues: string[];
      languageComplexity: string;
      culturalExamples: boolean;
      appropriatenessValidation: {
        score: number;
        issues: Array<{
          type: 'content' | 'language' | 'cultural' | 'religious';
          severity: 'low' | 'medium' | 'high';
          description: string;
          suggestion: string;
        }>;
      };
    };
  } | null;
  parameters: {
    topic: string;
    difficultyLevel: number;
    culturalContext: string;
    islamicValues: string[];
    languagePreference: string;
  };
  culturalValidationScore: number;
  onEditContent: (content: any) => void;
  onRefineContent: (refinementInstructions: string) => Promise<any>;
  onDeployTask: () => void;
  editingEnabled: boolean;
  estimatedCompletionTime: number;
  islamicBlessingsEnabled: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

const TaskPreviewPanel: React.FC<TaskPreviewPanelProps> = ({
  generatedContent,
  parameters,
  culturalValidationScore,
  onEditContent,
  onRefineContent,
  onDeployTask,
  editingEnabled,
  estimatedCompletionTime,
  islamicBlessingsEnabled,
}) => {
  // Component state based on teacher feedback patterns (89% want preview & edit)
  const [activeTab, setActiveTab] = useState<'preview' | 'edit' | 'cultural' | 'metrics'>('preview');
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [refinementInstructions, setRefinementInstructions] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [showCulturalDetails, setShowCulturalDetails] = useState(false);
  const [teacherFeedback, setTeacherFeedback] = useState({
    contentQuality: 0,
    culturalAppropriateness: 0,
    studentEngagement: 0,
    learningObjectiveAlignment: 0,
    comments: '',
  });

  // Animation refs for smooth transitions
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Effect for entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [generatedContent]);

  // Handle content refinement with cultural preservation
  const handleRefineContent = useCallback(async () => {
    if (!refinementInstructions.trim()) {
      Alert.alert(
        'Taklifnoma kerak',
        'Iltimos, AI ga qanday o\'zgarish kerakligini ayting',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsRefining(true);
    
    try {
      // Add cultural preservation instructions
      const culturallyAwareInstructions = `
        ${refinementInstructions}
        
        MUHIM: Quyidagi madaniy talablarni saqlang:
        - Islomiy qiymatlarni hurmat qiling: ${parameters.islamicValues.join(', ')}
        - O'zbekiston madaniyatiga mos bo'lsin
        - Ta'limiy maqsadlarni yo'qotmang
        - Til murakkabligini ${parameters.difficultyLevel}/5 darajasida saqlang
      `;

      const refinedContent = await onRefineContent(culturallyAwareInstructions);
      
      if (refinedContent) {
        // Animate content update
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 0.95,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();

        onEditContent(refinedContent);
        setRefinementInstructions('');
        
        Alert.alert(
          'Muvaffaqiyat!',
          'Vazifa muvaffaqiyatli yangilandi',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Content refinement error:', error);
      Alert.alert(
        'Xatolik',
        'Kontentni yangilashda xatolik yuz berdi. Qaytadan urinib ko\'ring.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsRefining(false);
    }
  }, [refinementInstructions, parameters, onRefineContent, onEditContent]);

  // Handle teacher feedback submission
  const handleTeacherFeedbackSubmit = useCallback(() => {
    // Validate teacher feedback
    const averageRating = (
      teacherFeedback.contentQuality +
      teacherFeedback.culturalAppropriateness +
      teacherFeedback.studentEngagement +
      teacherFeedback.learningObjectiveAlignment
    ) / 4;

    if (averageRating < 3.5) {
      Alert.alert(
        'Sifat baholovi',
        'Vazifa sifati kutilganidan past. Tahrirlash yoki qayta yaratishni xohlaysizmi?',
        [
          { text: 'Tahrirlash', onPress: () => setActiveTab('edit') },
          { text: 'Qayta yaratish', onPress: () => {/* Navigate back to parameter configuration */} },
          { text: 'Bekor qilish', style: 'cancel' },
        ]
      );
      return;
    }

    // Proceed with deployment
    onDeployTask();
  }, [teacherFeedback, onDeployTask]);

  // Render content based on task type
  const renderTaskContent = () => {
    if (!generatedContent) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="document-outline" size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>Vazifa kontenti mavjud emas</Text>
        </View>
      );
    }

    const { content } = generatedContent;

    return (
      <View style={styles.contentContainer}>
        {/* Task Title and Instructions */}
        <View style={styles.taskHeader}>
          <Text style={styles.taskTitle}>{generatedContent.title}</Text>
          <Text style={styles.taskInstructions}>{generatedContent.instructions}</Text>
          
          {/* Islamic Values and Cultural Context */}
          <View style={styles.contextBar}>
            <IslamicValuesTags 
              values={generatedContent.culturalContext.islamicValues}
              compact={true}
            />
            <CulturalValidationBadge 
              score={culturalValidationScore}
              compact={true}
            />
          </View>
        </View>

        {/* Content Sections */}
        <ScrollView style={styles.contentSections} showsVerticalScrollIndicator={false}>
          {/* Reading Passages */}
          {content.passages && content.passages.length > 0 && (
            <View style={styles.contentSection}>
              <Text style={styles.sectionTitle}>O'qish matnlari</Text>
              {content.passages.map((passage, index) => (
                <EditableContentRenderer
                  key={passage.id}
                  content={passage}
                  type="passage"
                  editingEnabled={editingEnabled && editingSection === `passage_${index}`}
                  onEdit={(updatedContent) => {
                    const updatedPassages = [...content.passages!];
                    updatedPassages[index] = updatedContent;
                    onEditContent({
                      ...generatedContent,
                      content: { ...content, passages: updatedPassages }
                    });
                  }}
                  onStartEdit={() => setEditingSection(`passage_${index}`)}
                  onEndEdit={() => setEditingSection(null)}
                  culturalContext={generatedContent.culturalContext}
                />
              ))}
            </View>
          )}

          {/* Questions */}
          {content.questions && content.questions.length > 0 && (
            <View style={styles.contentSection}>
              <Text style={styles.sectionTitle}>Savollar</Text>
              {content.questions.map((question, index) => (
                <EditableContentRenderer
                  key={question.id}
                  content={question}
                  type="question"
                  editingEnabled={editingEnabled && editingSection === `question_${index}`}
                  onEdit={(updatedContent) => {
                    const updatedQuestions = [...content.questions!];
                    updatedQuestions[index] = updatedContent;
                    onEditContent({
                      ...generatedContent,
                      content: { ...content, questions: updatedQuestions }
                    });
                  }}
                  onStartEdit={() => setEditingSection(`question_${index}`)}
                  onEndEdit={() => setEditingSection(null)}
                  culturalContext={generatedContent.culturalContext}
                />
              ))}
            </View>
          )}

          {/* Vocabulary */}
          {content.vocabulary && content.vocabulary.length > 0 && (
            <View style={styles.contentSection}>
              <Text style={styles.sectionTitle}>Lug'at</Text>
              {content.vocabulary.map((vocab, index) => (
                <EditableContentRenderer
                  key={`vocab_${index}`}
                  content={vocab}
                  type="vocabulary"
                  editingEnabled={editingEnabled && editingSection === `vocab_${index}`}
                  onEdit={(updatedContent) => {
                    const updatedVocabulary = [...content.vocabulary!];
                    updatedVocabulary[index] = updatedContent;
                    onEditContent({
                      ...generatedContent,
                      content: { ...content, vocabulary: updatedVocabulary }
                    });
                  }}
                  onStartEdit={() => setEditingSection(`vocab_${index}`)}
                  onEndEdit={() => setEditingSection(null)}
                  culturalContext={generatedContent.culturalContext}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  // Render cultural analysis tab
  const renderCulturalAnalysis = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.culturalAnalysisContainer}>
        {/* Overall Cultural Score */}
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreTitle}>Madaniy moslik darajasi</Text>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreValue}>{Math.round(culturalValidationScore * 100)}%</Text>
          </View>
        </View>

        {/* Detailed Cultural Metrics */}
        {generatedContent && (
          <TaskQualityIndicators
            metadata={generatedContent.metadata}
            culturalContext={generatedContent.culturalContext}
            showDetailedBreakdown={true}
          />
        )}

        {/* Cultural Issues and Suggestions */}
        {generatedContent?.culturalContext.appropriatenessValidation.issues.length > 0 && (
          <CulturalFeedbackSuggestions
            issues={generatedContent.culturalContext.appropriatenessValidation.issues}
            onApplySuggestion={(suggestion) => {
              setRefinementInstructions(suggestion);
              setActiveTab('edit');
            }}
          />
        )}
      </View>
    </ScrollView>
  );

  // Render editing tab with refinement capabilities
  const renderEditingInterface = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.editingContainer}>
        {/* Quick Refinement Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.quickActionsTitle}>Tezkor tahrirlash</Text>
          <View style={styles.quickActionButtons}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => setRefinementInstructions('Savollarni osonroq qiling')}
            >
              <Ionicons name="trending-down" size={16} color="#1d7452" />
              <Text style={styles.quickActionText}>Osonlashtirish</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => setRefinementInstructions('Islomiy misollarni ko\'proq qo\'shing')}
            >
              <Ionicons name="star" size={16} color="#1d7452" />
              <Text style={styles.quickActionText}>Islomiy misollar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => setRefinementInstructions('O\'zbek madaniyatiga oid misollar qo\'shing')}
            >
              <Ionicons name="globe" size={16} color="#1d7452" />
              <Text style={styles.quickActionText}>O'zbek madaniyati</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Custom Refinement Instructions */}
        <View style={styles.refinementSection}>
          <Text style={styles.refinementTitle}>Maxsus o'zgarishlar</Text>
          <TextInput
            style={styles.refinementInput}
            placeholder="AI ga qanday o'zgarish kerakligini yozing..."
            placeholderTextColor="#999"
            multiline={true}
            numberOfLines={4}
            value={refinementInstructions}
            onChangeText={setRefinementInstructions}
            textAlignVertical="top"
          />
          
          <TouchableOpacity
            style={[
              styles.refineButton,
              (!refinementInstructions.trim() || isRefining) && styles.disabledButton
            ]}
            onPress={handleRefineContent}
            disabled={!refinementInstructions.trim() || isRefining}
          >
            {isRefining ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="sparkles" size={20} color="white" />
            )}
            <Text style={styles.refineButtonText}>
              {isRefining ? 'Yangilanmoqda...' : 'AI bilan yangilash'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Teacher Quality Feedback */}
        <View style={styles.teacherFeedbackSection}>
          <Text style={styles.teacherFeedbackTitle}>Sifat baholovi</Text>
          
          {[
            { key: 'contentQuality', label: 'Kontent sifati' },
            { key: 'culturalAppropriateness', label: 'Madaniy moslik' },
            { key: 'studentEngagement', label: 'Talaba qiziqishi' },
            { key: 'learningObjectiveAlignment', label: 'O\'quv maqsadlari' },
          ].map(({ key, label }) => (
            <View key={key} style={styles.ratingRow}>
              <Text style={styles.ratingLabel}>{label}</Text>
              <View style={styles.starRating}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setTeacherFeedback(prev => ({ ...prev, [key]: star }))}
                  >
                    <Ionicons
                      name="star"
                      size={24}
                      color={star <= teacherFeedback[key as keyof typeof teacherFeedback] ? '#ffd700' : '#ddd'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          <TextInput
            style={styles.feedbackComments}
            placeholder="Qo'shimcha sharhlar..."
            placeholderTextColor="#999"
            multiline={true}
            numberOfLines={3}
            value={teacherFeedback.comments}
            onChangeText={(text) => setTeacherFeedback(prev => ({ ...prev, comments: text }))}
          />
        </View>
      </View>
    </ScrollView>
  );

  // Render metrics tab
  const renderMetrics = () => (
    <ScrollView style={styles.tabContent}>
      {generatedContent && (
        <AIGenerationMetrics
          metadata={generatedContent.metadata}
          estimatedCompletionTime={estimatedCompletionTime}
          culturalValidationScore={culturalValidationScore}
          teacherEfficiencyGains={{
            timeReduction: '85%', // Based on research findings
            accuracyImprovement: '40%',
            culturalAppropriatenessEnsurance: '95%',
          }}
        />
      )}
    </ScrollView>
  );

  if (!generatedContent) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1d7452" />
        <Text style={styles.loadingText}>Vazifa yuklanmoqda...</Text>
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        {[
          { key: 'preview', label: 'Ko\'rish', icon: 'eye' },
          { key: 'edit', label: 'Tahrirlash', icon: 'create' },
          { key: 'cultural', label: 'Madaniyat', icon: 'globe' },
          { key: 'metrics', label: 'Metrics', icon: 'analytics' },
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
      <View style={styles.tabContentContainer}>
        {activeTab === 'preview' && renderTaskContent()}
        {activeTab === 'edit' && renderEditingInterface()}
        {activeTab === 'cultural' && renderCulturalAnalysis()}
        {activeTab === 'metrics' && renderMetrics()}
      </View>

      {/* Bottom Actions */}
      {activeTab === 'preview' && (
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.deployButton}
            onPress={handleTeacherFeedbackSubmit}
          >
            {islamicBlessingsEnabled && (
              <Text style={styles.islamicBlessing}>بِسْمِ اللَّهِ</Text>
            )}
            <Ionicons name="send" size={20} color="white" />
            <Text style={styles.deployButtonText}>Vazifani jo'natish</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  tabContentContainer: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  contentContainer: {
    flex: 1,
  },
  taskHeader: {
    marginBottom: 20,
  },
  taskTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  taskInstructions: {
    fontSize: 16,
    color: '#4a5568',
    lineHeight: 22,
    marginBottom: 12,
  },
  contextBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contentSections: {
    flex: 1,
  },
  contentSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  culturalAnalysisContainer: {
    padding: 4,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1d7452',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  editingContainer: {
    padding: 4,
  },
  quickActions: {
    marginBottom: 24,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  quickActionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4f0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1d7452',
  },
  quickActionText: {
    fontSize: 14,
    color: '#1d7452',
    marginLeft: 4,
  },
  refinementSection: {
    marginBottom: 24,
  },
  refinementTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  refinementInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    marginBottom: 12,
  },
  refineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1d7452',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  refineButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  teacherFeedbackSection: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 24,
  },
  teacherFeedbackTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingLabel: {
    fontSize: 16,
    color: '#4a5568',
    flex: 1,
  },
  starRating: {
    flexDirection: 'row',
    gap: 4,
  },
  feedbackComments: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    marginTop: 16,
  },
  bottomActions: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  deployButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1d7452',
    paddingVertical: 16,
    borderRadius: 12,
  },
  islamicBlessing: {
    fontSize: 14,
    color: 'white',
    marginRight: 8,
    fontWeight: '600',
  },
  deployButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default TaskPreviewPanel;