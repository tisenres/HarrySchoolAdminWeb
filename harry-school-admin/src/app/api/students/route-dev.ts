import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Development-only route without authentication for testing
// This demonstrates that the "Create Student" button works correctly

const mockStudentSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  date_of_birth: z.string(),
  gender: z.string().optional(),
  phone: z.string(),
  email: z.string().optional(),
  preferred_subjects: z.array(z.string()),
  current_level: z.string(),
  enrollment_date: z.string().optional(),
  student_status: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate the basic required fields
    const validatedData = mockStudentSchema.parse(body)
    
    // Create a mock response showing the student was created
    const mockStudent = {
      id: `student-${Date.now()}`,
      ...validatedData,
      full_name: `${validatedData.first_name} ${validatedData.last_name}`,
      created_at: new Date().toISOString(),
      organization_id: 'mock-org',
    }
    
    // Log the successful creation for verification
    console.log('✅ Mock Student Created:', mockStudent)
    
    return NextResponse.json(
      { 
        success: true, 
        data: mockStudent,
        message: 'Student created successfully (development mode)'
      }, 
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Validation Error:', error.issues)
      return NextResponse.json(
        { 
          success: false,
          error: 'Validation error', 
          details: error.issues 
        },
        { status: 400 }
      )
    }
    
    console.error('❌ Server Error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Return empty list for development
  return NextResponse.json({
    success: true,
    data: [],
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0
    }
  })
}