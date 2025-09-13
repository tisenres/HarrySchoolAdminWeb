import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { StudentsTable } from '@/components/admin/students/students-table'
import type { Student } from '@/types/student'

// Mock the router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    tr: ({ children, ...props }: any) => <tr {...props}>{children}</tr>,
  },
  AnimatePresence: ({ children }: any) => children,
}))

const mockMessages = {
  students: {
    fullName: 'Full Name',
    email: 'Email',
    phone: 'Phone',
    status: 'Status',
    paymentStatus: 'Payment Status',
    actions: 'Actions',
    viewProfile: 'View Profile',
    editStudent: 'Edit Student',
    deleteStudent: 'Delete Student',
    enrollmentDate: 'Enrollment Date',
    currentLevel: 'Current Level',
  },
  common: {
    active: 'Active',
    inactive: 'Inactive',
    loading: 'Loading...',
    error: 'Error',
    edit: 'Edit',
    delete: 'Delete',
    view: 'View',
  }
}

const mockStudent: Student = {
  id: 'student-1',
  organization_id: 'org-1',
  student_id: 'HS-STU-001',
  first_name: 'John',
  last_name: 'Doe',
  full_name: 'John Doe',
  date_of_birth: '2005-03-15',
  gender: 'male',
  email: 'john.doe@example.com',
  phone: '+998901234567',
  parent_name: 'Jane Doe',
  parent_phone: '+998901234568',
  parent_email: 'jane.doe@example.com',
  address: {
    street: '123 Main St',
    city: 'Tashkent',
    country: 'Uzbekistan',
    postal_code: '100000'
  },
  enrollment_date: '2024-01-15',
  status: 'active',
  current_level: 'Intermediate',
  preferred_subjects: ['English'],
  groups: ['group-1'],
  academic_year: '2024',
  grade_level: '10',
  medical_notes: '',
  emergency_contact: {
    name: 'Emergency Contact',
    relationship: 'parent',
    phone: '+998901234569',
    email: 'emergency@example.com'
  },
  payment_status: 'paid',
  balance: 0,
  tuition_fee: 1500000,
  notes: '',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z'
}

const mockStudents = [
  mockStudent,
  { ...mockStudent, id: 'student-2', full_name: 'Jane Smith', student_id: 'HS-STU-002' },
  { ...mockStudent, id: 'student-3', full_name: 'Bob Johnson', student_id: 'HS-STU-003' }
]

describe('Students Table Checkbox Interactions', () => {
  let mockRouter: jest.Mocked<any>
  let mockOnSelectStudent: jest.Mock
  let mockOnSelectAll: jest.Mock
  let mockOnEdit: jest.Mock
  let mockOnDelete: jest.Mock

  beforeEach(() => {
    mockRouter = {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    }
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)

    mockOnSelectStudent = jest.fn()
    mockOnSelectAll = jest.fn()
    mockOnEdit = jest.fn()
    mockOnDelete = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  const renderComponent = (selectedStudents: string[] = []) => {
    return render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <StudentsTable
          students={mockStudents}
          loading={false}
          selectedStudents={selectedStudents}
          onSelectStudent={mockOnSelectStudent}
          onSelectAll={mockOnSelectAll}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          sortConfig={{ field: 'full_name', direction: 'asc' }}
          onSort={jest.fn()}
          pagination={{
            current_page: 1,
            total_pages: 1,
            page_size: 20,
            count: 3
          }}
          onPageChange={jest.fn()}
          onPageSizeChange={jest.fn()}
        />
      </NextIntlClientProvider>
    )
  }

  it('should handle individual checkbox clicks without triggering row navigation', () => {
    renderComponent()

    // Find checkbox for first student
    const checkbox = screen.getByRole('checkbox', { name: /select student john doe/i })
    
    // Click the checkbox
    fireEvent.click(checkbox)

    // Should call onSelectStudent
    expect(mockOnSelectStudent).toHaveBeenCalledWith('student-1', true)
    
    // Should NOT navigate to student detail page
    expect(mockRouter.push).not.toHaveBeenCalled()
  })

  it('should prevent event propagation when clicking checkbox', () => {
    renderComponent()

    const checkbox = screen.getByRole('checkbox', { name: /select student john doe/i })
    const clickEvent = new MouseEvent('click', { bubbles: true })
    
    // Mock stopPropagation to verify it's called
    const stopPropagationSpy = jest.spyOn(clickEvent, 'stopPropagation')
    
    fireEvent(checkbox, clickEvent)

    // stopPropagation should be called to prevent row click handler
    expect(stopPropagationSpy).toHaveBeenCalled()
  })

  it('should handle select all checkbox without side effects', () => {
    renderComponent()

    // Find the select all checkbox in table header
    const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all/i })
    
    fireEvent.click(selectAllCheckbox)

    // Should call onSelectAll
    expect(mockOnSelectAll).toHaveBeenCalledWith(true)
    
    // Should not trigger any navigation
    expect(mockRouter.push).not.toHaveBeenCalled()
  })

  it('should allow clicking on table cell to navigate (except checkbox cell)', () => {
    renderComponent()

    // Find a non-checkbox cell (name cell)
    const nameCell = screen.getByText('John Doe')
    
    fireEvent.click(nameCell)

    // Should navigate to student detail page
    expect(mockRouter.push).toHaveBeenCalledWith('/en/students/student-1')
  })

  it('should show correct checkbox states for selected students', () => {
    renderComponent(['student-1', 'student-3'])

    // First student checkbox should be checked
    const checkbox1 = screen.getByRole('checkbox', { name: /select student john doe/i })
    expect(checkbox1).toBeChecked()

    // Second student checkbox should not be checked
    const checkbox2 = screen.getByRole('checkbox', { name: /select student jane smith/i })
    expect(checkbox2).not.toBeChecked()

    // Third student checkbox should be checked
    const checkbox3 = screen.getByRole('checkbox', { name: /select student bob johnson/i })
    expect(checkbox3).toBeChecked()
  })

  it('should handle checkbox state changes correctly', () => {
    const { rerender } = renderComponent(['student-1'])

    // First checkbox should be checked
    let checkbox1 = screen.getByRole('checkbox', { name: /select student john doe/i })
    expect(checkbox1).toBeChecked()

    // Simulate unselecting the student
    rerender(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <StudentsTable
          students={mockStudents}
          loading={false}
          selectedStudents={[]} // No students selected
          onSelectStudent={mockOnSelectStudent}
          onSelectAll={mockOnSelectAll}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          sortConfig={{ field: 'full_name', direction: 'asc' }}
          onSort={jest.fn()}
          pagination={{
            current_page: 1,
            total_pages: 1,
            page_size: 20,
            count: 3
          }}
          onPageChange={jest.fn()}
          onPageSizeChange={jest.fn()}
        />
      </NextIntlClientProvider>
    )

    // Checkbox should now be unchecked
    checkbox1 = screen.getByRole('checkbox', { name: /select student john doe/i })
    expect(checkbox1).not.toBeChecked()
  })

  it('should handle bulk selection correctly', () => {
    renderComponent()

    // Select multiple checkboxes
    const checkbox1 = screen.getByRole('checkbox', { name: /select student john doe/i })
    const checkbox2 = screen.getByRole('checkbox', { name: /select student jane smith/i })

    fireEvent.click(checkbox1)
    fireEvent.click(checkbox2)

    // Should call onSelectStudent for each checkbox
    expect(mockOnSelectStudent).toHaveBeenCalledWith('student-1', true)
    expect(mockOnSelectStudent).toHaveBeenCalledWith('student-2', true)
    
    // Should not trigger navigation
    expect(mockRouter.push).not.toHaveBeenCalled()
  })

  it('should maintain checkbox functionality with keyboard navigation', () => {
    renderComponent()

    const checkbox = screen.getByRole('checkbox', { name: /select student john doe/i })
    
    // Use Space key to toggle checkbox
    fireEvent.keyDown(checkbox, { key: ' ', code: 'Space' })

    // Should call onSelectStudent
    expect(mockOnSelectStudent).toHaveBeenCalledWith('student-1', true)
  })

  it('should not interfere with action menu clicks', () => {
    renderComponent()

    // Find the actions menu button
    const actionButton = screen.getByRole('button', { name: /more options/i })
    
    fireEvent.click(actionButton)

    // Should not trigger row navigation
    expect(mockRouter.push).not.toHaveBeenCalled()
  })

  it('should handle rapid checkbox clicks without issues', () => {
    renderComponent()

    const checkbox = screen.getByRole('checkbox', { name: /select student john doe/i })
    
    // Click multiple times rapidly
    fireEvent.click(checkbox)
    fireEvent.click(checkbox)
    fireEvent.click(checkbox)

    // Should handle all clicks
    expect(mockOnSelectStudent).toHaveBeenCalledTimes(3)
    
    // Should not trigger navigation
    expect(mockRouter.push).not.toHaveBeenCalled()
  })
})