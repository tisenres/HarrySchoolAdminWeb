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
// import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
// import { ReportGeneratorService, ReportFilters } from '@/lib/services/reports/report-generator.service'
// import { toast } from '@/components/ui/use-toast'
// import { RevenueChart } from './revenue-chart'
// import { OutstandingBalancesTable } from './outstanding-balances-table'
// import { GroupAnalysisChart } from './group-analysis-chart'

interface ReportDashboardProps {
  organizationId: string
}

type ReportType = 'revenue' | 'outstanding' | 'payment_history' | 'group_analysis' | 'student_statement'

export function ReportDashboard({ organizationId }: ReportDashboardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [reportType, setReportType] = useState<ReportType>('revenue')
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
      // Mock report data for testing
      const mockData = {
        revenue: {
          total: 125000,
          monthly: [
            { month: 'Jan', revenue: 15000 },
            { month: 'Feb', revenue: 18000 },
            { month: 'Mar', revenue: 22000 },
            { month: 'Apr', revenue: 19000 },
            { month: 'May', revenue: 25000 },
            { month: 'Jun', revenue: 26000 }
          ]
        },
        outstanding: {
          balances: [
            { student: 'Alice Johnson', amount: 1200, days: 15 },
            { student: 'Bob Smith', amount: 800, days: 22 },
            { student: 'Carol Davis', amount: 1500, days: 8 }
          ]
        },
        payment_history: {
          statistics: {
            paymentCount: 245,
            totalAmount: 98750,
            averagePayment: 403
          }
        }
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setReportData(mockData[reportType] || mockData.revenue)
      
      // Show success message (simplified without toast)
      console.log('Report generated successfully')
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const exportReport = (format: 'excel' | 'pdf' | 'csv') => {
    if (!reportData) {
      alert('Please generate a report first.')
      return
    }

    try {
      const reportName = `${reportType}_report_${format}`
      
      // Mock export functionality
      console.log(`Exporting ${reportName} as ${format.toUpperCase()}`)
      
      // In a real implementation, this would trigger actual file download
      // For demo purposes, just show success
      alert(`Report exported as ${format.toUpperCase()} successfully!`)
    } catch (error) {
      console.error('Error exporting report:', error)
      alert('Failed to export report. Please try again.')
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

              <div className="flex items-center px-3 py-2 border rounded-md bg-background">
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
            {/* Mock Report Visualizations */}
            {reportType === 'revenue' && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">${reportData?.total?.toLocaleString() || '125,000'}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Monthly Average</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">${Math.round((reportData?.total || 125000) / 6).toLocaleString()}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Growth Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">+12.5%</div>
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
                      <div className="text-2xl font-bold">{reportData?.statistics?.paymentCount || 245}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Amount</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">${(reportData?.statistics?.totalAmount || 98750).toLocaleString()}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Average Payment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">${reportData?.statistics?.averagePayment || 403}</div>
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