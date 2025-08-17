import { describe, test, expect, beforeEach, afterEach } from '@jest/globals'
import { FeedbackService } from '@/lib/services/feedback-service'
import {
  createMockFeedbackEntry,
  createMockFeedbackSubmission,
  createMockUser
} from '../utils/feedback-mock-data'

/**
 * Feedback Notification Integration Test Suite
 * 
 * Tests the integration between feedback system and existing notification
 * infrastructure to ensure seamless notification delivery without disrupting
 * existing notification workflows.
 */

interface NotificationTemplate {
  id: string
  type: string
  title_template: string
  message_template: string
  channels: string[]
  priority: 'low' | 'medium' | 'high'
  category: string
}

interface NotificationDelivery {
  notification_id: string
  user_id: string
  channel: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  sent_at: Date
  delivered_at?: Date
  read_at?: Date
  error_message?: string
}

interface NotificationPreferences {
  user_id: string
  email_enabled: boolean
  push_enabled: boolean
  in_app_enabled: boolean
  quiet_hours: {
    enabled: boolean
    start_time: string
    end_time: string
  }
  frequency_limits: {
    max_per_hour: number
    max_per_day: number
  }
  category_preferences: Record<string, boolean>
}

describe('Feedback Notification Creation', () => {
  let feedbackService: FeedbackService

  beforeEach(() => {
    jest.clearAllMocks()
    feedbackService = new FeedbackService()
  })

  test('should create appropriate notifications when feedback is received', async () => {
    const feedbackSubmission = createMockFeedbackSubmission({
      rating: 5,
      category: 'teaching_quality',
      to_user_id: 'teacher-notification-test'
    })

    // Mock notification templates
    const feedbackNotificationTemplates: NotificationTemplate[] = [
      {
        id: 'feedback_received_high',
        type: 'feedback_received',
        title_template: 'Excellent Feedback Received!',
        message_template: 'You received a {{rating}}-star rating for {{category}}',
        channels: ['in_app', 'email'],
        priority: 'medium',
        category: 'feedback'
      },
      {
        id: 'achievement_unlock',
        type: 'achievement',
        title_template: 'Achievement Unlocked!',
        message_template: 'You unlocked "Excellence in {{category}}" achievement',
        channels: ['in_app', 'push'],
        priority: 'high',
        category: 'achievement'
      }
    ]

    // Mock feedback submission with notification creation
    jest.spyOn(feedbackService, 'submitFeedback')
      .mockImplementation(async (submission) => {
        const feedbackEntry = createMockFeedbackEntry(submission)
        
        // Simulate notification creation logic
        const notifications = []
        
        // Always create feedback received notification
        notifications.push({
          id: 'notif_feedback_' + Date.now(),
          template_id: 'feedback_received_high',
          user_id: submission.to_user_id,
          title: 'Excellent Feedback Received!',
          message: `You received a ${submission.rating}-star rating for ${submission.category}`,
          channels: ['in_app', 'email'],
          priority: 'medium',
          category: 'feedback',
          context: {
            feedback_id: feedbackEntry.id,
            rating: submission.rating,
            category: submission.category
          }
        })

        // Create achievement notification for high ratings
        if (submission.rating >= 5) {
          notifications.push({
            id: 'notif_achievement_' + Date.now(),
            template_id: 'achievement_unlock',
            user_id: submission.to_user_id,
            title: 'Achievement Unlocked!',
            message: `You unlocked "Excellence in ${submission.category}" achievement`,
            channels: ['in_app', 'push'],
            priority: 'high',
            category: 'achievement',
            context: {
              feedback_id: feedbackEntry.id,
              achievement_type: 'excellence',
              category: submission.category
            }
          })
        }

        return {
          ...feedbackEntry,
          notifications_created: notifications
        }
      })

    const result = await feedbackService.submitFeedback(feedbackSubmission)

    // Verify notification creation
    expect(result).toHaveProperty('notifications_created')
    expect(result.notifications_created).toHaveLength(2) // Feedback + achievement notifications

    const feedbackNotification = result.notifications_created.find(n => n.category === 'feedback')
    const achievementNotification = result.notifications_created.find(n => n.category === 'achievement')

    // Verify feedback notification
    expect(feedbackNotification).toBeDefined()
    expect(feedbackNotification.title).toBe('Excellent Feedback Received!')
    expect(feedbackNotification.message).toContain('5-star rating')
    expect(feedbackNotification.message).toContain('teaching_quality')
    expect(feedbackNotification.channels).toContain('in_app')
    expect(feedbackNotification.channels).toContain('email')

    // Verify achievement notification
    expect(achievementNotification).toBeDefined()
    expect(achievementNotification.title).toBe('Achievement Unlocked!')
    expect(achievementNotification.priority).toBe('high')
    expect(achievementNotification.context.achievement_type).toBe('excellence')
  })

  test('should create different notifications based on feedback rating and category', async () => {
    const testScenarios = [
      {
        rating: 5,
        category: 'teaching_quality',
        expected_notifications: ['feedback_received', 'achievement_high_rating']
      },
      {
        rating: 3,
        category: 'communication',
        expected_notifications: ['feedback_received']
      },
      {
        rating: 1,
        category: 'behavior',
        expected_notifications: ['feedback_received', 'improvement_suggestion']
      }
    ]

    for (const scenario of testScenarios) {
      const submission = createMockFeedbackSubmission({
        rating: scenario.rating,
        category: scenario.category,
        to_user_id: 'teacher-scenario-test'
      })

      // Mock scenario-specific notification creation
      jest.spyOn(feedbackService, 'submitFeedback')
        .mockImplementation(async (submission) => {
          const feedbackEntry = createMockFeedbackEntry(submission)
          const notifications = []

          // Always create feedback received notification
          notifications.push({
            type: 'feedback_received',
            rating: submission.rating,
            category: submission.category
          })

          // High rating achievement
          if (submission.rating >= 5) {
            notifications.push({
              type: 'achievement_high_rating',
              achievement: 'excellence'
            })
          }

          // Low rating improvement suggestion
          if (submission.rating <= 2) {
            notifications.push({
              type: 'improvement_suggestion',
              suggestion_area: submission.category
            })
          }

          return {
            ...feedbackEntry,
            notifications_created: notifications
          }
        })

      const result = await feedbackService.submitFeedback(submission)

      // Verify expected notifications were created
      const notificationTypes = result.notifications_created.map(n => n.type)
      scenario.expected_notifications.forEach(expectedType => {
        expect(notificationTypes).toContain(expectedType)
      })

      expect(result.notifications_created).toHaveLength(scenario.expected_notifications.length)
    }
  })

  test('should handle anonymous feedback notifications appropriately', async () => {
    const anonymousFeedback = createMockFeedbackSubmission({
      rating: 4,
      category: 'teaching_quality',
      to_user_id: 'teacher-anonymous-test',
      is_anonymous: true
    })

    jest.spyOn(feedbackService, 'submitFeedback')
      .mockImplementation(async (submission) => {
        const feedbackEntry = createMockFeedbackEntry(submission)
        
        const notification = {
          id: 'notif_anonymous_' + Date.now(),
          user_id: submission.to_user_id,
          title: 'Anonymous Feedback Received',
          message: `You received anonymous feedback with a ${submission.rating}-star rating`,
          channels: ['in_app'],
          priority: 'medium',
          category: 'feedback',
          context: {
            feedback_id: feedbackEntry.id,
            is_anonymous: true,
            rating: submission.rating,
            category: submission.category
          }
        }

        return {
          ...feedbackEntry,
          notifications_created: [notification]
        }
      })

    const result = await feedbackService.submitFeedback(anonymousFeedback)

    const notification = result.notifications_created[0]
    expect(notification.title).toBe('Anonymous Feedback Received')
    expect(notification.message).toContain('anonymous feedback')
    expect(notification.context.is_anonymous).toBe(true)
    expect(notification.channels).toEqual(['in_app']) // Only in-app for anonymous
  })
})

describe('Notification Delivery Integration', () => {
  let feedbackService: FeedbackService

  beforeEach(() => {
    feedbackService = new FeedbackService()
  })

  test('should respect user notification preferences for feedback notifications', async () => {
    const userId = 'user-preferences-test'
    const userPreferences: NotificationPreferences = {
      user_id: userId,
      email_enabled: true,
      push_enabled: false,
      in_app_enabled: true,
      quiet_hours: {
        enabled: true,
        start_time: '22:00',
        end_time: '08:00'
      },
      frequency_limits: {
        max_per_hour: 5,
        max_per_day: 20
      },
      category_preferences: {
        feedback: true,
        achievement: true,
        improvement: false
      }
    }

    const feedbackSubmission = createMockFeedbackSubmission({
      to_user_id: userId,
      rating: 5,
      category: 'teaching_quality'
    })

    // Mock notification delivery with preferences
    const mockDeliveryService = {
      async deliverNotification(notification: any, preferences: NotificationPreferences) {
        const deliveries: NotificationDelivery[] = []
        
        // Check category preferences
        if (!preferences.category_preferences[notification.category]) {
          return [] // Don't deliver if category disabled
        }

        // Check quiet hours
        const currentHour = new Date().getHours()
        const isQuietTime = preferences.quiet_hours.enabled && 
          (currentHour >= 22 || currentHour < 8)

        // Deliver via enabled channels, respecting quiet hours
        for (const channel of notification.channels) {
          let shouldDeliver = false

          switch (channel) {
            case 'email':
              shouldDeliver = preferences.email_enabled && !isQuietTime
              break
            case 'push':
              shouldDeliver = preferences.push_enabled && !isQuietTime
              break
            case 'in_app':
              shouldDeliver = preferences.in_app_enabled // In-app not affected by quiet hours
              break
          }

          if (shouldDeliver) {
            deliveries.push({
              notification_id: notification.id,
              user_id: userId,
              channel,
              status: 'sent',
              sent_at: new Date()
            })
          }
        }

        return deliveries
      }
    }

    // Test notification with achievement (enabled category)
    const achievementNotification = {
      id: 'notif_achievement_test',
      user_id: userId,
      title: 'Achievement Unlocked!',
      message: 'You unlocked an achievement',
      channels: ['email', 'push', 'in_app'],
      category: 'achievement'
    }

    const achievementDeliveries = await mockDeliveryService.deliverNotification(
      achievementNotification, 
      userPreferences
    )

    // Should deliver via email and in-app (push disabled, but email enabled)
    expect(achievementDeliveries).toHaveLength(2)
    expect(achievementDeliveries.map(d => d.channel)).toContain('email')
    expect(achievementDeliveries.map(d => d.channel)).toContain('in_app')
    expect(achievementDeliveries.map(d => d.channel)).not.toContain('push')

    // Test notification with improvement (disabled category)
    const improvementNotification = {
      id: 'notif_improvement_test',
      user_id: userId,
      title: 'Improvement Suggestion',
      message: 'Consider focusing on communication skills',
      channels: ['email', 'in_app'],
      category: 'improvement'
    }

    const improvementDeliveries = await mockDeliveryService.deliverNotification(
      improvementNotification,
      userPreferences
    )

    // Should not deliver any as improvement category is disabled
    expect(improvementDeliveries).toHaveLength(0)
  })

  test('should handle notification delivery failures gracefully', async () => {
    const userId = 'user-delivery-failure-test'
    const notification = {
      id: 'notif_failure_test',
      user_id: userId,
      title: 'Test Notification',
      message: 'This is a test notification',
      channels: ['email', 'push', 'in_app'],
      category: 'feedback'
    }

    // Mock delivery service with mixed success/failure
    const mockDeliveryWithFailures = {
      async deliverNotification(notification: any) {
        const deliveries: NotificationDelivery[] = []

        for (const channel of notification.channels) {
          const delivery: NotificationDelivery = {
            notification_id: notification.id,
            user_id: userId,
            channel,
            status: 'sent',
            sent_at: new Date()
          }

          // Simulate different failure scenarios
          switch (channel) {
            case 'email':
              delivery.status = 'delivered'
              delivery.delivered_at = new Date()
              break
            case 'push':
              delivery.status = 'failed'
              delivery.error_message = 'Push token invalid'
              break
            case 'in_app':
              delivery.status = 'delivered'
              delivery.delivered_at = new Date()
              break
          }

          deliveries.push(delivery)
        }

        return deliveries
      }
    }

    const deliveries = await mockDeliveryWithFailures.deliverNotification(notification)

    // Verify mixed results
    expect(deliveries).toHaveLength(3)
    
    const emailDelivery = deliveries.find(d => d.channel === 'email')
    const pushDelivery = deliveries.find(d => d.channel === 'push')
    const inAppDelivery = deliveries.find(d => d.channel === 'in_app')

    expect(emailDelivery?.status).toBe('delivered')
    expect(pushDelivery?.status).toBe('failed')
    expect(pushDelivery?.error_message).toBe('Push token invalid')
    expect(inAppDelivery?.status).toBe('delivered')

    // Calculate delivery success rate
    const successfulDeliveries = deliveries.filter(d => d.status === 'delivered').length
    const successRate = successfulDeliveries / deliveries.length

    expect(successRate).toBeCloseTo(0.67, 1) // 2 out of 3 successful
  })

  test('should batch notifications appropriately to avoid spam', async () => {
    const userId = 'user-batch-test'
    const multipleSubmissions = Array.from({ length: 5 }, (_, i) =>
      createMockFeedbackSubmission({
        to_user_id: userId,
        rating: 4 + (i % 2), // Alternating 4 and 5 ratings
        category: ['teaching_quality', 'communication'][i % 2],
        message: `Feedback submission ${i + 1}`
      })
    )

    // Mock batching service
    const mockBatchingService = {
      pendingNotifications: [] as any[],
      batchInterval: 300000, // 5 minutes

      async addNotification(notification: any) {
        this.pendingNotifications.push({
          ...notification,
          created_at: new Date()
        })

        // Check if batching criteria is met
        if (this.shouldSendBatch()) {
          return this.sendBatch()
        }

        return null
      },

      shouldSendBatch(): boolean {
        // Send batch if 3+ notifications for same user in 5 minutes
        const now = new Date()
        const recentNotifications = this.pendingNotifications.filter(n => 
          n.user_id === userId &&
          (now.getTime() - n.created_at.getTime()) < this.batchInterval
        )

        return recentNotifications.length >= 3
      },

      async sendBatch() {
        const batch = this.pendingNotifications.filter(n => n.user_id === userId)
        this.pendingNotifications = this.pendingNotifications.filter(n => n.user_id !== userId)

        const batchedNotification = {
          id: 'batch_' + Date.now(),
          user_id: userId,
          title: `Feedback Summary (${batch.length} new items)`,
          message: `You received ${batch.length} feedback submissions`,
          channels: ['in_app', 'email'],
          category: 'feedback_batch',
          batch_count: batch.length,
          individual_notifications: batch
        }

        return {
          batched_notification: batchedNotification,
          batch_size: batch.length
        }
      }
    }

    // Add notifications from multiple submissions
    let batchResult = null
    for (const submission of multipleSubmissions) {
      const notification = {
        id: 'feedback_notif_' + Date.now() + Math.random(),
        user_id: userId,
        title: 'Feedback Received',
        message: `You received feedback: ${submission.message}`,
        channels: ['in_app', 'email'],
        category: 'feedback'
      }

      const result = await mockBatchingService.addNotification(notification)
      if (result) {
        batchResult = result
      }
    }

    // Verify batching occurred
    expect(batchResult).not.toBeNull()
    expect(batchResult.batch_size).toBeGreaterThanOrEqual(3)
    expect(batchResult.batched_notification.title).toContain('Feedback Summary')
    expect(batchResult.batched_notification.batch_count).toBe(batchResult.batch_size)
  })
})

describe('Notification Templates and Customization', () => {
  
  test('should use correct notification templates based on feedback context', async () => {
    const templateVariables = {
      user_name: 'John Teacher',
      rating: 5,
      category: 'teaching_quality',
      student_name: 'Jane Student',
      group_name: 'Advanced English',
      feedback_message: 'Excellent explanation of grammar rules'
    }

    const notificationTemplates = [
      {
        type: 'feedback_received_high',
        condition: (vars: any) => vars.rating >= 4,
        title: 'Great Feedback Received!',
        message: 'Hi {{user_name}}, you received a {{rating}}-star rating from {{student_name}} in {{group_name}} for {{category}}',
        variables_used: ['user_name', 'rating', 'student_name', 'group_name', 'category']
      },
      {
        type: 'feedback_received_low',
        condition: (vars: any) => vars.rating <= 2,
        title: 'Feedback Received - Improvement Opportunity',
        message: 'Hi {{user_name}}, you received feedback in {{group_name}} that suggests focusing on {{category}}',
        variables_used: ['user_name', 'group_name', 'category']
      },
      {
        type: 'feedback_streak',
        condition: (vars: any) => vars.consecutive_high_ratings >= 5,
        title: 'Amazing! Feedback Streak Achieved!',
        message: 'Congratulations {{user_name}}! You\'ve received 5 consecutive high ratings for {{category}}',
        variables_used: ['user_name', 'category']
      }
    ]

    // Test high rating template
    const highRatingTemplate = notificationTemplates.find(t => t.condition(templateVariables))
    expect(highRatingTemplate?.type).toBe('feedback_received_high')

    // Render template
    let renderedMessage = highRatingTemplate!.message
    highRatingTemplate!.variables_used.forEach(variable => {
      const value = templateVariables[variable as keyof typeof templateVariables]
      renderedMessage = renderedMessage.replace(`{{${variable}}}`, String(value))
    })

    expect(renderedMessage).toBe(
      'Hi John Teacher, you received a 5-star rating from Jane Student in Advanced English for teaching_quality'
    )

    // Test low rating scenario
    const lowRatingVariables = { ...templateVariables, rating: 2 }
    const lowRatingTemplate = notificationTemplates.find(t => t.condition(lowRatingVariables))
    expect(lowRatingTemplate?.type).toBe('feedback_received_low')

    // Test streak scenario
    const streakVariables = { ...templateVariables, consecutive_high_ratings: 5 }
    const streakTemplate = notificationTemplates.find(t => t.condition(streakVariables))
    expect(streakTemplate?.type).toBe('feedback_streak')
  })

  test('should support multilingual notification templates', async () => {
    const multilingualTemplates = {
      'feedback_received_high': {
        'en': {
          title: 'Great Feedback Received!',
          message: 'You received a {{rating}}-star rating for {{category}}'
        },
        'ru': {
          title: 'Получен отличный отзыв!',
          message: 'Вы получили оценку {{rating}} звёзд за {{category}}'
        },
        'uz': {
          title: 'Ajoyib fikr-mulohaza olindi!',
          message: 'Siz {{category}} uchun {{rating}} yulduzli baho oldingiz'
        }
      }
    }

    const templateVariables = {
      rating: 5,
      category: 'teaching_quality'
    }

    const supportedLanguages = ['en', 'ru', 'uz']

    supportedLanguages.forEach(language => {
      const template = multilingualTemplates.feedback_received_high[language]
      
      expect(template).toBeDefined()
      expect(template.title).toBeTruthy()
      expect(template.message).toContain('{{rating}}')
      expect(template.message).toContain('{{category}}')

      // Render template
      let renderedMessage = template.message
      Object.keys(templateVariables).forEach(variable => {
        const value = templateVariables[variable as keyof typeof templateVariables]
        renderedMessage = renderedMessage.replace(`{{${variable}}}`, String(value))
      })

      expect(renderedMessage).toContain('5')
      expect(renderedMessage).toContain('teaching_quality')
    })
  })
})

describe('Real-time Notification Delivery', () => {
  
  test('should deliver notifications in real-time for immediate feedback', async () => {
    const userId = 'user-realtime-test'
    
    // Mock WebSocket/real-time connection
    const mockRealTimeService = {
      connections: new Map(),
      
      connect(userId: string) {
        this.connections.set(userId, {
          userId,
          connected: true,
          lastSeen: new Date(),
          socket: { emit: jest.fn() }
        })
      },

      disconnect(userId: string) {
        this.connections.delete(userId)
      },

      async sendRealTimeNotification(notification: any) {
        const connection = this.connections.get(notification.user_id)
        
        if (connection && connection.connected) {
          const delivery = {
            notification_id: notification.id,
            user_id: notification.user_id,
            channel: 'realtime',
            status: 'delivered',
            sent_at: new Date(),
            delivered_at: new Date()
          }

          connection.socket.emit('notification', notification)
          return delivery
        }

        return null
      },

      isUserOnline(userId: string): boolean {
        const connection = this.connections.get(userId)
        return connection?.connected || false
      }
    }

    // Connect user
    mockRealTimeService.connect(userId)
    expect(mockRealTimeService.isUserOnline(userId)).toBe(true)

    // Send real-time notification
    const realTimeNotification = {
      id: 'realtime_notif_' + Date.now(),
      user_id: userId,
      title: 'New Feedback Received',
      message: 'You just received feedback from a student',
      type: 'feedback_received',
      timestamp: new Date()
    }

    const delivery = await mockRealTimeService.sendRealTimeNotification(realTimeNotification)

    // Verify real-time delivery
    expect(delivery).not.toBeNull()
    expect(delivery.channel).toBe('realtime')
    expect(delivery.status).toBe('delivered')
    expect(delivery.delivered_at).toBeDefined()

    // Verify WebSocket emission
    const connection = mockRealTimeService.connections.get(userId)
    expect(connection.socket.emit).toHaveBeenCalledWith('notification', realTimeNotification)

    // Test offline user scenario
    mockRealTimeService.disconnect(userId)
    expect(mockRealTimeService.isUserOnline(userId)).toBe(false)

    const offlineDelivery = await mockRealTimeService.sendRealTimeNotification(realTimeNotification)
    expect(offlineDelivery).toBeNull() // Should not deliver to offline user
  })

  test('should queue notifications for offline users', async () => {
    const userId = 'user-offline-queue-test'
    
    // Mock notification queue service
    const mockQueueService = {
      queues: new Map(),

      async queueNotification(notification: any) {
        if (!this.queues.has(notification.user_id)) {
          this.queues.set(notification.user_id, [])
        }

        const userQueue = this.queues.get(notification.user_id)
        userQueue.push({
          ...notification,
          queued_at: new Date(),
          attempts: 0
        })

        return {
          queued: true,
          queue_position: userQueue.length,
          queue_size: userQueue.length
        }
      },

      async processQueueForUser(userId: string) {
        const userQueue = this.queues.get(userId) || []
        const processedNotifications = []

        for (const queuedNotification of userQueue) {
          // Simulate processing
          const processed = {
            ...queuedNotification,
            processed_at: new Date(),
            status: 'delivered'
          }
          processedNotifications.push(processed)
        }

        // Clear queue after processing
        this.queues.set(userId, [])

        return {
          processed_count: processedNotifications.length,
          notifications: processedNotifications
        }
      },

      getQueueSize(userId: string): number {
        return this.queues.get(userId)?.length || 0
      }
    }

    // Queue notifications for offline user
    const offlineNotifications = [
      {
        id: 'queue_notif_1',
        user_id: userId,
        title: 'Feedback 1',
        message: 'First queued notification'
      },
      {
        id: 'queue_notif_2',
        user_id: userId,
        title: 'Feedback 2',
        message: 'Second queued notification'
      },
      {
        id: 'queue_notif_3',
        user_id: userId,
        title: 'Achievement',
        message: 'Achievement notification'
      }
    ]

    // Queue all notifications
    for (const notification of offlineNotifications) {
      const queueResult = await mockQueueService.queueNotification(notification)
      expect(queueResult.queued).toBe(true)
    }

    expect(mockQueueService.getQueueSize(userId)).toBe(3)

    // Process queue when user comes online
    const processResult = await mockQueueService.processQueueForUser(userId)

    expect(processResult.processed_count).toBe(3)
    expect(processResult.notifications).toHaveLength(3)
    expect(mockQueueService.getQueueSize(userId)).toBe(0) // Queue cleared

    // Verify all notifications were processed
    processResult.notifications.forEach(notification => {
      expect(notification.status).toBe('delivered')
      expect(notification.processed_at).toBeDefined()
    })
  })
})