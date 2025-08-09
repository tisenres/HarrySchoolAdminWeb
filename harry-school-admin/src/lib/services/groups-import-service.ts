import { ImportExportService, ImportResult, ImportError } from './import-export-service'
import { GroupService } from './group-service'
import { CreateGroupRequest } from '@/types/group'
import { z } from 'zod'

interface GroupImportRow {
  name: string
  group_code: string
  subject: string
  level: string
  group_type?: string
  description?: string
  max_students: string
  classroom?: string
  online_meeting_url?: string
  start_date: string
  end_date?: string
  duration_weeks?: string
  price_per_student?: string
  currency?: string
  payment_frequency?: string
  schedule: string
  teacher_ids?: string
  notes?: string
}

const groupImportSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
  group_code: z.string().min(1, 'Group code is required'),
  subject: z.string().min(1, 'Subject is required'),
  level: z.string().min(1, 'Level is required'),
  group_type: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  max_students: z.string().min(1, 'Maximum students is required'),
  classroom: z.string().optional().or(z.literal('')),
  online_meeting_url: z.string().url('Invalid meeting URL').optional().or(z.literal('')),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional().or(z.literal('')),
  duration_weeks: z.string().optional().or(z.literal('')),
  price_per_student: z.string().optional().or(z.literal('')),
  currency: z.string().optional().or(z.literal('')),
  payment_frequency: z.string().optional().or(z.literal('')),
  schedule: z.string().min(1, 'Schedule is required'),
  teacher_ids: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal(''))
})

export class GroupsImportService {
  private organizationId: string
  private userId: string
  private groupService: GroupService

  constructor(organizationId: string, userId: string) {
    this.organizationId = organizationId
    this.userId = userId
    this.groupService = new GroupService()
  }

  async importFromFile(file: File): Promise<ImportResult<CreateGroupRequest>> {
    const errors: ImportError[] = []
    const validGroups: CreateGroupRequest[] = []

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
        'name',
        'group_code',
        'subject',
        'level',
        'max_students',
        'start_date',
        'schedule'
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
          const groupData = await this.processGroupRow(row, rowNumber)
          if (groupData) {
            validGroups.push(groupData)
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

      // Import valid groups
      let successCount = 0
      if (validGroups.length > 0) {
        successCount = await this.importGroups(validGroups, errors)
      }

      return {
        success: successCount > 0,
        data: validGroups.slice(0, successCount),
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

  private async processGroupRow(
    row: any, 
    rowNumber: number
  ): Promise<CreateGroupRequest | null> {
    // Clean the row data
    const cleanedRow: GroupImportRow = {
      name: this.cleanString(row.name || row.Name || row.Group_Name || row['Group Name']),
      group_code: this.cleanString(row.group_code || row.Group_Code || row['Group Code']),
      subject: this.cleanString(row.subject || row.Subject),
      level: this.cleanString(row.level || row.Level),
      group_type: this.cleanString(row.group_type || row.Group_Type || row['Group Type']),
      description: this.cleanString(row.description || row.Description),
      max_students: this.cleanString(row.max_students || row.Max_Students || row['Max Students']),
      classroom: this.cleanString(row.classroom || row.Classroom),
      online_meeting_url: this.cleanString(row.online_meeting_url || row.Online_Meeting_URL || row['Online Meeting URL']),
      start_date: this.cleanString(row.start_date || row.Start_Date || row['Start Date']),
      end_date: this.cleanString(row.end_date || row.End_Date || row['End Date']),
      duration_weeks: this.cleanString(row.duration_weeks || row.Duration_Weeks || row['Duration Weeks']),
      price_per_student: this.cleanString(row.price_per_student || row.Price_Per_Student || row.Price || row['Price Per Student']),
      currency: this.cleanString(row.currency || row.Currency),
      payment_frequency: this.cleanString(row.payment_frequency || row.Payment_Frequency || row['Payment Frequency']),
      schedule: this.cleanString(row.schedule || row.Schedule),
      teacher_ids: this.cleanString(row.teacher_ids || row.Teacher_IDs || row['Teacher IDs']),
      notes: this.cleanString(row.notes || row.Notes)
    }

    // Validate the cleaned data
    const validatedRow = groupImportSchema.parse(cleanedRow)

    // Transform to CreateGroupRequest format
    const groupRequest: CreateGroupRequest = {
      name: validatedRow.name,
      group_code: validatedRow.group_code,
      subject: validatedRow.subject,
      level: validatedRow.level,
      group_type: validatedRow.group_type || undefined,
      description: validatedRow.description || undefined,
      max_students: parseInt(validatedRow.max_students),
      classroom: validatedRow.classroom || undefined,
      online_meeting_url: validatedRow.online_meeting_url || undefined,
      start_date: validatedRow.start_date,
      end_date: validatedRow.end_date || undefined,
      duration_weeks: validatedRow.duration_weeks ? parseInt(validatedRow.duration_weeks) : undefined,
      price_per_student: validatedRow.price_per_student ? parseFloat(validatedRow.price_per_student) : undefined,
      currency: validatedRow.currency || 'UZS',
      payment_frequency: validatedRow.payment_frequency || undefined,
      schedule: this.parseSchedule(validatedRow.schedule),
      notes: validatedRow.notes || undefined
    }

    return groupRequest
  }

  private cleanString(value: any): string {
    if (value === null || value === undefined) return ''
    return String(value).trim()
  }

  private parseSchedule(scheduleStr: string): any[] {
    if (!scheduleStr) return []
    
    try {
      // Expected format: "Monday 09:00-10:30; Wednesday 14:00-15:30"
      const slots = scheduleStr.split(';').map(slot => {
        const parts = slot.trim().split(' ')
        if (parts.length >= 2) {
          const day = parts[0].toLowerCase()
          const timeRange = parts[1]
          const [startTime, endTime] = timeRange.split('-')
          
          return {
            day,
            start_time: startTime.trim(),
            end_time: endTime.trim(),
            room: parts[2]?.trim() || undefined
          }
        }
        return null
      }).filter(slot => slot !== null)
      
      return slots
    } catch (error) {
      // If parsing fails, create a simple schedule
      return [{
        day: 'monday',
        start_time: '09:00',
        end_time: '10:30'
      }]
    }
  }

  private async importGroups(
    groups: CreateGroupRequest[], 
    errors: ImportError[]
  ): Promise<number> {
    let successCount = 0

    for (let i = 0; i < groups.length; i++) {
      try {
        await this.groupService.create(groups[i])
        successCount++
      } catch (error) {
        errors.push({
          row: i + 2, // Account for header row
          message: `Failed to create group: ${error.message}`
        })
      }
    }

    return successCount
  }

  static getRequiredFields(): string[] {
    return [
      'name',
      'group_code',
      'subject',
      'level',
      'max_students',
      'start_date',
      'schedule'
    ]
  }

  static getOptionalFields(): string[] {
    return [
      'group_type',
      'description',
      'classroom',
      'online_meeting_url',
      'end_date',
      'duration_weeks',
      'price_per_student',
      'currency',
      'payment_frequency',
      'teacher_ids',
      'notes'
    ]
  }
}