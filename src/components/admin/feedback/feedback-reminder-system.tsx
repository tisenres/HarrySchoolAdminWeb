'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { 
  Clock,
  Bell,
  Users,
  Calendar,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Settings,
  RotateCcw,
  Zap,
  Target
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import type { NotificationWithRelations } from '@/types/notification'

interface FeedbackReminder {
  id: string
  type: 'periodic' | 'milestone' | 'follow_up' | 'goal_based' | 'engagement_drop'
  title: string
  description: string
  target: {
    userId: string
    userName: string
    userType: 'student' | 'teacher'
    groupId?: string
    groupName?: string
  }
  schedule: {
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom'
    custom_interval?: number // days
    next_reminder: Date
    last_sent?: Date
  }
  conditions: {
    min_interactions?: number
    activity_threshold?: number
    rating_threshold?: number
    engagement_drop_percentage?: number
  }
  status: 'active' | 'paused' | 'completed'
  priority: 'low' | 'medium' | 'high'
  metadata: {
    created_at: Date
    total_sent: number
    response_rate: number
    effectiveness_score: number
    last_feedback_date?: Date
  }
}

interface FeedbackReminderSystemProps {
  reminders: FeedbackReminder[]
  onUpdateReminder: (reminderId: string, updates: Partial<FeedbackReminder>) => void
  onTriggerReminder: (reminderId: string) => void
  onCreateNotification: (reminder: FeedbackReminder) => void
  className?: string
}

export function FeedbackReminderSystem({
  reminders = [],
  onUpdateReminder,
  onTriggerReminder,
  onCreateNotification,
  className
}: FeedbackReminderSystemProps) {
  const { toast } = useToast()
  const [showSettings, setShowSettings] = useState(false)

  // Separate reminders by urgency and status
  const urgentReminders = reminders.filter(r => 
    r.status === 'active' && 
    r.priority === 'high' &&
    new Date(r.schedule.next_reminder) <= new Date()
  )
  
  const upcomingReminders = reminders.filter(r => 
    r.status === 'active' &&
    new Date(r.schedule.next_reminder) > new Date() &&
    new Date(r.schedule.next_reminder) <= new Date(Date.now() + 24 * 60 * 60 * 1000) // Next 24 hours
  )
  
  const scheduledReminders = reminders.filter(r => 
    r.status === 'active' &&
    new Date(r.schedule.next_reminder) > new Date(Date.now() + 24 * 60 * 60 * 1000)
  )

  const handleToggleReminder = (reminderId: string, active: boolean) => {
    onUpdateReminder(reminderId, { 
      status: active ? 'active' : 'paused' 
    })
    
    toast({
      title: active ? "Reminder activated" : "Reminder paused",
      description: "Reminder settings have been updated."
    })
  }

  const handleTriggerNow = (reminder: FeedbackReminder) => {
    onTriggerReminder(reminder.id)
    onCreateNotification(reminder)
    
    toast({
      title: "Reminder sent",
      description: `Feedback reminder sent to ${reminder.target.userName}`
    })
  }

  const getTypeIcon = (type: FeedbackReminder['type']) => {
    switch (type) {
      case 'periodic':
        return RotateCcw
      case 'milestone':
        return Target
      case 'follow_up':
        return TrendingUp
      case 'goal_based':
        return CheckCircle2
      case 'engagement_drop':
        return AlertCircle
      default:
        return Clock
    }
  }

  const getTypeColor = (type: FeedbackReminder['type']) => {
    switch (type) {
      case 'periodic':
        return 'text-blue-600'
      case 'milestone':
        return 'text-green-600'
      case 'follow_up':
        return 'text-orange-600'
      case 'goal_based':
        return 'text-purple-600'
      case 'engagement_drop':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getEffectivenessColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600'
    if (score >= 0.6) return 'text-blue-600'
    if (score >= 0.4) return 'text-orange-600'
    return 'text-red-600'
  }

  const formatNextReminder = (date: Date) => {
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffHours = Math.round(diffMs / (1000 * 60 * 60))
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffMs <= 0) return 'Overdue'
    if (diffHours < 24) return `${diffHours}h`
    return `${diffDays}d`
  }

  const ReminderCard = ({ reminder }: { reminder: FeedbackReminder }) => {
    const IconComponent = getTypeIcon(reminder.type)
    const isOverdue = new Date(reminder.schedule.next_reminder) <= new Date()
    
    return (
      <Card className={cn(
        "transition-all hover:shadow-md",
        isOverdue && "border-orange-200 bg-orange-50",
        reminder.priority === 'high' && !isOverdue && "border-blue-200 bg-blue-50"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start space-x-3">
              <div className={cn(
                "p-2 rounded-full bg-white shadow-sm",
                getTypeColor(reminder.type)
              )}>
                <IconComponent className="h-4 w-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="text-sm font-medium truncate">
                    {reminder.title}
                  </h4>
                  <Badge 
                    variant={reminder.priority === 'high' ? 'destructive' : 'outline'}
                    className="text-xs"
                  >
                    {reminder.priority}
                  </Badge>
                </div>
                
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {reminder.description}
                </p>
                
                <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3" />
                    <span>{reminder.target.userName}</span>
                  </div>
                  {reminder.target.groupName && (
                    <>
                      <span>•</span>
                      <span>{reminder.target.groupName}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <Switch
              checked={reminder.status === 'active'}
              onCheckedChange={(checked) => handleToggleReminder(reminder.id, checked)}
              size="sm"
            />
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-3 mb-3 text-xs">
            <div className="text-center">
              <div className="font-medium">{reminder.metadata.total_sent}</div>
              <div className="text-muted-foreground">Sent</div>
            </div>
            <div className="text-center">
              <div className="font-medium">
                {Math.round(reminder.metadata.response_rate * 100)}%
              </div>
              <div className="text-muted-foreground">Response</div>
            </div>
            <div className="text-center">
              <div className={cn(
                "font-medium",
                getEffectivenessColor(reminder.metadata.effectiveness_score)
              )}>
                {Math.round(reminder.metadata.effectiveness_score * 100)}%
              </div>
              <div className="text-muted-foreground">Effective</div>
            </div>
          </div>

          {/* Schedule Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                Next: {formatNextReminder(new Date(reminder.schedule.next_reminder))}
              </span>
              <span>•</span>
              <span>{reminder.schedule.frequency}</span>
            </div>
            
            {reminder.status === 'active' && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7"
                onClick={() => handleTriggerNow(reminder)}
                disabled={isOverdue}
              >
                <Zap className="h-3 w-3 mr-1" />
                Send Now
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-blue-500" />
              <span>Feedback Reminders</span>
              <Badge variant="outline">
                {reminders.filter(r => r.status === 'active').length} active
              </Badge>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {urgentReminders.length}
              </div>
              <div className="text-xs text-muted-foreground">Urgent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {upcomingReminders.length}
              </div>
              <div className="text-xs text-muted-foreground">Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {scheduledReminders.length}
              </div>
              <div className="text-xs text-muted-foreground">Scheduled</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {reminders.filter(r => r.status === 'paused').length}
              </div>
              <div className="text-xs text-muted-foreground">Paused</div>
            </div>
          </div>

          {/* Overall Effectiveness */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">System Effectiveness</span>
              <span className="text-sm text-green-600 font-medium">
                {Math.round(
                  reminders.reduce((sum, r) => sum + r.metadata.effectiveness_score, 0) / 
                  reminders.length * 100
                )}%
              </span>
            </div>
            <Progress 
              value={
                reminders.reduce((sum, r) => sum + r.metadata.effectiveness_score, 0) / 
                reminders.length * 100
              }
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Urgent Reminders */}
      {urgentReminders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium text-red-700">
              Urgent - Requires Attention
            </span>
          </div>
          {urgentReminders.map((reminder) => (
            <ReminderCard key={reminder.id} reminder={reminder} />
          ))}
        </div>
      )}

      {/* Upcoming Reminders */}
      {upcomingReminders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium">
              Upcoming (Next 24 Hours)
            </span>
          </div>
          {upcomingReminders.map((reminder) => (
            <ReminderCard key={reminder.id} reminder={reminder} />
          ))}
        </div>
      )}

      {/* Scheduled Reminders */}
      {scheduledReminders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">
              Scheduled
            </span>
          </div>
          {scheduledReminders.slice(0, 5).map((reminder) => (
            <ReminderCard key={reminder.id} reminder={reminder} />
          ))}
          {scheduledReminders.length > 5 && (
            <div className="text-center">
              <Button variant="outline" size="sm">
                View {scheduledReminders.length - 5} More
              </Button>
            </div>
          )}
        </div>
      )}

      {/* No Active Reminders */}
      {reminders.filter(r => r.status === 'active').length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Bell className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <h3 className="text-sm font-medium mb-2">No Active Reminders</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Set up feedback reminders to maintain consistent engagement
            </p>
            <Button size="sm">
              Create Reminder
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}