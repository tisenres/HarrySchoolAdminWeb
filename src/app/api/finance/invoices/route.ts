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
    
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select(`
        *,
        students(
          id,
          first_name,
          last_name,
          student_id
        ),
        invoice_line_items(*)
      `)
      .eq('organization_id', profile.organization_id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching invoices:', error)
      throw error
    }

    return NextResponse.json(invoices || [])
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
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

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        organization_id: profile.organization_id,
        student_id: body.student_id,
        invoice_number: invoiceNumber,
        issue_date: body.issue_date || new Date().toISOString(),
        due_date: body.due_date,
        currency: body.currency || 'USD',
        total_amount: body.total_amount,
        paid_amount: 0,
        status: 'draft',
        notes: body.notes,
        created_by: user.id,
        updated_by: user.id
      })
      .select()
      .single()

    if (invoiceError) {
      console.error('Error creating invoice:', invoiceError)
      throw invoiceError
    }

    // Create line items if provided
    if (body.line_items && body.line_items.length > 0) {
      const lineItems = body.line_items.map((item: any) => ({
        invoice_id: invoice.id,
        description: item.description,
        item_type: item.item_type || 'tuition',
        quantity: item.quantity || 1,
        unit_price: item.unit_price,
        line_total: item.line_total || item.unit_price * (item.quantity || 1),
        created_by: user.id,
        updated_by: user.id
      }))

      const { error: lineItemsError } = await supabase
        .from('invoice_line_items')
        .insert(lineItems)

      if (lineItemsError) {
        console.error('Error creating line items:', lineItemsError)
        // Rollback invoice creation
        await supabase
          .from('invoices')
          .delete()
          .eq('id', invoice.id)
        throw lineItemsError
      }
    }
    
    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}