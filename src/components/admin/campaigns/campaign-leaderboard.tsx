'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Trophy,
  Medal,
  Award,
  TrendingUp,
  Crown,
  Star,
  Users,
  UserCheck,
  Search,
  Filter,
  BarChart3,
  Zap,
  Target,
  Calendar,
  Clock,
  Gift,
  Sparkles,
  User
} from 'lucide-react'
import { motion } from 'framer-motion'
import type { CampaignLeaderboard, ReferralCampaign } from '@/types/referral-campaign'
import { fadeVariants, staggerContainer, staggerItem } from '@/lib/animations'

interface CampaignLeaderboardProps {
  campaigns: ReferralCampaign[]
  selectedCampaignId?: string
  detailed?: boolean
  limit?: number
}

export function CampaignLeaderboard({ 
  campaigns,
  selectedCampaignId,
  detailed = false, 
  limit = detailed ? 50 : 10 
}: CampaignLeaderboardProps) {
  const t = useTranslations('rankings')
  const [currentCampaignId, setCurrentCampaignId] = useState(selectedCampaignId || campaigns[0]?.id || '')
  const [selectedTab, setSelectedTab] = useState('individual')
  const [sortBy, setSortBy] = useState<'referrals' | 'conversions' | 'points' | 'tier_progress'>('points')
  const [filterTier, setFilterTier] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const currentCampaign = campaigns.find(c => c.id === currentCampaignId)

  // Mock leaderboard data extending existing leaderboard patterns
  const [leaderboardData, setLeaderboardData] = useState<CampaignLeaderboard>({
    campaign_id: 'camp1',
    campaign_title: 'Back to School 2024 Referral Drive',
    individual_rankings: [
      {
        participant_id: 'teacher1',
        participant_name: 'Sarah Johnson',
        participant_type: 'teacher',
        rank: 1,
        total_referrals: 8,
        successful_conversions: 6,
        conversion_rate: 75.0,
        campaign_points: 820,
        current_tier: 'gold',
        tier_progress: 75,
        recent_achievements: ['mentor_leader', 'collaboration_expert', 'conversion_master']
      },
      {
        participant_id: 'student2',
        participant_name: 'Malika Nazarova',
        participant_type: 'student',
        rank: 2,
        total_referrals: 5,
        successful_conversions: 5,
        conversion_rate: 100.0,
        campaign_points: 520,
        current_tier: 'gold',
        tier_progress: 100,
        recent_achievements: ['first_referrer', 'overachiever', 'perfect_conversion']
      },
      {
        participant_id: 'student1',
        participant_name: 'Ali Karimov',
        participant_type: 'student',
        rank: 3,
        total_referrals: 3,
        successful_conversions: 2,
        conversion_rate: 66.7,
        campaign_points: 385,
        current_tier: 'silver',
        tier_progress: 60,
        recent_achievements: ['first_referrer', 'team_player']
      },
      {
        participant_id: 'teacher2',
        participant_name: 'Jasur Rakhimov',
        participant_type: 'teacher',
        rank: 4,
        total_referrals: 4,
        successful_conversions: 2,
        conversion_rate: 50.0,
        campaign_points: 340,
        current_tier: 'silver',
        tier_progress: 45,
        recent_achievements: ['first_referrer', 'steady_progress']
      },
      {
        participant_id: 'student3',
        participant_name: 'Dilshod Abdullaev',
        participant_type: 'student',
        rank: 5,
        total_referrals: 2,
        successful_conversions: 1,
        conversion_rate: 50.0,
        campaign_points: 180,
        current_tier: 'bronze',
        tier_progress: 30,
        recent_achievements: ['first_referrer']
      },
      {
        participant_id: 'student4',
        participant_name: 'Kamila Saidova',
        participant_type: 'student',
        rank: 6,
        total_referrals: 1,
        successful_conversions: 1,
        conversion_rate: 100.0,
        campaign_points: 120,
        current_tier: 'bronze',
        tier_progress: 20,
        recent_achievements: ['first_referrer', 'perfect_start']
      }
    ],
    team_rankings: [
      {
        team_id: 'team1',
        team_name: 'Academic Ambassadors',
        rank: 1,
        team_members: [
          { user_id: 'student1', user_name: 'Ali Karimov', user_type: 'student' },
          { user_id: 'teacher1', user_name: 'Sarah Johnson', user_type: 'teacher' }
        ],
        combined_referrals: 11,
        team_conversion_rate: 72.7,
        collaboration_score: 85,
        team_points: 1205,
        team_achievements: ['perfect_collaboration', 'cross_type_excellence', 'leadership_duo']
      },
      {
        team_id: 'team2',
        team_name: 'Growth Champions',
        rank: 2,
        team_members: [
          { user_id: 'student2', user_name: 'Malika Nazarova', user_type: 'student' },
          { user_id: 'teacher2', user_name: 'Jasur Rakhimov', user_type: 'teacher' },
          { user_id: 'student3', user_name: 'Dilshod Abdullaev', user_type: 'student' }
        ],
        combined_referrals: 11,
        team_conversion_rate: 63.6,
        collaboration_score: 78,
        team_points: 1040,
        team_achievements: ['triple_team', 'steady_growth']
      },
      {
        team_id: 'team3',
        team_name: 'Solo Stars',
        rank: 3,
        team_members: [
          { user_id: 'student4', user_name: 'Kamila Saidova', user_type: 'student' }
        ],
        combined_referrals: 1,
        team_conversion_rate: 100.0,
        collaboration_score: 50,
        team_points: 120,
        team_achievements: ['solo_excellence']
      }
    ],
    campaign_stats: {
      total_participants: 6,
      total_referrals: 23,
      total_conversions: 17,
      overall_conversion_rate: 73.9,
      days_remaining: 45,
      top_performers_by_tier: [
        { tier: 'platinum', participant_name: 'None yet', achievement: 'Awaiting first platinum' },
        { tier: 'gold', participant_name: 'Sarah Johnson', achievement: 'Mentor Leader' },
        { tier: 'silver', participant_name: 'Ali Karimov', achievement: 'Team Player' },
        { tier: 'bronze', participant_name: 'Kamila Saidova', achievement: 'Perfect Start' }
      ]
    }
  })

  const filteredIndividualRankings = leaderboardData.individual_rankings
    .filter(participant => {
      const matchesTier = filterTier === 'all' || participant.current_tier === filterTier
      const matchesSearch = searchTerm === '' || 
        participant.participant_name.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesTier && matchesSearch
    })
    .sort((a, b) => {
      if (sortBy === 'referrals') return b.total_referrals - a.total_referrals
      if (sortBy === 'conversions') return b.successful_conversions - a.successful_conversions
      if (sortBy === 'points') return b.campaign_points - a.campaign_points
      if (sortBy === 'tier_progress') return b.tier_progress - a.tier_progress
      return a.rank - b.rank
    })
    .slice(0, limit)

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-4 w-4 text-yellow-500" />
    if (rank === 2) return <Medal className="h-4 w-4 text-gray-400" />
    if (rank === 3) return <Award className="h-4 w-4 text-amber-600" />
    return <span className="text-sm font-medium text-muted-foreground">#{rank}</span>
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'gold': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'silver': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'bronze': return 'bg-amber-100 text-amber-800 border-amber-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'platinum': return <Crown className="h-3 w-3" />
      case 'gold': return <Trophy className="h-3 w-3" />
      case 'silver': return <Star className="h-3 w-3" />
      case 'bronze': return <Award className="h-3 w-3" />
      default: return <Target className="h-3 w-3" />
    }
  }

  if (!currentCampaign) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Campaign Selected</h3>
          <p className="text-muted-foreground">
            Select a campaign to view its leaderboard.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      variants={fadeVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Campaign Selection and Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Campaign Leaderboard
                <Badge variant="outline" className="ml-2">
                  {leaderboardData.campaign_stats.total_participants} participants
                </Badge>
              </CardTitle>
              <CardDescription>
                Real-time campaign rankings using existing leaderboard infrastructure
              </CardDescription>
            </div>
            
            {campaigns.length > 1 && (
              <div className="flex items-center gap-2">
                <Select value={currentCampaignId} onValueChange={setCurrentCampaignId}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Campaign Statistics */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-600">{leaderboardData.campaign_stats.total_referrals}</div>
              <div className="text-sm text-muted-foreground">Total Referrals</div>
            </div>
            <UserCheck className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-600">{leaderboardData.campaign_stats.total_conversions}</div>
              <div className="text-sm text-muted-foreground">Conversions</div>
            </div>
            <Target className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-purple-600">{leaderboardData.campaign_stats.overall_conversion_rate.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Conversion Rate</div>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-orange-600">{leaderboardData.campaign_stats.days_remaining}</div>
              <div className="text-sm text-muted-foreground">Days Remaining</div>
            </div>
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-indigo-600">{leaderboardData.team_rankings?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Active Teams</div>
            </div>
            <Users className="h-8 w-8 text-indigo-500" />
          </div>
        </Card>
      </div>

      {/* Leaderboard Tabs */}
      <Card>
        <CardHeader>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <div className="flex items-center justify-between">
              <TabsList className="grid w-fit grid-cols-2">
                <TabsTrigger value="individual">Individual Rankings</TabsTrigger>
                <TabsTrigger value="team">Team Rankings</TabsTrigger>
              </TabsList>

              {detailed && selectedTab === 'individual' && (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search participants..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-[200px]"
                    />
                  </div>
                  <Select value={filterTier} onValueChange={setFilterTier}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tiers</SelectItem>
                      <SelectItem value="platinum">Platinum</SelectItem>
                      <SelectItem value="gold">Gold</SelectItem>
                      <SelectItem value="silver">Silver</SelectItem>
                      <SelectItem value="bronze">Bronze</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="points">Sort by Points</SelectItem>
                      <SelectItem value="referrals">Sort by Referrals</SelectItem>
                      <SelectItem value="conversions">Sort by Conversions</SelectItem>
                      <SelectItem value="tier_progress">Sort by Progress</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <TabsContent value="individual" className="space-y-4 mt-4">
              <motion.div variants={staggerContainer} className="space-y-4">
                {filteredIndividualRankings.map((participant, index) => {
                  const displayRank = index + 1
                  const isTeacher = participant.participant_type === 'teacher'
                  
                  return (
                    <motion.div
                      key={participant.participant_id}
                      variants={staggerItem}
                      custom={index}
                      className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      {/* Rank */}
                      <div className="flex items-center justify-center w-10 h-10">
                        {getRankIcon(displayRank)}
                      </div>

                      {/* Avatar */}
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={`/api/avatars/${participant.participant_id}`} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {participant.participant_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>

                      {/* Participant Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium truncate">{participant.participant_name}</h3>
                          <Badge 
                            variant={isTeacher ? 'secondary' : 'outline'}
                            className="text-xs"
                          >
                            {isTeacher ? (
                              <UserCheck className="h-3 w-3 mr-1" />
                            ) : (
                              <User className="h-3 w-3 mr-1" />
                            )}
                            {participant.participant_type}
                          </Badge>
                          <Badge className={`text-xs ${getTierColor(participant.current_tier)}`}>
                            {getTierIcon(participant.current_tier)}
                            <span className="ml-1 capitalize">{participant.current_tier}</span>
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <UserCheck className="h-3 w-3" />
                            {participant.total_referrals} referrals
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {participant.successful_conversions} conversions
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {participant.conversion_rate.toFixed(1)}% rate
                          </span>
                        </div>

                        {/* Tier Progress bar */}
                        {detailed && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                              <span>Tier Progress</span>
                              <span>{participant.tier_progress}%</span>
                            </div>
                            <Progress 
                              value={participant.tier_progress}
                              className="h-2"
                            />
                          </div>
                        )}

                        {/* Recent Achievements */}
                        {detailed && participant.recent_achievements.length > 0 && (
                          <div className="mt-2 flex gap-1 flex-wrap">
                            {participant.recent_achievements.slice(0, 2).map((achievement) => (
                              <Badge key={achievement} variant="outline" className="text-xs">
                                <Star className="h-2 w-2 mr-1" />
                                {achievement.replace('_', ' ')}
                              </Badge>
                            ))}
                            {participant.recent_achievements.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{participant.recent_achievements.length - 2} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Points Display */}
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">
                          {participant.campaign_points.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          campaign points
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>

              {filteredIndividualRankings.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No participants found</p>
                  <p className="text-sm">Try adjusting your filters to see more results.</p>
                </div>
              )}

              {!detailed && filteredIndividualRankings.length > 0 && (
                <div className="text-center pt-4 border-t">
                  <Button variant="outline" size="sm">
                    View Full Leaderboard
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="team" className="space-y-4 mt-4">
              {leaderboardData.team_rankings && leaderboardData.team_rankings.length > 0 ? (
                <motion.div variants={staggerContainer} className="space-y-4">
                  {leaderboardData.team_rankings.map((team, index) => (
                    <motion.div
                      key={team.team_id}
                      variants={staggerItem}
                      custom={index}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10">
                            {getRankIcon(team.rank)}
                          </div>
                          <div>
                            <h3 className="font-semibold">{team.team_name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {team.team_members.length} member{team.team_members.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary">
                            {team.team_points.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">team points</div>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-4 mb-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">Combined Referrals</Label>
                          <div className="text-sm font-medium mt-1">{team.combined_referrals}</div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Conversion Rate</Label>
                          <div className="text-sm font-medium mt-1">{team.team_conversion_rate.toFixed(1)}%</div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Collaboration Score</Label>
                          <div className="text-sm font-medium mt-1">{team.collaboration_score}/100</div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Team Progress</Label>
                          <Progress value={team.collaboration_score} className="mt-1" />
                        </div>
                      </div>

                      {/* Team Members */}
                      <div className="mb-3">
                        <Label className="text-xs text-muted-foreground">Team Members</Label>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {team.team_members.map((member) => (
                            <div key={member.user_id} className="flex items-center gap-2 p-2 border rounded bg-muted/50">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {member.user_name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{member.user_name}</span>
                              <Badge variant="outline" className="text-xs">
                                {member.user_type}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Team Achievements */}
                      {team.team_achievements.length > 0 && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Team Achievements</Label>
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {team.team_achievements.map((achievement) => (
                              <Badge key={achievement} className="bg-purple-100 text-purple-800 text-xs">
                                <Trophy className="h-2 w-2 mr-1" />
                                {achievement.replace('_', ' ')}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No Teams Yet</p>
                  <p className="text-sm">Teams will appear here when participants form collaborations.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>

      {/* Top Performers by Tier */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Top Performers by Tier
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {leaderboardData.campaign_stats.top_performers_by_tier.map((performer) => (
              <div key={performer.tier} className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={`${getTierColor(performer.tier)} capitalize`}>
                    {getTierIcon(performer.tier)}
                    <span className="ml-1">{performer.tier}</span>
                  </Badge>
                </div>
                <div className="text-sm font-medium">{performer.participant_name}</div>
                <div className="text-xs text-muted-foreground">{performer.achievement}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Helper type for Label component (reusing existing pattern)
interface LabelProps {
  className?: string
  children: React.ReactNode
}

function Label({ className, children }: LabelProps) {
  return <label className={`text-sm font-medium ${className}`}>{children}</label>
}