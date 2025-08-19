'use client'

/**
 * OPTIMIZED Dashboard Page for Harry School CRM
 * Uses React Query for data fetching and component memoization for performance
 */

import React, { useMemo } from 'react'
import Link from 'next/link'
import { Users, UserCheck, UserPlus, TrendingUp, DollarSign, Calendar, BookOpen, Activity, Target } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatsCard } from '@/components/admin/dashboard/stats-card-optimized'
import { ActivityFeed } from '@/components/admin/dashboard/activity-feed'

// Optimized React Query hooks
import { useDashboardData } from '@/hooks/use-dashboard'

// Memoized components for better performance
const QuickActionsSection = React.memo(() => {
  const tQuickActions = useTranslations('quickActions')
  
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/en/teachers">
          <Button 
            variant="outline" 
            className="w-full h-auto p-4 flex flex-col items-center gap-2 hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Users className="h-6 w-6" />
            <span className="text-sm font-medium">Manage Teachers</span>
          </Button>
        </Link>
        
        <Link href="/en/students">
          <Button 
            variant="outline" 
            className="w-full h-auto p-4 flex flex-col items-center gap-2 hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <UserPlus className="h-6 w-6" />
            <span className="text-sm font-medium">Manage Students</span>
          </Button>
        </Link>
        
        <Link href="/en/groups">
          <Button 
            variant="outline" 
            className="w-full h-auto p-4 flex flex-col items-center gap-2 hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <BookOpen className="h-6 w-6" />
            <span className="text-sm font-medium">Manage Groups</span>
          </Button>
        </Link>
        
        <Link href="/en/finance">
          <Button 
            variant="outline" 
            className="w-full h-auto p-4 flex flex-col items-center gap-2 hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <DollarSign className="h-6 w-6" />
            <span className="text-sm font-medium">Finance</span>
          </Button>
        </Link>
      </div>
    </Card>
  )
})

QuickActionsSection.displayName = 'QuickActionsSection'

const StatsOverview = React.memo(({ statistics, integratedAnalytics, loading }: {
  statistics: any
  integratedAnalytics: any
  loading: boolean
}) => {
  const t = useTranslations('dashboard')
  
  // Memoize stats data to prevent unnecessary re-renders
  const statsData = useMemo(() => {
    if (loading || !statistics) {
      return {
        totalStudents: 0,
        activeStudents: 0,
        totalGroups: 0,
        activeGroups: 0,
        totalTeachers: 0,
        activeTeachers: 0,
        monthlyRevenue: 0,
        studentGrowth: 0,
      }
    }
    
    return {
      totalStudents: integratedAnalytics?.totalStudents || statistics?.totalStudents || 0,
      activeStudents: integratedAnalytics?.activeStudents || statistics?.activeStudents || 0,
      totalGroups: integratedAnalytics?.totalGroups || statistics?.totalGroups || 0,
      activeGroups: integratedAnalytics?.activeGroups || statistics?.activeGroups || 0,
      totalTeachers: integratedAnalytics?.totalTeachers || statistics?.totalTeachers || 0,
      activeTeachers: integratedAnalytics?.activeTeachers || statistics?.activeTeachers || 0,
      monthlyRevenue: integratedAnalytics?.monthlyRevenue || statistics?.monthlyRevenue || 0,
      studentGrowth: integratedAnalytics?.studentGrowth || statistics?.studentGrowth || 0,
    }
  }, [statistics, integratedAnalytics, loading])
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Students"
        value={statsData.totalStudents}
        change={statsData.studentGrowth}
        icon={Users}
        loading={loading}
      />
      <StatsCard
        title="Active Groups"
        value={statsData.activeGroups}
        change={12.5} // Mock data - replace with actual
        icon={BookOpen}
        loading={loading}
      />
      <StatsCard
        title="Teachers"
        value={statsData.totalTeachers}
        change={8.2} // Mock data - replace with actual
        icon={UserCheck}
        loading={loading}
      />
      <StatsCard
        title="Monthly Revenue"
        value={`$${statsData.monthlyRevenue.toLocaleString()}`}
        change={15.3} // Mock data - replace with actual
        icon={DollarSign}
        loading={loading}
      />
    </div>
  )
})

StatsOverview.displayName = 'StatsOverview'

const RecentActivitySection = React.memo(({ activities, loading }: {
  activities: any[]
  loading: boolean
}) => {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Recent Activity</h2>
        <div className="flex items-center text-sm text-muted-foreground">
          <Activity className="mr-1 h-4 w-4" />
          <span>2 activities</span>
        </div>
      </div>
      <ActivityFeed activities={activities} loading={loading} />
    </Card>
  )
})

RecentActivitySection.displayName = 'RecentActivitySection'

export default function DashboardPageOptimized() {
  const t = useTranslations('dashboard')
  const tCommon = useTranslations('common')
  
  // Single hook for all dashboard data with optimized caching
  const {
    data: { statistics, activities, integratedAnalytics },
    isLoading,
    isError,
    error,
    refetchAll
  } = useDashboardData()
  
  // Show error state
  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6 max-w-md">
          <div className="text-center">
            <div className="text-destructive mb-2">⚠️</div>
            <h3 className="font-semibold mb-2">Failed to Load Dashboard</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {error?.message || 'Something went wrong while loading the dashboard.'}
            </p>
            <Button onClick={() => refetchAll()} size="sm">
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to Harry School CRM Admin Panel
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/en/reports">
            <Button variant="outline">
              <TrendingUp className="mr-2 h-4 w-4" />
              View Reports
            </Button>
          </Link>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Stats Overview - Memoized */}
      <StatsOverview 
        statistics={statistics} 
        integratedAnalytics={integratedAnalytics} 
        loading={isLoading}
      />

      {/* Secondary Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Recent Enrollments"
          value={integratedAnalytics?.recentEnrollments || 0}
          change={0}
          icon={UserPlus}
          loading={isLoading}
        />
        <StatsCard
          title="Referral Conversion"
          value={`${(integratedAnalytics?.referralConversionRate || 0).toFixed(1)}%`}
          change={integratedAnalytics?.referralGrowth || 0}
          icon={Target}
          loading={isLoading}
        />
        <StatsCard
          title="Upcoming Classes"
          value={integratedAnalytics?.upcomingClasses || 0}
          change={0}
          icon={Calendar}
          loading={isLoading}
        />
        <StatsCard
          title="Referral Program ROI"
          value={`${(integratedAnalytics?.referralROI || -100).toFixed(0)}%`}
          change={integratedAnalytics?.referralROI || -100}
          icon={TrendingUp}
          loading={isLoading}
        />
      </div>

      {/* Bottom Row: Quick Actions & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions - Memoized */}
        <QuickActionsSection />
        
        {/* Recent Activity - Memoized */}
        <RecentActivitySection activities={activities || []} loading={isLoading} />
      </div>
    </div>
  )
}