/**
 * React Native Hooks for Harry School AI Services
 * Easy-to-use hooks for AI integration in mobile apps
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  TaskType, 
  DifficultyLevel, 
  CulturalContext, 
  IslamicValue,
  LanguageCode,
  UseAIServiceOptions,
  UseAIServiceReturn,
  AIServiceError,
} from '../types';
import { harrySchoolAI } from '../index';

// Hook for generating educational tasks
export function useTaskGeneration(options?: UseAIServiceOptions): {
  generateTask: (params: {
    taskType: TaskType;
    topic: string;
    difficultyLevel: DifficultyLevel;
    culturalContext?: CulturalContext;
    islamicValues?: IslamicValue[];
    language?: LanguageCode;
    customInstructions?: string;
  }) => Promise<any>;
  data: any;
  loading: boolean;
  error: AIServiceError | null;
} {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AIServiceError | null>(null);
  const abortController = useRef<AbortController | null>(null);

  const generateTask = useCallback(async (params: any) => {
    try {
      setLoading(true);
      setError(null);
      abortController.current = new AbortController();

      const result = await harrySchoolAI.generateEducationalTask(params);
      
      setData(result);
      options?.onSuccess?.(result);
      
      return result;
    } catch (err) {
      const aiError: AIServiceError = {
        code: 'TASK_GENERATION_ERROR',
        message: err instanceof Error ? err.message : 'Failed to generate task',
        details: err,
        retryable: true,
      };
      
      setError(aiError);
      options?.onError?.(aiError);
      throw aiError;
    } finally {
      setLoading(false);
    }
  }, [options]);

  const cancel = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    generateTask,
    data,
    loading,
    error,
  };
}

// Hook for speech evaluation
export function useSpeechEvaluation(options?: UseAIServiceOptions): {
  evaluateSpeech: (params: {
    audioUri: string;
    expectedText: string;
    language?: LanguageCode;
    studentId?: string;
    culturalContext?: CulturalContext;
  }) => Promise<any>;
  data: any;
  loading: boolean;
  error: AIServiceError | null;
} {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AIServiceError | null>(null);

  const evaluateSpeech = useCallback(async (params: any) => {
    try {
      setLoading(true);
      setError(null);

      const result = await harrySchoolAI.evaluateSpeech(params);
      
      setData(result);
      options?.onSuccess?.(result);
      
      return result;
    } catch (err) {
      const aiError: AIServiceError = {
        code: 'SPEECH_EVALUATION_ERROR',
        message: err instanceof Error ? err.message : 'Failed to evaluate speech',
        details: err,
        retryable: true,
      };
      
      setError(aiError);
      options?.onError?.(aiError);
      throw aiError;
    } finally {
      setLoading(false);
    }
  }, [options]);

  return {
    evaluateSpeech,
    data,
    loading,
    error,
  };
}

// Hook for cultural content validation
export function useCulturalValidation(options?: UseAIServiceOptions): {
  validateContent: (content: any, context?: CulturalContext) => Promise<any>;
  data: any;
  loading: boolean;
  error: AIServiceError | null;
} {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AIServiceError | null>(null);

  const validateContent = useCallback(async (content: any, context?: CulturalContext) => {
    try {
      setLoading(true);
      setError(null);

      const result = await harrySchoolAI.validateCulturalContent(content, context);
      
      setData(result);
      options?.onSuccess?.(result);
      
      return result;
    } catch (err) {
      const aiError: AIServiceError = {
        code: 'CULTURAL_VALIDATION_ERROR',
        message: err instanceof Error ? err.message : 'Failed to validate content',
        details: err,
        retryable: true,
      };
      
      setError(aiError);
      options?.onError?.(aiError);
      throw aiError;
    } finally {
      setLoading(false);
    }
  }, [options]);

  return {
    validateContent,
    data,
    loading,
    error,
  };
}

// Hook for AI usage analytics
export function useAIAnalytics(): {
  analytics: any;
  loading: boolean;
  error: AIServiceError | null;
  refreshAnalytics: (timeframe?: { start: string; end: string }) => Promise<void>;
} {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AIServiceError | null>(null);

  const refreshAnalytics = useCallback(async (timeframe?: { start: string; end: string }) => {
    try {
      setLoading(true);
      setError(null);

      const result = await harrySchoolAI.getUsageAnalytics(timeframe);
      setAnalytics(result);
    } catch (err) {
      const aiError: AIServiceError = {
        code: 'ANALYTICS_ERROR',
        message: err instanceof Error ? err.message : 'Failed to get analytics',
        details: err,
        retryable: true,
      };
      
      setError(aiError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAnalytics();
  }, [refreshAnalytics]);

  return {
    analytics,
    loading,
    error,
    refreshAnalytics,
  };
}

// Hook for managing AI service initialization
export function useAIService(): {
  isInitialized: boolean;
  isInitializing: boolean;
  error: AIServiceError | null;
  initialize: () => Promise<void>;
} {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<AIServiceError | null>(null);

  const initialize = useCallback(async () => {
    try {
      setIsInitializing(true);
      setError(null);

      await harrySchoolAI.initialize();
      setIsInitialized(true);
    } catch (err) {
      const aiError: AIServiceError = {
        code: 'INITIALIZATION_ERROR',
        message: err instanceof Error ? err.message : 'Failed to initialize AI service',
        details: err,
        retryable: true,
      };
      
      setError(aiError);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    isInitialized,
    isInitializing,
    error,
    initialize,
  };
}

// Hook for real-time transcription
export function useRealtimeTranscription(options?: {
  language?: LanguageCode;
  onTranscription?: (text: string) => void;
  onError?: (error: Error) => void;
}): {
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  transcript: string;
  error: AIServiceError | null;
} {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<AIServiceError | null>(null);
  const transcriptionController = useRef<any>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setTranscript('');

      const { whisperService } = await import('../whisper.service');
      
      transcriptionController.current = await whisperService.startRealtimeTranscription({
        targetLanguage: options?.language || 'en',
        onTranscription: (text: string) => {
          setTranscript(prev => prev + ' ' + text);
          options?.onTranscription?.(text);
        },
        onError: (err: Error) => {
          const aiError: AIServiceError = {
            code: 'TRANSCRIPTION_ERROR',
            message: err.message,
            details: err,
            retryable: true,
          };
          setError(aiError);
          options?.onError?.(err);
        },
      });

      setIsRecording(true);
    } catch (err) {
      const aiError: AIServiceError = {
        code: 'RECORDING_START_ERROR',
        message: err instanceof Error ? err.message : 'Failed to start recording',
        details: err,
        retryable: true,
      };
      setError(aiError);
    }
  }, [options]);

  const stopRecording = useCallback(async () => {
    try {
      if (transcriptionController.current) {
        await transcriptionController.current.stop();
        transcriptionController.current = null;
      }
      setIsRecording(false);
    } catch (err) {
      const aiError: AIServiceError = {
        code: 'RECORDING_STOP_ERROR',
        message: err instanceof Error ? err.message : 'Failed to stop recording',
        details: err,
        retryable: false,
      };
      setError(aiError);
    }
  }, []);

  const pauseRecording = useCallback(() => {
    if (transcriptionController.current) {
      transcriptionController.current.pause();
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (transcriptionController.current) {
      transcriptionController.current.resume();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (transcriptionController.current) {
        transcriptionController.current.stop();
      }
    };
  }, []);

  return {
    isRecording,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    transcript,
    error,
  };
}

// Hook for batch operations
export function useBatchOperations(): {
  generateMultipleTasks: (requests: any[]) => Promise<any[]>;
  transcribeMultipleAudio: (requests: any[]) => Promise<any[]>;
  loading: boolean;
  progress: number;
  error: AIServiceError | null;
} {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<AIServiceError | null>(null);

  const generateMultipleTasks = useCallback(async (requests: any[]) => {
    try {
      setLoading(true);
      setError(null);
      setProgress(0);

      const { openaiService } = await import('../openai.service');
      
      const results = [];
      for (let i = 0; i < requests.length; i++) {
        const result = await openaiService.generateTask(requests[i]);
        results.push(result);
        setProgress((i + 1) / requests.length * 100);
      }

      return results;
    } catch (err) {
      const aiError: AIServiceError = {
        code: 'BATCH_GENERATION_ERROR',
        message: err instanceof Error ? err.message : 'Failed to generate tasks',
        details: err,
        retryable: true,
      };
      setError(aiError);
      throw aiError;
    } finally {
      setLoading(false);
      setProgress(0);
    }
  }, []);

  const transcribeMultipleAudio = useCallback(async (requests: any[]) => {
    try {
      setLoading(true);
      setError(null);
      setProgress(0);

      const { whisperService } = await import('../whisper.service');
      
      const results = await whisperService.transcribeMultipleAudio(requests);
      
      return results;
    } catch (err) {
      const aiError: AIServiceError = {
        code: 'BATCH_TRANSCRIPTION_ERROR',
        message: err instanceof Error ? err.message : 'Failed to transcribe audio files',
        details: err,
        retryable: true,
      };
      setError(aiError);
      throw aiError;
    } finally {
      setLoading(false);
      setProgress(0);
    }
  }, []);

  return {
    generateMultipleTasks,
    transcribeMultipleAudio,
    loading,
    progress,
    error,
  };
}

// Export all hooks
export default {
  useTaskGeneration,
  useSpeechEvaluation,
  useCulturalValidation,
  useAIAnalytics,
  useAIService,
  useRealtimeTranscription,
  useBatchOperations,
};