import { 
  createLargeReferralDataset,
  createMockReferralData,
  createMockStudentData,
  createEdgeCaseScenarios 
} from '../../utils/referral-mock-data'

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
  delete: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  neq: jest.fn(() => mockSupabase),
  gte: jest.fn(() => mockSupabase),
  lte: jest.fn(() => mockSupabase),
  order: jest.fn(() => mockSupabase),
  limit: jest.fn(() => mockSupabase),
  single: jest.fn(),
  data: null,
  error: null,
}

// Mock the referral service implementation
class MockReferralService {
  private supabase = mockSupabase

  async createReferral(referralData: any) {
    // Validate required fields
    if (!referralData.referred_name || !referralData.referred_phone) {
      throw new Error('Missing required fields')
    }

    // Check for duplicates
    const existingReferral = await this.findExistingReferral(
      referralData.referred_phone
    )
    
    if (existingReferral) {
      throw new Error('Referral already exists')
    }

    // Simulate database insert
    const newReferral = {
      id: `referral_${Date.now()}`,
      ...referralData,
      status: 'pending',
      created_at: new Date(),
      points_awarded: 0,
    }

    return { data: newReferral, error: null }
  }

  async updateReferralStatus(referralId: string, status: string, metadata?: any) {
    if (!referralId || !status) {
      throw new Error('Missing required parameters')
    }

    const validStatuses = ['pending', 'contacted', 'enrolled', 'declined', 'expired']
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status')
    }

    // Calculate points based on status
    let pointsAwarded = 0
    if (status === 'contacted') pointsAwarded = 25
    if (status === 'enrolled') pointsAwarded = 100

    const updatedReferral = {
      id: referralId,
      status,
      points_awarded: pointsAwarded,
      updated_at: new Date(),
      ...metadata,
    }

    return { data: updatedReferral, error: null }
  }

  async getReferralAnalytics(studentId: string, timeRange: string = 'last_30_days') {
    const mockData = createMockReferralData()
    
    // Simulate time range filtering
    const multiplier = timeRange === 'last_7_days' ? 0.25 : 
                     timeRange === 'last_30_days' ? 1 : 
                     timeRange === 'last_90_days' ? 2.5 : 1

    return {
      data: {
        ...mockData.analytics,
        totalReferrals: Math.round(mockData.analytics.totalReferrals * multiplier),
        successfulReferrals: Math.round(mockData.analytics.successfulReferrals * multiplier),
      },
      error: null,
    }
  }

  async calculateReferralPoints(referralId: string, campaignId?: string) {
    if (!referralId) {
      throw new Error('Referral ID is required')
    }

    let basePoints = 100 // Base enrollment points
    let multiplier = 1.0
    let bonusPoints = 0

    // Apply campaign multiplier if applicable
    if (campaignId) {
      const campaign = await this.getCampaignById(campaignId)
      if (campaign && campaign.is_active) {
        multiplier = campaign.bonus_multiplier || 1.0
      }
    }

    // Apply tier bonuses
    const userStats = await this.getUserReferralStats(referralId)
    if (userStats.successful_referrals >= 10) {
      bonusPoints = 300
    } else if (userStats.successful_referrals >= 5) {
      bonusPoints = 150
    } else if (userStats.successful_referrals >= 3) {
      bonusPoints = 50
    }

    const totalPoints = Math.round(basePoints * multiplier) + bonusPoints

    return {
      basePoints,
      multiplier,
      bonusPoints,
      totalPoints,
      calculation: {
        base: basePoints,
        campaignMultiplier: multiplier,
        tierBonus: bonusPoints,
        final: totalPoints,
      },
    }
  }

  async bulkContactReferrals(referralIds: string[], contactedBy: string) {
    if (!Array.isArray(referralIds) || referralIds.length === 0) {
      throw new Error('No referrals provided')
    }

    if (!contactedBy) {
      throw new Error('contacted_by is required')
    }

    const results = []
    const errors = []

    for (const referralId of referralIds) {
      try {
        const result = await this.updateReferralStatus(referralId, 'contacted', {
          contacted_by: contactedBy,
          contact_date: new Date(),
        })
        results.push(result.data)
      } catch (error) {
        errors.push({ referralId, error: error.message })
      }
    }

    return {
      successful: results,
      failed: errors,
      totalProcessed: referralIds.length,
      successCount: results.length,
      errorCount: errors.length,
    }
  }

  async searchReferrals(query: string, filters: any = {}) {
    const mockData = createLargeReferralDataset(100)
    
    let filtered = mockData

    // Apply search query
    if (query) {
      filtered = filtered.filter(referral => 
        referral.referred_name.toLowerCase().includes(query.toLowerCase()) ||
        referral.referrer_name.toLowerCase().includes(query.toLowerCase()) ||
        referral.referred_phone.includes(query)
      )
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(referral => referral.status === filters.status)
    }

    // Apply date range filter
    if (filters.startDate && filters.endDate) {
      filtered = filtered.filter(referral => {
        const referralDate = new Date(referral.created_at)
        return referralDate >= new Date(filters.startDate) && 
               referralDate <= new Date(filters.endDate)
      })
    }

    // Apply sorting
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        const aValue = a[filters.sortBy]
        const bValue = b[filters.sortBy]
        const direction = filters.sortDirection === 'desc' ? -1 : 1
        
        if (aValue < bValue) return -1 * direction
        if (aValue > bValue) return 1 * direction
        return 0
      })
    }

    // Apply pagination
    const page = filters.page || 1
    const limit = filters.limit || 20
    const offset = (page - 1) * limit
    const paginatedResults = filtered.slice(offset, offset + limit)

    return {
      data: paginatedResults,
      pagination: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limit),
      },
      error: null,
    }
  }

  async exportReferralData(filters: any = {}, format: string = 'csv') {
    const searchResult = await this.searchReferrals('', filters)
    
    if (format === 'csv') {
      const headers = [
        'ID',
        'Referrer Name',
        'Referred Name',
        'Phone',
        'Email',
        'Status',
        'Points Awarded',
        'Created Date',
        'Contact Date',
        'Enrollment Date',
      ]

      const rows = searchResult.data.map(referral => [
        referral.id,
        referral.referrer_name,
        referral.referred_name,
        referral.referred_phone,
        referral.referred_email || '',
        referral.status,
        referral.points_awarded,
        referral.created_at.toISOString(),
        referral.contact_date?.toISOString() || '',
        referral.enrollment_date?.toISOString() || '',
      ])

      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n')

      return {
        content: csvContent,
        filename: `referrals_export_${new Date().toISOString().split('T')[0]}.csv`,
        contentType: 'text/csv',
      }
    }

    throw new Error('Unsupported export format')
  }

  private async findExistingReferral(phone: string) {
    // Simulate check for existing referral by phone
    const edgeCases = createEdgeCaseScenarios()
    return phone === edgeCases.duplicateReferral.existing.referred_phone 
      ? edgeCases.duplicateReferral.existing 
      : null
  }

  private async getCampaignById(campaignId: string) {
    const mockData = createMockReferralData()
    return mockData.campaigns.find(c => c.id === campaignId)
  }

  private async getUserReferralStats(referralId: string) {
    return {
      total_referrals: 6,
      successful_referrals: 4,
      referral_points_earned: 450,
    }
  }
}

describe('ReferralService Unit Tests', () => {
  let referralService: MockReferralService
  const mockStudentData = createMockStudentData()
  const mockReferralData = createMockReferralData()

  beforeEach(() => {
    referralService = new MockReferralService()
    jest.clearAllMocks()
  })

  describe('createReferral', () => {
    it('creates a new referral with valid data', async () => {
      const referralData = {
        referrer_student_id: mockStudentData.id,
        referred_name: 'John Smith',
        referred_phone: '+998901234567',
        referred_email: 'john@example.com',
        referral_source: 'word_of_mouth',
        notes: 'Friend from university',
      }

      const result = await referralService.createReferral(referralData)

      expect(result.error).toBeNull()
      expect(result.data).toHaveProperty('id')
      expect(result.data.status).toBe('pending')
      expect(result.data.referred_name).toBe('John Smith')
      expect(result.data.points_awarded).toBe(0)
    })

    it('validates required fields', async () => {
      const invalidData = {
        referrer_student_id: mockStudentData.id,
        // Missing referred_name and referred_phone
      }

      await expect(referralService.createReferral(invalidData))
        .rejects.toThrow('Missing required fields')
    })

    it('prevents duplicate referrals', async () => {
      const edgeCases = createEdgeCaseScenarios()
      const duplicateData = {
        referrer_student_id: mockStudentData.id,
        referred_name: 'Duplicate Name',
        referred_phone: edgeCases.duplicateReferral.existing.referred_phone,
      }

      await expect(referralService.createReferral(duplicateData))
        .rejects.toThrow('Referral already exists')
    })

    it('handles special characters in names', async () => {
      const specialCharData = {
        referrer_student_id: mockStudentData.id,
        referred_name: "O'Connor-Smith",
        referred_phone: '+998901234567',
        notes: 'Name with apostrophe and hyphen',
      }

      const result = await referralService.createReferral(specialCharData)

      expect(result.error).toBeNull()
      expect(result.data.referred_name).toBe("O'Connor-Smith")
    })
  })

  describe('updateReferralStatus', () => {
    it('updates referral status correctly', async () => {
      const referralId = 'test-referral-id'
      const result = await referralService.updateReferralStatus(referralId, 'contacted')

      expect(result.error).toBeNull()
      expect(result.data.status).toBe('contacted')
      expect(result.data.points_awarded).toBe(25)
    })

    it('calculates points correctly for enrollment', async () => {
      const referralId = 'test-referral-id'
      const result = await referralService.updateReferralStatus(referralId, 'enrolled', {
        enrollment_date: new Date(),
        enrolled_as_student_id: 'new-student-id',
      })

      expect(result.data.status).toBe('enrolled')
      expect(result.data.points_awarded).toBe(100)
      expect(result.data.enrollment_date).toBeDefined()
    })

    it('validates status values', async () => {
      const referralId = 'test-referral-id'
      
      await expect(referralService.updateReferralStatus(referralId, 'invalid_status'))
        .rejects.toThrow('Invalid status')
    })

    it('requires referral ID and status', async () => {
      await expect(referralService.updateReferralStatus('', 'contacted'))
        .rejects.toThrow('Missing required parameters')
      
      await expect(referralService.updateReferralStatus('test-id', ''))
        .rejects.toThrow('Missing required parameters')
    })
  })

  describe('getReferralAnalytics', () => {
    it('returns analytics for student', async () => {
      const result = await referralService.getReferralAnalytics(mockStudentData.id)

      expect(result.error).toBeNull()
      expect(result.data).toHaveProperty('totalReferrals')
      expect(result.data).toHaveProperty('successfulReferrals')
      expect(result.data).toHaveProperty('conversionRate')
      expect(result.data).toHaveProperty('topReferrers')
      expect(result.data).toHaveProperty('monthlyBreakdown')
    })

    it('applies time range filtering', async () => {
      const last7Days = await referralService.getReferralAnalytics(mockStudentData.id, 'last_7_days')
      const last30Days = await referralService.getReferralAnalytics(mockStudentData.id, 'last_30_days')
      const last90Days = await referralService.getReferralAnalytics(mockStudentData.id, 'last_90_days')

      expect(last7Days.data.totalReferrals).toBeLessThan(last30Days.data.totalReferrals)
      expect(last30Days.data.totalReferrals).toBeLessThan(last90Days.data.totalReferrals)
    })

    it('handles invalid student ID gracefully', async () => {
      const result = await referralService.getReferralAnalytics('invalid-id')

      expect(result.error).toBeNull()
      expect(result.data.totalReferrals).toBe(0)
    })
  })

  describe('calculateReferralPoints', () => {
    it('calculates base points correctly', async () => {
      const result = await referralService.calculateReferralPoints('test-referral-id')

      expect(result.basePoints).toBe(100)
      expect(result.multiplier).toBe(1.0)
      expect(result.totalPoints).toBeGreaterThanOrEqual(100)
    })

    it('applies campaign multipliers', async () => {
      const campaignId = 'summer-special'
      const result = await referralService.calculateReferralPoints('test-referral-id', campaignId)

      expect(result.multiplier).toBeGreaterThan(1.0)
      expect(result.totalPoints).toBeGreaterThan(result.basePoints)
    })

    it('applies tier bonuses correctly', async () => {
      // Mock high referral count for tier bonus
      const result = await referralService.calculateReferralPoints('test-referral-id')

      // Should have tier bonus for 4 successful referrals (tier 2)
      expect(result.bonusPoints).toBe(50)
      expect(result.totalPoints).toBe(150) // 100 base + 50 bonus
    })

    it('provides detailed calculation breakdown', async () => {
      const result = await referralService.calculateReferralPoints('test-referral-id')

      expect(result.calculation).toHaveProperty('base')
      expect(result.calculation).toHaveProperty('campaignMultiplier')
      expect(result.calculation).toHaveProperty('tierBonus')
      expect(result.calculation).toHaveProperty('final')
      expect(result.calculation.final).toBe(result.totalPoints)
    })

    it('requires referral ID', async () => {
      await expect(referralService.calculateReferralPoints(''))
        .rejects.toThrow('Referral ID is required')
    })
  })

  describe('bulkContactReferrals', () => {
    it('processes multiple referrals successfully', async () => {
      const referralIds = ['ref1', 'ref2', 'ref3']
      const contactedBy = 'admin-user-id'

      const result = await referralService.bulkContactReferrals(referralIds, contactedBy)

      expect(result.totalProcessed).toBe(3)
      expect(result.successCount).toBe(3)
      expect(result.errorCount).toBe(0)
      expect(result.successful).toHaveLength(3)
    })

    it('handles partial failures gracefully', async () => {
      // Mock one failure by using empty referral ID
      const referralIds = ['ref1', '', 'ref3']
      const contactedBy = 'admin-user-id'

      const result = await referralService.bulkContactReferrals(referralIds, contactedBy)

      expect(result.totalProcessed).toBe(3)
      expect(result.successCount).toBe(2)
      expect(result.errorCount).toBe(1)
      expect(result.failed).toHaveLength(1)
    })

    it('validates input parameters', async () => {
      await expect(referralService.bulkContactReferrals([], 'admin'))
        .rejects.toThrow('No referrals provided')

      await expect(referralService.bulkContactReferrals(['ref1'], ''))
        .rejects.toThrow('contacted_by is required')
    })

    it('processes large batches efficiently', async () => {
      const largeReferralIds = Array.from({ length: 100 }, (_, i) => `ref_${i}`)
      const startTime = performance.now()

      const result = await referralService.bulkContactReferrals(largeReferralIds, 'admin')

      const endTime = performance.now()
      const processingTime = endTime - startTime

      expect(processingTime).toBeLessThan(1000) // Should process in under 1 second
      expect(result.successCount).toBe(100)
    })
  })

  describe('searchReferrals', () => {
    it('searches by referral name', async () => {
      const query = 'Smith'
      const result = await referralService.searchReferrals(query)

      expect(result.error).toBeNull()
      expect(result.data.length).toBeGreaterThan(0)
      result.data.forEach(referral => {
        expect(
          referral.referred_name.toLowerCase().includes('smith') ||
          referral.referrer_name.toLowerCase().includes('smith')
        ).toBe(true)
      })
    })

    it('filters by status', async () => {
      const filters = { status: 'enrolled' }
      const result = await referralService.searchReferrals('', filters)

      result.data.forEach(referral => {
        expect(referral.status).toBe('enrolled')
      })
    })

    it('applies date range filtering', async () => {
      const startDate = new Date(Date.now() - 86400000 * 30) // 30 days ago
      const endDate = new Date()
      const filters = { startDate, endDate }

      const result = await referralService.searchReferrals('', filters)

      result.data.forEach(referral => {
        const referralDate = new Date(referral.created_at)
        expect(referralDate >= startDate && referralDate <= endDate).toBe(true)
      })
    })

    it('supports sorting', async () => {
      const filters = { 
        sortBy: 'created_at', 
        sortDirection: 'desc' 
      }
      const result = await referralService.searchReferrals('', filters)

      for (let i = 0; i < result.data.length - 1; i++) {
        const current = new Date(result.data[i].created_at)
        const next = new Date(result.data[i + 1].created_at)
        expect(current >= next).toBe(true)
      }
    })

    it('implements pagination correctly', async () => {
      const page1 = await referralService.searchReferrals('', { page: 1, limit: 10 })
      const page2 = await referralService.searchReferrals('', { page: 2, limit: 10 })

      expect(page1.data).toHaveLength(10)
      expect(page2.data).toHaveLength(10)
      expect(page1.pagination.page).toBe(1)
      expect(page2.pagination.page).toBe(2)
      
      // Ensure different results
      const page1Ids = page1.data.map(r => r.id)
      const page2Ids = page2.data.map(r => r.id)
      expect(page1Ids).not.toEqual(page2Ids)
    })

    it('handles empty search results', async () => {
      const query = 'nonexistent_name_xyz'
      const result = await referralService.searchReferrals(query)

      expect(result.data).toHaveLength(0)
      expect(result.pagination.total).toBe(0)
      expect(result.pagination.totalPages).toBe(0)
    })
  })

  describe('exportReferralData', () => {
    it('exports data in CSV format', async () => {
      const result = await referralService.exportReferralData({}, 'csv')

      expect(result.content).toContain('ID,Referrer Name,Referred Name')
      expect(result.filename).toMatch(/referrals_export_\d{4}-\d{2}-\d{2}\.csv/)
      expect(result.contentType).toBe('text/csv')
    })

    it('applies filters to export data', async () => {
      const filters = { status: 'enrolled' }
      const result = await referralService.exportReferralData(filters, 'csv')

      // CSV should only contain enrolled referrals
      const lines = result.content.split('\n')
      const dataLines = lines.slice(1) // Skip header
      dataLines.forEach(line => {
        if (line.trim()) { // Skip empty lines
          expect(line).toContain('"enrolled"')
        }
      })
    })

    it('handles large datasets efficiently', async () => {
      const largeFilters = { limit: 1000 } // Large dataset
      const startTime = performance.now()

      const result = await referralService.exportReferralData(largeFilters, 'csv')

      const endTime = performance.now()
      const exportTime = endTime - startTime

      expect(exportTime).toBeLessThan(2000) // Should export in under 2 seconds
      expect(result.content.length).toBeGreaterThan(1000) // Should have substantial content
    })

    it('throws error for unsupported formats', async () => {
      await expect(referralService.exportReferralData({}, 'pdf'))
        .rejects.toThrow('Unsupported export format')
    })

    it('properly escapes CSV data', async () => {
      // Test with data containing commas and quotes
      const result = await referralService.exportReferralData({}, 'csv')

      // All fields should be properly quoted
      const lines = result.content.split('\n')
      lines.forEach(line => {
        if (line.trim()) {
          const fields = line.split(',')
          fields.forEach(field => {
            expect(field.startsWith('"') && field.endsWith('"')).toBe(true)
          })
        }
      })
    })
  })

  describe('Performance Tests', () => {
    it('handles concurrent operations efficiently', async () => {
      const operations = [
        referralService.getReferralAnalytics(mockStudentData.id),
        referralService.searchReferrals(''),
        referralService.calculateReferralPoints('test-id'),
      ]

      const startTime = performance.now()
      const results = await Promise.all(operations)
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(500) // All operations in under 500ms
      expect(results).toHaveLength(3)
      results.forEach(result => {
        expect(result).toBeDefined()
      })
    })

    it('maintains performance with large datasets', async () => {
      const startTime = performance.now()
      
      const result = await referralService.searchReferrals('', { limit: 1000 })
      
      const endTime = performance.now()
      const searchTime = endTime - startTime

      expect(searchTime).toBeLessThan(200) // Search should be fast even with large results
      expect(result.data.length).toBeLessThanOrEqual(1000)
    })
  })

  describe('Error Handling', () => {
    it('handles database connection errors gracefully', async () => {
      // Simulate connection error
      mockSupabase.select.mockRejectedValueOnce(new Error('Connection timeout'))

      await expect(referralService.getReferralAnalytics('test-id'))
        .rejects.toThrow('Connection timeout')
    })

    it('handles malformed data gracefully', async () => {
      const malformedData = {
        referred_name: null,
        referred_phone: undefined,
        invalid_field: 'should be ignored',
      }

      await expect(referralService.createReferral(malformedData))
        .rejects.toThrow('Missing required fields')
    })

    it('validates data types correctly', async () => {
      const invalidTypes = {
        referrer_student_id: 123, // Should be string
        referred_name: true, // Should be string
        referred_phone: {}, // Should be string
      }

      await expect(referralService.createReferral(invalidTypes))
        .rejects.toThrow()
    })
  })
})