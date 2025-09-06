'use client'

import { useState } from 'react'
import { Bell, Mail, Smartphone, Volume2, Settings, Save, RotateCcw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useNotificationPreferences } from '@/hooks/use-notifications'
import { toast } from 'sonner'
import type { NotificationPreferences } from '@/types/notification'

const NOTIFICATION_CATEGORIES = [
  {
    id: 'system_notifications',
    label: 'System Notifications',
    description: 'Updates about system maintenance, new features, and important announcements',
    icon: Settings,
    examples: ['System maintenance alerts', 'Feature updates', 'Security notifications']
  },
  {
    id: 'student_updates',
    label: 'Student Updates',
    description: 'Notifications about student enrollment, status changes, and academic progress',
    icon: Bell,
    examples: ['New student enrollments', 'Status changes', 'Academic milestones']
  },
  {
    id: 'payment_reminders',
    label: 'Payment Reminders',
    description: 'Alerts about upcoming payments, overdue fees, and financial updates',
    icon: Bell,
    examples: ['Payment due dates', 'Overdue notices', 'Payment confirmations']
  },
  {
    id: 'enrollment_alerts',
    label: 'Enrollment Alerts',
    description: 'Notifications about group enrollments, waitlist changes, and capacity updates',
    icon: Bell,
    examples: ['Group enrollments', 'Waitlist updates', 'Capacity changes']
  },
  {
    id: 'schedule_changes',
    label: 'Schedule Changes',
    description: 'Updates about class schedule modifications and calendar events',
    icon: Bell,
    examples: ['Class rescheduling', 'Calendar updates', 'Holiday notifications']
  }
] as const

const DELIVERY_METHODS = [
  {
    id: 'in_app',
    label: 'In-App Notifications',
    description: 'Show notifications in the admin dashboard',
    icon: Bell,
    available: true
  },
  {
    id: 'email',
    label: 'Email Notifications',
    description: 'Send notifications to your email address',
    icon: Mail,
    available: false, // Future feature
    comingSoon: true
  },
  {
    id: 'sms',
    label: 'SMS Notifications',
    description: 'Send urgent notifications via text message',
    icon: Smartphone,
    available: false, // Future feature
    comingSoon: true
  }
] as const

export function NotificationSettings() {
  const { preferences, updatePreferences, isUpdating } = useNotificationPreferences()
  const [localPreferences, setLocalPreferences] = useState<NotificationPreferences>({
    email_notifications: true,
    system_notifications: true,
    student_updates: true,
    payment_reminders: true,
    enrollment_alerts: true,
    schedule_changes: true,
    ...preferences
  })
  const [soundEnabled, setSoundEnabled] = useState(
    typeof window !== 'undefined' ? localStorage.getItem('notification_sound') !== 'false' : true
  )
  const [hasChanges, setHasChanges] = useState(false)

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean) => {
    setLocalPreferences(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSoundToggle = (enabled: boolean) => {
    setSoundEnabled(enabled)
    if (typeof window !== 'undefined') {
      localStorage.setItem('notification_sound', enabled.toString())
    }
    setHasChanges(true)
  }

  const handleSave = () => {
    updatePreferences(localPreferences)
    setHasChanges(false)
    toast.success('Notification preferences saved successfully')
  }

  const handleReset = () => {
    const defaultPreferences: NotificationPreferences = {
      email_notifications: true,
      system_notifications: true,
      student_updates: true,
      payment_reminders: true,
      enrollment_alerts: true,
      schedule_changes: true
    }
    
    setLocalPreferences(defaultPreferences)
    setSoundEnabled(true)
    setHasChanges(true)
    toast.info('Settings reset to defaults')
  }

  const testNotificationSound = () => {
    if (typeof window !== 'undefined' && 'Audio' in window) {
      try {
        const audio = new Audio('/sounds/notification.mp3')
        audio.volume = 0.3
        audio.play().catch(() => {
          toast.error('Could not play notification sound. Check if the audio file exists.')
        })
      } catch {
        toast.error('Audio not supported in this browser')
      }
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="delivery">
            Delivery
            <Badge variant="secondary" className="ml-2">
              Coming Soon
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Categories
              </CardTitle>
              <CardDescription>
                Choose which types of notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {NOTIFICATION_CATEGORIES.map((category, index) => (
                <div key={category.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <category.icon className="h-5 w-5 text-gray-600 mt-0.5" />
                      <div className="space-y-1">
                        <Label htmlFor={category.id} className="text-base font-medium">
                          {category.label}
                        </Label>
                        <p className="text-sm text-gray-600">
                          {category.description}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {category.examples.map((example, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {example}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Switch
                      id={category.id}
                      checked={localPreferences[category.id as keyof NotificationPreferences]}
                      onCheckedChange={(checked) => 
                        handlePreferenceChange(category.id as keyof NotificationPreferences, checked)
                      }
                    />
                  </div>
                  {index < NOTIFICATION_CATEGORIES.length - 1 && (
                    <Separator className="mt-6" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delivery" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Delivery Methods
              </CardTitle>
              <CardDescription>
                Choose how you want to receive your notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {DELIVERY_METHODS.map((method, index) => (
                <div key={method.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <method.icon className="h-5 w-5 text-gray-600 mt-0.5" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Label className="text-base font-medium">
                            {method.label}
                          </Label>
                          {method.comingSoon && (
                            <Badge variant="secondary" className="text-xs">
                              Coming Soon
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {method.description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={method.available && method.id === 'in_app'}
                      disabled={!method.available}
                      onCheckedChange={(checked) => {
                        if (method.id === 'email') {
                          handlePreferenceChange('email_notifications', checked)
                        }
                      }}
                    />
                  </div>
                  {index < DELIVERY_METHODS.length - 1 && (
                    <Separator className="mt-6" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Sound & Behavior
              </CardTitle>
              <CardDescription>
                Advanced notification settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">
                    Notification Sounds
                  </Label>
                  <p className="text-sm text-gray-600">
                    Play a sound when receiving new notifications
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testNotificationSound}
                  >
                    Test Sound
                  </Button>
                  <Switch
                    checked={soundEnabled}
                    onCheckedChange={handleSoundToggle}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">
                    Desktop Notifications
                  </Label>
                  <p className="text-sm text-gray-600">
                    Show browser notifications even when the app is in the background
                  </p>
                  <Badge variant="secondary" className="text-xs mt-1">
                    Coming Soon
                  </Badge>
                </div>
                <Switch disabled />
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="text-base font-medium">
                  Notification Timing
                </Label>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Business Hours:</span>
                    <p className="font-medium">9:00 AM - 6:00 PM</p>
                    <Badge variant="secondary" className="text-xs mt-1">
                      Coming Soon
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-600">Timezone:</span>
                    <p className="font-medium">Asia/Tashkent (UTC+5)</p>
                    <Badge variant="secondary" className="text-xs mt-1">
                      Coming Soon
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data & Privacy</CardTitle>
              <CardDescription>
                Manage your notification data and privacy settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600">
                <p>
                  Notification data is stored securely and used only for delivering 
                  notifications according to your preferences. You can request deletion 
                  of your notification history at any time.
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled>
                  Export Data
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Clear History
                </Button>
              </div>
              
              <Badge variant="secondary" className="text-xs">
                Privacy features coming soon
              </Badge>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      {hasChanges && (
        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4 border">
          <p className="text-sm text-gray-600">
            You have unsaved changes to your notification preferences.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isUpdating}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isUpdating}
            >
              <Save className="mr-2 h-4 w-4" />
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}