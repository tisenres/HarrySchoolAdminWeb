import { z } from 'zod'

// Address schema (reused from teacher validation)
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
})

// SIMPLIFIED: Only name and phone are required
export const createStudentSchema = z.object({
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
  date_of_birth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  
  // Parent/Guardian Information (Optional)
  parent_name: z.string().optional(),
  parent_phone: z.string().optional(),
  parent_email: z.string().email('Invalid parent email format').optional().or(z.literal('')),
  
  // Address Information (Optional)
  address: addressSchema.partial().optional(),
  
  // Enrollment Information (Optional)
  enrollment_date: z.string().optional(),
  status: z.enum(['active', 'inactive', 'graduated', 'suspended', 'dropped']).default('active'),
  current_level: z.string().optional(),
  preferred_subjects: z.array(z.string()).optional(),
  
  // Academic Information (Optional)
  groups: z.array(z.string()).default([]),
  academic_year: z.string().optional(),
  grade_level: z.string().optional(),
  
  // Medical & Emergency (Optional)
  medical_notes: z.string().optional(),
  emergency_contact: emergencyContactSchema.partial().optional(),
  
  // Financial Information (Optional with defaults)
  payment_status: z.enum(['paid', 'pending', 'overdue', 'partial']).default('pending'),
  balance: z.number().default(0),
  tuition_fee: z.number().optional(),
  monthly_fee: z.number().optional(), // NEW: Monthly payment tracking
  last_payment_date: z.string().optional(), // NEW: Track last payment
  
  // Student App Fields (NEW)
  app_login_email: z.string().email().optional(),
  app_login_phone: z.string().optional(),
  push_notification_token: z.string().optional(),
  outstanding_balance: z.number().default(0),
  
  // Additional Information (Optional)
  notes: z.string().optional(),
  
  // System fields
  is_active: z.boolean().default(true),
})

export const updateStudentSchema = createStudentSchema.partial().extend({
  id: z.string().uuid('Invalid student ID').optional(),
})

// Filter schema - REMOVED age restrictions
export const studentFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.array(z.string()).optional(),
  payment_status: z.array(z.string()).optional(),
  current_level: z.array(z.string()).optional(),
  grade_level: z.array(z.string()).optional(),
  preferred_subjects: z.array(z.string()).optional(),
  groups: z.array(z.string()).optional(),
  enrollment_date_from: z.date().optional(),
  enrollment_date_to: z.date().optional(),
  // REMOVED: age_from and age_to
  has_balance: z.boolean().optional(),
  is_active: z.boolean().optional(),
})

// Sort schema
export const studentSortSchema = z.object({
  field: z.enum([
    'full_name', 
    'student_id',
    'age', 
    'phone', 
    'parent_name', 
    'status', 
    'payment_status',
    'current_level', 
    'enrolled_groups', 
    'balance', 
    'enrollment_date'
  ]),
  direction: z.enum(['asc', 'desc']),
})

// Enrollment schema
export const enrollmentSchema = z.object({
  student_id: z.string().uuid('Invalid student ID'),
  group_id: z.string().uuid('Invalid group ID'),
  start_date: z.string().optional(),
  tuition_amount: z.number().optional(),
  payment_status: z.enum(['paid', 'pending', 'overdue', 'partial']).default('pending'),
})

// Monthly Payment Schema (NEW)
export const monthlyPaymentSchema = z.object({
  student_id: z.string().uuid('Invalid student ID'),
  month: z.string(), // Format: "2024-01"
  amount: z.number().min(0),
  paid: z.boolean().default(false),
  due_date: z.string(),
  paid_date: z.string().optional(),
  payment_method: z.enum(['cash', 'card', 'transfer']).optional(),
  notes: z.string().optional(),
})

// Payment update schema
export const paymentUpdateSchema = z.object({
  student_id: z.string().uuid('Invalid student ID'),
  payment_status: z.enum(['paid', 'pending', 'overdue', 'partial']),
  balance: z.number().min(0, 'Balance must be non-negative'),
  payment_amount: z.number().min(0, 'Payment amount must be non-negative').optional(),
  payment_notes: z.string().max(500, 'Payment notes must be less than 500 characters').optional(),
})

// Bulk operations schema
export const bulkOperationSchema = z.object({
  student_ids: z.array(z.string().uuid()).min(1, 'At least one student must be selected'),
  operation: z.enum(['change_status', 'update_payment_status', 'archive', 'restore']),
  payload: z.record(z.string(), z.any()).optional(),
})

export type CreateStudentRequest = z.infer<typeof createStudentSchema>
export type UpdateStudentRequest = z.infer<typeof updateStudentSchema>
export type StudentFilters = z.infer<typeof studentFiltersSchema>
export type StudentSort = z.infer<typeof studentSortSchema>
export type EnrollmentRequest = z.infer<typeof enrollmentSchema>
export type MonthlyPayment = z.infer<typeof monthlyPaymentSchema>
export type PaymentUpdateRequest = z.infer<typeof paymentUpdateSchema>
export type BulkOperationRequest = z.infer<typeof bulkOperationSchema>