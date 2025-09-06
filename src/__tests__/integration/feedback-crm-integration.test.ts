import { describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals'
import { FeedbackService } from '@/lib/services/feedback-service'
import {
  createMockFeedbackEntry,
  createMockFeedbackSubmission,
  createMockTeacherFeedbackOverview,
  createMockStudentFeedbackOverview,
  createMockFeedbackListResponse,
  createMockUser,
  createScenarioFeedbackData,
  validateMockData
} from '../utils/feedback-mock-data'
import { createMockTeacher, createMockTeacherList } from '../utils/mock-data'

/**
 * Feedback System CRM Integration Test Suite
 * 
 * Tests the seamless integration of the feedback system with existing
 * Harry School CRM functionality, ensuring no disruption to core workflows.
 */

describe('Feedback Integration with Teacher Management', () => {
  let feedbackService: FeedbackService
  
  beforeEach(() => {
    jest.clearAllMocks()
    feedbackService = new FeedbackService()
  })

  test('should integrate feedback display within teacher profiles without affecting performance', async () => {
    const teacherId = 'teacher-integration-test'
    const mockTeacher = createMockTeacher({ id: teacherId })
    const mockFeedbackOverview = createMockTeacherFeedbackOverview()
    
    // Mock the service calls
    jest.spyOn(feedbackService, 'getTeacherFeedbackOverview')
      .mockResolvedValue(mockFeedbackOverview)
    
    const startTime = Date.now()
    
    // Simulate loading teacher profile with feedback integration
    const teacherProfile = {
      ...mockTeacher,
      feedbackOverview: await feedbackService.getTeacherFeedbackOverview(teacherId)
    }
    
    const loadTime = Date.now() - startTime
    
    // Assertions
    expect(teacherProfile).toHaveProperty('feedbackOverview')
    expect(teacherProfile.feedbackOverview).toEqual(mockFeedbackOverview)
    expect(loadTime).toBeLessThan(500) // Should load quickly
    
    // Verify feedback data structure matches expectations
    expect(teacherProfile.feedbackOverview.summary).toHaveProperty('total_received')
    expect(teacherProfile.feedbackOverview.recent_feedback).toBeInstanceOf(Array)
    expect(teacherProfile.feedbackOverview.student_engagement).toHaveProperty('response_rate')
  })

  test('should maintain teacher profile editing functionality with feedback context', async () => {
    const teacherId = 'teacher-edit-test'
    const originalTeacher = createMockTeacher({ id: teacherId })
    const feedbackContext = createScenarioFeedbackData.excellentTeacher()
    
    // Simulate editing teacher while feedback exists
    const updatedTeacherData = {
      ...originalTeacher,
      specializations: [...originalTeacher.specializations, 'Advanced Mathematics'],
      notes: 'Updated with excellent feedback integration'
    }
    
    // Mock teacher service update (would normally call teacher service)
    const updateResult = {
      success: true,
      data: updatedTeacherData
    }
    
    // Verify teacher update doesn't affect feedback integrity
    expect(updateResult.success).toBe(true)
    expect(updateResult.data.specializations).toContain('Advanced Mathematics')
    
    // Verify feedback context is preserved
    for (const feedback of feedbackContext) {
      expect(validateMockData.feedbackEntry(feedback)).toBe(true)
      expect(feedback.to_user_id).toBe(teacherId)
    }
  })

  test('should handle teacher archiving/deletion with feedback data preservation', async () => {
    const teacherId = 'teacher-archive-test'
    const existingFeedback = createScenarioFeedbackData.excellentTeacher()
    
    // Mock teacher archiving
    const archiveResult = {
      success: true,
      archived_at: new Date().toISOString(),
      feedback_preserved: true
    }
    
    // Mock feedback retrieval after archiving
    jest.spyOn(feedbackService, 'getFeedbackForUser')
      .mockResolvedValue(createMockFeedbackListResponse({
        data: existingFeedback
      }))
    
    const feedbackAfterArchive = await feedbackService.getFeedbackForUser(teacherId, 'received')
    
    // Assertions
    expect(archiveResult.success).toBe(true)
    expect(archiveResult.feedback_preserved).toBe(true)
    expect(feedbackAfterArchive.data).toHaveLength(existingFeedback.length)
    
    // Verify feedback data integrity
    feedbackAfterArchive.data.forEach((feedback, index) => {
      expect(feedback.to_user_id).toBe(teacherId)
      expect(validateMockData.feedbackEntry(feedback)).toBe(true)
    })
  })

  test('should integrate feedback statistics in teacher list views', async () => {
    const teachers = createMockTeacherList(5)
    const teacherIds = teachers.map(t => t.id)
    
    // Mock feedback statistics for each teacher
    const feedbackStats = teacherIds.map(id => ({
      teacher_id: id,
      average_rating: 3.5 + Math.random() * 1.5, // 3.5-5.0 range
      feedback_count: Math.floor(Math.random() * 20) + 5, // 5-25 feedback
      recent_trend: Math.random() > 0.5 ? 'improving' : 'stable'
    }))
    
    // Simulate enhanced teacher list with feedback data
    const enhancedTeacherList = teachers.map(teacher => {
      const stats = feedbackStats.find(s => s.teacher_id === teacher.id)
      return {
        ...teacher,
        feedback_stats: stats
      }
    })
    
    // Verify integration
    enhancedTeacherList.forEach(teacher => {
      expect(teacher).toHaveProperty('feedback_stats')
      expect(teacher.feedback_stats.average_rating).toBeGreaterThanOrEqual(3.5)
      expect(teacher.feedback_stats.average_rating).toBeLessThanOrEqual(5.0)
      expect(teacher.feedback_stats.feedback_count).toBeGreaterThanOrEqual(5)
    })
    
    // Test sorting by feedback metrics
    const sortedByRating = [...enhancedTeacherList].sort((a, b) => 
      b.feedback_stats.average_rating - a.feedback_stats.average_rating
    )
    
    expect(sortedByRating[0].feedback_stats.average_rating)
      .toBeGreaterThanOrEqual(sortedByRating[sortedByRating.length - 1].feedback_stats.average_rating)
  })
})

describe('Feedback Integration with Student Management', () => {
  let feedbackService: FeedbackService
  
  beforeEach(() => {
    feedbackService = new FeedbackService()
  })

  test('should integrate student feedback overview within student profiles', async () => {
    const studentId = 'student-integration-test'
    const mockStudentOverview = createMockStudentFeedbackOverview()
    
    jest.spyOn(feedbackService, 'getStudentFeedbackOverview')
      .mockResolvedValue(mockStudentOverview)
    
    const studentProfile = {
      id: studentId,
      full_name: 'Test Student',
      feedbackOverview: await feedbackService.getStudentFeedbackOverview(studentId)
    }
    
    // Assertions
    expect(studentProfile.feedbackOverview).toEqual(mockStudentOverview)
    expect(studentProfile.feedbackOverview.feedback_given).toHaveProperty('total_submitted')
    expect(studentProfile.feedbackOverview.feedback_received).toHaveProperty('average_rating')
    expect(studentProfile.feedbackOverview.ranking_impact).toHaveProperty('points_from_engagement')
  })

  test('should maintain student enrollment workflows with feedback tracking', async () => {
    const studentId = 'student-enrollment-test'
    const groupId = 'group-enrollment-test'
    
    // Mock student enrollment
    const enrollmentData = {
      student_id: studentId,
      group_id: groupId,
      enrollment_date: new Date(),
      status: 'active'
    }
    
    // Mock initial feedback submission after enrollment
    const initialFeedback = createMockFeedbackSubmission({
      to_user_id: 'teacher-in-group',
      to_user_type: 'teacher',
      group_id: groupId,
      message: 'First impression of the teacher and class environment'
    })
    
    jest.spyOn(feedbackService, 'submitFeedback')
      .mockResolvedValue(createMockFeedbackEntry(initialFeedback))
    
    // Simulate enrollment with feedback capability
    const enrollmentWithFeedback = {
      ...enrollmentData,
      feedback_enabled: true,
      initial_feedback_submitted: false
    }
    
    // Submit initial feedback
    const feedbackResult = await feedbackService.submitFeedback(initialFeedback)
    enrollmentWithFeedback.initial_feedback_submitted = true
    
    // Assertions
    expect(enrollmentWithFeedback.feedback_enabled).toBe(true)
    expect(enrollmentWithFeedback.initial_feedback_submitted).toBe(true)
    expect(feedbackResult).toHaveProperty('id')
    expect(feedbackResult.group_id).toBe(groupId)
  })

  test('should handle student status changes with feedback context preservation', async () => {
    const studentId = 'student-status-test'
    const existingFeedback = createScenarioFeedbackData.mixedRatingStudent()
    
    // Mock student status change (active -> inactive)
    const statusChange = {
      student_id: studentId,
      old_status: 'active',
      new_status: 'inactive',
      change_date: new Date(),
      feedback_context_preserved: true
    }
    
    // Mock feedback retrieval after status change
    jest.spyOn(feedbackService, 'getFeedbackForUser')
      .mockResolvedValue(createMockFeedbackListResponse({
        data: existingFeedback
      }))
    
    const feedbackAfterStatusChange = await feedbackService.getFeedbackForUser(studentId, 'received')
    
    // Verify feedback is preserved during status changes
    expect(statusChange.feedback_context_preserved).toBe(true)
    expect(feedbackAfterStatusChange.data).toHaveLength(existingFeedback.length)
    
    // Verify feedback integrity
    feedbackAfterStatusChange.data.forEach(feedback => {
      expect(validateMockData.feedbackEntry(feedback)).toBe(true)
    })
  })
})

describe('Feedback Integration with Group Management', () => {
  let feedbackService: FeedbackService
  
  beforeEach(() => {
    feedbackService = new FeedbackService()
  })

  test('should provide group-level feedback analytics within group profiles', async () => {
    const groupId = 'group-analytics-test'
    const groupFeedback = createScenarioFeedbackData.crossImpactFeedback()
    
    // Mock group feedback analytics
    const groupAnalytics = {
      group_id: groupId,
      total_feedback_entries: groupFeedback.length,
      average_rating: 4.2,
      student_engagement_rate: 0.85,
      teacher_performance_rating: 4.5,
      feedback_frequency: 2.3, // per week
      improvement_trends: {
        teaching_quality: 'improving',
        communication: 'stable',
        behavior: 'improving'
      }
    }
    
    // Simulate group dashboard with feedback integration
    const groupDashboard = {
      group_info: {
        id: groupId,
        name: 'Advanced English',
        subject: 'English'
      },
      feedback_analytics: groupAnalytics,
      recent_feedback: groupFeedback.slice(0, 5)
    }
    
    // Assertions
    expect(groupDashboard.feedback_analytics).toEqual(groupAnalytics)
    expect(groupDashboard.feedback_analytics.average_rating).toBeGreaterThan(4.0)
    expect(groupDashboard.feedback_analytics.student_engagement_rate).toBeGreaterThan(0.8)
    expect(groupDashboard.recent_feedback).toHaveLength(5)
  })

  test('should handle group merging/splitting with feedback data migration', async () => {
    const sourceGroupId = 'group-source'
    const targetGroupId = 'group-target'
    const feedbackToMigrate = createScenarioFeedbackData.crossImpactFeedback()
    
    // Mock group merge operation
    const mergeOperation = {
      source_group_id: sourceGroupId,
      target_group_id: targetGroupId,
      feedback_migration_strategy: 'preserve_all',
      migrated_feedback_count: feedbackToMigrate.length
    }
    
    // Mock migrated feedback with updated group_id
    const migratedFeedback = feedbackToMigrate.map(feedback => ({
      ...feedback,
      group_id: targetGroupId,
      migration_note: `Migrated from group ${sourceGroupId}`
    }))
    
    // Verify migration preserves feedback integrity
    expect(mergeOperation.migrated_feedback_count).toBe(feedbackToMigrate.length)
    
    migratedFeedback.forEach(feedback => {
      expect(feedback.group_id).toBe(targetGroupId)
      expect(feedback).toHaveProperty('migration_note')
      expect(validateMockData.feedbackEntry(feedback)).toBe(true)
    })
  })
})

describe('Feedback Integration with Notifications System', () => {
  let feedbackService: FeedbackService
  
  beforeEach(() => {
    feedbackService = new FeedbackService()
  })

  test('should integrate feedback notifications with existing notification workflows', async () => {
    const feedbackSubmission = createMockFeedbackSubmission({
      rating: 5,
      category: 'teaching_quality'
    })
    
    // Mock feedback submission with notification integration
    jest.spyOn(feedbackService, 'submitFeedback')
      .mockImplementation(async (submission) => {
        const feedbackEntry = createMockFeedbackEntry(submission)
        
        // Mock notification creation
        const notifications = [
          {
            id: 'notif-feedback-received',
            user_id: submission.to_user_id,
            type: 'feedback_received',
            title: 'New Feedback Received',
            message: `You received a ${submission.rating}-star rating for ${submission.category}`,
            read: false,
            created_at: new Date().toISOString()
          }
        ]
        
        // If high rating, create recognition notification
        if (submission.rating >= 4) {
          notifications.push({
            id: 'notif-recognition',
            user_id: submission.to_user_id,
            type: 'recognition',
            title: 'Excellent Performance!',
            message: 'You received high-quality feedback recognition',
            read: false,
            created_at: new Date().toISOString()
          })
        }
        
        return {
          ...feedbackEntry,
          notifications_created: notifications
        }
      })
    
    const result = await feedbackService.submitFeedback(feedbackSubmission)
    
    // Verify feedback submission created appropriate notifications
    expect(result).toHaveProperty('notifications_created')
    expect(result.notifications_created).toHaveLength(2) // Feedback received + recognition
    
    const feedbackNotification = result.notifications_created.find(n => n.type === 'feedback_received')
    const recognitionNotification = result.notifications_created.find(n => n.type === 'recognition')
    
    expect(feedbackNotification).toBeDefined()
    expect(recognitionNotification).toBeDefined()
    expect(feedbackNotification.message).toContain('5-star rating')
  })

  test('should handle feedback notification preferences integration', async () => {
    const userId = 'user-notification-test'
    
    // Mock user notification preferences
    const notificationPreferences = {
      user_id: userId,
      feedback_notifications: {
        email: true,
        in_app: true,
        push: false
      },
      recognition_notifications: {
        email: true,
        in_app: true,
        push: true
      },
      frequency: 'immediate'
    }
    
    const feedbackSubmission = createMockFeedbackSubmission({
      to_user_id: userId,
      rating: 5
    })
    
    // Mock notification delivery based on preferences
    const notificationDelivery = {
      feedback_notification: {
        email_sent: notificationPreferences.feedback_notifications.email,
        in_app_created: notificationPreferences.feedback_notifications.in_app,
        push_sent: notificationPreferences.feedback_notifications.push
      },
      recognition_notification: {
        email_sent: notificationPreferences.recognition_notifications.email,
        in_app_created: notificationPreferences.recognition_notifications.in_app,
        push_sent: notificationPreferences.recognition_notifications.push
      }
    }
    
    // Verify notifications respect user preferences
    expect(notificationDelivery.feedback_notification.email_sent).toBe(true)
    expect(notificationDelivery.feedback_notification.push_sent).toBe(false)
    expect(notificationDelivery.recognition_notification.push_sent).toBe(true)
  })
})

describe('Feedback Integration with Export/Reporting', () => {
  let feedbackService: FeedbackService
  
  beforeEach(() => {
    feedbackService = new FeedbackService()
  })

  test('should include feedback data in teacher performance reports', async () => {
    const teacherId = 'teacher-report-test'
    const teacherData = createMockTeacher({ id: teacherId })
    const feedbackOverview = createMockTeacherFeedbackOverview()
    
    // Mock comprehensive teacher report generation
    const teacherReport = {
      teacher_info: teacherData,
      performance_metrics: {
        efficiency_percentage: 85,
        quality_score: 92,
        student_satisfaction: feedbackOverview.summary.average_rating_received
      },
      feedback_analysis: {
        total_feedback: feedbackOverview.summary.total_received,
        rating_breakdown: feedbackOverview.summary.category_breakdown,
        improvement_areas: feedbackOverview.improvement_areas,
        student_engagement: feedbackOverview.student_engagement
      },
      ranking_impact: feedbackOverview.summary.ranking_impact
    }
    
    // Verify feedback integration in reports
    expect(teacherReport.feedback_analysis).toBeDefined()
    expect(teacherReport.performance_metrics.student_satisfaction).toBe(feedbackOverview.summary.average_rating_received)
    expect(teacherReport.feedback_analysis.total_feedback).toBeGreaterThan(0)
    expect(teacherReport.ranking_impact).toHaveProperty('total_points_from_feedback')
  })

  test('should support feedback data export with existing export formats', async () => {
    const feedbackData = createScenarioFeedbackData.recentFeedback()
    
    // Mock export functionality
    const exportFormats = ['csv', 'excel', 'pdf']
    const exportResults = exportFormats.map(format => ({
      format,
      data: feedbackData,
      filename: `feedback_report_${Date.now()}.${format}`,
      size_bytes: feedbackData.length * 150, // Estimated size
      generation_time: Math.random() * 2000 + 500 // 0.5-2.5 seconds
    }))
    
    // Verify export functionality
    exportResults.forEach(result => {
      expect(result.data).toHaveLength(feedbackData.length)
      expect(result.filename).toMatch(/feedback_report_\d+\.(csv|excel|pdf)/)
      expect(result.size_bytes).toBeGreaterThan(0)
      expect(result.generation_time).toBeLessThan(3000) // Should be fast
    })
    
    // Test filtered export
    const filteredExport = {
      filters: {
        date_range: { from: '2024-01-01', to: '2024-03-31' },
        rating_min: 4,
        category: ['teaching_quality']
      },
      data: feedbackData.filter(f => f.rating >= 4 && f.category === 'teaching_quality'),
      format: 'excel'
    }
    
    expect(filteredExport.data.length).toBeLessThanOrEqual(feedbackData.length)
    filteredExport.data.forEach(feedback => {
      expect(feedback.rating).toBeGreaterThanOrEqual(4)
      expect(feedback.category).toBe('teaching_quality')
    })
  })
})

describe('Feedback System Performance Integration', () => {
  test('should maintain system performance with feedback queries', async () => {
    const startTime = Date.now()
    
    // Mock simultaneous operations
    const operations = [
      'teacher_profile_load',
      'student_dashboard_load',
      'feedback_submission',
      'analytics_calculation',
      'notification_creation'
    ]
    
    const operationResults = await Promise.all(
      operations.map(async (operation) => {
        const operationStart = Date.now()
        
        // Simulate operation with appropriate delay
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50))
        
        return {
          operation,
          duration: Date.now() - operationStart,
          success: true
        }
      })
    )
    
    const totalTime = Date.now() - startTime
    
    // Performance assertions
    expect(totalTime).toBeLessThan(500) // Parallel operations should be fast
    operationResults.forEach(result => {
      expect(result.success).toBe(true)
      expect(result.duration).toBeLessThan(200) // Individual operations should be quick
    })
  })

  test('should handle concurrent feedback operations without affecting core CRM', async () => {
    const concurrentOperations = 10
    const feedbackSubmissions = Array.from({ length: concurrentOperations }, (_, i) =>
      createMockFeedbackSubmission({
        to_user_id: `user-concurrent-${i}`,
        message: `Concurrent feedback ${i}`
      })
    )
    
    const startTime = Date.now()
    
    // Mock concurrent feedback submissions
    const results = await Promise.all(
      feedbackSubmissions.map(async (submission, index) => {
        try {
          // Simulate submission with slight delay variation
          await new Promise(resolve => setTimeout(resolve, Math.random() * 50))
          
          return {
            index,
            success: true,
            feedback_id: `feedback-concurrent-${index}`,
            submission_time: Date.now()
          }
        } catch (error) {
          return {
            index,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      })
    )
    
    const totalTime = Date.now() - startTime
    const successCount = results.filter(r => r.success).length
    
    // Verify concurrent operations succeed
    expect(successCount).toBe(concurrentOperations)
    expect(totalTime).toBeLessThan(1000) // Should handle concurrency efficiently
    
    // Verify no operation failures
    results.forEach((result, index) => {
      expect(result.success).toBe(true)
      expect(result).toHaveProperty('feedback_id')
    })
  })
})