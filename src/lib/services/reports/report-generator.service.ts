import { supabase } from '@/lib/supabase/client'
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export interface ReportFilters {
  startDate: string
  endDate: string
  organizationId: string
  groupId?: string
  studentId?: string
  reportType: 'revenue' | 'outstanding' | 'payment_history' | 'group_analysis' | 'student_statement'
}

export class ReportGeneratorService {
  static async generateRevenueReport(filters: ReportFilters) {
    const { data: revenue, error } = await supabase
      .from('revenue_summary')
      .select('*')
      .eq('organization_id', filters.organizationId)
      .gte('month', filters.startDate)
      .lte('month', filters.endDate)
      .order('month', { ascending: true })

    if (error) throw error

    const { data: payments } = await supabase
      .from('payments')
      .select(`
        *,
        student:students(first_name, last_name, student_id),
        invoice:invoices(invoice_number)
      `)
      .eq('organization_id', filters.organizationId)
      .eq('status', 'completed')
      .gte('payment_date', filters.startDate)
      .lte('payment_date', filters.endDate)

    const { data: transactions } = await supabase
      .from('financial_transactions')
      .select('*')
      .eq('organization_id', filters.organizationId)
      .gte('transaction_date', filters.startDate)
      .lte('transaction_date', filters.endDate)

    return {
      summary: revenue || [],
      payments: payments || [],
      transactions: transactions || [],
      totals: {
        grossRevenue: revenue?.reduce((sum, r) => sum + (r.gross_revenue || 0), 0) || 0,
        netRevenue: revenue?.reduce((sum, r) => sum + (r.net_revenue || 0), 0) || 0,
        totalFees: revenue?.reduce((sum, r) => sum + (r.total_fees || 0), 0) || 0,
        paymentCount: payments?.length || 0,
      },
    }
  }

  static async generateOutstandingBalancesReport(filters: ReportFilters) {
    const { data: balances, error } = await supabase
      .from('outstanding_balances')
      .select('*')
      .eq('organization_id', filters.organizationId)
      .gt('balance', 0)
      .order('balance', { ascending: false })

    if (error) throw error

    const { data: overdueInvoices } = await supabase
      .from('invoices')
      .select(`
        *,
        student:students(first_name, last_name, primary_phone, email)
      `)
      .eq('organization_id', filters.organizationId)
      .lt('due_date', new Date().toISOString())
      .in('status', ['sent', 'viewed', 'partially_paid'])

    const riskAnalysis = (balances || []).reduce(
      (acc, balance) => {
        if (balance.risk_level === 'high') acc.highRisk++
        else if (balance.risk_level === 'medium') acc.mediumRisk++
        else acc.lowRisk++
        acc.totalOutstanding += balance.balance || 0
        return acc
      },
      { highRisk: 0, mediumRisk: 0, lowRisk: 0, totalOutstanding: 0 }
    )

    return {
      balances: balances || [],
      overdueInvoices: overdueInvoices || [],
      summary: {
        totalOutstanding: riskAnalysis.totalOutstanding,
        studentCount: balances?.length || 0,
        overdueCount: overdueInvoices?.length || 0,
        riskBreakdown: {
          high: riskAnalysis.highRisk,
          medium: riskAnalysis.mediumRisk,
          low: riskAnalysis.lowRisk,
        },
      },
    }
  }

  static async generatePaymentHistoryReport(filters: ReportFilters) {
    const { data: history, error } = await supabase
      .from('payment_history_summary')
      .select('*')
      .eq('organization_id', filters.organizationId)

    if (error) throw error

    let query = supabase
      .from('payments')
      .select(`
        *,
        student:students(first_name, last_name, student_id),
        invoice:invoices(invoice_number),
        payment_method:payment_methods(name)
      `)
      .eq('organization_id', filters.organizationId)
      .gte('payment_date', filters.startDate)
      .lte('payment_date', filters.endDate)
      .order('payment_date', { ascending: false })

    if (filters.studentId) {
      query = query.eq('student_id', filters.studentId)
    }

    const { data: payments } = await query

    return {
      summary: history || [],
      payments: payments || [],
      statistics: {
        totalAmount: payments?.reduce((sum, p) => sum + p.amount, 0) || 0,
        paymentCount: payments?.length || 0,
        averagePayment: payments?.length ? (payments.reduce((sum, p) => sum + p.amount, 0) / payments.length) : 0,
        paymentMethods: payments?.reduce((acc, p) => {
          const method = p.payment_method_type
          acc[method] = (acc[method] || 0) + 1
          return acc
        }, {} as Record<string, number>),
      },
    }
  }

  static async generateGroupRevenueAnalysis(filters: ReportFilters) {
    const { data: analysis, error } = await supabase
      .from('group_revenue_analysis')
      .select('*')
      .eq('organization_id', filters.organizationId)
      .order('total_invoiced', { ascending: false })

    if (error) throw error

    let groupQuery = supabase
      .from('groups')
      .select(`
        *,
        teacher_assignments:teacher_group_assignments(
          teacher:teachers(first_name, last_name)
        ),
        enrollments:student_group_enrollments(count)
      `)
      .eq('organization_id', filters.organizationId)

    if (filters.groupId) {
      groupQuery = groupQuery.eq('id', filters.groupId)
    }

    const { data: groups } = await groupQuery

    return {
      analysis: analysis || [],
      groups: groups || [],
      summary: {
        totalGroups: groups?.length || 0,
        totalRevenue: analysis?.reduce((sum, a) => sum + (a.total_collected || 0), 0) || 0,
        totalOutstanding: analysis?.reduce((sum, a) => sum + (a.outstanding_amount || 0), 0) || 0,
        averageGroupRevenue: groups?.length 
          ? (analysis?.reduce((sum, a) => sum + (a.total_collected || 0), 0) || 0) / groups.length
          : 0,
      },
    }
  }

  static async generateStudentStatement(studentId: string, filters: ReportFilters) {
    const { data: student } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single()

    const { data: account } = await supabase
      .from('student_accounts')
      .select('*')
      .eq('student_id', studentId)
      .single()

    const { data: invoices } = await supabase
      .from('invoices')
      .select(`
        *,
        line_items:invoice_line_items(*)
      `)
      .eq('student_id', studentId)
      .gte('invoice_date', filters.startDate)
      .lte('invoice_date', filters.endDate)
      .order('invoice_date', { ascending: false })

    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('student_id', studentId)
      .gte('payment_date', filters.startDate)
      .lte('payment_date', filters.endDate)
      .order('payment_date', { ascending: false })

    const { data: transactions } = await supabase
      .from('financial_transactions')
      .select('*')
      .eq('student_id', studentId)
      .gte('transaction_date', filters.startDate)
      .lte('transaction_date', filters.endDate)
      .order('transaction_date', { ascending: false })

    return {
      student,
      account,
      invoices: invoices || [],
      payments: payments || [],
      transactions: transactions || [],
      summary: {
        currentBalance: account?.current_balance || 0,
        totalInvoiced: invoices?.reduce((sum, i) => sum + i.total_amount, 0) || 0,
        totalPaid: payments?.reduce((sum, p) => sum + p.amount, 0) || 0,
        outstandingAmount: invoices?.reduce((sum, i) => sum + (i.total_amount - (i.paid_amount || 0)), 0) || 0,
      },
    }
  }

  static exportToExcel(data: any, reportName: string) {
    const workbook = XLSX.utils.book_new()
    
    if (Array.isArray(data)) {
      const worksheet = XLSX.utils.json_to_sheet(data)
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Report')
    } else {
      Object.entries(data).forEach(([sheetName, sheetData]) => {
        if (Array.isArray(sheetData)) {
          const worksheet = XLSX.utils.json_to_sheet(sheetData)
          XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
        }
      })
    }

    const fileName = `${reportName}_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`
    XLSX.writeFile(workbook, fileName)
  }

  static exportToPDF(data: any, reportName: string, title: string) {
    const doc = new jsPDF()
    
    doc.setFontSize(20)
    doc.text(title, 14, 22)
    
    doc.setFontSize(10)
    doc.text(`Generated: ${format(new Date(), 'PPP')}`, 14, 32)

    let yPosition = 45

    if (Array.isArray(data) && data.length > 0) {
      const headers = Object.keys(data[0])
      const rows = data.map(item => headers.map(header => item[header]))
      
      doc.autoTable({
        head: [headers],
        body: rows,
        startY: yPosition,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] },
      })
    }

    const fileName = `${reportName}_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`
    doc.save(fileName)
  }

  static exportToCSV(data: any[], fileName: string) {
    if (!data || data.length === 0) return

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `${fileName}_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}