'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Gift,
  Star,
  Award,
  Calendar,
  Clock,
  Users,
  Loader2,
  AlertCircle,
  CheckCircle,
  Medal,
  Crown,
  Target,
  BookOpen,
  Smile,
  TrendingUp,
  Coins,
  ShoppingBag,
  Coffee,
  GamepadIcon,
  Music,
  Heart
} from 'lucide-react'
import type { RewardsCatalogItem } from '@/types/ranking'
import { modalVariants, slideInVariants, staggerVariants } from '@/lib/animations'

interface BulkRewardOperationsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedStudents: string[]
  selectedStudentNames: string[]
  onSubmit: (data: any) => Promise<void>
  loading?: boolean
}

interface BulkRewardOperation {
  operation_type: 'coin_bonus' | 'reward_redemption' | 'privilege_grant'
  reward_id?: string
  coin_amount?: number
  notes?: string
}

// Mock rewards data - in real app, this would come from API
const AVAILABLE_REWARDS: RewardsCatalogItem[] = [
  {
    id: '1',
    organization_id: 'org-1',
    name: 'Extra Break Time',
    description: '15 minutes additional break time',
    coin_cost: 25,
    reward_type: 'privilege',
    is_active: true,
    created_by: 'admin',
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  },
  {
    id: '2',
    organization_id: 'org-1',
    name: 'Homework Pass',
    description: 'Skip one homework assignment',
    coin_cost: 40,
    reward_type: 'privilege',
    is_active: true,
    created_by: 'admin',
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  },
  {
    id: '3',
    organization_id: 'org-1',
    name: 'Achievement Certificate',
    description: 'Beautiful printed certificate',
    coin_cost: 30,
    reward_type: 'certificate',
    is_active: true,
    created_by: 'admin',
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  },
  {
    id: '4',
    organization_id: 'org-1',
    name: 'Student of the Month',
    description: 'Special recognition title',
    coin_cost: 100,
    reward_type: 'recognition',
    is_active: true,
    created_by: 'admin',
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  },
  {
    id: '5',
    organization_id: 'org-1',
    name: 'Choose Activity',
    description: 'Pick the next class activity',
    coin_cost: 60,
    reward_type: 'privilege',
    is_active: true,
    created_by: 'admin',
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  }
]

const REWARD_CATEGORIES = [
  { value: 'all', label: 'All Types', icon: Gift },
  { value: 'privilege', label: 'Privileges', icon: Crown },
  { value: 'certificate', label: 'Certificates', icon: Award },
  { value: 'recognition', label: 'Recognition', icon: Star },
]

const BULK_COIN_PRESETS = [
  { amount: 10, label: 'Small Bonus', description: 'End of week bonus' },
  { amount: 25, label: 'Good Bonus', description: 'Monthly participation' },
  { amount: 50, label: 'Great Bonus', description: 'Outstanding performance' },
  { amount: 100, label: 'Excellent Bonus', description: 'Exceptional achievement' },
]

const getRewardIcon = (type: string) => {
  const icons: Record<string, any> = {
    privilege: Crown,
    certificate: Award,
    recognition: Star,
    default: Gift
  }
  return icons[type] || icons.default
}

interface BulkOperationPreview {
  totalStudents: number
  totalCoins: number
  operationType: string
  requiresApproval: boolean
  estimatedTime: number
  affectedBalances: number
}

export function BulkRewardOperations({
  open,
  onOpenChange,
  selectedStudents,
  selectedStudentNames,
  onSubmit,
  loading = false
}: BulkRewardOperationsProps) {
  const [step, setStep] = useState<'select' | 'configure' | 'preview' | 'processing'>('select')
  const [operationType, setOperationType] = useState<'coin_bonus' | 'reward_redemption' | 'privilege_grant'>('coin_bonus')
  const [selectedReward, setSelectedReward] = useState<string>('')
  const [coinAmount, setCoinAmount] = useState<number>(25)
  const [customCoinAmount, setCustomCoinAmount] = useState<string>('')
  const [useCustomAmount, setUseCustomAmount] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [notes, setNotes] = useState<string>('')
  const [reason, setReason] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processedCount, setProcessedCount] = useState(0)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setStep('select')
      setOperationType('coin_bonus')
      setSelectedReward('')
      setCoinAmount(25)
      setCustomCoinAmount('')
      setUseCustomAmount(false)
      setCategoryFilter('all')
      setNotes('')
      setReason('')
      setError('')
      setProcessingProgress(0)
      setProcessedCount(0)
    }
  }, [open])

  // Filter rewards by category
  const filteredRewards = useMemo(() => {
    if (categoryFilter === 'all') return AVAILABLE_REWARDS
    return AVAILABLE_REWARDS.filter(r => r.reward_type === categoryFilter)
  }, [categoryFilter])

  // Get selected reward details
  const rewardDetails = useMemo(() => {
    return AVAILABLE_REWARDS.find(r => r.id === selectedReward)
  }, [selectedReward])

  // Calculate operation preview
  const calculatePreview = (): BulkOperationPreview => {
    const totalStudents = selectedStudents.length
    let totalCoins = 0
    let requiresApproval = false

    switch (operationType) {
      case 'coin_bonus':
        totalCoins = coinAmount * totalStudents
        requiresApproval = coinAmount > 50 || totalCoins > 500
        break
      case 'reward_redemption':
        if (rewardDetails) {
          totalCoins = rewardDetails.coin_cost * totalStudents
          requiresApproval = rewardDetails.coin_cost > 75 || totalCoins > 800
        }
        break
      case 'privilege_grant':
        totalCoins = 0
        requiresApproval = totalStudents > 20
        break
    }

    const estimatedTime = Math.max(2, Math.ceil(totalStudents / 12)) // seconds

    return {
      totalStudents,
      totalCoins,
      operationType,
      requiresApproval,
      estimatedTime,
      affectedBalances: totalStudents
    }
  }

  const handleOperationTypeSelect = (type: 'coin_bonus' | 'reward_redemption' | 'privilege_grant') => {
    setOperationType(type)
    setError('')
    setStep('configure')
  }

  const handlePresetCoinClick = (amount: number) => {
    setCoinAmount(amount)
    setUseCustomAmount(false)
    setCustomCoinAmount('')
    setError('')
  }

  const handleCustomCoinChange = (value: string) => {
    setCustomCoinAmount(value)
    const numValue = parseInt(value)
    if (!isNaN(numValue)) {
      setCoinAmount(numValue)
      setUseCustomAmount(true)
      setError('')
    }
  }

  const handleConfigure = () => {
    setError('')

    // Validation based on operation type
    switch (operationType) {
      case 'coin_bonus':
        if (coinAmount <= 0) {
          setError('Coin amount must be greater than 0')
          return
        }
        if (coinAmount > 200) {
          setError('Coin bonus cannot exceed 200 coins per student')
          return
        }
        if (!reason.trim()) {
          setError('Please provide a reason for the coin bonus')
          return
        }
        break
      
      case 'reward_redemption':
        if (!selectedReward) {
          setError('Please select a reward to grant')
          return
        }
        break
      
      case 'privilege_grant':
        if (!selectedReward) {
          setError('Please select a privilege to grant')
          return
        }
        break
    }

    if (selectedStudents.length === 0) {
      setError('No students selected')
      return
    }

    setStep('preview')
  }

  const handleSubmit = async () => {
    setStep('processing')
    setProcessingProgress(0)
    setProcessedCount(0)

    try {
      // Simulate progress for bulk operation
      const totalStudents = selectedStudents.length
      for (let i = 0; i <= totalStudents; i++) {
        setProcessedCount(i)
        setProcessingProgress((i / totalStudents) * 100)
        await new Promise(resolve => setTimeout(resolve, 80))
      }

      const operationData: BulkRewardOperation = {
        operation_type: operationType,
        notes: notes.trim() || undefined
      }

      if (operationType === 'coin_bonus') {
        operationData.coin_amount = coinAmount
      } else {
        operationData.reward_id = selectedReward
      }

      await onSubmit({
        student_ids: selectedStudents,
        ...operationData,
        reason: reason.trim()
      })
      
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process bulk reward operation')
      setStep('preview')
    }
  }

  const preview = calculatePreview()

  const getOperationTitle = () => {
    switch (operationType) {
      case 'coin_bonus': return 'Coin Bonus Award'
      case 'reward_redemption': return 'Bulk Reward Redemption'
      case 'privilege_grant': return 'Privilege Grant'
      default: return 'Reward Operation'
    }
  }

  const getOperationDescription = () => {
    switch (operationType) {
      case 'coin_bonus': return 'Award bonus coins to students'
      case 'reward_redemption': return 'Grant rewards to students (uses their coins)'
      case 'privilege_grant': return 'Grant special privileges to students'
      default: return 'Process reward operation'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Gift className="h-5 w-5" />
              <span>Bulk Reward Operations</span>
            </DialogTitle>
            <DialogDescription>
              Manage rewards and coins for {selectedStudents.length} selected student{selectedStudents.length !== 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {step === 'select' && (
              <motion.div
                key="select"
                variants={slideInVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-6 py-4"
              >
                {/* Selected Students Overview */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Selected Students ({selectedStudents.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedStudentNames.length <= 8 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedStudentNames.map((name, index) => (
                          <Badge key={index} variant="secondary">
                            {name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {selectedStudentNames.slice(0, 6).map((name, index) => (
                            <Badge key={index} variant="secondary">
                              {name}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          ... and {selectedStudentNames.length - 6} more students
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Operation Type Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Select Operation Type</Label>
                  <motion.div 
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    variants={staggerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.div variants={slideInVariants}>
                      <Card 
                        className="cursor-pointer hover:shadow-md transition-all"
                        onClick={() => handleOperationTypeSelect('coin_bonus')}
                      >
                        <CardContent className="pt-6">
                          <div className="text-center space-y-3">
                            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                              <Coins className="h-6 w-6 text-yellow-600" />
                            </div>
                            <div>
                              <h4 className="font-medium">Coin Bonus</h4>
                              <p className="text-xs text-muted-foreground">
                                Award bonus coins to students
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    <motion.div variants={slideInVariants}>
                      <Card 
                        className="cursor-pointer hover:shadow-md transition-all"
                        onClick={() => handleOperationTypeSelect('reward_redemption')}
                      >
                        <CardContent className="pt-6">
                          <div className="text-center space-y-3">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                              <ShoppingBag className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                              <h4 className="font-medium">Reward Redemption</h4>
                              <p className="text-xs text-muted-foreground">
                                Grant rewards using student coins
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    <motion.div variants={slideInVariants}>
                      <Card 
                        className="cursor-pointer hover:shadow-md transition-all"
                        onClick={() => handleOperationTypeSelect('privilege_grant')}
                      >
                        <CardContent className="pt-6">
                          <div className="text-center space-y-3">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                              <Crown className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                              <h4 className="font-medium">Privilege Grant</h4>
                              <p className="text-xs text-muted-foreground">
                                Grant special privileges to students
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </motion.div>
                </div>

                {/* Error Message */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </motion.div>
            )}

            {step === 'configure' && (
              <motion.div
                key="configure"
                variants={slideInVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-6 py-4"
              >
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">{getOperationTitle()}</h3>
                  <p className="text-sm text-muted-foreground">
                    {getOperationDescription()}
                  </p>
                </div>

                {operationType === 'coin_bonus' && (
                  <>
                    {/* Coin Amount Presets */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Coin Amount (per student)</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {BULK_COIN_PRESETS.map((preset) => (
                          <Button
                            key={preset.amount}
                            variant={coinAmount === preset.amount && !useCustomAmount ? 'default' : 'outline'}
                            className="h-auto p-4 flex flex-col items-center space-y-2"
                            onClick={() => handlePresetCoinClick(preset.amount)}
                          >
                            <span className="text-lg font-bold">+{preset.amount}</span>
                            <div className="text-center">
                              <div className="text-xs font-medium">{preset.label}</div>
                              <div className="text-xs text-muted-foreground">{preset.description}</div>
                            </div>
                          </Button>
                        ))}
                      </div>

                      {/* Custom Amount */}
                      <div className="flex items-center space-x-2">
                        <Label className="text-sm">Custom:</Label>
                        <Input
                          type="number"
                          placeholder="Enter amount"
                          value={customCoinAmount}
                          onChange={(e) => handleCustomCoinChange(e.target.value)}
                          className="w-32"
                          min="1"
                          max="200"
                        />
                        <span className="text-sm text-muted-foreground">coins per student</span>
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Reason *</Label>
                      <Textarea
                        placeholder="Explain why these coins are being awarded..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                  </>
                )}

                {(operationType === 'reward_redemption' || operationType === 'privilege_grant') && (
                  <>
                    {/* Category Filter */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Filter by Type</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {REWARD_CATEGORIES.map((category) => {
                          const IconComponent = category.icon
                          return (
                            <Button
                              key={category.value}
                              variant={categoryFilter === category.value ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setCategoryFilter(category.value)}
                              className="flex flex-col items-center space-y-1 h-auto py-3"
                            >
                              <IconComponent className="h-4 w-4" />
                              <span className="text-xs">{category.label}</span>
                            </Button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Reward Selection */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Select Reward</Label>
                      <motion.div 
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        variants={staggerVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        {filteredRewards.map((reward) => {
                          const IconComponent = getRewardIcon(reward.reward_type)
                          const isSelected = selectedReward === reward.id
                          return (
                            <motion.div key={reward.id} variants={slideInVariants}>
                              <Card 
                                className={`cursor-pointer transition-all hover:shadow-md ${
                                  isSelected ? 'border-primary shadow-md' : ''
                                }`}
                                onClick={() => setSelectedReward(reward.id)}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-start space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                                      <IconComponent className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-medium text-sm">{reward.name}</h4>
                                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                        {reward.description}
                                      </p>
                                      <div className="flex items-center justify-between mt-3">
                                        <div className="flex items-center space-x-2">
                                          <Badge variant="outline" className="text-xs">
                                            {reward.coin_cost} coins
                                          </Badge>
                                          <Badge variant="outline" className="text-xs capitalize">
                                            {reward.reward_type}
                                          </Badge>
                                        </div>
                                        {isSelected && (
                                          <CheckCircle className="h-4 w-4 text-primary" />
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          )
                        })}
                      </motion.div>
                    </div>
                  </>
                )}

                {/* Notes */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Notes (Optional)</Label>
                  <Textarea
                    placeholder="Add any special notes for this operation..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </motion.div>
            )}

            {step === 'preview' && (
              <motion.div
                key="preview"
                variants={slideInVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-6 py-4"
              >
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Operation Preview</h3>
                  <p className="text-sm text-muted-foreground">
                    Review the details before processing the reward operation
                  </p>
                </div>

                {/* Operation Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{preview.totalStudents}</div>
                        <p className="text-xs text-muted-foreground">Students</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{preview.totalCoins}</div>
                        <p className="text-xs text-muted-foreground">Total Coins</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{preview.affectedBalances}</div>
                        <p className="text-xs text-muted-foreground">Affected Balances</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">~{preview.estimatedTime}s</div>
                        <p className="text-xs text-muted-foreground">Est. Time</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Operation Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Operation Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Operation Type:</span>
                      <Badge className="capitalize">
                        {operationType.replace('_', ' ')}
                      </Badge>
                    </div>

                    {operationType === 'coin_bonus' && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Coins per Student:</span>
                          <span className="text-sm font-medium text-green-600">
                            +{coinAmount}
                          </span>
                        </div>
                        <div className="flex items-start justify-between">
                          <span className="text-sm">Reason:</span>
                          <div className="text-sm text-right max-w-xs">
                            {reason}
                          </div>
                        </div>
                      </>
                    )}

                    {rewardDetails && (
                      <>
                        <div className="flex items-start justify-between">
                          <span className="text-sm">Reward:</span>
                          <div className="text-sm text-right max-w-xs">
                            <div className="font-medium">{rewardDetails.name}</div>
                            <div className="text-muted-foreground">{rewardDetails.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Cost per Student:</span>
                          <span className="text-sm font-medium">
                            {rewardDetails.coin_cost} coins
                          </span>
                        </div>
                      </>
                    )}

                    {notes && (
                      <div className="flex items-start justify-between">
                        <span className="text-sm">Notes:</span>
                        <div className="text-sm text-right max-w-xs">
                          {notes}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Approval Warning */}
                {preview.requiresApproval && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      This operation involves high values and will require administrative approval before processing.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Error Message */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </motion.div>
            )}

            {step === 'processing' && (
              <motion.div
                key="processing"
                variants={slideInVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-6 py-8"
              >
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Processing Reward Operation</h3>
                    <p className="text-sm text-muted-foreground">
                      Please wait while we process rewards for all selected students...
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress</span>
                    <span>{processedCount} of {selectedStudents.length} students</span>
                  </div>
                  <Progress value={processingProgress} className="h-2" />
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  {operationType === 'coin_bonus' && 'Awarding coins and updating balances...'}
                  {operationType === 'reward_redemption' && 'Processing rewards and deducting coins...'}
                  {operationType === 'privilege_grant' && 'Granting privileges and sending notifications...'}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <DialogFooter className="flex items-center justify-between">
            {step === 'select' && (
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
            )}

            {step === 'configure' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setStep('select')}
                  disabled={loading}
                >
                  Back
                </Button>
                <Button
                  onClick={handleConfigure}
                  disabled={loading}
                >
                  Continue to Preview
                </Button>
              </>
            )}

            {step === 'preview' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setStep('configure')}
                  disabled={loading}
                >
                  Back to Edit
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <Gift className="h-4 w-4 mr-2" />
                  Process Operation
                </Button>
              </>
            )}

            {step === 'processing' && (
              <div className="w-full flex justify-center">
                <Button variant="outline" disabled>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </Button>
              </div>
            )}
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}