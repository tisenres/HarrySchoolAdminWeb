'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Award,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Minus,
  Star,
  Settings,
  Filter,
  Download
} from 'lucide-react'
import { QuickPointAward } from '../students/ranking/quick-point-award'
import { BulkPointsOperations } from './bulk-points-operations'
import { PointsApprovalQueue } from './points-approval-queue'
import { PointsAnalyticsDashboard } from './points-analytics-dashboard'
import { PointsTransactionHistory } from '../students/ranking/points-transaction-history'
import type { PointsAwardRequest, PointsTransaction, RankingAnalytics } from '@/types/ranking'
import type { Student } from '@/types/student'
import { fadeVariants, slideInVariants } from '@/lib/animations'

interface PointsManagementDashboardProps {
  students: Student[]
  selectedStudents: string[]
  onSelectionChange: (studentIds: string[]) => void
  onStudentsRefresh?: () => Promise<void>
}

// Mock analytics data - in real implementation, fetch from API
const generateMockAnalytics = (): RankingAnalytics => ({
  total_points_awarded: 15420,
  total_students_participating: 156,
  average_points_per_student: 99,
  most_active_day: new Date().toISOString().split('T')[0],
  top_performers: [],
  recent_activity: [],
  achievement_distribution: [
    { achievement_id: '1', achievement_name: 'Homework Hero', times_earned: 45 },
    { achievement_id: '2', achievement_name: 'Perfect Attendance', times_earned: 32 },
    { achievement_id: '3', achievement_name: 'Helping Hand', times_earned: 28 },
  ],
  points_by_category: [
    { category: 'homework', total_points: 6800, transaction_count: 340 },
    { category: 'attendance', total_points: 4200, transaction_count: 840 },
    { category: 'behavior', total_points: 3120, transaction_count: 520 },
    { category: 'achievement', total_points: 1300, transaction_count: 65 },
  ]
})

// Mock pending approvals
const generateMockPendingApprovals = () => [
  {
    id: 'approval-1',
    student_id: 'student-1',
    points_amount: 75,
    reason: 'Outstanding project presentation and leadership',
    category: 'achievement',
    requested_by: 'teacher-1',
    requested_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    student_name: 'Alice Johnson',
    requested_by_name: 'Ms. Smith'
  },
  {
    id: 'approval-2', 
    student_id: 'student-2',
    points_amount: -25,
    reason: 'Repeated homework not completed',
    category: 'homework',
    requested_by: 'teacher-2',
    requested_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    student_name: 'Bob Wilson',
    requested_by_name: 'Mr. Davis'
  }
]

export function PointsManagementDashboard({
  students,
  selectedStudents,
  onSelectionChange,
  onStudentsRefresh
}: PointsManagementDashboardProps) {
  const t = useTranslations('points')
  const [activeTab, setActiveTab] = useState('overview')
  const [analytics, setAnalytics] = useState<RankingAnalytics | null>(null)
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [isQuickAwardOpen, setIsQuickAwardOpen] = useState(false)
  const [isBulkOperationsOpen, setIsBulkOperationsOpen] = useState(false)

  // Load analytics and pending approvals
  useEffect(() => {
    setAnalytics(generateMockAnalytics())
    setPendingApprovals(generateMockPendingApprovals())
  }, [])

  const handleQuickPointAward = async (data: PointsAwardRequest) => {
    setLoading(true)
    try {
      // Mock API call - in real implementation, make actual API request
      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log('Quick point award:', data)
      
      // Refresh data
      await onStudentsRefresh?.()
      setAnalytics(generateMockAnalytics())
    } catch (error) {
      console.error('Error awarding points:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const handleBulkPointAward = async (data: PointsAwardRequest) => {
    setLoading(true)
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      console.log('Bulk point award:', data)
      
      // Clear selection after bulk operation
      onSelectionChange([])
      
      // Refresh data
      await onStudentsRefresh?.()
      setAnalytics(generateMockAnalytics())
    } catch (error) {
      console.error('Error with bulk operation:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const handleApproval = async (approvalId: string, action: 'approve' | 'reject', notes?: string) => {
    setLoading(true)
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Remove from pending approvals
      setPendingApprovals(prev => prev.filter(approval => approval.id !== approvalId))
      
      console.log(`${action} approval ${approvalId}`, notes)
      
      // Refresh data if approved
      if (action === 'approve') {
        await onStudentsRefresh?.()
        setAnalytics(generateMockAnalytics())
      }
    } catch (error) {
      console.error('Error processing approval:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const selectedStudentNames = students
    .filter(student => selectedStudents.includes(student.id))
    .map(student => student.full_name)

  if (!analytics) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      variants={fadeVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header with Quick Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Points Management</h1>
          <p className="text-muted-foreground">
            Manage student points, rewards, and achievements across your organization
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsQuickAwardOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Quick Award
          </Button>
          {selectedStudents.length > 0 && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsBulkOperationsOpen(true)}
            >
              <Users className="h-4 w-4 mr-2" />
              Bulk Operations ({selectedStudents.length})
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div variants={slideInVariants} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Points Awarded</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.total_points_awarded.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={slideInVariants} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.total_students_participating}</div>
              <p className="text-xs text-muted-foreground">
                {((analytics.total_students_participating / students.length) * 100).toFixed(0)}% participation
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={slideInVariants} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Points</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.average_points_per_student}</div>
              <p className="text-xs text-muted-foreground">
                per student this month
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={slideInVariants} initial="hidden" animate="visible" transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingApprovals.length}</div>
              <p className="text-xs text-muted-foreground">
                {pendingApprovals.filter(a => a.points_amount > 50 || a.points_amount < -10).length} require review
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="approvals" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Approvals</span>
            {pendingApprovals.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pendingApprovals.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>History</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <Star className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <PointsAnalyticsDashboard analytics={analytics} />
        </TabsContent>

        <TabsContent value="approvals" className="space-y-6">
          <PointsApprovalQueue
            pendingApprovals={pendingApprovals}
            onApproval={handleApproval}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <PointsTransactionHistory
            transactions={[]} // Will be populated from API
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="text-center py-12">
            <Star className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Advanced Analytics Coming Soon</h3>
            <p className="text-muted-foreground">
              Detailed points analytics, student performance insights, and trend analysis will be available in the next update.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Point Award Modal */}
      <QuickPointAward
        open={isQuickAwardOpen}
        onOpenChange={setIsQuickAwardOpen}
        studentIds={selectedStudents.length > 0 ? selectedStudents : []}
        studentNames={selectedStudentNames}
        onSubmit={handleQuickPointAward}
        loading={loading}
      />

      {/* Bulk Operations Modal */}
      <BulkPointsOperations
        open={isBulkOperationsOpen}
        onOpenChange={setIsBulkOperationsOpen}
        selectedStudents={selectedStudents}
        selectedStudentNames={selectedStudentNames}
        onSubmit={handleBulkPointAward}
        loading={loading}
      />
    </motion.div>
  )
}