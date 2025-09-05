import type {
  FeedbackEntry,
  FeedbackTemplate,
  FeedbackSubmission,
  FeedbackSummary,
  TeacherFeedbackOverview,
  StudentFeedbackOverview,
  FeedbackFilters,
  FeedbackAnalytics,
  FeedbackRankingImpact,
  BulkFeedbackRequest,
  FeedbackFormData,
  FeedbackListResponse
} from '@/types/feedback'

// Utility for generating UUIDs in tests
const mockUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
  const r = Math.random() * 16 | 0
  const v = c === 'x' ? r : (r & 0x3 | 0x8)
  return v.toString(16)
})

// Mock organization and user data
export const mockOrganizationId = 'org-test-12345'
export const mockCurrentUserId = 'user-current-test'

// Feedback categories for testing
export const feedbackCategories = [
  'teaching_quality',
  'communication',
  'behavior',
  'homework',
  'attendance',
  'professional_development'
] as const

export const feedbackStatuses = ['active', 'reviewed', 'resolved', 'flagged'] as const

/**
 * Create mock user profile data
 */
export const createMockUserProfile = (overrides: Partial<any> = {}) => ({
  full_name: 'Test User',
  avatar_url: 'https://example.com/avatar.jpg',
  user_type: 'student' as const,
  ...overrides
})

/**
 * Create mock group data
 */
export const createMockGroup = (overrides: Partial<any> = {}) => ({
  id: mockUUID(),
  name: 'Test Group',
  subject: 'English',
  ...overrides
})

/**
 * Create mock feedback entry
 */
export const createMockFeedbackEntry = (overrides: Partial<FeedbackEntry> = {}): FeedbackEntry => ({
  id: mockUUID(),
  organization_id: mockOrganizationId,
  from_user_id: 'user-from-test',
  to_user_id: 'user-to-test',
  from_user_type: 'student',
  to_user_type: 'teacher',
  subject: 'Great teaching session',
  message: 'The lesson was very clear and engaging. I learned a lot about the topic.',
  rating: 4,
  category: 'teaching_quality',
  group_id: 'group-test-123',
  is_anonymous: false,
  affects_ranking: true,
  ranking_points_impact: 40,
  status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  // Populated relations
  from_user_profile: createMockUserProfile({ 
    full_name: 'John Student', 
    user_type: 'student' 
  }),
  to_user_profile: createMockUserProfile({ 
    full_name: 'Jane Teacher', 
    user_type: 'teacher' 
  }),
  group: createMockGroup({ name: 'Advanced English', subject: 'English' }),
  ...overrides
})

/**
 * Create mock feedback template
 */
export const createMockFeedbackTemplate = (overrides: Partial<FeedbackTemplate> = {}): FeedbackTemplate => ({
  id: mockUUID(),
  organization_id: mockOrganizationId,
  template_name: 'Teaching Quality Assessment',
  feedback_direction: 'student_to_teacher',
  subject_template: 'Feedback on {{lesson_topic}}',
  message_template: 'I would like to provide feedback on {{teacher_name}}\'s teaching of {{lesson_topic}}...',
  default_rating: 4,
  category: 'teaching_quality',
  is_active: true,
  created_at: new Date().toISOString(),
  ...overrides
})

/**
 * Create mock feedback submission
 */
export const createMockFeedbackSubmission = (overrides: Partial<FeedbackSubmission> = {}): FeedbackSubmission => ({
  to_user_id: 'teacher-test-123',
  to_user_type: 'teacher',
  subject: 'Lesson feedback',
  message: 'Great explanation of complex topics. Very helpful examples.',
  rating: 5,
  category: 'teaching_quality',
  group_id: 'group-test-123',
  is_anonymous: false,
  affects_ranking: true,
  ...overrides
})

/**
 * Create mock feedback form data
 */
export const createMockFeedbackFormData = (overrides: Partial<FeedbackFormData> = {}): FeedbackFormData => ({
  to_user_id: 'teacher-test-123',
  to_user_type: 'teacher',
  subject: 'Class feedback',
  message: 'Excellent teaching methods and clear communication.',
  rating: 4,
  category: 'teaching_quality',
  group_id: 'group-test-123',
  is_anonymous: false,
  ...overrides
})

/**
 * Create mock feedback summary
 */
export const createMockFeedbackSummary = (overrides: Partial<FeedbackSummary> = {}): FeedbackSummary => ({
  total_received: 25,
  total_given: 15,
  average_rating_received: 4.2,
  average_rating_given: 4.1,
  recent_count: 5,
  category_breakdown: [
    { category: 'teaching_quality', rating: 4.5, count: 10, percentage: 40 },
    { category: 'communication', rating: 4.2, count: 8, percentage: 32 },
    { category: 'behavior', rating: 4.0, count: 7, percentage: 28 }
  ],
  monthly_trends: [
    { month: '2024-01', received_count: 8, given_count: 5, average_rating: 4.1 },
    { month: '2024-02', received_count: 10, given_count: 6, average_rating: 4.3 },
    { month: '2024-03', received_count: 7, given_count: 4, average_rating: 4.0 }
  ],
  ranking_impact: {
    total_points_from_feedback: 420,
    ranking_position_change: 3,
    quality_score_impact: 5.2,
    efficiency_impact: 2.8
  },
  ...overrides
})

/**
 * Create mock teacher feedback overview
 */
export const createMockTeacherFeedbackOverview = (overrides: Partial<TeacherFeedbackOverview> = {}): TeacherFeedbackOverview => ({
  summary: createMockFeedbackSummary(),
  recent_feedback: [
    createMockFeedbackEntry({ rating: 5, category: 'teaching_quality' }),
    createMockFeedbackEntry({ rating: 4, category: 'communication' }),
    createMockFeedbackEntry({ rating: 4, category: 'behavior' })
  ],
  feedback_trends: [
    { period: '2024-01', rating: 4.1, count: 8, points_impact: 160 },
    { period: '2024-02', rating: 4.3, count: 10, points_impact: 200 },
    { period: '2024-03', rating: 4.0, count: 7, points_impact: 140 }
  ],
  student_engagement: {
    total_students_providing_feedback: 18,
    feedback_frequency: 1.4,
    response_rate: 0.75
  },
  improvement_areas: [
    {
      category: 'homework',
      average_rating: 3.8,
      suggested_actions: ['Provide clearer instructions', 'Set more reasonable deadlines']
    }
  ],
  ...overrides
})

/**
 * Create mock student feedback overview
 */
export const createMockStudentFeedbackOverview = (overrides: Partial<StudentFeedbackOverview> = {}): StudentFeedbackOverview => ({
  feedback_given: {
    total_submitted: 12,
    recent_submissions: [
      createMockFeedbackEntry({ from_user_type: 'student', to_user_type: 'teacher' }),
      createMockFeedbackEntry({ from_user_type: 'student', to_user_type: 'teacher', rating: 3 })
    ],
    engagement_score: 8.5,
    categories_covered: ['teaching_quality', 'communication', 'behavior']
  },
  feedback_received: {
    total_received: 8,
    average_rating: 4.1,
    recent_feedback: [
      createMockFeedbackEntry({ from_user_type: 'teacher', to_user_type: 'student' })
    ],
    improvement_suggestions: ['More active participation', 'Complete assignments on time']
  },
  ranking_impact: {
    points_from_engagement: 60,
    quality_bonus: 25,
    feedback_streaks: 15
  },
  ...overrides
})

/**
 * Create mock feedback analytics
 */
export const createMockFeedbackAnalytics = (overrides: Partial<FeedbackAnalytics> = {}): FeedbackAnalytics => ({
  organization_overview: {
    total_feedback_entries: 150,
    average_rating: 4.2,
    feedback_velocity: 25,
    response_rate: 0.78
  },
  teacher_insights: {
    highest_rated_teachers: [
      { teacher_id: 't1', teacher_name: 'Alice Johnson', average_rating: 4.8, feedback_count: 20 },
      { teacher_id: 't2', teacher_name: 'Bob Smith', average_rating: 4.6, feedback_count: 18 }
    ],
    improvement_opportunities: [
      { teacher_id: 't3', teacher_name: 'Carol Davis', lowest_category: 'homework', average_rating: 3.5, suggestion: 'Improve assignment clarity' }
    ]
  },
  student_insights: {
    most_engaged_students: [
      { student_id: 's1', student_name: 'David Wilson', feedback_given_count: 15, engagement_score: 9.2 },
      { student_id: 's2', student_name: 'Eva Brown', feedback_given_count: 12, engagement_score: 8.8 }
    ],
    feedback_quality_leaders: [
      { student_id: 's1', student_name: 'David Wilson', helpful_feedback_count: 12, average_quality_score: 9.1 }
    ]
  },
  category_performance: [
    { category: 'teaching_quality', average_rating: 4.5, feedback_count: 50, trend: 'improving' },
    { category: 'communication', average_rating: 4.2, feedback_count: 40, trend: 'stable' },
    { category: 'behavior', average_rating: 4.0, feedback_count: 35, trend: 'declining' }
  ],
  correlation_insights: {
    feedback_to_performance: 0.75,
    feedback_to_retention: 0.68,
    feedback_to_engagement: 0.82
  },
  ...overrides
})

/**
 * Create mock feedback ranking impact
 */
export const createMockFeedbackRankingImpact = (overrides: Partial<FeedbackRankingImpact> = {}): FeedbackRankingImpact => ({
  total_points: 420,
  average_rating: 4.2,
  feedback_count: 25,
  category_breakdown: [
    { category: 'teaching_quality', average_rating: 4.5, count: 10, points_impact: 180 },
    { category: 'communication', average_rating: 4.2, count: 8, points_impact: 135 },
    { category: 'behavior', average_rating: 4.0, count: 7, points_impact: 105 }
  ],
  ...overrides
})

/**
 * Create mock bulk feedback request
 */
export const createMockBulkFeedbackRequest = (overrides: Partial<BulkFeedbackRequest> = {}): BulkFeedbackRequest => ({
  template_id: 'template-test-123',
  feedback_data: {
    to_user_type: 'teacher',
    subject: 'Monthly evaluation',
    message: 'Overall performance assessment for this month.',
    rating: 4,
    category: 'teaching_quality',
    is_anonymous: false
  },
  recipient_ids: ['teacher-1', 'teacher-2', 'teacher-3'],
  recipient_type: 'teacher',
  ...overrides
})

/**
 * Create mock feedback list response
 */
export const createMockFeedbackListResponse = (overrides: Partial<FeedbackListResponse> = {}): FeedbackListResponse => ({
  data: [
    createMockFeedbackEntry(),
    createMockFeedbackEntry({ rating: 3, category: 'communication' }),
    createMockFeedbackEntry({ rating: 5, category: 'behavior' })
  ],
  count: 3,
  total_pages: 1,
  current_page: 1,
  ...overrides
})

/**
 * Create mock feedback filters
 */
export const createMockFeedbackFilters = (overrides: Partial<FeedbackFilters> = {}): FeedbackFilters => ({
  user_type: 'teacher',
  category: ['teaching_quality', 'communication'],
  rating_min: 3,
  rating_max: 5,
  date_from: new Date('2024-01-01'),
  date_to: new Date('2024-03-31'),
  group_id: 'group-test-123',
  status: ['active', 'reviewed'],
  is_anonymous: false,
  affects_ranking: true,
  ...overrides
})

/**
 * Generate multiple mock feedback entries
 */
export const createMockFeedbackList = (count: number = 5, overrides: Partial<FeedbackEntry> = {}): FeedbackEntry[] => {
  return Array.from({ length: count }, (_, index) => 
    createMockFeedbackEntry({
      id: `feedback-${index + 1}`,
      message: `This is test feedback entry number ${index + 1}`,
      rating: Math.floor(Math.random() * 5) + 1,
      category: feedbackCategories[index % feedbackCategories.length],
      status: feedbackStatuses[index % feedbackStatuses.length],
      from_user_id: `user-from-${index + 1}`,
      to_user_id: `user-to-${index + 1}`,
      ...overrides
    })
  )
}

/**
 * Generate mock feedback entries for specific scenarios
 */
export const createScenarioFeedbackData = {
  // High-rated teacher feedback
  excellentTeacher: () => createMockFeedbackList(10, {
    rating: 5,
    category: 'teaching_quality',
    to_user_type: 'teacher',
    affects_ranking: true,
    ranking_points_impact: 50
  }),

  // Mixed rating student feedback
  mixedRatingStudent: () => createMockFeedbackList(8, {
    to_user_type: 'student',
    from_user_type: 'teacher'
  }).map((feedback, index) => ({
    ...feedback,
    rating: index % 2 === 0 ? 5 : 3,
    category: index % 2 === 0 ? 'behavior' : 'homework'
  })),

  // Anonymous feedback
  anonymousFeedback: () => createMockFeedbackList(5, {
    is_anonymous: true,
    from_user_id: null,
    from_user_profile: null
  }),

  // Recent feedback for dashboards
  recentFeedback: () => {
    const now = new Date()
    return createMockFeedbackList(15).map((feedback, index) => ({
      ...feedback,
      created_at: new Date(now.getTime() - (index * 24 * 60 * 60 * 1000)).toISOString()
    }))
  },

  // Cross-impact feedback (teacher-student pairs)
  crossImpactFeedback: () => {
    const teacherId = 'teacher-cross-test'
    const studentIds = ['student-1', 'student-2', 'student-3']
    
    return [
      // Students providing feedback to teacher
      ...studentIds.map(studentId => createMockFeedbackEntry({
        from_user_id: studentId,
        to_user_id: teacherId,
        from_user_type: 'student',
        to_user_type: 'teacher',
        rating: 5,
        affects_ranking: true,
        ranking_points_impact: 50
      })),
      // Teacher providing feedback to students
      ...studentIds.map(studentId => createMockFeedbackEntry({
        from_user_id: teacherId,
        to_user_id: studentId,
        from_user_type: 'teacher',
        to_user_type: 'student',
        rating: 4,
        affects_ranking: true,
        ranking_points_impact: 40
      }))
    ]
  }
}

/**
 * Mock feedback service responses
 */
export const createMockFeedbackServiceResponse = <T>(data: T, success: boolean = true) => ({
  success,
  data,
  error: success ? null : 'Mock service error',
  message: success ? 'Operation completed successfully' : 'Service error occurred'
})

/**
 * Mock bulk operation results
 */
export const createMockBulkOperationResult = (successCount: number, totalCount: number) => ({
  success: successCount,
  errors: Array.from({ length: totalCount - successCount }, (_, i) => 
    `Failed to process item ${i + successCount + 1}: Mock error`
  )
})

/**
 * Mock API error responses
 */
export const createMockErrorResponse = (errorType: string) => {
  const errorMap = {
    'permission_denied': { code: 403, message: 'Access denied' },
    'not_found': { code: 404, message: 'Resource not found' },
    'validation_error': { code: 400, message: 'Invalid input data' },
    'server_error': { code: 500, message: 'Internal server error' },
    'rate_limit': { code: 429, message: 'Too many requests' }
  }
  
  return errorMap[errorType as keyof typeof errorMap] || { code: 500, message: 'Unknown error' }
}

/**
 * Mock user for testing current user context
 */
export const createMockUser = (overrides: Partial<any> = {}) => ({
  id: mockCurrentUserId,
  email: 'test@harryschool.uz',
  user_metadata: { full_name: 'Test User' },
  app_metadata: { role: 'admin' },
  ...overrides
})

/**
 * Mock performance test data generators
 */
export const createPerformanceTestData = {
  largeFeedbackDataset: (size: number) => ({
    feedbackEntries: createMockFeedbackList(size),
    users: Array.from({ length: Math.ceil(size / 10) }, (_, i) => ({
      id: `user-perf-${i}`,
      full_name: `Performance User ${i}`,
      user_type: i % 2 === 0 ? 'teacher' : 'student'
    })),
    groups: Array.from({ length: Math.ceil(size / 20) }, (_, i) => ({
      id: `group-perf-${i}`,
      name: `Performance Group ${i}`,
      subject: `Subject ${i}`
    }))
  }),

  concurrentOperationData: (operationCount: number) => 
    Array.from({ length: operationCount }, (_, i) => ({
      operationId: `op-${i}`,
      feedbackData: createMockFeedbackSubmission({
        to_user_id: `user-concurrent-${i % 10}`,
        message: `Concurrent operation ${i} feedback`
      })
    }))
}

/**
 * Test data validation utilities
 */
export const validateMockData = {
  feedbackEntry: (entry: FeedbackEntry): boolean => {
    return !!(
      entry.id &&
      entry.organization_id &&
      entry.to_user_id &&
      entry.message &&
      entry.rating >= 1 && entry.rating <= 5 &&
      entry.category &&
      entry.status &&
      entry.created_at
    )
  },

  feedbackSubmission: (submission: FeedbackSubmission): boolean => {
    return !!(
      submission.to_user_id &&
      submission.to_user_type &&
      submission.message &&
      submission.rating >= 1 && submission.rating <= 5 &&
      submission.category
    )
  }
}