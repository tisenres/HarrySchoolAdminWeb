'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Search,
  Filter,
  X,
  Calendar as CalendarIcon,
  ChevronDown,
  RotateCcw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GroupFilters } from '@/types/group'
import { 
  GROUP_SUBJECTS, 
  GROUP_LEVELS, 
  GROUP_STATUSES 
} from '@/lib/validations/group'
import { teacherService } from '@/lib/services/teacher-service'
import { format } from 'date-fns'

interface GroupsFiltersProps {
  filters: GroupFilters
  onFiltersChange: (filters: GroupFilters) => void
  onReset: () => void
  className?: string
}

export function GroupsFilters({
  filters,
  onFiltersChange,
  onReset,
  className
}: GroupsFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([])

  // Load teachers for filter dropdown
  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const response = await teacherService.getAll({}, undefined, 1, 100)
        setTeachers(response.data.map(t => ({
          id: t.id,
          name: t.full_name
        })))
      } catch (error) {
        console.error('Failed to load teachers:', error)
      }
    }
    loadTeachers()
  }, [])

  const handleFilterChange = (key: keyof GroupFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const handleMultiSelectChange = (key: keyof GroupFilters, value: string) => {
    const currentValues = (filters[key] as string[]) || []
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value]
    
    handleFilterChange(key, newValues.length > 0 ? newValues : undefined)
  }

  const removeFilter = (key: keyof GroupFilters, value?: string) => {
    if (value && Array.isArray(filters[key])) {
      const currentValues = filters[key] as string[]
      const newValues = currentValues.filter(v => v !== value)
      handleFilterChange(key, newValues.length > 0 ? newValues : undefined)
    } else {
      handleFilterChange(key, undefined)
    }
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.search) count++
    if (filters.subject?.length) count++
    if (filters.level?.length) count++
    if (filters.status?.length) count++
    if (filters.teacher_id?.length) count++
    if (filters.start_date_from) count++
    if (filters.start_date_to) count++
    if (filters.has_capacity !== undefined) count++
    if (filters.is_active !== undefined) count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Filters</CardTitle>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="h-8 text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8"
            >
              <Filter className="h-4 w-4 mr-2" />
              {isExpanded ? 'Less' : 'More'}
              <ChevronDown className={cn(
                'h-4 w-4 ml-1 transition-transform',
                isExpanded && 'rotate-180'
              )} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search groups by name, code, subject..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
            className="pl-10"
          />
        </div>

        {/* Quick Filters Row */}
        <div className="flex flex-wrap gap-2">
          <Select
            value={filters.subject?.[0] || ''}
            onValueChange={(value) => 
              handleFilterChange('subject', value ? [value] : undefined)
            }
          >
            <SelectTrigger className="w-auto">
              <SelectValue placeholder="Subject" />
            </SelectTrigger>
            <SelectContent>
              {GROUP_SUBJECTS.map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.level?.[0] || ''}
            onValueChange={(value) => 
              handleFilterChange('level', value ? [value] : undefined)
            }
          >
            <SelectTrigger className="w-auto">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              {GROUP_LEVELS.map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.status?.[0] || ''}
            onValueChange={(value) => 
              handleFilterChange('status', value ? [value] : undefined)
            }
          >
            <SelectTrigger className="w-auto">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {GROUP_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {filters.search && (
              <Badge variant="secondary" className="gap-1">
                Search: {filters.search}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 w-4"
                  onClick={() => removeFilter('search')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            
            {filters.subject?.map((subject) => (
              <Badge key={subject} variant="secondary" className="gap-1">
                Subject: {subject}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 w-4"
                  onClick={() => removeFilter('subject', subject)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}

            {filters.level?.map((level) => (
              <Badge key={level} variant="secondary" className="gap-1">
                Level: {level}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 w-4"
                  onClick={() => removeFilter('level', level)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}

            {filters.status?.map((status) => (
              <Badge key={status} variant="secondary" className="gap-1">
                Status: {status}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 w-4"
                  onClick={() => removeFilter('status', status)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}

            {filters.has_capacity !== undefined && (
              <Badge variant="secondary" className="gap-1">
                {filters.has_capacity ? 'Has Capacity' : 'Full Groups'}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 w-4"
                  onClick={() => removeFilter('has_capacity')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}

            {filters.is_active !== undefined && (
              <Badge variant="secondary" className="gap-1">
                {filters.is_active ? 'Active Only' : 'Include Inactive'}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 w-4"
                  onClick={() => removeFilter('is_active')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>
        )}

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t">
            {/* Multi-select filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Multiple Subjects */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Subjects</Label>
                <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                  {GROUP_SUBJECTS.map((subject) => (
                    <Button
                      key={subject}
                      variant={filters.subject?.includes(subject) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleMultiSelectChange('subject', subject)}
                      className="text-xs h-7"
                    >
                      {subject}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Multiple Levels */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Levels</Label>
                <div className="flex flex-wrap gap-1">
                  {GROUP_LEVELS.map((level) => (
                    <Button
                      key={level}
                      variant={filters.level?.includes(level) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleMultiSelectChange('level', level)}
                      className="text-xs h-7"
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Teacher Selection */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Teachers</Label>
              <Select
                value=""
                onValueChange={(value) => handleMultiSelectChange('teacher_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select teachers..." />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filters.teacher_id?.length && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {filters.teacher_id.map((teacherId) => {
                    const teacher = teachers.find(t => t.id === teacherId)
                    return teacher ? (
                      <Badge key={teacherId} variant="secondary" className="gap-1">
                        {teacher.name}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 w-4"
                          onClick={() => removeFilter('teacher_id', teacherId)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ) : null
                  })}
                </div>
              )}
            </div>

            {/* Date Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Start Date From</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !filters.start_date_from && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.start_date_from 
                        ? format(filters.start_date_from, 'PPP')
                        : 'Pick a date'
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.start_date_from}
                      onSelect={(date) => handleFilterChange('start_date_from', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Start Date To</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !filters.start_date_to && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.start_date_to 
                        ? format(filters.start_date_to, 'PPP')
                        : 'Pick a date'
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.start_date_to}
                      onSelect={(date) => handleFilterChange('start_date_to', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Toggle Filters */}
            <div className="flex gap-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="has-capacity"
                  checked={filters.has_capacity === true}
                  onCheckedChange={(checked) => 
                    handleFilterChange('has_capacity', checked ? true : undefined)
                  }
                />
                <Label htmlFor="has-capacity" className="text-sm">
                  Has available capacity
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active-only"
                  checked={filters.is_active === true}
                  onCheckedChange={(checked) => 
                    handleFilterChange('is_active', checked ? true : undefined)
                  }
                />
                <Label htmlFor="active-only" className="text-sm">
                  Active groups only
                </Label>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}