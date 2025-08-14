'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Users,
  CreditCard,
  FileText,
  AlertTriangle,
  Edit,
  GraduationCap,
  BookOpen,
  Clock,
  TrendingUp,
  Activity,
  DollarSign,
  Trophy,
} from 'lucide-react'
import type { Student } from '@/types/student'
import { ClientOnly } from '@/components/ui/client-only'
import { fadeVariants } from '@/lib/animations'
import { StudentRankingTab } from './ranking/student-ranking-tab'

interface StudentProfileProps {
  student: Student
  onEdit?: () => void
  onEnrollmentChange?: (groupId: string, action: 'enroll' | 'withdraw') => void
  loading?: boolean
}

export function StudentProfile({ 
  student, 
  onEdit, 
 
}: StudentProfileProps) {
  const [activeTab, setActiveTab] = useState('overview')

  const calculateAge = (birthDate: string): number => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: 'UZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800 border-green-200',
      inactive: 'bg-gray-100 text-gray-800 border-gray-200',
      graduated: 'bg-blue-100 text-blue-800 border-blue-200',
      suspended: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      dropped: 'bg-red-100 text-red-800 border-red-200',
    } as const
    return colors[status as keyof typeof colors] || colors.inactive
  }

  const getPaymentStatusColor = (status: string) => {
    const colors = {
      paid: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      overdue: 'bg-red-100 text-red-800 border-red-200',
      partial: 'bg-orange-100 text-orange-800 border-orange-200',
    } as const
    return colors[status as keyof typeof colors] || colors.pending
  }

  const age = calculateAge(student.date_of_birth)
  const enrollmentDuration = Math.floor(
    (new Date().getTime() - new Date(student.enrollment_date).getTime()) / 
    (1000 * 3600 * 24 * 30)
  ) // months

  return (
    <motion.div
      variants={fadeVariants}
      initial="hidden"
      animate="visible"
      transition={{ type: "spring", stiffness: 100 }}
      className="space-y-6"
    >
      {/* Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={student.profile_image_url} alt={student.full_name} />
                <AvatarFallback className="text-lg bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                  {student.first_name[0]}{student.last_name[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="space-y-2">
                <div>
                  <h1 className="text-2xl font-bold">{student.full_name}</h1>
                  <p className="text-muted-foreground font-mono">{student.student_id}</p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Badge className={`${getStatusColor(student.status)}`}>
                    {student.status}
                  </Badge>
                  <Badge className={`${getPaymentStatusColor(student.payment_status)}`}>
                    {student.payment_status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {age} years old
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Enrolled <ClientOnly fallback="Loading...">
                      {formatDate(student.enrollment_date)}
                    </ClientOnly>
                  </div>
                  <div className="flex items-center">
                    <GraduationCap className="h-4 w-4 mr-1" />
                    {student.current_level}
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {student.groups.length} groups
                  </div>
                </div>
              </div>
            </div>
            
            {onEdit && (
              <Button onClick={onEdit} variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ranking" className="flex items-center space-x-2">
            <Trophy className="h-4 w-4" />
            <span>Ranking</span>
          </TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="notes">Notes & Medical</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Enrollment Duration</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{enrollmentDuration} months</div>
                <p className="text-xs text-muted-foreground">
                  Since <ClientOnly fallback="Loading...">
                    {formatDate(student.enrollment_date)}
                  </ClientOnly>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Groups</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{student.groups.length}</div>
                <p className="text-xs text-muted-foreground">
                  Currently enrolled
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${student.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(student.balance)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {student.balance > 0 ? 'Payment pending' : 'Fully paid'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Preferred Subjects */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>Preferred Subjects</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {student.preferred_subjects.map((subject) => (
                  <Badge key={subject} variant="secondary">
                    {subject}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm">Enrolled in new group</p>
                    <p className="text-xs text-muted-foreground">2 days ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm">Payment received</p>
                    <p className="text-xs text-muted-foreground">1 week ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm">Profile updated</p>
                    <p className="text-xs text-muted-foreground">2 weeks ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ranking Tab */}
        <TabsContent value="ranking" className="space-y-6">
          <StudentRankingTab student={student} />
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Student Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Student Contact</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{student.phone}</span>
                </div>
                {student.email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{student.email}</span>
                  </div>
                )}
                <div className="flex items-start space-x-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p>{student.address.street}</p>
                    <p>{student.address.city}, {student.address.region}</p>
                    {student.address.postal_code && <p>{student.address.postal_code}</p>}
                    <p>{student.address.country}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Parent/Guardian Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Parent/Guardian</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium">{student.parent_name}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{student.parent_phone}</span>
                </div>
                {student.parent_email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{student.parent_email}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Emergency Contact</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium">{student.emergency_contact.name}</p>
                    <p className="text-sm text-muted-foreground">{student.emergency_contact.relationship}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{student.emergency_contact.phone}</span>
                    </div>
                    {student.emergency_contact.email && (
                      <div className="flex items-center space-x-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{student.emergency_contact.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Academic Tab */}
        <TabsContent value="academic" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <GraduationCap className="h-4 w-4" />
                  <span>Academic Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Level</p>
                    <p className="font-medium">{student.current_level}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Academic Year</p>
                    <p className="font-medium">{student.academic_year || 'Not specified'}</p>
                  </div>
                  {student.grade_level && (
                    <div>
                      <p className="text-sm text-muted-foreground">Grade Level</p>
                      <p className="font-medium">{student.grade_level}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Enrollment Date</p>
                    <p className="font-medium">
                      <ClientOnly fallback="Loading...">
                        {formatDate(student.enrollment_date)}
                      </ClientOnly>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Current Enrollments</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {student.groups.length > 0 ? (
                  <div className="space-y-3">
                    {student.groups.map((groupId, index) => (
                      <div key={groupId} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium">Group {index + 1}</p>
                          <p className="text-sm text-muted-foreground">ID: {groupId}</p>
                        </div>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No active group enrollments</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Progress Tracking Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>Progress Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Overall Progress</span>
                    <span>75%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Attendance Rate</span>
                    <span>92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Assignment Completion</span>
                    <span>88%</span>
                  </div>
                  <Progress value={88} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Badge className={`${getPaymentStatusColor(student.payment_status)} text-base`}>
                  {student.payment_status}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tuition Fee</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(student.tuition_fee || 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
                <AlertTriangle className={`h-4 w-4 ${student.balance > 0 ? 'text-red-500' : 'text-green-500'}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${student.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(student.balance)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment History Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4" />
                  <span>Payment History</span>
                </div>
                <Button variant="outline" size="sm">
                  Add Payment
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Monthly tuition</p>
                    <p className="text-sm text-muted-foreground">Dec 2024</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(500000)}</p>
                    <Badge variant="outline" className="text-xs">Paid</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Monthly tuition</p>
                    <p className="text-sm text-muted-foreground">Nov 2024</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(500000)}</p>
                    <Badge variant="outline" className="text-xs">Paid</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes & Medical Tab */}
        <TabsContent value="notes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4" />
                <span>Medical Notes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {student.medical_notes ? (
                <div className="p-4 bg-muted rounded-lg">
                  <p>{student.medical_notes}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">No medical notes recorded</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>General Notes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {student.notes ? (
                <div className="p-4 bg-muted rounded-lg">
                  <p>{student.notes}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">No general notes recorded</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}