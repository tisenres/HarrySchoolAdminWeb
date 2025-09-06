'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  Trophy,
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
  Gift,
  PartyPopper
} from 'lucide-react'
import type { AchievementAwardRequest, Achievement } from '@/types/ranking'
import { modalVariants, slideInVariants, staggerVariants } from '@/lib/animations'

interface BulkAchievementOperationsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedStudents: string[]
  selectedStudentNames: string[]
  onSubmit: (data: AchievementAwardRequest) => Promise<void>
  loading?: boolean
}

// Mock achievements data - in real app, this would come from API
const AVAILABLE_ACHIEVEMENTS: Achievement[] = [
  {
    id: '1',
    organization_id: 'org-1',
    name: 'Perfect Attendance',
    description: 'Attended all classes for a full month',
    icon_name: 'Clock',
    badge_color: 'bg-green-500',
    points_reward: 25,
    coins_reward: 10,
    achievement_type: 'attendance',
    is_active: true,
    created_by: 'admin',
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  },
  {
    id: '2',
    organization_id: 'org-1',
    name: 'Homework Champion',
    description: 'Completed all homework assignments this week',
    icon_name: 'BookOpen',
    badge_color: 'bg-blue-500',
    points_reward: 20,
    coins_reward: 8,
    achievement_type: 'homework',
    is_active: true,
    created_by: 'admin',
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  },
  {
    id: '3',
    organization_id: 'org-1',
    name: 'Outstanding Behavior',
    description: 'Showed exceptional classroom behavior',
    icon_name: 'Smile',
    badge_color: 'bg-purple-500',
    points_reward: 15,
    coins_reward: 6,
    achievement_type: 'behavior',
    is_active: true,
    created_by: 'admin',
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  },
  {
    id: '4',
    organization_id: 'org-1',
    name: 'Academic Excellence',
    description: 'Achieved top grades in all subjects',
    icon_name: 'TrendingUp',
    badge_color: 'bg-yellow-500',
    points_reward: 40,
    coins_reward: 15,
    achievement_type: 'milestone',
    is_active: true,
    created_by: 'admin',
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  },
  {
    id: '5',
    organization_id: 'org-1',
    name: 'Helping Hand',
    description: 'Helped fellow students with their studies',
    icon_name: 'Users',
    badge_color: 'bg-pink-500',
    points_reward: 18,
    coins_reward: 7,
    achievement_type: 'special',
    is_active: true,
    created_by: 'admin',
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  },
  {
    id: '6',
    organization_id: 'org-1',
    name: 'Term Completion',
    description: 'Successfully completed the academic term',
    icon_name: 'Crown',
    badge_color: 'bg-indigo-500',
    points_reward: 50,
    coins_reward: 20,
    achievement_type: 'milestone',
    is_active: true,
    created_by: 'admin',
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  }
]

const ACHIEVEMENT_CATEGORIES = [
  { value: 'all', label: 'All Categories', icon: Trophy },
  { value: 'attendance', label: 'Attendance', icon: Clock },
  { value: 'homework', label: 'Homework', icon: BookOpen },
  { value: 'behavior', label: 'Behavior', icon: Smile },
  { value: 'milestone', label: 'Milestones', icon: Crown },
  { value: 'special', label: 'Special Events', icon: Star },
]

const getIconComponent = (iconName: string) => {
  const icons: Record<string, any> = {
    Clock, BookOpen, Smile, TrendingUp, Users, Crown, Trophy, Star, Medal, Target, Gift
  }
  return icons[iconName] || Trophy
}

interface BulkOperationPreview {
  totalStudents: number
  totalPointsAwarded: number
  totalCoinsAwarded: number
  averagePointsPerStudent: number
  averageCoinsPerStudent: number
  ceremonyRecommended: boolean
  estimatedTime: number
}

export function BulkAchievementOperations({
  open,
  onOpenChange,
  selectedStudents,
  selectedStudentNames,
  onSubmit,
  loading = false
}: BulkAchievementOperationsProps) {
  const [step, setStep] = useState<'select' | 'ceremony' | 'preview' | 'processing'>('select')
  const [selectedAchievement, setSelectedAchievement] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [notes, setNotes] = useState<string>('')
  const [includeCeremony, setIncludeCeremony] = useState<boolean>(false)
  const [ceremonyDate, setCeremonyDate] = useState<string>('')
  const [ceremonyNotes, setCeremonyNotes] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processedCount, setProcessedCount] = useState(0)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setStep('select')
      setSelectedAchievement('')
      setCategoryFilter('all')
      setNotes('')
      setIncludeCeremony(false)
      setCeremonyDate('')
      setCeremonyNotes('')
      setError('')
      setProcessingProgress(0)
      setProcessedCount(0)
    }
  }, [open])

  // Filter achievements by category
  const filteredAchievements = useMemo(() => {
    if (categoryFilter === 'all') return AVAILABLE_ACHIEVEMENTS
    return AVAILABLE_ACHIEVEMENTS.filter(a => a.achievement_type === categoryFilter)
  }, [categoryFilter])

  // Get selected achievement details
  const achievementDetails = useMemo(() => {
    return AVAILABLE_ACHIEVEMENTS.find(a => a.id === selectedAchievement)
  }, [selectedAchievement])

  // Calculate operation preview
  const calculatePreview = (): BulkOperationPreview => {
    if (!achievementDetails) {
      return {
        totalStudents: 0,
        totalPointsAwarded: 0,
        totalCoinsAwarded: 0,
        averagePointsPerStudent: 0,
        averageCoinsPerStudent: 0,
        ceremonyRecommended: false,
        estimatedTime: 0
      }
    }

    const totalStudents = selectedStudents.length
    const totalPointsAwarded = achievementDetails.points_reward * totalStudents
    const totalCoinsAwarded = achievementDetails.coins_reward * totalStudents
    const ceremonyRecommended = totalStudents >= 10 || achievementDetails.achievement_type === 'milestone'
    const estimatedTime = Math.max(3, Math.ceil(totalStudents / 8)) // seconds

    return {
      totalStudents,
      totalPointsAwarded,
      totalCoinsAwarded,
      averagePointsPerStudent: achievementDetails.points_reward,
      averageCoinsPerStudent: achievementDetails.coins_reward,
      ceremonyRecommended,
      estimatedTime
    }
  }

  const handleSelectAchievement = (achievementId: string) => {
    setSelectedAchievement(achievementId)
    setError('')
  }

  const handleContinue = () => {
    setError('')

    if (!selectedAchievement) {
      setError('Please select an achievement to award')
      return
    }

    if (selectedStudents.length === 0) {
      setError('No students selected')
      return
    }

    const preview = calculatePreview()
    if (preview.ceremonyRecommended) {
      setStep('ceremony')
    } else {
      setStep('preview')
    }
  }

  const handleCeremonyStep = () => {
    if (includeCeremony && !ceremonyDate) {
      setError('Please select a ceremony date')
      return
    }
    setError('')
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
        await new Promise(resolve => setTimeout(resolve, 100)) // Simulate processing time
      }

      await onSubmit({
        student_ids: selectedStudents,
        achievement_id: selectedAchievement,
        notes: notes.trim() || undefined
      })
      
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process bulk achievement award')
      setStep('preview')
    }
  }

  const preview = calculatePreview()

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
              <Trophy className="h-5 w-5" />
              <span>Bulk Achievement Awards</span>
            </DialogTitle>
            <DialogDescription>
              Grant achievements to {selectedStudents.length} selected student{selectedStudents.length !== 1 ? 's' : ''}
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

                {/* Category Filter */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Filter by Category</Label>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {ACHIEVEMENT_CATEGORIES.map((category) => {
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

                {/* Achievement Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Select Achievement</Label>
                  <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    variants={staggerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {filteredAchievements.map((achievement) => {
                      const IconComponent = getIconComponent(achievement.icon_name || 'Trophy')
                      const isSelected = selectedAchievement === achievement.id
                      return (
                        <motion.div key={achievement.id} variants={slideInVariants}>
                          <Card 
                            className={`cursor-pointer transition-all hover:shadow-md ${
                              isSelected ? 'border-primary shadow-md' : ''
                            }`}
                            onClick={() => handleSelectAchievement(achievement.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start space-x-3">
                                <div className={`w-10 h-10 rounded-full ${achievement.badge_color} flex items-center justify-center flex-shrink-0`}>
                                  <IconComponent className="h-5 w-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm">{achievement.name}</h4>
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {achievement.description}
                                  </p>
                                  <div className="flex items-center justify-between mt-3">
                                    <div className="flex items-center space-x-3">
                                      <Badge variant="outline" className="text-xs">
                                        +{achievement.points_reward} pts
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        {achievement.coins_reward} coins
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

                {/* Notes */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Notes (Optional)</Label>
                  <Textarea
                    placeholder="Add any special notes for this achievement award..."
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

            {step === 'ceremony' && (
              <motion.div
                key="ceremony"
                variants={slideInVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-6 py-4"
              >
                <div className="text-center">
                  <PartyPopper className="h-12 w-12 mx-auto text-purple-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Achievement Ceremony</h3>
                  <p className="text-sm text-muted-foreground">
                    This achievement is perfect for a special ceremony celebration!
                  </p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Ceremony Planning</CardTitle>
                    <CardDescription>
                      Plan a special ceremony to celebrate this achievement with all recipients
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="include-ceremony"
                        checked={includeCeremony}
                        onCheckedChange={(checked) => setIncludeCeremony(checked as boolean)}
                      />
                      <Label htmlFor="include-ceremony" className="text-sm">
                        Schedule a ceremony for this achievement
                      </Label>
                    </div>

                    {includeCeremony && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-4 border-t pt-4"
                      >
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Ceremony Date</Label>
                          <input
                            type="date"
                            value={ceremonyDate}
                            onChange={(e) => setCeremonyDate(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md"
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Ceremony Notes</Label>
                          <Textarea
                            placeholder="Special instructions or notes for the ceremony..."
                            value={ceremonyNotes}
                            onChange={(e) => setCeremonyNotes(e.target.value)}
                            rows={3}
                            className="resize-none"
                          />
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>

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
                    Review the details before awarding achievements
                  </p>
                </div>

                {/* Achievement Details */}
                {achievementDetails && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium flex items-center">
                        <Trophy className="h-4 w-4 mr-2" />
                        Achievement Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-start space-x-4">
                        <div className={`w-12 h-12 rounded-full ${achievementDetails.badge_color} flex items-center justify-center flex-shrink-0`}>
                          {(() => {
                            const IconComponent = getIconComponent(achievementDetails.icon_name || 'Trophy')
                            return <IconComponent className="h-6 w-6 text-white" />
                          })()}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{achievementDetails.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {achievementDetails.description}
                          </p>
                          <div className="flex items-center space-x-4 mt-3">
                            <Badge variant="outline">
                              +{achievementDetails.points_reward} points
                            </Badge>
                            <Badge variant="outline">
                              {achievementDetails.coins_reward} coins
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {achievementDetails.achievement_type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Operation Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{preview.totalStudents}</div>
                        <p className="text-xs text-muted-foreground">Recipients</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{preview.totalPointsAwarded}</div>
                        <p className="text-xs text-muted-foreground">Total Points</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{preview.totalCoinsAwarded}</div>
                        <p className="text-xs text-muted-foreground">Total Coins</p>
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

                {/* Ceremony Info */}
                {includeCeremony && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium flex items-center">
                        <PartyPopper className="h-4 w-4 mr-2" />
                        Ceremony Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Date:</span>
                          <span className="text-sm font-medium">
                            {new Date(ceremonyDate).toLocaleDateString()}
                          </span>
                        </div>
                        {ceremonyNotes && (
                          <div className="flex items-start justify-between">
                            <span className="text-sm">Notes:</span>
                            <div className="text-sm text-right max-w-xs">
                              {ceremonyNotes}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
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
                    <h3 className="text-lg font-semibold">Awarding Achievements</h3>
                    <p className="text-sm text-muted-foreground">
                      Please wait while we process achievements for all selected students...
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
                  Achievements are being awarded and notifications are being sent.
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <DialogFooter className="flex items-center justify-between">
            {step === 'select' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleContinue}
                  disabled={loading || !selectedAchievement}
                >
                  Continue
                </Button>
              </>
            )}

            {step === 'ceremony' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setStep('select')}
                  disabled={loading}
                >
                  Back
                </Button>
                <Button
                  onClick={handleCeremonyStep}
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
                  onClick={() => setStep(preview.ceremonyRecommended ? 'ceremony' : 'select')}
                  disabled={loading}
                >
                  Back to Edit
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  Award Achievements
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