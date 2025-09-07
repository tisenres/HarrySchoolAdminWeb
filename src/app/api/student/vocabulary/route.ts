/**
 * Student Vocabulary API
 * GET /api/student/vocabulary - Get vocabulary data
 * POST /api/student/vocabulary/review - Submit review session
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database.types'

type VocabularyWord = Database['public']['Tables']['vocabulary_words']['Row']
type StudentVocabProgress = Database['public']['Tables']['student_vocabulary_progress']['Row']

interface VocabularyResponse {
  success: boolean
  data?: {
    words: (VocabularyWord & { progress?: StudentVocabProgress })[]
    stats?: {
      total_words: number
      mastered: number
      learning: number
      new_words: number
      daily_goal: number
      streak_count: number
    }
  }
  error?: string
}

interface ReviewRequest {
  word_id: string
  correct: boolean
  time_spent_seconds: number
  review_type: 'definition' | 'example' | 'multiple_choice' | 'spelling'
}

// GET /api/student/vocabulary - Get vocabulary words and progress
export async function GET(request: NextRequest): Promise<NextResponse<VocabularyResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'daily' // 'daily', 'all', 'due'
    const limit = parseInt(searchParams.get('limit') || '5')

    const supabase = createClient()

    // Get current student
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated'
      }, { status: 401 })
    }

    // Get student profile
    const { data: profile } = await supabase
      .from('student_profiles')
      .select('student_id, organization_id, vocabulary_daily_goal')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({
        success: false,
        error: 'Student profile not found'
      }, { status: 404 })
    }

    let wordsQuery = supabase
      .from('vocabulary_words')
      .select(`
        *,
        student_vocabulary_progress (
          mastery_level,
          confidence_score,
          review_count,
          correct_count,
          last_reviewed,
          next_review_date,
          streak_count,
          best_streak,
          total_study_time_minutes
        )
      `)
      .eq('organization_id', profile.organization_id)
      .eq('is_active', true)
      .is('deleted_at', null)

    // Apply filters based on type
    if (type === 'daily') {
      // Get daily review words using a custom function or smart selection
      wordsQuery = wordsQuery
        .or(
          `student_vocabulary_progress.is.null,` +
          `student_vocabulary_progress.next_review_date.lte.${new Date().toISOString().split('T')[0]},` +
          `student_vocabulary_progress.mastery_level.in.("new","learning")`
        )
        .order('difficulty_level', { ascending: true })
        .limit(limit)
    } else if (type === 'due') {
      wordsQuery = wordsQuery
        .not('student_vocabulary_progress', 'is', null)
        .lte('student_vocabulary_progress.next_review_date', new Date().toISOString().split('T')[0])
        .limit(limit)
    } else {
      // 'all' - return all words with pagination
      wordsQuery = wordsQuery
        .order('difficulty_level', { ascending: true })
        .order('word', { ascending: true })
        .limit(limit)
    }

    const { data: words, error: wordsError } = await wordsQuery

    if (wordsError) {
      console.error('Vocabulary fetch error:', wordsError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch vocabulary'
      }, { status: 500 })
    }

    // Get vocabulary statistics
    const { data: stats } = await supabase
      .from('student_vocabulary_progress')
      .select('mastery_level, streak_count')
      .eq('student_id', profile.student_id)

    const vocabularyStats = {
      total_words: words?.length || 0,
      mastered: stats?.filter(s => s.mastery_level === 'mastered').length || 0,
      learning: stats?.filter(s => s.mastery_level === 'learning').length || 0,
      new_words: stats?.filter(s => s.mastery_level === 'new').length || 0,
      daily_goal: profile.vocabulary_daily_goal || 5,
      streak_count: Math.max(...(stats?.map(s => s.streak_count) || [0]))
    }

    // Transform the data to flatten progress
    const transformedWords = words?.map(word => ({
      ...word,
      progress: word.student_vocabulary_progress?.[0] || null,
      student_vocabulary_progress: undefined
    })) || []

    return NextResponse.json({
      success: true,
      data: {
        words: transformedWords,
        stats: vocabularyStats
      }
    })

  } catch (error) {
    console.error('Vocabulary API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// POST /api/student/vocabulary/review - Submit vocabulary review session
export async function POST(request: NextRequest): Promise<NextResponse<{ success: boolean; error?: string }>> {
  try {
    const reviews: ReviewRequest[] = await request.json()

    if (!Array.isArray(reviews) || reviews.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Reviews array is required'
      }, { status: 400 })
    }

    const supabase = createClient()

    // Get current student
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated'
      }, { status: 401 })
    }

    // Get student profile
    const { data: profile } = await supabase
      .from('student_profiles')
      .select('student_id, organization_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({
        success: false,
        error: 'Student profile not found'
      }, { status: 404 })
    }

    // Process each review
    const updatePromises = reviews.map(async (review) => {
      // Get current progress or create new
      const { data: currentProgress } = await supabase
        .from('student_vocabulary_progress')
        .select('*')
        .eq('student_id', profile.student_id)
        .eq('vocabulary_word_id', review.word_id)
        .single()

      const now = new Date()
      const today = now.toISOString().split('T')[0]

      let newMasteryLevel = currentProgress?.mastery_level || 'new'
      let newConfidenceScore = currentProgress?.confidence_score || 0
      let newStreakCount = currentProgress?.streak_count || 0
      let newBestStreak = currentProgress?.best_streak || 0

      // Update mastery level based on correctness
      if (review.correct) {
        newConfidenceScore = Math.min(1.0, newConfidenceScore + 0.2)
        newStreakCount += 1
        newBestStreak = Math.max(newBestStreak, newStreakCount)

        // Progress mastery level
        if (newConfidenceScore >= 0.8 && newStreakCount >= 3) {
          if (newMasteryLevel === 'new') newMasteryLevel = 'learning'
          else if (newMasteryLevel === 'learning') newMasteryLevel = 'familiar'  
          else if (newMasteryLevel === 'familiar') newMasteryLevel = 'mastered'
        }
      } else {
        newConfidenceScore = Math.max(0, newConfidenceScore - 0.1)
        newStreakCount = 0
        
        // Regress mastery level if confidence drops
        if (newConfidenceScore < 0.3) {
          if (newMasteryLevel === 'mastered') newMasteryLevel = 'familiar'
          else if (newMasteryLevel === 'familiar') newMasteryLevel = 'learning'
        }
      }

      // Calculate next review date using spaced repetition
      const getNextReviewDate = (mastery: string, correct: boolean) => {
        const baseIntervals = {
          'new': 1,
          'learning': 3,
          'familiar': 7,
          'mastered': 14
        }
        
        let interval = baseIntervals[mastery as keyof typeof baseIntervals] || 1
        if (!correct) interval = Math.max(1, Math.floor(interval / 2))
        
        const nextDate = new Date(now)
        nextDate.setDate(nextDate.getDate() + interval)
        return nextDate.toISOString().split('T')[0]
      }

      const nextReviewDate = getNextReviewDate(newMasteryLevel, review.correct)

      // Upsert progress record
      const progressData = {
        organization_id: profile.organization_id,
        student_id: profile.student_id,
        vocabulary_word_id: review.word_id,
        mastery_level: newMasteryLevel,
        confidence_score: newConfidenceScore,
        review_count: (currentProgress?.review_count || 0) + 1,
        correct_count: (currentProgress?.correct_count || 0) + (review.correct ? 1 : 0),
        last_reviewed: now.toISOString(),
        next_review_date: nextReviewDate,
        streak_count: newStreakCount,
        best_streak: newBestStreak,
        total_study_time_minutes: (currentProgress?.total_study_time_minutes || 0) + Math.ceil(review.time_spent_seconds / 60),
        updated_at: now.toISOString()
      }

      return supabase
        .from('student_vocabulary_progress')
        .upsert(progressData, { 
          onConflict: 'student_id,vocabulary_word_id' 
        })
    })

    // Execute all updates
    const results = await Promise.allSettled(updatePromises)
    
    // Check for any failures
    const failures = results.filter(r => r.status === 'rejected')
    if (failures.length > 0) {
      console.error('Some vocabulary updates failed:', failures)
      // Continue anyway, partial success is better than complete failure
    }

    // Award points for completing vocabulary session
    const pointsEarned = reviews.length * 2 // 2 points per word
    const coinsEarned = Math.floor(reviews.length / 5) // 1 coin per 5 words

    if (pointsEarned > 0) {
      await supabase
        .from('points_transactions')
        .insert({
          organization_id: profile.organization_id,
          student_id: profile.student_id,
          transaction_type: 'earned',
          points_amount: pointsEarned,
          coins_earned: coinsEarned,
          reason: `Vocabulary practice: ${reviews.length} words`,
          category: 'vocabulary',
          awarded_by: profile.student_id // Self-awarded for system activities
        })
    }

    return NextResponse.json({
      success: true
    })

  } catch (error) {
    console.error('Vocabulary review submission error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}