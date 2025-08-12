import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getCurrentProfile } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const restoreSchema = z.object({
  table: z.enum(['teachers', 'students', 'groups']),
  id: z.string().uuid(),
  reason: z.string().min(1).max(500).optional()
})

const permanentDeleteSchema = z.object({
  table: z.enum(['teachers', 'students', 'groups']),
  id: z.string().uuid(),
  confirmation: z.literal('PERMANENTLY_DELETE'),
  reason: z.string().min(10).max(500)
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const profile = await getCurrentProfile()
    
    if (!user || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin and superadmin can view archives
    if (!['admin', 'superadmin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const table = searchParams.get('table') || 'all'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = await createServerClient()
    
    const tables = table === 'all' ? ['teachers', 'students', 'groups'] : [table]
    const archiveData = []

    for (const tableName of tables) {
      // Build select query based on table
      let selectQuery = 'id, deleted_at, deleted_by'
      if (tableName === 'teachers') {
        selectQuery += ', full_name, specialization, phone, email'
      } else if (tableName === 'students') {
        selectQuery += ', full_name, date_of_birth, phone, parent_phone, status'
      } else if (tableName === 'groups') {
        selectQuery += ', name, description, max_capacity, schedule'
      }

      let query = supabase
        .from(tableName)
        .select(selectQuery)
        .eq('organization_id', profile.organization_id)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })

      if (table !== 'all') {
        query = query.range(offset, offset + limit - 1)
      }

      const { data, error } = await query

      if (error) throw error

      // Format the data with table information
      // Also handle missing profile data for deleted_by
      const formattedData = data?.map(item => ({
        ...item,
        table: tableName,
        type: tableName.slice(0, -1), // Remove 's' from plural
        // Add a placeholder for deleted_by user if not available
        deleted_by_user: item.profiles || { full_name: 'System', email: 'system@harryschool.uz' }
      })) || []

      archiveData.push(...formattedData)
    }

    // Sort by deleted_at if showing all tables
    if (table === 'all') {
      archiveData.sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime())
      
      // Apply pagination after sorting
      const paginatedData = archiveData.slice(offset, offset + limit)
      
      return NextResponse.json({
        archives: paginatedData,
        pagination: {
          total: archiveData.length,
          limit,
          offset,
          hasMore: archiveData.length > offset + limit
        }
      })
    }

    // Get count for single table
    const { count, error: countError } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', profile.organization_id)
      .not('deleted_at', 'is', null)

    if (countError) throw countError

    return NextResponse.json({
      archives: archiveData,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })
  } catch (error) {
    console.error('Error fetching archive data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch archive data' },
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

    // Only admin and superadmin can restore items
    if (!['admin', 'superadmin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const action = body.action

    if (action === 'restore') {
      // Validate restore request
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

      const { table, id, reason } = validationResult.data
      const supabase = await createServerClient()

      // Restore the item by setting deleted_at to null
      const { data, error } = await supabase
        .from(table)
        .update({
          deleted_at: null,
          deleted_by: null,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('organization_id', profile.organization_id)
        .not('deleted_at', 'is', null)
        .select()
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json({ error: 'Item not found in archive' }, { status: 404 })
        }
        throw error
      }

      // Log the restoration
      await supabase.rpc('log_security_event', {
        event_type: 'item_restored',
        event_details: {
          table,
          item_id: id,
          restored_by: user.id,
          reason: reason || 'Manual restoration',
          organization_id: profile.organization_id
        },
        event_severity: 'info'
      })

      return NextResponse.json({
        message: `${table.slice(0, -1)} restored successfully`,
        restored_item: data
      })

    } else if (action === 'permanent_delete') {
      // Validate permanent delete request
      const validationResult = permanentDeleteSchema.safeParse(body)
      if (!validationResult.success) {
        return NextResponse.json(
          { 
            error: 'Validation failed', 
            details: validationResult.error.errors 
          },
          { status: 400 }
        )
      }

      // Only superadmin can permanently delete
      if (profile.role !== 'superadmin') {
        return NextResponse.json({ error: 'Only superadmin can permanently delete items' }, { status: 403 })
      }

      const { table, id, reason } = validationResult.data
      const supabase = await createServerClient()

      // Get the item details before deletion for logging
      const { data: itemToDelete, error: fetchError } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .eq('organization_id', profile.organization_id)
        .not('deleted_at', 'is', null)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          return NextResponse.json({ error: 'Item not found in archive' }, { status: 404 })
        }
        throw fetchError
      }

      // Permanently delete the item
      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq('id', id)
        .eq('organization_id', profile.organization_id)
        .not('deleted_at', 'is', null)

      if (deleteError) throw deleteError

      // Log the permanent deletion
      await supabase.rpc('log_security_event', {
        event_type: 'item_permanently_deleted',
        event_details: {
          table,
          item_id: id,
          item_data: itemToDelete,
          deleted_by: user.id,
          reason,
          organization_id: profile.organization_id
        },
        event_severity: 'high'
      })

      return NextResponse.json({
        message: `${table.slice(0, -1)} permanently deleted`
      })

    } else {
      return NextResponse.json({ error: 'Invalid action. Use "restore" or "permanent_delete"' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error processing archive request:', error)
    return NextResponse.json(
      { error: 'Failed to process archive request' },
      { status: 500 }
    )
  }
}