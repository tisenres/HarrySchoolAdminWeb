import { ImportExportService, ExportOptions } from './import-export-service'
import { TeacherService } from './teacher-service'
import { Teacher } from '@/types/teacher'
import * as XLSX from 'xlsx'

interface TeachersExportOptions {
  format: 'xlsx' | 'csv'
  fields?: string[]
  filters?: Record<string, any>
  includeHeaders?: boolean
  filename?: string
}

interface ExportData {
  buffer: ArrayBuffer
  filename: string
  contentType: string
}

const DEFAULT_FIELDS = [
  'full_name',
  'email', 
  'phone',
  'employment_status',
  'contract_type',
  'specializations',
  'hire_date',
  'salary_amount',
  'languages_spoken',
  'address_full',
  'emergency_contact_info',
  'notes'
]

const ALL_FIELDS = [
  'id',
  'employee_id',
  'first_name',
  'last_name',
  'full_name',
  'email',
  'phone',
  'date_of_birth',
  'gender',
  'hire_date',
  'employment_status',
  'contract_type',
  'salary_amount',
  'salary_currency',
  'specializations',
  'languages_spoken',
  'qualifications',
  'certifications',
  'address_full',
  'address_street',
  'address_city',
  'address_region',
  'address_postal_code',
  'address_country',
  'emergency_contact_name',
  'emergency_contact_relationship',
  'emergency_contact_phone',
  'emergency_contact_email',
  'emergency_contact_info',
  'notes',
  'profile_image_url',
  'is_active',
  'created_at',
  'updated_at'
]

const FIELD_LABELS: Record<string, string> = {
  id: 'ID',
  employee_id: 'Employee ID',
  first_name: 'First Name',
  last_name: 'Last Name',
  full_name: 'Full Name',
  email: 'Email',
  phone: 'Phone',
  date_of_birth: 'Date of Birth',
  gender: 'Gender',
  hire_date: 'Hire Date',
  employment_status: 'Employment Status',
  contract_type: 'Contract Type',
  salary_amount: 'Salary Amount',
  salary_currency: 'Salary Currency',
  specializations: 'Specializations',
  languages_spoken: 'Languages Spoken',
  qualifications: 'Qualifications',
  certifications: 'Certifications',
  address_full: 'Full Address',
  address_street: 'Street',
  address_city: 'City',
  address_region: 'Region/State',
  address_postal_code: 'Postal Code',
  address_country: 'Country',
  emergency_contact_name: 'Emergency Contact Name',
  emergency_contact_relationship: 'Emergency Contact Relationship',
  emergency_contact_phone: 'Emergency Contact Phone',
  emergency_contact_email: 'Emergency Contact Email',
  emergency_contact_info: 'Emergency Contact Info',
  notes: 'Notes',
  profile_image_url: 'Profile Image URL',
  is_active: 'Active',
  created_at: 'Created Date',
  updated_at: 'Last Updated'
}

export class TeachersExportService {
  private organizationId: string
  private teacherService: TeacherService

  constructor(organizationId: string) {
    this.organizationId = organizationId
    this.teacherService = new TeacherService()
  }

  async exportTeachers(options: TeachersExportOptions): Promise<ExportData> {
    // Get teachers data based on filters
    const teachers = await this.fetchTeachersData(options.filters)
    
    // Transform data for export
    const exportData = this.transformTeachersData(
      teachers, 
      options.fields || DEFAULT_FIELDS
    )

    // Generate file based on format
    if (options.format === 'xlsx') {
      return this.generateExcelFile(exportData, options)
    } else {
      return this.generateCSVFile(exportData, options)
    }
  }

  private async fetchTeachersData(filters?: Record<string, any>): Promise<Teacher[]> {
    // Use the existing teacher service to fetch data
    const searchParams = filters || {}
    const pagination = { page: 1, limit: 10000, sort_by: 'created_at', sort_order: 'desc' as const }
    
    const result = await this.teacherService.getAll(searchParams, pagination)
    return result.data
  }

  private transformTeachersData(teachers: Teacher[], fields: string[]): any[] {
    return teachers.map(teacher => {
      const row: any = {}
      
      fields.forEach(field => {
        switch (field) {
          case 'full_name':
            row[field] = teacher.full_name
            break
          case 'specializations':
            row[field] = Array.isArray(teacher.specializations) 
              ? teacher.specializations.join(', ') 
              : teacher.specializations || ''
            break
          case 'languages_spoken':
            row[field] = Array.isArray(teacher.languages_spoken)
              ? teacher.languages_spoken.join(', ')
              : teacher.languages_spoken || ''
            break
          case 'qualifications':
            row[field] = Array.isArray(teacher.qualifications)
              ? teacher.qualifications.map(q => `${q.degree} - ${q.institution} (${q.year})`).join('; ')
              : ''
            break
          case 'certifications':
            row[field] = Array.isArray(teacher.certifications)
              ? teacher.certifications.map(c => `${c.name} - ${c.institution}`).join('; ')
              : ''
            break
          case 'address_full':
            if (teacher.address) {
              const addr = teacher.address
              row[field] = `${addr.street || ''}, ${addr.city || ''}, ${addr.region || ''} ${addr.postal_code || ''}, ${addr.country || ''}`.replace(/,\s*,/g, ',').replace(/^,|,$/g, '').trim()
            } else {
              row[field] = ''
            }
            break
          case 'address_street':
            row[field] = teacher.address?.street || ''
            break
          case 'address_city':
            row[field] = teacher.address?.city || ''
            break
          case 'address_region':
            row[field] = teacher.address?.region || ''
            break
          case 'address_postal_code':
            row[field] = teacher.address?.postal_code || ''
            break
          case 'address_country':
            row[field] = teacher.address?.country || ''
            break
          case 'emergency_contact_name':
            row[field] = teacher.emergency_contact?.name || ''
            break
          case 'emergency_contact_relationship':
            row[field] = teacher.emergency_contact?.relationship || ''
            break
          case 'emergency_contact_phone':
            row[field] = teacher.emergency_contact?.phone || ''
            break
          case 'emergency_contact_email':
            row[field] = teacher.emergency_contact?.email || ''
            break
          case 'emergency_contact_info':
            if (teacher.emergency_contact) {
              const ec = teacher.emergency_contact
              row[field] = `${ec.name || ''} (${ec.relationship || ''}) - ${ec.phone || ''} ${ec.email ? `- ${ec.email}` : ''}`.trim()
            } else {
              row[field] = ''
            }
            break
          case 'hire_date':
            row[field] = teacher.hire_date ? ImportExportService.formatDate(teacher.hire_date) : ''
            break
          case 'date_of_birth':
            row[field] = teacher.date_of_birth ? ImportExportService.formatDate(teacher.date_of_birth) : ''
            break
          case 'created_at':
            row[field] = teacher.created_at ? ImportExportService.formatDate(teacher.created_at) : ''
            break
          case 'updated_at':
            row[field] = teacher.updated_at ? ImportExportService.formatDate(teacher.updated_at) : ''
            break
          case 'is_active':
            row[field] = teacher.is_active ? 'Yes' : 'No'
            break
          case 'salary_amount':
            row[field] = teacher.salary_amount || ''
            break
          default:
            // Direct field mapping
            row[field] = teacher[field as keyof Teacher] || ''
        }
      })
      
      return row
    })
  }

  private generateExcelFile(data: any[], options: TeachersExportOptions): ExportData {
    const headers = (options.fields || DEFAULT_FIELDS).map(field => FIELD_LABELS[field] || field)
    const rows = data.map(row => (options.fields || DEFAULT_FIELDS).map(field => row[field] || ''))
    
    const workbook = ImportExportService.createWorkbook(rows, headers, 'Teachers')
    const buffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'array',
      cellStyles: true 
    })

    const filename = options.filename || `teachers_export_${new Date().toISOString().split('T')[0]}.xlsx`

    return {
      buffer: buffer as ArrayBuffer,
      filename,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  }

  private generateCSVFile(data: any[], options: TeachersExportOptions): ExportData {
    const headers = (options.fields || DEFAULT_FIELDS).map(field => FIELD_LABELS[field] || field)
    const rows = data.map(row => (options.fields || DEFAULT_FIELDS).map(field => {
      let value = row[field] || ''
      // Escape quotes and wrap in quotes if contains comma
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        value = `"${value.replace(/"/g, '""')}"`
      }
      return value
    }))
    
    let csvContent = ''
    if (options.includeHeaders !== false) {
      csvContent += headers.join(',') + '\n'
    }
    csvContent += rows.map(row => row.join(',')).join('\n')
    
    const buffer = new TextEncoder().encode(csvContent).buffer
    const filename = options.filename || `teachers_export_${new Date().toISOString().split('T')[0]}.csv`

    return {
      buffer,
      filename,
      contentType: 'text/csv'
    }
  }

  static getAvailableFields(): Array<{ key: string; label: string; category: string }> {
    return [
      // Basic Information
      { key: 'full_name', label: FIELD_LABELS.full_name, category: 'Basic Information' },
      { key: 'first_name', label: FIELD_LABELS.first_name, category: 'Basic Information' },
      { key: 'last_name', label: FIELD_LABELS.last_name, category: 'Basic Information' },
      { key: 'email', label: FIELD_LABELS.email, category: 'Basic Information' },
      { key: 'phone', label: FIELD_LABELS.phone, category: 'Basic Information' },
      { key: 'date_of_birth', label: FIELD_LABELS.date_of_birth, category: 'Basic Information' },
      { key: 'gender', label: FIELD_LABELS.gender, category: 'Basic Information' },
      
      // Professional Information
      { key: 'employee_id', label: FIELD_LABELS.employee_id, category: 'Professional' },
      { key: 'hire_date', label: FIELD_LABELS.hire_date, category: 'Professional' },
      { key: 'employment_status', label: FIELD_LABELS.employment_status, category: 'Professional' },
      { key: 'contract_type', label: FIELD_LABELS.contract_type, category: 'Professional' },
      { key: 'salary_amount', label: FIELD_LABELS.salary_amount, category: 'Professional' },
      { key: 'salary_currency', label: FIELD_LABELS.salary_currency, category: 'Professional' },
      { key: 'specializations', label: FIELD_LABELS.specializations, category: 'Professional' },
      { key: 'languages_spoken', label: FIELD_LABELS.languages_spoken, category: 'Professional' },
      { key: 'qualifications', label: FIELD_LABELS.qualifications, category: 'Professional' },
      { key: 'certifications', label: FIELD_LABELS.certifications, category: 'Professional' },
      
      // Address Information
      { key: 'address_full', label: FIELD_LABELS.address_full, category: 'Address' },
      { key: 'address_street', label: FIELD_LABELS.address_street, category: 'Address' },
      { key: 'address_city', label: FIELD_LABELS.address_city, category: 'Address' },
      { key: 'address_region', label: FIELD_LABELS.address_region, category: 'Address' },
      { key: 'address_postal_code', label: FIELD_LABELS.address_postal_code, category: 'Address' },
      { key: 'address_country', label: FIELD_LABELS.address_country, category: 'Address' },
      
      // Emergency Contact
      { key: 'emergency_contact_info', label: FIELD_LABELS.emergency_contact_info, category: 'Emergency Contact' },
      { key: 'emergency_contact_name', label: FIELD_LABELS.emergency_contact_name, category: 'Emergency Contact' },
      { key: 'emergency_contact_relationship', label: FIELD_LABELS.emergency_contact_relationship, category: 'Emergency Contact' },
      { key: 'emergency_contact_phone', label: FIELD_LABELS.emergency_contact_phone, category: 'Emergency Contact' },
      { key: 'emergency_contact_email', label: FIELD_LABELS.emergency_contact_email, category: 'Emergency Contact' },
      
      // System Information
      { key: 'notes', label: FIELD_LABELS.notes, category: 'Additional' },
      { key: 'is_active', label: FIELD_LABELS.is_active, category: 'System' },
      { key: 'created_at', label: FIELD_LABELS.created_at, category: 'System' },
      { key: 'updated_at', label: FIELD_LABELS.updated_at, category: 'System' },
      { key: 'id', label: FIELD_LABELS.id, category: 'System' }
    ]
  }

  static getDefaultFields(): string[] {
    return DEFAULT_FIELDS
  }
}