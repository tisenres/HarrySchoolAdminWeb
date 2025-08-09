import type { 
  Teacher, 
  Qualification, 
  Certification, 
  Address, 
  EmergencyContact,
  CreateTeacherRequest,
  TeacherFilters,
  TeacherSortConfig
} from '@/types/teacher'

// Polyfill for crypto.randomUUID in test environment
const mockUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
  const r = Math.random() * 16 | 0
  const v = c === 'x' ? r : (r & 0x3 | 0x8)
  return v.toString(16)
})

// Mock data generators
export const createMockAddress = (overrides: Partial<Address> = {}): Address => ({
  street: '123 Main Street',
  city: 'Tashkent',
  region: 'Toshkent shahar',
  postal_code: '100000',
  country: 'Uzbekistan',
  ...overrides,
})

export const createMockEmergencyContact = (
  overrides: Partial<EmergencyContact> = {}
): EmergencyContact => ({
  name: 'John Emergency',
  relationship: 'spouse',
  phone: '+998901234567',
  email: 'emergency@example.com',
  address: createMockAddress(),
  ...overrides,
})

export const createMockQualification = (
  overrides: Partial<Qualification> = {}
): Qualification => ({
  id: mockUUID(),
  degree: 'Bachelor of Arts',
  institution: 'Tashkent State University',
  year: 2020,
  field_of_study: 'English Literature',
  gpa: 3.8,
  country: 'Uzbekistan',
  ...overrides,
})

export const createMockCertification = (
  overrides: Partial<Certification> = {}
): Certification => ({
  id: mockUUID(),
  name: 'TESOL Certificate',
  institution: 'Cambridge University',
  issue_date: new Date('2021-06-01'),
  expiry_date: new Date('2026-06-01'),
  credential_id: 'TESOL123456',
  verification_url: 'https://cambridge.org/verify/TESOL123456',
  ...overrides,
})

export const createMockTeacher = (overrides: Partial<Teacher> = {}): Teacher => ({
  id: mockUUID(),
  organization_id: mockUUID(),
  first_name: 'John',
  last_name: 'Doe',
  full_name: 'John Doe',
  email: 'john.doe@harryschool.uz',
  phone: '+998901234567',
  date_of_birth: new Date('1990-05-15'),
  gender: 'male',
  employee_id: 'HS2024001',
  hire_date: new Date('2024-01-15'),
  employment_status: 'active',
  contract_type: 'full_time',
  salary_amount: 8000000,
  salary_currency: 'UZS',
  qualifications: [createMockQualification()],
  specializations: ['English', 'IELTS Preparation'],
  certifications: [createMockCertification()],
  languages_spoken: ['en', 'ru', 'uz'],
  address: createMockAddress(),
  emergency_contact: createMockEmergencyContact(),
  documents: [],
  notes: 'Excellent teacher with strong communication skills',
  profile_image_url: 'https://example.com/profile.jpg',
  is_active: true,
  created_at: new Date('2024-01-15T09:00:00Z'),
  updated_at: new Date('2024-01-15T09:00:00Z'),
  created_by: 'admin-user-id',
  updated_by: 'admin-user-id',
  ...overrides,
})

export const createMockCreateTeacherRequest = (
  overrides: Partial<CreateTeacherRequest> = {}
): CreateTeacherRequest => ({
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@harryschool.uz',
  phone: '+998901234567',
  date_of_birth: new Date('1990-05-15'),
  gender: 'male',
  employee_id: 'HS2024001',
  hire_date: new Date('2024-01-15'),
  employment_status: 'active',
  contract_type: 'full_time',
  salary_amount: 8000000,
  specializations: ['English', 'IELTS Preparation'],
  qualifications: [createMockQualification()],
  certifications: [createMockCertification()],
  languages_spoken: ['en', 'ru'],
  address: createMockAddress(),
  emergency_contact: createMockEmergencyContact(),
  notes: 'Test notes',
  ...overrides,
})

export const createMockTeacherList = (count: number = 5): Teacher[] => {
  return Array.from({ length: count }, (_, index) => 
    createMockTeacher({
      id: `teacher-${index + 1}`,
      first_name: `Teacher${index + 1}`,
      last_name: `Last${index + 1}`,
      full_name: `Teacher${index + 1} Last${index + 1}`,
      email: `teacher${index + 1}@harryschool.uz`,
      phone: `+99890123456${index}`,
      employee_id: `HS202400${index + 1}`,
      employment_status: index % 2 === 0 ? 'active' : 'inactive',
      specializations: index % 2 === 0 ? ['English'] : ['Mathematics'],
    })
  )
}

export const createMockTeacherFilters = (
  overrides: Partial<TeacherFilters> = {}
): TeacherFilters => {
  const baseFilters: TeacherFilters = {
    search: '',
  }
  return {
    ...baseFilters,
    ...overrides,
  }
}

export const createMockTeacherSortConfig = (
  overrides: Partial<TeacherSortConfig> = {}
): TeacherSortConfig => ({
  field: 'full_name',
  direction: 'asc',
  ...overrides,
})

// Mock service responses
export const createMockTeacherServiceResponse = (teachers: Teacher[] = []) => ({
  data: teachers,
  count: teachers.length,
  total_pages: Math.ceil(teachers.length / 20),
})

// Mock API responses
export const createMockApiResponse = <T>(data: T, success: boolean = true) => ({
  success,
  data,
  error: success ? null : 'Mock error message',
  message: success ? 'Success' : 'Error occurred',
})

// Mock form errors
export const createMockFormErrors = () => ({
  first_name: { message: 'First name is required' },
  last_name: { message: 'Last name is required' },
  phone: { message: 'Invalid phone format' },
  email: { message: 'Invalid email format' },
})

// Mock file for image upload testing
export const createMockFile = (
  name: string = 'test-image.jpg',
  type: string = 'image/jpeg',
  size: number = 1024 * 1024
): File => {
  const file = new File([''], name, { type })
  Object.defineProperty(file, 'size', {
    value: size,
    writable: false
  })
  return file
}

// Mock drag event
export const createMockDragEvent = (files: File[]): Partial<DragEvent> => ({
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
  dataTransfer: {
    files: {
      ...files,
      length: files.length,
      item: (index: number) => files[index],
    } as FileList,
  } as DataTransfer,
})

// Mock specialized teachers data
export const createSpecializedTeachers = () => ({
  english: createMockTeacherList(3).map((teacher, index) => ({
    ...teacher,
    id: `english-teacher-${index + 1}`,
    employee_id: `HS-ENG-${index + 1}`,
    specializations: ['English', 'Business English'],
    employment_status: 'active' as const,
  })),
  math: createMockTeacherList(2).map((teacher, index) => ({
    ...teacher,
    id: `math-teacher-${index + 1}`,
    employee_id: `HS-MATH-${index + 1}`,
    specializations: ['Mathematics', 'Statistics'],
    employment_status: 'active' as const,
  })),
  mixed: createMockTeacherList(4).map((teacher, index) => ({
    ...teacher,
    id: `mixed-teacher-${index + 1}`,
    employee_id: `HS-MIX-${index + 1}`,
    specializations: index % 2 === 0 ? ['English'] : ['Mathematics'],
    employment_status: index % 3 === 0 ? ('inactive' as const) : ('active' as const),
  })),
})

// Mock validation test cases
export const validationTestCases = {
  validTeacher: createMockCreateTeacherRequest(),
  invalidEmail: createMockCreateTeacherRequest({
    email: 'invalid-email'
  }),
  invalidPhone: createMockCreateTeacherRequest({
    phone: '123456789'
  }),
  missingFirstName: createMockCreateTeacherRequest({
    first_name: ''
  }),
  missingLastName: createMockCreateTeacherRequest({
    last_name: ''
  }),
  futureBirthDate: createMockCreateTeacherRequest({
    date_of_birth: new Date(Date.now() + 86400000) // tomorrow
  }),
  futureHireDate: createMockCreateTeacherRequest({
    hire_date: new Date(Date.now() + 86400000) // tomorrow
  }),
  longNotes: createMockCreateTeacherRequest({
    notes: 'a'.repeat(2001) // exceeds 2000 character limit
  }),
}

// Mock event handlers
export const createMockHandlers = () => ({
  onEdit: jest.fn(),
  onDelete: jest.fn(),
  onBulkDelete: jest.fn(),
  onBulkStatusChange: jest.fn(),
  onBulkArchive: jest.fn(),
  onBulkRestore: jest.fn(),
  onExport: jest.fn(),
  onSelectionChange: jest.fn(),
  onSortChange: jest.fn(),
  onPageChange: jest.fn(),
  onPageSizeChange: jest.fn(),
  onFiltersChange: jest.fn(),
  onSubmit: jest.fn(),
  onCancel: jest.fn(),
})