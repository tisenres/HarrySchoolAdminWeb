import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Check organizations
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(10)

    if (orgError) {
      throw orgError
    }

    // Check new tables
    const tables = ['student_profiles', 'teacher_profiles', 'lessons', 'hometasks']
    const tableInfo: Record<string, any> = {}

    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        tableInfo[table] = { exists: true, count: count || 0, error: null }
      } catch (err: any) {
        tableInfo[table] = { exists: false, count: 0, error: err.message }
      }
    }

    return NextResponse.json({
      success: true,
      organizations: orgs || [],
      tables: tableInfo,
      databaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}