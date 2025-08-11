'use client'

// Mock service for students template functionality
export class StudentsTemplateService {
  async getTemplate() {
    // Mock CSV template data
    const csvContent = 'full_name,email,phone,date_of_birth,status\nJohn Doe,john@example.com,+998901234567,2000-01-01,active\n'
    return new Blob([csvContent], { type: 'text/csv' })
  }
  
  async getExcelTemplate() {
    // Mock Excel template
    return new Blob([], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  }
}

export const studentsTemplateService = new StudentsTemplateService()