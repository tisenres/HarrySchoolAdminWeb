'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
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
  AlertCircle,
  Users,
  UserCheck,
  DollarSign,
  TrendingUp,
  Award,
  GraduationCap,
  Settings,
  Lightbulb
} from 'lucide-react'
import type { PointsAwardRequest } from '@/types/ranking'
import { modalVariants, buttonVariants } from '@/lib/animations'

interface UnifiedQuickPointAwardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userIds: string[]
  userNames?: string[]
  userType: 'student' | 'teacher'
  onSubmit: (data: PointsAwardRequest) => Promise<void>
  loading?: boolean
}

// Student preset reasons
const STUDENT_PRESET_REASONS = [
  { label: 'Homework Completed', points: 10, category: 'homework', icon: BookOpen, color: 'bg-blue-500' },
  { label: 'Perfect Attendance', points: 5, category: 'attendance', icon: Clock, color: 'bg-green-500' },
  { label: 'Good Behavior', points: 3, category: 'behavior', icon: Smile, color: 'bg-purple-500' },
  { label: 'Exceptional Work', points: 15, category: 'achievement', icon: Trophy, color: 'bg-yellow-500' },
  { label: 'Participation', points: 2, category: 'behavior', icon: Star, color: 'bg-pink-500' },
  { label: 'Helping Others', points: 8, category: 'behavior', icon: Smile, color: 'bg-indigo-500' },
]

// Teacher preset reasons
const TEACHER_PRESET_REASONS = [
  { label: 'Outstanding Teaching', points: 25, category: 'teaching_quality', icon: GraduationCap, color: 'bg-blue-500', efficiency: 5, quality: 8 },
  { label: 'Perfect Attendance', points: 15, category: 'attendance', icon: Clock, color: 'bg-green-500', efficiency: 3, quality: 2 },
  { label: 'Innovation in Teaching', points: 30, category: 'professional_development', icon: Lightbulb, color: 'bg-purple-500', efficiency: 0, quality: 10 },
  { label: 'Administrative Excellence', points: 20, category: 'administrative', icon: Settings, color: 'bg-yellow-500', efficiency: 8, quality: 2 },
  { label: 'Mentoring Colleagues', points: 18, category: 'professional_development', icon: Users, color: 'bg-pink-500', efficiency: 2, quality: 6 },
  { label: 'Student Achievement Impact', points: 35, category: 'teaching_quality', icon: Trophy, color: 'bg-indigo-500', efficiency: 5, quality: 10 },
]

const QUICK_POINT_VALUES = [1, 2, 3, 5, 8, 10, 15, 20, 25, 30, 50]

export function UnifiedQuickPointAward({
  open,
  onOpenChange,
  userIds,
  userNames = [],
  userType,
  onSubmit,
  loading = false
}: UnifiedQuickPointAwardProps) {
  const [pointsAmount, setPointsAmount] = useState<number>(userType === 'teacher' ? 25 : 10)
  const [customPoints, setCustomPoints] = useState<string>('')
  const [reason, setReason] = useState<string>('')
  const [category, setCategory] = useState<string>('manual')
  const [transactionType, setTransactionType] = useState<'earned' | 'deducted' | 'bonus'>('earned')
  const [useCustomPoints, setUseCustomPoints] = useState(false)
  const [error, setError] = useState<string>('')
  
  // Teacher-specific fields
  const [efficiencyImpact, setEfficiencyImpact] = useState<number>(0)
  const [qualityImpact, setQualityImpact] = useState<number>(0)
  const [affectsSalary, setAffectsSalary] = useState(false)
  const [monetaryImpact, setMonetaryImpact] = useState<string>('')

  const isTeacher = userType === 'teacher'
  const presetReasons = isTeacher ? TEACHER_PRESET_REASONS : STUDENT_PRESET_REASONS

  const handlePresetClick = (preset: any) => {
    setPointsAmount(preset.points)
    setReason(preset.label)
    setCategory(preset.category)
    setTransactionType('earned')
    setUseCustomPoints(false)
    setCustomPoints('')
    setError('')
    
    // Set teacher-specific impacts if available
    if (isTeacher && preset.efficiency !== undefined && preset.quality !== undefined) {
      setEfficiencyImpact(preset.efficiency)
      setQualityImpact(preset.quality)
      
      // Auto-enable salary impact for high-value awards
      if (preset.points >= 25) {
        setAffectsSalary(true)
        setMonetaryImpact((preset.points * 2).toString()) // Default $2 per point
      }
    }
  }

  const handleQuickPointClick = (points: number) => {
    setPointsAmount(points)
    setUseCustomPoints(false)
    setCustomPoints('')
    setError('')
    
    // Auto-set salary impact for teachers with high points
    if (isTeacher && points >= 25) {
      setAffectsSalary(true)
      setMonetaryImpact((points * 2).toString())
    }
  }

  const handleCustomPointsChange = (value: string) => {
    setCustomPoints(value)
    const numValue = parseInt(value)
    if (!isNaN(numValue)) {
      setPointsAmount(numValue)
      setUseCustomPoints(true)
      setError('')
      
      // Auto-set salary impact for teachers
      if (isTeacher && numValue >= 25) {
        setAffectsSalary(true)
        setMonetaryImpact((numValue * 2).toString())
      }
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

    const maxPoints = isTeacher ? 200 : 100
    if (Math.abs(pointsAmount) > maxPoints) {
      setError(`Point amount cannot exceed ${maxPoints} points`)
      return
    }

    // Teacher-specific validation
    if (isTeacher) {
      if (efficiencyImpact < -10 || efficiencyImpact > 10) {
        setError('Efficiency impact must be between -10 and +10')
        return
      }
      if (qualityImpact < -10 || qualityImpact > 10) {
        setError('Quality impact must be between -10 and +10')
        return
      }
      if (affectsSalary && (!monetaryImpact || isNaN(parseFloat(monetaryImpact)))) {
        setError('Please specify monetary impact when affecting salary')
        return
      }
    }

    const finalPoints = transactionType === 'deducted' ? -Math.abs(pointsAmount) : Math.abs(pointsAmount)

    try {
      const requestData: PointsAwardRequest = {
        user_ids: userIds,
        user_type: userType,
        points_amount: finalPoints,
        reason: reason.trim(),
        category,
        transaction_type: transactionType
      }

      // Add teacher-specific fields
      if (isTeacher) {
        requestData.efficiency_impact = efficiencyImpact
        requestData.quality_impact = qualityImpact
        requestData.affects_salary = affectsSalary
        requestData.monetary_impact = affectsSalary ? parseFloat(monetaryImpact) : undefined
      }

      await onSubmit(requestData)
      
      // Reset form
      setPointsAmount(isTeacher ? 25 : 10)
      setCustomPoints('')
      setReason('')
      setCategory('manual')
      setTransactionType('earned')
      setUseCustomPoints(false)
      setEfficiencyImpact(0)
      setQualityImpact(0)
      setAffectsSalary(false)
      setMonetaryImpact('')
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

  const getUserTypeConfig = () => {
    return isTeacher 
      ? { icon: UserCheck, label: 'Teacher', color: 'text-blue-600' }
      : { icon: Users, label: 'Student', color: 'text-green-600' }
  }

  const userConfig = getUserTypeConfig()
  const UserTypeIcon = userConfig.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
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
              <Badge variant="outline" className={userConfig.color}>
                <UserTypeIcon className="h-3 w-3 mr-1" />
                {userConfig.label}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Award points to {userIds.length === 1 
                ? (userNames[0] || `1 ${userType}`) 
                : `${userIds.length} ${userType}s`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* User Names (if provided) */}
            {userNames.length > 0 && userNames.length <= 5 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">{isTeacher ? 'Teachers' : 'Students'}</Label>
                <div className="flex flex-wrap gap-2">
                  {userNames.map((name, index) => (
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
                <Label className="text-sm font-medium">
                  {isTeacher ? 'Quick Teaching Actions' : 'Quick Reasons'}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {presetReasons.map((preset) => {
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
                          {isTeacher && preset.efficiency !== undefined && (
                            <div className="text-xs text-blue-600">
                              E: +{preset.efficiency} Q: +{preset.quality}
                            </div>
                          )}
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
                  max={isTeacher ? "200" : "100"}
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
                  {isTeacher ? (
                    <>
                      <SelectItem value="teaching_quality">Teaching Quality</SelectItem>
                      <SelectItem value="professional_development">Professional Development</SelectItem>
                      <SelectItem value="administrative">Administrative Tasks</SelectItem>
                      <SelectItem value="attendance">Attendance</SelectItem>
                      <SelectItem value="innovation">Innovation</SelectItem>
                      <SelectItem value="mentoring">Mentoring</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="homework">Homework</SelectItem>
                      <SelectItem value="attendance">Attendance</SelectItem>
                      <SelectItem value="behavior">Behavior</SelectItem>
                      <SelectItem value="achievement">Achievement</SelectItem>
                      <SelectItem value="participation">Participation</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Teacher-specific Performance Impact */}
            {isTeacher && (
              <>
                <Separator />
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Performance Impact</Label>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Efficiency Impact (-10 to +10)</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          value={efficiencyImpact}
                          onChange={(e) => setEfficiencyImpact(parseInt(e.target.value) || 0)}
                          className="w-20"
                          min="-10"
                          max="10"
                        />
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs">Quality Impact (-10 to +10)</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          value={qualityImpact}
                          onChange={(e) => setQualityImpact(parseInt(e.target.value) || 0)}
                          className="w-20"
                          min="-10"
                          max="10"
                        />
                        <Award className="h-4 w-4 text-purple-500" />
                      </div>
                    </div>
                  </div>

                  {/* Salary Impact */}
                  <div className="flex items-center space-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="affects-salary"
                        checked={affectsSalary}
                        onCheckedChange={setAffectsSalary}
                      />
                      <Label htmlFor="affects-salary" className="text-sm">Affects Salary/Compensation</Label>
                    </div>
                    {affectsSalary && (
                      <div className="flex items-center space-x-2 ml-4">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <Input
                          type="number"
                          placeholder="Amount"
                          value={monetaryImpact}
                          onChange={(e) => setMonetaryImpact(e.target.value)}
                          className="w-24"
                          step="0.01"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Reason */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Reason *</Label>
              <Textarea
                placeholder={isTeacher 
                  ? "Describe the teaching performance or achievement..."
                  : "Why are these points being awarded/deducted?"
                }
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
                <strong>{userIds.length}</strong> {userType}{userIds.length > 1 ? 's' : ''} will {transactionType === 'deducted' ? 'lose' : 'receive'}{' '}
                <strong className={transactionType === 'deducted' ? 'text-red-600' : 'text-green-600'}>
                  {transactionType === 'deducted' ? '-' : '+'}{Math.abs(pointsAmount)} point{Math.abs(pointsAmount) !== 1 ? 's' : ''}
                </strong>
                {reason && (
                  <>
                    {' '}for <em>"{reason.slice(0, 50)}{reason.length > 50 ? '...' : ''}"</em>
                  </>
                )}
                {isTeacher && (efficiencyImpact !== 0 || qualityImpact !== 0) && (
                  <div className="mt-1 text-xs">
                    Performance Impact: Efficiency {efficiencyImpact >= 0 ? '+' : ''}{efficiencyImpact}, Quality {qualityImpact >= 0 ? '+' : ''}{qualityImpact}
                    {affectsSalary && monetaryImpact && (
                      <>, Compensation: $${parseFloat(monetaryImpact).toFixed(2)}</>
                    )}
                  </div>
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