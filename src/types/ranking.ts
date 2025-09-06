// Unified Ranking system types for Harry School CRM (Students + Teachers)
export interface UserRanking {
  id: string
  user_id: string
  organization_id: string
  user_type: 'student' | 'teacher'
  total_points: number
  available_coins: number
  spent_coins: number
  current_level: number
  current_rank: number | null
  efficiency_percentage?: number // Teacher-specific
  quality_score?: number // Teacher-specific
  performance_tier?: 'standard' | 'good' | 'excellent' | 'outstanding' // Teacher-specific
  created_at: string
  updated_at: string
}

// Legacy interface for backwards compatibility
export interface StudentRanking extends Omit<UserRanking, 'user_id' | 'user_type' | 'efficiency_percentage' | 'quality_score' | 'performance_tier'> {
  student_id: string
}

// Teacher-specific ranking interface
export interface TeacherRanking extends UserRanking {
  user_type: 'teacher'
  efficiency_percentage: number
  quality_score: number
  performance_tier: 'standard' | 'good' | 'excellent' | 'outstanding'
}

export interface PointsTransaction {
  id: string
  user_id: string // Changed from student_id to support both students and teachers
  organization_id: string
  user_type: 'student' | 'teacher'
  transaction_type: 'earned' | 'deducted' | 'bonus'
  points_amount: number
  coins_earned: number
  reason: string
  category: 'homework' | 'attendance' | 'behavior' | 'achievement' | 'manual' | 'teaching_quality' | 'professional_development' | 'administrative' | string
  awarded_by: string
  efficiency_impact?: number // Teacher-specific
  quality_impact?: number // Teacher-specific
  affects_salary?: boolean // Teacher-specific
  monetary_impact?: number // Teacher-specific
  created_at: string
  deleted_at?: string
  deleted_by?: string
  
  // Populated relations
  awarded_by_profile?: {
    full_name: string
    avatar_url?: string
  }
}

// Legacy interface for backwards compatibility
export interface StudentPointsTransaction extends Omit<PointsTransaction, 'user_id' | 'user_type' | 'efficiency_impact' | 'quality_impact' | 'affects_salary' | 'monetary_impact'> {
  student_id: string
}

export interface Achievement {
  id: string
  organization_id: string
  name: string
  description?: string
  icon?: string // Using existing column name from database
  badge_color?: string
  points_required?: number // Changed from points_reward to match existing schema
  coins_reward: number
  bonus_points?: number // Added from existing schema
  achievement_type: 'homework' | 'attendance' | 'streak' | 'milestone' | 'special' | 'teaching_quality' | 'professional_development' | 'innovation' | 'mentoring' | string
  target_user_type: 'student' | 'teacher' | 'both'
  professional_development?: boolean // Teacher-specific
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
  deleted_at?: string
  deleted_by?: string
}

export interface StudentAchievement {
  id: string
  student_id: string
  achievement_id: string
  organization_id: string
  earned_at: string
  awarded_by: string
  notes?: string
  deleted_at?: string
  deleted_by?: string
  
  // Populated relations
  achievement?: Achievement
  awarded_by_profile?: {
    full_name: string
    avatar_url?: string
  }
}

export interface RewardsCatalogItem {
  id: string
  organization_id: string
  name: string
  description?: string
  coin_cost: number
  reward_type: 'privilege' | 'certificate' | 'recognition' | string
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
  deleted_at?: string
  deleted_by?: string
}

export interface RewardRedemption {
  id: string
  student_id: string
  reward_id: string
  organization_id: string
  coins_spent: number
  status: 'approved' | 'delivered' | 'cancelled'
  redeemed_at: string
  approved_by: string
  notes?: string
  deleted_at?: string
  deleted_by?: string
  
  // Populated relations
  reward?: RewardsCatalogItem
  approved_by_profile?: {
    full_name: string
    avatar_url?: string
  }
}

// Teacher-specific interfaces
export interface TeacherEvaluationCriteria {
  id: string
  organization_id: string
  criteria_name: string
  description?: string
  weight_percentage: number
  max_points: number
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at?: string
  deleted_by?: string
}

export interface CompensationAdjustment {
  id: string
  teacher_id: string
  organization_id: string
  adjustment_type: 'bonus' | 'salary_increase' | 'performance_award' | 'penalty'
  amount: number
  performance_score?: number
  approved_by?: string
  payment_status: 'pending' | 'approved' | 'paid' | 'cancelled'
  evaluation_period_start?: string
  evaluation_period_end?: string
  notes?: string
  created_at: string
  updated_at: string
  deleted_at?: string
  deleted_by?: string
  
  // Populated relations
  approved_by_profile?: {
    full_name: string
    avatar_url?: string
  }
}

// Extended interfaces with ranking data
export interface UserWithRanking {
  id: string
  user_id: string
  user_type: 'student' | 'teacher'
  full_name: string
  ranking?: UserRanking
  recent_achievements?: StudentAchievement[]
  recent_transactions?: PointsTransaction[]
}

export interface StudentWithRanking extends UserWithRanking {
  student_id: string // Legacy compatibility
  user_type: 'student'
  ranking?: StudentRanking | UserRanking
}

export interface TeacherWithRanking extends UserWithRanking {
  teacher_id: string
  user_type: 'teacher'
  ranking?: TeacherRanking
  evaluation_criteria?: TeacherEvaluationCriteria[]
  compensation_adjustments?: CompensationAdjustment[]
  efficiency_percentage?: number
  quality_score?: number
  performance_tier?: 'standard' | 'good' | 'excellent' | 'outstanding'
}

// Unified point award request interface
export interface PointsAwardRequest {
  user_ids: string[]
  user_type: 'student' | 'teacher'
  points_amount: number
  reason: string
  category: string
  transaction_type?: 'earned' | 'deducted' | 'bonus'
  efficiency_impact?: number // Teacher-specific
  quality_impact?: number // Teacher-specific
  affects_salary?: boolean // Teacher-specific
  monetary_impact?: number // Teacher-specific
}

// Legacy interface for backwards compatibility
export interface StudentPointsAwardRequest extends Omit<PointsAwardRequest, 'user_ids' | 'user_type' | 'efficiency_impact' | 'quality_impact' | 'affects_salary' | 'monetary_impact'> {
  student_ids: string[]
}

// Teacher-specific point award request
export interface TeacherPointsAwardRequest extends PointsAwardRequest {
  user_type: 'teacher'
  efficiency_impact?: number
  quality_impact?: number
  affects_salary?: boolean
  monetary_impact?: number
}

// Unified achievement award request interface  
export interface AchievementAwardRequest {
  user_ids: string[]
  user_type: 'student' | 'teacher'
  achievement_id: string
  notes?: string
}

// Legacy interface for backwards compatibility
export interface StudentAchievementAwardRequest extends Omit<AchievementAwardRequest, 'user_ids' | 'user_type'> {
  student_ids: string[]
}

// Unified ranking analytics interface
export interface RankingAnalytics {
  total_points_awarded: number
  total_users_participating: number
  total_students_participating: number
  total_teachers_participating: number
  average_points_per_user: number
  average_points_per_student: number
  average_points_per_teacher: number
  most_active_day: string
  top_performers: UserWithRanking[]
  top_students: StudentWithRanking[]
  top_teachers: TeacherWithRanking[]
  recent_activity: PointsTransaction[]
  achievement_distribution: {
    achievement_id: string
    achievement_name: string
    times_earned: number
    user_type: 'student' | 'teacher' | 'both'
  }[]
  points_by_category: {
    category: string
    total_points: number
    transaction_count: number
    user_type?: 'student' | 'teacher'
  }[]
  teacher_performance_metrics: {
    average_efficiency: number
    average_quality_score: number
    performance_distribution: {
      tier: 'standard' | 'good' | 'excellent' | 'outstanding'
      count: number
      percentage: number
    }[]
  }
  compensation_impact: {
    total_bonuses_awarded: number
    average_performance_bonus: number
    pending_compensation_adjustments: number
  }
}

// Enhanced table and filter types for unified ranking views
export interface RankingFilters {
  user_type?: 'student' | 'teacher' | 'both'
  date_from?: Date
  date_to?: Date
  category?: string[]
  transaction_type?: string[]
  awarded_by?: string[]
  points_min?: number
  points_max?: number
  achievement_type?: string[]
  performance_tier?: ('standard' | 'good' | 'excellent' | 'outstanding')[]
  efficiency_min?: number // Teacher-specific
  efficiency_max?: number // Teacher-specific
  quality_min?: number // Teacher-specific  
  quality_max?: number // Teacher-specific
  affects_salary?: boolean // Teacher-specific
  target_user_type?: 'student' | 'teacher' | 'both' // Achievement-specific
}

export interface RankingSortConfig {
  field: 'total_points' | 'current_level' | 'current_rank' | 'earned_at' | 'points_amount' | 'efficiency_percentage' | 'quality_score' | 'performance_tier'
  direction: 'asc' | 'desc'
}

// Teacher evaluation specific interfaces
export interface TeacherEvaluationSession {
  id: string
  teacher_id: string
  evaluator_id: string
  evaluation_period_start: string
  evaluation_period_end: string
  criteria_scores: {
    criteria_id: string
    criteria_name: string
    score: number
    max_points: number
    weight_percentage: number
    notes?: string
  }[]
  overall_score: number
  efficiency_percentage: number
  quality_score: number
  performance_tier: 'standard' | 'good' | 'excellent' | 'outstanding'
  compensation_recommendation?: {
    adjustment_type: 'bonus' | 'salary_increase' | 'performance_award'
    amount: number
    justification: string
  }
  created_at: string
  updated_at: string
}