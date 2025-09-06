import { BaseService } from '../base-service'
import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'

export interface FinancialNotificationData {
  type: 'payment_received' | 'invoice_created' | 'payment_overdue' | 'balance_updated' | 'payment_failed' | 'invoice_sent' | 'refund_processed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  title: string
  message: string
  metadata: Record<string, any>
  student_id?: string
  invoice_id?: string
  payment_id?: string
  amount?: number
}

export class FinancialNotificationsService extends BaseService {
  constructor() {
    super('notifications')
  }

  /**
   * Create payment received notification
   */
  async notifyPaymentReceived(paymentId: string, studentId: string, amount: number, invoiceId?: string) {
    const organizationId = await this.getCurrentOrganization()
    const user = await this.getCurrentUser()
    
    // Get payment details
    const { data: payment } = await supabase
      .from('payments')
      .select(`
        *,
        student:students(first_name, last_name, student_id),
        invoice:invoices(invoice_number)
      `)
      .eq('id', paymentId)
      .single()

    if (!payment) return

    const studentName = `${payment.student.first_name} ${payment.student.last_name}`
    const invoiceRef = payment.invoice?.invoice_number || 'N/A'

    await this.createFinancialNotification({
      type: 'payment_received',
      priority: 'medium',
      title: 'Payment Received',
      message: `Payment of $${amount.toFixed(2)} received from ${studentName}${invoiceId ? ` for invoice ${invoiceRef}` : ''}`,
      metadata: {
        payment_id: paymentId,
        student_id: studentId,
        invoice_id: invoiceId,
        amount,
        payment_method: payment.payment_method_type,
        payment_date: payment.payment_date,
        student_name: studentName,
        invoice_number: invoiceRef
      },
      student_id: studentId,
      payment_id: paymentId,
      invoice_id: invoiceId,
      amount
    })

    // Log activity
    await this.logActivity(
      'NOTIFICATION',
      paymentId,
      'Payment Received Notification',
      null,
      { payment_id: paymentId, amount, student_name: studentName },
      `Sent payment received notification for ${studentName} - $${amount.toFixed(2)}`
    )
  }

  /**
   * Create invoice created notification
   */
  async notifyInvoiceCreated(invoiceId: string, studentId: string, amount: number) {
    const organizationId = await this.getCurrentOrganization()
    
    // Get invoice details
    const { data: invoice } = await supabase
      .from('invoices')
      .select(`
        *,
        student:students(first_name, last_name, student_id),
        line_items:invoice_line_items(*)
      `)
      .eq('id', invoiceId)
      .single()

    if (!invoice) return

    const studentName = `${invoice.student.first_name} ${invoice.student.last_name}`
    const dueDate = format(new Date(invoice.due_date), 'PPP')

    await this.createFinancialNotification({
      type: 'invoice_created',
      priority: 'low',
      title: 'Invoice Created',
      message: `New invoice ${invoice.invoice_number} created for ${studentName} - $${amount.toFixed(2)} due ${dueDate}`,
      metadata: {
        invoice_id: invoiceId,
        student_id: studentId,
        amount,
        invoice_number: invoice.invoice_number,
        due_date: invoice.due_date,
        student_name: studentName,
        items_count: invoice.line_items?.length || 0
      },
      student_id: studentId,
      invoice_id: invoiceId,
      amount
    })

    await this.logActivity(
      'NOTIFICATION',
      invoiceId,
      'Invoice Created Notification',
      null,
      { invoice_id: invoiceId, amount, student_name: studentName },
      `Sent invoice created notification for ${studentName} - ${invoice.invoice_number}`
    )
  }

  /**
   * Create overdue payment notification
   */
  async notifyPaymentOverdue(invoiceId: string, studentId: string, amount: number, daysPastDue: number) {
    const organizationId = await this.getCurrentOrganization()
    
    // Get invoice details
    const { data: invoice } = await supabase
      .from('invoices')
      .select(`
        *,
        student:students(first_name, last_name, student_id, primary_phone, email)
      `)
      .eq('id', invoiceId)
      .single()

    if (!invoice) return

    const studentName = `${invoice.student.first_name} ${invoice.student.last_name}`
    const priority = daysPastDue > 30 ? 'urgent' : daysPastDue > 14 ? 'high' : 'medium'

    await this.createFinancialNotification({
      type: 'payment_overdue',
      priority,
      title: 'Payment Overdue',
      message: `Payment overdue: Invoice ${invoice.invoice_number} from ${studentName} is ${daysPastDue} days past due ($${amount.toFixed(2)})`,
      metadata: {
        invoice_id: invoiceId,
        student_id: studentId,
        amount,
        invoice_number: invoice.invoice_number,
        days_past_due: daysPastDue,
        student_name: studentName,
        student_contact: {
          phone: invoice.student.primary_phone,
          email: invoice.student.email
        },
        original_due_date: invoice.due_date
      },
      student_id: studentId,
      invoice_id: invoiceId,
      amount
    })

    await this.logActivity(
      'NOTIFICATION',
      invoiceId,
      'Overdue Payment Notification',
      null,
      { invoice_id: invoiceId, amount, days_past_due: daysPastDue, student_name: studentName },
      `Sent overdue payment notification for ${studentName} - ${daysPastDue} days overdue`
    )
  }

  /**
   * Create balance updated notification
   */
  async notifyBalanceUpdated(studentId: string, oldBalance: number, newBalance: number) {
    const organizationId = await this.getCurrentOrganization()
    
    // Get student details
    const { data: student } = await supabase
      .from('students')
      .select('first_name, last_name, student_id')
      .eq('id', studentId)
      .single()

    if (!student) return

    const studentName = `${student.first_name} ${student.last_name}`
    const balanceChange = newBalance - oldBalance
    const isIncrease = balanceChange > 0

    await this.createFinancialNotification({
      type: 'balance_updated',
      priority: 'low',
      title: 'Student Balance Updated',
      message: `${studentName}'s balance ${isIncrease ? 'increased' : 'decreased'} by $${Math.abs(balanceChange).toFixed(2)} (now $${newBalance.toFixed(2)})`,
      metadata: {
        student_id: studentId,
        old_balance: oldBalance,
        new_balance: newBalance,
        balance_change: balanceChange,
        student_name: studentName,
        is_increase: isIncrease
      },
      student_id: studentId,
      amount: newBalance
    })

    await this.logActivity(
      'NOTIFICATION',
      studentId,
      'Balance Updated Notification',
      null,
      { student_id: studentId, old_balance: oldBalance, new_balance: newBalance, student_name: studentName },
      `Sent balance update notification for ${studentName}`
    )
  }

  /**
   * Check for overdue invoices and send notifications
   */
  async checkAndNotifyOverdueInvoices() {
    const organizationId = await this.getCurrentOrganization()
    
    const { data: overdueInvoices } = await supabase
      .from('invoices')
      .select(`
        *,
        student:students(first_name, last_name, student_id)
      `)
      .eq('organization_id', organizationId)
      .lt('due_date', new Date().toISOString())
      .in('status', ['sent', 'viewed', 'partially_paid'])
      .gt('remaining_balance', 0)

    if (!overdueInvoices || overdueInvoices.length === 0) return

    const notifications = []
    const today = new Date()

    for (const invoice of overdueInvoices) {
      const dueDate = new Date(invoice.due_date)
      const daysPastDue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24))

      // Check if we already sent a notification recently
      const { data: recentNotification } = await supabase
        .from('notifications')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('type', 'payment_overdue')
        .eq('metadata->>invoice_id', invoice.id)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
        .limit(1)
        .single()

      if (!recentNotification) {
        await this.notifyPaymentOverdue(
          invoice.id,
          invoice.student_id,
          invoice.remaining_balance,
          daysPastDue
        )
        notifications.push(invoice.id)
      }
    }

    await this.logActivity(
      'BATCH_NOTIFICATION',
      'overdue-check',
      'Overdue Invoice Check',
      null,
      { checked_count: overdueInvoices.length, notified_count: notifications.length },
      `Checked ${overdueInvoices.length} overdue invoices, sent ${notifications.length} notifications`
    )

    return notifications.length
  }

  /**
   * Get financial notifications for dashboard
   */
  async getFinancialNotifications(limit: number = 10) {
    const organizationId = await this.getCurrentOrganization()
    
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select(`
        *,
        student:students(first_name, last_name, student_id)
      `)
      .eq('organization_id', organizationId)
      .in('type', [
        'payment_received',
        'invoice_created', 
        'payment_overdue',
        'balance_updated',
        'payment_failed',
        'invoice_sent',
        'refund_processed'
      ])
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return notifications || []
  }

  /**
   * Private helper to create financial notification
   */
  private async createFinancialNotification(data: FinancialNotificationData) {
    const organizationId = await this.getCurrentOrganization()
    const user = await this.getCurrentUser()
    
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        organization_id: organizationId,
        user_id: user.id,
        type: data.type,
        priority: data.priority,
        title: data.title,
        message: data.message,
        metadata: data.metadata,
        read: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create financial notification:', error)
      throw error
    }

    return notification
  }

  /**
   * Set up real-time subscription for financial events
   */
  static setupRealtimeSubscription() {
    return supabase
      .channel('financial-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: 'type=in.(payment_received,invoice_created,payment_overdue,balance_updated,payment_failed,invoice_sent,refund_processed)'
        },
        (payload) => {
          // Handle real-time notification
          console.log('New financial notification:', payload.new)
          
          // Dispatch custom event for UI components to listen to
          const event = new CustomEvent('financial-notification', {
            detail: payload.new
          })
          window.dispatchEvent(event)
        }
      )
      .subscribe()
  }
}