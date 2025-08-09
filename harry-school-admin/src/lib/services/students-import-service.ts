import { ImportExportService, ImportResult, ImportError } from './import-export-service'
import { StudentService } from './student-service'
import { CreateStudentRequest } from '@/types/student'
import { z } from 'zod'

interface StudentImportRow {
  first_name: string
  last_name: string
  date_of_birth: string
  gender: 'male' | 'female' | 'other'
  email?: string
  phone: string
  parent_name: string
  parent_phone: string
  parent_email?: string
  enrollment_date: string
  status: 'active' | 'inactive' | 'graduated' | 'suspended' | 'dropped'
  current_level: string
  preferred_subjects: string
  academic_year?: string
  grade_level?: string
  payment_status: 'paid' | 'pending' | 'overdue' | 'partial'
  balance?: string
  tuition_fee?: string
  street: string
  city: string
  region: string
  postal_code?: string
  country: string
  emergency_contact_name: string
  emergency_contact_relationship: string
  emergency_contact_phone: string
  emergency_contact_email?: string
  medical_notes?: string
  notes?: string
}

const studentImportSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other']),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  parent_name: z.string().min(1, 'Parent name is required'),
  parent_phone: z.string().min(10, 'Parent phone number must be at least 10 digits'),
  parent_email: z.string().email('Invalid parent email format').optional().or(z.literal('')),
  enrollment_date: z.string().min(1, 'Enrollment date is required'),
  status: z.enum(['active', 'inactive', 'graduated', 'suspended', 'dropped']),
  current_level: z.string().min(1, 'Current level is required'),
  preferred_subjects: z.string().min(1, 'At least one preferred subject is required'),
  academic_year: z.string().optional().or(z.literal('')),
  grade_level: z.string().optional().or(z.literal('')),
  payment_status: z.enum(['paid', 'pending', 'overdue', 'partial']),
  balance: z.string().optional().or(z.literal('')),
  tuition_fee: z.string().optional().or(z.literal('')),
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  region: z.string().min(1, 'Region is required'),
  postal_code: z.string().optional().or(z.literal('')),
  country: z.string().min(1, 'Country is required'),
  emergency_contact_name: z.string().min(1, 'Emergency contact name is required'),
  emergency_contact_relationship: z.string().min(1, 'Emergency contact relationship is required'),
  emergency_contact_phone: z.string().min(10, 'Emergency contact phone must be at least 10 digits'),
  emergency_contact_email: z.string().email('Invalid emergency contact email').optional().or(z.literal('')),
  medical_notes: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal(''))
})

export class StudentsImportService {
  private organizationId: string
  private userId: string
  private studentService: StudentService

  constructor(organizationId: string, userId: string) {
    this.organizationId = organizationId
    this.userId = userId
    this.studentService = new StudentService()
  }

  async importFromFile(file: File): Promise<ImportResult<CreateStudentRequest>> {
    const errors: ImportError[] = []
    const validStudents: CreateStudentRequest[] = []

    try {
      // Read and parse the file
      const rawData = await ImportExportService.readExcelFile(file)
      const { headers, rows } = ImportExportService.parseFileData(rawData)

      if (rows.length === 0) {
        return {
          success: false,
          data: [],
          errors: [{ row: 1, message: 'No data rows found in file' }],
          totalRows: 0,
          successRows: 0,
          errorRows: 1
        }
      }

      // Validate headers
      const requiredHeaders = [
        'first_name',
        'last_name',
        'date_of_birth',
        'gender',
        'phone',
        'parent_name',
        'parent_phone',
        'enrollment_date',
        'status',
        'current_level',
        'preferred_subjects',
        'payment_status',
        'street',
        'city',
        'region',
        'country',
        'emergency_contact_name',
        'emergency_contact_relationship',
        'emergency_contact_phone'
      ]

      const missingHeaders = requiredHeaders.filter(header => 
        !headers.some(h => h.toLowerCase() === header.toLowerCase())
      )

      if (missingHeaders.length > 0) {
        return {
          success: false,
          data: [],
          errors: [{ 
            row: 1, 
            message: `Missing required columns: ${missingHeaders.join(', ')}` 
          }],
          totalRows: rows.length,
          successRows: 0,
          errorRows: rows.length
        }
      }

      // Process each row
      for (let i = 0; i < rows.length; i++) {
        const rowNumber = i + 2 // Account for header row
        const row = rows[i]

        try {
          const studentData = await this.processStudentRow(row, rowNumber)
          if (studentData) {
            validStudents.push(studentData)
          }
        } catch (error) {
          if (error instanceof z.ZodError) {
            error.errors.forEach(err => {
              errors.push({
                row: rowNumber,
                field: err.path.join('.'),
                message: err.message,
                value: err.path.length > 0 ? row[err.path[0]] : undefined
              })
            })
          } else {
            errors.push({
              row: rowNumber,
              message: error.message || 'Unknown error processing row'
            })
          }
        }
      }

      // Import valid students
      let successCount = 0
      if (validStudents.length > 0) {
        successCount = await this.importStudents(validStudents, errors)
      }

      return {
        success: successCount > 0,
        data: validStudents.slice(0, successCount),
        errors,
        totalRows: rows.length,
        successRows: successCount,
        errorRows: rows.length - successCount
      }

    } catch (error) {
      console.error('Import processing error:', error)
      return {
        success: false,
        data: [],
        errors: [{ row: 0, message: `File processing failed: ${error.message}` }],
        totalRows: 0,
        successRows: 0,
        errorRows: 1
      }
    }
  }

  private async processStudentRow(
    row: any, 
    rowNumber: number
  ): Promise<CreateStudentRequest | null> {
    // Clean the row data
    const cleanedRow: StudentImportRow = {
      first_name: this.cleanString(row.first_name || row.First_Name || row['First Name']),
      last_name: this.cleanString(row.last_name || row.Last_Name || row['Last Name']),
      date_of_birth: this.cleanString(row.date_of_birth || row.Date_of_Birth || row['Date of Birth']),
      gender: this.cleanString(row.gender || row.Gender)?.toLowerCase() as 'male' | 'female' | 'other',
      email: this.cleanString(row.email || row.Email),
      phone: this.cleanPhone(row.phone || row.Phone),
      parent_name: this.cleanString(row.parent_name || row.Parent_Name || row['Parent Name']),
      parent_phone: this.cleanPhone(row.parent_phone || row.Parent_Phone || row['Parent Phone']),
      parent_email: this.cleanString(row.parent_email || row.Parent_Email || row['Parent Email']),
      enrollment_date: this.cleanString(row.enrollment_date || row.Enrollment_Date || row['Enrollment Date']),
      status: this.cleanString(row.status || row.Status)?.toLowerCase() as any,
      current_level: this.cleanString(row.current_level || row.Current_Level || row['Current Level']),
      preferred_subjects: this.cleanString(row.preferred_subjects || row.Preferred_Subjects || row['Preferred Subjects']),
      academic_year: this.cleanString(row.academic_year || row.Academic_Year || row['Academic Year']),
      grade_level: this.cleanString(row.grade_level || row.Grade_Level || row['Grade Level']),
      payment_status: this.cleanString(row.payment_status || row.Payment_Status || row['Payment Status'])?.toLowerCase() as any,
      balance: this.cleanString(row.balance || row.Balance),
      tuition_fee: this.cleanString(row.tuition_fee || row.Tuition_Fee || row['Tuition Fee']),
      street: this.cleanString(row.street || row.Street || row.Address),
      city: this.cleanString(row.city || row.City),
      region: this.cleanString(row.region || row.Region || row.State),
      postal_code: this.cleanString(row.postal_code || row.Postal_Code || row['Postal Code']),
      country: this.cleanString(row.country || row.Country),
      emergency_contact_name: this.cleanString(row.emergency_contact_name || row['Emergency Contact Name']),
      emergency_contact_relationship: this.cleanString(row.emergency_contact_relationship || row['Emergency Contact Relationship']),
      emergency_contact_phone: this.cleanPhone(row.emergency_contact_phone || row['Emergency Contact Phone']),
      emergency_contact_email: this.cleanString(row.emergency_contact_email || row['Emergency Contact Email']),
      medical_notes: this.cleanString(row.medical_notes || row.Medical_Notes || row['Medical Notes']),
      notes: this.cleanString(row.notes || row.Notes)
    }

    // Validate the cleaned data
    const validatedRow = studentImportSchema.parse(cleanedRow)

    // Generate unique student ID
    const studentId = this.generateStudentId()

    // Transform to CreateStudentRequest format
    const studentRequest: CreateStudentRequest = {
      first_name: validatedRow.first_name,
      last_name: validatedRow.last_name,
      date_of_birth: validatedRow.date_of_birth,
      gender: validatedRow.gender,
      email: validatedRow.email || undefined,
      phone: validatedRow.phone,
      parent_name: validatedRow.parent_name,
      parent_phone: validatedRow.parent_phone,
      parent_email: validatedRow.parent_email || undefined,
      enrollment_date: validatedRow.enrollment_date,
      status: validatedRow.status,
      current_level: validatedRow.current_level,
      preferred_subjects: this.parseArrayField(validatedRow.preferred_subjects),
      academic_year: validatedRow.academic_year || undefined,
      grade_level: validatedRow.grade_level || undefined,
      payment_status: validatedRow.payment_status,
      balance: validatedRow.balance ? parseFloat(validatedRow.balance) : 0,
      tuition_fee: validatedRow.tuition_fee ? parseFloat(validatedRow.tuition_fee) : undefined,
      address: {
        street: validatedRow.street,
        city: validatedRow.city,
        region: validatedRow.region,
        postal_code: validatedRow.postal_code || undefined,
        country: validatedRow.country
      },
      emergency_contact: {
        name: validatedRow.emergency_contact_name,
        relationship: validatedRow.emergency_contact_relationship,
        phone: validatedRow.emergency_contact_phone,
        email: validatedRow.emergency_contact_email || undefined
      },
      medical_notes: validatedRow.medical_notes || undefined,
      notes: validatedRow.notes || undefined
    }

    return studentRequest
  }

  private cleanString(value: any): string {
    if (value === null || value === undefined) return ''
    return String(value).trim()
  }

  private cleanPhone(value: any): string {
    if (value === null || value === undefined) return ''
    // Remove all non-digit characters and format
    const digits = String(value).replace(/\D/g, '')
    return digits
  }

  private parseArrayField(value: string): string[] {
    if (!value) return []
    return value.split(/[,;|]/).map(item => item.trim()).filter(item => item.length > 0)
  }

  private generateStudentId(): string {
    // Generate a unique student ID based on current timestamp
    const year = new Date().getFullYear()
    const timestamp = Date.now().toString().slice(-6)
    return `HS-STU-${year}${timestamp}`
  }

  private async importStudents(
    students: CreateStudentRequest[], 
    errors: ImportError[]
  ): Promise<number> {
    let successCount = 0

    for (let i = 0; i < students.length; i++) {
      try {
        await this.studentService.create(students[i])
        successCount++
      } catch (error) {
        errors.push({
          row: i + 2, // Account for header row
          message: `Failed to create student: ${error.message}`
        })
      }
    }

    return successCount
  }

  static getRequiredFields(): string[] {
    return [
      'first_name',
      'last_name',
      'date_of_birth',
      'gender',
      'phone',
      'parent_name',
      'parent_phone',
      'enrollment_date',
      'status',
      'current_level',
      'preferred_subjects',
      'payment_status',
      'street',
      'city',
      'region',
      'country',
      'emergency_contact_name',
      'emergency_contact_relationship',
      'emergency_contact_phone'
    ]
  }

  static getOptionalFields(): string[] {
    return [
      'email',
      'parent_email',
      'academic_year',
      'grade_level',
      'balance',
      'tuition_fee',
      'postal_code',
      'emergency_contact_email',
      'medical_notes',
      'notes'
    ]
  }
}