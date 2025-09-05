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
  const t = useTranslations('teacherForm')
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
      alert(t('alerts.selectValidImage'))
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(t('alerts.fileSizeLimit'))
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
                <AlertDialogTitle>{t('alerts.unsavedChanges')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('alerts.unsavedChangesDescription')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('actions.continueEditing')}</AlertDialogCancel>
                <AlertDialogAction onClick={onCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {t('actions.leaveWithoutSaving')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div>
            <h1 className="text-3xl font-bold">
              {mode === 'edit' ? t('title.edit') : t('title.create')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {mode === 'edit' 
                ? t('description.edit')
                : t('description.create')
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Form Progress */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{formProgress}% {t('progress.complete')}</span>
            <Progress value={formProgress} className="w-20" />
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              {t('actions.cancel')}
            </Button>
            <Button 
              onClick={form.handleSubmit(handleSubmit)} 
              disabled={isLoading || !form.formState.isValid}
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? t('actions.saving') : mode === 'edit' ? t('actions.updateTeacher') : t('actions.createTeacher')}
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
              {t('sections.profilePhoto')}
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
                    {t('buttons.uploadPhoto')}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {t('messages.jpgPngUpTo5mb')}
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
            <CardTitle>{t('sections.basicInformation')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">
                  {t('fields.firstName')} <span className="text-red-500">{t('required')}</span>
                </Label>
                <Input
                  id="first_name"
                  {...form.register('first_name')}
                  placeholder={t('placeholders.enterFirstName')}
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
                  {t('fields.lastName')} <span className="text-red-500">{t('required')}</span>
                </Label>
                <Input
                  id="last_name"
                  {...form.register('last_name')}
                  placeholder={t('placeholders.enterLastName')}
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
                <Label htmlFor="email">{t('fields.emailAddress')}</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register('email')}
                  placeholder={t('placeholders.teacherEmail')}
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
                  {t('fields.phoneNumber')} <span className="text-red-500">{t('required')}</span>
                </Label>
                <Input
                  id="phone"
                  {...form.register('phone')}
                  placeholder={t('placeholders.phoneNumber')}
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
                <Label htmlFor="date_of_birth">{t('fields.dateOfBirth')}</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  {...form.register('date_of_birth', { valueAsDate: true })}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <Label htmlFor="gender">{t('fields.gender')}</Label>
                <Select
                  value={form.watch('gender') || ''}
                  onValueChange={(value) => form.setValue('gender', value as any, { shouldDirty: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('placeholders.selectGender')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">{t('options.male')}</SelectItem>
                    <SelectItem value="female">{t('options.female')}</SelectItem>
                    <SelectItem value="other">{t('options.other')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="employee_id">{t('fields.employeeId')}</Label>
                <Input
                  id="employee_id"
                  {...form.register('employee_id')}
                  placeholder={t('placeholders.employeeId')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t('sections.professionalInformation')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="hire_date">
                  {t('fields.hireDate')} <span className="text-red-500">{t('required')}</span>
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
                <Label htmlFor="employment_status">{t('fields.employmentStatus')}</Label>
                <Select
                  value={form.watch('employment_status')}
                  onValueChange={(value) => form.setValue('employment_status', value as any, { shouldDirty: true })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t('options.active')}</SelectItem>
                    <SelectItem value="inactive">{t('options.inactive')}</SelectItem>
                    <SelectItem value="on_leave">{t('options.onLeave')}</SelectItem>
                    <SelectItem value="terminated">{t('options.terminated')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="contract_type">{t('fields.contractType')}</Label>
                <Select
                  value={form.watch('contract_type') || ''}
                  onValueChange={(value) => form.setValue('contract_type', value as any, { shouldDirty: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('placeholders.selectContractType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">{t('options.fullTime')}</SelectItem>
                    <SelectItem value="part_time">{t('options.partTime')}</SelectItem>
                    <SelectItem value="contract">{t('options.contract')}</SelectItem>
                    <SelectItem value="substitute">{t('options.substitute')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Salary Information */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>{t('sections.salaryInformation')}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSalary(!showSalary)}
                  className="gap-2"
                >
                  {showSalary ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showSalary ? t('buttons.hideSalary') : t('buttons.showSalary')}
                </Button>
              </div>
              
              {showSalary && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/20 rounded-lg">
                  <div>
                    <Label htmlFor="salary_amount">{t('fields.salaryAmount')}</Label>
                    <Input
                      id="salary_amount"
                      type="number"
                      {...form.register('salary_amount', { valueAsNumber: true })}
                      placeholder={t('placeholders.salaryAmount')}
                      min="0"
                      step="100000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="salary_currency">{t('fields.currency')}</Label>
                    <Select
                      value={form.watch('salary_currency')}
                      onValueChange={(value) => form.setValue('salary_currency', value, { shouldDirty: true })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UZS">{t('options.uzs')}</SelectItem>
                        <SelectItem value="USD">{t('options.usd')}</SelectItem>
                        <SelectItem value="EUR">{t('options.eur')}</SelectItem>
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
              <Label htmlFor="is_active">{t('fields.activeTeacher')}</Label>
            </div>
          </CardContent>
        </Card>

        {/* Specializations & Languages */}
        <Card>
          <CardHeader>
            <CardTitle>{t('sections.specializationsLanguages')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Specializations */}
            <div>
              <Label>{t('fields.teachingSpecializations')}</Label>
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
                    placeholder={t('placeholders.addCustomSpecialization')}
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
              <Label>{t('fields.languagesSpoken')}</Label>
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
                    <SelectValue placeholder={t('placeholders.addLanguage')} />
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
            <CardTitle>{t('sections.educationQualifications')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {_qualificationFields.map((field, index) => (
              <div key={field.id} className="space-y-4 p-4 border rounded-lg bg-muted/20">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{t('fields.qualification')} {index + 1}</h4>
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
                    <Label>{t('fields.degree')} <span className="text-red-500">{t('required')}</span></Label>
                    <Input
                      {...form.register(`qualifications.${index}.degree`)}
                      placeholder={t('placeholders.bachelorOfArts')}
                    />
                  </div>
                  <div>
                    <Label>{t('fields.institution')} <span className="text-red-500">{t('required')}</span></Label>
                    <Input
                      {...form.register(`qualifications.${index}.institution`)}
                      placeholder={t('placeholders.universityName')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>{t('fields.year')} <span className="text-red-500">{t('required')}</span></Label>
                    <Input
                      type="number"
                      {...form.register(`qualifications.${index}.year`, { valueAsNumber: true })}
                      placeholder={t('placeholders.year')}
                      min="1950"
                      max={new Date().getFullYear()}
                    />
                  </div>
                  <div>
                    <Label>{t('fields.fieldOfStudy')}</Label>
                    <Input
                      {...form.register(`qualifications.${index}.field_of_study`)}
                      placeholder={t('placeholders.englishLiterature')}
                    />
                  </div>
                  <div>
                    <Label>{t('fields.country')}</Label>
                    <Input
                      {...form.register(`qualifications.${index}.country`)}
                      placeholder={t('placeholders.unitedKingdom')}
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
              {t('buttons.addQualification')}
            </Button>
          </CardContent>
        </Card>

        {/* Emergency Contact & Address */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle>{t('sections.emergencyContact')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergency_name">{t('fields.contactName')}</Label>
                  <Input
                    id="emergency_name"
                    {...form.register('emergency_contact.name')}
                    placeholder={t('placeholders.emergencyContactName')}
                  />
                </div>
                <div>
                  <Label htmlFor="emergency_relationship">{t('fields.relationship')}</Label>
                  <Input
                    id="emergency_relationship"
                    {...form.register('emergency_contact.relationship')}
                    placeholder={t('placeholders.spouseParentSibling')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergency_phone">{t('fields.phone')}</Label>
                  <Input
                    id="emergency_phone"
                    {...form.register('emergency_contact.phone')}
                    placeholder={t('placeholders.phoneNumber')}
                  />
                </div>
                <div>
                  <Label htmlFor="emergency_email">{t('fields.email')}</Label>
                  <Input
                    id="emergency_email"
                    type="email"
                    {...form.register('emergency_contact.email')}
                    placeholder={t('placeholders.contactEmail')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle>{t('sections.addressInformation')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="street">{t('fields.streetAddress')}</Label>
                <Input
                  id="street"
                  {...form.register('address.street')}
                  placeholder={t('placeholders.streetAddress')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">{t('fields.city')}</Label>
                  <Input
                    id="city"
                    {...form.register('address.city')}
                    placeholder={t('placeholders.city')}
                  />
                </div>
                <div>
                  <Label htmlFor="region">{t('fields.region')}</Label>
                  <Input
                    id="region"
                    {...form.register('address.region')}
                    placeholder={t('placeholders.region')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="postal_code">{t('fields.postalCode')}</Label>
                  <Input
                    id="postal_code"
                    {...form.register('address.postal_code')}
                    placeholder={t('placeholders.postalCode')}
                  />
                </div>
                <div>
                  <Label htmlFor="country">{t('fields.country')}</Label>
                  <Input
                    id="country"
                    {...form.register('address.country')}
                    placeholder={t('placeholders.country')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Notes */}
        <Card>
          <CardHeader>
            <CardTitle>{t('sections.additionalNotes')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              {...form.register('notes')}
              placeholder={t('placeholders.additionalNotes')}
              rows={4}
              maxLength={2000}
            />
            <div className="text-right text-sm text-muted-foreground mt-1">
              {form.watch('notes')?.length || 0}{t('messages.charactersLimit')}
            </div>
          </CardContent>
        </Card>

        {/* Form Summary */}
        <Card className="bg-muted/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">{mode === 'edit' ? t('alerts.readyToUpdate') : t('alerts.readyToCreate')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('alerts.reviewInformation')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {form.formState.isValid ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="h-4 w-4" />
                    <span className="text-sm font-medium">{t('alerts.readyToSubmit')}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">{t('alerts.completeRequiredFields')}</span>
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