import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'
import { format, addDays } from 'date-fns'

type Invoice = Database['public']['Tables']['invoices']['Row']
type InvoiceInsert = Database['public']['Tables']['invoices']['Insert']
type InvoiceUpdate = Database['public']['Tables']['invoices']['Update']
type InvoiceLineItem = Database['public']['Tables']['invoice_line_items']['Row']
type InvoiceLineItemInsert = Database['public']['Tables']['invoice_line_items']['Insert']

export class InvoiceService {
  static async create(invoice: InvoiceInsert, lineItems: InvoiceLineItemInsert[]) {
    const invoiceNumber = invoice.invoice_number || `INV-${Date.now()}`
    const invoiceDate = invoice.invoice_date || new Date().toISOString()
    const dueDate = invoice.due_date || addDays(new Date(), 30).toISOString()

    const subtotal = lineItems.reduce((sum, item) => sum + item.line_total, 0)
    const taxAmount = invoice.tax_amount || 0
    const discountAmount = invoice.discount_amount || 0
    const totalAmount = subtotal + taxAmount - discountAmount

    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        ...invoice,
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate,
        due_date: dueDate,
        subtotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        status: invoice.status || 'draft',
        currency: invoice.currency || 'USD',
      })
      .select()
      .single()

    if (invoiceError) throw invoiceError

    const lineItemsWithInvoiceId = lineItems.map(item => ({
      ...item,
      invoice_id: invoiceData.id,
      organization_id: invoiceData.organization_id,
    }))

    const { error: lineItemsError } = await supabase
      .from('invoice_line_items')
      .insert(lineItemsWithInvoiceId)

    if (lineItemsError) {
      await supabase.from('invoices').delete().eq('id', invoiceData.id)
      throw lineItemsError
    }

    return invoiceData
  }

  static async getById(id: string) {
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        student:students(first_name, last_name, student_id),
        group:groups(name, group_code),
        line_items:invoice_line_items(*),
        payments:payments(*)
      `)
      .eq('id', id)
      .single()

    if (invoiceError) throw invoiceError
    return invoice
  }

  static async list(filters?: {
    studentId?: string
    groupId?: string
    status?: string
    startDate?: string
    endDate?: string
    organizationId?: string
  }) {
    let query = supabase
      .from('invoices')
      .select(`
        *,
        student:students(first_name, last_name, student_id),
        group:groups(name)
      `)
      .order('invoice_date', { ascending: false })

    if (filters?.studentId) {
      query = query.eq('student_id', filters.studentId)
    }
    if (filters?.groupId) {
      query = query.eq('group_id', filters.groupId)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.startDate) {
      query = query.gte('invoice_date', filters.startDate)
    }
    if (filters?.endDate) {
      query = query.lte('invoice_date', filters.endDate)
    }
    if (filters?.organizationId) {
      query = query.eq('organization_id', filters.organizationId)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  static async update(id: string, invoice: InvoiceUpdate) {
    if (invoice.subtotal !== undefined || invoice.tax_amount !== undefined || invoice.discount_amount !== undefined) {
      const current = await this.getById(id)
      const subtotal = invoice.subtotal ?? current.subtotal
      const taxAmount = invoice.tax_amount ?? current.tax_amount ?? 0
      const discountAmount = invoice.discount_amount ?? current.discount_amount ?? 0
      invoice.total_amount = subtotal + taxAmount - discountAmount
    }

    const { data, error } = await supabase
      .from('invoices')
      .update(invoice)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async sendInvoice(id: string) {
    const invoice = await this.getById(id)
    if (!invoice) throw new Error('Invoice not found')

    const updates: InvoiceUpdate = {
      status: invoice.status === 'draft' ? 'sent' : invoice.status,
      sent_at: new Date().toISOString(),
      email_sent_count: (invoice.email_sent_count || 0) + 1,
    }

    return this.update(id, updates)
  }

  static async markAsViewed(id: string) {
    const updates: InvoiceUpdate = {
      status: 'viewed',
      viewed_at: new Date().toISOString(),
    }

    return this.update(id, updates)
  }

  static async applyLateFee(id: string, feeAmount: number) {
    const invoice = await this.getById(id)
    if (!invoice) throw new Error('Invoice not found')

    const updates: InvoiceUpdate = {
      late_fee_applied: (invoice.late_fee_applied || 0) + feeAmount,
      total_amount: invoice.total_amount + feeAmount,
      status: 'overdue',
    }

    const { data: lineItem, error: lineItemError } = await supabase
      .from('invoice_line_items')
      .insert({
        invoice_id: id,
        description: 'Late fee',
        item_type: 'fee',
        quantity: 1,
        unit_price: feeAmount,
        line_total: feeAmount,
        organization_id: invoice.organization_id,
      })

    if (lineItemError) throw lineItemError

    return this.update(id, updates)
  }

  static async cancelInvoice(id: string) {
    const updates: InvoiceUpdate = {
      status: 'cancelled',
    }

    return this.update(id, updates)
  }

  static async getOverdueInvoices(organizationId: string) {
    const today = new Date().toISOString()

    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        student:students(first_name, last_name, primary_phone, email)
      `)
      .eq('organization_id', organizationId)
      .lt('due_date', today)
      .in('status', ['sent', 'viewed', 'partially_paid'])

    if (error) throw error
    return data || []
  }

  static async generateRecurringInvoices(organizationId: string) {
    const { data: schedules, error: schedulesError } = await supabase
      .from('payment_schedules')
      .select(`
        *,
        student_accounts!inner(student_id)
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .eq('auto_generate_invoices', true)

    if (schedulesError) throw schedulesError

    const invoices = []
    for (const schedule of schedules || []) {
      
    }

    return invoices
  }

  static async getInvoiceSummary(organizationId: string, period?: { start: string; end: string }) {
    let query = supabase
      .from('invoices')
      .select('total_amount, paid_amount, status, currency')
      .eq('organization_id', organizationId)

    if (period) {
      query = query.gte('invoice_date', period.start).lte('invoice_date', period.end)
    }

    const { data, error } = await query

    if (error) throw error

    const summary = {
      totalInvoiced: 0,
      totalPaid: 0,
      totalOutstanding: 0,
      invoiceCount: 0,
      byStatus: {} as Record<string, number>,
      byCurrency: {} as Record<string, number>,
    }

    data?.forEach((invoice) => {
      summary.totalInvoiced += invoice.total_amount
      summary.totalPaid += invoice.paid_amount || 0
      summary.totalOutstanding += invoice.total_amount - (invoice.paid_amount || 0)
      summary.invoiceCount++
      
      const status = invoice.status || 'draft'
      summary.byStatus[status] = (summary.byStatus[status] || 0) + 1
      
      const currency = invoice.currency
      summary.byCurrency[currency] = (summary.byCurrency[currency] || 0) + invoice.total_amount
    })

    return summary
  }
}