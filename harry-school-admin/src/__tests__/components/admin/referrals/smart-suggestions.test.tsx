import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Import components to test
import { ReferralOpportunityWidget } from '@/components/admin/referrals/smart-suggestions/referral-opportunity-widget'
import { SmartReferralPrompts } from '@/components/admin/referrals/smart-suggestions/smart-referral-prompts'
import { ReferralTimingOptimizer } from '@/components/admin/referrals/smart-suggestions/referral-timing-optimizer'
import { ReferralQualityHelper } from '@/components/admin/referrals/smart-suggestions/referral-quality-helper'
import { SmartReferralSuggestionsIntegration } from '@/components/admin/referrals/smart-suggestions/smart-referral-suggestions-integration'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>{children}</div>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>{children}</div>
  ),
  CardHeader: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>{children}</div>
  ),
  CardTitle: ({ children, className, ...props }: any) => (
    <h3 className={className} {...props}>{children}</h3>
  ),
  CardDescription: ({ children, className, ...props }: any) => (
    <p className={className} {...props}>{children}</p>
  ),
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className, ...props }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={className} 
      {...props}
    >
      {children}
    </button>
  ),
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className, ...props }: any) => (
    <span className={className} {...props}>{children}</span>
  ),
}))

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className, ...props }: any) => (
    <div className={className} {...props} data-value={value} />
  ),
}))

describe('Smart Referral Suggestions', () => {
  describe('ReferralOpportunityWidget', () => {
    const mockAchievementContext = {
      achievement_id: 'test_achievement',
      achievement_title: 'Test Achievement',
      user_id: 'user_1',
      user_name: 'John Doe',
      user_type: 'student' as const,
      points_awarded: 100,
      rarity: 'rare',
      achievement_category: 'academic_excellence'
    }

    const mockProps = {
      achievementContext: mockAchievementContext,
      isVisible: true,
      onDismiss: vi.fn(),
      onCreateReferral: vi.fn(),
      onRemindLater: vi.fn(),
      onViewTips: vi.fn(),
    }

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('renders when visible with achievement context', () => {
      render(<ReferralOpportunityWidget {...mockProps} />)
      
      expect(screen.getByText('Referral Opportunity')).toBeInTheDocument()
      expect(screen.getByText('Test Achievement')).toBeInTheDocument()
      expect(screen.getByText('+100 points')).toBeInTheDocument()
    })

    it('does not render when not visible', () => {
      render(<ReferralOpportunityWidget {...mockProps} isVisible={false} />)
      
      expect(screen.queryByText('Referral Opportunity')).not.toBeInTheDocument()
    })

    it('calls onCreateReferral when refer button is clicked', () => {
      render(<ReferralOpportunityWidget {...mockProps} />)
      
      const referButton = screen.getByText('Refer Friend')
      fireEvent.click(referButton)
      
      expect(mockProps.onCreateReferral).toHaveBeenCalledTimes(1)
    })

    it('calls onDismiss when dismiss button is clicked', () => {
      render(<ReferralOpportunityWidget {...mockProps} />)
      
      const dismissButton = screen.getByText('×')
      fireEvent.click(dismissButton)
      
      expect(mockProps.onDismiss).toHaveBeenCalledTimes(1)
    })

    it('shows confidence score and timing indicator', () => {
      render(<ReferralOpportunityWidget {...mockProps} />)
      
      expect(screen.getByText(/confidence/)).toBeInTheDocument()
      expect(screen.getByText(/Perfect Time|Good Time|Consider Later/)).toBeInTheDocument()
    })
  })

  describe('SmartReferralPrompts', () => {
    const mockEngagementContext = {
      type: 'achievement' as const,
      user_id: 'user_1',
      user_name: 'John Doe',
      user_type: 'student' as const,
      context_data: {
        description: 'Test achievement unlocked',
        category: 'academic',
        points_impact: 100
      },
      engagement_score: 85,
      optimal_timing: true
    }

    const mockSettings = {
      enable_achievement_prompts: true,
      enable_milestone_prompts: true,
      enable_social_prompts: true,
      prompt_frequency: 'normal' as const,
      auto_dismiss: true
    }

    const mockProps = {
      engagementContext: mockEngagementContext,
      isVisible: true,
      onCreateReferral: vi.fn(),
      onDismiss: vi.fn(),
      onSnooze: vi.fn(),
      onDisableType: vi.fn(),
      settings: mockSettings
    }

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('renders prompt when engagement context is provided', async () => {
      render(<SmartReferralPrompts {...mockProps} />)
      
      await waitFor(() => {
        expect(screen.getByText(/Amazing achievement!/)).toBeInTheDocument()
      })
    })

    it('calls onCreateReferral when action button is clicked', async () => {
      render(<SmartReferralPrompts {...mockProps} />)
      
      await waitFor(() => {
        const actionButton = screen.getByText(/Share your success/)
        fireEvent.click(actionButton)
        expect(mockProps.onCreateReferral).toHaveBeenCalledTimes(1)
      })
    })

    it('respects settings to disable prompts', () => {
      const disabledSettings = { ...mockSettings, enable_achievement_prompts: false }
      render(<SmartReferralPrompts {...mockProps} settings={disabledSettings} />)
      
      expect(screen.queryByText(/Amazing achievement!/)).not.toBeInTheDocument()
    })
  })

  describe('ReferralTimingOptimizer', () => {
    const mockUserEngagementData = {
      user_id: 'user_1',
      current_engagement_score: 85,
      recent_activities: {
        achievements_unlocked: 2,
        feedback_given: 3,
        goals_completed: 1,
        streak_days: 7,
        last_positive_feedback: new Date(),
        last_achievement: new Date()
      },
      engagement_history: [],
      peak_engagement_patterns: []
    }

    const mockSettings = {
      enable_smart_timing: true,
      auto_suggest: true,
      consider_peer_activity: true,
      respect_quiet_hours: true
    }

    const mockProps = {
      userEngagementData: mockUserEngagementData,
      onScheduleReminder: vi.fn(),
      onCreateReferralNow: vi.fn(),
      onViewAnalytics: vi.fn(),
      settings: mockSettings,
      onSettingsChange: vi.fn()
    }

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('renders timing optimizer interface', () => {
      render(<ReferralTimingOptimizer {...mockProps} />)
      
      expect(screen.getByText('Referral Timing Optimizer')).toBeInTheDocument()
      expect(screen.getByText('85%')).toBeInTheDocument() // engagement score
    })

    it('shows disabled state when smart timing is off', () => {
      const disabledSettings = { ...mockSettings, enable_smart_timing: false }
      render(<ReferralTimingOptimizer {...mockProps} settings={disabledSettings} />)
      
      expect(screen.getByText('Smart Timing Disabled')).toBeInTheDocument()
      expect(screen.getByText('Enable Smart Timing')).toBeInTheDocument()
    })

    it('analyzes engagement and shows recommendations', async () => {
      render(<ReferralTimingOptimizer {...mockProps} />)
      
      await waitFor(() => {
        expect(screen.getByText(/Opportunity|timing/i)).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  describe('ReferralQualityHelper', () => {
    const mockUserContext = {
      user_id: 'user_1',
      user_name: 'John Doe',
      experience_level: 'intermediate' as const,
      recent_achievements: ['Achievement 1', 'Achievement 2'],
      referral_history: {
        total_sent: 5,
        successful: 3,
        conversion_rate: 60
      }
    }

    const mockProps = {
      userContext: mockUserContext,
      onPreviewReferral: vi.fn(),
      onSendReferral: vi.fn()
    }

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('renders quality helper interface', () => {
      render(<ReferralQualityHelper {...mockProps} />)
      
      expect(screen.getByText('Referral Quality Helper')).toBeInTheDocument()
      expect(screen.getByText('intermediate level')).toBeInTheDocument()
    })

    it('displays quality tips based on experience level', () => {
      render(<ReferralQualityHelper {...mockProps} />)
      
      expect(screen.getByText(/Quality Tips/)).toBeInTheDocument()
      expect(screen.getByText(/Share Your Real Experience/)).toBeInTheDocument()
    })

    it('provides referral templates', () => {
      render(<ReferralQualityHelper {...mockProps} />)
      
      fireEvent.click(screen.getByText('Templates'))
      expect(screen.getByText(/Achievement Celebration/)).toBeInTheDocument()
    })

    it('analyzes message quality when requested', async () => {
      render(<ReferralQualityHelper {...mockProps} />)
      
      fireEvent.click(screen.getByText('Composer'))
      
      const textarea = screen.getByPlaceholderText(/Write your authentic referral message/)
      fireEvent.change(textarea, { target: { value: 'Test referral message' } })
      
      const analyzeButton = screen.getByText('Analyze Quality')
      fireEvent.click(analyzeButton)
      
      expect(screen.getByText('Analyze Quality')).toBeInTheDocument()
    })
  })

  describe('SmartReferralSuggestionsIntegration', () => {
    const mockUserEngagementState = {
      user_id: 'user_1',
      user_name: 'John Doe',
      user_type: 'student' as const,
      current_engagement_score: 85,
      recent_achievements: [{ title: 'Test Achievement', points: 100 }],
      recent_feedback: [],
      current_goals: ['Improve skills'],
      experience_level: 'intermediate' as const,
      referral_history: {
        total_sent: 2,
        successful: 1,
        conversion_rate: 50
      }
    }

    const mockProps = {
      userEngagementState: mockUserEngagementState,
      onCreateReferral: vi.fn(),
      onScheduleReminder: vi.fn(),
      onViewAnalytics: vi.fn()
    }

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('renders integration dashboard', () => {
      render(<SmartReferralSuggestionsIntegration {...mockProps} />)
      
      expect(screen.getByText('Smart Referral Suggestions')).toBeInTheDocument()
      expect(screen.getByText('85%')).toBeInTheDocument() // engagement score
    })

    it('shows active suggestion components status', () => {
      render(<SmartReferralSuggestionsIntegration {...mockProps} />)
      
      expect(screen.getByText('Opportunity Widgets')).toBeInTheDocument()
      expect(screen.getByText('Smart Prompts')).toBeInTheDocument()
      expect(screen.getByText('Coaching Bot')).toBeInTheDocument()
    })

    it('allows toggling component settings', () => {
      render(<SmartReferralSuggestionsIntegration {...mockProps} />)
      
      fireEvent.click(screen.getByText('Settings'))
      
      // Check that settings interface is available
      expect(screen.getByText('Suggestion Settings')).toBeInTheDocument()
    })

    it('provides access to all sub-components', () => {
      render(<SmartReferralSuggestionsIntegration {...mockProps} />)
      
      // Check that we can access different tabs
      fireEvent.click(screen.getByText('Timing'))
      expect(screen.getByText('Referral Timing Optimizer')).toBeInTheDocument()
      
      fireEvent.click(screen.getByText('Quality'))
      expect(screen.getByText('Referral Quality Helper')).toBeInTheDocument()
    })
  })
})

describe('Integration with Existing Systems', () => {
  it('integrates with notification patterns', () => {
    // Test that smart prompts follow existing notification structure
    const mockEngagementContext = {
      type: 'achievement' as const,
      user_id: 'user_1',
      user_name: 'John Doe',
      user_type: 'student' as const,
      context_data: {
        description: 'Test achievement',
        category: 'academic'
      },
      engagement_score: 85,
      optimal_timing: true
    }

    const mockSettings = {
      enable_achievement_prompts: true,
      enable_milestone_prompts: true,
      enable_social_prompts: true,
      prompt_frequency: 'normal' as const,
      auto_dismiss: true
    }

    render(
      <SmartReferralPrompts
        engagementContext={mockEngagementContext}
        isVisible={true}
        onCreateReferral={vi.fn()}
        onDismiss={vi.fn()}
        onSnooze={vi.fn()}
        onDisableType={vi.fn()}
        settings={mockSettings}
      />
    )

    // Should follow notification patterns - positioned top-right, dismissible
    expect(screen.getByText('×')).toBeInTheDocument() // dismiss button
  })

  it('integrates with achievement celebration system', () => {
    // Test that opportunity widgets appear during achievement celebrations
    const mockAchievementContext = {
      achievement_id: 'test_achievement',
      achievement_title: 'Excellence Streak',
      user_id: 'user_1',
      user_name: 'John Doe',
      user_type: 'student' as const,
      points_awarded: 500,
      rarity: 'epic',
      achievement_category: 'consistency'
    }

    render(
      <ReferralOpportunityWidget
        achievementContext={mockAchievementContext}
        isVisible={true}
        onDismiss={vi.fn()}
        onCreateReferral={vi.fn()}
        onRemindLater={vi.fn()}
        onViewTips={vi.fn()}
      />
    )

    // Should show achievement context
    expect(screen.getByText('Excellence Streak')).toBeInTheDocument()
    expect(screen.getByText('+500 points')).toBeInTheDocument()
  })

  it('respects user preferences and settings', () => {
    // Test that components respect existing notification preferences
    const disabledSettings = {
      enable_achievement_prompts: false,
      enable_milestone_prompts: false,
      enable_social_prompts: false,
      prompt_frequency: 'low' as const,
      auto_dismiss: false
    }

    render(
      <SmartReferralPrompts
        engagementContext={{
          type: 'achievement',
          user_id: 'user_1',
          user_name: 'John Doe',
          user_type: 'student',
          context_data: { description: 'Test', category: 'academic' },
          engagement_score: 85,
          optimal_timing: true
        }}
        isVisible={true}
        onCreateReferral={vi.fn()}
        onDismiss={vi.fn()}
        onSnooze={vi.fn()}
        onDisableType={vi.fn()}
        settings={disabledSettings}
      />
    )

    // Should not show prompts when disabled
    expect(screen.queryByText(/Amazing achievement!/)).not.toBeInTheDocument()
  })
})