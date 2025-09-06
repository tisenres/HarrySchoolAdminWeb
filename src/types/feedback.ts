// Integrated Feedback System Types for Harry School CRM
export interface FeedbackEntry {
  id: string
  organization_id: string
  
  // Bidirectional feedback support
  from_user_id: string | null // null for anonymous
  to_user_id: string
  from_user_type: 'student' | 'teacher'
  to_user_type: 'student' | 'teacher'
  
  // Feedback content
  subject?: string
  message: string
  rating: number // 1-5 scale
  category: 'teaching_quality' | 'communication' | 'behavior' | 'homework' | 'attendance' | 'professional_development' | string
  
  // Context and relationships
  group_id?: string // Which class/group context
  is_anonymous: boolean
  
  // Integration with existing systems
  affects_ranking: boolean
  ranking_points_impact: number
  
  // Admin management (reuse existing patterns)
  status: 'active' | 'reviewed' | 'resolved' | 'flagged'
  admin_response?: string
  responded_by?: string
  responded_at?: string
  
  // Standard audit fields (consistent with existing tables)
  created_at: string
  updated_at: string
  deleted_at?: string
  deleted_by?: string
  
  // Populated relations
  from_user_profile?: {
    full_name: string
    avatar_url?: string
    user_type: 'student' | 'teacher'
  }
  to_user_profile?: {
    full_name: string
    avatar_url?: string
    user_type: 'student' | 'teacher'
  }
  group?: {
    id: string
    name: string
    subject?: string
  }
  responded_by_profile?: {
    full_name: string
    avatar_url?: string
  }
}

export interface FeedbackTemplate {
  id: string
  organization_id: string
  template_name: string
  feedback_direction: 'student_to_teacher' | 'teacher_to_student'
  subject_template?: string
  message_template?: string
  default_rating?: number
  category?: string
  is_active: boolean
  created_at: string
  deleted_at?: string
  deleted_by?: string
}

export interface FeedbackSubmission {
  to_user_id: string
  to_user_type: 'student' | 'teacher'
  subject?: string
  message: string
  rating: number
  category: string
  group_id?: string
  is_anonymous?: boolean
  affects_ranking?: boolean
}

export interface FeedbackSummary {
  total_received: number
  total_given: number
  average_rating_received: number
  average_rating_given: number
  recent_count: number
  category_breakdown: {
    category: string
    rating: number
    count: number
    percentage: number
  }[]
  monthly_trends: {
    month: string
    received_count: number
    given_count: number
    average_rating: number
  }[]
  ranking_impact: {
    total_points_from_feedback: number
    ranking_position_change: number
    quality_score_impact: number
    efficiency_impact: number
  }
}

export interface TeacherFeedbackOverview {
  summary: FeedbackSummary
  recent_feedback: FeedbackEntry[]
  feedback_trends: {
    period: string
    rating: number
    count: number
    points_impact: number
  }[]
  student_engagement: {
    total_students_providing_feedback: number
    feedback_frequency: number
    response_rate: number
  }
  improvement_areas: {
    category: string
    average_rating: number
    suggested_actions: string[]
  }[]
}

export interface StudentFeedbackOverview {
  feedback_given: {
    total_submitted: number
    recent_submissions: FeedbackEntry[]
    engagement_score: number
    categories_covered: string[]
  }
  feedback_received: {
    total_received: number
    average_rating: number
    recent_feedback: FeedbackEntry[]
    improvement_suggestions: string[]
  }
  ranking_impact: {
    points_from_engagement: number
    quality_bonus: number
    feedback_streaks: number
  }
}

export interface FeedbackFilters {
  user_type?: 'student' | 'teacher'
  category?: string[]
  rating_min?: number
  rating_max?: number
  date_from?: Date
  date_to?: Date
  group_id?: string
  status?: ('active' | 'reviewed' | 'resolved' | 'flagged')[]
  is_anonymous?: boolean
  affects_ranking?: boolean
}

export interface FeedbackAnalytics {
  organization_overview: {
    total_feedback_entries: number
    average_rating: number
    feedback_velocity: number // feedback per week
    response_rate: number
  }
  teacher_insights: {
    highest_rated_teachers: {
      teacher_id: string
      teacher_name: string
      average_rating: number
      feedback_count: number
    }[]
    improvement_opportunities: {
      teacher_id: string
      teacher_name: string
      lowest_category: string
      average_rating: number
      suggestion: string
    }[]
  }
  student_insights: {
    most_engaged_students: {
      student_id: string
      student_name: string
      feedback_given_count: number
      engagement_score: number
    }[]
    feedback_quality_leaders: {
      student_id: string
      student_name: string
      helpful_feedback_count: number
      average_quality_score: number
    }[]
  }
  category_performance: {
    category: string
    average_rating: number
    feedback_count: number
    trend: 'improving' | 'declining' | 'stable'
  }[]
  correlation_insights: {
    feedback_to_performance: number // correlation coefficient
    feedback_to_retention: number
    feedback_to_engagement: number
  }
}

export interface FeedbackRankingImpact {
  points_calculation: {
    base_points: number
    rating_multiplier: number
    category_weight: number
    final_points: number
  }
  quality_impact: {
    current_quality_score: number
    feedback_contribution: number
    projected_change: number
  }
  efficiency_impact: {
    current_efficiency: number
    feedback_contribution: number
    projected_change: number
  }
  tier_progression: {
    current_tier: 'standard' | 'good' | 'excellent' | 'outstanding'
    points_to_next_tier: number
    feedback_acceleration: number
  }
}

// Pagination and API response types
export interface FeedbackListResponse {
  data: FeedbackEntry[]
  count: number
  total_pages: number
  current_page: number
}

export interface FeedbackStatsResponse {
  teacher_stats?: TeacherFeedbackOverview
  student_stats?: StudentFeedbackOverview
  organization_analytics?: FeedbackAnalytics
}

// Form validation and submission types
export interface FeedbackFormData {
  to_user_id: string
  to_user_type: 'student' | 'teacher'
  subject?: string
  message: string
  rating: number
  category: string
  group_id?: string
  is_anonymous: boolean
  template_id?: string
}

export interface BulkFeedbackRequest {
  template_id?: string
  feedback_data: Omit<FeedbackFormData, 'to_user_id'>
  recipient_ids: string[]
  recipient_type: 'student' | 'teacher'
}

// Integration with existing ranking system
export interface FeedbackRankingIntegration {
  user_id: string
  user_type: 'student' | 'teacher'
  feedback_score: number
  engagement_multiplier: number
  category_weights: Record<string, number>
  total_impact_points: number
  quality_contribution: number
  efficiency_contribution: number
}