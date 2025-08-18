'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScheduleEditor } from './schedule-editor'
import {
  Save,
  X,
  Users,
  BookOpen,
  Calendar as CalendarIcon,
  Settings,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import type { Group, ScheduleSlot } from '@/types/group'
import {
  createGroupSchema,
  updateGroupSchema,
  GROUP_SUBJECTS,
  GROUP_LEVELS,
  GROUP_TYPES,
  PAYMENT_FREQUENCIES,
  type CreateGroupRequest,
  type UpdateGroupRequest
} from '@/lib/validations/group'
import { groupService } from '@/lib/services/group-service'

interface GroupFormProps {
  group?: Group
  onSave: (group: Group) => void
  onCancel: () => void
  isSubmitting?: boolean
  hideHeader?: boolean
}

const CURRENCY_OPTIONS = [
  { value: 'UZS', label: 'UZS (Uzbek Som)', symbol: 'soʻm' },
  { value: 'USD', label: 'USD (US Dollar)', symbol: '$' },
  { value: 'EUR', label: 'EUR (Euro)', symbol: '€' }
]

export function GroupForm({
  group,
  onSave,
  onCancel,
  isSubmitting = false,
  hideHeader = false
}: GroupFormProps) {
  const t = useTranslations('groups')
  const tCommon = useTranslations('common')
  const tActions = useTranslations('actions')
  const [currentStep, setCurrentStep] = useState(0)
  const [schedule, setSchedule] = useState<ScheduleSlot[]>(group?.schedule || [])
  
  const isEditing = !!group
  const schema = isEditing ? updateGroupSchema : createGroupSchema

  const form = useForm<any>({
    resolver: zodResolver(schema) as any,
    defaultValues: group ? {
      name: group.name,
      group_code: group.group_code,
      subject: group.subject,
      level: group.level,
      group_type: group.group_type,
      description: group.description || '',
      max_students: group.max_students,
      schedule: group.schedule,
      classroom: group.classroom || '',
      online_meeting_url: group.online_meeting_url || '',
      start_date: group.start_date,
      end_date: group.end_date || '',
      duration_weeks: group.duration_weeks,
      price_per_student: group.price_per_student,
      currency: group.currency || 'UZS',
      payment_frequency: group.payment_frequency,
      notes: group.notes || ''
    } : {
      currency: 'UZS',
      max_students: 15,
      schedule: [],
      start_date: new Date().toISOString().split('T')[0]
    }
  })

  // Update schedule in form when it changes
  useEffect(() => {
    form.setValue('schedule', schedule)
  }, [schedule, form])

  // Generate group code when subject and level change
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if ((name === 'subject' || name === 'level') && value.subject && value.level && !isEditing) {
        const year = new Date().getFullYear()
        const subjectCode = value.subject.substring(0, 3).toUpperCase()
        const levelCode = value.level.substring(0, 3).toUpperCase()
        const code = `${subjectCode}-${levelCode}-${year}`
        form.setValue('group_code', code)
      }
    })

    return () => subscription.unsubscribe()
  }, [form, isEditing])

  const onSubmit = async (data: CreateGroupRequest | UpdateGroupRequest) => {
    try {
      let savedGroup: Group

      if (isEditing && 'id' in data) {
        savedGroup = await groupService.update(data.id, data)
      } else {
        savedGroup = await groupService.create(data as CreateGroupRequest)
      }

      onSave(savedGroup)
    } catch (error) {
      console.error('Failed to save group:', error)
    }
  }

  const steps = [
    {
      title: t('basicInformation'),
      icon: BookOpen,
      fields: ['name', 'group_code', 'subject', 'level', 'group_type', 'description']
    },
    {
      title: t('capacitySchedule'),
      icon: Users,
      fields: ['max_students', 'schedule', 'classroom', 'online_meeting_url']
    },
    {
      title: t('datesPricing'),
      icon: CalendarIcon,
      fields: ['start_date', 'end_date', 'duration_weeks', 'price_per_student', 'currency', 'payment_frequency']
    },
    {
      title: t('additionalDetails'),
      icon: Settings,
      fields: ['notes']
    }
  ]

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('groupName')} *</FormLabel>
                    <FormControl>
                      <Input placeholder={t('namePlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="group_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('groupCode')} *</FormLabel>
                    <FormControl>
                      <Input placeholder={t('codePlaceholder')} {...field} />
                    </FormControl>
                    <FormDescription>
                      {t('uniqueIdentifier')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('subject')} *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('selectSubject')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GROUP_SUBJECTS.map((subject) => (
                          <SelectItem key={subject} value={subject}>
                            {subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('level')} *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('selectLevel')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GROUP_LEVELS.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="group_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('type')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('selectType')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GROUP_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('description')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('groupDescPlaceholder')}
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )

      case 1:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="max_students"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('maxStudents')} *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={5}
                      max={50}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('maxStudentsDesc')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="schedule"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('classSchedule')} *</FormLabel>
                  <FormControl>
                    <ScheduleEditor
                      schedule={schedule}
                      onChange={(newSchedule) => {
                        setSchedule(newSchedule)
                        field.onChange(newSchedule)
                      }}
                      error={form.formState.errors['schedule']?.message as string}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="classroom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('classroom')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('classroomPlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="online_meeting_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('onlineMeetingUrl')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('onlineUrlPlaceholder')} {...field} />
                    </FormControl>
                    <FormDescription>
                      {t('onlineUrlDesc')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('startDate')} *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), 'PPP')
                            ) : (
                              <span>{t('pickDate')}</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date?.toISOString().split('T')[0])}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('endDate')}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), 'PPP')
                            ) : (
                              <span>{t('pickDate')}</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date?.toISOString().split('T')[0] || '')}
                          disabled={(date) => {
                            const startDate = form.getValues('start_date')
                            return startDate ? date < new Date(startDate) : date < new Date()
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      {t('endDateDesc')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration_weeks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('durationWeeks')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={52}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="price_per_student"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('pricePerStudent')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="1000"
                        placeholder={t('pricePlaceholder')}
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('currency')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CURRENCY_OPTIONS.map((currency) => (
                          <SelectItem key={currency.value} value={currency.value}>
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('paymentFrequency')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('selectFrequency')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAYMENT_FREQUENCIES.map((freq) => (
                          <SelectItem key={freq} value={freq}>
                            {freq.charAt(0).toUpperCase() + freq.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('additionalNotes')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('notesPlaceholder')}
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('groupSummary')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">{t('groupName')}:</span> {form.watch('name') || t('notSet')}
                  </div>
                  <div>
                    <span className="font-medium">{t('groupCode')}:</span> {form.watch('group_code') || t('notSet')}
                  </div>
                  <div>
                    <span className="font-medium">{t('subject')}:</span> {form.watch('subject') || t('notSet')}
                  </div>
                  <div>
                    <span className="font-medium">{t('level')}:</span> {form.watch('level') || t('notSet')}
                  </div>
                  <div>
                    <span className="font-medium">{t('capacity')}:</span> {form.watch('max_students') || 0} {t('students')}
                  </div>
                  <div>
                    <span className="font-medium">{t('schedule')}:</span> {schedule.length} {t('timeSlots')}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className={hideHeader ? "" : "max-w-4xl mx-auto"}>
      {!hideHeader && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {isEditing ? t('editGroup') : t('createNewGroup')}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={onCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
        </Card>
      )}
      
      {/* Step Navigation */}
      <div className="flex items-center space-x-2 mb-6">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isActive = index === currentStep
          const isCompleted = index < currentStep
          
          return (
            <div key={index} className="flex items-center">
              <Button
                type="button"
                variant={isActive ? 'default' : isCompleted ? 'secondary' : 'outline'}
                size="sm"
                className="h-8"
                onClick={() => setCurrentStep(index)}
              >
                <Icon className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">{step.title}</span>
                <span className="sm:hidden">{index + 1}</span>
              </Button>
              {index < steps.length - 1 && (
                <div className="w-2 h-px bg-border mx-1" />
              )}
            </div>
          )
        })}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-6">
            {renderStepContent()}
          </div>

          <div className="flex items-center justify-between pt-6 border-t">
            <div>
              {currentStep > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep - 1)}
                >
                  {tActions('previous')}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
              >
                {tActions('cancel')}
              </Button>

              {currentStep < steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={() => setCurrentStep(currentStep + 1)}
                >
                  {tActions('next')}
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? t('updateGroup') : t('createGroup')}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}