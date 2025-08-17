'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { 
  MessageSquare,
  Users,
  Calendar,
  Award,
  TrendingUp,
  Target,
  Star,
  Send,
  UserCheck,
  BarChart3,
  Clock,
  CheckCircle,
  Plus,
  ChevronDown,
  AlertCircle,
  FileText
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { GroupWithDetails } from '@/types/group'

interface QuickGroupFeedbackActionsProps {
  group: GroupWithDetails
  onFeedbackSubmitted?: () => void
}

interface FeedbackTemplate {
  id: string
  name: string
  category: string
  message: string
  rating?: number
}

export function QuickGroupFeedbackActions({ group, onFeedbackSubmitted }: QuickGroupFeedbackActionsProps) {
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)
  const [showBulkDialog, setShowBulkDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<FeedbackTemplate | null>(null)
  const [feedbackType, setFeedbackType] = useState<'individual' | 'group' | 'bulk'>('individual')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Mock templates - would come from feedback service
  const feedbackTemplates: FeedbackTemplate[] = [
    {
      id: '1',
      name: 'Excellent Participation',
      category: 'participation',
      message: 'Great participation in today\'s class discussion. Your questions and insights really enhanced the learning experience for everyone.',
      rating: 5
    },
    {
      id: '2',
      name: 'Improvement Needed',
      category: 'homework',
      message: 'I noticed you haven\'t submitted the last few assignments. Let\'s discuss how I can help you stay on track.',
      rating: 3
    },
    {
      id: '3',
      name: 'Teaching Quality Feedback',
      category: 'teaching_quality',
      message: 'The lesson was well-structured and easy to follow. The examples really helped clarify the concepts.',
      rating: 4
    }
  ]

  const handleQuickFeedback = async (action: string) => {
    setIsSubmitting(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log(`Quick feedback action: ${action} for group: ${group.id}`)
      
      onFeedbackSubmitted?.()
      setShowFeedbackDialog(false)
      setShowBulkDialog(false)
    } catch (error) {
      console.error('Error submitting feedback:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'praise': return <Award className="h-4 w-4 text-yellow-500" />
      case 'improvement': return <Target className="h-4 w-4 text-blue-500" />
      case 'participation': return <Users className="h-4 w-4 text-green-500" />
      case 'homework': return <FileText className="h-4 w-4 text-purple-500" />
      default: return <MessageSquare className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-4">
      {/* Quick Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <MessageSquare className="h-4 w-4 mr-2" />
              Quick Feedback
            </Button>
          </DialogTrigger>
        </Dialog>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Bulk Actions
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Bulk Feedback</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {
              setFeedbackType('bulk')
              setShowBulkDialog(true)
            }}>
              <Users className="h-4 w-4 mr-2" />
              Send to All Students
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              setFeedbackType('group')
              setShowBulkDialog(true)
            }}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Group Feedback Session
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" size="sm">
          <Calendar className="h-4 w-4 mr-2" />
          Schedule Session
        </Button>

        <Button variant="outline" size="sm">
          <BarChart3 className="h-4 w-4 mr-2" />
          View Analytics
        </Button>
      </div>

      {/* Quick Feedback Templates */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Feedback Templates</CardTitle>
          <CardDescription>Pre-made feedback for common scenarios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
            <Button 
              variant="outline" 
              className="h-auto p-3 justify-start text-left"
              onClick={() => handleQuickFeedback('praise')}
              disabled={isSubmitting}
            >
              <div className="flex items-start space-x-2">
                {getActionIcon('praise')}
                <div>
                  <div className="font-medium text-sm">Excellent Work</div>
                  <div className="text-xs text-muted-foreground">Praise performance</div>
                </div>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto p-3 justify-start text-left"
              onClick={() => handleQuickFeedback('improvement')}
              disabled={isSubmitting}
            >
              <div className="flex items-start space-x-2">
                {getActionIcon('improvement')}
                <div>
                  <div className="font-medium text-sm">Needs Improvement</div>
                  <div className="text-xs text-muted-foreground">Areas to work on</div>
                </div>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto p-3 justify-start text-left"
              onClick={() => handleQuickFeedback('participation')}
              disabled={isSubmitting}
            >
              <div className="flex items-start space-x-2">
                {getActionIcon('participation')}
                <div>
                  <div className="font-medium text-sm">Great Participation</div>
                  <div className="text-xs text-muted-foreground">Active engagement</div>
                </div>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto p-3 justify-start text-left"
              onClick={() => handleQuickFeedback('homework')}
              disabled={isSubmitting}
            >
              <div className="flex items-start space-x-2">
                {getActionIcon('homework')}
                <div>
                  <div className="font-medium text-sm">Homework Review</div>
                  <div className="text-xs text-muted-foreground">Assignment feedback</div>
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Individual Feedback Dialog */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submit Feedback</DialogTitle>
            <DialogDescription>
              Provide feedback for students in {group.name}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="individual" className="space-y-4">
            <TabsList>
              <TabsTrigger value="individual">Individual Student</TabsTrigger>
              <TabsTrigger value="teacher">To Teacher</TabsTrigger>
              <TabsTrigger value="group">Group Feedback</TabsTrigger>
            </TabsList>

            <TabsContent value="individual" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="student-select">Select Student</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a student" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student1">Sarah Johnson</SelectItem>
                      <SelectItem value="student2">Michael Chen</SelectItem>
                      <SelectItem value="student3">Emma Wilson</SelectItem>
                      <SelectItem value="student4">James Rodriguez</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-select">Use Template (Optional)</Label>
                  <Select onValueChange={(value) => {
                    const template = feedbackTemplates.find(t => t.id === value)
                    setSelectedTemplate(template || null)
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {feedbackTemplates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name} - {template.category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select defaultValue={selectedTemplate?.category}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="participation">Participation</SelectItem>
                      <SelectItem value="homework">Homework</SelectItem>
                      <SelectItem value="behavior">Behavior</SelectItem>
                      <SelectItem value="improvement">Improvement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rating">Rating</Label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Button
                        key={rating}
                        variant="outline"
                        size="sm"
                        className="p-2"
                        onClick={() => {}}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Feedback Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Write your feedback message..."
                    defaultValue={selectedTemplate?.message}
                    rows={4}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowFeedbackDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => handleQuickFeedback('individual')} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Feedback
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="teacher" className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-800">Feedback to Teacher</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Provide feedback about the teaching quality, lesson structure, or suggestions for improvement.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teacher-category">Category</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teaching_quality">Teaching Quality</SelectItem>
                      <SelectItem value="communication">Communication</SelectItem>
                      <SelectItem value="lesson_structure">Lesson Structure</SelectItem>
                      <SelectItem value="support">Student Support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teacher-rating">Rating</Label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Button
                        key={rating}
                        variant="outline"
                        size="sm"
                        className="p-2"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teacher-message">Feedback Message</Label>
                  <Textarea
                    id="teacher-message"
                    placeholder="Share your thoughts about the teaching approach..."
                    rows={4}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowFeedbackDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => handleQuickFeedback('teacher')} disabled={isSubmitting}>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Feedback
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="group" className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">Group Feedback</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Provide feedback about the overall group dynamics, collaboration, and learning environment.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="group-aspect">Focus Area</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="What aspect of the group?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="collaboration">Collaboration</SelectItem>
                      <SelectItem value="atmosphere">Class Atmosphere</SelectItem>
                      <SelectItem value="progress">Group Progress</SelectItem>
                      <SelectItem value="engagement">Overall Engagement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="group-message">Group Feedback</Label>
                  <Textarea
                    id="group-message"
                    placeholder="Share observations about the group dynamics..."
                    rows={4}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowFeedbackDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => handleQuickFeedback('group')} disabled={isSubmitting}>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Group Feedback
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Bulk Feedback Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Feedback Actions</DialogTitle>
            <DialogDescription>
              Send feedback to multiple students or schedule group sessions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {feedbackType === 'bulk' && (
              <>
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium text-yellow-800">Bulk Feedback</span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    This will send the same feedback message to all selected students in the group.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Select Students</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Sarah Johnson', 'Michael Chen', 'Emma Wilson', 'James Rodriguez'].map((student) => (
                      <label key={student} className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" defaultChecked />
                        <span className="text-sm">{student}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            {feedbackType === 'group' && (
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-purple-800">Group Feedback Session</span>
                </div>
                <p className="text-sm text-purple-700">
                  Schedule a dedicated feedback session with the entire group for more detailed discussion.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="bulk-template">Template</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template" />
                </SelectTrigger>
                <SelectContent>
                  {feedbackTemplates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-message">Message</Label>
              <Textarea
                id="bulk-message"
                placeholder="Write your message..."
                rows={4}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleQuickFeedback('bulk')} disabled={isSubmitting}>
                <Send className="h-4 w-4 mr-2" />
                {feedbackType === 'bulk' ? 'Send to Selected' : 'Schedule Session'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}