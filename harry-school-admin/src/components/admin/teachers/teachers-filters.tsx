'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, X, Calendar, Users, Briefcase, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import type { TeacherFilters } from '@/types/teacher'
import {
  staggerContainer,
  staggerItem,
} from '@/lib/animations'

interface TeachersFiltersProps {
  filters: TeacherFilters
  onFiltersChange: (filters: TeacherFilters) => void
  availableSpecializations: string[]
  loading?: boolean
  totalCount?: number
}

export function TeachersFilters({
  filters,
  onFiltersChange,
  availableSpecializations,
  loading = false,
  totalCount = 0,
}: TeachersFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search || '')
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)

  // Debounced search
  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value)
    
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    const timeout = setTimeout(() => {
      const trimmedValue = value.trim()
      const updatedFilters = { ...filters }
      if (trimmedValue) {
        updatedFilters.search = trimmedValue
      } else {
        delete updatedFilters.search
      }
      onFiltersChange(updatedFilters)
    }, 300)

    setSearchTimeout(timeout)
  }, [filters, onFiltersChange, searchTimeout])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }, [searchTimeout])

  const handleEmploymentStatusChange = useCallback((status: string, checked: boolean) => {
    const currentStatuses = filters.employment_status || []
    const newStatuses = checked
      ? [...currentStatuses, status]
      : currentStatuses.filter(s => s !== status)
    
    const updatedFilters = { ...filters }
    if (newStatuses.length > 0) {
      updatedFilters.employment_status = newStatuses
    } else {
      delete updatedFilters.employment_status
    }
    onFiltersChange(updatedFilters)
  }, [filters, onFiltersChange])

  const handleSpecializationChange = useCallback((specialization: string, checked: boolean) => {
    const currentSpecs = filters.specializations || []
    const newSpecs = checked
      ? [...currentSpecs, specialization]
      : currentSpecs.filter(s => s !== specialization)
    
    const updatedFilters = { ...filters }
    if (newSpecs.length > 0) {
      updatedFilters.specializations = newSpecs
    } else {
      delete updatedFilters.specializations
    }
    onFiltersChange(updatedFilters)
  }, [filters, onFiltersChange])

  const handleContractTypeChange = useCallback((type: string, checked: boolean) => {
    const currentTypes = filters.contract_type || []
    const newTypes = checked
      ? [...currentTypes, type]
      : currentTypes.filter(t => t !== type)
    
    const updatedFilters = { ...filters }
    if (newTypes.length > 0) {
      updatedFilters.contract_type = newTypes
    } else {
      delete updatedFilters.contract_type
    }
    onFiltersChange(updatedFilters)
  }, [filters, onFiltersChange])

  const handleActiveStatusChange = useCallback((value: string) => {
    const updatedFilters = { ...filters }
    if (value === 'active') {
      updatedFilters.is_active = true
    } else if (value === 'inactive') {
      updatedFilters.is_active = false
    } else {
      delete updatedFilters.is_active
    }
    onFiltersChange(updatedFilters)
  }, [filters, onFiltersChange])

  const handleDateRangeChange = useCallback((field: 'hire_date_from' | 'hire_date_to', date: Date | undefined) => {
    const updatedFilters = { ...filters }
    if (date) {
      updatedFilters[field] = date
    } else {
      delete updatedFilters[field]
    }
    onFiltersChange(updatedFilters)
  }, [filters, onFiltersChange])

  const clearAllFilters = useCallback(() => {
    setSearchValue('')
    onFiltersChange({})
  }, [onFiltersChange])

  const removeFilter = useCallback((filterType: string, value?: string) => {
    const newFilters = { ...filters }

    switch (filterType) {
      case 'search':
        setSearchValue('')
        delete newFilters.search
        break
      case 'employment_status':
        if (value && newFilters.employment_status) {
          const filteredStatuses = newFilters.employment_status.filter(s => s !== value)
          if (filteredStatuses.length > 0) {
            newFilters.employment_status = filteredStatuses
          } else {
            delete newFilters.employment_status
          }
        }
        break
      case 'specializations':
        if (value && newFilters.specializations) {
          const filteredSpecs = newFilters.specializations.filter(s => s !== value)
          if (filteredSpecs.length > 0) {
            newFilters.specializations = filteredSpecs
          } else {
            delete newFilters.specializations
          }
        }
        break
      case 'contract_type':
        if (value && newFilters.contract_type) {
          const filteredTypes = newFilters.contract_type.filter(t => t !== value)
          if (filteredTypes.length > 0) {
            newFilters.contract_type = filteredTypes
          } else {
            delete newFilters.contract_type
          }
        }
        break
      case 'is_active':
        delete newFilters.is_active
        break
      case 'hire_date_from':
        delete newFilters.hire_date_from
        break
      case 'hire_date_to':
        delete newFilters.hire_date_to
        break
    }

    onFiltersChange(newFilters)
  }, [filters, onFiltersChange])

  const getActiveFilterCount = useMemo(() => {
    let count = 0
    if (filters.search) count++
    if (filters.employment_status?.length) count++
    if (filters.specializations?.length) count++
    if (filters.contract_type?.length) count++
    if (filters.is_active !== undefined) count++
    if (filters.hire_date_from) count++
    if (filters.hire_date_to) count++
    return count
  }, [filters])

  const employmentStatuses = [
    { value: 'active', label: 'Active', icon: Users },
    { value: 'inactive', label: 'Inactive', icon: Users },
    { value: 'on_leave', label: 'On Leave', icon: Calendar },
    { value: 'terminated', label: 'Terminated', icon: X },
  ]

  const contractTypes = [
    { value: 'full_time', label: 'Full Time', icon: Briefcase },
    { value: 'part_time', label: 'Part Time', icon: Briefcase },
    { value: 'contract', label: 'Contract', icon: Briefcase },
    { value: 'substitute', label: 'Substitute', icon: Briefcase },
  ]

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date)
  }

  return (
    <motion.div 
      className="space-y-4"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {/* Main Filter Row */}
      <motion.div 
        className="flex flex-col lg:flex-row gap-4"
        variants={staggerContainer}
      >
        {/* Search */}
        <motion.div 
          className="relative flex-1 min-w-0"
          variants={staggerItem}
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search teachers by name, email, phone, or ID..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
            disabled={loading}
          />
          {loading && searchValue && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            </div>
          )}
        </motion.div>

        {/* Quick Status Filter */}
        <Select 
          value={
            filters.is_active === true ? 'active' : 
            filters.is_active === false ? 'inactive' : 'all'
          }
          onValueChange={handleActiveStatusChange}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="inactive">Inactive Only</SelectItem>
          </SelectContent>
        </Select>

        {/* Advanced Filters */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Advanced
              {getActiveFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                  {getActiveFilterCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-72" align="end">
            <DropdownMenuLabel className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Employment Status
            </DropdownMenuLabel>
            <div className="px-2 pb-2 space-y-1">
              {employmentStatuses.map((status) => (
                <div key={status.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status.value}`}
                    checked={filters.employment_status?.includes(status.value) || false}
                    onCheckedChange={(checked) => 
                      handleEmploymentStatusChange(status.value, checked as boolean)
                    }
                  />
                  <label 
                    htmlFor={`status-${status.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                  >
                    <status.icon className="h-3 w-3" />
                    {status.label}
                  </label>
                </div>
              ))}
            </div>
            
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Contract Type
            </DropdownMenuLabel>
            <div className="px-2 pb-2 space-y-1">
              {contractTypes.map((type) => (
                <div key={type.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`contract-${type.value}`}
                    checked={filters.contract_type?.includes(type.value) || false}
                    onCheckedChange={(checked) => 
                      handleContractTypeChange(type.value, checked as boolean)
                    }
                  />
                  <label 
                    htmlFor={`contract-${type.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                  >
                    <type.icon className="h-3 w-3" />
                    {type.label}
                  </label>
                </div>
              ))}
            </div>

            {availableSpecializations.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Specializations
                </DropdownMenuLabel>
                <div className="px-2 pb-2 space-y-1 max-h-40 overflow-y-auto">
                  {availableSpecializations.map((spec) => (
                    <div key={spec} className="flex items-center space-x-2">
                      <Checkbox
                        id={`spec-${spec}`}
                        checked={filters.specializations?.includes(spec) || false}
                        onCheckedChange={(checked) => 
                          handleSpecializationChange(spec, checked as boolean)
                        }
                      />
                      <label 
                        htmlFor={`spec-${spec}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {spec}
                      </label>
                    </div>
                  ))}
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Date Range Filter */}
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className={cn(
                  "gap-2 w-40 justify-start text-left font-normal",
                  !filters.hire_date_from && "text-muted-foreground"
                )}
              >
                <Calendar className="h-4 w-4" />
                {filters.hire_date_from ? formatDate(filters.hire_date_from) : "Start Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={filters.hire_date_from}
                onSelect={(date) => handleDateRangeChange('hire_date_from', date)}
                disabled={(date) =>
                  date > new Date() || (!!filters.hire_date_to && date > filters.hire_date_to)
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className={cn(
                  "gap-2 w-40 justify-start text-left font-normal",
                  !filters.hire_date_to && "text-muted-foreground"
                )}
              >
                <Calendar className="h-4 w-4" />
                {filters.hire_date_to ? formatDate(filters.hire_date_to) : "End Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={filters.hire_date_to}
                onSelect={(date) => handleDateRangeChange('hire_date_to', date)}
                disabled={(date) =>
                  date > new Date() || (!!filters.hire_date_from && date < filters.hire_date_from)
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Clear Filters */}
        {getActiveFilterCount > 0 && (
          <Button variant="ghost" onClick={clearAllFilters} className="gap-2 shrink-0">
            <X className="h-4 w-4" />
            Clear All
          </Button>
        )}
      </motion.div>

      {/* Active Filters Display */}
      {getActiveFilterCount > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Active Filters {totalCount > 0 && `(${totalCount} results)`}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.search && (
              <Badge variant="outline" className="gap-1">
                Search: "{filters.search}"
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1 hover:bg-transparent"
                  onClick={() => removeFilter('search')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}

            {filters.employment_status?.map((status) => (
              <Badge key={status} variant="outline" className="gap-1">
                Status: {status.replace('_', ' ')}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1 hover:bg-transparent"
                  onClick={() => removeFilter('employment_status', status)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}

            {filters.contract_type?.map((type) => (
              <Badge key={type} variant="outline" className="gap-1">
                Contract: {type.replace('_', ' ')}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1 hover:bg-transparent"
                  onClick={() => removeFilter('contract_type', type)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}

            {filters.specializations?.map((spec) => (
              <Badge key={spec} variant="outline" className="gap-1">
                Subject: {spec}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1 hover:bg-transparent"
                  onClick={() => removeFilter('specializations', spec)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}

            {filters.is_active !== undefined && (
              <Badge variant="outline" className="gap-1">
                Status: {filters.is_active ? 'Active Only' : 'Inactive Only'}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1 hover:bg-transparent"
                  onClick={() => removeFilter('is_active')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}

            {filters.hire_date_from && (
              <Badge variant="outline" className="gap-1">
                From: {formatDate(filters.hire_date_from)}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1 hover:bg-transparent"
                  onClick={() => removeFilter('hire_date_from')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}

            {filters.hire_date_to && (
              <Badge variant="outline" className="gap-1">
                To: {formatDate(filters.hire_date_to)}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1 hover:bg-transparent"
                  onClick={() => removeFilter('hire_date_to')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>
        </div>
      )}
    </motion.div>
  )
}