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
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ReportGeneratorService, ReportFilters } from '@/lib/services/reports/report-generator.service'
import { toast } from '@/components/ui/use-toast'
import { RevenueChart } from './revenue-chart'
import { OutstandingBalancesTable } from './outstanding-balances-table'
import { GroupAnalysisChart } from './group-analysis-chart'

interface ReportDashboardProps {
  organizationId: string
}

export function ReportDashboard({ organizationId }: ReportDashboardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [reportType, setReportType] = useState<ReportFilters['reportType']>('revenue')
  const [dateRange, setDateRange] = useState<{
    from: Date
    to: Date
  } | null>(null)
  const [reportData, setReportData] = useState<any>(null)
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
      const filters: ReportFilters = {
        startDate: format(dateRange.from, 'yyyy-MM-dd'),
        endDate: format(dateRange.to, 'yyyy-MM-dd'),
        organizationId,
        reportType,
      }

      let data
      switch (reportType) {
        case 'revenue':
          data = await ReportGeneratorService.generateRevenueReport(filters)
          break
        case 'outstanding':
          data = await ReportGeneratorService.generateOutstandingBalancesReport(filters)
          break
        case 'payment_history':
          data = await ReportGeneratorService.generatePaymentHistoryReport(filters)
          break
        case 'group_analysis':
          data = await ReportGeneratorService.generateGroupRevenueAnalysis(filters)
          break
        default:
          throw new Error('Invalid report type')
      }

      setReportData(data)
      toast({
        title: 'Report Generated',
        description: 'Your report has been generated successfully.',
      })
    } catch (error) {
      console.error('Error generating report:', error)
      toast({
        title: 'Error',
        description: 'Failed to generate report. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const exportReport = (format: 'excel' | 'pdf' | 'csv') => {
    if (!reportData) {
      toast({
        title: 'No Data',
        description: 'Please generate a report first.',
        variant: 'destructive',
      })
      return
    }

    try {
      const reportName = `${reportType}_report`
      const title = `${reportType.replace('_', ' ').toUpperCase()} Report`

      switch (format) {
        case 'excel':
          ReportGeneratorService.exportToExcel(reportData, reportName)
          break
        case 'pdf':
          ReportGeneratorService.exportToPDF(
            Array.isArray(reportData) ? reportData : reportData.summary || reportData.balances || [],
            reportName,
            title
          )
          break
        case 'csv':
          ReportGeneratorService.exportToCSV(
            Array.isArray(reportData) ? reportData : reportData.summary || reportData.balances || [],
            reportName
          )
          break
      }

      toast({
        title: 'Export Successful',
        description: `Report exported as ${format.toUpperCase()} successfully.`,
      })
    } catch (error) {
      console.error('Error exporting report:', error)
      toast({
        title: 'Export Failed',
        description: 'Failed to export report. Please try again.',
        variant: 'destructive',
      })
    }
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
            <div className="grid gap-4 md:grid-cols-4">
              <Select value={reportType} onValueChange={(value) => setReportType(value as ReportFilters['reportType'])}>
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

              <DateRangePicker
                from={dateRange?.from}
                to={dateRange?.to}
                onSelect={setDateRange}
              />

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

              <Button onClick={generateReport} disabled={isLoading}>
                {isLoading ? 'Generating...' : 'Generate Report'}
              </Button>
            </div>

            {reportData && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => exportReport('excel')}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export Excel
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportReport('pdf')}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportReport('csv')}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
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
            {reportType === 'revenue' && <RevenueChart data={reportData} />}
            {reportType === 'outstanding' && <OutstandingBalancesTable data={reportData} />}
            {reportType === 'group_analysis' && <GroupAnalysisChart data={reportData} />}
            {reportType === 'payment_history' && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Payments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{reportData.statistics.paymentCount}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Amount</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">${reportData.statistics.totalAmount.toFixed(2)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Average Payment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">${reportData.statistics.averagePayment.toFixed(2)}</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}