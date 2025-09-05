'use client'


// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft,
  Edit,
  Archive,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  GraduationCap,
  Award,
  Clock,
  DollarSign,
  FileText,
  Activity,
  Loader2,
  User,
  MoreVertical,
  Download,
  Share2,
  MessageSquare,
  Star
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Teacher } from '@/types/teacher'
import type { TeacherWithRanking } from '@/types/ranking'
import { TeacherForm } from '@/components/admin/teachers/teacher-form'
import { TeacherFeedbackOverview, FeedbackSubmissionForm } from '@/components/admin/teachers/feedback'
import { fadeVariants, getAnimationConfig } from '@/lib/animations'

interface PageProps {
  params: Promise<{ id: string; locale: string }>
}

export default function TeacherDetailPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const t = useTranslations('teachers')
  const tCommon = useTranslations('common')
  const router = useRouter()
  
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditFormOpen, setIsEditFormOpen] = useState(false)
  const [isFeedbackFormOpen, setIsFeedbackFormOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)

  // Load teacher data
  useEffect(() => {
    const loadTeacher = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/teachers/${resolvedParams.id}`)
        const result = await response.json()
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch teacher')
        }
        
        setTeacher(result.data)
      } catch (error) {
        console.error('Error loading teacher:', error)
        // Redirect to teachers list if teacher not found
        router.push('/teachers')
      } finally {
        setLoading(false)
      }
    }

    loadTeacher()
  }, [resolvedParams.id, router])

  // Handle form submission
  const handleFormSubmit = async (data: any) => {
    setFormLoading(true)
    try {
      const response = await fetch(`/api/teachers/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to update teacher')
      }
      setTeacher(result.data)
      setIsEditFormOpen(false)
    } catch (error) {
      console.error('Error updating teacher:', error)
    } finally {
      setFormLoading(false)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    // Sanitize names to prevent XSS
    const firstName = teacher?.first_name?.replace(/[<>]/g, '') || ''
    const lastName = teacher?.last_name?.replace(/[<>]/g, '') || ''
    const confirmed = window.confirm(`Are you sure you want to delete ${firstName} ${lastName}? This action cannot be undone.`)
    if (!confirmed) return
    
    try {
      const response = await fetch(`/api/teachers/${resolvedParams.id}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete teacher')
      }
      router.push('/teachers')
    } catch (error) {
      console.error('Error deleting teacher:', error)
    }
  }

  // Handle archive
  const handleArchive = async () => {
    // Sanitize names to prevent XSS
    const firstName = teacher?.first_name?.replace(/[<>]/g, '') || ''
    const lastName = teacher?.last_name?.replace(/[<>]/g, '') || ''
    const confirmed = window.confirm(`Are you sure you want to archive ${firstName} ${lastName}?`)
    if (!confirmed) return
    
    try {
      const response = await fetch(`/api/teachers/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'inactive' })
      })
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to archive teacher')
      }
      setTeacher(result.data)
    } catch (error) {
      console.error('Error archiving teacher:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!teacher) {
    return null
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800 border-green-200',
      inactive: 'bg-gray-100 text-gray-800 border-gray-200',
      on_leave: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    } as const

    return (
      <Badge 
        variant="outline"
        className={`capitalize ${colors[status as keyof typeof colors] || ''}`}
      >
        {status?.replace('_', ' ')}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: 'UZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <motion.div
      variants={fadeVariants}
      initial="hidden"
      animate="visible"
      transition={getAnimationConfig(fadeVariants)}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/teachers')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tCommon('back')}
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{teacher.full_name}</h1>
            <p className="text-muted-foreground mt-1">
              {t('teacherProfile')}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setIsEditFormOpen(true)}
          >
            <Edit className="h-4 w-4 mr-2" />
            {tCommon('edit')}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setIsEditFormOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                Export Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className="mr-2 h-4 w-4" />
                Share Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsFeedbackFormOpen(true)}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Give Feedback
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleArchive}>
                <Archive className="mr-2 h-4 w-4" />
                Archive Teacher
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Teacher
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t('profile')}</span>
              {getStatusBadge(teacher.status)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              {teacher.profile_image_url ? (
                <img
                  src={teacher.profile_image_url}
                  alt={teacher.full_name}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl font-medium">
                  {teacher.first_name[0]}{teacher.last_name[0]}
                </div>
              )}
              <div>
                <p className="font-medium text-lg">{teacher.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  {teacher.teacher_id || 'No ID'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{teacher.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{teacher.phone}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Joined {formatDate(teacher.hire_date)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teaching Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <GraduationCap className="h-4 w-4" />
              <span>{t('teachingInfo')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Specializations</p>
              <div className="flex flex-wrap gap-2">
                {teacher.specializations?.map((spec: string) => (
                  <Badge key={spec} variant="secondary">
                    {spec}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Experience</p>
              <p className="font-medium">{teacher.experience_years || 0} years</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Education</p>
              <p className="font-medium">{teacher.education || 'Not specified'}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Certifications</p>
              <div className="flex flex-wrap gap-2">
                {teacher.certifications?.length > 0 ? (
                  teacher.certifications.map((cert: string) => (
                    <Badge key={cert} variant="outline">
                      {cert}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">None</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>{t('statistics')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Groups</p>
                <p className="text-2xl font-bold">{teacher.groups?.length || 0}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <GraduationCap className="h-8 w-8 text-muted-foreground" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hourly Rate</p>
                <p className="text-lg font-medium">{formatCurrency(teacher.hourly_rate || 0)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Feedback Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>Student Feedback</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Rating</p>
                <p className="text-2xl font-bold text-green-600">4.3</p>
              </div>
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Reviews</p>
                <p className="text-2xl font-bold">24</p>
              </div>
              <Award className="h-8 w-8 text-muted-foreground" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-lg font-medium text-blue-600">+6</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information Tabs */}
      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="feedback" className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span>Feedback</span>
              </TabsTrigger>
              <TabsTrigger value="groups">Groups</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-4">Contact Information</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{teacher.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{teacher.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Emergency Contact</p>
                      <p className="font-medium">{teacher.emergency_contact || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-4">Address</h3>
                  <div className="space-y-3">
                    {teacher.address ? (
                      <>
                        <div>
                          <p className="text-sm text-muted-foreground">Street</p>
                          <p className="font-medium">{teacher.address.street}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">City</p>
                          <p className="font-medium">{teacher.address.city}, {teacher.address.region}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Country</p>
                          <p className="font-medium">{teacher.address.country}</p>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">No address provided</p>
                    )}
                  </div>
                </div>
              </div>

              {teacher.bio && (
                <div className="mt-6">
                  <h3 className="font-medium mb-2">Biography</h3>
                  <p className="text-sm text-muted-foreground">{teacher.bio}</p>
                </div>
              )}

              {teacher.notes && (
                <div className="mt-6">
                  <h3 className="font-medium mb-2">Notes</h3>
                  <p className="text-sm text-muted-foreground">{teacher.notes}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="feedback" className="mt-6">
              <TeacherFeedbackOverview 
                teacher={{
                  ...teacher,
                  teacher_id: teacher.teacher_id || teacher.id,
                  user_type: 'teacher' as const
                } as TeacherWithRanking} 
              />
            </TabsContent>

            <TabsContent value="groups" className="mt-6">
              {teacher.groups && teacher.groups.length > 0 ? (
                <div className="space-y-4">
                  {teacher.groups.map((group: any) => (
                    <div
                      key={group.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{group.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {group.student_count || 0} students • {group.schedule}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        View Group
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No groups assigned yet</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="schedule" className="mt-6">
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Schedule view coming soon</p>
              </div>
            </TabsContent>

            <TabsContent value="documents" className="mt-6">
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No documents uploaded</p>
                <Button variant="outline" className="mt-4">
                  Upload Document
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Form Dialog */}
      {isEditFormOpen && (
        <TeacherForm
          teacher={teacher}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsEditFormOpen(false)}
          loading={formLoading}
          open={isEditFormOpen}
          onOpenChange={setIsEditFormOpen}
        />
      )}

      {/* Feedback Form Dialog */}
      <FeedbackSubmissionForm
        recipient={{
          id: teacher.id,
          full_name: teacher.full_name,
          user_type: 'teacher' as const
        }}
        open={isFeedbackFormOpen}
        onOpenChange={setIsFeedbackFormOpen}
        onSubmit={() => {
          setIsFeedbackFormOpen(false)
          // In real implementation, refresh feedback data
        }}
      />
    </motion.div>
  )
}