'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Star,
  MessageSquare,
  Send,
  AlertTriangle,
  CheckCircle,
  User,
  Users,
  Book,
  Clock
} from 'lucide-react'
import { feedbackService } from '@/lib/services/feedback-service'
import type { FeedbackSubmission, FeedbackTemplate } from '@/types/feedback'
import type { TeacherWithRanking } from '@/types/ranking'

interface FeedbackSubmissionFormProps {
  recipient: TeacherWithRanking | { id: string; full_name: string; user_type: 'student' | 'teacher' }
  groupContext?: { id: string; name: string; subject?: string }
  onSubmit?: (feedback: FeedbackSubmission) => void
  onCancel?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  compactMode?: boolean
  trigger?: React.ReactNode
}

export function FeedbackSubmissionForm({
  recipient,
  groupContext,
  onSubmit,
  onCancel,
  open,
  onOpenChange,
  compactMode = false,
  trigger
}: FeedbackSubmissionFormProps) {
  const [formData, setFormData] = useState<Partial<FeedbackSubmission>>({
    to_user_id: recipient.id,
    to_user_type: recipient.user_type || 'teacher',
    rating: 5,
    category: 'teaching_quality',
    is_anonymous: false,
    affects_ranking: true,
    group_id: groupContext?.id
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [templates, setTemplates] = useState<FeedbackTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Feedback categories with icons and descriptions
  const categories = [
    { 
      value: 'teaching_quality', 
      label: 'Teaching Quality', 
      icon: <Book className="h-4 w-4" />,
      description: 'Clarity, engagement, and effectiveness of teaching'
    },
    { 
      value: 'communication', 
      label: 'Communication', 
      icon: <MessageSquare className="h-4 w-4" />,
      description: 'Responsiveness, clarity, and helpfulness in communication'
    },
    { 
      value: 'behavior', 
      label: 'Professional Behavior', 
      icon: <User className="h-4 w-4" />,
      description: 'Professionalism, punctuality, and classroom management'
    },
    { 
      value: 'professional_development', 
      label: 'Growth & Innovation', 
      icon: <Star className="h-4 w-4" />,
      description: 'Continuous improvement and new teaching methods'
    }
  ]

  const handleInputChange = (field: keyof FeedbackSubmission, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setFormData(prev => ({
        ...prev,
        subject: template.subject_template,
        message: template.message_template || '',
        rating: template.default_rating || 5,
        category: template.category || 'teaching_quality'
      }))
      setSelectedTemplate(templateId)
    }
  }

  const validateForm = (): string | null => {
    if (!formData.message?.trim()) {
      return 'Feedback message is required'
    }
    if (formData.message.trim().length < 10) {
      return 'Please provide more detailed feedback (at least 10 characters)'
    }
    if (!formData.rating || formData.rating < 1 || formData.rating > 5) {
      return 'Please select a rating between 1 and 5'
    }
    if (!formData.category) {
      return 'Please select a feedback category'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const submission: FeedbackSubmission = {
        to_user_id: formData.to_user_id!,
        to_user_type: formData.to_user_type!,
        subject: formData.subject,
        message: formData.message!,
        rating: formData.rating!,
        category: formData.category!,
        group_id: formData.group_id,
        is_anonymous: formData.is_anonymous,
        affects_ranking: formData.affects_ranking
      }

      await feedbackService.submitFeedback(submission)
      
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onSubmit?.(submission)
        onOpenChange?.(false)
        // Reset form
        setFormData({
          to_user_id: recipient.id,
          to_user_type: recipient.user_type || 'teacher',
          rating: 5,
          category: 'teaching_quality',
          is_anonymous: false,
          affects_ranking: true,
          group_id: groupContext?.id
        })
      }, 2000)
    } catch (err) {
      console.error('Error submitting feedback:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit feedback')
    } finally {
      setIsSubmitting(false)
    }
  }

  const StarRating = ({ rating, onRatingChange }: { rating: number; onRatingChange: (rating: number) => void }) => (
    <div className="flex items-center space-x-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onRatingChange(i + 1)}
          className="p-1 rounded transition-colors hover:bg-muted"
        >
          <Star
            className={`h-5 w-5 ${
              i < rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300 hover:text-yellow-400'
            }`}
          />
        </button>
      ))}
      <span className="ml-2 text-sm text-muted-foreground">
        {rating === 1 && "Poor"}
        {rating === 2 && "Fair"}
        {rating === 3 && "Good"}
        {rating === 4 && "Very Good"}
        {rating === 5 && "Excellent"}
      </span>
    </div>
  )

  const FormContent = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertTriangle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
          <CheckCircle className="h-4 w-4" />
          <span>Feedback submitted successfully!</span>
        </div>
      )}

      {/* Recipient Info */}
      <div className="p-3 bg-muted rounded-lg">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {recipient.full_name.charAt(0)}
          </div>
          <div>
            <p className="font-medium">{recipient.full_name}</p>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                {recipient.user_type === 'teacher' ? 'Teacher' : 'Student'}
              </Badge>
              {groupContext && (
                <Badge variant="outline" className="text-xs">
                  {groupContext.name}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Templates (if available) */}
      {templates.length > 0 && (
        <div className="space-y-2">
          <Label>Quick Templates</Label>
          <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select a template (optional)" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.template_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Rating */}
      <div className="space-y-2">
        <Label>Overall Rating *</Label>
        <StarRating
          rating={formData.rating || 5}
          onRatingChange={(rating) => handleInputChange('rating', rating)}
        />
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label>Feedback Category *</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {categories.map((category) => (
            <div
              key={category.value}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                formData.category === category.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleInputChange('category', category.value)}
            >
              <div className="flex items-center space-x-2 mb-1">
                {category.icon}
                <span className="font-medium text-sm">{category.label}</span>
              </div>
              <p className="text-xs text-muted-foreground">{category.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Subject (optional) */}
      <div className="space-y-2">
        <Label>Subject (Optional)</Label>
        <Input
          placeholder="Brief summary of your feedback"
          value={formData.subject || ''}
          onChange={(e) => handleInputChange('subject', e.target.value)}
          maxLength={200}
        />
      </div>

      {/* Message */}
      <div className="space-y-2">
        <Label>Your Feedback *</Label>
        <Textarea
          placeholder="Share your detailed feedback..."
          value={formData.message || ''}
          onChange={(e) => handleInputChange('message', e.target.value)}
          rows={4}
          maxLength={1000}
          className="resize-none"
        />
        <div className="text-xs text-muted-foreground text-right">
          {(formData.message || '').length}/1000 characters
        </div>
      </div>

      {/* Options */}
      <div className="space-y-4 p-4 bg-muted rounded-lg">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label>Submit Anonymously</Label>
            <p className="text-xs text-muted-foreground">
              Your identity will be hidden from the recipient
            </p>
          </div>
          <Switch
            checked={formData.is_anonymous || false}
            onCheckedChange={(checked) => handleInputChange('is_anonymous', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label>Impact Teacher Ranking</Label>
            <p className="text-xs text-muted-foreground">
              This feedback will contribute to performance metrics
            </p>
          </div>
          <Switch
            checked={formData.affects_ranking ?? true}
            onCheckedChange={(checked) => handleInputChange('affects_ranking', checked)}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button 
          type="submit" 
          disabled={isSubmitting || success}
          className="min-w-[120px]"
        >
          {isSubmitting ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Submitting...</span>
            </div>
          ) : success ? (
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>Submitted!</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Send className="h-4 w-4" />
              <span>Submit Feedback</span>
            </div>
          )}
        </Button>
      </div>
    </form>
  )

  if (compactMode) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Share Feedback</span>
          </CardTitle>
          <CardDescription>
            Help {recipient.full_name} improve by sharing your experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormContent />
        </CardContent>
      </Card>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Submit Feedback</span>
          </DialogTitle>
          <DialogDescription>
            Share your experience with {recipient.full_name} to help them improve and grow.
          </DialogDescription>
        </DialogHeader>
        <FormContent />
      </DialogContent>
    </Dialog>
  )
}