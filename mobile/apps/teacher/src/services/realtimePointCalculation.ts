import { supabase } from '../utils/supabase';

// Types for real-time point calculations
interface FeedbackData {
  studentId: string;
  templateId?: string;
  content: string;
  voiceTranscript?: string;
  islamicValues: string[];
  culturalScore: number;
  languagePreference: 'uz' | 'ru' | 'en';
  completionTimeMs: number;
}

interface PointCalculationResult {
  feedbackId: string;
  pointsAwarded: number;
  islamicValuesBonus: number;
  culturalCelebrationTriggered: boolean;
  celebrationType?: string;
  calculationTimeMs: number;
}

interface CulturalCelebration {
  id: string;
  studentId: string;
  celebrationType: string;
  islamicValuesCategory: string;
  pointsMilestone: number;
  celebrationData: {
    animation: string;
    sound: string;
    duration: number;
  };
}

interface PointsUpdateNotification {
  studentId: string;
  pointsBefore: number;
  pointsAfter: number;
  islamicValuesBonus: number;
  celebrationTriggered: boolean;
  celebrationType?: string;
}

export class RealtimePointCalculationService {
  private subscriptions: { [key: string]: any } = {};
  
  /**
   * Submit feedback with real-time point calculation
   * This triggers the database function that automatically calculates points
   */
  async submitFeedback(feedbackData: FeedbackData): Promise<PointCalculationResult> {
    const startTime = Date.now();
    
    try {
      // Insert feedback entry - this will trigger point calculation automatically
      const { data: feedback, error: feedbackError } = await supabase
        .from('feedback_entries')
        .insert({
          organization_id: await this.getCurrentOrganizationId(),
          to_user_id: feedbackData.studentId,
          feedback_type: 'teacher_feedback',
          title: 'Teacher Feedback',
          content: feedbackData.content,
          rating: 5, // Default rating
          points_awarded: 10, // Base points - will be recalculated by trigger
          template_used_id: feedbackData.templateId,
          islamic_values_categories: feedbackData.islamicValues,
          cultural_context: {
            language_preference: feedbackData.languagePreference,
            cultural_score: feedbackData.culturalScore,
            voice_transcript: feedbackData.voiceTranscript,
            completion_time_ms: feedbackData.completionTimeMs,
          },
          completion_time_ms: feedbackData.completionTimeMs,
          created_by: await this.getCurrentUserId(),
        })
        .select('id, points_awarded, celebration_triggered')
        .single();
        
      if (feedbackError) {
        throw new Error(`Failed to submit feedback: ${feedbackError.message}`);
      }
      
      // Get the point calculation result
      const { data: pointCalculation, error: calculationError } = await supabase
        .from('feedback_point_calculations')
        .select('*')
        .eq('feedback_entry_id', feedback.id)
        .single();
        
      if (calculationError) {
        console.warn('Point calculation not found, using default values');
      }
      
      const result: PointCalculationResult = {
        feedbackId: feedback.id,
        pointsAwarded: feedback.points_awarded,
        islamicValuesBonus: pointCalculation?.islamic_values_bonus || 0,
        culturalCelebrationTriggered: pointCalculation?.cultural_celebration_triggered || false,
        celebrationType: pointCalculation?.celebration_type,
        calculationTimeMs: Date.now() - startTime,
      };
      
      return result;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  }
  
  /**
   * Subscribe to real-time point updates for a student
   */
  subscribeToStudentPointUpdates(
    studentId: string,
    onUpdate: (notification: PointsUpdateNotification) => void
  ): string {
    const subscriptionKey = `points_${studentId}`;
    
    // Subscribe to point calculations for this student
    const subscription = supabase
      .channel(`student_points:${studentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'feedback_point_calculations',
          filter: `student_id=eq.${studentId}`,
        },
        (payload) => {
          const calculation = payload.new;
          onUpdate({
            studentId: calculation.student_id,
            pointsBefore: calculation.points_before,
            pointsAfter: calculation.points_after,
            islamicValuesBonus: calculation.islamic_values_bonus,
            celebrationTriggered: calculation.cultural_celebration_triggered,
            celebrationType: calculation.celebration_type,
          });
        }
      )
      .subscribe();
    
    this.subscriptions[subscriptionKey] = subscription;
    return subscriptionKey;
  }
  
  /**
   * Subscribe to cultural celebrations
   */
  subscribeToCulturalCelebrations(
    onCelebration: (celebration: CulturalCelebration) => void
  ): string {
    const subscriptionKey = 'cultural_celebrations';
    
    const subscription = supabase
      .channel('cultural_celebrations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cultural_celebrations',
        },
        (payload) => {
          const celebrationData = payload.new;
          onCelebration({
            id: celebrationData.id,
            studentId: celebrationData.student_id,
            celebrationType: celebrationData.celebration_type,
            islamicValuesCategory: celebrationData.islamic_values_category,
            pointsMilestone: celebrationData.points_milestone,
            celebrationData: celebrationData.celebration_data,
          });
        }
      )
      .subscribe();
    
    this.subscriptions[subscriptionKey] = subscription;
    return subscriptionKey;
  }
  
  /**
   * Get current student points with real-time updates
   */
  async getStudentPoints(studentId: string): Promise<{
    currentPoints: number;
    recentAwards: Array<{
      feedbackId: string;
      pointsAwarded: number;
      islamicValuesBonus: number;
      timestamp: string;
      celebrationTriggered: boolean;
    }>;
    rankingPosition?: number;
  }> {
    try {
      // Get current points from student rankings
      const { data: ranking } = await supabase
        .from('student_rankings')
        .select('total_points, position')
        .eq('student_id', studentId)
        .single();
      
      // Get recent point awards
      const { data: recentCalculations } = await supabase
        .from('feedback_point_calculations')
        .select(`
          feedback_entry_id,
          points_awarded,
          islamic_values_bonus,
          cultural_celebration_triggered,
          created_at
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      return {
        currentPoints: ranking?.total_points || 0,
        rankingPosition: ranking?.position,
        recentAwards: (recentCalculations || []).map(calc => ({
          feedbackId: calc.feedback_entry_id,
          pointsAwarded: calc.points_awarded,
          islamicValuesBonus: calc.islamic_values_bonus,
          timestamp: calc.created_at,
          celebrationTriggered: calc.cultural_celebration_triggered,
        })),
      };
    } catch (error) {
      console.error('Error getting student points:', error);
      return {
        currentPoints: 0,
        recentAwards: [],
      };
    }
  }
  
  /**
   * Get feedback templates optimized for quick completion
   */
  async getQuickFeedbackSuggestions(
    studentId: string,
    context: {
      subject?: string;
      feedbackType?: string;
    } = {}
  ): Promise<Array<{
    templateId: string;
    title: string;
    content: string;
    islamicValues: string[];
    culturalAppropriatenessLevel: number;
    estimatedCompletionTimeMs: number;
    efficiencyScore: number;
  }>> {
    try {
      const { data, error } = await supabase.rpc(
        'get_quick_feedback_suggestions',
        {
          p_teacher_id: await this.getCurrentUserId(),
          p_student_id: studentId,
          p_context: context,
        }
      );
      
      if (error) {
        console.error('Error getting suggestions:', error);
        // Fallback to regular template query
        return this.getFallbackTemplates();
      }
      
      return (data || []).map((suggestion: any) => ({
        templateId: suggestion.template_id,
        title: suggestion.template_title,
        content: suggestion.template_content,
        islamicValues: suggestion.islamic_values_categories || [],
        culturalAppropriatenessLevel: suggestion.cultural_appropriateness_level,
        estimatedCompletionTimeMs: suggestion.estimated_completion_time_ms,
        efficiencyScore: suggestion.efficiency_score,
      }));
    } catch (error) {
      console.error('Error getting feedback suggestions:', error);
      return this.getFallbackTemplates();
    }
  }
  
  /**
   * Calculate point impact preview for real-time feedback
   */
  calculatePointImpactPreview(
    basePoints: number,
    islamicValues: string[],
    culturalScore: number
  ): {
    basePoints: number;
    islamicValuesBonus: number;
    culturalBonus: number;
    totalPoints: number;
    breakdown: Array<{
      source: string;
      points: number;
      reason: string;
    }>;
  } {
    let islamicValuesBonus = 0;
    let culturalBonus = 0;
    
    // Islamic values bonus calculation
    if (islamicValues.length > 0) {
      const bonusPerValue = islamicValues.includes('akhlaq') ? 5 : 3;
      islamicValuesBonus = islamicValues.length * bonusPerValue;
    }
    
    // Cultural appropriateness bonus
    if (culturalScore > 0.9) {
      culturalBonus = 3;
    } else if (culturalScore > 0.8) {
      culturalBonus = 2;
    }
    
    const totalPoints = basePoints + islamicValuesBonus + culturalBonus;
    
    const breakdown = [
      {
        source: 'Base Points',
        points: basePoints,
        reason: 'Standard feedback points',
      },
    ];
    
    if (islamicValuesBonus > 0) {
      breakdown.push({
        source: 'Islamic Values',
        points: islamicValuesBonus,
        reason: `Bonus for ${islamicValues.length} Islamic values`,
      });
    }
    
    if (culturalBonus > 0) {
      breakdown.push({
        source: 'Cultural Appropriateness',
        points: culturalBonus,
        reason: `High cultural sensitivity (${Math.round(culturalScore * 100)}%)`,
      });
    }
    
    return {
      basePoints,
      islamicValuesBonus,
      culturalBonus,
      totalPoints,
      breakdown: breakdown.filter(item => item.points > 0),
    };
  }
  
  /**
   * Unsubscribe from real-time updates
   */
  unsubscribe(subscriptionKey: string): void {
    const subscription = this.subscriptions[subscriptionKey];
    if (subscription) {
      subscription.unsubscribe();
      delete this.subscriptions[subscriptionKey];
    }
  }
  
  /**
   * Unsubscribe from all real-time updates
   */
  unsubscribeAll(): void {
    Object.keys(this.subscriptions).forEach(key => {
      this.unsubscribe(key);
    });
  }
  
  // Helper methods
  private async getCurrentUserId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    return user.id;
  }
  
  private async getCurrentOrganizationId(): Promise<string> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', await this.getCurrentUserId())
      .single();
    
    if (!profile?.organization_id) {
      throw new Error('User organization not found');
    }
    
    return profile.organization_id;
  }
  
  private async getFallbackTemplates(): Promise<Array<{
    templateId: string;
    title: string;
    content: string;
    islamicValues: string[];
    culturalAppropriatenessLevel: number;
    estimatedCompletionTimeMs: number;
    efficiencyScore: number;
  }>> {
    try {
      const { data: templates } = await supabase
        .from('feedback_templates')
        .select('*')
        .eq('organization_id', await this.getCurrentOrganizationId())
        .eq('is_active', true)
        .eq('quick_completion_optimized', true)
        .order('teacher_efficiency_score', { ascending: false })
        .limit(3);
      
      return (templates || []).map(template => ({
        templateId: template.id,
        title: template.title_template,
        content: template.content_template,
        islamicValues: template.islamic_values_framework?.categories || [],
        culturalAppropriatenessLevel: template.cultural_appropriateness_level || 3,
        estimatedCompletionTimeMs: 25000, // Default 25 seconds
        efficiencyScore: template.teacher_efficiency_score || 4.0,
      }));
    } catch (error) {
      console.error('Error getting fallback templates:', error);
      return [];
    }
  }
}

// Export singleton instance
export const realtimePointCalculation = new RealtimePointCalculationService();