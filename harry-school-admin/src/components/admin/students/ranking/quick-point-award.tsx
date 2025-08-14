'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { 
  Plus,
  Minus,
  Star,
  BookOpen,
  Clock,
  Smile,
  Trophy,
  Zap,
  Loader2,
  AlertCircle
} from 'lucide-react'
import type { PointsAwardRequest } from '@/types/ranking'
import { modalVariants, buttonVariants } from '@/lib/animations'

interface QuickPointAwardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  studentIds: string[]
  studentNames?: string[]
  onSubmit: (data: PointsAwardRequest) => Promise<void>
  loading?: boolean
}

const PRESET_REASONS = [
  { label: 'Homework Completed', points: 10, category: 'homework', icon: BookOpen, color: 'bg-blue-500' },
  { label: 'Perfect Attendance', points: 5, category: 'attendance', icon: Clock, color: 'bg-green-500' },
  { label: 'Good Behavior', points: 3, category: 'behavior', icon: Smile, color: 'bg-purple-500' },
  { label: 'Exceptional Work', points: 15, category: 'achievement', icon: Trophy, color: 'bg-yellow-500' },
  { label: 'Participation', points: 2, category: 'behavior', icon: Star, color: 'bg-pink-500' },
  { label: 'Helping Others', points: 8, category: 'behavior', icon: Smile, color: 'bg-indigo-500' },
]

const QUICK_POINT_VALUES = [1, 2, 3, 5, 8, 10, 15, 20]

export function QuickPointAward({
  open,
  onOpenChange,
  studentIds,
  studentNames = [],
  onSubmit,
  loading = false
}: QuickPointAwardProps) {
  const [pointsAmount, setPointsAmount] = useState<number>(10)
  const [customPoints, setCustomPoints] = useState<string>('')
  const [reason, setReason] = useState<string>('')
  const [category, setCategory] = useState<string>('manual')
  const [transactionType, setTransactionType] = useState<'earned' | 'deducted' | 'bonus'>('earned')
  const [useCustomPoints, setUseCustomPoints] = useState(false)
  const [error, setError] = useState<string>('')

  const handlePresetClick = (preset: typeof PRESET_REASONS[0]) => {
    setPointsAmount(preset.points)
    setReason(preset.label)
    setCategory(preset.category)
    setTransactionType('earned')
    setUseCustomPoints(false)
    setCustomPoints('')
    setError('')
  }

  const handleQuickPointClick = (points: number) => {
    setPointsAmount(points)
    setUseCustomPoints(false)
    setCustomPoints('')
    setError('')
  }

  const handleCustomPointsChange = (value: string) => {
    setCustomPoints(value)
    const numValue = parseInt(value)
    if (!isNaN(numValue)) {
      setPointsAmount(numValue)
      setUseCustomPoints(true)
      setError('')
    }
  }

  const handleSubmit = async () => {
    setError('')

    // Validation
    if (!reason.trim()) {
      setError('Please provide a reason for the point award')
      return
    }

    if (pointsAmount === 0) {
      setError('Point amount cannot be zero')
      return
    }

    if (Math.abs(pointsAmount) > 100) {
      setError('Point amount cannot exceed 100 points')
      return
    }

    const finalPoints = transactionType === 'deducted' ? -Math.abs(pointsAmount) : Math.abs(pointsAmount)

    try {
      await onSubmit({
        student_ids: studentIds,
        points_amount: finalPoints,
        reason: reason.trim(),
        category,
        transaction_type: transactionType
      })
      
      // Reset form
      setPointsAmount(10)
      setCustomPoints('')
      setReason('')
      setCategory('manual')
      setTransactionType('earned')
      setUseCustomPoints(false)
      setError('')
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to award points')
    }
  }

  const getTransactionIcon = () => {
    switch (transactionType) {
      case 'bonus': return <Zap className="h-4 w-4" />
      case 'deducted': return <Minus className="h-4 w-4" />
      default: return <Plus className="h-4 w-4" />
    }
  }

  const getTransactionColor = () => {
    switch (transactionType) {
      case 'bonus': return 'bg-purple-500 hover:bg-purple-600'
      case 'deducted': return 'bg-red-500 hover:bg-red-600'
      default: return 'bg-green-500 hover:bg-green-600'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {getTransactionIcon()}
              <span>Award Points</span>
            </DialogTitle>
            <DialogDescription>
              Award points to {studentIds.length === 1 
                ? (studentNames[0] || '1 student') 
                : `${studentIds.length} students`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Student Names (if provided) */}
            {studentNames.length > 0 && studentNames.length <= 5 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Students</Label>
                <div className="flex flex-wrap gap-2">
                  {studentNames.map((name, index) => (
                    <Badge key={index} variant="secondary">
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Transaction Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Transaction Type</Label>
              <div className="flex space-x-2">
                <Button
                  variant={transactionType === 'earned' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTransactionType('earned')}
                  className={transactionType === 'earned' ? 'bg-green-500 hover:bg-green-600' : ''}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Earned
                </Button>
                <Button
                  variant={transactionType === 'bonus' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTransactionType('bonus')}
                  className={transactionType === 'bonus' ? 'bg-purple-500 hover:bg-purple-600' : ''}
                >
                  <Zap className="h-4 w-4 mr-1" />
                  Bonus
                </Button>
                <Button
                  variant={transactionType === 'deducted' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTransactionType('deducted')}
                  className={transactionType === 'deducted' ? 'bg-red-500 hover:bg-red-600' : ''}
                >
                  <Minus className="h-4 w-4 mr-1" />
                  Deduct
                </Button>
              </div>
            </div>

            {/* Preset Reasons */}
            {transactionType !== 'deducted' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Quick Reasons</Label>
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_REASONS.map((preset) => {
                    const IconComponent = preset.icon
                    return (
                      <motion.div key={preset.label} {...buttonVariants}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-auto p-3 flex flex-col items-center space-y-1 text-center"
                          onClick={() => handlePresetClick(preset)}
                        >
                          <div className={`w-6 h-6 rounded-full ${preset.color} flex items-center justify-center`}>
                            <IconComponent className="h-3 w-3 text-white" />
                          </div>
                          <div className="text-xs font-medium">{preset.label}</div>
                          <div className="text-xs text-muted-foreground">+{preset.points} pts</div>
                        </Button>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Quick Point Values */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {transactionType === 'deducted' ? 'Points to Deduct' : 'Points to Award'}
              </Label>
              <div className="flex flex-wrap gap-2">
                {QUICK_POINT_VALUES.map((points) => (
                  <Button
                    key={points}
                    variant={pointsAmount === points && !useCustomPoints ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleQuickPointClick(points)}
                    className={pointsAmount === points && !useCustomPoints ? getTransactionColor() : ''}
                  >
                    {transactionType === 'deducted' ? '-' : '+'}{points}
                  </Button>
                ))}
              </div>
              
              {/* Custom Points Input */}
              <div className="flex items-center space-x-2 mt-2">
                <Label className="text-sm">Custom:</Label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={customPoints}
                  onChange={(e) => handleCustomPointsChange(e.target.value)}
                  className="w-24"
                  min="1"
                  max="100"
                />
                <span className="text-sm text-muted-foreground">points</span>
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="homework">Homework</SelectItem>
                  <SelectItem value="attendance">Attendance</SelectItem>
                  <SelectItem value="behavior">Behavior</SelectItem>
                  <SelectItem value="achievement">Achievement</SelectItem>
                  <SelectItem value="participation">Participation</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Reason *</Label>
              <Textarea
                placeholder="Why are these points being awarded/deducted?"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Preview */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Preview</span>
                <Badge className={getTransactionColor().replace('bg-', 'bg-').replace('hover:bg-', '')}>
                  {transactionType}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                <strong>{studentIds.length}</strong> student{studentIds.length > 1 ? 's' : ''} will {transactionType === 'deducted' ? 'lose' : 'receive'}{' '}
                <strong className={transactionType === 'deducted' ? 'text-red-600' : 'text-green-600'}>
                  {transactionType === 'deducted' ? '-' : '+'}{Math.abs(pointsAmount)} point{Math.abs(pointsAmount) !== 1 ? 's' : ''}
                </strong>
                {reason && (
                  <>
                    {' '}for <em>"{reason.slice(0, 50)}{reason.length > 50 ? '...' : ''}"</em>
                  </>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg"
              >
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !reason.trim() || pointsAmount === 0}
              className={getTransactionColor()}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {getTransactionIcon()}
                  <span className="ml-2">
                    {transactionType === 'deducted' ? 'Deduct' : 'Award'} Points
                  </span>
                </>
              )}
            </Button>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}