import { ImportExportService, ImportResult, ImportError } from './import-export-service'
import { TeacherService } from './teacher-service'
import { CreateTeacherRequest } from '@/types/teacher'
import { z } from 'zod'

interface TeacherImportRow {
  first_name: string
  last_name: string
  email?: string
  phone: string
  date_of_birth?: string
  gender?: 'male' | 'female' | 'other'
  employee_id?: string
  hire_date: string
  employment_status: 'active' | 'inactive' | 'on_leave' | 'terminated'
  contract_type?: 'full_time' | 'part_time' | 'contract' | 'substitute'
  salary_amount?: string
  specializations: string
  languages_spoken: string
  qualifications?: string
  street?: string
  city?: string
  region?: string
  postal_code?: string
  country?: string
  emergency_contact_name?: string
  emergency_contact_relationship?: string
  emergency_contact_phone?: string
  emergency_contact_email?: string
  notes?: string
}

const teacherImportSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  date_of_birth: z.string().optional().or(z.literal('')),
  gender: z.enum(['male', 'female', 'other']).optional().or(z.literal('')),
  employee_id: z.string().optional().or(z.literal('')),
  hire_date: z.string().min(1, 'Hire date is required'),
  employment_status: z.enum(['active', 'inactive', 'on_leave', 'terminated']),
  contract_type: z.enum(['full_time', 'part_time', 'contract', 'substitute']).optional().or(z.literal('')),
  salary_amount: z.string().optional().or(z.literal('')),
  specializations: z.string().min(1, 'At least one specialization is required'),
  languages_spoken: z.string().min(1, 'At least one language is required'),
  qualifications: z.string().optional().or(z.literal('')),
  street: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  region: z.string().optional().or(z.literal('')),
  postal_code: z.string().optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
  emergency_contact_name: z.string().optional().or(z.literal('')),
  emergency_contact_relationship: z.string().optional().or(z.literal('')),
  emergency_contact_phone: z.string().optional().or(z.literal('')),
  emergency_contact_email: z.string().email('Invalid emergency contact email').optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal(''))
})

export class TeachersImportService {
  private organizationId: string
  private userId: string
  private teacherService: TeacherService

  constructor(organizationId: string, userId: string) {
    this.organizationId = organizationId
    this.userId = userId
    this.teacherService = new TeacherService()
  }

  async importFromFile(file: File): Promise<ImportResult<CreateTeacherRequest>> {
    const errors: ImportError[] = []
    const validTeachers: CreateTeacherRequest[] = []

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
        'phone',
        'hire_date',
        'employment_status',
        'specializations',
        'languages_spoken'
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
          const teacherData = await this.processTeacherRow(row, rowNumber)
          if (teacherData) {
            validTeachers.push(teacherData)
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

      // Import valid teachers
      let successCount = 0
      if (validTeachers.length > 0) {
        successCount = await this.importTeachers(validTeachers, errors)
      }

      return {
        success: successCount > 0,
        data: validTeachers.slice(0, successCount),
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

  private async processTeacherRow(
    row: any, 
    rowNumber: number
  ): Promise<CreateTeacherRequest | null> {
    // Clean the row data
    const cleanedRow: TeacherImportRow = {
      first_name: this.cleanString(row.first_name || row.First_Name || row['First Name']),
      last_name: this.cleanString(row.last_name || row.Last_Name || row['Last Name']),
      email: this.cleanString(row.email || row.Email),
      phone: this.cleanPhone(row.phone || row.Phone),
      date_of_birth: this.cleanString(row.date_of_birth || row.Date_of_Birth || row['Date of Birth']),
      gender: this.cleanString(row.gender || row.Gender)?.toLowerCase() as 'male' | 'female' | 'other',
      employee_id: this.cleanString(row.employee_id || row.Employee_ID || row['Employee ID']),
      hire_date: this.cleanString(row.hire_date || row.Hire_Date || row['Hire Date']),
      employment_status: this.cleanString(row.employment_status || row.Employment_Status || row['Employment Status'])?.toLowerCase() as any,
      contract_type: this.cleanString(row.contract_type || row.Contract_Type || row['Contract Type'])?.toLowerCase() as any,
      salary_amount: this.cleanString(row.salary_amount || row.Salary_Amount || row.Salary || row['Salary Amount']),
      specializations: this.cleanString(row.specializations || row.Specializations),
      languages_spoken: this.cleanString(row.languages_spoken || row.Languages_Spoken || row.Languages || row['Languages Spoken']),
      qualifications: this.cleanString(row.qualifications || row.Qualifications),
      street: this.cleanString(row.street || row.Street || row.Address),
      city: this.cleanString(row.city || row.City),
      region: this.cleanString(row.region || row.Region || row.State),
      postal_code: this.cleanString(row.postal_code || row.Postal_Code || row['Postal Code']),
      country: this.cleanString(row.country || row.Country),
      emergency_contact_name: this.cleanString(row.emergency_contact_name || row['Emergency Contact Name']),
      emergency_contact_relationship: this.cleanString(row.emergency_contact_relationship || row['Emergency Contact Relationship']),
      emergency_contact_phone: this.cleanString(row.emergency_contact_phone || row['Emergency Contact Phone']),
      emergency_contact_email: this.cleanString(row.emergency_contact_email || row['Emergency Contact Email']),
      notes: this.cleanString(row.notes || row.Notes)
    }

    // Validate the cleaned data
    const validatedRow = teacherImportSchema.parse(cleanedRow)

    // Transform to CreateTeacherRequest format
    const teacherRequest: CreateTeacherRequest = {
      first_name: validatedRow.first_name,
      last_name: validatedRow.last_name,
      email: validatedRow.email || undefined,
      phone: validatedRow.phone,
      date_of_birth: validatedRow.date_of_birth ? new Date(validatedRow.date_of_birth) : undefined,
      gender: validatedRow.gender || undefined,
      employee_id: validatedRow.employee_id || undefined,
      hire_date: new Date(validatedRow.hire_date),
      employment_status: validatedRow.employment_status,
      contract_type: validatedRow.contract_type || undefined,
      salary_amount: validatedRow.salary_amount ? parseFloat(validatedRow.salary_amount) : undefined,
      specializations: this.parseArrayField(validatedRow.specializations),
      languages_spoken: this.parseArrayField(validatedRow.languages_spoken),
      qualifications: validatedRow.qualifications ? this.parseQualifications(validatedRow.qualifications) : [],
      certifications: [],
      address: this.parseAddress(validatedRow),
      emergency_contact: this.parseEmergencyContact(validatedRow),
      notes: validatedRow.notes || undefined
    }

    return teacherRequest
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

  private parseQualifications(value: string): any[] {
    if (!value) return []
    
    // Simple parsing - each qualification separated by semicolon
    const qualifications = value.split(';').map(qual => {
      const parts = qual.trim().split(',')
      return {
        id: crypto.randomUUID(),
        degree: parts[0]?.trim() || 'Unknown',
        institution: parts[1]?.trim() || 'Unknown',
        year: parts[2]?.trim() ? parseInt(parts[2].trim()) : new Date().getFullYear(),
        field_of_study: parts[3]?.trim() || undefined
      }
    }).filter(qual => qual.degree !== 'Unknown' || qual.institution !== 'Unknown')

    return qualifications
  }

  private parseAddress(row: TeacherImportRow): any | undefined {
    if (!row.street && !row.city && !row.region && !row.country) {
      return undefined
    }

    return {
      street: row.street || '',
      city: row.city || '',
      region: row.region || '',
      postal_code: row.postal_code || '',
      country: row.country || 'Uzbekistan'
    }
  }

  private parseEmergencyContact(row: TeacherImportRow): any | undefined {
    if (!row.emergency_contact_name && !row.emergency_contact_phone) {
      return undefined
    }

    return {
      name: row.emergency_contact_name || '',
      relationship: row.emergency_contact_relationship || 'Emergency Contact',
      phone: row.emergency_contact_phone || '',
      email: row.emergency_contact_email || undefined
    }
  }

  private async importTeachers(
    teachers: CreateTeacherRequest[], 
    errors: ImportError[]
  ): Promise<number> {
    let successCount = 0

    for (let i = 0; i < teachers.length; i++) {
      try {
        await this.teacherService.create(teachers[i])
        successCount++
      } catch (error) {
        errors.push({
          row: i + 2, // Account for header row
          message: `Failed to create teacher: ${error.message}`
        })
      }
    }

    return successCount
  }

  static getRequiredFields(): string[] {
    return [
      'first_name',
      'last_name',
      'phone',
      'hire_date',
      'employment_status',
      'specializations',
      'languages_spoken'
    ]
  }

  static getOptionalFields(): string[] {
    return [
      'email',
      'date_of_birth',
      'gender',
      'employee_id',
      'contract_type',
      'salary_amount',
      'qualifications',
      'street',
      'city',
      'region',
      'postal_code',
      'country',
      'emergency_contact_name',
      'emergency_contact_relationship',
      'emergency_contact_phone',
      'emergency_contact_email',
      'notes'
    ]
  }
}