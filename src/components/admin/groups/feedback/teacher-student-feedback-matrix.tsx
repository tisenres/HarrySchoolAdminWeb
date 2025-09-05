'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Star,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  Award,
  Target,
  ChevronRight,
  Plus,
  Eye,
  Filter
} from 'lucide-react'
import { feedbackService } from '@/lib/services/feedback-service'
import type { GroupWithDetails } from '@/types/group'
import type { FeedbackEntry } from '@/types/feedback'

interface TeacherStudentFeedbackMatrixProps {
  group: GroupWithDetails
}

interface StudentFeedbackData {
  student_id: string
  student_name: string
  avatar_url?: string
  feedback_to_teacher: {
    count: number
    average_rating: number
    latest_feedback_date?: string
    categories: Record<string, number>
  }
  feedback_from_teacher: {
    count: number
    average_rating: number
    latest_feedback_date?: string
    categories: Record<string, number>
  }
  engagement_score: number
  feedback_quality_score: number
  participation_level: 'high' | 'medium' | 'low'
}

interface FeedbackMatrixData {
  students: StudentFeedbackData[]
  teacher_summary: {
    total_feedback_received: number
    total_feedback_given: number
    average_rating_received: number
    average_rating_given: number
    response_rate: number
  }
  group_statistics: {
    total_feedback_interactions: number
    average_engagement: number
    feedback_frequency: number
    most_active_category: string
  }
}

export function TeacherStudentFeedbackMatrix({ group }: TeacherStudentFeedbackMatrixProps) {
  const [matrixData, setMatrixData] = useState<FeedbackMatrixData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState<StudentFeedbackData | null>(null)
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)

  useEffect(() => {
    loadFeedbackMatrix()
  }, [group.id])

  const loadFeedbackMatrix = async () => {
    try {
      setIsLoading(true)
      
      // In a real implementation, this would call a specific API endpoint
      // For now, using mock data that represents the feedback matrix
      const mockData = getMockFeedbackMatrixData()
      setMatrixData(mockData)
      
    } catch (err) {
      console.error('Error loading feedback matrix:', err)
      setMatrixData(getMockFeedbackMatrixData())
    } finally {
      setIsLoading(false)
    }
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600'
    if (rating >= 3.5) return 'text-blue-600'
    if (rating >= 2.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getEngagementColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800'
    if (score >= 60) return 'bg-blue-100 text-blue-800'
    if (score >= 40) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getParticipationBadge = (level: string) => {
    const variants = {
      high: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-red-100 text-red-800'
    }
    return variants[level as keyof typeof variants] || variants.medium
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No feedback yet'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const handleStudentClick = (student: StudentFeedbackData) => {
    setSelectedStudent(student)
    setShowFeedbackDialog(true)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Teacher-Student Feedback Matrix</CardTitle>
          <CardDescription>Loading feedback interactions...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-8 w-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!matrixData) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Matrix Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{matrixData.group_statistics.total_feedback_interactions}</div>
                <div className="text-xs text-muted-foreground">Total Interactions</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{matrixData.group_statistics.average_engagement.toFixed(0)}%</div>
                <div className="text-xs text-muted-foreground">Avg Engagement</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{matrixData.group_statistics.feedback_frequency.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">Feedback/Week</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{Math.round(matrixData.teacher_summary.response_rate * 100)}%</div>
                <div className="text-xs text-muted-foreground">Response Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feedback Matrix Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Feedback Interaction Matrix</CardTitle>
              <CardDescription>
                Bidirectional feedback between teacher and students in {group.name}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Feedback
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Participation</TableHead>
                <TableHead>To Teacher</TableHead>
                <TableHead>From Teacher</TableHead>
                <TableHead>Engagement</TableHead>
                <TableHead>Quality Score</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matrixData.students.map((student) => (
                <TableRow 
                  key={student.student_id} 
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleStudentClick(student)}
                >
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={student.avatar_url} />
                        <AvatarFallback>
                          {student.student_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{student.student_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getParticipationBadge(student.participation_level)}>
                      {student.participation_level}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{student.feedback_to_teacher.count}</span>
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className={`text-sm ${getRatingColor(student.feedback_to_teacher.average_rating)}`}>
                          {student.feedback_to_teacher.average_rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{student.feedback_from_teacher.count}</span>
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className={`text-sm ${getRatingColor(student.feedback_from_teacher.average_rating)}`}>
                          {student.feedback_from_teacher.average_rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="w-12">
                        <Progress value={student.engagement_score} className="h-2" />
                      </div>
                      <span className="text-sm font-medium">{student.engagement_score}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getEngagementColor(student.feedback_quality_score)}>
                      {student.feedback_quality_score}/100
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(student.feedback_to_teacher.latest_feedback_date || student.feedback_from_teacher.latest_feedback_date)}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Teacher Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Teacher Feedback Summary</CardTitle>
          <CardDescription>
            Overall feedback metrics for {group.teacher_name || 'the assigned teacher'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {matrixData.teacher_summary.total_feedback_received}
              </div>
              <div className="text-sm text-muted-foreground">Feedback Received</div>
              <div className="text-xs text-muted-foreground mt-1">
                Avg: {matrixData.teacher_summary.average_rating_received.toFixed(1)}/5.0
              </div>
            </div>

            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {matrixData.teacher_summary.total_feedback_given}
              </div>
              <div className="text-sm text-muted-foreground">Feedback Given</div>
              <div className="text-xs text-muted-foreground mt-1">
                Avg: {matrixData.teacher_summary.average_rating_given.toFixed(1)}/5.0
              </div>
            </div>

            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(matrixData.teacher_summary.response_rate * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Response Rate</div>
              <div className="text-xs text-muted-foreground mt-1">
                Feedback responsiveness
              </div>
            </div>

            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-orange-600 capitalize">
                {matrixData.group_statistics.most_active_category.replace('_', ' ')}
              </div>
              <div className="text-sm text-muted-foreground">Top Category</div>
              <div className="text-xs text-muted-foreground mt-1">
                Most discussed topic
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Detail Dialog */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Feedback Details: {selectedStudent?.student_name}
            </DialogTitle>
            <DialogDescription>
              Detailed feedback interaction history and metrics
            </DialogDescription>
          </DialogHeader>
          
          {selectedStudent && (
            <div className="space-y-6">
              {/* Student Overview */}
              <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedStudent.avatar_url} />
                  <AvatarFallback>
                    {selectedStudent.student_name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">{selectedStudent.student_name}</h3>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>Engagement: {selectedStudent.engagement_score}%</span>
                    <span>Quality Score: {selectedStudent.feedback_quality_score}/100</span>
                    <Badge className={getParticipationBadge(selectedStudent.participation_level)}>
                      {selectedStudent.participation_level} participation
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Feedback Exchange Summary */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base">Feedback to Teacher</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Feedback:</span>
                      <span className="font-medium">{selectedStudent.feedback_to_teacher.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Average Rating:</span>
                      <span className={`font-medium ${getRatingColor(selectedStudent.feedback_to_teacher.average_rating)}`}>
                        {selectedStudent.feedback_to_teacher.average_rating.toFixed(1)}/5.0
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Last Feedback:</span>
                      <span className="text-muted-foreground text-sm">
                        {formatDate(selectedStudent.feedback_to_teacher.latest_feedback_date)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base">Feedback from Teacher</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Feedback:</span>
                      <span className="font-medium">{selectedStudent.feedback_from_teacher.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Average Rating:</span>
                      <span className={`font-medium ${getRatingColor(selectedStudent.feedback_from_teacher.average_rating)}`}>
                        {selectedStudent.feedback_from_teacher.average_rating.toFixed(1)}/5.0
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Last Feedback:</span>
                      <span className="text-muted-foreground text-sm">
                        {formatDate(selectedStudent.feedback_from_teacher.latest_feedback_date)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Give Feedback
                </Button>
                <Button variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  View All Feedback
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Mock data helper
function getMockFeedbackMatrixData(): FeedbackMatrixData {
  return {
    students: [
      {
        student_id: '1',
        student_name: 'Sarah Johnson',
        feedback_to_teacher: {
          count: 4,
          average_rating: 4.5,
          latest_feedback_date: '2025-01-15T10:30:00Z',
          categories: { teaching_quality: 4.5, communication: 4.0 }
        },
        feedback_from_teacher: {
          count: 3,
          average_rating: 4.2,
          latest_feedback_date: '2025-01-12T14:20:00Z',
          categories: { homework: 4.0, participation: 4.5 }
        },
        engagement_score: 85,
        feedback_quality_score: 92,
        participation_level: 'high'
      },
      {
        student_id: '2',
        student_name: 'Michael Chen',
        feedback_to_teacher: {
          count: 2,
          average_rating: 3.8,
          latest_feedback_date: '2025-01-10T16:45:00Z',
          categories: { teaching_quality: 4.0, communication: 3.5 }
        },
        feedback_from_teacher: {
          count: 4,
          average_rating: 3.5,
          latest_feedback_date: '2025-01-14T11:30:00Z',
          categories: { homework: 3.0, participation: 4.0 }
        },
        engagement_score: 65,
        feedback_quality_score: 78,
        participation_level: 'medium'
      },
      {
        student_id: '3',
        student_name: 'Emma Wilson',
        feedback_to_teacher: {
          count: 5,
          average_rating: 4.8,
          latest_feedback_date: '2025-01-16T09:15:00Z',
          categories: { teaching_quality: 5.0, communication: 4.5 }
        },
        feedback_from_teacher: {
          count: 2,
          average_rating: 4.7,
          latest_feedback_date: '2025-01-13T15:45:00Z',
          categories: { homework: 4.5, participation: 5.0 }
        },
        engagement_score: 95,
        feedback_quality_score: 96,
        participation_level: 'high'
      },
      {
        student_id: '4',
        student_name: 'James Rodriguez',
        feedback_to_teacher: {
          count: 1,
          average_rating: 3.0,
          latest_feedback_date: '2025-01-08T13:20:00Z',
          categories: { teaching_quality: 3.0 }
        },
        feedback_from_teacher: {
          count: 5,
          average_rating: 2.8,
          latest_feedback_date: '2025-01-15T16:30:00Z',
          categories: { homework: 2.5, participation: 3.0, behavior: 3.0 }
        },
        engagement_score: 35,
        feedback_quality_score: 42,
        participation_level: 'low'
      }
    ],
    teacher_summary: {
      total_feedback_received: 12,
      total_feedback_given: 14,
      average_rating_received: 4.2,
      average_rating_given: 3.8,
      response_rate: 0.86
    },
    group_statistics: {
      total_feedback_interactions: 26,
      average_engagement: 70,
      feedback_frequency: 2.8,
      most_active_category: 'teaching_quality'
    }
  }
}