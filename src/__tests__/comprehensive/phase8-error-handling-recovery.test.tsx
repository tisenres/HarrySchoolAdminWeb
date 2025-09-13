/**
 * PHASE 8: Error Handling & Recovery Testing
 * 
 * Comprehensive testing of error scenarios and recovery mechanisms
 * Testing graceful degradation, error boundaries, retry logic, and user recovery paths
 */

import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorBoundary } from 'react-error-boundary'
import StudentsClient from '@/app/[locale]/(dashboard)/students/students-client'
import { 
  generateStudentDataset, 
  createMockApiResponse,
  createMockApiError,
  createErrorScenarios,
  simulateNetworkFailure,
  simulateTimeoutError
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

// Error boundary for testing
const TestErrorBoundary = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary
    fallback={<div role="alert">Something went wrong</div>}
    onError={(error) => {
      console.error('Error caught by boundary:', error)
    }}
  >
    {children}
  </ErrorBoundary>
)

describe('Phase 8: Error Handling & Recovery Testing', () => {
  let user: ReturnType<typeof userEvent.setup>
  let errorScenarios: ReturnType<typeof createErrorScenarios>
  let mockRefetch: jest.Mock
  let mockMutate: jest.Mock
  
  beforeEach(() => {
    jest.clearAllMocks()
    user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    jest.useFakeTimers()
    
    errorScenarios = createErrorScenarios()
    mockRefetch = jest.fn()
    mockMutate = jest.fn()
    
    // Suppress console errors during tests
    jest.spyOn(console, 'error').mockImplementation(() => {})
    
    // Default successful state
    mockUseQuery.mockReturnValue({
      data: createMockApiResponse(generateStudentDataset(5)),
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
    jest.restoreAllMocks()
  })

  describe('8.1 Network Error Handling', () => {
    test('should handle complete network failure gracefully', async () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('ERR_NETWORK'),
        refetch: mockRefetch,
      })

      render(
        <TestErrorBoundary>
          <StudentsClient />
        </TestErrorBoundary>
      )

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
      })

      // Test retry functionality
      const retryButton = screen.getByRole('button', { name: /retry/i })
      await user.click(retryButton)

      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled()
      })
    })

    test('should handle DNS resolution failures', async () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('ERR_NAME_NOT_RESOLVED'),
        refetch: mockRefetch,
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/connection problem/i)).toBeInTheDocument()
        expect(screen.getByText(/check your internet connection/i)).toBeInTheDocument()
      })
    })

    test('should handle connection timeout errors', async () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('ERR_CONNECTION_TIMED_OUT'),
        refetch: mockRefetch,
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/request timed out/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
      })
    })

    test('should handle intermittent connectivity with auto-retry', async () => {
      let attemptCount = 0
      
      mockUseQuery.mockImplementation(() => {
        attemptCount++
        
        if (attemptCount <= 2) {
          return {
            data: null,
            isLoading: false,
            error: new Error('ERR_INTERNET_DISCONNECTED'),
            refetch: mockRefetch,
          }
        }
        
        return {
          data: createMockApiResponse(generateStudentDataset(5)),
          isLoading: false,
          error: null,
          refetch: mockRefetch,
        }
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/connection lost/i)).toBeInTheDocument()
      })

      // Simulate auto-retry after network recovery
      act(() => {
        jest.advanceTimersByTime(5000) // Auto-retry delay
      })

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
        expect(screen.queryByText(/connection lost/i)).not.toBeInTheDocument()
      })
    })

    test('should show offline mode when network is unavailable', async () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      })

      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('ERR_INTERNET_DISCONNECTED'),
        refetch: mockRefetch,
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/you are offline/i)).toBeInTheDocument()
        expect(screen.getByText(/cached data/i)).toBeInTheDocument()
      })

      // Test online recovery
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      })

      fireEvent(window, new Event('online'))

      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled()
      })
    })
  })

  describe('8.2 Server Error Handling', () => {
    test('should handle 500 internal server errors', async () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: createMockApiError(500, 'Internal server error'),
        refetch: mockRefetch,
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/server error/i)).toBeInTheDocument()
        expect(screen.getByText(/please try again later/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /contact support/i })).toBeInTheDocument()
      })
    })

    test('should handle 503 service unavailable errors', async () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: createMockApiError(503, 'Service temporarily unavailable'),
        refetch: mockRefetch,
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/service unavailable/i)).toBeInTheDocument()
        expect(screen.getByText(/maintenance/i)).toBeInTheDocument()
      })
    })

    test('should handle 502 bad gateway errors', async () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: createMockApiError(502, 'Bad gateway'),
        refetch: mockRefetch,
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/gateway error/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
      })
    })

    test('should handle rate limiting (429 errors)', async () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: createMockApiError(429, 'Too many requests'),
        refetch: mockRefetch,
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/too many requests/i)).toBeInTheDocument()
        expect(screen.getByText(/please slow down/i)).toBeInTheDocument()
      })

      // Should show countdown timer for retry
      expect(screen.getByText(/retry in \d+ seconds/i)).toBeInTheDocument()
    })

    test('should handle server maintenance mode', async () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: createMockApiError(503, 'Scheduled maintenance in progress'),
        refetch: mockRefetch,
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/maintenance mode/i)).toBeInTheDocument()
        expect(screen.getByText(/estimated completion/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /check status/i })).toBeInTheDocument()
      })
    })
  })

  describe('8.3 Data Validation and Format Errors', () => {
    test('should handle malformed API responses', async () => {
      mockUseQuery.mockReturnValue({
        data: {
          // Malformed response
          invalidField: 'not expected',
          data: 'should be array but is string',
          pagination: null
        },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/data format error/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument()
      })
    })

    test('should handle corrupted student data', async () => {
      const corruptedData = generateStudentDataset(3).map(student => ({
        ...student,
        // Corrupt various fields
        first_name: null,
        date_of_birth: 'invalid-date-format',
        email: 12345, // Wrong type
        address: 'should be object but is string',
      }))

      mockUseQuery.mockReturnValue({
        data: createMockApiResponse(corruptedData),
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      render(<StudentsClient />)

      await waitFor(() => {
        // Should show students with error indicators for corrupt data
        expect(screen.getByText(/students/i)).toBeInTheDocument()
        expect(screen.getAllByText(/invalid data/i)).toHaveLength(3)
      })
    })

    test('should handle schema version mismatches', async () => {
      mockUseQuery.mockReturnValue({
        data: {
          version: '1.0.0',
          data: generateStudentDataset(5),
          schema_version: 'v2.0.0', // Newer schema
        },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/data incompatible/i)).toBeInTheDocument()
        expect(screen.getByText(/please refresh/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument()
      })
    })

    test('should handle missing required fields', async () => {
      const incompleteData = generateStudentDataset(3).map(student => ({
        id: student.id,
        // Missing required fields like first_name, last_name
      }))

      mockUseQuery.mockReturnValue({
        data: createMockApiResponse(incompleteData),
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/incomplete data/i)).toBeInTheDocument()
        expect(screen.getAllByText(/missing information/i)).toHaveLength(3)
      })
    })
  })

  describe('8.4 CRUD Operation Error Recovery', () => {
    test('should handle create operation failures with retry', async () => {
      let attemptCount = 0
      
      mockUseMutation.mockReturnValue({
        mutate: mockMutate.mockImplementation((data, { onError, onSuccess }) => {
          attemptCount++
          
          if (attemptCount <= 2) {
            onError(createMockApiError(500, 'Temporary server error'))
          } else {
            onSuccess(createMockApiResponse({ id: 'new-student' }))
          }
        }),
        isLoading: false,
        error: attemptCount <= 2 ? new Error('Temporary server error') : null,
        isSuccess: attemptCount > 2,
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Open create form
      const addButton = screen.getByRole('button', { name: /add student/i })
      await user.click(addButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Fill required fields
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/failed to create/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
      })

      // Retry operation
      const retryButton = screen.getByRole('button', { name: /retry/i })
      await user.click(retryButton)

      await waitFor(() => {
        expect(screen.getByText(/failed to create/i)).toBeInTheDocument()
      })

      // Third attempt should succeed
      await user.click(retryButton)

      await waitFor(() => {
        expect(screen.getByText(/student created/i)).toBeInTheDocument()
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    test('should handle update conflicts with merge options', async () => {
      mockUseMutation.mockReturnValue({
        mutate: mockMutate.mockImplementation((data, { onError }) => {
          onError(createMockApiError(409, 'Student was modified by another user'))
        }),
        isLoading: false,
        error: new Error('Student was modified by another user'),
        isSuccess: false,
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Open edit form
      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      await user.click(editButtons[0])

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Make changes
      await user.type(screen.getByLabelText(/first name/i), ' Updated')

      // Submit update
      const updateButton = screen.getByRole('button', { name: /update/i })
      await user.click(updateButton)

      await waitFor(() => {
        expect(screen.getByText(/conflict detected/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /merge changes/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /overwrite/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /discard my changes/i })).toBeInTheDocument()
      })
    })

    test('should handle delete operation failures with consequences', async () => {
      mockUseMutation.mockReturnValue({
        mutate: mockMutate.mockImplementation((data, { onError }) => {
          onError(createMockApiError(409, 'Cannot delete student with active enrollments'))
        }),
        isLoading: false,
        error: new Error('Cannot delete student with active enrollments'),
        isSuccess: false,
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      await user.click(deleteButtons[0])

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(screen.getByText(/cannot delete/i)).toBeInTheDocument()
        expect(screen.getByText(/active enrollments/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /remove from groups first/i })).toBeInTheDocument()
      })
    })

    test('should handle bulk operation partial failures', async () => {
      const partialFailures = {
        successful: ['student-1', 'student-3'],
        failed: [
          { id: 'student-2', error: 'Validation error' },
          { id: 'student-4', error: 'Permission denied' }
        ]
      }

      mockUseMutation.mockReturnValue({
        mutate: mockMutate.mockImplementation((data, { onSuccess }) => {
          onSuccess(createMockApiResponse(partialFailures))
        }),
        isLoading: false,
        error: null,
        isSuccess: true,
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Select multiple students
      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all/i })
      await user.click(selectAllCheckbox)

      // Perform bulk action
      const bulkButton = screen.getByRole('button', { name: /bulk actions/i })
      await user.click(bulkButton)

      const deleteOption = screen.getByRole('menuitem', { name: /delete selected/i })
      await user.click(deleteOption)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /delete/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(screen.getByText(/partial success/i)).toBeInTheDocument()
        expect(screen.getByText(/2 successful/i)).toBeInTheDocument()
        expect(screen.getByText(/2 failed/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /view details/i })).toBeInTheDocument()
      })
    })
  })

  describe('8.5 JavaScript Runtime Error Recovery', () => {
    test('should handle JavaScript exceptions gracefully', async () => {
      // Mock a component that throws an error
      const ThrowingComponent = () => {
        throw new Error('Simulated JavaScript error')
      }

      render(
        <TestErrorBoundary>
          <ThrowingComponent />
        </TestErrorBoundary>
      )

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong')
      })
    })

    test('should handle memory exhaustion gracefully', async () => {
      // Simulate out of memory error
      const originalError = console.error
      console.error = jest.fn()

      mockUseQuery.mockImplementation(() => {
        throw new Error('Maximum call stack size exceeded')
      })

      render(
        <TestErrorBoundary>
          <StudentsClient />
        </TestErrorBoundary>
      )

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      console.error = originalError
    })

    test('should handle circular reference errors', async () => {
      const circularData = generateStudentDataset(1)
      // Create circular reference
      ;(circularData[0] as any).self = circularData[0]

      mockUseQuery.mockReturnValue({
        data: createMockApiResponse(circularData),
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      render(
        <TestErrorBoundary>
          <StudentsClient />
        </TestErrorBoundary>
      )

      await waitFor(() => {
        // Should handle circular references without crashing
        expect(
          screen.getByText(/students/i) || screen.getByRole('alert')
        ).toBeInTheDocument()
      })
    })

    test('should handle undefined function calls', async () => {
      mockUseQuery.mockReturnValue({
        data: createMockApiResponse(generateStudentDataset(5)),
        isLoading: false,
        error: null,
        refetch: undefined, // Undefined function
      })

      render(
        <TestErrorBoundary>
          <StudentsClient />
        </TestErrorBoundary>
      )

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Try to trigger the undefined function
      const refreshButton = screen.queryByRole('button', { name: /refresh/i })
      if (refreshButton) {
        await user.click(refreshButton)
        
        await waitFor(() => {
          // Should handle undefined function gracefully
          expect(
            screen.getByText(/students/i) || screen.getByRole('alert')
          ).toBeInTheDocument()
        })
      }
    })
  })

  describe('8.6 Browser Compatibility Error Recovery', () => {
    test('should handle missing modern browser APIs', async () => {
      // Remove modern APIs
      const originalFetch = global.fetch
      const originalIntersectionObserver = global.IntersectionObserver
      
      delete (global as any).fetch
      delete (global as any).IntersectionObserver

      render(
        <TestErrorBoundary>
          <StudentsClient />
        </TestErrorBoundary>
      )

      await waitFor(() => {
        // Should provide fallbacks or error messages for missing APIs
        expect(
          screen.getByText(/browser not supported/i) ||
          screen.getByText(/students/i) ||
          screen.getByRole('alert')
        ).toBeInTheDocument()
      })

      // Restore APIs
      global.fetch = originalFetch
      global.IntersectionObserver = originalIntersectionObserver
    })

    test('should handle localStorage access denied', async () => {
      const originalLocalStorage = global.localStorage
      
      Object.defineProperty(global, 'localStorage', {
        value: {
          getItem: jest.fn(() => { throw new Error('Access denied') }),
          setItem: jest.fn(() => { throw new Error('Access denied') }),
          removeItem: jest.fn(() => { throw new Error('Access denied') }),
          clear: jest.fn(() => { throw new Error('Access denied') }),
        },
        writable: true,
      })

      render(<StudentsClient />)

      await waitFor(() => {
        // Should work without localStorage
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      global.localStorage = originalLocalStorage
    })

    test('should handle cookie access restrictions', async () => {
      const originalDocument = global.document
      
      Object.defineProperty(global, 'document', {
        value: {
          ...originalDocument,
          cookie: {
            get: () => { throw new Error('Cookie access denied') },
            set: () => { throw new Error('Cookie access denied') },
          },
        },
        writable: true,
      })

      render(<StudentsClient />)

      await waitFor(() => {
        // Should work without cookie access
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      global.document = originalDocument
    })
  })

  describe('8.7 Progressive Error Recovery', () => {
    test('should implement exponential backoff for retries', async () => {
      let attemptCount = 0
      const retryDelays: number[] = []
      
      mockUseQuery.mockImplementation(() => {
        attemptCount++
        
        if (attemptCount <= 3) {
          return {
            data: null,
            isLoading: false,
            error: new Error('Temporary failure'),
            refetch: jest.fn().mockImplementation(() => {
              const delay = Math.pow(2, attemptCount - 1) * 1000 // Exponential backoff
              retryDelays.push(delay)
              return Promise.resolve()
            }),
          }
        }
        
        return {
          data: createMockApiResponse(generateStudentDataset(5)),
          isLoading: false,
          error: null,
          refetch: jest.fn(),
        }
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument()
      })

      // Trigger retries
      const retryButton = screen.getByRole('button', { name: /retry/i })
      
      for (let i = 0; i < 3; i++) {
        await user.click(retryButton)
        act(() => {
          jest.advanceTimersByTime(retryDelays[i] || 1000)
        })
      }

      // Should eventually succeed
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Verify exponential backoff pattern
      expect(retryDelays).toEqual([1000, 2000, 4000])
    })

    test('should implement circuit breaker pattern', async () => {
      let failureCount = 0
      const maxFailures = 3
      
      mockUseQuery.mockImplementation(() => {
        failureCount++
        
        if (failureCount >= maxFailures) {
          return {
            data: null,
            isLoading: false,
            error: new Error('Circuit breaker open'),
            refetch: jest.fn(),
          }
        }
        
        return {
          data: null,
          isLoading: false,
          error: new Error('Service failure'),
          refetch: jest.fn().mockImplementation(() => {
            failureCount++
            return Promise.reject(new Error('Service failure'))
          }),
        }
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument()
      })

      const retryButton = screen.getByRole('button', { name: /retry/i })

      // Trigger failures to reach circuit breaker threshold
      for (let i = 0; i < maxFailures; i++) {
        await user.click(retryButton)
      }

      await waitFor(() => {
        expect(screen.getByText(/circuit breaker/i)).toBeInTheDocument()
        expect(screen.getByText(/service temporarily disabled/i)).toBeInTheDocument()
      })
    })

    test('should provide graceful degradation options', async () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Primary service unavailable'),
        refetch: mockRefetch,
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/service unavailable/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /use cached data/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /offline mode/i })).toBeInTheDocument()
      })

      // Test graceful degradation
      const offlineModeButton = screen.getByRole('button', { name: /offline mode/i })
      await user.click(offlineModeButton)

      await waitFor(() => {
        expect(screen.getByText(/offline mode active/i)).toBeInTheDocument()
        expect(screen.getByText(/limited functionality/i)).toBeInTheDocument()
      })
    })

    test('should provide user-friendly error reporting', async () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Complex technical error: Database connection pool exhausted'),
        refetch: mockRefetch,
      })

      render(<StudentsClient />)

      await waitFor(() => {
        // Should show user-friendly message instead of technical details
        expect(screen.getByText(/having trouble loading data/i)).toBeInTheDocument()
        expect(screen.queryByText(/database connection pool/i)).not.toBeInTheDocument()
        
        // But provide option to see technical details
        expect(screen.getByRole('button', { name: /technical details/i })).toBeInTheDocument()
      })

      // Show technical details when requested
      const detailsButton = screen.getByRole('button', { name: /technical details/i })
      await user.click(detailsButton)

      await waitFor(() => {
        expect(screen.getByText(/database connection pool/i)).toBeInTheDocument()
      })
    })
  })

  describe('8.8 Data Recovery and Consistency', () => {
    test('should detect and recover from data corruption', async () => {
      const corruptedData = {
        data: ['not', 'an', 'array', 'of', 'objects'],
        pagination: 'should be object',
        success: 'true' // Should be boolean
      }

      mockUseQuery.mockReturnValue({
        data: corruptedData,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/data corruption detected/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /reload clean data/i })).toBeInTheDocument()
      })

      const reloadButton = screen.getByRole('button', { name: /reload clean data/i })
      await user.click(reloadButton)

      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled()
      })
    })

    test('should handle version conflicts in optimistic updates', async () => {
      mockUseMutation.mockReturnValue({
        mutate: mockMutate.mockImplementation((data, { onError }) => {
          onError(createMockApiError(412, 'Precondition failed: Version mismatch'))
        }),
        isLoading: false,
        error: new Error('Precondition failed: Version mismatch'),
        isSuccess: false,
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Perform optimistic update
      const editButton = screen.getAllByRole('button', { name: /edit/i })[0]
      await user.click(editButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/first name/i), ' Updated')
      const updateButton = screen.getByRole('button', { name: /update/i })
      await user.click(updateButton)

      await waitFor(() => {
        expect(screen.getByText(/version conflict/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /refresh and retry/i })).toBeInTheDocument()
      })
    })

    test('should provide data export before critical operations', async () => {
      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Select all students for bulk delete
      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all/i })
      await user.click(selectAllCheckbox)

      const bulkButton = screen.getByRole('button', { name: /bulk actions/i })
      await user.click(bulkButton)

      const deleteOption = screen.getByRole('menuitem', { name: /delete selected/i })
      await user.click(deleteOption)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText(/critical operation/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /export backup first/i })).toBeInTheDocument()
      })
    })
  })
})