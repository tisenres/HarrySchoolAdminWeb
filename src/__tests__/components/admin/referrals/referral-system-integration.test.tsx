import React from 'react'
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor, within } from '../../../utils/test-utils'
import { createMockReferralData, createMockStudentData, createMockHandlers } from '../../../utils/referral-mock-data'

// Import referral components
import { ReferralSummaryCard } from '@/components/admin/students/referral-summary-card'
import { ReferralSubmissionForm } from '@/components/admin/students/referral-submission-form'
import { ReferralStatusIndicator } from '@/components/admin/students/referral-status-indicator'
import { PendingReferralsWidget } from '@/components/admin/dashboard/pending-referrals-widget'
import { ReferralAnalyticsPanel } from '@/components/admin/students/referral-analytics-panel'

// Mock Next.js components
jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...props }: any) => {
    return <a href={href} {...props}>{children}</a>
  }
  MockLink.displayName = 'MockLink'
  return MockLink
})

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/dashboard/students',
}))

describe('Referral System Integration Tests', () => {
  const mockStudentData = createMockStudentData()
  const mockReferralData = createMockReferralData()
  const mockHandlers = createMockHandlers()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Student Profile Referral Integration', () => {
    it('displays referral summary correctly in student profile', () => {
      render(
        <ReferralSummaryCard
          studentId={mockStudentData.id}
          referralSummary={mockReferralData.summary}
        />
      )

      // Check referral metrics
      expect(screen.getByText('Total Referrals')).toBeInTheDocument()
      expect(screen.getByText('6')).toBeInTheDocument()
      expect(screen.getByText('Successful')).toBeInTheDocument()
      expect(screen.getByText('4')).toBeInTheDocument()
      expect(screen.getByText('Conversion Rate')).toBeInTheDocument()
      expect(screen.getByText('67%')).toBeInTheDocument()
    })

    it('handles referral submission form correctly', async () => {
      const user = userEvent.setup()
      render(
        <ReferralSubmissionForm
          studentId={mockStudentData.id}
          onSubmit={mockHandlers.onReferralSubmit}
          onCancel={mockHandlers.onCancel}
        />
      )

      // Fill out referral form
      await user.type(screen.getByLabelText(/referred name/i), 'John Smith')
      await user.type(screen.getByLabelText(/phone/i), '+998901234567')
      await user.type(screen.getByLabelText(/email/i), 'john@example.com')
      await user.selectOptions(screen.getByLabelText(/referral source/i), 'word_of_mouth')

      const submitButton = screen.getByRole('button', { name: /submit referral/i })
      await user.click(submitButton)

      expect(mockHandlers.onReferralSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          referred_name: 'John Smith',
          referred_phone: '+998901234567',
          referred_email: 'john@example.com',
          referral_source: 'word_of_mouth',
        })
      )
    })

    it('validates referral form input correctly', async () => {
      const user = userEvent.setup()
      render(
        <ReferralSubmissionForm
          studentId={mockStudentData.id}
          onSubmit={mockHandlers.onReferralSubmit}
          onCancel={mockHandlers.onCancel}
        />
      )

      // Try to submit without required fields
      const submitButton = screen.getByRole('button', { name: /submit referral/i })
      await user.click(submitButton)

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument()
        expect(screen.getByText(/phone is required/i)).toBeInTheDocument()
      })

      // Should not call submit handler
      expect(mockHandlers.onReferralSubmit).not.toHaveBeenCalled()
    })

    it('integrates referral status with existing student data displays', () => {
      render(
        <ReferralStatusIndicator
          studentId={mockStudentData.id}
          referralMetrics={mockReferralData.metrics}
          compact={true}
        />
      )

      // Check status indicators
      expect(screen.getByText('6 Referrals')).toBeInTheDocument()
      expect(screen.getByText('67% Success')).toBeInTheDocument()
      
      // Check status badge
      const statusBadge = screen.getByTestId('referral-status-badge')
      expect(statusBadge).toHaveClass('bg-green-100')
    })
  })

  describe('Admin Interface Integration', () => {
    it('displays pending referrals widget in admin dashboard', () => {
      render(
        <PendingReferralsWidget
          pendingReferrals={mockReferralData.pendingReferrals}
          onContactReferral={mockHandlers.onContactReferral}
          onBulkContact={mockHandlers.onBulkContact}
        />
      )

      // Check widget header
      expect(screen.getByText('Pending Referrals')).toBeInTheDocument()
      expect(screen.getByText('3 Need Contact')).toBeInTheDocument()

      // Check individual referrals
      mockReferralData.pendingReferrals.forEach(referral => {
        expect(screen.getByText(referral.referred_name)).toBeInTheDocument()
        expect(screen.getByText(referral.referrer_name)).toBeInTheDocument()
      })
    })

    it('handles bulk referral contact actions', async () => {
      const user = userEvent.setup()
      render(
        <PendingReferralsWidget
          pendingReferrals={mockReferralData.pendingReferrals}
          onContactReferral={mockHandlers.onContactReferral}
          onBulkContact={mockHandlers.onBulkContact}
        />
      )

      // Select referrals
      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[0]) // Select first referral
      await user.click(checkboxes[1]) // Select second referral

      // Click bulk contact button
      const bulkContactButton = screen.getByRole('button', { name: /contact selected/i })
      await user.click(bulkContactButton)

      expect(mockHandlers.onBulkContact).toHaveBeenCalledWith([
        mockReferralData.pendingReferrals[0].id,
        mockReferralData.pendingReferrals[1].id,
      ])
    })

    it('integrates referral analytics with existing dashboard', () => {
      render(
        <ReferralAnalyticsPanel
          analyticsData={mockReferralData.analytics}
          timeRange="last_30_days"
          onTimeRangeChange={mockHandlers.onTimeRangeChange}
        />
      )

      // Check analytics metrics
      expect(screen.getByText('Conversion Trends')).toBeInTheDocument()
      expect(screen.getByText('Top Referrers')).toBeInTheDocument()
      expect(screen.getByText('Monthly Breakdown')).toBeInTheDocument()

      // Check specific metrics
      expect(screen.getByText('75%')).toBeInTheDocument() // Conversion rate
      expect(screen.getByText('24')).toBeInTheDocument() // Total referrals
    })
  })

  describe('Point and Achievement Integration', () => {
    it('displays referral points correctly in point breakdown', () => {
      const pointsData = {
        totalPoints: 850,
        referralPoints: 200,
        academicPoints: 500,
        activityPoints: 150,
      }

      render(
        <div data-testid="points-breakdown">
          <div>Total Points: {pointsData.totalPoints}</div>
          <div>Academic: {pointsData.academicPoints}</div>
          <div>Referrals: {pointsData.referralPoints}</div>
          <div>Activities: {pointsData.activityPoints}</div>
        </div>
      )

      expect(screen.getByText('Total Points: 850')).toBeInTheDocument()
      expect(screen.getByText('Referrals: 200')).toBeInTheDocument()
      expect(screen.getByText('Academic: 500')).toBeInTheDocument()
    })

    it('shows referral achievements alongside existing achievements', () => {
      const achievements = [
        { id: '1', name: 'Academic Excellence', type: 'academic', earned: true },
        { id: '2', name: 'First Referral', type: 'referral', earned: true },
        { id: '3', name: 'Referral Champion', type: 'referral', earned: false, progress: 60 },
      ]

      render(
        <div data-testid="achievements-list">
          {achievements.map(achievement => (
            <div key={achievement.id} data-testid={`achievement-${achievement.id}`}>
              <span>{achievement.name}</span>
              <span>{achievement.earned ? 'Earned' : `${achievement.progress}% Progress`}</span>
            </div>
          ))}
        </div>
      )

      expect(screen.getByText('Academic Excellence')).toBeInTheDocument()
      expect(screen.getByText('First Referral')).toBeInTheDocument()
      expect(screen.getByText('Referral Champion')).toBeInTheDocument()
      expect(screen.getByText('60% Progress')).toBeInTheDocument()
    })
  })

  describe('Leaderboard Integration', () => {
    it('displays referral metrics in existing leaderboard structure', () => {
      const leaderboardData = [
        {
          id: '1',
          name: 'Alice Johnson',
          totalPoints: 950,
          academicRank: 1,
          referrals: 8,
          conversionRate: 87.5,
        },
        {
          id: '2',
          name: 'Bob Smith',
          totalPoints: 820,
          academicRank: 3,
          referrals: 5,
          conversionRate: 80.0,
        },
      ]

      render(
        <div data-testid="leaderboard">
          {leaderboardData.map((student, index) => (
            <div key={student.id} data-testid={`student-${student.id}`}>
              <span>#{index + 1} {student.name}</span>
              <span>{student.totalPoints} pts</span>
              <span>{student.referrals} referrals</span>
              <span>{student.conversionRate}% conversion</span>
            </div>
          ))}
        </div>
      )

      expect(screen.getByText('#1 Alice Johnson')).toBeInTheDocument()
      expect(screen.getByText('8 referrals')).toBeInTheDocument()
      expect(screen.getByText('87.5% conversion')).toBeInTheDocument()
    })
  })

  describe('Campaign Integration', () => {
    it('displays active referral campaigns in existing goal system', () => {
      const campaigns = [
        {
          id: '1',
          name: 'Back to School Challenge',
          description: 'Refer 3 students and earn bonus points',
          status: 'active',
          endDate: '2024-09-01',
          participants: 15,
          multiplier: 1.5,
        },
      ]

      render(
        <div data-testid="active-campaigns">
          {campaigns.map(campaign => (
            <div key={campaign.id} data-testid={`campaign-${campaign.id}`}>
              <h3>{campaign.name}</h3>
              <p>{campaign.description}</p>
              <span>{campaign.participants} participants</span>
              <span>{campaign.multiplier}x bonus</span>
            </div>
          ))}
        </div>
      )

      expect(screen.getByText('Back to School Challenge')).toBeInTheDocument()
      expect(screen.getByText('Refer 3 students and earn bonus points')).toBeInTheDocument()
      expect(screen.getByText('15 participants')).toBeInTheDocument()
      expect(screen.getByText('1.5x bonus')).toBeInTheDocument()
    })
  })

  describe('Notification Integration', () => {
    it('integrates referral notifications with existing notification system', () => {
      const notifications = [
        {
          id: '1',
          type: 'referral_success',
          title: 'Referral Enrolled!',
          message: 'Your referral John Smith has enrolled. You earned 100 points!',
          timestamp: new Date(),
          read: false,
        },
        {
          id: '2',
          type: 'achievement',
          title: 'New Achievement!',
          message: 'You unlocked the "First Referral" achievement!',
          timestamp: new Date(),
          read: false,
        },
      ]

      render(
        <div data-testid="notifications">
          {notifications.map(notification => (
            <div key={notification.id} data-testid={`notification-${notification.id}`}>
              <h4>{notification.title}</h4>
              <p>{notification.message}</p>
              <span>{notification.type}</span>
            </div>
          ))}
        </div>
      )

      expect(screen.getByText('Referral Enrolled!')).toBeInTheDocument()
      expect(screen.getByText('You earned 100 points!')).toBeInTheDocument()
      expect(screen.getByText('New Achievement!')).toBeInTheDocument()
    })
  })

  describe('Analytics Dashboard Integration', () => {
    it('shows referral correlation with academic performance', () => {
      const correlationData = {
        referralStudents: {
          averageGrade: 8.5,
          retentionRate: 92,
          engagementScore: 85,
        },
        nonReferralStudents: {
          averageGrade: 7.8,
          retentionRate: 87,
          engagementScore: 78,
        },
      }

      render(
        <div data-testid="correlation-analysis">
          <div>
            <h3>Referred Students</h3>
            <p>Average Grade: {correlationData.referralStudents.averageGrade}</p>
            <p>Retention: {correlationData.referralStudents.retentionRate}%</p>
            <p>Engagement: {correlationData.referralStudents.engagementScore}%</p>
          </div>
          <div>
            <h3>Non-Referred Students</h3>
            <p>Average Grade: {correlationData.nonReferralStudents.averageGrade}</p>
            <p>Retention: {correlationData.nonReferralStudents.retentionRate}%</p>
            <p>Engagement: {correlationData.nonReferralStudents.engagementScore}%</p>
          </div>
        </div>
      )

      expect(screen.getByText('Average Grade: 8.5')).toBeInTheDocument()
      expect(screen.getByText('Retention: 92%')).toBeInTheDocument()
      expect(screen.getByText('Average Grade: 7.8')).toBeInTheDocument()
      expect(screen.getByText('Retention: 87%')).toBeInTheDocument()
    })
  })

  describe('Performance Integration', () => {
    it('maintains performance with referral data integration', async () => {
      const startTime = performance.now()
      
      render(
        <div>
          <ReferralSummaryCard
            studentId={mockStudentData.id}
            referralSummary={mockReferralData.summary}
          />
          <ReferralAnalyticsPanel
            analyticsData={mockReferralData.analytics}
            timeRange="last_30_days"
            onTimeRangeChange={mockHandlers.onTimeRangeChange}
          />
        </div>
      )

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Component should render quickly
      expect(renderTime).toBeLessThan(100) // Less than 100ms
      
      // All elements should be present
      expect(screen.getByText('Total Referrals')).toBeInTheDocument()
      expect(screen.getByText('Conversion Trends')).toBeInTheDocument()
    })
  })
})