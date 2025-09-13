import { NextRequest, NextResponse } from 'next/server'
import { getApiClient, getCurrentOrganizationId } from '@/lib/supabase-unified'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params
    
    console.log('🔍 GET /api/students/[id]/payments - Starting request for student:', studentId)
    
    // Get unified client and organization
    const supabase = await getApiClient()
    const organizationId = await getCurrentOrganizationId()
    
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 400 }
      )
    }
    
    console.log('🏢 Organization ID:', organizationId)
    
    // Fetch payment history for the student
    const { data: payments, error } = await supabase
      .from('payments')
      .select(`
        *,
        payment_methods(name),
        students!inner(
          id,
          first_name,
          last_name,
          organization_id
        )
      `)
      .eq('student_id', studentId)
      .eq('students.organization_id', organizationId)
      .is('deleted_at', null)
      .order('payment_date', { ascending: false })
    
    if (error) {
      console.error('Failed to fetch payments:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch payment history' },
        { status: 500 }
      )
    }
    
    // Transform the data to match the expected format
    const transformedPayments = payments?.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      date: payment.payment_date,
      method: payment.payment_methods?.name || 'unknown',
      status: payment.status,
      description: payment.description || payment.notes
    })) || []
    
    return NextResponse.json({
      success: true,
      data: transformedPayments
    })
  } catch (error) {
    console.error('Error in payments API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}