import { z } from 'zod'

// Schedule slot validation
export const scheduleSlotSchema = z.object({
  day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  start_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  end_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  room: z.string().optional()
}).refine((data) => {
  const start = new Date(`2000-01-01 ${data.start_time}`)
  const end = new Date(`2000-01-01 ${data.end_time}`)
  return end > start
}, {
  message: 'End time must be after start time',
  path: ['end_time']
})

// Base group validation schema
export const createGroupSchema = z.object({
  name: z.string()
    .min(3, 'Group name must be at least 3 characters')
    .max(100, 'Group name must not exceed 100 characters')
    .trim(),
  
  group_code: z.string()
    .min(3, 'Group code must be at least 3 characters')
    .max(20, 'Group code must not exceed 20 characters')
    .regex(/^[A-Z0-9-_]+$/, 'Group code must contain only uppercase letters, numbers, hyphens, and underscores')
    .trim()
    .optional(),
  
  subject: z.string()
    .min(2, 'Subject must be at least 2 characters')
    .max(50, 'Subject must not exceed 50 characters')
    .trim(),
  
  level: z.enum(['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Upper-Intermediate', 'Advanced', 'Proficiency'], {
    errorMap: () => ({ message: 'Please select a valid level' })
  }),
  
  group_type: z.enum(['regular', 'intensive', 'online', 'hybrid', 'workshop', 'crash_course']).optional(),
  
  description: z.string()
    .max(500, 'Description must not exceed 500 characters')
    .optional()
    .or(z.literal('')),
  
  max_students: z.number()
    .int('Maximum students must be a whole number')
    .min(5, 'Group must accommodate at least 5 students')
    .max(50, 'Group cannot exceed 50 students'),
  
  schedule: z.array(scheduleSlotSchema)
    .min(1, 'At least one schedule slot is required')
    .max(7, 'Cannot have more than 7 schedule slots'),
  
  classroom: z.string()
    .max(50, 'Classroom name must not exceed 50 characters')
    .optional()
    .or(z.literal('')),
  
  online_meeting_url: z.string()
    .url('Please enter a valid meeting URL')
    .optional()
    .or(z.literal('')),
  
  start_date: z.string()
    .refine((date) => {
      const parsed = new Date(date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      parsed.setHours(0, 0, 0, 0)
      return parsed >= today
    }, 'Start date must be today or in the future'),
  
  end_date: z.string()
    .optional()
    .or(z.literal(''))
    .refine((date) => {
      if (!date) return true
      return !isNaN(Date.parse(date))
    }, 'Please enter a valid end date'),
  
  duration_weeks: z.number()
    .int('Duration must be a whole number')
    .min(1, 'Duration must be at least 1 week')
    .max(52, 'Duration cannot exceed 52 weeks')
    .optional(),
  
  price_per_student: z.number()
    .min(0, 'Price cannot be negative')
    .max(10000000, 'Price is too high') // 10M UZS limit
    .optional(),
  
  currency: z.enum(['UZS', 'USD', 'EUR']).default('UZS'),
  
  payment_frequency: z.enum(['monthly', 'course', 'weekly', 'daily']).optional(),
  
  notes: z.string()
    .max(1000, 'Notes must not exceed 1000 characters')
    .optional()
    .or(z.literal(''))
}).refine((data) => {
  // If end_date is provided, it should be after start_date
  if (data.end_date && data.start_date) {
    const start = new Date(data.start_date)
    const end = new Date(data.end_date)
    return end > start
  }
  return true
}, {
  message: 'End date must be after start date',
  path: ['end_date']
}).refine((data) => {
  // Check for schedule conflicts (same day and overlapping times)
  const dayGroups = data.schedule.reduce((acc, slot) => {
    if (!acc[slot.day]) {
      acc[slot.day] = []
    }
    acc[slot.day].push(slot)
    return acc
  }, {} as Record<string, typeof data.schedule>)

  for (const [day, slots] of Object.entries(dayGroups)) {
    if (slots.length > 1) {
      // Check for time conflicts
      for (let i = 0; i < slots.length; i++) {
        for (let j = i + 1; j < slots.length; j++) {
          const slot1 = slots[i]
          const slot2 = slots[j]
          
          const start1 = new Date(`2000-01-01 ${slot1.start_time}`)
          const end1 = new Date(`2000-01-01 ${slot1.end_time}`)
          const start2 = new Date(`2000-01-01 ${slot2.start_time}`)
          const end2 = new Date(`2000-01-01 ${slot2.end_time}`)
          
          // Check if times overlap
          if (start1 < end2 && start2 < end1) {
            return false
          }
        }
      }
    }
  }
  return true
}, {
  message: 'Schedule slots cannot overlap on the same day',
  path: ['schedule']
})

export const updateGroupSchema = createGroupSchema.partial()

// Filter validation
export const groupFiltersSchema = z.object({
  search: z.string().optional(),
  subject: z.array(z.string()).optional(),
  level: z.array(z.string()).optional(),
  status: z.array(z.enum(['active', 'inactive', 'completed', 'upcoming', 'cancelled'])).optional(),
  teacher_id: z.array(z.string().uuid()).optional(),
  start_date_from: z.date().optional(),
  start_date_to: z.date().optional(),
  has_capacity: z.boolean().optional(),
  is_active: z.boolean().optional()
}).refine((data) => {
  if (data.start_date_from && data.start_date_to) {
    return data.start_date_to >= data.start_date_from
  }
  return true
}, {
  message: 'End date must be after or equal to start date',
  path: ['start_date_to']
})

// Sort configuration
export const groupSortConfigSchema = z.object({
  field: z.enum(['name', 'group_code', 'subject', 'level', 'teacher_name', 'max_students', 'current_enrollment', 'enrollment_percentage', 'status', 'start_date']),
  direction: z.enum(['asc', 'desc'])
})

// Bulk operations
export const bulkGroupOperationSchema = z.object({
  operation: z.enum(['activate', 'deactivate', 'delete', 'duplicate']),
  group_ids: z.array(z.string().uuid()).min(1, 'At least one group must be selected')
})

// Teacher assignment
export const assignTeacherSchema = z.object({
  teacher_id: z.string().uuid('Invalid teacher ID'),
  role: z.enum(['primary', 'assistant', 'substitute']).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  compensation_rate: z.number().min(0).optional(),
  compensation_type: z.enum(['hourly', 'monthly', 'per_session', 'fixed']).optional()
})

// Student enrollment
export const enrollStudentSchema = z.object({
  student_id: z.string().uuid('Invalid student ID'),
  enrollment_date: z.string().optional(),
  tuition_amount: z.number().min(0).optional(),
  payment_status: z.enum(['pending', 'partial', 'paid', 'overdue']).optional(),
  notes: z.string().max(500).optional()
})

// Export types
export type CreateGroupRequest = z.infer<typeof createGroupSchema>
export type UpdateGroupRequest = z.infer<typeof updateGroupSchema>
export type GroupFilters = z.infer<typeof groupFiltersSchema>
export type GroupSortConfig = z.infer<typeof groupSortConfigSchema>
export type BulkGroupOperation = z.infer<typeof bulkGroupOperationSchema>
export type AssignTeacherRequest = z.infer<typeof assignTeacherSchema>
export type EnrollStudentRequest = z.infer<typeof enrollStudentSchema>
export type ScheduleSlot = z.infer<typeof scheduleSlotSchema>

// Constants
export const GROUP_SUBJECTS = [
  'English',
  'Mathematics',
  'Computer Science', 
  'Physics',
  'Chemistry',
  'Biology',
  'IELTS Preparation',
  'TOEFL Preparation',
  'Business English',
  'Academic Writing',
  'Conversation',
  'Grammar',
  'Programming',
  'Data Science',
  'Web Development',
  'Mobile Development'
] as const

export const GROUP_LEVELS = [
  'Beginner',
  'Elementary', 
  'Pre-Intermediate',
  'Intermediate',
  'Upper-Intermediate', 
  'Advanced',
  'Proficiency'
] as const

export const GROUP_TYPES = [
  'regular',
  'intensive',
  'online',
  'hybrid', 
  'workshop',
  'crash_course'
] as const

export const GROUP_STATUSES = [
  'active',
  'inactive', 
  'completed',
  'upcoming',
  'cancelled'
] as const

export const DAYS_OF_WEEK = [
  'monday',
  'tuesday', 
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
] as const

export const PAYMENT_FREQUENCIES = [
  'monthly',
  'course',
  'weekly',
  'daily'
] as const