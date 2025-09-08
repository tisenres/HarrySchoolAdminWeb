'use client'

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
import {
  BarChart3,
  Calendar,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  TrendingUp,
  Users,
  Wallet,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
// import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { reportsService, ReportType } from '@/lib/services/reports-service'
import { ImportExportService } from '@/lib/services/import-export-service'

interface ReportDashboardProps {
  organizationId: string
}


export function ReportDashboard({ organizationId }: ReportDashboardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [reportType, setReportType] = useState<ReportType>('revenue')
  const [dateRange, setDateRange] = useState<{
    from: Date
    to: Date
  } | null>(null)
  const [reportData, setReportData] = useState<any>(null)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [quickDateRanges, setQuickDateRanges] = useState<Array<{
    label: string
    value: string
    from: Date
    to: Date
  }>>([])

  useEffect(() => {
    const now = new Date()
    
    // Set initial date range
    setDateRange({
      from: startOfMonth(now),
      to: endOfMonth(now),
    })

    // Set quick date ranges
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastYear = new Date(now.getFullYear() - 1, 0, 1)
    
    setQuickDateRanges([
      { label: 'This Month', value: 'month', from: startOfMonth(now), to: endOfMonth(now) },
      { label: 'Last Month', value: 'lastMonth', from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) },
      { label: 'This Year', value: 'year', from: startOfYear(now), to: endOfYear(now) },
      { label: 'Last Year', value: 'lastYear', from: startOfYear(lastYear), to: endOfYear(lastYear) },
    ])
  }, [])

  const generateReport = async () => {
    if (!dateRange) return
    
    setIsLoading(true)
    try {
      const reportData = await reportsService.generateReport(reportType, dateRange)
      setReportData(reportData)
      console.log('Report generated successfully')
    } catch (error) {
      console.error('Error generating report:', error)
      // Fallback to some basic data on error
      setReportData(null)
    } finally {
      setIsLoading(false)
    }
  }

  const exportReport = async (format: 'excel' | 'pdf' | 'csv') => {
    if (!reportData || !dateRange) {
      alert('Please generate a report first.')
      return
    }

    try {
      setIsLoading(true)
      
      // Get detailed exportable data from reports service
      const detailedExportData = await reportsService.generateDetailedExportData(reportType, dateRange)
      
      if (format === 'excel') {
        await ImportExportService.exportDetailedExcel(detailedExportData)
      } else if (format === 'pdf') {
        await ImportExportService.exportDetailedPDF(detailedExportData)
      } else if (format === 'csv') {
        ImportExportService.exportDetailedCSV(detailedExportData)
      }
      
      console.log(`Successfully exported detailed ${reportType} report as ${format.toUpperCase()}`)
      
    } catch (error) {
      console.error('Error exporting detailed report:', error)
      alert(`Failed to export report: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsLoading(true)
      
      // Read the imported file
      const rawData = await ImportExportService.readExcelFile(file)
      const { headers, rows } = ImportExportService.parseFileData(rawData)
      
      console.log('Imported headers:', headers)
      console.log('Imported data rows:', rows.length)
      
      // For now, just display the imported data structure
      // In a real implementation, you would validate and process this data
      alert(`Successfully imported ${rows.length} rows with columns: ${headers.join(', ')}`)
      
      setShowImportDialog(false)
      
    } catch (error) {
      console.error('Error importing file:', error)
      alert(`Failed to import file: ${error.message}`)
    } finally {
      setIsLoading(false)
      // Reset file input
      if (event.target) {
        event.target.value = ''
      }
    }
  }

  const downloadTemplate = () => {
    const template = {
      headers: ['Date', 'Student Name', 'Amount', 'Payment Method', 'Status'],
      sampleData: [
        ['2024-01-15', 'John Doe', '500', 'Cash', 'Completed'],
        ['2024-01-16', 'Jane Smith', '750', 'Card', 'Pending'],
        ['2024-01-17', 'Bob Johnson', '600', 'Transfer', 'Completed']
      ],
      instructions: [
        'Fill in your data following the sample format above',
        'Date format: YYYY-MM-DD',
        'Amount should be numeric without currency symbols',
        'Status can be: Completed, Pending, Failed',
        'Payment Method can be: Cash, Card, Transfer, Check'
      ]
    }
    
    ImportExportService.generateTemplate(template, 'payment_import_template')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Report Generator</CardTitle>
          <CardDescription>
            Generate and export financial reports for your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4 items-end">
              <Select value={reportType} onValueChange={(value) => setReportType(value as ReportType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue Report</SelectItem>
                  <SelectItem value="outstanding">Outstanding Balances</SelectItem>
                  <SelectItem value="payment_history">Payment History</SelectItem>
                  <SelectItem value="group_analysis">Group Analysis</SelectItem>
                  <SelectItem value="student_statement">Student Statement</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center px-3 py-2 border rounded-md bg-background h-10">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {dateRange ? 
                    `${format(dateRange.from, 'MMM dd, yyyy')} - ${format(dateRange.to, 'MMM dd, yyyy')}` :
                    'Select date range'
                  }
                </span>
              </div>

              <Select onValueChange={(value) => {
                const range = quickDateRanges.find(r => r.value === value)
                if (range) {
                  setDateRange({ from: range.from, to: range.to })
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Quick ranges" />
                </SelectTrigger>
                <SelectContent>
                  {quickDateRanges.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2 items-center">
                <Button onClick={generateReport} disabled={isLoading} className="h-10">
                  {isLoading ? 'Generating...' : 'Generate Report'}
                </Button>
                <Button variant="outline" onClick={() => setShowImportDialog(true)} disabled={isLoading} className="h-10">
                  <Upload className="mr-2 h-4 w-4" />
                  Import Data
                </Button>
              </div>
            </div>

            {reportData && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => exportReport('excel')}
                  disabled={isLoading}
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  {isLoading ? 'Exporting...' : 'Export Excel'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => exportReport('pdf')}
                  disabled={isLoading}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {isLoading ? 'Exporting...' : 'Export PDF'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => exportReport('csv')}
                  disabled={isLoading}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isLoading ? 'Exporting...' : 'Export CSV'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle>Report Results</CardTitle>
            <CardDescription>
              {reportType.replace('_', ' ').charAt(0).toUpperCase() + reportType.replace('_', ' ').slice(1)} for {dateRange ? format(dateRange.from, 'MMM dd, yyyy') + ' - ' + format(dateRange.to, 'MMM dd, yyyy') : 'Loading...'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Mock Report Visualizations */}
            {reportType === 'revenue' && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">${reportData?.total?.toLocaleString() || '0'}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Monthly Average</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">${Math.round((reportData?.total || 0) / Math.max(reportData?.monthly?.length || 1, 1)).toLocaleString()}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Growth Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-muted-foreground">N/A</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
            {reportType === 'outstanding' && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground mb-2">Outstanding balances by student:</div>
                {reportData?.balances?.map((balance: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded">
                    <span>{balance.student}</span>
                    <div className="text-right">
                      <div className="font-semibold">${balance.amount}</div>
                      <div className="text-xs text-muted-foreground">{balance.days} days overdue</div>
                    </div>
                  </div>
                )) || 'No outstanding balances found'}
              </div>
            )}
            {reportType === 'group_analysis' && (
              <div className="text-center py-8 text-muted-foreground">
                Group analysis visualization would appear here
              </div>
            )}
            {reportType === 'payment_history' && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Payments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{reportData?.statistics?.paymentCount || 0}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Amount</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">${(reportData?.statistics?.totalAmount || 0).toLocaleString()}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Average Payment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">${reportData?.statistics?.averagePayment || 0}</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import Report Data</DialogTitle>
            <DialogDescription>
              Upload an Excel or CSV file to import payment/financial data for analysis
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="import-file">Select File</Label>
              <Input
                id="import-file"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleImportFile}
                disabled={isLoading}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Supported formats: Excel (.xlsx, .xls) and CSV (.csv)
              </p>
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                disabled={isLoading}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowImportDialog(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}