'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import { 
  Search, 
  Filter, 
  X, 
  Calendar as CalendarIcon,
  CreditCard,
  GraduationCap,
  User
} from 'lucide-react'
import type { StudentFilters } from '@/types/student'
import { fadeVariants } from '@/lib/animations'
import { ClientOnly } from '@/components/ui/client-only'

export interface StudentsFiltersProps {
  filters: StudentFilters
  onFiltersChange: (filters: StudentFilters) => void
  onClearFilters: () => void
  loading?: boolean
}

const statusOptions = [
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
  { value: 'inactive', label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
  { value: 'graduated', label: 'Graduated', color: 'bg-blue-100 text-blue-800' },
  { value: 'suspended', label: 'Suspended', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'dropped', label: 'Dropped', color: 'bg-red-100 text-red-800' },
]

const paymentStatusOptions = [
  { value: 'paid', label: 'Paid', color: 'bg-green-100 text-green-800' },
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'overdue', label: 'Overdue', color: 'bg-red-100 text-red-800' },
  { value: 'partial', label: 'Partial', color: 'bg-orange-100 text-orange-800' },
]

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

export function StudentsFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  loading = false,
}: StudentsFiltersProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [localFilters, setLocalFilters] = useState<StudentFilters>(filters)

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const handleFilterChange = <K extends keyof StudentFilters>(
    key: K,
    value: StudentFilters[K]
  ) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleMultiSelectChange = <K extends keyof StudentFilters>(
    key: K,
    value: string,
    checked: boolean
  ) => {
    const currentArray = (localFilters[key] as string[]) || []
    const newArray = checked 
      ? [...currentArray, value]
      : currentArray.filter(item => item !== value)
    
    handleFilterChange(key, newArray as StudentFilters[K])
  }

  const handleDateChange = (key: 'enrollment_date_from' | 'enrollment_date_to', date: Date | undefined) => {
    handleFilterChange(key, date)
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (filters.search) count++
    if (filters.status?.length) count++
    if (filters.payment_status?.length) count++
    if (filters.current_level?.length) count++
    if (filters.preferred_subjects?.length) count++
    if (filters.enrollment_date_from) count++
    if (filters.enrollment_date_to) count++
    if (filters.age_from) count++
    if (filters.age_to) count++
    if (filters.has_balance) count++
    if (filters.is_active !== undefined) count++
    return count
  }

  const activeFilterCount = getActiveFilterCount()

  const renderFilterBadges = () => {
    const badges = []

    if (filters.search) {
      badges.push(
        <Badge key="search" variant="secondary" className="text-xs">
          Search: {filters.search}
          <X 
            className="h-3 w-3 ml-1 cursor-pointer" 
            onClick={() => handleFilterChange('search', undefined)}
          />
        </Badge>
      )
    }

    if (filters.status?.length) {
      badges.push(
        <Badge key="status" variant="secondary" className="text-xs">
          Status: {filters.status.length}
          <X 
            className="h-3 w-3 ml-1 cursor-pointer" 
            onClick={() => handleFilterChange('status', undefined)}
          />
        </Badge>
      )
    }

    if (filters.payment_status?.length) {
      badges.push(
        <Badge key="payment" variant="secondary" className="text-xs">
          Payment: {filters.payment_status.length}
          <X 
            className="h-3 w-3 ml-1 cursor-pointer" 
            onClick={() => handleFilterChange('payment_status', undefined)}
          />
        </Badge>
      )
    }

    if (filters.current_level?.length) {
      badges.push(
        <Badge key="level" variant="secondary" className="text-xs">
          Level: {filters.current_level.length}
          <X 
            className="h-3 w-3 ml-1 cursor-pointer" 
            onClick={() => handleFilterChange('current_level', undefined)}
          />
        </Badge>
      )
    }

    return badges
  }

  return (
    <motion.div
      variants={fadeVariants}
      initial="hidden"
      animate="visible"
      transition={{ type: "spring", stiffness: 100 }}
    >
      <Card className="p-4 space-y-4">
        {/* Search and Quick Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search students, parents, phone numbers..."
                value={localFilters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="whitespace-nowrap"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>

            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Filter Badges */}
        <AnimatePresence>
          {activeFilterCount > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2"
            >
              {renderFilterBadges()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showAdvancedFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t"
            >
              {/* Status Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Status
                </Label>
                <div className="space-y-2">
                  {statusOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${option.value}`}
                        checked={localFilters.status?.includes(option.value) || false}
                        onCheckedChange={(checked) => 
                          handleMultiSelectChange('status', option.value, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={`status-${option.value}`}
                        className="text-sm cursor-pointer flex items-center"
                      >
                        <Badge className={`text-xs mr-2 ${option.color}`}>
                          {option.label}
                        </Badge>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Status Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Payment Status
                </Label>
                <div className="space-y-2">
                  {paymentStatusOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`payment-${option.value}`}
                        checked={localFilters.payment_status?.includes(option.value) || false}
                        onCheckedChange={(checked) => 
                          handleMultiSelectChange('payment_status', option.value, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={`payment-${option.value}`}
                        className="text-sm cursor-pointer flex items-center"
                      >
                        <Badge className={`text-xs mr-2 ${option.color}`}>
                          {option.label}
                        </Badge>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Level Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Current Level
                </Label>
                <Select
                  value={localFilters.current_level?.[0] || ''}
                  onValueChange={(value) => 
                    handleFilterChange('current_level', value ? [value] : undefined)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All levels</SelectItem>
                    {levelOptions.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subjects Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Preferred Subjects</Label>
                <Select
                  value={localFilters.preferred_subjects?.[0] || ''}
                  onValueChange={(value) => 
                    handleFilterChange('preferred_subjects', value ? [value] : undefined)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All subjects</SelectItem>
                    {subjectOptions.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Age Range */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Age Range</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    min={5}
                    max={25}
                    value={localFilters.age_from || ''}
                    onChange={(e) => 
                      handleFilterChange('age_from', e.target.value ? parseInt(e.target.value) : undefined)
                    }
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">to</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    min={5}
                    max={25}
                    value={localFilters.age_to || ''}
                    onChange={(e) => 
                      handleFilterChange('age_to', e.target.value ? parseInt(e.target.value) : undefined)
                    }
                    className="w-20"
                  />
                </div>
              </div>

              {/* Enrollment Date */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Enrollment Date
                </Label>
                <div className="flex items-center space-x-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="justify-start text-left font-normal w-32"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        <ClientOnly fallback="From">
                          {localFilters.enrollment_date_from 
                            ? localFilters.enrollment_date_from.toLocaleDateString()
                            : 'From'
                          }
                        </ClientOnly>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={localFilters.enrollment_date_from}
                        onSelect={(date) => handleDateChange('enrollment_date_from', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <span className="text-sm text-muted-foreground">to</span>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="justify-start text-left font-normal w-32"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        <ClientOnly fallback="To">
                          {localFilters.enrollment_date_to 
                            ? localFilters.enrollment_date_to.toLocaleDateString()
                            : 'To'
                          }
                        </ClientOnly>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={localFilters.enrollment_date_to}
                        onSelect={(date) => handleDateChange('enrollment_date_to', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Special Filters */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Special Filters</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="has-balance"
                      checked={localFilters.has_balance || false}
                      onCheckedChange={(checked) => 
                        handleFilterChange('has_balance', checked as boolean | undefined)
                      }
                    />
                    <label htmlFor="has-balance" className="text-sm cursor-pointer">
                      Has outstanding balance
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is-active"
                      checked={localFilters.is_active !== undefined ? localFilters.is_active : false}
                      onCheckedChange={(checked) => 
                        handleFilterChange('is_active', checked ? true : undefined)
                      }
                    />
                    <label htmlFor="is-active" className="text-sm cursor-pointer">
                      Active students only
                    </label>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}