import { z } from "zod"

// ============================================================================
// Base schemas
// ============================================================================

export const userRoleSchema = z.enum(["superadmin", "admin", "viewer"])

export const genderSchema = z.enum(["male", "female", "other"])

export const languagePreferenceSchema = z.enum(["en", "ru", "uz"])

export const employmentStatusSchema = z.enum([
  "active",
  "inactive", 
  "on_leave",
  "terminated",
])

export const contractTypeSchema = z.enum([
  "full_time",
  "part_time", 
  "contract",
  "substitute",
])

export const enrollmentStatusSchema = z.enum([
  "active",
  "inactive",
  "graduated", 
  "transferred",
  "expelled",
  "on_hold",
])

export const paymentPlanSchema = z.enum([
  "monthly",
  "quarterly",
  "annual",
  "custom",
])

export const paymentStatusSchema = z.enum([
  "current",
  "overdue",
  "paid_ahead",
  "partial", 
  "suspended",
])

export const groupStatusSchema = z.enum([
  "active",
  "inactive",
  "completed",
  "cancelled",
  "on_hold",
])

export const groupTypeSchema = z.enum([
  "regular",
  "intensive",
  "private",
  "online", 
  "hybrid",
])

export const notificationTypeSchema = z.enum([
  "system",
  "enrollment",
  "payment",
  "schedule",
  "achievement",
  "reminder",
  "alert",
])

export const notificationPrioritySchema = z.enum([
  "low",
  "normal",
  "high",
  "urgent",
])

export const assignmentRoleSchema = z.enum([
  "primary",
  "assistant",
  "substitute", 
  "observer",
])

export const compensationTypeSchema = z.enum([
  "per_hour",
  "per_session",
  "per_student",
  "fixed",
])

// ============================================================================
// Common field schemas
// ============================================================================

export const uuidSchema = z.string().uuid()

export const emailSchema = z.string().email().optional()

export const phoneSchema = z.string().min(1).max(20)

export const nameSchema = z.string().min(1).max(100).trim()

export const urlSchema = z.string().url().optional()

export const dateSchema = z.string().refine(
  (date) => !isNaN(Date.parse(date)), 
  "Invalid date format"
)

export const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
}).optional()

export const contactInfoSchema = z.object({
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  social: z.record(z.string(), z.string()).optional(),
}).optional()

export const emergencyContactSchema = z.object({
  name: z.string(),
  relationship: z.string(),
  phone: z.string(),
  email: z.string().email().optional(),
  address: z.string().optional(),
})

export const qualificationSchema = z.object({
  degree: z.string(),
  institution: z.string(),
  year: z.number().int().min(1900).max(new Date().getFullYear()),
  field_of_study: z.string().optional(),
  grade: z.string().optional(),
})

export const certificationSchema = z.object({
  name: z.string(),
  issuer: z.string(),
  issue_date: z.string(),
  expiry_date: z.string().optional(),
  credential_id: z.string().optional(),
})

export const documentSchema = z.object({
  type: z.string(),
  name: z.string(),
  url: z.string().url(),
  uploaded_at: z.string(),
  size: z.number().optional(),
})

export const scheduleSchema = z.object({
  days: z.array(z.string()),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  timezone: z.string().default("Asia/Tashkent"),
})

// ============================================================================
// Organization schemas
// ============================================================================

export const organizationInsertSchema = z.object({
  name: nameSchema,
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  logo_url: urlSchema,
  address: addressSchema,
  contact_info: contactInfoSchema,
  settings: z.record(z.string(), z.unknown()).optional(),
  subscription_plan: z.string().default("basic"),
  subscription_status: z.string().default("active"),
  max_students: z.number().int().positive().default(500),
  max_teachers: z.number().int().positive().default(50),
  max_groups: z.number().int().positive().default(50),
})

export const organizationUpdateSchema = organizationInsertSchema.partial()

// ============================================================================
// Profile schemas
// ============================================================================

export const notificationPreferencesSchema = z.object({
  email_notifications: z.boolean().default(true),
  system_notifications: z.boolean().default(true),
  student_updates: z.boolean().default(true),
  payment_reminders: z.boolean().default(true),
})

export const profileInsertSchema = z.object({
  id: uuidSchema,
  organization_id: uuidSchema,
  email: z.string().email(),
  full_name: nameSchema,
  avatar_url: urlSchema,
  phone: phoneSchema.optional(),
  role: userRoleSchema.default("admin"),
  language_preference: languagePreferenceSchema.default("en"),
  timezone: z.string().default("Asia/Tashkent"),
  notification_preferences: notificationPreferencesSchema.optional(),
})

export const profileUpdateSchema = profileInsertSchema.partial().omit({ 
  id: true, 
  organization_id: true 
})

// ============================================================================
// Teacher schemas
// ============================================================================

export const teacherInsertSchema = z.object({
  organization_id: uuidSchema,
  
  // Basic Information
  first_name: nameSchema,
  last_name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  date_of_birth: dateSchema.optional(),
  gender: genderSchema.optional(),
  
  // Professional Information
  employee_id: z.string().max(50).optional(),
  hire_date: dateSchema.optional(),
  employment_status: employmentStatusSchema.default("active"),
  contract_type: contractTypeSchema.optional(),
  salary_amount: z.number().positive().optional(),
  salary_currency: z.string().default("UZS"),
  
  // Education & Qualifications
  qualifications: z.array(qualificationSchema).default([]),
  specializations: z.array(z.string()).default([]),
  certifications: z.array(certificationSchema).default([]),
  languages_spoken: z.array(z.string()).default([]),
  
  // Contact & Personal
  address: addressSchema,
  emergency_contact: emergencyContactSchema.optional(),
  documents: z.array(documentSchema).default([]),
  notes: z.string().optional(),
  
  // System fields
  profile_image_url: urlSchema,
  is_active: z.boolean().default(true),
})

export const teacherUpdateSchema = teacherInsertSchema.partial().omit({ 
  organization_id: true 
})

// ============================================================================
// Student schemas  
// ============================================================================

export const parentGuardianSchema = z.object({
  name: z.string(),
  relationship: z.string(),
  phone: z.string(),
  email: z.string().email().optional(),
  occupation: z.string().optional(),
  workplace: z.string().optional(),
  is_primary_contact: z.boolean().default(false),
})

export const previousEducationSchema = z.object({
  institution: z.string(),
  level: z.string(),
  start_date: z.string(),
  end_date: z.string().optional(),
  completed: z.boolean().default(false),
  grades: z.record(z.string(), z.string()).optional(),
})

export const studentInsertSchema = z.object({
  organization_id: uuidSchema,
  
  // Basic Information
  first_name: nameSchema,
  last_name: nameSchema,
  date_of_birth: dateSchema,
  gender: genderSchema.optional(),
  nationality: z.string().optional(),
  
  // Student-specific Information
  student_id: z.string().max(50).optional(),
  enrollment_date: dateSchema.optional(),
  enrollment_status: enrollmentStatusSchema.default("active"),
  grade_level: z.string().optional(),
  
  // Contact Information
  primary_phone: phoneSchema.optional(),
  secondary_phone: phoneSchema.optional(),
  email: emailSchema,
  address: addressSchema,
  
  // Family Information
  parent_guardian_info: z.array(parentGuardianSchema).default([]),
  emergency_contacts: z.array(emergencyContactSchema).default([]),
  family_notes: z.string().optional(),
  
  // Academic Information
  previous_education: z.array(previousEducationSchema).optional(),
  special_needs: z.string().optional(),
  medical_notes: z.string().optional(),
  allergies: z.string().optional(),
  
  // Financial Information
  payment_plan: paymentPlanSchema.optional(),
  tuition_fee: z.number().positive().optional(),
  currency: z.string().default("UZS"),
  payment_status: paymentStatusSchema.default("current"),
  
  // System fields
  profile_image_url: urlSchema,
  documents: z.array(documentSchema).default([]),
  notes: z.string().optional(),
  is_active: z.boolean().default(true),
})

export const studentUpdateSchema = studentInsertSchema.partial().omit({ 
  organization_id: true 
})

// ============================================================================
// Group schemas
// ============================================================================

export const curriculumSchema = z.object({
  description: z.string().optional(),
  topics: z.array(z.string()).optional(),
  learning_objectives: z.array(z.string()).optional(),
  prerequisites: z.array(z.string()).optional(),
  materials: z.array(z.string()).optional(),
}).optional()

export const groupInsertSchema = z.object({
  organization_id: uuidSchema,
  
  // Basic Information
  name: nameSchema,
  description: z.string().optional(),
  group_code: z.string().max(20).optional(),
  
  // Academic Information
  subject: z.string().min(1),
  level: z.string().optional(),
  curriculum: curriculumSchema,
  
  // Scheduling
  schedule: scheduleSchema,
  start_date: dateSchema,
  end_date: dateSchema.optional(),
  duration_weeks: z.number().int().positive().optional(),
  
  // Capacity Management
  max_students: z.number().int().positive().default(15),
  
  // Status and Settings
  status: groupStatusSchema.default("active"),
  group_type: groupTypeSchema.optional(),
  
  // Financial Information
  price_per_student: z.number().positive().optional(),
  currency: z.string().default("UZS"),
  payment_frequency: z.enum(["monthly", "per_session", "full_course"]).optional(),
  
  // Location and Resources
  classroom: z.string().optional(),
  online_meeting_url: urlSchema,
  required_materials: z.array(z.string()).default([]),
  
  // System fields
  is_active: z.boolean().default(true),
  notes: z.string().optional(),
})

export const groupUpdateSchema = groupInsertSchema.partial().omit({ 
  organization_id: true 
})

// ============================================================================
// Teacher Assignment schemas
// ============================================================================

export const teacherGroupAssignmentInsertSchema = z.object({
  organization_id: uuidSchema,
  teacher_id: uuidSchema,
  group_id: uuidSchema,
  
  // Assignment Details
  role: assignmentRoleSchema.default("primary"),
  start_date: dateSchema.optional(),
  end_date: dateSchema.optional(),
  
  // Compensation
  compensation_rate: z.number().positive().optional(),
  compensation_type: compensationTypeSchema.optional(),
  
  // Status
  status: z.enum(["active", "inactive", "completed"]).default("active"),
  notes: z.string().optional(),
})

export const teacherGroupAssignmentUpdateSchema = teacherGroupAssignmentInsertSchema.partial().omit({
  organization_id: true,
  teacher_id: true,
  group_id: true,
})

// ============================================================================
// Student Enrollment schemas
// ============================================================================

export const studentGroupEnrollmentInsertSchema = z.object({
  organization_id: uuidSchema,
  student_id: uuidSchema,
  group_id: uuidSchema,
  
  // Enrollment Details
  enrollment_date: dateSchema.optional(),
  start_date: dateSchema,
  end_date: dateSchema.optional(),
  completion_date: dateSchema.optional(),
  
  // Status Tracking
  status: z.enum([
    "enrolled", 
    "active", 
    "completed", 
    "dropped", 
    "transferred", 
    "on_hold"
  ]).default("enrolled"),
  attendance_rate: z.number().min(0).max(100).optional(),
  progress_notes: z.string().optional(),
  
  // Financial Tracking
  tuition_amount: z.number().positive().optional(),
  amount_paid: z.number().nonnegative().default(0),
  payment_status: z.enum([
    "pending", 
    "partial", 
    "paid", 
    "overdue", 
    "waived"
  ]).default("pending"),
  
  // Academic Performance
  final_grade: z.string().optional(),
  certificate_issued: z.boolean().default(false),
  certificate_number: z.string().optional(),
  
  // System fields
  notes: z.string().optional(),
})

export const studentGroupEnrollmentUpdateSchema = studentGroupEnrollmentInsertSchema.partial().omit({
  organization_id: true,
  student_id: true, 
  group_id: true,
})

// ============================================================================
// Notification schemas
// ============================================================================

export const notificationInsertSchema = z.object({
  organization_id: uuidSchema,
  
  // Recipient Information
  user_id: uuidSchema.optional(),
  role_target: z.array(userRoleSchema).optional(),
  
  // Notification Content
  type: notificationTypeSchema,
  title: z.string().min(1).max(200),
  message: z.string().min(1),
  action_url: urlSchema,
  
  // Related Entities
  related_student_id: uuidSchema.optional(),
  related_teacher_id: uuidSchema.optional(),
  related_group_id: uuidSchema.optional(),
  
  // Delivery Status
  delivery_method: z.array(z.enum(["in_app", "email", "sms"])).default(["in_app"]),
  
  // Priority and Scheduling
  priority: notificationPrioritySchema.default("normal"),
  scheduled_for: z.string().optional(),
  expires_at: z.string().optional(),
  
  // System fields
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const notificationUpdateSchema = notificationInsertSchema.partial().omit({ 
  organization_id: true 
})

// ============================================================================
// Search and Filter schemas
// ============================================================================

export const teacherSearchSchema = z.object({
  query: z.string().optional(),
  employment_status: employmentStatusSchema.optional(),
  specializations: z.array(z.string()).optional(),
  hire_date_from: dateSchema.optional(),
  hire_date_to: dateSchema.optional(),
  is_active: z.boolean().optional(),
})

export const studentSearchSchema = z.object({
  query: z.string().optional(),
  enrollment_status: enrollmentStatusSchema.optional(),
  payment_status: paymentStatusSchema.optional(),
  grade_level: z.string().optional(),
  enrollment_date_from: dateSchema.optional(),
  enrollment_date_to: dateSchema.optional(),
  is_active: z.boolean().optional(),
})

export const groupSearchSchema = z.object({
  query: z.string().optional(),
  subject: z.string().optional(),
  status: groupStatusSchema.optional(),
  group_type: groupTypeSchema.optional(),
  start_date_from: dateSchema.optional(),
  start_date_to: dateSchema.optional(),
  teacher_id: uuidSchema.optional(),
  is_active: z.boolean().optional(),
})

// ============================================================================
// Pagination schema
// ============================================================================

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sort_by: z.string().optional(),
  sort_order: z.enum(["asc", "desc"]).default("asc"),
})

// ============================================================================
// API Response schemas
// ============================================================================

export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
  })

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    success: z.boolean(),
    data: z.array(itemSchema),
    pagination: z.object({
      total: z.number().int().nonnegative(),
      page: z.number().int().min(1),
      limit: z.number().int().min(1),
      total_pages: z.number().int().nonnegative(),
      has_next: z.boolean(),
      has_prev: z.boolean(),
    }),
    error: z.string().optional(),
  })

// ============================================================================
// Export types inferred from schemas
// ============================================================================

export type OrganizationInsert = z.infer<typeof organizationInsertSchema>
export type OrganizationUpdate = z.infer<typeof organizationUpdateSchema>
export type ProfileInsert = z.infer<typeof profileInsertSchema>
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>
export type TeacherInsert = z.infer<typeof teacherInsertSchema>
export type TeacherUpdate = z.infer<typeof teacherUpdateSchema>
export type StudentInsert = z.infer<typeof studentInsertSchema>
export type StudentUpdate = z.infer<typeof studentUpdateSchema>
export type GroupInsert = z.infer<typeof groupInsertSchema>
export type GroupUpdate = z.infer<typeof groupUpdateSchema>
export type TeacherGroupAssignmentInsert = z.infer<typeof teacherGroupAssignmentInsertSchema>
export type StudentGroupEnrollmentInsert = z.infer<typeof studentGroupEnrollmentInsertSchema>
export type NotificationInsert = z.infer<typeof notificationInsertSchema>

export type TeacherSearch = z.infer<typeof teacherSearchSchema>
export type StudentSearch = z.infer<typeof studentSearchSchema>
export type GroupSearch = z.infer<typeof groupSearchSchema>
export type Pagination = z.infer<typeof paginationSchema>

// Re-export finance validations
export * from './validations/finance'