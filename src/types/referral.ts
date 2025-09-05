// Student Referral System Types for Harry School CRM
// Integrates with existing ranking and points infrastructure

export interface StudentReferral {
  id: string
  organization_id: string
  referrer_id: string // Links to user_rankings.user_id
  referrer_type: 'student' | 'teacher'
  referred_student_name: string
  referred_student_phone?: string
  status: 'pending' | 'contacted' | 'enrolled' | 'declined'
  enrolled_student_id?: string // References students(id)
  points_awarded: number
  points_transaction_id?: string // References points_transactions(id)
  enrollment_date?: string
  contact_notes?: string
  created_at: string
  updated_at: string
  created_by: string
  
  // Populated relations
  enrolled_student?: {
    id: string
    full_name: string
    student_id: string
  }
  created_by_profile?: {
    full_name: string
    avatar_url?: string
  }
}

export interface ReferralSummary {
  total_referrals: number
  successful_referrals: number
  pending_referrals: number
  conversion_rate: number
  points_earned: number
  recent_referrals: StudentReferral[]
}

export interface ReferralProgress {
  current_total: number
  next_milestone: {
    target: number
    reward_points: number
    achievement_name: string
    progress_percentage: number
  }
  streak_count: number
  monthly_target?: number
  monthly_progress?: number
}

export interface ReferralAchievement {
  id: string
  name: string
  description: string
  icon: string
  badge_color: string
  points_reward: number
  coins_reward: number
  referral_requirement: number
  achievement_type: 'referral'
  earned?: boolean
  earned_at?: string
}

export interface ReferralFormData {
  referred_student_name: string
  referred_student_phone?: string
  contact_notes?: string
}

export interface ReferralAnalytics {
  total_referrals: number
  successful_conversions: number
  conversion_rate: number
  total_points_earned: number
  monthly_breakdown: {
    month: string
    referrals: number
    conversions: number
    points: number
  }[]
  top_referrers: {
    referrer_id: string
    referrer_name: string
    referrer_type: 'student' | 'teacher'
    total_referrals: number
    successful_referrals: number
    conversion_rate: number
    points_earned: number
  }[]
  referral_sources: {
    source: string
    count: number
    percentage: number
  }[]
}

// Extended UserRanking to include referral metrics (as per documentation)
export interface UserRankingWithReferrals {
  id: string
  user_id: string
  organization_id: string
  user_type: 'student' | 'teacher'
  total_points: number
  available_coins: number
  spent_coins: number
  current_level: number
  current_rank: number | null
  // Referral-specific fields added to existing user_rankings table
  total_referrals: number
  successful_referrals: number
  referral_points_earned: number
  referral_conversion_rate: number
  created_at: string
  updated_at: string
}

// Legacy compatibility for StudentRanking
export interface StudentRankingWithReferrals extends Omit<UserRankingWithReferrals, 'user_id' | 'user_type'> {
  student_id: string
}

export interface ReferralPointsTransaction {
  id: string
  referral_id: string
  points_amount: number
  transaction_type: 'earned'
  category: 'referral'
  subcategory: 'successful_enrollment'
  reference_type: 'student_referral'
  reference_id: string
  created_at: string
}