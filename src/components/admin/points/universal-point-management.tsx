'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  Award,
  Plus,
  Users,
  GraduationCap,
  BookOpen,
  Clock,
  Star,
  Target,
  Trophy,
  TrendingUp,
  Zap,
  Heart,
  Brain,
  Calculator,
  DollarSign,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Lightbulb
} from 'lucide-react'
import type { 
  PointsAwardRequest, 
  UserWithRanking,
  TeacherWithRanking,
  StudentWithRanking 
} from '@/types/ranking'

// Point categories for different user types
const TEACHER_POINT_CATEGORIES = [
  { 
    id: 'teaching_quality', 
    label: 'Teaching Quality', 
    points: 25, 
    icon: BookOpen,
    description: 'Exceptional teaching methodology and classroom management',
    color: 'bg-blue-100 text-blue-800'
  },
  { 
    id: 'student_success', 
    label: 'Student Success', 
    points: 30, 
    icon: TrendingUp,
    description: 'Significant impact on student achievement and progress',
    color: 'bg-green-100 text-green-800'
  },
  { 
    id: 'professional_development', 
    label: 'Professional Development', 
    points: 20, 
    icon: Brain,
    description: 'Continuous learning and skill advancement',
    color: 'bg-purple-100 text-purple-800'
  },
  { 
    id: 'administrative_excellence', 
    label: 'Administrative Excellence', 
    points: 15, 
    icon: Target,
    description: 'Outstanding administrative tasks and organization',
    color: 'bg-orange-100 text-orange-800'
  },
  { 
    id: 'peer_mentorship', 
    label: 'Peer Mentorship', 
    points: 20, 
    icon: Heart,
    description: 'Supporting and mentoring fellow teachers',
    color: 'bg-pink-100 text-pink-800'
  }
]

const STUDENT_POINT_CATEGORIES = [
  { 
    id: 'academic_achievement', 
    label: 'Academic Achievement', 
    points: 20, 
    icon: GraduationCap,
    description: 'Outstanding academic performance and test scores',
    color: 'bg-blue-100 text-blue-800'
  },
  { 
    id: 'excellent_behavior', 
    label: 'Excellent Behavior', 
    points: 10, 
    icon: Star,
    description: 'Exemplary classroom conduct and respect',
    color: 'bg-green-100 text-green-800'
  },
  { 
    id: 'peer_leadership', 
    label: 'Peer Leadership', 
    points: 15, 
    icon: Users,
    description: 'Leading and helping fellow students',
    color: 'bg-purple-100 text-purple-800'
  },
  { 
    id: 'goal_completion', 
    label: 'Goal Completion', 
    points: 25, 
    icon: Target,
    description: 'Successfully achieving personal learning goals',
    color: 'bg-orange-100 text-orange-800'
  },
  { 
    id: 'collaborative_contribution', 
    label: 'Collaborative Contribution', 
    points: 15, 
    icon: Heart,
    description: 'Positive teamwork and group participation',
    color: 'bg-pink-100 text-pink-800'
  }
]

const CROSS_IMPACT_CATEGORIES = [
  { 
    id: 'teacher_student_correlation', 
    label: 'Teacher-Student Success Correlation', 
    points: 40, 
    icon: Lightbulb,
    description: 'When teacher excellence leads to student achievement',
    color: 'bg-yellow-100 text-yellow-800',
    affects: ['teacher', 'student']
  },
  { 
    id: 'student_peer_influence', 
    label: 'Student-Peer Positive Influence', 
    points: 25, 
    icon: Users,
    description: 'When student behavior positively impacts peers',
    color: 'bg-cyan-100 text-cyan-800',
    affects: ['student']
  },
  { 
    id: 'organizational_contribution', 
    label: 'Organizational Contribution', 
    points: 50, 
    icon: Trophy,
    description: 'Significant contribution to overall school performance',
    color: 'bg-indigo-100 text-indigo-800',
    affects: ['teacher', 'student']
  }
]

const SPECIAL_RECOGNITION_CATEGORIES = [
  { 
    id: 'monthly_excellence', 
    label: 'Monthly Excellence', 
    points: 100, 
    icon: Trophy,
    description: 'Outstanding performance throughout the month',
    color: 'bg-gold-100 text-gold-800'
  },
  { 
    id: 'achievement_unlock', 
    label: 'Achievement Unlock', 
    points: 50, 
    icon: Star,
    description: 'Unlocking a significant milestone achievement',
    color: 'bg-emerald-100 text-emerald-800'
  },
  { 
    id: 'milestone_completion', 
    label: 'Milestone Completion', 
    points: 75, 
    icon: Target,
    description: 'Reaching an important learning or teaching milestone',
    color: 'bg-violet-100 text-violet-800'
  }
]

interface CrossImpactCalculation {
  primary_recipient: {
    user_id: string
    user_type: 'teacher' | 'student'
    points_awarded: number
  }
  affected_users: {
    user_id: string
    user_type: 'teacher' | 'student'
    points_impact: number
    impact_reason: string
  }[]
  total_organizational_impact: number
}

interface SmartSuggestion {
  category_id: string
  points: number
  reason: string
  confidence: number
  based_on: string[]
}

export function UniversalPointManagement() {
  const [selectedUserType, setSelectedUserType] = useState<'teacher' | 'student'>('student')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [customPoints, setCustomPoints] = useState<number>(0)
  const [reason, setReason] = useState<string>('')
  const [showBulkOperations, setShowBulkOperations] = useState(false)
  const [showCrossImpactPreview, setShowCrossImpactPreview] = useState(false)
  const [crossImpactCalculation, setCrossImpactCalculation] = useState<CrossImpactCalculation | null>(null)
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [requiresApproval, setRequiresApproval] = useState(false)

  // Mock data - Replace with actual API calls
  const [teachers] = useState<TeacherWithRanking[]>([
    {
      id: 't1',
      user_id: 't1',
      teacher_id: 't1',
      user_type: 'teacher',
      full_name: 'Sarah Johnson',
      efficiency_percentage: 95,
      quality_score: 88,
      performance_tier: 'excellent',
      ranking: {
        id: 'r1',
        user_id: 't1',
        organization_id: 'org1',
        user_type: 'teacher',
        total_points: 1250,
        available_coins: 125,
        spent_coins: 25,
        current_level: 8,
        current_rank: 2,
        efficiency_percentage: 95,
        quality_score: 88,
        performance_tier: 'excellent',
        created_at: '2024-01-01',
        updated_at: '2024-03-15'
      }
    }
  ])

  const [students] = useState<StudentWithRanking[]>([
    {
      id: 's1',
      user_id: 's1',
      student_id: 's1',
      user_type: 'student',
      full_name: 'Emma Chen',
      ranking: {
        id: 'r2',
        user_id: 's1',
        organization_id: 'org1',
        user_type: 'student',
        total_points: 850,
        available_coins: 85,
        spent_coins: 15,
        current_level: 6,
        current_rank: 5,
        created_at: '2024-01-01',
        updated_at: '2024-03-15'
      }
    },
    {
      id: 's2',
      user_id: 's2',
      student_id: 's2',
      user_type: 'student',
      full_name: 'Alex Rodriguez',
      ranking: {
        id: 'r3',
        user_id: 's2',
        organization_id: 'org1',
        user_type: 'student',
        total_points: 720,
        available_coins: 72,
        spent_coins: 8,
        current_level: 5,
        current_rank: 8,
        created_at: '2024-01-01',
        updated_at: '2024-03-15'
      }
    }
  ])

  const getCurrentCategories = () => {
    return selectedUserType === 'teacher' ? TEACHER_POINT_CATEGORIES : STUDENT_POINT_CATEGORIES
  }

  const calculateCrossImpact = (userIds: string[], category: string, points: number): CrossImpactCalculation => {
    // Simulate cross-impact calculation
    const primaryRecipient = userIds[0]
    const userType = selectedUserType
    
    const affected_users = []
    let total_organizational_impact = points

    // Add correlation impacts
    if (category === 'teaching_quality' && userType === 'teacher') {
      // Teacher quality affects their students
      const teacherStudents = students.filter(s => Math.random() > 0.5) // Mock relationship
      affected_users.push(...teacherStudents.map(s => ({
        user_id: s.user_id,
        user_type: 'student' as const,
        points_impact: Math.floor(points * 0.3),
        impact_reason: 'Benefit from improved teaching quality'
      })))
      total_organizational_impact += affected_users.length * Math.floor(points * 0.3)
    }

    if (category === 'peer_leadership' && userType === 'student') {
      // Student leadership affects peers
      const peers = students.filter(s => s.user_id !== primaryRecipient && Math.random() > 0.7)
      affected_users.push(...peers.map(s => ({
        user_id: s.user_id,
        user_type: 'student' as const,
        points_impact: Math.floor(points * 0.2),
        impact_reason: 'Inspired by peer leadership'
      })))
      total_organizational_impact += affected_users.length * Math.floor(points * 0.2)
    }

    return {
      primary_recipient: {
        user_id: primaryRecipient,
        user_type: userType,
        points_awarded: points
      },
      affected_users,
      total_organizational_impact
    }
  }

  const generateSmartSuggestions = (userIds: string[]): SmartSuggestion[] => {
    // Simulate AI-generated suggestions based on user history and achievements
    const categories = getCurrentCategories()
    return categories.slice(0, 3).map(cat => ({
      category_id: cat.id,
      points: cat.points,
      reason: `Recent activity suggests ${cat.label.toLowerCase()} recognition`,
      confidence: Math.floor(Math.random() * 30) + 70,
      based_on: ['Recent performance data', 'Goal progress', 'Peer feedback']
    }))
  }

  useEffect(() => {
    if (selectedUsers.length > 0) {
      setSmartSuggestions(generateSmartSuggestions(selectedUsers))
    }
  }, [selectedUsers, selectedUserType])

  useEffect(() => {
    if (selectedUsers.length > 0 && selectedCategory && customPoints > 0) {
      const calculation = calculateCrossImpact(selectedUsers, selectedCategory, customPoints)
      setCrossImpactCalculation(calculation)
      setRequiresApproval(customPoints > 50 || calculation.total_organizational_impact > 100)
    }
  }, [selectedUsers, selectedCategory, customPoints])

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
    const category = [...getCurrentCategories(), ...CROSS_IMPACT_CATEGORIES, ...SPECIAL_RECOGNITION_CATEGORIES]
      .find(c => c.id === categoryId)
    if (category) {
      setCustomPoints(category.points)
    }
  }

  const handlePointAward = async () => {
    if (!selectedUsers.length || !selectedCategory || customPoints <= 0) return

    setIsSubmitting(true)
    try {
      const request: PointsAwardRequest = {
        user_ids: selectedUsers,
        user_type: selectedUserType,
        points_amount: customPoints,
        reason,
        category: selectedCategory,
        transaction_type: 'earned'
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Reset form
      setSelectedUsers([])
      setSelectedCategory('')
      setCustomPoints(0)
      setReason('')
      setCrossImpactCalculation(null)
      setSmartSuggestions([])
      
      console.log('Points awarded successfully', request)
    } catch (error) {
      console.error('Error awarding points:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getUserOptions = () => {
    return selectedUserType === 'teacher' ? teachers : students
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Award className="h-5 w-5" />
                Universal Point Management
              </CardTitle>
              <CardDescription>
                Award points to teachers and students with cross-impact recognition
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowBulkOperations(true)}>
                <Users className="h-4 w-4 mr-2" />
                Bulk Operations
              </Button>
              <Button variant="outline" onClick={() => setShowCrossImpactPreview(true)}>
                <Calculator className="h-4 w-4 mr-2" />
                Impact Preview
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User Type Selection */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Select User Type</Label>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={selectedUserType === 'teacher' ? 'default' : 'outline'}
                onClick={() => {
                  setSelectedUserType('teacher')
                  setSelectedUsers([])
                  setSelectedCategory('')
                  setCustomPoints(0)
                }}
                className="justify-start"
              >
                <GraduationCap className="h-4 w-4 mr-2" />
                Teachers
              </Button>
              <Button
                variant={selectedUserType === 'student' ? 'default' : 'outline'}
                onClick={() => {
                  setSelectedUserType('student')
                  setSelectedUsers([])
                  setSelectedCategory('')
                  setCustomPoints(0)
                }}
                className="justify-start"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Students
              </Button>
            </div>
          </div>

          <Separator />

          {/* User Selection */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Select {selectedUserType === 'teacher' ? 'Teachers' : 'Students'}</Label>
            <div className="grid gap-2">
              {getUserOptions().map((user) => (
                <div key={user.user_id} className="flex items-center space-x-2">
                  <Checkbox
                    id={user.user_id}
                    checked={selectedUsers.includes(user.user_id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedUsers([...selectedUsers, user.user_id])
                      } else {
                        setSelectedUsers(selectedUsers.filter(id => id !== user.user_id))
                      }
                    }}
                  />
                  <Label htmlFor={user.user_id} className="flex items-center justify-between w-full">
                    <span>{user.full_name}</span>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Star className="h-3 w-3" />
                      {user.ranking?.total_points || 0} pts
                      <Badge variant="outline">
                        Level {user.ranking?.current_level || 1}
                      </Badge>
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Smart Suggestions */}
          {smartSuggestions.length > 0 && (
            <div className="space-y-4">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Smart Suggestions
              </Label>
              <div className="grid gap-2">
                {smartSuggestions.map((suggestion) => (
                  <Button
                    key={suggestion.category_id}
                    variant="outline"
                    onClick={() => handleCategorySelect(suggestion.category_id)}
                    className="justify-start h-auto p-3"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="text-left">
                        <div className="font-medium">{suggestion.reason}</div>
                        <div className="text-sm text-muted-foreground">
                          {suggestion.points} points • {suggestion.confidence}% confidence
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">
                        Suggested
                      </Badge>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Category Selection */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Point Categories</Label>
            
            {/* User-specific categories */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                {selectedUserType === 'teacher' ? 'Teacher' : 'Student'} Categories
              </h4>
              <div className="grid gap-2 md:grid-cols-2">
                {getCurrentCategories().map((category) => {
                  const IconComponent = category.icon
                  return (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? 'default' : 'outline'}
                      onClick={() => handleCategorySelect(category.id)}
                      className="justify-start h-auto p-3"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          <div className="text-left">
                            <div className="font-medium">{category.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {category.description}
                            </div>
                          </div>
                        </div>
                        <Badge className={category.color}>
                          +{category.points}
                        </Badge>
                      </div>
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* Cross-impact categories */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Cross-Impact Categories</h4>
              <div className="grid gap-2">
                {CROSS_IMPACT_CATEGORIES.map((category) => {
                  const IconComponent = category.icon
                  return (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? 'default' : 'outline'}
                      onClick={() => handleCategorySelect(category.id)}
                      className="justify-start h-auto p-3"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          <div className="text-left">
                            <div className="font-medium">{category.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {category.description}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={category.color}>
                            +{category.points}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            Cross-Impact
                          </Badge>
                        </div>
                      </div>
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* Special recognition categories */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Special Recognition</h4>
              <div className="grid gap-2">
                {SPECIAL_RECOGNITION_CATEGORIES.map((category) => {
                  const IconComponent = category.icon
                  return (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? 'default' : 'outline'}
                      onClick={() => handleCategorySelect(category.id)}
                      className="justify-start h-auto p-3"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          <div className="text-left">
                            <div className="font-medium">{category.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {category.description}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={category.color}>
                            +{category.points}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            Special
                          </Badge>
                        </div>
                      </div>
                    </Button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Custom Points and Reason */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="points">Points Amount</Label>
              <Input
                id="points"
                type="number"
                value={customPoints}
                onChange={(e) => setCustomPoints(Number(e.target.value))}
                placeholder="Enter points"
                min={1}
                max={500}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Additional context or reason"
              />
            </div>
          </div>

          {/* Cross-Impact Preview */}
          {crossImpactCalculation && (
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Cross-Impact Calculation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Primary Recipient</span>
                    <Badge className="bg-green-100 text-green-800">
                      +{crossImpactCalculation.primary_recipient.points_awarded} points
                    </Badge>
                  </div>
                  
                  {crossImpactCalculation.affected_users.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Affected Users:</span>
                      {crossImpactCalculation.affected_users.map((user, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{user.impact_reason}</span>
                          <Badge variant="outline" className="text-blue-600">
                            +{user.points_impact} points
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <Separator />
                  <div className="flex items-center justify-between font-medium">
                    <span>Total Organizational Impact</span>
                    <Badge className="bg-purple-100 text-purple-800">
                      +{crossImpactCalculation.total_organizational_impact} points
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Approval Warning */}
          {requiresApproval && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                This point award requires administrator approval due to high value or impact.
              </span>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              onClick={handlePointAward}
              disabled={!selectedUsers.length || !selectedCategory || customPoints <= 0 || isSubmitting}
              className="min-w-32"
            >
              {isSubmitting ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  {requiresApproval ? 'Submitting for Approval...' : 'Awarding Points...'}
                </>
              ) : (
                <>
                  <Award className="h-4 w-4 mr-2" />
                  {requiresApproval ? 'Submit for Approval' : 'Award Points'}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}