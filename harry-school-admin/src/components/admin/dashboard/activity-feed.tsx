'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  CreditCard, 
  BookOpen, 
  UserPlus, 
  DollarSign,
  Clock,
  Activity as ActivityIcon
} from 'lucide-react'
import { formatDistanceToNow, parseISO } from 'date-fns'

interface Activity {
  id: string
  type: 'enrollment' | 'payment' | 'group_creation' | 'teacher_assignment' | 'student_update'
  description: string
  timestamp: string
  metadata?: Record<string, any>
}

interface ActivityFeedProps {
  activities: Activity[]
  title?: string
  description?: string
  limit?: number
}

const activityConfig = {
  enrollment: {
    icon: UserPlus,
    color: 'bg-blue-100 text-blue-600',
    badgeVariant: 'secondary' as const,
  },
  payment: {
    icon: CreditCard,
    color: 'bg-green-100 text-green-600',
    badgeVariant: 'secondary' as const,
  },
  group_creation: {
    icon: BookOpen,
    color: 'bg-purple-100 text-purple-600',
    badgeVariant: 'secondary' as const,
  },
  teacher_assignment: {
    icon: Users,
    color: 'bg-orange-100 text-orange-600',
    badgeVariant: 'secondary' as const,
  },
  student_update: {
    icon: ActivityIcon,
    color: 'bg-gray-100 text-gray-600',
    badgeVariant: 'outline' as const,
  },
}

export function ActivityFeed({ 
  activities, 
  title = "Recent Activity", 
  description = "Latest updates from your school",
  limit 
}: ActivityFeedProps) {
  const displayActivities = limit ? activities.slice(0, limit) : activities

  const getActivityIcon = (type: Activity['type']) => {
    const config = activityConfig[type]
    return config ? config.icon : ActivityIcon
  }

  const getActivityStyle = (type: Activity['type']) => {
    const config = activityConfig[type]
    return config ? config.color : 'bg-gray-100 text-gray-600'
  }

  const getBadgeVariant = (type: Activity['type']) => {
    const config = activityConfig[type]
    return config ? config.badgeVariant : 'outline'
  }

  const formatActivityTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(parseISO(timestamp), { addSuffix: true })
    } catch {
      return 'Recently'
    }
  }

  const getActivityAmount = (activity: Activity) => {
    if (activity.type === 'payment' && activity.metadata?.amount) {
      return `$${activity.metadata.amount.toLocaleString()}`
    }
    return null
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && (
              <CardDescription>{description}</CardDescription>
            )}
          </div>
          <Badge variant="outline" className="text-xs">
            {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {displayActivities.length > 0 ? (
          <div className="space-y-4">
            {displayActivities.map((activity) => {
              const IconComponent = getActivityIcon(activity.type)
              const activityStyle = getActivityStyle(activity.type)
              const badgeVariant = getBadgeVariant(activity.type)
              const amount = getActivityAmount(activity)
              
              return (
                <div key={activity.id} className="flex items-start space-x-3 pb-3 border-b border-border last:border-b-0 last:pb-0">
                  <div className={`p-2 rounded-lg ${activityStyle} flex-shrink-0`}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">
                        {activity.description}
                      </p>
                      {amount && (
                        <Badge variant="secondary" className="ml-2 text-xs font-semibold text-green-700">
                          {amount}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant={badgeVariant} className="text-xs">
                        {activity.type.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatActivityTime(activity.timestamp)}
                      </span>
                    </div>
                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {activity.metadata.student_name && (
                          <span>Student: {activity.metadata.student_name}</span>
                        )}
                        {activity.metadata.group_name && (
                          <span className="ml-2">Group: {activity.metadata.group_name}</span>
                        )}
                        {activity.metadata.teacher_name && (
                          <span className="ml-2">Teacher: {activity.metadata.teacher_name}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <ActivityIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No recent activity</p>
            <p className="text-xs">Activity will appear here as actions are performed</p>
          </div>
        )}
        
        {limit && activities.length > limit && (
          <div className="mt-4 pt-3 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Showing {limit} of {activities.length} activities
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ActivityFeed