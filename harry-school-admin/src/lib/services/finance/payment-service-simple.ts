import { createServerClient } from '@/lib/supabase/server'
import { getCurrentUser, getCurrentProfile } from '@/lib/auth'

export interface PaymentData {
  student_id: string
  invoice_id?: string
  amount: number
  payment_method_type: 'cash' | 'card' | 'bank_transfer' | 'online' | 'mobile_money'
  payment_date?: string
  external_reference?: string
  notes?: string
  currency?: string
  payer_name?: string
  payer_contact?: string
}

export class SimplePaymentService {
  static async create(data: PaymentData) {
    const supabase = await createServerClient()
    const user = await getCurrentUser()
    const profile = await getCurrentProfile()
    
    if (!user || !profile) {
      throw new Error('Unauthorized')
    }

    // Call the database function to create payment
    const { data: result, error } = await supabase.rpc('create_payment_with_allocation', {
      p_organization_id: profile.organization_id,
      p_student_id: data.student_id,
      p_amount: data.amount,
      p_created_by: user.id,
      p_invoice_id: data.invoice_id || null,
      p_currency: data.currency || 'USD',
      p_payment_date: data.payment_date || new Date().toISOString(),
      p_payment_method_type: data.payment_method_type,
      p_payment_method_id: null,
      p_payer_name: data.payer_name || null,
      p_payer_contact: data.payer_contact || null,
      p_external_reference: data.external_reference || null,
      p_notes: data.notes || null
    })

    if (error) {
      console.error('Payment creation error:', error)
      throw new Error(`Failed to create payment: ${error.message}`)
    }

    return result
  }

  static async list(filters?: {
    studentId?: string
    status?: string
    startDate?: string
    endDate?: string
  }) {
    const supabase = await createServerClient()
    const profile = await getCurrentProfile()
    
    if (!profile) {
      throw new Error('Unauthorized')
    }

    let query = supabase
      .from('payments')
      .select(`
        *,
        students!inner(
          id,
          first_name,
          last_name,
          student_id
        ),
        invoices(
          id,
          invoice_number,
          total_amount,
          paid_amount
        )
      `)
      .eq('organization_id', profile.organization_id)
      .is('deleted_at', null)
      .order('payment_date', { ascending: false })

    // Apply filters
    if (filters?.studentId) {
      query = query.eq('student_id', filters.studentId)
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

    const { data, error } = await query

    if (error) {
      console.error('Payment list error:', error)
      throw new Error(`Failed to fetch payments: ${error.message}`)
    }

    return data || []
  }

  static async getById(id: string) {
    const supabase = await createServerClient()
    const profile = await getCurrentProfile()
    
    if (!profile) {
      throw new Error('Unauthorized')
    }

    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        students(
          id,
          first_name,
          last_name,
          student_id
        ),
        invoices(
          id,
          invoice_number,
          total_amount,
          paid_amount
        )
      `)
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .is('deleted_at', null)
      .single()

    if (error) {
      throw new Error(`Failed to fetch payment: ${error.message}`)
    }

    return data
  }

  static async update(id: string, updates: Partial<PaymentData>) {
    const supabase = await createServerClient()
    const user = await getCurrentUser()
    const profile = await getCurrentProfile()
    
    if (!user || !profile) {
      throw new Error('Unauthorized')
    }

    const { data, error } = await supabase
      .from('payments')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
        updated_by: user.id
      })
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update payment: ${error.message}`)
    }

    return data
  }

  static async delete(id: string) {
    const supabase = await createServerClient()
    const user = await getCurrentUser()
    const profile = await getCurrentProfile()
    
    if (!user || !profile) {
      throw new Error('Unauthorized')
    }

    // Soft delete
    const { error } = await supabase
      .from('payments')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user.id
      })
      .eq('id', id)
      .eq('organization_id', profile.organization_id)

    if (error) {
      throw new Error(`Failed to delete payment: ${error.message}`)
    }

    return { success: true }
  }
}