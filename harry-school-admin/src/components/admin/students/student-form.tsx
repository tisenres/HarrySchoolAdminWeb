'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  User,
  MapPin, 
  Calendar,
  Users,
  CreditCard,
  FileText,
  AlertTriangle,
  Save,
  Loader2
} from 'lucide-react'
import { createStudentSchema, type CreateStudentRequest } from '@/lib/validations/student'
import type { Student } from '@/types/student'
import { fadeVariants } from '@/lib/animations'

interface StudentFormProps {
  student?: Student | undefined
  onSubmit: (data: CreateStudentRequest) => Promise<void>
  onCancel: () => void
  loading?: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}

const levelOptions = [
  'Beginner (A1)', 'Elementary (A2)', 'Intermediate (B1)', 'Upper-Intermediate (B2)', 
  'Advanced (C1)', 'Proficiency (C2)', 'Foundation', 'Grade 1', 'Grade 2', 'Grade 3',
  'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'
]

const subjectOptions = [
  'English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
  'IELTS Preparation', 'TOEFL Preparation', 'Business English', 'Academic Writing',
  'Conversation', 'Grammar', 'Literature', 'History', 'Geography'
]

const regionOptions = [
  'Toshkent shahar', 'Samarqand viloyati', 'Buxoro viloyati', 'Andijon viloyati',
  'Farg\'ona viloyati', 'Namangan viloyati', 'Qashqadaryo viloyati', 'Surxondaryo viloyati',
  'Xorazm viloyati', 'Navoiy viloyati', 'Jizzax viloyati', 'Sirdaryo viloyati', 
  'Qoraqalpog\'iston Respublikasi'
]

const relationshipOptions = [
  'Father', 'Mother', 'Guardian', 'Uncle', 'Aunt', 'Grandfather', 'Grandmother', 
  'Brother', 'Sister', 'Step-parent', 'Other'
]

export function StudentForm({
  student,
  onSubmit,
  loading = false,
  open,
  onOpenChange,
}: StudentFormProps) {
  const t = useTranslations('studentForm')
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    student?.preferred_subjects || []
  )

  const form = useForm<CreateStudentRequest>({
    resolver: zodResolver(createStudentSchema) as any,
    defaultValues: (student ? {
      first_name: student.first_name,
      last_name: student.last_name,
      date_of_birth: student.date_of_birth,
      gender: student.gender,
      email: student.email || '',
      phone: student.phone,
      parent_name: student.parent_name,
      parent_phone: student.parent_phone,
      parent_email: student.parent_email || '',
      address: student.address,
      enrollment_date: student.enrollment_date,
      status: student.status,
      current_level: student.current_level,
      preferred_subjects: student.preferred_subjects,
      academic_year: student.academic_year || '',
      grade_level: student.grade_level || '',
      medical_notes: student.medical_notes || '',
      emergency_contact: student.emergency_contact,
      payment_status: student.payment_status,
      balance: student.balance,
      tuition_fee: student.tuition_fee,
      notes: student.notes || '',
    } : {
      first_name: '',
      last_name: '',
      date_of_birth: '',
      gender: 'male',
      email: '',
      phone: '+998',
      parent_name: '',
      parent_phone: '+998',
      parent_email: '',
      address: {
        street: '',
        city: 'Tashkent',
        region: 'Toshkent shahar',
        postal_code: '',
        country: 'Uzbekistan'
      },
      enrollment_date: new Date().toISOString().split('T')[0],
      status: 'active',
      current_level: '',
      preferred_subjects: [],
      academic_year: '2024-2025',
      grade_level: '',
      medical_notes: '',
      emergency_contact: {
        name: '',
        relationship: 'Father',
        phone: '+998',
        email: ''
      },
      payment_status: 'pending',
      balance: 0,
      tuition_fee: 500000,
      notes: ''
    }) as any
  })
  
  // Initialize form with preferred_subjects
  React.useEffect(() => {
    form.setValue('preferred_subjects', selectedSubjects)
  }, [form, selectedSubjects])

  const handleSubmit = async (data: CreateStudentRequest) => {
    try {
      await onSubmit({
        ...data,
        preferred_subjects: selectedSubjects,
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Error submitting form:', error)
    }
  }

  const handleSubjectToggle = (subject: string) => {
    setSelectedSubjects(prev => {
      const newSubjects = prev.includes(subject) 
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
      // Update the form field value
      form.setValue('preferred_subjects', newSubjects)
      return newSubjects
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>{student ? t('title.edit') : t('title.add')}</span>
          </DialogTitle>
          <DialogDescription>
            {student ? t('description.edit') : t('description.add')}
          </DialogDescription>
        </DialogHeader>

        <motion.div
          variants={fadeVariants}
          initial="hidden"
          animate="visible"
          transition={{ type: "spring", stiffness: 100 }}
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="basic">{t('tabs.basic')}</TabsTrigger>
                  <TabsTrigger value="contact">{t('tabs.contact')}</TabsTrigger>
                  <TabsTrigger value="academic">{t('tabs.academic')}</TabsTrigger>
                  <TabsTrigger value="financial">{t('tabs.financial')}</TabsTrigger>
                  <TabsTrigger value="additional">{t('tabs.additional')}</TabsTrigger>
                </TabsList>

                {/* Basic Information */}
                <TabsContent value="basic" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>Personal Information</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="first_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter first name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="last_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter last name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="date_of_birth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date of Birth *</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="gender"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Gender *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select gender" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="male">Male</SelectItem>
                                  <SelectItem value="female">Female</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number *</FormLabel>
                              <FormControl>
                                <Input placeholder="+998901234567" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email (Optional)</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="student@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Contact Information */}
                <TabsContent value="contact" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>Parent/Guardian Information</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="parent_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Parent/Guardian Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter parent name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="parent_phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Parent Phone *</FormLabel>
                              <FormControl>
                                <Input placeholder="+998901234567" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="parent_email"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Parent Email (Optional)</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="parent@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4" />
                        <span>Address Information</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="address.street"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Street Address *</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter street address" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="address.city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City *</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter city" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="address.region"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Region *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select region" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {regionOptions.map((region) => (
                                    <SelectItem key={region} value={region}>
                                      {region}
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
                          name="address.postal_code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Postal Code</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter postal code" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="address.country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country *</FormLabel>
                              <FormControl>
                                <Input {...field} disabled />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Emergency Contact</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="emergency_contact.name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Emergency Contact Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter contact name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="emergency_contact.relationship"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Relationship *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select relationship" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {relationshipOptions.map((relationship) => (
                                    <SelectItem key={relationship} value={relationship}>
                                      {relationship}
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
                          name="emergency_contact.phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Emergency Contact Phone *</FormLabel>
                              <FormControl>
                                <Input placeholder="+998901234567" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="emergency_contact.email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Emergency Contact Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="emergency@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Academic Information */}
                <TabsContent value="academic" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>Enrollment Details</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="enrollment_date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Enrollment Date *</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Status *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="inactive">Inactive</SelectItem>
                                  <SelectItem value="graduated">Graduated</SelectItem>
                                  <SelectItem value="suspended">Suspended</SelectItem>
                                  <SelectItem value="dropped">Dropped</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="current_level"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Level *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select level" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {levelOptions.map((level) => (
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
                          name="academic_year"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Academic Year</FormLabel>
                              <FormControl>
                                <Input placeholder="2024-2025" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="grade_level"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Grade Level</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter grade level (if applicable)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Preferred Subjects *</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {subjectOptions.map((subject) => (
                          <div key={subject} className="flex items-center space-x-2">
                            <Checkbox
                              id={subject}
                              checked={selectedSubjects.includes(subject)}
                              onCheckedChange={() => handleSubjectToggle(subject)}
                            />
                            <label
                              htmlFor={subject}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {subject}
                            </label>
                          </div>
                        ))}
                      </div>
                      {selectedSubjects.length === 0 && (
                        <p className="text-sm text-destructive mt-2">
                          Please select at least one preferred subject.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Financial Information */}
                <TabsContent value="financial" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4" />
                        <span>Payment Information</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="payment_status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Payment Status *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select payment status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="paid">Paid</SelectItem>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="overdue">Overdue</SelectItem>
                                  <SelectItem value="partial">Partial</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="tuition_fee"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tuition Fee (UZS)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="500000" 
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="balance"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Outstanding Balance (UZS)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0" 
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Additional Information */}
                <TabsContent value="additional" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>Additional Information</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="medical_notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Medical Notes</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Any medical conditions, allergies, or special requirements..."
                                className="min-h-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>General Notes</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Any additional notes about the student..."
                                className="min-h-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-2 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || selectedSubjects.length === 0}
                  className="min-w-[120px]"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  {student ? 'Update Student' : 'Create Student'}
                </Button>
              </div>
            </form>
          </Form>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}