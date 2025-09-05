import { BaseService } from '../base-service'
import { 
  invoiceInsertSchema, 
  invoiceUpdateSchema, 
  invoiceSearchSchema, 
  bulkInvoiceGenerationSchema,
  invoiceValidationSchema,
  paginationSchema 
} from '@/lib/validations/finance'
import type { 
  Invoice, 
  InvoiceWithDetails,
  InvoiceInsert, 
  CreateInvoiceData,
  CreateInvoiceLineItemData,
  BulkInvoiceGenerationData,
  InvoiceValidation,
  InvoiceFilters
} from '@/types/finance'
import type { z } from 'zod'

export class InvoiceService extends BaseService {
  constructor() {
    super('invoices')
  }

  /**
   * Create a new invoice with line items
   */
  async create(invoiceData: z.infer<typeof invoiceInsertSchema>): Promise<InvoiceWithDetails> {
    // Check permissions
    await this.checkPermission(['admin', 'superadmin'])
    
    // Validate input
    const validatedData = invoiceInsertSchema.parse(invoiceData)
    
    // Get current user and organization
    const user = await this.getCurrentUser()
    const organizationId = await this.getCurrentOrganization()
    
    const supabase = await this.getSupabase()
    
    // Start transaction
    return await supabase.rpc('create_invoice_with_items', {
      p_organization_id: organizationId,
      p_student_id: validatedData.student_id,
      p_group_id: validatedData.group_id || null,
      p_due_date: validatedData.due_date,
      p_currency: validatedData.currency,
      p_tax_percentage: validatedData.tax_percentage || null,
      p_discount_amount: validatedData.discount_amount || null,
      p_discount_id: validatedData.discount_id || null,
      p_scholarship_id: validatedData.scholarship_id || null,
      p_payment_schedule_id: validatedData.payment_schedule_id || null,
      p_notes: validatedData.notes || null,
      p_line_items: JSON.stringify(validatedData.line_items),
      p_created_by: user.id
    }).then(async ({ data, error }) => {
      if (error) throw new Error(`Failed to create invoice: ${error.message}`)
      
      // Get the created invoice with details
      const invoice = await this.getByIdWithDetails(data.invoice_id)
      
      // Log activity
      await this.logActivity(
        'CREATE',
        data.invoice_id,
        `Invoice #${data.invoice_number}`,
        null,
        invoice,
        `Created new invoice: #${data.invoice_number} for student`
      )
      
      return invoice
    })
  }

  /**
   * Get invoice by ID with related data
   */
  async getByIdWithDetails(id: string): Promise<InvoiceWithDetails> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        student:students(*),
        group:groups(*),
        line_items:invoice_line_items(*),
        payments:payments(*),
        payment_schedule:payment_schedules(*)
      `)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .single()
    
    if (error) {
      throw new Error(`Failed to get invoice: ${error.message}`)
    }
    
    return data
  }

  /**
   * Get all invoices with filtering, searching, and pagination
   */
  async getAll(
    search?: z.infer<typeof invoiceSearchSchema>,
    pagination?: z.infer<typeof paginationSchema>
  ): Promise<{ data: InvoiceWithDetails[]; count: number; total_pages: number }> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    // Validate pagination
    const { page, limit, sort_by, sort_order } = pagination 
      ? paginationSchema.parse(pagination) 
      : { page: 1, limit: 20, sort_by: 'created_at', sort_order: 'desc' as const }
    
    // Start building query
    let query = supabase
      .from('invoices')
      .select(`
        *,
        student:students(id, first_name, last_name, student_id),
        group:groups(id, name, group_code),
        line_items:invoice_line_items(*),
        payments:payments(*)
      `, { count: 'exact' })
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
    
    // Apply search filters
    if (search) {
      const validatedSearch = invoiceSearchSchema.parse(search)
      
      // Text search across invoice number, student name
      if (validatedSearch.query) {
        query = query.or(`
          invoice_number.ilike.%${validatedSearch.query}%,
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
      
      if (validatedSearch.group_id) {
        query = query.eq('group_id', validatedSearch.group_id)
      }
      
      if (validatedSearch.date_from) {
        query = query.gte('due_date', validatedSearch.date_from)
      }
      
      if (validatedSearch.date_to) {
        query = query.lte('due_date', validatedSearch.date_to)
      }
      
      if (validatedSearch.min_amount) {
        query = query.gte('total_amount', validatedSearch.min_amount)
      }
      
      if (validatedSearch.max_amount) {
        query = query.lte('total_amount', validatedSearch.max_amount)
      }
      
      if (validatedSearch.overdue) {
        const today = new Date().toISOString().split('T')[0]
        query = query.lt('due_date', today).neq('status', 'paid')
      }
    }
    
    // Apply sorting
    query = this.applySorting(query, sort_by, sort_order)
    
    // Apply pagination
    query = this.applyPagination(query, page, limit)
    
    const { data, error, count } = await query
    
    if (error) {
      throw new Error(`Failed to get invoices: ${error.message}`)
    }
    
    const total_pages = Math.ceil((count || 0) / limit)
    
    return {
      data: data || [],
      count: count || 0,
      total_pages,
    }
  }

  /**
   * Update invoice status
   */
  async updateStatus(id: string, status: string, notes?: string): Promise<Invoice> {
    // Check permissions
    await this.checkPermission(['admin', 'superadmin'])
    
    const organizationId = await this.getCurrentOrganization()
    const user = await this.getCurrentUser()
    
    // Get existing invoice for audit log
    const existing = await this.getByIdWithDetails(id)
    
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('invoices')
      .update({
        status,
        notes: notes || existing.notes,
        updated_by: user.id,
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to update invoice status: ${error.message}`)
    }
    
    // Log activity
    await this.logActivity(
      'UPDATE',
      data.id,
      `Invoice #${data.invoice_number}`,
      { status: existing.status },
      { status: data.status },
      `Updated invoice status from ${existing.status} to ${data.status}`
    )
    
    return data
  }

  /**
   * Send invoice reminder
   */
  async sendReminder(id: string, customMessage?: string): Promise<void> {
    await this.checkPermission(['admin', 'superadmin'])
    
    const invoice = await this.getByIdWithDetails(id)
    const supabase = await this.getSupabase()
    
    // Create notification for the reminder
    await supabase.from('notifications').insert({
      organization_id: await this.getCurrentOrganization(),
      type: 'payment',
      title: `Payment Reminder: Invoice #${invoice.invoice_number}`,
      message: customMessage || `Your invoice #${invoice.invoice_number} is due on ${invoice.due_date}. Please make your payment to avoid late fees.`,
      related_student_id: invoice.student_id,
      delivery_method: ['email'],
      priority: invoice.status === 'overdue' ? 'high' : 'normal',
      created_by: (await this.getCurrentUser()).id,
    })

    // Update last reminder sent date
    await supabase
      .from('invoices')
      .update({ last_reminder_sent: new Date().toISOString() })
      .eq('id', id)

    // Log activity
    await this.logActivity(
      'REMINDER',
      invoice.id,
      `Invoice #${invoice.invoice_number}`,
      null,
      null,
      `Sent payment reminder for invoice #${invoice.invoice_number}`
    )
  }

  /**
   * Generate PDF invoice
   */
  async generatePDF(id: string): Promise<{ url: string; filename: string }> {
    const invoice = await this.getByIdWithDetails(id)
    const supabase = await this.getSupabase()
    
    // Call edge function to generate PDF
    const { data, error } = await supabase.functions.invoke('generate-invoice-pdf', {
      body: { invoice_id: id }
    })
    
    if (error) {
      throw new Error(`Failed to generate PDF: ${error.message}`)
    }
    
    return {
      url: data.pdf_url,
      filename: `invoice-${invoice.invoice_number}.pdf`
    }
  }

  /**
   * Bulk invoice generation
   */
  async bulkGenerate(generationData: z.infer<typeof bulkInvoiceGenerationSchema>): Promise<{
    success: number;
    failed: number;
    invoice_ids: string[];
    errors: string[];
  }> {
    await this.checkPermission(['admin', 'superadmin'])
    
    const validatedData = bulkInvoiceGenerationSchema.parse(generationData)
    const user = await this.getCurrentUser()
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase.rpc('bulk_generate_invoices', {
      p_organization_id: organizationId,
      p_group_id: validatedData.group_id,
      p_due_date: validatedData.due_date,
      p_billing_period_start: validatedData.billing_period_start,
      p_billing_period_end: validatedData.billing_period_end,
      p_include_students: validatedData.include_students || null,
      p_exclude_students: validatedData.exclude_students || null,
      p_apply_discounts: validatedData.apply_discounts,
      p_apply_scholarships: validatedData.apply_scholarships,
      p_send_notifications: validatedData.send_notifications,
      p_created_by: user.id
    })
    
    if (error) {
      throw new Error(`Failed to generate bulk invoices: ${error.message}`)
    }
    
    // Log activity
    await this.logActivity(
      'BULK_CREATE',
      validatedData.group_id,
      `Bulk Invoice Generation`,
      null,
      { count: data.success, group_id: validatedData.group_id },
      `Generated ${data.success} invoices for group`
    )
    
    return data
  }

  /**
   * Validate invoice data
   */
  async validate(invoiceData: z.infer<typeof invoiceInsertSchema>): Promise<InvoiceValidation> {
    const validatedData = invoiceInsertSchema.parse(invoiceData)
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase.rpc('validate_invoice', {
      p_organization_id: await this.getCurrentOrganization(),
      p_invoice_data: JSON.stringify(validatedData)
    })
    
    if (error) {
      throw new Error(`Failed to validate invoice: ${error.message}`)
    }
    
    return data
  }

  /**
   * Get invoice statistics
   */
  async getStatistics(filters?: InvoiceFilters): Promise<{
    total_invoices: number;
    total_amount: number;
    paid_amount: number;
    outstanding_amount: number;
    overdue_amount: number;
    by_status: Record<string, number>;
    collection_rate: number;
    average_invoice_amount: number;
  }> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase.rpc('get_invoice_statistics', {
      p_organization_id: organizationId,
      p_filters: filters ? JSON.stringify(filters) : null
    })
    
    if (error) {
      throw new Error(`Failed to get invoice statistics: ${error.message}`)
    }
    
    return data
  }

  /**
   * Get overdue invoices
   */
  async getOverdueInvoices(): Promise<InvoiceWithDetails[]> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        student:students(*),
        group:groups(*),
        line_items:invoice_line_items(*),
        payments:payments(*)
      `)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .lt('due_date', today)
      .neq('status', 'paid')
      .neq('status', 'cancelled')
      .order('due_date', { ascending: true })
    
    if (error) {
      throw new Error(`Failed to get overdue invoices: ${error.message}`)
    }
    
    return data || []
  }

  /**
   * Mark invoice as paid
   */
  async markAsPaid(id: string, paymentId?: string): Promise<Invoice> {
    await this.checkPermission(['admin', 'superadmin'])
    
    const organizationId = await this.getCurrentOrganization()
    const user = await this.getCurrentUser()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to mark invoice as paid: ${error.message}`)
    }
    
    // Log activity
    await this.logActivity(
      'UPDATE',
      data.id,
      `Invoice #${data.invoice_number}`,
      { status: 'sent' },
      { status: 'paid' },
      `Marked invoice #${data.invoice_number} as paid`
    )
    
    return data
  }

  /**
   * Cancel invoice
   */
  async cancel(id: string, reason?: string): Promise<Invoice> {
    await this.checkPermission(['admin', 'superadmin'])
    
    const organizationId = await this.getCurrentOrganization()
    const user = await this.getCurrentUser()
    
    // Get existing invoice
    const existing = await this.getByIdWithDetails(id)
    
    if (existing.status === 'paid') {
      throw new Error('Cannot cancel a paid invoice')
    }
    
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('invoices')
      .update({
        status: 'cancelled',
        notes: reason ? `${existing.notes || ''}\n\nCancellation reason: ${reason}`.trim() : existing.notes,
        updated_by: user.id,
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to cancel invoice: ${error.message}`)
    }
    
    // Log activity
    await this.logActivity(
      'CANCEL',
      data.id,
      `Invoice #${data.invoice_number}`,
      existing,
      data,
      `Cancelled invoice #${data.invoice_number}${reason ? ': ' + reason : ''}`
    )
    
    return data
  }

  /**
   * Get invoice by number
   */
  async getByNumber(invoiceNumber: string): Promise<InvoiceWithDetails> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        student:students(*),
        group:groups(*),
        line_items:invoice_line_items(*),
        payments:payments(*),
        payment_schedule:payment_schedules(*)
      `)
      .eq('invoice_number', invoiceNumber)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .single()
    
    if (error) {
      throw new Error(`Failed to get invoice by number: ${error.message}`)
    }
    
    return data
  }
}