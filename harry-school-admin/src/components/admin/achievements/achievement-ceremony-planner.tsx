'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { 
  PartyPopper,
  Calendar as CalendarIcon,
  Clock,
  Users,
  MapPin,
  FileText,
  Send,
  Download,
  Printer,
  Star,
  Trophy,
  Award,
  Sparkles,
  Camera,
  Music,
  Gift,
  UserCheck,
  Plus,
  Edit,
  Trash2,
  Copy,
  Share2
} from 'lucide-react'
import { format } from 'date-fns'
import type { Achievement, StudentAchievement } from '@/types/ranking'
import { achievementService } from '@/lib/services/achievement-service'
import { fadeVariants, staggerContainer, staggerItem, scaleVariants } from '@/lib/animations'

interface CeremonyEvent {
  id: string
  title: string
  description?: string
  date: Date
  start_time: string
  end_time: string
  location: string
  attendees: string[]
  achievements: string[]
  ceremony_type: 'monthly' | 'quarterly' | 'special' | 'graduation'
  status: 'planned' | 'confirmed' | 'completed' | 'cancelled'
  created_at: string
  created_by: string
}

interface CeremonyTemplate {
  name: string
  description: string
  duration_minutes: number
  activities: string[]
  required_items: string[]
  ceremony_type: 'monthly' | 'quarterly' | 'special' | 'graduation'
}

// Mock data for ceremonies
const mockCeremonies: CeremonyEvent[] = [
  {
    id: '1',
    title: 'February Achievement Ceremony',
    description: 'Monthly ceremony to celebrate student achievements',
    date: new Date('2024-02-28'),
    start_time: '15:00',
    end_time: '16:00',
    location: 'Main Hall',
    attendees: ['student-1', 'student-2', 'student-3'],
    achievements: ['achievement-1', 'achievement-2'],
    ceremony_type: 'monthly',
    status: 'planned',
    created_at: '2024-02-15T10:00:00Z',
    created_by: 'admin-1'
  },
  {
    id: '2',
    title: 'Perfect Attendance Recognition',
    description: 'Special ceremony for students with perfect attendance',
    date: new Date('2024-03-15'),
    start_time: '14:00',
    end_time: '15:00',
    location: 'Library Conference Room',
    attendees: ['student-4', 'student-5'],
    achievements: ['achievement-3'],
    ceremony_type: 'special',
    status: 'confirmed',
    created_at: '2024-02-20T14:30:00Z',
    created_by: 'admin-1'
  }
]

const ceremonyTemplates: CeremonyTemplate[] = [
  {
    name: 'Monthly Achievement Ceremony',
    description: 'Regular monthly ceremony to celebrate all types of achievements',
    duration_minutes: 60,
    activities: [
      'Welcome and opening remarks',
      'Achievement presentation by category',
      'Individual recognition and photo opportunities',
      'Inspirational speech',
      'Closing remarks and refreshments'
    ],
    required_items: [
      'Achievement certificates',
      'Camera for photos',
      'Sound system',
      'Refreshments',
      'Achievement display board'
    ],
    ceremony_type: 'monthly'
  },
  {
    name: 'Quarterly Excellence Awards',
    description: 'Prestigious quarterly ceremony for outstanding achievements',
    duration_minutes: 90,
    activities: [
      'Formal opening ceremony',
      'Principal\'s welcome address',
      'Achievement category presentations',
      'Special recognition awards',
      'Student testimonials',
      'Group photo session',
      'Celebratory reception'
    ],
    required_items: [
      'Formal certificates and trophies',
      'Professional photographer',
      'Formal venue setup',
      'Guest seating arrangements',
      'Audio/visual equipment',
      'Catered refreshments'
    ],
    ceremony_type: 'quarterly'
  },
  {
    name: 'Special Achievement Recognition',
    description: 'Intimate ceremony for specific achievement milestones',
    duration_minutes: 30,
    activities: [
      'Brief welcome',
      'Achievement presentation',
      'Personal congratulations',
      'Photo opportunity',
      'Small celebration'
    ],
    required_items: [
      'Achievement certificate',
      'Small gift or token',
      'Camera',
      'Light refreshments'
    ],
    ceremony_type: 'special'
  },
  {
    name: 'Graduation Achievement Celebration',
    description: 'Comprehensive ceremony for graduating students',
    duration_minutes: 120,
    activities: [
      'Formal processional',
      'Opening remarks',
      'Achievement highlight reel',
      'Individual achievement recognition',
      'Graduation ceremony integration',
      'Group celebrations',
      'Farewell reception'
    ],
    required_items: [
      'Graduation certificates',
      'Achievement portfolio',
      'Professional photography/videography',
      'Formal venue decoration',
      'Ceremonial items',
      'Full catering service'
    ],
    ceremony_type: 'graduation'
  }
]

export function AchievementCeremonyPlanner() {
  const [ceremonies, setCeremonies] = useState<CeremonyEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<CeremonyTemplate | null>(null)
  const [editingCeremony, setEditingCeremony] = useState<CeremonyEvent | null>(null)
  const [showPrintDialog, setShowPrintDialog] = useState(false)
  const [selectedCeremony, setSelectedCeremony] = useState<CeremonyEvent | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date(),
    start_time: '15:00',
    end_time: '16:00',
    location: '',
    ceremony_type: 'monthly' as const,
    achievements: [] as string[],
    attendees: [] as string[]
  })

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setCeremonies(mockCeremonies)
      setLoading(false)
    }, 1000)
  }, [])

  const handleCreateCeremony = async () => {
    try {
      setLoading(true)
      
      const newCeremony: CeremonyEvent = {
        id: `ceremony-${Date.now()}`,
        ...formData,
        status: 'planned',
        created_at: new Date().toISOString(),
        created_by: 'current-user'
      }

      setCeremonies(prev => [newCeremony, ...prev])
      
      // Send ceremony planning notifications
      await sendCeremonyNotifications(newCeremony, 'planned')
      
      setFormData({
        title: '',
        description: '',
        date: new Date(),
        start_time: '15:00',
        end_time: '16:00',
        location: '',
        ceremony_type: 'monthly',
        achievements: [],
        attendees: []
      })
      setShowCreateForm(false)
      setSelectedTemplate(null)
    } catch (error) {
      console.error('Error creating ceremony:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCeremony = async (ceremony: CeremonyEvent) => {
    try {
      setLoading(true)
      const previousCeremony = ceremonies.find(c => c.id === ceremony.id)
      
      setCeremonies(prev => prev.map(c => c.id === ceremony.id ? ceremony : c))
      
      // Send notifications if status changed
      if (previousCeremony && previousCeremony.status !== ceremony.status) {
        if (ceremony.status === 'confirmed') {
          await sendCeremonyNotifications(ceremony, 'confirmed')
        }
      }
      
      setEditingCeremony(null)
    } catch (error) {
      console.error('Error updating ceremony:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCeremonyStatusChange = async (ceremonyId: string, newStatus: CeremonyEvent['status']) => {
    try {
      const ceremony = ceremonies.find(c => c.id === ceremonyId)
      if (!ceremony) return

      const updatedCeremony = { ...ceremony, status: newStatus }
      setCeremonies(prev => prev.map(c => c.id === ceremonyId ? updatedCeremony : c))

      // Send appropriate notifications
      switch (newStatus) {
        case 'confirmed':
          await sendCeremonyNotifications(updatedCeremony, 'confirmed')
          break
        case 'cancelled':
          await sendCeremonyNotifications(updatedCeremony, 'cancelled')
          break
      }
    } catch (error) {
      console.error('Error updating ceremony status:', error)
    }
  }

  const sendCeremonyReminders = async (ceremonyId: string) => {
    try {
      const ceremony = ceremonies.find(c => c.id === ceremonyId)
      if (!ceremony) return

      await sendCeremonyNotifications(ceremony, 'reminder')
    } catch (error) {
      console.error('Error sending ceremony reminders:', error)
    }
  }

  const handleDeleteCeremony = async (id: string) => {
    try {
      setCeremonies(prev => prev.filter(c => c.id !== id))
    } catch (error) {
      console.error('Error deleting ceremony:', error)
    }
  }

  const handleUseTemplate = (template: CeremonyTemplate) => {
    setSelectedTemplate(template)
    setFormData(prev => ({
      ...prev,
      title: template.name,
      description: template.description,
      ceremony_type: template.ceremony_type,
      end_time: calculateEndTime(prev.start_time, template.duration_minutes)
    }))
    setShowTemplateSelector(false)
    setShowCreateForm(true)
  }

  const calculateEndTime = (startTime: string, durationMinutes: number) => {
    const [hours, minutes] = startTime.split(':').map(Number)
    const startDate = new Date()
    startDate.setHours(hours, minutes)
    startDate.setMinutes(startDate.getMinutes() + durationMinutes)
    return `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-blue-100 text-blue-800'
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCeremonyTypeIcon = (type: string) => {
    switch (type) {
      case 'monthly': return <CalendarIcon className="h-4 w-4" />
      case 'quarterly': return <Trophy className="h-4 w-4" />
      case 'special': return <Star className="h-4 w-4" />
      case 'graduation': return <Award className="h-4 w-4" />
      default: return <PartyPopper className="h-4 w-4" />
    }
  }

  const generateCeremonyProgram = (ceremony: CeremonyEvent) => {
    const template = ceremonyTemplates.find(t => t.ceremony_type === ceremony.ceremony_type)
    if (!template) return ''

    const program = `
ACHIEVEMENT CEREMONY PROGRAM

${ceremony.title}
${format(ceremony.date, 'EEEE, MMMM do, yyyy')}
${ceremony.start_time} - ${ceremony.end_time}
${ceremony.location}

PROGRAM ACTIVITIES:
${template.activities.map((activity, index) => `${index + 1}. ${activity}`).join('\n')}

REQUIRED ITEMS:
${template.required_items.map(item => `• ${item}`).join('\n')}

ATTENDEES: ${ceremony.attendees.length} students
ACHIEVEMENTS TO RECOGNIZE: ${ceremony.achievements.length}

Generated on ${format(new Date(), 'yyyy-MM-dd HH:mm')}
    `
    return program.trim()
  }

  const exportCeremonyList = () => {
    const csvContent = ceremonies.map(ceremony => 
      `"${ceremony.title}","${format(ceremony.date, 'yyyy-MM-dd')}","${ceremony.start_time}","${ceremony.end_time}","${ceremony.location}","${ceremony.ceremony_type}","${ceremony.status}","${ceremony.attendees.length}","${ceremony.achievements.length}"`
    ).join('\n')
    
    const fullContent = `Title,Date,Start Time,End Time,Location,Type,Status,Attendees,Achievements\n${csvContent}`
    const blob = new Blob([fullContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ceremony-schedule.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const sendCeremonyNotifications = async (ceremony: CeremonyEvent, action: 'planned' | 'confirmed' | 'reminder' | 'cancelled') => {
    try {
      // Send notifications to attendees
      if (ceremony.attendees.length > 0) {
        for (const attendeeId of ceremony.attendees) {
          let title = ''
          let message = ''
          let priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'

          switch (action) {
            case 'planned':
              title = '🎭 Achievement Ceremony Planned'
              message = `You're invited to the "${ceremony.title}" ceremony on ${format(ceremony.date, 'MMM dd, yyyy')} at ${ceremony.start_time}.`
              priority = 'normal'
              break
            case 'confirmed':
              title = '✅ Achievement Ceremony Confirmed'
              message = `The "${ceremony.title}" ceremony has been confirmed for ${format(ceremony.date, 'MMM dd, yyyy')} at ${ceremony.start_time} in ${ceremony.location}.`
              priority = 'high'
              break
            case 'reminder':
              title = '⏰ Ceremony Reminder'
              message = `Don't forget! The "${ceremony.title}" ceremony is tomorrow at ${ceremony.start_time} in ${ceremony.location}.`
              priority = 'high'
              break
            case 'cancelled':
              title = '❌ Ceremony Cancelled'
              message = `The "${ceremony.title}" ceremony scheduled for ${format(ceremony.date, 'MMM dd, yyyy')} has been cancelled.`
              priority = 'urgent'
              break
          }

          const notificationRequest = {
            type: 'achievement' as const,
            title,
            message,
            priority,
            action_url: `/dashboard/ceremonies/${ceremony.id}`,
            related_student_id: attendeeId,
            metadata: {
              ceremony_id: ceremony.id,
              ceremony_title: ceremony.title,
              ceremony_date: ceremony.date.toISOString(),
              ceremony_type: ceremony.ceremony_type,
              action
            }
          }

          // Send notification via API
          await fetch('/api/notifications', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(notificationRequest),
          })
        }
      }

      // Send notifications to admin/teachers
      const adminNotificationRequest = {
        type: 'system' as const,
        title: `📋 Ceremony ${action}: ${ceremony.title}`,
        message: `Achievement ceremony "${ceremony.title}" has been ${action} for ${format(ceremony.date, 'MMM dd, yyyy')} with ${ceremony.attendees.length} attendees.`,
        priority: 'normal' as const,
        action_url: `/dashboard/ceremonies/${ceremony.id}`,
        role_target: ['admin', 'teacher'],
        metadata: {
          ceremony_id: ceremony.id,
          ceremony_title: ceremony.title,
          ceremony_type: ceremony.ceremony_type,
          attendee_count: ceremony.attendees.length,
          achievement_count: ceremony.achievements.length,
          action
        }
      }

      await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adminNotificationRequest),
      })

    } catch (error) {
      console.error('Error sending ceremony notifications:', error)
    }
  }

  if (loading && ceremonies.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PartyPopper className="h-4 w-4" />
            <span>Achievement Ceremony Planner</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <PartyPopper className="h-4 w-4" />
                <span>Achievement Ceremony Planner</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Plan and organize ceremony events to celebrate student achievements
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTemplateSelector(true)}
              >
                <FileText className="h-4 w-4 mr-2" />
                Templates
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportCeremonyList}
                disabled={ceremonies.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Plan Ceremony
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ceremony Stats */}
          <motion.div 
            variants={staggerItem}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {ceremonies.filter(c => c.status === 'planned').length}
              </div>
              <div className="text-sm text-muted-foreground">Planned</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {ceremonies.filter(c => c.status === 'confirmed').length}
              </div>
              <div className="text-sm text-muted-foreground">Confirmed</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-gray-600">
                {ceremonies.filter(c => c.status === 'completed').length}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {ceremonies.reduce((sum, c) => sum + c.attendees.length, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Attendees</div>
            </div>
          </motion.div>

          <Separator />

          {/* Ceremony List */}
          {ceremonies.length > 0 ? (
            <motion.div variants={staggerItem} className="space-y-4">
              <AnimatePresence>
                {ceremonies.map((ceremony) => (
                  <motion.div
                    key={ceremony.id}
                    variants={scaleVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="flex items-center space-x-2">
                            {getCeremonyTypeIcon(ceremony.ceremony_type)}
                            <h3 className="font-semibold">{ceremony.title}</h3>
                          </div>
                          <Badge className={getStatusColor(ceremony.status)}>
                            {ceremony.status}
                          </Badge>
                        </div>
                        
                        {ceremony.description && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {ceremony.description}
                          </p>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{format(ceremony.date, 'MMM dd, yyyy')}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{ceremony.start_time} - {ceremony.end_time}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{ceremony.location}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{ceremony.attendees.length} attendees</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 mt-3 text-sm">
                          <div className="flex items-center space-x-1 text-yellow-600">
                            <Award className="h-4 w-4" />
                            <span>{ceremony.achievements.length} achievements</span>
                          </div>
                          <div className="flex items-center space-x-1 text-blue-600">
                            <Trophy className="h-4 w-4" />
                            <span className="capitalize">{ceremony.ceremony_type}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {/* Status management buttons */}
                        {ceremony.status === 'planned' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCeremonyStatusChange(ceremony.id, 'confirmed')}
                            className="text-green-600 hover:text-green-700"
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {(ceremony.status === 'planned' || ceremony.status === 'confirmed') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => sendCeremonyReminders(ceremony.id)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCeremony(ceremony)
                            setShowPrintDialog(true)
                          }}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingCeremony(ceremony)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        {ceremony.status !== 'cancelled' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCeremonyStatusChange(ceremony.id, 'cancelled')}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div 
              variants={staggerItem}
              className="text-center py-12"
            >
              <PartyPopper className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No ceremonies planned</h3>
              <p className="text-muted-foreground mb-4">
                Create your first achievement ceremony to celebrate student success
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Plan Your First Ceremony
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Template Selector Dialog */}
      <Dialog open={showTemplateSelector} onOpenChange={setShowTemplateSelector}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Ceremony Templates</DialogTitle>
            <DialogDescription>
              Choose a template to quickly set up your achievement ceremony
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ceremonyTemplates.map((template, index) => (
              <Card 
                key={index}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleUseTemplate(template)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    {getCeremonyTypeIcon(template.ceremony_type)}
                    <span>{template.name}</span>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {template.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{template.duration_minutes} minutes</span>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm mb-2">Activities:</h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {template.activities.slice(0, 3).map((activity, i) => (
                          <li key={i}>• {activity}</li>
                        ))}
                        {template.activities.length > 3 && (
                          <li>+ {template.activities.length - 3} more activities</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Ceremony Dialog */}
      <Dialog open={showCreateForm || !!editingCeremony} onOpenChange={(open) => {
        if (!open) {
          setShowCreateForm(false)
          setEditingCeremony(null)
          setSelectedTemplate(null)
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCeremony ? 'Edit Ceremony' : 'Plan Achievement Ceremony'}
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate ? `Using template: ${selectedTemplate.name}` : 'Create a new ceremony event'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Ceremony Title *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Monthly Achievement Ceremony"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Ceremony Type *</label>
                <Select 
                  value={formData.ceremony_type} 
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, ceremony_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="special">Special</SelectItem>
                    <SelectItem value="graduation">Graduation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the ceremony"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Date *</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {format(formData.date, 'MMM dd, yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => date && setFormData(prev => ({ ...prev, date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-sm font-medium">Start Time *</label>
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">End Time *</label>
                <Input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Location *</label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Main Hall, Library Conference Room"
              />
            </div>

            {selectedTemplate && (
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <h4 className="font-medium">Template Activities:</h4>
                <ul className="text-sm space-y-1">
                  {selectedTemplate.activities.map((activity, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <UserCheck className="h-3 w-3 text-green-600" />
                      <span>{activity}</span>
                    </li>
                  ))}
                </ul>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-2">Required Items:</h4>
                  <div className="grid grid-cols-2 gap-1 text-sm">
                    {selectedTemplate.required_items.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Gift className="h-3 w-3 text-blue-600" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateForm(false)
                setEditingCeremony(null)
                setSelectedTemplate(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCeremony}
              disabled={!formData.title || !formData.location}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {editingCeremony ? 'Update Ceremony' : 'Plan Ceremony'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Program Dialog */}
      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ceremony Program</DialogTitle>
            <DialogDescription>
              Review and print the ceremony program
            </DialogDescription>
          </DialogHeader>
          
          {selectedCeremony && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {generateCeremonyProgram(selectedCeremony)}
                </pre>
              </div>
              
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    const program = generateCeremonyProgram(selectedCeremony)
                    const blob = new Blob([program], { type: 'text/plain' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `${selectedCeremony.title.replace(/\s+/g, '-')}-program.txt`
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  onClick={() => {
                    const program = generateCeremonyProgram(selectedCeremony)
                    const printWindow = window.open('', '_blank')
                    if (printWindow) {
                      printWindow.document.write(`<pre style="font-family: monospace; white-space: pre-wrap; padding: 20px;">${program}</pre>`)
                      printWindow.document.close()
                      printWindow.print()
                    }
                  }}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}