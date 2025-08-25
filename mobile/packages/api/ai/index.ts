/**
 * Harry School AI Services - Complete Integration
 * Comprehensive AI services for educational content generation and speech processing
 * 
 * Based on Spring AI integration patterns and enterprise-grade caching strategies
 */

// Core Services
export { openaiService, type OpenAIService } from './openai.service';
export { whisperService, type WhisperService } from './whisper.service';
export { supabaseAIService, type SupabaseAIService } from './supabase-ai.service';
export { memoryCacheService, createMemoryCache, type MemoryCacheService } from './cache/memory-cache.service';

// Prompt Templates and Configuration
export {
  SystemPrompts,
  TaskPromptTemplates,
  PromptEnhancers,
  PromptValidator,
  CulturalContexts,
  IslamicValues,
  TaskTypes,
  DifficultyLevels,
  type CulturalContext,
  type IslamicValue,
  type TaskType,
  type DifficultyLevel,
} from './prompts/taskGeneration';

// Types and Interfaces
export * from './types';

// Configuration
export interface HarrySchoolAIConfig {
  openai: {
    apiKey: string;
    organization?: string;
    timeout?: number;
    maxRetries?: number;
  };
  supabase: {
    url: string;
    anonKey: string;
    secretKey?: string;
  };
  cache: {
    enabled: boolean;
    defaultTTL: number;
    maxSize?: number;
  };
  cultural: {
    defaultContext: CulturalContext;
    islamicValues: IslamicValue[];
    strictValidation: boolean;
  };
  mobile: {
    offlineMode: boolean;
    backgroundProcessing: boolean;
    batteryOptimization: boolean;
  };
}

// Main AI Service Factory
export class HarrySchoolAIService {
  private static instance: HarrySchoolAIService;
  private config: HarrySchoolAIConfig;
  private isInitialized = false;

  private constructor(config: HarrySchoolAIConfig) {
    this.config = config;
  }

  public static getInstance(config?: HarrySchoolAIConfig): HarrySchoolAIService {
    if (!HarrySchoolAIService.instance && config) {
      HarrySchoolAIService.instance = new HarrySchoolAIService(config);
    }
    return HarrySchoolAIService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize cache service
      if (this.config.cache.enabled) {
        await memoryCacheService.optimizeCache();
      }

      // Test AI service connections
      await this.testServices();

      this.isInitialized = true;
      console.log('Harry School AI Services initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Harry School AI Services:', error);
      throw error;
    }
  }

  // High-level AI methods for common use cases
  public async generateEducationalTask(params: {
    taskType: TaskType;
    topic: string;
    difficultyLevel: DifficultyLevel;
    culturalContext?: CulturalContext;
    islamicValues?: IslamicValue[];
    language?: 'en' | 'uz' | 'ru' | 'ar';
    customInstructions?: string;
  }) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const request = {
      taskType: params.taskType,
      parameters: {
        topic: params.topic,
        difficultyLevel: params.difficultyLevel,
        culturalContext: params.culturalContext || this.config.cultural.defaultContext,
        islamicValues: params.islamicValues || this.config.cultural.islamicValues,
        languagePreference: params.language || 'en',
        customInstructions: params.customInstructions,
        complexity: params.difficultyLevel * 2,
        contentLength: 1000,
        requiresStructuredOutput: true,
      },
    };

    // Check cache first
    const cached = await memoryCacheService.getCachedTaskGeneration(
      params.taskType,
      request.parameters
    );

    if (cached) {
      return cached;
    }

    // Generate new content
    const result = await openaiService.generateTask(request);

    // Cache the result
    await memoryCacheService.cacheTaskGeneration(
      params.taskType,
      request.parameters,
      result,
      this.config.cache.defaultTTL
    );

    // Store in Supabase
    await supabaseAIService.saveGeneratedContent({
      organizationId: this.getOrganizationId(),
      taskType: params.taskType,
      content: result.content,
      metadata: result.metadata,
      culturalContext: request.parameters.culturalContext,
      islamicValues: request.parameters.islamicValues,
      language: request.parameters.languagePreference,
      difficultyLevel: params.difficultyLevel,
      createdBy: this.getCurrentUserId(),
    });

    return result;
  }

  public async evaluateSpeech(params: {
    audioUri: string;
    expectedText: string;
    language?: 'en' | 'uz' | 'ru' | 'ar';
    studentId?: string;
    culturalContext?: CulturalContext;
  }) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const language = params.language || 'en';
    const audioHash = this.generateAudioHash(params.audioUri);

    // Check cache
    const cached = await memoryCacheService.getCachedTranscription(audioHash, language);
    
    let transcriptionResult;
    if (cached) {
      transcriptionResult = cached;
    } else {
      // Transcribe audio
      transcriptionResult = await whisperService.transcribeAudio({
        audioUri: params.audioUri,
        expectedLanguage: language,
        options: {
          context: 'pronunciation',
          processing: {
            enhanceForSpeech: true,
            normalizeVolume: true,
          },
        },
      });

      // Cache transcription
      await memoryCacheService.cacheTranscription(
        audioHash,
        language,
        transcriptionResult,
        7200 // 2 hours
      );
    }

    // Evaluate pronunciation
    const evaluationResult = await whisperService.evaluatePronunciation({
      audioUri: params.audioUri,
      expectedText: params.expectedText,
      targetLanguage: language,
      options: {
        strictMode: false,
        culturalContext: params.culturalContext || this.config.cultural.defaultContext,
      },
    });

    // Store in Supabase
    if (params.studentId) {
      await supabaseAIService.saveSpeechEvaluation({
        organizationId: this.getOrganizationId(),
        studentId: params.studentId,
        teacherId: this.getCurrentUserId(),
        audioUri: params.audioUri,
        transcription: transcriptionResult.text,
        expectedText: params.expectedText,
        accuracyScore: evaluationResult.accuracy,
        fluencyScore: evaluationResult.fluency,
        clarityScore: evaluationResult.clarity,
        feedback: evaluationResult.feedback,
        culturalNotes: evaluationResult.culturalNotes,
        language: language,
        processingTimeMs: Date.now() - transcriptionResult.metadata.processingTime,
      });
    }

    return {
      transcription: transcriptionResult,
      evaluation: evaluationResult,
    };
  }

  public async validateCulturalContent(content: any, context?: CulturalContext) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const culturalContext = context || this.config.cultural.defaultContext;
    const contentHash = this.generateContentHash(content);

    // Check cache
    const cached = await memoryCacheService.getCachedCulturalValidation(
      contentHash,
      culturalContext
    );

    if (cached) {
      return cached;
    }

    // Perform validation
    const result = await openaiService.validateCultural({
      content,
      culturalContext,
      islamicValues: this.config.cultural.islamicValues,
      strictMode: this.config.cultural.strictValidation,
    });

    // Cache result
    await memoryCacheService.cacheCulturalValidation(
      contentHash,
      culturalContext,
      result,
      86400 // 24 hours
    );

    return result;
  }

  public async getUsageAnalytics(timeframe?: { start: string; end: string }) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const [aiStats, cacheStats] = await Promise.all([
      supabaseAIService.getUsageStatistics({
        organizationId: this.getOrganizationId(),
        startDate: timeframe?.start,
        endDate: timeframe?.end,
      }),
      memoryCacheService.getCacheStatistics(),
    ]);

    return {
      ai: aiStats,
      cache: cacheStats,
      efficiency: this.calculateEfficiency(aiStats, cacheStats),
    };
  }

  // Utility methods
  private async testServices(): Promise<void> {
    try {
      // Test OpenAI service
      await openaiService.getUsageStatistics();
      
      // Test Supabase connection
      await supabaseAIService.getUsageStatistics({
        organizationId: this.getOrganizationId(),
      });

      console.log('All AI services tested successfully');
    } catch (error) {
      console.error('Service test failed:', error);
      throw new Error('AI service initialization failed');
    }
  }

  private generateAudioHash(audioUri: string): string {
    // Simple hash generation for audio files
    return `audio_${audioUri.split('/').pop()}_${Date.now()}`;
  }

  private generateContentHash(content: any): string {
    // Simple hash generation for content
    const contentString = JSON.stringify(content);
    let hash = 0;
    for (let i = 0; i < contentString.length; i++) {
      const char = contentString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private getOrganizationId(): string {
    // This would be provided by the app's authentication context
    return '550e8400-e29b-41d4-a716-446655440000'; // Default Harry School org ID
  }

  private getCurrentUserId(): string {
    // This would be provided by the app's authentication context
    return 'current-user-id';
  }

  private calculateEfficiency(aiStats: any, cacheStats: any): number {
    if (!aiStats.totalRequests || !cacheStats.totalNodes) {
      return 0;
    }
    
    // Calculate cache hit rate as efficiency metric
    return cacheStats.cacheHitRate || 0;
  }
}

// Default configuration for Harry School
export const defaultHarrySchoolConfig: HarrySchoolAIConfig = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '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',
    timeout: 30000,
    maxRetries: 3,
  },
  supabase: {
    url: process.env.SUPABASE_URL || 'https://jhewccuoxjxdzyytvosc.supabase.co',
    anonKey: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZXdjY3VveGp4ZHp5eXR2b3NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTIzNjUsImV4cCI6MjA2ODY2ODM2NX0.FIpEjUftHXFc0YF_Ji5OR6rgfoZsQjINBtK2gWHrYUw',
    secretKey: process.env.SUPABASE_SECRET_KEY,
  },
  cache: {
    enabled: true,
    defaultTTL: 3600, // 1 hour
    maxSize: 1000,
  },
  cultural: {
    defaultContext: 'islamic',
    islamicValues: ['tawhid', 'akhlaq', 'adl', 'hikmah', 'taqwa'],
    strictValidation: true,
  },
  mobile: {
    offlineMode: true,
    backgroundProcessing: false,
    batteryOptimization: true,
  },
};

// Export the singleton instance factory
export const createHarrySchoolAI = (config?: Partial<HarrySchoolAIConfig>) => {
  const finalConfig = { ...defaultHarrySchoolConfig, ...config };
  return HarrySchoolAIService.getInstance(finalConfig);
};

// Export default instance
export const harrySchoolAI = createHarrySchoolAI();

// Export for React Native hooks
export * from './hooks';

export default {
  HarrySchoolAIService,
  createHarrySchoolAI,
  harrySchoolAI,
  defaultHarrySchoolConfig,
};