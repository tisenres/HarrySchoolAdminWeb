export interface Group {
  id: string
  organization_id: string
  
  // Basic Information
  name: string
  group_code: string // Unique group code (e.g., "ENG-A1-2024")
  subject: string // Main subject/specialization
  level: string // Beginner, Intermediate, Advanced
  group_type?: string // regular, intensive, online, etc.
  description?: string
  
  // Capacity and Enrollment
  max_students: number // Maximum capacity
  current_enrollment: number // Current student count
  waiting_list_count?: number
  
  // Scheduling
  schedule: ScheduleSlot[]
  classroom?: string
  online_meeting_url?: string
  
  // Dates and Duration
  start_date: string
  end_date?: string
  duration_weeks?: number
  
  // Pricing
  price_per_student?: number
  currency?: string
  payment_frequency?: string // monthly, course, weekly
  
  // Academic
  curriculum?: any // JSON field for curriculum details
  required_materials?: any // JSON field for materials list
  
  // Status and Activity
  status: 'active' | 'inactive' | 'completed' | 'upcoming' | 'cancelled'
  is_active: boolean
  
  // Additional Information
  notes?: string
  
  // System fields
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
  
  // Soft delete
  deleted_at?: string
  deleted_by?: string
  
  // Relationships (populated when needed)
  teacher?: Teacher
  assigned_teachers?: Teacher[]
  enrolled_students?: Student[]
  teacher_assignments?: TeacherGroupAssignment[]
  student_enrollments?: StudentGroupEnrollment[]
}

export interface ScheduleSlot {
  day: string // monday, tuesday, etc.
  start_time: string // HH:MM format
  end_time: string // HH:MM format
  room?: string
}

export interface Teacher {
  id: string
  full_name: string
  profile_image_url?: string
  specializations: string[]
  employment_status: string
}

export interface Student {
  id: string
  full_name: string
  profile_image_url?: string
  enrollment_status: string
}

export interface TeacherGroupAssignment {
  id: string
  teacher_id: string
  group_id: string
  role?: string
  start_date: string
  end_date?: string
  status?: string
  compensation_rate?: number
  compensation_type?: string
  teacher?: Teacher
}

export interface StudentGroupEnrollment {
  id: string
  student_id: string
  group_id: string
  enrollment_date: string
  start_date: string
  end_date?: string
  status?: string
  payment_status?: string
  tuition_amount?: number
  student?: Student
}

// Form schemas
export interface CreateGroupRequest {
  name: string
  group_code: string
  subject: string
  level: string
  group_type?: string
  description?: string
  max_students: number
  schedule: ScheduleSlot[]
  classroom?: string
  online_meeting_url?: string
  start_date: string
  end_date?: string
  duration_weeks?: number
  price_per_student?: number
  currency?: string
  payment_frequency?: string
  curriculum?: any
  required_materials?: any
  notes?: string
}

export interface UpdateGroupRequest extends Partial<CreateGroupRequest> {
  id: string
}

// Table and filter types
export interface GroupTableRow {
  id: string
  name: string
  group_code: string
  subject: string
  level: string
  teacher_name?: string
  teacher_id?: string
  max_students: number
  current_enrollment: number
  enrollment_percentage: number
  status: string
  start_date: string
  schedule_summary: string
  is_active: boolean
}

export interface GroupFilters {
  search?: string
  subject?: string[]
  level?: string[]
  status?: string[]
  teacher_id?: string[]
  start_date_from?: Date
  start_date_to?: Date
  has_capacity?: boolean
  is_active?: boolean
}

export interface GroupSortConfig {
  field: keyof GroupTableRow
  direction: 'asc' | 'desc'
}

// Statistics
export interface GroupStatistics {
  total_groups: number
  active_groups: number
  upcoming_groups: number
  completed_groups: number
  total_capacity: number
  total_enrollment: number
  enrollment_rate: number
  by_subject: Record<string, number>
  by_level: Record<string, number>
  by_status: Record<string, number>
}

// Enhanced Group with calculated fields
export interface GroupWithDetails extends Group {
  teacher_name?: string
  teacher_count: number
  enrollment_percentage: number
  schedule_summary: string
  can_enroll: boolean
  is_full: boolean
}