'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, UserCheck, UserPlus, TrendingUp, Calendar, BookOpen, Activity, Target } from 'lucide-react'
import Link from 'next/link'
import { StatsCard } from '@/components/admin/dashboard/stats-card'
import { ActivityFeed } from '@/components/admin/dashboard/activity-feed'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { getRecentActivities, getDashboardStats } from '@/lib/services/activity-service'
import { dashboardAnalyticsService } from '@/lib/services/dashboard-analytics-service'
import type { DashboardAnalytics } from '@/lib/services/dashboard-analytics-service'

interface DashboardStats {
  totalStudents: number
  activeStudents: number
  totalGroups: number
  activeGroups: number
  totalTeachers: number
  activeTeachers: number
  recentEnrollments: number
  upcomingClasses: number
  outstandingBalance: number
  monthlyRevenue: number
  studentGrowth: number
  groupGrowth: number
  revenueGrowth: number
}

interface Activity {
  id: string
  type: 'enrollment' | 'payment' | 'group_creation' | 'teacher_assignment' | 'student_update' | 'other'
  description: string
  timestamp: string
  metadata?: Record<string, any>
}

export default function DashboardPage() {
  const t = useTranslations('dashboard')
  const tCommon = useTranslations('common')
  const tQuickActions = useTranslations('quickActions')
  
  const [statistics, setStatistics] = useState<DashboardStats>({
    totalStudents: 0,
    activeStudents: 0,
    totalGroups: 0,
    activeGroups: 0,
    totalTeachers: 0,
    activeTeachers: 0,
    recentEnrollments: 0,
    upcomingClasses: 0,
    outstandingBalance: 0,
    monthlyRevenue: 0,
    studentGrowth: 0,
    groupGrowth: 0,
    revenueGrowth: 0,
  })
  const [integratedAnalytics, setIntegratedAnalytics] = useState<DashboardAnalytics | null>(null)
  const [activities, setActivities] = useState<any[]>([])
  // const [loading, setLoading] = useState(true) // Temporarily commented out for TypeScript

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Get organization ID from localStorage or use a default
        const organizationId = localStorage.getItem('organizationId') || '550e8400-e29b-41d4-a716-446655440000'
        
        const [statsData, activitiesData, integratedData] = await Promise.allSettled([
          getDashboardStats(),
          getRecentActivities(5),
          dashboardAnalyticsService.getIntegratedDashboardStats(organizationId)
        ])
        
        // Handle successful results
        if (statsData.status === 'fulfilled') {
          setStatistics(statsData.value as DashboardStats)
        }
        if (activitiesData.status === 'fulfilled') {
          setActivities(activitiesData.value)
        }
        if (integratedData.status === 'fulfilled') {
          setIntegratedAnalytics(integratedData.value)
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        // setLoading(false) // Temporarily commented out for TypeScript
      }
    }

    loadDashboardData()
  }, [])

  // Growth percentages are now included in statistics from getDashboardStats

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('welcomeMessage')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/reports">
              {t('viewReports')}
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/students/new">
              {tQuickActions('addStudent')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title={t('totalStudents')}
          value={statistics.totalStudents}
          subtitle={`${statistics.activeStudents} ${tCommon('active')} • ${integratedAnalytics?.totalReferrals || 0} referred`}
          icon="Users"
          color="blue"
          {...(statistics.studentGrowth > 0 && { trend: { value: statistics.studentGrowth, isPositive: true } })}
        />
        <StatsCard
          title={t('activeGroups')}
          value={statistics.activeGroups}
          subtitle={`${statistics.totalGroups} ${t('totalGroups')}`}
          icon="GraduationCap"
          color="green"
          {...(statistics.groupGrowth > 0 && { trend: { value: statistics.groupGrowth, isPositive: true } })}
        />
        <StatsCard
          title={t('totalTeachers')}
          value={statistics.totalTeachers}
          subtitle={`${statistics.activeTeachers} ${tCommon('active')}`}
          icon="UserCheck"
          color="purple"
        />
        <StatsCard
          title={t('monthlyRevenue')}
          value={`$${statistics.monthlyRevenue.toLocaleString()}`}
          subtitle={`$${statistics.outstandingBalance.toLocaleString()} ${t('outstanding')} • $${(integratedAnalytics?.referralRevenue || 0).toLocaleString()} from referrals`}
          icon="DollarSign"
          color="green"
          {...(statistics.revenueGrowth > 0 && { trend: { value: statistics.revenueGrowth, isPositive: true } })}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t('recentEnrollments')}
              </p>
              <p className="text-2xl font-bold">{statistics.recentEnrollments}</p>
              <p className="text-xs text-muted-foreground">{t('last30Days')}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500" strokeWidth={1.5} />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Referral Conversion
              </p>
              <p className="text-2xl font-bold text-green-600">
                {(integratedAnalytics?.referralConversionRate || 0).toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">
                {integratedAnalytics?.pendingReferrals || 0} pending
              </p>
            </div>
            <UserPlus className="h-8 w-8 text-green-500" strokeWidth={1.5} />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t('upcomingClasses')}
              </p>
              <p className="text-2xl font-bold">{statistics.upcomingClasses}</p>
              <p className="text-xs text-muted-foreground">{t('next7Days')}</p>
            </div>
            <Calendar className="h-8 w-8 text-purple-500" strokeWidth={1.5} />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Referral Program ROI
              </p>
              <p className="text-2xl font-bold text-indigo-600">
                {(integratedAnalytics?.referralROI || 0).toFixed(0)}%
              </p>
              <p className="text-xs text-muted-foreground">Return on investment</p>
            </div>
            <Target className="h-8 w-8 text-indigo-500" strokeWidth={1.5} />
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">{t('quickActions')}</h3>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/teachers">
                <UserCheck className="mr-2 h-4 w-4" />
                {t('manageTeachers')}
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/groups">
                <BookOpen className="mr-2 h-4 w-4" />
                {t('viewGroups')}
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/students">
                <Users className="mr-2 h-4 w-4" />
                {t('manageStudents')}
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/reports">
                <Activity className="mr-2 h-4 w-4" />
                {t('viewReports')}
              </Link>
            </Button>
          </div>
        </Card>

        <ActivityFeed 
          activities={activities}
          title={t('recentActivity')}
          description="Latest updates from your school"
          limit={5}
        />
      </div>
    </div>
  )
}