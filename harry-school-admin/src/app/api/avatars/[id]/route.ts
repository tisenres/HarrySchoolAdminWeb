import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'

// Default avatar colors for fallback
const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#F8B739'
]

// Generate SVG avatar fallback
function generateAvatarSVG(id: string, name?: string) {
  const colorIndex = parseInt(id.replace(/\D/g, ''), 10) % AVATAR_COLORS.length
  const color = AVATAR_COLORS[colorIndex]
  const initial = name ? name[0].toUpperCase() : id[0].toUpperCase()
  
  return `
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="${color}"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
            font-family="Arial, sans-serif" font-size="80" font-weight="bold" fill="white">
        ${initial}
      </text>
    </svg>
  `
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    const supabase = getSupabaseClient()
    
    // Try to get user info from database (student or teacher)
    const userType = id.includes('teacher') ? 'teacher' : 'student'
    let avatarUrl = null
    let userName = null
    
    if (userType === 'teacher') {
      const { data } = await supabase
        .from('teachers')
        .select('avatar_url, full_name')
        .eq('id', id.replace('teacher-', ''))
        .single()
      
      if (data) {
        avatarUrl = data.avatar_url
        userName = data.full_name
      }
    } else {
      const { data } = await supabase
        .from('students')
        .select('avatar_url, full_name')
        .eq('id', id.replace('student-', ''))
        .single()
      
      if (data) {
        avatarUrl = data.avatar_url
        userName = data.full_name
      }
    }
    
    // If we have a real avatar URL, redirect to it
    if (avatarUrl) {
      return NextResponse.redirect(avatarUrl)
    }
    
    // Generate fallback avatar SVG
    const svg = generateAvatarSVG(id, userName)
    
    return new NextResponse(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error('Error fetching avatar:', error)
    
    // Return a default avatar on error
    const svg = generateAvatarSVG(id)
    
    return new NextResponse(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes on error
      },
    })
  }
}