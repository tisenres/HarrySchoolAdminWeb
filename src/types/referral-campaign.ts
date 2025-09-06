// Referral Campaign Types - Extends existing goal and achievement infrastructure
// Integrates seamlessly with existing student engagement and gamification systems

import type { Goal, Achievement, PointsTransaction } from '@/types/ranking'
import type { StudentReferral, ReferralAchievement } from '@/types/referral'

// Extends existing Goal interface for referral campaigns
export interface ReferralCampaign extends Omit<Goal, 'category' | 'type'> {
  // Campaign-specific properties
  campaign_type: 'seasonal' | 'limited_time' | 'tier_based' | 'group_challenge' | 'back_to_school' | 'summer_special'
  category: 'referral_campaign' // Specific category for referral campaigns
  type: 'collaborative_project' // Uses existing goal type for team-based activities
  
  // Campaign settings that extend SMART criteria
  campaign_settings: {
    start_date: Date
    end_date: Date
    max_participants?: number
    enrollment_cap?: number
    tier_structure?: CampaignTier[]
    team_requirements?: {
      min_team_size: number
      max_team_size: number
      allow_cross_type_teams: boolean // Students and teachers together
    }
  }
  
  // Extends performance_correlation for campaign rewards
  campaign_rewards: {
    milestone_rewards: CampaignMilestone[]
    completion_bonus: {
      points: number
      coins: number
      special_achievement_id?: string
    }
    tier_multipliers: {
      bronze: number
      silver: number
      gold: number
      platinum: number
    }
  }
  
  // Integration with existing achievement system
  linked_achievements: string[] // References existing achievement IDs
  custom_achievements: ReferralCampaignAchievement[]
  
  // Analytics and tracking
  participation_metrics: {
    registered_participants: number
    active_participants: number
    completion_rate: number
    total_referrals: number
    successful_conversions: number
    average_referrals_per_participant: number
  }
  
  // Campaign status
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'
  visibility: 'public' | 'invited_only' | 'department_specific'
}

// Extends existing Achievement interface for campaign-specific achievements
export interface ReferralCampaignAchievement extends Omit<Achievement, 'criteria'> {
  achievement_type: 'campaign_milestone' | 'tier_progression' | 'team_collaboration' | 'conversion_excellence' | 'consistency_streak'
  campaign_id: string
  
  // Campaign-specific criteria that integrates with existing system
  criteria: {
    type: 'referral_count' | 'conversion_rate' | 'team_performance' | 'streak_days' | 'milestone_completion'
    campaign_specific: true
    requirements: {
      referral_threshold?: number
      conversion_rate_threshold?: number
      team_collaboration_score?: number
      streak_duration?: number
      milestone_ids?: string[]
    }
    time_constraints?: {
      within_campaign_period: boolean
      specific_time_window?: {
        start: Date
        end: Date
      }
    }
  }
  
  // Extends existing rewards structure
  campaign_rewards: {
    campaign_points: number // Additional to base points
    campaign_coins: number // Additional to base coins
    tier_advancement?: 'bronze' | 'silver' | 'gold' | 'platinum'
    team_bonus_multiplier?: number
    special_recognition?: {
      badge_upgrade: boolean
      leaderboard_highlight: boolean
      certificate_eligibility: boolean
    }
  }
}

// Campaign participation tracking using existing goal progress patterns
export interface CampaignParticipation {
  id: string
  campaign_id: string
  participant_id: string
  participant_type: 'student' | 'teacher'
  participant_name: string
  
  // Uses existing goal progress tracking structure
  participation_goal: {
    target_referrals: number
    current_referrals: number
    progress_percentage: number
    milestones_completed: string[]
    next_milestone: {
      id: string
      target: number
      reward_points: number
      achievement_unlock?: string
    }
  }
  
  // Team participation (extends existing collaboration structure)
  team_participation?: {
    team_id: string
    team_name: string
    team_members: {
      user_id: string
      user_name: string
      user_type: 'student' | 'teacher'
      contribution_score: number
    }[]
    team_progress: {
      combined_referrals: number
      team_multiplier: number
      collaboration_bonus: number
    }
  }
  
  // Current tier and progression
  current_tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  tier_progress: {
    current_points: number
    points_to_next_tier: number
    tier_multiplier: number
  }
  
  // Campaign-specific referrals
  campaign_referrals: CampaignReferralEntry[]
  
  // Achievements and rewards earned
  earned_achievements: string[]
  total_campaign_points: number
  total_campaign_coins: number
  
  // Participation metadata
  joined_at: Date
  last_activity: Date
  completion_status: 'active' | 'completed' | 'withdrawn'
}

// Campaign-specific referral entry that extends existing referral structure
export interface CampaignReferralEntry {
  id: string
  campaign_id: string
  base_referral_id: string // Links to existing StudentReferral
  participant_id: string
  
  // Campaign-specific tracking
  campaign_points_awarded: number
  tier_multiplier_applied: number
  team_bonus_applied?: number
  milestone_unlocked?: string
  
  // Timing within campaign
  submitted_at: Date
  converted_at?: Date
  campaign_day: number // Day number within campaign period
  
  // Campaign verification
  verified_by_admin: boolean
  verification_notes?: string
}

// Campaign tier structure that integrates with existing level system
export interface CampaignTier {
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  requirements: {
    min_referrals: number
    min_conversion_rate?: number
    min_team_participation?: number
  }
  rewards: {
    point_multiplier: number
    coin_multiplier: number
    achievement_unlocks: string[]
    special_privileges: string[]
  }
  tier_achievement_id: string // Links to existing achievement system
}

// Campaign milestones using existing milestone structure
export interface CampaignMilestone {
  id: string
  title: string
  description: string
  requirements: {
    referral_count?: number
    conversion_count?: number
    team_collaboration_score?: number
    time_constraint?: {
      within_days: number
      from_campaign_start: boolean
    }
  }
  rewards: {
    points: number
    coins: number
    achievement_id?: string
    tier_advancement?: boolean
  }
  completion_celebration: {
    notification_message: string
    leaderboard_highlight: boolean
    team_announcement: boolean
  }
}

// Campaign leaderboard data that extends existing leaderboard structure
export interface CampaignLeaderboard {
  campaign_id: string
  campaign_title: string
  
  // Individual leaderboard (extends existing ranking)
  individual_rankings: {
    participant_id: string
    participant_name: string
    participant_type: 'student' | 'teacher'
    rank: number
    total_referrals: number
    successful_conversions: number
    conversion_rate: number
    campaign_points: number
    current_tier: string
    tier_progress: number
    recent_achievements: string[]
  }[]
  
  // Team leaderboard (new for campaigns)
  team_rankings?: {
    team_id: string
    team_name: string
    rank: number
    team_members: {
      user_id: string
      user_name: string
      user_type: 'student' | 'teacher'
    }[]
    combined_referrals: number
    team_conversion_rate: number
    collaboration_score: number
    team_points: number
    team_achievements: string[]
  }[]
  
  // Campaign-wide statistics
  campaign_stats: {
    total_participants: number
    total_referrals: number
    total_conversions: number
    overall_conversion_rate: number
    days_remaining: number
    top_performers_by_tier: {
      tier: string
      participant_name: string
      achievement: string
    }[]
  }
}

// Campaign analytics that extends existing analytics patterns
export interface CampaignAnalytics {
  campaign_id: string
  campaign_title: string
  
  // Performance metrics using existing analytics structure
  performance_metrics: {
    participation_rate: number
    completion_rate: number
    average_referrals_per_participant: number
    conversion_effectiveness: number
    engagement_score: number
    tier_distribution: {
      bronze: number
      silver: number
      gold: number
      platinum: number
    }
  }
  
  // Timeline analytics
  daily_progress: {
    date: Date
    new_participants: number
    daily_referrals: number
    daily_conversions: number
    achievement_unlocks: number
    tier_progressions: number
  }[]
  
  // Participant behavior analysis
  participant_insights: {
    most_active_time_of_day: string
    peak_referral_days: string[]
    drop_off_points: string[]
    successful_participant_patterns: string[]
  }
  
  // ROI and impact metrics
  campaign_impact: {
    total_new_enrollments: number
    enrollment_revenue_impact: number
    participant_engagement_increase: number
    long_term_retention_improvement: number
  }
  
  // Comparison with existing goal and achievement metrics
  cross_system_integration: {
    goal_completion_correlation: number
    achievement_unlock_rate_increase: number
    overall_ranking_improvement: number
    points_system_engagement_boost: number
  }
}

// Campaign notification system that extends existing notification infrastructure
export interface CampaignNotification {
  id: string
  campaign_id: string
  notification_type: 'milestone_achieved' | 'tier_progression' | 'team_update' | 'campaign_reminder' | 'achievement_unlock'
  
  // Integrates with existing notification system
  recipient_id: string
  recipient_type: 'student' | 'teacher'
  
  // Campaign-specific notification content
  content: {
    title: string
    message: string
    campaign_context: {
      current_progress: number
      next_milestone?: string
      tier_status?: string
      team_updates?: string[]
    }
    action_items?: {
      suggested_actions: string[]
      quick_referral_link?: string
      team_collaboration_opportunities?: string[]
    }
  }
  
  // Notification metadata
  priority: 'low' | 'medium' | 'high' | 'urgent'
  delivery_method: 'in_app' | 'email' | 'push' | 'all'
  scheduled_for?: Date
  sent_at?: Date
  read_at?: Date
}

// Campaign template system that extends existing goal templates
export interface ReferralCampaignTemplate {
  id: string
  template_name: string
  template_description: string
  
  // Based on existing goal template structure
  template_category: 'seasonal' | 'promotional' | 'academic_year' | 'department_specific' | 'school_wide'
  
  // Pre-configured campaign settings
  default_settings: {
    duration_days: number
    target_participants: number
    tier_structure: CampaignTier[]
    milestone_template: CampaignMilestone[]
    achievement_templates: ReferralCampaignAchievement[]
  }
  
  // Customization options
  customizable_elements: {
    campaign_title: boolean
    duration: boolean
    tier_requirements: boolean
    reward_amounts: boolean
    achievement_criteria: boolean
  }
  
  // Success metrics from previous uses
  template_effectiveness: {
    average_participation_rate: number
    average_completion_rate: number
    successful_deployments: number
    average_roi: number
  }
  
  // Template metadata
  created_by: string
  created_at: Date
  last_used: Date
  usage_count: number
  template_status: 'active' | 'deprecated' | 'seasonal_only'
}

// Export all types for use throughout the application
export type {
  ReferralCampaign,
  ReferralCampaignAchievement,
  CampaignParticipation,
  CampaignReferralEntry,
  CampaignTier,
  CampaignMilestone,
  CampaignLeaderboard,
  CampaignAnalytics,
  CampaignNotification,
  ReferralCampaignTemplate
}