export interface Teacher {
  id: string
  organization_id: string
  
  // Basic Information
  first_name: string
  last_name: string
  full_name: string
  email?: string
  phone: string
  date_of_birth?: Date
  gender?: 'male' | 'female' | 'other'
  
  // Professional Information
  employee_id?: string
  hire_date: Date
  employment_status: 'active' | 'inactive' | 'on_leave' | 'terminated'
  contract_type?: 'full_time' | 'part_time' | 'contract' | 'substitute'
  salary_amount?: number
  salary_currency: string
  
  // Education & Qualifications
  qualifications: Qualification[]
  specializations: string[]
  certifications: Certification[]
  languages_spoken: string[]
  
  // Contact & Personal
  address?: Address
  emergency_contact?: EmergencyContact
  documents: Document[]
  notes?: string
  
  // System fields
  profile_image_url?: string
  is_active: boolean
  
  // Audit fields
  created_at: Date
  updated_at: Date
  created_by?: string
  updated_by?: string
  
  // Soft delete
  deleted_at?: Date
  deleted_by?: string
}

export interface Qualification {
  id: string
  degree: string
  institution: string
  year: number
  field_of_study?: string
  gpa?: number
  country?: string
}

export interface Certification {
  id: string
  name: string
  institution: string
  issue_date: Date
  expiry_date?: Date
  credential_id?: string
  verification_url?: string
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
  address?: Address
}

export interface Document {
  id: string
  name: string
  type: 'resume' | 'diploma' | 'certificate' | 'contract' | 'id_document' | 'other'
  url: string
  upload_date: Date
  size_bytes: number
  mime_type: string
}

// Form schemas
export interface CreateTeacherRequest {
  first_name: string
  last_name: string
  email?: string
  phone: string
  date_of_birth?: Date
  gender?: 'male' | 'female' | 'other'
  employee_id?: string
  hire_date: Date
  employment_status: 'active' | 'inactive' | 'on_leave' | 'terminated'
  contract_type?: 'full_time' | 'part_time' | 'contract' | 'substitute'
  salary_amount?: number
  specializations: string[]
  qualifications: Qualification[]
  certifications: Certification[]
  languages_spoken: string[]
  address?: Address
  emergency_contact?: EmergencyContact
  notes?: string
}

export interface UpdateTeacherRequest extends Partial<CreateTeacherRequest> {
  id: string
}

// Table and filter types
export interface TeacherTableRow {
  id: string
  full_name: string
  email?: string
  phone: string
  employment_status: string
  specializations: string[]
  hire_date: Date
  active_groups: number
  total_students: number
  is_active: boolean
}

export interface TeacherFilters {
  search?: string
  employment_status?: string[]
  specializations?: string[]
  contract_type?: string[]
  hire_date_from?: Date
  hire_date_to?: Date
  is_active?: boolean
}

export interface TeacherSortConfig {
  field: keyof TeacherTableRow
  direction: 'asc' | 'desc'
}