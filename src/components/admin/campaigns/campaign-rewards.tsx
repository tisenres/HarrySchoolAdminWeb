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
  Gift,
  Trophy,
  Star,
  Crown,
  Award,
  Coins,
  Zap,
  Target,
  CheckCircle2,
  Calendar,
  User,
  Users,
  TrendingUp,
  Sparkles,
  Plus,
  Minus,
  ArrowRight,
  Eye,
  Bell,
  History,
  BarChart3
} from 'lucide-react'
import { format } from 'date-fns'
import type { 
  ReferralCampaign, 
  CampaignParticipation, 
  CampaignMilestone,
  CampaignTier
} from '@/types/referral-campaign'
import type { PointsTransaction, Achievement } from '@/types/ranking'
import { fadeVariants, staggerContainer, staggerItem } from '@/lib/animations'

interface CampaignRewardsProps {
  campaigns: ReferralCampaign[]
  selectedCampaignId?: string
  onRewardDistribute?: (campaignId: string, participantId: string, rewardData: any) => void
}

// Extended transaction interface for campaign rewards
interface CampaignRewardTransaction extends PointsTransaction {
  campaign_id: string
  campaign_title: string
  milestone_achieved?: string
  tier_unlocked?: string
  team_bonus?: number
  celebration_status: 'pending' | 'shown' | 'dismissed'
}

export function CampaignRewards({
  campaigns,
  selectedCampaignId,
  onRewardDistribute
}: CampaignRewardsProps) {
  const [currentCampaignId, setCurrentCampaignId] = useState(selectedCampaignId || campaigns[0]?.id || '')
  const [selectedTab, setSelectedTab] = useState('overview')
  const [rewardTransactions, setRewardTransactions] = useState<CampaignRewardTransaction[]>([])
  const [pendingRewards, setPendingRewards] = useState<any[]>([])
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null)
  const [showDistributeDialog, setShowDistributeDialog] = useState(false)

  const currentCampaign = campaigns.find(c => c.id === currentCampaignId)

  // Mock reward transactions extending existing points transaction patterns
  useEffect(() => {
    const mockTransactions: CampaignRewardTransaction[] = [
      {
        id: 'reward_trans_1',
        user_id: 'student1',
        organization_id: 'org1',
        points_amount: 75,
        coins_earned: 15,
        transaction_type: 'earned',
        category: 'referral_campaign',
        subcategory: 'milestone_achievement',
        reason: 'First Referral Milestone - Back to School Campaign',
        reference_type: 'campaign_milestone',
        reference_id: 'milestone_first_referral',
        awarded_by: 'system',
        created_at: new Date('2024-08-05').toISOString(),
        awarded_by_profile: {
          full_name: 'Campaign System',
          avatar_url: null
        },
        campaign_id: 'camp1',
        campaign_title: 'Back to School 2024 Referral Drive',
        milestone_achieved: 'first_referral',
        celebration_status: 'shown'
      },
      {
        id: 'reward_trans_2',
        user_id: 'student2',
        organization_id: 'org1',
        points_amount: 200,
        coins_earned: 40,
        transaction_type: 'bonus',
        category: 'referral_campaign',
        subcategory: 'tier_progression',
        reason: 'Gold Tier Achievement - Exceptional Performance',
        reference_type: 'tier_unlock',
        reference_id: 'tier_gold',
        awarded_by: 'system',
        created_at: new Date('2024-08-10').toISOString(),
        awarded_by_profile: {
          full_name: 'Campaign System',
          avatar_url: null
        },
        campaign_id: 'camp1',
        campaign_title: 'Back to School 2024 Referral Drive',
        tier_unlocked: 'gold',
        celebration_status: 'shown'
      },
      {
        id: 'reward_trans_3',
        user_id: 'teacher1',
        organization_id: 'org1',
        points_amount: 150,
        coins_earned: 30,
        transaction_type: 'earned',
        category: 'referral_campaign',
        subcategory: 'team_collaboration',
        reason: 'Team Collaboration Bonus - Academic Ambassadors',
        reference_type: 'team_achievement',
        reference_id: 'team_collab_1',
        awarded_by: 'system',
        created_at: new Date('2024-08-12').toISOString(),
        awarded_by_profile: {
          full_name: 'Campaign System',
          avatar_url: null
        },
        campaign_id: 'camp1',
        campaign_title: 'Back to School 2024 Referral Drive',
        team_bonus: 50,
        celebration_status: 'pending'
      },
      {
        id: 'reward_trans_4',
        user_id: 'student3',
        organization_id: 'org1',
        points_amount: 100,
        coins_earned: 20,
        transaction_type: 'earned',
        category: 'referral_campaign',
        subcategory: 'conversion_bonus',
        reason: 'Successful Referral Conversion - Quality Achievement',
        reference_type: 'conversion_milestone',
        reference_id: 'conversion_1',
        awarded_by: 'admin1',
        created_at: new Date('2024-08-15').toISOString(),
        awarded_by_profile: {
          full_name: 'Admin Sarah',
          avatar_url: null
        },
        campaign_id: 'camp1',
        campaign_title: 'Back to School 2024 Referral Drive',
        celebration_status: 'shown'
      }
    ]
    setRewardTransactions(mockTransactions.filter(t => t.campaign_id === currentCampaignId))
  }, [currentCampaignId])

  // Mock pending rewards that integrate with existing achievement system
  useEffect(() => {
    const mockPendingRewards = [
      {
        id: 'pending_1',
        participant_id: 'student1',
        participant_name: 'Ali Karimov',
        participant_type: 'student',
        reward_type: 'milestone',
        milestone_id: 'milestone_silver_tier',
        milestone_title: 'Silver Tier Achievement',
        points_to_award: 150,
        coins_to_award: 30,
        achievement_unlock: 'silver_referrer',
        requirements_met: true,
        auto_distribute: true,
        created_at: new Date('2024-08-16'),
        tier_multiplier: 1.5
      },
      {
        id: 'pending_2',
        participant_id: 'teacher2',
        participant_name: 'Jasur Rakhimov',
        participant_type: 'teacher',
        reward_type: 'team_achievement',
        achievement_id: 'team_mentor',
        achievement_title: 'Team Mentor Excellence',
        points_to_award: 250,
        coins_to_award: 50,
        team_bonus: 75,
        requirements_met: false,
        auto_distribute: false,
        created_at: new Date('2024-08-17'),
        pending_reason: 'Awaiting team collaboration milestone completion'
      }
    ]
    setPendingRewards(mockPendingRewards)
  }, [currentCampaignId])

  const campaignRewardStats = {
    total_distributed: rewardTransactions.reduce((sum, t) => sum + t.points_amount, 0),
    total_coins_distributed: rewardTransactions.reduce((sum, t) => sum + t.coins_earned, 0),
    pending_rewards: pendingRewards.length,
    milestone_completions: rewardTransactions.filter(t => t.subcategory === 'milestone_achievement').length,
    tier_progressions: rewardTransactions.filter(t => t.subcategory === 'tier_progression').length,
    team_bonuses: rewardTransactions.filter(t => t.team_bonus).length
  }

  const getRewardTypeIcon = (type: string) => {
    switch (type) {
      case 'milestone_achievement': return <Target className="h-4 w-4" />
      case 'tier_progression': return <Crown className="h-4 w-4" />
      case 'team_collaboration': return <Users className="h-4 w-4" />
      case 'conversion_bonus': return <TrendingUp className="h-4 w-4" />
      default: return <Gift className="h-4 w-4" />
    }
  }

  const getRewardTypeColor = (type: string) => {
    switch (type) {
      case 'milestone_achievement': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'tier_progression': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'team_collaboration': return 'bg-green-100 text-green-800 border-green-200'
      case 'conversion_bonus': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCelebrationStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Bell className="h-3 w-3 text-orange-500" />
      case 'shown': return <CheckCircle2 className="h-3 w-3 text-green-500" />
      case 'dismissed': return <Eye className="h-3 w-3 text-gray-500" />
      default: return <Bell className="h-3 w-3" />
    }
  }

  const handleDistributeReward = (rewardId: string) => {
    const reward = pendingRewards.find(r => r.id === rewardId)
    if (!reward) return

    // Create new transaction following existing points transaction pattern
    const newTransaction: CampaignRewardTransaction = {
      id: `reward_trans_${Date.now()}`,
      user_id: reward.participant_id,
      organization_id: 'org1',
      points_amount: reward.points_to_award,
      coins_earned: reward.coins_to_award,
      transaction_type: reward.team_bonus ? 'bonus' : 'earned',
      category: 'referral_campaign',
      subcategory: reward.reward_type,
      reason: `${reward.milestone_title || reward.achievement_title} - Campaign Reward`,
      reference_type: reward.milestone_id ? 'campaign_milestone' : 'campaign_achievement',
      reference_id: reward.milestone_id || reward.achievement_id,
      awarded_by: 'system',
      created_at: new Date().toISOString(),
      awarded_by_profile: {
        full_name: 'Campaign System',
        avatar_url: null
      },
      campaign_id: currentCampaignId,
      campaign_title: currentCampaign?.title || '',
      milestone_achieved: reward.milestone_id,
      tier_unlocked: reward.tier_multiplier ? getTierFromMultiplier(reward.tier_multiplier) : undefined,
      team_bonus: reward.team_bonus,
      celebration_status: 'pending'
    }

    setRewardTransactions(prev => [newTransaction, ...prev])
    setPendingRewards(prev => prev.filter(r => r.id !== rewardId))
    
    onRewardDistribute?.(currentCampaignId, reward.participant_id, {
      type: reward.reward_type,
      points: reward.points_to_award,
      coins: reward.coins_to_award,
      achievement: reward.achievement_unlock
    })
  }

  const getTierFromMultiplier = (multiplier: number): string => {
    if (multiplier >= 3.0) return 'platinum'
    if (multiplier >= 2.0) return 'gold'
    if (multiplier >= 1.5) return 'silver'
    return 'bronze'
  }

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!currentCampaign) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Gift className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Campaign Selected</h3>
          <p className="text-muted-foreground">
            Select a campaign to manage its rewards and achievement integration.
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
                <Gift className="h-5 w-5" />
                Campaign Rewards & Achievement Integration
              </CardTitle>
              <CardDescription>
                Manage rewards using existing achievement and points transaction systems
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

      {/* Reward Statistics */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card className="p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-600">{campaignRewardStats.total_distributed.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Points Distributed</div>
            </div>
            <Award className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-600">{campaignRewardStats.total_coins_distributed}</div>
              <div className="text-sm text-muted-foreground">Coins Distributed</div>
            </div>
            <Coins className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-orange-600">{campaignRewardStats.pending_rewards}</div>
              <div className="text-sm text-muted-foreground">Pending Rewards</div>
            </div>
            <Bell className="h-8 w-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-purple-600">{campaignRewardStats.milestone_completions}</div>
              <div className="text-sm text-muted-foreground">Milestones</div>
            </div>
            <Target className="h-8 w-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-indigo-600">{campaignRewardStats.tier_progressions}</div>
              <div className="text-sm text-muted-foreground">Tier Unlocks</div>
            </div>
            <Crown className="h-8 w-8 text-indigo-500" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-pink-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-pink-600">{campaignRewardStats.team_bonuses}</div>
              <div className="text-sm text-muted-foreground">Team Bonuses</div>
            </div>
            <Users className="h-8 w-8 text-pink-500" />
          </div>
        </Card>
      </div>

      {/* Rewards Management Tabs */}
      <Card>
        <CardHeader>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="pending">Pending Rewards</TabsTrigger>
              <TabsTrigger value="transactions">Transaction History</TabsTrigger>
              <TabsTrigger value="achievements">Achievement Integration</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* Campaign Reward Structure */}
              <div>
                <h4 className="font-medium mb-4">Campaign Reward Structure</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Tier Structure */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Tier Rewards</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {currentCampaign.campaign_settings.tier_structure?.map((tier) => (
                        <div key={tier.tier} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center gap-2">
                            <Badge className={`${getRewardTypeColor('tier_progression')} capitalize`}>
                              <Crown className="h-3 w-3 mr-1" />
                              {tier.tier}
                            </Badge>
                            <span className="text-sm">
                              {tier.requirements.min_referrals}+ referrals
                            </span>
                          </div>
                          <div className="text-right text-sm">
                            <div className="font-medium">{tier.rewards.point_multiplier}x points</div>
                            <div className="text-muted-foreground">{tier.rewards.coin_multiplier}x coins</div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Completion Bonus */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Completion Bonus</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <Trophy className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <div className="font-medium text-purple-800">Campaign Completion</div>
                            <div className="text-sm text-purple-600">Reach all milestones</div>
                          </div>
                        </div>
                        <div className="grid gap-2 md:grid-cols-2">
                          <div className="text-center p-2 bg-white rounded">
                            <div className="font-bold text-purple-600">
                              +{currentCampaign.campaign_rewards.completion_bonus.points}
                            </div>
                            <div className="text-xs text-purple-700">Bonus Points</div>
                          </div>
                          <div className="text-center p-2 bg-white rounded">
                            <div className="font-bold text-purple-600">
                              +{currentCampaign.campaign_rewards.completion_bonus.coins}
                            </div>
                            <div className="text-xs text-purple-700">Bonus Coins</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Recent Reward Activity */}
              <div>
                <h4 className="font-medium mb-4">Recent Reward Activity</h4>
                <div className="space-y-3">
                  {rewardTransactions.slice(0, 5).map((transaction) => (
                    <motion.div
                      key={transaction.id}
                      variants={staggerItem}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getRewardTypeColor(transaction.subcategory)}`}>
                          {getRewardTypeIcon(transaction.subcategory)}
                        </div>
                        <div>
                          <div className="font-medium">{transaction.reason}</div>
                          <div className="text-sm text-muted-foreground">
                            {transaction.awarded_by_profile?.full_name} • {formatDate(transaction.created_at)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-100 text-green-800">
                            +{transaction.points_amount} pts
                          </Badge>
                          <Badge className="bg-blue-100 text-blue-800">
                            +{transaction.coins_earned} coins
                          </Badge>
                          {getCelebrationStatusIcon(transaction.celebration_status)}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pending" className="space-y-4 mt-6">
              {pendingRewards.length > 0 ? (
                <motion.div variants={staggerContainer} className="space-y-4">
                  {pendingRewards.map((reward, index) => (
                    <motion.div
                      key={reward.id}
                      variants={staggerItem}
                      custom={index}
                      className="border rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {reward.participant_name.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{reward.participant_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {reward.milestone_title || reward.achievement_title}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {reward.participant_type}
                          </Badge>
                          <Badge className={reward.requirements_met ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                            {reward.requirements_met ? 'Ready' : 'Pending'}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-4 mb-4">
                        <div className="text-center p-2 bg-blue-50 rounded">
                          <div className="font-bold text-blue-600">+{reward.points_to_award}</div>
                          <div className="text-xs text-blue-700">Points</div>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded">
                          <div className="font-bold text-green-600">+{reward.coins_to_award}</div>
                          <div className="text-xs text-green-700">Coins</div>
                        </div>
                        {reward.team_bonus && (
                          <div className="text-center p-2 bg-purple-50 rounded">
                            <div className="font-bold text-purple-600">+{reward.team_bonus}</div>
                            <div className="text-xs text-purple-700">Team Bonus</div>
                          </div>
                        )}
                        {reward.achievement_unlock && (
                          <div className="text-center p-2 bg-yellow-50 rounded">
                            <div className="font-bold text-yellow-600">
                              <Trophy className="h-4 w-4 mx-auto" />
                            </div>
                            <div className="text-xs text-yellow-700">Achievement</div>
                          </div>
                        )}
                      </div>

                      {!reward.requirements_met && reward.pending_reason && (
                        <div className="p-3 bg-orange-50 rounded-lg border border-orange-200 mb-3">
                          <div className="text-sm text-orange-800">
                            <strong>Pending:</strong> {reward.pending_reason}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          Created: {formatDate(reward.created_at)}
                          {reward.auto_distribute && (
                            <Badge variant="outline" className="ml-2 text-xs">Auto-distribute</Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!reward.requirements_met}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </Button>
                          <Button
                            size="sm"
                            disabled={!reward.requirements_met}
                            onClick={() => handleDistributeReward(reward.id)}
                          >
                            <Gift className="h-4 w-4 mr-2" />
                            Distribute
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="text-center py-8">
                  <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Pending Rewards</h3>
                  <p className="text-muted-foreground">
                    All eligible rewards have been distributed. New rewards will appear here when milestones are achieved.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="transactions" className="space-y-4 mt-6">
              <div className="space-y-4">
                {rewardTransactions.map((transaction) => (
                  <div key={transaction.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getRewardTypeColor(transaction.subcategory)}`}>
                          {getRewardTypeIcon(transaction.subcategory)}
                        </div>
                        <div>
                          <div className="font-medium">{transaction.reason}</div>
                          <div className="text-sm text-muted-foreground">
                            Transaction ID: {transaction.id}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-green-100 text-green-800">
                            <Plus className="h-3 w-3 mr-1" />
                            {transaction.points_amount} pts
                          </Badge>
                          <Badge className="bg-blue-100 text-blue-800">
                            <Coins className="h-3 w-3 mr-1" />
                            {transaction.coins_earned} coins
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(transaction.created_at)}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-2 md:grid-cols-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Type:</span>
                        <div className="capitalize">{transaction.transaction_type}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Category:</span>
                        <div className="capitalize">{transaction.subcategory.replace('_', ' ')}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Reference:</span>
                        <div>{transaction.reference_type}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <div className="flex items-center gap-1">
                          {getCelebrationStatusIcon(transaction.celebration_status)}
                          <span className="capitalize">{transaction.celebration_status}</span>
                        </div>
                      </div>
                    </div>

                    {(transaction.milestone_achieved || transaction.tier_unlocked || transaction.team_bonus) && (
                      <div className="mt-3 p-3 bg-muted/50 rounded border-t">
                        <div className="flex gap-4 text-sm">
                          {transaction.milestone_achieved && (
                            <div>
                              <span className="text-muted-foreground">Milestone:</span>
                              <Badge variant="outline" className="ml-1 text-xs">
                                {transaction.milestone_achieved}
                              </Badge>
                            </div>
                          )}
                          {transaction.tier_unlocked && (
                            <div>
                              <span className="text-muted-foreground">Tier Unlocked:</span>
                              <Badge className={`ml-1 text-xs ${getTierColor(transaction.tier_unlocked)}`}>
                                {transaction.tier_unlocked}
                              </Badge>
                            </div>
                          )}
                          {transaction.team_bonus && (
                            <div>
                              <span className="text-muted-foreground">Team Bonus:</span>
                              <span className="ml-1 font-medium">+{transaction.team_bonus} pts</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {rewardTransactions.length === 0 && (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No Transactions Yet</h3>
                    <p className="text-muted-foreground">
                      Reward transactions will appear here as participants achieve milestones.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="achievements" className="space-y-4 mt-6">
              <div>
                <h4 className="font-medium mb-4">Campaign Achievement Integration</h4>
                
                {/* Linked Achievements */}
                <div className="mb-6">
                  <h5 className="text-sm font-medium mb-3">Linked Existing Achievements</h5>
                  <div className="grid gap-3 md:grid-cols-2">
                    {currentCampaign.linked_achievements.map((achievementId) => (
                      <div key={achievementId} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Trophy className="h-5 w-5 text-yellow-600" />
                        <div>
                          <div className="font-medium capitalize">{achievementId.replace('_', ' ')}</div>
                          <div className="text-sm text-muted-foreground">Existing achievement integration</div>
                        </div>
                        <Badge variant="outline" className="ml-auto">Active</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom Campaign Achievements */}
                <div>
                  <h5 className="text-sm font-medium mb-3">Custom Campaign Achievements</h5>
                  {currentCampaign.custom_achievements.length > 0 ? (
                    <div className="space-y-3">
                      {currentCampaign.custom_achievements.map((achievement) => (
                        <div key={achievement.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                                style={{ backgroundColor: achievement.rewards.badge_color }}
                              >
                                <Star className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="font-medium">{achievement.title}</div>
                                <div className="text-sm text-muted-foreground">{achievement.description}</div>
                              </div>
                            </div>
                            <Badge className={`${getRewardTypeColor(achievement.achievement_type)}`}>
                              {achievement.achievement_type.replace('_', ' ')}
                            </Badge>
                          </div>

                          <div className="grid gap-2 md:grid-cols-3">
                            <div className="text-center p-2 bg-green-50 rounded">
                              <div className="font-bold text-green-600">+{achievement.rewards.points}</div>
                              <div className="text-xs text-green-700">Base Points</div>
                            </div>
                            <div className="text-center p-2 bg-blue-50 rounded">
                              <div className="font-bold text-blue-600">+{achievement.campaign_rewards.campaign_points}</div>
                              <div className="text-xs text-blue-700">Campaign Bonus</div>
                            </div>
                            <div className="text-center p-2 bg-purple-50 rounded">
                              <div className="font-bold text-purple-600">
                                {achievement.campaign_rewards.tier_advancement || 'N/A'}
                              </div>
                              <div className="text-xs text-purple-700">Tier Advancement</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 border rounded-lg">
                      <Star className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                      <p className="text-sm text-muted-foreground">
                        No custom achievements defined for this campaign
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>
    </motion.div>
  )
}

// Helper function to get tier color (reusing existing pattern)
function getTierColor(tier: string) {
  switch (tier) {
    case 'platinum': return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'gold': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'silver': return 'bg-gray-100 text-gray-800 border-gray-200'
    case 'bronze': return 'bg-amber-100 text-amber-800 border-amber-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}