import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, UserCheck, TrendingUp, DollarSign, Calendar, BookOpen, Activity } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { StatsCard } from '@/components/admin/dashboard/stats-card'
import { EnrollmentChart } from '@/components/admin/dashboard/enrollment-chart'
import { RevenueChart } from '@/components/admin/dashboard/revenue-chart'
import { ActivityFeed } from '@/components/admin/dashboard/activity-feed'
import { 
  getDashboardStatistics, 
  getRecentActivity, 
  getEnrollmentTrends,
  getRevenueOverview 
} from '@/lib/dashboard/statistics'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const tNav = await getTranslations('navigation')
  const t = await getTranslations('dashboard')
  
  // Fetch all dashboard data with error handling
  let statistics, activities, enrollmentTrends, revenueData
  
  try {
    [statistics, activities, enrollmentTrends, revenueData] = await Promise.all([
      getDashboardStatistics(),
      getRecentActivity(8),
      getEnrollmentTrends(6),
      getRevenueOverview(6)
    ])
  } catch (error) {
    console.error('Dashboard data fetch error:', error)
    // Provide safe defaults
    statistics = {
      totalStudents: 0,
      activeStudents: 0,
      totalTeachers: 0,
      activeTeachers: 0,
      totalGroups: 0,
      activeGroups: 0,
      recentEnrollments: 0,
      monthlyRevenue: 0,
      outstandingPayments: 0,
      upcomingClasses: 0
    }
    activities = []
    enrollmentTrends = []
    revenueData = []
  }
  
  // Calculate percentage changes (mock data for now, would calculate from historical data)
  const studentGrowth = statistics.totalStudents > 0 ? 12.5 : 0
  const groupGrowth = statistics.activeGroups > 0 ? 8.3 : 0
  const revenueGrowth = statistics.monthlyRevenue > 0 ? 15.2 : 0
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">
            {tNav('welcomeMessage')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/reports">
              View Reports
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/students/new">
              Add Student
            </Link>
          </Button>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title={t('totalStudents')}
          value={statistics.totalStudents}
          subtitle={`${statistics.activeStudents} active`}
          icon="Users"
          color="blue"
          {...(studentGrowth > 0 && { trend: { value: studentGrowth, isPositive: true } })}
        />
        <StatsCard
          title={t('activeGroups')}
          value={statistics.activeGroups}
          subtitle={`${statistics.totalGroups} total groups`}
          icon="GraduationCap"
          color="green"
          {...(groupGrowth > 0 && { trend: { value: groupGrowth, isPositive: true } })}
        />
        <StatsCard
          title={t('totalTeachers')}
          value={statistics.totalTeachers}
          subtitle={`${statistics.activeTeachers} active`}
          icon="UserCheck"
          color="purple"
        />
        <StatsCard
          title="Monthly Revenue"
          value={`$${statistics.monthlyRevenue.toLocaleString()}`}
          subtitle={`$${statistics.outstandingPayments.toLocaleString()} outstanding`}
          icon="DollarSign"
          color="green"
          {...(revenueGrowth > 0 && { trend: { value: revenueGrowth, isPositive: true } })}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Recent Enrollments
              </p>
              <p className="text-2xl font-bold">{statistics.recentEnrollments}</p>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500" strokeWidth={1.5} />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Upcoming Classes
              </p>
              <p className="text-2xl font-bold">{statistics.upcomingClasses}</p>
              <p className="text-xs text-muted-foreground">Next 7 days</p>
            </div>
            <Calendar className="h-8 w-8 text-purple-500" strokeWidth={1.5} />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Outstanding Balance
              </p>
              <p className="text-2xl font-bold text-red-600">
                ${statistics.outstandingPayments.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">To be collected</p>
            </div>
            <Activity className="h-8 w-8 text-red-500" strokeWidth={1.5} />
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <EnrollmentChart 
          data={enrollmentTrends}
          title="Enrollment Trends"
          description="New student enrollments over the last 6 months"
        />
        <RevenueChart 
          data={revenueData}
          title="Revenue Overview"
          description="Monthly revenue and outstanding payments"
        />
      </div>

      {/* Activity Feed and Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityFeed 
          activities={activities}
          title={t('recentActivity')}
          description="Latest updates from your school"
        />
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">{t('quickActions')}</h3>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/teachers/new">
                <UserCheck className="mr-2 h-4 w-4" />
                {t('addTeacher')}
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/groups/new">
                <BookOpen className="mr-2 h-4 w-4" />
                {t('createGroup')}
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/students/new">
                <Users className="mr-2 h-4 w-4" />
                {t('enrollStudent')}
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/finance/payments/new">
                <DollarSign className="mr-2 h-4 w-4" />
                {t('recordPayment')}
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
      </div>
    </div>
  )
}