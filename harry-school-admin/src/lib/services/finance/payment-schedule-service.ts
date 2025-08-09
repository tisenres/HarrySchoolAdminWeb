import { BaseService } from '../base-service'
import { 
  paymentScheduleInsertSchema, 
  paymentScheduleUpdateSchema,
  paginationSchema 
} from '@/lib/validations/finance'
import type { 
  PaymentSchedule,
  PaymentInstallment,
  CreatePaymentScheduleData,
  InstallmentStatus
} from '@/types/finance'
import type { z } from 'zod'

export class PaymentScheduleService extends BaseService {
  constructor() {
    super('payment_schedules')
  }

  /**
   * Create a new payment schedule with installments
   */
  async create(scheduleData: z.infer<typeof paymentScheduleInsertSchema>): Promise<PaymentSchedule> {
    // Check permissions
    await this.checkPermission(['admin', 'superadmin'])
    
    // Validate input
    const validatedData = paymentScheduleInsertSchema.parse(scheduleData)
    
    // Get current user and organization
    const user = await this.getCurrentUser()
    const organizationId = await this.getCurrentOrganization()
    
    const supabase = await this.getSupabase()
    
    // Create payment schedule with installments
    const { data, error } = await supabase.rpc('create_payment_schedule', {
      p_organization_id: organizationId,
      p_name: validatedData.name,
      p_description: validatedData.description || null,
      p_schedule_type: validatedData.schedule_type,
      p_installments_count: validatedData.installments_count,
      p_start_date: validatedData.start_date,
      p_due_day_of_month: validatedData.due_day_of_month || null,
      p_grace_period_days: validatedData.grace_period_days,
      p_late_fee_percentage: validatedData.late_fee_percentage || null,
      p_late_fee_amount: validatedData.late_fee_amount || null,
      p_send_reminders: validatedData.send_reminders,
      p_reminder_days_before: JSON.stringify(validatedData.reminder_days_before),
      p_auto_generate_invoices: validatedData.auto_generate_invoices,
      p_created_by: user.id
    })
    
    if (error) {
      throw new Error(`Failed to create payment schedule: ${error.message}`)
    }
    
    // Get the created schedule
    const schedule = await this.getById(data.schedule_id)
    
    // Log activity
    await this.logActivity(
      'CREATE',
      data.schedule_id,
      validatedData.name,
      null,
      schedule,
      `Created payment schedule: ${validatedData.name} with ${validatedData.installments_count} installments`
    )
    
    return schedule
  }

  /**
   * Get payment schedule by ID
   */
  async getById(id: string): Promise<PaymentSchedule> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('payment_schedules')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .single()
    
    if (error) {
      throw new Error(`Failed to get payment schedule: ${error.message}`)
    }
    
    return data
  }

  /**
   * Get all payment schedules with pagination
   */
  async getAll(
    pagination?: z.infer<typeof paginationSchema>
  ): Promise<{ data: PaymentSchedule[]; count: number; total_pages: number }> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    // Validate pagination
    const { page, limit, sort_by, sort_order } = pagination 
      ? paginationSchema.parse(pagination) 
      : { page: 1, limit: 20, sort_by: 'created_at', sort_order: 'desc' as const }
    
    // Build query
    let query = supabase
      .from('payment_schedules')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
    
    // Apply sorting
    query = this.applySorting(query, sort_by, sort_order)
    
    // Apply pagination
    query = this.applyPagination(query, page, limit)
    
    const { data, error, count } = await query
    
    if (error) {
      throw new Error(`Failed to get payment schedules: ${error.message}`)
    }
    
    const total_pages = Math.ceil((count || 0) / limit)
    
    return {
      data: data || [],
      count: count || 0,
      total_pages,
    }
  }

  /**
   * Update a payment schedule
   */
  async update(id: string, scheduleData: z.infer<typeof paymentScheduleUpdateSchema>): Promise<PaymentSchedule> {
    // Check permissions
    await this.checkPermission(['admin', 'superadmin'])
    
    // Validate input
    const validatedData = paymentScheduleUpdateSchema.parse(scheduleData)
    
    // Get current user and organization
    const user = await this.getCurrentUser()
    const organizationId = await this.getCurrentOrganization()
    
    // Get existing schedule for audit log
    const existing = await this.getById(id)
    
    // Filter out undefined properties
    const updateData = Object.fromEntries(
      Object.entries({
        ...validatedData,
        updated_by: user.id,
      }).filter(([_, value]) => value !== undefined)
    )
    
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('payment_schedules')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to update payment schedule: ${error.message}`)
    }
    
    // Log activity
    await this.logActivity(
      'UPDATE',
      data.id,
      data.name,
      existing,
      data,
      `Updated payment schedule: ${data.name}`
    )
    
    return data
  }

  /**
   * Generate installments for a student's payment schedule
   */
  async generateInstallments(
    scheduleId: string,
    studentId: string,
    totalAmount: number,
    startDate?: string
  ): Promise<PaymentInstallment[]> {
    await this.checkPermission(['admin', 'superadmin'])
    
    const user = await this.getCurrentUser()
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase.rpc('generate_payment_installments', {
      p_organization_id: organizationId,
      p_schedule_id: scheduleId,
      p_student_id: studentId,
      p_total_amount: totalAmount,
      p_start_date: startDate || new Date().toISOString().split('T')[0],
      p_created_by: user.id
    })
    
    if (error) {
      throw new Error(`Failed to generate installments: ${error.message}`)
    }
    
    // Log activity
    await this.logActivity(
      'GENERATE',
      scheduleId,
      'Payment Installments',
      null,
      { student_id: studentId, installments_count: data.length, total_amount: totalAmount },
      `Generated ${data.length} installments for student payment schedule`
    )
    
    return data
  }

  /**
   * Get installments for a specific student and schedule
   */
  async getStudentInstallments(
    scheduleId: string,
    studentId: string
  ): Promise<PaymentInstallment[]> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('payment_installments')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('payment_schedule_id', scheduleId)
      .eq('student_id', studentId)
      .is('deleted_at', null)
      .order('due_date', { ascending: true })
    
    if (error) {
      throw new Error(`Failed to get student installments: ${error.message}`)
    }
    
    return data || []
  }

  /**
   * Apply late fees to overdue installments
   */
  async applyLateFees(scheduleId?: string): Promise<{
    processed: number;
    total_fees_applied: number;
    errors: string[];
  }> {
    await this.checkPermission(['admin', 'superadmin'])
    
    const user = await this.getCurrentUser()
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase.rpc('apply_late_fees', {
      p_organization_id: organizationId,
      p_schedule_id: scheduleId || null,
      p_processed_by: user.id
    })
    
    if (error) {
      throw new Error(`Failed to apply late fees: ${error.message}`)
    }
    
    // Log activity
    await this.logActivity(
      'LATE_FEES',
      scheduleId || 'all-schedules',
      'Late Fee Application',
      null,
      data,
      `Applied late fees to ${data.processed} overdue installments, total fees: ${data.total_fees_applied}`
    )
    
    return data
  }

  /**
   * Send payment reminders
   */
  async sendReminders(scheduleId?: string, daysBeforeDue?: number): Promise<{
    sent: number;
    failed: number;
    errors: string[];
  }> {
    await this.checkPermission(['admin', 'superadmin'])
    
    const user = await this.getCurrentUser()
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase.rpc('send_payment_reminders', {
      p_organization_id: organizationId,
      p_schedule_id: scheduleId || null,
      p_days_before_due: daysBeforeDue || null,
      p_sent_by: user.id
    })
    
    if (error) {
      throw new Error(`Failed to send payment reminders: ${error.message}`)
    }
    
    // Log activity
    await this.logActivity(
      'REMINDERS',
      scheduleId || 'all-schedules',
      'Payment Reminders',
      null,
      data,
      `Sent ${data.sent} payment reminders${scheduleId ? ' for schedule' : ' for all schedules'}`
    )
    
    return data
  }

  /**
   * Mark installment as paid
   */
  async markInstallmentAsPaid(
    installmentId: string,
    paymentId: string,
    paidAmount: number
  ): Promise<PaymentInstallment> {
    await this.checkPermission(['admin', 'superadmin'])
    
    const user = await this.getCurrentUser()
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('payment_installments')
      .update({
        status: 'paid',
        paid_amount: paidAmount,
        paid_at: new Date().toISOString(),
        payment_id: paymentId,
        updated_by: user.id,
      })
      .eq('id', installmentId)
      .eq('organization_id', organizationId)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to mark installment as paid: ${error.message}`)
    }
    
    // Log activity
    await this.logActivity(
      'PAYMENT',
      installmentId,
      'Installment Payment',
      null,
      data,
      `Marked installment as paid: ${paidAmount} (Payment ID: ${paymentId})`
    )
    
    return data
  }

  /**
   * Get overdue installments
   */
  async getOverdueInstallments(scheduleId?: string): Promise<PaymentInstallment[]> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    const today = new Date().toISOString().split('T')[0]
    
    let query = supabase
      .from('payment_installments')
      .select(`
        *,
        student:students(id, first_name, last_name, student_id),
        payment_schedule:payment_schedules(name, grace_period_days)
      `)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .neq('status', 'paid')
      .neq('status', 'cancelled')
    
    if (scheduleId) {
      query = query.eq('payment_schedule_id', scheduleId)
    }
    
    // Calculate grace period in the query
    query = query.lt('due_date', today)
    
    const { data, error } = await query.order('due_date', { ascending: true })
    
    if (error) {
      throw new Error(`Failed to get overdue installments: ${error.message}`)
    }
    
    return data || []
  }

  /**
   * Update installment status
   */
  async updateInstallmentStatus(
    installmentId: string, 
    status: InstallmentStatus,
    notes?: string
  ): Promise<PaymentInstallment> {
    await this.checkPermission(['admin', 'superadmin'])
    
    const user = await this.getCurrentUser()
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('payment_installments')
      .update({
        status,
        notes: notes || null,
        updated_by: user.id,
        ...(status === 'cancelled' && { cancelled_at: new Date().toISOString() }),
      })
      .eq('id', installmentId)
      .eq('organization_id', organizationId)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to update installment status: ${error.message}`)
    }
    
    // Log activity
    await this.logActivity(
      'UPDATE',
      installmentId,
      'Installment Status',
      null,
      data,
      `Updated installment status to: ${status}${notes ? ' - ' + notes : ''}`
    )
    
    return data
  }

  /**
   * Get payment schedule statistics
   */
  async getScheduleStatistics(scheduleId: string): Promise<{
    total_installments: number;
    paid_installments: number;
    overdue_installments: number;
    pending_installments: number;
    total_amount: number;
    paid_amount: number;
    outstanding_amount: number;
    completion_rate: number;
    students_enrolled: number;
    average_payment_delay: number;
  }> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase.rpc('get_schedule_statistics', {
      p_organization_id: organizationId,
      p_schedule_id: scheduleId
    })
    
    if (error) {
      throw new Error(`Failed to get schedule statistics: ${error.message}`)
    }
    
    return data
  }

  /**
   * Clone a payment schedule
   */
  async clone(scheduleId: string, newName: string, modifications?: Partial<z.infer<typeof paymentScheduleInsertSchema>>): Promise<PaymentSchedule> {
    await this.checkPermission(['admin', 'superadmin'])
    
    // Get existing schedule
    const existingSchedule = await this.getById(scheduleId)
    
    // Prepare new schedule data
    const newScheduleData = {
      ...existingSchedule,
      ...modifications,
      name: newName,
      organization_id: await this.getCurrentOrganization(),
    }
    
    // Remove system fields
    delete (newScheduleData as any).id
    delete (newScheduleData as any).created_at
    delete (newScheduleData as any).updated_at
    delete (newScheduleData as any).created_by
    delete (newScheduleData as any).updated_by
    delete (newScheduleData as any).deleted_at
    delete (newScheduleData as any).deleted_by
    
    // Create the cloned schedule
    const clonedSchedule = await this.create(newScheduleData)
    
    // Log activity
    await this.logActivity(
      'CLONE',
      clonedSchedule.id,
      newName,
      null,
      clonedSchedule,
      `Cloned payment schedule from: ${existingSchedule.name}`
    )
    
    return clonedSchedule
  }

  /**
   * Get upcoming due installments
   */
  async getUpcomingDueInstallments(daysAhead: number = 7): Promise<PaymentInstallment[]> {
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const today = new Date().toISOString().split('T')[0]
    const futureDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('payment_installments')
      .select(`
        *,
        student:students(id, first_name, last_name, student_id, primary_phone, email),
        payment_schedule:payment_schedules(name, reminder_days_before)
      `)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .eq('status', 'pending')
      .gte('due_date', today)
      .lte('due_date', futureDate)
      .order('due_date', { ascending: true })
    
    if (error) {
      throw new Error(`Failed to get upcoming due installments: ${error.message}`)
    }
    
    return data || []
  }

  /**
   * Activate or deactivate payment schedule
   */
  async toggleActive(id: string, isActive: boolean): Promise<PaymentSchedule> {
    await this.checkPermission(['admin', 'superadmin'])
    
    const user = await this.getCurrentUser()
    const organizationId = await this.getCurrentOrganization()
    const supabase = await this.getSupabase()
    
    const { data, error } = await supabase
      .from('payment_schedules')
      .update({
        is_active: isActive,
        updated_by: user.id,
      })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to ${isActive ? 'activate' : 'deactivate'} payment schedule: ${error.message}`)
    }
    
    // Log activity
    await this.logActivity(
      'UPDATE',
      data.id,
      data.name,
      null,
      data,
      `${isActive ? 'Activated' : 'Deactivated'} payment schedule: ${data.name}`
    )
    
    return data
  }
}