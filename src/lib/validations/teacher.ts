import { z } from 'zod'

// Address schema
export const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
})

// Emergency contact schema
export const emergencyContactSchema = z.object({
  name: z.string().optional(),
  relationship: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  address: addressSchema.optional(),
})

// Qualification schema
export const qualificationSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  degree: z.string().optional(),
  institution: z.string().optional(),
  year: z.number().min(1950).max(new Date().getFullYear()).optional(),
  field_of_study: z.string().optional(),
  gpa: z.number().min(0).max(4).optional(),
  country: z.string().optional(),
})

// Certification schema
export const certificationSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  name: z.string().optional(),
  institution: z.string().optional(),
  issue_date: z.date().optional(),
  expiry_date: z.date().optional(),
  credential_id: z.string().optional(),
  verification_url: z.string().url('Invalid URL').optional().or(z.literal('')),
})

// SIMPLIFIED: Only name and phone are required
export const createTeacherSchema = z.object({
  // REQUIRED - Only these fields
  first_name: z.string()
    .min(1, 'First name is required')
    .max(100, 'First name must be less than 100 characters'),
  
  last_name: z.string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be less than 100 characters'),
  
  phone: z.string()
    .min(1, 'Phone number is required'),
  
  // OPTIONAL - Everything else
  email: z.string()
    .email('Invalid email format')
    .optional()
    .or(z.literal('')),
  
  date_of_birth: z.date()
    .max(new Date(), 'Date of birth cannot be in the future')
    .optional(),
  
  gender: z.enum(['male', 'female', 'other']).optional(),
  
  // Professional Information (Optional)
  employee_id: z.string().optional(),
  hire_date: z.date().optional(),
  employment_status: z.enum(['active', 'inactive', 'on_leave', 'terminated']).default('active'),
  contract_type: z.enum(['full_time', 'part_time', 'contract', 'substitute']).optional(),
  salary_amount: z.number().min(0).optional(),
  salary_currency: z.string().default('UZS'),
  
  // Education & Qualifications (Optional)
  qualifications: z.array(qualificationSchema).default([]),
  specializations: z.array(z.string()).default([]),
  certifications: z.array(certificationSchema).default([]),
  languages_spoken: z.array(z.string()).default([]),
  
  // Contact & Personal (Optional)
  address: addressSchema.optional(),
  emergency_contact: emergencyContactSchema.optional(),
  notes: z.string().optional(),
  
  // Teaching Preferences (Optional)
  preferred_subjects: z.array(z.string()).default([]),
  preferred_grades: z.array(z.string()).default([]),
  max_weekly_hours: z.number().min(1).max(60).optional(),
  availability: z.record(z.string(), z.any()).optional(),
  
  // System fields
  is_active: z.boolean().default(true),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
})

export const updateTeacherSchema = createTeacherSchema.partial().extend({
  id: z.string().uuid('Invalid teacher ID').optional(),
})

// Filter schema
export const teacherFiltersSchema = z.object({
  search: z.string().optional(),
  employment_status: z.array(z.string()).optional(),
  contract_type: z.array(z.string()).optional(),
  specializations: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  hire_date_from: z.date().optional(),
  hire_date_to: z.date().optional(),
  salary_min: z.number().optional(),
  salary_max: z.number().optional(),
  is_active: z.boolean().optional(),
})

// Sort schema
export const teacherSortSchema = z.object({
  field: z.enum([
    'full_name',
    'employee_id',
    'email',
    'phone',
    'employment_status',
    'contract_type',
    'hire_date',
    'salary_amount',
    'created_at',
    'updated_at'
  ]),
  direction: z.enum(['asc', 'desc']),
})

// Assignment schema
export const teacherAssignmentSchema = z.object({
  teacher_id: z.string().uuid('Invalid teacher ID'),
  group_id: z.string().uuid('Invalid group ID'),
  role: z.enum(['primary', 'assistant', 'substitute']).default('primary'),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
})

// Performance evaluation schema
export const performanceEvaluationSchema = z.object({
  teacher_id: z.string().uuid('Invalid teacher ID'),
  evaluation_date: z.date(),
  evaluator_id: z.string().uuid('Invalid evaluator ID'),
  overall_rating: z.number().min(1).max(5),
  categories: z.record(z.string(), z.number().min(1).max(5)),
  comments: z.string().optional(),
  goals: z.array(z.string()).optional(),
  action_items: z.array(z.string()).optional(),
})

// Payroll schema
export const payrollSchema = z.object({
  teacher_id: z.string().uuid('Invalid teacher ID'),
  period_start: z.date(),
  period_end: z.date(),
  base_salary: z.number().min(0),
  bonuses: z.number().min(0).default(0),
  deductions: z.number().min(0).default(0),
  net_amount: z.number().min(0),
  payment_date: z.date().optional(),
  payment_method: z.enum(['bank_transfer', 'cash', 'cheque']).optional(),
  payment_status: z.enum(['pending', 'paid', 'cancelled']).default('pending'),
})

export type CreateTeacherRequest = z.infer<typeof createTeacherSchema>
export type UpdateTeacherRequest = z.infer<typeof updateTeacherSchema>
export type TeacherFilters = z.infer<typeof teacherFiltersSchema>
export type TeacherSort = z.infer<typeof teacherSortSchema>
export type TeacherAssignment = z.infer<typeof teacherAssignmentSchema>
export type PerformanceEvaluation = z.infer<typeof performanceEvaluationSchema>
export type Payroll = z.infer<typeof payrollSchema>