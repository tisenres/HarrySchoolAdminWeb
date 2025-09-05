import { ImportExportService, ImportTemplate } from './import-export-service'
import * as XLSX from 'xlsx'

interface TemplateData {
  buffer: ArrayBuffer
  filename: string
  contentType: string
}

export class StudentsTemplateService {
  private organizationId: string

  constructor(organizationId?: string) {
    this.organizationId = organizationId || 'default'
  }
  
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
    
    XLSX.utils.book_append_sheet(workbook, templateSheet, 'Students Template')
    
    // Instructions sheet
    const instructionsData = [
      ['Students Import Template - Instructions'],
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
      ['• Phone: International format preferred (e.g., +998901234567)'],
      ['• Email: Valid email format (e.g., student@email.com)'],
      ['• Status: active, inactive, graduated, suspended, or dropped'],
      ['• Payment Status: paid, pending, overdue, or partial'],
      ['• Gender: male, female, or other'],
      ['• Subjects: Separate multiple subjects with commas (e.g., Math, Physics)'],
      [''],
      ['Tips:'],
      ['• Remove this instructions sheet before importing'],
      ['• Keep column headers exactly as shown'],
      ['• Fill in at least all required fields'],
      ['• Save as .xlsx or .csv format'],
      ['• Maximum file size: 10MB']
    ]
    
    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData)
    
    // Format instructions sheet
    if (instructionsSheet['A1']) {
      instructionsSheet['A1'].s = {
        font: { bold: true, size: 14 },
        fill: { fgColor: { rgb: 'FFF3E0' } }
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
      filename: 'students_import_template.xlsx',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  }

  private getTemplateData(): ImportTemplate {
    return {
      headers: [
        // Required fields (marked with *)
        'first_name *',
        'last_name *',
        'date_of_birth *',
        'gender *',
        'phone *',
        'parent_name *',
        'parent_phone *',
        'enrollment_date *',
        'status *',
        'current_level *',
        'preferred_subjects *',
        'country *',
        'emergency_contact_name *',
        'emergency_contact_relationship *',
        'emergency_contact_phone *',
        
        // Optional fields
        'email',
        'parent_email',
        'academic_year',
        'grade_level',
        'payment_status',
        'balance',
        'tuition_fee',
        'street',
        'city',
        'region',
        'postal_code',
        'emergency_contact_email',
        'medical_notes',
        'notes'
      ],
      
      sampleData: [
        [
          // Required sample data
          'Ahmed',                       // first_name *
          'Karimov',                     // last_name *
          '2005-03-15',                  // date_of_birth *
          'male',                        // gender *
          '+998901234567',               // phone *
          'Bobur Karimov',               // parent_name *
          '+998901234568',               // parent_phone *
          '2024-01-15',                  // enrollment_date *
          'active',                      // status *
          'Intermediate',                // current_level *
          'Mathematics, Physics',        // preferred_subjects *
          'Uzbekistan',                  // country *
          'Nigora Karimova',             // emergency_contact_name *
          'Mother',                      // emergency_contact_relationship *
          '+998901234569',               // emergency_contact_phone *
          
          // Optional sample data
          'ahmed.karimov@email.com',     // email
          'bobur.karimov@email.com',     // parent_email
          '2024-2025',                   // academic_year
          'Grade 10',                    // grade_level
          'paid',                        // payment_status
          '0',                           // balance
          '2000000',                     // tuition_fee
          'Yunusobod district, house 15', // street
          'Tashkent',                    // city
          'Tashkent',                    // region
          '100000',                      // postal_code
          'nigora.karimova@email.com',   // emergency_contact_email
          'No known allergies',          // medical_notes
          'Excellent student, very motivated' // notes
        ],
        [
          // Second example with minimal required fields
          'Malika',                      // first_name *
          'Tosheva',                     // last_name *
          '2006-07-22',                  // date_of_birth *
          'female',                      // gender *
          '+998907654321',               // phone *
          'Sardor Toshev',               // parent_name *
          '+998907654322',               // parent_phone *
          '2024-02-01',                  // enrollment_date *
          'active',                      // status *
          'Beginner',                    // current_level *
          'English, Literature',         // preferred_subjects *
          'Uzbekistan',                  // country *
          'Gulnora Tosheva',             // emergency_contact_name *
          'Mother',                      // emergency_contact_relationship *
          '+998907654323',               // emergency_contact_phone *
          
          // Optional - showing some empty fields
          'malika.tosheva@email.com',    // email
          '',                            // parent_email (empty)
          '2024-2025',                   // academic_year
          'Grade 9',                     // grade_level
          'pending',                     // payment_status
          '500000',                      // balance
          '1800000',                     // tuition_fee
          'Chilanzar district',          // street
          'Tashkent',                    // city
          'Tashkent',                    // region
          '',                            // postal_code (empty)
          'gulnora.tosheva@email.com',   // emergency_contact_email
          '',                            // medical_notes (empty)
          'New student, needs extra support in mathematics' // notes
        ]
      ],
      
      instructions: [
        'Required Fields - first_name: Student\'s first name',
        'Required Fields - last_name: Student\'s last name',
        'Required Fields - date_of_birth: Birth date (YYYY-MM-DD format)',
        'Required Fields - gender: male, female, or other',
        'Required Fields - phone: Student contact phone number',
        'Required Fields - parent_name: Parent or guardian\'s full name',
        'Required Fields - parent_phone: Parent contact phone number',
        'Required Fields - enrollment_date: Date of enrollment (YYYY-MM-DD format)',
        'Required Fields - status: active, inactive, graduated, suspended, or dropped',
        'Required Fields - current_level: Student\'s current academic level',
        'Required Fields - preferred_subjects: Subjects of interest (separate with commas)',
        'Required Fields - country: Country of residence',
        'Required Fields - emergency_contact_name: Emergency contact person name',
        'Required Fields - emergency_contact_relationship: Relationship to student',
        'Required Fields - emergency_contact_phone: Emergency contact phone number',
        
        'Optional Fields - email: Student\'s email address (will be validated)',
        'Optional Fields - parent_email: Parent\'s email address',
        'Optional Fields - academic_year: Current academic year (e.g., 2024-2025)',
        'Optional Fields - grade_level: Grade or class level',
        'Optional Fields - payment_status: paid, pending, overdue, or partial',
        'Optional Fields - balance: Outstanding balance amount (numbers only)',
        'Optional Fields - tuition_fee: Total tuition fee amount (numbers only)',
        'Optional Fields - street: Street address',
        'Optional Fields - city: City name',
        'Optional Fields - region: State or region name',
        'Optional Fields - postal_code: Postal/ZIP code',
        'Optional Fields - emergency_contact_email: Emergency contact email',
        'Optional Fields - medical_notes: Medical conditions or allergies',
        'Optional Fields - notes: Additional information about the student',
        
        'Fill in all required fields marked with *',
        'Optional fields can be left empty',
        'Use the exact column headers as shown',
        'Save the file as Excel (.xlsx) or CSV (.csv) format',
        'Maximum file size is 10MB',
        'Phone numbers should include country code (e.g., +998901234567)',
        'Dates must be in YYYY-MM-DD format (e.g., 2024-01-15)',
        'For multiple items (subjects), separate with commas',
        'Status must be one of: active, inactive, graduated, suspended, dropped',
        'Payment status must be one of: paid, pending, overdue, partial',
        'Gender must be one of: male, female, other',
        'Remove the Instructions sheet before importing',
        'Contact system administrator if you encounter any issues'
      ]
    }
  }

  static getTemplateHeaders(): string[] {
    const service = new StudentsTemplateService()
    return service.getTemplateData().headers
  }

  static getRequiredHeaders(): string[] {
    return [
      'first_name *',
      'last_name *',
      'date_of_birth *',
      'gender *',
      'phone *',
      'parent_name *',
      'parent_phone *',
      'enrollment_date *',
      'status *',
      'current_level *',
      'preferred_subjects *',
      'country *',
      'emergency_contact_name *',
      'emergency_contact_relationship *',
      'emergency_contact_phone *'
    ]
  }

  static getOptionalHeaders(): string[] {
    return [
      'email',
      'parent_email',
      'academic_year',
      'grade_level',
      'payment_status',
      'balance',
      'tuition_fee',
      'street',
      'city',
      'region',
      'postal_code',
      'emergency_contact_email',
      'medical_notes',
      'notes'
    ]
  }
}