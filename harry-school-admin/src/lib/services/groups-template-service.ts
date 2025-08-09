import { ImportExportService, ImportTemplate } from './import-export-service'
import * as XLSX from 'xlsx'

interface TemplateData {
  buffer: ArrayBuffer
  filename: string
  contentType: string
}

export class GroupsTemplateService {
  
  generateTemplate(): TemplateData {
    const template = this.getTemplateData()
    
    // Create workbook with template data
    const workbook = XLSX.utils.book_new()
    
    // Main template sheet
    const templateData = [
      template.headers,
      ...template.sampleData
    ]
    
    const templateSheet = XLSX.utils.aoa_to_sheet(templateData)
    
    // Format headers (bold, background color)
    const headerRange = XLSX.utils.decode_range(templateSheet['!ref'] || 'A1')
    for (let c = headerRange.s.c; c <= headerRange.e.c; c++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c })
      if (templateSheet[cellAddress]) {
        templateSheet[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: 'E8F5E8' } }
        }
      }
    }
    
    // Auto-fit columns
    const colWidths: any[] = []
    for (let c = headerRange.s.c; c <= headerRange.e.c; c++) {
      let maxWidth = 10
      for (let r = headerRange.s.r; r <= headerRange.e.r; r++) {
        const cellAddress = XLSX.utils.encode_cell({ r, c })
        const cell = templateSheet[cellAddress]
        if (cell && cell.v) {
          const cellValue = String(cell.v)
          maxWidth = Math.max(maxWidth, cellValue.length + 2)
        }
      }
      colWidths[c] = { width: Math.min(maxWidth, 30) }
    }
    templateSheet['!cols'] = colWidths
    
    XLSX.utils.book_append_sheet(workbook, templateSheet, 'Groups Template')
    
    // Instructions sheet
    const instructionsData = [
      ['Groups Import Template - Instructions'],
      [''],
      ['Required Fields (marked with * in template):'],
      ...template.instructions.filter(inst => inst.includes('Required')),
      [''],
      ['Optional Fields:'],
      ...template.instructions.filter(inst => inst.includes('Optional')),
      [''],
      ['General Instructions:'],
      ...template.instructions.filter(inst => !inst.includes('Required') && !inst.includes('Optional')),
      [''],
      ['Field Formats:'],
      ['• Dates: YYYY-MM-DD format (e.g., 2024-01-15)'],
      ['• Numbers: Use numbers only (e.g., 25, 15000)'],
      ['• Schedule: Day Time-Time format (e.g., Monday 09:00-10:30; Wednesday 14:00-15:30)'],
      ['• URLs: Full URL with https:// (e.g., https://zoom.us/j/123456789)'],
      ['• Currency: Use standard currency codes (UZS, USD, EUR)'],
      ['• Payment Frequency: monthly, weekly, course, semester'],
      [''],
      ['Schedule Format Examples:'],
      ['• Single class: Monday 09:00-10:30'],
      ['• Multiple classes: Monday 09:00-10:30; Wednesday 14:00-15:30'],
      ['• With room: Monday 09:00-10:30 Room101; Wednesday 14:00-15:30 Room102'],
      [''],
      ['Level Examples:'],
      ['• Beginner, Intermediate, Advanced'],
      ['• A1, A2, B1, B2, C1, C2 (for languages)'],
      ['• Grade 1, Grade 2, etc. (for school subjects)'],
      [''],
      ['Tips:'],
      ['• Remove this instructions sheet before importing'],
      ['• Keep column headers exactly as shown'],
      ['• Fill in at least all required fields'],
      ['• Save as .xlsx or .csv format'],
      ['• Maximum file size: 10MB'],
      ['• Group codes should be unique across your organization']
    ]
    
    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData)
    
    // Format instructions sheet
    if (instructionsSheet['A1']) {
      instructionsSheet['A1'].s = {
        font: { bold: true, size: 14 },
        fill: { fgColor: { rgb: 'FFF8E1' } }
      }
    }
    
    // Auto-fit columns for instructions
    const instructionsRange = XLSX.utils.decode_range(instructionsSheet['!ref'] || 'A1')
    const instructionsColWidths: any[] = []
    for (let c = instructionsRange.s.c; c <= instructionsRange.e.c; c++) {
      let maxWidth = 10
      for (let r = instructionsRange.s.r; r <= instructionsRange.e.r; r++) {
        const cellAddress = XLSX.utils.encode_cell({ r, c })
        const cell = instructionsSheet[cellAddress]
        if (cell && cell.v) {
          const cellValue = String(cell.v)
          maxWidth = Math.max(maxWidth, cellValue.length + 2)
        }
      }
      instructionsColWidths[c] = { width: Math.min(maxWidth, 80) }
    }
    instructionsSheet['!cols'] = instructionsColWidths
    
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions')
    
    // Generate buffer
    const buffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'array',
      cellStyles: true 
    })
    
    return {
      buffer: buffer as ArrayBuffer,
      filename: 'groups_import_template.xlsx',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  }

  private getTemplateData(): ImportTemplate {
    return {
      headers: [
        // Required fields (marked with *)
        'name *',
        'group_code *',
        'subject *',
        'level *',
        'max_students *',
        'start_date *',
        'schedule *',
        
        // Optional basic fields
        'group_type',
        'description',
        'classroom',
        'online_meeting_url',
        
        // Duration & Dates
        'end_date',
        'duration_weeks',
        
        // Financial
        'price_per_student',
        'currency',
        'payment_frequency',
        
        // Additional
        'teacher_ids',
        'notes'
      ],
      
      sampleData: [
        [
          // Required sample data
          'Advanced Mathematics A1',    // name *
          'MATH-A1-2024',              // group_code *
          'Mathematics',                // subject *
          'Advanced',                   // level *
          '25',                         // max_students *
          '2024-02-01',                // start_date *
          'Monday 09:00-10:30; Wednesday 14:00-15:30', // schedule *
          
          // Optional sample data
          'regular',                    // group_type
          'Advanced mathematics course for high school students', // description
          'Room 101',                   // classroom
          'https://zoom.us/j/123456789', // online_meeting_url
          
          // Duration & Dates
          '2024-06-30',                // end_date
          '20',                        // duration_weeks
          
          // Financial
          '500000',                    // price_per_student
          'UZS',                       // currency
          'monthly',                   // payment_frequency
          
          // Additional
          '',                          // teacher_ids (empty - will be assigned later)
          'Preparing students for university entrance exams' // notes
        ],
        [
          // Second example with different format
          'English Conversation B1',    // name *
          'ENG-B1-CONV-2024',         // group_code *
          'English',                    // subject *
          'Intermediate',               // level *
          '15',                        // max_students *
          '2024-02-15',                // start_date *
          'Tuesday 16:00-17:30; Thursday 16:00-17:30', // schedule *
          
          // Optional - showing different values
          'intensive',                  // group_type
          'Conversational English for intermediate students', // description
          'Room 203',                   // classroom
          '',                          // online_meeting_url (empty)
          
          // Duration & Dates
          '2024-05-15',                // end_date
          '12',                        // duration_weeks
          
          // Financial
          '400000',                    // price_per_student
          'UZS',                       // currency
          'course',                    // payment_frequency
          
          // Additional
          '',                          // teacher_ids
          'Focus on speaking and listening skills' // notes
        ],
        [
          // Third example - online class
          'Physics Online Foundation', // name *
          'PHY-FOUND-ON-2024',         // group_code *
          'Physics',                    // subject *
          'Beginner',                   // level *
          '30',                        // max_students *
          '2024-03-01',                // start_date *
          'Saturday 10:00-12:00',      // schedule *
          
          // Optional - online format
          'online',                     // group_type
          'Foundation physics course delivered online', // description
          '',                          // classroom (empty for online)
          'https://meet.google.com/abc-defg-hij', // online_meeting_url
          
          // Duration & Dates
          '',                          // end_date (empty)
          '16',                        // duration_weeks
          
          // Financial
          '300000',                    // price_per_student
          'UZS',                       // currency
          'monthly',                   // payment_frequency
          
          // Additional
          '',                          // teacher_ids
          'Online physics course for beginners with interactive sessions' // notes
        ]
      ],
      
      instructions: [
        'Required Fields - name: Unique name for the group/class',
        'Required Fields - group_code: Unique identifier code (e.g., MATH-A1-2024)',
        'Required Fields - subject: Main subject or topic (e.g., Mathematics, English, Physics)',
        'Required Fields - level: Skill/grade level (e.g., Beginner, Intermediate, Advanced, A1, B1)',
        'Required Fields - max_students: Maximum number of students allowed in the group',
        'Required Fields - start_date: Course start date (YYYY-MM-DD format)',
        'Required Fields - schedule: Class schedule (format: Day Time-Time; separate multiple with semicolon)',
        
        'Optional Fields - group_type: Type of group (regular, intensive, online, weekend)',
        'Optional Fields - description: Detailed description of the group/course',
        'Optional Fields - classroom: Physical classroom location',
        'Optional Fields - online_meeting_url: URL for online classes (must be valid URL)',
        'Optional Fields - end_date: Course end date (YYYY-MM-DD format)',
        'Optional Fields - duration_weeks: Course duration in weeks (number only)',
        'Optional Fields - price_per_student: Cost per student (numbers only)',
        'Optional Fields - currency: Currency code (UZS, USD, EUR, etc.)',
        'Optional Fields - payment_frequency: How often students pay (monthly, weekly, course, semester)',
        'Optional Fields - teacher_ids: Assigned teacher IDs (leave empty if assigning later)',
        'Optional Fields - notes: Additional information about the group',
        
        'Fill in all required fields marked with *',
        'Optional fields can be left empty',
        'Use the exact column headers as shown',
        'Save the file as Excel (.xlsx) or CSV (.csv) format',
        'Maximum file size is 10MB',
        'Group codes must be unique within your organization',
        'Dates must be in YYYY-MM-DD format (e.g., 2024-02-15)',
        'Schedule format: Day Time-Time (e.g., Monday 09:00-10:30)',
        'For multiple schedule slots, separate with semicolon',
        'Use 24-hour time format (e.g., 14:30 instead of 2:30 PM)',
        'Online meeting URLs must start with https://',
        'Remove the Instructions sheet before importing',
        'Contact system administrator if you encounter any issues'
      ]
    }
  }

  static getTemplateHeaders(): string[] {
    const service = new GroupsTemplateService()
    return service.getTemplateData().headers
  }

  static getRequiredHeaders(): string[] {
    return [
      'name *',
      'group_code *',
      'subject *',
      'level *',
      'max_students *',
      'start_date *',
      'schedule *'
    ]
  }

  static getOptionalHeaders(): string[] {
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