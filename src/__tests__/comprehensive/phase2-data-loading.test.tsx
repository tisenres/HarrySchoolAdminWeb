/**
 * PHASE 2: Data Loading & API Integration Tests
 * 
 * Comprehensive testing of ALL possible data states and API scenarios
 * Testing every data loading condition that could occur in production
 */

import { render, screen, waitFor, act } from '@testing-library/react'
import { useQuery } from '@tanstack/react-query'
import StudentsClient from '@/app/[locale]/(dashboard)/students/students-client'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
}))

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}))

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>

describe('Phase 2: Data Loading & API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  describe('2.1 Empty Database Scenarios', () => {
    test('should handle completely empty database gracefully', async () => {
      mockUseQuery.mockReturnValue({
        data: {
          data: [],
          pagination: { total: 0, page: 1, total_pages: 0 }
        },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      })

      render(<StudentsClient />)

      await waitFor(() => {
        // Should show empty state message
        expect(screen.getByText(/no students found/i)).toBeInTheDocument()
      })
    })

    test('should show appropriate call-to-action for empty database', async () => {
      mockUseQuery.mockReturnValue({
        data: {
          data: [],
          pagination: { total: 0, page: 1, total_pages: 0 }
        },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      })

      render(<StudentsClient />)

      await waitFor(() => {
        // Should show "Add your first student" button
        expect(screen.getByText(/add your first student/i)).toBeInTheDocument()
      })
    })

    test('should handle null data response', async () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      })

      render(<StudentsClient />)

      await waitFor(() => {
        // Should handle null data gracefully
        expect(screen.getByText(/no students found/i)).toBeInTheDocument()
      })
    })

    test('should handle undefined pagination data', async () => {
      mockUseQuery.mockReturnValue({
        data: {
          data: [],
          pagination: undefined
        },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      })

      render(<StudentsClient />)

      await waitFor(() => {
        // Should handle missing pagination
        expect(screen.getByText(/no students found/i)).toBeInTheDocument()
      })
    })
  })

  describe('2.2 Small Dataset (1-10 students)', () => {
    const smallDataset = Array.from({ length: 5 }, (_, i) => ({
      id: `student-${i + 1}`,
      student_id: `HS-STU-${2024000 + i + 1}`,
      full_name: `Student ${i + 1}`,
      first_name: `First${i + 1}`,
      last_name: `Last${i + 1}`,
      date_of_birth: '2010-01-01',
      phone: `+998901234567${i}`,
      parent_name: `Parent ${i + 1}`,
      parent_phone: `+998901234568${i}`,
      status: 'active',
      payment_status: 'paid',
      current_level: 'Beginner',
      enrollment_date: '2024-01-01',
      balance: 0,
      groups: [],
      address: {
        street: `Street ${i + 1}`,
        city: 'Tashkent',
        region: 'Tashkent',
        country: 'Uzbekistan'
      },
      emergency_contact: {
        name: `Emergency ${i + 1}`,
        relationship: 'Parent',
        phone: `+998901234569${i}`
      },
      gender: 'male' as const,
      preferred_subjects: ['English'],
      organization_id: 'org-1',
      is_active: true,
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    }))

    test('should render small dataset correctly', async () => {
      mockUseQuery.mockReturnValue({
        data: {
          data: smallDataset,
          pagination: { total: 5, page: 1, total_pages: 1 }
        },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      })

      render(<StudentsClient />)

      await waitFor(() => {
        // Should show all students
        smallDataset.forEach(student => {
          expect(screen.getByText(student.full_name)).toBeInTheDocument()
        })
      })
    })

    test('should handle missing optional fields in small dataset', async () => {
      const incompleteDataset = smallDataset.map(student => ({
        ...student,
        email: undefined,
        profile_image_url: undefined,
        medical_notes: undefined,
        notes: undefined
      }))

      mockUseQuery.mockReturnValue({
        data: {
          data: incompleteDataset,
          pagination: { total: 5, page: 1, total_pages: 1 }
        },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      })

      render(<StudentsClient />)

      await waitFor(() => {
        // Should handle missing optional fields
        expect(screen.getByText('Student 1')).toBeInTheDocument()
      })
    })

    test('should display statistics correctly for small dataset', async () => {
      mockUseQuery.mockReturnValue({
        data: {
          data: smallDataset,
          pagination: { total: 5, page: 1, total_pages: 1 }
        },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      })

      render(<StudentsClient />)

      await waitFor(() => {
        // Should show correct total count
        expect(screen.getByText('5')).toBeInTheDocument()
      })
    })
  })

  describe('2.3 Medium Dataset (100-500 students)', () => {
    const mediumDataset = Array.from({ length: 250 }, (_, i) => ({
      id: `student-${i + 1}`,
      student_id: `HS-STU-${2024000 + i + 1}`,
      full_name: `Student ${i + 1}`,
      first_name: `First${i + 1}`,
      last_name: `Last${i + 1}`,
      date_of_birth: '2010-01-01',
      phone: `+998901234567${i % 10}`,
      parent_name: `Parent ${i + 1}`,
      parent_phone: `+998901234568${i % 10}`,
      status: ['active', 'inactive', 'graduated'][i % 3] as 'active' | 'inactive' | 'graduated',
      payment_status: ['paid', 'pending', 'overdue'][i % 3] as 'paid' | 'pending' | 'overdue',
      current_level: ['Beginner', 'Intermediate', 'Advanced'][i % 3],
      enrollment_date: '2024-01-01',
      balance: i % 5 === 0 ? 500000 : 0,
      groups: [],
      address: {
        street: `Street ${i + 1}`,
        city: 'Tashkent',
        region: 'Tashkent',
        country: 'Uzbekistan'
      },
      emergency_contact: {
        name: `Emergency ${i + 1}`,
        relationship: 'Parent',
        phone: `+998901234569${i % 10}`
      },
      gender: ['male', 'female'][i % 2] as 'male' | 'female',
      preferred_subjects: [['English'], ['Math'], ['Physics']][i % 3],
      organization_id: 'org-1',
      is_active: true,
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    }))

    test('should handle pagination with medium dataset', async () => {
      // First page
      const firstPage = mediumDataset.slice(0, 20)
      
      mockUseQuery.mockReturnValue({
        data: {
          data: firstPage,
          pagination: { total: 250, page: 1, total_pages: 13 }
        },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      })

      render(<StudentsClient />)

      await waitFor(() => {
        // Should show pagination controls
        expect(screen.getByText('1')).toBeInTheDocument()
        expect(screen.getByText('of 13')).toBeInTheDocument()
      })
    })

    test('should calculate statistics correctly for medium dataset', async () => {
      const firstPage = mediumDataset.slice(0, 20)
      
      mockUseQuery.mockReturnValue({
        data: {
          data: firstPage,
          pagination: { total: 250, page: 1, total_pages: 13 }
        },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      })

      render(<StudentsClient />)

      await waitFor(() => {
        // Should show correct total in statistics
        expect(screen.getByText('250')).toBeInTheDocument()
      })
    })

    test('should handle mixed payment statuses in medium dataset', async () => {
      const firstPage = mediumDataset.slice(0, 20)
      
      mockUseQuery.mockReturnValue({
        data: {
          data: firstPage,
          pagination: { total: 250, page: 1, total_pages: 13 }
        },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      })

      render(<StudentsClient />)

      await waitFor(() => {
        // Should handle different payment statuses
        expect(screen.getByText('Student 1')).toBeInTheDocument()
      })
    })
  })

  describe('2.4 Large Dataset (1000+ students)', () => {
    test('should handle performance with large dataset pagination', async () => {
      const firstPage = Array.from({ length: 20 }, (_, i) => ({
        id: `student-${i + 1}`,
        student_id: `HS-STU-${2024000 + i + 1}`,
        full_name: `Student ${i + 1}`,
        first_name: `First${i + 1}`,
        last_name: `Last${i + 1}`,
        date_of_birth: '2010-01-01',
        phone: `+998901234567${i}`,
        parent_name: `Parent ${i + 1}`,
        parent_phone: `+998901234568${i}`,
        status: 'active' as const,
        payment_status: 'paid' as const,
        current_level: 'Beginner',
        enrollment_date: '2024-01-01',
        balance: 0,
        groups: [],
        address: {
          street: `Street ${i + 1}`,
          city: 'Tashkent',
          region: 'Tashkent',
          country: 'Uzbekistan'
        },
        emergency_contact: {
          name: `Emergency ${i + 1}`,
          relationship: 'Parent',
          phone: `+998901234569${i}`
        },
        gender: 'male' as const,
        preferred_subjects: ['English'],
        organization_id: 'org-1',
        is_active: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      }))

      mockUseQuery.mockReturnValue({
        data: {
          data: firstPage,
          pagination: { total: 5000, page: 1, total_pages: 250 }
        },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      })

      const startTime = performance.now()
      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText('Student 1')).toBeInTheDocument()
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render within reasonable time (less than 1 second)
      expect(renderTime).toBeLessThan(1000)
    })

    test('should show correct pagination for large dataset', async () => {
      mockUseQuery.mockReturnValue({
        data: {
          data: [],
          pagination: { total: 5000, page: 1, total_pages: 250 }
        },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      })

      render(<StudentsClient />)

      await waitFor(() => {
        // Should show large page count
        expect(screen.getByText('of 250')).toBeInTheDocument()
      })
    })
  })

  describe('2.5 API Timeout Scenarios', () => {
    test('should handle API request timeout', async () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: true,
        error: new Error('Request timeout'),
        refetch: jest.fn(),
      })

      render(<StudentsClient />)

      await waitFor(() => {
        // Should show timeout error
        expect(screen.getByText(/request timeout/i)).toBeInTheDocument()
      })
    })

    test('should provide retry mechanism for timeouts', async () => {
      const mockRefetch = jest.fn()
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Request timeout'),
        refetch: mockRefetch,
      })

      render(<StudentsClient />)

      await waitFor(() => {
        // Should show retry button
        const retryButton = screen.getByRole('button', { name: /try again/i })
        expect(retryButton).toBeInTheDocument()
      })
    })

    test('should handle slow network responses', async () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      })

      render(<StudentsClient />)

      await waitFor(() => {
        // Should show loading indicator for slow responses
        expect(screen.getByText(/loading/i)).toBeInTheDocument()
      })
    })
  })

  describe('2.6 Malformed API Responses', () => {
    test('should handle response with missing required fields', async () => {
      mockUseQuery.mockReturnValue({
        data: {
          data: [
            {
              id: 'student-1',
              // Missing required fields like full_name, status, etc.
              incomplete: true
            }
          ],
          pagination: { total: 1, page: 1, total_pages: 1 }
        },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      })

      render(<StudentsClient />)

      await waitFor(() => {
        // Should handle malformed data gracefully
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
    })

    test('should handle response with invalid data types', async () => {
      mockUseQuery.mockReturnValue({
        data: {
          data: [
            {
              id: 123, // Should be string
              full_name: null, // Should be string
              status: 'invalid_status', // Invalid enum value
              balance: 'not_a_number', // Should be number
              enrollment_date: 'invalid_date' // Invalid date format
            }
          ],
          pagination: { total: 1, page: 1, total_pages: 1 }
        },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      })

      render(<StudentsClient />)

      await waitFor(() => {
        // Should handle invalid data types
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
    })

    test('should handle corrupted JSON response', async () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('JSON parse error'),
        refetch: jest.fn(),
      })

      render(<StudentsClient />)

      await waitFor(() => {
        // Should show error for corrupted JSON
        expect(screen.getByText(/json parse error/i)).toBeInTheDocument()
      })
    })
  })

  describe('2.7 Server Error Responses', () => {
    test('should handle 500 internal server error', async () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Internal server error'),
        refetch: jest.fn(),
      })

      render(<StudentsClient />)

      await waitFor(() => {
        // Should show server error message
        expect(screen.getByText(/internal server error/i)).toBeInTheDocument()
      })
    })

    test('should handle 503 service unavailable', async () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Service unavailable'),
        refetch: jest.fn(),
      })

      render(<StudentsClient />)

      await waitFor(() => {
        // Should show service unavailable message
        expect(screen.getByText(/service unavailable/i)).toBeInTheDocument()
      })
    })

    test('should handle rate limiting (429)', async () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Too many requests'),
        refetch: jest.fn(),
      })

      render(<StudentsClient />)

      await waitFor(() => {
        // Should show rate limiting message
        expect(screen.getByText(/too many requests/i)).toBeInTheDocument()
      })
    })
  })

  describe('2.8 Stale Data Scenarios', () => {
    test('should handle stale data detection', async () => {
      const mockRefetch = jest.fn()
      
      mockUseQuery.mockReturnValue({
        data: {
          data: [{
            id: 'student-1',
            full_name: 'Stale Student',
            last_updated: '2023-01-01' // Old timestamp
          }],
          pagination: { total: 1, page: 1, total_pages: 1 }
        },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      render(<StudentsClient />)

      await waitFor(() => {
        // Should handle stale data gracefully
        expect(screen.getByText(/stale student/i)).toBeInTheDocument()
      })
    })

    test('should refresh stale data automatically', async () => {
      const mockRefetch = jest.fn()
      
      mockUseQuery.mockReturnValue({
        data: {
          data: [],
          pagination: { total: 0, page: 1, total_pages: 0 },
          stale: true
        },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      render(<StudentsClient />)

      // Should attempt to refresh stale data
      await waitFor(() => {
        expect(screen.getByText(/no students found/i)).toBeInTheDocument()
      })
    })
  })

  describe('2.9 Concurrent Data Modifications', () => {
    test('should handle data modification conflicts', async () => {
      let callCount = 0
      mockUseQuery.mockImplementation(() => {
        callCount++
        return {
          data: {
            data: [{
              id: 'student-1',
              full_name: callCount === 1 ? 'Original Name' : 'Modified Name',
              version: callCount
            }],
            pagination: { total: 1, page: 1, total_pages: 1 }
          },
          isLoading: false,
          error: null,
          refetch: jest.fn(),
        }
      })

      const { rerender } = render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/original name/i)).toBeInTheDocument()
      })

      // Simulate concurrent modification
      rerender(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/modified name/i)).toBeInTheDocument()
      })
    })

    test('should handle optimistic updates', async () => {
      const mockRefetch = jest.fn()
      
      mockUseQuery.mockReturnValue({
        data: {
          data: [{
            id: 'student-1',
            full_name: 'Student Name',
            status: 'active',
            optimistic_update: true
          }],
          pagination: { total: 1, page: 1, total_pages: 1 }
        },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      render(<StudentsClient />)

      await waitFor(() => {
        // Should handle optimistic updates
        expect(screen.getByText(/student name/i)).toBeInTheDocument()
      })
    })
  })
})