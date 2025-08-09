'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Edit, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  User, 
  GraduationCap,
  Award,
  Languages,
  FileText,
  Users,
  BookOpen,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MoreVertical,
  Download,
  Archive,
  RotateCcw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import type { Teacher } from '@/types/teacher'
import {
  staggerContainer
} from '@/lib/animations'

interface TeacherProfileProps {
  teacher: Teacher
  onEdit?: () => void
  onDelete?: () => void
  onArchive?: () => void
  onRestore?: () => void
  loading?: boolean
}

export function TeacherProfile({ 
  teacher, 
  onEdit, 
  onDelete, 
  onArchive, 
  onRestore,
  loading = false 
}: TeacherProfileProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'education' | 'assignments' | 'documents'>('overview')

  const getEmploymentStatusBadge = (status: string) => {
    const variants = {
      active: { variant: 'default' as const, color: 'bg-green-500' },
      inactive: { variant: 'secondary' as const, color: 'bg-gray-500' },
      on_leave: { variant: 'outline' as const, color: 'bg-yellow-500' },
      terminated: { variant: 'destructive' as const, color: 'bg-red-500' },
    }
    
    const config = variants[status as keyof typeof variants] || variants.inactive
    
    return (
      <Badge variant={config.variant}>
        <div className={`w-2 h-2 rounded-full ${config.color} mr-2`} />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    )
  }

  const formatCurrency = (amount?: number, currency?: string) => {
    if (!amount) return 'Not specified'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'UZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(d)
  }

  const getLanguageLabel = (code: string) => {
    const languages: Record<string, string> = {
      en: 'English',
      ru: 'Russian', 
      uz: 'Uzbek',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      it: 'Italian',
      ja: 'Japanese',
      ko: 'Korean',
      zh: 'Chinese'
    }
    return languages[code] || code.toUpperCase()
  }

  const calculateExperience = () => {
    const hireDate = new Date(teacher.hire_date)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - hireDate.getTime())
    const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25))
    const diffMonths = Math.floor((diffTime % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44))
    
    if (diffYears > 0) {
      return `${diffYears} year${diffYears > 1 ? 's' : ''} ${diffMonths > 0 ? `${diffMonths} month${diffMonths > 1 ? 's' : ''}` : ''}`
    }
    return `${diffMonths} month${diffMonths > 1 ? 's' : ''}`
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'education', label: 'Education & Skills', icon: GraduationCap },
    { id: 'assignments', label: 'Assignments', icon: Users },
    { id: 'documents', label: 'Documents', icon: FileText },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <motion.div 
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/teachers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{teacher.full_name}</h1>
            <p className="text-muted-foreground mt-1">
              Teacher Profile • ID: {teacher.employee_id || teacher.id.slice(0, 8)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {onEdit && (
            <Button onClick={onEdit} className="gap-2">
              <Edit className="h-4 w-4" />
              Edit Profile
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Export Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {teacher.deleted_at ? (
                onRestore && (
                  <DropdownMenuItem onClick={onRestore}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restore
                  </DropdownMenuItem>
                )
              ) : (
                onArchive && (
                  <DropdownMenuItem onClick={onArchive}>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                )
              )}
              {onDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Teacher</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {teacher.full_name}? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Profile Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              <div className="h-32 w-32 rounded-full bg-muted border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden">
                {teacher.profile_image_url ? (
                  <Image
                    src={teacher.profile_image_url}
                    alt={teacher.full_name}
                    width={128}
                    height={128}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Basic Info */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-4 flex-wrap">
                {getEmploymentStatusBadge(teacher.employment_status)}
                <Badge variant={teacher.is_active ? 'default' : 'secondary'}>
                  {teacher.is_active ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <XCircle className="h-3 w-3 mr-1" />
                  )}
                  {teacher.is_active ? 'Active' : 'Inactive'}
                </Badge>
                {teacher.contract_type && (
                  <Badge variant="outline">
                    {teacher.contract_type.replace('_', ' ')}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  {teacher.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${teacher.email}`} className="hover:underline">
                        {teacher.email}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${teacher.phone}`} className="hover:underline">
                      {teacher.phone}
                    </a>
                  </div>
                  {teacher.address && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{teacher.address.city}, {teacher.address.country}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Hired {formatDate(teacher.hire_date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{calculateExperience()} experience</span>
                  </div>
                  {teacher.date_of_birth && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>Born {formatDate(teacher.date_of_birth)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Specializations Quick View */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Teaching Specializations</h3>
          <div className="flex flex-wrap gap-2">
            {teacher.specializations.length > 0 ? (
              teacher.specializations.map((spec, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  <BookOpen className="h-3 w-3" />
                  {spec}
                </Badge>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">No specializations defined</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div className="border-b relative">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative flex items-center gap-2 py-2 px-1 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
variants={{
                  active: { color: 'hsl(var(--primary))' },
                  inactive: { color: 'hsl(var(--muted-foreground))' }
                }}
                initial="inactive"
                animate={activeTab === tab.id ? "active" : "inactive"}
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    layoutId="activeTab"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30
                    }}
                  />
                )}
              </motion.button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={activeTab}
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  <p className="mt-1">{teacher.full_name}</p>
                </div>
                {teacher.gender && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Gender</label>
                    <p className="mt-1 capitalize">{teacher.gender}</p>
                  </div>
                )}
                {teacher.date_of_birth && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                    <p className="mt-1">{formatDate(teacher.date_of_birth)}</p>
                  </div>
                )}
                {teacher.languages_spoken.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Languages</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {teacher.languages_spoken.map((lang, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {getLanguageLabel(lang)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Professional Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Professional Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {teacher.employee_id && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Employee ID</label>
                    <p className="mt-1">{teacher.employee_id}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Hire Date</label>
                  <p className="mt-1">{formatDate(teacher.hire_date)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Employment Status</label>
                  <div className="mt-1">{getEmploymentStatusBadge(teacher.employment_status)}</div>
                </div>
                {teacher.contract_type && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Contract Type</label>
                    <p className="mt-1 capitalize">{teacher.contract_type.replace('_', ' ')}</p>
                  </div>
                )}
                {teacher.salary_amount && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Salary</label>
                    <p className="mt-1">{formatCurrency(teacher.salary_amount, teacher.salary_currency)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            {teacher.emergency_contact && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Emergency Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <p className="mt-1">{teacher.emergency_contact.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Relationship</label>
                    <p className="mt-1 capitalize">{teacher.emergency_contact.relationship}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <a href={`tel:${teacher.emergency_contact.phone}`} className="mt-1 hover:underline block">
                      {teacher.emergency_contact.phone}
                    </a>
                  </div>
                  {teacher.emergency_contact.email && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <a href={`mailto:${teacher.emergency_contact.email}`} className="mt-1 hover:underline block">
                        {teacher.emergency_contact.email}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'education' && (
          <div className="space-y-6">
            {/* Qualifications */}
            {teacher.qualifications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Education & Qualifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {teacher.qualifications.map((qual) => (
                      <div key={qual.id} className="border-l-4 border-primary/20 pl-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{qual.degree}</h4>
                            <p className="text-muted-foreground">{qual.institution}</p>
                            {qual.field_of_study && (
                              <p className="text-sm text-muted-foreground">{qual.field_of_study}</p>
                            )}
                          </div>
                          <div className="text-right text-sm">
                            <p className="font-medium">{qual.year}</p>
                            {qual.country && (
                              <p className="text-muted-foreground">{qual.country}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Certifications */}
            {teacher.certifications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Certifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {teacher.certifications.map((cert) => (
                      <div key={cert.id} className="flex items-start justify-between p-4 bg-muted/20 rounded-lg">
                        <div>
                          <h4 className="font-medium">{cert.name}</h4>
                          <p className="text-muted-foreground">{cert.institution}</p>
                          {cert.credential_id && (
                            <p className="text-sm text-muted-foreground">ID: {cert.credential_id}</p>
                          )}
                        </div>
                        <div className="text-right text-sm">
                          <p className="font-medium">Issued {formatDate(cert.issue_date)}</p>
                          {cert.expiry_date && (
                            <p className="text-muted-foreground">
                              Expires {formatDate(cert.expiry_date)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Specializations & Languages */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Specializations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {teacher.specializations.length > 0 ? (
                      teacher.specializations.map((spec, index) => (
                        <Badge key={index} variant="secondary">
                          {spec}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">No specializations defined</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Languages className="h-5 w-5" />
                    Languages Spoken
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {teacher.languages_spoken.length > 0 ? (
                      teacher.languages_spoken.map((lang, index) => (
                        <Badge key={index} variant="outline">
                          {getLanguageLabel(lang)}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">No languages specified</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'assignments' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Current Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No assignments yet</p>
                <p className="text-sm">Group assignments and student data will appear here</p>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'documents' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents & Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No documents uploaded</p>
                <p className="text-sm">Contracts, certificates, and other documents will appear here</p>
              </div>
            </CardContent>
          </Card>
        )}
        </motion.div>
      </AnimatePresence>

      {/* Additional Notes */}
      {teacher.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Additional Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {teacher.notes}
            </p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}