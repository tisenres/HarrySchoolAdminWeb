'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/use-toast'
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
  user_preferences: z.object({
    email_notifications: z.boolean(),
    push_notifications: z.boolean(),
    sms_notifications: z.boolean(),
    quiet_hours: z.object({
      enabled: z.boolean(),
      start_time: z.string(),
      end_time: z.string()
    })
  }),
  organization_settings: z.object({
    student_updates: z.boolean(),
    teacher_updates: z.boolean(),
    payment_reminders: z.boolean(),
    system_alerts: z.boolean(),
    enrollment_notifications: z.boolean(),
    group_changes: z.boolean()
  }),
  email_settings: z.object({
    smtp_enabled: z.boolean(),
    daily_digest: z.boolean(),
    weekly_summary: z.boolean(),
    immediate_alerts: z.boolean()
  }),
  notification_channels: z.object({
    in_app: z.boolean(),
    email: z.boolean(),
    push: z.boolean(),
    sms: z.boolean()
  }),
  escalation_settings: z.object({
    urgent_notifications: z.boolean(),
    escalation_delay_minutes: z.number().min(5).max(180),
    max_escalation_levels: z.number().min(1).max(5)
  })
})

type NotificationSettingsFormValues = z.infer<typeof notificationSettingsSchema>

interface NotificationSettingsProps {
  organizationId: string
  userId: string
}

export function NotificationSettings({ organizationId, userId }: NotificationSettingsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<NotificationSettingsFormValues>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      user_preferences: {
        email_notifications: true,
        push_notifications: true,
        sms_notifications: false,
        quiet_hours: {
          enabled: false,
          start_time: '22:00',
          end_time: '08:00'
        }
      },
      organization_settings: {
        student_updates: true,
        teacher_updates: true,
        payment_reminders: true,
        system_alerts: true,
        enrollment_notifications: true,
        group_changes: true
      },
      email_settings: {
        smtp_enabled: true,
        daily_digest: false,
        weekly_summary: true,
        immediate_alerts: true
      },
      notification_channels: {
        in_app: true,
        email: true,
        push: true,
        sms: false
      },
      escalation_settings: {
        urgent_notifications: true,
        escalation_delay_minutes: 30,
        max_escalation_levels: 2
      }
    },
  })

  useEffect(() => {
    fetchNotificationSettings()
  }, [organizationId, userId])

  const fetchNotificationSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/settings/preferences?organizationId=${organizationId}&userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        // Merge fetched data with defaults
        if (data.data) {
          form.reset({
            ...form.getValues(),
            ...data.data
          })
        }
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to load notification settings',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: NotificationSettingsFormValues) => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/settings/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          organizationId,
          userId
        }),
      })

      if (!response.ok) throw new Error('Failed to update notification settings')

      toast({
        title: 'Success',
        description: 'Notification settings updated successfully',
      })
    } catch (error) {
      console.error('Error updating notification settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to update notification settings',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
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
      <div>
        <h2 className="text-2xl font-bold">Notification Settings</h2>
        <p className="text-muted-foreground">
          Configure how and when you receive notifications about system events.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* User Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Personal Preferences
              </CardTitle>
              <CardDescription>
                Configure your personal notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="user_preferences.email_notifications"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Notifications
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
                name="user_preferences.push_notifications"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        Push Notifications
                      </FormLabel>
                      <FormDescription>
                        Receive browser push notifications
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
                name="user_preferences.sms_notifications"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        SMS Notifications
                      </FormLabel>
                      <FormDescription>
                        Receive important alerts via SMS
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

              <Separator />

              <div>
                <FormField
                  control={form.control}
                  name="user_preferences.quiet_hours.enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Quiet Hours
                        </FormLabel>
                        <FormDescription>
                          Disable non-urgent notifications during specific hours
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

                {form.watch('user_preferences.quiet_hours.enabled') && (
                  <div className="grid gap-4 md:grid-cols-2 mt-4">
                    <FormField
                      control={form.control}
                      name="user_preferences.quiet_hours.start_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="user_preferences.quiet_hours.end_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Organization Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Types</CardTitle>
              <CardDescription>
                Choose which types of events you want to be notified about
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="organization_settings.student_updates"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        Student Updates
                      </FormLabel>
                      <FormDescription>
                        New enrollments, status changes, and student activities
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
                name="organization_settings.teacher_updates"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Teacher Updates
                      </FormLabel>
                      <FormDescription>
                        New teacher registrations and profile changes
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
                name="organization_settings.payment_reminders"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Payment Reminders
                      </FormLabel>
                      <FormDescription>
                        Overdue payments and payment confirmations
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
                name="organization_settings.system_alerts"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        System Alerts
                      </FormLabel>
                      <FormDescription>
                        System maintenance, errors, and security alerts
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
            </CardContent>
          </Card>

          {/* Email Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Settings
              </CardTitle>
              <CardDescription>
                Configure email notification frequency and content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="email_settings.immediate_alerts"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Immediate Alerts</FormLabel>
                      <FormDescription>
                        Send emails immediately for urgent notifications
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
                name="email_settings.daily_digest"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Daily Digest</FormLabel>
                      <FormDescription>
                        Receive a daily summary of non-urgent notifications
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
                name="email_settings.weekly_summary"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Weekly Summary</FormLabel>
                      <FormDescription>
                        Receive a weekly overview of system activity
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
            </CardContent>
          </Card>

          {/* Escalation Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Escalation Settings</CardTitle>
              <CardDescription>
                Configure how urgent notifications are escalated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="escalation_settings.urgent_notifications"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Enable Escalation</FormLabel>
                      <FormDescription>
                        Escalate urgent notifications if not acknowledged
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

              {form.watch('escalation_settings.urgent_notifications') && (
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="escalation_settings.escalation_delay_minutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Escalation Delay (minutes)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={5}
                            max={180}
                            value={field.value}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Time to wait before escalating (5-180 minutes)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="escalation_settings.max_escalation_levels"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Escalation Levels</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={5}
                            value={field.value}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum escalation levels (1-5)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Button type="submit" disabled={isSaving} className="w-full">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Notification Settings
          </Button>
        </form>
      </Form>
    </div>
  )
}