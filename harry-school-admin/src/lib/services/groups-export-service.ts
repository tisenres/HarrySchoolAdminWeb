import { ImportExportService } from './import-export-service'
import { GroupService } from './group-service'
import { Group } from '@/types/group'
import * as XLSX from 'xlsx'

interface GroupsExportOptions {
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
  'name',
  'group_code',
  'subject',
  'level',
  'teacher_name',
  'max_students',
  'current_enrollment',
  'enrollment_percentage',
  'status',
  'start_date',
  'schedule_summary',
  'classroom',
  'price_per_student'
]

const ALL_FIELDS = [
  'id',
  'name',
  'group_code',
  'subject',
  'level',
  'group_type',
  'description',
  'max_students',
  'current_enrollment',
  'enrollment_percentage',
  'waiting_list_count',
  'schedule_summary',
  'schedule_detailed',
  'classroom',
  'online_meeting_url',
  'start_date',
  'end_date',
  'duration_weeks',
  'price_per_student',
  'currency',
  'payment_frequency',
  'status',
  'teacher_name',
  'teacher_count',
  'student_count',
  'notes',
  'is_active',
  'created_at',
  'updated_at'
]

const FIELD_LABELS: Record<string, string> = {
  id: 'ID',
  name: 'Group Name',
  group_code: 'Group Code',
  subject: 'Subject',
  level: 'Level',
  group_type: 'Group Type',
  description: 'Description',
  max_students: 'Max Students',
  current_enrollment: 'Current Enrollment',
  enrollment_percentage: 'Enrollment %',
  waiting_list_count: 'Waiting List',
  schedule_summary: 'Schedule',
  schedule_detailed: 'Schedule Details',
  classroom: 'Classroom',
  online_meeting_url: 'Online Meeting URL',
  start_date: 'Start Date',
  end_date: 'End Date',
  duration_weeks: 'Duration (Weeks)',
  price_per_student: 'Price Per Student',
  currency: 'Currency',
  payment_frequency: 'Payment Frequency',
  status: 'Status',
  teacher_name: 'Teacher',
  teacher_count: 'Teacher Count',
  student_count: 'Student Count',
  notes: 'Notes',
  is_active: 'Active',
  created_at: 'Created Date',
  updated_at: 'Last Updated'
}

export class GroupsExportService {
  private organizationId: string
  private groupService: GroupService

  constructor(organizationId: string) {
    this.organizationId = organizationId
    this.groupService = new GroupService()
  }

  async exportGroups(options: GroupsExportOptions): Promise<ExportData> {
    // Get groups data based on filters
    const groups = await this.fetchGroupsData(options.filters)
    
    // Transform data for export
    const exportData = this.transformGroupsData(
      groups, 
      options.fields || DEFAULT_FIELDS
    )

    // Generate file based on format
    if (options.format === 'xlsx') {
      return this.generateExcelFile(exportData, options)
    } else {
      return this.generateCSVFile(exportData, options)
    }
  }

  private async fetchGroupsData(filters?: Record<string, any>): Promise<Group[]> {
    // Use the existing group service to fetch data
    const searchParams = filters || {}
    const pagination = { page: 1, limit: 10000, sort_by: 'created_at', sort_order: 'desc' as const }
    
    const result = await this.groupService.getAll(searchParams, pagination)
    return result.data
  }

  private transformGroupsData(groups: Group[], fields: string[]): any[] {
    return groups.map(group => {
      const row: any = {}
      
      fields.forEach(field => {
        switch (field) {
          case 'enrollment_percentage':
            row[field] = group.max_students > 0 
              ? Math.round((group.current_enrollment / group.max_students) * 100) + '%'
              : '0%'
            break
          case 'schedule_summary':
            if (Array.isArray(group.schedule)) {
              row[field] = group.schedule.map(slot => 
                `${this.capitalizeFirst(slot.day)} ${slot.start_time}-${slot.end_time}`
              ).join(', ')
            } else {
              row[field] = ''
            }
            break
          case 'schedule_detailed':
            if (Array.isArray(group.schedule)) {
              row[field] = group.schedule.map(slot => 
                `${this.capitalizeFirst(slot.day)} ${slot.start_time}-${slot.end_time}${slot.room ? ` (${slot.room})` : ''}`
              ).join('; ')
            } else {
              row[field] = ''
            }
            break
          case 'teacher_name':
            if (group.teacher) {
              row[field] = group.teacher.full_name
            } else if (Array.isArray(group.assigned_teachers) && group.assigned_teachers.length > 0) {
              row[field] = group.assigned_teachers.map(t => t.full_name).join(', ')
            } else {
              row[field] = 'Not Assigned'
            }
            break
          case 'teacher_count':
            row[field] = Array.isArray(group.assigned_teachers) ? group.assigned_teachers.length : 0
            break
          case 'student_count':
            row[field] = group.current_enrollment || 0
            break
          case 'start_date':
            row[field] = group.start_date ? ImportExportService.formatDate(group.start_date) : ''
            break
          case 'end_date':
            row[field] = group.end_date ? ImportExportService.formatDate(group.end_date) : ''
            break
          case 'created_at':
            row[field] = group.created_at ? ImportExportService.formatDate(group.created_at) : ''
            break
          case 'updated_at':
            row[field] = group.updated_at ? ImportExportService.formatDate(group.updated_at) : ''
            break
          case 'is_active':
            row[field] = group.is_active ? 'Yes' : 'No'
            break
          case 'price_per_student':
            row[field] = group.price_per_student ? `${group.price_per_student} ${group.currency || 'UZS'}` : ''
            break
          default:
            // Direct field mapping
            row[field] = group[field as keyof Group] || ''
        }
      })
      
      return row
    })
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  private generateExcelFile(data: any[], options: GroupsExportOptions): ExportData {
    const headers = (options.fields || DEFAULT_FIELDS).map(field => FIELD_LABELS[field] || field)
    const rows = data.map(row => (options.fields || DEFAULT_FIELDS).map(field => row[field] || ''))
    
    const workbook = ImportExportService.createWorkbook(rows, headers, 'Groups')
    const buffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'array',
      cellStyles: true 
    })

    const filename = options.filename || `groups_export_${new Date().toISOString().split('T')[0]}.xlsx`

    return {
      buffer: buffer as ArrayBuffer,
      filename,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  }

  private generateCSVFile(data: any[], options: GroupsExportOptions): ExportData {
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
    const filename = options.filename || `groups_export_${new Date().toISOString().split('T')[0]}.csv`

    return {
      buffer,
      filename,
      contentType: 'text/csv'
    }
  }

  static getAvailableFields(): Array<{ key: string; label: string; category: string }> {
    return [
      // Basic Information
      { key: 'name', label: FIELD_LABELS.name, category: 'Basic Information' },
      { key: 'group_code', label: FIELD_LABELS.group_code, category: 'Basic Information' },
      { key: 'subject', label: FIELD_LABELS.subject, category: 'Basic Information' },
      { key: 'level', label: FIELD_LABELS.level, category: 'Basic Information' },
      { key: 'group_type', label: FIELD_LABELS.group_type, category: 'Basic Information' },
      { key: 'description', label: FIELD_LABELS.description, category: 'Basic Information' },
      { key: 'status', label: FIELD_LABELS.status, category: 'Basic Information' },
      
      // Enrollment & Capacity
      { key: 'max_students', label: FIELD_LABELS.max_students, category: 'Enrollment' },
      { key: 'current_enrollment', label: FIELD_LABELS.current_enrollment, category: 'Enrollment' },
      { key: 'enrollment_percentage', label: FIELD_LABELS.enrollment_percentage, category: 'Enrollment' },
      { key: 'waiting_list_count', label: FIELD_LABELS.waiting_list_count, category: 'Enrollment' },
      { key: 'student_count', label: FIELD_LABELS.student_count, category: 'Enrollment' },
      
      // Schedule & Location
      { key: 'schedule_summary', label: FIELD_LABELS.schedule_summary, category: 'Schedule' },
      { key: 'schedule_detailed', label: FIELD_LABELS.schedule_detailed, category: 'Schedule' },
      { key: 'classroom', label: FIELD_LABELS.classroom, category: 'Schedule' },
      { key: 'online_meeting_url', label: FIELD_LABELS.online_meeting_url, category: 'Schedule' },
      
      // Dates & Duration
      { key: 'start_date', label: FIELD_LABELS.start_date, category: 'Dates' },
      { key: 'end_date', label: FIELD_LABELS.end_date, category: 'Dates' },
      { key: 'duration_weeks', label: FIELD_LABELS.duration_weeks, category: 'Dates' },
      
      // Financial
      { key: 'price_per_student', label: FIELD_LABELS.price_per_student, category: 'Financial' },
      { key: 'currency', label: FIELD_LABELS.currency, category: 'Financial' },
      { key: 'payment_frequency', label: FIELD_LABELS.payment_frequency, category: 'Financial' },
      
      // Teachers
      { key: 'teacher_name', label: FIELD_LABELS.teacher_name, category: 'Teachers' },
      { key: 'teacher_count', label: FIELD_LABELS.teacher_count, category: 'Teachers' },
      
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