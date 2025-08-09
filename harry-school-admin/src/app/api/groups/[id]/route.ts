import { NextRequest, NextResponse } from 'next/server'
import { GroupService } from '@/lib/services/group-service'
import { groupUpdateSchema } from '@/lib/validations'
import { withAuth } from '@/lib/middleware/api-auth'
import { z } from 'zod'

export const GET = withAuth(async (
  _request: NextRequest,
  _context,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const groupService = new GroupService()
  const group = await groupService.getById(id)
  return NextResponse.json(group)
}, 'admin')

export const PATCH = withAuth(async (
  request: NextRequest,
  _context,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const body = await request.json()
  
  try {
    const validatedData = groupUpdateSchema.parse(body)
    const groupService = new GroupService()
    const group = await groupService.update(id, validatedData)
    
    return NextResponse.json(group)
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
  const groupService = new GroupService()
  const group = await groupService.delete(id)
  return NextResponse.json(group)
}, 'admin')