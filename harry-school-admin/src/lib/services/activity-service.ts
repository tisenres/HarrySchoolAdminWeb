'use client'

import { supabase } from '@/lib/supabase/client'

interface ActivityLog {
  id: string
  action: string
  resource_type: string
  resource_name: string | null
  description: string | null
  metadata: Record<string, any> | null
  created_at: string
  user_name: string | null
}

interface Activity {
  id: string
  type: 'enrollment' | 'payment' | 'group_creation' | 'teacher_assignment' | 'student_update' | 'other'
  description: string
  timestamp: string
  metadata?: Record<string, any>
}

const mapActionToType = (action: string, resourceType: string): Activity['type'] => {
  const actionLower = action.toLowerCase()
  const resourceLower = resourceType.toLowerCase()
  
  if (actionLower === 'create' && resourceLower === 'student') return 'enrollment'
  if (actionLower === 'create' && resourceLower === 'payment') return 'payment'
  if (actionLower === 'create' && resourceLower === 'group') return 'group_creation'
  if (actionLower === 'create' && resourceLower === 'teacher_assignment') return 'teacher_assignment'
  if (actionLower === 'update' && resourceLower === 'student') return 'student_update'
  
  return 'other'
}

const formatDescription = (log: ActivityLog): string => {
  const action = log.action.toLowerCase()
  const resourceType = log.resource_type.toLowerCase()
  const resourceName = log.resource_name || 'Unknown'
  const userName = log.user_name || 'Someone'
  
  // Use custom description if available
  if (log.description) {
    return log.description
  }
  
  // Generate description based on action and resource
  switch (`${action}_${resourceType}`) {
    case 'create_student':
      return `New student enrolled: ${resourceName}`
    case 'create_payment':
      const amount = log.metadata?.amount ? `$${log.metadata.amount}` : ''
      return `Payment received ${amount}`.trim()
    case 'create_group':
      return `New group created: ${resourceName}`
    case 'create_teacher':
      return `New teacher added: ${resourceName}`
    case 'update_student':
      return `Student updated: ${resourceName}`
    case 'create_teacher_assignment':
      return `Teacher assigned to group`
    default:
      return `${action.charAt(0).toUpperCase() + action.slice(1)} ${resourceType}: ${resourceName}`
  }
}

export async function getRecentActivities(limit: number = 10): Promise<Activity[]> {
  try {
    
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('success', true)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('Error fetching activities:', error)
      return []
    }
    
    if (!data) return []
    
    return data.map((log: ActivityLog): Activity => ({
      id: log.id,
      type: mapActionToType(log.action, log.resource_type),
      description: formatDescription(log),
      timestamp: log.created_at,
      metadata: log.metadata || undefined
    }))
    
  } catch (error) {
    console.error('Error in getRecentActivities:', error)
    return []
  }
}

export async function getDashboardStats() {
  try {
    
    // Get counts for different entities
    const [studentsResult, groupsResult, teachersResult] = await Promise.all([
      supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null),
      supabase
        .from('groups')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null),
      supabase
        .from('teachers')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null)
    ])
    
    // Get active counts
    const [activeStudentsResult, activeGroupsResult, activeTeachersResult] = await Promise.all([
      supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .is('deleted_at', null),
      supabase
        .from('groups')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .is('deleted_at', null),
      supabase
        .from('teachers')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .is('deleted_at', null)
    ])
    
    // Get recent enrollments (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { count: recentEnrollments } = await supabase
      .from('student_group_enrollments')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString())
      .is('deleted_at', null)
    
    // Get upcoming classes (next 7 days) from active groups
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    
    const { count: upcomingClasses } = await supabase
      .from('groups')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .lte('start_date', nextWeek.toISOString())
      .gte('start_date', new Date().toISOString())
      .is('deleted_at', null)
    
    // Get outstanding balance from payments
    const { data: paymentsData } = await supabase
      .from('payments')
      .select('amount, status')
      .in('status', ['pending', 'overdue'])
    
    const outstandingBalance = paymentsData?.reduce((sum, payment) => 
      sum + (payment.amount || 0), 0) || 0
    
    // Calculate monthly revenue (current month)
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    
    const { data: monthlyPayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed')
      .gte('created_at', startOfMonth.toISOString())
    
    const monthlyRevenue = monthlyPayments?.reduce((sum, payment) => 
      sum + (payment.amount || 0), 0) || 0
    
    // Calculate growth percentages (current vs 30 days ago)
    const previousPeriod = new Date()
    previousPeriod.setDate(previousPeriod.getDate() - 60) // 60 days ago
    const midPeriod = new Date()
    midPeriod.setDate(midPeriod.getDate() - 30) // 30 days ago

    // Previous period students count
    const { count: previousStudents } = await supabase
      .from('students')
      .select('id', { count: 'exact', head: true })
      .lte('created_at', midPeriod.toISOString())
      .is('deleted_at', null)

    // Previous period groups count
    const { count: previousGroups } = await supabase
      .from('groups')
      .select('id', { count: 'exact', head: true })
      .lte('created_at', midPeriod.toISOString())
      .is('deleted_at', null)

    // Previous period revenue
    const { data: previousPayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed')
      .gte('created_at', previousPeriod.toISOString())
      .lte('created_at', midPeriod.toISOString())

    const previousRevenue = previousPayments?.reduce((sum, payment) => 
      sum + (payment.amount || 0), 0) || 0

    // Calculate growth percentages
    const calculateGrowth = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0
      return Number(((current - previous) / previous * 100).toFixed(1))
    }

    const studentGrowth = calculateGrowth(studentsResult.count || 0, previousStudents || 0)
    const groupGrowth = calculateGrowth(groupsResult.count || 0, previousGroups || 0)
    const revenueGrowth = calculateGrowth(monthlyRevenue, previousRevenue)
    
    return {
      totalStudents: studentsResult.count || 0,
      activeStudents: activeStudentsResult.count || 0,
      totalGroups: groupsResult.count || 0,
      activeGroups: activeGroupsResult.count || 0,
      totalTeachers: teachersResult.count || 0,
      activeTeachers: activeTeachersResult.count || 0,
      recentEnrollments: recentEnrollments || 0,
      upcomingClasses: upcomingClasses || 0,
      outstandingBalance,
      monthlyRevenue,
      studentGrowth,
      groupGrowth,
      revenueGrowth
    }
    
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return {
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
      revenueGrowth: 0
    }
  }
}