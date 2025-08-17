import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'

// GET /api/teacher-performance/[teacherId] - Get teacher performance metrics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teacherId: string }> }
) {
  const supabase = getSupabaseClient()
  const { teacherId } = await params

  try {
    // Get user ranking data
    const { data: ranking, error: rankingError } = await supabase
      .from('user_rankings')
      .select('*')
      .eq('user_id', teacherId)
      .eq('user_type', 'teacher')
      .maybeSingle()

    if (rankingError && rankingError.code !== 'PGRST116') {
      console.error('Ranking error:', rankingError)
      return NextResponse.json({ error: 'Failed to fetch performance data' }, { status: 500 })
    }

    // Get recent evaluations
    const { data: evaluations, error: evalError } = await supabase
      .from('teacher_evaluations')
      .select('overall_score, evaluation_period_end')
      .eq('teacher_id', teacherId)
      .order('evaluation_period_end', { ascending: false })
      .limit(5)

    if (evalError) {
      console.error('Evaluations error:', evalError)
      return NextResponse.json({ error: 'Failed to fetch evaluations' }, { status: 500 })
    }

    // Calculate metrics
    const evaluationsCount = evaluations?.length || 0
    const averageScore = evaluations?.length > 0 
      ? evaluations.reduce((sum, evaluation) => sum + evaluation.overall_score, 0) / evaluations.length
      : 0

    const performanceTier = averageScore >= 90 ? 'outstanding' :
                           averageScore >= 80 ? 'excellent' :
                           averageScore >= 70 ? 'good' : 'standard'

    const lastEvaluationDate = evaluations?.[0]?.evaluation_period_end || null

    const metrics = {
      overall_score: averageScore,
      efficiency_percentage: ranking?.efficiency_percentage || 0,
      quality_score: ranking?.quality_score || averageScore,
      performance_tier: ranking?.performance_tier || performanceTier,
      total_points: ranking?.total_points || 0,
      current_rank: ranking?.current_rank || 0,
      evaluations_count: evaluationsCount,
      last_evaluation_date: lastEvaluationDate
    }

    return NextResponse.json({ metrics })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}