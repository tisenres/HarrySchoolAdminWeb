import React from 'react'
import userEvent from '@testing-library/user-event'

import { TeachersTable } from '@/components/admin/teachers/teachers-table'

import { 
  createMockTeacherList, 
  createMockHandlers,
  createMockTeacherSortConfig
} from '../../../utils/mock-data'
import { render, screen, waitFor } from '../../../utils/test-utils'

// Mock Next.js Link component
jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...props }: any): JSX.Element => {
    return <a href={href} {...props}>{children}</a>
  }
  MockLink.displayName = 'MockLink'
  return MockLink
})

describe('TeachersTable', () => {
  const mockTeachers = createMockTeacherList(5)
  const mockHandlers = createMockHandlers()
  const defaultProps = {
    teachers: mockTeachers,
    selectedTeachers: [],
    onSelectionChange: mockHandlers.onSelectionChange,
    onEdit: mockHandlers.onEdit,
    onDelete: mockHandlers.onDelete,
    onBulkDelete: mockHandlers.onBulkDelete,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders table with teacher data', () => {
      render(<TeachersTable {...defaultProps} />)

      // Check table headers
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Contact')).toBeInTheDocument()
      expect(screen.getByText('Employment')).toBeInTheDocument()
      expect(screen.getByText('Specializations')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()

      // Check teacher data
      mockTeachers.forEach(teacher => {
        expect(screen.getByText(teacher.full_name)).toBeInTheDocument()
        expect(screen.getByText(teacher.phone)).toBeInTheDocument()
      })
    })

    it('renders empty state when no teachers', () => {
      render(<TeachersTable {...defaultProps} teachers={[]} />)

      expect(screen.getByText('No teachers found.')).toBeInTheDocument()
      expect(screen.getByText('Create your first teacher to get started.')).toBeInTheDocument()
    })

    it('renders loading state', () => {
      render(<TeachersTable {...defaultProps} loading={true} />)

      expect(screen.getByText('Loading teachers...')).toBeInTheDocument()
    })

    it('displays correct pagination info', () => {
      render(
        <TeachersTable 
          {...defaultProps} 
          currentPage={1}
          totalCount={50}
          pageSize={20}
        />
      )

      expect(screen.getByText('1-20 of 50')).toBeInTheDocument()
    })
  })

  describe('Selection', () => {
    it('handles single teacher selection', async () => {
      const user = userEvent.setup()
      render(<TeachersTable {...defaultProps} />)

      const checkbox = screen.getAllByRole('checkbox')[1] // First teacher checkbox (index 0 is select all)
      await user.click(checkbox)

      expect(mockHandlers.onSelectionChange).toHaveBeenCalledWith([mockTeachers[0].id])
    })

    it('handles select all functionality', async () => {
      const user = userEvent.setup()
      render(<TeachersTable {...defaultProps} />)

      const selectAllCheckbox = screen.getAllByRole('checkbox')[0]
      await user.click(selectAllCheckbox)

      expect(mockHandlers.onSelectionChange).toHaveBeenCalledWith(
        mockTeachers.map(t => t.id)
      )
    })

    it('shows bulk operations panel when teachers selected', () => {
      render(
        <TeachersTable 
          {...defaultProps} 
          selectedTeachers={[mockTeachers[0].id, mockTeachers[1].id]} 
        />
      )

      expect(screen.getByText('2 teachers selected')).toBeInTheDocument()
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })

    it('handles bulk delete', async () => {
      const user = userEvent.setup()
      const selectedIds = [mockTeachers[0].id, mockTeachers[1].id]
      
      render(
        <TeachersTable 
          {...defaultProps} 
          selectedTeachers={selectedIds}
        />
      )

      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      expect(mockHandlers.onBulkDelete).toHaveBeenCalledWith(selectedIds)
    })
  })

  describe('Sorting', () => {
    const sortProps = {
      ...defaultProps,
      sortConfig: createMockTeacherSortConfig(),
      onSortChange: mockHandlers.onSortChange,
    }

    it('handles column sorting', async () => {
      const user = userEvent.setup()
      render(<TeachersTable {...sortProps} />)

      const nameHeader = screen.getByRole('button', { name: /name/i })
      await user.click(nameHeader)

      expect(mockHandlers.onSortChange).toHaveBeenCalledWith({
        field: 'full_name',
        direction: 'desc' // Should toggle from default asc to desc
      })
    })

    it('displays sort indicators', () => {
      render(
        <TeachersTable 
          {...sortProps}
          sortConfig={{ field: 'full_name', direction: 'asc' }}
        />
      )

      // Check for ascending sort indicator
      const nameHeader = screen.getByRole('button', { name: /name/i })
      expect(nameHeader).toBeInTheDocument()
    })

    it('handles keyboard sorting', async () => {
      const user = userEvent.setup()
      render(<TeachersTable {...sortProps} />)

      const nameHeader = screen.getByRole('button', { name: /name/i })
      await user.tab()
      nameHeader.focus()
      await user.keyboard('{Enter}')

      expect(mockHandlers.onSortChange).toHaveBeenCalled()
    })
  })

  describe('Pagination', () => {
    const paginationProps = {
      ...defaultProps,
      currentPage: 2,
      totalPages: 5,
      totalCount: 100,
      pageSize: 20,
      onPageChange: mockHandlers.onPageChange,
      onPageSizeChange: mockHandlers.onPageSizeChange,
    }

    it('renders pagination controls', () => {
      render(<TeachersTable {...paginationProps} />)

      expect(screen.getByLabelText('Go to first page')).toBeInTheDocument()
      expect(screen.getByLabelText('Go to previous page')).toBeInTheDocument()
      expect(screen.getByLabelText('Go to next page')).toBeInTheDocument()
      expect(screen.getByLabelText('Go to last page')).toBeInTheDocument()
    })

    it('handles page navigation', async () => {
      const user = userEvent.setup()
      render(<TeachersTable {...paginationProps} />)

      const nextButton = screen.getByLabelText('Go to next page')
      await user.click(nextButton)

      expect(mockHandlers.onPageChange).toHaveBeenCalledWith(3)
    })

    it('handles page size changes', async () => {
      const user = userEvent.setup()
      render(<TeachersTable {...paginationProps} />)

      // Find the page size selector
      const pageSizeSelect = screen.getByDisplayValue('20')
      await user.click(pageSizeSelect)
      
      const option50 = screen.getByText('50')
      await user.click(option50)

      expect(mockHandlers.onPageSizeChange).toHaveBeenCalledWith(50)
    })

    it('handles manual page input', async () => {
      const user = userEvent.setup()
      render(<TeachersTable {...paginationProps} />)

      const pageInput = screen.getByLabelText('Current page')
      await user.clear(pageInput)
      await user.type(pageInput, '4')

      expect(mockHandlers.onPageChange).toHaveBeenCalledWith(4)
    })
  })

  describe('Table Actions', () => {
    it('renders action dropdown for each teacher', () => {
      render(<TeachersTable {...defaultProps} />)

      const actionButtons = screen.getAllByLabelText(/open menu for/i)
      expect(actionButtons).toHaveLength(mockTeachers.length)
    })

    it('handles edit action', async () => {
      const user = userEvent.setup()
      render(<TeachersTable {...defaultProps} />)

      // Click first teacher's action menu
      const actionButton = screen.getAllByLabelText(/open menu for/i)[0]
      await user.click(actionButton)

      const editButton = screen.getByText('Edit')
      await user.click(editButton)

      expect(mockHandlers.onEdit).toHaveBeenCalledWith(mockTeachers[0])
    })

    it('handles delete action', async () => {
      const user = userEvent.setup()
      render(<TeachersTable {...defaultProps} />)

      const actionButton = screen.getAllByLabelText(/open menu for/i)[0]
      await user.click(actionButton)

      const deleteButton = screen.getByText('Delete')
      await user.click(deleteButton)

      expect(mockHandlers.onDelete).toHaveBeenCalledWith(mockTeachers[0].id)
    })

    it('renders profile links correctly', () => {
      render(<TeachersTable {...defaultProps} />)

      mockTeachers.forEach(teacher => {
        const profileLink = screen.getByRole('link', { name: teacher.full_name })
        expect(profileLink).toHaveAttribute('href', `/dashboard/teachers/${teacher.id}`)
      })
    })
  })

  describe('Data Display', () => {
    it('displays employment status badges correctly', () => {
      const teachersWithStatuses = [
        createMockTeacherList(1)[0],
        { ...createMockTeacherList(1)[0], id: 'teacher-status-2', employment_status: 'inactive' as const },
        { ...createMockTeacherList(1)[0], id: 'teacher-status-3', employment_status: 'on_leave' as const },
        { ...createMockTeacherList(1)[0], id: 'teacher-status-4', employment_status: 'terminated' as const },
      ]

      render(<TeachersTable {...defaultProps} teachers={teachersWithStatuses} />)

      expect(screen.getByText('ACTIVE')).toBeInTheDocument()
      expect(screen.getByText('INACTIVE')).toBeInTheDocument()
      expect(screen.getByText('ON LEAVE')).toBeInTheDocument()
      expect(screen.getByText('TERMINATED')).toBeInTheDocument()
    })

    it('handles missing email gracefully', () => {
      const teacherWithoutEmail = {
        ...mockTeachers[0],
        email: undefined
      }

      render(
        <TeachersTable 
          {...defaultProps} 
          teachers={[teacherWithoutEmail]} 
        />
      )

      expect(screen.getByText(teacherWithoutEmail.phone)).toBeInTheDocument()
    })

    it('displays specializations with truncation', () => {
      const teacherWithManySpecs = {
        ...mockTeachers[0],
        specializations: ['English', 'Mathematics', 'Physics', 'Chemistry', 'Biology']
      }

      render(
        <TeachersTable 
          {...defaultProps} 
          teachers={[teacherWithManySpecs]} 
        />
      )

      // Should show first two and count
      expect(screen.getByText(/English, Mathematics \+3 more/)).toBeInTheDocument()
    })

    it('displays profile images when available', () => {
      const teacherWithImage = {
        ...mockTeachers[0],
        profile_image_url: 'https://example.com/image.jpg'
      }

      render(
        <TeachersTable 
          {...defaultProps} 
          teachers={[teacherWithImage]} 
        />
      )

      const profileImage = screen.getByAltText(teacherWithImage.full_name)
      expect(profileImage).toHaveAttribute('src', teacherWithImage.profile_image_url)
    })
  })

  describe('Table Customization', () => {
    it('handles table density changes', async () => {
      const user = userEvent.setup()
      render(<TeachersTable {...defaultProps} />)

      // Open settings menu
      const settingsButton = screen.getByRole('button', { name: '' }) // Settings button
      await user.click(settingsButton)

      const compactOption = screen.getByText('Compact')
      await user.click(compactOption)

      // Table should have compact styling
      await waitFor(() => {
        const tableRows = screen.getAllByRole('row')
        expect(tableRows[1]).toHaveClass('text-sm')
      })
    })

    it('handles column visibility toggle', async () => {
      const user = userEvent.setup()
      render(<TeachersTable {...defaultProps} />)

      const settingsButton = screen.getByRole('button', { name: '' })
      await user.click(settingsButton)

      // Find and uncheck a column
      const employmentCheckbox = screen.getByRole('menuitemcheckbox', { name: 'Employment' })
      await user.click(employmentCheckbox)

      // Employment column should be hidden
      await waitFor(() => {
        expect(screen.queryByText('Employment')).not.toBeInTheDocument()
      })
    })
  })

  describe('Bulk Operations', () => {
    const bulkProps = {
      ...defaultProps,
      selectedTeachers: [mockTeachers[0].id, mockTeachers[1].id],
      onBulkStatusChange: mockHandlers.onBulkStatusChange,
      onBulkArchive: mockHandlers.onBulkArchive,
      onExport: mockHandlers.onExport,
    }

    it('handles bulk status change', async () => {
      const user = userEvent.setup()
      render(<TeachersTable {...bulkProps} />)

      const statusButton = screen.getByText('Change Status')
      await user.click(statusButton)

      const activeOption = screen.getByText('Set Active')
      await user.click(activeOption)

      expect(mockHandlers.onBulkStatusChange).toHaveBeenCalledWith(
        bulkProps.selectedTeachers,
        'active'
      )
    })

    it('handles bulk export', async () => {
      const user = userEvent.setup()
      render(<TeachersTable {...bulkProps} />)

      const exportButton = screen.getByText('Export Selected')
      await user.click(exportButton)

      expect(mockHandlers.onExport).toHaveBeenCalledWith(bulkProps.selectedTeachers)
    })

    it('handles export all', async () => {
      const user = userEvent.setup()
      render(<TeachersTable {...bulkProps} />)

      const exportAllButton = screen.getByText('Export All')
      await user.click(exportAllButton)

      expect(mockHandlers.onExport).toHaveBeenCalledWith()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels for interactive elements', () => {
      render(<TeachersTable {...defaultProps} />)

      expect(screen.getByLabelText('Select all teachers')).toBeInTheDocument()
      mockTeachers.forEach(teacher => {
        expect(screen.getByLabelText(`Select ${teacher.full_name}`)).toBeInTheDocument()
        expect(screen.getByLabelText(`Open menu for ${teacher.full_name}`)).toBeInTheDocument()
      })
    })

    it('has proper ARIA sort attributes', () => {
      render(
        <TeachersTable 
          {...defaultProps}
          sortConfig={{ field: 'full_name', direction: 'asc' }}
          onSortChange={mockHandlers.onSortChange}
        />
      )

      const nameHeader = screen.getByRole('button', { name: /name/i })
      expect(nameHeader).toHaveAttribute('aria-sort', 'ascending')
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      render(
        <TeachersTable 
          {...defaultProps}
          onSortChange={mockHandlers.onSortChange}
          sortConfig={{ field: 'full_name', direction: 'asc' }}
        />
      )

      const nameHeader = screen.getByRole('button', { name: /name/i })
      nameHeader.focus()
      await user.keyboard(' ')

      expect(mockHandlers.onSortChange).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('handles missing teacher data gracefully', () => {
      const incompleteTeacher = {
        id: 'test-id',
        full_name: 'Test Teacher',
        phone: '+998901234567',
        // Missing other required fields
      } as any

      expect(() => {
        render(<TeachersTable {...defaultProps} teachers={[incompleteTeacher]} />)
      }).not.toThrow()
    })

    it('handles undefined/null props gracefully', () => {
      expect(() => {
        render(
          <TeachersTable 
            teachers={[]}
            selectedTeachers={[]}
            onSelectionChange={() => {}}
            onEdit={() => {}}
            onDelete={() => {}}
            onBulkDelete={() => {}}
          />
        )
      }).not.toThrow()
    })
  })
})