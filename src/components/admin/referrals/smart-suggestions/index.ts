// Smart Referral Suggestions - Intelligent, contextual referral guidance system
// Integrates seamlessly with existing notification and engagement patterns

// Main integration component that orchestrates all smart suggestion features
export { SmartReferralSuggestionsIntegration } from './smart-referral-suggestions-integration'

// Individual smart suggestion components
export { ReferralOpportunityWidget } from './referral-opportunity-widget'
export { SmartReferralPrompts } from './smart-referral-prompts'
export { ReferralSuggestionBot } from './referral-suggestion-bot'
export { ReferralTimingOptimizer } from './referral-timing-optimizer'
export { ReferralQualityHelper } from './referral-quality-helper'

// Integration with existing systems
export { AchievementReferralIntegration } from './achievement-referral-integration'

// Demo and showcase
export { SmartReferralDemo } from './smart-referral-demo'

// Types and interfaces (you may want to create a separate types file)
export interface SmartSuggestionSettings {
  enable_opportunity_widgets: boolean
  enable_smart_prompts: boolean
  enable_coaching_bot: boolean
  enable_timing_optimizer: boolean
  enable_quality_helper: boolean
  prompt_frequency: 'low' | 'normal' | 'high'
  auto_dismiss_prompts: boolean
  respect_quiet_hours: boolean
  suggestion_sensitivity: 'conservative' | 'balanced' | 'aggressive'
}

export interface UserEngagementState {
  user_id: string
  user_name: string
  user_type: 'student' | 'teacher'
  current_engagement_score: number
  recent_achievements: any[]
  recent_feedback: any[]
  current_goals: string[]
  experience_level: 'beginner' | 'intermediate' | 'advanced'
  referral_history: {
    total_sent: number
    successful: number
    conversion_rate: number
  }
}

export interface AchievementContext {
  achievement_id: string
  achievement_title: string
  user_id: string
  user_name: string
  user_type: 'student' | 'teacher'
  points_awarded: number
  rarity: string
  achievement_category: string
}

export interface EngagementEvent {
  type: 'achievement' | 'goal_completion' | 'positive_feedback' | 'milestone' | 'streak' | 'improvement'
  user_id: string
  user_name: string
  user_type: 'student' | 'teacher'
  context_data: {
    description: string
    category: string
    points_impact?: number
    streak_count?: number
    improvement_percentage?: number
    milestone_type?: string
  }
  engagement_score: number
  optimal_timing: boolean
}