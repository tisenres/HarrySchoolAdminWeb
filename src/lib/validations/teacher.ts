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
  degree: z.string().min(1, 'Degree is required'),
  institution: z.string().min(1, 'Institution is required'),
  year: z.number().min(1950).max(new Date().getFullYear()),
  field_of_study: z.string().optional(),
  gpa: z.number().min(0).max(4).optional(),
  country: z.string().optional(),
})

// Certification schema
export const certificationSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  name: z.string().min(1, 'Certification name is required'),
  institution: z.string().min(1, 'Institution is required'),
  issue_date: z.date(),
  expiry_date: z.date().optional(),
  credential_id: z.string().optional(),
  verification_url: z.string().url('Invalid URL').optional().or(z.literal('')),
})

// Main teacher schema
export const createTeacherSchema = z.object({
  // Basic Information
  first_name: z.string()
    .min(1, 'First name is required')
    .max(100, 'First name must be less than 100 characters')
    .regex(/^[a-zA-Zа-яёА-ЯЁ\s]+$/, 'First name can only contain letters and spaces'),
  
  last_name: z.string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be less than 100 characters')
    .regex(/^[a-zA-Zа-яёА-ЯЁ\s]+$/, 'Last name can only contain letters and spaces'),
  
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters')
    .optional()
    .or(z.literal('')),
  
  phone: z.string()
    .regex(/^\+998\d{9}$/, 'Phone must be valid Uzbekistan format (+998XXXXXXXXX)'),
  
  date_of_birth: z.date()
    .max(new Date(), 'Date of birth cannot be in the future')
    .optional(),
  
  gender: z.enum(['male', 'female', 'other']).optional(),
  
  // Professional Information
  employee_id: z.string()
    .max(50, 'Employee ID must be less than 50 characters')
    .optional(),
  
  hire_date: z.date()
    .max(new Date(), 'Hire date cannot be in the future'),
  
  employment_status: z.enum(['active', 'inactive', 'on_leave', 'terminated']).default('active'),
  
  contract_type: z.enum(['full_time', 'part_time', 'contract', 'substitute'])
    .optional(),
  
  salary_amount: z.number()
    .min(0, 'Salary must be positive')
    .max(999999999.99, 'Salary amount too large')
    .optional(),
  
  salary_currency: z.string().default('UZS'),
  
  // Education & Qualifications
  qualifications: z.array(qualificationSchema).default([]),
  specializations: z.array(z.string()).default([]),
  certifications: z.array(certificationSchema).default([]),
  languages_spoken: z.array(z.string()).default([]),
  
  // Contact & Personal
  address: addressSchema.optional(),
  emergency_contact: emergencyContactSchema.optional(),
  notes: z.string().max(2000, 'Notes must be less than 2000 characters').optional(),
  
  // System fields
  is_active: z.boolean().default(true),
})

export const updateTeacherSchema = createTeacherSchema.partial().extend({
  id: z.string().uuid('Invalid teacher ID'),
})

// Filter schema
export const teacherFiltersSchema = z.object({
  search: z.string().optional(),
  employment_status: z.array(z.string()).optional(),
  specializations: z.array(z.string()).optional(),
  contract_type: z.array(z.string()).optional(),
  hire_date_from: z.date().optional(),
  hire_date_to: z.date().optional(),
  is_active: z.boolean().optional(),
})

// Sort schema
export const teacherSortSchema = z.object({
  field: z.enum(['full_name', 'email', 'phone', 'employment_status', 'hire_date', 'active_groups', 'total_students']),
  direction: z.enum(['asc', 'desc']),
})

export type CreateTeacherRequest = z.infer<typeof createTeacherSchema>
export type UpdateTeacherRequest = z.infer<typeof updateTeacherSchema>
export type TeacherFilters = z.infer<typeof teacherFiltersSchema>
export type TeacherSort = z.infer<typeof teacherSortSchema>