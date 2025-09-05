import { 
  createTeacherSchema,
  updateTeacherSchema,
  teacherFiltersSchema,
  teacherSortSchema,
  addressSchema,
  emergencyContactSchema,
  qualificationSchema,
  certificationSchema
} from '@/lib/validations/teacher'
import { validationTestCases } from '../../utils/mock-data'

describe('Teacher Validation Schemas', () => {
  describe('createTeacherSchema', () => {
    it('validates a complete valid teacher object', () => {
      const result = createTeacherSchema.safeParse(validationTestCases.validTeacher)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.first_name).toBe(validationTestCases.validTeacher.first_name)
        expect(result.data.is_active).toBe(true) // Default value
        expect(result.data.salary_currency).toBe('UZS') // Default value
      }
    })

    describe('Required Fields', () => {
      it('requires first_name', () => {
        const result = createTeacherSchema.safeParse({
          ...validationTestCases.validTeacher,
          first_name: ''
        })

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues).toContainEqual(
            expect.objectContaining({
              path: ['first_name'],
              message: 'First name is required'
            })
          )
        }
      })

      it('requires last_name', () => {
        const result = createTeacherSchema.safeParse({
          ...validationTestCases.validTeacher,
          last_name: ''
        })

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues).toContainEqual(
            expect.objectContaining({
              path: ['last_name'],
              message: 'Last name is required'
            })
          )
        }
      })

      it('requires phone', () => {
        const result = createTeacherSchema.safeParse({
          ...validationTestCases.validTeacher,
          phone: ''
        })

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues).toContainEqual(
            expect.objectContaining({
              path: ['phone'],
              message: 'Phone must be valid Uzbekistan format (+998XXXXXXXXX)'
            })
          )
        }
      })

      it('requires hire_date', () => {
        const result = createTeacherSchema.safeParse({
          ...validationTestCases.validTeacher,
          hire_date: undefined
        })

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.some(issue => 
            issue.path.includes('hire_date')
          )).toBe(true)
        }
      })
    })

    describe('Name Validation', () => {
      it('validates first_name format (letters and spaces only)', () => {
        const result = createTeacherSchema.safeParse({
          ...validationTestCases.validTeacher,
          first_name: 'John123'
        })

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues).toContainEqual(
            expect.objectContaining({
              message: 'First name can only contain letters and spaces'
            })
          )
        }
      })

      it('validates last_name format (letters and spaces only)', () => {
        const result = createTeacherSchema.safeParse({
          ...validationTestCases.validTeacher,
          last_name: 'Doe@123'
        })

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues).toContainEqual(
            expect.objectContaining({
              message: 'Last name can only contain letters and spaces'
            })
          )
        }
      })

      it('accepts names with spaces', () => {
        const result = createTeacherSchema.safeParse({
          ...validationTestCases.validTeacher,
          first_name: 'Mary Jane',
          last_name: 'Smith Watson'
        })

        expect(result.success).toBe(true)
      })

      it('accepts Cyrillic characters', () => {
        const result = createTeacherSchema.safeParse({
          ...validationTestCases.validTeacher,
          first_name: 'Иван',
          last_name: 'Петров'
        })

        expect(result.success).toBe(true)
      })

      it('enforces name length limits', () => {
        const longName = 'a'.repeat(101)
        
        const result = createTeacherSchema.safeParse({
          ...validationTestCases.validTeacher,
          first_name: longName
        })

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues).toContainEqual(
            expect.objectContaining({
              message: 'First name must be less than 100 characters'
            })
          )
        }
      })
    })

    describe('Email Validation', () => {
      it('accepts valid email formats', () => {
        const validEmails = [
          'test@example.com',
          'user.name@domain.co.uk',
          'teacher123@harryschool.uz',
          ''
        ]

        validEmails.forEach(email => {
          const result = createTeacherSchema.safeParse({
            ...validationTestCases.validTeacher,
            email
          })
          expect(result.success).toBe(true)
        })
      })

      it('rejects invalid email formats', () => {
        const invalidEmails = [
          'invalid-email',
          '@domain.com',
          'user@',
          'user..name@domain.com'
        ]

        invalidEmails.forEach(email => {
          const result = createTeacherSchema.safeParse({
            ...validationTestCases.validTeacher,
            email
          })
          expect(result.success).toBe(false)
        })
      })

      it('enforces email length limit', () => {
        const longEmail = 'a'.repeat(250) + '@example.com'
        
        const result = createTeacherSchema.safeParse({
          ...validationTestCases.validTeacher,
          email: longEmail
        })

        expect(result.success).toBe(false)
      })
    })

    describe('Phone Validation', () => {
      it('accepts valid Uzbekistan phone format', () => {
        const validPhones = [
          '+998901234567',
          '+998771234567',
          '+998951234567'
        ]

        validPhones.forEach(phone => {
          const result = createTeacherSchema.safeParse({
            ...validationTestCases.validTeacher,
            phone
          })
          expect(result.success).toBe(true)
        })
      })

      it('rejects invalid phone formats', () => {
        const invalidPhones = [
          '998901234567', // Missing +
          '+99890123456', // Too short
          '+9989012345678', // Too long
          '+1234567890123', // Wrong country code
          'phone-number', // Not numeric
          ''
        ]

        invalidPhones.forEach(phone => {
          const result = createTeacherSchema.safeParse({
            ...validationTestCases.validTeacher,
            phone
          })
          expect(result.success).toBe(false)
        })
      })
    })

    describe('Date Validation', () => {
      it('rejects future birth dates', () => {
        const result = createTeacherSchema.safeParse(validationTestCases.futureBirthDate)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues).toContainEqual(
            expect.objectContaining({
              path: ['date_of_birth'],
              message: 'Date of birth cannot be in the future'
            })
          )
        }
      })

      it('rejects future hire dates', () => {
        const result = createTeacherSchema.safeParse(validationTestCases.futureHireDate)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues).toContainEqual(
            expect.objectContaining({
              path: ['hire_date'],
              message: 'Hire date cannot be in the future'
            })
          )
        }
      })

      it('accepts valid date ranges', () => {
        const result = createTeacherSchema.safeParse({
          ...validationTestCases.validTeacher,
          date_of_birth: new Date('1990-01-01'),
          hire_date: new Date('2024-01-01')
        })

        expect(result.success).toBe(true)
      })
    })

    describe('Enum Validation', () => {
      it('validates gender enum', () => {
        const validGenders = ['male', 'female', 'other', undefined]
        
        validGenders.forEach(gender => {
          const result = createTeacherSchema.safeParse({
            ...validationTestCases.validTeacher,
            gender
          })
          expect(result.success).toBe(true)
        })
      })

      it('rejects invalid gender values', () => {
        const result = createTeacherSchema.safeParse({
          ...validationTestCases.validTeacher,
          gender: 'invalid' as any
        })

        expect(result.success).toBe(false)
      })

      it('validates employment_status enum', () => {
        const validStatuses = ['active', 'inactive', 'on_leave', 'terminated']
        
        validStatuses.forEach(status => {
          const result = createTeacherSchema.safeParse({
            ...validationTestCases.validTeacher,
            employment_status: status as any
          })
          expect(result.success).toBe(true)
        })
      })

      it('validates contract_type enum', () => {
        const validTypes = ['full_time', 'part_time', 'contract', 'substitute', undefined]
        
        validTypes.forEach(type => {
          const result = createTeacherSchema.safeParse({
            ...validationTestCases.validTeacher,
            contract_type: type as any
          })
          expect(result.success).toBe(true)
        })
      })
    })

    describe('Salary Validation', () => {
      it('accepts valid salary amounts', () => {
        const result = createTeacherSchema.safeParse({
          ...validationTestCases.validTeacher,
          salary_amount: 8000000
        })

        expect(result.success).toBe(true)
      })

      it('rejects negative salary amounts', () => {
        const result = createTeacherSchema.safeParse({
          ...validationTestCases.validTeacher,
          salary_amount: -1000
        })

        expect(result.success).toBe(false)
      })

      it('rejects extremely large salary amounts', () => {
        const result = createTeacherSchema.safeParse({
          ...validationTestCases.validTeacher,
          salary_amount: 999999999999 // Exceeds max
        })

        expect(result.success).toBe(false)
      })

      it('has default currency', () => {
        const result = createTeacherSchema.safeParse(validationTestCases.validTeacher)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.salary_currency).toBe('UZS')
        }
      })
    })

    describe('Notes Validation', () => {
      it('accepts valid notes', () => {
        const result = createTeacherSchema.safeParse({
          ...validationTestCases.validTeacher,
          notes: 'Valid notes about the teacher'
        })

        expect(result.success).toBe(true)
      })

      it('rejects notes exceeding character limit', () => {
        const result = createTeacherSchema.safeParse(validationTestCases.longNotes)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues).toContainEqual(
            expect.objectContaining({
              path: ['notes'],
              message: 'Notes must be less than 2000 characters'
            })
          )
        }
      })

      it('accepts empty notes', () => {
        const result = createTeacherSchema.safeParse({
          ...validationTestCases.validTeacher,
          notes: ''
        })

        expect(result.success).toBe(true)
      })
    })

    describe('Array Fields', () => {
      it('has default empty arrays', () => {
        const result = createTeacherSchema.safeParse({
          first_name: 'John',
          last_name: 'Doe',
          phone: '+998901234567',
          hire_date: new Date('2024-01-15')
        })

        if (!result.success) {
          console.log('Validation errors:', result.error.issues)
        }
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.qualifications).toEqual([])
          expect(result.data.specializations).toEqual([])
          expect(result.data.certifications).toEqual([])
          expect(result.data.languages_spoken).toEqual([])
        }
      })

      it('accepts arrays of strings for specializations and languages', () => {
        const result = createTeacherSchema.safeParse({
          ...validationTestCases.validTeacher,
          specializations: ['English', 'Mathematics'],
          languages_spoken: ['en', 'ru', 'uz']
        })

        expect(result.success).toBe(true)
      })
    })
  })

  describe('updateTeacherSchema', () => {
    it('makes all fields optional except ID', () => {
      const result = updateTeacherSchema.safeParse({
        id: '123e4567-e89b-12d3-a456-426614174000',
        first_name: 'Updated John'
      })

      expect(result.success).toBe(true)
    })

    it('requires valid UUID for ID', () => {
      const result = updateTeacherSchema.safeParse({
        id: 'invalid-id',
        first_name: 'John'
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            path: ['id'],
            message: 'Invalid teacher ID'
          })
        )
      }
    })

    it('validates partial updates', () => {
      const validUuid = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
      const result = updateTeacherSchema.safeParse({
        id: validUuid,
        email: 'newemail@example.com',
        employment_status: 'inactive'
      })

      expect(result.success).toBe(true)
    })
  })

  describe('addressSchema', () => {
    it('validates complete address', () => {
      const validAddress = {
        street: '123 Main Street',
        city: 'Tashkent',
        region: 'Toshkent shahar',
        postal_code: '100000',
        country: 'Uzbekistan'
      }

      const result = addressSchema.safeParse(validAddress)
      expect(result.success).toBe(true)
    })

    it('requires street, city, region, and country', () => {
      const incompleteAddress = {
        street: '123 Main Street'
        // Missing other required fields
      }

      const result = addressSchema.safeParse(incompleteAddress)
      expect(result.success).toBe(false)
    })

    it('makes postal_code optional', () => {
      const addressWithoutPostal = {
        street: '123 Main Street',
        city: 'Tashkent',
        region: 'Toshkent shahar',
        country: 'Uzbekistan'
        // postal_code is optional
      }

      const result = addressSchema.safeParse(addressWithoutPostal)
      expect(result.success).toBe(true)
    })
  })

  describe('emergencyContactSchema', () => {
    it('validates complete emergency contact', () => {
      const validContact = {
        name: 'Jane Doe',
        relationship: 'spouse',
        phone: '+998901234567',
        email: 'jane@example.com'
      }

      const result = emergencyContactSchema.safeParse(validContact)
      expect(result.success).toBe(true)
    })

    it('requires name, relationship, and phone', () => {
      const incompleteContact = {
        name: 'Jane Doe'
        // Missing required fields
      }

      const result = emergencyContactSchema.safeParse(incompleteContact)
      expect(result.success).toBe(false)
    })

    it('validates phone format', () => {
      const contactWithInvalidPhone = {
        name: 'Jane Doe',
        relationship: 'spouse',
        phone: '123456789' // Invalid format
      }

      const result = emergencyContactSchema.safeParse(contactWithInvalidPhone)
      expect(result.success).toBe(false)
    })

    it('makes email optional', () => {
      const contactWithoutEmail = {
        name: 'Jane Doe',
        relationship: 'spouse',
        phone: '+998901234567'
        // email is optional
      }

      const result = emergencyContactSchema.safeParse(contactWithoutEmail)
      expect(result.success).toBe(true)
    })
  })

  describe('qualificationSchema', () => {
    it('validates complete qualification', () => {
      const validQualification = {
        id: crypto.randomUUID(),
        degree: 'Bachelor of Arts',
        institution: 'University of Tashkent',
        year: 2020,
        field_of_study: 'English Literature',
        gpa: 3.8,
        country: 'Uzbekistan'
      }

      const result = qualificationSchema.safeParse(validQualification)
      expect(result.success).toBe(true)
    })

    it('requires degree, institution, and year', () => {
      const incompleteQualification = {
        degree: 'Bachelor of Arts'
        // Missing required fields
      }

      const result = qualificationSchema.safeParse(incompleteQualification)
      expect(result.success).toBe(false)
    })

    it('validates year range', () => {
      const qualificationWithInvalidYear = {
        degree: 'Bachelor of Arts',
        institution: 'University',
        year: 1900 // Too old
      }

      const result = qualificationSchema.safeParse(qualificationWithInvalidYear)
      expect(result.success).toBe(false)
    })

    it('validates GPA range', () => {
      const qualificationWithInvalidGPA = {
        degree: 'Bachelor of Arts',
        institution: 'University',
        year: 2020,
        gpa: 5.0 // Above 4.0 scale
      }

      const result = qualificationSchema.safeParse(qualificationWithInvalidGPA)
      expect(result.success).toBe(false)
    })

    it('generates default ID', () => {
      const qualification = {
        degree: 'Bachelor of Arts',
        institution: 'University',
        year: 2020
      }

      const result = qualificationSchema.safeParse(qualification)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id).toBeDefined()
        expect(typeof result.data.id).toBe('string')
      }
    })
  })

  describe('certificationSchema', () => {
    it('validates complete certification', () => {
      const validCertification = {
        id: crypto.randomUUID(),
        name: 'TESOL Certificate',
        institution: 'Cambridge University',
        issue_date: new Date('2021-01-01'),
        expiry_date: new Date('2026-01-01'),
        credential_id: 'TESOL123456',
        verification_url: 'https://cambridge.org/verify'
      }

      const result = certificationSchema.safeParse(validCertification)
      expect(result.success).toBe(true)
    })

    it('requires name, institution, and issue_date', () => {
      const incompleteCertification = {
        name: 'TESOL Certificate'
        // Missing required fields
      }

      const result = certificationSchema.safeParse(incompleteCertification)
      expect(result.success).toBe(false)
    })

    it('validates URL format', () => {
      const certWithInvalidURL = {
        name: 'TESOL Certificate',
        institution: 'Cambridge University',
        issue_date: new Date(),
        verification_url: 'not-a-url'
      }

      const result = certificationSchema.safeParse(certWithInvalidURL)
      expect(result.success).toBe(false)
    })

    it('accepts empty string for URL', () => {
      const certWithEmptyURL = {
        name: 'TESOL Certificate',
        institution: 'Cambridge University',
        issue_date: new Date(),
        verification_url: ''
      }

      const result = certificationSchema.safeParse(certWithEmptyURL)
      expect(result.success).toBe(true)
    })
  })

  describe('teacherFiltersSchema', () => {
    it('validates all filter options', () => {
      const validFilters = {
        search: 'John Doe',
        employment_status: ['active', 'inactive'],
        specializations: ['English', 'Mathematics'],
        contract_type: ['full_time'],
        hire_date_from: new Date('2024-01-01'),
        hire_date_to: new Date('2024-12-31'),
        is_active: true
      }

      const result = teacherFiltersSchema.safeParse(validFilters)
      expect(result.success).toBe(true)
    })

    it('makes all fields optional', () => {
      const result = teacherFiltersSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('validates array fields', () => {
      const filtersWithArrays = {
        employment_status: ['active'],
        specializations: ['English', 'Mathematics', 'Science'],
        contract_type: ['full_time', 'part_time']
      }

      const result = teacherFiltersSchema.safeParse(filtersWithArrays)
      expect(result.success).toBe(true)
    })

    it('validates boolean fields', () => {
      const filtersWithBooleans = {
        is_active: true
      }

      const result = teacherFiltersSchema.safeParse(filtersWithBooleans)
      expect(result.success).toBe(true)

      const filtersWithFalseBooleans = {
        is_active: false
      }

      const result2 = teacherFiltersSchema.safeParse(filtersWithFalseBooleans)
      expect(result2.success).toBe(true)
    })
  })

  describe('teacherSortSchema', () => {
    it('validates sort configuration', () => {
      const validSort = {
        field: 'full_name',
        direction: 'asc'
      }

      const result = teacherSortSchema.safeParse(validSort)
      expect(result.success).toBe(true)
    })

    it('validates all allowed sort fields', () => {
      const validFields = [
        'full_name',
        'email', 
        'phone',
        'employment_status',
        'hire_date',
        'active_groups',
        'total_students'
      ]

      validFields.forEach(field => {
        const result = teacherSortSchema.safeParse({
          field,
          direction: 'asc'
        })
        expect(result.success).toBe(true)
      })
    })

    it('validates sort directions', () => {
      const directions = ['asc', 'desc']

      directions.forEach(direction => {
        const result = teacherSortSchema.safeParse({
          field: 'full_name',
          direction
        })
        expect(result.success).toBe(true)
      })
    })

    it('rejects invalid field names', () => {
      const result = teacherSortSchema.safeParse({
        field: 'invalid_field',
        direction: 'asc'
      })

      expect(result.success).toBe(false)
    })

    it('rejects invalid directions', () => {
      const result = teacherSortSchema.safeParse({
        field: 'full_name',
        direction: 'invalid'
      })

      expect(result.success).toBe(false)
    })
  })

  describe('Edge Cases and Data Types', () => {
    it('handles null values appropriately', () => {
      const dataWithNulls = {
        ...validationTestCases.validTeacher,
        email: null,
        date_of_birth: null,
        gender: null
      }

      const result = createTeacherSchema.safeParse(dataWithNulls)
      // Should transform nulls to undefined for optional fields
      expect(result.success).toBe(false) // null is not same as undefined or empty string
    })

    it('handles undefined values for optional fields', () => {
      const dataWithUndefined = {
        first_name: 'John',
        last_name: 'Doe',
        phone: '+998901234567',
        hire_date: new Date('2024-01-15'),
        email: undefined,
        date_of_birth: undefined,
        gender: undefined
      }

      const result = createTeacherSchema.safeParse(dataWithUndefined)
      if (!result.success) {
        console.log('Validation errors:', result.error.issues)
      }
      expect(result.success).toBe(true)
    })

    it('handles empty arrays vs undefined arrays', () => {
      const dataWithEmptyArrays = {
        ...validationTestCases.validTeacher,
        specializations: [],
        languages_spoken: [],
        qualifications: [],
        certifications: []
      }

      const result = createTeacherSchema.safeParse(dataWithEmptyArrays)
      expect(result.success).toBe(true)
    })

    it('validates nested object structures deeply', () => {
      const dataWithInvalidNesting = {
        ...validationTestCases.validTeacher,
        address: {
          street: '',  // Should fail - required field empty
          city: 'Tashkent',
          region: 'Region',
          country: 'Uzbekistan'
        }
      }

      const result = createTeacherSchema.safeParse(dataWithInvalidNesting)
      expect(result.success).toBe(false)
    })

    it('preserves data types in successful validation', () => {
      const result = createTeacherSchema.safeParse(validationTestCases.validTeacher)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.hire_date instanceof Date).toBe(true)
        expect(typeof result.data.is_active).toBe('boolean')
        expect(Array.isArray(result.data.specializations)).toBe(true)
      }
    })
  })
})