'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Slider } from '@/components/ui/slider'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { 
  Star,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Award,
  Calendar,
  Clock,
  User,
  BookOpen,
  Users,
  Settings,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  Save,
  Calculator,
  FileText,
  Eye
} from 'lucide-react'

// Import types
import { 
  TeacherEvaluationCriteria, 
  TeacherEvaluationSession, 
  CompensationAdjustment,
  TeacherWithRanking 
} from '@/types/ranking'

interface TeacherEvaluationInterfaceProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teacher: TeacherWithRanking
  evaluationPeriod: {
    start: string
    end: string
  }
  onSubmit: (evaluation: Omit<TeacherEvaluationSession, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  loading?: boolean
}

export function TeacherEvaluationInterface({
  open,
  onOpenChange,
  teacher,
  evaluationPeriod,
  onSubmit,
  loading = false
}: TeacherEvaluationInterfaceProps) {
  const t = useTranslations('rankings')
  
  // Mock evaluation criteria (will be loaded from API)
  const [evaluationCriteria] = useState<TeacherEvaluationCriteria[]>([
    {
      id: '1',
      organization_id: 'org-1',
      criteria_name: 'Teaching Quality',
      description: 'Overall teaching effectiveness and student engagement',
      weight_percentage: 30.00,
      max_points: 100,
      is_active: true,
      created_at: '2025-01-01',
      updated_at: '2025-01-01'
    },
    {
      id: '2',
      organization_id: 'org-1',
      criteria_name: 'Student Performance',
      description: 'Improvement in student grades and achievement',
      weight_percentage: 25.00,
      max_points: 100,
      is_active: true,
      created_at: '2025-01-01',
      updated_at: '2025-01-01'
    },
    {
      id: '3',
      organization_id: 'org-1',
      criteria_name: 'Professional Development',
      description: 'Participation in training and skill improvement',
      weight_percentage: 20.00,
      max_points: 100,
      is_active: true,
      created_at: '2025-01-01',
      updated_at: '2025-01-01'
    },
    {
      id: '4',
      organization_id: 'org-1',
      criteria_name: 'Administrative Tasks',
      description: 'Timely completion of administrative responsibilities',
      weight_percentage: 15.00,
      max_points: 100,
      is_active: true,
      created_at: '2025-01-01',
      updated_at: '2025-01-01'
    },
    {
      id: '5',
      organization_id: 'org-1',
      criteria_name: 'Collaboration',
      description: 'Teamwork and communication with colleagues',
      weight_percentage: 10.00,
      max_points: 100,
      is_active: true,
      created_at: '2025-01-01',
      updated_at: '2025-01-01'
    }
  ])

  const [criteriaScores, setCriteriaScores] = useState<{
    [criteriaId: string]: {
      score: number
      notes: string
    }
  }>({})

  const [compensationRecommendation, setCompensationRecommendation] = useState<{
    adjustment_type: 'bonus' | 'salary_increase' | 'performance_award'
    amount: number
    justification: string
  } | null>(null)

  const [showPreview, setShowPreview] = useState(false)

  // Initialize criteria scores if empty
  if (Object.keys(criteriaScores).length === 0) {
    const initialScores: typeof criteriaScores = {}
    evaluationCriteria.forEach(criteria => {
      initialScores[criteria.id] = { score: 75, notes: '' } // Default to 75% performance
    })
    setCriteriaScores(initialScores)
  }

  // Calculate overall metrics
  const calculateOverallScore = () => {
    let weightedTotal = 0
    let totalWeight = 0
    
    evaluationCriteria.forEach(criteria => {
      const score = criteriaScores[criteria.id]?.score || 0
      const weight = criteria.weight_percentage / 100
      weightedTotal += score * weight
      totalWeight += weight
    })
    
    return totalWeight > 0 ? weightedTotal / totalWeight : 0
  }

  const calculateEfficiencyPercentage = () => {
    // Simple calculation: average of administrative and collaboration scores
    const adminScore = criteriaScores['4']?.score || 0
    const collabScore = criteriaScores['5']?.score || 0
    return (adminScore + collabScore) / 2
  }

  const calculateQualityScore = () => {
    // Quality based on teaching and student performance
    const teachingScore = criteriaScores['1']?.score || 0
    const studentScore = criteriaScores['2']?.score || 0
    return (teachingScore * 0.6) + (studentScore * 0.4)
  }

  const getPerformanceTier = (score: number): 'standard' | 'good' | 'excellent' | 'outstanding' => {
    if (score >= 90) return 'outstanding'
    if (score >= 80) return 'excellent'
    if (score >= 70) return 'good'
    return 'standard'
  }

  const overallScore = calculateOverallScore()
  const efficiencyPercentage = calculateEfficiencyPercentage()
  const qualityScore = calculateQualityScore()
  const performanceTier = getPerformanceTier(overallScore)

  // Auto-generate compensation recommendation based on performance
  const generateCompensationRecommendation = () => {
    if (overallScore >= 85) {
      const baseAmount = overallScore >= 95 ? 2000 : overallScore >= 90 ? 1500 : 1000
      setCompensationRecommendation({
        adjustment_type: overallScore >= 95 ? 'salary_increase' : 'bonus',
        amount: baseAmount,
        justification: `Exceptional performance with overall score of ${overallScore.toFixed(1)}%. ${
          overallScore >= 95 
            ? 'Recommending permanent salary increase for outstanding performance.'
            : 'Recommending performance bonus for excellent work.'
        }`
      })
    } else {
      setCompensationRecommendation(null)
    }
  }

  const handleScoreChange = (criteriaId: string, score: number) => {
    setCriteriaScores(prev => ({
      ...prev,
      [criteriaId]: {
        ...prev[criteriaId],
        score
      }
    }))
  }

  const handleNotesChange = (criteriaId: string, notes: string) => {
    setCriteriaScores(prev => ({
      ...prev,
      [criteriaId]: {
        ...prev[criteriaId],
        notes
      }
    }))
  }

  const handleSubmit = async () => {
    const evaluationSession: Omit<TeacherEvaluationSession, 'id' | 'created_at' | 'updated_at'> = {
      teacher_id: teacher.teacher_id,
      evaluator_id: 'current-user-id', // Will be replaced with actual evaluator
      evaluation_period_start: evaluationPeriod.start,
      evaluation_period_end: evaluationPeriod.end,
      criteria_scores: evaluationCriteria.map(criteria => ({
        criteria_id: criteria.id,
        criteria_name: criteria.criteria_name,
        score: criteriaScores[criteria.id]?.score || 0,
        max_points: criteria.max_points,
        weight_percentage: criteria.weight_percentage,
        notes: criteriaScores[criteria.id]?.notes || ''
      })),
      overall_score: overallScore,
      efficiency_percentage: efficiencyPercentage,
      quality_score: qualityScore,
      performance_tier: performanceTier,
      compensation_recommendation: compensationRecommendation || undefined
    }

    await onSubmit(evaluationSession)
    onOpenChange(false)
  }

  const getCriteriaIcon = (criteriaName: string) => {
    switch (criteriaName.toLowerCase()) {
      case 'teaching quality': return <BookOpen className="h-4 w-4" />
      case 'student performance': return <TrendingUp className="h-4 w-4" />
      case 'professional development': return <Lightbulb className="h-4 w-4" />
      case 'administrative tasks': return <Settings className="h-4 w-4" />
      case 'collaboration': return <Users className="h-4 w-4" />
      default: return <Star className="h-4 w-4" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-blue-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'outstanding': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200'
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Teacher Performance Evaluation</span>
            </DialogTitle>
            <DialogDescription>
              Evaluate {teacher.full_name}'s performance for the period {evaluationPeriod.start} to {evaluationPeriod.end}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Teacher Information */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={`/api/avatars/${teacher.teacher_id}`} />
                    <AvatarFallback>
                      {teacher.full_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{teacher.full_name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>Period: {evaluationPeriod.start} - {evaluationPeriod.end}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Award className="h-3 w-3" />
                        <span>{teacher.ranking?.total_points || 0} points</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Evaluation Criteria */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Evaluation Criteria</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowPreview(true)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Results
                </Button>
              </div>

              {evaluationCriteria.map((criteria) => {
                const score = criteriaScores[criteria.id]?.score || 0
                const notes = criteriaScores[criteria.id]?.notes || ''
                
                return (
                  <Card key={criteria.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getCriteriaIcon(criteria.criteria_name)}
                          <CardTitle className="text-base">{criteria.criteria_name}</CardTitle>
                          <Badge variant="outline">
                            Weight: {criteria.weight_percentage}%
                          </Badge>
                        </div>
                        <div className={`text-lg font-bold ${getScoreColor(score)}`}>
                          {score}/100
                        </div>
                      </div>
                      <CardDescription>{criteria.description}</CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Score Slider */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Performance Score</Label>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleScoreChange(criteria.id, 60)}
                            >
                              Poor (60)
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleScoreChange(criteria.id, 75)}
                            >
                              Good (75)
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleScoreChange(criteria.id, 90)}
                            >
                              Excellent (90)
                            </Button>
                          </div>
                        </div>
                        
                        <Slider
                          value={[score]}
                          onValueChange={(values) => handleScoreChange(criteria.id, values[0])}
                          max={100}
                          min={0}
                          step={5}
                          className="w-full"
                        />
                        
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Poor (0-50)</span>
                          <span>Satisfactory (51-75)</span>
                          <span>Good (76-85)</span>
                          <span>Excellent (86-95)</span>
                          <span>Outstanding (96-100)</span>
                        </div>
                      </div>

                      {/* Notes */}
                      <div className="space-y-2">
                        <Label className="text-sm">Notes & Comments</Label>
                        <Textarea
                          placeholder="Provide specific feedback and observations..."
                          value={notes}
                          onChange={(e) => handleNotesChange(criteria.id, e.target.value)}
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="h-5 w-5" />
                  <span>Performance Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>
                      {overallScore.toFixed(1)}
                    </div>
                    <div className="text-sm text-muted-foreground">Overall Score</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(efficiencyPercentage)}`}>
                      {efficiencyPercentage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Efficiency</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(qualityScore)}`}>
                      {qualityScore.toFixed(1)}
                    </div>
                    <div className="text-sm text-muted-foreground">Quality</div>
                  </div>
                  <div className="text-center">
                    <Badge className={getTierColor(performanceTier)}>
                      {performanceTier.charAt(0).toUpperCase() + performanceTier.slice(1)}
                    </Badge>
                    <div className="text-sm text-muted-foreground mt-1">Performance Tier</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Compensation Recommendation */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5" />
                    <span>Compensation Recommendation</span>
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateCompensationRecommendation}
                  >
                    Auto-Generate
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {compensationRecommendation ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <Select 
                        value={compensationRecommendation.adjustment_type}
                        onValueChange={(value: any) => setCompensationRecommendation(prev => 
                          prev ? { ...prev, adjustment_type: value } : null
                        )}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bonus">Performance Bonus</SelectItem>
                          <SelectItem value="salary_increase">Salary Increase</SelectItem>
                          <SelectItem value="performance_award">Performance Award</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4" />
                        <Input
                          type="number"
                          value={compensationRecommendation.amount}
                          onChange={(e) => setCompensationRecommendation(prev => 
                            prev ? { ...prev, amount: parseFloat(e.target.value) || 0 } : null
                          )}
                          className="w-24"
                        />
                      </div>
                    </div>
                    
                    <Textarea
                      placeholder="Justification for compensation adjustment..."
                      value={compensationRecommendation.justification}
                      onChange={(e) => setCompensationRecommendation(prev => 
                        prev ? { ...prev, justification: e.target.value } : null
                      )}
                      rows={3}
                    />
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>No compensation adjustment recommended based on current performance.</p>
                    <p className="text-sm">Performance score must be 85+ for automatic recommendations.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Submit Evaluation
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Submit Teacher Evaluation?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently record the evaluation results for {teacher.full_name} and 
                    update their performance metrics. This action cannot be undone.
                    {compensationRecommendation && (
                      <>
                        <br /><br />
                        <strong>Compensation Recommendation:</strong> {compensationRecommendation.adjustment_type} 
                        of ${compensationRecommendation.amount.toLocaleString()}
                      </>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSubmit}>
                    Submit Evaluation
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Results Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Evaluation Preview</DialogTitle>
            <DialogDescription>
              Summary of {teacher.full_name}'s evaluation results
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center">
              <div className={`text-4xl font-bold mb-2 ${getScoreColor(overallScore)}`}>
                {overallScore.toFixed(1)}/100
              </div>
              <Badge className={`${getTierColor(performanceTier)} text-lg px-4 py-1`}>
                {performanceTier.charAt(0).toUpperCase() + performanceTier.slice(1)} Performance
              </Badge>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              {evaluationCriteria.map(criteria => {
                const score = criteriaScores[criteria.id]?.score || 0
                return (
                  <div key={criteria.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{criteria.criteria_name}</span>
                      <span className={`font-bold ${getScoreColor(score)}`}>
                        {score}/100
                      </span>
                    </div>
                    <Progress value={score} className="h-2" />
                  </div>
                )
              })}
            </div>
            
            {compensationRecommendation && (
              <>
                <Separator />
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">
                    Compensation Recommendation
                  </h4>
                  <p className="text-green-800">
                    <strong>{compensationRecommendation.adjustment_type}:</strong> ${compensationRecommendation.amount.toLocaleString()}
                  </p>
                  <p className="text-sm text-green-700 mt-2">
                    {compensationRecommendation.justification}
                  </p>
                </div>
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowPreview(false)}>Close Preview</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}