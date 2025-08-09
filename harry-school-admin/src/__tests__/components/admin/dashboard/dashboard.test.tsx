import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { NextIntlClientProvider } from 'next-intl'

// Mock the statistics functions
jest.mock('@/lib/dashboard/statistics', () => ({
  getDashboardStatistics: jest.fn(),
  getRecentActivity: jest.fn(),
  getEnrollmentTrends: jest.fn(),
  getRevenueOverview: jest.fn(),
}))

// Mock next/link
jest.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

import { getDashboardStatistics, getRecentActivity, getEnrollmentTrends, getRevenueOverview } from '@/lib/dashboard/statistics'
import { StatsCard } from '@/components/admin/dashboard/stats-card'
import { EnrollmentChart } from '@/components/admin/dashboard/enrollment-chart'
import { RevenueChart } from '@/components/admin/dashboard/revenue-chart'
import { ActivityFeed } from '@/components/admin/dashboard/activity-feed'

const mockMessages = {
  navigation: {
    welcomeMessage: 'Welcome to Harry School Admin',
  },
  dashboard: {
    title: 'Dashboard',
    totalStudents: 'Total Students',
    activeGroups: 'Active Groups',
    totalTeachers: 'Total Teachers',
    recentActivity: 'Recent Activity',
    quickActions: 'Quick Actions',
    addTeacher: 'Add Teacher',
    createGroup: 'Create Group',
    enrollStudent: 'Enroll Student',
    recordPayment: 'Record Payment',
    viewReports: 'View Reports',
  },
}

const mockStatistics = {
  totalStudents: 150,
  activeStudents: 145,
  totalTeachers: 25,
  activeTeachers: 23,
  totalGroups: 12,
  activeGroups: 10,
  recentEnrollments: 8,
  monthlyRevenue: 45000,
  outstandingPayments: 8500,
  upcomingClasses: 15,
}

const mockActivities = [
  {
    id: '1',
    type: 'enrollment',
    description: 'John Doe enrolled in Math Group A',
    timestamp: new Date().toISOString(),
    metadata: { student_name: 'John Doe', group_name: 'Math Group A' },
  },
  {
    id: '2',
    type: 'payment',
    description: 'Payment received from Jane Smith',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    metadata: { student_name: 'Jane Smith', amount: 500 },
  },
]

describe('Dashboard Components', () => {
  const mockGetDashboardStatistics = getDashboardStatistics as jest.MockedFunction<typeof getDashboardStatistics>
  const mockGetRecentActivity = getRecentActivity as jest.MockedFunction<typeof getRecentActivity>
  const mockGetEnrollmentTrends = getEnrollmentTrends as jest.MockedFunction<typeof getEnrollmentTrends>
  const mockGetRevenueOverview = getRevenueOverview as jest.MockedFunction<typeof getRevenueOverview>

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default mocks
    mockGetDashboardStatistics.mockResolvedValue(mockStatistics)
    mockGetRecentActivity.mockResolvedValue(mockActivities)
    mockGetEnrollmentTrends.mockResolvedValue([])
    mockGetRevenueOverview.mockResolvedValue([])
  })

  describe('Dashboard Statistics Integration', () => {
    it('fetches and displays dashboard statistics correctly', async () => {
      const stats = await getDashboardStatistics()
      expect(stats).toEqual(mockStatistics)
      expect(mockGetDashboardStatistics).toHaveBeenCalledTimes(1)
    })

    it('handles statistics fetch errors gracefully', async () => {
      mockGetDashboardStatistics.mockRejectedValue(new Error('Database error'))

      try {
        await getDashboardStatistics()
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Database error')
      }
    })

    it('fetches recent activity correctly', async () => {
      const activities = await getRecentActivity(5)
      expect(activities).toEqual(mockActivities)
      expect(mockGetRecentActivity).toHaveBeenCalledWith(5)
    })
  })
})