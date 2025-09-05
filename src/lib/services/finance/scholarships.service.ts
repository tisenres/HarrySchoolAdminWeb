import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'

type Scholarship = Database['public']['Tables']['scholarships']['Row']
type ScholarshipInsert = Database['public']['Tables']['scholarships']['Insert']
type ScholarshipUpdate = Database['public']['Tables']['scholarships']['Update']

export class ScholarshipService {
  static async create(scholarship: ScholarshipInsert) {
    const { data, error } = await supabase
      .from('scholarships')
      .insert({
        ...scholarship,
        is_active: scholarship.is_active ?? true,
        awarded_count: 0,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getById(id: string) {
    const { data, error } = await supabase
      .from('scholarships')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  static async list(filters?: {
    isActive?: boolean
    scholarshipType?: string
    organizationId?: string
    academicYear?: string
  }) {
    let query = supabase
      .from('scholarships')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive)
    }
    if (filters?.scholarshipType) {
      query = query.eq('scholarship_type', filters.scholarshipType)
    }
    if (filters?.organizationId) {
      query = query.eq('organization_id', filters.organizationId)
    }
    if (filters?.academicYear) {
      query = query.eq('academic_year', filters.academicYear)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  static async update(id: string, scholarship: ScholarshipUpdate) {
    const { data, error } = await supabase
      .from('scholarships')
      .update(scholarship)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async checkEligibility(scholarshipId: string, studentData: {
    householdIncome?: number
    gradeAverage?: number
    enrollmentDate?: string
  }) {
    const scholarship = await this.getById(scholarshipId)
    if (!scholarship) throw new Error('Scholarship not found')
    if (!scholarship.is_active) throw new Error('Scholarship is not active')

    const now = new Date()
    if (scholarship.valid_from && new Date(scholarship.valid_from) > now) {
      return { eligible: false, reason: 'Scholarship is not yet valid' }
    }
    if (scholarship.valid_until && new Date(scholarship.valid_until) < now) {
      return { eligible: false, reason: 'Scholarship has expired' }
    }
    if (scholarship.application_deadline && new Date(scholarship.application_deadline) < now) {
      return { eligible: false, reason: 'Application deadline has passed' }
    }
    if (scholarship.available_slots && scholarship.awarded_count && scholarship.awarded_count >= scholarship.available_slots) {
      return { eligible: false, reason: 'No available slots' }
    }

    if (scholarship.household_income_limit && studentData.householdIncome) {
      if (studentData.householdIncome > scholarship.household_income_limit) {
        return { eligible: false, reason: 'Household income exceeds limit' }
      }
    }

    if (scholarship.min_grade_requirement && studentData.gradeAverage) {
      if (studentData.gradeAverage < scholarship.min_grade_requirement) {
        return { eligible: false, reason: 'Grade average below requirement' }
      }
    }

    return { eligible: true }
  }

  static async awardScholarship(scholarshipId: string, studentId: string, amount?: number) {
    const scholarship = await this.getById(scholarshipId)
    if (!scholarship) throw new Error('Scholarship not found')

    const awardAmount = amount || scholarship.amount || 0
    const awardPercentage = scholarship.percentage

    await this.update(scholarshipId, {
      awarded_count: (scholarship.awarded_count || 0) + 1,
    })

    const { error: transactionError } = await supabase
      .from('financial_transactions')
      .insert({
        student_id: studentId,
        amount: -awardAmount,
        transaction_type: 'scholarship',
        transaction_number: `SCH-${Date.now()}`,
        description: `${scholarship.name} scholarship awarded`,
        currency: 'USD',
        organization_id: scholarship.organization_id,
        metadata: {
          scholarship_id: scholarshipId,
          scholarship_name: scholarship.name,
          scholarship_type: scholarship.scholarship_type,
          percentage: awardPercentage,
        },
      })

    if (transactionError) throw transactionError

    return { amount: awardAmount, percentage: awardPercentage }
  }

  static async getScholarshipApplications(scholarshipId: string) {
    
    return []
  }

  static async getScholarshipStatistics(organizationId: string, academicYear?: string) {
    let query = supabase
      .from('scholarships')
      .select('*')
      .eq('organization_id', organizationId)
      .is('deleted_at', null)

    if (academicYear) {
      query = query.eq('academic_year', academicYear)
    }

    const { data, error } = await query

    if (error) throw error

    const stats = {
      totalScholarships: 0,
      activeScholarships: 0,
      totalAwarded: 0,
      totalSlots: 0,
      availableSlots: 0,
      byType: {} as Record<string, { count: number; awarded: number }>,
    }

    data?.forEach((scholarship) => {
      stats.totalScholarships++
      if (scholarship.is_active) {
        stats.activeScholarships++
      }
      stats.totalAwarded += scholarship.awarded_count || 0
      stats.totalSlots += scholarship.available_slots || 0
      stats.availableSlots += (scholarship.available_slots || 0) - (scholarship.awarded_count || 0)

      const type = scholarship.scholarship_type
      if (!stats.byType[type]) {
        stats.byType[type] = { count: 0, awarded: 0 }
      }
      stats.byType[type].count++
      stats.byType[type].awarded += scholarship.awarded_count || 0
    })

    return stats
  }

  static async softDelete(id: string, deletedBy: string) {
    const { data, error } = await supabase
      .from('scholarships')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: deletedBy,
        is_active: false,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }
}