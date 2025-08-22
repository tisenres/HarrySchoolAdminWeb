/**
 * Supabase AI Service Integration
 * Harry School CRM - AI Content Storage and Analytics
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  AIContentRecord, 
  SpeechEvaluationRecord, 
  UsageStatistics,
  TaskType,
  CulturalContext,
  IslamicValue,
  LanguageCode,
  DifficultyLevel
} from './types';

// Environment configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jhewccuoxjxdzyytvosc.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZXdjY3VveGp4ZHp5eXR2b3NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTIzNjUsImV4cCI6MjA2ODY2ODM2NX0.FIpEjUftHXFc0YF_Ji5OR6rgfoZsQjINBtK2gWHrYUw';
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZXdjY3VveGp4ZHp5eXR2b3NjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA5MjM2NSwiZXhwIjoyMDY4NjY4MzY1fQ.W3syweMAiSDnL8TQLcEw7mpDwFSbok9SZnF0KiGS06g';

class SupabaseAIService {
  private supabase: SupabaseClient;
  private adminClient: SupabaseClient;

  constructor() {
    // Standard client for regular operations
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Admin client for administrative operations
    this.adminClient = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
  }

  // AI Generated Content Management
  async saveGeneratedContent(data: {
    organizationId: string;
    taskType: TaskType;
    content: any;
    metadata: any;
    culturalContext: CulturalContext;
    islamicValues: IslamicValue[];
    language: LanguageCode;
    difficultyLevel: DifficultyLevel;
    createdBy: string;
  }): Promise<AIContentRecord> {
    try {
      const { data: result, error } = await this.supabase
        .from('ai_generated_tasks')
        .insert({
          organization_id: data.organizationId,
          task_type: data.taskType,
          content: data.content,
          generation_parameters: data.metadata,
          cultural_context: data.culturalContext,
          islamic_values_categories: data.islamicValues,
          language_complexity: data.language,
          difficulty_level: data.difficultyLevel,
          created_by: data.createdBy,
          title: data.content.title || `${data.taskType} Task`,
          instructions: data.content.instructions || '',
          ai_model_used: data.metadata.model || 'gpt-4o',
          tokens_used: data.metadata.tokensUsed || 0,
          generation_cost: data.metadata.estimatedCost || 0,
          generation_time_ms: data.metadata.processingTime || 0,
          estimated_duration_minutes: 30,
          cultural_validation_score: data.metadata.culturalScore || 85,
          cultural_validation_details: { validated: true },
          factual_accuracy_score: 90,
          educational_value_score: 88,
          islamic_values_alignment_score: data.metadata.culturalScore || 85,
          deployment_status: 'draft',
          assigned_to_groups: [],
          assigned_to_students: [],
          allow_late_submissions: true,
          prayer_time_awareness: true,
          islamic_holiday_consideration: true,
          parent_notification_settings: {},
          submission_count: 0,
          completion_rate: 0,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to save AI content: ${error.message}`);
      }

      return this.mapToAIContentRecord(result);
    } catch (error) {
      console.error('Error saving AI generated content:', error);
      throw error;
    }
  }

  async getGeneratedContent(params: {
    organizationId: string;
    taskType?: TaskType;
    culturalContext?: CulturalContext;
    difficultyLevel?: DifficultyLevel;
    limit?: number;
    offset?: number;
  }): Promise<{ data: AIContentRecord[]; count: number }> {
    try {
      let query = this.supabase
        .from('ai_generated_tasks')
        .select('*', { count: 'exact' })
        .eq('organization_id', params.organizationId)
        .order('created_at', { ascending: false });

      if (params.taskType) {
        query = query.eq('task_type', params.taskType);
      }

      if (params.culturalContext) {
        query = query.eq('cultural_context', params.culturalContext);
      }

      if (params.difficultyLevel) {
        query = query.eq('difficulty_level', params.difficultyLevel);
      }

      if (params.limit) {
        query = query.limit(params.limit);
      }

      if (params.offset) {
        query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Failed to fetch AI content: ${error.message}`);
      }

      return {
        data: data?.map(item => this.mapToAIContentRecord(item)) || [],
        count: count || 0,
      };
    } catch (error) {
      console.error('Error fetching AI generated content:', error);
      throw error;
    }
  }

  async updateContentRating(contentId: string, rating: number, feedback?: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('ai_generated_tasks')
        .update({
          teacher_satisfaction_score: rating,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contentId);

      if (error) {
        throw new Error(`Failed to update content rating: ${error.message}`);
      }

      // Log the feedback if provided
      if (feedback) {
        await this.logContentFeedback(contentId, rating, feedback);
      }
    } catch (error) {
      console.error('Error updating content rating:', error);
      throw error;
    }
  }

  // Speech Evaluation Management
  async saveSpeechEvaluation(data: {
    organizationId: string;
    studentId: string;
    teacherId?: string;
    audioUri: string;
    transcription: string;
    expectedText: string;
    accuracyScore: number;
    fluencyScore: number;
    clarityScore: number;
    feedback: any;
    culturalNotes: string[];
    language: LanguageCode;
    processingTimeMs?: number;
  }): Promise<SpeechEvaluationRecord> {
    try {
      const { data: result, error } = await this.supabase
        .from('ai_task_submissions')
        .insert({
          organization_id: data.organizationId,
          student_id: data.studentId,
          teacher_id: data.teacherId,
          audio_uri: data.audioUri,
          transcription: data.transcription,
          expected_text: data.expectedText,
          accuracy_score: data.accuracyScore,
          fluency_score: data.fluencyScore,
          clarity_score: data.clarityScore,
          feedback: data.feedback,
          cultural_notes: data.culturalNotes,
          language: data.language,
          processing_time_ms: data.processingTimeMs,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to save speech evaluation: ${error.message}`);
      }

      return this.mapToSpeechEvaluationRecord(result);
    } catch (error) {
      console.error('Error saving speech evaluation:', error);
      throw error;
    }
  }

  async getStudentSpeechEvaluations(params: {
    studentId: string;
    language?: LanguageCode;
    limit?: number;
    offset?: number;
  }): Promise<SpeechEvaluationRecord[]> {
    try {
      let query = this.supabase
        .from('ai_task_submissions')
        .select('*')
        .eq('student_id', params.studentId)
        .not('audio_uri', 'is', null)
        .order('created_at', { ascending: false });

      if (params.language) {
        query = query.eq('language', params.language);
      }

      if (params.limit) {
        query = query.limit(params.limit);
      }

      if (params.offset) {
        query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch speech evaluations: ${error.message}`);
      }

      return data?.map(item => this.mapToSpeechEvaluationRecord(item)) || [];
    } catch (error) {
      console.error('Error fetching speech evaluations:', error);
      throw error;
    }
  }

  // Analytics and Usage Tracking
  async trackAIUsage(data: {
    organizationId: string;
    serviceType: 'openai' | 'whisper';
    operationType: string;
    tokensUsed?: number;
    estimatedCost: number;
    responseTimeMs: number;
    success: boolean;
    errorCode?: string;
    culturalContext?: CulturalContext;
    language?: LanguageCode;
    taskType?: TaskType;
    userId?: string;
  }): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('ai_cost_tracking')
        .insert({
          organization_id: data.organizationId,
          service_type: data.serviceType,
          operation_type: data.operationType,
          tokens_used: data.tokensUsed,
          estimated_cost: data.estimatedCost,
          response_time_ms: data.responseTimeMs,
          success: data.success,
          error_code: data.errorCode,
          cultural_context: data.culturalContext,
          language: data.language,
          task_type: data.taskType,
          user_id: data.userId,
        });

      if (error) {
        throw new Error(`Failed to track AI usage: ${error.message}`);
      }
    } catch (error) {
      console.error('Error tracking AI usage:', error);
      // Don't throw error for analytics - log and continue
    }
  }

  async getUsageStatistics(params: {
    organizationId: string;
    startDate?: string;
    endDate?: string;
    serviceType?: 'openai' | 'whisper';
  }): Promise<UsageStatistics> {
    try {
      let query = this.supabase
        .from('ai_cost_tracking')
        .select('*')
        .eq('organization_id', params.organizationId);

      if (params.startDate) {
        query = query.gte('created_at', params.startDate);
      }

      if (params.endDate) {
        query = query.lte('created_at', params.endDate);
      }

      if (params.serviceType) {
        query = query.eq('service_type', params.serviceType);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch usage statistics: ${error.message}`);
      }

      return this.calculateUsageStatistics(data || []);
    } catch (error) {
      console.error('Error fetching usage statistics:', error);
      throw error;
    }
  }

  // Caching Functions
  async getCachedContent(cacheKey: string): Promise<any | null> {
    try {
      const { data, error } = await this.supabase
        .from('ai_content_cache')
        .select('content, expires_at')
        .eq('cache_key', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        return null;
      }

      // Update access count and last accessed
      await this.supabase
        .from('ai_content_cache')
        .update({
          access_count: 1, // This would be incremented in a real implementation
          last_accessed_at: new Date().toISOString(),
        })
        .eq('cache_key', cacheKey);

      return data.content;
    } catch (error) {
      console.error('Error getting cached content:', error);
      return null;
    }
  }

  async setCachedContent(
    cacheKey: string,
    content: any,
    contentType: string,
    ttlSeconds: number = 3600,
    culturalContext?: CulturalContext,
    language?: LanguageCode
  ): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

      const { error } = await this.supabase
        .from('ai_content_cache')
        .upsert({
          cache_key: cacheKey,
          content,
          content_type: contentType,
          cultural_context: culturalContext,
          language,
          expires_at: expiresAt.toISOString(),
          access_count: 0,
          last_accessed_at: new Date().toISOString(),
        });

      if (error) {
        throw new Error(`Failed to cache content: ${error.message}`);
      }
    } catch (error) {
      console.error('Error caching content:', error);
      // Don't throw error for caching - log and continue
    }
  }

  async clearExpiredCache(): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('ai_content_cache')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) {
        throw new Error(`Failed to clear expired cache: ${error.message}`);
      }
    } catch (error) {
      console.error('Error clearing expired cache:', error);
    }
  }

  // Template Management
  async getPromptTemplates(params: {
    organizationId: string;
    taskType?: TaskType;
    culturalContext?: CulturalContext;
    isActive?: boolean;
  }): Promise<any[]> {
    try {
      let query = this.supabase
        .from('ai_task_templates')
        .select('*')
        .eq('organization_id', params.organizationId);

      if (params.taskType) {
        query = query.eq('task_type', params.taskType);
      }

      if (params.culturalContext) {
        query = query.eq('cultural_context', params.culturalContext);
      }

      if (params.isActive !== undefined) {
        query = query.eq('is_active', params.isActive);
      }

      const { data, error } = await query.order('effectiveness_rating', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch prompt templates: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching prompt templates:', error);
      throw error;
    }
  }

  // Error Logging
  async logError(data: {
    organizationId?: string;
    serviceType: string;
    operationType: string;
    errorCode: string;
    errorMessage: string;
    errorDetails?: any;
    context?: any;
    userId?: string;
  }): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('ai_evaluation_logs')
        .insert({
          organization_id: data.organizationId,
          service_type: data.serviceType,
          operation_type: data.operationType,
          error_code: data.errorCode,
          error_message: data.errorMessage,
          error_details: data.errorDetails,
          context: data.context,
          user_id: data.userId,
          resolved: false,
        });

      if (error) {
        console.error('Failed to log error:', error);
      }
    } catch (error) {
      console.error('Error logging error:', error);
      // Don't throw error for logging - continue
    }
  }

  // Private helper methods
  private mapToAIContentRecord(data: any): AIContentRecord {
    return {
      id: data.id,
      organization_id: data.organization_id,
      task_type: data.task_type,
      content: data.content,
      metadata: data.generation_parameters || {},
      cultural_context: data.cultural_context,
      islamic_values: data.islamic_values_categories || [],
      language: data.language_complexity,
      difficulty_level: data.difficulty_level,
      usage_count: data.submission_count || 0,
      rating: data.teacher_satisfaction_score || 0,
      created_at: data.created_at,
      created_by: data.created_by,
      updated_at: data.updated_at,
    };
  }

  private mapToSpeechEvaluationRecord(data: any): SpeechEvaluationRecord {
    return {
      id: data.id,
      organization_id: data.organization_id,
      student_id: data.student_id,
      audio_uri: data.audio_uri,
      transcription: data.transcription,
      expected_text: data.expected_text,
      accuracy_score: data.accuracy_score,
      fluency_score: data.fluency_score,
      clarity_score: data.clarity_score,
      feedback: data.feedback,
      cultural_notes: data.cultural_notes || [],
      language: data.language,
      created_at: data.created_at,
    };
  }

  private calculateUsageStatistics(data: any[]): UsageStatistics {
    const total = data.length;
    const successful = data.filter(item => item.success).length;
    const totalTokens = data.reduce((sum, item) => sum + (item.tokens_used || 0), 0);
    const totalCost = data.reduce((sum, item) => sum + (item.estimated_cost || 0), 0);
    const totalResponseTime = data.reduce((sum, item) => sum + (item.response_time_ms || 0), 0);

    const taskTypeBreakdown = data.reduce((acc, item) => {
      if (item.task_type) {
        acc[item.task_type] = (acc[item.task_type] || 0) + 1;
      }
      return acc;
    }, {});

    const culturalBreakdown = data.reduce((acc, item) => {
      if (item.cultural_context) {
        acc[item.cultural_context] = (acc[item.cultural_context] || 0) + 1;
      }
      return acc;
    }, {});

    const languageBreakdown = data.reduce((acc, item) => {
      if (item.language) {
        acc[item.language] = (acc[item.language] || 0) + 1;
      }
      return acc;
    }, {});

    return {
      totalRequests: total,
      totalTokensUsed: totalTokens,
      estimatedCost: totalCost,
      averageResponseTime: total > 0 ? totalResponseTime / total : 0,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      popularTaskTypes: taskTypeBreakdown,
      culturalContextBreakdown: culturalBreakdown,
      languageBreakdown: languageBreakdown,
      timeframe: {
        start: data.length > 0 ? new Date(data[data.length - 1].created_at).getTime() : Date.now(),
        end: data.length > 0 ? new Date(data[0].created_at).getTime() : Date.now(),
      },
    };
  }

  private async logContentFeedback(contentId: string, rating: number, feedback: string): Promise<void> {
    try {
      await this.supabase
        .from('ai_evaluation_logs')
        .insert({
          content_id: contentId,
          rating,
          feedback,
          type: 'content_feedback',
          created_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Error logging content feedback:', error);
    }
  }
}

// Export singleton instance
export const supabaseAIService = new SupabaseAIService();
export default supabaseAIService;