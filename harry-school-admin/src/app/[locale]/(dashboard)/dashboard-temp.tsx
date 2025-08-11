'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, UserCheck, TrendingUp, DollarSign, Calendar, BookOpen, Activity } from 'lucide-react'
import Link from 'next/link'
import { StatsCard } from '@/components/admin/dashboard/stats-card'

export default function DashboardPageClient() {
  // Mock data to avoid server imports
  const statistics = {
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

  const studentGrowth = 12.5
  const groupGrowth = 8.3
  const revenueGrowth = 15.2

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome to Harry School Admin Panel
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
          title="Total Students"
          value={statistics.totalStudents}
          subtitle={`${statistics.activeStudents} active`}
          icon="Users"
          color="blue"
          trend={{ value: studentGrowth, isPositive: true }}
        />
        <StatsCard
          title="Active Groups"
          value={statistics.activeGroups}
          subtitle={`${statistics.totalGroups} total groups`}
          icon="GraduationCap"
          color="green"
          trend={{ value: groupGrowth, isPositive: true }}
        />
        <StatsCard
          title="Total Teachers"
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
          trend={{ value: revenueGrowth, isPositive: true }}
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

      {/* Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/teachers">
                <UserCheck className="mr-2 h-4 w-4" />
                Manage Teachers
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/groups">
                <BookOpen className="mr-2 h-4 w-4" />
                View Groups
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/students">
                <Users className="mr-2 h-4 w-4" />
                Manage Students
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/reports">
                <Activity className="mr-2 h-4 w-4" />
                View Reports
              </Link>
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div className="space-y-1">
                <p className="text-sm font-medium">New student enrolled</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Payment received</p>
                <p className="text-xs text-muted-foreground">4 hours ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div className="space-y-1">
                <p className="text-sm font-medium">New group created</p>
                <p className="text-xs text-muted-foreground">6 hours ago</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}