import type {
  StudentReferral,
  ReferralCampaign,
  ReferralSummary,
  ReferralMetrics,
  ReferralAnalytics,
  Student,
  Achievement,
  UserRanking,
  PointsTransaction,
} from '@/types/referral'

// Polyfill for crypto.randomUUID in test environment
const mockUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
  const r = Math.random() * 16 | 0
  const v = c === 'x' ? r : (r & 0x3 | 0x8)
  return v.toString(16)
})

// Mock Student Data
export const createMockStudentData = (overrides: Partial<Student> = {}): Student => ({
  id: mockUUID(),
  organization_id: mockUUID(),
  first_name: 'John',
  last_name: 'Doe',
  full_name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+998901234567',
  date_of_birth: new Date('2000-05-15'),
  gender: 'male',
  student_id: 'HS2024001',
  enrollment_date: new Date('2024-01-15'),
  status: 'active',
  current_level: 'intermediate',
  total_points: 850,
  ranking_position: 5,
  achievements_count: 8,
  created_at: new Date('2024-01-15T09:00:00Z'),
  updated_at: new Date('2024-01-15T09:00:00Z'),
  ...overrides,
})

// Mock Student Referral Data
export const createMockStudentReferral = (overrides: Partial<StudentReferral> = {}): StudentReferral => ({
  id: mockUUID(),
  organization_id: mockUUID(),
  referrer_student_id: mockUUID(),
  referrer_name: 'Alice Johnson',
  referred_name: 'Bob Smith',
  referred_phone: '+998901234567',
  referred_email: 'bob.smith@example.com',
  referral_source: 'word_of_mouth',
  referral_method: 'direct_contact',
  notes: 'Friend from university, very interested in English courses',
  status: 'enrolled',
  contact_date: new Date('2024-01-20'),
  enrollment_date: new Date('2024-01-25'),
  points_awarded: 100,
  coins_awarded: 50,
  bonus_applied: true,
  reward_tier: 'standard',
  contacted_by: mockUUID(),
  enrolled_as_student_id: mockUUID(),
  admin_notes: 'Converted successfully, enrolled in English course',
  created_at: new Date('2024-01-15T10:00:00Z'),
  updated_at: new Date('2024-01-25T14:00:00Z'),
  ...overrides,
})

// Mock Referral Campaign Data
export const createMockReferralCampaign = (overrides: Partial<ReferralCampaign> = {}): ReferralCampaign => ({
  id: mockUUID(),
  organization_id: mockUUID(),
  campaign_name: 'Back to School Challenge',
  description: 'Refer 3 students during August and earn bonus points',
  campaign_type: 'seasonal',
  base_points_reward: 100,
  base_coins_reward: 50,
  bonus_multiplier: 1.5,
  tier_1_threshold: 1,
  tier_1_bonus: 0,
  tier_2_threshold: 3,
  tier_2_bonus: 50,
  tier_3_threshold: 5,
  tier_3_bonus: 150,
  start_date: new Date('2024-08-01'),
  end_date: new Date('2024-08-31'),
  is_active: true,
  created_by: mockUUID(),
  created_at: new Date('2024-07-15T09:00:00Z'),
  updated_at: new Date('2024-07-15T09:00:00Z'),
  ...overrides,
})

// Mock Referral Summary
export const createMockReferralSummary = (overrides: Partial<ReferralSummary> = {}): ReferralSummary => ({
  totalReferrals: 6,
  successfulReferrals: 4,
  pendingReferrals: 1,
  conversionRate: 67,
  totalPointsEarned: 450,
  currentTier: 'ambassador',
  nextMilestone: {
    referralsNeeded: 1,
    rewardPoints: 150,
    achievementName: 'Referral Champion',
  },
  ...overrides,
})

// Mock Referral Metrics
export const createMockReferralMetrics = (overrides: Partial<ReferralMetrics> = {}): ReferralMetrics => ({
  totalReferrals: 6,
  successfulReferrals: 4,
  conversionRate: 67,
  pointsEarned: 450,
  tier: 'ambassador',
  monthlyReferrals: 2,
  lastReferralDate: new Date('2024-01-20'),
  ...overrides,
})

// Mock Referral Analytics
export const createMockReferralAnalytics = (overrides: Partial<ReferralAnalytics> = {}): ReferralAnalytics => ({
  totalReferrals: 24,
  successfulReferrals: 18,
  conversionRate: 75,
  averageConversionTime: 5.2, // days
  topReferrers: [
    {
      studentId: mockUUID(),
      studentName: 'Alice Johnson',
      referrals: 8,
      conversions: 7,
      conversionRate: 87.5,
      pointsEarned: 750,
    },
    {
      studentId: mockUUID(),
      studentName: 'Bob Smith',
      referrals: 5,
      conversions: 4,
      conversionRate: 80,
      pointsEarned: 400,
    },
  ],
  monthlyBreakdown: [
    { month: 'January', referrals: 8, conversions: 6, conversionRate: 75 },
    { month: 'February', referrals: 10, conversions: 8, conversionRate: 80 },
    { month: 'March', referrals: 6, conversions: 4, conversionRate: 67 },
  ],
  sourceBreakdown: [
    { source: 'word_of_mouth', count: 12, percentage: 50 },
    { source: 'social_media', count: 8, percentage: 33 },
    { source: 'family_friend', count: 4, percentage: 17 },
  ],
  ...overrides,
})

// Mock User Ranking with Referral Data
export const createMockUserRanking = (overrides: Partial<UserRanking> = {}): UserRanking => ({
  id: mockUUID(),
  user_id: mockUUID(),
  organization_id: mockUUID(),
  current_points: 850,
  total_points_earned: 1250,
  ranking_position: 5,
  tier: 'gold',
  level: 'intermediate',
  achievements_count: 8,
  total_referrals: 6,
  successful_referrals: 4,
  referral_points_earned: 450,
  referral_conversion_rate: 67,
  created_at: new Date('2024-01-15T09:00:00Z'),
  updated_at: new Date('2024-01-25T14:00:00Z'),
  ...overrides,
})

// Mock Points Transaction for Referrals
export const createMockReferralPointsTransaction = (overrides: Partial<PointsTransaction> = {}): PointsTransaction => ({
  id: mockUUID(),
  user_id: mockUUID(),
  organization_id: mockUUID(),
  points: 100,
  transaction_type: 'earned',
  category: 'referral',
  reference_type: 'student_referral',
  reference_id: mockUUID(),
  description: 'Referral enrolled - Bob Smith',
  multiplier: 1.0,
  bonus_points: 0,
  approved: true,
  approved_by: mockUUID(),
  approved_at: new Date('2024-01-25T14:00:00Z'),
  created_at: new Date('2024-01-25T14:00:00Z'),
  ...overrides,
})

// Mock Achievement for Referrals
export const createMockReferralAchievement = (overrides: Partial<Achievement> = {}): Achievement => ({
  id: mockUUID(),
  organization_id: mockUUID(),
  name: 'First Referral',
  description: 'Successfully referred your first student to Harry School',
  achievement_type: 'referral',
  category: 'first_referral',
  icon: '🎯',
  color: 'purple',
  points_reward: 25,
  coins_reward: 10,
  rarity: 'common',
  is_active: true,
  created_at: new Date('2024-01-01T00:00:00Z'),
  updated_at: new Date('2024-01-01T00:00:00Z'),
  ...overrides,
})

// Comprehensive Mock Data Factory
export const createMockReferralData = () => {
  const pendingReferrals = [
    createMockStudentReferral({
      id: 'pending-1',
      referred_name: 'Carol White',
      referrer_name: 'Alice Johnson',
      status: 'pending',
      created_at: new Date(Date.now() - 86400000 * 2), // 2 days ago
    }),
    createMockStudentReferral({
      id: 'pending-2',
      referred_name: 'David Brown',
      referrer_name: 'Bob Smith',
      status: 'contacted',
      contact_date: new Date(Date.now() - 86400000), // 1 day ago
    }),
    createMockStudentReferral({
      id: 'pending-3',
      referred_name: 'Eva Green',
      referrer_name: 'Charlie Davis',
      status: 'pending',
      created_at: new Date(Date.now() - 86400000 * 5), // 5 days ago
    }),
  ]

  return {
    summary: createMockReferralSummary(),
    metrics: createMockReferralMetrics(),
    analytics: createMockReferralAnalytics(),
    pendingReferrals,
    campaigns: [
      createMockReferralCampaign(),
      createMockReferralCampaign({
        id: 'summer-special',
        campaign_name: 'Summer Special',
        campaign_type: 'limited_time',
        bonus_multiplier: 2.0,
        start_date: new Date('2024-06-01'),
        end_date: new Date('2024-08-31'),
      }),
    ],
    achievements: [
      createMockReferralAchievement(),
      createMockReferralAchievement({
        id: 'referral-champion',
        name: 'Referral Champion',
        description: 'Successfully referred 5 students',
        category: 'referral_champion',
        points_reward: 150,
        coins_reward: 100,
        rarity: 'rare',
      }),
    ],
    transactions: [
      createMockReferralPointsTransaction(),
      createMockReferralPointsTransaction({
        id: 'bonus-transaction',
        points: 50,
        description: 'Referral bonus - Tier 2 achievement',
        bonus_points: 50,
      }),
    ],
  }
}

// Mock scenarios for different student types
export const createStudentReferralScenarios = () => ({
  highPerformer: {
    student: createMockStudentData({
      id: 'high-performer',
      full_name: 'Alice Johnson',
      total_points: 1200,
      ranking_position: 1,
    }),
    referralData: createMockReferralData(),
    ranking: createMockUserRanking({
      current_points: 1200,
      ranking_position: 1,
      total_referrals: 8,
      successful_referrals: 7,
      referral_conversion_rate: 87.5,
    }),
  },
  averagePerformer: {
    student: createMockStudentData({
      id: 'average-performer',
      full_name: 'Bob Smith',
      total_points: 650,
      ranking_position: 15,
    }),
    referralData: {
      ...createMockReferralData(),
      summary: createMockReferralSummary({
        totalReferrals: 3,
        successfulReferrals: 2,
        conversionRate: 67,
        totalPointsEarned: 200,
      }),
    },
    ranking: createMockUserRanking({
      current_points: 650,
      ranking_position: 15,
      total_referrals: 3,
      successful_referrals: 2,
      referral_conversion_rate: 67,
    }),
  },
  newStudent: {
    student: createMockStudentData({
      id: 'new-student',
      full_name: 'Charlie Davis',
      total_points: 120,
      ranking_position: 45,
      enrollment_date: new Date(Date.now() - 86400000 * 30), // 30 days ago
    }),
    referralData: {
      ...createMockReferralData(),
      summary: createMockReferralSummary({
        totalReferrals: 0,
        successfulReferrals: 0,
        conversionRate: 0,
        totalPointsEarned: 0,
        currentTier: 'none',
      }),
    },
    ranking: createMockUserRanking({
      current_points: 120,
      ranking_position: 45,
      total_referrals: 0,
      successful_referrals: 0,
      referral_conversion_rate: 0,
    }),
  },
})

// Mock handlers for event testing
export const createMockHandlers = () => ({
  onReferralSubmit: jest.fn(),
  onContactReferral: jest.fn(),
  onBulkContact: jest.fn(),
  onTimeRangeChange: jest.fn(),
  onCampaignCreate: jest.fn(),
  onCampaignEdit: jest.fn(),
  onCampaignDelete: jest.fn(),
  onAchievementUnlock: jest.fn(),
  onPointsAwarded: jest.fn(),
  onCancel: jest.fn(),
  onEdit: jest.fn(),
  onDelete: jest.fn(),
  onExport: jest.fn(),
  onViewDetails: jest.fn(),
  onScheduleFollowup: jest.fn(),
})

// Performance test data generators
export const createLargeReferralDataset = (count: number = 1000) => {
  return Array.from({ length: count }, (_, index) => 
    createMockStudentReferral({
      id: `referral-${index + 1}`,
      referred_name: `Test Student ${index + 1}`,
      referrer_name: `Referrer ${Math.floor(index / 10) + 1}`,
      status: index % 4 === 0 ? 'enrolled' : 
             index % 4 === 1 ? 'contacted' : 
             index % 4 === 2 ? 'pending' : 'declined',
      points_awarded: index % 4 === 0 ? 100 : 0,
      created_at: new Date(Date.now() - Math.random() * 86400000 * 365), // Random date within last year
    })
  )
}

// Edge case scenarios
export const createEdgeCaseScenarios = () => ({
  duplicateReferral: {
    existing: createMockStudentReferral({
      referred_name: 'John Duplicate',
      referred_phone: '+998901234567',
      status: 'enrolled',
    }),
    duplicate: {
      referred_name: 'John Duplicate',
      referred_phone: '+998901234567',
    },
  },
  expiredCampaign: createMockReferralCampaign({
    campaign_name: 'Expired Campaign',
    end_date: new Date(Date.now() - 86400000), // Yesterday
    is_active: false,
  }),
  maxTierStudent: {
    student: createMockStudentData({
      full_name: 'Max Tier Student',
      total_points: 5000,
      ranking_position: 1,
    }),
    ranking: createMockUserRanking({
      current_points: 5000,
      total_referrals: 25,
      successful_referrals: 24,
      referral_conversion_rate: 96,
      tier: 'platinum',
    }),
  },
  internationalReferral: createMockStudentReferral({
    referred_name: 'International Student',
    referred_phone: '+44123456789',
    referred_email: 'international@example.co.uk',
    notes: 'Student from UK, interested in online courses',
  }),
})