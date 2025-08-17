'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Target,
  Users,
  Trophy,
  TrendingUp,
  CheckCircle2,
  Clock,
  Award,
  Star,
  Crown,
  ArrowRight,
  Eye,
  UserPlus,
  Sparkles,
  Gift,
  Calendar,
  Bell,
  Search,
  Filter,
  BarChart3,
  Zap,
  User,
  Plus,
  Minus
} from 'lucide-react'
import { format } from 'date-fns'
import type { CampaignParticipation, ReferralCampaign, CampaignReferralEntry } from '@/types/referral-campaign'
import { fadeVariants, staggerContainer, staggerItem } from '@/lib/animations'

interface CampaignParticipationTrackerProps {
  campaigns: ReferralCampaign[]
  selectedCampaignId?: string
  onCampaignSelect?: (campaignId: string) => void
}

export function CampaignParticipationTracker({
  campaigns,
  selectedCampaignId,
  onCampaignSelect
}: CampaignParticipationTrackerProps) {
  const [currentCampaignId, setCurrentCampaignId] = useState(selectedCampaignId || campaigns[0]?.id || '')
  const [filterTier, setFilterTier] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('active')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedParticipant, setSelectedParticipant] = useState<CampaignParticipation | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)

  const currentCampaign = campaigns.find(c => c.id === currentCampaignId)

  // Mock participation data - extends existing goal progress patterns
  const [participations, setParticipations] = useState<CampaignParticipation[]>([
    {
      id: 'part1',
      campaign_id: 'camp1',
      participant_id: 'student1',
      participant_type: 'student',
      participant_name: 'Ali Karimov',
      participation_goal: {
        target_referrals: 5,
        current_referrals: 3,
        progress_percentage: 60,
        milestones_completed: ['milestone-first-referral'],
        next_milestone: {
          id: 'milestone-silver-tier',
          target: 5,
          reward_points: 150,
          achievement_unlock: 'silver_referrer'
        }
      },
      team_participation: {
        team_id: 'team1',
        team_name: 'Academic Ambassadors',
        team_members: [
          { user_id: 'student1', user_name: 'Ali Karimov', user_type: 'student', contribution_score: 60 },
          { user_id: 'teacher1', user_name: 'Ms. Sarah', user_type: 'teacher', contribution_score: 85 }
        ],
        team_progress: {
          combined_referrals: 8,
          team_multiplier: 1.2,
          collaboration_bonus: 50
        }
      },
      current_tier: 'silver',
      tier_progress: {
        current_points: 180,
        points_to_next_tier: 120,
        tier_multiplier: 1.5
      },
      campaign_referrals: [
        {
          id: 'ref1',
          campaign_id: 'camp1',
          base_referral_id: 'base_ref1',
          participant_id: 'student1',
          campaign_points_awarded: 75,
          tier_multiplier_applied: 1.5,
          team_bonus_applied: 25,
          milestone_unlocked: 'first_referral',
          submitted_at: new Date('2024-08-05'),
          converted_at: new Date('2024-08-12'),
          campaign_day: 5,
          verified_by_admin: true
        },
        {
          id: 'ref2',
          campaign_id: 'camp1',
          base_referral_id: 'base_ref2',
          participant_id: 'student1',
          campaign_points_awarded: 60,
          tier_multiplier_applied: 1.2,
          team_bonus_applied: 20,
          submitted_at: new Date('2024-08-10'),
          campaign_day: 10,
          verified_by_admin: true
        }
      ],
      earned_achievements: ['first_referrer', 'team_player'],
      total_campaign_points: 385,
      total_campaign_coins: 78,
      joined_at: new Date('2024-08-01'),
      last_activity: new Date('2024-08-15'),
      completion_status: 'active'
    },
    {
      id: 'part2',
      campaign_id: 'camp1',
      participant_id: 'student2',
      participant_type: 'student',
      participant_name: 'Malika Nazarova',
      participation_goal: {
        target_referrals: 3,
        current_referrals: 5,
        progress_percentage: 100,
        milestones_completed: ['milestone-first-referral', 'milestone-silver-tier', 'milestone-overachiever'],
        next_milestone: {
          id: 'milestone-gold-tier',
          target: 8,
          reward_points: 300,
          achievement_unlock: 'gold_referrer'
        }
      },
      current_tier: 'gold',
      tier_progress: {
        current_points: 425,
        points_to_next_tier: 75,
        tier_multiplier: 2.0
      },
      campaign_referrals: [
        {
          id: 'ref3',
          campaign_id: 'camp1',
          base_referral_id: 'base_ref3',
          participant_id: 'student2',
          campaign_points_awarded: 100,
          tier_multiplier_applied: 2.0,
          milestone_unlocked: 'overachiever',
          submitted_at: new Date('2024-08-03'),
          converted_at: new Date('2024-08-08'),
          campaign_day: 3,
          verified_by_admin: true
        }
      ],
      earned_achievements: ['first_referrer', 'overachiever', 'gold_standard'],
      total_campaign_points: 520,
      total_campaign_coins: 104,
      joined_at: new Date('2024-08-01'),
      last_activity: new Date('2024-08-16'),
      completion_status: 'completed'
    },
    {
      id: 'part3',
      campaign_id: 'camp1',
      participant_id: 'teacher1',
      participant_type: 'teacher',
      participant_name: 'Sarah Johnson',
      participation_goal: {
        target_referrals: 8,
        current_referrals: 6,
        progress_percentage: 75,
        milestones_completed: ['milestone-first-referral', 'milestone-mentor-leader'],
        next_milestone: {
          id: 'milestone-platinum-mentor',
          target: 10,
          reward_points: 500,
          achievement_unlock: 'platinum_mentor'
        }
      },
      team_participation: {
        team_id: 'team1',
        team_name: 'Academic Ambassadors',
        team_members: [
          { user_id: 'student1', user_name: 'Ali Karimov', user_type: 'student', contribution_score: 60 },
          { user_id: 'teacher1', user_name: 'Sarah Johnson', user_type: 'teacher', contribution_score: 85 }
        ],
        team_progress: {
          combined_referrals: 14,
          team_multiplier: 1.3,
          collaboration_bonus: 75
        }
      },
      current_tier: 'gold',
      tier_progress: {
        current_points: 680,
        points_to_next_tier: 320,
        tier_multiplier: 2.0
      },
      campaign_referrals: [
        {
          id: 'ref4',
          campaign_id: 'camp1',
          base_referral_id: 'base_ref4',
          participant_id: 'teacher1',
          campaign_points_awarded: 150,
          tier_multiplier_applied: 2.0,
          team_bonus_applied: 50,
          milestone_unlocked: 'mentor_leader',
          submitted_at: new Date('2024-08-02'),
          converted_at: new Date('2024-08-07'),
          campaign_day: 2,
          verified_by_admin: true
        }
      ],
      earned_achievements: ['first_referrer', 'mentor_leader', 'collaboration_expert'],
      total_campaign_points: 820,
      total_campaign_coins: 164,
      joined_at: new Date('2024-08-01'),
      last_activity: new Date('2024-08-17'),
      completion_status: 'active'
    }
  ])

  // Filter participations based on current campaign
  const campaignParticipations = participations.filter(p => p.campaign_id === currentCampaignId)

  const filteredParticipations = campaignParticipations.filter(participation => {
    const matchesTier = filterTier === 'all' || participation.current_tier === filterTier
    const matchesStatus = filterStatus === 'all' || participation.completion_status === filterStatus
    const matchesSearch = searchTerm === '' || 
      participation.participant_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesTier && matchesStatus && matchesSearch
  })

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'silver': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'gold': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'platinum': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'bronze': return <Award className="h-4 w-4" />
      case 'silver': return <Star className="h-4 w-4" />
      case 'gold': return <Trophy className="h-4 w-4" />
      case 'platinum': return <Crown className="h-4 w-4" />
      default: return <Target className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'withdrawn': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleCampaignChange = (campaignId: string) => {
    setCurrentCampaignId(campaignId)
    onCampaignSelect?.(campaignId)
  }

  const getCampaignStats = () => {
    const total = campaignParticipations.length
    const active = campaignParticipations.filter(p => p.completion_status === 'active').length
    const completed = campaignParticipations.filter(p => p.completion_status === 'completed').length
    const avgProgress = campaignParticipations.reduce((sum, p) => sum + p.participation_goal.progress_percentage, 0) / total
    const totalReferrals = campaignParticipations.reduce((sum, p) => sum + p.participation_goal.current_referrals, 0)
    const totalPoints = campaignParticipations.reduce((sum, p) => sum + p.total_campaign_points, 0)

    return { total, active, completed, avgProgress, totalReferrals, totalPoints }
  }

  const stats = getCampaignStats()

  if (!currentCampaign) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Campaign Selected</h3>
          <p className="text-muted-foreground">
            Select a campaign to view participation tracking.
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
      {/* Campaign Selection and Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Users className="h-5 w-5" />
                Campaign Participation Tracker
              </CardTitle>
              <CardDescription>
                Monitor participant progress using existing goal tracking patterns
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={currentCampaignId} onValueChange={handleCampaignChange}>
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
          </div>
        </CardHeader>
      </Card>

      {/* Campaign Stats */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Registered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Finished</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.avgProgress.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">Overall</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{stats.totalReferrals}</div>
            <p className="text-xs text-muted-foreground">Generated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Points Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-600">{stats.totalPoints.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Campaign points</p>
          </CardContent>
        </Card>
      </div>

      {/* Participation List with Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Participant Progress
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search participants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={filterTier} onValueChange={setFilterTier}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="bronze">Bronze</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="platinum">Platinum</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Participants List */}
          <motion.div 
            variants={staggerContainer}
            className="space-y-4"
          >
            {filteredParticipations.map((participation, index) => (
              <motion.div
                key={participation.id}
                variants={staggerItem}
                custom={index}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedParticipant(participation)
                  setShowDetailDialog(true)
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={`/api/avatars/${participation.participant_id}`} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {participation.participant_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold">{participation.participant_name}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant={participation.participant_type === 'teacher' ? 'secondary' : 'outline'} className="text-xs">
                          {participation.participant_type === 'teacher' ? (
                            <User className="h-3 w-3 mr-1" />
                          ) : (
                            <UserPlus className="h-3 w-3 mr-1" />
                          )}
                          {participation.participant_type}
                        </Badge>
                        {participation.team_participation && (
                          <Badge variant="outline" className="text-xs">
                            <Users className="h-3 w-3 mr-1" />
                            Team: {participation.team_participation.team_name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getTierColor(participation.current_tier)}>
                      {getTierIcon(participation.current_tier)}
                      <span className="ml-1 capitalize">{participation.current_tier}</span>
                    </Badge>
                    <Badge className={getStatusColor(participation.completion_status)}>
                      {participation.completion_status}
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4 mb-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Goal Progress</Label>
                    <div className="mt-1">
                      <Progress value={participation.participation_goal.progress_percentage} className="mb-1" />
                      <div className="text-sm font-medium">
                        {participation.participation_goal.current_referrals} / {participation.participation_goal.target_referrals} referrals
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Campaign Points</Label>
                    <div className="text-sm font-medium mt-1">
                      {participation.total_campaign_points.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Next Milestone</Label>
                    <div className="text-sm font-medium mt-1">
                      {participation.participation_goal.next_milestone ? 
                        `${participation.participation_goal.next_milestone.target} referrals` :
                        'All completed'
                      }
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Tier Progress</Label>
                    <div className="text-sm font-medium mt-1">
                      {participation.tier_progress.points_to_next_tier > 0 ? 
                        `${participation.tier_progress.points_to_next_tier} to next` :
                        'Max tier reached'
                      }
                    </div>
                  </div>
                </div>

                {participation.earned_achievements.length > 0 && (
                  <div className="mb-3">
                    <Label className="text-xs text-muted-foreground">Recent Achievements</Label>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {participation.earned_achievements.slice(0, 3).map((achievement) => (
                        <Badge key={achievement} variant="outline" className="text-xs">
                          <Award className="h-3 w-3 mr-1" />
                          {achievement.replace('_', ' ')}
                        </Badge>
                      ))}
                      {participation.earned_achievements.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{participation.earned_achievements.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Joined: {format(participation.joined_at, 'MMM dd')}</span>
                    <span>Last active: {format(participation.last_activity, 'MMM dd')}</span>
                    {participation.team_participation && (
                      <span>Team contribution: {participation.team_participation.team_members.find(m => m.user_id === participation.participant_id)?.contribution_score || 0}%</span>
                    )}
                  </div>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </motion.div>
            ))}

            {filteredParticipations.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No participants found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || filterTier !== 'all' || filterStatus !== 'all'
                    ? 'Try adjusting your filters to see more results.'
                    : 'No participants have joined this campaign yet.'}
                </p>
              </div>
            )}
          </motion.div>
        </CardContent>
      </Card>

      {/* Participant Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {selectedParticipant?.participant_name} - Campaign Progress
            </DialogTitle>
            <DialogDescription>
              Detailed participation tracking and goal progress analysis
            </DialogDescription>
          </DialogHeader>

          {selectedParticipant && (
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="progress">Progress</TabsTrigger>
                <TabsTrigger value="referrals">Referrals</TabsTrigger>
                <TabsTrigger value="team">Team</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Current Tier</div>
                    <div className="flex items-center gap-2 mt-1">
                      {getTierIcon(selectedParticipant.current_tier)}
                      <span className="font-semibold capitalize">{selectedParticipant.current_tier}</span>
                      <Badge className={getTierColor(selectedParticipant.current_tier)}>
                        {selectedParticipant.tier_progress.tier_multiplier}x
                      </Badge>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Total Points</div>
                    <div className="text-lg font-semibold">{selectedParticipant.total_campaign_points.toLocaleString()}</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Goal Progress</div>
                    <div className="text-lg font-semibold">{selectedParticipant.participation_goal.progress_percentage}%</div>
                  </Card>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Achievement Gallery</h4>
                  <div className="grid gap-2 md:grid-cols-3">
                    {selectedParticipant.earned_achievements.map((achievement) => (
                      <div key={achievement} className="flex items-center gap-2 p-3 border rounded-lg">
                        <Award className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium capitalize">{achievement.replace('_', ' ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="progress" className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Goal Progress</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Referral Target</span>
                        <span className="text-sm text-muted-foreground">
                          {selectedParticipant.participation_goal.current_referrals} / {selectedParticipant.participation_goal.target_referrals}
                        </span>
                      </div>
                      <Progress value={selectedParticipant.participation_goal.progress_percentage} className="mb-1" />
                    </div>

                    {selectedParticipant.participation_goal.next_milestone && (
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h5 className="font-medium text-blue-800 mb-1">Next Milestone</h5>
                        <p className="text-sm text-blue-700 mb-2">
                          {selectedParticipant.participation_goal.next_milestone.target} referrals for {selectedParticipant.participation_goal.next_milestone.reward_points} points
                        </p>
                        {selectedParticipant.participation_goal.next_milestone.achievement_unlock && (
                          <Badge className="bg-blue-100 text-blue-800">
                            <Trophy className="h-3 w-3 mr-1" />
                            Unlocks: {selectedParticipant.participation_goal.next_milestone.achievement_unlock}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Tier Progression</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Current Tier: {selectedParticipant.current_tier}</span>
                      <span className="text-sm text-muted-foreground">
                        {selectedParticipant.tier_progress.tier_multiplier}x multiplier
                      </span>
                    </div>
                    {selectedParticipant.tier_progress.points_to_next_tier > 0 && (
                      <div>
                        <Progress 
                          value={((selectedParticipant.tier_progress.current_points) / 
                                  (selectedParticipant.tier_progress.current_points + selectedParticipant.tier_progress.points_to_next_tier)) * 100} 
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedParticipant.tier_progress.points_to_next_tier} more points to next tier
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="referrals" className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Campaign Referrals</h4>
                  <div className="space-y-3">
                    {selectedParticipant.campaign_referrals.map((referral) => (
                      <div key={referral.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-sm font-medium">
                              Campaign Day {referral.campaign_day}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              +{referral.campaign_points_awarded} pts
                            </Badge>
                            {referral.verified_by_admin && (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid gap-2 md:grid-cols-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Submitted:</span>
                            <div>{format(referral.submitted_at, 'MMM dd, HH:mm')}</div>
                          </div>
                          {referral.converted_at && (
                            <div>
                              <span className="text-muted-foreground">Converted:</span>
                              <div>{format(referral.converted_at, 'MMM dd, HH:mm')}</div>
                            </div>
                          )}
                          <div>
                            <span className="text-muted-foreground">Tier Bonus:</span>
                            <div>{referral.tier_multiplier_applied}x</div>
                          </div>
                        </div>

                        {referral.milestone_unlocked && (
                          <div className="mt-2">
                            <Badge className="bg-purple-100 text-purple-800 text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Milestone: {referral.milestone_unlocked}
                            </Badge>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="team" className="space-y-4">
                {selectedParticipant.team_participation ? (
                  <div>
                    <h4 className="font-medium mb-2">Team: {selectedParticipant.team_participation.team_name}</h4>
                    
                    <div className="grid gap-4 md:grid-cols-3 mb-4">
                      <Card className="p-3">
                        <div className="text-sm text-muted-foreground">Combined Referrals</div>
                        <div className="text-lg font-semibold">{selectedParticipant.team_participation.team_progress.combined_referrals}</div>
                      </Card>
                      <Card className="p-3">
                        <div className="text-sm text-muted-foreground">Team Multiplier</div>
                        <div className="text-lg font-semibold">{selectedParticipant.team_participation.team_progress.team_multiplier}x</div>
                      </Card>
                      <Card className="p-3">
                        <div className="text-sm text-muted-foreground">Collaboration Bonus</div>
                        <div className="text-lg font-semibold">{selectedParticipant.team_participation.team_progress.collaboration_bonus} pts</div>
                      </Card>
                    </div>

                    <div>
                      <h5 className="font-medium mb-2">Team Members</h5>
                      <div className="space-y-2">
                        {selectedParticipant.team_participation.team_members.map((member) => (
                          <div key={member.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {member.user_name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{member.user_name}</div>
                                <Badge variant="outline" className="text-xs">
                                  {member.user_type}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">{member.contribution_score}%</div>
                              <div className="text-xs text-muted-foreground">Contribution</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h5 className="font-medium mb-2">Solo Participation</h5>
                    <p className="text-muted-foreground">
                      This participant is competing individually.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}