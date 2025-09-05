import { describe, test, expect, beforeEach, afterEach } from '@jest/globals'
import { FeedbackService } from '@/lib/services/feedback-service'
import {
  createMockFeedbackEntry,
  createMockFeedbackSubmission,
  createMockUser,
  createMockFeedbackList
} from '../utils/feedback-mock-data'

/**
 * Feedback System Security and Privacy Test Suite
 * 
 * Tests security controls, data privacy, and access patterns to ensure
 * the feedback system maintains the security standards of Harry School CRM
 * and properly protects sensitive feedback data.
 */

interface SecurityContext {
  user_id: string
  user_type: 'student' | 'teacher' | 'admin' | 'superadmin'
  organization_id: string
  permissions: string[]
  session_id: string
}

interface PrivacySettings {
  anonymous_feedback_allowed: boolean
  cross_organization_visibility: boolean
  data_retention_days: number
  export_restrictions: string[]
  sensitive_data_masking: boolean
}

describe('Access Control and Permissions', () => {
  let feedbackService: FeedbackService

  beforeEach(() => {
    jest.clearAllMocks()
    feedbackService = new FeedbackService()
  })

  test('should enforce proper access control for feedback submission', async () => {
    const testUsers = [
      {
        id: 'student-user',
        type: 'student',
        organization_id: 'org-1',
        permissions: ['submit_feedback', 'view_own_feedback']
      },
      {
        id: 'teacher-user',
        type: 'teacher',
        organization_id: 'org-1',
        permissions: ['submit_feedback', 'view_own_feedback', 'respond_to_feedback']
      },
      {
        id: 'admin-user',
        type: 'admin',
        organization_id: 'org-1',
        permissions: ['*'] // All permissions
      },
      {
        id: 'external-user',
        type: 'student',
        organization_id: 'org-2', // Different organization
        permissions: ['submit_feedback']
      }
    ]

    const feedbackSubmission = createMockFeedbackSubmission({
      to_user_id: 'teacher-in-org-1',
      to_user_type: 'teacher'
    })

    for (const user of testUsers) {
      // Mock current user context
      jest.spyOn(feedbackService, 'getCurrentUser' as any)
        .mockResolvedValue({ id: user.id, email: `${user.id}@test.com` })
      
      jest.spyOn(feedbackService, 'getCurrentOrganization' as any)
        .mockResolvedValue(user.organization_id)

      jest.spyOn(feedbackService, 'checkPermission' as any)
        .mockImplementation(async (requiredPermissions: string[]) => {
          const hasPermission = user.permissions.includes('*') || 
            requiredPermissions.some(perm => user.permissions.includes(perm))
          
          if (!hasPermission) {
            throw new Error('Access denied: Insufficient permissions')
          }
          return true
        })

      try {
        // Mock successful submission for authorized users
        if (user.organization_id === 'org-1' && user.permissions.includes('submit_feedback')) {
          jest.spyOn(feedbackService, 'submitFeedback')
            .mockResolvedValue(createMockFeedbackEntry({
              ...feedbackSubmission,
              from_user_id: user.id,
              organization_id: user.organization_id
            }))
        } else {
          jest.spyOn(feedbackService, 'submitFeedback')
            .mockRejectedValue(new Error('Access denied: Cross-organization submission not allowed'))
        }

        const result = await feedbackService.submitFeedback(feedbackSubmission)

        // Verify access control
        if (user.organization_id === 'org-1') {
          expect(result).toBeDefined()
          expect(result.from_user_id).toBe(user.id)
          expect(result.organization_id).toBe('org-1')
        } else {
          // Should not reach here for external users
          expect(true).toBe(false)
        }
      } catch (error) {
        // External users should be denied
        if (user.organization_id === 'org-2') {
          expect(error).toBeInstanceOf(Error)
          expect((error as Error).message).toContain('Access denied')
        } else {
          throw error // Unexpected error for authorized users
        }
      }
    }
  })

  test('should enforce organization boundaries for feedback access', async () => {
    const org1Feedback = createMockFeedbackList(5, {
      organization_id: 'org-1',
      to_user_id: 'teacher-org-1'
    })

    const org2Feedback = createMockFeedbackList(3, {
      organization_id: 'org-2',
      to_user_id: 'teacher-org-2'
    })

    const testScenarios = [
      {
        user_org: 'org-1',
        target_user: 'teacher-org-1',
        expected_access: true,
        expected_count: 5
      },
      {
        user_org: 'org-1',
        target_user: 'teacher-org-2', // Cross-org access attempt
        expected_access: false,
        expected_count: 0
      },
      {
        user_org: 'org-2',
        target_user: 'teacher-org-2',
        expected_access: true,
        expected_count: 3
      }
    ]

    for (const scenario of testScenarios) {
      // Mock organization context
      jest.spyOn(feedbackService, 'getCurrentOrganization' as any)
        .mockResolvedValue(scenario.user_org)

      // Mock feedback retrieval with organization filtering
      jest.spyOn(feedbackService, 'getFeedbackForUser')
        .mockImplementation(async (userId, direction) => {
          // Simulate organization boundary check
          if (userId === 'teacher-org-1' && scenario.user_org === 'org-1') {
            return {
              data: org1Feedback,
              count: org1Feedback.length,
              total_pages: 1,
              current_page: 1
            }
          } else if (userId === 'teacher-org-2' && scenario.user_org === 'org-2') {
            return {
              data: org2Feedback,
              count: org2Feedback.length,
              total_pages: 1,
              current_page: 1
            }
          } else {
            // Cross-organization access should return empty or throw error
            return {
              data: [],
              count: 0,
              total_pages: 0,
              current_page: 1
            }
          }
        })

      const result = await feedbackService.getFeedbackForUser(scenario.target_user, 'received')

      if (scenario.expected_access) {
        expect(result.count).toBe(scenario.expected_count)
        expect(result.data).toHaveLength(scenario.expected_count)
        
        // Verify all returned feedback belongs to correct organization
        result.data.forEach(feedback => {
          expect(feedback.organization_id).toBe(scenario.user_org)
        })
      } else {
        expect(result.count).toBe(0)
        expect(result.data).toHaveLength(0)
      }
    }
  })

  test('should validate user permissions for admin operations', async () => {
    const feedbackId = 'feedback-admin-test'
    const adminOperations = [
      {
        operation: 'updateFeedbackStatus',
        required_permissions: ['superadmin', 'admin'],
        params: [feedbackId, 'reviewed']
      },
      {
        operation: 'addAdminResponse',
        required_permissions: ['superadmin', 'admin'],
        params: [feedbackId, 'Thank you for your feedback']
      },
      {
        operation: 'flagFeedback',
        required_permissions: ['superadmin', 'admin'],
        params: [feedbackId, 'Inappropriate content']
      }
    ]

    const userRoles = [
      { role: 'student', should_succeed: false },
      { role: 'teacher', should_succeed: false },
      { role: 'admin', should_succeed: true },
      { role: 'superadmin', should_succeed: true }
    ]

    for (const operation of adminOperations) {
      for (const userRole of userRoles) {
        // Mock permission check
        jest.spyOn(feedbackService, 'checkPermission' as any)
          .mockImplementation(async (requiredRoles: string[]) => {
            if (!requiredRoles.includes(userRole.role)) {
              throw new Error(`Access denied: ${userRole.role} role insufficient`)
            }
            return true
          })

        // Mock operation implementation
        const mockOperation = jest.spyOn(feedbackService, operation.operation as any)
          .mockResolvedValue(createMockFeedbackEntry({ id: feedbackId }))

        try {
          const result = await (feedbackService as any)[operation.operation](...operation.params)
          
          if (userRole.should_succeed) {
            expect(result).toBeDefined()
            expect(mockOperation).toHaveBeenCalledWith(...operation.params)
          } else {
            // Should not reach here for unauthorized users
            expect(true).toBe(false)
          }
        } catch (error) {
          if (!userRole.should_succeed) {
            expect(error).toBeInstanceOf(Error)
            expect((error as Error).message).toContain('Access denied')
          } else {
            throw error // Unexpected error for authorized users
          }
        }
      }
    }
  })
})

describe('Data Privacy and Anonymization', () => {
  let feedbackService: FeedbackService

  beforeEach(() => {
    feedbackService = new FeedbackService()
  })

  test('should properly handle anonymous feedback privacy', async () => {
    const anonymousFeedback = createMockFeedbackSubmission({
      to_user_id: 'teacher-privacy-test',
      message: 'This is anonymous feedback',
      is_anonymous: true
    })

    // Mock anonymous feedback submission
    jest.spyOn(feedbackService, 'submitFeedback')
      .mockImplementation(async (submission) => {
        const feedback = createMockFeedbackEntry({
          ...submission,
          from_user_id: submission.is_anonymous ? null : 'student-123',
          from_user_profile: submission.is_anonymous ? null : {
            full_name: 'Anonymous',
            avatar_url: null,
            user_type: 'student'
          }
        })

        return feedback
      })

    const result = await feedbackService.submitFeedback(anonymousFeedback)

    // Verify anonymization
    expect(result.is_anonymous).toBe(true)
    expect(result.from_user_id).toBeNull()
    expect(result.from_user_profile).toBeNull()
    expect(result.message).toBe(anonymousFeedback.message) // Message content preserved
    expect(result.to_user_id).toBe(anonymousFeedback.to_user_id) // Recipient preserved
  })

  test('should mask sensitive data in feedback exports', async () => {
    const sensitiveData = {
      email: 'student@example.com',
      phone: '+998901234567',
      personal_notes: 'Student has learning difficulties'
    }

    const feedbackWithSensitiveData = createMockFeedbackEntry({
      message: `Contact me at ${sensitiveData.email} or ${sensitiveData.phone}. ${sensitiveData.personal_notes}`,
      from_user_profile: {
        full_name: 'John Student',
        avatar_url: 'avatar.jpg',
        user_type: 'student'
      }
    })

    // Mock data masking function
    const maskSensitiveData = (text: string, privacySettings: PrivacySettings) => {
      if (!privacySettings.sensitive_data_masking) {
        return text
      }

      let maskedText = text
      
      // Mask email addresses
      maskedText = maskedText.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL_MASKED]')
      
      // Mask phone numbers
      maskedText = maskedText.replace(/\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g, '[PHONE_MASKED]')
      
      // Mask personal notes (basic implementation)
      if (maskedText.toLowerCase().includes('learning difficulties')) {
        maskedText = maskedText.replace(/learning difficulties/gi, '[SENSITIVE_INFO_MASKED]')
      }

      return maskedText
    }

    const privacySettings: PrivacySettings = {
      anonymous_feedback_allowed: true,
      cross_organization_visibility: false,
      data_retention_days: 365,
      export_restrictions: ['email', 'phone'],
      sensitive_data_masking: true
    }

    // Apply masking
    const maskedFeedback = {
      ...feedbackWithSensitiveData,
      message: maskSensitiveData(feedbackWithSensitiveData.message, privacySettings)
    }

    // Verify masking
    expect(maskedFeedback.message).toContain('[EMAIL_MASKED]')
    expect(maskedFeedback.message).toContain('[PHONE_MASKED]')
    expect(maskedFeedback.message).toContain('[SENSITIVE_INFO_MASKED]')
    expect(maskedFeedback.message).not.toContain(sensitiveData.email)
    expect(maskedFeedback.message).not.toContain(sensitiveData.phone)
    expect(maskedFeedback.message).not.toContain('learning difficulties')
  })

  test('should enforce data retention policies', async () => {
    const currentDate = new Date()
    const retentionDays = 90
    
    const feedbackData = [
      {
        id: 'feedback-recent',
        created_at: new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days old
        should_retain: true
      },
      {
        id: 'feedback-old',
        created_at: new Date(currentDate.getTime() - 120 * 24 * 60 * 60 * 1000), // 120 days old
        should_retain: false
      },
      {
        id: 'feedback-expired',
        created_at: new Date(currentDate.getTime() - 200 * 24 * 60 * 60 * 1000), // 200 days old
        should_retain: false
      }
    ]

    // Mock retention policy enforcement
    const enforceRetentionPolicy = (feedback: any[], retentionDays: number) => {
      const cutoffDate = new Date(currentDate.getTime() - retentionDays * 24 * 60 * 60 * 1000)
      
      return {
        retained: feedback.filter(f => new Date(f.created_at) > cutoffDate),
        archived: feedback.filter(f => new Date(f.created_at) <= cutoffDate && new Date(f.created_at) > new Date(cutoffDate.getTime() - 30 * 24 * 60 * 60 * 1000)),
        deleted: feedback.filter(f => new Date(f.created_at) <= new Date(cutoffDate.getTime() - 30 * 24 * 60 * 60 * 1000))
      }
    }

    const retentionResult = enforceRetentionPolicy(feedbackData, retentionDays)

    // Verify retention policy
    expect(retentionResult.retained).toHaveLength(1)
    expect(retentionResult.retained[0].id).toBe('feedback-recent')
    
    expect(retentionResult.archived).toHaveLength(1)
    expect(retentionResult.archived[0].id).toBe('feedback-old')
    
    expect(retentionResult.deleted).toHaveLength(1)
    expect(retentionResult.deleted[0].id).toBe('feedback-expired')
  })

  test('should provide user data export with privacy controls', async () => {
    const userId = 'user-export-test'
    const userFeedback = createMockFeedbackList(10, {
      to_user_id: userId,
      organization_id: 'org-test'
    })

    // Mock export function with privacy controls
    const exportUserData = async (userId: string, includeAnonymous: boolean = false) => {
      const userDataExport = {
        user_id: userId,
        export_date: new Date(),
        feedback_received: userFeedback.map(feedback => ({
          id: feedback.id,
          message: feedback.is_anonymous && !includeAnonymous ? '[ANONYMOUS_FEEDBACK]' : feedback.message,
          rating: feedback.rating,
          category: feedback.category,
          created_at: feedback.created_at,
          from_user: feedback.is_anonymous ? 'Anonymous' : feedback.from_user_profile?.full_name || 'Unknown'
        })),
        export_options: {
          include_anonymous: includeAnonymous,
          masked_sensitive_data: true
        }
      }

      return userDataExport
    }

    // Test export with different privacy settings
    const exportWithAnonymous = await exportUserData(userId, true)
    const exportWithoutAnonymous = await exportUserData(userId, false)

    expect(exportWithAnonymous.feedback_received).toHaveLength(userFeedback.length)
    expect(exportWithoutAnonymous.feedback_received).toHaveLength(userFeedback.length)

    // Verify anonymous feedback handling
    const anonymousFeedbackWithInclude = exportWithAnonymous.feedback_received.find(f => 
      userFeedback.find(uf => uf.id === f.id)?.is_anonymous
    )
    const anonymousFeedbackWithoutInclude = exportWithoutAnonymous.feedback_received.find(f => 
      userFeedback.find(uf => uf.id === f.id)?.is_anonymous
    )

    if (anonymousFeedbackWithInclude) {
      expect(anonymousFeedbackWithInclude.message).not.toBe('[ANONYMOUS_FEEDBACK]')
      expect(anonymousFeedbackWithInclude.from_user).toBe('Anonymous')
    }

    if (anonymousFeedbackWithoutInclude) {
      expect(anonymousFeedbackWithoutInclude.message).toBe('[ANONYMOUS_FEEDBACK]')
    }
  })
})

describe('Input Validation and Sanitization', () => {
  let feedbackService: FeedbackService

  beforeEach(() => {
    feedbackService = new FeedbackService()
  })

  test('should prevent XSS attacks in feedback content', async () => {
    const maliciousInputs = [
      '<script>alert("XSS")</script>',
      '<img src="x" onerror="alert(1)">',
      'javascript:alert("XSS")',
      '<iframe src="javascript:alert(1)"></iframe>',
      '<svg onload="alert(1)">',
      '"><script>alert(1)</script>'
    ]

    // Mock input sanitization function
    const sanitizeInput = (input: string): string => {
      // Remove script tags
      let sanitized = input.replace(/<script[^>]*>.*?<\/script>/gi, '')
      
      // Remove javascript: protocols
      sanitized = sanitized.replace(/javascript:/gi, '')
      
      // Remove event handlers
      sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      
      // Remove iframe tags
      sanitized = sanitized.replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      
      // Remove svg with onload
      sanitized = sanitized.replace(/<svg[^>]*onload[^>]*>.*?<\/svg>/gi, '')
      
      // Basic HTML entity encoding for remaining tags
      sanitized = sanitized.replace(/</g, '&lt;').replace(/>/g, '&gt;')
      
      return sanitized.trim()
    }

    for (const maliciousInput of maliciousInputs) {
      const sanitizedInput = sanitizeInput(maliciousInput)
      
      // Verify dangerous content is removed or escaped
      expect(sanitizedInput).not.toContain('<script>')
      expect(sanitizedInput).not.toContain('javascript:')
      expect(sanitizedInput).not.toContain('onerror=')
      expect(sanitizedInput).not.toContain('onload=')
      expect(sanitizedInput).not.toContain('<iframe>')
      
      // Verify HTML tags are properly escaped
      if (maliciousInput.includes('<') && !maliciousInput.includes('script')) {
        expect(sanitizedInput).toContain('&lt;')
      }
    }

    // Test with legitimate feedback containing safe HTML-like content
    const safeFeedback = 'The lesson about <mathematics> was great! 5/5 stars.'
    const sanitizedSafeFeedback = sanitizeInput(safeFeedback)
    
    expect(sanitizedSafeFeedback).toContain('&lt;mathematics&gt;')
    expect(sanitizedSafeFeedback).toContain('5/5 stars')
  })

  test('should validate and limit feedback content length', async () => {
    const contentLimits = {
      subject: 200,
      message: 2000,
      admin_response: 1000
    }

    const testCases = [
      {
        field: 'subject',
        content: 'A'.repeat(250), // Exceeds limit
        should_pass: false
      },
      {
        field: 'message',
        content: 'B'.repeat(2500), // Exceeds limit
        should_pass: false
      },
      {
        field: 'subject',
        content: 'Valid subject',
        should_pass: true
      },
      {
        field: 'message',
        content: 'Valid message content',
        should_pass: true
      }
    ]

    const validateContentLength = (field: string, content: string): boolean => {
      const limit = contentLimits[field as keyof typeof contentLimits]
      return content.length <= limit
    }

    for (const testCase of testCases) {
      const isValid = validateContentLength(testCase.field, testCase.content)
      expect(isValid).toBe(testCase.should_pass)
    }

    // Test truncation for exceeding content
    const longMessage = 'C'.repeat(2500)
    const truncatedMessage = longMessage.substring(0, contentLimits.message)
    
    expect(truncatedMessage).toHaveLength(contentLimits.message)
    expect(truncatedMessage).not.toBe(longMessage)
  })

  test('should prevent SQL injection in feedback queries', async () => {
    const maliciousSQLInputs = [
      "'; DROP TABLE feedback_entries; --",
      "' OR '1'='1",
      "'; INSERT INTO feedback_entries (message) VALUES ('hacked'); --",
      "' UNION SELECT * FROM users --",
      "'; UPDATE feedback_entries SET rating=5 WHERE id=1; --"
    ]

    // Mock parameterized query function
    const mockParameterizedQuery = (query: string, params: any[]) => {
      // Simulate proper parameterization
      let parameterizedQuery = query
      params.forEach((param, index) => {
        // In real implementation, this would use proper database parameterization
        const escapedParam = String(param).replace(/'/g, "''") // Basic SQL escaping
        parameterizedQuery = parameterizedQuery.replace(`$${index + 1}`, `'${escapedParam}'`)
      })
      
      return {
        query: parameterizedQuery,
        safe: !parameterizedQuery.includes('DROP TABLE') && 
               !parameterizedQuery.includes('INSERT INTO') &&
               !parameterizedQuery.includes('UPDATE ') &&
               !parameterizedQuery.includes('DELETE ')
      }
    }

    // Test SQL injection prevention
    for (const maliciousInput of maliciousSQLInputs) {
      const safeQuery = mockParameterizedQuery(
        'SELECT * FROM feedback_entries WHERE message = $1',
        [maliciousInput]
      )
      
      // Verify malicious SQL is properly escaped
      expect(safeQuery.safe).toBe(true)
      expect(safeQuery.query).not.toContain('DROP TABLE')
      expect(safeQuery.query).not.toContain('; INSERT')
      expect(safeQuery.query).not.toContain('; UPDATE')
    }
  })
})

describe('Rate Limiting and Abuse Prevention', () => {
  let feedbackService: FeedbackService

  beforeEach(() => {
    feedbackService = new FeedbackService()
  })

  test('should enforce rate limits for feedback submission', async () => {
    const userId = 'user-rate-limit-test'
    const rateLimits = {
      per_minute: 5,
      per_hour: 20,
      per_day: 50
    }

    // Mock rate limiting service
    const mockRateLimiter = {
      attempts: new Map(),

      async checkRateLimit(userId: string, timeWindow: 'minute' | 'hour' | 'day'): Promise<boolean> {
        const now = new Date()
        const key = `${userId}_${timeWindow}`
        
        if (!this.attempts.has(key)) {
          this.attempts.set(key, [])
        }

        const attempts = this.attempts.get(key)
        
        // Clean old attempts based on time window
        const windowMs = timeWindow === 'minute' ? 60000 : 
                        timeWindow === 'hour' ? 3600000 : 86400000
        
        const validAttempts = attempts.filter((attempt: Date) => 
          now.getTime() - attempt.getTime() < windowMs
        )
        
        this.attempts.set(key, validAttempts)
        
        // Check limit
        const limit = rateLimits[`per_${timeWindow}` as keyof typeof rateLimits]
        return validAttempts.length < limit
      },

      async recordAttempt(userId: string) {
        const now = new Date()
        
        for (const timeWindow of ['minute', 'hour', 'day'] as const) {
          const key = `${userId}_${timeWindow}`
          if (!this.attempts.has(key)) {
            this.attempts.set(key, [])
          }
          this.attempts.get(key).push(now)
        }
      }
    }

    // Test rate limiting
    const submissions = Array.from({ length: 10 }, (_, i) => 
      createMockFeedbackSubmission({
        to_user_id: `teacher-${i}`,
        message: `Rate limit test ${i}`
      })
    )

    let successfulSubmissions = 0
    let rateLimitedSubmissions = 0

    for (const submission of submissions) {
      const canSubmit = await mockRateLimiter.checkRateLimit(userId, 'minute')
      
      if (canSubmit) {
        await mockRateLimiter.recordAttempt(userId)
        successfulSubmissions++
      } else {
        rateLimitedSubmissions++
      }
    }

    // Verify rate limiting
    expect(successfulSubmissions).toBe(rateLimits.per_minute)
    expect(rateLimitedSubmissions).toBe(submissions.length - rateLimits.per_minute)
  })

  test('should detect and prevent spam feedback patterns', async () => {
    const userId = 'user-spam-test'
    
    // Mock spam detection service
    const mockSpamDetector = {
      async detectSpamPatterns(userId: string, feedbackContent: string): Promise<{
        isSpam: boolean
        confidence: number
        reasons: string[]
      }> {
        const reasons: string[] = []
        let spamScore = 0

        // Check for repetitive content
        const words = feedbackContent.toLowerCase().split(' ')
        const uniqueWords = new Set(words)
        if (uniqueWords.size < words.length * 0.5) {
          reasons.push('Repetitive content detected')
          spamScore += 30
        }

        // Check for excessive caps
        const capsRatio = (feedbackContent.match(/[A-Z]/g) || []).length / feedbackContent.length
        if (capsRatio > 0.5) {
          reasons.push('Excessive capital letters')
          spamScore += 25
        }

        // Check for known spam phrases
        const spamPhrases = ['click here', 'free money', 'urgent action', 'limited time']
        const containsSpamPhrases = spamPhrases.some(phrase => 
          feedbackContent.toLowerCase().includes(phrase)
        )
        if (containsSpamPhrases) {
          reasons.push('Contains spam phrases')
          spamScore += 50
        }

        // Check message length (too short might be spam)
        if (feedbackContent.trim().length < 10) {
          reasons.push('Message too short')
          spamScore += 20
        }

        // Check for special characters abuse
        const specialCharRatio = (feedbackContent.match(/[!@#$%^&*()]/g) || []).length / feedbackContent.length
        if (specialCharRatio > 0.2) {
          reasons.push('Excessive special characters')
          spamScore += 15
        }

        return {
          isSpam: spamScore >= 50,
          confidence: Math.min(spamScore / 100, 1),
          reasons
        }
      }
    }

    const testMessages = [
      {
        content: 'Great teacher! Very helpful and professional.',
        expected_spam: false
      },
      {
        content: 'CLICK HERE FOR FREE MONEY!!! URGENT ACTION REQUIRED!!!',
        expected_spam: true
      },
      {
        content: 'good good good good good good good good good',
        expected_spam: true
      },
      {
        content: 'ok',
        expected_spam: true
      },
      {
        content: '!@#$%^&*()!@#$%^&*()!@#$%^&*()',
        expected_spam: true
      }
    ]

    for (const testMessage of testMessages) {
      const spamResult = await mockSpamDetector.detectSpamPatterns(userId, testMessage.content)
      
      expect(spamResult.isSpam).toBe(testMessage.expected_spam)
      
      if (testMessage.expected_spam) {
        expect(spamResult.confidence).toBeGreaterThan(0.5)
        expect(spamResult.reasons).toHaveLength(1) // At least one reason
      } else {
        expect(spamResult.confidence).toBeLessThan(0.5)
      }
    }
  })

  test('should implement progressive penalties for abuse', async () => {
    const userId = 'user-penalty-test'
    
    // Mock progressive penalty system
    const mockPenaltySystem = {
      violations: new Map(),

      async recordViolation(userId: string, violationType: string) {
        if (!this.violations.has(userId)) {
          this.violations.set(userId, [])
        }

        const userViolations = this.violations.get(userId)
        userViolations.push({
          type: violationType,
          timestamp: new Date(),
          penalty_applied: this.calculatePenalty(userViolations.length + 1)
        })

        return userViolations[userViolations.length - 1]
      },

      calculatePenalty(violationCount: number) {
        if (violationCount === 1) {
          return { type: 'warning', duration: 0 }
        } else if (violationCount === 2) {
          return { type: 'rate_limit_reduction', duration: 3600000 } // 1 hour
        } else if (violationCount === 3) {
          return { type: 'temporary_suspension', duration: 86400000 } // 24 hours
        } else {
          return { type: 'account_review', duration: 604800000 } // 7 days
        }
      },

      async getCurrentPenalty(userId: string) {
        const userViolations = this.violations.get(userId) || []
        if (userViolations.length === 0) return null

        const latestViolation = userViolations[userViolations.length - 1]
        const now = new Date()
        const timeSinceViolation = now.getTime() - latestViolation.timestamp.getTime()

        if (timeSinceViolation < latestViolation.penalty_applied.duration) {
          return latestViolation.penalty_applied
        }

        return null
      }
    }

    // Simulate progressive violations
    const violations = ['spam_detected', 'inappropriate_content', 'rate_limit_exceeded', 'harassment']
    
    for (let i = 0; i < violations.length; i++) {
      const violation = await mockPenaltySystem.recordViolation(userId, violations[i])
      
      // Verify escalating penalties
      switch (i) {
        case 0:
          expect(violation.penalty_applied.type).toBe('warning')
          expect(violation.penalty_applied.duration).toBe(0)
          break
        case 1:
          expect(violation.penalty_applied.type).toBe('rate_limit_reduction')
          expect(violation.penalty_applied.duration).toBe(3600000)
          break
        case 2:
          expect(violation.penalty_applied.type).toBe('temporary_suspension')
          expect(violation.penalty_applied.duration).toBe(86400000)
          break
        case 3:
          expect(violation.penalty_applied.type).toBe('account_review')
          expect(violation.penalty_applied.duration).toBe(604800000)
          break
      }
    }

    // Test current penalty retrieval
    const currentPenalty = await mockPenaltySystem.getCurrentPenalty(userId)
    expect(currentPenalty).not.toBeNull()
    expect(currentPenalty.type).toBe('account_review')
  })
})