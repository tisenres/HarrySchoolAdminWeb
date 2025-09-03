import { ImportExportService, ImportTemplate } from './import-export-service'
import * as XLSX from 'xlsx'

interface TemplateData {
  buffer: ArrayBuffer
  filename: string
  contentType: string
}

export class TeachersTemplateService {
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
          fill: { fgColor: { rgb: 'E3F2FD' } }
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
    
    XLSX.utils.book_append_sheet(workbook, templateSheet, 'Teachers Template')
    
    // Instructions sheet
    const instructionsData = [
      ['Teachers Import Template - Instructions'],
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
      ['• Email: Valid email format (e.g., teacher@school.com)'],
      ['• Specializations: Separate multiple items with commas (e.g., Math, Physics)'],
      ['• Languages: Separate multiple languages with commas (e.g., English, Russian, Uzbek)'],
      ['• Employment Status: active, inactive, on_leave, or terminated'],
      ['• Contract Type: full_time, part_time, contract, or substitute'],
      ['• Gender: male, female, or other'],
      [''],
      ['Sample Qualifications Format:'],
      ['Bachelor of Science, Tashkent State University, 2020, Computer Science;'],
      ['Master of Education, National University, 2022, Teaching'],
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
      filename: 'teachers_import_template.xlsx',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  }

  private getTemplateData(): ImportTemplate {
    return {
      headers: [
        // Required fields (marked with *)
        'first_name *',
        'last_name *',
        'phone *',
        'hire_date *',
        'employment_status *',
        'specializations *',
        'languages_spoken *',
        
        // Optional basic fields
        'email',
        'date_of_birth',
        'gender',
        'employee_id',
        'contract_type',
        'salary_amount',
        
        // Address fields
        'street',
        'city',
        'region',
        'postal_code',
        'country',
        
        // Qualifications (simplified)
        'qualifications',
        
        // Emergency contact
        'emergency_contact_name',
        'emergency_contact_relationship',
        'emergency_contact_phone',
        'emergency_contact_email',
        
        // Additional
        'notes'
      ],
      
      sampleData: [
        [
          // Required sample data
          'John',                    // first_name *
          'Doe',                     // last_name *
          '+998901234567',           // phone *
          '2024-01-15',             // hire_date *
          'active',                  // employment_status *
          'Mathematics, Physics',    // specializations *
          'English, Russian',        // languages_spoken *
          
          // Optional sample data
          'john.doe@school.com',     // email
          '1985-06-15',             // date_of_birth
          'male',                    // gender
          'EMP001',                  // employee_id
          'full_time',              // contract_type
          '5000000',                // salary_amount
          
          // Address sample
          '123 Main Street',         // street
          'Tashkent',               // city
          'Tashkent Region',        // region
          '100000',                 // postal_code
          'Uzbekistan',             // country
          
          // Qualifications sample
          'Bachelor of Science, Tashkent State University, 2020, Mathematics; Master of Education, Teaching Institute, 2022, Teaching',
          
          // Emergency contact sample
          'Jane Doe',               // emergency_contact_name
          'Spouse',                 // emergency_contact_relationship
          '+998901234568',          // emergency_contact_phone
          'jane.doe@email.com',     // emergency_contact_email
          
          // Additional
          'Excellent math teacher with 5 years experience'  // notes
        ],
        [
          // Second example with minimal required fields
          'Maria',                   // first_name *
          'Rodriguez',               // last_name *
          '+998907654321',          // phone *
          '2024-02-01',             // hire_date *
          'active',                  // employment_status *
          'Spanish, Literature',     // specializations *
          'Spanish, English',        // languages_spoken *
          
          // Optional - showing some empty fields
          'maria.rodriguez@school.com', // email
          '',                        // date_of_birth (empty)
          'female',                  // gender
          '',                        // employee_id (empty)
          'part_time',              // contract_type
          '',                        // salary_amount (empty)
          
          // Address - some fields empty
          'Apartment 5, Building 12', // street
          'Samarkand',              // city
          'Samarkand Region',       // region
          '',                       // postal_code (empty)
          'Uzbekistan',             // country
          
          // Qualifications
          'Bachelor of Arts, Samarkand University, 2019, Spanish Literature',
          
          // Emergency contact
          'Carlos Rodriguez',        // emergency_contact_name
          'Brother',                // emergency_contact_relationship
          '+998907654322',          // emergency_contact_phone
          '',                       // emergency_contact_email (empty)
          
          // Additional
          'Specializes in Spanish language and literature'  // notes
        ]
      ],
      
      instructions: [
        'Required Fields - first_name: Teacher\'s first name',
        'Required Fields - last_name: Teacher\'s last name', 
        'Required Fields - phone: Contact phone number (include country code)',
        'Required Fields - hire_date: Date of employment (YYYY-MM-DD format)',
        'Required Fields - employment_status: active, inactive, on_leave, or terminated',
        'Required Fields - specializations: Teaching subjects (separate with commas)',
        'Required Fields - languages_spoken: Languages teacher can speak (separate with commas)',
        
        'Optional Fields - email: Email address (will be validated)',
        'Optional Fields - date_of_birth: Birth date (YYYY-MM-DD format)',
        'Optional Fields - gender: male, female, or other',
        'Optional Fields - employee_id: Unique employee identifier',
        'Optional Fields - contract_type: full_time, part_time, contract, or substitute',
        'Optional Fields - salary_amount: Salary amount (numbers only)',
        'Optional Fields - street: Street address',
        'Optional Fields - city: City name',
        'Optional Fields - region: State or region name',
        'Optional Fields - postal_code: Postal/ZIP code',
        'Optional Fields - country: Country name',
        'Optional Fields - qualifications: Education background (format: Degree, Institution, Year, Field; separate multiple with semicolon)',
        'Optional Fields - emergency_contact_name: Emergency contact person name',
        'Optional Fields - emergency_contact_relationship: Relationship to teacher',
        'Optional Fields - emergency_contact_phone: Emergency contact phone',
        'Optional Fields - emergency_contact_email: Emergency contact email',
        'Optional Fields - notes: Additional information about the teacher',
        
        'Fill in all required fields marked with *',
        'Optional fields can be left empty',
        'Use the exact column headers as shown',
        'Save the file as Excel (.xlsx) or CSV (.csv) format',
        'Maximum file size is 10MB',
        'Phone numbers should include country code (e.g., +998901234567)',
        'Dates must be in YYYY-MM-DD format (e.g., 2024-01-15)',
        'For multiple items (specializations, languages), separate with commas',
        'Employment status must be one of: active, inactive, on_leave, terminated',
        'Contract type must be one of: full_time, part_time, contract, substitute',
        'Gender must be one of: male, female, other',
        'Remove the Instructions sheet before importing',
        'Contact system administrator if you encounter any issues'
      ]
    }
  }

  static getTemplateHeaders(): string[] {
    const service = new TeachersTemplateService()
    return service.getTemplateData().headers
  }

  static getRequiredHeaders(): string[] {
    return [
      'first_name *',
      'last_name *',
      'phone *',
      'hire_date *',
      'employment_status *',
      'specializations *',
      'languages_spoken *'
    ]
  }

  static getOptionalHeaders(): string[] {
    return [
      'email',
      'date_of_birth',
      'gender',
      'employee_id',
      'contract_type',
      'salary_amount',
      'street',
      'city',
      'region',
      'postal_code',
      'country',
      'qualifications',
      'emergency_contact_name',
      'emergency_contact_relationship',
      'emergency_contact_phone',
      'emergency_contact_email',
      'notes'
    ]
  }
}