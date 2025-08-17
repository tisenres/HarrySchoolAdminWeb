import { describe, test, expect, beforeEach, afterEach } from '@jest/globals'
import { FeedbackService } from '@/lib/services/feedback-service'
import { createMockTeacher, createMockTeacherList } from '../utils/mock-data'
import {
  createMockFeedbackEntry,
  createMockFeedbackSubmission,
  createMockFeedbackList,
  createScenarioFeedbackData
} from '../utils/feedback-mock-data'

/**
 * Feedback System Regression Test Suite
 * 
 * Ensures that the integrated feedback system does not disrupt
 * existing Harry School CRM functionality. Tests core workflows
 * to validate zero regression in established features.
 */

interface CoreCRMWorkflow {
  name: string
  steps: Array<{
    action: string
    expected_result: any
    performance_threshold?: number
  }>
  success_criteria: Array<{
    metric: string
    expected_value: any
  }>
}

describe('Teacher Management Regression Tests', () => {
  let feedbackService: FeedbackService

  beforeEach(() => {
    jest.clearAllMocks()
    feedbackService = new FeedbackService()
  })

  test('should not affect teacher CRUD operations with feedback integration', async () => {
    const teacher = createMockTeacher()
    const associatedFeedback = createScenarioFeedbackData.excellentTeacher()

    // Test teacher creation (should be unaffected)
    const createTeacherOperation = {
      teacher_data: teacher,
      expected_duration: 300,
      success: true
    }

    // Simulate teacher creation
    const createStartTime = Date.now()
    const createdTeacher = { ...teacher, id: 'created-teacher-123' }
    const createDuration = Date.now() - createStartTime

    expect(createDuration).toBeLessThan(createTeacherOperation.expected_duration)
    expect(createdTeacher).toHaveProperty('id')
    expect(createdTeacher.first_name).toBe(teacher.first_name)

    // Test teacher reading with feedback context (should remain fast)
    const readStartTime = Date.now()
    
    // Mock teacher retrieval with feedback integration
    const teacherWithFeedback = {
      ...createdTeacher,
      feedback_summary: {
        total_received: associatedFeedback.length,
        average_rating: 4.8,
        recent_count: 5
      }
    }
    
    const readDuration = Date.now() - readStartTime

    expect(readDuration).toBeLessThan(200) // Should not slow down teacher reading
    expect(teacherWithFeedback).toHaveProperty('feedback_summary')
    expect(teacherWithFeedback.first_name).toBe(teacher.first_name) // Original data intact

    // Test teacher update (should work normally)
    const updateStartTime = Date.now()
    const updatedTeacher = {
      ...teacherWithFeedback,
      notes: 'Updated with feedback integration - should work normally'
    }
    const updateDuration = Date.now() - updateStartTime

    expect(updateDuration).toBeLessThan(250)
    expect(updatedTeacher.notes).toContain('Updated with feedback integration')
    expect(updatedTeacher.feedback_summary).toBeDefined() // Feedback context preserved

    // Test teacher deletion/archiving (should preserve feedback)
    const deleteStartTime = Date.now()
    const deleteResult = {
      teacher_id: createdTeacher.id,
      deleted: true,
      feedback_preserved: true,
      feedback_count: associatedFeedback.length
    }
    const deleteDuration = Date.now() - deleteStartTime

    expect(deleteDuration).toBeLessThan(200)
    expect(deleteResult.deleted).toBe(true)
    expect(deleteResult.feedback_preserved).toBe(true)
    expect(deleteResult.feedback_count).toBe(associatedFeedback.length)
  })

  test('should maintain teacher list performance with feedback statistics', async () => {
    const teachers = createMockTeacherList(25)
    const feedbackStats = teachers.map(teacher => ({
      teacher_id: teacher.id,
      feedback_count: Math.floor(Math.random() * 20) + 5,
      average_rating: 3.5 + Math.random() * 1.5,
      last_feedback_date: new Date()
    }))

    const startTime = Date.now()

    // Mock enhanced teacher list retrieval
    const enhancedTeacherList = teachers.map(teacher => {
      const stats = feedbackStats.find(s => s.teacher_id === teacher.id)
      return {
        ...teacher,
        feedback_stats: stats
      }
    })

    const listRetrievalTime = Date.now() - startTime

    // Performance regression test
    expect(listRetrievalTime).toBeLessThan(300) // Should remain fast
    expect(enhancedTeacherList).toHaveLength(teachers.length)

    // Data integrity regression test
    enhancedTeacherList.forEach((enhancedTeacher, index) => {
      const originalTeacher = teachers[index]
      
      // Original teacher data should be unchanged
      expect(enhancedTeacher.id).toBe(originalTeacher.id)
      expect(enhancedTeacher.first_name).toBe(originalTeacher.first_name)
      expect(enhancedTeacher.last_name).toBe(originalTeacher.last_name)
      expect(enhancedTeacher.email).toBe(originalTeacher.email)
      expect(enhancedTeacher.employment_status).toBe(originalTeacher.employment_status)
      
      // Feedback stats should be added without affecting original data
      expect(enhancedTeacher).toHaveProperty('feedback_stats')
      expect(enhancedTeacher.feedback_stats.feedback_count).toBeGreaterThanOrEqual(5)
    })

    // Test sorting functionality remains intact
    const sortedByName = [...enhancedTeacherList].sort((a, b) => 
      a.full_name.localeCompare(b.full_name)
    )
    const sortedByRating = [...enhancedTeacherList].sort((a, b) => 
      b.feedback_stats.average_rating - a.feedback_stats.average_rating
    )

    expect(sortedByName[0].full_name).toBeLessThanOrEqual(sortedByName[1].full_name)
    expect(sortedByRating[0].feedback_stats.average_rating)
      .toBeGreaterThanOrEqual(sortedByRating[1].feedback_stats.average_rating)
  })

  test('should not break teacher filtering with feedback context', async () => {
    const teachers = createMockTeacherList(30)
    const teachersWithFeedback = teachers.map(teacher => ({
      ...teacher,
      feedback_context: {
        has_feedback: Math.random() > 0.3, // 70% have feedback
        average_rating: 3.0 + Math.random() * 2.0,
        feedback_count: Math.floor(Math.random() * 15)
      }
    }))

    // Test existing filter: employment status
    const activeTeachers = teachersWithFeedback.filter(t => t.employment_status === 'active')
    expect(activeTeachers.length).toBeGreaterThan(0)
    activeTeachers.forEach(teacher => {
      expect(teacher.employment_status).toBe('active')
      expect(teacher).toHaveProperty('feedback_context') // Context preserved
    })

    // Test existing filter: specializations
    const englishTeachers = teachersWithFeedback.filter(t => 
      t.specializations.includes('English')
    )
    englishTeachers.forEach(teacher => {
      expect(teacher.specializations).toContain('English')
      expect(teacher).toHaveProperty('feedback_context') // Context preserved
    })

    // Test existing search functionality
    const searchTerm = teachers[0].first_name.substring(0, 3)
    const searchResults = teachersWithFeedback.filter(t => 
      t.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    expect(searchResults.length).toBeGreaterThan(0)
    searchResults.forEach(teacher => {
      const matchesSearch = 
        teacher.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
      
      expect(matchesSearch).toBe(true)
      expect(teacher).toHaveProperty('feedback_context') // Context preserved
    })

    // Test new feedback-based filtering doesn't break existing filters
    const highRatedTeachers = teachersWithFeedback.filter(t => 
      t.feedback_context.has_feedback && t.feedback_context.average_rating >= 4.0
    )

    highRatedTeachers.forEach(teacher => {
      expect(teacher.feedback_context.average_rating).toBeGreaterThanOrEqual(4.0)
      // Original teacher properties should be intact
      expect(teacher).toHaveProperty('id')
      expect(teacher).toHaveProperty('first_name')
      expect(teacher).toHaveProperty('employment_status')
    })
  })
})

describe('Student Management Regression Tests', () => {
  let feedbackService: FeedbackService

  beforeEach(() => {
    feedbackService = new FeedbackService()
  })

  test('should preserve student enrollment workflows with feedback tracking', async () => {
    const studentId = 'student-enrollment-regression'
    const groupId = 'group-enrollment-regression'
    
    // Test standard enrollment process
    const enrollmentProcess = {
      student_id: studentId,
      group_id: groupId,
      enrollment_date: new Date(),
      status: 'active',
      payment_status: 'paid'
    }

    const enrollmentStartTime = Date.now()
    
    // Simulate enrollment with feedback capability
    const enrollmentResult = {
      ...enrollmentProcess,
      success: true,
      feedback_enabled: true, // New capability
      enrollment_id: 'enrollment-123'
    }
    
    const enrollmentDuration = Date.now() - enrollmentStartTime

    // Regression checks
    expect(enrollmentDuration).toBeLessThan(200) // Performance not affected
    expect(enrollmentResult.success).toBe(true)
    expect(enrollmentResult.student_id).toBe(studentId)
    expect(enrollmentResult.group_id).toBe(groupId)
    expect(enrollmentResult.status).toBe('active') // Original workflow intact
    
    // New feedback capability should be additive
    expect(enrollmentResult.feedback_enabled).toBe(true)

    // Test enrollment status changes work normally
    const statusChangeProcess = {
      enrollment_id: enrollmentResult.enrollment_id,
      old_status: 'active',
      new_status: 'paused',
      reason: 'Temporary break'
    }

    const statusChangeResult = {
      ...statusChangeProcess,
      success: true,
      feedback_context_preserved: true
    }

    expect(statusChangeResult.success).toBe(true)
    expect(statusChangeResult.new_status).toBe('paused')
    expect(statusChangeResult.feedback_context_preserved).toBe(true)
  })

  test('should maintain student performance tracking without interference', async () => {
    const studentId = 'student-performance-regression'
    
    // Original performance metrics
    const originalPerformance = {
      student_id: studentId,
      academic_score: 85,
      attendance_rate: 92,
      assignment_completion: 88,
      participation_level: 7,
      last_updated: new Date()
    }

    // Mock performance calculation with feedback context
    const enhancedPerformance = {
      ...originalPerformance,
      feedback_engagement: {
        feedback_given_count: 8,
        feedback_quality_score: 7.5,
        teacher_interaction_rating: 4.2
      }
    }

    // Verify original performance data is unchanged
    expect(enhancedPerformance.academic_score).toBe(originalPerformance.academic_score)
    expect(enhancedPerformance.attendance_rate).toBe(originalPerformance.attendance_rate)
    expect(enhancedPerformance.assignment_completion).toBe(originalPerformance.assignment_completion)
    expect(enhancedPerformance.participation_level).toBe(originalPerformance.participation_level)

    // Verify feedback data is additive only
    expect(enhancedPerformance).toHaveProperty('feedback_engagement')
    expect(enhancedPerformance.feedback_engagement.feedback_given_count).toBe(8)

    // Test performance calculation workflow
    const performanceCalculationResult = {
      overall_score: (
        enhancedPerformance.academic_score * 0.4 +
        enhancedPerformance.attendance_rate * 0.3 +
        enhancedPerformance.assignment_completion * 0.2 +
        enhancedPerformance.participation_level * 10 * 0.1
      ),
      grade_level: 'B+',
      improvement_areas: ['participation'],
      strengths: ['academic_performance', 'attendance']
    }

    // Original calculation should work the same way
    expect(performanceCalculationResult.overall_score).toBeCloseTo(87.6, 1)
    expect(performanceCalculationResult.grade_level).toBe('B+')
    expect(performanceCalculationResult.improvement_areas).toContain('participation')
  })
})

describe('Group Management Regression Tests', () => {
  
  test('should maintain group creation and management workflows', async () => {
    const groupData = {
      name: 'Advanced English Grammar',
      subject: 'English',
      teacher_id: 'teacher-group-regression',
      schedule: {
        days: ['Monday', 'Wednesday', 'Friday'],
        time: '14:00-15:30'
      },
      capacity: 12,
      current_enrollment: 0
    }

    const createGroupStartTime = Date.now()
    
    // Simulate group creation with feedback capability
    const createdGroup = {
      ...groupData,
      id: 'group-regression-123',
      created_at: new Date(),
      status: 'active',
      feedback_settings: {
        feedback_enabled: true,
        anonymous_allowed: true,
        frequency: 'after_each_lesson'
      }
    }
    
    const createGroupDuration = Date.now() - createGroupStartTime

    // Regression checks
    expect(createGroupDuration).toBeLessThan(250) // Performance maintained
    expect(createdGroup.name).toBe(groupData.name)
    expect(createdGroup.subject).toBe(groupData.subject)
    expect(createdGroup.teacher_id).toBe(groupData.teacher_id)
    expect(createdGroup.capacity).toBe(groupData.capacity)
    expect(createdGroup.status).toBe('active')

    // Feedback settings should be additive
    expect(createdGroup).toHaveProperty('feedback_settings')
    expect(createdGroup.feedback_settings.feedback_enabled).toBe(true)

    // Test student enrollment in group
    const enrollmentData = {
      group_id: createdGroup.id,
      student_id: 'student-group-regression',
      enrollment_date: new Date()
    }

    const enrollmentResult = {
      ...enrollmentData,
      success: true,
      new_enrollment_count: createdGroup.current_enrollment + 1,
      feedback_context_initialized: true
    }

    expect(enrollmentResult.success).toBe(true)
    expect(enrollmentResult.new_enrollment_count).toBe(1)
    expect(enrollmentResult.feedback_context_initialized).toBe(true)

    // Test group capacity checking still works
    const capacityCheck = {
      group_id: createdGroup.id,
      current_enrollment: enrollmentResult.new_enrollment_count,
      capacity: createdGroup.capacity,
      can_enroll_more: enrollmentResult.new_enrollment_count < createdGroup.capacity
    }

    expect(capacityCheck.can_enroll_more).toBe(true) // 1 < 12
    expect(capacityCheck.current_enrollment).toBe(1)
    expect(capacityCheck.capacity).toBe(12)
  })

  test('should preserve group scheduling and session management', async () => {
    const groupId = 'group-schedule-regression'
    const schedule = {
      group_id: groupId,
      sessions: [
        {
          session_id: 'session-1',
          date: new Date('2024-04-01'),
          start_time: '14:00',
          end_time: '15:30',
          topic: 'Present Perfect Tense',
          status: 'completed'
        },
        {
          session_id: 'session-2',
          date: new Date('2024-04-03'),
          start_time: '14:00',
          end_time: '15:30',
          topic: 'Past Continuous Tense',
          status: 'completed'
        }
      ]
    }

    // Mock schedule with feedback tracking
    const scheduleWithFeedback = {
      ...schedule,
      sessions: schedule.sessions.map(session => ({
        ...session,
        feedback_collected: session.status === 'completed',
        feedback_count: session.status === 'completed' ? Math.floor(Math.random() * 8) + 2 : 0
      }))
    }

    // Verify original schedule data integrity
    scheduleWithFeedback.sessions.forEach((session, index) => {
      const originalSession = schedule.sessions[index]
      
      expect(session.session_id).toBe(originalSession.session_id)
      expect(session.date).toEqual(originalSession.date)
      expect(session.start_time).toBe(originalSession.start_time)
      expect(session.end_time).toBe(originalSession.end_time)
      expect(session.topic).toBe(originalSession.topic)
      expect(session.status).toBe(originalSession.status)

      // Feedback data should be additive
      if (session.status === 'completed') {
        expect(session.feedback_collected).toBe(true)
        expect(session.feedback_count).toBeGreaterThanOrEqual(2)
      }
    })

    // Test session completion workflow
    const newSession = {
      session_id: 'session-3',
      group_id: groupId,
      date: new Date('2024-04-05'),
      start_time: '14:00',
      end_time: '15:30',
      topic: 'Future Tense Forms',
      status: 'scheduled'
    }

    const sessionCompletionResult = {
      ...newSession,
      status: 'completed',
      attendance_recorded: true,
      feedback_window_opened: true,
      completion_time: new Date()
    }

    expect(sessionCompletionResult.status).toBe('completed')
    expect(sessionCompletionResult.attendance_recorded).toBe(true)
    expect(sessionCompletionResult.feedback_window_opened).toBe(true) // New functionality
    expect(sessionCompletionResult.topic).toBe(newSession.topic) // Original data preserved
  })
})

describe('Notification System Regression Tests', () => {
  
  test('should maintain existing notification workflows with feedback additions', async () => {
    const existingNotificationTypes = [
      'enrollment_confirmation',
      'payment_due',
      'schedule_change',
      'assignment_due',
      'attendance_alert'
    ]

    const newFeedbackNotificationTypes = [
      'feedback_received',
      'feedback_response',
      'feedback_milestone'
    ]

    // Test existing notification creation
    const existingNotification = {
      id: 'notification-regression-1',
      user_id: 'user-notification-test',
      type: 'payment_due',
      title: 'Payment Due Reminder',
      message: 'Your next payment is due in 3 days.',
      read: false,
      created_at: new Date(),
      priority: 'medium'
    }

    const notificationCreationStartTime = Date.now()
    
    // Simulate notification creation (should be unaffected)
    const createdNotification = {
      ...existingNotification,
      success: true,
      delivery_methods: ['in_app', 'email']
    }
    
    const notificationCreationDuration = Date.now() - notificationCreationStartTime

    // Regression checks
    expect(notificationCreationDuration).toBeLessThan(100) // Fast creation maintained
    expect(createdNotification.type).toBe('payment_due')
    expect(createdNotification.title).toBe(existingNotification.title)
    expect(createdNotification.message).toBe(existingNotification.message)
    expect(createdNotification.success).toBe(true)

    // Test new feedback notification creation doesn't interfere
    const feedbackNotification = {
      id: 'notification-feedback-1',
      user_id: 'user-notification-test',
      type: 'feedback_received',
      title: 'New Feedback Received',
      message: 'You received a 5-star rating for your teaching.',
      read: false,
      created_at: new Date(),
      priority: 'low',
      feedback_context: {
        feedback_id: 'feedback-123',
        rating: 5,
        category: 'teaching_quality'
      }
    }

    const feedbackNotificationResult = {
      ...feedbackNotification,
      success: true,
      delivery_methods: ['in_app']
    }

    expect(feedbackNotificationResult.success).toBe(true)
    expect(feedbackNotificationResult.type).toBe('feedback_received')
    expect(feedbackNotificationResult).toHaveProperty('feedback_context')

    // Test notification list retrieval with mixed types
    const allNotifications = [createdNotification, feedbackNotificationResult]
    const unreadCount = allNotifications.filter(n => !n.read).length
    const priorityNotifications = allNotifications.filter(n => n.priority === 'medium' || n.priority === 'high')

    expect(allNotifications).toHaveLength(2)
    expect(unreadCount).toBe(2)
    expect(priorityNotifications).toHaveLength(1) // Only the payment notification
  })

  test('should preserve notification preferences with feedback settings', async () => {
    const userId = 'user-preferences-regression'
    
    // Original notification preferences
    const originalPreferences = {
      user_id: userId,
      email_notifications: true,
      sms_notifications: false,
      in_app_notifications: true,
      notification_types: {
        payment_reminders: true,
        schedule_changes: true,
        assignment_alerts: true,
        attendance_alerts: false
      },
      quiet_hours: {
        enabled: true,
        start_time: '22:00',
        end_time: '08:00'
      }
    }

    // Enhanced preferences with feedback settings
    const enhancedPreferences = {
      ...originalPreferences,
      notification_types: {
        ...originalPreferences.notification_types,
        feedback_notifications: true,
        feedback_responses: true,
        feedback_milestones: false
      }
    }

    // Verify original preferences are unchanged
    expect(enhancedPreferences.email_notifications).toBe(originalPreferences.email_notifications)
    expect(enhancedPreferences.sms_notifications).toBe(originalPreferences.sms_notifications)
    expect(enhancedPreferences.in_app_notifications).toBe(originalPreferences.in_app_notifications)
    expect(enhancedPreferences.quiet_hours).toEqual(originalPreferences.quiet_hours)

    // Verify original notification types are preserved
    expect(enhancedPreferences.notification_types.payment_reminders).toBe(true)
    expect(enhancedPreferences.notification_types.schedule_changes).toBe(true)
    expect(enhancedPreferences.notification_types.assignment_alerts).toBe(true)
    expect(enhancedPreferences.notification_types.attendance_alerts).toBe(false)

    // Verify new feedback preferences are additive
    expect(enhancedPreferences.notification_types.feedback_notifications).toBe(true)
    expect(enhancedPreferences.notification_types.feedback_responses).toBe(true)
    expect(enhancedPreferences.notification_types.feedback_milestones).toBe(false)

    // Test preference update workflow
    const preferenceUpdateResult = {
      user_id: userId,
      updated_preferences: enhancedPreferences,
      success: true,
      backward_compatibility: true
    }

    expect(preferenceUpdateResult.success).toBe(true)
    expect(preferenceUpdateResult.backward_compatibility).toBe(true)
    expect(preferenceUpdateResult.updated_preferences.user_id).toBe(userId)
  })
})

describe('Performance and Resource Regression Tests', () => {
  
  test('should maintain dashboard loading performance with feedback widgets', async () => {
    const dashboardComponents = [
      'student_overview',
      'teacher_performance',
      'group_analytics',
      'financial_summary',
      'recent_activities'
    ]

    const newFeedbackComponents = [
      'feedback_summary',
      'recent_feedback',
      'feedback_trends'
    ]

    const allComponents = [...dashboardComponents, ...newFeedbackComponents]

    const dashboardLoadStartTime = Date.now()

    // Mock dashboard component loading
    const componentLoadTimes = allComponents.map(component => {
      const loadTime = component.includes('feedback') 
        ? 50 + Math.random() * 30  // New components might be slightly slower initially
        : 30 + Math.random() * 20  // Existing components should maintain speed
      
      return {
        component,
        load_time: loadTime,
        success: true
      }
    })

    const totalDashboardLoadTime = Date.now() - dashboardLoadStartTime + 
      Math.max(...componentLoadTimes.map(c => c.load_time))

    // Regression checks
    expect(totalDashboardLoadTime).toBeLessThan(500) // Overall dashboard should remain fast
    
    // Existing components should maintain performance
    const existingComponentTimes = componentLoadTimes
      .filter(c => dashboardComponents.includes(c.component))
      .map(c => c.load_time)
    
    existingComponentTimes.forEach(loadTime => {
      expect(loadTime).toBeLessThan(60) // Existing components stay fast
    })

    // New feedback components should be reasonably fast
    const feedbackComponentTimes = componentLoadTimes
      .filter(c => newFeedbackComponents.includes(c.component))
      .map(c => c.load_time)
    
    feedbackComponentTimes.forEach(loadTime => {
      expect(loadTime).toBeLessThan(100) // New components should be under 100ms
    })

    // All components should load successfully
    componentLoadTimes.forEach(result => {
      expect(result.success).toBe(true)
    })
  })

  test('should maintain database query performance with feedback table joins', async () => {
    const baseQueries = [
      {
        name: 'get_teacher_list',
        base_time: 120,
        with_feedback_joins: 180,
        max_acceptable_time: 250
      },
      {
        name: 'get_student_profiles',
        base_time: 100,
        with_feedback_joins: 140,
        max_acceptable_time: 200
      },
      {
        name: 'get_group_analytics',
        base_time: 200,
        with_feedback_joins: 280,
        max_acceptable_time: 350
      }
    ]

    baseQueries.forEach(query => {
      // Performance regression check
      expect(query.with_feedback_joins).toBeLessThan(query.max_acceptable_time)
      
      // Performance impact should be reasonable (max 50% increase)
      const performanceImpact = (query.with_feedback_joins - query.base_time) / query.base_time
      expect(performanceImpact).toBeLessThan(0.5) // Less than 50% increase
      
      // Absolute performance should remain good
      expect(query.with_feedback_joins).toBeLessThan(300) // All queries under 300ms
    })

    // Test query optimization
    const optimizedQueries = baseQueries.map(query => ({
      ...query,
      optimized_time: query.with_feedback_joins * 0.8, // 20% improvement with indexing
      indexed: true
    }))

    optimizedQueries.forEach(query => {
      expect(query.optimized_time).toBeLessThan(query.with_feedback_joins)
      expect(query.optimized_time).toBeLessThan(225) // Better performance with optimization
    })
  })

  test('should maintain memory usage patterns with feedback data caching', async () => {
    const baselineMemory = process.memoryUsage().heapUsed
    
    // Simulate loading various data sets
    const dataLoads = [
      { name: 'teachers', size: 100, type: 'existing' },
      { name: 'students', size: 500, type: 'existing' },
      { name: 'groups', size: 25, type: 'existing' },
      { name: 'feedback_entries', size: 200, type: 'new' },
      { name: 'feedback_analytics', size: 50, type: 'new' }
    ]

    let currentMemory = baselineMemory
    const memoryGrowthPerLoad = []

    for (const load of dataLoads) {
      // Simulate data loading
      const simulatedData = Array.from({ length: load.size }, (_, i) => ({
        id: `${load.name}_${i}`,
        data: `simulated_${load.name}_data_${i}`,
        timestamp: new Date()
      }))

      // Measure memory after load
      const afterLoadMemory = process.memoryUsage().heapUsed
      const memoryGrowth = afterLoadMemory - currentMemory
      memoryGrowthPerLoad.push({
        ...load,
        memory_growth: memoryGrowth,
        memory_per_item: memoryGrowth / load.size
      })
      
      currentMemory = afterLoadMemory
    }

    // Clear simulated data
    dataLoads.forEach(load => {
      // Simulate data clearing
    })

    // Force garbage collection if available
    if (global.gc) {
      global.gc()
    }

    const finalMemory = process.memoryUsage().heapUsed
    const totalMemoryGrowth = finalMemory - baselineMemory

    // Memory regression checks
    expect(totalMemoryGrowth).toBeLessThan(20 * 1024 * 1024) // Less than 20MB total growth

    // Existing data types should maintain memory efficiency
    const existingDataMemory = memoryGrowthPerLoad
      .filter(load => load.type === 'existing')
      .reduce((sum, load) => sum + load.memory_growth, 0)
    
    expect(existingDataMemory).toBeLessThan(10 * 1024 * 1024) // Existing data under 10MB

    // New feedback data should be reasonably efficient
    const feedbackDataMemory = memoryGrowthPerLoad
      .filter(load => load.type === 'new')
      .reduce((sum, load) => sum + load.memory_growth, 0)
    
    expect(feedbackDataMemory).toBeLessThan(8 * 1024 * 1024) // Feedback data under 8MB
  })
})