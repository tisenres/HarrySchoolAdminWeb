'use client'

import { supabase } from '@/lib/supabase/client'

export interface RevenueReportData {
  total: number
  monthly: Array<{
    month: string
    revenue: number
  }>
}

export interface OutstandingBalancesData {
  balances: Array<{
    student: string
    amount: number
    days: number
  }>
}

export interface PaymentHistoryData {
  statistics: {
    paymentCount: number
    totalAmount: number
    averagePayment: number
  }
}

export type ReportType = 'revenue' | 'outstanding' | 'payment_history' | 'group_analysis' | 'student_statement'

export interface ExportableReportData {
  headers: string[]
  rows: any[][]
  title: string
  dateRange?: string
  summary?: Record<string, any>
}

export class ReportsService {
  async generateRevenueReport(dateRange: { from: Date; to: Date }): Promise<RevenueReportData> {
    try {
      // Get total revenue for the period
      const { data: payments } = await supabase
        .from('payments')
        .select('amount, created_at')
        .eq('status', 'completed')
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())

      const total = payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0

      // Generate monthly breakdown
      const monthlyData: { [key: string]: number } = {}
      
      payments?.forEach(payment => {
        const date = new Date(payment.created_at)
        const monthKey = date.toLocaleDateString('en-US', { month: 'short' })
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + (payment.amount || 0)
      })

      const monthly = Object.entries(monthlyData).map(([month, revenue]) => ({
        month,
        revenue
      }))

      return { total, monthly }
    } catch (error) {
      console.error('Error generating revenue report:', error)
      // Return fallback data
      return {
        total: 0,
        monthly: []
      }
    }
  }

  async generateOutstandingBalancesReport(): Promise<OutstandingBalancesData> {
    try {
      // Get students with outstanding payments
      const { data: students } = await supabase
        .from('students')
        .select(`
          id,
          first_name,
          last_name,
          payments!inner(
            amount,
            status,
            due_date,
            created_at
          )
        `)
        .eq('payments.status', 'pending')
        .is('deleted_at', null)

      const balances = students?.map(student => {
        const outstandingPayments = student.payments?.filter(p => p.status === 'pending') || []
        const totalAmount = outstandingPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
        
        // Calculate days overdue (using oldest pending payment)
        const oldestPayment = outstandingPayments
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0]
        
        const dueDate = oldestPayment?.due_date ? new Date(oldestPayment.due_date) : new Date()
        const today = new Date()
        const daysOverdue = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)))

        return {
          student: `${student.first_name} ${student.last_name}`,
          amount: totalAmount,
          days: daysOverdue
        }
      }).filter(balance => balance.amount > 0) || []

      return { balances }
    } catch (error) {
      console.error('Error generating outstanding balances report:', error)
      return { balances: [] }
    }
  }

  async generatePaymentHistoryReport(dateRange: { from: Date; to: Date }): Promise<PaymentHistoryData> {
    try {
      const { data: payments, count } = await supabase
        .from('payments')
        .select('amount', { count: 'exact' })
        .eq('status', 'completed')
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())

      const totalAmount = payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0
      const paymentCount = count || 0
      const averagePayment = paymentCount > 0 ? Math.round(totalAmount / paymentCount) : 0

      return {
        statistics: {
          paymentCount,
          totalAmount,
          averagePayment
        }
      }
    } catch (error) {
      console.error('Error generating payment history report:', error)
      return {
        statistics: {
          paymentCount: 0,
          totalAmount: 0,
          averagePayment: 0
        }
      }
    }
  }

  async generateReport(reportType: ReportType, dateRange: { from: Date; to: Date }) {
    switch (reportType) {
      case 'revenue':
        return await this.generateRevenueReport(dateRange)
      case 'outstanding':
        return await this.generateOutstandingBalancesReport()
      case 'payment_history':
        return await this.generatePaymentHistoryReport(dateRange)
      case 'group_analysis':
        // Placeholder for group analysis
        return { message: 'Group analysis not implemented yet' }
      case 'student_statement':
        // Placeholder for student statement
        return { message: 'Student statement not implemented yet' }
      default:
        throw new Error(`Unknown report type: ${reportType}`)
    }
  }

  async generateExportableData(reportType: ReportType, dateRange: { from: Date; to: Date }): Promise<ExportableReportData> {
    const dateRangeStr = `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`
    
    switch (reportType) {
      case 'revenue': {
        const data = await this.generateRevenueReport(dateRange)
        return {
          title: 'Revenue Report',
          dateRange: dateRangeStr,
          headers: ['Month', 'Revenue'],
          rows: data.monthly.map(item => [item.month, item.revenue]),
          summary: { totalRevenue: data.total }
        }
      }
      
      case 'outstanding': {
        const data = await this.generateOutstandingBalancesReport()
        return {
          title: 'Outstanding Balances Report',
          dateRange: dateRangeStr,
          headers: ['Student Name', 'Amount Owed', 'Days Overdue'],
          rows: data.balances.map(item => [item.student, item.amount, item.days]),
          summary: { 
            totalOutstanding: data.balances.reduce((sum, item) => sum + item.amount, 0),
            studentsCount: data.balances.length
          }
        }
      }
      
      case 'payment_history': {
        const data = await this.generatePaymentHistoryReport(dateRange)
        return {
          title: 'Payment History Report',
          dateRange: dateRangeStr,
          headers: ['Metric', 'Value'],
          rows: [
            ['Total Payments', data.statistics.paymentCount],
            ['Total Amount', data.statistics.totalAmount],
            ['Average Payment', data.statistics.averagePayment]
          ],
          summary: data.statistics
        }
      }
      
      default:
        throw new Error(`Export not implemented for report type: ${reportType}`)
    }
  }
}

export const reportsService = new ReportsService()