'use client'

import { useState, useCallback, useRef } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { useTranslations } from 'next-intl'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Plus, 
  X, 
  Save, 
  ArrowLeft, 
  Upload, 
  Camera, 
  User, 
  AlertTriangle,
  Check,
  Eye,
  EyeOff
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { type CreateTeacherRequest } from '@/lib/validations/teacher'
import type { Teacher } from '@/types/teacher'

interface TeacherFormProps {
  teacher?: Teacher
  onSubmit: (data: CreateTeacherRequest, profileImage?: File) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  mode?: 'create' | 'edit'
}

const predefinedSpecializations = [
  'English', 'Mathematics', 'Computer Science', 'Physics', 'Chemistry',
  'Biology', 'History', 'Geography', 'Literature', 'Business English',
  'IELTS Preparation', 'TOEFL Preparation', 'Academic Writing',
  'Conversation', 'Grammar', 'Pronunciation'
]

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Russian' },
  { value: 'uz', label: 'Uzbek' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh', label: 'Chinese' },
]

export function TeacherForm({ 
  teacher, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  mode = teacher ? 'edit' : 'create'
}: TeacherFormProps) {
  const t = useTranslations('teachers')
  const tCommon = useTranslations('common')
  const tForms = useTranslations('forms')
  const [newSpecialization, setNewSpecialization] = useState('')
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string>(
    teacher?.profile_image_url || ''
  )
  const [uploadProgress, _setUploadProgress] = useState(0)
  const [showSalary, setShowSalary] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm({
    defaultValues: {
      first_name: teacher?.first_name || '',
      last_name: teacher?.last_name || '',
      email: teacher?.email || '',
      phone: teacher?.phone || '',
      date_of_birth: teacher?.date_of_birth,
      gender: teacher?.gender,
      employee_id: teacher?.employee_id || '',
      hire_date: teacher?.hire_date || new Date(),
      employment_status: (teacher?.employment_status as 'active' | 'inactive' | 'on_leave' | 'terminated') || 'active',
      contract_type: teacher?.contract_type,
      salary_amount: teacher?.salary_amount,
      salary_currency: teacher?.salary_currency || 'UZS',
      specializations: teacher?.specializations || [],
      qualifications: teacher?.qualifications || [],
      certifications: teacher?.certifications || [],
      languages_spoken: teacher?.languages_spoken || [],
      address: teacher?.address,
      emergency_contact: teacher?.emergency_contact,
      notes: teacher?.notes || '',
      is_active: teacher?.is_active ?? true,
    },
    mode: 'onChange'
  })

  const {
    fields: _qualificationFields,
    append: _appendQualification,
    remove: _removeQualification,
  } = useFieldArray({
    control: form.control,
    name: 'qualifications',
  })

  const {
    fields: _certificationFields,
    append: _appendCertification,
    remove: _removeCertification,
  } = useFieldArray({
    control: form.control,
    name: 'certifications',
  })

  // Track form changes
  useState(() => {
    const subscription = form.watch((_value, { name }) => {
      if (name && !isLoading) {
        setHasUnsavedChanges(true)
      }
    })
    return () => subscription.unsubscribe()
  })

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    setProfileImage(file)
    setHasUnsavedChanges(true)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setProfileImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }, [])

  const removeProfileImage = useCallback(() => {
    setProfileImage(null)
    setProfileImagePreview('')
    setHasUnsavedChanges(true)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const addSpecialization = useCallback(() => {
    if (newSpecialization.trim()) {
      const current = form.getValues('specializations')
      if (!current.includes(newSpecialization.trim())) {
        form.setValue('specializations', [...current, newSpecialization.trim()], {
          shouldDirty: true,
          shouldValidate: true
        })
        setHasUnsavedChanges(true)
      }
      setNewSpecialization('')
    }
  }, [newSpecialization, form])

  const removeSpecialization = useCallback((index: number) => {
    const current = form.getValues('specializations')
    form.setValue('specializations', current.filter((_, i) => i !== index), {
      shouldDirty: true,
      shouldValidate: true
    })
    setHasUnsavedChanges(true)
  }, [form])

  const addLanguage = useCallback((language: string) => {
    const current = form.getValues('languages_spoken')
    if (!current.includes(language)) {
      form.setValue('languages_spoken', [...current, language], {
        shouldDirty: true,
        shouldValidate: true
      })
      setHasUnsavedChanges(true)
    }
  }, [form])

  const removeLanguage = useCallback((index: number) => {
    const current = form.getValues('languages_spoken')
    form.setValue('languages_spoken', current.filter((_, i) => i !== index), {
      shouldDirty: true,
      shouldValidate: true
    })
    setHasUnsavedChanges(true)
  }, [form])

  const handleSubmit = useCallback(async (data: CreateTeacherRequest) => {
    try {
      await onSubmit(data, profileImage || undefined)
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('Error submitting form:', error)
    }
  }, [onSubmit, profileImage])

  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      // This will trigger the AlertDialog
      return
    }
    onCancel()
  }, [hasUnsavedChanges, onCancel])

  const getFormProgress = () => {
    const fields = [
      'first_name', 'last_name', 'phone', 'hire_date',
      'employment_status', 'specializations'
    ]
    const completed = fields.filter(field => {
      const value = form.getValues(field as any)
      return Array.isArray(value) ? value.length > 0 : !!value
    }).length
    return Math.round((completed / fields.length) * 100)
  }

  const formProgress = getFormProgress()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
                <AlertDialogDescription>
                  You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Continue Editing</AlertDialogCancel>
                <AlertDialogAction onClick={onCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Leave Without Saving
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div>
            <h1 className="text-3xl font-bold">
              {mode === 'edit' ? 'Edit Teacher' : 'Add New Teacher'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {mode === 'edit' 
                ? 'Update teacher information and assignments'
                : 'Create a comprehensive teacher profile'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Form Progress */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{formProgress}% Complete</span>
            <Progress value={formProgress} className="w-20" />
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              onClick={form.handleSubmit(handleSubmit)} 
              disabled={isLoading || !form.formState.isValid}
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : mode === 'edit' ? 'Update Teacher' : 'Create Teacher'}
            </Button>
          </div>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Profile Photo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Profile Photo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-muted border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden">
                  {profileImagePreview ? (
                    <Image
                      src={profileImagePreview}
                      alt="Profile preview"
                      width={96}
                      height={96}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                {profileImagePreview && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={removeProfileImage}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photo
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    JPG, PNG up to 5MB
                  </span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <Progress value={uploadProgress} className="w-40" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="first_name"
                  {...form.register('first_name')}
                  placeholder="Enter first name"
                  className={form.formState.errors.first_name ? 'border-red-500' : ''}
                />
                {form.formState.errors.first_name && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {form.formState.errors.first_name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="last_name">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="last_name"
                  {...form.register('last_name')}
                  placeholder="Enter last name"
                  className={form.formState.errors.last_name ? 'border-red-500' : ''}
                />
                {form.formState.errors.last_name && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {form.formState.errors.last_name.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register('email')}
                  placeholder="teacher@harryschool.uz"
                  className={form.formState.errors.email ? 'border-red-500' : ''}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  {...form.register('phone')}
                  placeholder="+998901234567"
                  className={form.formState.errors.phone ? 'border-red-500' : ''}
                />
                {form.formState.errors.phone && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {form.formState.errors.phone.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  {...form.register('date_of_birth', { valueAsDate: true })}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={form.watch('gender') || ''}
                  onValueChange={(value) => form.setValue('gender', value as any, { shouldDirty: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="employee_id">Employee ID</Label>
                <Input
                  id="employee_id"
                  {...form.register('employee_id')}
                  placeholder="HS2024001"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Professional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="hire_date">
                  Hire Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="hire_date"
                  type="date"
                  {...form.register('hire_date', { valueAsDate: true })}
                  max={new Date().toISOString().split('T')[0]}
                  className={form.formState.errors.hire_date ? 'border-red-500' : ''}
                />
                {form.formState.errors.hire_date && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.hire_date.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="employment_status">Employment Status</Label>
                <Select
                  value={form.watch('employment_status')}
                  onValueChange={(value) => form.setValue('employment_status', value as any, { shouldDirty: true })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="contract_type">Contract Type</Label>
                <Select
                  value={form.watch('contract_type') || ''}
                  onValueChange={(value) => form.setValue('contract_type', value as any, { shouldDirty: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select contract type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="substitute">Substitute</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Salary Information */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Salary Information</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSalary(!showSalary)}
                  className="gap-2"
                >
                  {showSalary ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showSalary ? 'Hide' : 'Show'} Salary
                </Button>
              </div>
              
              {showSalary && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/20 rounded-lg">
                  <div>
                    <Label htmlFor="salary_amount">Salary Amount</Label>
                    <Input
                      id="salary_amount"
                      type="number"
                      {...form.register('salary_amount', { valueAsNumber: true })}
                      placeholder="8000000"
                      min="0"
                      step="100000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="salary_currency">Currency</Label>
                    <Select
                      value={form.watch('salary_currency')}
                      onValueChange={(value) => form.setValue('salary_currency', value, { shouldDirty: true })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UZS">UZS - Uzbek Som</SelectItem>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            {/* Active Status Toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={form.watch('is_active')}
                onCheckedChange={(checked) => form.setValue('is_active', checked, { shouldDirty: true })}
              />
              <Label htmlFor="is_active">Active Teacher</Label>
            </div>
          </CardContent>
        </Card>

        {/* Specializations & Languages */}
        <Card>
          <CardHeader>
            <CardTitle>Specializations & Languages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Specializations */}
            <div>
              <Label>Teaching Specializations</Label>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {form.watch('specializations').map((spec, index) => (
                    <Badge key={`specialization-${spec}-${index}`} variant="secondary" className="gap-1">
                      {spec}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0"
                        onClick={() => removeSpecialization(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>

                {/* Quick Add Buttons */}
                <div className="flex flex-wrap gap-2">
                  {predefinedSpecializations
                    .filter(spec => !form.watch('specializations').includes(spec))
                    .slice(0, 8)
                    .map(spec => (
                      <Button
                        key={spec}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const current = form.getValues('specializations')
                          form.setValue('specializations', [...current, spec], { shouldDirty: true })
                          setHasUnsavedChanges(true)
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {spec}
                      </Button>
                    ))}
                </div>

                {/* Custom Specialization Input */}
                <div className="flex gap-2">
                  <Input
                    value={newSpecialization}
                    onChange={(e) => setNewSpecialization(e.target.value)}
                    placeholder="Add custom specialization"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialization())}
                  />
                  <Button type="button" onClick={addSpecialization} disabled={!newSpecialization.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Languages */}
            <div>
              <Label>Languages Spoken</Label>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {form.watch('languages_spoken').map((lang, index) => (
                    <Badge key={`language-${lang}-${index}`} variant="secondary" className="gap-1">
                      {languageOptions.find(l => l.value === lang)?.label || lang}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0"
                        onClick={() => removeLanguage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>

                <Select onValueChange={addLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languageOptions
                      .filter(lang => !form.watch('languages_spoken').includes(lang.value))
                      .map(lang => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Qualifications */}
        <Card>
          <CardHeader>
            <CardTitle>Education & Qualifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {_qualificationFields.map((field, index) => (
              <div key={field.id} className="space-y-4 p-4 border rounded-lg bg-muted/20">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Qualification {index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => _removeQualification(index)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Degree <span className="text-red-500">*</span></Label>
                    <Input
                      {...form.register(`qualifications.${index}.degree`)}
                      placeholder="Bachelor of Arts"
                    />
                  </div>
                  <div>
                    <Label>Institution <span className="text-red-500">*</span></Label>
                    <Input
                      {...form.register(`qualifications.${index}.institution`)}
                      placeholder="University name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Year <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      {...form.register(`qualifications.${index}.year`, { valueAsNumber: true })}
                      placeholder="2020"
                      min="1950"
                      max={new Date().getFullYear()}
                    />
                  </div>
                  <div>
                    <Label>Field of Study</Label>
                    <Input
                      {...form.register(`qualifications.${index}.field_of_study`)}
                      placeholder="English Literature"
                    />
                  </div>
                  <div>
                    <Label>Country</Label>
                    <Input
                      {...form.register(`qualifications.${index}.country`)}
                      placeholder="United Kingdom"
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() => _appendQualification({
                id: crypto.randomUUID(),
                degree: '',
                institution: '',
                year: new Date().getFullYear(),
              })}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Qualification
            </Button>
          </CardContent>
        </Card>

        {/* Emergency Contact & Address */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Emergency Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergency_name">Contact Name</Label>
                  <Input
                    id="emergency_name"
                    {...form.register('emergency_contact.name')}
                    placeholder="Emergency contact name"
                  />
                </div>
                <div>
                  <Label htmlFor="emergency_relationship">Relationship</Label>
                  <Input
                    id="emergency_relationship"
                    {...form.register('emergency_contact.relationship')}
                    placeholder="spouse, parent, sibling"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergency_phone">Phone</Label>
                  <Input
                    id="emergency_phone"
                    {...form.register('emergency_contact.phone')}
                    placeholder="+998901234567"
                  />
                </div>
                <div>
                  <Label htmlFor="emergency_email">Email</Label>
                  <Input
                    id="emergency_email"
                    type="email"
                    {...form.register('emergency_contact.email')}
                    placeholder="contact@email.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle>Address Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  {...form.register('address.street')}
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    {...form.register('address.city')}
                    placeholder="Tashkent"
                  />
                </div>
                <div>
                  <Label htmlFor="region">Region</Label>
                  <Input
                    id="region"
                    {...form.register('address.region')}
                    placeholder="Toshkent shahar"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="postal_code">Postal Code</Label>
                  <Input
                    id="postal_code"
                    {...form.register('address.postal_code')}
                    placeholder="100000"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    {...form.register('address.country')}
                    placeholder="Uzbekistan"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              {...form.register('notes')}
              placeholder="Additional notes about the teacher, special accommodations, or other relevant information..."
              rows={4}
              maxLength={2000}
            />
            <div className="text-right text-sm text-muted-foreground mt-1">
              {form.watch('notes')?.length || 0}/2000
            </div>
          </CardContent>
        </Card>

        {/* Form Summary */}
        <Card className="bg-muted/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Ready to {mode === 'edit' ? 'update' : 'create'} teacher profile?</p>
                <p className="text-sm text-muted-foreground">
                  Please review all information before submitting.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {form.formState.isValid ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="h-4 w-4" />
                    <span className="text-sm font-medium">Ready to submit</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">Please complete required fields</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}