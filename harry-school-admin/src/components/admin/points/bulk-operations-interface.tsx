'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
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
  Users,
  Award,
  Target,
  Calendar,
  BookOpen,
  GraduationCap,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  Zap,
  Star,
  Trophy,
  Heart,
  Brain,
  Upload,
  Download,
  Play,
  Pause,
  RotateCcw,
  Eye,
  AlertCircle
} from 'lucide-react'
import type { 
  TeacherWithRanking,
  StudentWithRanking,
  PointsAwardRequest 
} from '@/types/ranking'

interface BulkOperation {
  id: string
  name: string
  description: string
  user_type: 'teacher' | 'student' | 'both'
  target_criteria: {
    performance_tier?: string[]
    department?: string[]
    level_range?: { min: number; max: number }
    points_range?: { min: number; max: number }
    date_range?: { start: Date; end: Date }
  }
  point_award: {
    category: string
    points: number
    reason: string
  }
  schedule?: {
    type: 'immediate' | 'scheduled' | 'recurring'
    date?: Date
    frequency?: 'daily' | 'weekly' | 'monthly'
  }
  status: 'draft' | 'pending_approval' | 'approved' | 'running' | 'completed' | 'cancelled'
  estimated_recipients: number
  total_points_impact: number
  created_at: Date
  created_by: string
}

interface BulkExecutionProgress {
  operation_id: string
  total_recipients: number
  processed: number
  successful: number
  failed: number
  current_recipient?: string
  estimated_completion: Date
  errors: string[]
}

export function BulkOperationsInterface() {
  const [operations, setOperations] = useState<BulkOperation[]>([])
  const [selectedOperation, setSelectedOperation] = useState<string>('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [executionProgress, setExecutionProgress] = useState<BulkExecutionProgress | null>(null)
  const [showExecutionDialog, setShowExecutionDialog] = useState(false)
  
  // Form state for creating new operations
  const [operationName, setOperationName] = useState('')
  const [operationDescription, setOperationDescription] = useState('')
  const [targetUserType, setTargetUserType] = useState<'teacher' | 'student' | 'both'>('student')
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])
  const [selectedPerformanceTiers, setSelectedPerformanceTiers] = useState<string[]>([])
  const [levelRange, setLevelRange] = useState({ min: 1, max: 10 })
  const [pointsRange, setPointsRange] = useState({ min: 0, max: 2000 })
  const [selectedCategory, setSelectedCategory] = useState('')
  const [awardPoints, setAwardPoints] = useState(0)
  const [awardReason, setAwardReason] = useState('')
  const [scheduleType, setScheduleType] = useState<'immediate' | 'scheduled' | 'recurring'>('immediate')

  // Mock data
  const [teachers] = useState<TeacherWithRanking[]>([
    {
      id: 't1', user_id: 't1', teacher_id: 't1', user_type: 'teacher',
      full_name: 'Sarah Johnson', efficiency_percentage: 95, quality_score: 88, performance_tier: 'excellent',
      ranking: { id: 'r1', user_id: 't1', organization_id: 'org1', user_type: 'teacher', total_points: 1250, available_coins: 125, spent_coins: 25, current_level: 8, current_rank: 2, efficiency_percentage: 95, quality_score: 88, performance_tier: 'excellent', created_at: '2024-01-01', updated_at: '2024-03-15' }
    },
    {
      id: 't2', user_id: 't2', teacher_id: 't2', user_type: 'teacher',
      full_name: 'Michael Chen', efficiency_percentage: 87, quality_score: 82, performance_tier: 'good',
      ranking: { id: 'r2', user_id: 't2', organization_id: 'org1', user_type: 'teacher', total_points: 980, available_coins: 98, spent_coins: 12, current_level: 6, current_rank: 5, efficiency_percentage: 87, quality_score: 82, performance_tier: 'good', created_at: '2024-01-01', updated_at: '2024-03-15' }
    }
  ])

  const [students] = useState<StudentWithRanking[]>([
    {
      id: 's1', user_id: 's1', student_id: 's1', user_type: 'student',
      full_name: 'Emma Chen',
      ranking: { id: 'r3', user_id: 's1', organization_id: 'org1', user_type: 'student', total_points: 850, available_coins: 85, spent_coins: 15, current_level: 6, current_rank: 5, created_at: '2024-01-01', updated_at: '2024-03-15' }
    },
    {
      id: 's2', user_id: 's2', student_id: 's2', user_type: 'student',
      full_name: 'Alex Rodriguez',
      ranking: { id: 'r4', user_id: 's2', organization_id: 'org1', user_type: 'student', total_points: 720, available_coins: 72, spent_coins: 8, current_level: 5, current_rank: 8, created_at: '2024-01-01', updated_at: '2024-03-15' }
    }
  ])

  const departments = ['Mathematics', 'Science', 'English', 'History', 'Art']
  const performanceTiers = ['outstanding', 'excellent', 'good', 'standard']

  const pointCategories = {
    teacher: [
      { id: 'teaching_quality', label: 'Teaching Quality', points: 25 },
      { id: 'student_success', label: 'Student Success', points: 30 },
      { id: 'professional_development', label: 'Professional Development', points: 20 },
      { id: 'administrative_excellence', label: 'Administrative Excellence', points: 15 },
      { id: 'peer_mentorship', label: 'Peer Mentorship', points: 20 }
    ],
    student: [
      { id: 'academic_achievement', label: 'Academic Achievement', points: 20 },
      { id: 'excellent_behavior', label: 'Excellent Behavior', points: 10 },
      { id: 'peer_leadership', label: 'Peer Leadership', points: 15 },
      { id: 'goal_completion', label: 'Goal Completion', points: 25 },
      { id: 'collaborative_contribution', label: 'Collaborative Contribution', points: 15 }
    ]
  }

  // Initialize with mock operations
  useEffect(() => {
    const mockOperations: BulkOperation[] = [
      {
        id: 'bo1',
        name: 'Monthly Excellence Recognition',
        description: 'Award points to all excellent tier teachers for outstanding performance',
        user_type: 'teacher',
        target_criteria: {
          performance_tier: ['excellent', 'outstanding']
        },
        point_award: {
          category: 'teaching_quality',
          points: 50,
          reason: 'Monthly excellence recognition for outstanding teaching performance'
        },
        schedule: { type: 'recurring', frequency: 'monthly' },
        status: 'approved',
        estimated_recipients: 8,
        total_points_impact: 400,
        created_at: new Date('2024-03-01'),
        created_by: 'admin1'
      },
      {
        id: 'bo2',
        name: 'Quarter Achievement Boost',
        description: 'Reward high-performing students at quarter end',
        user_type: 'student',
        target_criteria: {
          level_range: { min: 5, max: 10 },
          points_range: { min: 500, max: 2000 }
        },
        point_award: {
          category: 'academic_achievement',
          points: 35,
          reason: 'Quarter-end achievement recognition for academic excellence'
        },
        schedule: { type: 'scheduled', date: new Date('2024-03-31') },
        status: 'pending_approval',
        estimated_recipients: 24,
        total_points_impact: 840,
        created_at: new Date('2024-03-15'),
        created_by: 'admin2'
      },
      {
        id: 'bo3',
        name: 'Department-wide Science Fair Recognition',
        description: 'Award points to all science department participants',
        user_type: 'both',
        target_criteria: {
          department: ['Science']
        },
        point_award: {
          category: 'collaborative_contribution',
          points: 30,
          reason: 'Participation and excellence in annual science fair'
        },
        schedule: { type: 'immediate' },
        status: 'draft',
        estimated_recipients: 45,
        total_points_impact: 1350,
        created_at: new Date('2024-03-16'),
        created_by: 'admin1'
      }
    ]
    setOperations(mockOperations)
  }, [])

  const getEligibleRecipients = () => {
    const allUsers = [...teachers, ...students]
    
    return allUsers.filter(user => {
      // User type filter
      if (targetUserType !== 'both' && user.user_type !== targetUserType) return false
      
      // Department filter (mock - in real app, users would have department data)
      if (selectedDepartments.length > 0) {
        // Mock department assignment
        const userDepartment = ['Mathematics', 'Science', 'English'][Math.floor(Math.random() * 3)]
        if (!selectedDepartments.includes(userDepartment)) return false
      }
      
      // Performance tier filter (teachers only)
      if (user.user_type === 'teacher' && selectedPerformanceTiers.length > 0) {
        const teacher = user as TeacherWithRanking
        if (!selectedPerformanceTiers.includes(teacher.performance_tier!)) return false
      }
      
      // Level range filter
      const userLevel = user.ranking?.current_level || 1
      if (userLevel < levelRange.min || userLevel > levelRange.max) return false
      
      // Points range filter
      const userPoints = user.ranking?.total_points || 0
      if (userPoints < pointsRange.min || userPoints > pointsRange.max) return false
      
      return true
    })
  }

  const calculateOperationImpact = () => {
    const recipients = getEligibleRecipients()
    const totalRecipients = recipients.length
    const totalPointsImpact = totalRecipients * awardPoints
    const budgetImpact = targetUserType === 'teacher' ? totalPointsImpact * 10 : 0 // Mock compensation impact

    return {
      totalRecipients,
      totalPointsImpact,
      budgetImpact,
      recipients: recipients.slice(0, 10) // Preview first 10
    }
  }

  const handleCreateOperation = () => {
    const impact = calculateOperationImpact()
    
    const newOperation: BulkOperation = {
      id: `bo${Date.now()}`,
      name: operationName,
      description: operationDescription,
      user_type: targetUserType,
      target_criteria: {
        performance_tier: selectedPerformanceTiers.length > 0 ? selectedPerformanceTiers : undefined,
        department: selectedDepartments.length > 0 ? selectedDepartments : undefined,
        level_range: levelRange,
        points_range: pointsRange
      },
      point_award: {
        category: selectedCategory,
        points: awardPoints,
        reason: awardReason
      },
      schedule: { type: scheduleType },
      status: 'draft',
      estimated_recipients: impact.totalRecipients,
      total_points_impact: impact.totalPointsImpact,
      created_at: new Date(),
      created_by: 'current_admin'
    }

    setOperations(prev => [newOperation, ...prev])
    setShowCreateDialog(false)
    
    // Reset form
    setOperationName('')
    setOperationDescription('')
    setSelectedDepartments([])
    setSelectedPerformanceTiers([])
    setSelectedCategory('')
    setAwardPoints(0)
    setAwardReason('')
  }

  const executeOperation = async (operationId: string) => {
    const operation = operations.find(op => op.id === operationId)
    if (!operation) return

    const recipients = getEligibleRecipients()
    
    setExecutionProgress({
      operation_id: operationId,
      total_recipients: recipients.length,
      processed: 0,
      successful: 0,
      failed: 0,
      estimated_completion: new Date(Date.now() + recipients.length * 1000),
      errors: []
    })
    
    setShowExecutionDialog(true)
    
    // Update operation status
    setOperations(prev => prev.map(op => 
      op.id === operationId ? { ...op, status: 'running' } : op
    ))

    // Simulate execution
    for (let i = 0; i < recipients.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const success = Math.random() > 0.1 // 90% success rate
      
      setExecutionProgress(prev => prev ? {
        ...prev,
        processed: i + 1,
        successful: prev.successful + (success ? 1 : 0),
        failed: prev.failed + (success ? 0 : 1),
        current_recipient: recipients[i].full_name,
        errors: success ? prev.errors : [...prev.errors, `Failed to award points to ${recipients[i].full_name}`]
      } : null)
    }

    // Mark as completed
    setOperations(prev => prev.map(op => 
      op.id === operationId ? { ...op, status: 'completed' } : op
    ))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'running': return 'bg-blue-100 text-blue-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'pending_approval': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4" />
      case 'running': return <Play className="h-4 w-4" />
      case 'approved': return <CheckCircle2 className="h-4 w-4" />
      case 'pending_approval': return <Clock className="h-4 w-4" />
      case 'cancelled': return <AlertTriangle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const impact = calculateOperationImpact()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Users className="h-5 w-5" />
                Bulk Point Operations
              </CardTitle>
              <CardDescription>
                Create and manage large-scale point awards for multiple users
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Award className="h-4 w-4 mr-2" />
                Create Operation
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Operations List */}
          <div className="space-y-4">
            {operations.map((operation) => (
              <div key={operation.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {operation.user_type === 'teacher' ? 'T' : operation.user_type === 'student' ? 'S' : 'B'}
                    </div>
                    <div>
                      <h4 className="font-semibold">{operation.name}</h4>
                      <p className="text-sm text-muted-foreground">{operation.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={getStatusColor(operation.status)}>
                      {getStatusIcon(operation.status)}
                      <span className="ml-1 capitalize">{operation.status.replace('_', ' ')}</span>
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-4 mb-3">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">{operation.estimated_recipients}</div>
                    <div className="text-xs text-muted-foreground">Recipients</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">+{operation.point_award.points}</div>
                    <div className="text-xs text-muted-foreground">Points Each</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-lg font-bold text-purple-600">{operation.total_points_impact}</div>
                    <div className="text-xs text-muted-foreground">Total Impact</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-lg font-bold text-orange-600">
                      {operation.schedule?.type === 'recurring' ? operation.schedule.frequency : operation.schedule?.type}
                    </div>
                    <div className="text-xs text-muted-foreground">Schedule</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    Created by {operation.created_by} on {operation.created_at.toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    {operation.status === 'draft' && (
                      <Button variant="outline" size="sm">
                        Submit for Approval
                      </Button>
                    )}
                    {operation.status === 'approved' && (
                      <Button 
                        size="sm"
                        onClick={() => executeOperation(operation.id)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Execute
                      </Button>
                    )}
                    {operation.status === 'running' && (
                      <Button variant="outline" size="sm" disabled>
                        <Pause className="h-4 w-4 mr-2" />
                        Running...
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Operation Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Create Bulk Point Operation
            </DialogTitle>
            <DialogDescription>
              Set up criteria and point awards for multiple users at once
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="font-medium">Basic Information</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Operation Name</Label>
                  <Input
                    value={operationName}
                    onChange={(e) => setOperationName(e.target.value)}
                    placeholder="e.g., Monthly Excellence Recognition"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Target User Type</Label>
                  <Select value={targetUserType} onValueChange={(value: any) => setTargetUserType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Students Only</SelectItem>
                      <SelectItem value="teacher">Teachers Only</SelectItem>
                      <SelectItem value="both">Both Students and Teachers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={operationDescription}
                  onChange={(e) => setOperationDescription(e.target.value)}
                  placeholder="Describe the purpose and criteria for this bulk operation..."
                />
              </div>
            </div>

            <Separator />

            {/* Target Criteria */}
            <div className="space-y-4">
              <h4 className="font-medium">Target Criteria</h4>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Departments</Label>
                  <div className="grid gap-2">
                    {departments.map((dept) => (
                      <div key={dept} className="flex items-center space-x-2">
                        <Checkbox
                          id={dept}
                          checked={selectedDepartments.includes(dept)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedDepartments([...selectedDepartments, dept])
                            } else {
                              setSelectedDepartments(selectedDepartments.filter(d => d !== dept))
                            }
                          }}
                        />
                        <Label htmlFor={dept}>{dept}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {(targetUserType === 'teacher' || targetUserType === 'both') && (
                  <div className="space-y-2">
                    <Label>Performance Tiers</Label>
                    <div className="grid gap-2">
                      {performanceTiers.map((tier) => (
                        <div key={tier} className="flex items-center space-x-2">
                          <Checkbox
                            id={tier}
                            checked={selectedPerformanceTiers.includes(tier)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedPerformanceTiers([...selectedPerformanceTiers, tier])
                              } else {
                                setSelectedPerformanceTiers(selectedPerformanceTiers.filter(t => t !== tier))
                              }
                            }}
                          />
                          <Label htmlFor={tier} className="capitalize">{tier}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Level Range</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={levelRange.min}
                      onChange={(e) => setLevelRange({...levelRange, min: Number(e.target.value)})}
                      placeholder="Min"
                      min={1}
                      max={10}
                    />
                    <span>to</span>
                    <Input
                      type="number"
                      value={levelRange.max}
                      onChange={(e) => setLevelRange({...levelRange, max: Number(e.target.value)})}
                      placeholder="Max"
                      min={1}
                      max={10}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Points Range</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={pointsRange.min}
                      onChange={(e) => setPointsRange({...pointsRange, min: Number(e.target.value)})}
                      placeholder="Min"
                      min={0}
                    />
                    <span>to</span>
                    <Input
                      type="number"
                      value={pointsRange.max}
                      onChange={(e) => setPointsRange({...pointsRange, max: Number(e.target.value)})}
                      placeholder="Max"
                      min={0}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Point Award Configuration */}
            <div className="space-y-4">
              <h4 className="font-medium">Point Award Configuration</h4>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {(targetUserType === 'both' ? 
                        [...pointCategories.teacher, ...pointCategories.student] :
                        pointCategories[targetUserType] || []
                      ).map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.label} (+{category.points} pts)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Points Amount</Label>
                  <Input
                    type="number"
                    value={awardPoints}
                    onChange={(e) => setAwardPoints(Number(e.target.value))}
                    placeholder="Points to award"
                    min={1}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Reason</Label>
                <Input
                  value={awardReason}
                  onChange={(e) => setAwardReason(e.target.value)}
                  placeholder="Reason for point award"
                />
              </div>
            </div>

            <Separator />

            {/* Preview Impact */}
            <div className="space-y-4">
              <h4 className="font-medium">Operation Impact Preview</h4>
              
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="p-3 border-l-4 border-l-blue-500">
                  <div className="text-2xl font-bold text-blue-600">{impact.totalRecipients}</div>
                  <div className="text-sm text-muted-foreground">Recipients</div>
                </Card>
                <Card className="p-3 border-l-4 border-l-green-500">
                  <div className="text-2xl font-bold text-green-600">{impact.totalPointsImpact}</div>
                  <div className="text-sm text-muted-foreground">Total Points</div>
                </Card>
                <Card className="p-3 border-l-4 border-l-purple-500">
                  <div className="text-2xl font-bold text-purple-600">${impact.budgetImpact}</div>
                  <div className="text-sm text-muted-foreground">Budget Impact</div>
                </Card>
              </div>

              {impact.recipients.length > 0 && (
                <div>
                  <Label className="text-sm">Preview Recipients (first 10)</Label>
                  <div className="mt-2 grid gap-2">
                    {impact.recipients.map((recipient, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded text-sm">
                        <span>{recipient.full_name}</span>
                        <Badge variant="outline">
                          Level {recipient.ranking?.current_level || 1}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateOperation}
              disabled={!operationName || !selectedCategory || awardPoints <= 0}
            >
              Create Operation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Execution Progress Dialog */}
      <Dialog open={showExecutionDialog} onOpenChange={setShowExecutionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Bulk Operation Execution
            </DialogTitle>
            <DialogDescription>
              Monitoring point award distribution progress
            </DialogDescription>
          </DialogHeader>

          {executionProgress && (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress</span>
                  <span>{executionProgress.processed} of {executionProgress.total_recipients}</span>
                </div>
                <Progress 
                  value={(executionProgress.processed / executionProgress.total_recipients) * 100} 
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{executionProgress.processed}</div>
                  <div className="text-xs text-muted-foreground">Processed</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{executionProgress.successful}</div>
                  <div className="text-xs text-muted-foreground">Successful</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{executionProgress.failed}</div>
                  <div className="text-xs text-muted-foreground">Failed</div>
                </div>
              </div>

              {executionProgress.current_recipient && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium">Currently Processing:</div>
                  <div className="text-lg">{executionProgress.current_recipient}</div>
                </div>
              )}

              {executionProgress.errors.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm text-red-600">Errors:</Label>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {executionProgress.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-600 p-2 bg-red-50 rounded">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {executionProgress.processed === executionProgress.total_recipients && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">Operation Completed!</span>
                  </div>
                  <div className="text-sm text-green-700 mt-1">
                    Successfully awarded points to {executionProgress.successful} recipients
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowExecutionDialog(false)}
              disabled={executionProgress?.processed !== executionProgress?.total_recipients}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}