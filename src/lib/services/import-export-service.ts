import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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
  format: 'xlsx' | 'csv' | 'pdf'
  sheetName?: string
  includeHeaders?: boolean
  dateFormat?: string
  title?: string
  orientation?: 'portrait' | 'landscape'
}

export interface ImportTemplate {
  headers: string[]
  sampleData: any[][]
  instructions: string[]
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'doughnut'
  title: string
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
    borderWidth?: number
  }[]
}

export interface DetailedExportData {
  title: string
  dateRange?: string
  summary: Record<string, any>
  charts: ChartData[]
  sheets: {
    name: string
    headers: string[]
    data: any[][]
    formatting?: {
      headerStyle?: any
      cellStyles?: any
      columnWidths?: number[]
    }
  }[]
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
   * Export data to PDF file with table formatting
   */
  static exportToPDF(
    data: any[],
    headers: string[],
    options: {
      filename?: string
      title?: string
      orientation?: 'portrait' | 'landscape'
      summary?: Record<string, any>
    } = {}
  ): void {
    const {
      filename = `export_${new Date().toISOString().split('T')[0]}`,
      title = 'Report',
      orientation = 'portrait',
      summary = {}
    } = options

    // Create new PDF document
    const doc = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: 'a4'
    })

    // Add title
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(title, 14, 20)

    // Add date
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30)

    let yPosition = 40

    // Add summary section if provided
    if (Object.keys(summary).length > 0) {
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Summary', 14, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      
      Object.entries(summary).forEach(([key, value]) => {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
        doc.text(`${label}: ${value}`, 14, yPosition)
        yPosition += 6
      })
      
      yPosition += 10
    }

    // Add data table
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Details', 14, yPosition)
    yPosition += 10

    // Create table using autoTable
    autoTable(doc, {
      head: [headers],
      body: data,
      startY: yPosition,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [29, 116, 82], // Harry School green color
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      margin: { top: 20, right: 14, bottom: 20, left: 14 },
    })

    // Save the PDF
    doc.save(`${filename}.pdf`)
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

  /**
   * Generate a Canvas chart as base64 image data URL
   */
  private static generateChartImage(chartData: ChartData): Promise<string> {
    return new Promise((resolve, reject) => {
      // Create a temporary canvas
      const canvas = document.createElement('canvas')
      canvas.width = 800
      canvas.height = 400
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }

      // Manually draw a simple chart since Chart.js needs DOM
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Draw title
      ctx.fillStyle = '#1d7452'
      ctx.font = 'bold 24px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(chartData.title, canvas.width / 2, 40)
      
      // Draw simple bar chart
      if (chartData.type === 'bar') {
        const barWidth = (canvas.width - 100) / chartData.labels.length
        const maxValue = Math.max(...chartData.datasets[0].data)
        
        chartData.labels.forEach((label, index) => {
          const value = chartData.datasets[0].data[index]
          const barHeight = (value / maxValue) * 300
          const x = 50 + index * barWidth
          const y = canvas.height - 80 - barHeight
          
          // Draw bar
          ctx.fillStyle = chartData.datasets[0].backgroundColor as string || '#1d7452'
          ctx.fillRect(x + 10, y, barWidth - 20, barHeight)
          
          // Draw value on top of bar
          ctx.fillStyle = '#333'
          ctx.font = '14px Arial'
          ctx.textAlign = 'center'
          ctx.fillText(value.toString(), x + barWidth / 2, y - 10)
          
          // Draw label
          ctx.fillText(label, x + barWidth / 2, canvas.height - 20)
        })
      }
      
      resolve(canvas.toDataURL('image/png'))
    })
  }

  /**
   * Export detailed report with charts and formatted data
   */
  static async exportDetailedExcel(exportData: DetailedExportData): Promise<void> {
    const workbook = XLSX.utils.book_new()
    
    // Add summary sheet
    const summaryData = [
      ['Report Title', exportData.title],
      ['Date Range', exportData.dateRange || 'N/A'],
      ['Generated On', new Date().toLocaleString()],
      [''], // Empty row
      ['Summary Statistics', '']
    ]
    
    // Add summary statistics
    Object.entries(exportData.summary).forEach(([key, value]) => {
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
      summaryData.push([label, value])
    })
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
    
    // Style the summary sheet
    const range = XLSX.utils.decode_range(summarySheet['!ref'] || 'A1')
    summarySheet['!cols'] = [{ width: 25 }, { width: 20 }]
    
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')
    
    // Add data sheets
    exportData.sheets.forEach(sheet => {
      const worksheetData = [sheet.headers, ...sheet.data]
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
      
      // Apply formatting if provided
      if (sheet.formatting?.columnWidths) {
        worksheet['!cols'] = sheet.formatting.columnWidths.map(width => ({ width }))
      } else {
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
      }
      
      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name)
    })
    
    // Generate and download file
    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'array',
      cellStyles: true
    })
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    const filename = `${exportData.title.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.xlsx`
    this.downloadBlob(blob, filename)
  }

  /**
   * Export detailed PDF report with charts and formatted data
   */
  static async exportDetailedPDF(exportData: DetailedExportData): Promise<void> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    // Add title page
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text(exportData.title, 105, 40, { align: 'center' })

    // Add date range
    if (exportData.dateRange) {
      doc.setFontSize(14)
      doc.setFont('helvetica', 'normal')
      doc.text(`Period: ${exportData.dateRange}`, 105, 55, { align: 'center' })
    }

    // Add generation info
    doc.setFontSize(10)
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 65, { align: 'center' })

    let yPosition = 80

    // Add summary section
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Executive Summary', 20, yPosition)
    yPosition += 15

    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    
    Object.entries(exportData.summary).forEach(([key, value]) => {
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
      doc.text(`${label}: `, 20, yPosition)
      doc.setFont('helvetica', 'bold')
      doc.text(String(value), 80, yPosition)
      doc.setFont('helvetica', 'normal')
      yPosition += 8
    })

    yPosition += 10

    // Add chart descriptions (since we can't easily embed charts in jsPDF)
    if (exportData.charts.length > 0) {
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('Charts & Visualizations', 20, yPosition)
      yPosition += 15

      exportData.charts.forEach(chart => {
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text(chart.title, 20, yPosition)
        yPosition += 10

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text(`Chart Type: ${chart.type.toUpperCase()}`, 25, yPosition)
        yPosition += 6

        // Show chart data in table format
        const chartTableData = chart.labels.map((label, index) => [
          label, 
          chart.datasets[0].data[index].toString()
        ])

        autoTable(doc, {
          head: [['Category', 'Value']],
          body: chartTableData,
          startY: yPosition,
          margin: { left: 25, right: 20 },
          styles: { fontSize: 9 },
          headStyles: {
            fillColor: [29, 116, 82],
            textColor: 255,
            fontStyle: 'bold',
          },
        })

        yPosition = (doc as any).lastAutoTable.finalY + 15
      })
    }

    // Add data tables
    exportData.sheets.forEach((sheet, sheetIndex) => {
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 30
      }

      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text(sheet.name, 20, yPosition)
      yPosition += 15

      autoTable(doc, {
        head: [sheet.headers],
        body: sheet.data,
        startY: yPosition,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [29, 116, 82],
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { top: 20, right: 14, bottom: 20, left: 14 },
        pageBreak: 'auto',
      })

      yPosition = (doc as any).lastAutoTable.finalY + 20
    })

    // Save the PDF
    const filename = `${exportData.title.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(filename)
  }

  /**
   * Export detailed CSV with all data sheets combined
   */
  static exportDetailedCSV(exportData: DetailedExportData): void {
    let csvContent = ''
    
    // Add header information
    csvContent += `"${exportData.title}"\n`
    if (exportData.dateRange) {
      csvContent += `"Period: ${exportData.dateRange}"\n`
    }
    csvContent += `"Generated on: ${new Date().toLocaleString()}"\n\n`
    
    // Add summary
    csvContent += '"EXECUTIVE SUMMARY"\n'
    Object.entries(exportData.summary).forEach(([key, value]) => {
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
      csvContent += `"${label}","${value}"\n`
    })
    csvContent += '\n'
    
    // Add chart data
    exportData.charts.forEach(chart => {
      csvContent += `"${chart.title.toUpperCase()}"\n`
      csvContent += `"Category","Value"\n`
      chart.labels.forEach((label, index) => {
        csvContent += `"${label}","${chart.datasets[0].data[index]}"\n`
      })
      csvContent += '\n'
    })
    
    // Add data sheets
    exportData.sheets.forEach(sheet => {
      csvContent += `"${sheet.name.toUpperCase()}"\n`
      
      // Headers
      csvContent += sheet.headers.map(header => `"${header}"`).join(',') + '\n'
      
      // Data rows
      sheet.data.forEach(row => {
        csvContent += row.map(cell => `"${cell || ''}"`).join(',') + '\n'
      })
      csvContent += '\n'
    })
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    const filename = `${exportData.title.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`
    this.downloadBlob(blob, filename)
  }
}