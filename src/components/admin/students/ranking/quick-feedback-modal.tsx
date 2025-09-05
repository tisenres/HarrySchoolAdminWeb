'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { 
  MessageSquare,
  Star,
  Send,
  User,
  Users,
  Loader2
} from 'lucide-react'
import type { FeedbackFormData } from '@/types/feedback'
import { fadeVariants } from '@/lib/animations'

interface QuickFeedbackModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipientId: string
  recipientName: string
  recipientType: 'student' | 'teacher'
  onSubmit: (data: FeedbackFormData) => Promise<void>
  loading?: boolean
}

const FEEDBACK_CATEGORIES = [
  { value: 'teaching_quality', label: 'Teaching Quality', icon: '👨‍🏫' },
  { value: 'communication', label: 'Communication', icon: '💬' },
  { value: 'behavior', label: 'Behavior', icon: '⭐' },
  { value: 'homework', label: 'Homework', icon: '📚' },
  { value: 'attendance', label: 'Attendance', icon: '📅' },
  { value: 'professional_development', label: 'Professional Development', icon: '📈' }
]

export function QuickFeedbackModal({
  open,
  onOpenChange,
  recipientId,
  recipientName,
  recipientType,
  onSubmit,
  loading = false
}: QuickFeedbackModalProps) {
  const [formData, setFormData] = useState<Partial<FeedbackFormData>>({
    rating: 5,
    message: '',
    category: '',
    is_anonymous: false
  })

  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.message?.trim() || !formData.category || !formData.rating) {
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        to_user_id: recipientId,
        to_user_type: recipientType,
        message: formData.message,
        rating: formData.rating,
        category: formData.category,
        is_anonymous: formData.is_anonymous || false
      })
      
      // Reset form
      setFormData({
        rating: 5,
        message: '',
        category: '',
        is_anonymous: false
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Error submitting feedback:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const getRatingStars = (rating: number, interactive = false) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-6 w-6 cursor-pointer transition-colors ${
          i < rating ? 'text-yellow-500 fill-current' : 'text-gray-300 hover:text-yellow-400'
        }`}
        onClick={interactive ? () => setFormData(prev => ({ ...prev, rating: i + 1 })) : undefined}
      />
    ))
  }

  const isFormValid = formData.message?.trim() && formData.category && formData.rating

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Give Feedback</span>
          </DialogTitle>
          <DialogDescription>
            Share your thoughts with {recipientName}
          </DialogDescription>
        </DialogHeader>

        <motion.form
          variants={fadeVariants}
          initial="hidden"
          animate="visible"
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Recipient Info */}
          <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full text-white font-medium">
              {recipientType === 'teacher' ? <User className="h-5 w-5" /> : <Users className="h-5 w-5" />}
            </div>
            <div>
              <p className="font-medium">{recipientName}</p>
              <p className="text-sm text-muted-foreground capitalize">{recipientType}</p>
            </div>
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex items-center space-x-2">
              {getRatingStars(formData.rating || 5, true)}
              <span className="text-sm text-muted-foreground ml-2">
                {formData.rating || 5}/5
              </span>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select feedback category" />
              </SelectTrigger>
              <SelectContent>
                {FEEDBACK_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    <div className="flex items-center space-x-2">
                      <span>{category.icon}</span>
                      <span>{category.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label>Your Feedback</Label>
            <Textarea
              placeholder="Share your thoughts, suggestions, or appreciation..."
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Be specific and constructive</span>
              <span>{formData.message?.length || 0}/500</span>
            </div>
          </div>

          {/* Anonymous Option */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Submit Anonymously</Label>
              <p className="text-xs text-muted-foreground">
                Your name won't be shown with this feedback
              </p>
            </div>
            <Switch
              checked={formData.is_anonymous}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_anonymous: checked }))}
            />
          </div>

          {/* Impact Notice */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Points Impact
              </Badge>
              <p className="text-xs text-blue-700 flex-1">
                This feedback will contribute to {recipientName}'s ranking and may award points based on the rating and category.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!isFormValid || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
        </motion.form>
      </DialogContent>
    </Dialog>
  )
}