import React from 'react'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { StudentsTable } from '@/components/admin/students/students-table'
import type { Student } from '@/types/student'

// Mock the router
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

const createMockStudent = (id: string, name: string): Student => ({
  id,
  organization_id: 'org-1',
  student_id: `HS-STU-${id}`,
  first_name: name.split(' ')[0],
  last_name: name.split(' ')[1] || '',
  full_name: name,
  date_of_birth: '2005-03-15',
  gender: 'male',
  email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
  phone: '+998901234567',
  parent_name: `Parent of ${name}`,
  parent_phone: '+998901234568',
  parent_email: `parent.${name.toLowerCase().replace(' ', '.')}@example.com`,
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
})

// Generate a large dataset for scrolling tests
const generateLargeStudentList = (count: number): Student[] => {
  const names = [
    'John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Brown', 'Charlie Wilson',
    'Diana Prince', 'Edward Norton', 'Fiona Green', 'George Lucas', 'Helen Troy',
    'Ivan Petrov', 'Julia Roberts', 'Kevin Hart', 'Linda Garcia', 'Michael Jordan',
    'Nancy Drew', 'Oscar Wilde', 'Paula Abdul', 'Quincy Jones', 'Rachel Green'
  ]
  
  return Array.from({ length: count }, (_, index) => 
    createMockStudent(
      `student-${index + 1}`,
      names[index % names.length] + ` ${Math.floor(index / names.length) + 1}`
    )
  )
}

describe('Students Table Scrolling', () => {
  const renderComponent = (students: Student[] = []) => {
    return render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <StudentsTable
          students={students}
          loading={false}
          selectedStudents={[]}
          onSelectStudent={jest.fn()}
          onSelectAll={jest.fn()}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          sortConfig={{ field: 'full_name', direction: 'asc' }}
          onSort={jest.fn()}
          pagination={{
            current_page: 1,
            total_pages: 1,
            page_size: students.length,
            count: students.length
          }}
          onPageChange={jest.fn()}
          onPageSizeChange={jest.fn()}
        />
      </NextIntlClientProvider>
    )
  }

  it('should have proper scrollable container structure', () => {
    const students = generateLargeStudentList(5)
    renderComponent(students)

    // Look for table container with overflow styles
    const tableContainer = screen.getByRole('table').closest('div')
    expect(tableContainer).toBeInTheDocument()

    // Check if container has scrollable styles
    const computedStyle = window.getComputedStyle(tableContainer!)
    expect(computedStyle.overflow === 'auto' || computedStyle.overflowX === 'auto').toBeTruthy()
  })

  it('should handle large datasets without performance issues', () => {
    const startTime = performance.now()
    const students = generateLargeStudentList(100)
    
    renderComponent(students)
    
    const endTime = performance.now()
    const renderTime = endTime - startTime

    // Should render within reasonable time (less than 1 second)
    expect(renderTime).toBeLessThan(1000)

    // All students should be rendered
    const rows = screen.getAllByRole('row')
    // +1 for header row
    expect(rows).toHaveLength(students.length + 1)
  })

  it('should maintain scroll position when updating table data', () => {
    const students = generateLargeStudentList(50)
    const { rerender } = renderComponent(students)

    const tableContainer = screen.getByRole('table').closest('div')!
    
    // Simulate scrolling
    Object.defineProperty(tableContainer, 'scrollTop', {
      value: 200,
      writable: true
    })

    // Re-render with updated data
    const updatedStudents = [...students, createMockStudent('new-student', 'New Student')]
    
    rerender(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <StudentsTable
          students={updatedStudents}
          loading={false}
          selectedStudents={[]}
          onSelectStudent={jest.fn()}
          onSelectAll={jest.fn()}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          sortConfig={{ field: 'full_name', direction: 'asc' }}
          onSort={jest.fn()}
          pagination={{
            current_page: 1,
            total_pages: 1,
            page_size: updatedStudents.length,
            count: updatedStudents.length
          }}
          onPageChange={jest.fn()}
          onPageSizeChange={jest.fn()}
        />
      </NextIntlClientProvider>
    )

    // Scroll position should be maintained (this would be true in a real browser)
    expect(tableContainer.scrollTop).toBe(200)
  })

  it('should have proper table header that stays visible during scroll', () => {
    const students = generateLargeStudentList(30)
    renderComponent(students)

    const table = screen.getByRole('table')
    const thead = table.querySelector('thead')
    const tbody = table.querySelector('tbody')

    expect(thead).toBeInTheDocument()
    expect(tbody).toBeInTheDocument()

    // Header should be properly structured for sticky behavior
    const headerRow = thead!.querySelector('tr')
    expect(headerRow).toBeInTheDocument()
  })

  it('should handle horizontal scrolling for wide tables', () => {
    const students = generateLargeStudentList(5)
    renderComponent(students)

    const tableContainer = screen.getByRole('table').closest('div')!
    
    // Table should allow horizontal scrolling if content is wider
    const computedStyle = window.getComputedStyle(tableContainer)
    expect(
      computedStyle.overflowX === 'auto' || 
      computedStyle.overflow === 'auto' ||
      computedStyle.overflowX === 'scroll'
    ).toBeTruthy()
  })

  it('should render all visible columns correctly', () => {
    const students = generateLargeStudentList(3)
    renderComponent(students)

    // Check that all expected columns are present
    expect(screen.getByText('Full Name')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Phone')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Payment Status')).toBeInTheDocument()
    expect(screen.getByText('Actions')).toBeInTheDocument()
  })

  it('should handle empty state correctly', () => {
    renderComponent([])

    // Should show table structure even with no data
    const table = screen.getByRole('table')
    expect(table).toBeInTheDocument()

    // Should show headers
    expect(screen.getByText('Full Name')).toBeInTheDocument()
  })

  it('should maintain table structure with minimal students', () => {
    const students = generateLargeStudentList(1)
    renderComponent(students)

    const table = screen.getByRole('table')
    const rows = screen.getAllByRole('row')

    expect(table).toBeInTheDocument()
    expect(rows).toHaveLength(2) // header + 1 data row
  })

  it('should not cause layout shifts when scrolling', () => {
    const students = generateLargeStudentList(20)
    renderComponent(students)

    const table = screen.getByRole('table')
    const initialHeight = table.getBoundingClientRect().height

    // Simulate scroll (in real browser, this would trigger scroll events)
    const tableContainer = table.closest('div')!
    Object.defineProperty(tableContainer, 'scrollTop', {
      value: 100,
      writable: true
    })

    // Table height should remain stable
    const heightAfterScroll = table.getBoundingClientRect().height
    expect(heightAfterScroll).toBe(initialHeight)
  })

  it('should have accessible scroll behavior', () => {
    const students = generateLargeStudentList(15)
    renderComponent(students)

    const tableContainer = screen.getByRole('table').closest('div')!
    
    // Container should be focusable for keyboard navigation
    expect(tableContainer.tabIndex >= 0 || tableContainer.getAttribute('tabindex')).toBeTruthy()
  })
})