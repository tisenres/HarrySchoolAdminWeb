import { BaseService } from './base-service'
import type {
  FeedbackEntry,
  FeedbackTemplate,
  FeedbackSubmission,
  FeedbackSummary,
  TeacherFeedbackOverview,
  StudentFeedbackOverview,
  FeedbackListResponse,
  FeedbackFilters,
  FeedbackAnalytics,
  FeedbackRankingImpact,
  BulkFeedbackRequest,
  FeedbackFormData
} from '@/types/feedback'

export class FeedbackService extends BaseService {
  constructor() {
    super('feedback_entries')
  }

  /**
   * Submit feedback from one user to another
   */
  async submitFeedback(submission: FeedbackSubmission): Promise<FeedbackEntry> {
    // Check permissions - any authenticated user can submit feedback
    await this.checkPermission(['superadmin', 'admin', 'teacher', 'student'])
    
    const currentUser = await this.getCurrentUser()
    const organizationId = await this.getCurrentOrganization()

    // Validate feedback submission
    this.validateFeedbackSubmission(submission)

    // Prevent self-feedback
    if (currentUser.id === submission.to_user_id) {
      throw new Error('Cannot submit feedback to yourself')
    }

    // Calculate ranking points impact based on rating and category
    const rankingPointsImpact = this.calculateRankingImpact(submission.rating, submission.category, submission.to_user_type)

    const feedbackData = {
      ...submission,
      organization_id: organizationId,
      from_user_id: submission.is_anonymous ? null : currentUser.id,
      from_user_type: 'student', // TODO: Determine based on current user profile
      affects_ranking: submission.affects_ranking ?? true,
      ranking_points_impact: rankingPointsImpact,
      status: 'active' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(feedbackData)
      .select(`
        *,
        from_user_profile:from_user_id(full_name, avatar_url),
        to_user_profile:to_user_id(full_name, avatar_url),
        group:group_id(id, name, subject)
      `)
      .single()

    if (error) throw error

    // Log activity for audit trail
    await this.logActivity(
      'feedback_submitted',
      data.id,
      'feedback_entry',
      null,
      data,
      `Feedback submitted to ${submission.to_user_type}: ${submission.message.substring(0, 50)}...`
    )

    // If affects ranking, create corresponding points transaction
    if (submission.affects_ranking && rankingPointsImpact > 0) {
      await this.createFeedbackPointsTransaction(data)
    }

    return data
  }

  /**
   * Get feedback for a specific user (received or given)
   */
  async getFeedbackForUser(
    userId: string,
    direction: 'received' | 'given',
    filters?: FeedbackFilters,
    pagination: { page: number; limit: number } = { page: 1, limit: 20 }
  ): Promise<FeedbackListResponse> {
    await this.checkPermission(['superadmin', 'admin', 'teacher'])
    
    const organizationId = await this.getCurrentOrganization()

    let query = this.supabase
      .from(this.tableName)
      .select(`
        *,
        from_user_profile:from_user_id(full_name, avatar_url),
        to_user_profile:to_user_id(full_name, avatar_url),
        group:group_id(id, name, subject),
        responded_by_profile:responded_by(full_name, avatar_url)
      `, { count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('status', 'active')

    // Apply direction filter
    if (direction === 'received') {
      query = query.eq('to_user_id', userId)
    } else {
      query = query.eq('from_user_id', userId)
    }

    // Apply additional filters
    if (filters) {
      if (filters.category?.length) {
        query = query.in('category', filters.category)
      }
      if (filters.rating_min !== undefined) {
        query = query.gte('rating', filters.rating_min)
      }
      if (filters.rating_max !== undefined) {
        query = query.lte('rating', filters.rating_max)
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from)
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to)
      }
      if (filters.group_id) {
        query = query.eq('group_id', filters.group_id)
      }
      if (filters.is_anonymous !== undefined) {
        query = query.eq('is_anonymous', filters.is_anonymous)
      }
    }

    // Apply sorting and pagination
    query = this.applySorting(query, 'created_at', 'desc')
    query = this.applyPagination(query, pagination.page, pagination.limit)

    const { data, error, count } = await query

    if (error) throw error

    return {
      data: data || [],
      count: count || 0,
      total_pages: Math.ceil((count || 0) / pagination.limit),
      current_page: pagination.page
    }
  }

  /**
   * Get comprehensive feedback summary for a teacher
   */
  async getTeacherFeedbackOverview(teacherId: string): Promise<TeacherFeedbackOverview> {
    await this.checkPermission(['superadmin', 'admin', 'teacher'])
    
    const organizationId = await this.getCurrentOrganization()

    // Use optimized feedback summary function for better performance
    const [summaryResult, recentFeedbackResult] = await Promise.all([
      this.supabase.rpc('get_user_feedback_summary_optimized', {
        p_user_id: teacherId,
        p_user_type: 'teacher',
        p_organization_id: organizationId
      }),
      this.supabase.rpc('get_recent_feedback_for_profile', {
        p_user_id: teacherId,
        p_user_type: 'teacher',
        p_organization_id: organizationId,
        p_limit: 10
      })
    ])

    if (summaryResult.error) throw summaryResult.error
    if (recentFeedbackResult.error) throw recentFeedbackResult.error

    const summary = summaryResult.data?.[0] || {}
    const recentFeedback = recentFeedbackResult.data || []

    return {
      summary: {
        total_received: summary.feedback_count || 0,
        total_given: 0, // Would need separate query for given feedback
        average_rating_received: summary.average_rating || 0,
        average_rating_given: 0,
        recent_count: summary.recent_feedback_count || 0,
        category_breakdown: [],
        monthly_trends: [],
        ranking_impact: {
          total_points_from_feedback: summary.total_points || 0,
          ranking_position_change: 0,
          quality_score_impact: 0,
          efficiency_impact: 0
        }
      },
      recent_feedback: recentFeedback,
      feedback_trends: [],
      student_engagement: {
        total_students_providing_feedback: 0,
        feedback_frequency: 0,
        response_rate: 0
      },
      improvement_areas: []
    }
  }

  /**
   * Get comprehensive feedback summary for a student
   */
  async getStudentFeedbackOverview(studentId: string): Promise<StudentFeedbackOverview> {
    await this.checkPermission(['superadmin', 'admin', 'teacher'])
    
    const organizationId = await this.getCurrentOrganization()

    // Get feedback statistics using RPC function
    const { data: stats, error } = await this.supabase
      .rpc('get_student_feedback_overview', {
        student_id: studentId,
        organization_id: organizationId
      })

    if (error) throw error

    // Get recent feedback given and received
    const [feedbackGiven, feedbackReceived] = await Promise.all([
      this.getFeedbackForUser(studentId, 'given', undefined, { page: 1, limit: 5 }),
      this.getFeedbackForUser(studentId, 'received', undefined, { page: 1, limit: 5 })
    ])

    return {
      feedback_given: {
        total_submitted: feedbackGiven.count,
        recent_submissions: feedbackGiven.data,
        engagement_score: stats?.engagement_score || 0,
        categories_covered: stats?.categories_covered || []
      },
      feedback_received: {
        total_received: feedbackReceived.count,
        average_rating: stats?.average_rating_received || 0,
        recent_feedback: feedbackReceived.data,
        improvement_suggestions: stats?.improvement_suggestions || []
      },
      ranking_impact: stats?.ranking_impact || {
        points_from_engagement: 0,
        quality_bonus: 0,
        feedback_streaks: 0
      }
    }
  }

  /**
   * Update feedback status (admin only)
   */
  async updateFeedbackStatus(feedbackId: string, status: FeedbackEntry['status']): Promise<FeedbackEntry> {
    await this.checkPermission(['superadmin', 'admin'])
    
    const currentUser = await this.getCurrentUser()

    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', feedbackId)
      .select('*')
      .single()

    if (error) throw error

    await this.logActivity(
      'feedback_status_updated',
      feedbackId,
      'feedback_entry',
      { status: 'active' },
      { status },
      `Feedback status updated to: ${status}`
    )

    return data
  }

  /**
   * Add admin response to feedback
   */
  async addAdminResponse(feedbackId: string, response: string): Promise<FeedbackEntry> {
    await this.checkPermission(['superadmin', 'admin'])
    
    const currentUser = await this.getCurrentUser()

    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({
        admin_response: response,
        responded_by: currentUser.id,
        responded_at: new Date().toISOString(),
        status: 'reviewed'
      })
      .eq('id', feedbackId)
      .select('*')
      .single()

    if (error) throw error

    await this.logActivity(
      'feedback_responded',
      feedbackId,
      'feedback_entry',
      null,
      { admin_response: response },
      `Admin response added to feedback`
    )

    return data
  }

  /**
   * Get feedback statistics for organization analytics
   */
  async getFeedbackStatistics(userId?: string): Promise<FeedbackAnalytics | any> {
    await this.checkPermission(['superadmin', 'admin'])
    
    const organizationId = await this.getCurrentOrganization()

    // Use optimized analytics function for better performance
    const { data, error } = await this.supabase
      .rpc('get_feedback_analytics_summary_optimized', {
        p_organization_id: organizationId,
        p_user_type: null,
        p_days_back: 30
      })

    if (error) throw error

    const stats = data?.[0] || {}

    return {
      organization_overview: {
        total_feedback_entries: stats.total_feedback_count || 0,
        average_rating: stats.average_rating || 0,
        feedback_velocity: 0, // Could be calculated from daily analytics
        response_rate: 0
      },
      teacher_insights: {
        highest_rated_teachers: [],
        improvement_opportunities: []
      },
      student_insights: {
        most_engaged_students: [],
        feedback_quality_leaders: []
      },
      category_performance: [],
      correlation_insights: {
        feedback_to_performance: 0,
        feedback_to_retention: 0,
        feedback_to_engagement: 0
      }
    }
  }

  /**
   * Get available feedback templates
   */
  async getFeedbackTemplates(direction: 'student_to_teacher' | 'teacher_to_student'): Promise<FeedbackTemplate[]> {
    const organizationId = await this.getCurrentOrganization()

    const { data, error } = await this.supabase
      .from('feedback_templates')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('feedback_direction', direction)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('template_name')

    if (error) throw error

    return data || []
  }

  /**
   * Submit bulk feedback using templates
   */
  async submitBulkFeedback(request: BulkFeedbackRequest): Promise<{ success: number; errors: string[] }> {
    await this.checkPermission(['superadmin', 'admin', 'teacher'])

    const results = {
      success: 0,
      errors: [] as string[]
    }

    for (const recipientId of request.recipient_ids) {
      try {
        await this.submitFeedback({
          ...request.feedback_data,
          to_user_id: recipientId,
          to_user_type: request.recipient_type
        })
        results.success++
      } catch (error) {
        results.errors.push(`Failed to submit feedback to ${recipientId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return results
  }

  /**
   * Flag inappropriate feedback
   */
  async flagFeedback(feedbackId: string, reason: string): Promise<FeedbackEntry> {
    await this.checkPermission(['superadmin', 'admin'])
    
    const currentUser = await this.getCurrentUser()

    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({
        status: 'flagged',
        admin_response: `Flagged: ${reason}`,
        responded_by: currentUser.id,
        responded_at: new Date().toISOString()
      })
      .eq('id', feedbackId)
      .select('*')
      .single()

    if (error) throw error

    return data
  }

  /**
   * Get ranking impact from feedback for a user
   */
  async getRankingImpactFromFeedback(userId: string, userType: 'student' | 'teacher' = 'student'): Promise<FeedbackRankingImpact> {
    const organizationId = await this.getCurrentOrganization()

    // Use optimized ranking impact calculation function
    const { data: impactData, error } = await this.supabase
      .rpc('calculate_feedback_ranking_impact_optimized', {
        p_user_id: userId,
        p_user_type: userType,
        p_organization_id: organizationId,
        p_days_back: 30
      })

    if (error) throw error

    const impact = impactData?.[0] || {}

    // Get detailed feedback data for category breakdown (using optimized query)
    const { data: feedbackData } = await this.supabase
      .from(this.tableName)
      .select('rating, feedback_type, points_awarded')
      .eq('to_user_id', userId)
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(100) // Limit for performance

    // Calculate category breakdown from recent feedback
    const categoryBreakdown = feedbackData?.reduce((acc, fb) => {
      const category = fb.feedback_type || 'general'
      if (!acc[category]) {
        acc[category] = { total: 0, count: 0, points: 0 }
      }
      acc[category].total += fb.rating
      acc[category].count += 1
      acc[category].points += fb.points_awarded || 0
      return acc
    }, {} as Record<string, { total: number; count: number; points: number }>) || {}

    return {
      total_points: impact.total_feedback_points || 0,
      average_rating: feedbackData?.length > 0 
        ? feedbackData.reduce((sum, fb) => sum + fb.rating, 0) / feedbackData.length 
        : 0,
      feedback_count: feedbackData?.length || 0,
      category_breakdown: Object.entries(categoryBreakdown).map(([category, data]) => ({
        category,
        average_rating: data.total / data.count,
        count: data.count,
        points_impact: data.points
      }))
    }
  }

  /**
   * Bulk update feedback status
   */
  async bulkUpdateFeedbackStatus(feedbackIds: string[], status: FeedbackEntry['status']): Promise<{ success: number; errors: string[] }> {
    await this.checkPermission(['superadmin', 'admin'])

    const results = {
      success: 0,
      errors: [] as string[]
    }

    for (const feedbackId of feedbackIds) {
      try {
        await this.updateFeedbackStatus(feedbackId, status)
        results.success++
      } catch (error) {
        results.errors.push(`Failed to update feedback ${feedbackId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return results
  }

  // Private helper methods

  private validateFeedbackSubmission(submission: FeedbackSubmission): void {
    if (!submission.message?.trim()) {
      throw new Error('Feedback message is required')
    }
    if (!submission.to_user_id?.trim()) {
      throw new Error('Recipient is required')
    }
    if (submission.rating < 1 || submission.rating > 5) {
      throw new Error('Rating must be between 1 and 5')
    }
    if (!submission.category?.trim()) {
      throw new Error('Category is required')
    }
  }

  private calculateRankingImpact(rating: number, category: string, userType: 'student' | 'teacher'): number {
    // Simplified calculation - in real implementation this would be more sophisticated
    const basePoints = rating * 10 // 10-50 points based on rating
    
    // Category weights
    const categoryWeights = {
      teaching_quality: 1.5,
      communication: 1.2,
      behavior: 1.0,
      professional_development: 1.3,
      homework: 0.8,
      attendance: 0.8
    }
    
    const weight = categoryWeights[category as keyof typeof categoryWeights] || 1.0
    const userTypeMultiplier = userType === 'teacher' ? 1.5 : 1.0 // Teachers get more impact
    
    return Math.round(basePoints * weight * userTypeMultiplier)
  }

  private async createFeedbackPointsTransaction(feedback: FeedbackEntry): Promise<void> {
    // This would integrate with the existing points system
    // Creating a points transaction for the feedback
    const pointsData = {
      user_id: feedback.to_user_id,
      organization_id: feedback.organization_id,
      user_type: feedback.to_user_type,
      transaction_type: 'earned',
      points_amount: feedback.ranking_points_impact,
      coins_earned: Math.floor(feedback.ranking_points_impact / 5),
      reason: `Positive feedback: ${feedback.category}`,
      category: feedback.category,
      awarded_by: feedback.from_user_id,
      feedback_source_id: feedback.id,
      feedback_category: feedback.category,
      created_at: new Date().toISOString()
    }

    // This would call the existing points service
    // await pointsService.awardPoints(pointsData)
  }

  private getDefaultFeedbackSummary(): FeedbackSummary {
    return {
      total_received: 0,
      total_given: 0,
      average_rating_received: 0,
      average_rating_given: 0,
      recent_count: 0,
      category_breakdown: [],
      monthly_trends: [],
      ranking_impact: {
        total_points_from_feedback: 0,
        ranking_position_change: 0,
        quality_score_impact: 0,
        efficiency_impact: 0
      }
    }
  }

  private getDefaultAnalytics(): FeedbackAnalytics {
    return {
      organization_overview: {
        total_feedback_entries: 0,
        average_rating: 0,
        feedback_velocity: 0,
        response_rate: 0
      },
      teacher_insights: {
        highest_rated_teachers: [],
        improvement_opportunities: []
      },
      student_insights: {
        most_engaged_students: [],
        feedback_quality_leaders: []
      },
      category_performance: [],
      correlation_insights: {
        feedback_to_performance: 0,
        feedback_to_retention: 0,
        feedback_to_engagement: 0
      }
    }
  }
}

export const feedbackService = new FeedbackService()