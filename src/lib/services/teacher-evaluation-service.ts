import { getSupabaseClient } from '@/lib/supabase-client'
import { Database } from '@/types/database'

type TeacherEvaluationCriteria = Database['public']['Tables']['teacher_evaluation_criteria']['Row']
type TeacherEvaluation = Database['public']['Tables']['teacher_evaluations']['Row']
type TeacherCompensationAdjustment = Database['public']['Tables']['teacher_compensation_adjustments']['Row']

export interface TeacherEvaluationCriteriaWithScore extends TeacherEvaluationCriteria {
  score?: number
}

export interface TeacherPerformanceMetrics {
  overall_score: number
  efficiency_percentage: number
  quality_score: number
  performance_tier: 'standard' | 'good' | 'excellent' | 'outstanding'
  total_points: number
  current_rank: number
  evaluations_count: number
  last_evaluation_date: string | null
}

export interface CompensationRecommendation {
  type: 'salary_increase' | 'performance_bonus' | 'one_time_bonus'
  amount: number
  percentage_change: number
  reason: string
  effective_date: string
}

class TeacherEvaluationService {
  private supabase = getSupabaseClient()

  // Get evaluation criteria for an organization
  async getEvaluationCriteria(organizationId: string): Promise<TeacherEvaluationCriteria[]> {
    try {
      const { data, error } = await this.supabase
        .from('teacher_evaluation_criteria')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('weight_percentage', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching evaluation criteria:', error)
      throw error
    }
  }

  // Get teacher performance metrics
  async getTeacherPerformanceMetrics(teacherId: string): Promise<TeacherPerformanceMetrics> {
    try {
      const response = await fetch(`/api/teacher-performance/${teacherId}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      return data.metrics
    } catch (error) {
      console.error('Error fetching teacher performance metrics:', error)
      throw error
    }
  }

  // Create a new teacher evaluation
  async createEvaluation(
    teacherId: string, 
    organizationId: string,
    evaluatedBy: string,
    criteriaScores: Record<string, number>,
    notes?: string
  ): Promise<TeacherEvaluation> {
    try {
      // Calculate overall score based on weighted criteria
      const criteria = await this.getEvaluationCriteria(organizationId)
      let totalWeightedScore = 0
      let totalWeight = 0

      for (const criterion of criteria) {
        const score = criteriaScores[criterion.id] || 0
        const weight = Number(criterion.weight_percentage)
        totalWeightedScore += score * (weight / 100)
        totalWeight += weight
      }

      const overallScore = totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 0

      const { data, error } = await this.supabase
        .from('teacher_evaluations')
        .insert({
          organization_id: organizationId,
          teacher_id: teacherId,
          evaluated_by: evaluatedBy,
          evaluation_period_start: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0],
          evaluation_period_end: new Date().toISOString().split('T')[0],
          overall_score: overallScore,
          criteria_scores: criteriaScores,
          notes: notes || ''
        })
        .select()
        .single()

      if (error) throw error

      // Update user ranking
      await this.updateTeacherRanking(teacherId, overallScore)

      return data
    } catch (error) {
      console.error('Error creating teacher evaluation:', error)
      throw error
    }
  }

  // Update teacher ranking based on evaluation
  private async updateTeacherRanking(teacherId: string, overallScore: number): Promise<void> {
    try {
      const performanceTier = this.calculatePerformanceTier(overallScore)
      const qualityScore = overallScore
      const efficiencyPercentage = Math.min(100, overallScore + Math.random() * 10) // Add some variance

      await this.supabase
        .from('user_rankings')
        .upsert({
          user_id: teacherId,
          user_type: 'teacher',
          organization_id: await this.getTeacherOrganizationId(teacherId),
          quality_score: qualityScore,
          efficiency_percentage: efficiencyPercentage,
          performance_tier: performanceTier,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'organization_id,user_id,user_type'
        })

    } catch (error) {
      console.error('Error updating teacher ranking:', error)
      throw error
    }
  }

  // Generate compensation recommendation
  async generateCompensationRecommendation(
    teacherId: string,
    overallScore: number
  ): Promise<CompensationRecommendation | null> {
    try {
      if (overallScore < 70) {
        return null // No recommendation for low performance
      }

      let type: 'salary_increase' | 'performance_bonus' | 'one_time_bonus'
      let percentageChange: number
      let baseAmount = 1000 // Base amount for calculation

      if (overallScore >= 90) {
        type = 'salary_increase'
        percentageChange = 15
      } else if (overallScore >= 85) {
        type = 'performance_bonus'
        percentageChange = 10
      } else {
        type = 'one_time_bonus'
        percentageChange = 5
      }

      const amount = baseAmount * (percentageChange / 100)
      const effectiveDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now

      return {
        type,
        amount,
        percentage_change: percentageChange,
        reason: `Based on ${overallScore}% performance score - ${this.calculatePerformanceTier(overallScore)} tier`,
        effective_date: effectiveDate.toISOString().split('T')[0]
      }
    } catch (error) {
      console.error('Error generating compensation recommendation:', error)
      return null
    }
  }

  // Helper methods
  private calculatePerformanceTier(score: number): 'standard' | 'good' | 'excellent' | 'outstanding' {
    if (score >= 90) return 'outstanding'
    if (score >= 80) return 'excellent'
    if (score >= 70) return 'good'
    return 'standard'
  }

  private async getTeacherOrganizationId(teacherId: string): Promise<string> {
    const { data, error } = await this.supabase
      .from('teachers')
      .select('organization_id')
      .eq('id', teacherId)
      .single()

    if (error) throw error
    return data.organization_id
  }

  // Get teacher evaluations history
  async getTeacherEvaluations(teacherId: string, limit = 10): Promise<TeacherEvaluation[]> {
    try {
      const { data, error } = await this.supabase
        .from('teacher_evaluations')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('evaluation_period_end', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching teacher evaluations:', error)
      throw error
    }
  }
}

export const teacherEvaluationService = new TeacherEvaluationService()
export default teacherEvaluationService