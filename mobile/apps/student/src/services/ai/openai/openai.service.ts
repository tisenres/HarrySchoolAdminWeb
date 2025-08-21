/**
 * openai.service.ts
 * OpenAI API integration service for Harry School Home Tasks
 * Provides text evaluation, content generation, and speech analysis
 */

import { culturalAdaptationService } from '../feedback/culturalAdaptation.service';
import type { StudentAgeGroup } from '../../../navigation/types';

// OpenAI Configuration
interface OpenAIConfig {
  apiKey: string;
  baseURL: string;
  organization?: string;
  project?: string;
}

// Text evaluation types
interface TextEvaluationRequest {
  text: string;
  taskType: 'reading_comprehension' | 'writing_creative' | 'writing_analytical';
  ageGroup: StudentAgeGroup;
  nativeLanguage: 'uz' | 'ru';
  rubric: Record<string, { weight: number; description: string }>;
  culturalContext?: Record<string, any>;
}

interface TextEvaluationResponse {
  overallScore: number;
  rubricScores: Record<string, number>;
  strengths: string[];
  improvements: string[];
  suggestions: string[];
  grammarErrors: GrammarError[];
  vocabularyFeedback: VocabularyFeedback;
  culturalNotes?: string;
  confidence: number;
  teacherReviewRequired: boolean;
}

// Speech evaluation types
interface SpeechEvaluationRequest {
  audioUrl: string;
  taskType: 'speaking_introduction' | 'speaking_conversation' | 'speaking_presentation';
  expectedContent?: string;
  ageGroup: StudentAgeGroup;
  nativeLanguage: 'uz' | 'ru';
  duration: number; // in seconds
}

interface SpeechEvaluationResponse {
  transcription: string;
  confidence: number;
  pronunciationScore: number;
  fluencyScore: number;
  prosodyScore: number;
  mistakes: PronunciationMistake[];
  strengths: string[];
  improvements: string[];
  culturalNotes?: string;
  teacherReviewRequired: boolean;
}

// Content generation types
interface ContentGenerationRequest {
  type: 'quiz_question' | 'writing_prompt' | 'reading_passage' | 'conversation_topic';
  ageGroup: StudentAgeGroup;
  subject: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  culturalContext: {
    nativeLanguage: 'uz' | 'ru';
    localContext: string;
    themes: string[];
  };
  parameters?: Record<string, any>;
}

// Supporting interfaces
interface GrammarError {
  type: string;
  message: string;
  suggestion: string;
  position: { start: number; end: number };
  severity: 'low' | 'medium' | 'high';
  explanation?: string;
}

interface VocabularyFeedback {
  levelAssessment: 'basic' | 'intermediate' | 'advanced';
  strengths: string[];
  suggestions: string[];
  newWords: string[];
  complexWords: string[];
}

interface PronunciationMistake {
  word: string;
  expected: string;
  actual: string;
  phonemeError: string;
  suggestion: string;
  difficultyForUzbeks?: boolean;
  culturalExplanation?: string;
  practiceStrategy?: string;
}

// Cost tracking
interface CostTracker {
  totalTokens: number;
  estimatedCost: number;
  requestCount: number;
  lastReset: Date;
}

class OpenAIService {
  private config: OpenAIConfig;
  private costTracker: CostTracker;
  private readonly MAX_MONTHLY_COST = 0.43; // $0.43 per student per month
  private readonly RATE_LIMITS = {
    textEvaluation: 50, // per hour
    speechEvaluation: 30, // per hour
    contentGeneration: 20, // per hour
  };

  constructor(config: OpenAIConfig) {
    this.config = config;
    this.costTracker = {
      totalTokens: 0,
      estimatedCost: 0,
      requestCount: 0,
      lastReset: new Date(),
    };
  }

  // Text Evaluation using GPT-4
  async evaluateText(request: TextEvaluationRequest): Promise<TextEvaluationResponse> {
    try {
      // Build culturally-sensitive prompt
      const prompt = await this.buildTextEvaluationPrompt(request);
      
      // Mock OpenAI GPT-4 call - replace with actual API call
      const response = await this.mockGPT4Call(prompt, request);
      
      // Apply cultural adaptation
      const adaptedResponse = await culturalAdaptationService.adaptTextFeedback(
        JSON.stringify(response),
        request.ageGroup,
        request.nativeLanguage,
        response.overallScore
      );

      // Update cost tracking
      this.updateCostTracking('text_evaluation', 2500); // Estimated tokens

      return {
        ...response,
        culturalNotes: adaptedResponse,
        confidence: this.calculateConfidence(response),
        teacherReviewRequired: this.requiresTeacherReview(response, request),
      };

    } catch (error) {
      console.error('Text evaluation error:', error);
      throw new Error('Failed to evaluate text');
    }
  }

  // Speech Evaluation using Whisper API
  async evaluateSpeech(request: SpeechEvaluationRequest): Promise<SpeechEvaluationResponse> {
    try {
      // Mock Whisper API transcription
      const transcriptionResponse = await this.mockWhisperCall(request.audioUrl);
      
      // Analyze pronunciation using GPT-4
      const analysisPrompt = await this.buildSpeechAnalysisPrompt(
        transcriptionResponse.transcription,
        request
      );
      
      const analysisResponse = await this.mockGPT4Call(analysisPrompt, request);
      
      // Apply cultural speech adaptation
      const culturallyAdaptedResponse = await culturalAdaptationService.adaptSpeechFeedback(
        analysisResponse,
        request.ageGroup,
        request.nativeLanguage
      );

      // Update cost tracking
      this.updateCostTracking('speech_evaluation', 1800);

      return culturallyAdaptedResponse;

    } catch (error) {
      console.error('Speech evaluation error:', error);
      throw new Error('Failed to evaluate speech');
    }
  }

  // Content Generation using GPT-4
  async generateContent(request: ContentGenerationRequest): Promise<any> {
    try {
      const prompt = await this.buildContentGenerationPrompt(request);
      const response = await this.mockGPT4Call(prompt, request);

      // Update cost tracking
      this.updateCostTracking('content_generation', 1200);

      return response;

    } catch (error) {
      console.error('Content generation error:', error);
      throw new Error('Failed to generate content');
    }
  }

  // Build prompts for different evaluation types
  private async buildTextEvaluationPrompt(request: TextEvaluationRequest): Promise<string> {
    const culturalContext = request.nativeLanguage === 'uz' ? 'Uzbek' : 'Russian';
    const ageContext = this.getAgeContextDescription(request.ageGroup);

    return `
You are an expert English language teacher specializing in evaluating ${ageContext} students whose native language is ${culturalContext}.

STUDENT TEXT TO EVALUATE:
"${request.text}"

EVALUATION CRITERIA:
${Object.entries(request.rubric).map(([key, value]) => 
  `${key.toUpperCase()} (${value.weight}%): ${value.description}`
).join('\n')}

CULTURAL CONTEXT:
- Student's native language: ${culturalContext}
- Age group: ${request.ageGroup}
- Educational context: Uzbekistan private school
- Family values: Education highly valued, respect for teachers

INSTRUCTIONS:
1. Evaluate the text according to the rubric
2. Provide scores (0-100) for each rubric criterion
3. Identify 2-3 key strengths
4. Suggest 2-3 specific improvements appropriate for age group
5. Note any cultural strengths or connections
6. Consider interference patterns from ${culturalContext} language
7. Use encouraging, culturally-sensitive language

RESPONSE FORMAT: JSON with overallScore, rubricScores, strengths, improvements, suggestions, grammarErrors, vocabularyFeedback
    `.trim();
  }

  private async buildSpeechAnalysisPrompt(
    transcription: string, 
    request: SpeechEvaluationRequest
  ): Promise<string> {
    const culturalContext = request.nativeLanguage === 'uz' ? 'Uzbek' : 'Russian';
    const ageContext = this.getAgeContextDescription(request.ageGroup);

    return `
You are a speech analysis expert for ${ageContext} English learners whose native language is ${culturalContext}.

TRANSCRIPTION TO ANALYZE:
"${transcription}"

SPEECH CONTEXT:
- Task type: ${request.taskType}
- Student age: ${request.ageGroup}
- Native language: ${culturalContext}
- Audio duration: ${request.duration} seconds
- Expected content: ${request.expectedContent || 'Open-ended response'}

ANALYSIS FOCUS:
1. Pronunciation accuracy (consider ${culturalContext} interference patterns)
2. Fluency and rhythm
3. Prosody (stress, intonation, pacing)
4. Content appropriateness for age group
5. Cultural sensitivity and personal expression

COMMON ${culturalContext.toUpperCase()} CHALLENGES:
- /θ/ sound (often replaced with /s/ or /f/)
- /w/ sound (often replaced with /v/)
- Word stress patterns
- Linking between words
- Intonation patterns

INSTRUCTIONS:
Provide detailed analysis with specific, actionable feedback appropriate for ${ageContext} learners.
Be encouraging and recognize cultural strengths.
Suggest practice strategies that work well for ${culturalContext} speakers.

RESPONSE FORMAT: JSON with pronunciationScore, fluencyScore, prosodyScore, mistakes, strengths, improvements
    `.trim();
  }

  private async buildContentGenerationPrompt(request: ContentGenerationRequest): Promise<string> {
    const ageContext = this.getAgeContextDescription(request.ageGroup);
    const culturalThemes = request.culturalContext.themes.join(', ');

    return `
Generate ${request.type} for ${ageContext} English learners in Uzbekistan.

REQUIREMENTS:
- Age group: ${request.ageGroup}
- Difficulty: ${request.difficulty}
- Subject: ${request.subject}
- Native language context: ${request.culturalContext.nativeLanguage}
- Cultural themes: ${culturalThemes}
- Local context: ${request.culturalContext.localContext}

CULTURAL SENSITIVITY GUIDELINES:
1. Respect family values and hierarchy
2. Include positive local references (Tashkent, Uzbek culture)
3. Balance global and local perspectives
4. Use age-appropriate complexity
5. Encourage personal expression within cultural norms
6. Avoid topics that might conflict with local values

CONTENT SPECIFICATIONS:
${this.getContentSpecifications(request)}

Generate culturally-appropriate, engaging content that connects to students' lived experiences while advancing English learning goals.
    `.trim();
  }

  private getAgeContextDescription(ageGroup: StudentAgeGroup): string {
    switch (ageGroup) {
      case '10-12': return 'elementary-age (10-12 years old)';
      case '13-15': return 'middle school-age (13-15 years old)';
      case '16-18': return 'high school-age (16-18 years old)';
      default: return 'adolescent';
    }
  }

  private getContentSpecifications(request: ContentGenerationRequest): string {
    switch (request.type) {
      case 'quiz_question':
        return `
- Multiple choice with 4 options
- Include cultural context in examples
- Provide clear explanations
- Age-appropriate vocabulary`;
        
      case 'writing_prompt':
        return `
- 1-2 sentences for elementary, 2-3 for older
- Connect to family/community experiences
- Encourage personal reflection
- Provide vocabulary support hints`;
        
      case 'reading_passage':
        return `
- 100-150 words (elementary), 200-300 (older)
- Include Uzbek cultural elements naturally
- Age-appropriate themes and vocabulary
- Comprehension questions included`;
        
      case 'conversation_topic':
        return `
- Respectful of family values
- Relevant to student experiences
- Promotes meaningful communication
- Includes cultural bridge-building`;
        
      default:
        return 'Follow standard educational content guidelines';
    }
  }

  // Mock API calls - replace with actual OpenAI API integration
  private async mockGPT4Call(prompt: string, context: any): Promise<any> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock response based on context type
    if (context.text || context.taskType?.includes('text')) {
      return this.generateMockTextEvaluation(context);
    } else if (context.transcription || context.taskType?.includes('speech')) {
      return this.generateMockSpeechAnalysis(context);
    } else {
      return this.generateMockContent(context);
    }
  }

  private async mockWhisperCall(audioUrl: string): Promise<{ transcription: string; confidence: number }> {
    // Simulate Whisper API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      transcription: "Hello, my name is Anvar. I live in Tashkent with my family. We have a small house near the bazaar. I like to study English because it helps me talk to people from different countries.",
      confidence: 0.92,
    };
  }

  private generateMockTextEvaluation(context: any): TextEvaluationResponse {
    const isElementary = context.ageGroup === '10-12';
    
    return {
      overallScore: Math.floor(Math.random() * 20) + 75, // 75-95
      rubricScores: {
        grammar: Math.floor(Math.random() * 15) + 80,
        vocabulary: Math.floor(Math.random() * 20) + 70,
        content: Math.floor(Math.random() * 25) + 75,
        organization: Math.floor(Math.random() * 20) + 75,
        cultural_sensitivity: Math.floor(Math.random() * 10) + 85,
      },
      strengths: [
        isElementary ? 'Great use of family words!' : 'Strong vocabulary choices',
        isElementary ? 'Clear ideas about home life' : 'Well-organized thoughts',
        'Good connection to personal experience',
      ],
      improvements: [
        isElementary ? 'Check sentence endings' : 'Review verb tenses',
        isElementary ? 'Add more describing words' : 'Expand supporting details',
      ],
      suggestions: [
        isElementary ? 'Read your writing out loud' : 'Use transition words',
        isElementary ? 'Ask family to listen' : 'Vary sentence length',
      ],
      grammarErrors: [],
      vocabularyFeedback: {
        levelAssessment: isElementary ? 'basic' : 'intermediate',
        strengths: ['Family vocabulary', 'Daily activities'],
        suggestions: ['Time expressions', 'Descriptive adjectives'],
        newWords: [],
        complexWords: [],
      },
      confidence: 0.87,
      teacherReviewRequired: false,
    };
  }

  private generateMockSpeechAnalysis(context: any): any {
    return {
      pronunciationScore: Math.floor(Math.random() * 20) + 75,
      fluencyScore: Math.floor(Math.random() * 25) + 70,
      prosodyScore: Math.floor(Math.random() * 20) + 75,
      mistakes: [
        {
          word: 'three',
          expected: '/θriː/',
          actual: '/friː/',
          phonemeError: 'θ → f',
          suggestion: 'Put tongue between teeth lightly',
        },
      ],
      strengths: [
        'Clear pronunciation of vowels',
        'Good rhythm and pacing',
        'Confident delivery',
      ],
      improvements: [
        'Practice /θ/ sound',
        'Work on word stress',
      ],
    };
  }

  private generateMockContent(context: ContentGenerationRequest): any {
    const isElementary = context.ageGroup === '10-12';
    
    switch (context.type) {
      case 'writing_prompt':
        return {
          prompt: isElementary 
            ? "Write about your favorite meal with your family. What do you eat? Who cooks it? Why do you like it?"
            : "Describe a traditional celebration in your family. Explain its significance and how it brings your family together.",
          vocabulary_support: ['delicious', 'tradition', 'celebration', 'together'],
          cultural_notes: 'Encourage students to share their unique family traditions',
        };
        
      default:
        return {
          content: 'Generated content based on request parameters',
          metadata: { type: context.type, ageGroup: context.ageGroup },
        };
    }
  }

  // Utility methods
  private calculateConfidence(response: any): number {
    // Simple confidence calculation based on score consistency
    if (response.rubricScores) {
      const scores = Object.values(response.rubricScores) as number[];
      const variance = this.calculateVariance(scores);
      return Math.max(0.6, 1 - (variance / 1000)); // Normalize to 0.6-1.0 range
    }
    return 0.8;
  }

  private calculateVariance(scores: number[]): number {
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const squaredDifferences = scores.map(score => Math.pow(score - mean, 2));
    return squaredDifferences.reduce((sum, diff) => sum + diff, 0) / scores.length;
  }

  private requiresTeacherReview(response: any, request: any): boolean {
    // Require teacher review for:
    // 1. Very low scores
    // 2. Cultural sensitivity concerns
    // 3. Elementary students with complex issues
    
    if (response.overallScore < 60) return true;
    if (request.ageGroup === '10-12' && response.overallScore < 70) return true;
    if (response.culturalNotes && response.culturalNotes.includes('concern')) return true;
    
    return false;
  }

  private updateCostTracking(operation: string, estimatedTokens: number): void {
    this.costTracker.totalTokens += estimatedTokens;
    this.costTracker.requestCount += 1;
    
    // Rough cost estimation (GPT-4: $0.03/1K tokens, Whisper: $0.006/minute)
    const costPerToken = operation === 'speech_evaluation' ? 0.0001 : 0.00003;
    this.costTracker.estimatedCost += estimatedTokens * costPerToken;
    
    // Reset monthly if needed
    const now = new Date();
    if (now.getMonth() !== this.costTracker.lastReset.getMonth()) {
      this.resetMonthlyCost();
    }
  }

  private resetMonthlyCost(): void {
    this.costTracker = {
      totalTokens: 0,
      estimatedCost: 0,
      requestCount: 0,
      lastReset: new Date(),
    };
  }

  // Public cost monitoring
  public getCostStatus(): { 
    currentCost: number; 
    remainingBudget: number; 
    utilizationPercentage: number;
    requestCount: number;
  } {
    return {
      currentCost: this.costTracker.estimatedCost,
      remainingBudget: Math.max(0, this.MAX_MONTHLY_COST - this.costTracker.estimatedCost),
      utilizationPercentage: (this.costTracker.estimatedCost / this.MAX_MONTHLY_COST) * 100,
      requestCount: this.costTracker.requestCount,
    };
  }

  // Check if operation is within budget
  public canPerformOperation(operation: string): boolean {
    const estimatedCost = {
      text_evaluation: 0.075, // ~$0.075 per evaluation
      speech_evaluation: 0.05, // ~$0.05 per evaluation
      content_generation: 0.036, // ~$0.036 per generation
    };

    const operationCost = estimatedCost[operation as keyof typeof estimatedCost] || 0.05;
    return (this.costTracker.estimatedCost + operationCost) <= this.MAX_MONTHLY_COST;
  }
}

// Export service instance
export const openaiService = new OpenAIService({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || 'mock-key-for-development',
  baseURL: 'https://api.openai.com/v1',
  organization: process.env.EXPO_PUBLIC_OPENAI_ORG_ID,
  project: process.env.EXPO_PUBLIC_OPENAI_PROJECT_ID,
});

// Export types
export type {
  TextEvaluationRequest,
  TextEvaluationResponse,
  SpeechEvaluationRequest,
  SpeechEvaluationResponse,
  ContentGenerationRequest,
  GrammarError,
  VocabularyFeedback,
  PronunciationMistake,
};