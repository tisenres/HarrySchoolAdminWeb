'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingButton } from '@/components/ui/loading-button'
import { SkeletonStats, SkeletonCard } from '@/components/ui/skeleton-table'
import { 
  Users, 
  GraduationCap, 
  UserCheck, 
  CreditCard, 
  TrendingUp, 
  Activity, 
  Award,
  DollarSign
} from 'lucide-react'
import { PendingReferralsWidget } from '@/components/admin/dashboard/pending-referrals-widget'
import { fadeVariants, getAnimationConfig } from '@/lib/animations'

export default function DashboardPage() {
  // Combined statistics query for dashboard overview
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-statistics'],
    queryFn: async () => {
      // Fetch all statistics in parallel for better performance
      const [studentsRes, teachersRes, groupsRes] = await Promise.all([
        fetch('/api/students/statistics'),
        fetch('/api/teachers/statistics'),
        fetch('/api/groups/statistics')
      ])

      const [studentsData, teachersData, groupsData] = await Promise.all([
        studentsRes.json(),
        teachersRes.json(),
        groupsRes.json()
      ])

      return {
        students: studentsData.success ? studentsData.data : null,
        teachers: teachersData.success ? teachersData.data : null,
        groups: groupsData.success ? groupsData.data : null
      }
    },
    staleTime: 30000, // Cache for 30 seconds (dashboard stats don't change frequently)
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
  })

  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['dashboard-recent-activity'],
    queryFn: async () => {
      // TODO: Create a real recent activity endpoint
      // For now, return mock data structure
      return [
        {
          id: '1',
          type: 'student_enrolled',
          description: 'New student enrolled in Mathematics group',
          timestamp: new Date().toISOString(),
          user: 'John Doe'
        },
        {
          id: '2',
          type: 'payment_received',
          description: 'Payment received from Sarah Wilson',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          user: 'Sarah Wilson'
        }
      ]
    },
    staleTime: 60000, // Cache for 1 minute
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false,
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: 'UZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  return (
    <motion.div
      variants={fadeVariants}
      initial="hidden"
      animate="visible"
      transition={getAnimationConfig(fadeVariants)}
      className="space-y-6"
    >
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to Harry School CRM Admin Panel
        </p>
      </div>

      {/* Statistics Cards */}
      {statsLoading ? (
        <SkeletonStats />
      ) : dashboardStats ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardStats.students?.total_students || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">
                  {dashboardStats.students?.active_students || 0} active
                </span>
                {(dashboardStats.students?.inactive_students || 0) > 0 && (
                  <span className="ml-2 text-muted-foreground">
                    {dashboardStats.students?.inactive_students} inactive
                  </span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Groups</CardTitle>
              <GraduationCap className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardStats.groups?.active_groups || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {dashboardStats.groups?.total_groups || 0} total groups
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Teachers</CardTitle>
              <UserCheck className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardStats.teachers?.total_teachers || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">
                  {dashboardStats.teachers?.active_teachers || 0} active
                </span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency((dashboardStats.students?.total_balance || 0) * -1)}
              </div>
              <p className="text-xs text-muted-foreground">
                {dashboardStats.students?.pending_payments || 0} pending payments
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        {activityLoading ? (
          <SkeletonCard />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity && recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          by {activity.user}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No recent activity to display</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        <PendingReferralsWidget 
          organizationId="default-org" // This should come from auth context
          onViewAllReferrals={() => {
            // TODO: Navigate to referral management page
            console.log('Navigate to referral management')
          }}
          onContactReferral={(referral) => {
            // TODO: Handle referral contact
            console.log('Contact referral:', referral)
          }}
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <LoadingButton 
              className="w-full justify-start"
              variant="outline"
              onClick={() => window.location.href = '/dashboard/teachers'}
              loading={false}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Manage Teachers
            </LoadingButton>
            
            <LoadingButton 
              className="w-full justify-start"
              variant="outline"
              onClick={() => window.location.href = '/dashboard/groups'}
              loading={false}
            >
              <GraduationCap className="h-4 w-4 mr-2" />
              Manage Groups
            </LoadingButton>
            
            <LoadingButton 
              className="w-full justify-start"
              variant="outline"
              onClick={() => window.location.href = '/dashboard/students'}
              loading={false}
            >
              <Users className="h-4 w-4 mr-2" />
              Manage Students
            </LoadingButton>
            
            <LoadingButton 
              className="w-full justify-start"
              variant="outline"
              onClick={() => window.location.href = '/dashboard/rankings'}
              loading={false}
            >
              <Award className="h-4 w-4 mr-2" />
              View Rankings
            </LoadingButton>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}