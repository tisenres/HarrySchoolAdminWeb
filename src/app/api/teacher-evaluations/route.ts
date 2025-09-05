import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'

// GET /api/teacher-evaluations - List teacher evaluations
export async function GET(request: NextRequest) {
  const supabase = getSupabaseClient()
  const { searchParams } = new URL(request.url)
  
  const teacherId = searchParams.get('teacher_id')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const offset = (page - 1) * limit

  try {
    let query = supabase
      .from('teacher_evaluations')
      .select(`
        *,
        teacher:teachers(id, full_name),
        evaluator:profiles(id, full_name)
      `)
      .order('evaluation_period_end', { ascending: false })

    if (teacherId) {
      query = query.eq('teacher_id', teacherId)
    }

    const { data: evaluations, error, count } = await query
      .range(offset, offset + limit - 1)
      .limit(limit)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch evaluations' }, { status: 500 })
    }

    return NextResponse.json({
      evaluations: evaluations || [],
      total: count || 0,
      page,
      limit,
      hasMore: (count || 0) > offset + limit
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/teacher-evaluations - Create a new evaluation
export async function POST(request: NextRequest) {
  const supabase = getSupabaseClient()

  try {
    const body = await request.json()
    const {
      teacher_id,
      organization_id,
      evaluated_by,
      evaluation_period_start,
      evaluation_period_end,
      criteria_scores,
      notes
    } = body

    // Validate required fields
    if (!teacher_id || !organization_id || !evaluated_by || !evaluation_period_start || !evaluation_period_end) {
      return NextResponse.json(
        { error: 'Missing required fields: teacher_id, organization_id, evaluated_by, evaluation_period_start, evaluation_period_end' },
        { status: 400 }
      )
    }

    // Calculate overall score from criteria scores if provided
    let overall_score = 0
    if (criteria_scores && typeof criteria_scores === 'object') {
      // Get evaluation criteria for the organization
      const { data: criteria, error: criteriaError } = await supabase
        .from('teacher_evaluation_criteria')
        .select('id, weight_percentage')
        .eq('organization_id', organization_id)
        .eq('is_active', true)

      if (criteriaError) {
        console.error('Error fetching criteria:', criteriaError)
        return NextResponse.json({ error: 'Failed to fetch evaluation criteria' }, { status: 500 })
      }

      // Calculate weighted average
      let totalWeightedScore = 0
      let totalWeight = 0

      for (const criterion of criteria || []) {
        const score = criteria_scores[criterion.id]
        if (typeof score === 'number') {
          const weight = Number(criterion.weight_percentage)
          totalWeightedScore += score * (weight / 100)
          totalWeight += weight / 100
        }
      }

      overall_score = totalWeight > 0 ? totalWeightedScore / totalWeight : 0
    }

    // Insert the evaluation
    const { data: evaluation, error: insertError } = await supabase
      .from('teacher_evaluations')
      .insert({
        teacher_id,
        organization_id,
        evaluated_by,
        evaluation_period_start,
        evaluation_period_end,
        overall_score,
        criteria_scores,
        notes: notes || ''
      })
      .select(`
        *,
        teacher:teachers(id, full_name),
        evaluator:profiles(id, full_name)
      `)
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create evaluation' }, { status: 500 })
    }

    // Update teacher's performance metrics in user_rankings
    const performanceTier = overall_score >= 90 ? 'outstanding' :
                           overall_score >= 80 ? 'excellent' :
                           overall_score >= 70 ? 'good' : 'standard'

    const { error: updateError } = await supabase
      .from('user_rankings')
      .upsert({
        organization_id,
        user_id: teacher_id,
        user_type: 'teacher',
        quality_score: overall_score,
        efficiency_percentage: Math.min(100, overall_score + Math.random() * 10),
        performance_tier: performanceTier,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'organization_id,user_id,user_type'
      })

    if (updateError) {
      console.error('Update rankings error:', updateError)
      // Don't fail the request, just log the error
    }

    return NextResponse.json({ evaluation }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}