import { NextRequest, NextResponse } from 'next/server'
import { TeacherService } from '@/lib/services/teacher-service'
import { teacherUpdateSchema } from '@/lib/validations'
import { withAuth } from '@/lib/middleware/api-auth'
import { z } from 'zod'

export const GET = withAuth(async (
  _request: NextRequest,
  _context,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  
  try {
    const teacherService = new TeacherService()
    const teacher = await teacherService.getById(id)
    return NextResponse.json({ success: true, data: teacher })
  } catch (error) {
    console.error('Error fetching teacher:', error)
    // Don't expose internal error details to client
    return NextResponse.json(
      { success: false, error: 'Teacher not found' },
      { status: 404 }
    )
  }
}, 'admin')

export const PUT = withAuth(async (
  request: NextRequest,
  _context,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const body = await request.json()
  
  try {
    const validatedData = teacherUpdateSchema.parse(body)
    const teacherService = new TeacherService()
    const teacher = await teacherService.update(id, validatedData)
    
    return NextResponse.json({ success: true, data: teacher })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    
    console.error('Error updating teacher:', error)
    // Don't expose internal error details to client
    return NextResponse.json(
      { success: false, error: 'Failed to update teacher' },
      { status: 500 }
    )
  }
}, 'admin')

export const PATCH = withAuth(async (
  request: NextRequest,
  _context,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const body = await request.json()
  
  try {
    const validatedData = teacherUpdateSchema.parse(body)
    const teacherService = new TeacherService()
    const teacher = await teacherService.update(id, validatedData)
    
    return NextResponse.json(teacher)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    
    throw error // Let withAuth wrapper handle the error
  }
}, 'admin')

export const DELETE = withAuth(async (
  _request: NextRequest,
  _context,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  
  try {
    const teacherService = new TeacherService()
    const teacher = await teacherService.delete(id)
    return NextResponse.json({ success: true, data: teacher })
  } catch (error) {
    console.error('Error deleting teacher:', error)
    // Don't expose internal error details to client
    return NextResponse.json(
      { success: false, error: 'Failed to delete teacher' },
      { status: 500 }
    )
  }
}, 'admin')