export interface Student {
  id: string
  organization_id: string
  
  // Basic Information
  student_id: string // Unique student ID (e.g., "HS-STU-2024001")
  first_name: string
  last_name: string
  full_name: string
  date_of_birth: string
  gender: 'male' | 'female' | 'other'
  email?: string
  phone: string
  
  // Parent/Guardian Information
  parent_name: string
  parent_phone: string
  parent_email?: string
  
  // Address Information
  address: Address
  
  // Enrollment Information
  enrollment_date: string
  status: 'active' | 'inactive' | 'graduated' | 'suspended' | 'dropped'
  current_level: string
  preferred_subjects: string[]
  
  // Academic Information
  groups: string[] // Array of group IDs student is enrolled in
  academic_year?: string
  grade_level?: string
  
  // Medical & Emergency
  medical_notes?: string
  emergency_contact: EmergencyContact
  
  // Financial Information
  payment_status: 'paid' | 'pending' | 'overdue' | 'partial'
  balance: number // Outstanding balance
  tuition_fee?: number
  
  // Additional Information
  notes?: string
  profile_image_url?: string
  
  // System fields
  is_active: boolean
  
  // Audit fields
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
  
  // Soft delete
  deleted_at?: string
  deleted_by?: string
  
  // Relationships (populated when needed)
  enrolled_groups?: Group[]
  enrollment_history?: StudentGroupEnrollment[]
}

export interface Address {
  street: string
  city: string
  region: string
  postal_code?: string
  country: string
}

export interface EmergencyContact {
  name: string
  relationship: string
  phone: string
  email?: string
}

export interface Group {
  id: string
  name: string
  group_code: string
  subject: string
  level: string
  teacher_name?: string
  status: string
  schedule_summary?: string
}

export interface StudentGroupEnrollment {
  id: string
  student_id: string
  group_id: string
  enrollment_date: string
  start_date: string
  end_date?: string
  status: 'active' | 'completed' | 'withdrawn' | 'suspended'
  payment_status: 'paid' | 'pending' | 'overdue' | 'partial'
  tuition_amount?: number
  progress_notes?: string
  group?: Group
}

// Form schemas
export interface CreateStudentRequest {
  first_name: string
  last_name: string
  date_of_birth: string
  gender: 'male' | 'female' | 'other'
  email?: string
  phone: string
  parent_name: string
  parent_phone: string
  parent_email?: string
  address: Address
  enrollment_date: string
  status: 'active' | 'inactive' | 'graduated' | 'suspended' | 'dropped'
  current_level: string
  preferred_subjects: string[]
  groups?: string[]
  academic_year?: string
  grade_level?: string
  medical_notes?: string
  emergency_contact: EmergencyContact
  payment_status: 'paid' | 'pending' | 'overdue' | 'partial'
  balance?: number
  tuition_fee?: number
  notes?: string
}

export interface UpdateStudentRequest extends Partial<CreateStudentRequest> {
  id: string
}

// Table and filter types
export interface StudentTableRow {
  id: string
  student_id: string
  full_name: string
  age: number
  phone: string
  parent_name: string
  parent_phone: string
  status: string
  payment_status: string
  current_level: string
  enrolled_groups: number
  balance: number
  enrollment_date: string
  is_active: boolean
}

export interface StudentFilters {
  search?: string
  status?: string[]
  payment_status?: string[]
  current_level?: string[]
  grade_level?: string[]
  preferred_subjects?: string[]
  groups?: string[]
  enrollment_date_from?: Date
  enrollment_date_to?: Date
  age_from?: number
  age_to?: number
  has_balance?: boolean
  is_active?: boolean
}

export interface StudentSortConfig {
  field: keyof StudentTableRow
  direction: 'asc' | 'desc'
}

// Statistics
export interface StudentStatistics {
  total_students: number
  active_students: number
  inactive_students: number
  graduated_students: number
  suspended_students: number
  total_enrollment: number
  pending_payments: number
  overdue_payments: number
  total_balance: number
  by_status: Record<string, number>
  by_level: Record<string, number>
  by_payment_status: Record<string, number>
  enrollment_trend: {
    month: string
    count: number
  }[]
}

// Enhanced Student with calculated fields
export interface StudentWithDetails extends Student {
  age: number
  enrolled_groups_count: number
  enrollment_percentage: number
  payment_due_date?: string
  can_graduate: boolean
  attendance_rate?: number
}