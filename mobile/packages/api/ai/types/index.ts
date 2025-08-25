/**
 * TypeScript Types for AI Services
 * Harry School CRM - Mobile AI Services
 */

// Base AI Service Types
export interface AIServiceConfig {
  apiKey: string;
  organizationId?: string;
  timeout?: number;
  maxRetries?: number;
  baseURL?: string;
}

// Cultural and Islamic Values Types
export type CulturalContext = 'islamic' | 'uzbekistan' | 'multicultural' | 'western' | 'general';

export type IslamicValue = 
  | 'tawhid'    // Unity and oneness of Allah
  | 'akhlaq'    // Islamic moral character
  | 'adl'       // Justice and fairness
  | 'hikmah'    // Wisdom and knowledge
  | 'taqwa'     // God-consciousness
  | 'ihsan'     // Excellence in worship and conduct
  | 'ummah'     // Community and brotherhood
  | 'halal';    // Permissible and lawful

export type TaskType = 
  | 'quiz'
  | 'reading'
  | 'vocabulary'
  | 'writing'
  | 'listening'
  | 'speaking'
  | 'grammar'
  | 'conversation';

export type DifficultyLevel = 1 | 2 | 3 | 4 | 5; // Beginner to Advanced

export type LanguageCode = 'en' | 'uz' | 'ru' | 'ar';

// OpenAI Service Types
export interface TaskGenerationRequest {
  taskType: TaskType;
  parameters: {
    topic: string;
    difficultyLevel: DifficultyLevel;
    culturalContext: CulturalContext;
    islamicValues?: IslamicValue[];
    languagePreference: LanguageCode;
    targetAge?: string;
    estimatedDuration?: string;
    complexity: number;
    contentLength: number;
    requiresStructuredOutput: boolean;
    customInstructions?: string;
  };
}

export interface TaskGenerationResult {
  taskId: string;
  content: any; // Structured content based on task type
  metadata: {
    model: string;
    tokensUsed: number;
    generationTime: number;
    culturalScore: number;
  };
  culturalValidation: CulturalValidationResult;
}

export interface ContentEvaluationRequest {
  content: any;
  evaluationCriteria: {
    educational: boolean;
    cultural: boolean;
    linguistic: boolean;
    engagement: boolean;
  };
  targetAudience?: {
    age?: string;
    difficultyLevel?: DifficultyLevel;
    culturalContext?: CulturalContext;
  };
}

export interface ContentEvaluationResult {
  evaluationId: string;
  scores: {
    educational: number;   // 0-100
    cultural: number;      // 0-100
    linguistic: number;    // 0-100
    engagement: number;    // 0-100
  };
  feedback: string;
  recommendations: string[];
  metadata: {
    model: string;
    tokensUsed: number;
    evaluationTime: number;
  };
}

export interface CulturalValidationRequest {
  content: any;
  culturalContext: CulturalContext;
  islamicValues: IslamicValue[];
  strictMode?: boolean; // More rigorous validation
}

export interface CulturalValidationResult {
  validationId: string;
  isAppropriate: boolean;
  culturalScore: number;    // 0-100
  islamicAlignment: number; // 0-100
  concerns: string[];
  recommendations: string[];
  metadata: {
    model: string;
    tokensUsed: number;
    validationTime: number;
  };
}

// Whisper Service Types
export interface TranscriptionRequest {
  audioUri: string;
  expectedLanguage?: LanguageCode;
  options?: {
    context?: 'educational' | 'pronunciation' | 'conversation' | 'reading';
    processing?: AudioProcessingOptions;
    forceRefresh?: boolean;
    enhanceQuality?: boolean;
  };
}

export interface TranscriptionResult {
  transcriptionId: string;
  text: string;
  language: string;
  confidence: number;        // 0-100
  duration: number;          // in seconds
  segments?: AudioSegment[];
  languageDetection: LanguageDetectionResult;
  metadata: {
    model: string;
    processingTime: number;
    audioFormat: string;
    fileSize: number;
  };
  culturalContext: {
    culturalRelevance: number;
    islamicContent: boolean;
    uzbekistanContext: boolean;
    recommendations: string[];
  };
}

export interface PronunciationEvaluationRequest {
  audioUri: string;
  expectedText: string;
  targetLanguage: LanguageCode;
  options?: {
    strictMode?: boolean;
    culturalContext?: CulturalContext;
    focusAreas?: ('accuracy' | 'fluency' | 'clarity' | 'intonation')[];
  };
}

export interface PronunciationEvaluationResult {
  evaluationId: string;
  transcribedText: string;
  expectedText: string;
  accuracy: number;          // 0-100
  fluency: number;           // 0-100
  clarity: number;           // 0-100
  wordAccuracy: Array<{
    word: string;
    accuracy: number;
    feedback: string;
  }>;
  phonemeAnalysis: Array<{
    phoneme: string;
    accuracy: number;
    examples: string[];
  }>;
  feedback: {
    overall: string;
    strengths: string[];
    improvements: string[];
    culturalTips: string[];
  };
  recommendations: string[];
  culturalNotes: string[];
  metadata: {
    targetLanguage: LanguageCode;
    evaluationTime: number;
    audioQuality: number;
    processingModel: string;
  };
}

export interface AudioProcessingOptions {
  enhanceForSpeech?: boolean;
  normalizeVolume?: boolean;
  reduceNoise?: boolean;
  trimSilence?: boolean;
  targetSampleRate?: number;
  targetFormat?: 'wav' | 'mp3' | 'm4a';
}

export interface AudioSegment {
  id: number;
  start: number;    // in seconds
  end: number;      // in seconds
  text: string;
  confidence?: number;
  words?: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
  }>;
}

export interface LanguageDetectionResult {
  detectedLanguage: string;
  confidence: number;
  supportedLanguages: string[];
}

// Caching and Performance Types
export interface CacheOptions {
  ttl?: number;          // Time to live in seconds
  priority?: 'low' | 'normal' | 'high';
  tags?: string[];      // For cache invalidation
  compression?: boolean;
}

export interface CacheResult<T> {
  data: T;
  metadata: {
    cacheHit: boolean;
    cacheKey: string;
    timestamp: number;
    ttl: number;
  };
}

// Error Handling Types
export interface AIServiceError {
  code: string;
  message: string;
  details?: any;
  retryable?: boolean;
  culturalContext?: string;
}

export interface ErrorRecoveryOptions {
  maxRetries?: number;
  backoffStrategy?: 'linear' | 'exponential';
  fallbackContent?: any;
  notifyUser?: boolean;
}

// Usage Analytics Types
export interface UsageStatistics {
  totalRequests: number;
  totalTokensUsed: number;
  estimatedCost: number;
  averageResponseTime: number;
  successRate: number;
  popularTaskTypes: Record<TaskType, number>;
  culturalContextBreakdown: Record<CulturalContext, number>;
  languageBreakdown: Record<LanguageCode, number>;
  timeframe: {
    start: number;
    end: number;
  };
}

// Supabase Integration Types
export interface AIContentRecord {
  id: string;
  organization_id: string;
  task_type: TaskType;
  content: any;
  metadata: any;
  cultural_context: CulturalContext;
  islamic_values: IslamicValue[];
  language: LanguageCode;
  difficulty_level: DifficultyLevel;
  usage_count: number;
  rating: number;
  created_at: string;
  created_by: string;
  updated_at: string;
  deleted_at?: string;
}

export interface SpeechEvaluationRecord {
  id: string;
  organization_id: string;
  student_id: string;
  audio_uri: string;
  transcription: string;
  expected_text: string;
  accuracy_score: number;
  fluency_score: number;
  clarity_score: number;
  feedback: any;
  cultural_notes: string[];
  language: LanguageCode;
  created_at: string;
}

export interface AIPromptTemplate {
  id: string;
  name: string;
  task_type: TaskType;
  template: string;
  parameters: any;
  cultural_context: CulturalContext;
  islamic_values: IslamicValue[];
  usage_count: number;
  effectiveness_rating: number;
  created_at: string;
  updated_at: string;
}

// React Native Hooks Types
export interface UseAIServiceOptions {
  enableCaching?: boolean;
  cacheOptions?: CacheOptions;
  errorRecovery?: ErrorRecoveryOptions;
  onSuccess?: (result: any) => void;
  onError?: (error: AIServiceError) => void;
  onProgress?: (progress: number) => void;
}

export interface UseAIServiceReturn<T> {
  data: T | null;
  loading: boolean;
  error: AIServiceError | null;
  refetch: () => Promise<void>;
  cancel: () => void;
}

// Mobile-Specific Types
export interface MobileAIConfig {
  offlineMode?: boolean;
  backgroundProcessing?: boolean;
  batteryOptimization?: boolean;
  networkOptimization?: boolean;
  cacheStrategy?: 'aggressive' | 'balanced' | 'minimal';
}

export interface OfflineTask {
  id: string;
  type: TaskType;
  request: any;
  priority: 'low' | 'normal' | 'high';
  createdAt: number;
  retryCount: number;
  maxRetries: number;
}

// Configuration Types
export interface AIServiceEnvironment {
  openaiApiKey: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseSecretKey?: string;
  organizationId: string;
  environment: 'development' | 'staging' | 'production';
  features: {
    culturalValidation: boolean;
    speechEvaluation: boolean;
    offlineSupport: boolean;
    analytics: boolean;
  };
}

// Export utility types
export type Awaited<T> = T extends PromiseLike<infer U> ? U : T;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];