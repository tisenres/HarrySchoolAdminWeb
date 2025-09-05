'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  UserPlus,
  Phone,
  User,
  FileText,
  Award,
  Loader2
} from 'lucide-react'
import type { ReferralFormData } from '@/types/referral'
import { fadeVariants } from '@/lib/animations'

// Form validation schema
const referralFormSchema = z.object({
  referred_student_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s\u0400-\u04FF\u0100-\u017F]+$/, 'Name can only contain letters and spaces'),
  referred_student_phone: z
    .string()
    .optional()
    .refine((phone) => {
      if (!phone) return true
      // Basic phone validation for Uzbekistan/international format
      const phoneRegex = /^(\+998|998|8)?[0-9]{9}$/
      return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
    }, 'Please enter a valid phone number'),
  contact_notes: z
    .string()
    .optional()
    .refine((notes) => !notes || notes.length <= 500, 'Notes must be less than 500 characters')
})

type ReferralFormSchema = z.infer<typeof referralFormSchema>

interface ReferralSubmissionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: ReferralFormData) => Promise<void>
  loading?: boolean
  studentName: string
}

export function ReferralSubmissionForm({
  open,
  onOpenChange,
  onSubmit,
  loading = false,
  studentName
}: ReferralSubmissionFormProps) {
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const form = useForm<ReferralFormSchema>({
    resolver: zodResolver(referralFormSchema),
    defaultValues: {
      referred_student_name: '',
      referred_student_phone: '',
      contact_notes: ''
    }
  })

  const handleSubmit = async (data: ReferralFormSchema) => {
    try {
      await onSubmit(data)
      setSubmitSuccess(true)
      form.reset()
      // Auto close after success
      setTimeout(() => {
        setSubmitSuccess(false)
        onOpenChange(false)
      }, 1500)
    } catch (error) {
      console.error('Error submitting referral:', error)
    }
  }

  const handleClose = () => {
    if (!loading) {
      form.reset()
      setSubmitSuccess(false)
      onOpenChange(false)
    }
  }

  // Format phone number for display
  const formatPhoneInput = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length === 0) return ''
    if (cleaned.length <= 3) return cleaned
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`
    if (cleaned.length <= 9) return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)}`
  }

  if (submitSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Referral Submitted Successfully!
            </h3>
            <p className="text-sm text-green-600 mb-4">
              Thank you for referring a new student. You'll earn points when they enroll!
            </p>
            <Badge className="bg-green-100 text-green-800 border-green-300">
              +50 points when enrolled
            </Badge>
          </motion.div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5 text-blue-600" />
            <span>Submit Student Referral</span>
          </DialogTitle>
          <DialogDescription>
            Help us grow by referring friends and family! Earn points and achievements for successful referrals.
          </DialogDescription>
        </DialogHeader>

        <motion.div
          variants={fadeVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Referrer Info */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-blue-800">Referrer</p>
                <p className="text-sm text-blue-600">{studentName}</p>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Referred Student Name */}
              <FormField
                control={form.control}
                name="referred_student_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>Student Full Name</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter the full name of the student you're referring"
                        {...field}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormDescription>
                      Please provide the complete name as it would appear on enrollment documents.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone Number */}
              <FormField
                control={form.control}
                name="referred_student_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Phone className="h-4 w-4" />
                      <span>Phone Number (Optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+998 90 123 45 67"
                        {...field}
                        onChange={(e) => {
                          const formatted = formatPhoneInput(e.target.value)
                          field.onChange(formatted)
                        }}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormDescription>
                      Contact number for the referred student or their parent/guardian.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contact Notes */}
              <FormField
                control={form.control}
                name="contact_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>Additional Notes (Optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional information about the referred student (interests, current level, etc.)"
                        rows={3}
                        {...field}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormDescription>
                      Help us understand the student's background or interests (max 500 characters).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Reward Information */}
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-medium text-yellow-800 mb-2 flex items-center space-x-2">
                  <Award className="h-4 w-4" />
                  <span>Referral Rewards</span>
                </h4>
                <div className="space-y-2 text-sm text-yellow-700">
                  <div className="flex items-center justify-between">
                    <span>When student enrolls:</span>
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                      +50 points
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Bonus achievement unlock:</span>
                    <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                      Special badges
                    </Badge>
                  </div>
                  <p className="text-xs text-yellow-600 pt-2 border-t border-yellow-200">
                    Points are awarded automatically when the referred student completes enrollment.
                  </p>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="min-w-[120px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Submit Referral
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}