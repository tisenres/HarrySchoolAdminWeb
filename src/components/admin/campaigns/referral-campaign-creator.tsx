'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { 
  Target,
  Plus,
  Calendar as CalendarIcon,
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
  Edit,
  Share,
  MessageSquare,
  Bell,
  Search,
  Filter,
  BarChart3,
  Zap,
  AlertTriangle,
  Info,
  UserPlus,
  Sparkles,
  Gift,
  Calendar2,
  Settings,
  Copy
} from 'lucide-react'
import { format } from 'date-fns'
import type { ReferralCampaign, ReferralCampaignTemplate, CampaignTier, CampaignMilestone } from '@/types/referral-campaign'

// Campaign templates extending existing goal template patterns
const CAMPAIGN_TEMPLATES: ReferralCampaignTemplate[] = [
  {
    id: 'template-back-to-school',
    template_name: 'Back to School Referral Drive',
    template_description: 'Annual back-to-school campaign with tiered rewards and team challenges',
    template_category: 'seasonal',
    default_settings: {
      duration_days: 30,
      target_participants: 100,
      tier_structure: [
        {
          tier: 'bronze',
          requirements: { min_referrals: 1 },
          rewards: { point_multiplier: 1.2, coin_multiplier: 1.1, achievement_unlocks: [], special_privileges: [] },
          tier_achievement_id: 'ach-bronze-referrer'
        },
        {
          tier: 'silver',
          requirements: { min_referrals: 3, min_conversion_rate: 0.5 },
          rewards: { point_multiplier: 1.5, coin_multiplier: 1.3, achievement_unlocks: [], special_privileges: [] },
          tier_achievement_id: 'ach-silver-referrer'
        },
        {
          tier: 'gold',
          requirements: { min_referrals: 5, min_conversion_rate: 0.6 },
          rewards: { point_multiplier: 2.0, coin_multiplier: 1.5, achievement_unlocks: [], special_privileges: [] },
          tier_achievement_id: 'ach-gold-referrer'
        },
        {
          tier: 'platinum',
          requirements: { min_referrals: 8, min_conversion_rate: 0.7 },
          rewards: { point_multiplier: 3.0, coin_multiplier: 2.0, achievement_unlocks: [], special_privileges: [] },
          tier_achievement_id: 'ach-platinum-referrer'
        }
      ],
      milestone_template: [
        {
          id: 'milestone-first-referral',
          title: 'First Referral',
          description: 'Submit your first referral to join the campaign',
          requirements: { referral_count: 1 },
          rewards: { points: 50, coins: 10 },
          completion_celebration: {
            notification_message: 'Welcome to the Back to School campaign!',
            leaderboard_highlight: true,
            team_announcement: false
          }
        }
      ],
      achievement_templates: []
    },
    customizable_elements: {
      campaign_title: true,
      duration: true,
      tier_requirements: true,
      reward_amounts: true,
      achievement_criteria: true
    },
    template_effectiveness: {
      average_participation_rate: 75.2,
      average_completion_rate: 68.5,
      successful_deployments: 12,
      average_roi: 2.4
    },
    created_by: 'admin',
    created_at: new Date('2024-01-15'),
    last_used: new Date('2024-09-01'),
    usage_count: 12,
    template_status: 'active'
  },
  {
    id: 'template-summer-boost',
    template_name: 'Summer Enrollment Boost',
    template_description: 'High-energy summer campaign with weekly challenges and instant rewards',
    template_category: 'seasonal',
    default_settings: {
      duration_days: 60,
      target_participants: 75,
      tier_structure: [
        {
          tier: 'bronze',
          requirements: { min_referrals: 2 },
          rewards: { point_multiplier: 1.3, coin_multiplier: 1.2, achievement_unlocks: [], special_privileges: [] },
          tier_achievement_id: 'ach-summer-bronze'
        },
        {
          tier: 'silver',
          requirements: { min_referrals: 4, min_conversion_rate: 0.5 },
          rewards: { point_multiplier: 1.7, coin_multiplier: 1.4, achievement_unlocks: [], special_privileges: [] },
          tier_achievement_id: 'ach-summer-silver'
        },
        {
          tier: 'gold',
          requirements: { min_referrals: 7, min_conversion_rate: 0.6 },
          rewards: { point_multiplier: 2.2, coin_multiplier: 1.7, achievement_unlocks: [], special_privileges: [] },
          tier_achievement_id: 'ach-summer-gold'
        }
      ],
      milestone_template: [
        {
          id: 'milestone-summer-kickoff',
          title: 'Summer Kickoff',
          description: 'Get started with your first summer referral',
          requirements: { referral_count: 1 },
          rewards: { points: 75, coins: 15 },
          completion_celebration: {
            notification_message: 'Summer campaign started! Keep the momentum going!',
            leaderboard_highlight: true,
            team_announcement: true
          }
        }
      ],
      achievement_templates: []
    },
    customizable_elements: {
      campaign_title: true,
      duration: true,
      tier_requirements: true,
      reward_amounts: true,
      achievement_criteria: true
    },
    template_effectiveness: {
      average_participation_rate: 82.1,
      average_completion_rate: 71.3,
      successful_deployments: 8,
      average_roi: 2.8
    },
    created_by: 'admin',
    created_at: new Date('2024-03-01'),
    last_used: new Date('2024-06-01'),
    usage_count: 8,
    template_status: 'active'
  },
  {
    id: 'template-team-challenge',
    template_name: 'Cross-Department Team Challenge',
    template_description: 'Collaborative campaign encouraging teachers and students to work together',
    template_category: 'department_specific',
    default_settings: {
      duration_days: 45,
      target_participants: 50,
      tier_structure: [
        {
          tier: 'bronze',
          requirements: { min_referrals: 1, min_team_participation: 0.3 },
          rewards: { point_multiplier: 1.4, coin_multiplier: 1.3, achievement_unlocks: [], special_privileges: [] },
          tier_achievement_id: 'ach-team-bronze'
        },
        {
          tier: 'silver',
          requirements: { min_referrals: 3, min_team_participation: 0.5 },
          rewards: { point_multiplier: 1.8, coin_multiplier: 1.5, achievement_unlocks: [], special_privileges: [] },
          tier_achievement_id: 'ach-team-silver'
        },
        {
          tier: 'gold',
          requirements: { min_referrals: 5, min_team_participation: 0.7 },
          rewards: { point_multiplier: 2.5, coin_multiplier: 2.0, achievement_unlocks: [], special_privileges: [] },
          tier_achievement_id: 'ach-team-gold'
        }
      ],
      milestone_template: [
        {
          id: 'milestone-team-formation',
          title: 'Team Formation',
          description: 'Join or create a team for collaborative referrals',
          requirements: { team_collaboration_score: 10 },
          rewards: { points: 100, coins: 20 },
          completion_celebration: {
            notification_message: 'Team formed! Collaborate for maximum impact!',
            leaderboard_highlight: true,
            team_announcement: true
          }
        }
      ],
      achievement_templates: []
    },
    customizable_elements: {
      campaign_title: true,
      duration: true,
      tier_requirements: true,
      reward_amounts: true,
      achievement_criteria: true
    },
    template_effectiveness: {
      average_participation_rate: 67.8,
      average_completion_rate: 85.2,
      successful_deployments: 15,
      average_roi: 3.1
    },
    created_by: 'admin',
    created_at: new Date('2024-02-01'),
    last_used: new Date('2024-11-15'),
    usage_count: 15,
    template_status: 'active'
  }
]

export function ReferralCampaignCreator() {
  const [campaigns, setCampaigns] = useState<ReferralCampaign[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showTemplatesDialog, setShowTemplatesDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ReferralCampaignTemplate | null>(null)
  const [selectedCampaign, setCampaign] = useState<ReferralCampaign | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('active')
  const [filterType, setFilterType] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Create campaign form state - extends existing goal creation patterns
  const [newCampaign, setNewCampaign] = useState<Partial<ReferralCampaign>>({
    campaign_type: 'seasonal',
    status: 'draft',
    visibility: 'public',
    user_type: 'student', // Default to student campaigns
    category: 'referral_campaign',
    type: 'collaborative_project',
    priority: 'medium',
    progress_percentage: 0,
    milestones: [],
    collaborators: [],
    related_goals: [],
    smart_criteria: {
      specific: '',
      measurable: [],
      achievable: '',
      relevant: '',
      time_bound: {
        start_date: new Date(),
        target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        check_in_frequency: 'weekly'
      }
    },
    campaign_settings: {
      start_date: new Date(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      tier_structure: []
    },
    campaign_rewards: {
      milestone_rewards: [],
      completion_bonus: {
        points: 500,
        coins: 100
      },
      tier_multipliers: {
        bronze: 1.2,
        silver: 1.5,
        gold: 2.0,
        platinum: 3.0
      }
    },
    linked_achievements: [],
    custom_achievements: [],
    participation_metrics: {
      registered_participants: 0,
      active_participants: 0,
      completion_rate: 0,
      total_referrals: 0,
      successful_conversions: 0,
      average_referrals_per_participant: 0
    },
    organizational_alignment: {
      school_goals: ['student_enrollment', 'community_engagement'],
      department_goals: ['referral_growth'],
      alignment_score: 85,
      contribution_description: 'Increases student enrollment through peer referrals'
    },
    performance_correlation: {
      affects_ranking: true,
      affects_compensation: false,
      point_impact: 200,
      achievement_unlocks: ['referral_champion']
    }
  })

  // Initialize with mock campaigns
  useEffect(() => {
    const mockCampaigns: ReferralCampaign[] = [
      {
        id: 'camp1',
        user_id: 'admin1',
        user_type: 'student',
        title: 'Back to School 2024 Referral Drive',
        description: 'Help us grow our community by referring new students for the upcoming academic year',
        category: 'referral_campaign',
        type: 'collaborative_project',
        campaign_type: 'back_to_school',
        smart_criteria: {
          specific: 'Increase student enrollment by 20% through peer referrals during back-to-school season',
          measurable: [
            { metric_name: 'New Referrals', current_value: 45, target_value: 100, unit: 'referrals', measurement_method: 'Campaign tracking' },
            { metric_name: 'Conversion Rate', current_value: 65, target_value: 70, unit: '%', measurement_method: 'Enrollment tracking' }
          ],
          achievable: 'Target is achievable based on previous campaign performance and current engagement levels',
          relevant: 'Directly contributes to school growth and community building objectives',
          time_bound: {
            start_date: new Date('2024-08-01'),
            target_date: new Date('2024-09-30'),
            check_in_frequency: 'weekly'
          }
        },
        priority: 'high',
        status: 'active',
        visibility: 'public',
        progress_percentage: 45,
        milestones: [],
        collaborators: [],
        created_at: new Date('2024-08-01'),
        target_date: new Date('2024-09-30'),
        last_updated: new Date('2024-08-15'),
        related_goals: [],
        campaign_settings: {
          start_date: new Date('2024-08-01'),
          end_date: new Date('2024-09-30'),
          max_participants: 150,
          enrollment_cap: 200,
          tier_structure: [
            {
              tier: 'bronze',
              requirements: { min_referrals: 1 },
              rewards: { point_multiplier: 1.2, coin_multiplier: 1.1, achievement_unlocks: [], special_privileges: [] },
              tier_achievement_id: 'ach-bronze-referrer'
            },
            {
              tier: 'silver',
              requirements: { min_referrals: 3, min_conversion_rate: 0.5 },
              rewards: { point_multiplier: 1.5, coin_multiplier: 1.3, achievement_unlocks: [], special_privileges: [] },
              tier_achievement_id: 'ach-silver-referrer'
            }
          ]
        },
        campaign_rewards: {
          milestone_rewards: [],
          completion_bonus: {
            points: 500,
            coins: 100
          },
          tier_multipliers: {
            bronze: 1.2,
            silver: 1.5,
            gold: 2.0,
            platinum: 3.0
          }
        },
        linked_achievements: ['referral_champion', 'community_builder'],
        custom_achievements: [],
        participation_metrics: {
          registered_participants: 78,
          active_participants: 65,
          completion_rate: 23.1,
          total_referrals: 45,
          successful_conversions: 29,
          average_referrals_per_participant: 0.58
        },
        organizational_alignment: {
          school_goals: ['student_enrollment', 'community_engagement'],
          department_goals: ['referral_growth'],
          alignment_score: 92,
          contribution_description: 'Primary driver for fall enrollment growth through peer referrals'
        },
        performance_correlation: {
          affects_ranking: true,
          affects_compensation: false,
          point_impact: 300,
          achievement_unlocks: ['referral_champion', 'enrollment_advocate']
        },
        requires_approval: true,
        approved_by: 'admin1',
        approval_notes: 'Approved for high-impact enrollment drive with enhanced rewards'
      }
    ]
    setCampaigns(mockCampaigns)
  }, [])

  const handleTemplateSelect = (template: ReferralCampaignTemplate) => {
    setSelectedTemplate(template)
    setNewCampaign(prev => ({
      ...prev,
      title: template.template_name,
      description: template.template_description,
      campaign_type: template.default_settings.duration_days === 30 ? 'back_to_school' : 'summer_special',
      smart_criteria: {
        ...prev.smart_criteria!,
        specific: `Campaign based on ${template.template_name} template`,
        target_date: new Date(Date.now() + template.default_settings.duration_days * 24 * 60 * 60 * 1000)
      },
      campaign_settings: {
        ...prev.campaign_settings!,
        end_date: new Date(Date.now() + template.default_settings.duration_days * 24 * 60 * 60 * 1000),
        max_participants: template.default_settings.target_participants,
        tier_structure: template.default_settings.tier_structure
      },
      campaign_rewards: {
        ...prev.campaign_rewards!,
        milestone_rewards: template.default_settings.milestone_template
      }
    }))
  }

  const handleCreateCampaign = () => {
    const campaignId = `camp${Date.now()}`
    const campaign: ReferralCampaign = {
      id: campaignId,
      user_id: 'admin1',
      user_type: newCampaign.user_type!,
      title: newCampaign.title!,
      description: newCampaign.description!,
      category: 'referral_campaign',
      type: 'collaborative_project',
      campaign_type: newCampaign.campaign_type!,
      smart_criteria: newCampaign.smart_criteria!,
      priority: newCampaign.priority!,
      status: newCampaign.status!,
      visibility: newCampaign.visibility!,
      progress_percentage: 0,
      milestones: [],
      collaborators: [],
      created_at: new Date(),
      target_date: newCampaign.smart_criteria!.time_bound.target_date,
      last_updated: new Date(),
      related_goals: [],
      campaign_settings: newCampaign.campaign_settings!,
      campaign_rewards: newCampaign.campaign_rewards!,
      linked_achievements: newCampaign.linked_achievements!,
      custom_achievements: newCampaign.custom_achievements!,
      participation_metrics: newCampaign.participation_metrics!,
      organizational_alignment: newCampaign.organizational_alignment!,
      performance_correlation: newCampaign.performance_correlation!,
      requires_approval: newCampaign.performance_correlation!.point_impact > 200
    }

    setCampaigns(prev => [campaign, ...prev])
    setShowCreateDialog(false)
    setSelectedTemplate(null)
    
    // Reset form
    setNewCampaign({
      campaign_type: 'seasonal',
      status: 'draft',
      visibility: 'public'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCampaignTypeIcon = (type: string) => {
    switch (type) {
      case 'back_to_school': return <Calendar2 className="h-4 w-4" />
      case 'summer_special': return <Sparkles className="h-4 w-4" />
      case 'limited_time': return <Clock className="h-4 w-4" />
      case 'tier_based': return <Crown className="h-4 w-4" />
      case 'group_challenge': return <Users className="h-4 w-4" />
      default: return <Target className="h-4 w-4" />
    }
  }

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesStatus = filterStatus === 'all' || campaign.status === filterStatus
    const matchesType = filterType === 'all' || campaign.campaign_type === filterType
    const matchesSearch = searchTerm === '' || 
      campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesType && matchesSearch
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Referral Campaign Creator
              </CardTitle>
              <CardDescription>
                Create and manage referral campaigns using existing goal templates and achievement systems
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowTemplatesDialog(true)}>
                <Copy className="h-4 w-4 mr-2" />
                Templates
              </Button>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Campaign Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {campaigns.filter(c => c.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {campaigns.reduce((sum, c) => sum + c.participation_metrics.registered_participants, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Across all campaigns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {campaigns.reduce((sum, c) => sum + c.participation_metrics.total_referrals, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Generated this period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {Math.round(campaigns.reduce((sum, c) => sum + c.participation_metrics.successful_conversions, 0) / 
               Math.max(1, campaigns.reduce((sum, c) => sum + c.participation_metrics.total_referrals, 0)) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">Overall success rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List with Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Campaign Overview
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="back_to_school">Back to School</SelectItem>
                  <SelectItem value="summer_special">Summer Special</SelectItem>
                  <SelectItem value="limited_time">Limited Time</SelectItem>
                  <SelectItem value="tier_based">Tier Based</SelectItem>
                  <SelectItem value="group_challenge">Group Challenge</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Campaigns List */}
          <div className="space-y-4">
            {filteredCampaigns.map((campaign) => (
              <div key={campaign.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                      {getCampaignTypeIcon(campaign.campaign_type)}
                    </div>
                    <div>
                      <h4 className="font-semibold">{campaign.title}</h4>
                      <p className="text-sm text-muted-foreground">{campaign.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {campaign.campaign_type.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4 mb-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Progress</Label>
                    <div className="mt-1">
                      <Progress value={campaign.progress_percentage} className="mb-1" />
                      <div className="text-sm font-medium">{campaign.progress_percentage}% complete</div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Participants</Label>
                    <div className="text-sm font-medium mt-1">
                      {campaign.participation_metrics.active_participants} / {campaign.participation_metrics.registered_participants}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Referrals</Label>
                    <div className="text-sm font-medium mt-1">
                      {campaign.participation_metrics.total_referrals} ({campaign.participation_metrics.successful_conversions} converted)
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">End Date</Label>
                    <div className="text-sm font-medium mt-1">
                      {format(campaign.target_date, 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Created: {format(campaign.created_at, 'MMM dd')}</span>
                    <span>Type: {campaign.campaign_type.replace('_', ' ')}</span>
                    {campaign.organizational_alignment.alignment_score > 0 && (
                      <span>Alignment: {campaign.organizational_alignment.alignment_score}%</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {filteredCampaigns.length === 0 && (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No campaigns found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || filterStatus !== 'all' || filterType !== 'all'
                    ? 'Try adjusting your filters to see more results.'
                    : 'Create your first referral campaign to get started.'}
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Campaign Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Referral Campaign
            </DialogTitle>
            <DialogDescription>
              Use existing goal templates and achievement patterns to create engaging referral campaigns
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="settings">Campaign Settings</TabsTrigger>
              <TabsTrigger value="rewards">Rewards & Tiers</TabsTrigger>
              <TabsTrigger value="integration">Goal Integration</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              {selectedTemplate && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Copy className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Using Template: {selectedTemplate.template_name}</span>
                  </div>
                  <p className="text-sm text-blue-700">{selectedTemplate.template_description}</p>
                  <div className="mt-2 flex gap-2">
                    <Badge className="bg-blue-100 text-blue-800">
                      {selectedTemplate.template_effectiveness.average_participation_rate.toFixed(1)}% participation rate
                    </Badge>
                    <Badge className="bg-green-100 text-green-800">
                      {selectedTemplate.template_effectiveness.successful_deployments} successful uses
                    </Badge>
                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Campaign Type</Label>
                  <Select value={newCampaign.campaign_type} onValueChange={(value: any) => setNewCampaign({...newCampaign, campaign_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="back_to_school">Back to School</SelectItem>
                      <SelectItem value="summer_special">Summer Special</SelectItem>
                      <SelectItem value="limited_time">Limited Time</SelectItem>
                      <SelectItem value="tier_based">Tier Based</SelectItem>
                      <SelectItem value="group_challenge">Group Challenge</SelectItem>
                      <SelectItem value="seasonal">Seasonal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Visibility</Label>
                  <Select value={newCampaign.visibility} onValueChange={(value: any) => setNewCampaign({...newCampaign, visibility: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="invited_only">Invited Only</SelectItem>
                      <SelectItem value="department_specific">Department Specific</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Campaign Title</Label>
                <Input
                  value={newCampaign.title || ''}
                  onChange={(e) => setNewCampaign({...newCampaign, title: e.target.value})}
                  placeholder="Enter a compelling campaign title"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newCampaign.description || ''}
                  onChange={(e) => setNewCampaign({...newCampaign, description: e.target.value})}
                  placeholder="Describe the campaign goals and what participants can expect"
                  className="min-h-20"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newCampaign.campaign_settings?.start_date ? 
                          format(newCampaign.campaign_settings.start_date, 'PPP') : 
                          'Pick a date'
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newCampaign.campaign_settings?.start_date}
                        onSelect={(date) => date && setNewCampaign({
                          ...newCampaign,
                          campaign_settings: {
                            ...newCampaign.campaign_settings!,
                            start_date: date
                          }
                        })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newCampaign.campaign_settings?.end_date ? 
                          format(newCampaign.campaign_settings.end_date, 'PPP') : 
                          'Pick a date'
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newCampaign.campaign_settings?.end_date}
                        onSelect={(date) => date && setNewCampaign({
                          ...newCampaign,
                          campaign_settings: {
                            ...newCampaign.campaign_settings!,
                            end_date: date
                          }
                        })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Maximum Participants</Label>
                  <Input
                    type="number"
                    value={newCampaign.campaign_settings?.max_participants || ''}
                    onChange={(e) => setNewCampaign({
                      ...newCampaign,
                      campaign_settings: {
                        ...newCampaign.campaign_settings!,
                        max_participants: Number(e.target.value)
                      }
                    })}
                    placeholder="e.g., 100"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Enrollment Cap</Label>
                  <Input
                    type="number"
                    value={newCampaign.campaign_settings?.enrollment_cap || ''}
                    onChange={(e) => setNewCampaign({
                      ...newCampaign,
                      campaign_settings: {
                        ...newCampaign.campaign_settings!,
                        enrollment_cap: Number(e.target.value)
                      }
                    })}
                    placeholder="e.g., 200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Campaign Objectives (SMART Criteria)</Label>
                <Textarea
                  value={newCampaign.smart_criteria?.specific || ''}
                  onChange={(e) => setNewCampaign({
                    ...newCampaign,
                    smart_criteria: {
                      ...newCampaign.smart_criteria!,
                      specific: e.target.value
                    }
                  })}
                  placeholder="Define specific, measurable goals for this campaign"
                  className="min-h-16"
                />
              </div>

              <div className="space-y-2">
                <Label>Team Settings</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="allow_teams"
                      checked={!!newCampaign.campaign_settings?.team_requirements}
                      onCheckedChange={(checked) => setNewCampaign({
                        ...newCampaign,
                        campaign_settings: {
                          ...newCampaign.campaign_settings!,
                          team_requirements: checked ? {
                            min_team_size: 2,
                            max_team_size: 5,
                            allow_cross_type_teams: true
                          } : undefined
                        }
                      })}
                    />
                    <Label htmlFor="allow_teams">Enable team-based participation</Label>
                  </div>
                  
                  {newCampaign.campaign_settings?.team_requirements && (
                    <div className="grid gap-2 md:grid-cols-3 ml-6">
                      <div>
                        <Label className="text-xs">Min Team Size</Label>
                        <Input
                          type="number"
                          value={newCampaign.campaign_settings.team_requirements.min_team_size}
                          onChange={(e) => setNewCampaign({
                            ...newCampaign,
                            campaign_settings: {
                              ...newCampaign.campaign_settings!,
                              team_requirements: {
                                ...newCampaign.campaign_settings!.team_requirements!,
                                min_team_size: Number(e.target.value)
                              }
                            }
                          })}
                          min="1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Max Team Size</Label>
                        <Input
                          type="number"
                          value={newCampaign.campaign_settings.team_requirements.max_team_size}
                          onChange={(e) => setNewCampaign({
                            ...newCampaign,
                            campaign_settings: {
                              ...newCampaign.campaign_settings!,
                              team_requirements: {
                                ...newCampaign.campaign_settings!.team_requirements!,
                                max_team_size: Number(e.target.value)
                              }
                            }
                          })}
                          min="1"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="cross_type_teams"
                          checked={newCampaign.campaign_settings.team_requirements.allow_cross_type_teams}
                          onCheckedChange={(checked) => setNewCampaign({
                            ...newCampaign,
                            campaign_settings: {
                              ...newCampaign.campaign_settings!,
                              team_requirements: {
                                ...newCampaign.campaign_settings!.team_requirements!,
                                allow_cross_type_teams: !!checked
                              }
                            }
                          })}
                        />
                        <Label htmlFor="cross_type_teams" className="text-xs">Teachers + Students</Label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="rewards" className="space-y-4">
              <div className="space-y-4">
                <h4 className="font-medium">Completion Bonus</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Bonus Points</Label>
                    <Input
                      type="number"
                      value={newCampaign.campaign_rewards?.completion_bonus.points || 0}
                      onChange={(e) => setNewCampaign({
                        ...newCampaign,
                        campaign_rewards: {
                          ...newCampaign.campaign_rewards!,
                          completion_bonus: {
                            ...newCampaign.campaign_rewards!.completion_bonus,
                            points: Number(e.target.value)
                          }
                        }
                      })}
                      placeholder="Points for campaign completion"
                    />
                  </div>
                  <div>
                    <Label>Bonus Coins</Label>
                    <Input
                      type="number"
                      value={newCampaign.campaign_rewards?.completion_bonus.coins || 0}
                      onChange={(e) => setNewCampaign({
                        ...newCampaign,
                        campaign_rewards: {
                          ...newCampaign.campaign_rewards!,
                          completion_bonus: {
                            ...newCampaign.campaign_rewards!.completion_bonus,
                            coins: Number(e.target.value)
                          }
                        }
                      })}
                      placeholder="Coins for campaign completion"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Tier Multipliers</h4>
                <div className="grid gap-4 md:grid-cols-4">
                  {['bronze', 'silver', 'gold', 'platinum'].map((tier) => (
                    <div key={tier}>
                      <Label className="capitalize">{tier}</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={newCampaign.campaign_rewards?.tier_multipliers[tier as keyof typeof newCampaign.campaign_rewards.tier_multipliers] || 1}
                        onChange={(e) => setNewCampaign({
                          ...newCampaign,
                          campaign_rewards: {
                            ...newCampaign.campaign_rewards!,
                            tier_multipliers: {
                              ...newCampaign.campaign_rewards!.tier_multipliers,
                              [tier]: Number(e.target.value)
                            }
                          }
                        })}
                        placeholder="Multiplier"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="integration" className="space-y-4">
              <div className="space-y-4">
                <h4 className="font-medium">Goal Integration</h4>
                <div className="space-y-2">
                  <Label>Organizational Contribution</Label>
                  <Textarea
                    value={newCampaign.organizational_alignment?.contribution_description || ''}
                    onChange={(e) => setNewCampaign({
                      ...newCampaign,
                      organizational_alignment: {
                        ...newCampaign.organizational_alignment!,
                        contribution_description: e.target.value
                      }
                    })}
                    placeholder="Describe how this campaign contributes to school/department objectives"
                    className="min-h-16"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="affects_ranking"
                      checked={newCampaign.performance_correlation?.affects_ranking || false}
                      onCheckedChange={(checked) => setNewCampaign({
                        ...newCampaign,
                        performance_correlation: {
                          ...newCampaign.performance_correlation!,
                          affects_ranking: !!checked
                        }
                      })}
                    />
                    <Label htmlFor="affects_ranking">Affects participant ranking/performance metrics</Label>
                  </div>

                  <div className="space-y-2">
                    <Label>Point Impact</Label>
                    <Input
                      type="number"
                      value={newCampaign.performance_correlation?.point_impact || 0}
                      onChange={(e) => setNewCampaign({
                        ...newCampaign,
                        performance_correlation: {
                          ...newCampaign.performance_correlation!,
                          point_impact: Number(e.target.value)
                        }
                      })}
                      placeholder="Total points impact for campaign completion"
                    />
                    {(newCampaign.performance_correlation?.point_impact || 0) > 200 && (
                      <div className="text-xs text-orange-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        High-impact campaigns require administrative approval
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateCampaign}
              disabled={!newCampaign.title || !newCampaign.description}
            >
              Create Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Templates Dialog */}
      <Dialog open={showTemplatesDialog} onOpenChange={setShowTemplatesDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="h-5 w-5" />
              Campaign Templates
            </DialogTitle>
            <DialogDescription>
              Pre-built templates to quickly create effective referral campaigns
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {CAMPAIGN_TEMPLATES.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      handleTemplateSelect(template)
                      setShowTemplatesDialog(false)
                      setShowCreateDialog(true)
                    }}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-medium">{template.template_name}</div>
                      <div className="text-sm text-muted-foreground">{template.template_description}</div>
                    </div>
                    <Badge className={`capitalize ${
                      template.template_category === 'seasonal' ? 'bg-green-100 text-green-800' :
                      template.template_category === 'promotional' ? 'bg-blue-100 text-blue-800' :
                      template.template_category === 'department_specific' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {template.template_category.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-3 mb-3">
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <div className="font-bold text-blue-600">{template.default_settings.duration_days}</div>
                      <div className="text-xs text-blue-700">Days</div>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="font-bold text-green-600">{template.template_effectiveness.average_participation_rate.toFixed(1)}%</div>
                      <div className="text-xs text-green-700">Participation</div>
                    </div>
                    <div className="text-center p-2 bg-purple-50 rounded">
                      <div className="font-bold text-purple-600">{template.template_effectiveness.successful_deployments}</div>
                      <div className="text-xs text-purple-700">Uses</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="text-muted-foreground">
                      Last used: {format(template.last_used, 'MMM dd, yyyy')}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {template.template_effectiveness.average_completion_rate.toFixed(1)}% completion
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {template.template_effectiveness.average_roi.toFixed(1)}x ROI
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplatesDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}