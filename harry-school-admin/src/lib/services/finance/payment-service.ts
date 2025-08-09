import { BaseService } from '../base-service'
import { 
  paymentInsertSchema, 
  paymentUpdateSchema, 
  paymentSearchSchema,
  bulkPaymentProcessingSchema,
  reconciliationSchema,
  reconciliationBatchSchema,
  paginationSchema 
} from '@/lib/validations/finance'
import type { 
  Payment, 
  PaymentWithDetails,
  PaymentInsert, 
  CreatePaymentData,
  BulkPaymentProcessingData,
  PaymentValidation,
  PaymentFilters,
  ReconciliationData,
  ReconciliationBatch
} from '@/types/finance'
import type { z } from 'zod'

export class PaymentService extends BaseService {
  constructor() {
    super('payments')
  }

  /**
   * Record a new payment
   */
  async create(paymentData: z.infer<typeof paymentInsertSchema>): Promise<PaymentWithDetails> {
    // Check permissions
    await this.checkPermission(['admin', 'superadmin'])
    
    // Validate input
    const validatedData = paymentInsertSchema.parse(paymentData)
    
    // Get current user and organization
    const user = await this.getCurrentUser()
    const organizationId = await this.getCurrentOrganization()
    
    const supabase = await this.getSupabase()
    
    // Create payment with transaction
    const { data, error } = await supabase.rpc('create_payment_with_allocation', {
      p_organization_id: organizationId,
      p_student_id: validatedData.student_id,
      p_invoice_id: validatedData.invoice_id || null,
      p_amount: validatedData.amount,
      p_currency: validatedData.currency,
      p_payment_date: validatedData.payment_date || new Date().toISOString(),
      p_payment_method_type: validatedData.payment_method_type,
      p_payment_method_id: validatedData.payment_method_id || null,
      p_payer_name: validatedData.payer_name || null,
      p_payer_contact: validatedData.payer_contact || null,
      p_external_reference: validatedData.external_reference || null,
      p_notes: validatedData.notes || null,
      p_created_by: user.id
    })
    
    if (error) {
      throw new Error(`Failed to create payment: ${error.message}`)
    }
    
    // Get the created payment with details
    const payment = await this.getByIdWithDetails(data.payment_id)
    
    // Log activity
    await this.logActivity(
      'CREATE',
      data.payment_id,
      `Payment #${data.payment_reference}`,
      null,
      payment,
      `Recorded new payment: ${validatedData.amount} ${validatedData.currency} from student`
    )
    
    return payment
  }

  /**
   * Get payment by ID with related data
   */
  async getByIdWithDetails(id: string): Promise<PaymentWithDetails> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        student:students(*),
        invoice:invoices(*),
        payment_method:payment_methods(*),
        financial_transaction:financial_transactions(*)
      `)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .single()
    
    if (error) {
      throw new Error(`Failed to get payment: ${error.message}`)
    }
    
    return data
  }

  /**
   * Get all payments with filtering, searching, and pagination
   */
  async getAll(
    search?: z.infer<typeof paymentSearchSchema>,
    pagination?: z.infer<typeof paginationSchema>
  ): Promise<{ data: PaymentWithDetails[]; count: number; total_pages: number }> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    // Validate pagination
    const { page, limit, sort_by, sort_order } = pagination 
      ? paginationSchema.parse(pagination) 
      : { page: 1, limit: 20, sort_by: 'payment_date', sort_order: 'desc' as const }
    
    // Start building query
    let query = supabase
      .from('payments')
      .select(`
        *,
        student:students(id, first_name, last_name, student_id),
        invoice:invoices(id, invoice_number),
        payment_method:payment_methods(id, name, type)
      `, { count: 'exact' })
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
    
    // Apply search filters
    if (search) {
      const validatedSearch = paymentSearchSchema.parse(search)
      
      // Text search across payment reference, student name, external reference
      if (validatedSearch.query) {
        query = query.or(`
          payment_reference.ilike.%${validatedSearch.query}%,
          external_reference.ilike.%${validatedSearch.query}%,
          payer_name.ilike.%${validatedSearch.query}%,
          student.first_name.ilike.%${validatedSearch.query}%,
          student.last_name.ilike.%${validatedSearch.query}%,
          student.student_id.ilike.%${validatedSearch.query}%
        `)
      }
      
      if (validatedSearch.status && validatedSearch.status.length > 0) {
        query = query.in('status', validatedSearch.status)
      }
      
      if (validatedSearch.student_id) {
        query = query.eq('student_id', validatedSearch.student_id)
      }
      
      if (validatedSearch.invoice_id) {
        query = query.eq('invoice_id', validatedSearch.invoice_id)
      }
      
      if (validatedSearch.payment_method && validatedSearch.payment_method.length > 0) {
        query = query.in('payment_method_type', validatedSearch.payment_method)
      }
      
      if (validatedSearch.date_from) {
        query = query.gte('payment_date', validatedSearch.date_from)
      }
      
      if (validatedSearch.date_to) {
        query = query.lte('payment_date', validatedSearch.date_to)
      }
      
      if (validatedSearch.min_amount) {
        query = query.gte('amount', validatedSearch.min_amount)
      }
      
      if (validatedSearch.max_amount) {
        query = query.lte('amount', validatedSearch.max_amount)
      }
      
      if (validatedSearch.reconciled !== undefined) {
        query = query.eq('is_reconciled', validatedSearch.reconciled)
      }
    }
    
    // Apply sorting
    query = this.applySorting(query, sort_by, sort_order)
    
    // Apply pagination
    query = this.applyPagination(query, page, limit)
    
    const { data, error, count } = await query
    
    if (error) {
      throw new Error(`Failed to get payments: ${error.message}`)
    }
    
    const total_pages = Math.ceil((count || 0) / limit)
    
    return {
      data: data || [],
      count: count || 0,
      total_pages,
    }
  }

  /**
   * Process a refund
   */
  async processRefund(
    paymentId: string, 
    refundAmount: number, 
    reason?: string
  ): Promise<PaymentWithDetails> {
    await this.checkPermission(['admin', 'superadmin'])
    
    const user = await this.getCurrentUser()
    const organizationId = await this.getCurrentOrganization()
    
    // Get existing payment
    const existingPayment = await this.getByIdWithDetails(paymentId)
    
    if (existingPayment.status !== 'completed') {
      throw new Error('Cannot refund a payment that is not completed')
    }
    
    if (refundAmount > existingPayment.amount) {
      throw new Error('Refund amount cannot exceed original payment amount')
    }
    
    const supabase = await this.getSupabase()
    
    // Process refund with transaction
    const { data, error } = await supabase.rpc('process_payment_refund', {
      p_organization_id: organizationId,
      p_payment_id: paymentId,
      p_refund_amount: refundAmount,
      p_reason: reason || null,
      p_processed_by: user.id
    })
    
    if (error) {
      throw new Error(`Failed to process refund: ${error.message}`)
    }
    
    // Get updated payment
    const updatedPayment = await this.getByIdWithDetails(paymentId)
    
    // Log activity
    await this.logActivity(
      'REFUND',
      paymentId,
      `Payment #${existingPayment.payment_reference}`,
      existingPayment,
      updatedPayment,
      `Processed refund of ${refundAmount} ${existingPayment.currency}${reason ? ': ' + reason : ''}`
    )
    
    return updatedPayment
  }

  /**
   * Allocate payment to invoices
   */
  async allocateToInvoices(
    paymentId: string, 
    allocations: Array<{ invoice_id: string; amount: number }>
  ): Promise<void> {
    await this.checkPermission(['admin', 'superadmin'])
    
    const user = await this.getCurrentUser()
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { error } = await supabase.rpc('allocate_payment_to_invoices', {
      p_organization_id: organizationId,
      p_payment_id: paymentId,
      p_allocations: JSON.stringify(allocations),
      p_allocated_by: user.id
    })
    
    if (error) {
      throw new Error(`Failed to allocate payment: ${error.message}`)
    }
    
    // Log activity
    await this.logActivity(
      'ALLOCATE',
      paymentId,
      `Payment Allocation`,
      null,
      { allocations },
      `Allocated payment to ${allocations.length} invoices`
    )
  }

  /**
   * Handle partial payments
   */
  async recordPartialPayment(
    invoiceId: string,
    paymentData: z.infer<typeof paymentInsertSchema>
  ): Promise<{ payment: PaymentWithDetails; remaining_balance: number }> {
    await this.checkPermission(['admin', 'superadmin'])
    
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, payments(*)')
      .eq('id', invoiceId)
      .eq('organization_id', organizationId)
      .single()
    
    if (invoiceError) {
      throw new Error(`Failed to get invoice: ${invoiceError.message}`)
    }
    
    // Calculate remaining balance
    const totalPaid = invoice.payments
      ?.filter(p => p.status === 'completed')
      ?.reduce((sum, p) => sum + p.amount, 0) || 0
    
    const remainingBalance = invoice.total_amount - totalPaid
    
    if (paymentData.amount > remainingBalance) {
      throw new Error(`Payment amount ${paymentData.amount} exceeds remaining balance ${remainingBalance}`)
    }
    
    // Create the payment
    const payment = await this.create({
      ...paymentData,
      invoice_id: invoiceId
    })
    
    // Update invoice status if fully paid
    if (paymentData.amount === remainingBalance) {
      await supabase
        .from('invoices')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString() 
        })
        .eq('id', invoiceId)
    }
    
    return {
      payment,
      remaining_balance: remainingBalance - paymentData.amount
    }
  }

  /**
   * Reconcile payments
   */
  async reconcile(reconciliationData: z.infer<typeof reconciliationSchema>): Promise<void> {
    await this.checkPermission(['admin', 'superadmin'])
    
    const validatedData = reconciliationSchema.parse(reconciliationData)
    const user = await this.getCurrentUser()
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { error } = await supabase.rpc('reconcile_payment', {
      p_organization_id: organizationId,
      p_payment_id: validatedData.payment_id,
      p_bank_statement_ref: validatedData.bank_statement_ref,
      p_reconciled_amount: validatedData.reconciled_amount,
      p_reconciled_date: validatedData.reconciled_date,
      p_notes: validatedData.notes || null,
      p_reconciled_by: user.id
    })
    
    if (error) {
      throw new Error(`Failed to reconcile payment: ${error.message}`)
    }
    
    // Log activity
    await this.logActivity(
      'RECONCILE',
      validatedData.payment_id,
      `Payment Reconciliation`,
      null,
      validatedData,
      `Reconciled payment with bank statement: ${validatedData.bank_statement_ref}`
    )
  }

  /**
   * Batch reconciliation
   */
  async batchReconcile(batchData: z.infer<typeof reconciliationBatchSchema>): Promise<ReconciliationBatch> {
    await this.checkPermission(['admin', 'superadmin'])
    
    const validatedData = reconciliationBatchSchema.parse(batchData)
    const user = await this.getCurrentUser()
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase.rpc('batch_reconcile_payments', {
      p_organization_id: organizationId,
      p_batch_name: validatedData.batch_name,
      p_reconciliations: JSON.stringify(validatedData.reconciliations),
      p_auto_process: validatedData.auto_process,
      p_processed_by: user.id
    })
    
    if (error) {
      throw new Error(`Failed to batch reconcile payments: ${error.message}`)
    }
    
    // Log activity
    await this.logActivity(
      'BATCH_RECONCILE',
      data.batch_id,
      `Batch Reconciliation: ${validatedData.batch_name}`,
      null,
      data,
      `Processed batch reconciliation with ${validatedData.reconciliations.length} payments`
    )
    
    return data
  }

  /**
   * Bulk payment processing
   */
  async bulkProcess(processingData: z.infer<typeof bulkPaymentProcessingSchema>): Promise<{
    success: number;
    failed: number;
    payment_ids: string[];
    errors: string[];
  }> {
    await this.checkPermission(['admin', 'superadmin'])
    
    const validatedData = bulkPaymentProcessingSchema.parse(processingData)
    const user = await this.getCurrentUser()
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase.rpc('bulk_process_payments', {
      p_organization_id: organizationId,
      p_payments: JSON.stringify(validatedData.payments),
      p_payment_date: validatedData.payment_date,
      p_batch_reference: validatedData.batch_reference || null,
      p_auto_allocate: validatedData.auto_allocate,
      p_processed_by: user.id
    })
    
    if (error) {
      throw new Error(`Failed to bulk process payments: ${error.message}`)
    }
    
    // Log activity
    await this.logActivity(
      'BULK_PROCESS',
      'bulk-payment',
      `Bulk Payment Processing`,
      null,
      { count: data.success, batch: validatedData.batch_reference },
      `Processed ${data.success} payments in bulk`
    )
    
    return data
  }

  /**
   * Get payment statistics
   */
  async getStatistics(filters?: PaymentFilters): Promise<{
    total_payments: number;
    total_amount: number;
    completed_amount: number;
    pending_amount: number;
    refunded_amount: number;
    by_status: Record<string, number>;
    by_method: Record<string, number>;
    average_payment_amount: number;
    reconciliation_rate: number;
  }> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase.rpc('get_payment_statistics', {
      p_organization_id: organizationId,
      p_filters: filters ? JSON.stringify(filters) : null
    })
    
    if (error) {
      throw new Error(`Failed to get payment statistics: ${error.message}`)
    }
    
    return data
  }

  /**
   * Get unreconciled payments
   */
  async getUnreconciled(): Promise<PaymentWithDetails[]> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        student:students(*),
        invoice:invoices(*),
        payment_method:payment_methods(*)
      `)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .eq('status', 'completed')
      .eq('is_reconciled', false)
      .order('payment_date', { ascending: true })
    
    if (error) {
      throw new Error(`Failed to get unreconciled payments: ${error.message}`)
    }
    
    return data || []
  }

  /**
   * Update payment status
   */
  async updateStatus(id: string, status: string, notes?: string): Promise<Payment> {
    await this.checkPermission(['admin', 'superadmin'])
    
    const organizationId = await this.getCurrentOrganization()
    const user = await this.getCurrentUser()
    
    // Get existing payment for audit log
    const existing = await this.getByIdWithDetails(id)
    
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('payments')
      .update({
        status,
        notes: notes || existing.notes,
        updated_by: user.id,
        ...(status === 'completed' && { processed_at: new Date().toISOString() })
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to update payment status: ${error.message}`)
    }
    
    // Log activity
    await this.logActivity(
      'UPDATE',
      data.id,
      `Payment #${data.payment_reference}`,
      { status: existing.status },
      { status: data.status },
      `Updated payment status from ${existing.status} to ${data.status}`
    )
    
    return data
  }

  /**
   * Get payment by reference number
   */
  async getByReference(paymentReference: string): Promise<PaymentWithDetails> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        student:students(*),
        invoice:invoices(*),
        payment_method:payment_methods(*),
        financial_transaction:financial_transactions(*)
      `)
      .eq('payment_reference', paymentReference)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .single()
    
    if (error) {
      throw new Error(`Failed to get payment by reference: ${error.message}`)
    }
    
    return data
  }

  /**
   * Get payment history for a student
   */
  async getStudentPaymentHistory(studentId: string): Promise<PaymentWithDetails[]> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        invoice:invoices(id, invoice_number),
        payment_method:payment_methods(*)
      `)
      .eq('organization_id', organizationId)
      .eq('student_id', studentId)
      .is('deleted_at', null)
      .order('payment_date', { ascending: false })
    
    if (error) {
      throw new Error(`Failed to get student payment history: ${error.message}`)
    }
    
    return data || []
  }
}