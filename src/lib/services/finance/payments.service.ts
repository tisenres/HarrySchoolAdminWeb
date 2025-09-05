import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'
import { format } from 'date-fns'

type Payment = Database['public']['Tables']['payments']['Row']
type PaymentInsert = Database['public']['Tables']['payments']['Insert']
type PaymentUpdate = Database['public']['Tables']['payments']['Update']

export class PaymentService {
  static async create(payment: PaymentInsert) {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        ...payment,
        payment_number: payment.payment_number || `PAY-${Date.now()}`,
        payment_date: payment.payment_date || new Date().toISOString(),
        currency: payment.currency || 'USD',
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getById(id: string) {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        student:students(first_name, last_name, student_id),
        invoice:invoices(invoice_number, total_amount),
        payment_method:payment_methods(name, method_type)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  static async list(filters?: {
    studentId?: string
    invoiceId?: string
    status?: string
    startDate?: string
    endDate?: string
    organizationId?: string
  }) {
    let query = supabase
      .from('payments')
      .select(`
        *,
        student:students(first_name, last_name, student_id),
        invoice:invoices(invoice_number)
      `)
      .order('payment_date', { ascending: false })

    if (filters?.studentId) {
      query = query.eq('student_id', filters.studentId)
    }
    if (filters?.invoiceId) {
      query = query.eq('invoice_id', filters.invoiceId)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.startDate) {
      query = query.gte('payment_date', filters.startDate)
    }
    if (filters?.endDate) {
      query = query.lte('payment_date', filters.endDate)
    }
    if (filters?.organizationId) {
      query = query.eq('organization_id', filters.organizationId)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  static async update(id: string, payment: PaymentUpdate) {
    const { data, error } = await supabase
      .from('payments')
      .update(payment)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async processPayment(paymentId: string) {
    const payment = await this.getById(paymentId)
    if (!payment) throw new Error('Payment not found')

    const updates: PaymentUpdate = {
      status: 'completed',
      processed_at: new Date().toISOString(),
    }

    if (payment.invoice_id) {
      await this.applyPaymentToInvoice(paymentId, payment.invoice_id, payment.amount)
    }

    if (payment.student_id) {
      await this.updateStudentAccount(payment.student_id, payment.amount)
    }

    return this.update(paymentId, updates)
  }

  static async applyPaymentToInvoice(paymentId: string, invoiceId: string, amount: number) {
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('total_amount, paid_amount')
      .eq('id', invoiceId)
      .single()

    if (invoiceError) throw invoiceError

    const newPaidAmount = (invoice.paid_amount || 0) + amount
    const status = newPaidAmount >= invoice.total_amount ? 'paid' : 'partially_paid'

    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        paid_amount: newPaidAmount,
        status,
        paid_at: status === 'paid' ? new Date().toISOString() : null,
      })
      .eq('id', invoiceId)

    if (updateError) throw updateError

    const { error: transactionError } = await supabase
      .from('financial_transactions')
      .insert({
        payment_id: paymentId,
        invoice_id: invoiceId,
        amount,
        transaction_type: 'income',
        transaction_number: `TXN-${Date.now()}`,
        description: `Payment applied to invoice`,
        currency: 'USD',
        organization_id: invoice.organization_id,
      })

    if (transactionError) throw transactionError
  }

  static async updateStudentAccount(studentId: string, amount: number) {
    const { data: account, error: accountError } = await supabase
      .from('student_accounts')
      .select('current_balance, total_paid')
      .eq('student_id', studentId)
      .single()

    if (accountError && accountError.code !== 'PGRST116') throw accountError

    if (account) {
      const { error: updateError } = await supabase
        .from('student_accounts')
        .update({
          current_balance: (account.current_balance || 0) - amount,
          total_paid: (account.total_paid || 0) + amount,
          last_payment_amount: amount,
          last_payment_date: new Date().toISOString(),
        })
        .eq('student_id', studentId)

      if (updateError) throw updateError
    }
  }

  static async reconcilePayment(paymentId: string, reconciledBy: string) {
    const { data, error } = await supabase
      .from('payments')
      .update({
        reconciled: true,
        reconciled_at: new Date().toISOString(),
        reconciled_by: reconciledBy,
      })
      .eq('id', paymentId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async refundPayment(paymentId: string, refundAmount?: number) {
    const payment = await this.getById(paymentId)
    if (!payment) throw new Error('Payment not found')

    const amount = refundAmount || payment.amount

    const refund = await this.create({
      ...payment,
      id: undefined,
      amount: -amount,
      status: 'refunded',
      payment_number: `REF-${Date.now()}`,
      notes: `Refund for payment ${payment.payment_number}`,
    })

    await this.update(paymentId, { status: 'refunded' })

    return refund
  }

  static async getPaymentSummary(organizationId: string, period?: { start: string; end: string }) {
    let query = supabase
      .from('payments')
      .select('amount, status, payment_method_type, currency')
      .eq('organization_id', organizationId)
      .eq('status', 'completed')

    if (period) {
      query = query.gte('payment_date', period.start).lte('payment_date', period.end)
    }

    const { data, error } = await query

    if (error) throw error

    const summary = {
      totalAmount: 0,
      paymentCount: 0,
      byMethod: {} as Record<string, number>,
      byCurrency: {} as Record<string, number>,
    }

    data?.forEach((payment) => {
      summary.totalAmount += payment.amount
      summary.paymentCount++
      
      const method = payment.payment_method_type
      summary.byMethod[method] = (summary.byMethod[method] || 0) + payment.amount
      
      const currency = payment.currency
      summary.byCurrency[currency] = (summary.byCurrency[currency] || 0) + payment.amount
    })

    return summary
  }
}