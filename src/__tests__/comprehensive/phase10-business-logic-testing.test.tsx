/**
 * PHASE 10: Business Logic Testing
 * 
 * Comprehensive testing of business rules, workflows, and domain-specific scenarios
 * Testing educational institution rules, enrollment logic, payment workflows, and complex business processes
 */

import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StudentsClient from '@/app/[locale]/(dashboard)/students/students-client'
import { 
  generateMockStudent,
  generateStudentDataset, 
  createMockApiResponse,
  createMockApiError
} from '@/lib/test-utils'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
}))

jest.mock('@/lib/supabase-unified', () => ({
  getApiClient: jest.fn(),
  getCurrentOrganizationId: jest.fn(),
}))

jest.mock('@tanstack/react-query')

const mockUseQuery = require('@tanstack/react-query').useQuery
const mockUseMutation = require('@tanstack/react-query').useMutation

describe('Phase 10: Business Logic Testing', () => {
  let user: ReturnType<typeof userEvent.setup>
  let mockRefetch: jest.Mock
  let mockMutate: jest.Mock
  
  beforeEach(() => {
    jest.clearAllMocks()
    user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    jest.useFakeTimers()
    
    mockRefetch = jest.fn()
    mockMutate = jest.fn()
    
    // Default successful state
    mockUseQuery.mockReturnValue({
      data: createMockApiResponse(generateStudentDataset(10)),
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    })
    
    mockUseMutation.mockReturnValue({
      mutate: mockMutate,
      isLoading: false,
      error: null,
      isSuccess: false,
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('10.1 Student Enrollment Business Rules', () => {
    test('should enforce age restrictions for enrollment', async () => {
      // Test different age scenarios
      const ageTestCases = [
        { dateOfBirth: '2020-01-01', expectedResult: 'too_young', description: 'under 4 years old' },
        { dateOfBirth: '2018-01-01', expectedResult: 'valid', description: 'valid age 6' },
        { dateOfBirth: '2005-01-01', expectedResult: 'valid', description: 'valid age 19' },
        { dateOfBirth: '1995-01-01', expectedResult: 'too_old', description: 'over maximum age' }
      ]

      for (const testCase of ageTestCases) {
        mockUseMutation.mockReturnValue({
          mutate: mockMutate.mockImplementation((data, { onSuccess, onError }) => {
            const age = new Date().getFullYear() - new Date(data.date_of_birth).getFullYear()
            
            if (age < 4) {
              onError(createMockApiError(422, 'Student must be at least 4 years old'))
            } else if (age > 25) {
              onError(createMockApiError(422, 'Student exceeds maximum age limit'))
            } else {
              onSuccess(createMockApiResponse({ id: 'new-student' }))
            }
          }),
          isLoading: false,
          error: null,
          isSuccess: false,
        })

        render(<StudentsClient />)

        await waitFor(() => {
          expect(screen.getByText(/students/i)).toBeInTheDocument()
        })

        const addButton = screen.getByRole('button', { name: /add student/i })
        await user.click(addButton)

        await waitFor(() => {
          expect(screen.getByRole('dialog')).toBeInTheDocument()
        })

        // Fill form with test case data
        await user.type(screen.getByLabelText(/first name/i), 'Test')
        await user.type(screen.getByLabelText(/last name/i), 'Student')
        await user.type(screen.getByLabelText(/date of birth/i), testCase.dateOfBirth)

        const submitButton = screen.getByRole('button', { name: /create/i })
        await user.click(submitButton)

        await waitFor(() => {
          if (testCase.expectedResult === 'valid') {
            expect(mockMutate).toHaveBeenCalled()
          } else {
            expect(screen.getByText(/age/i)).toBeInTheDocument()
          }
        })
      }
    })

    test('should validate enrollment capacity limits', async () => {
      const capacityScenarios = [
        { currentStudents: 50, maxCapacity: 100, expectedResult: 'allow' },
        { currentStudents: 99, maxCapacity: 100, expectedResult: 'allow' },
        { currentStudents: 100, maxCapacity: 100, expectedResult: 'waitlist' },
        { currentStudents: 120, maxCapacity: 100, expectedResult: 'reject' }
      ]

      for (const scenario of capacityScenarios) {
        mockUseMutation.mockReturnValue({
          mutate: mockMutate.mockImplementation((data, { onSuccess, onError }) => {
            if (scenario.currentStudents >= scenario.maxCapacity) {
              if (scenario.expectedResult === 'waitlist') {
                onSuccess(createMockApiResponse({ 
                  id: 'waitlisted-student',
                  status: 'waitlisted' 
                }))
              } else {
                onError(createMockApiError(422, 'Enrollment capacity exceeded'))
              }
            } else {
              onSuccess(createMockApiResponse({ 
                id: 'enrolled-student',
                status: 'active' 
              }))
            }
          }),
          isLoading: false,
          error: null,
          isSuccess: false,
        })

        render(<StudentsClient />)

        await waitFor(() => {
          expect(screen.getByText(/students/i)).toBeInTheDocument()
        })

        const addButton = screen.getByRole('button', { name: /add student/i })
        await user.click(addButton)

        await waitFor(() => {
          expect(screen.getByRole('dialog')).toBeInTheDocument()
        })

        await user.type(screen.getByLabelText(/first name/i), 'Test')
        await user.type(screen.getByLabelText(/last name/i), 'Student')

        const submitButton = screen.getByRole('button', { name: /create/i })
        await user.click(submitButton)

        await waitFor(() => {
          if (scenario.expectedResult === 'allow') {
            expect(screen.getByText(/student created/i)).toBeInTheDocument()
          } else if (scenario.expectedResult === 'waitlist') {
            expect(screen.getByText(/added to waitlist/i)).toBeInTheDocument()
          } else {
            expect(screen.getByText(/capacity exceeded/i)).toBeInTheDocument()
          }
        })
      }
    })

    test('should handle academic year enrollment restrictions', async () => {
      const currentDate = new Date()
      const academicYearStart = new Date(currentDate.getFullYear(), 8, 1) // September 1st
      const academicYearEnd = new Date(currentDate.getFullYear() + 1, 5, 30) // June 30th
      
      const enrollmentPeriods = [
        { date: new Date(currentDate.getFullYear(), 7, 15), description: 'before academic year', allowed: false },
        { date: new Date(currentDate.getFullYear(), 8, 15), description: 'early in academic year', allowed: true },
        { date: new Date(currentDate.getFullYear(), 11, 15), description: 'mid academic year', allowed: true },
        { date: new Date(currentDate.getFullYear() + 1, 4, 15), description: 'late in academic year', allowed: false },
        { date: new Date(currentDate.getFullYear() + 1, 6, 15), description: 'after academic year', allowed: false }
      ]

      for (const period of enrollmentPeriods) {
        // Mock current date
        jest.setSystemTime(period.date)

        mockUseMutation.mockReturnValue({
          mutate: mockMutate.mockImplementation((data, { onSuccess, onError }) => {
            const now = new Date()
            if (now < academicYearStart || now > academicYearEnd) {
              onError(createMockApiError(422, 'Enrollment not allowed outside academic year'))
            } else if (now > new Date(currentDate.getFullYear() + 1, 3, 31)) { // After March 31st
              onError(createMockApiError(422, 'Late enrollment period ended'))
            } else {
              onSuccess(createMockApiResponse({ id: 'enrolled-student' }))
            }
          }),
          isLoading: false,
          error: null,
          isSuccess: false,
        })

        render(<StudentsClient />)

        await waitFor(() => {
          expect(screen.getByText(/students/i)).toBeInTheDocument()
        })

        if (period.allowed) {
          const addButton = screen.getByRole('button', { name: /add student/i })
          expect(addButton).toBeEnabled()
        } else {
          const addButton = screen.queryByRole('button', { name: /add student/i })
          if (addButton) {
            expect(addButton).toBeDisabled()
          }
          expect(screen.getByText(/enrollment closed/i)).toBeInTheDocument()
        }
      }

      // Reset system time
      jest.useRealTimers()
      jest.useFakeTimers()
    })

    test('should validate prerequisite course completion', async () => {
      const prerequisiteScenarios = [
        {
          requestedLevel: 'Beginner',
          completedCourses: [],
          expectedResult: 'allow'
        },
        {
          requestedLevel: 'Elementary',
          completedCourses: ['Beginner'],
          expectedResult: 'allow'
        },
        {
          requestedLevel: 'Intermediate',
          completedCourses: ['Beginner'],
          expectedResult: 'reject' // Missing Elementary
        },
        {
          requestedLevel: 'Advanced',
          completedCourses: ['Beginner', 'Elementary', 'Intermediate'],
          expectedResult: 'allow'
        }
      ]

      for (const scenario of prerequisiteScenarios) {
        mockUseMutation.mockReturnValue({
          mutate: mockMutate.mockImplementation((data, { onSuccess, onError }) => {
            const levelHierarchy = ['Beginner', 'Elementary', 'Intermediate', 'Upper-Intermediate', 'Advanced']
            const requestedIndex = levelHierarchy.indexOf(data.current_level)
            
            // Check if all prerequisite levels are completed
            for (let i = 0; i < requestedIndex; i++) {
              if (!scenario.completedCourses.includes(levelHierarchy[i])) {
                onError(createMockApiError(422, `Must complete ${levelHierarchy[i]} before ${data.current_level}`))
                return
              }
            }
            
            onSuccess(createMockApiResponse({ id: 'enrolled-student' }))
          }),
          isLoading: false,
          error: null,
          isSuccess: false,
        })

        render(<StudentsClient />)

        await waitFor(() => {
          expect(screen.getByText(/students/i)).toBeInTheDocument()
        })

        const addButton = screen.getByRole('button', { name: /add student/i })
        await user.click(addButton)

        await waitFor(() => {
          expect(screen.getByRole('dialog')).toBeInTheDocument()
        })

        await user.type(screen.getByLabelText(/first name/i), 'Test')
        await user.type(screen.getByLabelText(/last name/i), 'Student')
        await user.selectOptions(screen.getByLabelText(/level/i), scenario.requestedLevel)

        const submitButton = screen.getByRole('button', { name: /create/i })
        await user.click(submitButton)

        await waitFor(() => {
          if (scenario.expectedResult === 'allow') {
            expect(screen.getByText(/student created/i)).toBeInTheDocument()
          } else {
            expect(screen.getByText(/must complete/i)).toBeInTheDocument()
          }
        })
      }
    })
  })

  describe('10.2 Payment and Financial Logic', () => {
    test('should calculate tuition based on enrollment duration', async () => {
      const tuitionScenarios = [
        { duration: 1, expectedFee: 1000000, description: '1 month' }, // 1M UZS
        { duration: 3, expectedFee: 2700000, description: '3 months (10% discount)' },
        { duration: 6, expectedFee: 5100000, description: '6 months (15% discount)' },
        { duration: 12, expectedFee: 9600000, description: '12 months (20% discount)' }
      ]

      for (const scenario of tuitionScenarios) {
        mockUseMutation.mockReturnValue({
          mutate: mockMutate.mockImplementation((data, { onSuccess }) => {
            let baseFee = 1000000 * scenario.duration // 1M per month base
            
            // Apply discounts
            if (scenario.duration >= 12) {
              baseFee = baseFee * 0.8 // 20% discount
            } else if (scenario.duration >= 6) {
              baseFee = baseFee * 0.85 // 15% discount
            } else if (scenario.duration >= 3) {
              baseFee = baseFee * 0.9 // 10% discount
            }
            
            onSuccess(createMockApiResponse({
              id: 'student-with-fee',
              tuition_fee: baseFee
            }))
          }),
          isLoading: false,
          error: null,
          isSuccess: true,
        })

        render(<StudentsClient />)

        await waitFor(() => {
          expect(screen.getByText(/students/i)).toBeInTheDocument()
        })

        const addButton = screen.getByRole('button', { name: /add student/i })
        await user.click(addButton)

        await waitFor(() => {
          expect(screen.getByRole('dialog')).toBeInTheDocument()
        })

        // Fill enrollment duration
        await user.selectOptions(screen.getByLabelText(/duration/i), scenario.duration.toString())

        await waitFor(() => {
          // Should display calculated tuition fee
          expect(screen.getByText(new RegExp(scenario.expectedFee.toLocaleString()))).toBeInTheDocument()
        })
      }
    })

    test('should handle payment status transitions', async () => {
      const paymentTransitions = [
        { from: 'pending', to: 'paid', allowed: true },
        { from: 'pending', to: 'overdue', allowed: true },
        { from: 'pending', to: 'partial', allowed: true },
        { from: 'paid', to: 'pending', allowed: false },
        { from: 'paid', to: 'refunded', allowed: true },
        { from: 'overdue', to: 'paid', allowed: true },
        { from: 'overdue', to: 'cancelled', allowed: true },
        { from: 'partial', to: 'paid', allowed: true },
        { from: 'partial', to: 'overdue', allowed: true }
      ]

      for (const transition of paymentTransitions) {
        const studentWithPayment = generateMockStudent({
          payment_status: transition.from,
          balance: transition.from === 'partial' ? 500000 : 0
        })

        mockUseQuery.mockReturnValue({
          data: createMockApiResponse([studentWithPayment]),
          isLoading: false,
          error: null,
          refetch: mockRefetch,
        })

        mockUseMutation.mockReturnValue({
          mutate: mockMutate.mockImplementation((data, { onSuccess, onError }) => {
            if (!transition.allowed) {
              onError(createMockApiError(422, `Cannot change payment status from ${transition.from} to ${transition.to}`))
            } else {
              onSuccess(createMockApiResponse({
                ...studentWithPayment,
                payment_status: transition.to
              }))
            }
          }),
          isLoading: false,
          error: null,
          isSuccess: false,
        })

        render(<StudentsClient />)

        await waitFor(() => {
          expect(screen.getByText(/students/i)).toBeInTheDocument()
        })

        // Try to update payment status
        const editButton = screen.getByRole('button', { name: /edit/i })
        await user.click(editButton)

        await waitFor(() => {
          expect(screen.getByRole('dialog')).toBeInTheDocument()
        })

        await user.selectOptions(screen.getByLabelText(/payment status/i), transition.to)

        const updateButton = screen.getByRole('button', { name: /update/i })
        await user.click(updateButton)

        await waitFor(() => {
          if (transition.allowed) {
            expect(mockMutate).toHaveBeenCalled()
          } else {
            expect(screen.getByText(/cannot change/i)).toBeInTheDocument()
          }
        })
      }
    })

    test('should enforce payment deadlines', async () => {
      const currentDate = new Date()
      const paymentDeadlines = [
        {
          enrollmentDate: new Date(currentDate.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          paymentStatus: 'pending',
          expectedAction: 'send_reminder'
        },
        {
          enrollmentDate: new Date(currentDate.getTime() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
          paymentStatus: 'pending',
          expectedAction: 'mark_overdue'
        },
        {
          enrollmentDate: new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          paymentStatus: 'overdue',
          expectedAction: 'suspend_access'
        }
      ]

      for (const deadline of paymentDeadlines) {
        const studentWithDeadline = generateMockStudent({
          enrollment_date: deadline.enrollmentDate.toISOString(),
          payment_status: deadline.paymentStatus
        })

        mockUseQuery.mockReturnValue({
          data: createMockApiResponse([studentWithDeadline]),
          isLoading: false,
          error: null,
          refetch: mockRefetch,
        })

        render(<StudentsClient />)

        await waitFor(() => {
          expect(screen.getByText(/students/i)).toBeInTheDocument()
        })

        // Should show appropriate payment status indicators
        if (deadline.expectedAction === 'send_reminder') {
          expect(screen.getByText(/payment reminder/i)).toBeInTheDocument()
        } else if (deadline.expectedAction === 'mark_overdue') {
          expect(screen.getByText(/overdue/i)).toBeInTheDocument()
        } else if (deadline.expectedAction === 'suspend_access') {
          expect(screen.getByText(/suspended/i)).toBeInTheDocument()
        }
      }
    })

    test('should validate refund business rules', async () => {
      const refundScenarios = [
        {
          enrollmentDaysAgo: 5,
          attendedClasses: 0,
          refundPercentage: 100,
          description: 'full refund within week'
        },
        {
          enrollmentDaysAgo: 10,
          attendedClasses: 2,
          refundPercentage: 80,
          description: 'partial refund after some classes'
        },
        {
          enrollmentDaysAgo: 35,
          attendedClasses: 10,
          refundPercentage: 0,
          description: 'no refund after 30 days'
        }
      ]

      for (const scenario of refundScenarios) {
        const enrollmentDate = new Date()
        enrollmentDate.setDate(enrollmentDate.getDate() - scenario.enrollmentDaysAgo)

        const studentForRefund = generateMockStudent({
          enrollment_date: enrollmentDate.toISOString(),
          payment_status: 'paid',
          tuition_fee: 1000000,
          attended_classes: scenario.attendedClasses
        })

        mockUseMutation.mockReturnValue({
          mutate: mockMutate.mockImplementation((data, { onSuccess, onError }) => {
            const refundAmount = studentForRefund.tuition_fee * (scenario.refundPercentage / 100)
            
            if (scenario.refundPercentage === 0) {
              onError(createMockApiError(422, 'Refund period has expired'))
            } else {
              onSuccess(createMockApiResponse({
                refund_amount: refundAmount,
                refund_percentage: scenario.refundPercentage
              }))
            }
          }),
          isLoading: false,
          error: null,
          isSuccess: false,
        })

        render(<StudentsClient />)

        await waitFor(() => {
          expect(screen.getByText(/students/i)).toBeInTheDocument()
        })

        // Try to process refund
        const actionButton = screen.getByRole('button', { name: /actions/i })
        await user.click(actionButton)

        await waitFor(() => {
          expect(screen.getByRole('menu')).toBeInTheDocument()
        })

        const refundOption = screen.getByRole('menuitem', { name: /refund/i })
        await user.click(refundOption)

        await waitFor(() => {
          if (scenario.refundPercentage > 0) {
            expect(screen.getByText(new RegExp(`${scenario.refundPercentage}%`))).toBeInTheDocument()
          } else {
            expect(screen.getByText(/refund period.*expired/i)).toBeInTheDocument()
          }
        })
      }
    })
  })

  describe('10.3 Academic Progress and Grading Logic', () => {
    test('should validate grade progression requirements', async () => {
      const progressionRules = [
        {
          currentLevel: 'Beginner',
          averageGrade: 85,
          attendanceRate: 90,
          canProgress: true,
          nextLevel: 'Elementary'
        },
        {
          currentLevel: 'Elementary',
          averageGrade: 65,
          attendanceRate: 95,
          canProgress: false, // Grade too low
          reason: 'minimum_grade_not_met'
        },
        {
          currentLevel: 'Intermediate',
          averageGrade: 85,
          attendanceRate: 70,
          canProgress: false, // Attendance too low
          reason: 'minimum_attendance_not_met'
        }
      ]

      for (const rule of progressionRules) {
        const studentProgress = generateMockStudent({
          current_level: rule.currentLevel,
          average_grade: rule.averageGrade,
          attendance_rate: rule.attendanceRate
        })

        mockUseMutation.mockReturnValue({
          mutate: mockMutate.mockImplementation((data, { onSuccess, onError }) => {
            // Business rule: Need 75+ average and 80%+ attendance to progress
            if (rule.averageGrade < 75) {
              onError(createMockApiError(422, 'Minimum grade of 75% required for progression'))
            } else if (rule.attendanceRate < 80) {
              onError(createMockApiError(422, 'Minimum attendance of 80% required for progression'))
            } else {
              onSuccess(createMockApiResponse({
                ...studentProgress,
                current_level: rule.nextLevel,
                progression_date: new Date().toISOString()
              }))
            }
          }),
          isLoading: false,
          error: null,
          isSuccess: false,
        })

        render(<StudentsClient />)

        await waitFor(() => {
          expect(screen.getByText(/students/i)).toBeInTheDocument()
        })

        // Try to promote student
        const actionButton = screen.getByRole('button', { name: /actions/i })
        await user.click(actionButton)

        const promoteOption = screen.getByRole('menuitem', { name: /promote/i })
        await user.click(promoteOption)

        await waitFor(() => {
          if (rule.canProgress) {
            expect(screen.getByText(/promote to.*elementary/i)).toBeInTheDocument()
          } else {
            expect(screen.getByText(/cannot promote/i)).toBeInTheDocument()
          }
        })
      }
    })

    test('should handle academic probation rules', async () => {
      const probationScenarios = [
        {
          averageGrade: 45,
          attendanceRate: 60,
          consecutiveFailingTerms: 1,
          expectedStatus: 'academic_warning'
        },
        {
          averageGrade: 40,
          attendanceRate: 55,
          consecutiveFailingTerms: 2,
          expectedStatus: 'academic_probation'
        },
        {
          averageGrade: 35,
          attendanceRate: 50,
          consecutiveFailingTerms: 3,
          expectedStatus: 'dismissal_recommended'
        }
      ]

      for (const scenario of probationScenarios) {
        const strugglingStudent = generateMockStudent({
          average_grade: scenario.averageGrade,
          attendance_rate: scenario.attendanceRate,
          consecutive_failing_terms: scenario.consecutiveFailingTerms
        })

        mockUseMutation.mockReturnValue({
          mutate: mockMutate.mockImplementation((data, { onSuccess }) => {
            let status = 'good_standing'
            
            if (scenario.averageGrade < 50 || scenario.attendanceRate < 70) {
              if (scenario.consecutiveFailingTerms >= 3) {
                status = 'dismissal_recommended'
              } else if (scenario.consecutiveFailingTerms >= 2) {
                status = 'academic_probation'
              } else {
                status = 'academic_warning'
              }
            }
            
            onSuccess(createMockApiResponse({
              ...strugglingStudent,
              academic_status: status
            }))
          }),
          isLoading: false,
          error: null,
          isSuccess: true,
        })

        render(<StudentsClient />)

        await waitFor(() => {
          expect(screen.getByText(/students/i)).toBeInTheDocument()
        })

        // Should automatically detect and apply academic status
        await waitFor(() => {
          expect(screen.getByText(new RegExp(scenario.expectedStatus.replace(/_/g, ' '), 'i'))).toBeInTheDocument()
        })
      }
    })

    test('should validate graduation requirements', async () => {
      const graduationCandidates = [
        {
          completedLevels: ['Beginner', 'Elementary', 'Intermediate', 'Upper-Intermediate', 'Advanced'],
          totalHours: 500,
          finalGrade: 85,
          canGraduate: true
        },
        {
          completedLevels: ['Beginner', 'Elementary', 'Intermediate'],
          totalHours: 300,
          finalGrade: 90,
          canGraduate: false, // Missing levels
          reason: 'incomplete_curriculum'
        },
        {
          completedLevels: ['Beginner', 'Elementary', 'Intermediate', 'Upper-Intermediate', 'Advanced'],
          totalHours: 400,
          finalGrade: 85,
          canGraduate: false, // Insufficient hours
          reason: 'insufficient_hours'
        },
        {
          completedLevels: ['Beginner', 'Elementary', 'Intermediate', 'Upper-Intermediate', 'Advanced'],
          totalHours: 500,
          finalGrade: 65,
          canGraduate: false, // Low final grade
          reason: 'insufficient_grade'
        }
      ]

      for (const candidate of graduationCandidates) {
        mockUseMutation.mockReturnValue({
          mutate: mockMutate.mockImplementation((data, { onSuccess, onError }) => {
            // Graduation requirements: All levels + 450+ hours + 70+ final grade
            const requiredLevels = ['Beginner', 'Elementary', 'Intermediate', 'Upper-Intermediate', 'Advanced']
            const hasAllLevels = requiredLevels.every(level => candidate.completedLevels.includes(level))
            
            if (!hasAllLevels) {
              onError(createMockApiError(422, 'Must complete all curriculum levels'))
            } else if (candidate.totalHours < 450) {
              onError(createMockApiError(422, 'Minimum 450 study hours required'))
            } else if (candidate.finalGrade < 70) {
              onError(createMockApiError(422, 'Minimum final grade of 70% required'))
            } else {
              onSuccess(createMockApiResponse({
                graduation_eligible: true,
                graduation_date: new Date().toISOString()
              }))
            }
          }),
          isLoading: false,
          error: null,
          isSuccess: false,
        })

        render(<StudentsClient />)

        await waitFor(() => {
          expect(screen.getByText(/students/i)).toBeInTheDocument()
        })

        // Try to graduate student
        const actionButton = screen.getByRole('button', { name: /actions/i })
        await user.click(actionButton)

        const graduateOption = screen.getByRole('menuitem', { name: /graduate/i })
        await user.click(graduateOption)

        await waitFor(() => {
          if (candidate.canGraduate) {
            expect(screen.getByText(/graduation approved/i)).toBeInTheDocument()
          } else {
            expect(screen.getByText(/graduation requirements not met/i)).toBeInTheDocument()
          }
        })
      }
    })
  })

  describe('10.4 Scheduling and Class Management Logic', () => {
    test('should prevent scheduling conflicts', async () => {
      const schedulingScenarios = [
        {
          existingClasses: [
            { day: 'monday', startTime: '09:00', endTime: '10:30', room: 'A1' }
          ],
          newClass: { day: 'monday', startTime: '09:30', endTime: '11:00', room: 'A1' },
          expectedResult: 'conflict', // Time overlap in same room
          conflictType: 'room_time_conflict'
        },
        {
          existingClasses: [
            { day: 'monday', startTime: '09:00', endTime: '10:30', room: 'A1' }
          ],
          newClass: { day: 'monday', startTime: '09:30', endTime: '11:00', room: 'A2' },
          expectedResult: 'conflict', // Teacher can't be in two places
          conflictType: 'teacher_schedule_conflict'
        },
        {
          existingClasses: [
            { day: 'monday', startTime: '09:00', endTime: '10:30', room: 'A1' }
          ],
          newClass: { day: 'monday', startTime: '11:00', endTime: '12:30', room: 'A1' },
          expectedResult: 'allowed', // No conflict
          conflictType: null
        }
      ]

      for (const scenario of schedulingScenarios) {
        mockUseMutation.mockReturnValue({
          mutate: mockMutate.mockImplementation((data, { onSuccess, onError }) => {
            // Check for room conflicts
            for (const existing of scenario.existingClasses) {
              if (existing.day === scenario.newClass.day && 
                  existing.room === scenario.newClass.room) {
                // Check time overlap
                const existingStart = parseInt(existing.startTime.replace(':', ''))
                const existingEnd = parseInt(existing.endTime.replace(':', ''))
                const newStart = parseInt(scenario.newClass.startTime.replace(':', ''))
                const newEnd = parseInt(scenario.newClass.endTime.replace(':', ''))
                
                if (newStart < existingEnd && newEnd > existingStart) {
                  onError(createMockApiError(422, 'Room scheduling conflict detected'))
                  return
                }
              }
            }
            
            onSuccess(createMockApiResponse({ scheduled: true }))
          }),
          isLoading: false,
          error: null,
          isSuccess: false,
        })

        render(<StudentsClient />)

        await waitFor(() => {
          expect(screen.getByText(/students/i)).toBeInTheDocument()
        })

        // Try to schedule class
        const scheduleButton = screen.getByRole('button', { name: /schedule class/i })
        if (scheduleButton) {
          await user.click(scheduleButton)

          await waitFor(() => {
            if (scenario.expectedResult === 'conflict') {
              expect(screen.getByText(/conflict/i)).toBeInTheDocument()
            } else {
              expect(screen.getByText(/scheduled successfully/i)).toBeInTheDocument()
            }
          })
        }
      }
    })

    test('should enforce class size limits', async () => {
      const classSizeScenarios = [
        { currentEnrollment: 8, maxCapacity: 12, allowEnrollment: true },
        { currentEnrollment: 12, maxCapacity: 12, allowEnrollment: false },
        { currentEnrollment: 15, maxCapacity: 12, allowEnrollment: false } // Over capacity
      ]

      for (const scenario of classSizeScenarios) {
        mockUseMutation.mockReturnValue({
          mutate: mockMutate.mockImplementation((data, { onSuccess, onError }) => {
            if (scenario.currentEnrollment >= scenario.maxCapacity) {
              onError(createMockApiError(422, 'Class is at maximum capacity'))
            } else {
              onSuccess(createMockApiResponse({ enrolled: true }))
            }
          }),
          isLoading: false,
          error: null,
          isSuccess: false,
        })

        render(<StudentsClient />)

        await waitFor(() => {
          expect(screen.getByText(/students/i)).toBeInTheDocument()
        })

        // Try to enroll student in class
        const enrollButton = screen.getByRole('button', { name: /enroll in class/i })
        if (enrollButton) {
          if (scenario.allowEnrollment) {
            expect(enrollButton).toBeEnabled()
          } else {
            expect(enrollButton).toBeDisabled()
            expect(screen.getByText(/class full/i)).toBeInTheDocument()
          }
        }
      }
    })
  })

  describe('10.5 Communication and Notification Logic', () => {
    test('should trigger appropriate notifications based on student status', async () => {
      const notificationTriggers = [
        {
          statusChange: { from: 'active', to: 'suspended' },
          expectedNotifications: ['student_email', 'parent_email', 'admin_notification'],
          urgency: 'high'
        },
        {
          statusChange: { from: 'pending', to: 'active' },
          expectedNotifications: ['welcome_email', 'parent_notification'],
          urgency: 'normal'
        },
        {
          statusChange: { from: 'active', to: 'graduated' },
          expectedNotifications: ['graduation_certificate', 'congratulations_email', 'parent_notification'],
          urgency: 'normal'
        }
      ]

      for (const trigger of notificationTriggers) {
        const notificationsSent: string[] = []
        
        mockUseMutation.mockReturnValue({
          mutate: mockMutate.mockImplementation((data, { onSuccess }) => {
            // Simulate notification logic
            if (trigger.statusChange.to === 'suspended') {
              notificationsSent.push('student_email', 'parent_email', 'admin_notification')
            } else if (trigger.statusChange.to === 'active') {
              notificationsSent.push('welcome_email', 'parent_notification')
            } else if (trigger.statusChange.to === 'graduated') {
              notificationsSent.push('graduation_certificate', 'congratulations_email', 'parent_notification')
            }
            
            onSuccess(createMockApiResponse({
              status_updated: true,
              notifications_sent: notificationsSent
            }))
          }),
          isLoading: false,
          error: null,
          isSuccess: true,
        })

        render(<StudentsClient />)

        await waitFor(() => {
          expect(screen.getByText(/students/i)).toBeInTheDocument()
        })

        // Simulate status change
        const editButton = screen.getByRole('button', { name: /edit/i })
        await user.click(editButton)

        await waitFor(() => {
          expect(screen.getByRole('dialog')).toBeInTheDocument()
        })

        await user.selectOptions(screen.getByLabelText(/status/i), trigger.statusChange.to)

        const updateButton = screen.getByRole('button', { name: /update/i })
        await user.click(updateButton)

        await waitFor(() => {
          // Should show notification confirmation
          expect(screen.getByText(/notifications sent/i)).toBeInTheDocument()
          
          // Verify expected notifications were triggered
          trigger.expectedNotifications.forEach(notification => {
            expect(notificationsSent).toContain(notification)
          })
        })
      }
    })

    test('should handle emergency contact procedures', async () => {
      const emergencyScenarios = [
        {
          emergencyType: 'medical',
          requiredContacts: ['parent', 'emergency_contact', 'school_nurse'],
          priority: 'immediate'
        },
        {
          emergencyType: 'behavioral',
          requiredContacts: ['parent', 'school_counselor'],
          priority: 'high'
        },
        {
          emergencyType: 'academic_concern',
          requiredContacts: ['parent'],
          priority: 'normal'
        }
      ]

      for (const scenario of emergencyScenarios) {
        const emergencyStudent = generateMockStudent({
          emergency_contact: {
            name: 'Emergency Contact',
            phone: '+998901234567',
            relationship: 'Uncle',
            email: 'emergency@example.com'
          }
        })

        mockUseMutation.mockReturnValue({
          mutate: mockMutate.mockImplementation((data, { onSuccess }) => {
            const contactsNotified: string[] = []
            
            // Simulate emergency contact logic
            scenario.requiredContacts.forEach(contact => {
              contactsNotified.push(contact)
            })
            
            onSuccess(createMockApiResponse({
              emergency_logged: true,
              contacts_notified: contactsNotified,
              priority: scenario.priority
            }))
          }),
          isLoading: false,
          error: null,
          isSuccess: true,
        })

        render(<StudentsClient />)

        await waitFor(() => {
          expect(screen.getByText(/students/i)).toBeInTheDocument()
        })

        // Trigger emergency procedure
        const emergencyButton = screen.getByRole('button', { name: /emergency/i })
        if (emergencyButton) {
          await user.click(emergencyButton)

          await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeInTheDocument()
          })

          await user.selectOptions(screen.getByLabelText(/emergency type/i), scenario.emergencyType)

          const notifyButton = screen.getByRole('button', { name: /notify contacts/i })
          await user.click(notifyButton)

          await waitFor(() => {
            expect(screen.getByText(/emergency contacts notified/i)).toBeInTheDocument()
            
            // Should show confirmation of required contacts
            scenario.requiredContacts.forEach(contact => {
              expect(screen.getByText(new RegExp(contact.replace('_', ' '), 'i'))).toBeInTheDocument()
            })
          })
        }
      }
    })
  })

  describe('10.6 Data Integrity and Business Rules Validation', () => {
    test('should maintain referential integrity in complex operations', async () => {
      const integrityScenarios = [
        {
          operation: 'delete_student_with_grades',
          expectedValidation: 'prevent_deletion',
          reason: 'historical_record_preservation'
        },
        {
          operation: 'change_student_id',
          expectedValidation: 'cascade_updates',
          reason: 'maintain_relationships'
        },
        {
          operation: 'merge_duplicate_students',
          expectedValidation: 'validate_data_consistency',
          reason: 'prevent_data_loss'
        }
      ]

      for (const scenario of integrityScenarios) {
        mockUseMutation.mockReturnValue({
          mutate: mockMutate.mockImplementation((data, { onSuccess, onError }) => {
            if (scenario.operation === 'delete_student_with_grades') {
              onError(createMockApiError(422, 'Cannot delete student with existing grades'))
            } else if (scenario.operation === 'change_student_id') {
              onSuccess(createMockApiResponse({
                id_updated: true,
                related_records_updated: 15
              }))
            } else if (scenario.operation === 'merge_duplicate_students') {
              onSuccess(createMockApiResponse({
                merge_successful: true,
                conflicts_resolved: 3
              }))
            }
          }),
          isLoading: false,
          error: null,
          isSuccess: false,
        })

        render(<StudentsClient />)

        await waitFor(() => {
          expect(screen.getByText(/students/i)).toBeInTheDocument()
        })

        // Simulate complex operation
        const actionButton = screen.getByRole('button', { name: /actions/i })
        await user.click(actionButton)

        await waitFor(() => {
          expect(screen.getByRole('menu')).toBeInTheDocument()
        })

        const operationButton = screen.getByRole('menuitem', { 
          name: new RegExp(scenario.operation.replace(/_/g, ' '), 'i') 
        })
        
        if (operationButton) {
          await user.click(operationButton)

          await waitFor(() => {
            if (scenario.expectedValidation === 'prevent_deletion') {
              expect(screen.getByText(/cannot delete.*grades/i)).toBeInTheDocument()
            } else if (scenario.expectedValidation === 'cascade_updates') {
              expect(screen.getByText(/related records updated/i)).toBeInTheDocument()
            } else if (scenario.expectedValidation === 'validate_data_consistency') {
              expect(screen.getByText(/conflicts resolved/i)).toBeInTheDocument()
            }
          })
        }
      }
    })
  })
})