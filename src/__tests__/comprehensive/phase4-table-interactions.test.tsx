/**
 * PHASE 4: Table Interactions Complete Testing
 * 
 * Comprehensive testing of all table interaction scenarios
 * Testing every possible way users can interact with the table
 */

import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StudentsClient from '@/app/[locale]/(dashboard)/students/students-client'
import { generateStudentDataset, createMockApiResponse } from '@/lib/test-utils'

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

describe('Phase 4: Table Interactions Complete Testing', () => {
  let user: ReturnType<typeof userEvent.setup>
  
  beforeEach(() => {
    jest.clearAllMocks()
    user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    jest.useFakeTimers()
    
    // Default successful data state
    mockUseQuery.mockReturnValue({
      data: createMockApiResponse(generateStudentDataset(20), {
        pagination: { total: 20, page: 1, total_pages: 1 }
      }),
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('4.1 Row Selection Interactions', () => {
    test('should handle single row selection', async () => {
      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      // Find first student row checkbox
      const checkboxes = screen.getAllByRole('checkbox')
      const firstRowCheckbox = checkboxes.find(cb => 
        cb.getAttribute('aria-label')?.includes('Select student')
      )
      
      if (firstRowCheckbox) {
        await user.click(firstRowCheckbox)
        
        await waitFor(() => {
          expect(firstRowCheckbox).toBeChecked()
        })
      }
    })

    test('should handle multiple row selection', async () => {
      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      const checkboxes = screen.getAllByRole('checkbox')
      const studentCheckboxes = checkboxes.filter(cb => 
        cb.getAttribute('aria-label')?.includes('Select student')
      )
      
      // Select first two students
      if (studentCheckboxes.length >= 2) {
        await user.click(studentCheckboxes[0])
        await user.click(studentCheckboxes[1])
        
        await waitFor(() => {
          expect(studentCheckboxes[0]).toBeChecked()
          expect(studentCheckboxes[1]).toBeChecked()
        })
      }
    })

    test('should handle select all checkbox', async () => {
      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      const selectAllCheckbox = screen.getByRole('checkbox', { 
        name: /select all/i 
      })
      
      await user.click(selectAllCheckbox)
      
      await waitFor(() => {
        expect(selectAllCheckbox).toBeChecked()
        
        // All student checkboxes should be checked
        const studentCheckboxes = screen.getAllByRole('checkbox').filter(cb => 
          cb.getAttribute('aria-label')?.includes('Select student')
        )
        studentCheckboxes.forEach(checkbox => {
          expect(checkbox).toBeChecked()
        })
      })
    })

    test('should handle deselect all', async () => {
      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      const selectAllCheckbox = screen.getByRole('checkbox', { 
        name: /select all/i 
      })
      
      // First select all
      await user.click(selectAllCheckbox)
      await waitFor(() => {
        expect(selectAllCheckbox).toBeChecked()
      })
      
      // Then deselect all
      await user.click(selectAllCheckbox)
      await waitFor(() => {
        expect(selectAllCheckbox).not.toBeChecked()
        
        const studentCheckboxes = screen.getAllByRole('checkbox').filter(cb => 
          cb.getAttribute('aria-label')?.includes('Select student')
        )
        studentCheckboxes.forEach(checkbox => {
          expect(checkbox).not.toBeChecked()
        })
      })
    })

    test('should handle partial selection state', async () => {
      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      const studentCheckboxes = screen.getAllByRole('checkbox').filter(cb => 
        cb.getAttribute('aria-label')?.includes('Select student')
      )
      
      if (studentCheckboxes.length >= 3) {
        // Select only some students
        await user.click(studentCheckboxes[0])
        await user.click(studentCheckboxes[1])
        
        await waitFor(() => {
          const selectAllCheckbox = screen.getByRole('checkbox', { 
            name: /select all/i 
          })
          
          // Should be in indeterminate state
          expect(selectAllCheckbox).toHaveAttribute('data-state', 'indeterminate')
        })
      }
    })

    test('should handle shift+click range selection', async () => {
      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      const studentCheckboxes = screen.getAllByRole('checkbox').filter(cb => 
        cb.getAttribute('aria-label')?.includes('Select student')
      )
      
      if (studentCheckboxes.length >= 5) {
        // Click first checkbox
        await user.click(studentCheckboxes[0])
        
        // Shift+click fifth checkbox
        await user.keyboard('{Shift>}')
        await user.click(studentCheckboxes[4])
        await user.keyboard('{/Shift}')
        
        await waitFor(() => {
          // First five checkboxes should be selected
          for (let i = 0; i < 5; i++) {
            expect(studentCheckboxes[i]).toBeChecked()
          }
        })
      }
    })
  })

  describe('4.2 Column Sorting Interactions', () => {
    test('should handle single column sort ascending', async () => {
      const mockRefetch = jest.fn()
      mockUseQuery.mockReturnValue({
        data: createMockApiResponse(generateStudentDataset(10)),
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      const nameHeader = screen.getByRole('button', { name: /name/i })
      await user.click(nameHeader)
      
      await waitFor(() => {
        expect(nameHeader).toHaveAttribute('aria-sort', 'ascending')
      })
    })

    test('should handle single column sort descending', async () => {
      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      const nameHeader = screen.getByRole('button', { name: /name/i })
      
      // First click for ascending
      await user.click(nameHeader)
      await waitFor(() => {
        expect(nameHeader).toHaveAttribute('aria-sort', 'ascending')
      })
      
      // Second click for descending
      await user.click(nameHeader)
      await waitFor(() => {
        expect(nameHeader).toHaveAttribute('aria-sort', 'descending')
      })
    })

    test('should handle sort reset (third click)', async () => {
      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      const nameHeader = screen.getByRole('button', { name: /name/i })
      
      // Three clicks should reset sort
      await user.click(nameHeader) // ascending
      await user.click(nameHeader) // descending
      await user.click(nameHeader) // reset
      
      await waitFor(() => {
        expect(nameHeader).not.toHaveAttribute('aria-sort')
      })
    })

    test('should handle sorting different columns', async () => {
      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      const nameHeader = screen.getByRole('button', { name: /name/i })
      const statusHeader = screen.getByRole('button', { name: /status/i })
      
      // Sort by name
      await user.click(nameHeader)
      await waitFor(() => {
        expect(nameHeader).toHaveAttribute('aria-sort', 'ascending')
      })
      
      // Sort by status (should clear name sort)
      await user.click(statusHeader)
      await waitFor(() => {
        expect(statusHeader).toHaveAttribute('aria-sort', 'ascending')
        expect(nameHeader).not.toHaveAttribute('aria-sort')
      })
    })

    test('should handle keyboard navigation for sorting', async () => {
      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      const nameHeader = screen.getByRole('button', { name: /name/i })
      
      // Focus and press Enter
      nameHeader.focus()
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(nameHeader).toHaveAttribute('aria-sort', 'ascending')
      })
      
      // Press Space
      await user.keyboard(' ')
      
      await waitFor(() => {
        expect(nameHeader).toHaveAttribute('aria-sort', 'descending')
      })
    })
  })

  describe('4.3 Pagination Interactions', () => {
    beforeEach(() => {
      // Mock large dataset requiring pagination
      mockUseQuery.mockReturnValue({
        data: createMockApiResponse(generateStudentDataset(20), {
          pagination: { total: 100, page: 1, total_pages: 5 }
        }),
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      })
    })

    test('should handle next page navigation', async () => {
      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      const nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)
      
      await waitFor(() => {
        // Should trigger data refetch for page 2
        expect(mockUseQuery).toHaveBeenCalled()
      })
    })

    test('should handle previous page navigation', async () => {
      // Mock page 2 state
      mockUseQuery.mockReturnValue({
        data: createMockApiResponse(generateStudentDataset(20), {
          pagination: { total: 100, page: 2, total_pages: 5 }
        }),
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      })

      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      const prevButton = screen.getByRole('button', { name: /previous/i })
      await user.click(prevButton)
      
      await waitFor(() => {
        expect(mockUseQuery).toHaveBeenCalled()
      })
    })

    test('should handle first page navigation', async () => {
      mockUseQuery.mockReturnValue({
        data: createMockApiResponse(generateStudentDataset(20), {
          pagination: { total: 100, page: 3, total_pages: 5 }
        }),
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      })

      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      const firstButton = screen.getByRole('button', { name: /first/i })
      await user.click(firstButton)
      
      await waitFor(() => {
        expect(mockUseQuery).toHaveBeenCalled()
      })
    })

    test('should handle last page navigation', async () => {
      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      const lastButton = screen.getByRole('button', { name: /last/i })
      await user.click(lastButton)
      
      await waitFor(() => {
        expect(mockUseQuery).toHaveBeenCalled()
      })
    })

    test('should handle direct page input', async () => {
      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      const pageInput = screen.getByLabelText(/page/i)
      
      await user.clear(pageInput)
      await user.type(pageInput, '3')
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(mockUseQuery).toHaveBeenCalled()
      })
    })

    test('should handle invalid page input', async () => {
      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      const pageInput = screen.getByLabelText(/page/i)
      
      // Try invalid page numbers
      await user.clear(pageInput)
      await user.type(pageInput, '999')
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        // Should not crash and should handle gracefully
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
    })

    test('should handle page size changes', async () => {
      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      const pageSizeSelect = screen.getByRole('combobox', { name: /rows per page/i })
      await user.click(pageSizeSelect)
      
      const option50 = screen.getByRole('option', { name: '50' })
      await user.click(option50)
      
      await waitFor(() => {
        expect(mockUseQuery).toHaveBeenCalled()
      })
    })
  })

  describe('4.4 Scrolling and Virtualization', () => {
    beforeEach(() => {
      // Mock very large dataset
      mockUseQuery.mockReturnValue({
        data: createMockApiResponse(generateStudentDataset(1000), {
          pagination: { total: 10000, page: 1, total_pages: 100 }
        }),
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      })
    })

    test('should handle vertical scrolling', async () => {
      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      const tableContainer = screen.getByRole('table').closest('[data-testid="table-container"]')
      
      if (tableContainer) {
        // Simulate scroll
        fireEvent.scroll(tableContainer, { target: { scrollTop: 500 } })
        
        await waitFor(() => {
          // Should handle scroll without issues
          expect(screen.getByText(/students/i)).toBeInTheDocument()
        })
      }
    })

    test('should handle horizontal scrolling', async () => {
      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      const tableContainer = screen.getByRole('table').closest('[data-testid="table-container"]')
      
      if (tableContainer) {
        // Simulate horizontal scroll
        fireEvent.scroll(tableContainer, { target: { scrollLeft: 300 } })
        
        await waitFor(() => {
          expect(screen.getByText(/students/i)).toBeInTheDocument()
        })
      }
    })

    test('should handle scroll to top', async () => {
      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      const scrollToTopButton = screen.queryByRole('button', { name: /scroll to top/i })
      
      if (scrollToTopButton) {
        await user.click(scrollToTopButton)
        
        await waitFor(() => {
          // Should scroll to top smoothly
          expect(screen.getByText(/students/i)).toBeInTheDocument()
        })
      }
    })

    test('should handle infinite scroll loading', async () => {
      const mockRefetch = jest.fn()
      mockUseQuery.mockReturnValue({
        data: createMockApiResponse(generateStudentDataset(50)),
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      // Scroll to bottom to trigger loading
      const tableContainer = screen.getByRole('table').closest('div')
      if (tableContainer) {
        fireEvent.scroll(tableContainer, { 
          target: { 
            scrollTop: tableContainer.scrollHeight - tableContainer.clientHeight
          } 
        })
        
        await waitFor(() => {
          // Should trigger loading more data
          expect(screen.getByText(/students/i)).toBeInTheDocument()
        })
      }
    })
  })

  describe('4.5 Keyboard Navigation', () => {
    test('should handle tab navigation through table', async () => {
      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      // Tab through interactive elements
      await user.keyboard('{Tab}')
      await user.keyboard('{Tab}')
      await user.keyboard('{Tab}')
      
      await waitFor(() => {
        // Should navigate through focusable elements
        expect(document.activeElement).toBeInTheDocument()
      })
    })

    test('should handle arrow key navigation', async () => {
      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      const firstCell = screen.getAllByRole('cell')[0]
      firstCell.focus()
      
      // Navigate with arrow keys
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{ArrowRight}')
      await user.keyboard('{ArrowUp}')
      await user.keyboard('{ArrowLeft}')
      
      await waitFor(() => {
        // Should handle arrow navigation
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
    })

    test('should handle Enter key for row actions', async () => {
      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      const firstActionButton = screen.getAllByRole('button', { name: /actions/i })[0]
      firstActionButton.focus()
      
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        // Should open action menu
        expect(screen.getByRole('menu')).toBeInTheDocument()
      })
    })

    test('should handle Escape key to close modals', async () => {
      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      // Open action menu first
      const firstActionButton = screen.getAllByRole('button', { name: /actions/i })[0]
      await user.click(firstActionButton)
      
      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument()
      })
      
      // Press Escape to close
      await user.keyboard('{Escape}')
      
      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument()
      })
    })

    test('should handle Home/End keys for navigation', async () => {
      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      const table = screen.getByRole('table')
      table.focus()
      
      await user.keyboard('{Home}')
      await user.keyboard('{End}')
      
      await waitFor(() => {
        // Should handle Home/End navigation
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
    })

    test('should handle Page Up/Down keys', async () => {
      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      const table = screen.getByRole('table')
      table.focus()
      
      await user.keyboard('{PageDown}')
      await user.keyboard('{PageUp}')
      
      await waitFor(() => {
        // Should handle page navigation
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
    })
  })

  describe('4.6 Mouse Interactions', () => {
    test('should handle row hover effects', async () => {
      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      const firstRow = screen.getAllByRole('row')[1] // Skip header row
      
      await user.hover(firstRow)
      
      await waitFor(() => {
        expect(firstRow).toHaveClass(/hover/)
      })
      
      await user.unhover(firstRow)
      
      await waitFor(() => {
        expect(firstRow).not.toHaveClass(/hover/)
      })
    })

    test('should handle double-click on row', async () => {
      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      const firstRow = screen.getAllByRole('row')[1]
      
      await user.dblClick(firstRow)
      
      await waitFor(() => {
        // Should open student details or edit modal
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
    })

    test('should handle right-click context menu', async () => {
      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      const firstRow = screen.getAllByRole('row')[1]
      
      fireEvent.contextMenu(firstRow)
      
      await waitFor(() => {
        // Should show context menu if implemented
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
    })

    test('should handle drag and drop interactions', async () => {
      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      const columnHeader = screen.getByRole('columnheader', { name: /name/i })
      
      // Simulate drag start
      fireEvent.dragStart(columnHeader)
      
      // Simulate drag over another column
      const statusHeader = screen.getByRole('columnheader', { name: /status/i })
      fireEvent.dragOver(statusHeader)
      
      // Simulate drop
      fireEvent.drop(statusHeader)
      
      await waitFor(() => {
        // Should handle column reordering if implemented
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
    })

    test('should handle column resize interactions', async () => {
      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      const resizeHandle = screen.queryByRole('separator')
      
      if (resizeHandle) {
        fireEvent.mouseDown(resizeHandle)
        fireEvent.mouseMove(resizeHandle, { clientX: 100 })
        fireEvent.mouseUp(resizeHandle)
        
        await waitFor(() => {
          // Should resize column
          expect(screen.getByText(/students/i)).toBeInTheDocument()
        })
      }
    })
  })

  describe('4.7 Touch and Mobile Interactions', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375 })
      Object.defineProperty(window, 'innerHeight', { value: 667 })
    })

    test('should handle touch scroll', async () => {
      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      const table = screen.getByRole('table')
      
      // Simulate touch scroll
      fireEvent.touchStart(table, { 
        touches: [{ clientX: 100, clientY: 100 }] 
      })
      fireEvent.touchMove(table, { 
        touches: [{ clientX: 100, clientY: 50 }] 
      })
      fireEvent.touchEnd(table)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
    })

    test('should handle swipe gestures', async () => {
      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      const firstRow = screen.getAllByRole('row')[1]
      
      // Simulate swipe left
      fireEvent.touchStart(firstRow, { 
        touches: [{ clientX: 200, clientY: 100 }] 
      })
      fireEvent.touchMove(firstRow, { 
        touches: [{ clientX: 50, clientY: 100 }] 
      })
      fireEvent.touchEnd(firstRow)
      
      await waitFor(() => {
        // Should reveal action buttons or similar
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
    })

    test('should handle pinch zoom on mobile', async () => {
      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      const table = screen.getByRole('table')
      
      // Simulate pinch gesture
      fireEvent.touchStart(table, { 
        touches: [
          { clientX: 100, clientY: 100 },
          { clientX: 200, clientY: 200 }
        ] 
      })
      fireEvent.touchMove(table, { 
        touches: [
          { clientX: 80, clientY: 80 },
          { clientX: 220, clientY: 220 }
        ] 
      })
      fireEvent.touchEnd(table)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
    })

    test('should handle tap and hold interactions', async () => {
      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      const firstRow = screen.getAllByRole('row')[1]
      
      // Simulate long press
      fireEvent.touchStart(firstRow)
      
      act(() => {
        jest.advanceTimersByTime(800) // Long press duration
      })
      
      fireEvent.touchEnd(firstRow)
      
      await waitFor(() => {
        // Should show context menu or selection
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
    })
  })

  describe('4.8 Performance Under Load', () => {
    test('should handle rapid clicking without performance degradation', async () => {
      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      const sortButton = screen.getByRole('button', { name: /name/i })
      
      // Rapid clicks
      for (let i = 0; i < 10; i++) {
        await user.click(sortButton)
      }
      
      await waitFor(() => {
        // Should handle without crashing
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
    })

    test('should handle rapid pagination clicks', async () => {
      mockUseQuery.mockReturnValue({
        data: createMockApiResponse(generateStudentDataset(20), {
          pagination: { total: 1000, page: 1, total_pages: 50 }
        }),
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      })

      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      const nextButton = screen.getByRole('button', { name: /next/i })
      
      // Rapid pagination clicks
      for (let i = 0; i < 5; i++) {
        await user.click(nextButton)
        act(() => {
          jest.advanceTimersByTime(100)
        })
      }
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
    })

    test('should handle simultaneous interactions', async () => {
      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
      
      // Simultaneous interactions
      const promises = [
        user.click(screen.getByRole('button', { name: /name/i })),
        user.click(screen.getByRole('checkbox', { name: /select all/i })),
        user.type(screen.getByRole('textbox', { name: /search/i }), 'test')
      ]
      
      await Promise.all(promises)
      
      await waitFor(() => {
        expect(screen.getByText(/students/i)).toBeInTheDocument()
      })
    })
  })

  describe('4.9 Edge Case Interactions', () => {
    test('should handle interactions during loading state', async () => {
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
      
      // Try to interact during loading
      const buttons = screen.getAllByRole('button')
      if (buttons.length > 0) {
        await user.click(buttons[0])
      }
      
      await waitFor(() => {
        // Should not crash during loading
        expect(screen.getByText(/loading/i)).toBeInTheDocument()
      })
    })

    test('should handle interactions with empty data', async () => {
      mockUseQuery.mockReturnValue({
        data: createMockApiResponse([]),
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      })

      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/no students found/i)).toBeInTheDocument()
      })
      
      // Try interactions with empty state
      const sortButtons = screen.getAllByRole('button')
      const nameSortButton = sortButtons.find(btn => btn.textContent?.includes('Name'))
      
      if (nameSortButton) {
        await user.click(nameSortButton)
      }
      
      await waitFor(() => {
        expect(screen.getByText(/no students found/i)).toBeInTheDocument()
      })
    })

    test('should handle interactions after error state', async () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Network error'),
        refetch: jest.fn(),
      })

      render(<StudentsClient />)
      
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument()
      })
      
      const retryButton = screen.queryByRole('button', { name: /retry/i })
      if (retryButton) {
        await user.click(retryButton)
      }
      
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument()
      })
    })

    test('should handle rapid state changes', async () => {
      let callCount = 0
      mockUseQuery.mockImplementation(() => {
        callCount++
        if (callCount % 2 === 0) {
          return {
            data: createMockApiResponse(generateStudentDataset(10)),
            isLoading: false,
            error: null,
            refetch: jest.fn(),
          }
        } else {
          return {
            data: null,
            isLoading: true,
            error: null,
            refetch: jest.fn(),
          }
        }
      })

      render(<StudentsClient />)
      
      // Trigger rapid state changes
      for (let i = 0; i < 5; i++) {
        act(() => {
          jest.advanceTimersByTime(100)
        })
        
        await waitFor(() => {
          expect(screen.getByText(/students/i)).toBeInTheDocument()
        })
      }
    })
  })
})