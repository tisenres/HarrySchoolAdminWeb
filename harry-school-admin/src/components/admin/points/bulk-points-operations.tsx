'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  Users,
  Plus,
  Minus,
  Zap,
  BookOpen,
  Clock,
  Smile,
  Trophy,
  Star,
  AlertCircle,
  CheckCircle,
  Loader2,
  X,
  Award,
  TrendingUp,
  Calculator,
  Timer
} from 'lucide-react'
import type { PointsAwardRequest } from '@/types/ranking'
import { modalVariants, staggerVariants, slideInVariants } from '@/lib/animations'

interface BulkPointsOperationsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedStudents: string[]
  selectedStudentNames: string[]
  onSubmit: (data: PointsAwardRequest) => Promise<void>
  loading?: boolean
}

const BULK_PRESET_REASONS = [
  { 
    label: 'Weekly Homework Completion', 
    points: 15, 
    category: 'homework', 
    icon: BookOpen, 
    color: 'bg-blue-500',
    description: 'All homework submitted this week'
  },
  { 
    label: 'Perfect Weekly Attendance', 
    points: 10, 
    category: 'attendance', 
    icon: Clock, 
    color: 'bg-green-500',
    description: 'No absences this week'
  },
  { 
    label: 'Exceptional Class Participation', 
    points: 12, 
    category: 'behavior', 
    icon: Smile, 
    color: 'bg-purple-500',
    description: 'Outstanding participation in class'
  },
  { 
    label: 'Group Project Excellence', 
    points: 20, 
    category: 'achievement', 
    icon: Trophy, 
    color: 'bg-yellow-500',
    description: 'Outstanding group project performance'
  },
  { 
    label: 'Peer Help & Collaboration', 
    points: 8, 
    category: 'behavior', 
    icon: Star, 
    color: 'bg-pink-500',
    description: 'Helping classmates and collaboration'
  },
  { 
    label: 'End-of-Month Bonus', 
    points: 25, 
    category: 'achievement', 
    icon: Award, 
    color: 'bg-indigo-500',
    description: 'Monthly performance bonus'
  }
]

const QUICK_POINT_VALUES = [1, 2, 3, 5, 8, 10, 15, 20, 25, 30, 50]

interface BulkOperationPreview {
  totalStudents: number
  totalPoints: number
  averagePointsPerStudent: number
  requiresApproval: boolean
  estimatedTime: number
}

export function BulkPointsOperations({
  open,
  onOpenChange,
  selectedStudents,
  selectedStudentNames,
  onSubmit,
  loading = false
}: BulkPointsOperationsProps) {
  const [step, setStep] = useState<'configure' | 'preview' | 'processing'>('configure')
  const [pointsAmount, setPointsAmount] = useState<number>(10)
  const [customPoints, setCustomPoints] = useState<string>('')
  const [reason, setReason] = useState<string>('')
  const [category, setCategory] = useState<string>('manual')
  const [transactionType, setTransactionType] = useState<'earned' | 'deducted' | 'bonus'>('earned')
  const [useCustomPoints, setUseCustomPoints] = useState(false)
  const [error, setError] = useState<string>('')
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processedCount, setProcessedCount] = useState(0)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setStep('configure')
      setPointsAmount(10)
      setCustomPoints('')
      setReason('')
      setCategory('manual')
      setTransactionType('earned')
      setUseCustomPoints(false)
      setError('')
      setProcessingProgress(0)
      setProcessedCount(0)
    }
  }, [open])

  const handlePresetClick = (preset: typeof BULK_PRESET_REASONS[0]) => {
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

  const calculatePreview = (): BulkOperationPreview => {
    const finalPoints = transactionType === 'deducted' ? -Math.abs(pointsAmount) : Math.abs(pointsAmount)
    const totalPoints = finalPoints * selectedStudents.length
    const requiresApproval = Math.abs(pointsAmount) > 50 || Math.abs(totalPoints) > 500
    const estimatedTime = Math.max(2, Math.ceil(selectedStudents.length / 10)) // seconds

    return {
      totalStudents: selectedStudents.length,
      totalPoints: Math.abs(totalPoints),
      averagePointsPerStudent: Math.abs(finalPoints),
      requiresApproval,
      estimatedTime
    }
  }

  const handleConfigure = () => {
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
      setError('Point amount cannot exceed 100 points per student')
      return
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

    const finalPoints = transactionType === 'deducted' ? -Math.abs(pointsAmount) : Math.abs(pointsAmount)

    try {
      // Simulate progress for bulk operation
      const totalStudents = selectedStudents.length
      for (let i = 0; i <= totalStudents; i++) {
        setProcessedCount(i)
        setProcessingProgress((i / totalStudents) * 100)
        await new Promise(resolve => setTimeout(resolve, 50)) // Simulate processing time
      }

      await onSubmit({
        student_ids: selectedStudents,
        points_amount: finalPoints,
        reason: reason.trim(),
        category,
        transaction_type: transactionType
      })
      
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process bulk operation')
      setStep('preview')
    }
  }

  const preview = calculatePreview()

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Bulk Points Operations</span>
            </DialogTitle>
            <DialogDescription>
              Award or deduct points from {selectedStudents.length} selected student{selectedStudents.length !== 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {step === 'configure' && (
              <motion.div
                key="configure"
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
                    {selectedStudentNames.length <= 10 ? (
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
                          {selectedStudentNames.slice(0, 8).map((name, index) => (
                            <Badge key={index} variant="secondary">
                              {name}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          ... and {selectedStudentNames.length - 8} more students
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Transaction Type */}
                <div className="space-y-3">
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

                {/* Preset Reasons for Bulk Operations */}
                {transactionType !== 'deducted' && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Common Bulk Reasons</Label>
                    <motion.div 
                      className="grid grid-cols-1 md:grid-cols-2 gap-3"
                      variants={staggerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {BULK_PRESET_REASONS.map((preset) => {
                        const IconComponent = preset.icon
                        return (
                          <motion.div key={preset.label} variants={slideInVariants}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-auto p-4 flex flex-col items-start space-y-2 text-left w-full"
                              onClick={() => handlePresetClick(preset)}
                            >
                              <div className="flex items-center space-x-2 w-full">
                                <div className={`w-6 h-6 rounded-full ${preset.color} flex items-center justify-center flex-shrink-0`}>
                                  <IconComponent className="h-3 w-3 text-white" />
                                </div>
                                <div className="flex-1">
                                  <div className="text-xs font-medium">{preset.label}</div>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  +{preset.points}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground text-left w-full">
                                {preset.description}
                              </div>
                            </Button>
                          </motion.div>
                        )
                      })}
                    </motion.div>
                  </div>
                )}

                {/* Point Values */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    {transactionType === 'deducted' ? 'Points to Deduct (per student)' : 'Points to Award (per student)'}
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
                  <div className="flex items-center space-x-2">
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
                    <span className="text-sm text-muted-foreground">points per student</span>
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
                    placeholder="Explain why these points are being awarded/deducted..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
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
                    Review the details before processing the bulk operation
                  </p>
                </div>

                {/* Operation Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-2xl font-bold">{preview.totalStudents}</div>
                          <p className="text-xs text-muted-foreground">Students</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-2">
                        <Calculator className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-2xl font-bold">{preview.totalPoints}</div>
                          <p className="text-xs text-muted-foreground">Total Points</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-2xl font-bold">{preview.averagePointsPerStudent}</div>
                          <p className="text-xs text-muted-foreground">Per Student</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-2">
                        <Timer className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-2xl font-bold">~{preview.estimatedTime}s</div>
                          <p className="text-xs text-muted-foreground">Est. Time</p>
                        </div>
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
                      <span className="text-sm">Transaction Type:</span>
                      <Badge className={getTransactionColor().replace('bg-', 'bg-').replace('hover:bg-', '')}>
                        {transactionType}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Category:</span>
                      <Badge variant="outline">{category}</Badge>
                    </div>
                    <div className="flex items-start justify-between">
                      <span className="text-sm">Reason:</span>
                      <div className="text-sm text-right max-w-xs">
                        {reason}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Points per Student:</span>
                      <span className={`text-sm font-medium ${transactionType === 'deducted' ? 'text-red-600' : 'text-green-600'}`}>
                        {transactionType === 'deducted' ? '-' : '+'}{Math.abs(pointsAmount)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Approval Warning */}
                {preview.requiresApproval && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      This operation involves high point values and will require administrative approval before processing.
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
                    <h3 className="text-lg font-semibold">Processing Bulk Operation</h3>
                    <p className="text-sm text-muted-foreground">
                      Please wait while we process points for all selected students...
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
                  This may take a few moments depending on the number of students selected.
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <DialogFooter className="flex items-center justify-between">
            {step === 'configure' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfigure}
                  disabled={loading || !reason.trim() || pointsAmount === 0}
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
                  className={getTransactionColor()}
                >
                  {getTransactionIcon()}
                  <span className="ml-2">
                    Process Bulk Operation
                  </span>
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