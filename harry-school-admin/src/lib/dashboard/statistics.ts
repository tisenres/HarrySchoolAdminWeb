export interface DashboardStatistics {
  totalStudents: number
  activeStudents: number
  totalTeachers: number
  activeTeachers: number
  totalGroups: number
  activeGroups: number
  recentEnrollments: number
  monthlyRevenue: number
  outstandingPayments: number
  upcomingClasses: number
}

export interface Activity {
  id: string
  type: 'enrollment' | 'payment' | 'group_creation' | 'teacher_assignment'
  description: string
  timestamp: string
  metadata?: Record<string, any>
}

export interface EnrollmentTrend {
  date: string
  count: number
}

export interface RevenueData {
  date: string
  amount: number
  type: 'payment' | 'invoice'
}

export async function getDashboardStatistics(): Promise<DashboardStatistics> {
  // This is a mock implementation for testing
  // In production, this would fetch from Supabase
  return {
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
}

export async function getRecentActivity(limit: number = 10): Promise<Activity[]> {
  // Mock implementation for testing
  return []
}

export async function getEnrollmentTrends(): Promise<EnrollmentTrend[]> {
  // Mock implementation for testing
  return []
}

export async function getRevenueOverview(): Promise<RevenueData[]> {
  // Mock implementation for testing
  return []
}