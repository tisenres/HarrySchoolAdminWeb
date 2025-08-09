'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Users,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  BookOpen,
  UserPlus,
  Edit,
  Globe
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import type { GroupWithDetails } from '@/types/group'

interface GroupProfileProps {
  group: GroupWithDetails
  onEdit?: () => void
  onManageEnrollment?: () => void
  onAssignTeacher?: () => void
  className?: string
}

const DAY_LABELS = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday'
} as const

export function GroupProfile({
  group,
  onEdit,
  onManageEnrollment,
  onAssignTeacher,
  className
}: GroupProfileProps) {

  // Status styling
  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      upcoming: 'bg-blue-100 text-blue-800',
      completed: 'bg-gray-100 text-gray-800',
      inactive: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    
    return (
      <Badge className={variants[status as keyof typeof variants] || variants.inactive}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }


  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'UZS' ? 'USD' : currency,
      minimumFractionDigits: 0
    }).format(currency === 'UZS' ? amount / 12500 : amount) + (currency === 'UZS' ? ' UZS' : '')
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header Section */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{group.name}</h1>
                {getStatusBadge(group.status)}
                {!group.is_active && (
                  <Badge variant="outline" className="text-muted-foreground">
                    Inactive
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <code className="px-2 py-1 bg-muted rounded font-mono text-xs">
                  {group.group_code}
                </code>
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {group.subject} - {group.level}
                </div>
                {group.group_type && (
                  <Badge variant="outline" className="capitalize">
                    {group.group_type.replace('_', ' ')}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onAssignTeacher}>
                <Users className="h-4 w-4 mr-2" />
                Assign Teacher
              </Button>
              <Button variant="outline" size="sm" onClick={onManageEnrollment}>
                <UserPlus className="h-4 w-4 mr-2" />
                Manage Enrollment
              </Button>
              <Button size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Group
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Enrollment</p>
                <p className="text-2xl font-bold">{group.current_enrollment}</p>
                <p className="text-xs text-muted-foreground">of {group.max_students} max</p>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span>Progress</span>
                <span>{group.enrollment_percentage}%</span>
              </div>
              <Progress 
                value={group.enrollment_percentage} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="text-lg font-semibold">
                  {format(new Date(group.start_date), 'MMM dd')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(group.start_date), 'yyyy')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="text-lg font-semibold">
                  {group.duration_weeks || 'Ongoing'}
                </p>
                <p className="text-xs text-muted-foreground">weeks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="text-lg font-semibold">
                  {group.price_per_student 
                    ? formatCurrency(group.price_per_student, group.currency || 'UZS')
                    : 'Free'
                  }
                </p>
                {group.payment_frequency && (
                  <p className="text-xs text-muted-foreground capitalize">
                    per {group.payment_frequency}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Group Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Group Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {group.description && (
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {group.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Subject:</span>
                    <p className="text-muted-foreground">{group.subject}</p>
                  </div>
                  <div>
                    <span className="font-medium">Level:</span>
                    <p className="text-muted-foreground">{group.level}</p>
                  </div>
                  <div>
                    <span className="font-medium">Type:</span>
                    <p className="text-muted-foreground capitalize">
                      {group.group_type?.replace('_', ' ') || 'Regular'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <p className="text-muted-foreground capitalize">{group.status}</p>
                  </div>
                </div>

                {group.notes && (
                  <div>
                    <h4 className="font-medium mb-2">Notes</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {group.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Location & Meeting Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Location & Meeting</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {group.classroom && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Classroom</p>
                      <p className="text-sm text-muted-foreground">{group.classroom}</p>
                    </div>
                  </div>
                )}

                {group.online_meeting_url && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Online Meeting</p>
                      <a 
                        href={group.online_meeting_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Join Meeting
                      </a>
                    </div>
                  </div>
                )}

                {group.end_date && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Start Date:</span>
                      <p className="text-muted-foreground">
                        {format(new Date(group.start_date), 'PPP')}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">End Date:</span>
                      <p className="text-muted-foreground">
                        {format(new Date(group.end_date), 'PPP')}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Class Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              {group.schedule.length > 0 ? (
                <div className="space-y-4">
                  {group.schedule.map((slot, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex items-center gap-2 min-w-[100px]">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {DAY_LABELS[slot.day as keyof typeof DAY_LABELS]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{slot.start_time} - {slot.end_time}</span>
                      </div>
                      {slot.room && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{slot.room}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No schedule configured
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Enrolled Students ({group.current_enrollment})
                </CardTitle>
                <Button size="sm" onClick={onManageEnrollment}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Enroll Students
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="font-medium mb-2">Student enrollment coming soon</h3>
                <p className="text-sm">
                  Student management will be available in the next phase
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teachers" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Assigned Teachers</CardTitle>
                <Button size="sm" onClick={onAssignTeacher}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign Teacher
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {group.teacher_name ? (
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <Avatar>
                    <AvatarFallback>
                      {group.teacher_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-medium">{group.teacher_name}</h4>
                    <p className="text-sm text-muted-foreground">Primary Teacher</p>
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="font-medium mb-2">No teacher assigned</h3>
                  <p className="text-sm">
                    Assign a teacher to this group to get started
                  </p>
                  <Button className="mt-4" onClick={onAssignTeacher}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assign Teacher
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}