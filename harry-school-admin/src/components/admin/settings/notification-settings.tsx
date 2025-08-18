'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { LoadingButton } from '@/components/ui/loading-button'
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
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'
import {
  Loader2,
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  Users,
  GraduationCap,
  DollarSign,
  AlertTriangle,
  Clock
} from 'lucide-react'

const notificationSettingsSchema = z.object({
  email_enabled: z.boolean().optional(),
  push_enabled: z.boolean().optional(),
  sms_enabled: z.boolean().optional(),
  quiet_hours_enabled: z.boolean().optional(),
  quiet_hours_start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').optional(),
  quiet_hours_end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').optional(),
  student_updates: z.boolean().optional(),
  teacher_updates: z.boolean().optional(),
  payment_reminders: z.boolean().optional(),
  system_alerts: z.boolean().optional(),
  immediate_alerts: z.boolean().optional(),
  daily_digest: z.boolean().optional(),
  weekly_summary: z.boolean().optional(),
  escalation_enabled: z.boolean().optional(),
  escalation_delay_minutes: z.number().min(5).max(180).optional(),
  max_escalation_levels: z.number().min(1).max(5).optional()
})

type NotificationSettingsFormValues = z.infer<typeof notificationSettingsSchema>

export function NotificationSettings() {
  const queryClient = useQueryClient()
  
  const form = useForm<NotificationSettingsFormValues>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      email_enabled: true,
      push_enabled: false,
      sms_enabled: false,
      quiet_hours_enabled: false,
      quiet_hours_start: '22:00',
      quiet_hours_end: '08:00',
      student_updates: true,
      teacher_updates: true,
      payment_reminders: true,
      system_alerts: true,
      immediate_alerts: false,
      daily_digest: true,
      weekly_summary: false,
      escalation_enabled: false,
      escalation_delay_minutes: 30,
      max_escalation_levels: 2
    },
  })

  // Fetch notification settings with React Query
  const { isLoading, data: settings } = useQuery({
    queryKey: ['notification-settings'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/settings/notifications')
        if (response.ok) {
          const data = await response.json()
          return data
        } else {
          // Fallback to localStorage
          const saved = localStorage.getItem('notification_settings')
          if (saved) {
            try {
              return JSON.parse(saved)
            } catch {
              return null
            }
          }
        }
      } catch (error) {
        console.error('Error fetching notification settings:', error)
        // Try localStorage fallback
        const saved = localStorage.getItem('notification_settings')
        if (saved) {
          try {
            return JSON.parse(saved)
          } catch {
            return null
          }
        }
      }
      return null
    },
    staleTime: 0, // Always fresh for immediate updates
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

  // Update form when settings are fetched
  if (settings && !form.formState.isDirty) {
    form.reset(settings)
  }

  // Mutation for saving settings
  const { mutate: saveSettings, isPending: isSaving } = useMutation({
    mutationFn: async (data: NotificationSettingsFormValues) => {
      const response = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        // Store in localStorage as fallback
        localStorage.setItem('notification_settings', JSON.stringify(data))
      }
      
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] })
      toast.success('Notification settings updated successfully')
    },
    onError: (error, data) => {
      console.error('Error updating notification settings:', error)
      // Fallback: save to localStorage and show success
      localStorage.setItem('notification_settings', JSON.stringify(data))
      toast.success('Notification preferences saved locally')
    },
  })

  const onSubmit = (data: NotificationSettingsFormValues) => {
    saveSettings(data)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Notification Channels */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Channels
              </CardTitle>
              <CardDescription>
                Choose how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="email_enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          <Mail className="h-4 w-4 inline mr-2" />
                          Email
                        </FormLabel>
                        <FormDescription>
                          Receive notifications via email
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="push_enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          <Smartphone className="h-4 w-4 inline mr-2" />
                          Push Notifications
                        </FormLabel>
                        <FormDescription>
                          Browser push notifications
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sms_enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          <MessageSquare className="h-4 w-4 inline mr-2" />
                          SMS
                        </FormLabel>
                        <FormDescription>
                          Text message notifications
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Quiet Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Quiet Hours
              </CardTitle>
              <CardDescription>
                Set hours when you don't want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="quiet_hours_enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Enable Quiet Hours
                      </FormLabel>
                      <FormDescription>
                        Suppress notifications during specified hours
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch('quiet_hours_enabled') && (
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="quiet_hours_start"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormDescription>When quiet hours begin</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quiet_hours_end"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormDescription>When quiet hours end</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Content Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Notification Types
              </CardTitle>
              <CardDescription>
                Choose what types of activities you want to be notified about
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="student_updates"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          <GraduationCap className="h-4 w-4 inline mr-2" />
                          Student Updates
                        </FormLabel>
                        <FormDescription>
                          New student registrations and changes
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="teacher_updates"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          <Users className="h-4 w-4 inline mr-2" />
                          Teacher Updates
                        </FormLabel>
                        <FormDescription>
                          Teacher schedule and profile changes
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="payment_reminders"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          <DollarSign className="h-4 w-4 inline mr-2" />
                          Payment Reminders
                        </FormLabel>
                        <FormDescription>
                          Payment due dates and reminders
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="system_alerts"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          <AlertTriangle className="h-4 w-4 inline mr-2" />
                          System Alerts
                        </FormLabel>
                        <FormDescription>
                          System maintenance and important updates
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Email Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Preferences
              </CardTitle>
              <CardDescription>
                Configure how email notifications are sent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="immediate_alerts"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Immediate Alerts
                        </FormLabel>
                        <FormDescription>
                          Send emails immediately for urgent items
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="daily_digest"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Daily Digest
                        </FormLabel>
                        <FormDescription>
                          Daily summary of activities
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="weekly_summary"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Weekly Summary
                        </FormLabel>
                        <FormDescription>
                          Weekly overview report
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Escalation Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Escalation Settings
              </CardTitle>
              <CardDescription>
                Configure how critical notifications are escalated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="escalation_enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Enable Escalation
                      </FormLabel>
                      <FormDescription>
                        Escalate unread critical notifications
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch('escalation_enabled') && (
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="escalation_delay_minutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Escalation Delay (minutes)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={5} 
                            max={180} 
                            {...field} 
                            onChange={e => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>Time before escalating</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="max_escalation_levels"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Escalation Levels</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={1} 
                            max={5} 
                            {...field} 
                            onChange={e => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>Number of escalation attempts</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <LoadingButton 
            type="submit" 
            loading={isSaving}
            loadingText="Saving..."
          >
            Save Notification Settings
          </LoadingButton>
        </form>
      </Form>
    </div>
  )
}