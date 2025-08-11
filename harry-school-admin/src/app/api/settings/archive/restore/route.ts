import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getCurrentProfile } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const restoreSchema = z.object({
  entity: z.enum(['teachers', 'students', 'groups', 'profiles']),
  recordId: z.string().uuid(),
  reason: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const profile = await getCurrentProfile()
    
    if (!user || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin and superadmin can restore items
    if (!['admin', 'superadmin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    
    // Validate request
    const validationResult = restoreSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      )
    }

    const { entity, recordId, reason } = validationResult.data
    const supabase = await createServerClient()

    // Check if the record exists and is soft-deleted
    const { data: existingRecord, error: fetchError } = await supabase
      .from(entity)
      .select('*')
      .eq('id', recordId)
      .eq('organization_id', profile.organization_id)
      .not('deleted_at', 'is', null)
      .single()

    if (fetchError || !existingRecord) {
      return NextResponse.json({ error: 'Record not found in archive' }, { status: 404 })
    }

    // Restore the record by setting deleted_at and deleted_by to null
    const { data, error } = await supabase
      .from(entity)
      .update({
        deleted_at: null,
        deleted_by: null,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', recordId)
      .eq('organization_id', profile.organization_id)
      .select()
      .single()

    if (error) {
      console.error('Error restoring record:', error)
      throw error
    }

    // Log the restoration activity (if activity_logs table exists)
    try {
      await supabase.from('activity_logs').insert({
        organization_id: profile.organization_id,
        user_id: user.id,
        user_email: user.email,
        user_name: user.user_metadata?.full_name || user.email,
        user_role: profile.role,
        action: 'RESTORE',
        resource_type: entity,
        resource_id: recordId,
        resource_name: existingRecord.full_name || existingRecord.name || 'Unknown',
        description: reason || `Restored ${entity.slice(0, -1)} from archive`,
        success: true
      })
    } catch (logError) {
      // Log activity logging error but don't fail the restore operation
      console.error('Failed to log restore activity:', logError)
    }

    return NextResponse.json({
      message: `${entity.slice(0, -1)} restored successfully`,
      record: data
    })

  } catch (error) {
    console.error('Error restoring record:', error)
    return NextResponse.json(
      { error: 'Failed to restore record' },
      { status: 500 }
    )
  }
}