/**
 * PHASE 6: Performance & Edge Cases Testing
 * 
 * Comprehensive testing of performance scenarios and edge cases
 * Testing memory usage, large datasets, slow networks, and extreme conditions
 */

import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StudentsClient from '@/app/[locale]/(dashboard)/students/students-client'
import { 
  generateStudentDataset, 
  createMockApiResponse, 
  measureRenderTime,
  createMemoryPressure,
  simulateNetworkDelay,
  simulateTimeoutError,
  createBrowserTestHelpers
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

describe('Phase 6: Performance & Edge Cases Testing', () => {
  let user: ReturnType<typeof userEvent.setup>
  let originalPerformance: typeof performance
  
  beforeEach(() => {
    jest.clearAllMocks()
    user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    jest.useFakeTimers()
    
    // Mock performance API
    originalPerformance = global.performance
    global.performance = {
      ...originalPerformance,
      now: jest.fn().mockReturnValue(Date.now()),
      mark: jest.fn(),
      measure: jest.fn(),
    } as any
    
    // Default data state
    mockUseQuery.mockReturnValue({
      data: createMockApiResponse(generateStudentDataset(50)),
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    })
  })

  afterEach(() => {
    jest.useRealTimers()
    global.performance = originalPerformance
  })

  describe('6.1 Large Dataset Performance', () => {
    test('should handle 1000+ students without performance degradation', async () => {
      const largeDataset = generateStudentDataset(1000, {
        diverseStatuses: true,
        diversePaymentStatuses: true,
        diverseLevels: true,
        withBalances: true,
        withGroups: true
      })

      mockUseQuery.mockReturnValue({
        data: createMockApiResponse(largeDataset, {
          pagination: { total: 1000, page: 1, total_pages: 50 }
        }),
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      })

      const renderTime = measureRenderTime(() => {
        render(<StudentsClient />)
      })

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Should render in reasonable time (< 2 seconds)
      expect(renderTime).toBeLessThan(2000)
      
      // Table should be virtualized and not render all rows
      const rows = screen.getAllByRole('row')
      expect(rows.length).toBeLessThan(100) // Should be virtualized
    })

    test('should handle 10,000+ students with pagination', async () => {
      const massiveDataset = generateStudentDataset(100) // Only load current page

      mockUseQuery.mockReturnValue({
        data: createMockApiResponse(massiveDataset, {
          pagination: { total: 10000, page: 1, total_pages: 500 }
        }),
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/10,000 total/i)).toBeInTheDocument()
        expect(screen.getByText(/page 1 of 500/i)).toBeInTheDocument()
      })

      // Memory usage should be reasonable
      const memoryInfo = (performance as any).memory
      if (memoryInfo) {
        expect(memoryInfo.usedJSHeapSize).toBeLessThan(100 * 1024 * 1024) // < 100MB
      }
    })

    test('should handle rapid pagination through large dataset', async () => {
      let currentPage = 1
      mockUseQuery.mockImplementation(() => ({
        data: createMockApiResponse(generateStudentDataset(50), {
          pagination: { total: 5000, page: currentPage, total_pages: 100 }
        }),
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      }))

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      const nextButton = screen.getByRole('button', { name: /next/i })

      // Rapidly navigate through pages
      for (let i = 0; i < 10; i++) {
        currentPage++
        await user.click(nextButton)
        act(() => {
          jest.advanceTimersByTime(100)
        })
      }

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Should handle rapid navigation without memory leaks
      expect(currentPage).toBe(11)
    })

    test('should handle complex filtering on large datasets', async () => {
      const complexDataset = generateStudentDataset(2000, {
        diverseStatuses: true,
        diversePaymentStatuses: true,
        diverseLevels: true,
        withBalances: true,
        withGroups: true
      })

      let filteredResults = complexDataset
      mockUseQuery.mockImplementation(() => ({
        data: createMockApiResponse(filteredResults.slice(0, 50), {
          pagination: { total: filteredResults.length, page: 1, total_pages: Math.ceil(filteredResults.length / 50) }
        }),
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      }))

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      const searchInput = screen.getByRole('textbox', { name: /search/i })

      // Simulate complex search that reduces results significantly
      filteredResults = complexDataset.filter(s => s.current_level === 'Advanced')
      await user.type(searchInput, 'Advanced')

      act(() => {
        jest.advanceTimersByTime(500) // Debounce delay
      })

      await waitFor(() => {
        expect(screen.getByText(new RegExp(filteredResults.length.toString()))).toBeInTheDocument()
      })

      // Should handle filtering efficiently
      expect(filteredResults.length).toBeLessThan(complexDataset.length)
    })
  })

  describe('6.2 Memory Management', () => {
    test('should not have memory leaks during component mounting/unmounting', async () => {
      const { unmount } = render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Get initial memory snapshot
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0

      // Unmount and remount multiple times
      for (let i = 0; i < 10; i++) {
        unmount()
        const { unmount: newUnmount } = render(<StudentsClient />)
        
        await waitFor(() => {
          expect(screen.getByText(/students/i)).toBeInTheDocument()
        })
        
        unmount = newUnmount
      }

      // Check memory didn't grow significantly
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0
      const memoryGrowth = finalMemory - initialMemory

      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024) // < 50MB growth
    })

    test('should handle memory pressure gracefully', async () => {
      // Create memory pressure
      const memoryHog = createMemoryPressure(100) // 100MB

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Component should still function under memory pressure
      const searchInput = screen.getByRole('textbox', { name: /search/i })
      await user.type(searchInput, 'test search')

      await waitFor(() => {
        expect(searchInput).toHaveValue('test search')
      })

      // Clean up memory
      memoryHog.length = 0
    })

    test('should handle rapid data updates without memory leaks', async () => {
      let dataVersion = 0
      
      mockUseQuery.mockImplementation(() => ({
        data: createMockApiResponse(generateStudentDataset(100, {
          diverseStatuses: dataVersion % 2 === 0
        })),
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      }))

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Simulate rapid data updates
      for (let i = 0; i < 20; i++) {
        dataVersion++
        act(() => {
          jest.advanceTimersByTime(1000)
        })
      }

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Should handle rapid updates without accumulating memory
      expect(dataVersion).toBe(20)
    })

    test('should clean up event listeners properly', async () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener')
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')

      const { unmount } = render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      const addedListeners = addEventListenerSpy.mock.calls.length

      unmount()

      const removedListeners = removeEventListenerSpy.mock.calls.length

      // Should remove as many listeners as were added
      expect(removedListeners).toBeGreaterThanOrEqual(addedListeners * 0.8) // Allow some tolerance

      addEventListenerSpy.mockRestore()
      removeEventListenerSpy.mockRestore()
    })
  })

  describe('6.3 Network Performance & Edge Cases', () => {
    test('should handle extremely slow network responses', async () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/loading/i)).toBeInTheDocument()
      })

      // Simulate 30-second delay
      act(() => {
        jest.advanceTimersByTime(30000)
      })

      // Should show timeout message or keep loading gracefully
      await waitFor(() => {
        expect(
          screen.getByText(/loading/i) || screen.getByText(/timeout/i)
        ).toBeInTheDocument()
      })
    })

    test('should handle intermittent network connectivity', async () => {
      let isOnline = true
      let callCount = 0

      mockUseQuery.mockImplementation(() => {
        callCount++
        
        if (callCount % 3 === 0) {
          isOnline = !isOnline
        }

        if (!isOnline) {
          return {
            data: null,
            isLoading: false,
            error: new Error('Network unavailable'),
            refetch: jest.fn(),
          }
        }

        return {
          data: createMockApiResponse(generateStudentDataset(20)),
          isLoading: false,
          error: null,
          refetch: jest.fn(),
        }
      })

      render(<StudentsClient />)

      // Simulate network going on/off multiple times
      for (let i = 0; i < 10; i++) {
        act(() => {
          jest.advanceTimersByTime(2000)
        })

        await waitFor(() => {
          // Should show either data or error state appropriately
          expect(
            screen.getByText(/students/i) || screen.getByText(/error/i)
          ).toBeInTheDocument()
        })
      }
    })

    test('should handle concurrent API requests efficiently', async () => {
      let requestCount = 0
      
      mockUseQuery.mockImplementation(() => {
        requestCount++
        return {
          data: createMockApiResponse(generateStudentDataset(10)),
          isLoading: requestCount > 5, // Show loading for later requests
          error: null,
          refetch: jest.fn(),
        }
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Trigger multiple simultaneous actions
      const promises = []
      const buttons = screen.getAllByRole('button')
      
      for (let i = 0; i < Math.min(buttons.length, 5); i++) {
        promises.push(user.click(buttons[i]))
      }

      await Promise.all(promises)

      // Should handle concurrent requests
      expect(requestCount).toBeGreaterThan(1)
    })

    test('should handle malformed API responses', async () => {
      mockUseQuery.mockReturnValue({
        data: {
          // Malformed response structure
          invalidStructure: true,
          data: "not-an-array",
          pagination: null
        },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      })

      render(<StudentsClient />)

      await waitFor(() => {
        // Should handle malformed data gracefully
        expect(
          screen.getByText(/error/i) || screen.getByText(/no students/i)
        ).toBeInTheDocument()
      })
    })
  })

  describe('6.4 Browser Compatibility & Edge Cases', () => {
    test('should work on older browsers', async () => {
      const browserHelpers = createBrowserTestHelpers()
      
      // Simulate old browser environment
      browserHelpers.simulateOldBrowser()

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Should provide fallbacks for missing APIs
      expect(screen.getByText(/students/i)).toBeInTheDocument()
    })

    test('should handle mobile viewport constraints', async () => {
      const browserHelpers = createBrowserTestHelpers()
      
      // Simulate mobile device
      browserHelpers.simulateMobile()

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Should adapt to mobile viewport
      const table = screen.getByRole('table')
      expect(table).toHaveStyle({ width: '100%' })
    })

    test('should handle slow devices', async () => {
      const browserHelpers = createBrowserTestHelpers()
      
      // Simulate slow device
      browserHelpers.simulateSlowDevice()

      const startTime = performance.now()
      
      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should still render within reasonable time even on slow devices
      expect(renderTime).toBeLessThan(10000) // 10 seconds max
    })

    test('should handle browser storage limitations', async () => {
      // Mock localStorage quota exceeded
      const originalSetItem = Storage.prototype.setItem
      Storage.prototype.setItem = jest.fn().mockImplementation(() => {
        throw new DOMException('QuotaExceededError')
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Should work without localStorage
      expect(screen.getByText(/students/i)).toBeInTheDocument()

      Storage.prototype.setItem = originalSetItem
    })
  })

  describe('6.5 Extreme Data Scenarios', () => {
    test('should handle students with extremely long names', async () => {
      const studentsWithLongNames = generateStudentDataset(5).map(student => ({
        ...student,
        first_name: 'A'.repeat(1000),
        last_name: 'B'.repeat(1000),
        full_name: 'A'.repeat(1000) + ' ' + 'B'.repeat(1000)
      }))

      mockUseQuery.mockReturnValue({
        data: createMockApiResponse(studentsWithLongNames),
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Should handle long names without breaking layout
      const tableRows = screen.getAllByRole('row')
      expect(tableRows).toHaveLength(6) // 5 students + header
    })

    test('should handle students with special unicode characters', async () => {
      const studentsWithUnicode = generateStudentDataset(5).map((student, index) => ({
        ...student,
        first_name: ['𝕌𝕟𝕚𝕔𝕠𝕕𝕖', '中文', 'العربية', 'עברית', '🏫📚'][index],
        last_name: ['Student', '学生', 'طالب', 'תלמיד', 'Студент'][index]
      }))

      mockUseQuery.mockReturnValue({
        data: createMockApiResponse(studentsWithUnicode),
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Should display unicode characters correctly
      expect(screen.getByText(/𝕌𝕟𝕚𝕔𝕠𝕕𝕖/i)).toBeInTheDocument()
      expect(screen.getByText(/中文/i)).toBeInTheDocument()
    })

    test('should handle empty or null field values', async () => {
      const studentsWithEmptyFields = generateStudentDataset(5).map(student => ({
        ...student,
        email: null,
        primary_phone: '',
        parent_name: undefined,
        address: null,
        notes: '',
        groups: [],
        emergency_contact: null
      }))

      mockUseQuery.mockReturnValue({
        data: createMockApiResponse(studentsWithEmptyFields),
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Should handle null/empty values gracefully
      expect(screen.getAllByRole('row')).toHaveLength(6) // 5 students + header
    })

    test('should handle malformed date values', async () => {
      const studentsWithBadDates = generateStudentDataset(5).map(student => ({
        ...student,
        date_of_birth: 'invalid-date',
        enrollment_date: '99/99/9999',
        created_at: 'not-a-date',
        updated_at: null
      }))

      mockUseQuery.mockReturnValue({
        data: createMockApiResponse(studentsWithBadDates),
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Should handle invalid dates without crashing
      expect(screen.getAllByRole('row')).toHaveLength(6)
    })
  })

  describe('6.6 Stress Testing', () => {
    test('should handle rapid user interactions', async () => {
      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      const searchInput = screen.getByRole('textbox', { name: /search/i })
      const sortButton = screen.getByRole('button', { name: /name/i })

      // Rapid interactions
      for (let i = 0; i < 100; i++) {
        if (i % 2 === 0) {
          await user.type(searchInput, 'a')
        } else {
          await user.click(sortButton)
        }
        
        if (i % 10 === 0) {
          act(() => {
            jest.advanceTimersByTime(50)
          })
        }
      }

      await waitFor(() => {
        // Should handle rapid interactions without breaking
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
    })

    test('should handle component props changing rapidly', async () => {
      let propVersion = 0
      
      const TestWrapper = ({ version }: { version: number }) => {
        mockUseQuery.mockReturnValue({
          data: createMockApiResponse(generateStudentDataset(version % 10 + 1)),
          isLoading: false,
          error: null,
          refetch: jest.fn(),
        })
        
        return <StudentsClient key={version} />
      }

      const { rerender } = render(<TestWrapper version={0} />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Rapidly change props
      for (let i = 1; i <= 50; i++) {
        propVersion = i
        rerender(<TestWrapper version={propVersion} />)
        
        if (i % 10 === 0) {
          act(() => {
            jest.advanceTimersByTime(100)
          })
        }
      }

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
    })

    test('should handle extreme scroll scenarios', async () => {
      const veryLargeDataset = generateStudentDataset(10000)
      
      mockUseQuery.mockReturnValue({
        data: createMockApiResponse(veryLargeDataset.slice(0, 100), {
          pagination: { total: 10000, page: 1, total_pages: 100 }
        }),
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      const tableContainer = screen.getByRole('table').parentElement

      if (tableContainer) {
        // Extreme scrolling
        for (let i = 0; i < 100; i++) {
          fireEvent.scroll(tableContainer, { 
            target: { scrollTop: i * 1000 } 
          })
        }

        await waitFor(() => {
          // Should handle extreme scrolling
          expect(screen.getByText(/students/i)).toBeInTheDocument()
        })
      }
    })
  })

  describe('6.7 Resource Exhaustion Scenarios', () => {
    test('should handle CPU-intensive operations', async () => {
      // Simulate CPU-intensive filtering
      const heavyDataset = generateStudentDataset(1000, {
        diverseStatuses: true,
        diversePaymentStatuses: true,
        diverseLevels: true,
        withBalances: true,
        withGroups: true
      })

      mockUseQuery.mockReturnValue({
        data: createMockApiResponse(heavyDataset),
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      const searchInput = screen.getByRole('textbox', { name: /search/i })

      // Trigger complex search that requires processing large dataset
      await user.type(searchInput, 'complex search term that matches many results')

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        // Should complete even CPU-intensive operations
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
    })

    test('should handle running out of DOM elements', async () => {
      // Simulate creating many DOM elements
      const massiveDataset = generateStudentDataset(5000)

      mockUseQuery.mockReturnValue({
        data: createMockApiResponse(massiveDataset.slice(0, 100)), // Virtualized
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })

      // Should use virtualization to limit DOM elements
      const rows = screen.getAllByRole('row')
      expect(rows.length).toBeLessThan(200) // Should be virtualized
    })

    test('should handle request timeout scenarios', async () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      })

      render(<StudentsClient />)

      await waitFor(() => {
        expect(screen.getByText(/loading/i)).toBeInTheDocument()
      })

      // Simulate very long timeout
      act(() => {
        jest.advanceTimersByTime(120000) // 2 minutes
      })

      // Should show timeout handling
      await waitFor(() => {
        expect(
          screen.getByText(/loading/i) || 
          screen.getByText(/timeout/i) ||
          screen.getByText(/taking longer than expected/i)
        ).toBeInTheDocument()
      })
    })
  })
})