'use client'


// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { Suspense } from 'react'
import { useUser, useOrganization } from '@/lib/auth/client-auth'
import { LeaderboardInterface } from '@/components/admin/leaderboard/leaderboard-interface'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
// import { Trophy, RefreshCw } from 'lucide-react' // Temporarily commented out for TypeScript

// interface LeaderboardPageProps {
//   params: {
//     locale: string
//   }
//   searchParams: Promise<{
//     group_id?: string
//     time_period?: 'week' | 'month' | 'all'
//     achievement_type?: string
//     category?: string
//     search?: string
//     page?: string
//     limit?: string
//   }>
// } // Temporarily commented out for TypeScript

// type SearchParamsType = {
//   group_id?: string
//   time_period?: 'week' | 'month' | 'all'
//   achievement_type?: string
//   category?: string
//   search?: string
//   page?: string
//   limit?: string
// } // Temporarily commented out for TypeScript

// Loading component for the leaderboard
function LeaderboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6 pb-4">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-4" />
                <div>
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Podium skeleton */}
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center space-x-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="text-center">
                <Skeleton className="w-16 h-16 rounded-full mx-auto mb-2" />
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table skeleton */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-48" />
              <div className="flex space-x-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-3 border-b">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <div className="flex-1" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Fetch initial leaderboard data
// async function getLeaderboardData(organizationId: string, searchParams: SearchParamsType) {
//   const supabase = await createClient()
//   
//   try {
//     // Build query parameters
//     const params = new URLSearchParams()
//     if (searchParams.group_id) params.set('group_id', searchParams.group_id)
//     if (searchParams.time_period) params.set('time_period', searchParams.time_period)
//     if (searchParams.achievement_type) params.set('achievement_type', searchParams.achievement_type)
//     if (searchParams.category) params.set('category', searchParams.category)
//     if (searchParams.search) params.set('search', searchParams.search)
//     
//     const limit = parseInt(searchParams.limit || '50')
//     const page = parseInt(searchParams.page || '1')
//     params.set('limit', limit.toString())
//     params.set('offset', ((page - 1) * limit).toString())
// 
//     // Call the optimized leaderboard function
//     const { data, error } = await supabase.rpc('get_optimized_leaderboard', {
//       p_organization_id: organizationId,
//       p_group_id: searchParams.group_id || null,
//       p_time_period: searchParams.time_period || 'all',
//       p_achievement_type: searchParams.achievement_type || null,
//       p_category: searchParams.category || null,
//       p_search: searchParams.search || null,
//       p_limit: limit,
//       p_offset: (page - 1) * limit
//     })
// 
//     if (error) {
//       console.error('Leaderboard data fetch error:', error)
//       return null
//     }
// 
//     // Transform the data to match the expected interface
//     const students = data?.[0]?.students || []
//     const totalCount = data?.[0]?.total_count || 0
// 
//     return {
//       students: Array.isArray(students) ? students : [],
//       total_count: totalCount,
//       pagination: {
//         current_page: page,
//         page_size: limit,
//         total_pages: Math.ceil(totalCount / limit),
//         total_count: totalCount
//       },
//       performance: {
//         query_time_ms: 0, // Will be calculated on client-side
//         cached: false
//       }
//     }
// 
//   } catch (error) {
//     console.error('Failed to fetch leaderboard data:', error)
//     return null
//   }
// } // Temporarily commented out for TypeScript

// Fetch supporting data (groups, achievement types, categories)
// async function getSupportingData(organizationId: string) {
//   const supabase = await createClient()
//   
//   try {
//     // Fetch groups
//     const { data: groups } = await supabase
//       .from('groups')
//       .select('id, name')
//       .eq('organization_id', organizationId)
//       .eq('status', 'active')
//       .is('deleted_at', null)
//       .order('name')
// 
//     // Fetch achievement types
//     const { data: achievements } = await supabase
//       .from('achievements')
//       .select('achievement_type')
//       .eq('organization_id', organizationId)
//       .eq('is_active', true)
//       .is('deleted_at', null)
// 
//     const achievementTypes = [...new Set(
//       achievements?.map(a => a.achievement_type).filter(Boolean) || []
//     )]
// 
//     // Fetch point categories
//     const { data: transactions } = await supabase
//       .from('points_transactions')
//       .select('category')
//       .eq('organization_id', organizationId)
//       .is('deleted_at', null)
// 
//     const categories = [...new Set(
//       transactions?.map(t => t.category).filter(Boolean) || []
//     )]
// 
//     return {
//       groups: groups || [],
//       achievementTypes,
//       categories
//     }
// 
//   } catch (error) {
//     console.error('Failed to fetch supporting data:', error)
//     return {
//       groups: [],
//       achievementTypes: [],
//       categories: []
//     }
//   }
// } // Temporarily commented out for TypeScript

export default function LeaderboardPage() {
  const user = useUser()
  const organization = useOrganization()

  // Show loading while auth is being determined
  if (!user || !organization) {
    return <LeaderboardSkeleton />
  }

  return (
    <div className="space-y-6">
      <Suspense fallback={<LeaderboardSkeleton />}>
        <LeaderboardInterface organizationId={organization.id} />
      </Suspense>
    </div>
  )
}

// Components and server functions removed - data fetching now handled client-side by LeaderboardInterface