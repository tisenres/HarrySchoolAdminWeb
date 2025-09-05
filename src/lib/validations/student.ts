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
  phone: z.string().regex(/^\+998\d{9}$/, 'Phone must be valid Uzbekistan format (+998XXXXXXXXX)').optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
})

// Age validation helper
const getMinBirthDate = () => {
  const date = new Date()
  date.setFullYear(date.getFullYear() - 25) // Maximum age 25
  return date
}

const getMaxBirthDate = () => {
  const date = new Date()
  date.setFullYear(date.getFullYear() - 5) // Minimum age 5
  return date
}

// Main student schema - Only starred fields are required
export const createStudentSchema = z.object({
  // Basic Information (Required - starred in form)
  first_name: z.string()
    .min(1, 'First name is required')
    .max(100, 'First name must be less than 100 characters')
    .regex(/^[a-zA-Zа-яёА-ЯЁ\s]+$/, 'First name can only contain letters and spaces'),
  
  last_name: z.string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be less than 100 characters')
    .regex(/^[a-zA-Zа-яёА-ЯЁ\s]+$/, 'Last name can only contain letters and spaces'),
  
  date_of_birth: z.string()
    .min(1, 'Date of birth is required')
    .refine((date) => {
      const birthDate = new Date(date)
      const minDate = getMinBirthDate()
      const maxDate = getMaxBirthDate()
      return birthDate >= minDate && birthDate <= maxDate
    }, 'Student must be between 5 and 25 years old'),
  
  gender: z.enum(['male', 'female', 'other']).default('male'),
  
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters')
    .optional()
    .or(z.literal('')),
  
  phone: z.string()
    .regex(/^\+998\d{9}$/, 'Phone must be valid Uzbekistan format (+998XXXXXXXXX)'),
  
  // Parent/Guardian Information (Optional - not starred in form)
  parent_name: z.string()
    .max(200, 'Parent name must be less than 200 characters')
    .regex(/^[a-zA-Zа-яёА-ЯЁ\s]*$/, 'Parent name can only contain letters and spaces')
    .optional()
    .or(z.literal('')),
  
  parent_phone: z.string()
    .regex(/^\+998\d{9}$/, 'Parent phone must be valid Uzbekistan format (+998XXXXXXXXX)')
    .optional()
    .or(z.literal('')),
  
  parent_email: z.string()
    .email('Invalid parent email format')
    .max(255, 'Parent email must be less than 255 characters')
    .optional()
    .or(z.literal('')),
  
  // Address Information (Optional - not starred in form)
  address: addressSchema.partial().optional(),
  
  // Enrollment Information (Required - starred in form)
  enrollment_date: z.string()
    .min(1, 'Enrollment date is required')
    .refine((date) => new Date(date) <= new Date(), 'Enrollment date cannot be in the future'),
  
  status: z.enum(['active', 'inactive', 'graduated', 'suspended', 'dropped']).default('active'),
  
  current_level: z.string()
    .min(1, 'Current level is required')
    .max(50, 'Current level must be less than 50 characters'),
  
  preferred_subjects: z.array(z.string()).min(1, 'At least one preferred subject is required'),
  
  // Academic Information (Optional)
  groups: z.array(z.string()).default([]),
  academic_year: z.string().max(10, 'Academic year must be less than 10 characters').optional(),
  grade_level: z.string().max(20, 'Grade level must be less than 20 characters').optional(),
  
  // Medical & Emergency (Optional - not starred in form)
  medical_notes: z.string().max(1000, 'Medical notes must be less than 1000 characters').optional(),
  emergency_contact: emergencyContactSchema.partial().optional(),
  
  // Financial Information (Optional with defaults)
  payment_status: z.enum(['paid', 'pending', 'overdue', 'partial']).default('pending'),
  balance: z.number().min(0, 'Balance must be non-negative').default(0),
  tuition_fee: z.number().min(0, 'Tuition fee must be non-negative').optional(),
  
  // Additional Information (Optional)
  notes: z.string().max(2000, 'Notes must be less than 2000 characters').optional(),
  
  // System fields
  is_active: z.boolean().default(true),
})

export const updateStudentSchema = createStudentSchema.partial().extend({
  id: z.string().uuid('Invalid student ID'),
})

// Filter schema
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
  age_from: z.number().min(5).max(25).optional(),
  age_to: z.number().min(5).max(25).optional(),
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
  start_date: z.string().refine((date) => new Date(date) >= new Date(), 'Start date cannot be in the past'),
  tuition_amount: z.number().min(0, 'Tuition amount must be non-negative').optional(),
  payment_status: z.enum(['paid', 'pending', 'overdue', 'partial']).default('pending'),
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
export type PaymentUpdateRequest = z.infer<typeof paymentUpdateSchema>
export type BulkOperationRequest = z.infer<typeof bulkOperationSchema>