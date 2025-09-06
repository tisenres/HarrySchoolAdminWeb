import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getCurrentProfile } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const profile = await getCurrentProfile()
    
    if (!user || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerClient()
    
    const { data: transactions, error } = await supabase
      .from('financial_transactions')
      .select(`
        *,
        students(
          id,
          first_name,
          last_name,
          student_id
        ),
        groups(
          id,
          name
        )
      `)
      .eq('organization_id', profile.organization_id)
      .is('deleted_at', null)
      .order('transaction_date', { ascending: false })

    if (error) {
      console.error('Error fetching transactions:', error)
      throw error
    }

    return NextResponse.json(transactions || [])
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const profile = await getCurrentProfile()
    
    if (!user || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const supabase = await createServerClient()

    // Generate transaction number
    const transactionNumber = `TXN-${Date.now()}`

    // Create transaction
    const { data: transaction, error } = await supabase
      .from('financial_transactions')
      .insert({
        organization_id: profile.organization_id,
        transaction_number: transactionNumber,
        transaction_type: body.transaction_type,
        category: body.category,
        amount: body.amount,
        currency: body.currency || 'USD',
        transaction_date: body.transaction_date || new Date().toISOString(),
        description: body.description,
        reference_type: body.reference_type,
        reference_id: body.reference_id,
        student_id: body.student_id,
        group_id: body.group_id,
        payment_id: body.payment_id,
        invoice_id: body.invoice_id,
        status: 'completed',
        created_by: user.id,
        updated_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating transaction:', error)
      throw error
    }
    
    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}