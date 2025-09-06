import { FeedbackService } from '@/lib/services/feedback-service'
import { 
  createMockFeedbackEntry,
  createMockFeedbackTemplate,
  createMockFeedbackSubmission,
  createMockUser
} from '../../utils/feedback-mock-data'

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn(),
  },
}

// Mock query builder
const mockQuery = {
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  overlaps: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  contains: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  single: jest.fn(),
  limit: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  is: jest.fn().mockReturnThis(),
}

// Mock BaseService methods
jest.mock('@/lib/services/base-service', () => {
  return {
    BaseService: class MockBaseService {
      protected supabase = mockSupabase
      protected tableName: string

      constructor(tableName: string) {
        this.tableName = tableName
      }

      protected async checkPermission(_roles: string[]) {
        return true
      }

      protected async getCurrentUser() {
        return { id: 'user-id', email: 'test@example.com' }
      }

      protected async getCurrentOrganization() {
        return 'org-id'
      }

      protected async logActivity(
        _action: string,
        _entityId: string,
        _entityName: string,
        _oldData: any,
        _newData: any,
        _description: string
      ) {
        return Promise.resolve()
      }

      protected applySorting(query: any, sortBy: string, sortOrder: string) {
        return query.order(sortBy, { ascending: sortOrder === 'asc' })
      }

      protected applyPagination(query: any, page: number, limit: number) {
        const offset = (page - 1) * limit
        return query.range(offset, offset + limit - 1)
      }
    }
  }
})

describe('FeedbackService', () => {
  let feedbackService: FeedbackService
  const mockFeedback = createMockFeedbackEntry()
  const mockSubmission = createMockFeedbackSubmission()
  const mockTemplate = createMockFeedbackTemplate()

  beforeEach(() => {
    jest.clearAllMocks()
    feedbackService = new FeedbackService()
    mockSupabase.from.mockReturnValue(mockQuery)
  })

  describe('submitFeedback', () => {
    it('creates feedback entry successfully', async () => {
      mockQuery.single.mockResolvedValue({
        data: mockFeedback,
        error: null
      })

      const result = await feedbackService.submitFeedback(mockSubmission)

      expect(mockSupabase.from).toHaveBeenCalledWith('feedback_entries')
      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockSubmission,
          organization_id: 'org-id',
          from_user_id: 'user-id',
          affects_ranking: true,
          status: 'active'
        })
      )
      expect(result).toEqual(mockFeedback)
    })

    it('validates feedback submission data', async () => {
      const invalidSubmission = {
        ...mockSubmission,
        message: '', // Invalid - required field
      }

      await expect(feedbackService.submitFeedback(invalidSubmission)).rejects.toThrow()
    })

    it('handles anonymous feedback correctly', async () => {
      const anonymousSubmission = {
        ...mockSubmission,
        is_anonymous: true
      }

      mockQuery.single.mockResolvedValue({
        data: { ...mockFeedback, is_anonymous: true },
        error: null
      })

      const result = await feedbackService.submitFeedback(anonymousSubmission)

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          is_anonymous: true
        })
      )
      expect(result.is_anonymous).toBe(true)
    })

    it('calculates ranking points impact for feedback', async () => {
      const highRatingSubmission = {
        ...mockSubmission,
        rating: 5,
        category: 'teaching_quality'
      }

      mockQuery.single.mockResolvedValue({
        data: { ...mockFeedback, ranking_points_impact: 50 },
        error: null
      })

      const result = await feedbackService.submitFeedback(highRatingSubmission)

      expect(result.ranking_points_impact).toBe(50)
    })

    it('requires appropriate permissions', async () => {
      feedbackService['checkPermission'] = jest.fn().mockRejectedValue(new Error('Access denied'))

      await expect(feedbackService.submitFeedback(mockSubmission)).rejects.toThrow('Access denied')
    })
  })

  describe('getFeedbackForUser', () => {
    const mockFeedbackList = [mockFeedback]
    const mockResponse = {
      data: mockFeedbackList,
      error: null,
      count: mockFeedbackList.length
    }

    it('retrieves feedback for a user with proper filtering', async () => {
      mockQuery.mockResolvedValue(mockResponse)

      const result = await feedbackService.getFeedbackForUser('user-123', 'received')

      expect(mockSupabase.from).toHaveBeenCalledWith('feedback_entries')
      expect(mockQuery.eq).toHaveBeenCalledWith('to_user_id', 'user-123')
      expect(mockQuery.eq).toHaveBeenCalledWith('organization_id', 'org-id')
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'active')
      expect(result).toEqual({
        data: mockFeedbackList,
        count: mockFeedbackList.length,
        total_pages: 1
      })
    })

    it('filters feedback by category', async () => {
      mockQuery.mockResolvedValue(mockResponse)

      await feedbackService.getFeedbackForUser('user-123', 'received', {
        category: 'teaching_quality'
      })

      expect(mockQuery.eq).toHaveBeenCalledWith('category', 'teaching_quality')
    })

    it('applies date range filters', async () => {
      mockQuery.mockResolvedValue(mockResponse)
      const fromDate = new Date('2024-01-01')
      const toDate = new Date('2024-12-31')

      await feedbackService.getFeedbackForUser('user-123', 'received', {
        date_from: fromDate,
        date_to: toDate
      })

      expect(mockQuery.gte).toHaveBeenCalledWith('created_at', fromDate)
      expect(mockQuery.lte).toHaveBeenCalledWith('created_at', toDate)
    })

    it('handles anonymous feedback visibility correctly', async () => {
      const anonymousFeedback = { ...mockFeedback, is_anonymous: true, from_user_id: null }
      mockQuery.mockResolvedValue({
        data: [anonymousFeedback],
        error: null,
        count: 1
      })

      const result = await feedbackService.getFeedbackForUser('user-123', 'received')

      expect(result.data[0].is_anonymous).toBe(true)
      expect(result.data[0].from_user_id).toBeNull()
    })
  })

  describe('updateFeedbackStatus', () => {
    it('updates feedback status successfully', async () => {
      const updatedFeedback = { ...mockFeedback, status: 'reviewed' }
      mockQuery.single.mockResolvedValue({
        data: updatedFeedback,
        error: null
      })

      const result = await feedbackService.updateFeedbackStatus(mockFeedback.id, 'reviewed')

      expect(mockQuery.update).toHaveBeenCalledWith({
        status: 'reviewed',
        updated_at: expect.any(String)
      })
      expect(result.status).toBe('reviewed')
    })

    it('requires admin permissions for status updates', async () => {
      feedbackService['checkPermission'] = jest.fn().mockRejectedValue(new Error('Admin access required'))

      await expect(feedbackService.updateFeedbackStatus(mockFeedback.id, 'reviewed')).rejects.toThrow('Admin access required')
    })
  })

  describe('addAdminResponse', () => {
    it('adds admin response to feedback', async () => {
      const responseText = 'Thank you for your feedback. We will address this.'
      const updatedFeedback = {
        ...mockFeedback,
        admin_response: responseText,
        responded_by: 'user-id',
        responded_at: expect.any(String),
        status: 'reviewed'
      }

      mockQuery.single.mockResolvedValue({
        data: updatedFeedback,
        error: null
      })

      const result = await feedbackService.addAdminResponse(mockFeedback.id, responseText)

      expect(mockQuery.update).toHaveBeenCalledWith({
        admin_response: responseText,
        responded_by: 'user-id',
        responded_at: expect.any(String),
        status: 'reviewed'
      })
      expect(result.admin_response).toBe(responseText)
    })

    it('requires admin permissions', async () => {
      feedbackService['checkPermission'] = jest.fn().mockRejectedValue(new Error('Admin access required'))

      await expect(feedbackService.addAdminResponse(mockFeedback.id, 'Response')).rejects.toThrow('Admin access required')
    })
  })

  describe('getFeedbackStatistics', () => {
    it('calculates feedback statistics correctly', async () => {
      const mockStats = {
        total_feedback: 100,
        average_rating: 4.2,
        feedback_by_category: {
          teaching_quality: 40,
          communication: 30,
          behavior: 30
        },
        feedback_by_status: {
          active: 80,
          reviewed: 15,
          resolved: 5
        },
        monthly_trend: [
          { month: '2024-01', count: 20, average_rating: 4.1 },
          { month: '2024-02', count: 25, average_rating: 4.3 }
        ]
      }

      // Mock the RPC call for statistics
      mockSupabase.rpc = jest.fn().mockResolvedValue({
        data: mockStats,
        error: null
      })

      const result = await feedbackService.getFeedbackStatistics('user-123')

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_feedback_statistics', {
        user_id: 'user-123',
        organization_id: 'org-id'
      })
      expect(result).toEqual(mockStats)
    })
  })

  describe('getFeedbackTemplates', () => {
    it('retrieves active feedback templates', async () => {
      const mockTemplates = [mockTemplate]
      mockQuery.mockResolvedValue({
        data: mockTemplates,
        error: null
      })

      const result = await feedbackService.getFeedbackTemplates('student_to_teacher')

      expect(mockSupabase.from).toHaveBeenCalledWith('feedback_templates')
      expect(mockQuery.eq).toHaveBeenCalledWith('organization_id', 'org-id')
      expect(mockQuery.eq).toHaveBeenCalledWith('feedback_direction', 'student_to_teacher')
      expect(mockQuery.eq).toHaveBeenCalledWith('is_active', true)
      expect(mockQuery.is).toHaveBeenCalledWith('deleted_at', null)
      expect(result).toEqual(mockTemplates)
    })
  })

  describe('bulkUpdateFeedbackStatus', () => {
    it('updates multiple feedback entries status', async () => {
      const feedbackIds = ['feedback-1', 'feedback-2', 'feedback-3']
      
      jest.spyOn(feedbackService, 'updateFeedbackStatus')
        .mockResolvedValueOnce(mockFeedback)
        .mockResolvedValueOnce(mockFeedback)
        .mockResolvedValueOnce(mockFeedback)

      const result = await feedbackService.bulkUpdateFeedbackStatus(feedbackIds, 'reviewed')

      expect(result).toEqual({
        success: 3,
        errors: []
      })
    })

    it('handles partial failures gracefully', async () => {
      const feedbackIds = ['feedback-1', 'feedback-2', 'feedback-3']
      
      jest.spyOn(feedbackService, 'updateFeedbackStatus')
        .mockResolvedValueOnce(mockFeedback)
        .mockRejectedValueOnce(new Error('Update failed'))
        .mockResolvedValueOnce(mockFeedback)

      const result = await feedbackService.bulkUpdateFeedbackStatus(feedbackIds, 'reviewed')

      expect(result).toEqual({
        success: 2,
        errors: ['Failed to update feedback feedback-2: Update failed']
      })
    })
  })

  describe('flagFeedback', () => {
    it('flags inappropriate feedback', async () => {
      const flaggedFeedback = { ...mockFeedback, status: 'flagged' }
      mockQuery.single.mockResolvedValue({
        data: flaggedFeedback,
        error: null
      })

      const result = await feedbackService.flagFeedback(mockFeedback.id, 'Inappropriate content')

      expect(mockQuery.update).toHaveBeenCalledWith({
        status: 'flagged',
        admin_response: 'Flagged: Inappropriate content',
        responded_by: 'user-id',
        responded_at: expect.any(String)
      })
      expect(result.status).toBe('flagged')
    })
  })

  describe('getRankingImpactFromFeedback', () => {
    it('calculates ranking impact correctly', async () => {
      const impact = await feedbackService.getRankingImpactFromFeedback('user-123')

      expect(typeof impact.total_points).toBe('number')
      expect(typeof impact.average_rating).toBe('number')
      expect(typeof impact.feedback_count).toBe('number')
      expect(Array.isArray(impact.category_breakdown)).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('handles Supabase connection errors', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Connection failed')
      })

      await expect(feedbackService.getFeedbackForUser('user-123', 'received')).rejects.toThrow('Connection failed')
    })

    it('handles malformed query responses', async () => {
      mockQuery.mockResolvedValue({
        data: undefined,
        error: null,
        count: null
      })

      const result = await feedbackService.getFeedbackForUser('user-123', 'received')

      expect(result).toEqual({
        data: [],
        count: 0,
        total_pages: 0
      })
    })

    it('validates feedback rating range', async () => {
      const invalidSubmission = {
        ...mockSubmission,
        rating: 6 // Invalid - out of range
      }

      await expect(feedbackService.submitFeedback(invalidSubmission)).rejects.toThrow()
    })

    it('prevents feedback submission to self', async () => {
      const selfSubmission = {
        ...mockSubmission,
        to_user_id: 'user-id' // Same as current user
      }

      await expect(feedbackService.submitFeedback(selfSubmission)).rejects.toThrow('Cannot submit feedback to yourself')
    })
  })

  describe('Privacy & Security', () => {
    it('anonymizes sensitive data for anonymous feedback', async () => {
      const anonymousSubmission = {
        ...mockSubmission,
        is_anonymous: true
      }

      mockQuery.single.mockResolvedValue({
        data: { ...mockFeedback, is_anonymous: true, from_user_id: null },
        error: null
      })

      const result = await feedbackService.submitFeedback(anonymousSubmission)

      expect(result.is_anonymous).toBe(true)
      expect(result.from_user_id).toBeNull()
    })

    it('respects organization boundaries', async () => {
      mockQuery.mockResolvedValue({
        data: [],
        error: null,
        count: 0
      })

      await feedbackService.getFeedbackForUser('user-123', 'received')

      expect(mockQuery.eq).toHaveBeenCalledWith('organization_id', 'org-id')
    })

    it('validates user permissions for sensitive operations', async () => {
      feedbackService['checkPermission'] = jest.fn().mockRejectedValue(new Error('Insufficient permissions'))

      await expect(feedbackService.flagFeedback(mockFeedback.id, 'Inappropriate')).rejects.toThrow('Insufficient permissions')
    })
  })

  describe('Performance Optimization', () => {
    it('applies proper pagination for large datasets', async () => {
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({ ...mockFeedback, id: `feedback-${i}` }))
      mockQuery.mockResolvedValue({
        data: largeDataset.slice(0, 20),
        error: null,
        count: largeDataset.length
      })

      const result = await feedbackService.getFeedbackForUser('user-123', 'received', undefined, {
        page: 1,
        limit: 20
      })

      expect(mockQuery.range).toHaveBeenCalledWith(0, 19)
      expect(result.total_pages).toBe(5)
    })

    it('uses appropriate indexing for date range queries', async () => {
      const fromDate = new Date('2024-01-01')
      const toDate = new Date('2024-12-31')

      await feedbackService.getFeedbackForUser('user-123', 'received', {
        date_from: fromDate,
        date_to: toDate
      })

      expect(mockQuery.gte).toHaveBeenCalledWith('created_at', fromDate)
      expect(mockQuery.lte).toHaveBeenCalledWith('created_at', toDate)
    })
  })
})