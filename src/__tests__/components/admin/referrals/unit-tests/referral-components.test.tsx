import React from 'react'
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor, within } from '../../../../utils/test-utils'
import { 
  createMockReferralData, 
  createMockStudentData, 
  createMockHandlers,
  createEdgeCaseScenarios 
} from '../../../../utils/referral-mock-data'

// Import referral components for unit testing
import { ReferralSummaryCard } from '@/components/admin/students/referral-summary-card'
import { ReferralSubmissionForm } from '@/components/admin/students/referral-submission-form'
import { ReferralStatusIndicator } from '@/components/admin/students/referral-status-indicator'
import { PendingReferralsWidget } from '@/components/admin/dashboard/pending-referrals-widget'
import { ReferralAnalyticsPanel } from '@/components/admin/students/referral-analytics-panel'
import { ReferralConversionTracker } from '@/components/admin/students/referral-conversion-tracker'

// Mock external dependencies
jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  )
  MockLink.displayName = 'MockLink'
  return MockLink
})

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/dashboard/students',
}))

describe('Referral Components Unit Tests', () => {
  const mockReferralData = createMockReferralData()
  const mockStudentData = createMockStudentData()
  const mockHandlers = createMockHandlers()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('ReferralSummaryCard', () => {
    const defaultProps = {
      studentId: mockStudentData.id,
      referralSummary: mockReferralData.summary,
    }

    it('renders referral summary data correctly', () => {
      render(<ReferralSummaryCard {...defaultProps} />)

      expect(screen.getByText('Total Referrals')).toBeInTheDocument()
      expect(screen.getByText('6')).toBeInTheDocument()
      expect(screen.getByText('Successful')).toBeInTheDocument()
      expect(screen.getByText('4')).toBeInTheDocument()
      expect(screen.getByText('Conversion Rate')).toBeInTheDocument()
      expect(screen.getByText('67%')).toBeInTheDocument()
      expect(screen.getByText('Points Earned')).toBeInTheDocument()
      expect(screen.getByText('450')).toBeInTheDocument()
    })

    it('displays current tier correctly', () => {
      render(<ReferralSummaryCard {...defaultProps} />)

      expect(screen.getByText('Current Tier')).toBeInTheDocument()
      expect(screen.getByText('Ambassador')).toBeInTheDocument()
    })

    it('shows next milestone information', () => {
      render(<ReferralSummaryCard {...defaultProps} />)

      expect(screen.getByText('Next Milestone')).toBeInTheDocument()
      expect(screen.getByText('1 more referral')).toBeInTheDocument()
      expect(screen.getByText('Referral Champion')).toBeInTheDocument()
      expect(screen.getByText('150 points')).toBeInTheDocument()
    })

    it('handles zero referrals gracefully', () => {
      const propsWithZeroReferrals = {
        ...defaultProps,
        referralSummary: {
          ...mockReferralData.summary,
          totalReferrals: 0,
          successfulReferrals: 0,
          conversionRate: 0,
          totalPointsEarned: 0,
          currentTier: 'none',
        },
      }

      render(<ReferralSummaryCard {...propsWithZeroReferrals} />)

      expect(screen.getByText('0')).toBeInTheDocument()
      expect(screen.getByText('0%')).toBeInTheDocument()
      expect(screen.getByText('No referrals yet')).toBeInTheDocument()
    })

    it('displays progress bar for next milestone', () => {
      render(<ReferralSummaryCard {...defaultProps} />)

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toBeInTheDocument()
      expect(progressBar).toHaveAttribute('aria-valuenow', '80') // 4/5 = 80%
    })

    it('applies correct styling based on tier', () => {
      render(<ReferralSummaryCard {...defaultProps} />)

      const tierBadge = screen.getByText('Ambassador')
      expect(tierBadge).toHaveClass('bg-purple-100', 'text-purple-800')
    })
  })

  describe('ReferralSubmissionForm', () => {
    const defaultProps = {
      studentId: mockStudentData.id,
      onSubmit: mockHandlers.onReferralSubmit,
      onCancel: mockHandlers.onCancel,
    }

    it('renders all form fields', () => {
      render(<ReferralSubmissionForm {...defaultProps} />)

      expect(screen.getByLabelText(/referred name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/referral source/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/referral method/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
    })

    it('validates required fields', async () => {
      const user = userEvent.setup()
      render(<ReferralSubmissionForm {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: /submit referral/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument()
        expect(screen.getByText(/phone is required/i)).toBeInTheDocument()
      })

      expect(mockHandlers.onReferralSubmit).not.toHaveBeenCalled()
    })

    it('validates phone number format', async () => {
      const user = userEvent.setup()
      render(<ReferralSubmissionForm {...defaultProps} />)

      await user.type(screen.getByLabelText(/referred name/i), 'John Smith')
      await user.type(screen.getByLabelText(/phone/i), '123456789') // Invalid format

      const submitButton = screen.getByRole('button', { name: /submit referral/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid phone format/i)).toBeInTheDocument()
      })
    })

    it('validates email format when provided', async () => {
      const user = userEvent.setup()
      render(<ReferralSubmissionForm {...defaultProps} />)

      await user.type(screen.getByLabelText(/referred name/i), 'John Smith')
      await user.type(screen.getByLabelText(/phone/i), '+998901234567')
      await user.type(screen.getByLabelText(/email/i), 'invalid-email') // Invalid format

      const submitButton = screen.getByRole('button', { name: /submit referral/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument()
      })
    })

    it('submits form with valid data', async () => {
      const user = userEvent.setup()
      render(<ReferralSubmissionForm {...defaultProps} />)

      await user.type(screen.getByLabelText(/referred name/i), 'John Smith')
      await user.type(screen.getByLabelText(/phone/i), '+998901234567')
      await user.type(screen.getByLabelText(/email/i), 'john@example.com')
      await user.selectOptions(screen.getByLabelText(/referral source/i), 'word_of_mouth')
      await user.selectOptions(screen.getByLabelText(/referral method/i), 'direct_contact')
      await user.type(screen.getByLabelText(/notes/i), 'Friend from university')

      const submitButton = screen.getByRole('button', { name: /submit referral/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockHandlers.onReferralSubmit).toHaveBeenCalledWith({
          referred_name: 'John Smith',
          referred_phone: '+998901234567',
          referred_email: 'john@example.com',
          referral_source: 'word_of_mouth',
          referral_method: 'direct_contact',
          notes: 'Friend from university',
        })
      })
    })

    it('handles cancel action', async () => {
      const user = userEvent.setup()
      render(<ReferralSubmissionForm {...defaultProps} />)

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(mockHandlers.onCancel).toHaveBeenCalled()
    })

    it('formats phone number automatically', async () => {
      const user = userEvent.setup()
      render(<ReferralSubmissionForm {...defaultProps} />)

      const phoneInput = screen.getByLabelText(/phone/i)
      await user.type(phoneInput, '998901234567')

      expect(phoneInput).toHaveValue('+998 90 123 45 67')
    })

    it('shows loading state during submission', async () => {
      const user = userEvent.setup()
      render(<ReferralSubmissionForm {...defaultProps} loading={true} />)

      const submitButton = screen.getByRole('button', { name: /submitting/i })
      expect(submitButton).toBeDisabled()
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    it('populates form with initial data when editing', () => {
      const initialData = {
        referred_name: 'Jane Doe',
        referred_phone: '+998901234567',
        referred_email: 'jane@example.com',
        referral_source: 'social_media',
        notes: 'Met at conference',
      }

      render(<ReferralSubmissionForm {...defaultProps} initialData={initialData} />)

      expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument()
      expect(screen.getByDisplayValue('+998901234567')).toBeInTheDocument()
      expect(screen.getByDisplayValue('jane@example.com')).toBeInTheDocument()
      expect(screen.getByDisplayValue('social_media')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Met at conference')).toBeInTheDocument()
    })
  })

  describe('ReferralStatusIndicator', () => {
    const defaultProps = {
      studentId: mockStudentData.id,
      referralMetrics: mockReferralData.metrics,
    }

    it('displays referral metrics in compact format', () => {
      render(<ReferralStatusIndicator {...defaultProps} compact={true} />)

      expect(screen.getByText('6 Referrals')).toBeInTheDocument()
      expect(screen.getByText('67% Success')).toBeInTheDocument()
    })

    it('displays detailed metrics in expanded format', () => {
      render(<ReferralStatusIndicator {...defaultProps} compact={false} />)

      expect(screen.getByText('Total Referrals: 6')).toBeInTheDocument()
      expect(screen.getByText('Successful: 4')).toBeInTheDocument()
      expect(screen.getByText('Conversion Rate: 67%')).toBeInTheDocument()
      expect(screen.getByText('Points Earned: 450')).toBeInTheDocument()
    })

    it('applies correct status color based on conversion rate', () => {
      const highPerformanceProps = {
        ...defaultProps,
        referralMetrics: {
          ...mockReferralData.metrics,
          conversionRate: 85,
        },
      }

      render(<ReferralStatusIndicator {...highPerformanceProps} />)

      const statusBadge = screen.getByTestId('referral-status-badge')
      expect(statusBadge).toHaveClass('bg-green-100', 'text-green-800')
    })

    it('shows warning color for low conversion rate', () => {
      const lowPerformanceProps = {
        ...defaultProps,
        referralMetrics: {
          ...mockReferralData.metrics,
          conversionRate: 25,
        },
      }

      render(<ReferralStatusIndicator {...lowPerformanceProps} />)

      const statusBadge = screen.getByTestId('referral-status-badge')
      expect(statusBadge).toHaveClass('bg-yellow-100', 'text-yellow-800')
    })

    it('handles zero referrals state', () => {
      const zeroReferralsProps = {
        ...defaultProps,
        referralMetrics: {
          ...mockReferralData.metrics,
          totalReferrals: 0,
          successfulReferrals: 0,
          conversionRate: 0,
        },
      }

      render(<ReferralStatusIndicator {...zeroReferralsProps} />)

      expect(screen.getByText('No Referrals')).toBeInTheDocument()
      expect(screen.getByTestId('referral-status-badge')).toHaveClass('bg-gray-100', 'text-gray-600')
    })

    it('shows tooltip with additional information on hover', async () => {
      const user = userEvent.setup()
      render(<ReferralStatusIndicator {...defaultProps} />)

      const indicator = screen.getByTestId('referral-status-indicator')
      await user.hover(indicator)

      await waitFor(() => {
        expect(screen.getByText(/current tier: ambassador/i)).toBeInTheDocument()
        expect(screen.getByText(/last referral: /i)).toBeInTheDocument()
      })
    })
  })

  describe('PendingReferralsWidget', () => {
    const defaultProps = {
      pendingReferrals: mockReferralData.pendingReferrals,
      onContactReferral: mockHandlers.onContactReferral,
      onBulkContact: mockHandlers.onBulkContact,
    }

    it('displays pending referrals list', () => {
      render(<PendingReferralsWidget {...defaultProps} />)

      expect(screen.getByText('Pending Referrals')).toBeInTheDocument()
      expect(screen.getByText('3 Need Contact')).toBeInTheDocument()

      mockReferralData.pendingReferrals.forEach(referral => {
        expect(screen.getByText(referral.referred_name)).toBeInTheDocument()
        expect(screen.getByText(referral.referrer_name)).toBeInTheDocument()
      })
    })

    it('shows urgency indicators based on referral age', () => {
      render(<PendingReferralsWidget {...defaultProps} />)

      // Check for urgency indicators
      const urgentReferrals = screen.getAllByTestId(/urgency-/)
      expect(urgentReferrals.length).toBeGreaterThan(0)

      // 5-day old referral should be marked as urgent
      expect(screen.getByTestId('urgency-high')).toBeInTheDocument()
    })

    it('handles individual referral contact', async () => {
      const user = userEvent.setup()
      render(<PendingReferralsWidget {...defaultProps} />)

      const contactButtons = screen.getAllByRole('button', { name: /contact/i })
      await user.click(contactButtons[0])

      expect(mockHandlers.onContactReferral).toHaveBeenCalledWith(
        mockReferralData.pendingReferrals[0].id
      )
    })

    it('handles bulk selection and contact', async () => {
      const user = userEvent.setup()
      render(<PendingReferralsWidget {...defaultProps} />)

      // Select multiple referrals
      const checkboxes = screen.getAllByRole('checkbox')
      await user.click(checkboxes[0])
      await user.click(checkboxes[1])

      // Click bulk contact
      const bulkContactButton = screen.getByRole('button', { name: /contact selected/i })
      await user.click(bulkContactButton)

      expect(mockHandlers.onBulkContact).toHaveBeenCalledWith([
        mockReferralData.pendingReferrals[0].id,
        mockReferralData.pendingReferrals[1].id,
      ])
    })

    it('shows empty state when no pending referrals', () => {
      render(<PendingReferralsWidget {...defaultProps} pendingReferrals={[]} />)

      expect(screen.getByText('No pending referrals')).toBeInTheDocument()
      expect(screen.getByText('All referrals have been contacted')).toBeInTheDocument()
    })

    it('filters referrals by status', async () => {
      const user = userEvent.setup()
      render(<PendingReferralsWidget {...defaultProps} />)

      const statusFilter = screen.getByLabelText(/filter by status/i)
      await user.selectOptions(statusFilter, 'pending')

      // Should only show pending referrals
      expect(screen.getByText('Carol White')).toBeInTheDocument() // pending
      expect(screen.getByText('Eva Green')).toBeInTheDocument() // pending
      expect(screen.queryByText('David Brown')).not.toBeInTheDocument() // contacted
    })

    it('sorts referrals by urgency', async () => {
      const user = userEvent.setup()
      render(<PendingReferralsWidget {...defaultProps} />)

      const sortButton = screen.getByRole('button', { name: /sort by urgency/i })
      await user.click(sortButton)

      const referralItems = screen.getAllByTestId(/referral-item-/)
      // 5-day old referral (Eva Green) should be first
      expect(within(referralItems[0]).getByText('Eva Green')).toBeInTheDocument()
    })
  })

  describe('ReferralAnalyticsPanel', () => {
    const defaultProps = {
      analyticsData: mockReferralData.analytics,
      timeRange: 'last_30_days' as const,
      onTimeRangeChange: mockHandlers.onTimeRangeChange,
    }

    it('displays analytics overview metrics', () => {
      render(<ReferralAnalyticsPanel {...defaultProps} />)

      expect(screen.getByText('Conversion Trends')).toBeInTheDocument()
      expect(screen.getByText('Top Referrers')).toBeInTheDocument()
      expect(screen.getByText('Monthly Breakdown')).toBeInTheDocument()

      expect(screen.getByText('24')).toBeInTheDocument() // Total referrals
      expect(screen.getByText('75%')).toBeInTheDocument() // Conversion rate
    })

    it('shows top referrers list', () => {
      render(<ReferralAnalyticsPanel {...defaultProps} />)

      mockReferralData.analytics.topReferrers.forEach(referrer => {
        expect(screen.getByText(referrer.studentName)).toBeInTheDocument()
        expect(screen.getByText(`${referrer.referrals} referrals`)).toBeInTheDocument()
        expect(screen.getByText(`${referrer.conversionRate}%`)).toBeInTheDocument()
      })
    })

    it('displays monthly breakdown chart', () => {
      render(<ReferralAnalyticsPanel {...defaultProps} />)

      mockReferralData.analytics.monthlyBreakdown.forEach(month => {
        expect(screen.getByText(month.month)).toBeInTheDocument()
        expect(screen.getByText(month.referrals.toString())).toBeInTheDocument()
      })
    })

    it('handles time range changes', async () => {
      const user = userEvent.setup()
      render(<ReferralAnalyticsPanel {...defaultProps} />)

      const timeRangeSelect = screen.getByLabelText(/time range/i)
      await user.selectOptions(timeRangeSelect, 'last_90_days')

      expect(mockHandlers.onTimeRangeChange).toHaveBeenCalledWith('last_90_days')
    })

    it('shows different view modes', async () => {
      const user = userEvent.setup()
      render(<ReferralAnalyticsPanel {...defaultProps} />)

      const viewTabs = ['overview', 'trends', 'referrers']
      
      for (const view of viewTabs) {
        const tab = screen.getByRole('tab', { name: new RegExp(view, 'i') })
        await user.click(tab)
        expect(tab).toHaveAttribute('aria-selected', 'true')
      }
    })

    it('displays source breakdown', () => {
      render(<ReferralAnalyticsPanel {...defaultProps} />)

      const sourceTab = screen.getByRole('tab', { name: /sources/i })
      expect(sourceTab).toBeInTheDocument()

      mockReferralData.analytics.sourceBreakdown.forEach(source => {
        expect(screen.getByText(source.source.replace('_', ' '))).toBeInTheDocument()
        expect(screen.getByText(`${source.percentage}%`)).toBeInTheDocument()
      })
    })

    it('handles export functionality', async () => {
      const user = userEvent.setup()
      const onExport = jest.fn()
      render(<ReferralAnalyticsPanel {...defaultProps} onExport={onExport} />)

      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      expect(onExport).toHaveBeenCalledWith({
        timeRange: 'last_30_days',
        format: 'csv',
        data: mockReferralData.analytics,
      })
    })
  })

  describe('ReferralConversionTracker', () => {
    const defaultProps = {
      referralId: 'test-referral-id',
      referralData: mockReferralData.pendingReferrals[0],
      onConvert: mockHandlers.onReferralSubmit,
      onDecline: mockHandlers.onDelete,
    }

    it('displays referral information for conversion tracking', () => {
      render(<ReferralConversionTracker {...defaultProps} />)

      expect(screen.getByText('Convert Referral')).toBeInTheDocument()
      expect(screen.getByText(defaultProps.referralData.referred_name)).toBeInTheDocument()
      expect(screen.getByText(defaultProps.referralData.referred_phone)).toBeInTheDocument()
    })

    it('handles successful conversion', async () => {
      const user = userEvent.setup()
      render(<ReferralConversionTracker {...defaultProps} />)

      await user.type(screen.getByLabelText(/student id/i), 'STU2024001')
      await user.selectOptions(screen.getByLabelText(/course/i), 'English Course')

      const convertButton = screen.getByRole('button', { name: /convert to student/i })
      await user.click(convertButton)

      expect(mockHandlers.onReferralSubmit).toHaveBeenCalledWith({
        referralId: 'test-referral-id',
        studentId: 'STU2024001',
        course: 'English Course',
        enrollmentDate: expect.any(Date),
      })
    })

    it('handles referral decline', async () => {
      const user = userEvent.setup()
      render(<ReferralConversionTracker {...defaultProps} />)

      const declineButton = screen.getByRole('button', { name: /decline referral/i })
      await user.click(declineButton)

      // Should show reason input
      expect(screen.getByLabelText(/decline reason/i)).toBeInTheDocument()

      await user.type(screen.getByLabelText(/decline reason/i), 'Not interested')
      
      const confirmDeclineButton = screen.getByRole('button', { name: /confirm decline/i })
      await user.click(confirmDeclineButton)

      expect(mockHandlers.onDelete).toHaveBeenCalledWith({
        referralId: 'test-referral-id',
        reason: 'Not interested',
      })
    })

    it('validates required fields for conversion', async () => {
      const user = userEvent.setup()
      render(<ReferralConversionTracker {...defaultProps} />)

      const convertButton = screen.getByRole('button', { name: /convert to student/i })
      await user.click(convertButton)

      await waitFor(() => {
        expect(screen.getByText(/student id is required/i)).toBeInTheDocument()
        expect(screen.getByText(/course selection is required/i)).toBeInTheDocument()
      })
    })

    it('shows matching probability score', () => {
      const propsWithScore = {
        ...defaultProps,
        matchingScore: 0.85,
      }

      render(<ReferralConversionTracker {...propsWithScore} />)

      expect(screen.getByText('85% Match Confidence')).toBeInTheDocument()
      expect(screen.getByTestId('confidence-bar')).toHaveAttribute('aria-valuenow', '85')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('handles malformed referral data gracefully', () => {
      const malformedData = {
        ...mockReferralData.summary,
        totalReferrals: null,
        conversionRate: undefined,
      }

      expect(() => {
        render(
          <ReferralSummaryCard
            studentId={mockStudentData.id}
            referralSummary={malformedData as any}
          />
        )
      }).not.toThrow()

      expect(screen.getByText('0')).toBeInTheDocument() // Should fallback to 0
    })

    it('handles network errors during form submission', async () => {
      const user = userEvent.setup()
      const errorHandler = jest.fn().mockRejectedValue(new Error('Network error'))
      
      render(
        <ReferralSubmissionForm
          studentId={mockStudentData.id}
          onSubmit={errorHandler}
          onCancel={mockHandlers.onCancel}
        />
      )

      await user.type(screen.getByLabelText(/referred name/i), 'John Smith')
      await user.type(screen.getByLabelText(/phone/i), '+998901234567')

      const submitButton = screen.getByRole('button', { name: /submit referral/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/error submitting referral/i)).toBeInTheDocument()
      })
    })

    it('handles duplicate referral scenarios', () => {
      const edgeCases = createEdgeCaseScenarios()
      
      render(
        <ReferralSubmissionForm
          studentId={mockStudentData.id}
          onSubmit={mockHandlers.onReferralSubmit}
          onCancel={mockHandlers.onCancel}
          existingReferrals={[edgeCases.duplicateReferral.existing]}
        />
      )

      // Should show warning about potential duplicate
      expect(screen.getByText(/similar referral exists/i)).toBeInTheDocument()
    })

    it('handles empty analytics data', () => {
      const emptyAnalytics = {
        ...mockReferralData.analytics,
        totalReferrals: 0,
        topReferrers: [],
        monthlyBreakdown: [],
      }

      render(
        <ReferralAnalyticsPanel
          analyticsData={emptyAnalytics}
          timeRange="last_30_days"
          onTimeRangeChange={mockHandlers.onTimeRangeChange}
        />
      )

      expect(screen.getByText('No referral data available')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('provides proper ARIA labels for all interactive elements', () => {
      render(
        <ReferralSubmissionForm
          studentId={mockStudentData.id}
          onSubmit={mockHandlers.onReferralSubmit}
          onCancel={mockHandlers.onCancel}
        />
      )

      expect(screen.getByLabelText(/referred name/i)).toHaveAccessibleName()
      expect(screen.getByLabelText(/phone/i)).toHaveAccessibleName()
      expect(screen.getByLabelText(/email/i)).toHaveAccessibleName()
      expect(screen.getByRole('button', { name: /submit referral/i })).toHaveAccessibleName()
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      render(
        <PendingReferralsWidget
          pendingReferrals={mockReferralData.pendingReferrals}
          onContactReferral={mockHandlers.onContactReferral}
          onBulkContact={mockHandlers.onBulkContact}
        />
      )

      const firstContactButton = screen.getAllByRole('button', { name: /contact/i })[0]
      await user.tab()
      expect(firstContactButton).toHaveFocus()

      await user.keyboard('{Enter}')
      expect(mockHandlers.onContactReferral).toHaveBeenCalled()
    })

    it('provides screen reader announcements for dynamic content', async () => {
      const user = userEvent.setup()
      render(
        <ReferralSubmissionForm
          studentId={mockStudentData.id}
          onSubmit={mockHandlers.onReferralSubmit}
          onCancel={mockHandlers.onCancel}
        />
      )

      const submitButton = screen.getByRole('button', { name: /submit referral/i })
      await user.click(submitButton)

      await waitFor(() => {
        const errorRegion = screen.getByRole('alert')
        expect(errorRegion).toBeInTheDocument()
        expect(errorRegion).toHaveAttribute('aria-live', 'polite')
      })
    })
  })
})