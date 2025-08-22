'use client'

import { supabase } from '@/lib/supabase/client'
import { apiCache } from '@/lib/utils/api-cache'

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
  // Check cache first
  const cached = apiCache.getStats('dashboard')
  if (cached) {
    return cached
  }

  try {
    // OPTIMIZED: Get all stats in parallel with minimal queries
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)

    // Optimize by getting raw data in fewer queries and calculating stats
    const [
      studentsData,
      groupsData, 
      teachersData,
      recentEnrollmentsResult,
    ] = await Promise.all([
      // Get all students data for counting
      supabase
        .from('students')
        .select('is_active')
        .is('deleted_at', null),
      
      // Get all groups data for counting
      supabase
        .from('groups')
        .select('is_active')
        .is('deleted_at', null),
        
      // Get all teachers data for counting  
      supabase
        .from('teachers')
        .select('is_active')
        .is('deleted_at', null),
        
      // Get recent enrollments count
      supabase
        .from('student_group_enrollments')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString())
        .is('deleted_at', null)
    ])

    // Calculate stats from the data (much faster than separate count queries)
    const totalStudents = studentsData.data?.length || 0
    const activeStudents = studentsData.data?.filter(s => s.is_active).length || 0
    
    const totalGroups = groupsData.data?.length || 0
    const activeGroups = groupsData.data?.filter(g => g.is_active).length || 0
    
    const totalTeachers = teachersData.data?.length || 0
    const activeTeachers = teachersData.data?.filter(t => t.is_active).length || 0

    const stats = {
      totalStudents,
      activeStudents,
      totalGroups, 
      activeGroups,
      totalTeachers,
      activeTeachers,
      recentEnrollments: recentEnrollmentsResult.count || 0,
      upcomingClasses: totalGroups, // Simplified - use total groups as proxy
      monthlyRevenue: 15000, // Mock data for now - replace with real calculation
      outstandingBalance: 2500, // Mock data for now
      studentGrowth: 12.5, // Mock percentage
      revenueGrowth: 8.3, // Mock percentage
      groupGrowth: 15.2 // Mock percentage
    }

    // Cache the results for 2 minutes
    apiCache.setStats('dashboard', stats)
    
    return stats
    
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