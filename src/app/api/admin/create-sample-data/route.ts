import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('Creating sample payment data...')

    // Get organization ID from the revenue_summary table
    const { data: orgData } = await supabase
      .from('revenue_summary')
      .select('organization_id')
      .limit(1)
      .single()

    if (!orgData) {
      return NextResponse.json({
        success: false,
        message: 'No organization found'
      }, { status: 400 })
    }

    const organizationId = orgData.organization_id

    // Get some student IDs
    const { data: students } = await supabase
      .from('students')
      .select('id')
      .eq('organization_id', organizationId)
      .limit(5)

    if (!students || students.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No students found'
      }, { status: 400 })
    }

    // Create sample payment data
    const samplePayments = []
    const baseDate = new Date('2025-09-01')
    
    for (let i = 0; i < 20; i++) {
      const paymentDate = new Date(baseDate)
      paymentDate.setDate(baseDate.getDate() + i)
      
      const student = students[i % students.length]
      const amount = Math.floor(Math.random() * 50000) + 25000 // 25k-75k UZS
      
      samplePayments.push({
        organization_id: organizationId,
        payment_number: `PAY-${String(i + 1).padStart(4, '0')}`,
        student_id: student.id,
        amount: amount,
        currency: 'UZS',
        payment_method_type: ['cash', 'card', 'bank_transfer'][Math.floor(Math.random() * 3)],
        status: Math.random() > 0.2 ? 'completed' : 'pending', // 80% completed
        payment_date: paymentDate.toISOString(),
        processed_at: Math.random() > 0.2 ? paymentDate.toISOString() : null,
        payer_name: `Student ${i + 1} Parent`,
        receipt_number: `REC-${String(i + 1).padStart(4, '0')}`,
        created_at: paymentDate.toISOString(),
        updated_at: paymentDate.toISOString()
      })
    }

    // Insert sample payments
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .insert(samplePayments)
      .select()

    if (paymentError) {
      console.error('Error creating sample payments:', paymentError)
      return NextResponse.json({
        success: false,
        message: 'Failed to create sample payments',
        error: paymentError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Created ${paymentData?.length || 0} sample payments`,
      data: {
        paymentsCreated: paymentData?.length || 0,
        organizationId,
        studentsUsed: students.length
      }
    })

  } catch (error: any) {
    console.error('Error in create-sample-data:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error.message
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to create sample payment data for reports testing',
    usage: 'POST /api/admin/create-sample-data'
  })
}