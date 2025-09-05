import * as XLSX from 'xlsx'

export interface ImportResult<T = any> {
  success: boolean
  data: T[]
  errors: ImportError[]
  totalRows: number
  successRows: number
  errorRows: number
}

export interface ImportError {
  row: number
  field?: string
  message: string
  value?: any
}

export interface ExportOptions {
  filename?: string
  format: 'xlsx' | 'csv'
  sheetName?: string
  includeHeaders?: boolean
  dateFormat?: string
}

export interface ImportTemplate {
  headers: string[]
  sampleData: any[][]
  instructions: string[]
}

export class ImportExportService {
  private static dateFormats = [
    'YYYY-MM-DD',
    'MM/DD/YYYY',
    'DD/MM/YYYY',
    'DD.MM.YYYY'
  ]

  /**
   * Read Excel file and convert to JSON
   */
  static async readExcelFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: '',
            blankrows: false
          })
          resolve(jsonData)
        } catch (error) {
          reject(new Error(`Failed to read Excel file: ${error.message}`))
        }
      }
      
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsArrayBuffer(file)
    })
  }

  /**
   * Convert array data to Excel workbook
   */
  static createWorkbook(data: any[], headers?: string[], sheetName = 'Sheet1'): XLSX.WorkBook {
    const workbook = XLSX.utils.book_new()
    
    // If headers provided, add them as first row
    const worksheetData = headers ? [headers, ...data] : data
    
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
    
    // Auto-fit columns
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    const colWidths: any[] = []
    
    for (let c = range.s.c; c <= range.e.c; c++) {
      let maxWidth = 10
      for (let r = range.s.r; r <= range.e.r; r++) {
        const cellAddress = XLSX.utils.encode_cell({ r, c })
        const cell = worksheet[cellAddress]
        if (cell && cell.v) {
          const cellValue = String(cell.v)
          maxWidth = Math.max(maxWidth, cellValue.length)
        }
      }
      colWidths[c] = { width: Math.min(maxWidth + 2, 50) }
    }
    
    worksheet['!cols'] = colWidths
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
    
    return workbook
  }

  /**
   * Export data to Excel file
   */
  static exportToExcel(
    data: any[],
    options: ExportOptions = { format: 'xlsx' }
  ): void {
    const {
      filename = `export_${new Date().toISOString().split('T')[0]}`,
      sheetName = 'Export',
      format = 'xlsx'
    } = options

    const workbook = this.createWorkbook(data, undefined, sheetName)
    
    if (format === 'xlsx') {
      const excelBuffer = XLSX.write(workbook, { 
        bookType: 'xlsx', 
        type: 'array',
        cellStyles: true
      })
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      this.downloadBlob(blob, `${filename}.xlsx`)
    } else if (format === 'csv') {
      const csvData = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName])
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8' })
      this.downloadBlob(blob, `${filename}.csv`)
    }
  }

  /**
   * Create multi-sheet Excel workbook
   */
  static exportMultiSheet(
    sheets: { name: string; data: any[]; headers?: string[] }[],
    filename = `multi_export_${new Date().toISOString().split('T')[0]}`
  ): void {
    const workbook = XLSX.utils.book_new()
    
    sheets.forEach(sheet => {
      const worksheetData = sheet.headers 
        ? [sheet.headers, ...sheet.data] 
        : sheet.data
      
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
      
      // Auto-fit columns
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
      const colWidths: any[] = []
      
      for (let c = range.s.c; c <= range.e.c; c++) {
        let maxWidth = 10
        for (let r = range.s.r; r <= range.e.r; r++) {
          const cellAddress = XLSX.utils.encode_cell({ r, c })
          const cell = worksheet[cellAddress]
          if (cell && cell.v) {
            const cellValue = String(cell.v)
            maxWidth = Math.max(maxWidth, cellValue.length)
          }
        }
        colWidths[c] = { width: Math.min(maxWidth + 2, 50) }
      }
      
      worksheet['!cols'] = colWidths
      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name)
    })
    
    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'array',
      cellStyles: true
    })
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    this.downloadBlob(blob, `${filename}.xlsx`)
  }

  /**
   * Download blob as file
   */
  private static downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  /**
   * Validate data row against expected structure
   */
  static validateRow(
    row: any,
    expectedFields: { field: string; required?: boolean; type?: string }[],
    rowNumber: number
  ): ImportError[] {
    const errors: ImportError[] = []

    expectedFields.forEach(({ field, required, type }) => {
      const value = row[field]
      
      // Check if required field is missing
      if (required && (!value || value === '')) {
        errors.push({
          row: rowNumber,
          field,
          message: `Required field '${field}' is missing or empty`,
          value
        })
        return
      }
      
      // Skip type validation if value is empty and not required
      if (!value || value === '') return
      
      // Type validation
      if (type === 'email' && !this.isValidEmail(value)) {
        errors.push({
          row: rowNumber,
          field,
          message: `Invalid email format: ${value}`,
          value
        })
      }
      
      if (type === 'phone' && !this.isValidPhone(value)) {
        errors.push({
          row: rowNumber,
          field,
          message: `Invalid phone format: ${value}`,
          value
        })
      }
      
      if (type === 'date' && !this.isValidDate(value)) {
        errors.push({
          row: rowNumber,
          field,
          message: `Invalid date format: ${value}. Expected formats: ${this.dateFormats.join(', ')}`,
          value
        })
      }
      
      if (type === 'number' && isNaN(Number(value))) {
        errors.push({
          row: rowNumber,
          field,
          message: `Invalid number format: ${value}`,
          value
        })
      }
    })

    return errors
  }

  /**
   * Parse CSV or Excel file data into objects with headers
   */
  static parseFileData(rawData: any[]): { headers: string[]; rows: any[] } {
    if (rawData.length === 0) {
      throw new Error('File is empty')
    }

    const headers = rawData[0].map((header: any) => String(header).trim())
    const rows = rawData.slice(1).map((row: any[]) => {
      const obj: any = {}
      headers.forEach((header: string, index: number) => {
        const value = row[index]
        obj[header] = value !== undefined && value !== null ? String(value).trim() : ''
      })
      return obj
    }).filter(row => {
      // Filter out completely empty rows
      return Object.values(row).some(val => val !== '')
    })

    return { headers, rows }
  }

  /**
   * Generate import template
   */
  static generateTemplate(template: ImportTemplate, filename: string): void {
    const data = [
      template.headers,
      ...template.sampleData,
      [],
      ['Instructions:'],
      ...template.instructions.map(instruction => [instruction])
    ]

    const workbook = this.createWorkbook(data, undefined, 'Template')
    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'array' 
    })
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    this.downloadBlob(blob, `${filename}.xlsx`)
  }

  // Validation helpers
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  private static isValidPhone(phone: string): boolean {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '')
    // Check if it's between 10-15 digits (international format)
    return cleaned.length >= 10 && cleaned.length <= 15
  }

  private static isValidDate(dateStr: string): boolean {
    // Try to parse the date
    const date = new Date(dateStr)
    return date instanceof Date && !isNaN(date.getTime())
  }

  /**
   * Format date for consistent output
   */
  static formatDate(date: string | Date, format = 'YYYY-MM-DD'): string {
    const d = new Date(date)
    if (isNaN(d.getTime())) return ''
    
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    
    switch (format) {
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`
      case 'DD.MM.YYYY':
        return `${day}.${month}.${year}`
      default:
        return `${year}-${month}-${day}`
    }
  }

  /**
   * Clean and transform data for import
   */
  static cleanImportData(data: any[]): any[] {
    return data.map(row => {
      const cleaned: any = {}
      
      Object.keys(row).forEach(key => {
        let value = row[key]
        
        // Trim strings
        if (typeof value === 'string') {
          value = value.trim()
        }
        
        // Convert empty strings to null for optional fields
        if (value === '') {
          value = null
        }
        
        cleaned[key] = value
      })
      
      return cleaned
    })
  }
}