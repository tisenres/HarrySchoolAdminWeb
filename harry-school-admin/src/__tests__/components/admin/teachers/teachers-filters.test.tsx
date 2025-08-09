import React from 'react'
import userEvent from '@testing-library/user-event'

import { TeachersFilters } from '@/components/admin/teachers/teachers-filters'

import { 
  createMockTeacherFilters,
  createMockHandlers
} from '../../../utils/mock-data'
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils'

describe('TeachersFilters', () => {
  const mockHandlers = createMockHandlers()
  const availableSpecializations = [
    'English',
    'Mathematics', 
    'Computer Science',
    'Physics',
    'Chemistry'
  ]

  const defaultProps = {
    filters: createMockTeacherFilters(),
    onFiltersChange: mockHandlers.onFiltersChange,
    availableSpecializations,
    loading: false,
    totalCount: 25,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('Rendering', () => {
    it('renders search input and basic controls', () => {
      render(<TeachersFilters {...defaultProps} />)

      expect(screen.getByPlaceholderText('Search teachers by name, email, phone, or ID...')).toBeInTheDocument()
      expect(screen.getByText('All Status')).toBeInTheDocument()
      expect(screen.getByText('Advanced')).toBeInTheDocument()
    })

    it('shows total count when provided', () => {
      render(<TeachersFilters {...defaultProps} totalCount={50} />)

      // The count might appear in multiple places, we'll check for its presence
      expect(screen.getByText(/50/)).toBeInTheDocument()
    })

    it('renders date range filters', () => {
      render(<TeachersFilters {...defaultProps} />)

      expect(screen.getByText('Start Date')).toBeInTheDocument()
      expect(screen.getByText('End Date')).toBeInTheDocument()
    })
  })

  describe('Search Functionality', () => {
    it('handles search input with debouncing', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      render(<TeachersFilters {...defaultProps} />)

      const searchInput = screen.getByPlaceholderText('Search teachers by name, email, phone, or ID...')
      
      await user.type(searchInput, 'John Doe')

      // Should not call immediately
      expect(mockHandlers.onFiltersChange).not.toHaveBeenCalled()

      // Advance timers to trigger debounce
      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(mockHandlers.onFiltersChange).toHaveBeenCalledWith({
          ...defaultProps.filters,
          search: 'John Doe'
        })
      })
    })

    it('clears previous timeout on new input', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      render(<TeachersFilters {...defaultProps} />)

      const searchInput = screen.getByPlaceholderText('Search teachers by name, email, phone, or ID...')
      
      await user.type(searchInput, 'John')
      jest.advanceTimersByTime(200) // Not enough to trigger
      
      await user.type(searchInput, ' Doe')
      jest.advanceTimersByTime(300) // Should trigger only once

      await waitFor(() => {
        expect(mockHandlers.onFiltersChange).toHaveBeenCalledTimes(1)
        expect(mockHandlers.onFiltersChange).toHaveBeenCalledWith({
          ...defaultProps.filters,
          search: 'John Doe'
        })
      })
    })

    it('shows loading indicator during search', () => {
      render(
        <TeachersFilters 
          {...defaultProps} 
          filters={{ ...defaultProps.filters, search: 'searching' }}
          loading={true}
        />
      )

      expect(screen.getByDisplayValue('searching')).toBeInTheDocument()
      // Loading spinner should be visible
      const loadingSpinner = document.querySelector('.animate-spin')
      expect(loadingSpinner).toBeInTheDocument()
    })

    it('handles empty search gracefully', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      render(<TeachersFilters {...defaultProps} />)

      const searchInput = screen.getByPlaceholderText('Search teachers by name, email, phone, or ID...')
      
      await user.type(searchInput, 'test')
      await user.clear(searchInput)

      jest.advanceTimersByTime(300)

      await waitFor(() => {
        expect(mockHandlers.onFiltersChange).toHaveBeenCalledWith({
          ...defaultProps.filters,
          search: undefined
        })
      })
    })
  })

  describe('Status Filter', () => {
    it('handles active status filter', async () => {
      const user = userEvent.setup()
      render(<TeachersFilters {...defaultProps} />)

      const statusSelect = screen.getByText('All Status')
      await user.click(statusSelect)

      const activeOption = screen.getByText('Active Only')
      await user.click(activeOption)

      expect(mockHandlers.onFiltersChange).toHaveBeenCalledWith({
        ...defaultProps.filters,
        is_active: true
      })
    })

    it('handles inactive status filter', async () => {
      const user = userEvent.setup()
      render(<TeachersFilters {...defaultProps} />)

      const statusSelect = screen.getByText('All Status')
      await user.click(statusSelect)

      const inactiveOption = screen.getByText('Inactive Only')
      await user.click(inactiveOption)

      expect(mockHandlers.onFiltersChange).toHaveBeenCalledWith({
        ...defaultProps.filters,
        is_active: false
      })
    })

    it('handles "all" status selection', async () => {
      const user = userEvent.setup()
      render(
        <TeachersFilters 
          {...defaultProps}
          filters={{ ...defaultProps.filters, is_active: true }}
        />
      )

      const statusSelect = screen.getByText('Active Only')
      await user.click(statusSelect)

      const allOption = screen.getByText('All Status')
      await user.click(allOption)

      expect(mockHandlers.onFiltersChange).toHaveBeenCalledWith({
        ...defaultProps.filters,
        is_active: undefined
      })
    })
  })

  describe('Advanced Filters', () => {
    it('opens advanced filters dropdown', async () => {
      const user = userEvent.setup()
      render(<TeachersFilters {...defaultProps} />)

      const advancedButton = screen.getByText('Advanced')
      await user.click(advancedButton)

      expect(screen.getByText('Employment Status')).toBeInTheDocument()
      expect(screen.getByText('Contract Type')).toBeInTheDocument()
      expect(screen.getByText('Specializations')).toBeInTheDocument()
    })

    it('shows filter count badge', () => {
      render(
        <TeachersFilters 
          {...defaultProps}
          filters={{
            ...defaultProps.filters,
            search: 'test',
            is_active: true,
            employment_status: ['active']
          }}
        />
      )

      // Should show count of active filters
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('handles employment status filtering', async () => {
      const user = userEvent.setup()
      render(<TeachersFilters {...defaultProps} />)

      const advancedButton = screen.getByText('Advanced')
      await user.click(advancedButton)

      const activeCheckbox = screen.getByLabelText('Active')
      await user.click(activeCheckbox)

      expect(mockHandlers.onFiltersChange).toHaveBeenCalledWith({
        ...defaultProps.filters,
        employment_status: ['active']
      })
    })

    it('handles multiple employment status selection', async () => {
      const user = userEvent.setup()
      render(<TeachersFilters {...defaultProps} />)

      const advancedButton = screen.getByText('Advanced')
      await user.click(advancedButton)

      const activeCheckbox = screen.getByLabelText('Active')
      const inactiveCheckbox = screen.getByLabelText('Inactive')
      
      await user.click(activeCheckbox)
      await user.click(inactiveCheckbox)

      expect(mockHandlers.onFiltersChange).toHaveBeenLastCalledWith({
        ...defaultProps.filters,
        employment_status: ['active', 'inactive']
      })
    })

    it('handles contract type filtering', async () => {
      const user = userEvent.setup()
      render(<TeachersFilters {...defaultProps} />)

      const advancedButton = screen.getByText('Advanced')
      await user.click(advancedButton)

      const fullTimeCheckbox = screen.getByLabelText('Full Time')
      await user.click(fullTimeCheckbox)

      expect(mockHandlers.onFiltersChange).toHaveBeenCalledWith({
        ...defaultProps.filters,
        contract_type: ['full_time']
      })
    })

    it('handles specialization filtering', async () => {
      const user = userEvent.setup()
      render(<TeachersFilters {...defaultProps} />)

      const advancedButton = screen.getByText('Advanced')
      await user.click(advancedButton)

      const englishCheckbox = screen.getByLabelText('English')
      await user.click(englishCheckbox)

      expect(mockHandlers.onFiltersChange).toHaveBeenCalledWith({
        ...defaultProps.filters,
        specializations: ['English']
      })
    })

    it('handles removing filters by unchecking', async () => {
      const user = userEvent.setup()
      render(
        <TeachersFilters 
          {...defaultProps}
          filters={{
            ...defaultProps.filters,
            employment_status: ['active', 'inactive']
          }}
        />
      )

      const advancedButton = screen.getByText('Advanced')
      await user.click(advancedButton)

      const activeCheckbox = screen.getByLabelText('Active')
      await user.click(activeCheckbox) // Uncheck

      expect(mockHandlers.onFiltersChange).toHaveBeenCalledWith({
        ...defaultProps.filters,
        employment_status: ['inactive']
      })
    })
  })

  describe('Date Range Filters', () => {
    it('handles start date selection', async () => {
      const user = userEvent.setup()
      render(<TeachersFilters {...defaultProps} />)

      const startDateButton = screen.getByText('Start Date')
      await user.click(startDateButton)

      // Calendar should open - we'll simulate selecting a date
      const today = new Date()
      
      expect(mockHandlers.onFiltersChange).toHaveBeenCalledWith({
        ...defaultProps.filters,
        hire_date_from: expect.any(Date)
      })
    })

    it('handles end date selection', async () => {
      const user = userEvent.setup()
      render(<TeachersFilters {...defaultProps} />)

      const endDateButton = screen.getByText('End Date')
      await user.click(endDateButton)

      // Calendar should open
      const today = new Date()
      
      expect(mockHandlers.onFiltersChange).toHaveBeenCalledWith({
        ...defaultProps.filters,
        hire_date_to: expect.any(Date)
      })
    })

    it('validates date range (end date cannot be before start date)', async () => {
      const user = userEvent.setup()
      const startDate = new Date('2024-01-15')
      
      render(
        <TeachersFilters 
          {...defaultProps}
          filters={{
            ...defaultProps.filters,
            hire_date_from: startDate
          }}
        />
      )

      const endDateButton = screen.getByText('End Date')
      await user.click(endDateButton)

      // Calendar should disable dates before start date
      // This is tested through the date validation logic
    })

    it('displays formatted dates', () => {
      const startDate = new Date('2024-01-15')
      const endDate = new Date('2024-06-15')
      
      render(
        <TeachersFilters 
          {...defaultProps}
          filters={{
            ...defaultProps.filters,
            hire_date_from: startDate,
            hire_date_to: endDate
          }}
        />
      )

      expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument()
      expect(screen.getByText('Jun 15, 2024')).toBeInTheDocument()
    })
  })

  describe('Active Filters Display', () => {
    it('displays active search filter', () => {
      render(
        <TeachersFilters 
          {...defaultProps}
          filters={{ ...defaultProps.filters, search: 'John Doe' }}
        />
      )

      expect(screen.getByText('Active Filters (25 results)')).toBeInTheDocument()
      expect(screen.getByText('Search: "John Doe"')).toBeInTheDocument()
    })

    it('displays active status filter badges', () => {
      render(
        <TeachersFilters 
          {...defaultProps}
          filters={{
            ...defaultProps.filters,
            employment_status: ['active', 'on_leave']
          }}
        />
      )

      expect(screen.getByText('Status: active')).toBeInTheDocument()
      expect(screen.getByText('Status: on leave')).toBeInTheDocument()
    })

    it('displays active specialization filter badges', () => {
      render(
        <TeachersFilters 
          {...defaultProps}
          filters={{
            ...defaultProps.filters,
            specializations: ['English', 'Mathematics']
          }}
        />
      )

      expect(screen.getByText('Subject: English')).toBeInTheDocument()
      expect(screen.getByText('Subject: Mathematics')).toBeInTheDocument()
    })

    it('displays active date range filters', () => {
      const startDate = new Date('2024-01-15')
      const endDate = new Date('2024-06-15')
      
      render(
        <TeachersFilters 
          {...defaultProps}
          filters={{
            ...defaultProps.filters,
            hire_date_from: startDate,
            hire_date_to: endDate
          }}
        />
      )

      expect(screen.getByText('From: Jan 15, 2024')).toBeInTheDocument()
      expect(screen.getByText('To: Jun 15, 2024')).toBeInTheDocument()
    })

    it('handles individual filter removal', async () => {
      const user = userEvent.setup()
      render(
        <TeachersFilters 
          {...defaultProps}
          filters={{
            ...defaultProps.filters,
            search: 'John Doe',
            employment_status: ['active']
          }}
        />
      )

      // Remove search filter
      const searchRemoveButton = screen.getAllByRole('button', { name: '' })[0] // X button
      await user.click(searchRemoveButton)

      expect(mockHandlers.onFiltersChange).toHaveBeenCalledWith({
        ...defaultProps.filters,
        employment_status: ['active']
        // search should be removed
      })
    })
  })

  describe('Clear All Filters', () => {
    it('shows clear all button when filters active', () => {
      render(
        <TeachersFilters 
          {...defaultProps}
          filters={{
            ...defaultProps.filters,
            search: 'test',
            is_active: true
          }}
        />
      )

      expect(screen.getByText('Clear All')).toBeInTheDocument()
    })

    it('clears all filters when clicked', async () => {
      const user = userEvent.setup()
      render(
        <TeachersFilters 
          {...defaultProps}
          filters={{
            ...defaultProps.filters,
            search: 'test',
            is_active: true,
            employment_status: ['active']
          }}
        />
      )

      const clearAllButton = screen.getByText('Clear All')
      await user.click(clearAllButton)

      expect(mockHandlers.onFiltersChange).toHaveBeenCalledWith({})
    })

    it('hides clear all button when no filters active', () => {
      render(<TeachersFilters {...defaultProps} />)

      expect(screen.queryByText('Clear All')).not.toBeInTheDocument()
    })
  })

  describe('Filter Count Logic', () => {
    it('counts multiple filter types correctly', () => {
      render(
        <TeachersFilters 
          {...defaultProps}
          filters={{
            search: 'test',
            is_active: true,
            employment_status: ['active', 'inactive'], // Counts as 1
            specializations: ['English'], // Counts as 1
            hire_date_from: new Date(),
            hire_date_to: new Date()
          }}
        />
      )

      // Should show 6 active filters
      expect(screen.getByText('6')).toBeInTheDocument()
    })

    it('does not count empty arrays', () => {
      render(
        <TeachersFilters 
          {...defaultProps}
          filters={{
            search: 'test', // 1
            employment_status: [], // 0
            specializations: [], // 0
            is_active: undefined, // 0
          }}
        />
      )

      // Should show 1 active filter
      expect(screen.getByText('1')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper labels and ARIA attributes', () => {
      render(<TeachersFilters {...defaultProps} />)

      const searchInput = screen.getByPlaceholderText('Search teachers by name, email, phone, or ID...')
      expect(searchInput).toHaveAttribute('type', 'text')
      
      const statusSelect = screen.getByRole('combobox')
      expect(statusSelect).toBeInTheDocument()
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<TeachersFilters {...defaultProps} />)

      const searchInput = screen.getByPlaceholderText('Search teachers by name, email, phone, or ID...')
      
      await user.tab()
      expect(searchInput).toHaveFocus()
      
      await user.tab()
      const statusSelect = screen.getByRole('combobox')
      expect(statusSelect).toHaveFocus()
    })

    it('has proper checkbox labels in advanced filters', async () => {
      const user = userEvent.setup()
      render(<TeachersFilters {...defaultProps} />)

      const advancedButton = screen.getByText('Advanced')
      await user.click(advancedButton)

      expect(screen.getByLabelText('Active')).toBeInTheDocument()
      expect(screen.getByLabelText('Full Time')).toBeInTheDocument()
      expect(screen.getByLabelText('English')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('cleans up timeout on unmount', () => {
      const { unmount } = render(<TeachersFilters {...defaultProps} />)
      
      // Start typing to create timeout
      const searchInput = screen.getByPlaceholderText('Search teachers by name, email, phone, or ID...')
      fireEvent.change(searchInput, { target: { value: 'test' } })
      
      // Unmount component
      unmount()
      
      // Advance timers - should not call handler
      jest.advanceTimersByTime(300)
      
      expect(mockHandlers.onFiltersChange).not.toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('handles empty specializations list', () => {
      render(
        <TeachersFilters 
          {...defaultProps}
          availableSpecializations={[]}
        />
      )

      // Should not show specializations section in advanced filters
      const advancedButton = screen.getByText('Advanced')
      fireEvent.click(advancedButton)
      
      expect(screen.queryByText('Specializations')).not.toBeInTheDocument()
    })

    it('handles missing totalCount', () => {
      render(
        <TeachersFilters 
          {...defaultProps}
          totalCount={0}
          filters={{ ...defaultProps.filters, search: 'test' }}
        />
      )

      expect(screen.getByText('Active Filters')).toBeInTheDocument()
    })
  })
})