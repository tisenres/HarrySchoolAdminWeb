'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Gift, 
  Coins, 
  Star, 
  Search, 
  ShoppingCart,
  AlertCircle,
  CheckCircle,
  History
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { rewardsService, RewardsCatalogItem, RedemptionWithDetails } from '@/lib/services/rewards-service'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

interface StudentRewardsInterfaceProps {
  studentId: string
  isReadOnly?: boolean
}

export default function StudentRewardsInterface({ studentId, isReadOnly = false }: StudentRewardsInterfaceProps) {
  const t = useTranslations('rewards')
  const { toast } = useToast()
  
  const [rewards, setRewards] = useState<RewardsCatalogItem[]>([])
  const [redemptions, setRedemptions] = useState<RedemptionWithDetails[]>([])
  const [coinBalance, setCoinBalance] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  
  // Modal states
  const [selectedReward, setSelectedReward] = useState<RewardsCatalogItem | null>(null)
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const rewardTypes = [
    { value: 'privilege', label: t('types.privilege') },
    { value: 'certificate', label: t('types.certificate') },
    { value: 'recognition', label: t('types.recognition') },
    { value: 'physical', label: t('types.physical') },
    { value: 'special', label: t('types.special') },
  ]

  const rewardCategories = [
    { value: 'general', label: t('categories.general') },
    { value: 'academic', label: t('categories.academic') },
    { value: 'behavioral', label: t('categories.behavioral') },
    { value: 'attendance', label: t('categories.attendance') },
    { value: 'special', label: t('categories.special') },
  ]

  const fetchStudentRewards = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const [eligibleRewards, balance, history] = await Promise.all([
        rewardsService.getStudentEligibleRewards(studentId),
        rewardsService.getStudentCoinBalance(studentId),
        rewardsService.getStudentRedemptionHistory(studentId, 50)
      ])
      
      setRewards(eligibleRewards)
      setCoinBalance(balance)
      setRedemptions(history)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.loadingRewards'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStudentRewards()
  }, [studentId])

  const filteredRewards = rewards.filter(reward => {
    const matchesSearch = !searchTerm || 
      reward.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reward.description && reward.description.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesType = !typeFilter || reward.reward_type === typeFilter
    const matchesCategory = !categoryFilter || reward.reward_category === categoryFilter
    
    return matchesSearch && matchesType && matchesCategory
  })

  const handleRedeemReward = async (reward: RewardsCatalogItem) => {
    if (isReadOnly) {
      toast({
        variant: 'destructive',
        title: 'Action not allowed',
        description: 'You cannot redeem rewards in read-only mode.',
      })
      return
    }

    try {
      setIsRedeeming(true)
      
      // Check eligibility one more time
      const eligibility = await rewardsService.checkRewardEligibility(studentId, reward.id)
      
      if (!eligibility.canRedeem) {
        toast({
          variant: 'destructive',
          title: t('studentView.cannotRedeem'),
          description: eligibility.reason || t('messages.rewardNotEligible'),
        })
        return
      }

      await rewardsService.createRedemption({
        reward_id: reward.id,
        student_id: studentId,
        delivery_method: 'pickup'
      })

      toast({
        title: t('messages.redemptionSubmitted'),
        description: `Your request to redeem "${reward.name}" has been submitted for approval.`,
      })

      // Refresh data
      fetchStudentRewards()
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('errors.processingRedemption'),
        description: err instanceof Error ? err.message : 'An error occurred',
      })
    } finally {
      setIsRedeeming(false)
      setSelectedReward(null)
    }
  }

  const getRewardStatusInfo = (reward: RewardsCatalogItem) => {
    if (coinBalance < reward.coin_cost) {
      return {
        canRedeem: false,
        status: t('studentView.insufficientCoins'),
        variant: 'destructive' as const,
        icon: AlertCircle
      }
    }

    // Check if already redeemed recently
    const recentRedemption = redemptions.find(r => 
      r.reward_id === reward.id && 
      r.status !== 'cancelled' && 
      r.status !== 'rejected'
    )

    if (recentRedemption) {
      return {
        canRedeem: false,
        status: `${t(`status.${recentRedemption.status}`)}`,
        variant: 'secondary' as const,
        icon: CheckCircle
      }
    }

    return {
      canRedeem: true,
      status: t('studentView.redeem'),
      variant: 'default' as const,
      icon: Gift
    }
  }

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      privilege: 'bg-blue-100 text-blue-800',
      certificate: 'bg-green-100 text-green-800',
      recognition: 'bg-purple-100 text-purple-800',
      physical: 'bg-orange-100 text-orange-800',
      special: 'bg-pink-100 text-pink-800',
    }
    
    return (
      <Badge className={colors[type] || 'bg-gray-100 text-gray-800'}>
        {t(`types.${type}`)}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading rewards...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">{error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Student Coin Balance */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{t('studentView.yourBalance')}</h3>
              <p className="text-3xl font-bold text-primary flex items-center gap-2">
                <Coins className="h-8 w-8" />
                {coinBalance} {t('studentView.coins')}
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-2"
            >
              <History className="h-4 w-4" />
              {t('studentView.redemptionHistory')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            {t('studentView.browseRewards')}
          </CardTitle>
          <CardDescription>
            Redeem your earned coins for exciting rewards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search rewards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={t('filters.type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('filters.all')}</SelectItem>
                {rewardTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={t('filters.category')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('filters.all')}</SelectItem>
                {rewardCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Rewards Grid */}
          {filteredRewards.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || typeFilter || categoryFilter 
                ? 'No rewards match your filters'
                : t('empty.noEligibleRewards')
              }
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredRewards.map((reward) => {
                const statusInfo = getRewardStatusInfo(reward)
                const StatusIcon = statusInfo.icon
                
                return (
                  <Card key={reward.id} className="relative overflow-hidden">
                    {reward.is_featured && (
                      <div className="absolute top-2 right-2">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      </div>
                    )}
                    
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Reward Image Placeholder */}
                        {reward.image_url ? (
                          <img 
                            src={reward.image_url} 
                            alt={reward.name}
                            className="w-full h-32 object-cover rounded-md"
                          />
                        ) : (
                          <div className="w-full h-32 bg-muted rounded-md flex items-center justify-center">
                            <Gift className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}

                        {/* Reward Info */}
                        <div>
                          <h4 className="font-semibold">{reward.name}</h4>
                          {reward.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {reward.description}
                            </p>
                          )}
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-2">
                          {getTypeBadge(reward.reward_type)}
                          <Badge variant="outline">
                            {t(`categories.${reward.reward_category || 'general'}`)}
                          </Badge>
                        </div>

                        {/* Cost */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-lg font-bold">
                            <Coins className="h-4 w-4" />
                            {reward.coin_cost}
                          </div>
                          
                          <Button
                            size="sm"
                            variant={statusInfo.variant}
                            disabled={!statusInfo.canRedeem || isReadOnly}
                            onClick={() => statusInfo.canRedeem && setSelectedReward(reward)}
                            className="flex items-center gap-1"
                          >
                            <StatusIcon className="h-3 w-3" />
                            {statusInfo.status}
                          </Button>
                        </div>

                        {/* Terms */}
                        {reward.terms_conditions && (
                          <details className="text-xs text-muted-foreground">
                            <summary className="cursor-pointer">Terms & Conditions</summary>
                            <p className="mt-1">{reward.terms_conditions}</p>
                          </details>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Redemption Confirmation */}
      <AlertDialog open={!!selectedReward} onOpenChange={() => setSelectedReward(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('studentView.redeemConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedReward && (
                <>
                  You are about to redeem &quot;{selectedReward.name}&quot; for {selectedReward.coin_cost} coins.
                  {selectedReward.requires_approval && (
                    <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                      This reward requires admin approval. You will be notified when your request is processed.
                    </div>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedReward && handleRedeemReward(selectedReward)}
              disabled={isRedeeming}
              className="bg-primary hover:bg-primary/90"
            >
              {isRedeeming ? 'Redeeming...' : 'Confirm Redemption'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Redemption History Modal */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('studentView.redemptionHistory')}</DialogTitle>
            <DialogDescription>
              Your past and pending reward redemptions
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {redemptions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {t('studentView.noRedemptions')}
              </p>
            ) : (
              redemptions.map((redemption) => (
                <Card key={redemption.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">
                          {redemption.reward?.name || 'Unknown Reward'}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Redeemed on {formatDate(redemption.redeemed_at)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Cost: {redemption.coins_spent} coins
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={
                          redemption.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          redemption.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                          redemption.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {t(`status.${redemption.status}`)}
                        </Badge>
                        {redemption.approved_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Approved on {formatDate(redemption.approved_at)}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}