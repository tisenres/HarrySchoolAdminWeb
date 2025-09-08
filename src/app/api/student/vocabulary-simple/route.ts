/**
 * Simplified Student Vocabulary API
 * Works with simplified auth tokens
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface VocabularyResponse {
  success: boolean
  data?: {
    words: any[]
    stats: {
      total_words: number
      daily_goal: number
    }
  }
  error?: string
}

// GET /api/student/vocabulary-simple
export async function GET(request: NextRequest): Promise<NextResponse<VocabularyResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get auth token from header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: 'No token provided'
      }, { status: 401 })
    }

    const token = authHeader.substring(7)
    
    // Decode simple token
    let tokenData
    try {
      tokenData = JSON.parse(Buffer.from(token, 'base64').toString())
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Invalid token'
      }, { status: 401 })
    }

    // Check expiration
    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json({
        success: false,
        error: 'Token expired'
      }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get vocabulary words - use simple schema
    const { data: words, error: wordsError } = await supabase
      .from('vocabulary_words')
      .select('*')
      .eq('organization_id', 'a0eebc99-3c0b-4ef8-a6d5-1b8f7d5e3a2c')
      .eq('is_active', true)
      .order('word')
      .limit(limit)

    if (wordsError) {
      console.error('Vocabulary fetch error:', wordsError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch vocabulary'
      }, { status: 500 })
    }

    // Simple response with basic stats
    const vocabularyStats = {
      total_words: words?.length || 0,
      daily_goal: 5
    }

    return NextResponse.json({
      success: true,
      data: {
        words: words || [],
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